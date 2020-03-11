let querystring = require("querystring");
const axios = require("axios");

const Database = use("Database");
const User = use("App/Models/User");
const Music = use("App/Models/Music");
const Group = use("App/Models/Group");

const Env = use("Env");

let client_id = Env.get("CLIENT_ID"); // Your client id
let client_secret = Env.get("CLIENT_SECRET"); // Your secret
let redirect_uri = Env.get("REDIRECT_URI"); // Your redirect uri

var SpotifyWebApi = require("spotify-web-api-node");

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

let generateRandomString = function (length) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

let stateKey = "spotify_auth_state";

class AuthController {
  async login({ request, response, auth, session }) {
    let state = generateRandomString(16);
    session.put(stateKey, state);

    // your application requests authorization
    let scope =
      "playlist-modify-public playlist-modify-private user-top-read user-read-private user-read-email user-library-read user-read-recently-played ";

    response.redirect(
      "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      })
    );
  }

  async callback({ request, response, auth, session }) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    let code = request.qs.code || null;
    let state = request.qs.state || null;
    let storedState = session.get(stateKey);

    if (state === null || state !== storedState) {
      response.redirect(
        "/#" +
        querystring.stringify({
          error: "state_mismatch"
        })
      );
    } else {
      let authOptions = {
        url: "https://accounts.spotify.com/api/token",
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: "authorization_code"
        },
        headers: {
          Authorization:
            "Basic " +
            new Buffer(client_id + ":" + client_secret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        json: true
      };

      try {
        let res = await axios({
          method: "post",
          url: "https://accounts.spotify.com/api/token",
          params: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code"
          },
          headers: {
            Authorization:
              "Basic " +
              new Buffer(client_id + ":" + client_secret).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
          }
        });

        const { access_token, refresh_token } = res.data;

        //USER/ME
        //GRAVAR USUARIO NO DATABASE

        let me = await axios
          .get("https://api.spotify.com/v1/me", {
            headers: { Authorization: "Bearer " + access_token }
          })
          .then(result => result.data);

        let user = await User.findBy("id_spotify", me.id);
        if (user === null) {
          user = new User();

          user.id_spotify = me.id;

          me.display_name ? (user.display_name = me.display_name) : "";

          me.external_urls.spotify
            ? (user.external_urls = me.external_urls.spotify)
            : "";

          me.images[0].url ? (user.image = me.images[0].url) : "";

          await user.save();
        }

        //gravar token
        let userToken = await user.tokens().fetch();
        console.log(userToken);
        if (userToken) {
          await user.tokens().delete();
        }
        await user.tokens().create({ token: access_token, type: "login" });

        console.log("USER -------------------------AQUI");
        console.log(user);

        //PESQUISA TOP ARTIST
        let topArtist = await axios
          .get("https://api.spotify.com/v1/me/top/artists?limit=1", {
            headers: { Authorization: "Bearer " + access_token }
          })
          .then(result => result.data.items[0].id);

        console.log(topArtist);
        //RECOMENDA 50 MUSICAS
        let recoMusic = await axios
          .get(
            "https://api.spotify.com/v1/recommendations?limit=50&market=" +
            "BR&seed_artists=" +
            topArtist +
            "&min_energy=0.4&min_popularity=40",
            {
              headers: { Authorization: "Bearer " + access_token }
            }
          )
          .then(result => result.data);

        console.log(recoMusic);
        //APAGA TODAS AS MUSICAS E GRAVA AS 50 MUSICAS RECOMENDADAS
        await user.musics().delete();
        for (let trackItem of recoMusic.tracks) {
          console.log("1 - TRACKITEM");
          await user.musics().create({
            user_id_spotify: me.id,
            music_id_spotify: trackItem.id,
            music_name: trackItem.name,
            music_external_urls: trackItem.external_urls.spotify,
            music_uri: trackItem.uri,
            music_preview_url: trackItem.preview_url,
            music_image: trackItem.album.images[0].url,
            popularity: trackItem.popularity
          });
        }

        response.redirect(
          //"http://localhost:3000/colabbox?#" +
          "https://colabbox.herokuapp.com/colabbox?#" +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          })
        );
      } catch (error) {
        console.log(error);
        response.redirect(
          "/#" +
          querystring.stringify({
            error: "invalid_token"
          })
        );
      }
    }
  }
}

module.exports = AuthController;

"use strict";

const User = use("App/Models/User");
const Group = use("App/Models/Group");
const Playlist = use("App/Models/Playlist");
const Database = use("Database");
const Env = use("Env");
const axios = require("axios");

let client_id = Env.get("CLIENT_ID"); // Your client id
let client_secret = Env.get("CLIENT_SECRET"); // Your secret
let redirect_uri = Env.get("REDIRECT_URI"); // Your redirect uri

let SpotifyWebApi = require("spotify-web-api-node");
// credentials are optional
let spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with playlists
 */
class PlaylistController {
  /**
   * Show a list of all playlists.
   * GET playlists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {}

  /**
   * Render a form to be used for creating a new playlist.
   * GET playlists/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new playlist.
   * POST playlists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    try {
      const { id_group, token } = request.all();

      let validaToken = await Database.table("tokens as t")
        .innerJoin("users as u", "t.user_id", "u.id")
        .where("t.token", token);

      if (!validaToken || validaToken.length <= 0) {
        return response.status(401).send({
          message: "Token Inválido"
        });
      }

      let group = await Group.findBy("id", id_group);
      if (!group || group.length <= 0) {
        return response.status(401).send({
          message: "Não existe o grupo informado"
        });
      }

      let usersId = await Database.table("users as u")
        .select("u.id_spotify")
        .innerJoin("group_user as gu", "gu.user_id", "u.id")
        .where("gu.group_id", id_group);

      if (!usersId || usersId.length <= 0) {
        return response.status(401).send({
          message: "Não existe usuários para o grupo informado"
        });
      }

      let date = new Date();
      let playlistId;
      let playlistUrl;
      let userIdOwner;

      let resGroup = await axios
        .post(
          "https://api.spotify.com/v1/me/playlists",
          {
            name: `${group.name} ${date.getDate()}/${date.getMonth() +
              1}/${date.getFullYear()} ${date.toTimeString().split(" ")[0]}`,
            description: "Playlist criada com ColabBox",
            public: true
          },
          {
            headers: { Authorization: "Bearer " + token }
          }
        )
        .then(async response => {
          playlistId = response.data.id;
          playlistUrl = response.data.external_urls.spotify;
          userIdOwner = response.data.owner.id;

          group.merge({
            user_id: validaToken[0].user_id,
            name: group.name,
            playlist_id: playlistId,
            playlist_url: playlistUrl,
            playlist_owner: userIdOwner
          });

          await group.save();
          return group;
        })
        .catch(error => {
          console.log(error);
          return false;
        });

      if (!resGroup)
        return response.status(401).send({
          message: "Erro ao criar playlist no Spotify"
        });

      let idSpotifyArr = [];

      usersId.map(id => {
        idSpotifyArr.push(id.id_spotify);
      });
      console.log(idSpotifyArr);
      let mergeMusic = await Database.from("music")
        .whereIn("user_id_spotify", idSpotifyArr)
        .distinct(
          "music_id_spotify",
          "music_name",
          "music_external_urls",
          "music_preview_url",
          "music_image",
          "music_uri",
          "popularity"
        );

      mergeMusic.sort((a, b) => {
        if (a.popularity === b.popularity) {
          return 0;
        } else {
          return a.popularity < b.popularity ? 1 : -1;
        }
      });

      //RECOMENDA PLAYLIST
      let playlist = [];
      console.log("TOP 10");
      for (let index = 0; index < 10; index++) {
        playlist.push(mergeMusic[index]);
      }
      console.log(playlist.length);
      console.log("TOP MEIO");
      let meio = parseInt(mergeMusic.length / 2);
      meio = meio - 16;
      for (let index = meio; index < meio + 30; index++) {
        playlist.push(mergeMusic[index]);
      }
      console.log(playlist.length);

      console.log("TOP FIM");
      let fim = mergeMusic.length - 10;
      for (let index = fim; index < mergeMusic.length; index++) {
        playlist.push(mergeMusic[index]);
      }
      console.log(playlist);

      let trackUri = [];
      playlist.map(track => {
        trackUri.push(track.music_uri);
      });
      console.log(trackUri);
      await spotifyApi.setAccessToken(token);
      console.log(resGroup.playlist_id);
      let addTrackPlaylist = await spotifyApi
        .addTracksToPlaylist(resGroup.playlist_id, trackUri)
        .then(
          function(data) {
            console.log("Added tracks to playlist!");
            console.log(data);
            return true;
          },
          function(err) {
            console.log("Something went wrong!", err);
            return false;
          }
        );

      if (!addTrackPlaylist) {
        return response.status(401).send({
          message: "Não foi possivel adicionar músicas a playlist"
        });
      }
      await group.playlists().delete();
      playlist.map(async track => {
        trackUri.push(track.music_uri);
        let groupPlaylist = await group.playlists().create({
          group_id: group.id,
          music_id_spotify: track.music_id_spotify,
          music_name: track.music_name,
          music_external_urls: track.music_external_urls,
          music_uri: track.music_uri,
          music_preview_url: track.music_preview_url,
          music_image: track.music_image
        });
        console.log(groupPlaylist);
      });

      return response.status(201).send(trackUri);
      //category = await transform.item(category, Transformer)
    } catch (error) {
      console.log(error);
      return response.status(400).send({
        message: "Erro ao Criar Playlist"
      });
    }
  }

  /**
   * Display a single playlist.
   * GET playlists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {}

  /**
   * Render a form to update an existing playlist.
   * GET playlists/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update playlist details.
   * PUT or PATCH playlists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {}

  /**
   * Delete a playlist with id.
   * DELETE playlists/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {}
}

module.exports = PlaylistController;

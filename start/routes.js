"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/
let querystring = require("querystring");
/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

Route.on("/").render("welcome");
/* Route.get('/paulo', ({ response }) => {
  response.redirect('/?'+querystring.stringify({
    access_token: 'access_token',
    refresh_token: 'refresh_token'
  }))
}) */
Route.get("/login", "AuthController.login");
Route.get("/callback", "AuthController.callback");

Route.post("/creategroup", "GroupController.store");
Route.get("/group", "GroupController.index");
Route.post("/userGroups", "GroupController.userGroups");
Route.get("/group/:id", "GroupController.show");
Route.put("/group/:id", "GroupController.update");
Route.delete("/group/:id", "GroupController.destroy");

Route.post("/userEnterGroup", "GroupController.userEnterGroup");

Route.post("/createPlaylist", "PlaylistController.store");



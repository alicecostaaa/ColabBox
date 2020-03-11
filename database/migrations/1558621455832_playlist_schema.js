"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class PlaylistSchema extends Schema {
  up() {
    this.create("playlists", table => {
      table.increments();
      table.string("music_id_spotify");
      table.string("music_name");
      table.string("music_external_urls");
      table.string("music_uri");
      table.string("music_preview_url");
      table.string("music_image");

      table
        .integer("group_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("groups")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.timestamps();
    });
  }

  down() {
    this.drop("playlists");
  }
}

module.exports = PlaylistSchema;


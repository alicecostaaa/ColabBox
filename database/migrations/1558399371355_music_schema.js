"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class MusicSchema extends Schema {
  up() {
    this.create("music", table => {
      table.increments();

      table.integer("user_id").unsigned();
      table
        .foreign("user_id")
        .references("id")
        .inTable("users")
        .onDelete("cascade");

      table.string("user_id_spotify");
      table.string("music_id_spotify");
      table.string("music_name");
      table.string("music_external_urls");
      table.string("music_uri");
      table.string("music_preview_url");
      table.string("music_image");
      table.string("popularity");

      table.string("artist_id_spotify");

      //table.string("genre");

      table.timestamps();
    });
  }

  down() {
    this.drop("music");
  }
}

module.exports = MusicSchema;

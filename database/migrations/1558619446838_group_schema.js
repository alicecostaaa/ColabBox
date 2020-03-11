"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class GroupSchema extends Schema {
  up() {
    this.create("groups", table => {
      table.increments();
      table.string("name").notNullable();
      table.string("playlist_id");
      table.string("playlist_url");
      table.string("playlist_owner");
      table
        .integer("user_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.timestamps();
    });
  }

  down() {
    this.drop("groups");
  }
}

module.exports = GroupSchema;

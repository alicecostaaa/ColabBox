"use strict";

const User = use("App/Models/User");
const Group = use("App/Models/Group");
const Database = use("Database");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with groups
 */
class GroupController {
  /**
   * Show a list of all groups.
   * GET groups
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    console.log("index");
    const groups = await Group.all();
    return groups;
  }

  //RETORNA GRUPOS DO USUARIO
  async userGroups({ request, response, view }) {
    try {
      const { id_spotify } = request.all();
      console.log(id_spotify);
      let user = await User.findBy("id_spotify", id_spotify);

      if (user) {
        let groups = await user.groupJoin().fetch();

        return response.status(201).send(groups);
      }

      return response.status(201).send({
        message: "ID informado não existe"
      });
      //category = await transform.item(category, Transformer)
    } catch (error) {
      return response.status(400).send({
        message: "Erro consultar o Grupo!"
      });
    }
  }

  //ADICIONA USUARIO NO GRUPO
  async userEnterGroup({ request, response }) {
    try {
      const { id_group, id_spotify } = request.all();

      let user = await User.findBy("id_spotify", id_spotify);

      if (user) {
        let group = await Group.findBy("groups.id", id_group);
        console.log("group.id");
        console.log(group);
        if (group) {
          await user.groups().attach(group.id);

          return response.status(201).send(group);
        }

        return response.status(401).send({
          message: "Grupo informado não existe"
        });
      }

      return response.status(401).send({
        message: "id_spotify informado não existe"
      });
      //category = await transform.item(category, Transformer)
    } catch (error) {
      console.log(error);
      return response.status(400).send({
        message: "Erro ao criar Grupo!"
      });
    }
  }

  /**
   * Create/save a new group.
   * POST groups
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    try {
      const { name, token, id_spotify } = request.all();
      console.log(name);
      console.log(token);
      console.log(id_spotify);
      let user = await User.findBy("id_spotify", id_spotify);

      if (user) {
        let group = await user.groups().create({
          user_id: user.id,
          name: name
        });

        return response.status(201).send(group);
      }

      return response.status(401).send({
        message: "ID informado não existe"
      });
      //category = await transform.item(category, Transformer)
    } catch (error) {
      return response.status(400).send({
        message: "Erro ao criar Grupo!"
      });
    }
  }
  /**
   * Display a single group.
   * GET groups/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    try {
      let group = await Database.table("groups as g")
        .innerJoin("group_user as gu", "gu.group_id", "g.id")
        .innerJoin("users as u", "gu.user_id", "u.id")
        .where("g.id", params.id);
      //console.log(group);
      if (group) {
        return response.status(201).send(group);
      }

      return response.status(401).send({
        message: "Grupo informado não existe"
      });
      //category = await transform.item(category, Transformer)
    } catch (error) {
      console.log(error);
      return response.status(400).send({
        message: "Erro consultar Grupo!"
      });
    }
  }

  /**
   * Update group details.
   * PUT or PATCH groups/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    try {
      const { id_spotify } = request.all();
      const data = request.only([
        "name",
        "playlist_id",
        "playlist_url",
        "playlist_owner"
      ]);

      let user = await User.findBy("id_spotify", id_spotify);

      if (user) {
        let group = await user
          .groups()
          .where("groups.id", params.id)
          .first();

        if (group) {
          group.merge(data);

          await group.save();

          return response.status(201).send(group);
        }

        return response.status(401).send({
          message: "Não existe grupo para esse usuário"
        });
      }

      return response.status(401).send({
        message: "ID informado não existe"
      });
      //category = await transform.item(category, Transformer)
    } catch (error) {
      console.log(error);
      return response.status(400).send({
        message: "Erro ao atualizar Grupo!"
      });
    }
  }

  /**
   * Delete a group with id.
   * DELETE groups/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    try {
      const { id_spotify } = request.all();
      console.log(id_spotify);
      let user = await User.findBy("id_spotify", id_spotify);
      console.log(user);
      if (user) {
        console.log("entrou user");
        let group = await user
          .groups()
          .where("groups.id", params.id)
          .first();

        group.delete();

        return response.status(201).send({
          message: "Grupo excluido com sucesso"
        });
      }

      return response.status(401).send({
        message: "id_spotify informado não existe"
      });
      //category = await transform.item(category, Transformer)
    } catch (error) {
      console.log(error);
      return response.status(400).send({
        message: "Erro ao deletar o Grupo!"
      });
    }
  }
}

module.exports = GroupController;

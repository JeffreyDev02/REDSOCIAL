'use strict'

let express = require("express");
let api = express.Router();
let followrController = require("../controllers/seguimiento");
let md_auth = require("../middlewares/authenticated");


api.post("/registroFollow", md_auth.ensureAuth, followrController.saveFollow);
api.delete("/eliminarFollow/:id", md_auth.ensureAuth, followrController.deleteFollow);
api.get("/obtenerFollow/:id/:page?" ,md_auth.ensureAuth, followrController.getFollwingUser)
api.get("/obtenerFollowers/:id/:page?", md_auth.ensureAuth, followrController.getFollowersUser);
api.get("/obteneMisFollows/:follow?", md_auth.ensureAuth, followrController.getMyFollows);

module.exports = api;
let express = require("express");
let api = express.Router();
let mensajeController = require("../controllers/mensaje");
let md_auth = require("../middlewares/authenticated");

api.post("/crearMensaje" , md_auth.ensureAuth, mensajeController.saveMessage);
api.get("/mensajesRecibidos/:page?", md_auth.ensureAuth, mensajeController.getMessageReceiver); 
api.get("/mensajesEnviados/:page?", md_auth.ensureAuth, mensajeController.getMessageEmitter);
api.get("/mensajesPendientes", md_auth.ensureAuth, mensajeController.getUnviewedMessage);
api.put("/mensajesVistos", md_auth.ensureAuth, mensajeController.setUnviewedMessage);
api.get("/listarMensajes", md_auth.ensureAuth, mensajeController.nombreMenssages);

module.exports = api;

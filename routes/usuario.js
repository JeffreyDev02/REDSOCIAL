"use strict";

const express = require("express");
const userController = require("../controllers/usuario");
let md_auth = require("../middlewares/authenticated");
//let multiparty = require("connect-multiparty");
//let md_upload = multiparty({uploadDir: './upload/users'});

let multer = require("multer");
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./upload/users");
    },
    filename: function (req, file, cb){
        cb(null, file.fieldname + "-" + Date.now() + "." + file.originalname.split(".").pop());
    }
})

let md_upload = multer({storage: storage});

let api = express.Router();

api.post("/registro", userController.saveUser);
api.post("/login", userController.login);
api.get("/usuario/:id", md_auth.ensureAuth, userController.getUser);
api.get("/usuarios/:page?", md_auth.ensureAuth, userController.getUsers);
api.get("/getCounters/:id?", md_auth.ensureAuth, userController.counterFollow);
api.put("/editarUsuario/:id", md_auth.ensureAuth, userController.updateUSer);
api.put("/subirImage/:id", [md_auth.ensureAuth, md_upload.single("images")], userController.uploadImage );
api.get("/obteneImagen/:imageFile",  md_upload.single("images"), userController.getImageFile);

module.exports = api;
'use strict'
let express = require("express");
let api = express.Router();

let publicationController = require("../controllers/publicacion")
let md_auth = require("../middlewares/authenticated");

let multer = require("multer");
let storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./upload/publications/");
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + "-" + Date.now() + "." + file.originalname.split(".").pop());
    }
})

let md_upload = multer({ storage: storage });


api.post("/guardarPublicacion", md_auth.ensureAuth, publicationController.savePublication);
api.get("/obtenerPublications/:page?", md_auth.ensureAuth, publicationController.getPublications);
api.get("/obtenerPublication/:id", md_auth.ensureAuth, publicationController.getPublicationId);
api.delete("/eliminarPublication/:id", md_auth.ensureAuth, publicationController.deletePublication);
api.put("/uploadImagePublication/:id", [md_auth.ensureAuth ,md_upload.single("image")], publicationController.uploadImage);
api.get("/obtenerPublicacionUser/:id/:page?", md_auth.ensureAuth, publicationController.getPublicationsUser );
api.get("/obtenerImagePublicacion/:imageFile",  md_upload.single("image"), publicationController.getImageFile);

module.exports = api;
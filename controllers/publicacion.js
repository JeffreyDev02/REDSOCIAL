'use strict'
let path = require("path");
let fs = require("fs");
let moment = require("moment");
let mongoose_pagination = require("mongoose-pagination");

let publicationModel = require("../models/publicacion");
let userModel = require("../models/usuario");
let followModel = require("../models/seguimiento");
const usuario = require("../models/usuario");

function savePublication(req, res) {
    let params = req.body;
    let publication = new publicationModel();

    if (!params.text) {
        return res.status(200).send({ message: "debes enviar un texto" });
    } else {
        publication.text = params.text;
        publication.file = null,
            publication.usuario = req.user.sub;
        publication.create_at = moment().unix();

        publication.save()
            .then(publicationStored => {
                if (!publicationStored) return res.status(404).send({ message: "No se encontraron publicaciones" });
                return res.status(200).send({ publicationStored })
            })
            .catch(err => {
                return res.status(500).send({ message: "Error en la peticion" })
            })
    }

}

function getPublications(req, res) {
    let total;
    let page;
    let itemPerPage = 5;

    req.params.page ? page = req.params.page : page = 1;

    followModel.find({ usuario: req.user.sub }).populate({ path: "siguiendo" })
        .then(follow => {
            let followed_array = []
            follow.forEach(element => {
                followed_array.push(element.siguiendo);
            });
            followed_array.push(req.user.sub);

            getCountersPublications(followed_array)
            .then(totalPublication=>{
                 total = totalPublication;
            })
            .catch(err => {
                return res.status(500).send({message: "Error en la peticion de contar publicacion " + err})
            })

            publicationModel.find({ usuario: { "$in": followed_array } }).sort("-create_at").populate("usuario").paginate(page, itemPerPage)
                .then(publications => {
                    if (!publications) return res.status(200).send({ message: "no existe publicaciones" });

                    return res.status(200).send({
                        publications,
                        page,
                        itemPerPage,
                        total: total,
                        totalPage : Math.ceil( total/itemPerPage )
                    })
                })
                .catch(err => {
                    return res.status(500).send({ message: "Error en la peticion publication" })
                })

        })
        .catch(err => {
            res.status(500).send({ message: "Error en la peticion getPublications" })
        })
}

let getPublicationsUser = (req, res)=>{
    let iduser = req.params.id;
    let page = 1
    let itemPerPage = 5;
    let total;
    if(req.params.page){
        page = req.params.page;
    }
    
    getCountersPublications([iduser]).then(couter=>{
        total = couter;
    })

    publicationModel.find({usuario: iduser}).sort("-create_at").paginate(page, itemPerPage)
    .then(publications=>{
        return res.status(200).send({publicaciones: publications, page:page, items: itemPerPage, total:total, totalPage: Math.ceil(total/itemPerPage)});
    })
    .catch(err=> {
        return res.status(500).send({message: "Error en la peticion " + err })
    })
    
}

let getCountersPublications = async (array)=>{
    let couterPublication = await publicationModel.countDocuments({usuario: {"$in": array}})
    .then(res => {return res})
    .catch(err => {return err})

    return couterPublication;

}

function getPublicationId(req, res) {
    let idpublication = req.params.id;

    publicationModel.findById(idpublication)
        .then(publication => {
            if (!publication) return res.status(404).send({ message: "No se encuentra la publicacion" });
            return res.status(200).send({ publication })
        })
        .catch(err => {
            return res.status(500).send({ message: "Error en la peticion de encontrar la publicacion " + err });
        })

}

async function deletePublication  (req, res) {
    let idpublication = req.params.id;
    
    
    await publicationModel.find({"usuario": req.user.sub, "_id": idpublication })
        .then(imageFind=>{
            let image_path = './upload/publications/' + imageFind[0].file ;
            fs.unlink(image_path, (e)=>{
                if(!e){
                    //console.log("imagene no encontrada")
                }else{
                    //console.log("imagene elimnada");
                    
                }
            })
        }) 

    publicationModel.deleteOne({ "usuario": req.user.sub, "_id": idpublication })
        .then(publication => {
            if (!publication) {
                return res.status(404).send({ message: "No existe la publicacion" });
            } else {
                return res.status(200).send({ message: "Publicacion eliminada" })
            }
        })
        .catch(err => {
            return res.status(500).send({ message: "error en la peticion de elimniar publicacion" });
        })
}

function uploadImage(req, res) {
    let publicationId = req.params.id
    if (req.file) {
        let file_path = req.file.path;
        let file_split = req.file.path.split(/[\\\.]/);
        let file_name = file_split[2];
        let file_ext = file_split.pop();
        let file_image = `${file_name}.${file_ext}`;


        publicationModel.find({ "_id": publicationId, "usuario": req.user.sub })
            .then(userFind => {
                if (userFind.length >= 1) {
                    if (file_ext == "jpg" || file_ext == "png" || file_ext == "gif" || file_ext == "jpeg") {
                        publicationModel.findByIdAndUpdate(publicationId, { "file": file_image }, { new: true })
                            .then(imageUpdate => {
                                if (!imageUpdate) {
                                    removeFiles(res, file_path, "No es posible actulizar la imagen")
                                } else {
                                    return res.status(200).send({ imageUpdate });
                                }
                            })
                            .catch(err => {
                                return res.status(500).send({ message: "Error en la peticion de actuzalizar la imagen " })
                            })
                    } else {
                        return removeFiles(res, file_path, "extension invalida");
                    }
                } else {
                    return removeFiles(res, file_path, "No tienes permisos para actuzalir la imagen")

                }
            })
            .catch(err => {
                return res.status(500).send({ message: "Error en la peticion de buscar publicacion " + err })
            })



    } else {
        return res.status(200).send({ message: "No se ha seleccionado una imagen" });
    }
}

function removeFiles(res, path, message) {
    fs.unlink(path, (err) => {
        if (err) {
            return res.status(200).send({ message: "Error al eliminar el archivo" })
        } else {
            return res.status(200).send({ message: message })
        }

    })
}

function getImageFile(req, res) {
    let image_name = req.params.imageFile;
    let image_path = './upload/publications/' + image_name;

    fs.exists(image_path, e=>{
        if(e){
            return res.status(200).sendFile(path.resolve(image_path));
        }else{
            return res.status(500).send({message: "Error en la peticion de obtener image publicacion"})
        }
    });

}



module.exports = {
    savePublication,
    getPublications,
    getPublicationId,
    deletePublication,
    uploadImage,
    getPublicationsUser,
    getImageFile
}
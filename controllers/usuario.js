'use strict'

var usuarioModel = require("../models/usuario");
var seguirModel = require("../models/seguimiento");
var publicacinonModel = require("../models/publicacion")

var bcrypt = require("bcrypt-nodejs");
var jwt = require("../services/jwt");
var moongosePaginate = require("mongoose-pagination");
var fs = require("fs");
var path = require("path");


const saveUser = (req, res) => {
    let params = req.body;
    let usuario = new usuarioModel();

    if (params.name && params.surname && params.nick && params.email && params.password) {
        usuario.name = params.name;
        usuario.surname = params.name;
        usuario.nick = params.nick;
        usuario.email = params.email;
        usuario.role = "ROLE_USER";
        usuario.image = null;

        usuarioModel.find({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick.toLowerCase() }
            ]
        }).then(userFind => {
            if (userFind.length > 0) {
                return res.status(200).send({ message: "Usuario ya existente en el sistema" });
            } else {
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    usuario.password = hash;
                    usuario.save()
                        .then((userStored) => {
                            if (userStored) {
                                res.status(200).send({ usuario: userStored });
                            } else {
                                res.status(404).send({ message: "No se ha registrado el usuario" });
                            }
                        })
                        .catch((err) => {
                            if (err) return res.status(500).send({ message: "Error al guardar el usuario" });
                        })
                })
            }
        })
            .catch(err => {
                return res.status(500).send({ message: "Error en la peticion" });
            })



    } else {
        res.status(200).send({ message: "Envia todos los campos necesarios" })
    }
}

const login = (req, res) => {
    let params = req.body;
    var email = params.email;
    let password = params.password;

    if (email && password) {
        usuarioModel.findOne({ email: email })
            .then(userfind => {
                bcrypt.compare(password, userfind.password, (err, check) => {
                    if (check) {
                        if (params.getToken == "true") {
                            return res.status(200).send({ token: jwt.createToken(userfind) })
                        } else {
                            userfind.password = undefined;
                            return res.status(200).send({ usuario: userfind });
                        }
                    } else {
                        return res.status(404).send({ message: "Creendenciales Incorrectas", check })
                    }
                })
            })
            .catch(err => {
                return res.status(404).send({ message: "Creendeciales incorrectas", err })
            })
    } else {
        return res.status(200).send({ message: "debe ingresar correo y contraseña" });
    }


}

/****************************************************************************************************************/

let getUser = (req, res) => {
    let userId = req.params.id;

    usuarioModel.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "El usuario no existe" });
            } else {
                followThisUser(req.user.sub, userId)
                    .then(follow => {
                        res.status(200).send({ usuario: user, seguido: follow.followed, seguidores: follow.following });
                    })
                    .catch(err => {
                        res.status(500).send({ message: "Error en la peticion follow " + err })
                    })
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error en la peticion" })
        })
}

let followThisUser = async (user_identity, userdId) => {
    let followed = await seguirModel.findOne({ "usuario": userdId, "siguiendo": user_identity })
        .then(follow => { return follow })
        .catch(err => { return err });

    let following = await seguirModel.findOne({ "usuario": user_identity, "siguiendo": userdId })
        .then(follow => { return follow })
        .catch(err => { return err });

    return {
        followed,
        following
    }
}

/****************************************************************************************************************/

let getUsers = async (req, res) => {

    var page = 1;
    var itemPerPage = 5;
    if (req.params.page) {
        page = req.params.page
    }
    usuarioModel.find({}).sort("_id").paginate(page, itemPerPage)
        .then(users => {
            followUserId(req.user.sub)
                .then(followId => {
                    let total = followId.counterUser;
                    res.status(200).send(
                        {
                            usuarios: users,
                            usuario_following: followId.following_,
                            usuario_followed: followId.followed_,
                            total,
                            page: Math.ceil(total / itemPerPage)
                        }
                    );
                })
                .catch(err => { res.status(500).send({ message: "Error en la peticion followId " + err }) });
        })
        .catch(err => {
            res.status(500).send({ message: "Error en la peticion", err })
        })

}



let followUserId = async (user_id) => {

    let followed = await seguirModel.find({ "siguiendo": user_id }).select({ '_id': 0, '__v': 0, 'siguiendo': 0 })
        .then(follow => { return follow })
        .catch(err => { return err });

    let following = await seguirModel.find({ "usuario": user_id }).select({ '_id': 0, '__v': 0, 'usuario': 0 })
        .then(follow => { return follow })
        .catch(err => { return err });

    let countUser = await usuarioModel.countDocuments({})
        .then(user => { return user })
        .catch(err => { return err })

    var followed_array = [];
    var following_array = [];

    followed.forEach(element => {
        followed_array.push(element.usuario)
    })

    following.forEach(element => {
        following_array.push(element.siguiendo);
    })

    return {
        followed_: followed_array,
        following_: following_array,
        counterUser: countUser
    }

}

/****************************************************************************************************************/

let counterFollow = (req, res) => {
    let userId = req.params.id;
    if (!req.params.id) {
        userId = req.user.sub;
    }

    getCounter(userId)
        .then(value => {
            res.status(200).send(
                {
                    followed: value.followed,
                    following: value.following,
                    publication: value.publication,
                    perfil: value.identification
                }
            )
        })
        .catch(err => {
            res.status(500).send({ message: "Error en la peticion counter |" + err })
        })
}

let getCounter = async (user_identity) => {
    let followed = await seguirModel.countDocuments({ "siguiendo": user_identity })
        .then(follow => { return follow })
        .catch(err => { return err });

    let following = await seguirModel.countDocuments({ "usuario": user_identity })
        .then(follow => { return follow })
        .catch(err => { return err });

    let publication = await publicacinonModel.countDocuments({ "usuario": user_identity }).
        then(publications => { return publications })
        .catch(err => { return err });

    let identification = await usuarioModel.find({ '_id': user_identity }).select({ 'surname': 0, 'name': 0, 'nick': 0, 'image': 0, 'password': 0, '_id': 0, "role": 0 })
        .then(user => {
            let user_array = "";
            user.forEach(element => {
                user_array = element.email;
            })
            return user_array
        })
        .catch(err => { return err })

    return {
        followed,
        following,
        identification,
        publication
    }


}


let updateUSer = (req, res) => {

    let userid = req.params.id;
    let update = req.body;


    delete update.password;

    if (userid != req.user.sub) {
        return res.status(500).send({ message: "No puedes editar un usuario ajeno al tuyo" });
    } else {

        usuarioModel.find({
            $or: [
                { email: update.email.toLowerCase() },
                { nick: update.nick.toLowerCase() }
            ]

        })
            .then(users => {
                let valid = false;
                users.forEach(el => {
                    if (el && el._id != userid) return valid = true;
                })

                if (valid) return res.status(200).send({ message: "Los datos ya estan en uso" })

                usuarioModel.findByIdAndUpdate(userid, update, { new: true })
                    .then(userUpdate => {
                        if (!userUpdate) {

                            return res.status(404).send({ message: "no se ha podido encontrar el usuario a actualizar" })

                        } else {
                            userUpdate.password = undefined;
                            return res.status(200).send({ userUpdate });
                        }
                    })
                    .catch(err => {
                        return res.status(500).send({ message: "Error en la peticion de actualizar usuario" })
                    })
            })
            .catch(err => {
                return res.status(500).send({ message: "Error en la peticion de buscar email y nick" })
            })


    }

}

let uploadImage = (req, res) => {
    let userId = req.params.id;

    if (req.file) {
        let file_path = req.file.path;
        //file_split crea una matriz/array quitando las barra invertida y el punto
        let file_split = file_path.split(/[\\\.]/);
        
        let file_name = file_split[2];

        let file_extension = file_split.pop();

        let imageName = `${file_name}.${file_extension}`;

        if (userId != req.user.sub) {
            return removefileUpload(res, file_path, "No tienes persmiso para actualizar el usuario");
        }

        if (file_extension == "jpg" || file_extension == "png" || file_extension == "jpeg" || file_extension == "git") {
            usuarioModel.findByIdAndUpdate(userId, { image: imageName }, { new: true })
                .then(userUpdate => {
                    userUpdate.password = undefined;
                    return res.status(200).send({ userUpdate })
                })
                .catch(err => {
                    return res.status(200).send({ message: "Error en la peticion de actualizar imagen" })
                })
        } else {
            return removefileUpload(res, file_path, "Extension no valida");
        }


    } else {
        return res.status(200).send({ message: "No se han subido imagen" })
    }
}

function removefileUpload(res, path, message) {
    fs.unlink(path, (err) => {
        if (err) {
            return res.status(500).send({ message: message });
        } else {
            return res.status(200).send({ message: message });
        }
    })
}

let getImageFile = (req, res) => {
    let image_name = req.params.imageFile;
    let image_path = "./upload/users/" + image_name;

    fs.exists(image_path, (e) => {
        if (e) {
            res.status(200).sendFile(path.resolve(image_path));
        } else {
            res.status(200).send({ message: "No se encuentra la imagen" })
        }
    })
}

module.exports = {
    saveUser,
    login,
    getUser,
    getUsers,
    updateUSer,
    uploadImage,
    getImageFile,
    counterFollow
}
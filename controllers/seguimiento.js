'use strict'

let seguirModel = require("../models/seguimiento");
let usuarioModel = require("../models/usuario");
let mongoose_pagination = require("mongoose-pagination");
//let path = require("path");
//let fs = require("fs");


let saveFollow = (req, res) => {
    let follow = new seguirModel();
    let params = req.body;

    if (params.siguiendo) {

        follow.usuario = req.user.sub;
        follow.siguiendo = params.siguiendo;

        follow.save()
            .then(followStored => {
                if (!followStored) {
                    return res.status(500).send({ message: "El seguimiento no se ha guardado" });
                } else {
                    return res.status(200).send({ follow: followStored });
                }

            })
            .catch(err => {
                return res.status(500).send({ message: "Error al guardar el seguimiento" })
            })
    } else {
        return res.status(404).send({ message: "Debes seleccionar a tu seguidor" })
    }

}

let deleteFollow = (req, res) => {
    let userId = req.user.sub;
    let followed = req.params.id;

    seguirModel.deleteOne({ 'usuario': userId, 'siguiendo': followed })
        .then(userRemove => {
            if (!userRemove) return res.status(500).send({ message: "Error en al eliminar el follow" });
            return res.status(200).send({ message: "Seguidor eliminado" });
        })
        .catch(err => {
            return res.status(500).send({ message: "Error en la peticion eliminar" });
        })
}

let getFollwingUser = (req, res) => {
    
    let userId = req.params.id;

    if (req.params.id) {
        userId = req.params.id
    }
    let page = 1;
    let itePerPage = 5;
    if (req.params.page) {
        page = req.params.page;
    }

  
        seguirModel.find({ usuario: userId }).populate({ path: 'siguiendo' }).paginate(page, itePerPage)
            .then(follow => {
                if (!follow) return res.status(404).send({ message: "No tienes seguidores" });
                followUserId(userId).then(value=>{
                    let total = value.following_.length;
                    return res.status(200).send({ 
                        follow,
                        pages: Math.ceil(total / itePerPage),
                        usuario_following: value.following_,
                        usuario_followed: value.followed_,
                        total: value.following_.length

                     })
                })
                
            })
            .catch(err => {
                return res.status(500).send({ message: "Error en el servidor: " + err })
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

let getFollowersUser = (req, res)=> {
    let userId = req.params.id ? req.params.id : req.user.sub;
    let page = req.params.page ? req.params.page : 1;  
    let itemPerPage = 5

    seguirModel.find({siguiendo: userId}).populate({path: "usuario"}).paginate(page, itemPerPage)
    .then(followers =>{
        if(!followers){
            return res.status(200).send({message: "No tienes seguidores"});
        } else{
            followUserId(userId).then(value=>{
                let total = value.followed_.length
                return res.status(200).send({
                    seguidores: followers,
                    page: Math.ceil(total / itemPerPage),
                    usuario_following: value.following_,
                    usuario_followed: value.followed_,
                    total: value.followed_.length,
                });
            })
        }
        
    })
    .catch(err=>{
        return res.status(200).send({message: "Error en la peticion: "+err})
    })

    if(req.params.page){
        
    }
}

let getMyFollows = (req, res) =>{
    let userId = req.user.sub;
    let find = seguirModel.find({usuario : userId });

    if(req.params.follow){
        find = seguirModel.find({siguiendo : userId });
    }

    find.populate({path: "siguiendo usuario"})
    .then(result=>{
        if(result){
            return res.status(200).send({result})
        }else{
            return res.status(404).send({message: "No sigues a ninguno"});
        }
    })
    .catch(err=>{
        return res.status(500).send({message: "Error en la peticion " + err})
    })

    find
}

module.exports = {
    saveFollow,
    deleteFollow,
    getFollwingUser,
    getFollowersUser,
    getMyFollows
}
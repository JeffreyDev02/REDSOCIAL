'use strict'

let mensajeModel = require("../models/mensaje");
let usuarioModel = require("../models/publicacion");
let seguirModel = require("../models/seguimiento");
const mongoose = require("mongoose");

let moment = require("moment");
let mongoose_paginate = require("mongoose-pagination");
let fs = require("fs");
let path = require("path");
const { json } = require("body-parser");



function saveMessage(req, res) {
    let params = req.body;
    let message = new mensajeModel();

    if (params.text && params.receiver) {
        message.text = params.text;
        message.emiter = req.user.sub;
        message.receiver = params.receiver;
        message.create_at = moment().unix();
        message.viewed = "false";

        message.save()
            .then(messageStored => {
                if (!messageStored) return res.status(500).send({ message: "No se pudo enviar el mensaje" });
                return res.status(200).send({ messageStored });
            })
            .catch(err => {
                return res.status(500).send({ message: "Error en la peticion de enviar mensaje" });
            })

    } else {
        return res.status(200).send({ message: "Envia los datos necesarios" })
    }
}

function getMessageReceiver(req, res) {
    let userId = req.user.sub;

    let page;
    req.params.page ? page = req.params.page : page = 1;

    let itemPerPage = 5

    mensajeModel.find({ receiver: userId }).populate({ path: "emiter", select: "name nick image" }).sort({ 'emiter.name': 1 }).paginate(page, itemPerPage)
        .then(messages => {
            if (!messages) {
                return res.status(404).send({ message: "No hay mensajes" });
            } else {
                return myMessageAcount(userId).then(total => {
                    res.status(200).send({
                        total: total.receiverTotal,
                        page: Math.ceil(total.receiverTotal / itemPerPage),
                        messages: messages
                    })
                })
                    .catch(err => { return res.status(500).send({ message: err }) })
            }
        })
        .catch(err => { return res.status(500).send({ message: "Error en la peticion de mensajes" }) })
}

function getMessageEmitter(req, res) {
    let userId = req.user.sub;

    let page;
    req.params.page ? page = req.params.page : page = 1;

    let itemPerPage = 5


    mensajeModel.find({ emiter: userId }).populate({ path: "receiver", select: "name image" }).sort("-create_at").paginate(page, itemPerPage)
        .then(messages => {
            if (!messages) {
                return res.status(404).send({ message: "No hay mensajes" });
            } else {
                return myMessageAcount(userId).then(total => {
                    res.status(200).send({
                        total: total.emiterTotal,
                        page: Math.ceil(total.emiterTotal / itemPerPage),
                        messages: messages
                    })
                })
                    .catch(err => { return res.status(500).send({ message: err }) })
            }
        })
        .catch(err => { return res.status(500).send({ message: "Error en la peticion de mensajes" }) })
}

let myMessageAcount = async (user) => {
    let receiverTotal = await mensajeModel.countDocuments({ receiver: user })
        .then(count => { return count })
        .catch(err => { return err });

    let emiterTotal = await mensajeModel.countDocuments({ emiter: user })
        .then(count => { return count })
        .catch(err => { return err });

    return {
        receiverTotal,
        emiterTotal
    }
}

function getUnviewedMessage(req, res) {
    let userId = req.user.sub;
    console.log(req.user.email)
    mensajeModel.countDocuments({ receiver: userId, viewed: "false" })
        .then(acount => { return res.status(200).send({ mensajes_pendientes: acount }) })
        .catch(err => { return res.status(500).send({ message: "Error en la peticion" }) });

}

function setUnviewedMessage(req, res) {
    let userId = req.user.sub;
    mensajeModel.updateMany({ receiver: userId, viewed: "false" }, { viewed: "true" }, { multi: true, new: true })
        .then(viewed => {
            if (!viewed) return res.status(404).send({ message: "No se encontraron mensajes no leidos" });
            return res.status(200).send({ viewed })
        })
        .catch(err => {
            return res.status(500).send({ message: "Error en la peticion" });
        })
}

function nombreMenssages(req, res) {
    let userId = req.user.sub
    mensajeModel.find({ receiver: userId }).populate({ path: "emiter", select: "name surname nick image" }).sort("-create_at").then(mensajes => {
        const mensajesPorNombre = {};

        mensajes.forEach(element => {
            const nombreEmisor = element.emiter.name;
            if (mensajesPorNombre[nombreEmisor]) {
                mensajesPorNombre[nombreEmisor].count++;
                
            } else {
                mensajesPorNombre[nombreEmisor] = {
                    count: 1,    
                    name: element.emiter.name,
                    surname: element.emiter.surname,
                    image: element.emiter.image,
                    nick: element.emiter.nick,
                    ultimate: element.create_at
                };
                
            }
        })

        
         

        return res.status(200).send({ message:  mensajesPorNombre });

    })
        .catch(err => {
            return res.status(500).send({ message: "Error en la peticion " + err })
        })
}


module.exports = {
    saveMessage,
    getMessageReceiver,
    getMessageEmitter,
    getUnviewedMessage,
    setUnviewedMessage,
    nombreMenssages
}
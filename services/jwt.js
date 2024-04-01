'use strict'

let jwt = require("jwt-simple");
let moment = require("moment");
let secret = "clave_secreta_dev_2024"

let createToken = (user)=>{
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        password: user.password,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix(),
    }
   
    return jwt.encode(payload, secret)
}

module.exports = {
    createToken
}
'use strict'

let jwt = require("jwt-simple");
let moment = require("moment");
let secret = "clave_secreta_dev_2024";

function ensureAuth(req, res, next){
        if(!req.headers.authorization){
            return res.status(403).send({message: "la peticion no tiene la cabecera de autenticacion"});
        }

        try {
            let token = req.headers.authorization.replace(/['"]+/g, '');
            var payload = jwt.decode(token, secret);

            if(payload.exp <= moment().unix()){
                return res.status(401).send({message: "El token ha expirado"});
            }

        } catch (error) {
            return res.status(404).send({message: "El token no es valido"})
        }
       
        req.user = payload;
        next(); 

}

module.exports = {
    ensureAuth
}
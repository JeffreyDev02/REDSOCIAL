'use strict'
const mongoose = require("mongoose");
let app = require("./app");
let port = 3800;


//mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/red_social", {})
    .then(() =>{ 
        
        console.log("la conexion a la base de datos se ha realizado correctamente");
        app.listen(port, ()=>{
            console.log("Servidor corriendo en https://localhost:3800");
        })
    })
    .catch((err) => { console.log(err)});

    

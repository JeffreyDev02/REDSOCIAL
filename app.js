'use strict'

let express = require("express");
let bodypaser = require("body-parser");

let app = express();

//cargar rutas
let user_routes = require("./routes/usuario");
let follow_routes = require("./routes/seguimiento");
let publication_routes = require("./routes/publicacion");
let message_routes = require("./routes/mensaje");


//cargar middlewares
app.use(bodypaser.urlencoded({extended:false}));
app.use(bodypaser.json());

//cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


//rutas
app.use("/api", user_routes);
app.use("/api", follow_routes);
app.use("/api", publication_routes);
app.use("/api", message_routes);


module.exports = app;
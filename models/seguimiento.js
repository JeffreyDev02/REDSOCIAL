'use strint'

const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let followSchema = Schema({
    usuario: {type: Schema.ObjectId, ref: "usuario"},
    siguiendo: {type: Schema.ObjectId, ref: "usuario"}   
})

module.exports = mongoose.model("seguimiento", followSchema);
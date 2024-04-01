'use strict'

const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let messageSchema = Schema({
    text: String,
    create_at: String,
    viewed: String,
    emiter: {type: Schema.ObjectId, ref: "usuario"},
    receiver: {type: Schema.ObjectId, ref: "usuario"},
})

module.exports = mongoose.model("mensajeria", messageSchema);
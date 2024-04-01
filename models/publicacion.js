'use strict'

const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let publicationSchema = Schema({
    text: String,
    file: String,
    create_at: String,
    usuario: {type: Schema.ObjectId, ref: "usuario"}
});

module.exports = mongoose.model("publicacion", publicationSchema);
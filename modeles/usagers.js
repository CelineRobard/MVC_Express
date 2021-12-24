const mongoose = require('mongoose');

// schema de donnees pour les Usagers
// _id, nom, email, password, date, roles, fichierImage
let schemaUsager = mongoose.Schema({
    nom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    },
    roles:{
        type:Array,
        required:true,
        default: ['normal']
    },
    fichierImage:{
        type:String,
        required: true,
        default: ''
    }
});

let Usagers = module.exports = mongoose.model('Usagers2', schemaUsager);
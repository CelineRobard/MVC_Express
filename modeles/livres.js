const mongoose = require('mongoose');

//Schema des donnéess pour les livres
//_id,titre,auteur,résumé,langue,date,prix,genre,url_image

let schemaLivre = mongoose.Schema({
    titre:{
        type:String,
        require:true
    },
    auteur:{
        type:String,
        require:true
    },
    resume:{
        type:String,
        require:true
    },
    langue:{
        type:String,
        require:true
    },
    date:{
        type:Date,
        require:true,
        default: Date.now()
    },
    prix:{
        type:Number,
        require:true
    },
    genre:{
        type:String,
        require:true
    },
    url_image:{
        type:String,
        require:true
    }
});

let Livres = module.exports = mongoose.model('livres',schemaLivre);
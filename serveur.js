const express = require('express');
const app = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 8000;
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
require('./config/passport')(passport);

const multer = require('multer');
const upload = multer({dest: './uploads/'}); //définir l'emplaement des fichiers (dossier temporaire el tps daller chercher limage la valider et lenregister)

//definir le storage (détails concernat les informations de stockage)
const fs = require('fs');
//const path = require('path'); comme le mt est utilisé par multer, on lappelle différement
const nodeJSpath = require('path');

const storage = multer.diskStorage({
    destination: function(requete,file,callback){
        callback(null,'./uploads/');
    },
    filename: function(requete,file,callback){
        callback(null,file.fieldname);
    }
});
app.use(upload.any()); //accepte tous les uploads, any fonctionne avec un ou plusieurs fichiers, il y a dautres fonctions mais dans le cadre du cours on verra qeu celui là


//layouts
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);

// format des post
app.use(express.urlencoded({ extended: false }));


// les sessions express
app.use(session({
    secret: 'trucmachinBidule',
    resave: true,
    saveUninitialized: true
}));

// pour passport
app.use(passport.initialize());
app.use(passport.session());

// connexion a flash
app.use(flash());

// nos variables globales
app.use((requete, reponse, next) => {
    reponse.locals.succes_msg = requete.flash('succes_msg');
    reponse.locals.erreur_msg = requete.flash('erreur_msg');
    reponse.locals.erreur_passeport = requete.flash('error');
    next();
});

// mes routes...
app.use('/', require('./routes/index'));
app.use('/usagers', require('./routes/usagers'));

// mes vues....
app.set('views', './views');
app.set('layout', 'layout');
app.set('view engine', 'ejs');

// mes fichiers statiques
app.use('/css', express.static('./statique/css'));
app.use('/images', express.static('./statique/images'));
app.use('/javascript', express.static('./statique/javascript'));


// connexion BD
mongoose.connect('mongodb+srv://celine:YjUbgg78YUKg7NC@cluster0.4nird.mongodb.net/web2_TP1?retryWrites=true&w=majority');

let db = mongoose.connection;
db.on('error', (err) => { console.error('erreur de BD:', err)});
db.once('open', () => {console.log('connexion a la BD OK!!')});

app.listen(PORT, console.log(`Service Web demarre sur le port ${PORT}`));
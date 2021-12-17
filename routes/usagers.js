const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const Usagers = require('../modeles/usagers');
const { estAuthentifie } = require('../config/auth');
const { estAdmin } = require('../config/auth_admin');
const fs = require('fs');
const nodeJSpath = require('path');

router.get('/login', (requete, reponse) => reponse.render('login'));
router.get('/logout', (requete, reponse) => {
    requete.logout();
    requete.flash('succes_msg', 'Deconnexion reussie');
    reponse.redirect('/usagers/login');
});
router.get('/register', estAuthentifie, estAdmin, (requete, reponse) => {
    console.log(requete.body);
    reponse.render('afficheUsager',{
        titre: 'Créer',
        iconeFAS: 'fa-user-plus'
    });
});
router.post('/login', (requete, reponse, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        badRequestMessage: 'Remplir tous les champs',
        failureRedirect: '/usagers/login',
        failureFlash: true
    })(requete, reponse, next);
});

function supprimerFichier(path){
    let nomFichier = nodeJSpath.join(__dirname,'..',path);

    fs.unlink(nomFichier,(err) => { //fonction asynchrone (si j'ai beosin dattendre qu'il soit supprimé avant de  continuer il faut le faire ailleurs jai pas vu où)
        if(err){
            console.log(err);
        }else{
            console.log('fichier ', nomFichier, ' supprimé');
        }
    });
}

function conserverFichier(path,filename){
    let nomFichier = nodeJSpath.join(__dirname,'..',path);
    let nouveauNomFichier = nodeJSpath.join(__dirname,'..','statique','images',filename);

    fs.rename(nomFichier,nouveauNomFichier, (err) => { 
        if(err){
            console.log(err);
        }else{
            console.log('fichier ', nomFichier, ' renomé vers ', nouveauNomFichier);
        }
    });
    return filename;
}

router.post('/register', estAuthentifie, estAdmin, (requete, reponse) => {
    // console.log(requete.body);
    const { nom, email, password, password2, admin, gestion, normal } = requete.body;
    const { originalname,destination,filename,size,path,mimetype} = requete.files[0]; //retourne un tableau de fichiers (comme nous on sait qu'on en accepte un seul on va le chercher directement en position 1)
    const maxFileSize = 2*1024*1024;
    const mimetypePermis = ['image/png','image/jpg','image/jpeg','image/gif','image/webp'];
    console.log(path);
    let erreurs = [];

    if(size > maxFileSize){
        erreurs.push({ msg : 'Taille du fichier trop importante'});
    }else{
        if(!mimetypePermis.includes(mimetype)){
            erreurs.push({ msg: 'Format de fichier non valide'});
        }
    }

    if (!nom || !email || !password || !password2) {
        erreurs.push( { msg: 'Remplir tous les champs' } );
    }
    if (password != password2) {
        erreurs.push( { msg: 'Les mots de passe ne sont pas identiques'});
    }
    if (password.length < 6) {
        erreurs.push( { msg: 'Le mot de passe doit etre de 6 car minimum'});
    }
    if (erreurs.length > 0) {
        supprimerFichier(path);
        reponse.render('afficheUsager', {
            titre: 'Créer',
            iconeFAS: 'fa-user-plus',
            erreurs,
            nom,
            email,
            password,
            password2,
            admin,
            gestion
        });
    } else {
        Usagers.findOne({ email: email }).then(usager => {
            if (usager) {
                erreurs.push({ msg: 'Ce courriel existe deja'});
                supprimerFichier(path);
                //ajouter flash pour afficher lerreur
                reponse.render('afficheUsager', {
                    titre: 'Créer',
                    iconeFAS: 'fa-user-plus',
                    erreurs,
                    nom,
                    email,
                    password,
                    password2,
                    admin,
                    gestion
                });               
            } else {
                let roles = ['normal'];
                if(admin){
                    roles.push('admin');
                }
                if(gestion){
                    roles.push('gestion');
                }
                const nouveauUsager = new Usagers({
                    nom,
                    email,
                    password,
                    roles
                });
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(password, salt, (err, hache) => {
                        if (err) throw err;
                        // nouveau mot de passe est dans le hache
                        nouveauUsager.password = hache;
                        //conserver le fichier dans les images et  mettre son nom dans la BD a fichierImage
                        nouveauUsager.fichierImage = conserverFichier(path,filename);
                        nouveauUsager.save()
                        .then(user => {
                            // console.log(nouveauUsager);
                            requete.flash(
                                'succes_msg', 'Cet usager vient d\'être inséré dans la BD et vous pouvez enregistrer un autre usager'
                            );
                            reponse.redirect('/usagers/register');
                        })
                        .catch(err => console.log(err));
                    });
                });
            }
        })
    }   
});

router.get('/listeUsagers', estAuthentifie, (requete, reponse) => {
    Usagers.find({
        //query vide
    }).then((tousUsagers) => {
        console.log(tousUsagers);
        reponse.render('listeUsagers',{tousUsagers});
    }).catch( err => console.log(err));
});

router.get('/listeUsagers', estAuthentifie, (requete, reponse) => {
    reponse.render('listeUsagers');
});

module.exports = router;
//Céline Robard
//Ce fichier est chargé par le fichier principal serveur.js pour toutes les urls des requêtes débutant par '/usagers'
//Il permet de gérer la connexion/décoonnection et d'administrer les usagers

const express = require('express');
const router = express.Router();

/*********************************************************************************************/
/*                          Routes pour la gestion des sessions                              */
/*********************************************************************************************/

//Permettre à l'utilisateur de se connecter / déconnecter

const passport = require('passport');

//1.Afficher le formulaire sur GET '/login'
//2.Envoyer les données sur POST '/login'
//3.Appeler la fonction de déconnexion de passport sur GET '/logout'

router.get('/login', (requete, reponse) => reponse.render('login'));
  
router.post('/login', (requete, reponse, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        badRequestMessage: 'Remplir tous les champs',
        failureRedirect: '/usagers/login',
        failureFlash: true
    })(requete, reponse, next);
});
     
router.get('/logout', (requete, reponse) => {
    requete.logout();
    requete.flash('succes_msg', 'Deconnexion reussie');
    reponse.redirect('/usagers/login');
});


/*********************************************************************************************/
/*                     Routes pour la gestion des usagers de la BD                           */
/*********************************************************************************************/

//Permettre aux utilisateurs authentifiés d'afficher la liste des usagers
//Permettre aus administrateurs d'ajouter, modifier et supprimer des

const Usagers = require('../modeles/usagers');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const nodeJSpath = require('path');
const { estAuthentifie } = require('../config/auth');
const { estAdmin } = require('../config/auth_admin');

//Récupérer tous les usagers et les passer en paramètre de listeUsagers
router.get('/listeUsagers', estAuthentifie, (requete, reponse) => {

    Usagers.find({}).then((tousUsagers) => {
        
        for(let i=0; i < tousUsagers.length; i++){
            let nomFichier = nodeJSpath.join('statique','images', tousUsagers[i].fichierImage);

            fs.access( nomFichier, fs.constants.F_OK, erreur => {
                if(erreur){ 
                    tousUsagers[i].fichierImage = '';
                }   
                if(i + 1 === tousUsagers.length){
                    reponse.render('listeUsagers',{ 
                        user:requete.user,
                        tousUsagers
                    });
                }
            });
        }

    }).catch( err => console.log(err));
});

/****************************** Ajouter un utilisateur à la BD ******************************/

//1.Afficher le formulaire vide sur GET '/ajouter'
//2.Envoyer les données saisies sur POST '/ajouter'

router.get('/ajouter', estAuthentifie, estAdmin, (requete, reponse) => {
    reponse.render('afficheUsager',{
        user:requete.user,
        titre: 'Créer',
        iconeFAS: 'fa-user-plus'
    });
});

router.post('/ajouter', estAuthentifie, estAdmin, (requete, reponse) => {
    
    const { nom, email, password, password2, admin, gestion, normal } = requete.body;
    const { originalname,destination,filename,size,path,mimetype} = requete.files[0]; //retourne un tableau de fichiers (comme nous on sait qu'on en accepte un seul on va le chercher directement en position 1)
    const maxFileSize = 2*1024*1024;
    const mimetypePermis = ['image/png','image/jpg','image/jpeg','image/gif','image/webp'];
    
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
            user:requete.user,
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
        //Vérifier si un utilisateur existe déjà avec cet email
        Usagers.findOne({ email: email }).then(usager => {
            if (usager) {
                erreurs.push({ msg: 'Ce courriel existe deja'});
                supprimerFichier(path);
                //ajouter flash pour afficher lerreur
                reponse.render('afficheUsager', {
                    user:requete.user,
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
                        nouveauUsager.password = hache;
                        nouveauUsager.fichierImage = conserverFichier(path,filename);
                        nouveauUsager.save()
                        .then(user => {
                            requete.flash(
                                'succes_msg', 'Cet usager vient d\'être inséré dans la BD et vous pouvez enregistrer un autre usager'
                            );
                            reponse.redirect('/usagers/ajouter');
                        })
                        .catch(err => console.log(err));
                    });
                });
            }
        })
    }   
});

/****************************** Supprimer un utilisateur de la BD ******************************/

//1.Afficher le formulaire pré-rempli sur GET '/supprimer/:idUsager'
//3.Envoyer le formulaire sur POST '/supprimer'

router.get('/supprimer/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {
    
    Usagers.findById(requete.params.idUsager).then(usager => {
        //Récupérer les données de l'utilisateur trouvées dans la BD et passer les valeurs en paramètre pour rendre afficheUsager

        const { _id,nom,email } = usager;
        let { fichierImage } = usager;
        const admin = usager.roles.find(role => role === "admin");
        const gestion = usager.roles.find(role => role === "gestion");

        //Vérifier la présence de l'image sinon passer avec une valeur vide
        let nomFichier = nodeJSpath.join('statique','images', fichierImage);

        fs.access( nomFichier, fs.constants.F_OK, erreur => {
            if(erreur){
                fichierImage = '';
            }   
            reponse.render('afficheUsager',{
                user:requete.user,
                titre: 'Supprimer',
                iconeFAS: 'fa-user-slash',
                _id,
                nom,
                email,
                admin,
                gestion,
                fichierImage
            });
        });
    }).catch(err => console.log(err));
});

router.post('/supprimer', estAuthentifie, estAdmin, (requete, reponse) => {
    //Réccupérer les données du formulaire pour les passer en paramètre du formulaire de confirmation
    const { _id,nom, email, admin, gestion,fichierImage } = requete.body;
    
    Usagers.deleteOne({_id}).then(usager => {
        reponse.render('afficheUsager',{
            user:requete.user,
            titre: 'Confirmation de suppression',
            iconeFAS: 'fa-user-slash',
            _id,
            nom,
            email,
            admin,
            gestion,
            fichierImage
        });
    }).catch(err => console.log(err));
});

/********************************** Modifier un usager *********************************/

//1.Afficher le formulaire pré-rempli sur GET '/editer/:idUsager'
//2.Ré-afficher le formulaire sur POST '/editer/:idUsager'
//3.Envoyer le formulaire sur POST '/editer'

router.get('/editer/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {

    Usagers.findById(requete.params.idUsager).then(usager => {
        //Récupérer les données de l'utilisateur trouvées dans la BD et passer les valeurs en paramètre pour rendre afficheUsager

        const { _id,nom,email } = usager;
        let { fichierImage } = usager;
        const admin = usager.roles.find(role => role === "admin");
        const gestion = usager.roles.find(role => role === "gestion");

        //Vérifier la présence de l'image sinon passer avec une valeur vide
        let nomFichier = nodeJSpath.join('statique','images', fichierImage);

        fs.access( nomFichier, fs.constants.F_OK, erreur => {
            if(erreur){
                fichierImage = '';
            }   
            reponse.render('afficheUsager',{
                user:requete.user,
                titre: 'Modifier',
                iconeFAS: 'fa-user-edit',
                _id,
                nom,
                email,
                admin,
                gestion,
                fichierImage
            });
        });
    }).catch(err => console.log(err));
});

router.post('/editer/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {

    const { _id,nom,email,admin,gestion,password } = requete.body;

    reponse.render('afficheUsager',{
        user:requete.user,
        titre: 'Modifier',
        iconeFAS: 'fa-user-edit',
        _id,
        nom,
        email,
        admin,
        gestion,
        password
    });
});

router.post('/editer', estAuthentifie, estAdmin, (requete, reponse) => {
    
    const  { _id,nom, email, password, admin, gestion, normal }  = requete.body;
    let  fichierImage;

    if(requete.files.length > 0){
        const { originalname,destination,filename,size,path,mimetype} = requete.files[0];
        fichierImage = conserverFichier(path,filename);
    }else{
        fichierImage = requete.body;
    }

    let roles = ['normal'];
                if(admin){
                    roles.push('admin');
                }
                if(gestion){
                    roles.push('gestion');
                }
                const newUsager = {
                    nom,
                    email,
                    password,
                    roles,
                    fichierImage
                };

    Usagers.findOneAndUpdate({ "_id": _id }, newUsager)
        .then(
            usager =>   { 
                            requete.flash('succes_msg', 'L\'usager : a été modifié avec succès');
                            reponse.redirect('/usagers/editer/' + _id );
                        })
        .catch(err=>console.log(err));
});

/********************************************************************************************/

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
            console.log('nouveau fichier', nouveauNomFichier);
        }
    });
    return filename;
}

module.exports = router;
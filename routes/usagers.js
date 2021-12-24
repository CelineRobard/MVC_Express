//Ce fichier est chargé par le fichier principal serveur.js pour toutes les urls des requêtes débutant par '/usagers'
const express = require('express');
const router = express.Router();

/*********************************************************************************************/
/*                          Routes pour la gestion des sessions                              */
/*********************************************************************************************/

//Permettre à l'utilisateur de se connecter / déconnecter
//Adapter la réponse du serveur selon que :
    // - l'utilisateur est/n'est pas authentifié
    // - l'utilisateur dispose des droits requis


//Chargement du module passport
const passport = require('passport');

//Routes pour gérer la connexion/deconnexion de l'utilisateur

    //1.Route pour afficher le formulaire de connexion
    router.get('/login', (requete, reponse) => reponse.render('login'));

    //2.Route pour envoyer les données du formulaire de connexion
    router.post('/login', (requete, reponse, next) => {
        passport.authenticate('local', {
            successRedirect: '/',
            badRequestMessage: 'Remplir tous les champs',
            failureRedirect: '/usagers/login',
            failureFlash: true
        })(requete, reponse, next);
    });

    //3.Route pour appeler la fonction de déconnexion de passport et rediriger l'utilisateur vers le formulaire de connexion 
    router.get('/logout', (requete, reponse) => {
        requete.logout();
        requete.flash('succes_msg', 'Deconnexion reussie');
        reponse.redirect('/usagers/login');
    });


//Fonctions intermédiaires pour adapter la réponse du serveur selon que l'utilisateur est authentifié et/ou dispose des droits requis
    //1.La fonction qui vérifie qu'une session passport est active
    const { estAuthentifie } = require('../config/auth');

    //2.La fonction qui vérifie que l'utilisateur dispose des droits requis pour gérer les utilisateurs (rôle admin)
    const { estAdmin } = require('../config/auth_admin');


/*********************************************************************************************/
/*                     Routes pour la gestion des usagers de la BD                           */
/*********************************************************************************************/

//Permettre aux utilisateurs authentifiés d'ajouter, récupérer, modifier et supprimer des usagers de la BD

//Chargement du module permettant de hacher le mot de passe avant de l'ajouter à la BD
const bcrypt = require('bcryptjs');

//Chargement des modules permettant de conserver et supprimer les fichiers images
const fs = require('fs');
const nodeJSpath = require('path');

//Chargement du modèle Usagers pour intéragir avec la BD (collection usagers2)
const Usagers = require('../modeles/usagers');


/****************************** Format des routes *****************************/

//La racine de toutes les routes définies ci-après est '/usagers'.

//La fonction retour des routes définies dans ce fichier rendent le layout afficheUsager ou listeUsagers.

    //Paramètres pour afficherUsager : 
        // - titre et iconeFAS pour personnaliser l'en-tête du formulaire
        // - _id,nom,email,admin,gestion,fichierImage pour pré-remplir le formulaire
        // - password pour conserver la saisie éventuelle lors de la modification de l'image

    //Paramètre pour listeUsagers : tousUsagers

//Les fonctions intermédiaires estAuthentifie et estAdmin sont appellées avant la fonction retour :
    //Si l'utilisateur est authentifié, la fonction retour est executée (ou selon le cas, la fonction estAdmin est appelée), sinon il est redirigé vers le formulaire d'autenhtification
    //Si l'utilisateur dispose des droits administrateur, la fonction retour est exécutée, sinon l'utilisateur est renvoyé vers le menu avec un message d'erreur


/****************************** Récupérer tous les usagers la BD ******************************/

router.get('/listeUsagers', estAuthentifie, (requete, reponse) => {
    Usagers.find({}).then((tousUsagers) => {
        reponse.render('listeUsagers',{ tousUsagers });
    }).catch( err => console.log(err));
});


/****************************** Ajouter un utilisateur à la BD ******************************/

//1.Afficher le formulaire utilisateur vide
router.get('/ajouter', estAuthentifie, estAdmin, (requete, reponse) => {
    reponse.render('afficheUsager',{
        titre: 'Créer',
        iconeFAS: 'fa-user-plus'
    });
    //_id,nom,email,admin,gestion,password,fichierImage (undefined)
});

//2.Envoyer les données du formulaire complété
router.post('/ajouter', estAuthentifie, estAdmin, (requete, reponse) => {
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
                        //conserver le fichier dans les images et mettre son nom dans la BD a fichierImage
                        nouveauUsager.fichierImage = conserverFichier(path,filename);
                        nouveauUsager.save()
                        .then(user => {
                            // console.log(nouveauUsager);
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

//1.Afficher le formulaire utilisateur pré-rempli pour vérifier les données à supprimer
router.get('/supprimer/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {
    //Chercher l'utilisateur stocké sous idUsager dans la BD...
    Usagers.findById(requete.params.idUsager).then(usager => {

        //...récupérer les données de l'utilisateur trouvé...
        const { _id,nom,email,fichierImage } = usager;
        const admin = usager.roles.find(role => role === "admin");
        const gestion = usager.roles.find(role => role === "gestion");

        //...et passer les valeurs en paramètre pour rendre afficheUsager
        reponse.render('afficheUsager',{
            titre: 'Supprimer',
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

//2.Envoyer le formulaire pour supprimer l'utilisateur dans la BD
router.post('/supprimer', estAuthentifie, estAdmin, (requete, reponse) => {
    //Réccupérer les données du formulaire pour les passer en paramètre du formulaire de confirmation
    const { _id,nom, email, admin, gestion,fichierImage } = requete.body;
    //Supprimer l'usager trouvé avec le _id...
    Usagers.deleteOne({_id}).then(usager => {
        //...afficher les données récupérées à l'affichage
        reponse.render('afficheUsager',{
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

/********************************** Modifier un utilisateur *********************************/

router.get('/editer/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {
    Usagers.findById(requete.params.idUsager).then(usager => {

        const { _id,nom,email,fichierImage } = usager;
        const admin = usager.roles.find(role => role === "admin");
        const gestion = usager.roles.find(role => role === "gestion");

        reponse.render('afficheUsager',{
            titre: 'Modifier',
            iconeFAS: 'fa-user-edit',
            _id,
            nom,
            email,
            admin,
            gestion,
            fichierImage
        });
    }).catch(err => console.log(err));
});

/******************************************************************************************************/
//Réccupérer les informations des champs et réafficher le formulaire de modification en permettant l'ajout d'un fichier
router.post('/editer/image/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {
    const { nom,email,admin,gestion,password,fichierImage } = requete.body;
    const _id=requete.params.idUsager;
    reponse.render('afficheUsager',{
        titre: 'Modifier',
        iconeFAS: 'fa-user-edit',
        _id,
        nom,
        email,
        admin,
        gestion,
        password
    });
/*     reponse.status(200).send(`ici on va modifier l image 
    <form action="/usagers/editer/image/new/${requete.params.idUsager}" method="POST"  enctype="multipart/form-data">
        <input type="text" id="nom" name="nom" value="${nom}" hidden/>
        <input type="text" id="email" name="email"  value="${email}" hidden />
        <input type="checkbox" id="admin" name="admin" value="${admin}" hidden />
        <input type="checkbox" id="gestion" name="gestion" value="${gestion}" hidden />
        <input type="password" id="password" name="password" value="${password}" hidden />
        <input type="text" id="fichierImage" name="fichierImage" value="${fichierImage}" hidden />
        <div class="form-group">
            <label>Téléverser</label>
            <input type="file" name="fichier" required />
        </div>
        <button type="button" class="btn btn-secondary btn-block">Annuler</button>
        <button type="submit" class="btn btn-primary btn-block">Confirmer l ajout</button>
    </form>`); */
});

router.post('/editer/image/new/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {
    //console.log(requete.query);
    //console.log(requete.files);
    //console.log(requete.body);
    console.log(requete.params.idUsager);
    const { _id,nom, email, password, admin, gestion, normal } = requete.body;
    const { originalname,destination,filename,size,path,mimetype} = requete.files[0];
    const fichierImage = conserverFichier(path,filename);
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
    Usagers.findOneAndUpdate({ "_id": requete.params.idUsager }, newUsager)
        .then(
            usager =>   { 
                            requete.flash('succes_msg', 'L\'usager : a été modifié avec succès');
                            reponse.redirect('/usagers/editer/' + requete.params.idUsager);
                        })
        .catch(err=>console.log(err));
});

router.post('/editer/:idUsager', estAuthentifie, estAdmin, (requete, reponse) => {
    const  { nom, email, password, admin, gestion, normal, fichierImage }  = requete.body;
    const newUsager = {
        nom,
        email,
        password,
        fichierImage
    };
    Usagers.findOneAndUpdate({ "_id": requete.params.idUsager }, newUsager)
        .then(
            usager =>   { 
                            requete.flash('succes_msg', 'L\'usager : a été modifié avec succès');
                            reponse.redirect('/usagers/editer/' + requete.params.idUsager);
                        })
        .catch(err=>console.log(err));
});
/******************************************************************************************************/




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

module.exports = router;
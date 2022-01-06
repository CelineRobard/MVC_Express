//Ce fichier est chargé par le fichier principal serveur.js pour toutes les urls des requêtes débutant par '/livres' pour la gestion des livres
const express = require('express');
const router = express.Router();


//Permettre aux utilisateurs authentifiés d'ajouter, récupérer, modifier et supprimer des livres de la BD

const Livres = require('../modeles/livres');
const { estAuthentifie } = require('../config/auth');
const { estGestion } = require('../config/auth_gestion');


/****************************** Récupérer tous les livres la BD ******************************/

router.get('/', estAuthentifie, (requete, reponse) => {
    Livres.find({}).then((tousLivres) => {
        console.log(tousLivres);
        reponse.render('listeLivres',{ 
            user:requete.user,
            tousLivres
        });
    }).catch( err => console.log(err));
});

router.get('/details/:idLivre', estAuthentifie, (requete,reponse) => {
    Livres.findOne({ _id: requete.params.idLivre }).then(livre => {
        reponse.render('detailsLivre', {
            user:requete.user,
            livre
        });               
    }).catch( err => console.log(err));
});

/****************************** Ajouter un utilisateur à la BD ******************************/

//1.Afficher le formulaire utilisateur vide
router.get('/ajouter', estAuthentifie, estGestion, (requete, reponse) => {
    reponse.render('afficheLivre',{
        titreForm: 'Créer',
        iconeFAS: 'fa-plus'
    });
});

//2.Envoyer les données du formulaire complété
router.post('/ajouter', estAuthentifie, estGestion, (requete, reponse) => {
    const { titre,auteur,resume,langue,genre,url_image } = requete.body;
    let prix = requete.body.prix;
    
    let erreurs = [];

    if (!titre || !auteur || !resume || !langue || !prix || !genre || !url_image) {
        erreurs.push( { msg: 'Remplir tous les champs' } );
    }

    if (isNaN(prix)){
        prix = prix.replace(/,/g,'.');
        if (isNaN(prix)){
            erreurs.push( { msg: 'Saisir un prix valide' } );
        }
    }

    if (erreurs.length > 0) {
    
        reponse.render('afficheLivre', {
            titreForm: 'Créer',
            iconeFAS: 'fa-plus',
            erreurs,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        });
    } else {
        Livres.findOne({ titre: titre }).then(livre => {
            if (livre) {
                erreurs.push({ msg: 'Ce livre existe deja'});
                reponse.render('afficheLivre', {
                    titreForm: 'Créer',
                    iconeFAS: 'fa-plus',
                    erreurs,
                    titre,
                    auteur,
                    resume,
                    langue,
                    prix,
                    genre,
                    url_image
                });               
            } else {
                
                const nouveauLivre = new Livres({
                    titre,
                    auteur,
                    resume,
                    langue,
                    prix,
                    genre,
                    url_image
                });

                nouveauLivre.save().then(livre => {
                    requete.flash(
                        'succes_msg', 'Ce livre vient d\'être inséré dans la BD et vous pouvez enregistrer un autre livre'
                    );
                    reponse.redirect('/livres/ajouter');
                }).catch(err => console.log(err));
            }
        });
    }   
});

/****************************** Supprimer un livre de la BD ******************************/

//1.Afficher le formulaire pré-rempli sur GET '/supprimer/:idLivre'
//3.Envoyer le formulaire sur POST '/supprimer'

router.get('/supprimer/:idLivre', estAuthentifie, estGestion, (requete, reponse) => {
    
    Livres.findById(requete.params.idLivre).then(livre => {
        //Récupérer les données du livre et passer les valeurs en paramètre pour rendre afficheLivre

        const { 
            _id,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        } = livre;

        reponse.render('afficheLivre',{
            user:requete.user,
            titreForm: 'Supprimer',
            iconeFAS: 'fa-user-slash',
            _id,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        });
    }).catch(err => console.log(err));
});

router.post('/supprimer', estAuthentifie, estGestion, (requete, reponse) => {
    //Réccupérer les données du formulaire pour les passer en paramètre du formulaire de confirmation
    const { 
        _id,
        titre,
        auteur,
        resume,
        langue,
        prix,
        genre,
        url_image
    } = requete.body;
    
    Livres.deleteOne({_id}).then(livre => {
        reponse.render('afficheLivre',{
            user:requete.user,
            titreForm: "Suppression d'",
            iconeFAS: 'fa-trash',
            _id,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        });
    }).catch(err => console.log(err));
});

/********************************** Modifier un livre *********************************/

//1.Afficher le formulaire pré-rempli sur GET '/editer/:idLivre'
//2.Envoyer le formulaire sur POST '/editer'

router.get('/editer/:idLivre', estAuthentifie, estGestion, (requete, reponse) => {

    Livres.findById(requete.params.idLivre).then(livre => {
        //Récupérer les livres dans la BD et passer les valeurs en paramètre pour rendre afficheLivre

        const { 
            _id,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        } = livre;

        reponse.render('afficheLivre',{
            user:requete.user,
            titreForm: "Modifier",
            iconeFAS: 'fa-edit',
            _id,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        });
    }).catch(err => console.log(err));
});

router.post('/editer', estAuthentifie, estGestion, (requete, reponse) => {
    
    const { 
        _id,
        titre,
        auteur,
        resume,
        langue,
        genre,
        url_image
    } = requete.body;

    let prix = requete.body.prix;
    
    let erreurs = [];

    if (prix && isNaN(prix)){
        prix = prix.replace(/,/g,'.');
        if (isNaN(prix)){
            erreurs.push( { msg: 'Saisir un prix valide' } );
        }
    }

    if (erreurs.length > 0) {
    
        reponse.render('afficheLivre', {
            titreForm: 'Créer',
            iconeFAS: 'fa-plus',
            erreurs,
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
            //gestion
        });
    } else {
        const newLivre = {
            titre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
        };

        Livres.findOneAndUpdate({ "_id": _id }, newLivre)
            .then(
                livre =>   { 
                                requete.flash('succes_msg', 'Le livre : a été modifié avec succès');
                                reponse.redirect('/livres/editer/' + _id );
                            })
            .catch(err=>console.log(err));
    }
});


module.exports = router;
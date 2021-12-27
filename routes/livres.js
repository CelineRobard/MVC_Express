//Ce fichier est chargé par le fichier principal serveur.js pour toutes les urls des requêtes débutant par '/livres'
const express = require('express');
const router = express.Router();


/*********************************************************************************************/
/*                     Routes pour la gestion des livres de la BD                           */
/*********************************************************************************************/

//Permettre aux utilisateurs authentifiés d'ajouter, récupérer, modifier et supprimer des livres de la BD

//Chargement du modèle Livres pour intéragir avec la BD (collection livres)
const Livres = require('../modeles/livres');

//Fonctions intermédiaires pour adapter la réponse du serveur selon que l'utilisateur est authentifié et/ou dispose des droits requis
    //1.La fonction qui vérifie qu'une session passport est active
    const { estAuthentifie } = require('../config/auth');

    //2.La fonction qui vérifie que l'utilisateur dispose des droits requis pour gérer les livres (rôle gestion)
    const { estGestion } = require('../config/auth_gestion');


/****************************** Format des routes *****************************/

//La racine de toutes les routes définies ci-après est '/livres'.

/*
/livres
/livres/editer
/livres/ajouter
/livres/supprimer
*/

/****************************** Récupérer tous les livres la BD ******************************/

router.get('/', estAuthentifie, (requete, reponse) => {
    Livres.find({}).then((tousLivres) => {
        reponse.render('listeLivres',{ tousLivres });
        //console.log(tousLivres);
        //reponse.end();
    }).catch( err => console.log(err));
});

/****************************** Ajouter un utilisateur à la BD ******************************/

//1.Afficher le formulaire utilisateur vide
//router.post('/ajouter', estAuthentifie, estGestion, (requete, reponse) => {
router.get('/ajouter', estAuthentifie, (requete, reponse) => {
    reponse.render('afficheLivre',{
        titre: 'Créer',
        iconeFAS: 'fa-plus'
    });
    //_id,titre,auteur,résumé,langue,date,prix,genre,url_image (undefined)
});

//2.Envoyer les données du formulaire complété
//router.post('/ajouter', estAuthentifie, estGestion, (requete, reponse) => {
router.post('/ajouter', estAuthentifie, (requete, reponse) => {
    // console.log(requete.body);
    const { titreLivre,auteur,resume,langue,prix,genre,url_image } = requete.body;
    
    let erreurs = [];

    if (!titreLivre || !auteur || !resume || !langue || !prix || !genre || !url_image) {
        erreurs.push( { msg: 'Remplir tous les champs' } );
    }

    if (erreurs.length > 0) {
    
        reponse.render('afficheLivre', {
            titre: 'Créer',
            iconeFAS: 'fa-plus',
            erreurs,
            titreLivre,
            auteur,
            resume,
            langue,
            prix,
            genre,
            url_image
            //gestion
        });
    } else {
        Livres.findOne({ titre: titreLivre }).then(livre => {
            if (livre) {
                erreurs.push({ msg: 'Ce livre existe deja'});
                reponse.render('afficheLivre', {
                    titre: 'Créer',
                    iconeFAS: 'fa-plus',
                    erreurs,
                    titreLivre,
                    auteur,
                    resume,
                    langue,
                    prix,
                    genre,
                    url_image
                    //gestion
                });               
            } else {
                
                const nouveauLivre = new Livres({
                    titreLivre,
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
        })
    }   
});

/*

//obtenir un livre par son _id dans la BD
module.exports.getLivreById = (idLivre,callback) => {
    Livres.findById(idLivre,callback);
};

//obtenir un livre par titre dans la BD
module.exports.getLivreParTitre = (titre,callback) => {  //je reçoi un titre
    //Pour la recherche je créé un query : créer un objet de recherche
    //c'est différent ce q'on recoit de ce que la requete a besoin
    let query = { "titre" : {$regex: titre, $options: "i"}};
    Livres.find(query,callback);
    //let trier = {pages: -1};
    //Livres.find(query).sort(trier).exec(callback);
};

//ajouter un livre
module.exports.ajoutLivre = (livre,callback) => {
    if(!livre._id){
        livre._id = new mongoose.Types.ObjectId().toString();
    }
    Livres.create(livre,callback);
};

//supprimer un livre dans la BD
module.exports.supprimeLivre = (idLivre,callback) => {
    var query = { "_id" : idLivre}; //Création d'un objet utilisé par la fonction mongoose
    Livres.deleteOne(query,callback);  //Fait appel à la librairie mongoose
};

//modifier un livre
module.exports.modifeLivre = (idLivre,livre,callback) => {
    var query = { "_id" : idLivre};
    var options = { };
    var nouveauLivre = {
        _id : livre._id,
        titre: livre.titre,
        auteur: livre.auteur,
        résumé: livre.résumé,
        éditeur: livre.éditeur,
        pages: livre.pages,
        langue: livre.langue,
        date: livre.date,
        prix: livre.prix,
        genre: livre.genre
    };
    Livres.findOneAndUpdate(query,nouveauLivre,options,callback);
};

*/


module.exports = router;
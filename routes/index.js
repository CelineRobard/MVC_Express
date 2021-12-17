const express = require('express');
const router = express.Router();
const { estAuthentifie } = require('../config/auth');
const { estGestion } = require('../config/auth_gestion');

router.get('/', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user
    });
});
router.get('/contenu', estAuthentifie, (requete, reponse) => {
    reponse.render('contenu', {
        user: requete.user
    });
});
router.get('/gestionContenu', estAuthentifie, estGestion, (requete, reponse) => {
    reponse.render('gestionContenu', {
        user: requete.user
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { estAuthentifie } = require('../config/auth');
const { estGestion } = require('../config/auth_gestion');

router.get('/', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user
    });
});
router.get('/index', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user
    });
});
router.get('/index.html', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user
    });
});

module.exports = router;
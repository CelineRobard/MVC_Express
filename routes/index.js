const express = require('express');
const router = express.Router();
const { estAuthentifie } = require('../config/auth');

router.get('/', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user,
        menu:true
    });
});
router.get('/index', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user,
        menu:true
    });
});
router.get('/index.html', estAuthentifie, (requete, reponse) => {
    reponse.render('index',{
        user:requete.user,
        menu:true
    });
});

module.exports = router;
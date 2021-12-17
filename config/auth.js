module.exports = {
    estAuthentifie: function(requete, reponse, next) {
        if (requete.isAuthenticated()) {
            return next();
        } else {
            requete.flash('erreur_msg', 'Vous devez être connecté pour consulter cette page');
            reponse.redirect('/usagers/login');
        }
    }
}
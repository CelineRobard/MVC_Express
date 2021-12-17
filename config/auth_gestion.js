module.exports = {
    estGestion: function(requete, reponse, next) {
        if (requete.isAuthenticated()) {
            let gestion = requete.user.roles.find(role => role == "gestion");
            console.log(gestion);
            if(gestion){
                return next();
            }else{
                requete.flash('erreur_msg','Vous devez avoir un compte gestionnaire pour continuer ici');
                reponse.redirect('/');
            }
        } else {
            requete.flash('erreur_msg', 'Vous devez être connecté pour consulter cette page');
            reponse.redirect('/usagers/login');
        }
    }
}
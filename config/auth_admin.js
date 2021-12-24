module.exports = {
    estAdmin: function(requete, reponse, next) {
        if (requete.isAuthenticated()) {
            let admin = requete.user.roles.find(role => role == "admin");
            //console.log(admin);
            if(admin){
                return next();
            }else{
                requete.flash('erreur_msg','Vous devez avoir un compte administrateur pour continuer ici');
                reponse.redirect('/');
            }
        } else {
            requete.flash('erreur_msg', 'Vous devez être connecté pour consulter cette page');
            reponse.redirect('/usagers/login');
        }
    }
}
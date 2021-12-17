const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const Usagers = require('../modeles/usagers');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy( { usernameField: 'email' }, (email, password, done) => {
            // trouver notre utilisateur:
            Usagers.findOne({
                email: email
            }).then(usager=>{
                if (!usager) {
                    return done( null, false, { message: "Ce courriel n'existe pas"});
                }
                bcrypt.compare(password, usager.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, usager);
                    } else {
                        return done(null, false, {message: 'Mot de passe invalide'});
                    }
                });
            })
            .catch(err=>console.log(err));
        })
    );
    passport.serializeUser(function(usager, done) {
        done(null, usager.id);
    });
    
    passport.deserializeUser(function(id, done) {
        Usagers.findById(id, function(err, usager) {
          done(err, usager);
        });
    });
}
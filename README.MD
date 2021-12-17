# Web2 - TP2 : Céline Robard

Remise le 5 janvier au soir
Correction le 6 janvier en direct (prévoir de le présenter, avant ou après l'examen)

https://github.com/CelineRobard/WEB2_ROB_TP2.git

Base de données web2_TP1, collection usagers2 (copier celle du TP1 et ajouter les roles et un fichierImage)

roles : ['normal]
roles : ['normal,admin]
roles : ['normal,gestion]
roles : ['normal,admin,gestion]

- Admin : Gestion des usagers (limité grâce à estAdmin)
- Gestion : Gestion des livres (limité grâce à estGestion)
- Normal : Affichage des livres (ajouté pour tous au moment de l'insertion de l'utilisateur)

Ajouter sur le formulaire des cases à cocher pour le choix du rôle.
Ajouter sur le formulaire un champ de saisie pour l'url de l'image.

Pour les livres, on doit pouvoir cliquer pour afficher le détail puis revenir à la liste.
Les options de gestions (modif, supp, ajout) seulement avec le rôle "Gestion".

Les routes à ajouter :
/livres
/livres/editer
/livres/ajouter
/livres/supprimer

Créer l'usager 'Alain Pilon' 'alain@gmail.com' 'alain9' avec les privilèges [admin, normal,gestion]


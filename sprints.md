(IN FRENCH)

<del>sprint1</del>
-------
Les catégories permettent d'organiser les flux.
-implémenter les categories
-chaque flux peut appartenir ou non à 1 catégorie.
-lors de l'édition d'un flux , un utilisateur peut créer de nouvelles catégories
-l'utilisateur peut déplacer un flux vers une categorie
-modèle de categorie
_id:unique
label:String
flux:Array.<flux>

sprint2
-------
- l'utilisateur peut modifier le nom d'une catégorie créee
- l'utilisateur peut réordonner l'ordre d'affichage des categories
- les fils sont représentés par des icons. ces icons sont sauvegardés dans la base de donnée ,
    à taille réduite (16*16 ) et affichés sur le site à partir de la base.
    Si aucun icone est disponible, alors utiliser un icon par défault
# PRM TP2

### Prérequis
- installer Node.js

### Lancement
Après la récupération du projet, à la racine exécutez :
```
# installation des packages Node
> npm install

# lancement du classement des mails
> node index.js
```

Les mails sont triés et séparés en deux groupes dans `mails/spam` et `mails/good`.

### Outils et méthodes

- Technologie Node.js
- Utilisation du node module `mailparser`
- Utilisation du node module `compute-cosine-similarity`
- Programmation sous forme de Promise


#### Parsage des mails

Dans un premier temps, on récupère les mails dans des objets json comprenants différents champs
```
{
    headers:
    from:
    to:
    cc:
...
    text:
    html:
}
```

Les mails sont parsés grâce au module `mailparser` qui permet notamment de récupérer le champ __text__ qui contient le contenu brut du mail sans le code html.

#### Modèle vectoriel

On créé un vocabulaire de référence de mots  
__[java, offre, c#, php, emploi, stage, html, css, javascript, js, big, data, bigdata, business, intelligence, ingnieur, ingenieur, ingénieur, style, sap, programmation, sql, bdd, données, sgbd, tests, hadoop, agile, projet, système, systeme, saas, esn, sii, développement, développeur, dveloppeur, dveloppement, developpement, developpeur, gestion, entreprise, société, societe, socte, python, embauche, MIAGE, profil, technique, fonctionnel, ecole, service, numérique, numerique, numrique, candidat, compétence, comptence, competence, recrutement, recruter, recrute, formation, thèse, these, thse]__

Puis on créé la signature vectorielle V0 de ce vocabulaire T0, qui va être un vecteur à N dimensions *(N=T0.length)* ou pour tout k=1..N, V0[k]=1, car chaque mot du vocabulaire apparaît par définition une fois.

Un fois ce vecteur obtenu, on va calculer la signature vectorielle de chaque mail à partir de ce vocabulaire de référence en regardant si les mots du vocabulaire apparaissent dans le contenu du mail.
On obtient alors un vecteur propre à chaque mail qui sera du type [1,0,0,0,1,1,0,...,0,1]

Autrement dit, __soit Ti le texte du mail Mi, si V0[j]⊂Ti, alors Vi[j]=1, sinon Vi[j]=0__


#### Classement

Une fois obtenues les signatures vectorielles de tous les mails, il suffit de calculer le coefficient du cosinus et renormaliser  afin d'obtenir un angle d'écart entre une signature vectorielle donnée et le vecteur du vocabulaire de référence

![Alt text](https://cdn.rawgit.com/compute-io/cosine-similarity/bdef940bf4e6d320d2652b52f54f58cf2ea5d794/docs/img/eqn_similarity.svg "formule de la similarité cosinusal") __= cosϴ__

Grâce au module `compute-cosine-similarity`, on obtient une valeur pour cosϴ comprise entre 0 et 1 pour chaque signature vectorielle de mail, __*et plus on se rapproche de 0, plus les vecteurs sont orthogonaux et plus on se rapproche de 1 et plus ils sont colinéaires*__, autrement dit plus le coefficient est élevé, plus le corps du mail comprend des éléments du vocabulaire de référence.

Il ne reste plus qu'à fixer un seuil en deça duquel on considère que le contenu du mail diffère trop du vocabulaire pour pouvoir être gardé comme intéréssant. Ici le seuil est fixé à __0.65__


#### Résultats

On avait définit un vocabulaire comprenant des mots issus des champs de l'informatique et du recrutement afin de ne garder que les mails correspondant à des offres de stages et assimilé.

Après calcul, on obtient bien la totalité des mails voulus à partir du corpus de mails originel qui contenait de nombreux spam. On récupère aussi quelques offres qui ne rentrent pas complètement dans la catégorie souhaitée comme des mails de Linkedin.

- __mails ok    : 202__
- __mails spam  : 1599__


#### Temps d'exécution ≃ 3,700ms

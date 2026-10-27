# Journal des modifications

Format inspiré de « Keep a Changelog ». Versions du jeu (`application/config/version`).

## [0.17.4] — 2026-10-27 — Des bilans clairs, un étage pour la direction

### Modifié
- **Le bilan de chaque période se lit en un coup d'œil** (onglet « En bref ») : une phrase
  (« Vous avez gagné / perdu X € cette période »), trois chiffres (l'argent sur le compte,
  les spectateurs et le remplissage, l'image du théâtre), puis « D'où vient ce résultat ? » :
  au plus six lignes (billets vendus, aides, spectacles, frais fixes, actions, imprévus…) dont
  la somme donne le résultat. Une seule phrase explique pourquoi le compte n'a pas bougé du
  même montant (sommes réglées plus tard), et un seul conseil pour la période suivante.
  Le détail des écritures reste dans l'onglet « Comptes ».
- **L'escalier du hall est retiré** : le hall retrouve son plan d'origine, avec une porte
  « ÉTAGE » à droite.

### Ajouté
- **L'étage de la direction**, entre le hall et le bureau : une **cage d'escalier** (escalier
  à tapis rouge, portraits des anciens directeurs, plan de l'étage), puis un **couloir** à trois
  portes : le **bureau de la direction**, les **toilettes** (cabines, lavabos) et les
  **archives** (bureau de l'archiviste, registres, fichier des spectacles, malle aux costumes).
  Les portes n'ont pas d'écriteau ; la flèche dorée montre toujours le chemin du bureau.
- **Un nouvel objet de collection** dans la malle des archives : la **redingote du premier
  directeur** (1923). La trouver débloque une **nouvelle tenue** pour le personnage
  (redingote rouge et haut-de-forme). La collection passe à 51 objets.

## [0.17.3] — 2026-10-27 — Un écran plus léger, une ligne directrice, un escalier

### Modifié
- **Le haut de l'écran est allégé** : l'encadré « Prochaines étapes » devient un petit bandeau
  sombre en haut à gauche — l'étape en cours, au plus une autre chose à faire en petit (le
  metteur en scène ou une mission), puis la période et le lieu. Le reste est dans le journal (J).
- **La carte en haut à gauche (trésorerie, publics, rayonnement) est retirée** : ses chiffres
  restaient obscurs. Ils restent accessibles par les boutons Budget et Bilans.
- **Ligne directrice** : chaque période se déroule en 4 étapes numérotées dans le bandeau
  (« Étape 1/4 » choisir les spectacles, « 2/4 » choisir les actions avec l'équipe, « 3/4 » la
  soirée, « 4/4 » le bilan), avec des phrases plus courtes.

### Ajouté
- **Un escalier d'honneur monte au bureau de la direction** depuis le hall : marches de chêne,
  tapis rouge à tringles dorées, rampes en laiton, plaque « BUREAU » ; en haut, l'arrivée de
  l'escalier devant la porte du bureau. On y marche sur le tapis.

## [0.17.2] — 2026-10-27 — Un vrai Paris

### Modifié
- **Le quartier parisien est entièrement redessiné**, avec une architecture qui ne ressemble
  plus à Bréval :
  - une grande rangée d'**immeubles haussmanniens** de six niveaux (deux fois plus hauts qu'à
    Bréval) : pierre de taille crème, balcons filants en fer forgé aux 2e et 5e étages,
    frontons sur l'étage noble, entresol, rez-de-chaussée à bossages, **toits de zinc à la
    Mansard** avec lucarnes et rangées de pots de cheminée orange ;
  - le **Théâtre des Lumières façon Opéra Garnier** (arcades, colonnes jumelées, bustes et
    groupes dorés, dôme de cuivre vert) et la **gare de l'Est** et sa grande verrière ;
  - la **Seine** avec ses quais de pierre, un pont, une péniche et un bateau-mouche ; sur
    l'autre rive, les toits, **Notre-Dame**, le **Sacré-Cœur** et une grande **tour Eiffel**
    sous un ciel de fin de journée ;
  - des **boulevards d'asphalte** avec marquage au sol, des **pavés de granit en éventail**,
    des trottoirs gris, des **platanes** sur grilles de fonte, des **candélabres** à deux
    lanternes, des bancs verts, un kiosque vert à dôme, la terrasse aux chaises en rotin, une
    fontaine Wallace, le métro Guimard, une grande fontaine dorée, et **les toits de Paris** au
    fond de la place ; deux rues pavées traversent la rangée vers les quais.

## [0.17.1] — 2026-10-26 — Un vrai bruit de porte, un extérieur sans ruissellement

### Modifié
- **Nouveau son de porte**, construit comme une vraie porte en bois : la poignée et le pêne (deux
  clics métalliques), l'air que le battant déplace et un léger frottement de gond, puis le
  battant qui frappe le chambranle (résonances d'un panneau de bois) et le pêne qui s'enclenche,
  avec un court écho de pièce. L'ancien son (bourdonnement synthétique) est remplacé.
- **Plus de bruit d'eau en continu dehors** : la fontaine de la place, la rivière, la pluie, le
  brouhaha du café et du marché sur la place, et les cigales sont retirés de l'extérieur (bruits
  filtrés qui sonnaient comme un ruissellement permanent). Dehors restent la musique, les
  oiseaux, les grillons la nuit, la fanfare du kiosque et les petits sons ponctuels (pigeons,
  canards, train). La pluie reste visible à l'écran.

## [0.17.0] — 2026-10-26 — Une création, et Paris

### Ajouté
- **Victor Lazare, metteur en scène en résidence** : chaque mois, il est ailleurs (terrasse du
  café, médiathèque, kiosque du parc, scène de la Fabrique, quais, maison de quartier, piano du
  café, hall du théâtre) et vous demande de trancher une étape de la création d'un spectacle :
  le sujet, la forme, la distribution, la scénographie, la musique, les costumes, les répétitions
  et le titre (3 options chaque fois). Les mois manqués se rattrapent ; au départ, Lazare tranche
  seul ce qui reste. Données : `data/story/creation.json` ; logique : `CreationSystem`.
- **Voyage à Paris** : après le bilan de la dernière période, la troupe est invitée au Théâtre des
  Lumières. Lazare attend sur le quai de la gare ; cinématique du train (la campagne défile, puis
  Paris au soleil couchant, la troupe parle de la première).
- **Un quartier parisien** à explorer : la place des Lumières (manège, fontaine Wallace, entrée de
  métro Guimard, kiosque, colonnes Morris avec votre affiche, terrasse du Café de la Comédie),
  la gare de Paris-Est, des immeubles haussmanniens, des ruelles, les quais de Seine avec les
  bouquinistes et la tour Eiffel sur l'autre rive ; la troupe et des Parisiens à qui parler
  (dont une critique) ; une valse musette à l'accordéon.
- **La première** : la salle comble, le rideau qui se lève sur le décor et les costumes choisis
  (9 mises en scène possibles), les rappels, puis la critique de la *Gazette des Planches*.
  L'accueil dépend de la qualité des choix, de leur **cohérence** (garder une même vision paie)
  et du rayonnement du théâtre ; chaque étape que Lazare a dû trancher seul coûte des points.
  Résumé sur l'écran de fin et dans le rapport de saison.

### Modifié
- **Le bandeau du haut devient « Prochaines étapes »** : l'étape en cours, le rendez-vous avec le
  metteur en scène (et où le trouver), les missions avec leur échéance, les missions proposées et
  l'enquête en cours. Il remplace l'ancien encadré des missions.
- Sauvegarde en version 4 (les anciennes parties sont migrées).

### Corrigé
- En ouvrant l'écran du monde, la musique du lieu était remplacée par celle du foyer.

## [0.16.2] — 2026-10-26 — Son plus propre

### Modifié
- **Portes** : retour au son de porte d'origine pour tous les bâtiments (les six sons par sorte
  de bâtiment de la 0.16.1 sont retirés).
- **Plus de grésillement de fond** : les nappes de bruit continu qui tournaient sous la musique
  sont supprimées — rumeur de la ville, vent, « air » de la salle, bourdonnement des coulisses —
  ainsi que le souffle de fond des oiseaux, du bureau et de la réserve. Restent des sons qui ont
  une forme : chants d'oiseaux, horloge, craquements, voix du café et du marché, eau près de la
  rivière et de la fontaine, grillons et cigales (plus discrètes) selon la saison.
- Pluie plus douce (gouttes sourdes, sans sifflement aigu) ; elle ne s'entend plus à l'intérieur.
- Hall vide : silence (le brouhaha n'apparaît qu'avec des spectateurs). Rivière un peu moins forte.

## [0.16.0] — 2026-10-26 — On entre partout : intérieurs, ruelles et façades refaites

### Ajouté
- **Tous les bâtiments de la ville s'ouvrent** : 27 intérieurs (gare, Fabrique, hôtel, mairie,
  café, imprimerie, boulangerie, cinéma, conservatoire, librairie, fleuriste, disquaire, galerie,
  médiathèque, halle, école, Ondine Énergie, collège, maison de quartier et les huit halls des
  tours des Coteaux), chacun avec son décor, son mobilier, sa musique, son ambiance et ses bruits
  de pas. Plans dans `tools/art/interiors_layout.py`, dessin dans `tools/art/interiors.py`.
- **28 nouveaux habitants** à l'intérieur (guichetière, patronne du café, imprimeur, boulangère,
  caissière du Rex, professeur de piano, galeriste, instituteur, gardienne des tours, CPE,
  bénévole…) et **54 sortes d'objets à examiner**, avec 109 nouvelles répliques : on y parle de tournées,
  de sorties scolaires, d'abonnements, de résidences, de publics éloignés.
- **On parle par-dessus le comptoir** : face à un comptoir, c'est la personne derrière qui répond
  (au clavier comme à la souris).
- **Ruelles** : 16 passages pavés entre les bâtiments (avec fils de lanternes allumés la nuit) et
  une cour des artisans derrière la place ; on peut désormais passer entre les immeubles.
- Les actions de gestion situées dans un bâtiment (l'imprimerie) se signalent sur sa porte.

### Modifié
- **Façades redessinées** : fenêtres avec linteau, appui, reflet et volets ; enseignes toujours
  au-dessus, jamais sur une fenêtre ; vitrines bornées aux murs ; portes encadrées de pierre avec
  marche ; corniches, pilastres, soubassement ; ombre portée au pied des façades ; appliques
  douces la nuit. La mairie, le conservatoire, l'école et les tours ont été repris.
- Rien (arbre, lampadaire, poubelle) devant une porte ni au débouché d'une ruelle.
- Les descriptions « devant le bâtiment » sont passées à l'intérieur (mêmes identifiants : la
  collection et les enquêtes fonctionnent comme avant).

### Corrigé
- Fenêtres en double sur la mairie ; enseignes posées sur des fenêtres (hôtel, halle, Ondine,
  conservatoire) ; colonnes et notes du conservatoire sur les fenêtres ; vitrines débordant des
  murs ; arbres devant les portes ; taches sur les tours ; devise de l'école sur les fenêtres ;
  fenêtres du rez-de-chaussée de la Fabrique sur ses panneaux ; halos blancs trop forts la nuit.

## [0.15.0] — 2026-10-26 — Ambiance sonore, ville vivante et prologue

### Ajouté
- **Prologue** au lancement de la toute première partie : l'histoire de la Lanterne en neuf
  tableaux illustrés (1902, la création de 1924 et la lanterne disparue, l'âge d'or, le déclin,
  la direction qu'on vous confie, l'équipe), avec musique et sons ; passable à tout moment (Échap),
  à revoir depuis le menu principal. Textes dans `data/story/prologue.json`.
- **Nouvelles musiques** : Bréval le jour (swing musette), la nuit (piano feutré), version des
  fêtes (grelots, glockenspiel), la réserve (boîte à musique), fanfare du kiosque. Fondus enchaînés.
- **16 ambiances en boucle** : ville, oiseaux, vent, pluie, cigales, grillons, rivière, fontaine,
  café, marché, foule du hall, salle, coulisses, bureau (horloge), réserve (craquements), fanfare.
  Elles se mélangent selon le lieu, le quartier, la saison, l'heure et la météo, et le bruit de la
  rivière monte quand on s'en approche. Sons localisés : fontaine, café, marché, fanfare, canards,
  pigeons, train.
- **Bruits de pas** selon le sol (pavés, herbe, bois, tapis, béton, neige) ; sons de portes, de
  verrou, de bus, de cloche (début de période), de découverte selon la rareté, d'indice et
  d'enquête ; petite « voix » pendant les dialogues.
- **Moment de la journée** : matin doré, journée, fin de journée orangée (les lampadaires
  s'allument), nuit. **Météo** reproductible par période : pluie (automne, printemps, parfois
  l'été), neige ou ciel clair l'hiver.
- **Ville vivante** : ombres de nuages, vols d'oiseaux, lucioles les nuits d'été au parc,
  poussière dans la réserve et les coulisses, lampadaires qui vacillent, **train qui entre en
  gare et repart** (sifflet, roulement).
- Réglage de volume **« Ambiance »** dans les paramètres.

## [0.14.0] — 2026-10-26 — La collection de la Lanterne

### Ajouté
- **Collection permanente de 50 objets** en 5 familles de 10 (archives, costumes et accessoires,
  décors et scénographie, trésors techniques, légendes du spectacle vivant), 5 raretés (20 communs,
  15 peu communs, 10 rares, 4 légendaires, 1 mythique) et 6 modes d'obtention (14 exploration,
  12 missions, 8 rencontres, 6 énigmes et secrets, 5 développement du théâtre, 5 événements).
  Catalogue central `data/progression/collection.json`, registre `docs/COLLECTION.md` généré et
  vérifié par `tools/collection_registry.py`, 50 illustrations originales.
- **5 enquêtes** sans échéance : « Les archives oubliées », « La restauration », « Le collectionneur
  mystérieux », « Le rideau d'origine », « La représentation perdue » (objet mythique).
- **Une réserve secrète** sous les coulisses, fermée à clé jusqu'à l'enquête de Fernand.
- **Deux personnages** : Fernand, ancien régisseur (enquête, un indice précis par période) et le
  collectionneur (à partir de la 3ᵉ période).
- **Secrets** : cachettes qui ne livrent rien sans l'indice qui y mène ; énigme du poète en trois
  lieux ; trappe du plateau qui ne s'ouvre qu'un soir de spectacle.
- **Indices progressifs** (3 niveaux), **carnet d'indices**, enquêtes dans le panneau des missions,
  bulle « ? » au-dessus des personnes qui ont du nouveau, bulle « ! » près d'un objet à ramasser.
- **Découvertes** : vignette pour les objets communs, présentation au centre pour les rares,
  légendaires et le mythique.
- **Exposition** : 6 places dans les vitrines du hall (à la place des banquettes).
- **Récompenses décoratives** : tenues (5 et 20 objets, chaque famille complète), guirlande de
  lanternes dans le hall (10), distinctions (25 et 50).
- Les décisions d'événement sont désormais notées avec leur identifiant (anciennes sauvegardes
  compatibles : les objets liés ont une seconde voie d'obtention).

### Modifié
- L'album de cartes de la 0.13 est remplacé par la collection (limite de 50 objets demandée) ; les
  deux anciens trésors qui existent encore (masque d'Arlequin, billet d'Avignon) sont repris
  automatiquement.

## [0.13.0] — 2026-10-26 — L'Album de Bréval : collectionner, revenir

### Ajouté
- **Album de collection (95 cartes)** conservé d'une partie à l'autre : 20 rencontres (parler
  aux gens), 43 lieux (les examiner), 20 affiches (programmer chaque spectacle, au fil des
  parties) et 12 **trésors cachés** dans la ville et le théâtre (étincelles à ramasser) qui
  racontent l'histoire du théâtre et des politiques culturelles (Vilar, Avignon, Malraux, Jeanne
  Laurent, Molière, commedia dell'arte, 1 % artistique, intermittence…).
- Raretés (commune, rare, légendaire), cartes manquantes en silhouette avec un indice, vignette
  « Nouvelle carte ! » qui glisse à l'écran, pastille des cartes non vues.
- **6 tenues pour le directeur** débloquées par paliers (8, 20, 35, 55 cartes, tous les trésors).
- Accès : bouton « album » du monde, touche C, menu pause, menu principal (avec le compteur).

### Modifié
- **Moins de lecture** : 36 répliques raccourcies à une idée (120 caractères au plus), nom de la
  personne plus répété dans sa bulle, annonce des missions réduite à une ligne. Les notions
  détaillées passent dans les cartes de l'album, à lire quand on veut.

## [0.12.0] — 2026-10-26 — Bréval-sur-Ondine, une grande ville à explorer

### Ajouté
- **La place devient une ville entière** (112 × 80 cases, 14 fois l'ancienne place) : quartier de
  la Gare (train, friche culturelle La Fabrique, hôtel), bords de l'Ondine (rivière, ponts,
  bateaux, pêcheur), parc (étang et canards, kiosque à musique, aire de jeux, buvette), centre-ville
  autour de la place de la Lanterne (mairie, café, imprimerie, boulangerie, marché, kiosque à
  journaux, statue), quartier des Arts (cinéma Le Rex, conservatoire, librairie, fleuriste,
  disquaire, galerie), boulevard Louise-Michel (médiathèque, halle, école, siège d'Ondine Énergie)
  et quartier des Coteaux (résidences, collège, maison de quartier, city stade, jardins partagés,
  fresque participative).
- **28 bâtiments dessinés**, tous différents, avec enseignes ; rangées de maisons (façades, volets,
  cheminées), voitures, étals, abribus, vélos, bancs, poubelles, haies… en 4 saisons, illuminations
  des fêtes et éclairage de nuit ; reflets animés de l'eau, étang gelé en hiver, pigeons sur la place.
- **29 habitants**, dont 15 nouveaux personnages (principale du collège, animateur de la maison de
  quartier, directrice d'Ondine Énergie, chef de gare, maraîchère, bibliothécaire, libraire,
  programmateur du cinéma, enfants…) et **76 nouvelles répliques** qui glissent des notions du
  secteur : friche et tiers-lieu, résidence, label Art et Essai, conservatoires classés, prix
  unique du livre, PEAC et pass Culture, mécénat (60 %), droits culturels, éducation populaire,
  mobilité des publics…
- **Bus** : 5 arrêts reliant les quartiers (voyage instantané).
- **Plan de la ville** (touche M ou bouton « plan ») : quartiers, théâtre, arrêts, position du
  joueur et objectif. Le nom du quartier s'affiche quand on y entre.

### Modifié
- Icônes des raccourcis en haut à droite agrandies (elles étaient trop petites).
- Particules de saison (feuilles, neige, pétales) qui suivent la caméra.
- `tools/art/city_layout.py` écrit le plan de la ville dans `data/world/world.json` ;
  `tools/art/city.py` le dessine (appelé par `generate_art.py`).

## [0.11.0] — 2026-10-26 — Une vraie saison de jeu, pensée pour la formation

### Ajouté
- **4 scénarios-études de cas** au choix (première saison, redressement, territoire, création),
  avec situation de départ, engagements propres, fiche d'étude de cas et questions de débriefing.
- **16 missions** confiées par les personnages (bulles « ? », journal de bord) : objectifs,
  échéances, récompenses, pénalités, débriefing « à retenir » par la personne concernée.
- **5 dossiers de compétences** générés à partir de la partie et corrigés avec le calcul :
  budget prévisionnel, seuil de rentabilité, cession ou coréalisation, résultat ou trésorerie,
  mécénat. Mode entraînement.
- **5 compétences** à 3 niveaux, avec avantages débloqués ; **12 trophées**.
- **Journal de bord** (touche J) : missions, compétences, trophées, étude de cas.
- **Rapport de saison téléchargeable** (Markdown) pour l'enseignant·e ; onglet « Missions » du
  bilan ; écran de fin enrichi.
- `docs/GUIDE_ENSEIGNANT.md` ; rapports d'équilibrage par scénario ; source S16 (contreparties
  du mécénat).

### Modifié
- Sauvegarde en version 3, migration automatique des parties 0.9 et 0.10.
- Simulation : choix du scénario (`--scenario`), missions réussies par stratégie ; les joueurs
  automatiques acceptent les missions et rendent les dossiers.

## [0.10.0] — 2026-10-26 — Le théâtre à explorer

### Ajouté
- **Monde explorable** en vue de dessus (pixel art 16 bits) : place de la Lanterne (mairie, café,
  imprimerie, colonne Morris, fontaine), hall, grande salle, coulisses, bureau. Déplacement case
  par case au clavier (flèches, ZQSD) ou à la souris (chemin automatique), portes, caméra.
- **Les étapes se jouent sur place** : cahier de la période au bureau ; actions décidées auprès
  d'Inès, Bastien, Hélène, M. Pommier, de l'imprimerie et de la billetterie ; le personnage de
  l'événement vient trouver le joueur ; **soirée de représentation dans la salle** (public assis
  selon le remplissage réel, comédiens, projecteurs) ; bilan à la nuit tombée.
- **Environnements qui changent** : quatre saisons (feuilles, neige, fleurs, été) avec particules,
  guirlandes des fêtes, nuit les soirs de spectacle, affiches de la programmation sur la façade,
  la colonne Morris et dans le hall, foule du hall selon la fidélité.
- **Personnages vivants** : promenades, répliques selon l'état du théâtre (48 répliques).
- **Rénovations** (5 investissements) : projecteurs LED, foyer-bar, accessibilité, enseigne
  lumineuse, loges et atelier. Prix en trésorerie, amortissement dans le résultat, effets
  durables, décor modifié. Nouvelle notion « Investissement et amortissement » (source S15).
- **Interface façon jeu de rôle** : boîte de dialogue avec portrait et réponses, objectif toujours
  affiché avec flèche dorée, bulles « ! », coches et marteaux, menu, fenêtre « État du théâtre ».
- Accueil guidé d'Hélène au premier lancement ; paramètre **« vue tableau de bord »** pour jouer
  sans se déplacer.
- Stratégie de simulation « batisseur » ; tests du monde (accessibilité à pied, période complète
  jouée à pied, saison entière, rénovation, clic) : **112 tests**.

### Modifié
- Sauvegarde en version 2 (rénovations), avec migration automatique des parties 0.9.
- Grand livre : écritures « sans mouvement d'argent » (amortissements).

## [0.9.0] — 2026-10-25 — Première version complète

### Ajouté
- **Projet Godot 4.7.2** (GDScript typé, rendu Compatibilité, 1280×720, pixel art).
- **Boucle de jeu complète** sur 8 périodes : situation → programmation → gestion → événement →
  résolution animée → bilan, puis bilan de fin de saison.
- **Moteur économique** (`scripts/economy/`) : grand livre distinguant engagement et règlement,
  résultat vs trésorerie, recettes attendues vs encaissées, TVA (5,5 % / 2,1 %), droits d'auteur,
  contrats de cession, coréalisation, coproduction, charges fixes et variables, subvention en
  trois tranches dont une conditionnelle, découvert et faillite.
- **20 propositions artistiques**, **6 actions de gestion**, **19 événements narratifs** avec choix
  aux effets distincts et paris probabilistes, **5 personnages** avec 4 humeurs chacun.
- **Dialogues** via Dialogue Manager 4.1.0 (`dialogue/*.dialogue`), dont un accueil guidé.
- **Carnet du directeur** : 27 notions (dans le jeu / dans la réalité / sources), liens « ? »
  contextuels partout dans l'interface.
- **9 fins** de saison, enseignements générés, décisions marquantes, courbes, « rejouer la même saison ».
- **Trois difficultés** et graine de partie facultative (saisons reproductibles).
- **Sauvegarde** JSON versionnée avec somme de contrôle, copie de secours, migrations, sauvegarde
  automatique à chaque étape.
- **Paramètres** : volumes séparés, réduire les animations, police très lisible (thème dédié),
  plein écran, conseils de prise en main.
- **Direction artistique originale** générée par code : salle et façade du théâtre, rideau animé,
  public, comédiens, 20 affiches, 28 icônes, 20 portraits, thème d'interface velours/bois/or.
- **Audio original** synthétisé : 10 sons d'interface, valse du menu, boucle d'ambiance.
- **Tests GdUnit4 6.2.2** : 87 cas (économie, parties, événements, stratégies, sauvegarde,
  données, interface).
- **Outils** : simulation multi-stratégies, rejeu de saison, captures d'écran, sonde de mise en page,
  vérification de compilation, construction du thème.
- **Documentation** : README, GDD, architecture, modèle économique, format des données, audit des
  plugins, sources, licences, QA, feuille de route.

### Livraison
- Modèles d'export compilés depuis les sources (Linux, Windows sans D3D12, Web sans threads) ;
  exports Linux, Windows et Web produits ; autotest `-- --smoke-test` pour vérifier un export.
- Police de repli DejaVu Sans pour les symboles absents des polices pixel.

### Corrigé pendant le développement (trouvé par les tests, la simulation, les revues ou les captures)
- Estimations : une représentation fantôme était comptée hors programmation.
- Touche Entrée qui déclenchait le bouton d'étape caché sous une fenêtre ouverte.
- Étapes du tour appelables dans le désordre (double validation, résolution sans décision).
- Sauvegarde : somme de contrôle contournable en changeant la version ; types non validés.
- Export Web : Dialogue Manager cassé par un filtre d'export trop large (vu dans le navigateur).
- Symboles (▸, ★, ✓, flèches) affichés comme des carrés.
- Blocage de progression quand la trésorerie était trop basse pour « ne rien faire ».
- Débordements d'interface sur les titres et réponses longs.
- Ligature « fi » de Pixelify Sans affichée comme un « A ».
- Fenêtres modales non centrées.
- Saturation des indicateurs (rendements décroissants ajoutés).
- Difficulté « Exigeant » injouable (58 % de faillites) → rendue difficile mais gagnable.

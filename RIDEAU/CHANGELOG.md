# Journal des modifications

Format inspiré de « Keep a Changelog ». Versions du jeu (`application/config/version`).

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

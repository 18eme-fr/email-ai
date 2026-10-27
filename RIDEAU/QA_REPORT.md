# Rapport d'assurance qualité — RIDEAU ! v0.17.6

Date : 27 octobre 2026 (v0.17.6 : hall sans brouhaha ; v0.17.5 : plaque du hall retirée ; v0.17.4 : bilans « en bref », étage de la direction, redingote ; v0.17.3 : bandeau allégé, étapes numérotées, escalier ; v0.17.2 : Paris redessiné ; v0.17.1 : son de porte, extérieur sans ruissellement ; v0.17.0 : metteur en scène, voyage à Paris ; v0.16.2 : son de porte d'origine, plus de grésillement ; v0.16.0 : intérieurs, ruelles, façades ; v0.15.0 : son, ambiance, prologue ; v0.14.0 : collection de 50 objets ; v0.13.0 : album de collection ; v0.12.0 : grande ville ; v0.11.0 : scénarios, missions, dossiers, compétences ; v0.10.0 : monde explorable ; v0.9.0 le 25 octobre). Environnement : conteneur Linux, **Godot 4.7.2-stable compilé depuis les
sources**, rendu réel OpenGL (Mesa llvmpipe) sous Xvfb, Chromium (Playwright) pour la version Web.
**Tout ce qui est indiqué « réussi » a été réellement exécuté.**

## 1. Tests automatisés (GdUnit4 6.2.2)

Commande : `GODOT_BIN=… xvfb-run -a ./addons/gdUnit4/runtest.sh -a res://tests -c`
Résultat de la dernière exécution : **163 cas, 0 échec, 0 erreur, 0 orphelin.**

| Suite | Cas | Ce qui est vérifié |
|---|---|---|
| `economy/test_ledger.gd` | 8 | Un seul débit par écriture ; engagé ≠ payé ; recette attendue ≠ encaissée ; montants négatifs ou nuls refusés ; TVA neutre ; écritures conditionnelles confirmées ou annulées |
| `economy/test_show_economics.gd` | 10 | TVA 5,5 % / 2,1 %, droits d'auteur, cession vs coréalisation, **places ≤ jauge** (y compris demande ×5), fourchettes ordonnées, effet du prix et de la communication, salle pleine non rentable, incidents, nombre exact de représentations |
| `economy/test_turn_resolver.gd` | 7 | Variation de trésorerie = encaissements − décaissements ; résultat = produits − charges ; **aucun double comptage sur une saison entière** ; TVA et droits payés à la période suivante ; spectacle annulé sans recette ; faillite sous le découvert autorisé ; rapport explicatif |
| `gameplay/test_game_session.gd` | 12 | Début de partie, difficultés, saison complète de 8 rapports, saison « passive » résolue sans blocage, même graine = même saison, graines différentes = saisons différentes, règles de programmation, capacité d'actions, dépenses impossibles refusées **mais « ne rien faire » toujours permis**, effets des actions, offres renouvelées, pas de double résolution |
| `gameplay/test_events.gd` | 12 | Événements forcés (bilan de mi-saison, alerte de trésorerie), événements uniques, conditions, **chaque choix a des effets différents**, effets appliqués, pas de double choix, choix bloqués, paris reproductibles, solde conditionnel de subvention, ordre des étapes imposé, retour en arrière |
| `gameplay/test_strategies.gd` | 5 | Stratégies équilibrée et artistique viables ; ne rien faire ne gagne jamais ; stratégie purement rentable échoue aux missions ; jeu aléatoire rarement gagnant ; ≥ 5 fins atteignables |
| `persistence/test_save_system.gd` | 13 | Aller-retour exact, partie rechargée qui se poursuit à l'identique, fichier corrompu → copie de secours **avec message**, fichier modifié détecté, sauvegarde absente, état incomplet, types invalides sans plantage, version future refusée, migration d'ancienne version, rétrogradation de version sans contourner la somme de contrôle, écriture ratée sans perte, **sauvegarde 0.9 migrée (rénovations vides)**, rénovations conservées |
| `data/test_data_integrity.gd` | 9 | Chargement des JSON, champs et bornes des spectacles, actions, correspondance événements ↔ dialogues, compilation des `.dialogue` par Dialogue Manager, réponses disponibles pour chaque événement, notions et sources, portraits, fins |
| `economy/test_upgrades.gd` | 7 | Rénovations : le prix touche la trésorerie et **jamais le résultat**, l'amortissement touche le résultat et **jamais la trésorerie** ; achat unique et seulement avant l'événement ; refus si le découvert serait dépassé ; effets et recettes à chaque période ; achat tardif amorti sur les seules périodes restantes |
| `world/test_world.gd` | 16 | Cartes rectangulaires et légende, portes praticables avec retour, **tout objet, personnage et porte accessible à pied**, chemins qui contournent les personnages, chaque action et rénovation a un lieu, saisons, répliques pour tous, réplique la plus spécifique choisie, objectif qui suit les étapes, actions décidées une à une (capacité, étape) ; **ville : ≥ 6 quartiers couvrant chaque case praticable, ≥ 25 habitants, arrêts de bus reliés à pied au théâtre** ; sprite pour chaque personne |
| `ui/test_world_screen.gd` | 15 | **Une période complète jouée à pied** (bureau, Hélène, porte, événement qui vient au joueur, soirée dans la salle, bilan, retour au bureau) ; **une saison entière à travers le monde** (4 saisons, fin de saison) ; rénovation achetée sur place et pas deux fois ; clic pour marcher ; objectif et période affichés ; **étude de cas au lancement** ; **mission acceptée en parlant puis dossier réussi** ; fenêtre de dossier qui refuse une copie incomplète et affiche la correction ; journal (onglets, acceptation) et rapport de saison ; **bus de la place aux Coteaux, nom du quartier affiché, plan de la ville ouvert et fermé** ; **collection jouée dans le monde : un objet offert en parlant, un objet ramassé une seule fois (il ne réapparaît pas), porte de la réserve fermée puis ouverte avec la clé de Fernand, enquête « Les archives oubliées » de bout en bout, trappe qui ne s'ouvre qu'un soir de spectacle (objet mythique), objets exposés dans les vitrines du hall** ; **son et atmosphère : musique et ambiances de la ville, sources sonores localisées, nuit (lumière, musique de nuit), ambiance de la réserve et fondu de la ville, train qui part et revient** |
| `ui/test_prologue.gd` | 2 | Données du prologue complètes (images, textes courts, musiques, ambiances, sons) ; les neuf tableaux s'enchaînent avec leur musique ; Échap passe le prologue et le note comme vu, sans modifier les réglages enregistrés |
| `progression/test_collection.gd` | 14 | **Quotas exacts** (familles, raretés, modes d'obtention), 51 identifiants et 51 illustrations uniques ; **toutes les références existent** (personnes, lieux, cases accessibles à pied, missions, rénovations, trophées, événements et choix, dossiers) ; **les 51 objets réellement obtenables** par leurs déclencheurs ; jamais deux fois le même objet ; prérequis et secrets (rien sans l'indice, trappe fermée le jour, enquête secrète qui ne se trahit pas) ; ordre des étapes d'enquête ; alternatives aux missions ; décisions d'événement enregistrées ; sauvegarde et rechargement ; profil abîmé et migration de l'album 0.13 ; indices progressifs et conseil de Fernand (un par période) ; récompenses par paliers et par famille ; exposition sans perte ; **saison complète : la collection ne change ni la trésorerie ni les indicateurs** |
| `progression/test_progression.gd` | 20 | Cohérence des scénarios, missions, compétences et trophées ; **chaque dossier bien formé, réponse parfaite = 100 %, réponse fausse < 100 %** (6 tirages par dossier) ; seuil de rentabilité recalculé avec le moteur économique ; chiffres différents à chaque tentative mais reproductibles ; entraînement sans expérience ; missions proposées selon le scénario, réussite par dossier, par métrique, à l'échéance, par progression depuis l'acceptation, pénalité en cas d'échec, limite de 3 missions, refus ; spectacle demandé ajouté aux propositions ; niveaux et avantages (propositions, coûts, découvert) jusque dans le grand livre ; départ et objectifs propres à chaque scénario ; **une saison complète par scénario** ; trophées uniques ; sauvegarde et migration |
| `ui/test_ui.gd` | 13 | Formatage des nombres, boutons du menu, Paramètres et Crédits, « Continuer » activé après sauvegarde, **une période complète jouée à travers l'interface**, montant affiché, fenêtres ouvertes/fermées au clavier (Échap), Entrée inactive sous une fenêtre modale, chaque étape se construit, **tous les écrans tiennent en 1280×720 (police pixel et police lisible)**, tailles de texte ≥ 13 px, écran de fin |

## 2. Simulation d'équilibrage (`tools/simulate.gd`)

200 saisons par stratégie, par difficulté et par scénario (rapports complets dans `docs/BALANCE_REPORT*.md`).
Les joueurs automatiques acceptent les missions et répondent juste à 75 % des questions des
dossiers (40 % pour le joueur au hasard).

Scénario « La première saison » selon la difficulté :

| Stratégie | Découverte | **Standard** | Exigeant |
|---|---|---|---|
| Équilibrée | 100 % | **100 %** | 91 % |
| Bâtisseuse (équilibrée + rénovations) | 100 % | **99 %** | 79 % |
| Artistique | 100 % | **95 %** | 51 % |
| Publics | 100 % | **91 %** | 36 % |
| Prudente (rentabilité seule) | 0 % | **0 %** | 0 % |
| Aléatoire | 43 % | **35 %** | 17 % |
| Passive | 0 % | **0 %** | 0 % |

Scénarios en difficulté Standard :

| Stratégie | Sauver la Lanterne | Territoire | Création |
|---|---|---|---|
| Équilibrée | 62 % | 100 % | 70 % |
| Bâtisseuse | 62 % | 99 % | 48 % |
| Artistique | 34 % | 60 % | **75 %** |
| Publics | 23 % | **95 %** | 39 % |
| Prudente | 5 % | 0 % | 0 % |
| Aléatoire | 6 % | 2 % | 2 % |
| Passive | 0 % | 0 % | 0 % |

(pourcentage de conventions renouvelées ; 5,5 à 6,9 missions réussies en moyenne pour les
stratégies actives). Chaque scénario favorise une approche différente : publics pour
« territoire », création pour « création », gestion prudente et équilibrée pour le redressement.
Aucune stratégie triviale ne gagne. « La première saison » est volontairement accessible
(niveau Découverte) ; les missions la rendent plus facile qu'en v0.10.

## 3. Vérifications manuelles et visuelles

- Captures réelles de chaque écran (`docs/screenshots/`), relues une à une, dont le monde
  explorable : bureau, hall, place en automne et en hiver (fêtes, enseigne), coulisses, dialogue
  avec réponses, fenêtre d'étape, soirée dans la salle, menu.
- v0.17.6 : brouhaha de foule retiré du hall ; test : le hall plein de monde n'a aucune ambiance en plus de la musique. Son non écouté (pas de sortie audio dans le conteneur).
- v0.17.5 : capture du hall relue (porte de l'étage sans plaque) ; 184 tests verts.
- v0.17.4 : captures relues (bilan « En bref » à la période 1 et 5, hall, cage d'escalier,
  couloir, toilettes, archives, sprite de la redingote). Défauts trouvés et corrigés : conseil du
  bilan coupé sous le bouton (ligne d'événement en double retirée, espacements resserrés),
  haut-de-forme trop plat (agrandi). Tests ajoutés : les lignes du bilan « en bref » totalisent le
  résultat, conseil adapté à une relâche ; l'étage (hall → escalier → couloir → bureau, toilettes,
  archives) et plus de marche dans le hall ; la redingote débloque sa tenue. 184 tests verts.
- v0.17.3 : captures relues (place, hall avec l'escalier, bureau). Défauts trouvés et corrigés :
  marches illisibles sous le tapis (nez de marche et tringles renforcés), plaque « DIRECTION »
  coupée (devenue « BUREAU »), objectif sur trois lignes (phrases raccourcies). Tests ajoutés :
  l'objectif commence par « Étape 1/4 », l'escalier mène au bureau et se marche sur un tapis.
- v0.17.2 : Paris redessiné ; plan complet et captures en jeu relus (arrivée à la gare, boulevard
  et théâtre, quais de Seine, place). Défauts trouvés et corrigés : rangée d'immeubles qui coupait
  l'accès aux quais (deux rues percées), deux personnages posés sur un candélabre et un platane,
  tache claire entre les pieds de la tour Eiffel, porte du café sur son enseigne, guirlandes qui
  ressemblaient à des confettis sur le trottoir.
- v0.17.1 : signalé par le porteur de projet : son de porte peu réaliste et « ruissellement d'eau
  en continu » dehors. Cause du second : fontaine de la place (bruit filtré + bulles), rivière,
  pluie, brouhaha du café et du marché (bruit découpé en syllabes) et cigales, tous joués en
  continu. Retirés de l'extérieur ; test : aucune ambiance continue dehors sauf la fanfare. Nouveau
  son de porte vérifié par mesure (clics à -34 dB, choc à -13 dB, extinction propre) et
  spectrogramme ; les autres bruitages sont identiques à avant. **Non écouté** (pas de carte son).
- v0.17 : captures relues (guide « Prochaines étapes », Lazare et sa question, quai de la gare,
  Paris place et quais, train, première, critique). Défauts trouvés et corrigés : voie ferrée et
  herbes cachées sous la bande de dialogue du train, légende à moitié écrite derrière la critique,
  noms des boutiques parisiennes sous les portes, Tour Eiffel posée sur la Seine, bandes de briques
  entre les immeubles, missions encore listées après la fin de saison, musique du lieu écrasée à
  l'ouverture du monde (défaut ancien). Tests ajoutés : logique de la création (une étape par mois,
  rattrapage, choix par défaut, cohérence récompensée, chaque vision peut triompher, déterminisme),
  migration de sauvegarde v3 → v4, rencontre avec Lazare, départ pour Paris, quartier parisien,
  train et première (180 tests).
- v0.16.2 : grésillement de fond signalé par le porteur de projet. Cause : des nappes de bruit
  filtré jouées en continu sous la musique (ville, vent, salle, coulisses, et un souffle dans les
  oiseaux, le bureau et la réserve). Supprimées ; mesure après correction : entre deux sons, les
  ambiances oiseaux, bureau et réserve sont au silence numérique (plancher -180 dB). Test ajouté :
  aucun lieu, à aucune saison, heure ou météo, ne demande une nappe de bruit. Le son de porte
  d'origine est rétabli (fichier identique à la v0.16.0). **Non écouté** (pas de carte son ici).
- v0.16 : planches de rendu des 20 décors d'intérieur et des façades relues une à une, captures
  en jeu (café, gare de nuit, cinéma, mairie, hall de tour, ruelle de jour et de nuit). Défauts
  trouvés et corrigés : mur du fond trop bas (cadres qui débordaient sur le plafond), tapis
  échancré à la mairie, caisse du cinéma illisible sur la moquette, une habitante placée sur un
  banc, mobilier au débouché des ruelles ; plus tous les défauts de façades listés au CHANGELOG.
  Tests ajoutés : chaque bâtiment ouvre sur un intérieur, chaque objet et chaque personne a des
  répliques, son et pas des intérieurs, décors présents, entrée dans le café et dialogue par-dessus
  le comptoir.
- v0.15 : sons vérifiés par mesure (aucun fichier silencieux ni saturé, boucles sans saut au raccord — une couture trouvée et corrigée dans le brouhaha du hall — spectrogrammes relus) ; captures du prologue, de la fin de journée, de la pluie et de la nuit. Défauts trouvés et corrigés : bande noire du prologue absente, un test qui enregistrait « réduire les animations » dans les réglages (masquait pluie et lucioles), lucioles sous la pluie. **Les sons n'ont pas pu être écoutés** (pas de carte son dans l'environnement).
- v0.12 : captures de la ville (place en 3 saisons, quartier des Arts, Coteaux, parc en hiver,
  gare de nuit, plan) relues. Défauts trouvés et corrigés : horloge de la gare sur l'enseigne,
  devise de l'école coupée, arbres bloquant le débouché de passages piétons, arrêt « Les
  Coteaux » compté dans le mauvais quartier, icônes des raccourcis trop petites, nom du parc en
  double sur le plan.
- Défauts trouvés sur ces captures et corrigés : lettres absentes de la petite police des
  enseignes (« AIRIE »), cadre d'affiche masquant le panneau de la billetterie, objectif hors
  écran, boîte de dialogue débordant en bas, menu trop court, mur mal dessiné dans la salle.
- Contrastes des couleurs de texte calculés : **toutes les paires de texte ≥ 4,5:1 (WCAG AA)**,
  sauf boutons désactivés (exemptés).
- Couverture des glyphes : toutes les lettres accentuées françaises présentes ; symboles (flèches,
  étoiles, ✓, ⚠, ▸) fournis par la police de repli DejaVu Sans.
- Deux revues de code automatisées (moteur, interface) : 20 remarques, toutes traitées
  (voir `CHANGELOG.md`).

## 4. Exports

| Plateforme | Produit | Vérification réelle |
|---|---|---|
| Linux x86_64 | `RIDEAU.x86_64` (93 Mo) | **Autotest** (`-- --smoke-test`) : données, dialogue, **monde (38 cartes, création et première, décors de chaque intérieur, scène)**, collection (51 objets), saison complète avec missions et dossiers, sauvegarde → SUCCÈS (v0.17.6) |
| Web (WebGL 2, sans threads) | `index.html` + `.wasm` + `.pck` | Chargé dans Chromium (v0.17.6) : menu, choix du scénario, monde ; (v0.11.0) transmission du rapport de saison à la page — **0 erreur console** ; publié en lien privé (moteur découpé en 3 morceaux de moins de 15 Mo, réassemblés au chargement) |
| Windows x86_64 | `RIDEAU.exe` (86 Mo) | Export sans erreur. **Non lancé** : pas de Windows dans l'environnement |
| macOS | préréglage fourni | **Non produit** : nécessite un Mac (modèles et signature Apple) |

Les modèles d'export ont été compilés depuis les sources Godot 4.7.2 (Windows sans Direct3D 12,
inutile en rendu Compatibilité).

## 5. Limites connues

- Pas de test de jeu humain à ce stade : l'équilibrage repose sur des stratégies automatiques.
- Version Windows non testée en exécution ; version macOS à produire depuis un Mac.
- Le son n'a pas pu être écouté (environnement sans carte son) : les fichiers sont générés et
  chargés sans erreur, leur rendu est à valider à l'oreille.
- Seule la résolution de référence 1280×720 est testée automatiquement ; les autres résolutions
  passent par la mise à l'échelle de Godot.
- À très petite taille, le « î » de la police pixel ressemble à un « i » (option « police très
  lisible » disponible).
- Le serveur MCP Godot recommandé n'a pas été installé (voir `PLUGINS_AUDIT.md`).
- Missions et dossiers : jamais testés avec de vrais étudiant·e·s ; la difficulté des dossiers
  et la durée des missions sont à ajuster après un premier usage en cours.
- Monde explorable : les déplacements ont été testés par programme et sur captures, pas encore
  « à la manette » par un humain ; la sensation de déplacement (vitesse, réactivité) est à valider
  en jouant. Pas de manette prise en charge pour l'instant (clavier et souris uniquement).
- La position du joueur dans le monde n'est pas sauvegardée : une partie reprise recommence au
  bureau (l'étape de gestion, elle, est bien conservée).

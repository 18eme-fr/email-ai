# Rapport d'assurance qualité — RIDEAU ! v0.11.0

Date : 26 octobre 2026 (v0.11.0 : scénarios, missions, dossiers, compétences ; v0.10.0 : monde explorable ; v0.9.0 le 25 octobre). Environnement : conteneur Linux, **Godot 4.7.2-stable compilé depuis les
sources**, rendu réel OpenGL (Mesa llvmpipe) sous Xvfb, Chromium (Playwright) pour la version Web.
**Tout ce qui est indiqué « réussi » a été réellement exécuté.**

## 1. Tests automatisés (GdUnit4 6.2.2)

Commande : `GODOT_BIN=… xvfb-run -a ./addons/gdUnit4/runtest.sh -a res://tests -c`
Résultat de la dernière exécution : **136 cas, 0 échec, 0 erreur, 0 orphelin.**

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
| `world/test_world.gd` | 11 | Cartes rectangulaires et légende, portes praticables avec retour, **tout objet, personnage et porte accessible à pied**, chemins qui contournent les personnages, chaque action et rénovation a un lieu, saisons, répliques pour tous, réplique la plus spécifique choisie, objectif qui suit les étapes, actions décidées une à une (capacité, étape) |
| `ui/test_world_screen.gd` | 9 | **Une période complète jouée à pied** (bureau, Hélène, porte, événement qui vient au joueur, soirée dans la salle, bilan, retour au bureau) ; **une saison entière à travers le monde** (4 saisons, fin de saison) ; rénovation achetée sur place et pas deux fois ; clic pour marcher ; objectif et période affichés ; **étude de cas au lancement** ; **mission acceptée en parlant puis dossier réussi** ; fenêtre de dossier qui refuse une copie incomplète et affiche la correction ; journal (onglets, acceptation) et rapport de saison |
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
| Linux x86_64 | `RIDEAU.x86_64` (93 Mo) | **Autotest** (`-- --smoke-test`) : données, dialogue, **monde (5 cartes, 51 répliques, images, scène)**, saison complète avec missions et dossiers, sauvegarde → SUCCÈS (v0.11.0) |
| Web (WebGL 2, sans threads) | `index.html` + `.wasm` + `.pck` | Chargé dans Chromium (v0.11.0) : menu, choix du scénario, étude de cas, monde, transmission du rapport de saison à la page — **0 erreur console** ; publié en lien privé (moteur découpé en 3 morceaux de moins de 15 Mo, réassemblés au chargement) |
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

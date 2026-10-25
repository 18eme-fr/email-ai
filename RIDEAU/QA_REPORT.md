# Rapport d'assurance qualité — RIDEAU ! v0.9.0

Date : 25 octobre 2026. Environnement : conteneur Linux, **Godot 4.7.2-stable compilé depuis les
sources**, rendu réel OpenGL (Mesa llvmpipe) sous Xvfb, Chromium (Playwright) pour la version Web.
**Tout ce qui est indiqué « réussi » a été réellement exécuté.**

## 1. Tests automatisés (GdUnit4 6.2.2)

Commande : `GODOT_BIN=… xvfb-run -a ./addons/gdUnit4/runtest.sh -a res://tests -c`
Résultat de la dernière exécution : **87 cas, 0 échec, 0 erreur, 0 orphelin.**

| Suite | Cas | Ce qui est vérifié |
|---|---|---|
| `economy/test_ledger.gd` | 8 | Un seul débit par écriture ; engagé ≠ payé ; recette attendue ≠ encaissée ; montants négatifs ou nuls refusés ; TVA neutre ; écritures conditionnelles confirmées ou annulées |
| `economy/test_show_economics.gd` | 10 | TVA 5,5 % / 2,1 %, droits d'auteur, cession vs coréalisation, **places ≤ jauge** (y compris demande ×5), fourchettes ordonnées, effet du prix et de la communication, salle pleine non rentable, incidents, nombre exact de représentations |
| `economy/test_turn_resolver.gd` | 7 | Variation de trésorerie = encaissements − décaissements ; résultat = produits − charges ; **aucun double comptage sur une saison entière** ; TVA et droits payés à la période suivante ; spectacle annulé sans recette ; faillite sous le découvert autorisé ; rapport explicatif |
| `gameplay/test_game_session.gd` | 12 | Début de partie, difficultés, saison complète de 8 rapports, saison « passive » résolue sans blocage, même graine = même saison, graines différentes = saisons différentes, règles de programmation, capacité d'actions, dépenses impossibles refusées **mais « ne rien faire » toujours permis**, effets des actions, offres renouvelées, pas de double résolution |
| `gameplay/test_events.gd` | 12 | Événements forcés (bilan de mi-saison, alerte de trésorerie), événements uniques, conditions, **chaque choix a des effets différents**, effets appliqués, pas de double choix, choix bloqués, paris reproductibles, solde conditionnel de subvention, ordre des étapes imposé, retour en arrière |
| `gameplay/test_strategies.gd` | 5 | Stratégies équilibrée et artistique viables ; ne rien faire ne gagne jamais ; stratégie purement rentable échoue aux missions ; jeu aléatoire rarement gagnant ; ≥ 5 fins atteignables |
| `persistence/test_save_system.gd` | 11 | Aller-retour exact, partie rechargée qui se poursuit à l'identique, fichier corrompu → copie de secours **avec message**, fichier modifié détecté, sauvegarde absente, état incomplet, types invalides sans plantage, version future refusée, migration d'ancienne version, rétrogradation de version sans contourner la somme de contrôle, écriture ratée sans perte |
| `data/test_data_integrity.gd` | 9 | Chargement des JSON, champs et bornes des spectacles, actions, correspondance événements ↔ dialogues, compilation des `.dialogue` par Dialogue Manager, réponses disponibles pour chaque événement, notions et sources, portraits, fins |
| `ui/test_ui.gd` | 13 | Formatage des nombres, boutons du menu, Paramètres et Crédits, « Continuer » activé après sauvegarde, **une période complète jouée à travers l'interface**, montant affiché, fenêtres ouvertes/fermées au clavier (Échap), Entrée inactive sous une fenêtre modale, chaque étape se construit, **tous les écrans tiennent en 1280×720 (police pixel et police lisible)**, tailles de texte ≥ 13 px, écran de fin |

## 2. Simulation d'équilibrage (`tools/simulate.gd`)

100 saisons par stratégie en Standard, 60 en Découverte et Exigeant (rapports complets dans `docs/`).

| Stratégie | Découverte | **Standard** | Exigeant |
|---|---|---|---|
| Équilibrée | 100 % | **100 %** | 72 % |
| Artistique | 100 % | **75 %** | 27 % |
| Publics | 100 % | **78 %** | 15 % |
| Prudente (rentabilité seule) | 0 % | **0 %** | 0 % |
| Aléatoire | 50 % | **33 %** | 15 % |
| Passive | 0 % | **0 %** | 0 % |

(pourcentage de conventions renouvelées). Aucune stratégie triviale ne gagne ; plusieurs styles
différents gagnent avec des fins différentes ; la difficulté Exigeant est un vrai défi.

## 3. Vérifications manuelles et visuelles

- Captures réelles de chaque écran (`docs/screenshots/`), relues une à une.
- Contrastes des couleurs de texte calculés : **toutes les paires de texte ≥ 4,5:1 (WCAG AA)**,
  sauf boutons désactivés (exemptés).
- Couverture des glyphes : toutes les lettres accentuées françaises présentes ; symboles (flèches,
  étoiles, ✓, ⚠, ▸) fournis par la police de repli DejaVu Sans.
- Deux revues de code automatisées (moteur, interface) : 20 remarques, toutes traitées
  (voir `CHANGELOG.md`).

## 4. Exports

| Plateforme | Produit | Vérification réelle |
|---|---|---|
| Linux x86_64 | `RIDEAU.x86_64` (93 Mo) | **Autotest** (`-- --smoke-test`) : données, dialogue, saison complète, sauvegarde → SUCCÈS ; démarrage graphique sans erreur |
| Web (WebGL 2, sans threads) | `index.html` + `.wasm` + `.pck` | Chargé dans Chromium : menu, nouvelle saison, tutoriel — **0 erreur console** |
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

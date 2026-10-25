# Journal des modifications

Format inspiré de « Keep a Changelog ». Versions du jeu (`application/config/version`).

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
- **Tests GdUnit4 6.2.2** : 81 cas (économie, parties, événements, stratégies, sauvegarde,
  données, interface).
- **Outils** : simulation multi-stratégies, rejeu de saison, captures d'écran, sonde de mise en page,
  vérification de compilation, construction du thème.
- **Documentation** : README, GDD, architecture, modèle économique, format des données, audit des
  plugins, sources, licences, QA, feuille de route.

### Corrigé pendant le développement (trouvé par les tests ou la simulation)
- Blocage de progression quand la trésorerie était trop basse pour « ne rien faire ».
- Débordements d'interface sur les titres et réponses longs.
- Ligature « fi » de Pixelify Sans affichée comme un « A ».
- Fenêtres modales non centrées.
- Saturation des indicateurs (rendements décroissants ajoutés).
- Difficulté « Exigeant » injouable (58 % de faillites) → rendue difficile mais gagnable.

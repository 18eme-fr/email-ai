# CLAUDE.md — conventions de développement de RIDEAU !

Contexte pour les prochaines sessions (humaines ou Claude Code).

## Projet
- Godot **4.7.2**, GDScript **typé**, rendu Compatibilité, base 1280×720, pixel art en filtrage « nearest ».
- Langue du jeu, des commentaires et de la documentation : **français**. Identifiants de code en anglais.
- Le porteur du projet n'est pas développeur : expliquer les changements simplement, ne rien
  déclarer « fait » sans preuve (test exécuté, capture, simulation).

## Règles d'architecture
- **Logique ≠ interface** : toute règle de jeu va dans `scripts/core|economy|programming|events`
  et doit fonctionner sans nœud (testable en headless). L'interface (`scripts/ui`) ne fait qu'appeler
  `GameSession`.
- **Données d'abord** : spectacles, actions, événements, notions, fins et paramètres sont dans
  `data/*.json` (format : `docs/DATA_FORMAT.md`). Ne pas coder en dur un montant d'équilibrage.
- **Argent** : toujours des entiers (euros). Tout mouvement passe par `Ledger.add()` ; seul
  `Ledger.settle_due()` modifie `state.cash`. Ne jamais modifier `cash` ailleurs.
- **Hasard** : uniquement via `SeededRng.make(graine, période, canal, sel)` (reproductibilité).
- **Dialogues** : texte dans `dialogue/*.dialogue` (Dialogue Manager), effets dans `events.json`.
  Chaque choix d'événement doit exister dans le dialogue sous la forme `[#choice=<id>]`.
- **Sauvegarde** : si `GameState` change de structure, incrémenter `SaveSystem.CURRENT_VERSION`
  et ajouter une étape dans `SaveSystem.migrate()` + un test.
- **Monde explorable** (`scripts/world/`) : il n'ajoute aucune règle de gestion, il appelle
  `GameSession` (dont `plan_action()` et `buy_upgrade()`). Logique testable dans `WorldMap` et
  `WorldRules` ; affichage dans `WorldScreen`. Les cartes sont des grilles dans
  `data/world/world.json` : toute modification de grille impose de relancer
  `python3 tools/art/generate_art.py` (le dessin lit les mêmes grilles) et les tests `tests/world`.
  La ville (carte `rue`) est écrite par `python3 tools/art/city_layout.py` (à modifier plutôt que
  le JSON) et dessinée par `tools/art/city.py`.
  Les panneaux d'étape doivent continuer à fonctionner dans les deux écrans (contrat `screen` :
  `session`, `advance()`, `refresh_all()`, `toast()`, `theatre`).
- **Rénovations** : prix en écriture neutre, amortissement en écritures `non_cash` (résultat
  seulement). Ne jamais faire bouger la trésorerie avec une écriture `non_cash`.
- **Progression** (`scripts/progression/`) : missions, dossiers, compétences et trophées sont
  pilotés par les données (`data/scenarios`, `data/missions`, `data/progression`). Les
  récompenses passent par `Rules.apply` ; l'expérience par `SkillSystem.add_xp` ; les messages au
  joueur par `state.notices` (lus avec `GameSession.take_notices()`). Un dossier doit rester
  généré à partir de la partie et corrigé avec une explication par question
  (`tests/progression` vérifie que la réponse parfaite vaut 100 %).
- Interface : construire avec `UiKit` (thème `assets/ui/rideau_theme.tres`, variations
  `WoodPanel`, `PaperPanel`, `InsetPanel`, `GoldButton`, `SecondaryButton`, `FlatButton`,
  `HeaderLabel`, `SmallLabel`…). Les textes à la ligne utilisent `UiKit.label(..., wrap=true)`.
  Tout écran doit tenir dans 1280×720 (test `test_layout_fits_reference_resolution`).

## Commandes
```bash
godot --headless --path . --import                               # (ré)importer
godot --headless --path . -s res://tools/check_scripts.gd        # compiler tous les scripts
GODOT_BIN=$(which godot) xvfb-run -a ./addons/gdUnit4/runtest.sh -a res://tests -c   # tests
godot --headless --path . -s res://tools/simulate.gd -- --games 200 --out docs/BALANCE_REPORT.md
xvfb-run -a godot --path . --rendering-driver opengl3 -s res://tools/screenshot.gd -- \
    res://scenes/management/management_screen.tscn sortie.png game:42:5 [action]
godot --headless --path . -s res://tools/layout_probe.gd -- <étapes> <seuil>   # débordements
```
Les scripts lancés avec `-s` sont compilés **avant** les autoloads : n'y référencer `Game`,
`Settings`, `AudioDirector` ou les classes qui en dépendent que via `root.get_node()` / `load()`.

## Avant de pousser
1. `check_scripts.gd` sans échec ; 2. tous les tests GdUnit4 verts ; 3. si l'équilibrage a bougé,
relancer la simulation et mettre à jour `docs/BALANCE_REPORT*.md` ; 4. mettre à jour
`CHANGELOG.md` et, si besoin, `QA_REPORT.md`.

## Outils recommandés sur le Mac du porteur de projet
- Serveur MCP Godot **shin2344234/godot-mcp** (audité, voir `PLUGINS_AUDIT.md`) pour piloter l'éditeur.
- Plugins Claude Code **Superpowers** et **Context7** (disponibles au catalogue, non activés lors du développement initial).

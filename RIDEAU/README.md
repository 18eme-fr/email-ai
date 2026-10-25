# RIDEAU ! — À vous de diriger le spectacle

Jeu vidéo indépendant de **gestion d'un petit théâtre français**, en pixel art 2D, réalisé avec
**Godot 4.7.2**. Vous dirigez le Théâtre de la Lanterne (fictif) pendant une saison de huit
périodes : programmer des spectacles, gérer une petite équipe, faire face aux imprévus, tenir les
comptes et les engagements pris auprès de la Ville. Le jeu fait découvrir, par l'expérience,
les grandes logiques de l'administration culturelle (budget prévisionnel, billetterie, jauge,
contrats de cession et de coréalisation, médiation, subventions, mécénat…).

État : **version 0.9.0 jouable de bout en bout** (voir `QA_REPORT.md` et `ROADMAP.md`).

## Lancer le jeu sur macOS (le plus simple)

1. Téléchargez **Godot 4.7.2 (version standard, pas .NET)** sur <https://godotengine.org/download/macos/>
   et glissez `Godot.app` dans « Applications ».
2. Récupérez le projet (dossier `RIDEAU/` de ce dépôt) :
   ```bash
   git clone -b claude/beautiful-brahmagupta-noafvc https://github.com/18eme-fr/email-ai.git
   ```
3. Ouvrez Godot, cliquez sur **Importer**, choisissez `email-ai/RIDEAU/project.godot`, puis
   **Importer et éditer**. Le premier import prend une minute.
4. Appuyez sur **F5** (ou le bouton ▶ en haut à droite) : le jeu démarre sur le menu principal.

En ligne de commande :
```bash
/Applications/Godot.app/Contents/MacOS/Godot --path chemin/vers/RIDEAU
```

Les versions exportées pour Linux, Windows et le Web, quand elles ont été produites, se trouvent
dans les fichiers joints aux livraisons (le dossier `exports/` n'est pas versionné).

## Commandes de jeu

| Action | Souris | Clavier |
|---|---|---|
| Valider l'étape | bouton doré | Entrée |
| Pause, sauvegarde, paramètres / fermer une fenêtre | « Menu » (roue dentée) | Échap |
| Carnet du directeur (notions expliquées) | « ? » | F1 |
| Naviguer entre les boutons | — | Tab / Maj+Tab, flèches |

La partie est **enregistrée automatiquement** à chaque étape ; « Continuer » la reprend.

## Pour les développeurs

### Tests automatisés (GdUnit4)
```bash
export GODOT_BIN=/Applications/Godot.app/Contents/MacOS/Godot
chmod +x addons/gdUnit4/runtest.sh
./addons/gdUnit4/runtest.sh -a res://tests -c
```
Rapport HTML dans `reports/`. Sur Linux sans écran, préfixer par `xvfb-run -a`.

### Simulation d'équilibrage
```bash
godot --headless --path . -s res://tools/simulate.gd -- --games 200 --difficulty standard --out docs/BALANCE_REPORT.md
godot --headless --path . -s res://tools/debug_season.gd -- equilibre 1003   # rejouer une saison précise
```

### Régénérer les ressources
```bash
python3 tools/art/generate_art.py        # pixel art (Pillow requis)
python3 tools/generate_audio.py          # sons et musiques (NumPy requis)
godot --headless --path . -s res://tools/build_theme.gd   # thème d'interface
```

### Exports
Préréglages fournis dans `export_presets.cfg` (Linux, Windows, Web, macOS). Avec les modèles
d'export officiels installés (menu *Éditeur > Gérer les modèles d'export*) :
```bash
godot --headless --path . --export-release "macOS" exports/macos/RIDEAU.zip
```

## Organisation

```
RIDEAU/
├── project.godot, export_presets.cfg
├── addons/        Dialogue Manager 4.1.0 (dialogues), GdUnit4 6.2.2 (tests)
├── assets/        pixel_art/, ui/ (thème), audio/, fonts/  — tous générés ou sous licence libre
├── data/          balancing/, performances/, events/, actions/, characters/, pedagogy/  (JSON)
├── dialogue/      textes des personnages (format Dialogue Manager)
├── scenes/        menus/, management/, reports/
├── scripts/       core/, economy/, programming/, events/, persistence/, ui/, audio/
├── tests/         economy/, gameplay/, persistence/, data/, ui/
├── tools/         simulation, captures, génération d'images et de sons, thème
└── docs/          modèle économique, format des données, rapports d'équilibrage, captures
```

## Documentation

`GAME_DESIGN_DOCUMENT.md` (règles) · `ARCHITECTURE.md` (technique) · `docs/ECONOMIC_MODEL.md` ·
`docs/DATA_FORMAT.md` · `PLUGINS_AUDIT.md` · `SOURCES.md` · `LICENSES.md` · `QA_REPORT.md` ·
`ROADMAP.md` · `CHANGELOG.md` · `CLAUDE.md` (conventions pour les prochaines sessions).

Le théâtre, la ville, les personnages, les compagnies et tous les montants sont **fictifs** ; les
règles simplifient la réalité (voir `SOURCES.md`).

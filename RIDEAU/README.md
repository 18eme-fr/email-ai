# RIDEAU ! — À vous de diriger le spectacle

Jeu vidéo indépendant de **gestion d'un petit théâtre français**, en pixel art 2D, réalisé avec
**Godot 4.7.2**. Vous dirigez le Théâtre de la Lanterne (fictif) pendant une saison de huit
périodes : programmer des spectacles, gérer une petite équipe, faire face aux imprévus, tenir les
comptes et les engagements pris auprès de la Ville. Depuis la version 0.10, **vous vous déplacez
dans le théâtre et sur la place**, en vue de dessus façon jeu de rôle : on parle à l'équipe, on
décide les actions sur place, on rénove le théâtre, on assiste aux soirées dans la salle, au fil
des saisons. Le jeu fait découvrir, par l'expérience,
les grandes logiques de l'administration culturelle (budget prévisionnel, billetterie, jauge,
contrats de cession et de coréalisation, médiation, subventions, mécénat…).

État : **version 0.17.4 jouable de bout en bout** (voir `QA_REPORT.md` et `ROADMAP.md`).
Depuis la version 0.17 : **une création avec le metteur en scène Victor Lazare** (un choix par mois,
il change d'endroit à chaque fois), le bandeau **« Prochaines étapes »**, et en fin de saison le
**voyage en train à Paris** : un quartier parisien à explorer et la première au Théâtre des Lumières.
Depuis la version 0.16 : **on entre dans tous les bâtiments** (27 intérieurs, 28 nouveaux habitants),
des **ruelles** relient les rues entre les immeubles, et les façades ont été redessinées.
Depuis la version 0.15 : **un prologue** qui raconte l'histoire de la Lanterne, une **ambiance
sonore** complète (musiques, ambiances, bruits de pas) et une ville vivante (heure, météo, train).
Depuis la version 0.14 : **la collection de la Lanterne**, 51 objets d'histoire du spectacle à
découvrir de partie en partie (exploration, enquêtes, secrets, rénovations), une réserve secrète
et des vitrines d'exposition dans le hall — registre complet dans `docs/COLLECTION.md`.
Depuis la version 0.12 : **toute une ville à explorer** (Bréval-sur-Ondine : 7 quartiers, 28 bâtiments,
29 habitants, bus et plan de la ville).
Depuis la version 0.11 : **scénarios-études de cas, missions, dossiers de compétences,
progression, trophées et rapport de saison** pour l'utilisation en formation — voir
**`docs/GUIDE_ENSEIGNANT.md`**.

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

Des versions prêtes à jouer pour **Linux, Windows et le Web** ont été produites (archives
`RIDEAU-0.17.4-*.zip` transmises avec la livraison ; le dossier `exports/` n'est pas versionné).
La version Web se lance en servant le dossier décompressé, par exemple :
`python3 -m http.server` puis <http://localhost:8000> (l'ouvrir directement en `file://` ne marche pas).
Vérifier une version exportée : `./RIDEAU.x86_64 --headless -- --smoke-test`.

## Commandes de jeu

Dans le monde explorable (écran par défaut) :

| Action | Souris | Clavier |
|---|---|---|
| Marcher | clic sur la destination | flèches ou Z Q S D (W A S D en QWERTY) |
| Parler, utiliser un objet | clic dessus | Entrée, Espace ou E, face à lui |
| Menu, carnet, budget, bilans | boutons en haut à droite | Échap, F1 |
| Journal de bord (missions, compétences, trophées) | bouton livre | J |
| Plan de la ville | bouton plan | M |
| Collection, enquêtes, exposition, tenues | bouton collection | C |
| Ramasser un objet, fouiller | — | Entrée / E face à l'objet |
| Prendre le bus | utiliser un arrêt de bus | Entrée face à l'abribus |

La flèche dorée indique toujours la prochaine étape. Le paramètre « vue tableau de bord » permet de
jouer sans se déplacer, avec l'écran de gestion :

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
├── assets/        pixel_art/, world/ (cartes, personnages), ui/ (thème), audio/, fonts/
│                  — tous générés ou sous licence libre
├── data/          balancing/, performances/, events/, actions/, characters/, pedagogy/,
│                  upgrades/ (rénovations), world/ (cartes et répliques)  (JSON)
├── dialogue/      textes des personnages (format Dialogue Manager)
├── scenes/        menus/, management/, world/, reports/
├── scripts/       core/, economy/, programming/, events/, persistence/, ui/, world/, audio/
├── tests/         economy/, gameplay/, persistence/, data/, ui/, world/
├── tools/         simulation, captures, génération d'images et de sons, thème
└── docs/          modèle économique, format des données, rapports d'équilibrage, captures
```

## Documentation

`GAME_DESIGN_DOCUMENT.md` (règles) · `ARCHITECTURE.md` (technique) · `docs/ECONOMIC_MODEL.md` ·
`docs/DATA_FORMAT.md` · `PLUGINS_AUDIT.md` · `SOURCES.md` · `LICENSES.md` · `QA_REPORT.md` ·
`ROADMAP.md` · `CHANGELOG.md` · `CLAUDE.md` (conventions pour les prochaines sessions).

Le théâtre, la ville, les personnages, les compagnies et tous les montants sont **fictifs** ; les
règles simplifient la réalité (voir `SOURCES.md`).

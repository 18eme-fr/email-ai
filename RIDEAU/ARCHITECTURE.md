# Architecture technique

Godot 4.7.2, GDScript typé, rendu « Compatibilité » (OpenGL / WebGL 2), résolution de référence
1280×720 (mise à l'échelle `canvas_items`, aspect `expand`), filtrage « au plus proche » pour le
pixel art.

## Principe

**Le jeu est piloté par les données et la logique est indépendante de l'interface.**
`GameSession` (pur `RefCounted`, sans nœud) contient toute la partie : l'interface, la simulation
de masse et les tests l'utilisent de la même façon.

```
             data/*.json, dialogue/*.dialogue
                          │  (GameData : chargement, accès)
                          ▼
 ┌──────────────── GameSession (scripts/core/game_session.gd) ────────────────┐
 │  GameState (état sérialisable)                                             │
 │  Programming ─ offres, validation        EventSystem ─ tirage, choix       │
 │  Rules ─ conditions/effets génériques    ShowEconomics ─ demande, finance  │
 │  TurnResolver ─ résolution + rapport     Ledger ─ engagement / règlement   │
 │  SeasonEvaluator ─ objectifs, fins       SeededRng ─ hasard reproductible  │
 └─────────────▲──────────────────────────────▲─────────────────▲────────────┘
               │                              │                 │
     Autoload « Game »                 tools/simulate.gd     tests/ (GdUnit4)
     (+ SaveSystem, autosave)          StrategyBot
               │
   Scènes et panneaux d'interface (scripts/ui/)
   Monde explorable (scripts/world/) ─ WorldData, WorldMap, WorldRules (logique, testable)
                                       WorldScreen, WorldActor, SpeechBox, WorldWindow, WorldHud
```

## Séparation demandée

| Domaine | Fichiers |
|---|---|
| 1. Moteur économique | `scripts/economy/ledger.gd`, `show_economics.gd`, `turn_resolver.gd` |
| 2. Données de programmation | `data/performances/catalog.json`, `scripts/programming/programming.gd` |
| 3. Événements narratifs | `data/events/events.json`, `dialogue/events.dialogue`, `scripts/events/event_system.gd` |
| 4. État de la partie | `scripts/core/game_state.gd`, `game_session.gd` |
| 5. Sauvegarde | `scripts/persistence/save_system.gd` |
| 6. Affichage | `scenes/**`, `scripts/ui/**`, `assets/ui/rideau_theme.tres` |
| 7. Difficulté / équilibrage | `data/balancing/balance.json` |
| 8. Contenus pédagogiques | `data/pedagogy/glossary.json`, `endings.json`, `scripts/ui/glossary_panel.gd`, `briefing.gd` |
| 9. Monde explorable | `data/world/world.json` (cartes), `barks.json` (répliques), `scripts/world/`, `assets/world/`, `tools/art/world.py` |
| 11. Progression | `data/scenarios/`, `data/missions/`, `data/progression/`, `scripts/progression/` (`MissionSystem`, `Dossiers`, `SkillSystem`, `AchievementSystem`, `SeasonReport`), `scripts/ui/journal_panel.gd`, `dossier_panel.gd`, `case_study.gd` |
| 10. Rénovations | `data/upgrades/upgrades.json`, `GameSession.buy_upgrade()`, écritures `non_cash` du `Ledger` |

## Autoloads

| Nom | Rôle |
|---|---|
| `DialogueManager` | Fourni par l'add-on Dialogue Manager |
| `Settings` | Paramètres joueur (`user://settings.cfg`) : volumes, animations, police, plein écran |
| `AudioDirector` | Musique et sons (bus Master / Music / SFX) |
| `Game` | Partie en cours, sauvegarde automatique, changements de scène |

## Scènes

- `scenes/menus/main_menu.tscn` — menu principal (nouvelle saison, continuer, paramètres, crédits, quitter).
- `scenes/management/management_screen.tscn` — écran de gestion : barre d'indicateurs, vue du
  théâtre (`TheatreView`, dessin en `_draw` à l'échelle exacte des pixels), état du théâtre,
  étapes. Le panneau de l'étape est construit par code (`SituationPanel`, `ProgrammingPanel`,
  `ActionsPanel`, `EventPanel`, `ReportPanel`), à partir des constructeurs de `UiKit`.
- `scenes/world/world_screen.tscn` — **écran de jeu par défaut** : le monde explorable
  (`WorldScreen`). Il offre aux panneaux d'étape le même contrat que l'écran de gestion
  (`session`, `advance()`, `refresh_all()`, `toast()`, `theatre.play_performance()`) et les
  affiche dans une `WorldWindow`. Les cartes sont des images pré-rendues (sol + calque supérieur
  qui passe devant les personnages + lumières de nuit en fusion additive) ; les collisions, portes
  et objets viennent des grilles de `data/world/world.json`, les mêmes que celles du dessin.
  Déplacement case par case, chemins `AStarGrid2D` pour le clic, tri en profondeur des personnages.
  `Game.play_scene()` choisit le monde ou le tableau de bord (paramètre « vue tableau de bord »).
- `scenes/reports/end_screen.tscn` — bilan de saison.
- Fenêtres modales (`Modal`) : Carnet du directeur, Budget, Bilans, Pause, Paramètres, Crédits.

## Dialogue Manager

Les textes parlés sont dans `dialogue/*.dialogue`. `DialogueBox` appelle
`DialogueManager.get_next_dialogue_line()`, affiche le portrait (humeur via la balise `[#mood=…]`)
et le texte avec le `DialogueLabel` de l'add-on. Les réponses portent une balise `[#choice=id]` :
`EventPanel` les affiche avec les conséquences et la probabilité tirées de `events.json`, puis
appelle `GameSession.choose_event()`. **Aucun effet de jeu n'est écrit dans les dialogues.**

## Hasard reproductible

`SeededRng.make(graine, période, canal, sel)` : chaque tirage (offres, événement, pari,
fréquentation, qualité, incident) a sa propre source déterministe. Le résultat ne dépend pas de
l'ordre des clics : même graine + mêmes décisions = même saison (testé).

## Sauvegarde

JSON dans `user://saves/saison.json` : enveloppe `{format, version, game_version, saved_at,
checksum, state}`. Version actuelle du format : 3 (v2 : rénovations ; v3 : scénario, missions, compétences, dossiers, trophées, notions consultées ; migrations depuis toutes les versions précédentes). Écriture dans un fichier temporaire, relecture de vérification, puis
remplacement ; l'ancienne sauvegarde est conservée en `.bak`. Au chargement : somme de contrôle
SHA-256, migrations de version, validation des champs ; en cas d'échec, restauration depuis la
copie de secours **avec un message au joueur**. Sauvegarde automatique à chaque étape.

## Outils (`tools/`)

| Outil | Usage |
|---|---|
| `simulate.gd` | Simulation de masse par stratégie → `docs/BALANCE_REPORT*.md` |
| `debug_season.gd` | Rejoue une saison (stratégie + graine) période par période |
| `check_scripts.gd` | Compile tous les scripts et scènes |
| `screenshot.gd` (+ `screenshot_scenario.gd`) | Captures d'écran réelles à une étape donnée |
| `layout_probe.gd` | Trouve les contrôles qui élargissent l'interface |
| `build_theme.gd` | Construit `assets/ui/rideau_theme.tres` |
| `art/generate_art.py` | Génère tout le pixel art (dont `art/world.py` : cartes, saisons, personnages animés) |
| `generate_audio.py` | Génère sons et musiques |

# Audit des plugins, extensions et outils

Audit réalisé le 25 octobre 2026, avant le développement des systèmes du jeu. Chaque dépôt
cité a été **cloné et inspecté** (version, licence, date du dernier commit, code) ; les pages
de boutiques inaccessibles depuis l'environnement ont été consultées par recherche web, et
c'est indiqué.

## 0. Environnement réel de développement

| Élément | Constat vérifié |
|---|---|
| Système | Conteneur Linux x86_64 (Ubuntu 24.04) dans le cloud — **pas** le Mac du porteur de projet. |
| Godot | Absent au départ. Le site godotengine.org et ses miroirs de téléchargement étant bloqués par le réseau, **Godot 4.7.2-stable a été compilé depuis les sources officielles** (tag `4.7.2-stable`, commit `ed1daf0bf`). Version vérifiée : `4.7.2.stable.custom_build.ed1daf0bf`. |
| Rendu | Mesa llvmpipe (OpenGL 4.5) sous Xvfb : rendu réel du jeu pour les captures et les tests d'interface. |
| Git | Disponible ; dépôt GitHub privé `18eme-fr/email-ai`, branche `claude/beautiful-brahmagupta-noafvc` (push autorisé par le porteur de projet). |
| Réseau | Accès Git à GitHub (lecture des dépôts publics), PyPI, npm, apt Ubuntu, Google Storage (emsdk). Bloqués : godotengine.org, store.godotengine.org, kenney.nl, opengameart.org, itch.io, fonts.google.com. |
| MCP disponibles | `github` (connecté), `Claude_Docs`. Les MCP « design » (Figma, Asana, Notion…) échouent à se connecter (refus du proxy) et sont sans objet ici. |
| Skills disponibles | `code-review`, `simplify`, `frontend-design`, `uxkin:no-ui-slop`, compétences de design, etc. |

## 1. Écosystème Claude Code

| Nom | Fonction pour nous | Source | Version | Licence | Dernière activité | Décision |
|---|---|---|---|---|---|---|
| **Superpowers** (obra) | Méthode : TDD, débogage systématique, revue | catalogue Anthropic / github.com/obra/superpowers | 6.4.2 | (voir dépôt) | 2026-10 | **Reporter** : disponible au catalogue mais **non activé** sur le compte ; impossible de l'installer en cours de session. Sa méthode (tests d'abord, vérification avant de conclure) a été appliquée manuellement. À activer pour les prochaines sessions sur Mac. |
| **Context7** | Documentation à jour des bibliothèques | `anthropics/claude-plugins-official/external_plugins/context7` | dépôt du 2026-10-23 | Apache-2.0 (dépôt) | 2026-10 | **Reporter** : non activé ; son serveur (mcp.context7.com) est de toute façon bloqué par le réseau du conteneur. La documentation a été lue directement dans les sources des add-ons. |
| **code-review** | Revue de code | skill intégré à cette session | — | — | — | **Utiliser** en fin de développement. |
| **code-simplifier** | Lisibilité | `claude-plugins-official/plugins/code-simplifier` ; skill `simplify` disponible | — | Apache-2.0 | 2026-10 | **Utiliser** le skill `simplify` équivalent déjà présent. |
| **feature-dev** | Développement encadré | `claude-plugins-official/plugins/feature-dev` | — | Apache-2.0 | 2026-10 | **Écarter** : redondant avec le plan par phases déjà suivi. |
| **GitHub (MCP)** | Branches, commits, PR | serveur MCP `github` connecté | — | — | — | **Utiliser** (via git ; aucune PR créée sans demande). |

## 2. Serveurs MCP pour piloter l'éditeur Godot

Tous les dépôts ont été clonés et leur code inspecté (aucun installateur exécuté).

| Nom | Capacités | Version / activité | Licence | Sécurité (code inspecté) | Décision |
|---|---|---|---|---|---|
| **shin2344234/godot-mcp** | Scènes, nœuds, scripts avec diagnostics LSP, exécution du jeu, inspection à chaud, captures, débogueur, lancement de tests GUT/GdUnit4, mode headless sans éditeur | v0.1.2, commit du 2026-10-16 ; **testé par l'auteur avec Godot 4.7.2** | MIT | Bonne : pont lié à 127.0.0.1, jeton aléatoire de 256 bits par session, accès limité au dossier du projet, `eval` désactivé par défaut (`--allow-eval`), SECURITY.md détaillé | **Retenu pour le poste macOS** (recommandé), **non installé dans ce conteneur** : il nécessite Node 22 et un redémarrage de session Claude Code pour charger les outils MCP, alors que la ligne de commande Godot (`--headless`, scripts, GdUnit4, captures sous Xvfb) couvre déjà nos besoins ici. |
| **FunplayAI/funplay-godot-mcp** (Asset Store « Funplay Godot MCP ») | Scènes, scripts, UI, tests en jeu | v0.10.1, commit du 2026-10-10 | MIT | Jeton par projet depuis v0.9.1, mais outil `execute_code` exposé aux clients authentifiés | **Écarter** : redondant ; surface d'exécution de code plus large. |
| **JulianPoleszczuk/godot-mcp-plugin** | 52 outils via serveur Python FastMCP | v0.1.0, 12 commits, 2026-07-25 | MIT | TCP local 127.0.0.1:9080, **sans jeton** | **Écarter** : jeune, sans authentification. |
| **Coding-Solo/godot-mcp** (comparaison) | Lancer/déboguer des projets, éditer des scènes | commit du 2026-04-16 | MIT | Exécute Godot en sous-processus | **Écarter** : moins complet et moins actif que shin2344234. |

## 3. Extensions intégrées au jeu

| Nom exact | Fonction dans RIDEAU ! | Source | Version | Compatibilité Godot | Licence | Dernière activité | Maintenance | Risques | Décision |
|---|---|---|---|---|---|---|---|---|---|
| **Dialogue Manager** (Nathan Hoad) | Dialogues des personnages, réponses étiquetées `[#choice=…]`, humeurs `[#mood=…]`, effet machine à écrire (`DialogueLabel`) | github.com/nathanhoad/godot_dialogue_manager | **4.1.0** (tag du 2026-09-04) | « Godot 4.6+ » ; vérifié en pratique sur 4.7.2 (compilation des `.dialogue`, tests) | MIT | commit du 2026-10-25 | Très active | Version majeure récente (4.0 en août 2026) ; fichiers C# fournis mais inutilisés (`uses_dotnet=false`) | **Utiliser** |
| **Dialogic 2** | Alternative de dialogues | github.com/dialogic-godot/dialogic | `2.0-Alpha-21 WIP` | Godot 4.5+ | MIT | 2026-08-30 | Active | **Encore en alpha**, très lourd (éditeur visuel, timelines) | **Écarter** (redondant avec Dialogue Manager, non stable) |
| **GdUnit4** | Tests unitaires et tests de scènes (`scene_runner`) | github.com/godot-gdunit-labs/gdUnit4 | **6.2.2** (tag du 2026-10-07) | Tableau officiel : 4.5 → 4.7.1 ; **vérifié sur 4.7.2** (80 tests exécutés) | MIT | commit du 2026-10-25 | Très active | La branche `master` (7.0.0) n'est pas une version publiée : écartée au profit du tag stable | **Utiliser** (outil de développement, exclu des exports) |
| **GUT** | Tests (alternative) | github.com/bitwes/Gut | 9.7.1 | 4.x | MIT | 2026-08-18 | Active | — | **Écarter** (redondant ; GdUnit4 demandé en priorité) |
| **SaveKit** (fernforestgames) | Sauvegarde | github.com/fernforestgames/godot-savekit (fiche Asset Library : MIT, v0.1.1, Godot 4.5) | 0.1 (plugin.cfg) | 4.5+ | MIT | 2026-06-17 | Faible (54 commits) | Pensé pour sérialiser l'**arbre de scène** (groupe `saveable`) ; notre état est un modèle de données pur | **Écarter** : une solution native (JSON versionné, somme de contrôle, copie de secours, migrations) en ~150 lignes est plus adaptée et entièrement testée |
| **Pixel UI Free** (heyheythere) | Thème d'interface pixel | Asset Library (fiche consultée par recherche web) | 1.0.1 | 4.3 → 4.7 | CC BY 4.0 | 2026 | — | **Déclarée produite avec assistance IA** ; style générique, sans lien avec l'univers du théâtre | **Écarter** : interface originale dessinée pour le jeu (velours, bois, or) |

## 4. Ressources graphiques, sonores et typographiques

| Ressource | Constat | Décision |
|---|---|---|
| Kenney, OpenGameArt, itch.io | Sites **inaccessibles** depuis l'environnement | **Écarter** : pixel art et sons **produits par code** (`tools/art/*.py`, `tools/generate_audio.py`) : aucune incertitude de droits, identité unique. |
| Polices Google Fonts (dépôt `google/fonts`, cloné) | Jersey 10, Pixelify Sans, Atkinson Hyperlegible : SIL OFL 1.1, accents français vérifiés par rendu | **Utiliser** (titres / texte / option de lisibilité). Pixelify Sans est utilisée **sans ligatures** (sa ligature « fi » se lisait comme un « A »). |
| Bibliothèques de graphiques Godot | Besoin limité à deux courbes | **Écarter** : `LineChart` natif de 50 lignes. |

## 5. Outils de compilation (pour les exports)

| Outil | Source | Usage | Décision |
|---|---|---|---|
| SCons 4.5, GCC 13 | apt Ubuntu | Compilation de l'éditeur et des modèles d'export Linux | Utilisé |
| MinGW-w64 13 (posix) | apt Ubuntu | Modèle d'export Windows | Utilisé |
| Emscripten 4.0.11 | emsdk officiel (version exigée par la CI de Godot 4.7) | Modèle d'export Web | Utilisé |
| osxcross / SDK macOS | Non disponible (licence Apple, nécessite un Mac) | Export macOS | **Reporter** : à faire depuis le Mac avec les modèles officiels |

# Licences des composants

## Composants externes inclus dans le projet

| Composant | Auteur | Version | Licence | Emplacement | Obligations |
|---|---|---|---|---|---|
| Godot Engine | Juan Linietsky, Ariel Manzur et contributeurs | 4.7.2-stable | MIT | moteur (non inclus dans le dépôt) | Mentionner la licence de Godot et de ses composants tiers dans le jeu distribué (voir « Crédits » et <https://godotengine.org/license>). |
| Dialogue Manager | Nathan Hoad et contributeurs | 4.1.0 | MIT | `addons/dialogue_manager/` (+ `LICENSE`) | Conserver l'avis de copyright et la licence. Modification et usage commercial autorisés. |
| GdUnit4 | Mike Schulze | 6.2.2 | MIT | `addons/gdUnit4/` (+ `LICENSE`) | Idem. Outil de test, **exclu des exports** (voir `export_presets.cfg`). |
| Jersey 10 | The Soft Type Project Authors | (Google Fonts) | SIL Open Font License 1.1 | `assets/fonts/Jersey10-Regular.ttf` (+ `Jersey10-OFL.txt`) | Conserver le texte de la licence ; ne pas vendre la police seule ; usage commercial dans un jeu autorisé. |
| Pixelify Sans | The Pixelify Sans Project Authors | (Google Fonts) | SIL Open Font License 1.1 | `assets/fonts/PixelifySans.ttf` (+ OFL) | Idem. Les fichiers `pixelify_body.tres` et `pixelify_bold.tres` sont des réglages Godot (ligatures, graisse), pas des polices modifiées. |
| Atkinson Hyperlegible | Braille Institute of America | (Google Fonts) | SIL Open Font License 1.1 | `assets/fonts/AtkinsonHyperlegible-*.ttf` (+ OFL) | Idem. |

## Ressources originales du projet

Créées spécifiquement pour RIDEAU ! par code, sans ressource tierce :

- **Pixel art** (`assets/pixel_art/`, `assets/ui/`) : produit par `tools/art/*.py`.
- **Sons et musiques** (`assets/audio/`) : synthétisés par `tools/generate_audio.py`.
- **Textes, dialogues, données de jeu** (`data/`, `dialogue/`).

Ces ressources suivent la licence choisie par le porteur de projet pour RIDEAU ! (à définir ; par
défaut, tous droits réservés au porteur du projet).

## Outils utilisés mais non distribués

| Outil | Licence |
|---|---|
| SCons | MIT |
| Emscripten | MIT / University of Illinois NCSA |
| MinGW-w64 | Licences libres (ZPL, LGPL pour certaines parties de l'exécution) |
| Python, Pillow, NumPy (génération des images et sons) | PSF / HPND (MIT-CMU) / BSD |

## Marques et contenus réels

Aucun nom, logo ou contenu de théâtre, compagnie ou collectivité réels n'est utilisé. Les
institutions citées dans le « Carnet du directeur » (ministère de la Culture, ARTCENA, Onda, SACD,
SACEM) le sont uniquement à titre d'information, avec leurs sources dans `SOURCES.md`.

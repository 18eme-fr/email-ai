# Format des données

Tout le contenu du jeu se modifie sans toucher au code. Après une modification, lancez les tests
(`tests/data/test_data_integrity.gd` vérifie la cohérence) et, pour l'équilibre, `tools/simulate.gd`.

## `data/performances/catalog.json` — spectacles

| Champ | Type | Rôle |
|---|---|---|
| `id` | texte | Identifiant unique ; l'affiche est `assets/pixel_art/posters/<id>.png` (régénérée par `tools/art/generate_art.py`) |
| `title`, `company`, `pitch`, `description` | texte | Affichage |
| `genre` | texte | Clé de `genres` (couleur, libellé, fatigue du public) |
| `format` | `salle` / `petit` / `residence` | Jauge (220 / 80 / `capacity`) et créneaux |
| `contract` | `cession` / `corealisation` / `coproduction` / `interne` / `residence` | Mode de rémunération |
| `fee` | entier ≥ 0 | Prix de cession, apport ou frais |
| `company_share` | 0–1 | Part de la recette nette (coréalisation) |
| `representations` | entier > 0 | Nombre de représentations |
| `capacity` | entier | Jauge particulière (atelier, résidence) |
| `price` | € | Prix normal (0 = entrée libre) |
| `popularity`, `art`, `risk` | 0–1 | Attractivité, exigence artistique, incertitude |
| `quality_bonus`, `residence_bonus` | réel | Bonus de qualité (le second si une résidence a eu lieu) |
| `audiences` | liste | `grand_public`, `familles`, `scolaires`, `jeunes`, `seniors`, `curieux`, `amateurs` |
| `school` | booléen | La 1re représentation est une séance scolaire |
| `eac` | booléen | Compte comme action d'éducation artistique |
| `season_bonus` | `{tag: multiplicateur}` | Bonus selon les `tags` de la période (`fetes`, `hiver`, `vacances`…) |
| `tech_level` | 0–3 | Exigence technique (usure, risque d'incident) |
| `min_equipement` | 0–100 | Équipements minimum pour pouvoir programmer |
| `tech_cost`, `hosting` | € | Technique par représentation, défraiements |
| `rights` | booléen | Droits d'auteur dus |
| `vat` | `default` / `creation` / `none` | Taux de TVA |
| `workload` | entier | Fatigue de l'équipe |
| `stats` | `{indicateur: delta}` | Effets sur les indicateurs (modulés par la qualité) |
| `flags` | liste | Drapeaux posés (ex. `residence_done`) |
| `notions` | liste | Notions du glossaire liées |
| `poster` | `{bg, fg, motif}` | Couleurs et motif de l'affiche |

## `data/actions/actions.json` — actions de gestion

`id`, `label`, `cost`, `payment_delay` (0 = payé dans la période), `summary`, `description`,
`effects` (format ci-dessous), `notion`.

## `data/events/events.json` — événements

| Champ | Rôle |
|---|---|
| `id` | Doit correspondre à une étiquette `~ <id>` de `dialogue/events.dialogue` |
| `title`, `character`, `notion` | Affichage, portrait, notion liée |
| `forced`, `priority` | Événement prioritaire si ses conditions sont remplies |
| `weight` | Poids du tirage |
| `once` | (défaut `true`) une seule fois par saison |
| `conditions` | Voir ci-dessous |
| `choices` | `[{id, label, hint, requires, effects}]` ; chaque `id` doit apparaître dans le dialogue sous la forme `[#choice=<id>]` |

### Conditions (événements, choix `requires`, fins)

`min_turn`, `max_turn`, `turns: [n]`, `cash_min`, `cash_max`, `stat_min: {id: v}`,
`stat_max: {id: v}` (les ids incluent `rayonnement`), `flags_all`, `flags_none`,
`period_tags`, `has_show`, `has_hall_show`, `has_art_show`, `has_tech_show: niveau`,
`any_of: [conditions]`.

### Effets

| Clé | Effet |
|---|---|
| `cash` (+ `cash_label`) | Recette (>0) ou dépense (<0) engagée et réglée dans la période |
| `ledger: [{label, category, amount, direction, delay, neutral}]` | Écritures différées (aides, mécénat, factures) |
| `stats: {id: delta}` | Variation d'indicateurs |
| `eac: n` | Actions d'éducation artistique |
| `flags`, `clear_flags` | Drapeaux |
| `demand_mult`, `price_mult`, `quality_mod` | Modificateurs de la période |
| `cancel_show`, `add_representation` | Annule / prolonge un spectacle programmé |
| `chance: {base, stat, per_point, label, success, failure}` | Pari : probabilité = base + per_point × stat (bornée à 5–95 %) |

## `dialogue/*.dialogue` — dialogues (Dialogue Manager)

Syntaxe de Dialogue Manager 4 : `Nom: texte`, réponses `- texte [#choice=id]`, humeur du portrait
`[#mood=happy|worried|angry|formal]`. Les noms reconnus sont Hélène, Bastien, Inès, Pommier,
Louison. Les effets ne sont **jamais** dans les dialogues : ils restent dans `events.json`, ce qui
permet à la simulation de jouer sans interface.

## `data/pedagogy/glossary.json` et `endings.json`

Notions : `title`, `short`, `game`, `reality`, `simplified`, `sources` (ids de `SOURCES.md`).
Fins : `conditions` (`renewed`, `bankrupt`, `stat_min/max`, `metric_min/max`), `title`, `text`,
`tone`. Enseignements : `when` + `text`.

## `data/balancing/balance.json`

Durée, jauges, état de départ, périodes, charges fixes, subvention, fiscalité, créneaux, niveaux
de prix, coefficients de demande et de qualité, évolution naturelle, incidents, limite de
découvert, objectifs, règle de renouvellement, difficultés. Voir `docs/ECONOMIC_MODEL.md`.

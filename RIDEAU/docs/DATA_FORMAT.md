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

## `data/upgrades/upgrades.json` — rénovations (investissements)

`periods_per_year` (8 : une saison compte pour une année d'amortissement), puis pour chaque
rénovation : `id`, `label`, `icon`, `place` (carte où elle se voit et se décide), `character`
(qui la présente), `cost`, `payment_delay`, `useful_life_years`, `summary`, `description`,
`effects` (à l'achat, format des actions), `per_turn` (`stats` à chaque période, `income` et
`income_label` pour une petite recette), `notion`. Le décor correspondant est
`assets/world/maps/<place>_upgrade_<id>.png` (généré par `tools/art/world.py`).

## `data/world/world.json` — monde explorable

- `legend` : pour chaque caractère des grilles, son nom et `walk` (praticable ou non).
- `start` : carte, case et direction du joueur en début de période.
- `maps.<id>` : `name`, `outdoor`, `grid` (lignes de même longueur, une case = 16 px), `doors`
  (`cell` → `to`, `to_cell`, `facing` à l'arrivée), `spots` (objets : `id`, `cells`, `label`,
  `kind` ∈ desk, glossary, budget, reports, posters, action, upgrade, flavor, place, bus ; plus
  `action` ou `upgrade` selon le cas ; `flavor` = clé de répliques partagée, par ex. « tour » ;
  pour un arrêt de bus : `stop` (nom) et `arrive` (case d'arrivée)), `npcs` (`id`, `cell`,
  `radius` de promenade), `performance` (salle : place du joueur et rangées de fauteuils).
- Ville (`maps.rue`) : en plus, `ground` (sol sous chaque case, pour le dessin), `buildings`
  (`id`, `style`, `rect` [x, y, largeur, hauteur], `label`, `doors`), `districts` (`id`, `name`,
  `rect` : nom affiché quand on entre dans le quartier, plan de la ville) et `decor` (train,
  bateaux, étang aux canards). **Ce plan est produit par `python3 tools/art/city_layout.py`** :
  modifier ce script plutôt que le JSON, puis relancer `generate_art.py`.
- `people` : sprite, action de gestion éventuelle, carte d'origine de chaque personne ; `bark`
  facultatif = clé de répliques partagée (« enfant », « footballeur »).
- `seasons` (période → automne, hiver, printemps, ete), `festive_turns`.

Les grilles servent à la fois aux collisions (jeu) et au dessin (`tools/art/world.py`) :
après modification, relancer `python3 tools/art/generate_art.py`. Les tests
`tests/world/test_world.gd` vérifient que tout reste accessible à pied.

## `data/progression/collection.json` — collection permanente (50 objets)

Registre lisible : `docs/COLLECTION.md`, régénéré et vérifié (quotas) par
`python3 tools/collection_registry.py`. Classe : `Collection` (`scripts/progression/collection.gd`).

- `families`, `rarities` (`id`, `label`, `color`), `methods` (libellé et premier indice de chaque mode),
  `exhibit_slots` (places dans les vitrines du hall), `rewards` (`id`, `kind` ∈ outfit, decor, title,
  `label`, `sprite` pour une tenue, `when` : `{"total": n}` ou `{"family": id}`).
- `objects` : `id`, `family`, `rarity`, `name`, `description`, `icon` (`assets/collection/<icon>.png`,
  dessinée par `tools/art/collection_art.py`), `method`, `trigger`, `requires` (facultatif), `say`
  (réplique au moment du don), `gives_clue`, `hint2`, `hint3`, `alternative`, `exhibit`.
- `trigger.type` : `pickup` (`map`, `cell` : objet posé, visible seulement si `requires` est rempli),
  `examine` (`spot` : clé du spot), `talk` (`person` : clé de répliques), `search` (`map`, `cell` :
  cachette, devant le joueur ou sous ses pieds), `visit` (`map`, pour les enquêtes), `state` (`when` :
  conditions vérifiées après chaque étape de la partie), `quest` (récompense d'une enquête).
- Conditions (`requires`, `when`) : `min_turn`, `rules` (format `Rules.check`), `metric_min`,
  `mission_done`, `upgrade`, `achievement`, `event_choice` (`event`, `choices`), `dossier_min`
  (`dossier`, `score`, entraînement compris), `played_min`, `evening`, `owned`, `owned_min`, `clues`,
  `exhibit_min`, `any` (liste d'alternatives).
- `quests` : `id`, `title`, `giver`, `reward`, `requires`, `steps` (`text`, `trigger`, `requires`,
  `tease` = ce que dit la personne s'il manque quelque chose, `say`, `gives_clue`).
- `clues` (`title`, `text`) et `clue_sources` (`clue`, `trigger`, `requires`, `say`).
- `migrate_album` : correspondance des anciens trésors de l'album 0.13.

Le profil du joueur (`user://collection.json`) garde les objets, indices, étapes d'enquêtes, indices
précis révélés, objets exposés et la tenue. Dans `world.json`, une porte peut demander un indice
(`requires_clue`, `locked`), une personne peut n'arriver que plus tard (`requires`, format
`Rules.check`) et un spot de type `exhibit` ouvre l'exposition.

## `data/world/barks.json` — répliques

`who` (personne, `passant`, ou identifiant d'objet), `text`, `when` (conditions au format
ci-dessous, plus `phase`, `has_upgrade`, `missing_upgrade`), `priority` facultative. La réplique
la plus spécifique (nombre de conditions + priorité) est choisie.

## `data/scenarios/scenarios.json` — scénarios (études de cas)

`order`, puis pour chaque scénario : `title`, `level`, `summary`, `context`, `question`,
`learning` (notions), `start` (`cash`, `stats` qui remplacent `balance.start`), `ledger`
(écritures de départ : `label`, `category`, `amount`, `direction`, `delay` depuis la période 1,
`neutral`), `objectives` (format de `balance.objectives`, une métrique peut être un indicateur),
`renewal_rule` facultatif, `missions` (ids proposés, dans l'ordre), `debrief` (questions).

## `data/missions/missions.json` — missions

`max_active`, puis : `id`, `title`, `giver` (personnage), `offer` (`min_turn`, `max_turn`, `when`
au format des conditions), `pitch`, `goal` (`kind` : `metric` avec `metric_min`/`metric_max`,
`delta` avec `metric` et `min`, `played` avec `show`, `dossier` avec `dossier` et `min_score` ;
`text` lisible), `duration` ou `deadline_turn`, `at_deadline`, `reward` et `penalty` (`effects`
au format des effets, `xp` par compétence), `success_text`, `failure_text`, `takeaway`, `notion`.
Les métriques sont celles de `SeasonEvaluator.metric` (indicateurs, `cash`, `attendance_total`,
`eac_count`, `art_count`, `solidaire_count`…).

## `data/progression/skills.json` et `achievements.json`

Compétences : `levels` (seuils d'expérience), `order`, et pour chacune `label`, `icon`,
`description`, `perks` par niveau (`per_turn`, `offers`, `action_discount`, `incident_mult`,
`overdraft_bonus`). Trophées : `id`, `title`, `text`, `icon`, `when` (`metric_min`, `fill_min`,
`missions_done_min`, `dossier_perfect`, `upgrades_min`, `skill_level_min`, `all_skills_min`,
`never_overdraft`, `renewed`).

Les dossiers sont générés par code (`scripts/progression/dossiers.gd`) : chaque générateur lit la
partie (charges fixes, spectacles, taux de TVA et de droits) et un hasard reproductible.

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

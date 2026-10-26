class_name WorldRules
extends RefCounted
## Règles du monde explorable, sans affichage : objectif à suivre, saison,
## personnes et objets liés aux actions, répliques contextuelles.
## Le monde n'ajoute aucune règle de gestion : il donne seulement accès,
## à pied, aux décisions de GameSession.

const SEASON_LABELS := {"automne": "Automne", "hiver": "Hiver", "printemps": "Printemps", "ete": "Été"}


static func season(world: WorldData, turn: int) -> String:
	return str(world.seasons.get(str(turn), "automne"))


static func is_festive(world: WorldData, turn: int) -> bool:
	for t: Variant in world.festive_turns:
		if int(t) == turn:
			return true
	return false


## La soirée de représentation et son bilan se passent à la nuit tombée.
static func is_evening(state: GameState) -> bool:
	return state.phase in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]


## Personne qui porte l'événement en cours et attend une décision, ou "".
static func event_character(session: GameSession) -> String:
	var s := session.state
	if s.phase != GameState.PHASE_EVENT or s.current_event == "" or s.event_choice != "":
		return ""
	return str(session.current_event().get("character", ""))


## Objectif affiché en haut de l'écran : {text, map, kind ("spot"|"npc"), id}.
static func objective(session: GameSession) -> Dictionary:
	var s := session.state
	var desk := {"map": "bureau", "kind": "spot", "id": "cahier"}
	match s.phase:
		GameState.PHASE_SITUATION, GameState.PHASE_PROGRAMMING:
			return _with(desk, "Montez au bureau : la programmation de %s vous attend." % session.period_name().to_lower())
		GameState.PHASE_MANAGEMENT:
			return _with(desk, "Décidez des actions auprès de l'équipe et des partenaires (%d / %d), puis signez la feuille de route à votre bureau." % [s.actions.size(), session.action_capacity()])
		GameState.PHASE_EVENT:
			var who := event_character(session)
			if who != "":
				var world := WorldData.get_default()
				return {"text": "%s a besoin de vous parler !" % session.data.character_name(who),
						"map": world.home_of(who), "kind": "npc", "id": who}
			return _with(desk, "Tout est prêt : lancez la soirée depuis votre bureau.")
		GameState.PHASE_REPORT:
			return _with(desk, "La soirée est finie. Lisez le bilan de la période à votre bureau.")
	return _with(desk, "La saison est terminée : le bilan vous attend à votre bureau.")


static func _with(target: Dictionary, text: String) -> Dictionary:
	var out := target.duplicate()
	out["text"] = text
	return out


## Action de gestion proposée par une personne ou un objet ("" sinon).
static func action_of(world: WorldData, map_id: String, kind: String, target_id: String) -> String:
	if kind == "npc":
		return str(world.people.get(target_id, {}).get("action", ""))
	var m := world.map(map_id)
	if m == null:
		return ""
	return str(m.spot(target_id).get("action", ""))


## Toutes les sources d'actions du monde : [{map, kind, id, action}].
static func action_sources(world: WorldData) -> Array:
	var out: Array = []
	for pid: String in world.people:
		var a := str(world.people[pid].get("action", ""))
		if a != "":
			out.append({"map": world.home_of(pid), "kind": "npc", "id": pid, "action": a})
	for mid: String in world.maps:
		for sp: Dictionary in (world.maps[mid] as WorldMap).spots:
			if sp.get("kind", "") == "action":
				out.append({"map": mid, "kind": "spot", "id": sp["id"], "action": sp["action"]})
	return out


## Nombre de spectateurs qui flânent dans le hall (selon la fidélité et la programmation).
static func hall_crowd(state: GameState) -> int:
	if state.programmed.is_empty() and state.phase != GameState.PHASE_REPORT:
		return 1 if state.stat("fidelite") >= 40.0 else 0
	return clampi(1 + int(state.stat("fidelite") / 20.0), 1, 6)


## Réplique d'une personne ou d'un objet. `roll` (0..1) départage les répliques
## également spécifiques ; la plus spécifique (conditions + priorité) est préférée.
static func bark(data: GameData, state: GameState, world: WorldData, who: String, roll: float) -> String:
	var best: Array = []
	var best_score := -1
	for b: Dictionary in world.barks:
		if str(b["who"]) != who:
			continue
		var when: Dictionary = b.get("when", {})
		if not bark_matches(data, state, when):
			continue
		var score := when.size() + int(b.get("priority", 0))
		if score > best_score:
			best_score = score
			best = [b]
		elif score == best_score:
			best.append(b)
	if best.is_empty():
		return ""
	var i := clampi(int(roll * best.size()), 0, best.size() - 1)
	return str(best[i]["text"])


static func bark_matches(data: GameData, state: GameState, when: Dictionary) -> bool:
	if when.has("phase") and not state.phase in when["phase"]:
		return false
	if when.has("has_upgrade") and not str(when["has_upgrade"]) in state.upgrades:
		return false
	if when.has("missing_upgrade") and str(when["missing_upgrade"]) in state.upgrades:
		return false
	var rest := when.duplicate()
	for key: String in ["phase", "has_upgrade", "missing_upgrade"]:
		rest.erase(key)
	return Rules.check(rest, data, state)


## Texte d'une rénovation pour la boîte de dialogue (coût, amortissement, effets).
static func upgrade_pitch(session: GameSession, upgrade_id: String) -> String:
	var u: Dictionary = session.data.upgrades[upgrade_id]
	return "%s — %s\n%s\nPrix : %s (payé %s). Amortissement : %s par période pendant %d ans." % [
		u["label"], u["summary"], u["description"], Format.money(int(u["cost"])),
		"comptant" if int(u.get("payment_delay", 0)) == 0 else "à 30 jours",
		Format.money(session.amortization_per_turn(upgrade_id)), int(u["useful_life_years"])]


## Texte d'une action pour la boîte de dialogue.
static func action_pitch(session: GameSession, action_id: String) -> String:
	var a: Dictionary = session.data.actions[action_id]
	var pay := "payée dans la période" if int(a.get("payment_delay", 0)) == 0 else "facture à 30 jours"
	return "%s — %s\nCoût : %s (%s)." % [a["label"], a["summary"], Format.money(Programming.action_cost(session.data, session.state, action_id)), pay]


# --- Ambiance : moment de la journée, météo, sons (sans effet sur la gestion) ----------------

## Moment de la journée selon l'étape : matin (cahier), journée (actions),
## fin de journée (imprévu, soirée qui approche), nuit (après le spectacle).
static func time_of_day(state: GameState) -> String:
	match state.phase:
		GameState.PHASE_SITUATION, GameState.PHASE_PROGRAMMING:
			return "matin"
		GameState.PHASE_MANAGEMENT:
			return "jour"
		GameState.PHASE_EVENT:
			return "fin_de_journee"
	return "nuit"


## Temps qu'il fait pendant une période (reproductible : même graine, même ciel).
static func weather(world: WorldData, state: GameState) -> String:
	var rng := SeededRng.make(state.game_seed, state.turn, SeededRng.CHANNEL_WEATHER)
	var r := rng.randf()
	match season(world, state.turn):
		"hiver":
			return "neige" if r < 0.7 else "clair"
		"automne":
			return "pluie" if r < 0.4 else "clair"
		"printemps":
			return "pluie" if r < 0.3 else "clair"
	return "pluie" if r < 0.1 else "clair"


## Musique et couches d'ambiance d'un lieu. `water_dist` : distance (en cases) à
## l'eau la plus proche ; `crowd` : nombre de spectateurs dans le hall.
static func soundscape(map: WorldMap, cell: Vector2i, season_id: String, tod: String, sky: String,
		festive: bool, water_dist: int = 99, crowd: int = 0) -> Dictionary:
	var night := tod == "nuit"
	var layers := {}
	var music := "foyer"
	if map.outdoor:
		music = "ville_nuit" if night else ("ville_fetes" if festive and season_id == "hiver" else "ville_jour")
		var district := str(map.district_at(cell).get("id", ""))
		var green := district in ["parc", "parc_sud"]
		layers["ville"] = (0.3 if green else (0.5 if district == "coteaux" else 0.7)) * (0.5 if night else 1.0)
		if not night and season_id != "hiver" and sky != "pluie":
			layers["oiseaux"] = 0.9 if green else (0.55 if district == "quais" else 0.3)
		layers["vent"] = {"hiver": 0.55, "automne": 0.45}.get(season_id, 0.15)
		if season_id == "ete" and not night:
			layers["cigales"] = 0.6 if green or district == "coteaux" else 0.2
		if night and season_id in ["ete", "printemps"]:
			layers["grillons"] = 0.8 if green else 0.35
		if sky == "pluie":
			layers["pluie"] = 0.9
		if water_dist < 9:
			layers["riviere"] = 0.9 * (1.0 - water_dist / 9.0)
	else:
		match map.id:
			"hall":
				layers["foule"] = clampf(0.12 + crowd * 0.12, 0.0, 0.8)
			"salle":
				layers["salle"] = 0.6
			"coulisses":
				layers["coulisses"] = 0.45
			"bureau":
				layers["bureau"] = 0.8
			"reserve":
				layers["reserve"] = 0.85
				music = "reserve"
		if sky == "pluie":
			layers["pluie"] = 0.25  # la pluie qu'on entend à travers les murs
	return {"music": music, "layers": layers}


## Surface sous les pieds : pierre, herbe, bois, tapis, beton ou neige.
static func footstep_surface(map: WorldMap, cell: Vector2i, season_id: String, sky: String) -> String:
	var g := map.ground_at(cell)
	match map.id:
		"hall":
			return "tapis" if g == "," else "pierre"
		"salle":
			return "bois" if g in ["p", "r"] else "tapis"
		"coulisses", "reserve":
			return "beton"
		"bureau":
			return "bois"
	if g == "P":
		return "bois"
	if g in ["g", ":"]:
		return "neige" if season_id == "hiver" and sky == "neige" else "herbe"
	if g == "+" and season_id == "hiver" and sky == "neige":
		return "neige"
	return "pierre"

class_name Programming
extends RefCounted
## Propositions artistiques de chaque période et validation de la programmation.


## Tire les propositions de la période : au moins une forme populaire, une
## œuvre exigeante et une petite forme, puis des propositions au hasard.
static func draw_offers(data: GameData, state: GameState, count: int = 5) -> Array:
	var rng := SeededRng.make(state.game_seed, state.turn, SeededRng.CHANNEL_OFFERS)
	var pool: Array = []
	for id: String in data.show_order:
		if not id in state.played_shows:
			pool.append(id)
	var offers: Array = []
	var buckets: Array[Callable] = [
		func(s: Dictionary) -> bool: return s["format"] == "salle" and float(s["art"]) < 0.5,
		func(s: Dictionary) -> bool: return data.is_artistic(s) and s["format"] != "petit",
		func(s: Dictionary) -> bool: return s["format"] != "salle",
	]
	for bucket in buckets:
		var candidates: Array = []
		for id: String in pool:
			if not id in offers and bucket.call(data.shows[id]):
				candidates.append(id)
		if not candidates.is_empty():
			offers.append(candidates[rng.randi_range(0, candidates.size() - 1)])
	var rest: Array = []
	var weights: Array = []
	for id: String in pool:
		if not id in offers:
			rest.append(id)
			weights.append(_offer_weight(data, state, data.shows[id]))
	while offers.size() < count and not rest.is_empty():
		var pick: Variant = SeededRng.weighted_pick(rng, rest, weights)
		var i := rest.find(pick)
		offers.append(pick)
		rest.remove_at(i)
		weights.remove_at(i)
	return offers


## Les spectacles de saison (fêtes, hiver…) sont plus souvent proposés au bon moment.
static func _offer_weight(data: GameData, state: GameState, show: Dictionary) -> float:
	var weight := 1.0
	var bonus: Dictionary = show.get("season_bonus", {})
	for tag: String in data.period(state.turn).get("tags", []):
		if bonus.has(tag):
			weight *= 2.5
	if not bonus.is_empty() and is_equal_approx(weight, 1.0):
		weight = 0.6
	return weight


## Raison pour laquelle un spectacle ne peut pas être programmé ("" si possible).
static func unavailable_reason(data: GameData, state: GameState, show_id: String) -> String:
	if not data.shows.has(show_id):
		return "Proposition inconnue."
	if not show_id in state.offers:
		return "Cette proposition n'est pas disponible cette période."
	if show_id in state.played_shows:
		return "Ce spectacle a déjà été programmé cette saison."
	var show: Dictionary = data.shows[show_id]
	var min_eq := float(show.get("min_equipement", 0))
	if state.stat("equipement") < min_eq:
		return "Plateau insuffisant : équipements à %d %% minimum (actuellement %d %%)." % [int(min_eq), int(state.stat("equipement"))]
	return ""


## Vérifie une programmation complète. Retourne "" si elle est valide.
static func validate(data: GameData, state: GameState, programmed: Array) -> String:
	var slots: Dictionary = data.balance["slots"]
	if programmed.size() > int(slots["total"]):
		return "%d créneaux au maximum par période." % int(slots["total"])
	var hall := 0
	var seen: Array = []
	for entry: Dictionary in programmed:
		var id := str(entry.get("show_id", ""))
		if id in seen:
			return "Un même spectacle ne peut pas être programmé deux fois."
		seen.append(id)
		var reason := unavailable_reason(data, state, id)
		if reason != "":
			return reason
		if data.price_level(str(entry.get("price_level", ""))).is_empty():
			return "Niveau de tarif invalide."
		if data.uses_hall(data.shows[id]):
			hall += 1
	if hall > int(slots["hall_max"]):
		return "%d créneau(x) au maximum en grande salle (résidence comprise)." % int(slots["hall_max"])
	return ""


## Nombre d'actions de gestion autorisées cette période.
static func action_capacity(data: GameData, state: GameState) -> int:
	var cap := int(data.balance["team_actions_per_turn"])
	if state.stat("equipe") >= float(data.balance["team_actions_bonus_threshold"]):
		cap += 1
	return cap


static func validate_actions(data: GameData, state: GameState, actions: Array) -> String:
	if actions.size() > action_capacity(data, state):
		return "L'équipe ne peut mener que %d action(s) cette période." % action_capacity(data, state)
	var seen: Array = []
	for id: String in actions:
		if not data.actions.has(id):
			return "Action inconnue : %s" % id
		if id in seen:
			return "Chaque action ne peut être choisie qu'une fois par période."
		seen.append(id)
		if int(data.actions[id].get("cost", 0)) < 0:
			return "Coût d'action invalide."
	return ""

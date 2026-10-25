class_name EventSystem
extends RefCounted
## Sélection et résolution des événements narratifs.


static func eligible(data: GameData, state: GameState) -> Array:
	var out: Array = []
	for id: String in data.event_order:
		var event: Dictionary = data.events[id]
		if bool(event.get("once", true)) and id in state.seen_events:
			continue
		if Rules.check(event.get("conditions", {}), data, state):
			out.append(id)
	return out


## Choisit l'événement de la période : un événement « forcé » éligible passe
## en priorité ; sinon tirage pondéré reproductible. "" si aucun n'est éligible.
static func pick(data: GameData, state: GameState) -> String:
	var candidates := eligible(data, state)
	if candidates.is_empty():
		return ""
	var forced: Array = []
	for id: String in candidates:
		if bool(data.events[id].get("forced", false)):
			forced.append(id)
	if not forced.is_empty():
		forced.sort_custom(func(a: String, b: String) -> bool:
			return int(data.events[a].get("priority", 0)) > int(data.events[b].get("priority", 0)))
		return forced[0]
	var weights: Array = []
	for id: String in candidates:
		weights.append(float(data.events[id].get("weight", 5)))
	var rng := SeededRng.make(state.game_seed, state.turn, SeededRng.CHANNEL_EVENT)
	var picked: Variant = SeededRng.weighted_pick(rng, candidates, weights)
	return "" if picked == null else str(picked)


static func find_choice(data: GameData, event_id: String, choice_id: String) -> Dictionary:
	for choice: Dictionary in data.events.get(event_id, {}).get("choices", []):
		if choice["id"] == choice_id:
			return choice
	return {}


## "" si le choix est possible, sinon la raison affichable.
static func choice_block_reason(data: GameData, state: GameState, event_id: String, choice_id: String) -> String:
	var choice := find_choice(data, event_id, choice_id)
	if choice.is_empty():
		return "Choix inconnu."
	var req: Dictionary = choice.get("requires", {})
	if req.is_empty():
		return ""
	if bool(req.get("has_show", false)) and state.programmed.is_empty():
		return "Aucun spectacle programmé cette période."
	for id: String in req.get("stat_min", {}):
		if Rules.stat_value(data, state, id) < float(req["stat_min"][id]):
			return "%s insuffisante (%d requis)." % [Rules.STAT_LABELS.get(id, id), int(req["stat_min"][id])]
	if req.has("cash_min") and state.cash < int(req["cash_min"]):
		return "Trésorerie insuffisante."
	return ""


## Probabilité affichée pour les choix « pari » (−1 si le choix n'est pas aléatoire).
static func choice_probability(data: GameData, state: GameState, event_id: String, choice_id: String) -> float:
	var effects: Dictionary = find_choice(data, event_id, choice_id).get("effects", {})
	if not effects.has("chance"):
		return -1.0
	return Rules.chance_probability(effects["chance"], data, state)

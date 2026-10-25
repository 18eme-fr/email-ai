class_name Rules
extends RefCounted
## Conditions et effets génériques, partagés par les actions, les événements et
## les spectacles. Le format est décrit dans docs/DATA_FORMAT.md.

const STAT_LABELS := {
	"reputation": "Réputation artistique",
	"fidelite": "Fidélité des publics",
	"diversite": "Diversité des publics",
	"equipe": "Équipe",
	"equipement": "Équipements",
	"communication": "Communication",
	"relations": "Relations partenaires",
	"rayonnement": "Rayonnement",
}


## Rayonnement : indicateur visible calculé à partir de trois variables internes.
static func rayonnement(data: GameData, state: GameState) -> float:
	var w: Dictionary = data.balance.get("rayonnement_weights", {"reputation": 0.5, "relations": 0.25, "diversite": 0.25})
	var total := 0.0
	for id: String in w:
		total += float(w[id]) * state.stat(id)
	return clampf(total, 0.0, 100.0)


static func stat_value(data: GameData, state: GameState, id: String) -> float:
	if id == "rayonnement":
		return rayonnement(data, state)
	return state.stat(id)


# --- Conditions -----------------------------------------------------------------

static func check(cond: Dictionary, data: GameData, state: GameState) -> bool:
	if cond.is_empty():
		return true
	if cond.has("min_turn") and state.turn < int(cond["min_turn"]):
		return false
	if cond.has("max_turn") and state.turn > int(cond["max_turn"]):
		return false
	if cond.has("turns"):
		var turns: Array = cond["turns"]
		var ok := false
		for t: Variant in turns:
			if int(t) == state.turn:
				ok = true
		if not ok:
			return false
	if cond.has("cash_max") and state.cash > int(cond["cash_max"]):
		return false
	if cond.has("cash_min") and state.cash < int(cond["cash_min"]):
		return false
	for id: String in cond.get("stat_min", {}):
		if stat_value(data, state, id) < float(cond["stat_min"][id]):
			return false
	for id: String in cond.get("stat_max", {}):
		if stat_value(data, state, id) > float(cond["stat_max"][id]):
			return false
	for flag: String in cond.get("flags_all", []):
		if not state.has_flag(flag):
			return false
	for flag: String in cond.get("flags_none", []):
		if state.has_flag(flag):
			return false
	if cond.has("period_tags"):
		var tags: Array = data.period(state.turn).get("tags", [])
		var any := false
		for tag: String in cond["period_tags"]:
			if tag in tags:
				any = true
		if not any:
			return false
	if bool(cond.get("has_show", false)) and state.programmed.is_empty():
		return false
	if bool(cond.get("has_hall_show", false)) and hall_show_index(data, state) < 0:
		return false
	if bool(cond.get("has_art_show", false)) and art_show_index(data, state) < 0:
		return false
	if cond.has("has_tech_show") and tech_show_index(data, state, int(cond["has_tech_show"])) < 0:
		return false
	if cond.has("any_of"):
		var any_ok := false
		for sub: Dictionary in cond["any_of"]:
			if check(sub, data, state):
				any_ok = true
		if not any_ok:
			return false
	return true


## Index du premier spectacle programmé en grande salle (hors résidence), ou -1.
static func hall_show_index(data: GameData, state: GameState) -> int:
	for i in state.programmed.size():
		var show: Dictionary = data.shows.get(state.programmed[i]["show_id"], {})
		if show.get("format", "") == "salle":
			return i
	return -1


static func art_show_index(data: GameData, state: GameState) -> int:
	for i in state.programmed.size():
		var show: Dictionary = data.shows.get(state.programmed[i]["show_id"], {})
		if show.get("format", "") == "salle" and float(show.get("art", 0.0)) >= float(data.balance.get("critics_art_threshold", 0.6)):
			return i
	return -1


static func tech_show_index(data: GameData, state: GameState, min_level: int) -> int:
	for i in state.programmed.size():
		var show: Dictionary = data.shows.get(state.programmed[i]["show_id"], {})
		if int(show.get("tech_level", 0)) >= min_level:
			return i
	return -1


# --- Effets -----------------------------------------------------------------------

## Les indicateurs « de réputation » (balance.soft_cap.stats) progressent de plus
## en plus lentement quand ils sont hauts (rendements décroissants).
static func change_stat(state: GameState, id: String, delta: float, source: String) -> void:
	if not id in GameState.STAT_IDS or is_zero_approx(delta):
		return
	var before := state.stat(id)
	var cap: Dictionary = GameData.get_default().balance.get("soft_cap", {})
	if delta > 0.0 and id in cap.get("stats", []):
		delta *= clampf(float(cap["offset"]) - before / float(cap["divisor"]), float(cap["minimum"]), 1.0)
	state.set_stat(id, before + delta)
	var applied := state.stat(id) - before
	if not is_zero_approx(applied):
		state.stat_log.append({"stat": id, "delta": applied, "source": source})


## Applique un dictionnaire d'effets. Retourne un résumé (utile pour l'interface
## et les rapports) : {notes: [String], chance: {...}}.
static func apply(effects: Dictionary, data: GameData, state: GameState, source: String, salt: int = 0) -> Dictionary:
	var summary := {"notes": [], "chance": {}}
	if effects.has("cash"):
		var amount := int(effects["cash"])
		var label := str(effects.get("cash_label", source))
		if amount < 0:
			Ledger.add(state, label, "evenement", -amount, Ledger.EXPENSE, state.turn, state.turn, {"source": source})
		elif amount > 0:
			Ledger.add(state, label, "evenement", amount, Ledger.INCOME, state.turn, state.turn, {"source": source})
	for item: Dictionary in effects.get("ledger", []):
		var delay := int(item.get("delay", 0))
		Ledger.add(state, str(item["label"]), str(item.get("category", "evenement")), int(item["amount"]),
				int(item.get("direction", 1)), state.turn, state.turn + delay,
				{"neutral": item.get("neutral", false), "source": source})
	for id: String in effects.get("stats", {}):
		change_stat(state, id, float(effects["stats"][id]), source)
	if effects.has("eac"):
		state.totals["eac_count"] = int(state.totals["eac_count"]) + int(effects["eac"])
	for flag: String in effects.get("flags", []):
		state.flags[flag] = state.turn
	for flag: String in effects.get("clear_flags", []):
		state.flags.erase(flag)
	if effects.has("demand_mult"):
		state.turn_mods["demand_mult"] = float(state.turn_mods.get("demand_mult", 1.0)) * float(effects["demand_mult"])
	if effects.has("price_mult"):
		state.turn_mods["price_mult"] = float(state.turn_mods.get("price_mult", 1.0)) * float(effects["price_mult"])
	if effects.has("quality_mod"):
		state.turn_mods["quality_mod"] = float(state.turn_mods.get("quality_mod", 0.0)) + float(effects["quality_mod"])
	if bool(effects.get("cancel_show", false)):
		var idx := hall_show_index(data, state)
		if idx >= 0:
			state.turn_mods["cancel_index"] = idx
	if bool(effects.get("add_representation", false)):
		var idx := art_show_index(data, state)
		if idx < 0:
			idx = hall_show_index(data, state)
		if idx >= 0:
			state.turn_mods["add_representation_index"] = idx
	if effects.has("chance"):
		summary["chance"] = _resolve_chance(effects["chance"], data, state, source, salt)
	return summary


static func chance_probability(chance: Dictionary, data: GameData, state: GameState) -> float:
	var p := float(chance.get("base", 0.5))
	if chance.has("stat"):
		p += float(chance.get("per_point", 0.0)) * stat_value(data, state, str(chance["stat"]))
	return clampf(p, 0.05, 0.95)


static func _resolve_chance(chance: Dictionary, data: GameData, state: GameState, source: String, salt: int) -> Dictionary:
	var p := chance_probability(chance, data, state)
	var rng := SeededRng.make(state.game_seed, state.turn, SeededRng.CHANNEL_CHANCE, salt)
	var success := rng.randf() < p
	var branch: Dictionary = chance.get("success" if success else "failure", {})
	apply(branch, data, state, source, salt + 1)
	return {"label": str(chance.get("label", "Le pari")), "probability": p, "success": success}

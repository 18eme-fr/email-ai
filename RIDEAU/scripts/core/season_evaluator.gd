class_name SeasonEvaluator
extends RefCounted
## Objectifs de la convention, décision de renouvellement, fins et enseignements.


static func metric(data: GameData, state: GameState, id: String) -> float:
	match id:
		"cash":
			return float(state.cash)
		"attendance_total", "eac_count", "art_count", "shows_count":
			return float(state.totals.get(id, 0))
		_:
			return Rules.stat_value(data, state, id)


static func objectives(data: GameData, state: GameState) -> Array:
	var out: Array = []
	for obj: Dictionary in data.balance.get("objectives", []):
		var value := metric(data, state, str(obj["metric"]))
		out.append({
			"id": obj["id"], "label": obj["label"], "target": float(obj["target"]),
			"value": value, "met": value >= float(obj["target"]),
			"required": bool(obj.get("required", false)), "notion": obj.get("notion", ""),
		})
	return out


## Le solde de la subvention est versé si assez d'objectifs « missions »
## (hors équilibre financier) sont tenus et si les relations restent correctes.
static func conditional_subsidy_granted(data: GameData, state: GameState) -> bool:
	var rule: Dictionary = data.balance["renewal_rule"]
	var required: Array = rule.get("required", [])
	var others := 0
	for obj: Dictionary in objectives(data, state):
		if not obj["id"] in required and obj["met"]:
			others += 1
	return others >= int(rule["others_needed"]) and state.stat("relations") >= float(rule["min_relations"])


static func renewed(data: GameData, state: GameState) -> bool:
	if state.bankrupt:
		return false
	var rule: Dictionary = data.balance["renewal_rule"]
	var required: Array = rule.get("required", [])
	for obj: Dictionary in objectives(data, state):
		if obj["id"] in required and not obj["met"]:
			return false
	return conditional_subsidy_granted(data, state)


static func _matches(cond: Dictionary, data: GameData, state: GameState, is_renewed: bool) -> bool:
	if cond.has("bankrupt") and bool(cond["bankrupt"]) != state.bankrupt:
		return false
	if cond.has("renewed") and bool(cond["renewed"]) != is_renewed:
		return false
	for id: String in cond.get("stat_min", {}):
		if Rules.stat_value(data, state, id) < float(cond["stat_min"][id]):
			return false
	for id: String in cond.get("stat_max", {}):
		if Rules.stat_value(data, state, id) > float(cond["stat_max"][id]):
			return false
	for id: String in cond.get("metric_min", {}):
		if metric(data, state, id) < float(cond["metric_min"][id]):
			return false
	for id: String in cond.get("metric_max", {}):
		if metric(data, state, id) > float(cond["metric_max"][id]):
			return false
	return true


static func evaluate(data: GameData, state: GameState) -> Dictionary:
	var is_renewed := renewed(data, state)
	var chosen: Dictionary = {}
	for ending: Dictionary in data.endings:
		if _matches(ending.get("conditions", {}), data, state, is_renewed):
			chosen = ending
			break
	var lessons: Array = []
	for lesson: Dictionary in data.lessons:
		if lessons.size() >= 4:
			break
		if _matches(lesson.get("when", {}), data, state, is_renewed):
			lessons.append(lesson["text"])
	return {
		"renewed": is_renewed,
		"bankrupt": state.bankrupt,
		"ending_id": chosen.get("id", ""),
		"title": chosen.get("title", "Fin de saison"),
		"text": chosen.get("text", ""),
		"tone": chosen.get("tone", "mixed"),
		"objectives": objectives(data, state),
		"lessons": lessons,
		"score": score(data, state),
	}


## Score indicatif sur 100, pour comparer ses saisons (et équilibrer le jeu).
static func score(data: GameData, state: GameState) -> int:
	if state.bankrupt:
		return 0
	var s := 0.0
	for obj: Dictionary in objectives(data, state):
		s += 15.0 if obj["met"] else 15.0 * clampf(float(obj["value"]) / maxf(float(obj["target"]), 1.0), 0.0, 1.0) * 0.5
	s += 0.2 * Rules.rayonnement(data, state)
	s += 0.2 * state.stat("fidelite")
	return clampi(roundi(s), 0, 100)

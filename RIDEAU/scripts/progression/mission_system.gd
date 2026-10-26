class_name MissionSystem
extends RefCounted
## Missions confiées par les personnages (data/missions/missions.json) :
## proposition, acceptation, suivi, réussite ou échec à l'échéance, récompenses.
##
## state.missions : id -> {status: offered|active|done|failed|expired|declined,
##                         offered_turn, accepted_turn, deadline, base: {métrique: valeur}, ended_turn}

const MAX_OFFERED := 3


static func scenario_missions(data: GameData, state: GameState) -> Array:
	return data.scenario(state.scenario).get("missions", data.mission_order)


static func status(state: GameState, mission_id: String) -> String:
	return str(state.missions.get(mission_id, {}).get("status", ""))


static func with_status(state: GameState, wanted: String) -> Array:
	var out: Array = []
	for id: String in state.missions:
		if state.missions[id]["status"] == wanted:
			out.append(id)
	return out


## Début de période : retire les propositions périmées, en propose de nouvelles.
static func refresh_offers(data: GameData, state: GameState) -> void:
	for id: String in state.missions:
		var m: Dictionary = state.missions[id]
		if m["status"] == "offered" and state.turn > int(data.missions[id]["offer"].get("max_turn", data.turns())):
			m["status"] = "expired"
	var offered := with_status(state, "offered").size()
	for id: String in scenario_missions(data, state):
		if offered >= MAX_OFFERED:
			break
		if state.missions.has(id) or not data.missions.has(id):
			continue
		var offer: Dictionary = data.missions[id].get("offer", {})
		if state.turn < int(offer.get("min_turn", 1)) or state.turn > int(offer.get("max_turn", data.turns())):
			continue
		if not Rules.check(offer.get("when", {}), data, state):
			continue
		state.missions[id] = {"status": "offered", "offered_turn": state.turn}
		offered += 1
		state.notices.append({"kind": "mission_offered", "mission": id, "giver": data.missions[id]["giver"],
			"text": "%s vous propose une mission : « %s »." % [data.character_name(str(data.missions[id]["giver"])), data.missions[id]["title"]]})


static func accept(data: GameData, state: GameState, mission_id: String) -> String:
	if status(state, mission_id) != "offered":
		return "Cette mission n'est pas proposée en ce moment."
	if with_status(state, "active").size() >= int(data.missions_max_active):
		return "Vous menez déjà %d missions : terminez-en une d'abord." % int(data.missions_max_active)
	if state.phase in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]:
		return "Les missions s'acceptent pendant la période, avant la soirée."
	var def: Dictionary = data.missions[mission_id]
	var deadline := int(def.get("deadline_turn", state.turn + int(def.get("duration", 2)) - 1))
	deadline = clampi(deadline, state.turn, data.turns())
	var base := {}
	var goal: Dictionary = def["goal"]
	if goal["kind"] == "delta":
		base[goal["metric"]] = SeasonEvaluator.metric(data, state, str(goal["metric"]))
	var m: Dictionary = state.missions[mission_id]
	m["status"] = "active"
	m["accepted_turn"] = state.turn
	m["deadline"] = deadline
	m["base"] = base
	return ""


static func decline(state: GameState, mission_id: String) -> void:
	if status(state, mission_id) == "offered":
		state.missions[mission_id]["status"] = "declined"


## Progression lisible : {text, ratio (0..1)}.
static func progress(data: GameData, state: GameState, mission_id: String) -> Dictionary:
	var def: Dictionary = data.missions[mission_id]
	var goal: Dictionary = def["goal"]
	var m: Dictionary = state.missions.get(mission_id, {})
	match str(goal["kind"]):
		"metric":
			var parts: Array = []
			var ratio := 1.0
			for key: String in goal.get("metric_min", {}):
				var v := SeasonEvaluator.metric(data, state, key)
				var target := float(goal["metric_min"][key])
				parts.append("%s / %s" % [Format.thousands(roundi(v)), Format.thousands(roundi(target))])
				ratio = minf(ratio, clampf(v / target, 0.0, 1.0) if target > 0.0 else (1.0 if v >= target else 0.0))
			return {"text": ", ".join(parts), "ratio": ratio}
		"delta":
			var done := SeasonEvaluator.metric(data, state, str(goal["metric"])) - float(m.get("base", {}).get(goal["metric"], 0.0))
			return {"text": "%d / %d" % [roundi(done), int(goal["min"])], "ratio": clampf(done / float(goal["min"]), 0.0, 1.0)}
		"played":
			var played: bool = goal["show"] in state.played_shows
			return {"text": "joué" if played else "pas encore programmé", "ratio": 1.0 if played else 0.0}
		"dossier":
			var best := best_dossier_score(state, str(goal["dossier"]), int(m.get("accepted_turn", 1)))
			return {"text": "meilleur score : %d %%" % roundi(best * 100) if best >= 0.0 else "dossier à ouvrir", "ratio": maxf(best, 0.0)}
	return {"text": "", "ratio": 0.0}


static func best_dossier_score(state: GameState, dossier_id: String, since_turn: int = 1) -> float:
	var best := -1.0
	for r: Dictionary in state.dossiers:
		if r["id"] == dossier_id and not r.get("practice", false) and int(r["turn"]) >= since_turn:
			best = maxf(best, float(r["score"]))
	return best


static func goal_met(data: GameData, state: GameState, mission_id: String) -> bool:
	var goal: Dictionary = data.missions[mission_id]["goal"]
	var m: Dictionary = state.missions.get(mission_id, {})
	match str(goal["kind"]):
		"metric":
			for key: String in goal.get("metric_min", {}):
				if SeasonEvaluator.metric(data, state, key) < float(goal["metric_min"][key]):
					return false
			for key: String in goal.get("metric_max", {}):
				if SeasonEvaluator.metric(data, state, key) > float(goal["metric_max"][key]):
					return false
			return true
		"delta":
			return SeasonEvaluator.metric(data, state, str(goal["metric"])) - float(m.get("base", {}).get(goal["metric"], 0.0)) >= float(goal["min"])
		"played":
			return goal["show"] in state.played_shows
		"dossier":
			return best_dossier_score(state, str(goal["dossier"]), int(m.get("accepted_turn", 1))) >= float(goal.get("min_score", 0.6))
	return false


## Un dossier vient d'être rendu : termine les missions qui l'attendaient.
static func on_dossier(data: GameData, state: GameState) -> Array:
	var out: Array = []
	for id: String in with_status(state, "active"):
		if data.missions[id]["goal"]["kind"] == "dossier" and goal_met(data, state, id):
			out.append(_finish(data, state, id, true))
	return out


## Fin de période (avant les règlements) : réussites et échéances.
static func end_of_period(data: GameData, state: GameState) -> Array:
	var out: Array = []
	for id: String in with_status(state, "active"):
		var def: Dictionary = data.missions[id]
		var m: Dictionary = state.missions[id]
		var deadline := int(m["deadline"])
		var at_deadline := bool(def.get("at_deadline", false))
		if def["goal"]["kind"] != "dossier" and (not at_deadline or state.turn >= deadline) and goal_met(data, state, id):
			out.append(_finish(data, state, id, true))
		elif state.turn >= deadline:
			out.append(_finish(data, state, id, false))
	return out


static func _finish(data: GameData, state: GameState, mission_id: String, success: bool) -> Dictionary:
	var def: Dictionary = data.missions[mission_id]
	var m: Dictionary = state.missions[mission_id]
	m["status"] = "done" if success else "failed"
	m["ended_turn"] = state.turn
	var block: Dictionary = def.get("reward" if success else "penalty", {})
	Rules.apply(block.get("effects", {}), data, state, "Mission « %s »" % def["title"], hash(mission_id))
	for skill: String in block.get("xp", {}):
		SkillSystem.add_xp(data, state, skill, int(block["xp"][skill]))
	var outcome := {"id": mission_id, "title": def["title"], "giver": def["giver"], "success": success,
		"text": def.get("success_text" if success else "failure_text", ""), "takeaway": def.get("takeaway", ""),
		"notion": def.get("notion", ""), "reward": reward_text(data, block)}
	state.notices.append({"kind": "mission_done" if success else "mission_failed", "mission": mission_id, "outcome": outcome,
		"text": "Mission %s : « %s »" % ["réussie" if success else "échouée", def["title"]]})
	if success:
		state.key_decisions.append({"turn": state.turn, "text": "Mission réussie : %s" % def["title"], "kind": "mission"})
	return outcome


## Résumé lisible d'une récompense ou d'une pénalité.
static func reward_text(data: GameData, block: Dictionary) -> String:
	var parts: Array = []
	var effects: Dictionary = block.get("effects", {})
	if effects.has("cash"):
		parts.append(Format.signed_money(int(effects["cash"])))
	for stat: String in effects.get("stats", {}):
		parts.append("%s %s" % [Rules.STAT_LABELS.get(stat, stat), Format.signed_int(roundi(float(effects["stats"][stat])))])
	for skill: String in block.get("xp", {}):
		parts.append("+%d XP %s" % [int(block["xp"][skill]), str(data.skills.get(skill, {}).get("label", skill)).to_lower()])
	return ", ".join(parts)


## Spectacles demandés par une mission en cours : ils doivent figurer dans les propositions.
static func wanted_shows(data: GameData, state: GameState) -> Array:
	var out: Array = []
	for id: String in with_status(state, "active") + with_status(state, "offered"):
		var goal: Dictionary = data.missions[id]["goal"]
		if goal["kind"] == "played" and not goal["show"] in state.played_shows:
			out.append(str(goal["show"]))
	return out

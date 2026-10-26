class_name AchievementSystem
extends RefCounted
## Trophées (data/progression/achievements.json), vérifiés en fin de période.


## Vérifie les trophées ; `report` est le rapport de la période (remplissage des
## spectacles). Retourne les trophées obtenus maintenant.
static func check(data: GameData, state: GameState, report: Dictionary) -> Array:
	var out: Array = []
	for a: Dictionary in data.achievements:
		if a["id"] in state.achievements:
			continue
		if _matches(data, state, report, a.get("when", {})):
			state.achievements.append(a["id"])
			out.append(a)
			state.notices.append({"kind": "achievement", "achievement": a["id"], "text": "Trophée : %s — %s" % [a["title"], a["text"]]})
	return out


static func _matches(data: GameData, state: GameState, report: Dictionary, when: Dictionary) -> bool:
	for key: String in when.get("metric_min", {}):
		if SeasonEvaluator.metric(data, state, key) < float(when["metric_min"][key]):
			return false
	if when.has("fill_min"):
		var best := 0.0
		for s: Dictionary in report.get("shows", []):
			if not s.get("cancelled", false) and int(s.get("capacity_total", 0)) >= 50:
				best = maxf(best, float(s.get("fill", 0.0)))
		if best < float(when["fill_min"]):
			return false
	if when.has("missions_done_min") and MissionSystem.with_status(state, "done").size() < int(when["missions_done_min"]):
		return false
	if when.has("dossier_perfect"):
		var perfect := false
		for r: Dictionary in state.dossiers:
			if not r.get("practice", false) and float(r["score"]) >= 0.999:
				perfect = true
		if not perfect:
			return false
	if when.has("upgrades_min") and state.upgrades.size() < int(when["upgrades_min"]):
		return false
	if when.has("skill_level_min"):
		var best_level := 0
		for skill: String in data.skill_order:
			best_level = maxi(best_level, SkillSystem.level(data, state, skill))
		if best_level < int(when["skill_level_min"]):
			return false
	if when.has("all_skills_min"):
		for skill: String in data.skill_order:
			if SkillSystem.level(data, state, skill) < int(when["all_skills_min"]):
				return false
	if when.has("never_overdraft"):
		if not state.finished:
			return false
		for h: Dictionary in state.history:
			if int(h["cash"]) < 0:
				return false
	if when.has("renewed"):
		if not state.finished or not SeasonEvaluator.renewed(data, state):
			return false
	return true

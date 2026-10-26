class_name SkillSystem
extends RefCounted
## Compétences de la direction : expérience, niveaux et avantages débloqués
## (data/progression/skills.json).


static func xp(state: GameState, skill: String) -> int:
	return int(state.skills_xp.get(skill, 0))


static func level(data: GameData, state: GameState, skill: String) -> int:
	var lvl := 0
	for threshold: Variant in data.skill_levels:
		if xp(state, skill) >= int(threshold):
			lvl += 1
	return maxi(1, lvl)


static func max_level(data: GameData) -> int:
	return data.skill_levels.size()


## Expérience nécessaire pour le niveau suivant (-1 au niveau maximal).
static func next_threshold(data: GameData, state: GameState, skill: String) -> int:
	var lvl := level(data, state, skill)
	return int(data.skill_levels[lvl]) if lvl < data.skill_levels.size() else -1


## Ajoute de l'expérience ; signale un passage de niveau dans state.notices.
static func add_xp(data: GameData, state: GameState, skill: String, amount: int) -> void:
	if amount <= 0 or not data.skills.has(skill):
		return
	var before := level(data, state, skill)
	state.skills_xp[skill] = xp(state, skill) + amount
	var after := level(data, state, skill)
	if after > before:
		var perk: Dictionary = data.skills[skill].get("perks", {}).get(str(after), {})
		state.notices.append({"kind": "level_up", "skill": skill, "level": after,
			"text": "%s : niveau %d ! %s" % [data.skills[skill]["label"], after, "%s — %s" % [perk.get("label", ""), perk.get("text", "")] if not perk.is_empty() else ""]})


## Avantages actifs (tous niveaux atteints, toutes compétences).
static func active_perks(data: GameData, state: GameState) -> Array:
	var out: Array = []
	for skill: String in data.skill_order:
		var lvl := level(data, state, skill)
		var perks: Dictionary = data.skills[skill].get("perks", {})
		for key: String in perks:
			if int(key) <= lvl:
				out.append(perks[key])
	return out


static func per_turn_stats(data: GameData, state: GameState) -> Dictionary:
	var out := {}
	for perk: Dictionary in active_perks(data, state):
		for stat: String in perk.get("per_turn", {}):
			out[stat] = float(out.get(stat, 0.0)) + float(perk["per_turn"][stat])
	return out


static func extra_offers(data: GameData, state: GameState) -> int:
	var n := 0
	for perk: Dictionary in active_perks(data, state):
		n += int(perk.get("offers", 0))
	return n


static func action_cost_mult(data: GameData, state: GameState, action_id: String) -> float:
	var m := 1.0
	for perk: Dictionary in active_perks(data, state):
		var d: Dictionary = perk.get("action_discount", {})
		m *= float(d.get("*", 1.0)) * float(d.get(action_id, 1.0))
	return m


static func incident_mult(data: GameData, state: GameState) -> float:
	var m := 1.0
	for perk: Dictionary in active_perks(data, state):
		m *= float(perk.get("incident_mult", 1.0))
	return m


static func overdraft_bonus(data: GameData, state: GameState) -> int:
	var n := 0
	for perk: Dictionary in active_perks(data, state):
		n += int(perk.get("overdraft_bonus", 0))
	return n

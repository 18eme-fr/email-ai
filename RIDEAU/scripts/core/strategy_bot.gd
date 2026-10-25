class_name StrategyBot
extends RefCounted
## Joueur automatique utilisé par l'outil de simulation et par les tests.
## Chaque stratégie est une manière cohérente de jouer, pas une stratégie optimale.

const STRATEGIES := ["prudente", "artistique", "publics", "equilibre", "aleatoire", "passive"]

## Poids utilisés pour évaluer les effets des choix d'événements.
const WEIGHTS := {
	"prudente": {"cash": 3.0, "reputation": 0.3, "fidelite": 0.6, "diversite": 0.2, "equipe": 0.4, "equipement": 0.4, "relations": 0.5, "communication": 0.2},
	"artistique": {"cash": 1.0, "reputation": 1.5, "fidelite": 0.3, "diversite": 0.3, "equipe": 0.5, "equipement": 0.6, "relations": 0.5, "communication": 0.3},
	"publics": {"cash": 1.0, "reputation": 0.3, "fidelite": 1.0, "diversite": 1.5, "equipe": 0.4, "equipement": 0.3, "relations": 0.8, "communication": 0.3},
	"equilibre": {"cash": 1.8, "reputation": 0.8, "fidelite": 0.8, "diversite": 0.8, "equipe": 0.6, "equipement": 0.5, "relations": 0.9, "communication": 0.3},
}

var strategy: String
var rng := RandomNumberGenerator.new()


func _init(strategy_id: String, bot_seed: int = 0) -> void:
	strategy = strategy_id
	rng.seed = hash([strategy_id, bot_seed])


## Joue une saison complète. Retourne l'état final.
func play_season(session: GameSession) -> GameState:
	var guard := 0
	while not session.state.finished and guard < 100:
		guard += 1
		play_turn(session)
	return session.state


func play_turn(session: GameSession) -> void:
	session.open_programming()
	var programmed := choose_programming(session)
	while session.confirm_programming(programmed) != "":
		if programmed.is_empty():
			break
		programmed.pop_back()
	var actions := choose_actions(session)
	while session.confirm_actions(actions) != "":
		if actions.is_empty():
			break
		actions.pop_back()
	if session.state.current_event != "":
		session.choose_event(choose_event(session))
	session.resolve_turn()
	session.next_turn()


# --- Programmation ---------------------------------------------------------------

func choose_programming(session: GameSession) -> Array:
	var data := session.data
	var state := session.state
	var available: Array = []
	for id: String in state.offers:
		if Programming.unavailable_reason(data, state, id) == "":
			available.append(id)
	if strategy == "passive":
		return []
	if strategy == "aleatoire":
		return _random_programming(session, available)
	var scored: Array = []
	for id: String in available:
		var show: Dictionary = data.shows[id]
		var price := _price_for(show)
		var est := session.estimate(id, price)
		scored.append({"id": id, "score": _show_score(data, show, est), "hall": data.uses_hall(show), "price": price})
	scored.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["score"] > b["score"])
	var out: Array = []
	var hall := 0
	for item: Dictionary in scored:
		if out.size() >= 3:
			break
		if item["score"] <= -1000.0:
			continue
		if item["hall"]:
			if hall >= 2:
				continue
			hall += 1
		out.append({"show_id": item["id"], "price_level": item["price"]})
	# Prudence de trésorerie : on retire les propositions les plus déficitaires
	# tant que la trésorerie prévue reste trop basse.
	while out.size() > 1 and session.projected_cash(out, [])["expected"] < 1500:
		var worst := 0
		var worst_margin := INF
		for i in out.size():
			var m := float(session.estimate(out[i]["show_id"], out[i]["price_level"])["margin"])
			if m < worst_margin:
				worst_margin = m
				worst = i
		if worst_margin > 0.0:
			break
		out.remove_at(worst)
	return out


## La stratégie « publics » applique le tarif solidaire aux spectacles familiaux et jeune public.
func _price_for(show: Dictionary) -> String:
	if strategy == "publics" and ("familles" in show.get("audiences", []) or "scolaires" in show.get("audiences", [])):
		return "reduit"
	return "normal"


func _show_score(data: GameData, show: Dictionary, est: Dictionary) -> float:
	var margin := float(est["margin"])
	var art := float(show.get("art", 0.0))
	var wide := 1.0 if show.get("eac", false) or "familles" in show.get("audiences", []) or "scolaires" in show.get("audiences", []) else 0.0
	match strategy:
		"prudente":
			return margin if margin > -300.0 else -1000.0
		"artistique":
			return art * 4000.0 + margin * 0.5
		"publics":
			return wide * 2500.0 + float(est["seats"]) * 4.0 + margin * 0.6
		_:
			return margin + art * 1800.0 + wide * 1200.0 + (800.0 if show.get("format") == "petit" else 0.0)


func _random_programming(session: GameSession, available: Array) -> Array:
	var out: Array = []
	var hall := 0
	var levels := ["reduit", "normal", "plein"]
	var pool := available.duplicate()
	var n := rng.randi_range(0, 3)
	while out.size() < n and not pool.is_empty():
		var id: String = pool.pop_at(rng.randi_range(0, pool.size() - 1))
		var uses_hall := session.data.uses_hall(session.data.shows[id])
		if uses_hall and hall >= 2:
			continue
		if uses_hall:
			hall += 1
		out.append({"show_id": id, "price_level": levels[rng.randi_range(0, 2)]})
	return out


# --- Actions ----------------------------------------------------------------------

func choose_actions(session: GameSession) -> Array:
	var state := session.state
	var cap := session.action_capacity()
	var wanted: Array = []
	match strategy:
		"passive":
			return []
		"aleatoire":
			var ids := session.data.action_order.duplicate()
			var n := rng.randi_range(0, cap)
			while wanted.size() < n and not ids.is_empty():
				wanted.append(ids.pop_at(rng.randi_range(0, ids.size() - 1)))
			return wanted
		"prudente":
			wanted = ["communication", "accueil"]
		"artistique":
			wanted = ["communication", "formation"]
		"publics":
			wanted = ["mediation", "accueil"]
		_:
			wanted = ["mediation", "communication", "partenariats"]
	if state.stat("equipement") < 45.0:
		wanted.push_front("entretien")
	if state.stat("equipe") < 40.0:
		wanted.push_front("formation")
	var out: Array = []
	for id: String in wanted:
		if out.size() < cap and not id in out:
			out.append(id)
	return out


# --- Événements -------------------------------------------------------------------

func choose_event(session: GameSession) -> String:
	var data := session.data
	var state := session.state
	var event := session.current_event()
	var choices: Array = []
	for choice: Dictionary in event.get("choices", []):
		if EventSystem.choice_block_reason(data, state, state.current_event, choice["id"]) == "":
			choices.append(choice)
	if choices.is_empty():
		return ""
	if strategy == "aleatoire" or strategy == "passive":
		return choices[rng.randi_range(0, choices.size() - 1)]["id"]
	var weights: Dictionary = WEIGHTS.get(strategy, WEIGHTS["equilibre"])
	var best := ""
	var best_score := -INF
	for choice: Dictionary in choices:
		var s := score_effects(choice.get("effects", {}), weights, data, state)
		if s > best_score:
			best_score = s
			best = choice["id"]
	return best


static func score_effects(effects: Dictionary, weights: Dictionary, data: GameData, state: GameState) -> float:
	var s := float(effects.get("cash", 0)) / 1000.0 * float(weights["cash"]) * 4.0
	for item: Dictionary in effects.get("ledger", []):
		if not item.get("neutral", false):
			s += float(item["amount"]) * float(item.get("direction", 1)) / 1000.0 * float(weights["cash"]) * 3.0
	for id: String in effects.get("stats", {}):
		s += float(effects["stats"][id]) * float(weights.get(id, 0.3))
	s += float(effects.get("eac", 0)) * 3.0
	s += (float(effects.get("demand_mult", 1.0)) - 1.0) * 30.0
	s += float(effects.get("quality_mod", 0.0)) * 30.0
	if effects.has("chance"):
		var chance: Dictionary = effects["chance"]
		var p := Rules.chance_probability(chance, data, state)
		s += p * score_effects(chance.get("success", {}), weights, data, state)
		s += (1.0 - p) * score_effects(chance.get("failure", {}), weights, data, state)
	if bool(effects.get("cancel_show", false)):
		s -= 6.0
	return s

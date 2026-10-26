class_name CreationSystem
extends RefCounted
## La création de la saison avec le metteur en scène Victor Lazare
## (données : res://data/story/creation.json). Logique pure, sans nœud.
##
## Chaque période débloque une étape (le sujet, la forme, la distribution…) : le joueur
## choisit une option parmi trois en allant trouver Lazare, qui change d'endroit chaque
## mois. Les étapes manquées peuvent être rattrapées ; celles qui restent au départ pour
## Paris sont tranchées par Lazare. Après le bilan de fin de saison, la troupe part
## jouer la pièce à Paris : l'accueil dépend de la cohérence des choix, de leurs
## qualités et du rayonnement du théâtre. Aucun effet sur la gestion.
##
## État (GameState.creation) : {met, choices: {étape: option}, defaulted: [étapes],
## departed, paris: {résultat de la première}}.

const DIRECTOR := "lazare"


static func steps(data: GameData) -> Array:
	return data.creation.get("steps", [])


static func step(data: GameData, step_id: String) -> Dictionary:
	for st: Dictionary in steps(data):
		if st["id"] == step_id:
			return st
	return {}


static func option(data: GameData, step_id: String, option_id: String) -> Dictionary:
	for o: Dictionary in step(data, step_id).get("options", []):
		if o["id"] == option_id:
			return o
	return {}


static func choices(state: GameState) -> Dictionary:
	return state.creation.get("choices", {})


## Nombre d'étapes ouvertes : une par période jouée (toutes à la fin de la saison).
static func unlocked_count(data: GameData, state: GameState) -> int:
	var n := steps(data).size()
	return n if state.finished else clampi(state.turn, 0, n)


## Prochaine étape à décider avec Lazare ({} si rien n'attend).
static func pending_step(data: GameData, state: GameState) -> Dictionary:
	var list := steps(data)
	for i in unlocked_count(data, state):
		if not choices(state).has(list[i]["id"]):
			return list[i]
	return {}


## Combien d'étapes attendent (mois manqués compris).
static func pending_count(data: GameData, state: GameState) -> int:
	var n := 0
	var list := steps(data)
	for i in unlocked_count(data, state):
		if not choices(state).has(list[i]["id"]):
			n += 1
	return n


## Enregistre un choix. Retourne "" ou un message d'erreur.
static func choose(data: GameData, state: GameState, step_id: String, option_id: String) -> String:
	var pending := pending_step(data, state)
	if pending.is_empty() or pending["id"] != step_id:
		return "Cette étape de la création n'est pas ouverte."
	if option(data, step_id, option_id).is_empty():
		return "Option inconnue."
	if not state.creation.has("choices"):
		state.creation["choices"] = {}
	state.creation["choices"][step_id] = option_id
	state.creation["met"] = true
	return ""


## Au départ pour Paris, Lazare tranche seul les étapes restées ouvertes : il prend
## l'option qui va dans le sens des choix déjà faits. Retourne [{step, option}].
static func fill_defaults(data: GameData, state: GameState) -> Array:
	var out: Array = []
	if not state.creation.has("choices"):
		state.creation["choices"] = {}
	if not state.creation.has("defaulted"):
		state.creation["defaulted"] = []
	for st: Dictionary in steps(data):
		if choices(state).has(st["id"]):
			continue
		var vision := dominant_vision(data, state)
		var pick: Dictionary = st["options"][0]
		for o: Dictionary in st["options"]:
			if o["vision"] == vision:
				pick = o
				break
		state.creation["choices"][st["id"]] = pick["id"]
		state.creation["defaulted"].append(st["id"])
		out.append({"step": st, "option": pick})
	return out


## Nombre de choix pour chaque vision (classique, moderne, populaire).
static func vision_counts(data: GameData, state: GameState) -> Dictionary:
	var counts := {}
	for v: String in data.creation.get("visions", {}):
		counts[v] = 0
	for step_id: String in choices(state):
		var o := option(data, step_id, str(choices(state)[step_id]))
		if not o.is_empty():
			counts[o["vision"]] = int(counts.get(o["vision"], 0)) + 1
	return counts


## Vision la plus présente ("" si aucun choix ; en cas d'égalité, l'ordre des données).
static func dominant_vision(data: GameData, state: GameState) -> String:
	var best := ""
	var best_n := 0
	var counts := vision_counts(data, state)
	for v: String in data.creation.get("visions", {}):
		if int(counts.get(v, 0)) > best_n:
			best = v
			best_n = int(counts[v])
	return best


## Titre du spectacle (en capitales pour l'affiche si `poster`).
static func show_title(data: GameData, state: GameState, poster: bool = false) -> String:
	var o := option(data, "titre", str(choices(state).get("titre", "")))
	if o.is_empty():
		return "SPECTACLE SANS TITRE" if poster else "Spectacle sans titre"
	return str(o.get("poster", o["label"])) if poster else str(o["label"]).trim_prefix("« ").trim_suffix(" »")


## Où trouver Lazare : {map, cell, facing, where, doing}, ou {} (déjà à Paris).
static func location(data: GameData, state: GameState) -> Dictionary:
	var locs: Dictionary = data.creation.get("locations", {})
	if state.finished:
		return {} if not state.creation.get("paris", {}).is_empty() else locs.get("depart", {})
	return locs.get(str(state.turn), {})


## Accueil de la première à Paris (déterministe). `rayonnement` : 0..100.
## Score : qualité des choix (60) + cohérence de la vision (30) + rayonnement (10), moins
## 4 points par étape que Lazare a dû trancher seul.
static func reception(data: GameData, state: GameState, rayonnement: float) -> Dictionary:
	var critique := 0
	var public := 0
	var n := 0
	for step_id: String in choices(state):
		var o := option(data, step_id, str(choices(state)[step_id]))
		if o.is_empty():
			continue
		critique += int(o["critique"])
		public += int(o["public"])
		n += 1
	var total := maxi(1, steps(data).size())
	var quality := float(critique + public) / float(6 * total) * 60.0
	var same := int(vision_counts(data, state).get(dominant_vision(data, state), 0))
	var coherence := clampf(float(same - 2) / float(total - 2) * 30.0, 0.0, 30.0)
	# Chaque étape tranchée seul par Lazare coûte : un spectacle se crée à deux.
	var alone := (state.creation.get("defaulted", []) as Array).size() * 4.0
	var score := clampf(quality + coherence + clampf(rayonnement, 0.0, 100.0) / 10.0 - alone, 0.0, 100.0)
	var tier: Dictionary = {}
	for r: Dictionary in data.creation.get("receptions", []):
		if score >= float(r["min"]):
			tier = r
			break
	var vision := dominant_vision(data, state)
	var title := show_title(data, state)
	var praise := str(data.creation.get("visions", {}).get(vision, {}).get("praise", ""))
	var critic := str(tier.get("critic", "%s"))
	critic = critic % [title, praise] if critic.count("%s") >= 2 else critic % title
	return {"score": roundi(score), "id": str(tier.get("id", "")), "title": str(tier.get("title", "")),
		"calls": int(tier.get("calls", 1)), "critic": critic, "text": str(tier.get("text", "")),
		"vision": vision, "show": title, "critique": critique, "public": public, "coherence": roundi(coherence)}


## Joue la première à Paris : complète les choix manquants et garde le résultat.
static func play_premiere(data: GameData, state: GameState, rayonnement: float) -> Dictionary:
	fill_defaults(data, state)
	var result := reception(data, state, rayonnement)
	state.creation["paris"] = result
	return result


## Résumé lisible des choix, dans l'ordre des étapes : [{title, label, defaulted}].
static func summary(data: GameData, state: GameState) -> Array:
	var out: Array = []
	var defaulted: Array = state.creation.get("defaulted", [])
	for st: Dictionary in steps(data):
		if not choices(state).has(st["id"]):
			continue
		var o := option(data, st["id"], str(choices(state)[st["id"]]))
		out.append({"title": st["title"], "label": o.get("label", "?"), "defaulted": st["id"] in defaulted})
	return out

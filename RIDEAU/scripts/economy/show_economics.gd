class_name ShowEconomics
extends RefCounted
## Modèle de demande et compte d'exploitation d'un spectacle.
## Fonctions pures : elles lisent l'état mais ne le modifient jamais.

const SCHOOL_PRICE := 6
const WIDE_AUDIENCES: Array[String] = ["familles", "scolaires", "jeunes", "amateurs"]


## Taux de remplissage attendu (0..1.2) pour une représentation tout public.
static func expected_fill(data: GameData, state: GameState, show: Dictionary, price_level_id: String) -> float:
	var d: Dictionary = data.balance["demand"]
	var diff := data.difficulty(state.difficulty)
	var fill := float(show.get("popularity", 0.5))
	fill *= float(d["comm_base"]) + float(d["comm_weight"]) * state.stat("communication") / 100.0
	fill *= float(d["fid_base"]) + float(d["fid_weight"]) * state.stat("fidelite") / 100.0
	fill *= 1.0 + float(d["rep_weight"]) * float(show.get("art", 0.0)) * (state.stat("reputation") - 50.0) / 100.0
	var wide := 0.3
	for aud: String in show.get("audiences", []):
		if aud in WIDE_AUDIENCES:
			wide = 1.0
	fill *= 1.0 + float(d["diversity_weight"]) * wide * (state.stat("diversite") - 30.0) / 100.0
	var level := data.price_level(price_level_id)
	if float(show.get("price", 0)) > 0.0:
		fill *= pow(1.0 / float(level.get("mult", 1.0)), float(d["elasticity"]))
	else:
		fill *= 1.1  # entrée libre
	var period := data.period(state.turn)
	fill *= float(period.get("demand", 1.0))
	var bonus: Dictionary = show.get("season_bonus", {})
	for tag: String in period.get("tags", []):
		fill *= float(bonus.get(tag, 1.0))
	fill *= pow(float(d["fatigue"]), genre_repeats(state, str(show.get("genre", ""))))
	fill *= float(diff.get("demand_mult", 1.0))
	fill *= float(state.turn_mods.get("demand_mult", 1.0))
	if state.has_flag("billetterie_en_ligne"):
		fill *= 1.05
	return clampf(fill, float(d["min_fill"]), 1.2)


## Remplissage attendu d'une séance scolaire.
static func school_fill(data: GameData, state: GameState) -> float:
	var d: Dictionary = data.balance["demand"]
	var fill := 0.45
	if state.has_flag("partenariat_scolaire"):
		fill += float(d["school_bonus"]) + 0.05
	fill += 0.2 * (state.stat("relations") - 50.0) / 50.0
	fill += 0.1 * (state.stat("diversite") - 30.0) / 70.0
	return clampf(fill, 0.15, 1.0)


## Nombre de fois où ce genre a été programmé lors des deux périodes précédentes.
static func genre_repeats(state: GameState, genre: String) -> int:
	var count := 0
	var history := state.genre_history
	for i in range(maxi(0, history.size() - 2), history.size()):
		for g: String in history[i]:
			if g == genre:
				count += 1
	return count


static func noise_sigma(data: GameData, state: GameState, show: Dictionary) -> float:
	var diff := data.difficulty(state.difficulty)
	return float(data.balance["demand"]["noise"]) * (0.5 + float(show.get("risk", 0.2))) * float(diff.get("noise_mult", 1.0))


## Nombre de représentations. `index` est la position du spectacle dans la
## programmation (−1 pour une simple estimation hors programmation).
static func representations(state: GameState, show: Dictionary, index: int) -> int:
	var reps := int(show.get("representations", 1))
	if index >= 0 and state.turn_mods.has("add_representation_index") and int(state.turn_mods["add_representation_index"]) == index:
		reps += 1
	return reps


## Description de chaque représentation : [{kind, price, fill, capacity}].
static func rep_plan(data: GameData, state: GameState, show: Dictionary, price_level_id: String, index: int) -> Array:
	var plan: Array = []
	var capacity := data.show_capacity(show)
	var level := data.price_level(price_level_id)
	var price := roundi(float(show.get("price", 0)) * float(level.get("mult", 1.0)) * float(state.turn_mods.get("price_mult", 1.0)))
	var reps := representations(state, show, index)
	for r in reps:
		if bool(show.get("school", false)) and r == 0:
			plan.append({"kind": "scolaire", "price": mini(SCHOOL_PRICE, price), "fill": school_fill(data, state), "capacity": capacity})
		else:
			plan.append({"kind": "tout_public", "price": price, "fill": expected_fill(data, state, show, price_level_id), "capacity": capacity})
	return plan


static func vat_rate(data: GameData, show: Dictionary) -> float:
	match str(show.get("vat", "default")):
		"creation":
			return float(data.balance["tax"]["vat_creation"])
		"none":
			return 0.0
		_:
			return float(data.balance["tax"]["vat_default"])


## Compte d'exploitation d'un spectacle pour une recette TTC donnée.
static func finance(data: GameData, show: Dictionary, gross: int, reps: int) -> Dictionary:
	var rate := vat_rate(data, show)
	var vat := roundi(float(gross) * rate / (1.0 + rate))
	var net := gross - vat
	var contract := str(show.get("contract", "cession"))
	var fee := 0
	var company_share := 0
	if contract == "corealisation":
		company_share = roundi(float(net) * float(show.get("company_share", 0.7)))
	else:
		fee = int(show.get("fee", 0))
	var tech := int(show.get("tech_cost", 0)) * reps
	var hosting := int(show.get("hosting", 0))
	var rights := 0
	if bool(show.get("rights", false)):
		rights = roundi(float(net) * float(data.balance["tax"]["author_rights_rate"]))
	var costs := fee + company_share + tech + hosting + rights
	return {
		"gross": gross, "vat": vat, "net": net, "fee": fee, "company_share": company_share,
		"tech": tech, "hosting": hosting, "rights": rights, "costs": costs, "margin": net - costs,
	}


## Estimation prévisionnelle : fourchette basse / attendue / haute (≈ 10e et 90e centiles).
static func estimate(data: GameData, state: GameState, show: Dictionary, price_level_id: String, index: int = -1) -> Dictionary:
	var plan := rep_plan(data, state, show, price_level_id, index)
	var sigma := noise_sigma(data, state, show)
	var seats := {"low": 0, "expected": 0, "high": 0}
	var gross := {"low": 0, "expected": 0, "high": 0}
	var capacity_total := 0
	for rep: Dictionary in plan:
		var cap: int = rep["capacity"]
		capacity_total += cap
		var s := 0.5 * sigma if rep["kind"] == "scolaire" else sigma
		var values := {
			"low": float(rep["fill"]) * exp(-1.28 * s),
			"expected": float(rep["fill"]),
			"high": float(rep["fill"]) * exp(1.28 * s),
		}
		for key: String in values:
			var n := clampi(roundi(cap * float(values[key])), 0, cap)
			seats[key] += n
			gross[key] += n * int(rep["price"])
	var reps := plan.size()
	var fin_expected := finance(data, show, gross["expected"], reps)
	return {
		"reps": reps,
		"capacity_total": capacity_total,
		"seats_low": seats["low"], "seats": seats["expected"], "seats_high": seats["high"],
		"gross": gross["expected"],
		"finance": fin_expected,
		"margin_low": finance(data, show, gross["low"], reps)["margin"],
		"margin": fin_expected["margin"],
		"margin_high": finance(data, show, gross["high"], reps)["margin"],
		"incident_risk": incident_probability(data, state, show),
		"plan": plan,
	}


static func incident_probability(data: GameData, state: GameState, show: Dictionary) -> float:
	var inc: Dictionary = data.balance["incident"]
	var gap := maxf(0.0, float(inc["threshold"]) - state.stat("equipement"))
	return clampf(gap * float(inc["per_point"]) * float(show.get("tech_level", 0)), 0.0, 0.9)


## Tirage réel des places vendues, représentation par représentation.
static func draw_seats(data: GameData, state: GameState, show: Dictionary, plan: Array, rng: RandomNumberGenerator) -> Array:
	var sigma := noise_sigma(data, state, show)
	var out: Array = []
	for rep: Dictionary in plan:
		var s := 0.5 * sigma if rep["kind"] == "scolaire" else sigma
		var fill := float(rep["fill"]) * exp(s * SeededRng.gaussian(rng))
		var cap: int = rep["capacity"]
		out.append(clampi(roundi(cap * fill), 0, cap))
	return out

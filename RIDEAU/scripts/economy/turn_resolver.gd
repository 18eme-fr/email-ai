class_name TurnResolver
extends RefCounted
## Résolution d'une période : charges fixes, actions, représentations,
## règlements, évolution des indicateurs, puis rapport explicatif.

const QUALITY_LABELS := [
	[0.8, "Triomphe"],
	[0.62, "Très réussi"],
	[0.45, "Réussi"],
	[0.3, "Mitigé"],
	[0.0, "Raté"],
]


static func quality_label(q: float) -> String:
	for pair: Array in QUALITY_LABELS:
		if q >= float(pair[0]):
			return str(pair[1])
	return "Raté"


static func resolve(data: GameData, state: GameState) -> Dictionary:
	var turn := state.turn
	var diff := data.difficulty(state.difficulty)
	var report := {
		"turn": turn,
		"period": str(data.period(turn).get("name", "")),
		"shows": [], "actions": [], "event": {}, "warnings": [], "explanations": [],
		"cash_before": state.cash,
		"stats_before": _stats_snapshot(data, state),
	}

	# 1. Charges fixes : payées dans la période.
	for item: Dictionary in data.balance["fixed_costs"]:
		var amount := roundi(float(item["amount"]) * float(diff.get("fixed_mult", 1.0)))
		Ledger.add(state, str(item["label"]), "charges_fixes", amount, Ledger.EXPENSE, turn, turn, {"source": "fixe"})

	# 2. Actions de gestion.
	for id: String in state.actions:
		var action: Dictionary = data.actions[id]
		var cost := int(action["cost"])
		if cost > 0:
			Ledger.add(state, str(action["label"]), "action", cost, Ledger.EXPENSE, turn, turn + int(action.get("payment_delay", 0)), {"source": id})
		Rules.apply(action.get("effects", {}), data, state, str(action["label"]), hash(id))
		report["actions"].append({"id": id, "label": action["label"], "cost": cost, "delay": int(action.get("payment_delay", 0))})

	# 3. Représentations.
	var genres_this_turn: Array = []
	var cancel_index := int(state.turn_mods.get("cancel_index", -1))
	for i in state.programmed.size():
		var entry: Dictionary = state.programmed[i]
		var show: Dictionary = data.shows[entry["show_id"]]
		if not entry["show_id"] in state.played_shows:
			state.played_shows.append(entry["show_id"])
		if i == cancel_index:
			report["shows"].append({"show_id": show["id"], "title": show["title"], "cancelled": true})
			continue
		genres_this_turn.append(show["genre"])
		report["shows"].append(_perform(data, state, show, str(entry.get("price_level", "normal")), i))
	state.genre_history.append(genres_this_turn)

	# 4. Fin de saison : décision sur le solde conditionnel de la subvention.
	if turn >= data.turns():
		report["subsidy_decision"] = _decide_conditional_subsidy(data, state)

	# 5. Règlements de la période (seul endroit où la trésorerie bouge).
	var settled := Ledger.settle_due(state, turn)

	# 6. Évolution naturelle des indicateurs.
	_drift(data, state, report)

	# 7. Synthèse financière et explications.
	report["finance"] = _finance_summary(state, turn, settled, int(report["cash_before"]))
	report["stats_after"] = _stats_snapshot(data, state)
	report["stat_changes"] = _group_stat_log(state)
	report["attendance"] = 0
	for s: Dictionary in report["shows"]:
		report["attendance"] += int(s.get("sold", 0))
	report["explanations"] = _explain(data, state, report)

	state.history.append({
		"turn": turn, "cash": state.cash, "attendance": report["attendance"],
		"fidelite": state.stat("fidelite"), "rayonnement": Rules.rayonnement(data, state),
		"resultat": report["finance"]["resultat"],
	})
	var limit := int(data.balance.get("overdraft_limit", -6000))
	if state.cash < limit:
		state.bankrupt = true
		report["warnings"].append("La trésorerie est passée sous la limite du découvert autorisé (%s)." % Format.money(limit))
	elif state.cash < 0:
		report["warnings"].append("La trésorerie est négative : vous êtes à découvert.")
	return report


static func _perform(data: GameData, state: GameState, show: Dictionary, price_level: String, index: int) -> Dictionary:
	var turn := state.turn
	var title := str(show["title"])
	var plan := ShowEconomics.rep_plan(data, state, show, price_level, index)
	var estimate := ShowEconomics.estimate(data, state, show, price_level, index)
	var seats := ShowEconomics.draw_seats(data, state, show, plan, SeededRng.make(state.game_seed, turn, SeededRng.CHANNEL_SHOWS, index))
	var gross := 0
	var sold := 0
	var capacity_total := 0
	for r in plan.size():
		gross += int(seats[r]) * int(plan[r]["price"])
		sold += int(seats[r])
		capacity_total += int(plan[r]["capacity"])
	var fin := ShowEconomics.finance(data, show, gross, plan.size())

	# Qualité artistique de la soirée.
	var qp: Dictionary = data.balance["quality"]
	var diff := data.difficulty(state.difficulty)
	var q := float(qp["base"])
	q += float(qp["team_weight"]) * (state.stat("equipe") - 50.0) / 50.0
	q += float(qp["equipment_weight"]) * (state.stat("equipement") - 50.0) / 50.0
	q += float(show.get("quality_bonus", 0.0))
	if state.has_flag("residence_done"):
		q += float(show.get("residence_bonus", 0.0))
	q += float(state.turn_mods.get("quality_mod", 0.0))
	var qrng := SeededRng.make(state.game_seed, turn, SeededRng.CHANNEL_QUALITY, index)
	q += float(qp["noise"]) * (0.6 + float(show.get("risk", 0.2))) * float(diff.get("noise_mult", 1.0)) * SeededRng.gaussian(qrng)

	# Incident technique éventuel.
	var incident := false
	var p_incident := ShowEconomics.incident_probability(data, state, show)
	if p_incident > 0.0 and SeededRng.make(state.game_seed, turn, SeededRng.CHANNEL_INCIDENT, index).randf() < p_incident:
		incident = true
		var inc: Dictionary = data.balance["incident"]
		q -= float(inc["quality_penalty"])
		Ledger.add(state, "Réparation d'urgence — %s" % title, "technique", int(inc["repair_cost"]), Ledger.EXPENSE, turn, turn, {"source": show["id"]})
		Rules.change_stat(state, "fidelite", -float(inc["fidelity_penalty"]), "Incident technique")
	q = clampf(q, 0.0, 1.0)

	# Écritures comptables.
	var tax: Dictionary = data.balance["tax"]
	if fin["net"] > 0:
		Ledger.add(state, "Billetterie — %s" % title, "billetterie", fin["net"], Ledger.INCOME, turn, turn, {"source": show["id"]})
	if fin["vat"] > 0:
		Ledger.add(state, "TVA collectée — %s" % title, "tva", fin["vat"], Ledger.INCOME, turn, turn, {"neutral": true, "source": show["id"]})
		Ledger.add(state, "TVA reversée à l'État — %s" % title, "tva", fin["vat"], Ledger.EXPENSE, turn, turn + int(tax["vat_payment_delay"]), {"neutral": true, "source": show["id"]})
	if fin["fee"] > 0:
		Ledger.add(state, "%s — %s" % [_fee_label(str(show["contract"])), title], "artistique", fin["fee"], Ledger.EXPENSE, turn, turn, {"source": show["id"]})
	if fin["company_share"] > 0:
		Ledger.add(state, "Part de la compagnie (coréalisation) — %s" % title, "artistique", fin["company_share"], Ledger.EXPENSE, turn, turn, {"source": show["id"]})
	if fin["tech"] > 0:
		Ledger.add(state, "Technique (intermittents) — %s" % title, "technique", fin["tech"], Ledger.EXPENSE, turn, turn, {"source": show["id"]})
	if fin["hosting"] > 0:
		Ledger.add(state, "Défraiements (voyages, repas, hébergement) — %s" % title, "accueil", fin["hosting"], Ledger.EXPENSE, turn, turn, {"source": show["id"]})
	if fin["rights"] > 0:
		Ledger.add(state, "Droits d'auteur — %s" % title, "droits", fin["rights"], Ledger.EXPENSE, turn, turn + int(tax["author_rights_delay"]), {"source": show["id"]})

	# Effets sur les indicateurs.
	var fill := float(sold) / float(maxi(capacity_total, 1))
	var factor := 0.5 + q
	var art := float(show.get("art", 0.0))
	for id: String in show.get("stats", {}):
		var v := float(show["stats"][id])
		Rules.change_stat(state, id, v * factor if v > 0.0 else v, title)
	Rules.change_stat(state, "reputation", (q - 0.5) * 8.0 * art, title)
	Rules.change_stat(state, "fidelite", fill * 5.0 * (q - 0.4), title)
	Rules.change_stat(state, "equipe", -0.8 * float(show.get("workload", 4)), title)
	Rules.change_stat(state, "equipement", -1.5 * float(show.get("tech_level", 0)), title)
	var level := data.price_level(price_level)
	if float(show.get("price", 0)) > 0.0:
		Rules.change_stat(state, "diversite", float(level.get("diversite", 0)), "Tarif — %s" % title)
	for flag: String in show.get("flags", []):
		state.flags[flag] = turn

	state.totals["attendance_total"] = int(state.totals["attendance_total"]) + sold
	state.totals["shows_count"] = int(state.totals["shows_count"]) + 1
	if bool(show.get("eac", false)):
		state.totals["eac_count"] = int(state.totals["eac_count"]) + 1
	if data.is_artistic(show):
		state.totals["art_count"] = int(state.totals["art_count"]) + 1

	return {
		"show_id": show["id"], "title": title, "cancelled": false, "price_level": price_level,
		"reps": plan.size(), "seats": seats, "sold": sold, "capacity_total": capacity_total,
		"fill": fill, "finance": fin, "quality": q, "quality_label": quality_label(q),
		"incident": incident, "estimate_seats": estimate["seats"],
		"estimate_low": estimate["seats_low"], "estimate_high": estimate["seats_high"],
		"estimate_margin": estimate["margin"],
	}


static func _fee_label(contract: String) -> String:
	match contract:
		"coproduction":
			return "Apport en coproduction"
		"interne":
			return "Intervenants"
		"residence":
			return "Accueil en résidence"
		_:
			return "Prix de cession"


static func _decide_conditional_subsidy(data: GameData, state: GameState) -> Dictionary:
	var granted := SeasonEvaluator.conditional_subsidy_granted(data, state)
	var amount := 0
	for entry: Dictionary in Ledger.conditional_entries(state):
		amount += int(entry["amount"])
		if granted:
			Ledger.confirm_conditional(entry)
		else:
			Ledger.cancel(entry)
	return {"granted": granted, "amount": amount}


static func _drift(data: GameData, state: GameState, report: Dictionary) -> void:
	var dr: Dictionary = data.balance["drift"]
	var comm := state.stat("communication")
	var floor_v := float(dr["communication_floor"])
	if state.has_flag("billetterie_en_ligne"):
		floor_v += float(data.balance["online_ticketing"]["communication_floor_bonus"])
	if comm > floor_v:
		Rules.change_stat(state, "communication", -(comm - floor_v) * float(dr["communication_decay"]), "Effet de la communication qui s'estompe")
	var team := state.stat("equipe")
	var target := float(dr["equipe_target"])
	if team < target:
		Rules.change_stat(state, "equipe", minf(float(dr["equipe_recovery"]), target - team), "Récupération de l'équipe")
	Rules.change_stat(state, "equipement", -float(dr["equipement_wear"]), "Usure normale du matériel")
	var played := false
	for s: Dictionary in report["shows"]:
		if not s.get("cancelled", false):
			played = true
	var erosion := float(dr["fidelite_erosion"]) * (1.0 if played else 3.0)
	Rules.change_stat(state, "fidelite", -erosion, "Érosion naturelle de la fidélité" if played else "Aucun spectacle : le public se détourne")
	state.flags.erase("mediation_this_turn")


static func _finance_summary(state: GameState, turn: int, settled: Array, cash_before: int) -> Dictionary:
	var engaged := Ledger.engaged_in(state, turn)
	var produits := Ledger.sum(engaged, Ledger.INCOME)
	var charges := Ledger.sum(engaged, Ledger.EXPENSE)
	var enc: Array = []
	var dec: Array = []
	for entry: Dictionary in settled:
		var line := {"label": entry["label"], "amount": entry["amount"], "category": entry["category"], "turn_engaged": entry["turn_engaged"]}
		if int(entry["direction"]) == Ledger.INCOME:
			enc.append(line)
		else:
			dec.append(line)
	var prod_detail: Array = []
	var charge_detail: Array = []
	for entry: Dictionary in engaged:
		var line := {"label": entry["label"], "amount": entry["amount"], "category": entry["category"], "due_turn": entry["due_turn"]}
		if int(entry["direction"]) == Ledger.INCOME:
			prod_detail.append(line)
		else:
			charge_detail.append(line)
	return {
		"produits": produits, "charges": charges, "resultat": produits - charges,
		"cash_before": cash_before, "cash_after": state.cash, "variation": state.cash - cash_before,
		"encaissements": enc, "decaissements": dec,
		"encaisse_total": Ledger.sum(settled, Ledger.INCOME), "decaisse_total": Ledger.sum(settled, Ledger.EXPENSE),
		"produits_detail": prod_detail, "charges_detail": charge_detail,
		"a_recevoir": Ledger.outstanding_total(state, Ledger.INCOME),
		"a_payer": Ledger.outstanding_total(state, Ledger.EXPENSE),
	}


static func _stats_snapshot(data: GameData, state: GameState) -> Dictionary:
	var snap := state.stats.duplicate()
	snap["rayonnement"] = Rules.rayonnement(data, state)
	return snap


static func _group_stat_log(state: GameState) -> Dictionary:
	var grouped := {}
	for item: Dictionary in state.stat_log:
		var id := str(item["stat"])
		if not grouped.has(id):
			grouped[id] = {}
		grouped[id][item["source"]] = float(grouped[id].get(item["source"], 0.0)) + float(item["delta"])
	return grouped


## Phrases d'explication : pourquoi les indicateurs ont bougé.
static func _explain(data: GameData, state: GameState, report: Dictionary) -> Array:
	var lines: Array = []
	var fin: Dictionary = report["finance"]
	lines.append("Résultat de la période : %s (produits %s − charges %s)." % [Format.signed_money(fin["resultat"]), Format.money(fin["produits"]), Format.money(fin["charges"])])
	lines.append("Variation de trésorerie : %s (encaissé %s, payé %s)." % [Format.signed_money(fin["variation"]), Format.money(fin["encaisse_total"]), Format.money(fin["decaisse_total"])])
	if fin["resultat"] != fin["variation"]:
		lines.append("Les deux diffèrent : certaines sommes sont engagées maintenant mais réglées plus tard (TVA, droits d'auteur, factures à 30 jours, aides), ou l'inverse.")
	for s: Dictionary in report["shows"]:
		if s.get("cancelled", false):
			lines.append("« %s » a été annulé." % s["title"])
			continue
		var f: Dictionary = s["finance"]
		var line := "« %s » : %d places sur %d (%d %%), %s. Recette nette %s, coûts %s → %s." % [
			s["title"], s["sold"], s["capacity_total"], roundi(100.0 * float(s["fill"])), str(s["quality_label"]).to_lower(),
			Format.money(f["net"]), Format.money(f["costs"]), Format.signed_money(f["margin"])]
		if s["sold"] < s["estimate_low"]:
			line += " En dessous de la fourchette prévue."
		elif s["sold"] > s["estimate_high"]:
			line += " Au-dessus de la fourchette prévue !"
		if s["incident"]:
			line += " Un incident technique a perturbé la soirée."
		lines.append(line)
	var changes: Dictionary = report["stat_changes"]
	for id: String in ["reputation", "fidelite", "diversite", "relations", "equipe", "equipement"]:
		if not changes.has(id):
			continue
		var total := 0.0
		var parts: Array = []
		var sources: Dictionary = changes[id]
		var keys := sources.keys()
		keys.sort_custom(func(a: Variant, b: Variant) -> bool: return absf(float(sources[a])) > absf(float(sources[b])))
		for src: Variant in keys:
			total += float(sources[src])
		for src: Variant in keys.slice(0, 3):
			if absf(float(sources[src])) >= 0.5:
				parts.append("%s %s" % [src, Format.signed_int(roundi(float(sources[src])))])
		if absf(total) >= 0.5 and not parts.is_empty():
			lines.append("%s %s : %s." % [Rules.STAT_LABELS[id], Format.signed_int(roundi(total)), ", ".join(parts)])
	if report.has("subsidy_decision"):
		var dec: Dictionary = report["subsidy_decision"]
		if dec["granted"]:
			lines.append("La Ville valide le bilan : le solde de la subvention (%s) est versé." % Format.money(dec["amount"]))
		else:
			lines.append("La Ville juge le bilan insuffisant : le solde de la subvention (%s) n'est pas versé." % Format.money(dec["amount"]))
	return lines

class_name ReportDigest
extends RefCounted
## Le bilan d'une période « en bref », pour un joueur qui n'est pas comptable :
## une phrase de verdict, trois chiffres, au plus six lignes qui expliquent le gain ou
## la perte, une phrase sur le compte en banque et un conseil pour la suite.
## Logique pure (testable) ; l'affichage est dans ReportPanel.

## Regroupement des écritures par poste, dans l'ordre d'affichage : [catégories, libellé].
const INCOME_GROUPS := [
	[["billetterie"], "Billets vendus"],
	[["subvention", "avance"], "Aides et subventions"],
	[["mecenat"], "Mécènes"],
]
const EXPENSE_GROUPS := [
	[["artistique", "technique", "accueil", "droits"], "Spectacles (artistes, technique, droits)"],
	[["charges_fixes"], "Frais fixes du théâtre (salaires, bâtiment)"],
	[["action"], "Actions de l'équipe"],
	[["evenement"], "Imprévus"],
	[["amortissement", "investissement"], "Travaux de rénovation"],
]


static func digest(session: GameSession, report: Dictionary) -> Dictionary:
	var fin: Dictionary = report.get("finance", {})
	var result := int(fin.get("resultat", 0))
	var out := {}
	out["tone"] = "good" if result >= 0 else "bad"
	out["verdict"] = ("Vous avez gagné %s cette période." if result >= 0 else "Vous avez perdu %s cette période.") % Format.money(absi(result))
	out["lines"] = _lines(fin)
	# Trois chiffres : le compte, le public, l'image du théâtre.
	var shows: Array = report.get("shows", [])
	var sold := 0
	var seats := 0
	for s: Dictionary in shows:
		if not s.get("cancelled", false):
			sold += int(s["sold"])
			seats += int(s["capacity_total"])
	var before := float(report.get("stats_before", {}).get("rayonnement", 0.0))
	var after := float(report.get("stats_after", {}).get("rayonnement", 0.0))
	out["figures"] = [
		{"icon": "cash", "label": "Sur le compte", "value": Format.money(int(fin.get("cash_after", 0))),
		 "delta": Format.signed_money(int(fin.get("variation", 0)))},
		{"icon": "people", "label": "Spectateurs", "value": Format.thousands(int(report.get("attendance", sold))),
		 "delta": "salles pleines à %d %%" % roundi(100.0 * sold / seats) if seats > 0 else "relâche"},
		{"icon": "star", "label": "Image du théâtre", "value": "%d / 100" % roundi(after),
		 "delta": Format.signed_int(roundi(after - before))},
	]
	# Pourquoi le compte ne bouge pas exactement comme le gain : une phrase, pas plus.
	var gap := int(fin.get("variation", 0)) - result
	out["account"] = "" if absi(gap) < 50 else (
		"Le compte a bougé de %s : certaines sommes se règlent plus tard (TVA, droits d'auteur, aides)." % Format.signed_money(int(fin.get("variation", 0))))
	out["tip"] = _tip(session, report, result, shows)
	return out


## Postes de recettes (+) puis de dépenses (−) ; leur somme est égale au résultat.
static func _lines(fin: Dictionary) -> Array:
	var by_cat := {}
	for e: Dictionary in fin.get("produits_detail", []):
		by_cat[str(e["category"])] = int(by_cat.get(str(e["category"]), 0)) + int(e["amount"])
	for e: Dictionary in fin.get("charges_detail", []):
		by_cat[str(e["category"])] = int(by_cat.get(str(e["category"]), 0)) - int(e["amount"])
	var lines: Array = []
	for group: Array in INCOME_GROUPS + EXPENSE_GROUPS:
		var total := 0
		for cat: String in group[0]:
			total += int(by_cat.get(cat, 0))
			by_cat.erase(cat)
		if total != 0:
			lines.append({"label": group[1], "amount": total})
	var rest := 0
	for cat: String in by_cat:
		rest += int(by_cat[cat])  # TVA (collectée puis reversée : s'annule), autres petites sommes
	if rest != 0:
		lines.append({"label": "Autres recettes" if rest > 0 else "Autres dépenses", "amount": rest})
	return lines


## Un seul conseil, le plus utile pour la période suivante.
static func _tip(session: GameSession, report: Dictionary, result: int, shows: Array) -> String:
	var played := shows.filter(func(s: Dictionary) -> bool: return not s.get("cancelled", false))
	if played.is_empty():
		return "Sans spectacle, le public vous oublie : programmez au moins une soirée."
	for s: Dictionary in played:
		if int(s["capacity_total"]) > 0 and float(s["sold"]) / float(s["capacity_total"]) < 0.5:
			return "« %s » n'a rempli que %d %% de la salle : communiquez plus tôt ou baissez le prix." % [
				s["title"], roundi(100.0 * float(s["sold"]) / float(s["capacity_total"]))]
	if session.state.cash < session.fixed_costs_total():
		return "Le compte est bas : gardez de quoi payer les frais fixes du mois prochain (%s)." % Format.money(session.fixed_costs_total())
	if result < 0:
		return "Les dépenses ont dépassé les recettes : choisissez des spectacles moins coûteux ou plus sûrs."
	return "Belle période ! Pour la suite, variez les spectacles pour attirer de nouveaux publics."

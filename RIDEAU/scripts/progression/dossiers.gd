class_name Dossiers
extends RefCounted
## Dossiers : petits défis de compétences professionnelles (budget prévisionnel,
## seuil de rentabilité, contrats, résultat et trésorerie, mécénat).
## Chaque dossier est GÉNÉRÉ à partir de la partie (chiffres, spectacles) et d'un
## hasard reproductible, puis NOTÉ avec une explication par question.
##
## Format d'un dossier : {id, title, skill, notion, xp, intro, takeaway, items: [...]}
## Questions : {id, kind: "choice", prompt, options: [String], answer: int, explain}
##             {id, kind: "number", prompt, unit, answer: float, tolerance: float, explain}
##             {id, kind: "multi", prompt, options: [{label, value}], min_total, max_total, solution: [int], explain}

const CATALOG := {
	"budget": {"title": "Budget prévisionnel de la saison", "skill": "finances", "notion": "budget_previsionnel", "xp": 15},
	"seuil": {"title": "Seuil de rentabilité d'un spectacle", "skill": "finances", "notion": "charges_fixes_variables", "xp": 15},
	"contrat": {"title": "Cession ou coréalisation ?", "skill": "programmation", "notion": "contrat_cession", "xp": 15},
	"tresorerie": {"title": "Résultat ou trésorerie ?", "skill": "finances", "notion": "tresorerie_resultat", "xp": 15},
	"mecenat": {"title": "Une proposition de mécénat", "skill": "partenariats", "notion": "mecenat", "xp": 15},
}


static func generate(dossier_id: String, data: GameData, state: GameState, rng: RandomNumberGenerator) -> Dictionary:
	var info: Dictionary = CATALOG.get(dossier_id, {})
	if info.is_empty():
		return {}
	var d: Dictionary
	match dossier_id:
		"budget":
			d = _budget(data, state, rng)
		"seuil":
			d = _seuil(data, state, rng)
		"contrat":
			d = _contrat(data, rng)
		"tresorerie":
			d = _tresorerie(rng)
		"mecenat":
			d = _mecenat(rng)
	d.merge(info)
	d["id"] = dossier_id
	return d


## Note les réponses : {score (0..1), correct, total, results: [{id, correct, explain, expected}]}.
static func grade(dossier: Dictionary, answers: Dictionary) -> Dictionary:
	var results: Array = []
	var correct := 0
	for item: Dictionary in dossier.get("items", []):
		var ok := is_correct(item, answers.get(item["id"]))
		if ok:
			correct += 1
		results.append({"id": item["id"], "correct": ok, "explain": item.get("explain", ""), "expected": expected_text(item)})
	var total := maxi(1, dossier.get("items", []).size())
	return {"score": float(correct) / float(total), "correct": correct, "total": total, "results": results}


static func is_correct(item: Dictionary, answer: Variant) -> bool:
	if answer == null:
		return false
	match str(item["kind"]):
		"choice":
			return int(answer) == int(item["answer"])
		"number":
			return absf(float(answer) - float(item["answer"])) <= float(item["tolerance"])
		"multi":
			var sum := 0
			for i: Variant in answer:
				sum += int(item["options"][int(i)]["value"])
			return (answer as Array).size() > 0 and sum >= int(item["min_total"]) and sum <= int(item["max_total"])
	return false


static func expected_text(item: Dictionary) -> String:
	match str(item["kind"]):
		"choice":
			return str(item["options"][int(item["answer"])])
		"number":
			return "%s %s" % [_fmt_num(float(item["answer"])), item.get("unit", "")]
		"multi":
			return "un total de contreparties entre %s et %s" % [Format.money(int(item["min_total"])), Format.money(int(item["max_total"]))]
	return ""


## Réponses d'un joueur automatique (simulation, tests) : juste avec une probabilité donnée.
static func auto_answers(dossier: Dictionary, rng: RandomNumberGenerator, accuracy: float) -> Dictionary:
	var out := {}
	for item: Dictionary in dossier.get("items", []):
		var right := rng.randf() < accuracy
		match str(item["kind"]):
			"choice":
				var n: int = item["options"].size()
				out[item["id"]] = int(item["answer"]) if right else (int(item["answer"]) + 1 + rng.randi_range(0, n - 2)) % n
			"number":
				out[item["id"]] = float(item["answer"]) if right else float(item["answer"]) * 1.5 + 10.0
			"multi":
				if right:
					out[item["id"]] = item["solution"].duplicate()
				else:
					var all: Array = []
					for i in item["options"].size():
						all.append(i)
					out[item["id"]] = all
	return out


# --- Outils ------------------------------------------------------------------------

static func _round_to(v: float, step: int) -> int:
	return roundi(v / step) * step


static func _fmt_num(v: float) -> String:
	if is_equal_approx(v, roundf(v)):
		return Format.thousands(roundi(v))
	return ("%.2f" % v).replace(".", ",")


static func _euros(v: float) -> String:
	return ("%.2f €" % v).replace(".", ",")


## Mélange les propositions et renvoie {options, answer}.
static func _shuffle(correct: String, wrong: Array, rng: RandomNumberGenerator) -> Dictionary:
	var opts: Array = [correct]
	for w: Variant in wrong:
		if not str(w) in opts:
			opts.append(str(w))
	for i in range(opts.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var tmp: Variant = opts[i]
		opts[i] = opts[j]
		opts[j] = tmp
	return {"options": opts, "answer": opts.find(correct)}


static func _choice(id: String, prompt: String, correct: String, wrong: Array, explain: String, rng: RandomNumberGenerator) -> Dictionary:
	var sh := _shuffle(correct, wrong, rng)
	return {"id": id, "kind": "choice", "prompt": prompt, "options": sh["options"], "answer": sh["answer"], "explain": explain}


# --- 1. Budget prévisionnel ---------------------------------------------------------

static func _budget(data: GameData, state: GameState, rng: RandomNumberGenerator) -> Dictionary:
	var turns := data.turns()
	var salaries := 0
	var building := 0
	for item: Dictionary in data.balance["fixed_costs"]:
		if item["id"] == "salaires":
			salaries += int(item["amount"]) * turns
		else:
			building += int(item["amount"]) * turns
	var n_shows := rng.randi_range(13, 18)
	var avg_cost := rng.randi_range(18, 26) * 100
	var artistic := n_shows * avg_cost
	var communication := rng.randi_range(4, 7) * 1000
	var subsidy := int(data.balance["municipal_subsidy"]["total"])
	var spectators := rng.randi_range(30, 40) * 100
	var net_price := rng.randi_range(8, 11)
	var ticketing := spectators * net_price
	var sponsors := rng.randi_range(2, 5) * 1000
	var charges := salaries + building + artistic + communication
	var produits := subsidy + ticketing + sponsors
	var result := produits - charges
	var intro := "Hélène a préparé la trame du budget prévisionnel de la saison (%d périodes). Il manque quelques lignes.\n\n" % turns
	intro += "[b]Charges[/b] : salaires de l'équipe permanente %s · bâtiment (énergie, assurance, entretien) %s · coûts artistiques des spectacles [b]?[/b] · communication %s\n" % [Format.money(salaries), Format.money(building), Format.money(communication)]
	intro += "[b]Produits[/b] : subvention de la Ville %s · billetterie (recettes nettes, hors TVA) [b]?[/b] · mécénat et partenariats %s\n\n" % [Format.money(subsidy), Format.money(sponsors)]
	intro += "Hypothèses : %d spectacles à %s de coût moyen ; %s spectateurs payants à %d € de recette nette moyenne par billet." % [n_shows, Format.money(avg_cost), Format.thousands(spectators), net_price]
	var items: Array = []
	items.append(_choice("artistique", "Coûts artistiques de la saison ?", Format.money(artistic),
		[Format.money(avg_cost * turns), Format.money(_round_to(artistic * 1.2, 100)), Format.money(_round_to(artistic * 0.5, 100))],
		"%d spectacles × %s = [b]%s[/b]. On raisonne sur la saison entière, pas sur une période." % [n_shows, Format.money(avg_cost), Format.money(artistic)], rng))
	items.append(_choice("billetterie", "Recettes de billetterie prévues ?", Format.money(ticketing),
		[Format.money(roundi(ticketing * 1.055)), Format.money(_round_to(ticketing * 0.5, 10)), Format.money(spectators * 20)],
		"%s spectateurs × %d € = [b]%s[/b]. Dans le budget, la billetterie est inscrite hors TVA : la TVA collectée appartient à l'État." % [Format.thousands(spectators), net_price, Format.money(ticketing)], rng))
	items.append(_choice("resultat", "Résultat prévisionnel (produits − charges) ?", Format.signed_money(result),
		[Format.signed_money(-result), Format.signed_money(result + salaries), Format.signed_money(produits)],
		"Produits %s − charges %s = [b]%s[/b]." % [Format.money(produits), Format.money(charges), Format.signed_money(result)], rng))
	items.append(_choice("equilibre", "Joint à une demande de subvention, ce budget doit être…", "présenté à l'équilibre : total des charges = total des produits",
		["obligatoirement excédentaire, pour rassurer la Ville", "présenté sans les salaires, qui ne dépendent pas de la saison", "établi toutes taxes comprises, TVA collectée incluse"],
		"Un budget prévisionnel de demande de subvention (formulaire Cerfa n° 12156) est présenté [b]à l'équilibre[/b] : on ajuste charges et produits, ou l'on chiffre la subvention demandée qui comble l'écart.", rng))
	return {"intro": intro, "items": items,
		"takeaway": "Le budget prévisionnel chiffre toute la saison, recettes hors TVA, et se présente à l'équilibre : c'est un outil de pilotage avant d'être une pièce administrative."}


# --- 2. Seuil de rentabilité --------------------------------------------------------

static func _seuil(data: GameData, state: GameState, rng: RandomNumberGenerator) -> Dictionary:
	var candidates: Array = []
	for id: String in data.show_order:
		var s: Dictionary = data.shows[id]
		if str(s.get("contract", "")) == "cession" and int(s.get("fee", 0)) > 0 and int(s.get("price", 0)) > 0 and s.get("format", "") == "salle":
			candidates.append(s)
	var show: Dictionary = candidates[rng.randi_range(0, candidates.size() - 1)]
	var price := float(show["price"])
	var rate := ShowEconomics.vat_rate(data, show)
	var rights_rate := float(data.balance["tax"]["author_rights_rate"]) if bool(show.get("rights", false)) else 0.0
	var costs := int(show["fee"]) + int(show.get("tech_cost", 0)) + int(show.get("hosting", 0))
	var ht := price / (1.0 + rate)
	var net := ht * (1.0 - rights_rate)
	var threshold := ceili(float(costs) / net)
	var capacity := data.show_capacity(show)
	var fill := float(rng.randi_range(9, 17)) * 0.05
	var seats := roundi(capacity * fill)
	var margin := roundi(seats * net) - costs
	var intro := "« %s » : contrat de cession à %s, technique %s, défraiements %s, soit [b]%s de coûts[/b] pour une représentation.\n" % [show["title"], Format.money(int(show["fee"])), Format.money(int(show.get("tech_cost", 0))), Format.money(int(show.get("hosting", 0))), Format.money(costs)]
	intro += "Billet à %s TTC ; TVA à %s %%" % [_euros(price), ("%.1f" % (rate * 100)).replace(".", ",")]
	intro += " ; droits d'auteur %s %% de la recette hors TVA." % ("%.1f" % (rights_rate * 100)).replace(".", ",") if rights_rate > 0.0 else " ; pas de droits d'auteur à reverser."
	var items: Array = []
	var wrong_net: Array = [_euros(price), _euros(price * 0.7)]
	wrong_net.append(_euros(ht) if rights_rate > 0.0 else _euros(price * (1.0 - rate)))
	items.append(_choice("net", "Recette nette par billet pour le théâtre ?", _euros(net), wrong_net,
		"%s ÷ (1 + %s) = %s hors TVA%s → [b]%s[/b] par billet." % [_euros(price), ("%.3f" % rate).replace(".", ","), _euros(ht),
			(" ; moins %s %% de droits d'auteur" % ("%.1f" % (rights_rate * 100)).replace(".", ",")) if rights_rate > 0.0 else "", _euros(net)], rng))
	items.append({"id": "seuil", "kind": "number", "prompt": "Combien de billets faut-il vendre pour couvrir les coûts (seuil de rentabilité) ?",
		"unit": "billets", "answer": float(threshold), "tolerance": maxf(2.0, threshold * 0.03),
		"explain": "%s ÷ %s ≈ [b]%d billets[/b] (arrondi au billet supérieur), pour une jauge de %d places." % [Format.money(costs), _euros(net), threshold, capacity]})
	var verdict := ("Oui : marge d'environ %s" % Format.signed_money(margin)) if margin >= 0 else ("Non : perte d'environ %s" % Format.money(-margin))
	var other := ("Non : perte d'environ %s" % Format.money(absi(margin))) if margin >= 0 else ("Oui : marge d'environ %s" % Format.signed_money(absi(margin)))
	items.append(_choice("verdict", "Si l'on vend %d places (%d %% de remplissage), le spectacle est-il rentable ?" % [seats, roundi(fill * 100)], verdict,
		[other, "Impossible à dire sans connaître la subvention", "Oui, une salle remplie à plus de 50 % est toujours rentable"],
		"%d billets × %s − %s de coûts = [b]%s[/b]." % [seats, _euros(net), Format.money(costs), Format.signed_money(margin)], rng))
	return {"intro": intro, "items": items,
		"takeaway": "Seuil de rentabilité = coûts ÷ recette nette par billet. On le compare à la jauge et au remplissage réaliste avant de signer."}


# --- 3. Cession ou coréalisation ----------------------------------------------------

static func _contrat(data: GameData, rng: RandomNumberGenerator) -> Dictionary:
	var price := rng.randi_range(12, 18)
	var fee := rng.randi_range(24, 36) * 100
	var share := float(rng.randi_range(12, 15)) * 0.05
	var capacity := int(data.balance["venue"]["capacity_hall"])
	var rate := float(data.balance["tax"]["vat_default"])
	var net := float(price) / (1.0 + rate)
	var intro := "Une compagnie propose deux formules pour une représentation dans la grande salle (%d places), billet à %d € TTC (soit %s hors TVA) :\n" % [capacity, price, _euros(net)]
	intro += "• [b]Cession[/b] : le théâtre paie %s et garde toute la recette.\n" % Format.money(fee)
	intro += "• [b]Coréalisation[/b] : rien à payer d'avance, la compagnie reçoit %d %% de la recette hors TVA, le théâtre garde %d %%.\n" % [roundi(share * 100), roundi((1.0 - share) * 100)]
	intro += "(Pour simplifier : mêmes frais techniques dans les deux cas, droits d'auteur à la charge de la compagnie.)"
	var items: Array = []
	var options := ["La cession (prix fixe)", "La coréalisation (partage de recette)", "Les deux rapportent autant"]
	for f: float in [0.3, 0.6, 0.95]:
		var seats := roundi(capacity * f)
		var m_cession := roundi(seats * net) - fee
		var m_coreal := roundi(seats * net * (1.0 - share))
		var best := 2 if absi(m_cession - m_coreal) < 50 else (0 if m_cession > m_coreal else 1)
		items.append({"id": "remplissage_%d" % roundi(f * 100), "kind": "choice",
			"prompt": "Avec %d spectateurs (%d %%), quelle formule rapporte le plus au théâtre ?" % [seats, roundi(f * 100)],
			"options": options, "answer": best,
			"explain": "Cession : %d × %s − %s = %s. Coréalisation : %d × %s × %d %% = %s." % [seats, _euros(net), Format.money(fee), Format.signed_money(m_cession), seats, _euros(net), roundi((1.0 - share) * 100), Format.signed_money(m_coreal)]})
	var pivot := ceili(float(fee) / (net * share))
	items.append(_choice("pivot", "À partir de combien de spectateurs la cession devient-elle plus intéressante ?", "%d spectateurs" % pivot,
		["%d spectateurs" % ceili(float(fee) / net), "%d spectateurs" % ceili(float(fee) / (net * (1.0 - share))), "%d spectateurs" % (capacity / 2)],
		"La cession coûte %s ; la coréalisation « coûte » au théâtre %d %% de la recette. Égalité quand spectateurs × %s × %d %% = %s, soit [b]%d spectateurs[/b]." % [Format.money(fee), roundi(share * 100), _euros(net), roundi(share * 100), Format.money(fee), pivot], rng))
	items.append(_choice("risque", "Quelle formule partage le risque d'une salle vide avec la compagnie ?", "La coréalisation",
		["La cession", "Aucune des deux", "Les deux autant"],
		"En coréalisation, si la salle est vide, la compagnie touche peu : le risque est partagé. En cession, le théâtre paie le prix convenu quoi qu'il arrive.", rng))
	return {"intro": intro, "items": items,
		"takeaway": "Cession : risque pour le théâtre, gain maximal si la salle est pleine. Coréalisation : risque partagé, gain plafonné. Le point de bascule se calcule."}


# --- 4. Résultat ou trésorerie ------------------------------------------------------

static func _tresorerie(rng: RandomNumberGenerator) -> Dictionary:
	var a := rng.randi_range(6, 12) * 100
	var b := rng.randi_range(30, 50) * 100
	var vat_b := roundi(b * 0.055 / 1.055)
	var c := rng.randi_range(4, 8) * 1000
	var inv := rng.randi_range(18, 30) * 100
	var amort := roundi(inv / 64.0)
	var vat := rng.randi_range(2, 5) * 100
	var adv := rng.randi_range(3, 5) * 1000
	var rights := rng.randi_range(3, 6) * 100
	var pool: Array = [
		{"text": "Une facture d'entretien de %s, payable à 30 jours" % Format.money(a), "r": -a, "t": 0,
			"why": "La charge est engagée maintenant (résultat), mais l'argent ne sort que le mois suivant."},
		{"text": "La billetterie d'un spectacle : %s encaissés, TVA comprise" % Format.money(b), "r": b - vat_b, "t": b,
			"why": "Tout l'argent entre en caisse, mais seule la recette hors TVA (%s) est un produit : la TVA (%s) sera reversée à l'État." % [Format.money(b - vat_b), Format.money(vat_b)]},
		{"text": "Une subvention de %s attribuée pour cette période, versée dans deux mois" % Format.money(c), "r": c, "t": 0,
			"why": "Le produit compte dès qu'il est acquis pour la période ; l'argent arrivera plus tard."},
		{"text": "Le versement, ce mois-ci, d'une subvention de %s attribuée la période précédente" % Format.money(c), "r": 0, "t": c,
			"why": "Le produit a déjà été compté la période précédente : seule la trésorerie bouge."},
		{"text": "L'achat de projecteurs à %s payé comptant, utilisés huit ans" % Format.money(inv), "r": -amort, "t": -inv,
			"why": "Un investissement : la trésorerie paie tout de suite, le résultat ne supporte que l'amortissement de la période (%s)." % Format.money(amort)},
		{"text": "Le reversement à l'État de %s de TVA collectée le mois dernier" % Format.money(vat), "r": 0, "t": -vat,
			"why": "La TVA n'appartient pas au théâtre : la reverser ne change pas le résultat."},
		{"text": "Le remboursement d'une avance de trésorerie de %s consentie par la Ville" % Format.money(adv), "r": 0, "t": -adv,
			"why": "Rembourser une avance n'est pas une charge : c'est de l'argent prêté qui repart."},
		{"text": "Des droits d'auteur de %s dus sur un spectacle joué ce mois-ci, payés le mois suivant" % Format.money(rights), "r": -rights, "t": 0,
			"why": "Charge de la période (le spectacle a eu lieu), paiement plus tard."},
	]
	var picks: Array = []
	var idx: Array = []
	for i in pool.size():
		idx.append(i)
	for k in 5:
		picks.append(pool[idx.pop_at(rng.randi_range(0, idx.size() - 1))])
	var items: Array = []
	for k in picks.size():
		var op: Dictionary = picks[k]
		var r: int = op["r"]
		var t: int = op["t"]
		var pairs: Array = [[r, t], [t, r], [0, t], [r, 0], [t, t], [0, 0], [-r, t], [r, -t]]
		var labels: Array = []
		for p: Array in pairs:
			var lab := "Résultat %s · Trésorerie %s" % [Format.signed_money(p[0]) if p[0] != 0 else "inchangé", Format.signed_money(p[1]) if p[1] != 0 else "inchangée"]
			if not lab in labels:
				labels.append(lab)
		var correct: String = labels[0]
		var wrong := labels.slice(1, 4)
		items.append(_choice("op_%d" % k, "%s : quel effet cette période ?" % op["text"], correct, wrong, op["why"], rng))
	return {"intro": "Hélène a sélectionné cinq opérations. Pour chacune, indiquez son effet [b]sur le résultat[/b] (produits − charges engagés) et [b]sur la trésorerie[/b] (argent réellement entré ou sorti) de la période.",
		"items": items,
		"takeaway": "Résultat et trésorerie divergent dès que l'engagement et le paiement n'ont pas lieu au même moment (factures à 30 jours, subventions, TVA, investissements, avances)."}


# --- 5. Mécénat ----------------------------------------------------------------------

static func _mecenat(rng: RandomNumberGenerator) -> Dictionary:
	var gift := rng.randi_range(10, 24) * 500
	var cap := roundi(gift * 0.25)
	var offers: Array = [
		{"label": "Logo sur les affiches et le programme de la saison", "value": _round_to(gift * 0.04, 50)},
		{"label": "20 places offertes aux salariés (20 × 15 €)", "value": 300},
		{"label": "Une soirée au foyer avec les artistes après un spectacle", "value": _round_to(gift * 0.08, 50)},
		{"label": "Une visite des coulisses pour les salariés", "value": 150},
		{"label": "La grande salle prêtée pour un séminaire d'entreprise", "value": _round_to(gift * 0.2, 50)},
		{"label": "Un abonnement annuel pour 40 salariés (40 × 120 €)", "value": 4800},
	]
	# Solution de référence : les contreparties les plus modestes jusqu'au plafond.
	var order: Array = [0, 1, 2, 3, 4, 5]
	order.sort_custom(func(x: int, y: int) -> bool: return int(offers[x]["value"]) < int(offers[y]["value"]))
	var solution: Array = []
	var total := 0
	for i: int in order:
		if total + int(offers[i]["value"]) <= cap:
			solution.append(i)
			total += int(offers[i]["value"])
	var floor_total := mini(total, roundi(cap * 0.3))
	var items: Array = []
	items.append(_choice("plafond", "Valeur maximale conseillée des contreparties pour un don de %s ?" % Format.money(gift), Format.money(cap),
		[Format.money(roundi(gift * 0.1)), Format.money(roundi(gift * 0.5)), Format.money(roundi(gift * 0.6))],
		"Repère admis par l'administration fiscale : les contreparties restent dans une « disproportion marquée » avec le don, soit [b]25 %% au plus[/b] (%s)." % Format.money(cap), rng))
	items.append({"id": "contreparties", "kind": "multi", "prompt": "Composez une offre de contreparties attrayante (au moins %s) sans dépasser %s." % [Format.money(floor_total), Format.money(cap)],
		"options": offers, "min_total": floor_total, "max_total": cap, "solution": solution,
		"explain": "Toutes les contreparties sont valorisées (au prix qu'elles coûteraient). Le total doit rester sous %s ; au-delà, l'opération risque d'être requalifiée." % Format.money(cap)})
	items.append(_choice("cout", "Combien ce don coûte-t-il réellement à l'entreprise, après la réduction d'impôt ?", Format.money(roundi(gift * 0.4)),
		[Format.money(roundi(gift * 0.6)), Format.money(gift), Format.money(roundi(gift * 0.75))],
		"Réduction d'impôt de 60 %% du don (dans certaines limites) : %s − %s = [b]%s[/b]." % [Format.money(gift), Format.money(roundi(gift * 0.6)), Format.money(roundi(gift * 0.4))], rng))
	items.append(_choice("requalification", "Si les contreparties dépassent nettement ce repère, l'opération risque d'être requalifiée en…", "parrainage (opération commerciale, sans réduction d'impôt)",
		["subvention publique", "coproduction artistique", "prêt sans intérêt"],
		"Sans disproportion marquée, ce n'est plus un don mais un échange commercial : du [b]parrainage[/b], qui ne donne pas droit à la réduction d'impôt.", rng))
	return {"intro": "Ondine Énergie envisage un don de [b]%s[/b] au Théâtre de la Lanterne. Préparez la proposition." % Format.money(gift),
		"items": items,
		"takeaway": "Mécénat = don avec réduction d'impôt de 60 % pour l'entreprise ; contreparties valorisées et limitées (repère : 25 % du don). Au-delà, c'est du parrainage."}

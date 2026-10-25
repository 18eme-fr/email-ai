class_name Briefing
extends RefCounted
## Remarques des personnages en début de période, selon l'état du théâtre.
## Règles simples et déterministes : chaque personnage parle de son domaine.


static func lines(session: GameSession) -> Array:
	var s := session.state
	var data := session.data
	var out: Array = []
	var projection := s.cash + Ledger.due_until(s, s.turn) - session.fixed_costs_total()
	if s.cash < 0:
		out.append({"character": "helene", "mood": "worried", "text": "Nous sommes à découvert de %s. Chaque dépense compte : la limite autorisée par la banque est de %s." % [Format.money(-s.cash), Format.money(int(data.balance["overdraft_limit"]))]})
	elif projection < 3000:
		out.append({"character": "helene", "mood": "worried", "text": "Avant toute programmation, la trésorerie prévue en fin de période n'est que de %s. Prudence." % Format.money(projection)})
	else:
		out.append({"character": "helene", "mood": "neutral", "text": "Trésorerie disponible : %s. Après les charges fixes et les échéances, il resterait environ %s avant programmation." % [Format.money(s.cash), Format.money(projection)]})
	if s.stat("equipement") < 45.0:
		out.append({"character": "bastien", "mood": "worried", "text": "Les équipements sont fatigués (%d/100). Sans entretien, les spectacles techniques risquent l'incident." % roundi(s.stat("equipement"))})
	elif s.stat("equipe") < 40.0:
		out.append({"character": "bastien", "mood": "worried", "text": "L'équipe est épuisée (%d/100). Une formation ou une période plus légère nous ferait du bien." % roundi(s.stat("equipe"))})
	var objectives := SeasonEvaluator.objectives(data, s)
	var remaining := data.turns() - s.turn + 1
	for obj: Dictionary in objectives:
		if obj["id"] == "eac" and not obj["met"] and remaining <= 4:
			out.append({"character": "ines", "mood": "worried", "text": "Nous n'avons mené que %d actions d'éducation artistique sur les %d promises. Il reste %d périodes." % [int(obj["value"]), int(obj["target"]), remaining]})
			break
		if obj["id"] == "exigence" and not obj["met"] and remaining <= 4:
			out.append({"character": "louison", "mood": "angry", "text": "Seulement %d œuvres exigeantes cette saison. La convention en demande %d !" % [int(obj["value"]), int(obj["target"])]})
			break
	if s.turn == data.turns():
		out.append({"character": "pommier", "mood": "neutral", "text": "Dernière période de la saison ! Le conseil municipal examinera votre bilan pour le solde de la subvention et le renouvellement de la convention."})
	elif s.turn == 1:
		out.append({"character": "ines", "mood": "happy", "text": "Nouvelle saison, nouveaux publics ! Pensez à varier les propositions : chaque public a ses envies."})
	return out

class_name BudgetPanel
extends RefCounted
## Fenêtre « Budget » : trésorerie, échéancier complet et courbe de trésorerie.


static func open(parent: Node, session: GameSession) -> Modal:
	var s := session.state
	var m := Modal.open(parent, "Budget et trésorerie", 900, 600)
	var c := m.content
	c.add_child(UiKit.rich("Trésorerie actuelle : [b]%s[/b]   ·   À recevoir : [b]%s[/b]   ·   À payer : [b]%s[/b]   ·   Découvert autorisé jusqu'à %s" % [
		Format.money(s.cash), Format.money(Ledger.outstanding_total(s, Ledger.INCOME)),
		Format.money(Ledger.outstanding_total(s, Ledger.EXPENSE)), Format.money(Rules.overdraft_limit(session.data, s))]))
	c.add_child(UiKit.hbox([UiKit.notion_link("tresorerie_resultat", "Trésorerie ou résultat ?"), UiKit.notion_link("subvention", "Subventions"), UiKit.notion_link("convention_objectifs", "Convention d'objectifs")]))
	if s.history.size() > 0:
		var chart := LineChart.new()
		chart.custom_minimum_size = Vector2(820, 180)
		var points: Array[float] = [float(session.starting_cash())]
		for h: Dictionary in s.history:
			points.append(float(h["cash"]))
		chart.series = points
		chart.title = "Trésorerie en fin de période"
		c.add_child(chart)
	c.add_child(UiKit.label("Échéancier", "SubHeaderLabel"))
	var rows: Array = []
	for e: Dictionary in s.ledger:
		if not e["settled"] and not e["cancelled"] and not e.get("non_cash", false):
			rows.append(e)
	rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a["due_turn"]) < int(b["due_turn"]))
	if rows.is_empty():
		c.add_child(UiKit.label("Rien à recevoir ni à payer.", "SmallLabel"))
	for e: Dictionary in rows:
		var cond := " — sous condition du bilan de fin de saison" if e["conditional"] else ""
		c.add_child(UiKit.rich("Période %d : %s  %s%s" % [int(e["due_turn"]), UiKit.delta_text(int(e["amount"]) * int(e["direction"]), true), e["label"], cond]))
	c.add_child(UiKit.label("Charges fixes : %s par période (salaires de l'équipe permanente, énergie, assurance, entretien courant)." % Format.money(session.fixed_costs_total()), "SmallLabel", true))
	return m

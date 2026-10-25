class_name ReportsHistory
extends RefCounted
## Fenêtre « Bilans » : tous les bilans des périodes précédentes.


static func open(parent: Node, session: GameSession) -> Modal:
	var m := Modal.open(parent, "Bilans des périodes", 900, 600)
	var c := m.content
	if session.state.reports.is_empty():
		c.add_child(UiKit.label("Aucun bilan pour l'instant : terminez une première période.", "MutedLabel"))
		return m
	for i in range(session.state.reports.size() - 1, -1, -1):
		var r: Dictionary = session.state.reports[i]
		var fin: Dictionary = r["finance"]
		var card := UiKit.panel("InsetPanel")
		var col := UiKit.vbox([], 2)
		card.add_child(col)
		col.add_child(UiKit.label("Période %d — %s" % [int(r["turn"]), r["period"]], "SubHeaderLabel"))
		col.add_child(UiKit.rich("Résultat %s  ·  Trésorerie %s → %s  ·  Entrées %s" % [
			UiKit.delta_text(fin["resultat"], true), Format.money(int(fin["cash_before"])), Format.money(int(fin["cash_after"])), Format.thousands(int(r["attendance"]))]))
		for s: Dictionary in r.get("shows", []):
			if s.get("cancelled", false):
				col.add_child(UiKit.label("  • %s : annulé" % s["title"], "SmallLabel"))
			else:
				col.add_child(UiKit.rich("  • %s : %d places, %s, marge %s" % [s["title"], int(s["sold"]), str(s["quality_label"]).to_lower(), UiKit.delta_text(s["finance"]["margin"], true)]))
		if not r.get("event", {}).is_empty():
			col.add_child(UiKit.label("  Événement : %s — %s" % [r["event"]["title"], r["event"]["choice"]], "SmallLabel", true))
		c.add_child(card)
	return m

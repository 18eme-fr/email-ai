class_name CaseStudy
extends RefCounted
## Fiche « étude de cas » du scénario : contexte, problématique, objectifs de la
## convention et notions travaillées. Montrée en début de partie et dans le journal.


static func open(parent: Node, session: GameSession) -> Modal:
	var sc := session.scenario()
	var m := Modal.open(parent, "Étude de cas — %s" % sc.get("title", ""), 940, 700)
	fill(m.content, session)
	var go := UiKit.primary("Prendre mes fonctions")
	go.size_flags_horizontal = Control.SIZE_SHRINK_END
	go.pressed.connect(m.close_modal)
	m.content.add_child(go)
	go.grab_focus.call_deferred()
	return m


static func fill(c: VBoxContainer, session: GameSession) -> void:
	var data := session.data
	var sc := session.scenario()
	c.add_child(UiKit.label("%s · niveau %s" % [sc.get("title", ""), sc.get("level", "")], "SubHeaderLabel"))
	var ctx := UiKit.panel("PaperPanel")
	var t := UiKit.rich(str(sc.get("context", "")))
	t.theme_type_variation = "PaperRichText"
	ctx.add_child(t)
	c.add_child(ctx)
	c.add_child(UiKit.rich("[b]Problématique :[/b] [i]%s[/i]" % sc.get("question", "")))
	c.add_child(UiKit.label("Engagements de la convention avec la Ville", "SubHeaderLabel"))
	for obj: Dictionary in SeasonEvaluator.objectives(data, session.state):
		var mark := UiKit.icon_rect("check" if obj["met"] else "lock", 20)
		c.add_child(UiKit.hbox([mark, UiKit.label("%s%s" % [obj["label"], " (obligatoire)" if obj.get("required", false) else ""], "", true)], 6))
	var rule := data.renewal_rule_for(session.state)
	c.add_child(UiKit.label("Pour obtenir le renouvellement : l'objectif obligatoire, au moins %d autres, et des relations avec la Ville d'au moins %d." % [int(rule.get("others_needed", 2)), int(rule.get("min_relations", 40))], "SmallLabel", true))
	c.add_child(UiKit.label("Notions travaillées", "SubHeaderLabel"))
	var row := HFlowContainer.new()
	for n: String in sc.get("learning", []):
		row.add_child(UiKit.notion_link(n, str(data.glossary.get(n, {}).get("title", n))))
	c.add_child(row)
	c.add_child(UiKit.label("Les personnages vous confieront des missions au fil de la saison : acceptez-les depuis le journal de bord (touche J) ou en leur parlant.", "SmallLabel", true))

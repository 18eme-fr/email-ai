class_name TheatreStatus
extends RefCounted
## Fenêtre « État du théâtre » : indicateurs, objectifs de la convention et
## rénovations (monde explorable).

const TIPS := {
	"reputation": "Reconnaissance artistique du lieu par la critique et la profession.",
	"fidelite": "Envie des spectateurs de revenir. Augmente la fréquentation de tous les spectacles.",
	"diversite": "Variété des publics touchés (âges, quartiers, milieux).",
	"equipe": "Forme de l'équipe. Influence la qualité des représentations.",
	"equipement": "État du matériel et de la salle. Trop bas, risque d'incident sur les spectacles techniques.",
	"communication": "Visibilité de la programmation. S'estompe d'une période à l'autre.",
	"relations": "Confiance de la Ville et des partenaires.",
}


static func open(parent: Node, session: GameSession) -> Modal:
	var m := Modal.open(parent, "État du théâtre", 860, 600)
	var c := m.content
	c.add_child(UiKit.hbox([UiKit.label("Indicateurs", "SubHeaderLabel"), UiKit.spacer(), UiKit.notion_link("rayonnement", "Comprendre")]))
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 24)
	for id: String in ["reputation", "fidelite", "diversite", "relations", "equipe", "equipement", "communication"]:
		var g := UiKit.gauge(id, session.state.stat(id), TIPS[id])
		g.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		grid.add_child(g)
	c.add_child(grid)
	c.add_child(HSeparator.new())
	c.add_child(UiKit.hbox([UiKit.label("Objectifs de la convention avec la Ville", "SubHeaderLabel"), UiKit.spacer(), UiKit.notion_link("convention_objectifs", "?")]))
	for obj: Dictionary in SeasonEvaluator.objectives(session.data, session.state):
		var mark := UiKit.icon_rect("check" if obj["met"] else "lock", 20)
		var value := Format.money(int(obj["value"])) if obj["id"] == "equilibre" else Format.thousands(int(obj["value"]))
		var l := UiKit.label("%s — actuellement %s" % [obj["label"], value], "", true)
		if obj["met"]:
			l.add_theme_color_override("font_color", UiKit.GOOD)
		c.add_child(UiKit.hbox([mark, l], 6))
	c.add_child(HSeparator.new())
	c.add_child(UiKit.hbox([UiKit.label("Rénovations", "SubHeaderLabel"), UiKit.spacer(), UiKit.notion_link("investissement", "Investir ?")]))
	var world := WorldData.get_default()
	for id: String in session.data.upgrade_order:
		var u: Dictionary = session.data.upgrades[id]
		var done: bool = id in session.state.upgrades
		var place := world.map(str(u["place"]))
		var status := "réalisée" if done else "%s — à décider sur place (%s)" % [Format.money(int(u["cost"])), place.name if place else ""]
		var l := UiKit.label("%s : %s" % [u["label"], status], "", true)
		if done:
			l.add_theme_color_override("font_color", UiKit.GOOD)
		c.add_child(UiKit.hbox([UiKit.icon_rect("check" if done else str(u.get("icon", "wrench")), 20), l], 6))
	return m

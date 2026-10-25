class_name GlossaryPanel
extends RefCounted
## « Carnet du directeur » : notions d'administration culturelle, consultables à tout moment.


static func open(parent: Node, notion_id: String = "") -> Modal:
	var data := GameData.get_default()
	var m := Modal.open(parent, "Carnet du directeur", 980, 600)
	var row := UiKit.hbox([], 14)
	row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	m.content.add_child(row)
	var list := UiKit.vbox([], 2)
	list.custom_minimum_size.x = 300
	row.add_child(list)
	var detail := UiKit.panel("PaperPanel")
	detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	detail.size_flags_vertical = Control.SIZE_EXPAND_FILL
	row.add_child(detail)
	var text := UiKit.rich("")
	text.theme_type_variation = "PaperRichText"
	text.fit_content = true
	detail.add_child(text)
	var ids: Array = data.glossary.keys()
	ids.sort_custom(func(a: String, b: String) -> bool: return str(data.glossary[a]["title"]) < str(data.glossary[b]["title"]))
	var first: Button = null
	for id: String in ids:
		var b := UiKit.button(str(data.glossary[id]["title"]), "FlatButton")
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.pressed.connect(func() -> void: text.text = notion_bbcode(data, id))
		list.add_child(b)
		if id == notion_id or (notion_id == "" and first == null):
			first = b
			text.text = notion_bbcode(data, id)
	if first:
		first.grab_focus.call_deferred()
	return m


static func notion_bbcode(data: GameData, id: String) -> String:
	var n: Dictionary = data.glossary.get(id, {})
	var out := "[font_size=26][b]%s[/b][/font_size]\n\n%s\n\n" % [n.get("title", id), n.get("short", "")]
	out += "[b]Dans le jeu[/b]\n%s\n\n" % n.get("game", "")
	out += "[b]Dans la réalité[/b]\n%s\n" % n.get("reality", "")
	if bool(n.get("simplified", false)):
		out += "\n[i]Le jeu simplifie cette notion : les règles réelles sont plus nuancées.[/i]\n"
	var sources: Array = n.get("sources", [])
	if not sources.is_empty():
		out += "\n[color=#6e5a4a]Sources : %s (voir SOURCES.md)[/color]" % ", ".join(sources)
	return out

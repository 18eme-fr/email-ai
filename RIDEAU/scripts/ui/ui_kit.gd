class_name UiKit
extends RefCounted
## Petits constructeurs d'éléments d'interface, pour garder les scènes cohérentes.

const ICONS := "res://assets/pixel_art/icons/"
const PORTRAITS := "res://assets/pixel_art/portraits/"
const POSTERS := "res://assets/pixel_art/posters/"

const CREAM := Color("f3e9d2")
const GOLD := Color("f0d48a")
const GOLD_DIM := Color("c9a24b")
const MUTED := Color("b9b0c8")
const GOOD := Color("8fd19e")
const BAD := Color("f08a8a")
const INK := Color("2b1d2e")

const STAT_ICONS := {
	"cash": "cash", "publics": "people", "rayonnement": "star", "reputation": "mask",
	"fidelite": "heart", "diversite": "diversity", "equipe": "team", "equipement": "wrench",
	"communication": "megaphone", "relations": "handshake",
}
const STAT_COLORS := {
	"reputation": Color("c46a7c"), "fidelite": Color("d9474f"), "diversite": Color("7fa86a"),
	"equipe": Color("5f8fb4"), "equipement": Color("b0b4bc"), "communication": Color("e3b341"),
	"relations": Color("9b6bc4"), "rayonnement": Color("f0d48a"),
}
const ACTION_ICONS := {
	"communication": "megaphone", "mediation": "speech", "accueil": "door",
	"formation": "book", "entretien": "wrench", "partenariats": "handshake",
}


static func icon(name: String) -> Texture2D:
	var path := ICONS + name + ".png"
	return load(path) if ResourceLoader.exists(path) else null


static func portrait(character: String, mood: String = "neutral") -> Texture2D:
	var path := PORTRAITS + "%s_%s.png" % [character, mood]
	if not ResourceLoader.exists(path):
		path = PORTRAITS + "%s_neutral.png" % character
	return load(path) if ResourceLoader.exists(path) else null


static func poster(show_id: String) -> Texture2D:
	var path := POSTERS + show_id + ".png"
	return load(path) if ResourceLoader.exists(path) else null


static func label(text: String, variation: String = "", wrap: bool = false) -> Label:
	var l := Label.new()
	l.text = text
	if variation != "":
		l.theme_type_variation = variation
	if wrap:
		# Un texte à la ligne doit pouvoir s'étendre, sinon il se réduit à une colonne d'une syllabe.
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size.x = 40
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return l


static func rich(bbcode: String, fit: bool = true) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = fit
	r.scroll_active = not fit
	r.text = bbcode
	r.custom_minimum_size.x = 40
	r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return r


static func icon_rect(name: String, size: int = 32) -> TextureRect:
	var t := TextureRect.new()
	t.texture = icon(name)
	t.custom_minimum_size = Vector2(size, size)
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	t.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	return t


static func hbox(children: Array = [], sep: int = 8) -> HBoxContainer:
	var b := HBoxContainer.new()
	b.add_theme_constant_override("separation", sep)
	for c: Node in children:
		b.add_child(c)
	return b


static func vbox(children: Array = [], sep: int = 8) -> VBoxContainer:
	var b := VBoxContainer.new()
	b.add_theme_constant_override("separation", sep)
	for c: Node in children:
		b.add_child(c)
	return b


static func panel(variation: String = "", child: Control = null) -> PanelContainer:
	var p := PanelContainer.new()
	if variation != "":
		p.theme_type_variation = variation
	if child:
		p.add_child(child)
	return p


static func button(text: String, variation: String = "", icon_name: String = "") -> Button:
	var b := Button.new()
	b.text = text
	if variation != "":
		b.theme_type_variation = variation
	if icon_name != "":
		b.icon = icon(icon_name)
		b.expand_icon = false
	b.focus_mode = Control.FOCUS_ALL
	b.mouse_entered.connect(func() -> void:
		if not b.disabled:
			AudioDirector.play_sfx("hover"))
	b.pressed.connect(func() -> void: AudioDirector.play_sfx("click", 0.05))
	return b


static func spacer(horizontal: bool = true) -> Control:
	var c := Control.new()
	if horizontal:
		c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	else:
		c.size_flags_vertical = Control.SIZE_EXPAND_FILL
	return c


## Jauge 0–100 avec icône, libellé et valeur.
static func gauge(stat_id: String, value: float, tooltip: String = "") -> Control:
	var row := hbox([], 6)
	row.add_child(icon_rect(STAT_ICONS.get(stat_id, "star"), 24))
	var name_label := label(Rules.STAT_LABELS.get(stat_id, stat_id), "SmallLabel")
	name_label.custom_minimum_size.x = 132
	row.add_child(name_label)
	var bar := ProgressBar.new()
	bar.min_value = 0
	bar.max_value = 100
	bar.value = value
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(60, 14)
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var fill := StyleBoxFlat.new()
	fill.bg_color = STAT_COLORS.get(stat_id, GOLD_DIM)
	fill.border_width_top = 2
	fill.border_color = fill.bg_color.lightened(0.3)
	bar.add_theme_stylebox_override("fill", fill)
	row.add_child(bar)
	var v := label(str(roundi(value)), "SmallLabel")
	v.custom_minimum_size.x = 28
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(v)
	row.tooltip_text = tooltip
	row.mouse_filter = Control.MOUSE_FILTER_STOP
	return row


static func delta_text(delta: float, money: bool = false) -> String:
	var v := roundi(delta)
	if v == 0:
		return "[color=#b9b0c8]=[/color]"
	var color := "#8fd19e" if v > 0 else "#f08a8a"
	var txt := Format.signed_money(v) if money else Format.signed_int(v)
	return "[color=%s]%s[/color]" % [color, txt]


static func clear(node: Node) -> void:
	for c in node.get_children():
		node.remove_child(c)
		c.queue_free()


## Apparition douce (désactivée si « réduire les animations »).
static func fade_in(node: CanvasItem, duration: float = 0.25) -> void:
	if Settings.reduce_motion():
		node.modulate.a = 1.0
		return
	node.modulate.a = 0.0
	var tw := node.create_tween()
	tw.tween_property(node, "modulate:a", 1.0, duration)


## Bouton principal d'une étape : doré, activable avec Entrée.
static func primary(text: String, icon_name: String = "play") -> Button:
	var b := button(text, "GoldButton", icon_name)
	var ev := InputEventAction.new()
	ev.action = "rideau_continue"
	var sc := Shortcut.new()
	sc.events = [ev]
	b.shortcut = sc
	b.shortcut_in_tooltip = true
	b.size_flags_horizontal = Control.SIZE_SHRINK_END
	# Entrée n'agit que si le focus est dans l'écran principal (« Margin ») :
	# jamais à travers une fenêtre modale ouverte par-dessus.
	b.ready.connect(func() -> void:
		var scene := b.get_tree().current_scene
		if scene:
			b.shortcut_context = scene.get_node_or_null("Margin"))
	return b


## Petit bouton « ? » qui ouvre le Carnet du directeur sur une notion.
## `on_paper` : couleurs foncées pour rester lisible sur les panneaux papier.
static func notion_link(notion_id: String, text: String = "?", on_paper: bool = false) -> Button:
	var data := GameData.get_default()
	var notion: Dictionary = data.glossary.get(notion_id, {})
	var b := Button.new()
	b.text = text
	b.theme_type_variation = "FlatButton"
	b.focus_mode = Control.FOCUS_ALL
	b.tooltip_text = "%s : %s\n(cliquer pour en savoir plus)" % [notion.get("title", notion_id), notion.get("short", "")]
	if on_paper:
		b.add_theme_color_override("font_color", Color("7a1a2e"))
		b.add_theme_color_override("font_hover_color", Color("b02a3a"))
		b.add_theme_color_override("font_focus_color", Color("7a1a2e"))
	b.pressed.connect(func() -> void:
		AudioDirector.play_sfx("page")
		var scene := b.get_tree().current_scene
		var host: Node = scene.get_node_or_null("Overlay") if scene else null
		GlossaryPanel.open(host if host else scene, notion_id))
	return b

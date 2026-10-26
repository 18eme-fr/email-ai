class_name WorldHud
extends Control
## Informations permanentes du monde explorable : période et saison,
## trésorerie, publics, rayonnement, objectif en cours, raccourcis.

signal menu_pressed
signal glossary_pressed
signal budget_pressed
signal reports_pressed
signal journal_pressed
signal plan_pressed
signal album_pressed

var _period: Label
var _place: Label
var _chips: HBoxContainer
var _objective: Label
var _objective_panel: PanelContainer
var _toast: PanelContainer
var _toast_text: Label
var _toast_tween: Tween
var _hint: Label
var _guide_list: VBoxContainer
var _place_banner: Label
var _card_pop: PanelContainer
var _card_pic: TextureRect
var _card_title: Label
var _card_kind: Label
var _card_desc: Label
var _card_tween: Tween
var _album_badge: Label
var _place_tween: Tween


func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	# En haut à gauche : période, lieu, chiffres clés.
	var card := UiKit.panel("WoodPanel")
	card.position = Vector2(12, 10)
	card.mouse_filter = Control.MOUSE_FILTER_PASS
	add_child(card)
	var col := UiKit.vbox([], 2)
	card.add_child(col)
	_period = UiKit.label("", "SubHeaderLabel")
	col.add_child(_period)
	_place = UiKit.label("", "SmallLabel")
	col.add_child(_place)
	_chips = UiKit.hbox([], 14)
	col.add_child(_chips)
	# Prochaines étapes, en haut au centre-droit : l'étape en cours (étoile), puis le
	# rendez-vous avec le metteur en scène, les missions et les enquêtes.
	_objective_panel = UiKit.panel("PaperPanel")
	_objective_panel.position = Vector2(484, 8)
	_objective_panel.custom_minimum_size = Vector2(462, 0)
	_objective_panel.size = Vector2(462, 0)
	_objective_panel.mouse_filter = Control.MOUSE_FILTER_PASS
	add_child(_objective_panel)
	var ocol := UiKit.vbox([], 2)
	_objective_panel.add_child(ocol)
	var head := UiKit.label("PROCHAINES ÉTAPES", "SmallLabel")
	head.add_theme_color_override("font_color", Color("8a5a2b"))
	head.add_theme_font_size_override("font_size", 13)
	ocol.add_child(head)
	var orow := UiKit.hbox([UiKit.icon_rect("star", 22)], 6)
	ocol.add_child(orow)
	_objective = UiKit.label("", "PaperLabel", true)
	_objective.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_objective.add_theme_font_size_override("font_size", 16)
	orow.add_child(_objective)
	_guide_list = UiKit.vbox([], 1)
	ocol.add_child(_guide_list)
	# Raccourcis, en haut à droite.
	var buttons := UiKit.hbox([], 4)
	buttons.position = Vector2(1280 - 12 - 180, 12)
	add_child(buttons)
	buttons.position.x -= 138
	for spec: Array in [["album", "Collection de la Lanterne : objets, enquêtes, exposition (C)", album_pressed], ["map", "Plan de la ville (M)", plan_pressed], ["book", "Journal de bord : missions, compétences, trophées (J)", journal_pressed], ["question", "Carnet du directeur (F1)", glossary_pressed], ["cash", "Budget et trésorerie", budget_pressed],
			["chart", "Bilans des périodes", reports_pressed], ["gear", "Menu (Échap)", menu_pressed]]:
		var b := Button.new()
		b.tooltip_text = spec[1]
		b.accessibility_name = spec[1]
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(42, 42)
		# Icône dessinée par-dessus le bouton : les marges du thème la réduisaient trop.
		var pic := TextureRect.new()
		pic.texture = UiKit.icon(spec[0])
		pic.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		pic.offset_left = 7
		pic.offset_top = 6
		pic.offset_right = -7
		pic.offset_bottom = -8
		pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(pic)
		var sig: Signal = spec[2]
		b.pressed.connect(func() -> void:
			AudioDirector.play_sfx("click")
			sig.emit())
		buttons.add_child(b)
		if spec[0] == "album":
			_album_badge = UiKit.label("", "SmallLabel")
			_album_badge.add_theme_color_override("font_color", UiKit.GOLD)
			_album_badge.add_theme_color_override("font_outline_color", Color(0.09, 0.06, 0.12))
			_album_badge.add_theme_constant_override("outline_size", 5)
			_album_badge.position = Vector2(26, 26)
			_album_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
			b.add_child(_album_badge)
	# Aide aux commandes, en bas à gauche.
	_hint = UiKit.label("Flèches ou ZQSD : marcher   ·   Entrée / E : parler, utiliser   ·   Clic : aller   ·   M : plan   ·   Échap : menu", "SmallLabel")
	_hint.position = Vector2(14, 720 - 30)
	_hint.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	_hint.add_theme_constant_override("shadow_offset_x", 1)
	_hint.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_hint)
	# Nom du quartier, quand on en change.
	_place_banner = UiKit.label("", "HeaderLabel")
	_place_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_place_banner.position = Vector2(340, 150)
	_place_banner.size = Vector2(600, 40)
	_place_banner.add_theme_color_override("font_color", Color(1, 0.96, 0.84))
	_place_banner.add_theme_color_override("font_outline_color", Color(0.09, 0.06, 0.12))
	_place_banner.add_theme_constant_override("outline_size", 8)
	_place_banner.visible = false
	add_child(_place_banner)
	# Nouvelle carte d'album : vignette qui glisse depuis la droite.
	_card_pop = UiKit.panel("WoodPanel")
	_card_pop.position = Vector2(1280, 132)
	_card_pop.custom_minimum_size = Vector2(330, 0)
	_card_pop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_card_pop.visible = false
	add_child(_card_pop)
	var crow := UiKit.hbox([], 10)
	_card_pop.add_child(crow)
	_card_pic = TextureRect.new()
	_card_pic.custom_minimum_size = Vector2(72, 54)
	_card_pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_card_pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_card_pic.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	crow.add_child(_card_pic)
	var ccol := UiKit.vbox([], 0)
	ccol.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	crow.add_child(ccol)
	_card_kind = UiKit.label("", "SmallLabel")
	_card_kind.add_theme_color_override("font_color", UiKit.GOLD)
	ccol.add_child(_card_kind)
	ccol.alignment = BoxContainer.ALIGNMENT_CENTER
	_card_title = UiKit.label("", "SubHeaderLabel", true)
	_card_title.custom_minimum_size = Vector2(220, 0)
	ccol.add_child(_card_title)
	_card_desc = UiKit.label("", "SmallLabel", true)
	_card_desc.custom_minimum_size = Vector2(220, 0)
	ccol.add_child(_card_desc)
	# Message éphémère.
	_toast = UiKit.panel("InsetPanel")
	_toast.visible = false
	_toast.position = Vector2(340, 610)
	_toast.custom_minimum_size = Vector2(600, 0)
	add_child(_toast)
	_toast_text = UiKit.label("", "", true)
	_toast_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast.add_child(_toast_text)


func refresh(session: GameSession, place: String, season_label: String, objective: String) -> void:
	var s := session.state
	_period.text = "Période %d / %d — %s · %s" % [s.turn, session.data.turns(), session.period_name(), season_label]
	_place.text = place
	UiKit.clear(_chips)
	var recv := Ledger.outstanding_total(s, Ledger.INCOME)
	var pay := Ledger.outstanding_total(s, Ledger.EXPENSE)
	_chips.add_child(_chip("cash", Format.money(s.cash), UiKit.CREAM if s.cash >= 0 else UiKit.BAD,
		"Trésorerie : l'argent disponible sur le compte.\nÀ recevoir plus tard : %s\nÀ payer plus tard : %s" % [Format.money(recv), Format.money(pay)]))
	_chips.add_child(_chip("people", "%d" % roundi(s.stat("fidelite")), UiKit.CREAM,
		"Fidélité des publics : %d / 100.\nSpectateurs depuis le début de la saison : %s." % [roundi(s.stat("fidelite")), Format.thousands(int(s.totals["attendance_total"]))]))
	_chips.add_child(_chip("star", "%d" % roundi(session.rayonnement()), UiKit.GOLD,
		"Rayonnement : réputation artistique, relations avec les partenaires et diversité des publics."))
	_objective.text = objective
	_hint.visible = s.turn <= 2


## Guide « Prochaines étapes » (WorldRules.guide) : la première entrée est l'étape en
## cours, déjà affichée en gros ; les suivantes s'ajoutent dessous, plus discrètes.
func set_guide(entries: Array) -> void:
	UiKit.clear(_guide_list)
	for e: Dictionary in entries.slice(1, 6):
		var row := UiKit.hbox([UiKit.icon_rect(str(e["icon"]), 18)], 6)
		var l := UiKit.label(str(e["text"]), "PaperLabel", true)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		l.add_theme_font_size_override("font_size", 14)
		l.add_theme_color_override("font_color", Color("6a2a34") if e["tone"] == "todo" else Color("6b5a4a"))
		row.add_child(l)
		_guide_list.add_child(row)


func _chip(icon_name: String, value: String, color: Color, tip: String) -> Control:
	var box := UiKit.hbox([UiKit.icon_rect(icon_name, 24)], 4)
	var v := UiKit.label(value, "NumberLabel")
	v.add_theme_color_override("font_color", color)
	box.add_child(v)
	box.tooltip_text = tip
	box.mouse_filter = Control.MOUSE_FILTER_STOP
	return box


func toast(message: String, kind: String = "info") -> void:
	_toast_text.text = message
	_toast.visible = true
	_toast.modulate.a = 1.0
	if kind == "error":
		AudioDirector.play_sfx("error")
	if _toast_tween:
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_interval(3.5 if kind != "warning" else 7.0)
	_toast_tween.tween_property(_toast, "modulate:a", 0.0, 0.4)
	_toast_tween.tween_callback(func() -> void: _toast.visible = false)


func set_place(place: String) -> void:
	_place.text = place


## Bandeau éphémère au nom du quartier où l'on entre.
func announce_place(name: String) -> void:
	_place_banner.text = name
	_place_banner.visible = true
	_place_banner.modulate.a = 0.0
	if _place_tween:
		_place_tween.kill()
	_place_tween = create_tween()
	_place_tween.tween_property(_place_banner, "modulate:a", 1.0, 0.25)
	_place_tween.tween_interval(1.6)
	_place_tween.tween_property(_place_banner, "modulate:a", 0.0, 0.5)
	_place_tween.tween_callback(func() -> void: _place_banner.visible = false)


## Découverte d'un objet de collection. Commun et peu commun : vignette qui glisse
## sur le côté ; rare et au-delà : présentation au centre, plus solennelle (et plus
## longue pour l'objet mythique). On peut passer avec Entrée ou un clic.
func show_discovery(o: Dictionary, picture: Texture2D, rarity: Dictionary, owned: int, total: int) -> void:
	var col := Color(str(rarity.get("color", "ffffff")))
	if not o["rarity"] in ["rare", "legendaire", "mythique"]:
		_card_kind.text = "%s · objet de collection %d / %d" % [rarity["label"], owned, total]
		_card_kind.add_theme_color_override("font_color", col)
		_card_title.text = str(o["name"])
		_card_desc.text = str(o["description"])
		_card_pic.texture = picture
		_card_pop.visible = true
		_card_pop.reset_size()
		if _card_tween:
			_card_tween.kill()
		var shown := Vector2(1280 - 12 - _card_pop.size.x, 132)
		_card_tween = create_tween()
		if Settings.reduce_motion():
			_card_pop.position = shown
		else:
			_card_pop.position = Vector2(1290, 132)
			_card_tween.tween_property(_card_pop, "position", shown, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		_card_tween.tween_interval(4.0)
		_card_tween.tween_property(_card_pop, "position", Vector2(1290, 132), 0.3)
		_card_tween.tween_callback(func() -> void: _card_pop.visible = false)
		return
	var veil := ColorRect.new()
	veil.color = Color(0.05, 0.03, 0.08, 0.0)
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	veil.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(veil)
	var center := Vector2(640, 300)
	var rays := Node2D.new()
	rays.position = center
	veil.add_child(rays)
	for i in 12:
		var ray := Polygon2D.new()
		ray.polygon = PackedVector2Array([Vector2(0, 0), Vector2(-18, -320), Vector2(18, -320)])
		ray.color = Color(col.r, col.g, col.b, 0.18)
		ray.rotation = TAU * i / 12.0
		rays.add_child(ray)
	var pic := TextureRect.new()
	pic.texture = picture
	pic.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	pic.size = Vector2(128, 128)
	pic.pivot_offset = Vector2(64, 64)
	pic.position = center - Vector2(64, 64)
	veil.add_child(pic)
	var box := UiKit.vbox([], 4)
	box.position = Vector2(290, 400)
	box.custom_minimum_size = Vector2(700, 0)
	veil.add_child(box)
	var kind := UiKit.label("%s — objet %d / %d" % [str(rarity["label"]).to_upper(), owned, total], "SubHeaderLabel")
	kind.add_theme_color_override("font_color", col)
	kind.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(kind)
	var title := UiKit.label(str(o["name"]), "TitleLabel", true)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var desc := UiKit.label(str(o["description"]), "", true)
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	box.add_child(desc)
	var hint := UiKit.label("Entrée ou clic : continuer", "SmallLabel")
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(hint)
	var hold := 4.5 if o["rarity"] == "mythique" else 2.8
	var skip := [false]
	veil.gui_input.connect(func(e: InputEvent) -> void:
		if e is InputEventMouseButton and e.pressed:
			skip[0] = true)
	var tw := create_tween()
	if Settings.reduce_motion():
		veil.color.a = 0.8
	else:
		pic.scale = Vector2(0.2, 0.2)
		tw.tween_property(veil, "color:a", 0.8, 0.25)
		tw.parallel().tween_property(pic, "scale", Vector2(1, 1), 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		var spin := rays.create_tween().set_loops()
		spin.tween_property(rays, "rotation", TAU, 12.0).from(0.0)
	var t := 0.0
	while t < hold and not skip[0]:
		await get_tree().process_frame
		t += get_process_delta_time()
		if t > 0.4 and Input.is_action_just_pressed("ui_accept"):
			skip[0] = true
	tw.kill()
	veil.queue_free()


func set_album_badge(n: int) -> void:
	_album_badge.text = "%d" % n if n > 0 else ""

class_name CollectionPanel
extends RefCounted
## Fenêtre de la collection : les cinq familles (10 objets chacune), les
## enquêtes et indices, l'exposition dans les vitrines du hall et les
## récompenses (tenues, distinctions). Les objets manquants apparaissent en
## silhouette, avec des indices qui se dévoilent progressivement.

const COLS := 5
const TILE := Vector2(150, 176)
const ICONS := "res://assets/collection/"

static var _tex_cache: Dictionary = {}


static func icon(o: Dictionary) -> Texture2D:
	var path := ICONS + "%s.png" % o.get("icon", "")
	if not _tex_cache.has(path):
		_tex_cache[path] = load(path) if ResourceLoader.exists(path) else null
	return _tex_cache[path]


static func rarity_color(col: Collection, rarity: String) -> Color:
	return Color(str(col.rarity_info(rarity)["color"]))


## `on_change` est appelé quand l'exposition ou la tenue changent (pour redessiner le monde).
static func open(parent: Node, col: Collection, session: GameSession, tab: String = "", on_change: Callable = Callable()) -> Modal:
	var m := Modal.open(parent, "Collection de la Lanterne", 1200, 690)
	var head := UiKit.hbox([], 12)
	m.content.add_child(head)
	head.add_child(UiKit.label("Collection : %d / %d" % [col.count(), col.total()], "SubHeaderLabel"))
	var bar := ProgressBar.new()
	bar.max_value = col.total()
	bar.value = col.count()
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(200, 18)
	bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	head.add_child(bar)
	for r: Dictionary in col.rewards:
		if r["kind"] == "title" and col.reward_unlocked(r):
			var t := UiKit.label("★ " + str(r["label"]), "SmallLabel")
			t.add_theme_color_override("font_color", UiKit.GOLD)
			head.add_child(t)
	var tabs := HFlowContainer.new()
	tabs.add_theme_constant_override("h_separation", 6)
	m.content.add_child(tabs)
	var body := UiKit.hbox([], 14)
	m.content.add_child(body)
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(TILE.x * COLS + 8 * (COLS - 1) + 16, 470)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body.add_child(scroll)
	var left := UiKit.vbox([], 8)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(left)
	var detail := UiKit.panel("PaperPanel")
	detail.custom_minimum_size = Vector2(300, 470)
	body.add_child(detail)
	var dscroll := ScrollContainer.new()
	dscroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	detail.add_child(dscroll)
	var dbox := UiKit.vbox([], 8)
	dbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	dscroll.add_child(dbox)
	var fresh: Array = col.unseen.duplicate()
	var state := {"tab": ""}
	var show_tab: Callable
	var refresh := func() -> void:
		if on_change.is_valid():
			on_change.call()
		show_tab.call(state["tab"])
	show_tab = func(tab_id: String) -> void:
		state["tab"] = tab_id
		UiKit.clear(left)
		UiKit.clear(dbox)
		match tab_id:
			"enquetes":
				_fill_quests(left, dbox, col)
			"exposition":
				_fill_exhibit(left, dbox, col, refresh)
			"recompenses":
				_fill_rewards(left, dbox, col, refresh)
			_:
				_fill_family(left, dbox, col, tab_id, fresh, refresh)
	for f: Dictionary in col.families:
		var fid := str(f["id"])
		var b := UiKit.button("%s %d/%d" % [f["label"], col.count(fid), col.total(fid)], "SecondaryButton")
		b.tooltip_text = str(f["title"])
		b.pressed.connect(func() -> void: show_tab.call(fid))
		tabs.add_child(b)
	for spec: Array in [["enquetes", "Enquêtes et indices"], ["exposition", "Exposition"], ["recompenses", "Récompenses"]]:
		var b := UiKit.button(spec[1], "SecondaryButton")
		var tid: String = spec[0]
		b.pressed.connect(func() -> void: show_tab.call(tid))
		tabs.add_child(b)
	var first := tab
	if first == "":
		first = str(col.families[0]["id"])
		if not fresh.is_empty():
			first = str(col.object(str(fresh.back())).get("family", first))
	show_tab.call(first)
	col.mark_seen()
	return m


# --- Familles ---------------------------------------------------------------------------

static func _fill_family(left: VBoxContainer, dbox: VBoxContainer, col: Collection, family: String, fresh: Array, refresh: Callable) -> void:
	var f := col.family_info(family)
	left.add_child(UiKit.label("%s — %d / %d" % [f["title"], col.count(family), col.total(family)], "SubHeaderLabel"))
	var grid := GridContainer.new()
	grid.columns = COLS
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	left.add_child(grid)
	dbox.add_child(_ink(UiKit.label("Choisissez un objet.", "PaperLabel", true)))
	dbox.add_child(_ink(UiKit.label("Les objets manquants gardent leur rareté visible ; leurs indices se dévoilent à mesure que la collection grandit. Fernand, l'ancien régisseur, donne un indice précis par période.", "PaperLabel", true)))
	for o: Dictionary in col.in_family(family):
		var tile := _tile(col, o, o["id"] in fresh)
		tile.pressed.connect(func() -> void:
			UiKit.clear(dbox)
			_fill_detail(dbox, col, o, refresh))
		grid.add_child(tile)


static func _tile(col: Collection, o: Dictionary, is_new: bool) -> Button:
	var have := col.has(o["id"])
	var b := Button.new()
	b.custom_minimum_size = TILE
	b.theme_type_variation = &"FlatButton"
	b.tooltip_text = str(o["name"]) if have else "Objet à découvrir (%s)" % col.rarity_info(o["rarity"])["label"]
	b.accessibility_name = b.tooltip_text
	var c := UiKit.vbox([], 4)
	c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	c.offset_left = 6
	c.offset_top = 6
	c.offset_right = -6
	c.offset_bottom = -6
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(c)
	var stripe := ColorRect.new()
	stripe.color = rarity_color(col, o["rarity"])
	stripe.custom_minimum_size = Vector2(0, 4)
	stripe.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(stripe)
	var pic := _pic(o, Vector2(0, 96))
	if not have:
		pic.modulate = Color(0.08, 0.06, 0.12, 0.9)
	c.add_child(pic)
	var name := UiKit.label(str(o["name"]) if have else "? ? ?", "SmallLabel", true)
	name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(name)
	if is_new:
		var tag := UiKit.label("Nouveau !", "SmallLabel")
		tag.add_theme_color_override("font_color", UiKit.GOLD)
		tag.position = Vector2(8, 12)
		b.add_child(tag)
	if o["id"] in col.exhibit:
		var ex := UiKit.label("En vitrine", "SmallLabel")
		ex.add_theme_color_override("font_color", UiKit.GOOD)
		ex.position = Vector2(70, 12)
		b.add_child(ex)
	return b


static func _fill_detail(dbox: VBoxContainer, col: Collection, o: Dictionary, refresh: Callable) -> void:
	var have := col.has(o["id"])
	var pic := _pic(o, Vector2(268, 150))
	if not have:
		pic.modulate = Color(0.08, 0.06, 0.12, 0.9)
	dbox.add_child(pic)
	var r := col.rarity_info(o["rarity"])
	var rl := UiKit.label("%s · %s" % [r["label"], col.family_info(o["family"])["label"]], "PaperLabel", true)
	rl.add_theme_color_override("font_color", Color(str(r["color"])).darkened(0.5))
	dbox.add_child(rl)
	if not have:
		dbox.add_child(_ink(UiKit.label("Objet à découvrir", "HeaderLabel", true)))
		var hints := col.hints(o["id"])
		for i in 3:
			var txt := "Indice %d : %s" % [i + 1, hints[i]] if i < hints.size() else "Indice %d : ?" % (i + 1)
			dbox.add_child(_ink(UiKit.label(txt, "PaperLabel", true)))
		if hints.size() < 3:
			dbox.add_child(_ink(UiKit.label("Plus d'indices : agrandissez cette famille, ou demandez conseil à Fernand (une fois par période).", "SmallLabel", true)))
		return
	dbox.add_child(_ink(UiKit.label(str(o["name"]), "HeaderLabel", true)))
	dbox.add_child(_ink(UiKit.label(str(o["description"]), "PaperLabel", true)))
	var method: Dictionary = col.methods.get(o["method"], {})
	dbox.add_child(_ink(UiKit.label("Obtenu par : %s" % method.get("label", ""), "SmallLabel", true)))
	var on: bool = o["id"] in col.exhibit
	var b := UiKit.button("Retirer de la vitrine" if on else "Exposer dans le hall", "SecondaryButton")
	b.disabled = not on and col.exhibit.size() >= col.exhibit_slots
	if b.disabled:
		b.tooltip_text = "Les %d places des vitrines sont prises." % col.exhibit_slots
	var oid := str(o["id"])
	b.pressed.connect(func() -> void:
		if col.set_exhibited(oid, not on):
			AudioDirector.play_sfx("confirm")
			refresh.call())
	dbox.add_child(b)


# --- Enquêtes et indices ------------------------------------------------------------------

static func _fill_quests(left: VBoxContainer, dbox: VBoxContainer, col: Collection) -> void:
	left.add_child(UiKit.label("Enquêtes", "SubHeaderLabel"))
	var hidden := 0
	for q: Dictionary in col.quests:
		var st := col.quest_status(q["id"])
		if st == "unknown":
			hidden += 1
			continue
		var card := UiKit.panel("InsetPanel")
		var c := UiKit.vbox([], 2)
		card.add_child(c)
		var title := UiKit.label(("✓ " if st == "done" else "") + str(q["title"]), "SubHeaderLabel")
		if st == "done":
			title.add_theme_color_override("font_color", UiKit.GOOD)
		c.add_child(title)
		if st == "active":
			c.add_child(UiKit.label("Étape en cours : " + col.quest_current_step(q["id"]), "", true))
			c.add_child(UiKit.label("%d / %d étapes" % [int(col.quest_steps.get(q["id"], 0)), (q["steps"] as Array).size()], "SmallLabel"))
		else:
			c.add_child(UiKit.label("Récompense obtenue : %s" % col.object(str(q["reward"]))["name"], "SmallLabel", true))
		left.add_child(card)
	if hidden > 0:
		left.add_child(UiKit.label("%d enquête(s) encore secrète(s). Parlez aux gens : certains attendent la bonne occasion (bulle « ? »)." % hidden, "SmallLabel", true))
	dbox.add_child(_ink(UiKit.label("Carnet d'indices", "HeaderLabel", true)))
	if col.known_clues.is_empty():
		dbox.add_child(_ink(UiKit.label("Aucun indice pour l'instant. Lisez les descriptions des objets trouvés et écoutez les habitants.", "PaperLabel", true)))
	for id: String in col.known_clues:
		var c: Dictionary = col.clues.get(id, {})
		dbox.add_child(_ink(UiKit.label("• " + str(c.get("title", id)), "PaperLabel")))
		dbox.add_child(_ink(UiKit.label(str(c.get("text", "")), "SmallLabel", true)))


# --- Exposition ---------------------------------------------------------------------------

static func _fill_exhibit(left: VBoxContainer, dbox: VBoxContainer, col: Collection, refresh: Callable) -> void:
	left.add_child(UiKit.label("Vitrines du hall : %d / %d places" % [col.exhibit.size(), col.exhibit_slots], "SubHeaderLabel"))
	left.add_child(UiKit.label("Choisissez les objets exposés dans le hall du théâtre. Un objet retiré de la vitrine reste dans votre collection.", "SmallLabel", true))
	var grid := GridContainer.new()
	grid.columns = 8
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	left.add_child(grid)
	var owned_list := col.objects.filter(func(o: Dictionary) -> bool: return col.has(o["id"]))
	if owned_list.is_empty():
		left.add_child(UiKit.label("Trouvez d'abord des objets : les vitrines vous attendent.", "", true))
	for o: Dictionary in owned_list:
		var on: bool = o["id"] in col.exhibit
		var b := Button.new()
		b.custom_minimum_size = Vector2(84, 84)
		b.theme_type_variation = &"FlatButton"
		b.toggle_mode = true
		b.button_pressed = on
		b.tooltip_text = "%s — %s" % [o["name"], "en vitrine (cliquer pour retirer)" if on else "cliquer pour exposer"]
		b.accessibility_name = b.tooltip_text
		var p := _pic(o, Vector2(64, 64))
		p.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
		p.position = Vector2(10, 10)
		p.size = Vector2(64, 64)
		b.add_child(p)
		if on:
			var mark := UiKit.label("✓", "SubHeaderLabel")
			mark.add_theme_color_override("font_color", UiKit.GOOD)
			mark.position = Vector2(64, 0)
			b.add_child(mark)
		var oid := str(o["id"])
		b.pressed.connect(func() -> void:
			if col.set_exhibited(oid, not on):
				AudioDirector.play_sfx("confirm")
			refresh.call())
		grid.add_child(b)
	dbox.add_child(_ink(UiKit.label("Exposition", "HeaderLabel", true)))
	for id: String in col.exhibit:
		dbox.add_child(_ink(UiKit.label("• " + str(col.object(id)["name"]), "PaperLabel", true)))
	if col.exhibit.is_empty():
		dbox.add_child(_ink(UiKit.label("Les vitrines sont vides.", "PaperLabel", true)))


# --- Récompenses --------------------------------------------------------------------------

static func _fill_rewards(left: VBoxContainer, dbox: VBoxContainer, col: Collection, refresh: Callable) -> void:
	left.add_child(UiKit.label("Tenues du directeur", "SubHeaderLabel"))
	var grid := GridContainer.new()
	grid.columns = COLS
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	left.add_child(grid)
	for o: Dictionary in col.outfits():
		var ok := col.reward_unlocked(o)
		var worn := str(o["id"]) == col.outfit
		var b := Button.new()
		b.custom_minimum_size = Vector2(TILE.x, 150)
		b.theme_type_variation = &"FlatButton"
		b.disabled = not ok
		b.tooltip_text = str(o["label"]) if ok else "À débloquer : " + col.reward_condition(o)
		var c := UiKit.vbox([], 4)
		c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		c.offset_top = 6
		c.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(c)
		var pic := TextureRect.new()
		pic.texture = _sprite_frame(str(o["sprite"]))
		pic.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(0, 90)
		pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if not ok:
			pic.modulate = Color(0.08, 0.06, 0.12, 0.9)
		c.add_child(pic)
		var l := UiKit.label((("✓ " if worn else "") + str(o["label"])) if ok else col.reward_condition(o), "SmallLabel", true)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if worn:
			l.add_theme_color_override("font_color", UiKit.GOLD)
		c.add_child(l)
		var oid := str(o["id"])
		b.pressed.connect(func() -> void:
			if col.set_outfit(oid):
				AudioDirector.play_sfx("confirm")
				refresh.call())
		grid.add_child(b)
	dbox.add_child(_ink(UiKit.label("Paliers de la collection", "HeaderLabel", true)))
	for r: Dictionary in col.rewards:
		var ok := col.reward_unlocked(r)
		var kind: String = {"outfit": "tenue", "decor": "décor du hall", "title": "distinction"}.get(str(r["kind"]), "")
		var l := _ink(UiKit.label("%s %s — %s (%s)" % ["✓" if ok else "·", col.reward_condition(r), r["label"], kind], "PaperLabel", true))
		if ok:
			l.add_theme_color_override("font_color", Color("2e6b3a"))
		dbox.add_child(l)
	dbox.add_child(_ink(UiKit.label("Ces récompenses sont purement décoratives : la collection ne change jamais la gestion du théâtre.", "SmallLabel", true)))


# --- Outils -------------------------------------------------------------------------------

static func _pic(o: Dictionary, size: Vector2) -> TextureRect:
	var r := TextureRect.new()
	r.texture = icon(o)
	r.custom_minimum_size = size
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r


static func _sprite_frame(sprite: String) -> Texture2D:
	var path := "res://assets/world/people/%s.png" % sprite
	if not ResourceLoader.exists(path):
		return null
	var a := AtlasTexture.new()
	a.atlas = load(path)
	a.region = Rect2(0, 0, 16, 24)
	return a


static func _ink(l: Label) -> Label:
	l.add_theme_color_override("font_color", UiKit.INK)
	return l

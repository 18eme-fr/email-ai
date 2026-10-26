class_name AlbumPanel
extends RefCounted
## Album de Bréval : les cartes collectionnées (rencontres, lieux, affiches,
## trésors) et les tenues du directeur qu'elles débloquent. Les cartes
## manquantes apparaissent en silhouette avec un indice pour les trouver.

const COLS := 5
const CARD_SIZE := Vector2(148, 176)
const PIC_SIZE := Vector2(128, 96)
const RARITY := {
	"commune": {"label": "Commune", "color": Color("b9b0c8")},
	"rare": {"label": "Rare", "color": Color("8fc3f0")},
	"legendaire": {"label": "Légendaire", "color": Color("f0d48a")},
}

static var _crop_cache: Dictionary = {}


## `on_outfit` est appelé quand le joueur change de tenue (pour mettre à jour son personnage).
static func open(parent: Node, album: Album, on_outfit: Callable = Callable()) -> Modal:
	var m := Modal.open(parent, "Album de Bréval", 1200, 690)
	var head := UiKit.hbox([], 12)
	m.content.add_child(head)
	var bar := ProgressBar.new()
	bar.max_value = album.total()
	bar.value = album.count()
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(260, 18)
	bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	head.add_child(UiKit.label("%d / %d cartes" % [album.count(), album.total()], "SubHeaderLabel"))
	head.add_child(bar)
	head.add_child(UiKit.spacer())
	var tabs := UiKit.hbox([], 6)
	head.add_child(tabs)
	var body := UiKit.hbox([], 14)
	m.content.add_child(body)
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(CARD_SIZE.x * COLS + 8 * (COLS - 1) + 16, 520)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body.add_child(scroll)
	var grid := GridContainer.new()
	grid.columns = COLS
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	scroll.add_child(grid)
	var detail := UiKit.panel("PaperPanel")
	detail.custom_minimum_size = Vector2(300, 520)
	body.add_child(detail)
	var detail_box := UiKit.vbox([], 8)
	detail.add_child(detail_box)
	var fresh: Array = album.unseen.duplicate()
	var show_card := func(c: Dictionary) -> void:
		UiKit.clear(detail_box)
		_fill_detail(detail_box, album, c)
	var show_tab: Callable
	show_tab = func(cat_id: String) -> void:
		UiKit.clear(grid)
		UiKit.clear(detail_box)
		if cat_id == "tenues":
			_fill_outfits(grid, detail_box, album, on_outfit, func() -> void: show_tab.call("tenues"))
			return
		var hint := ""
		for cat: Dictionary in album.categories:
			if cat["id"] == cat_id:
				hint = str(cat["hint"])
		detail_box.add_child(UiKit.label("Choisissez une carte.", "PaperLabel", true))
		detail_box.add_child(UiKit.label("Pour en trouver d'autres : " + hint, "PaperLabel", true))
		for c: Dictionary in album.in_category(cat_id):
			var tile := _tile(album, c, c["id"] in fresh)
			tile.pressed.connect(func() -> void: show_card.call(c))
			grid.add_child(tile)
	for cat: Dictionary in album.categories:
		var cid := str(cat["id"])
		var b := UiKit.button("%s %d/%d" % [cat["label"], album.count(cid), album.total(cid)], "SecondaryButton")
		b.pressed.connect(func() -> void: show_tab.call(cid))
		tabs.add_child(b)
	var t := UiKit.button("Tenues", "SecondaryButton")
	t.pressed.connect(func() -> void: show_tab.call("tenues"))
	tabs.add_child(t)
	# On ouvre sur la catégorie de la dernière carte trouvée.
	var first := str(album.categories[0]["id"]) if not album.categories.is_empty() else ""
	if not fresh.is_empty():
		first = str(album.card(str(fresh.back())).get("category", first))
	show_tab.call(first)
	album.mark_seen()
	return m


## Vignette d'une carte (bouton). Les cartes manquantes restent en silhouette.
static func _tile(album: Album, c: Dictionary, is_new: bool) -> Button:
	var owned := album.has(c["id"])
	var b := Button.new()
	b.custom_minimum_size = CARD_SIZE
	b.theme_type_variation = &"FlatButton"
	b.tooltip_text = str(c["title"]) if owned else "Carte à découvrir"
	b.accessibility_name = b.tooltip_text
	var col := UiKit.vbox([], 4)
	col.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	col.offset_left = 6
	col.offset_top = 6
	col.offset_right = -6
	col.offset_bottom = -6
	col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(col)
	var frame := ColorRect.new()
	frame.color = RARITY[str(c["rarity"])]["color"] if owned else Color(0.25, 0.2, 0.3)
	frame.custom_minimum_size = Vector2(0, 4)
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	col.add_child(frame)
	var pic := picture(c, PIC_SIZE)
	if not owned:
		pic.modulate = Color(0.08, 0.06, 0.12, 0.85)
	col.add_child(pic)
	var name := UiKit.label(str(c["title"]) if owned else "? ? ?", "SmallLabel", true)
	name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name.mouse_filter = Control.MOUSE_FILTER_IGNORE
	col.add_child(name)
	if is_new:
		var tag := UiKit.label("Nouveau !", "SmallLabel")
		tag.add_theme_color_override("font_color", UiKit.GOLD)
		tag.position = Vector2(8, 10)
		b.add_child(tag)
	return b


static func _fill_detail(box: VBoxContainer, album: Album, c: Dictionary) -> void:
	var owned := album.has(c["id"])
	box.add_child(picture(c, Vector2(268, 200)))
	if not owned:
		(box.get_child(0) as Control).modulate = Color(0.08, 0.06, 0.12, 0.85)
		box.add_child(_ink(UiKit.label("Carte à découvrir", "HeaderLabel", true)))
		for cat: Dictionary in album.categories:
			if cat["id"] == c["category"]:
				box.add_child(UiKit.label("Indice : " + str(cat["hint"]), "PaperLabel", true))
		return
	var title := UiKit.label(str(c["title"]), "HeaderLabel", true)
	title.add_theme_color_override("font_color", UiKit.INK)
	box.add_child(title)
	var r: Dictionary = RARITY[str(c["rarity"])]
	var rl := UiKit.label(str(r["label"]) + (" · " + str(c["subtitle"]) if c.has("subtitle") else ""), "PaperLabel", true)
	rl.add_theme_color_override("font_color", Color(r["color"]).darkened(0.45))
	box.add_child(rl)
	box.add_child(UiKit.label(str(c["text"]), "PaperLabel", true))


static func _ink(l: Label) -> Label:
	l.add_theme_color_override("font_color", UiKit.INK)
	return l


static func _fill_outfits(grid: GridContainer, box: VBoxContainer, album: Album, on_outfit: Callable, refresh: Callable) -> void:
	box.add_child(_ink(UiKit.label("Tenues du directeur", "HeaderLabel", true)))
	box.add_child(UiKit.label("Collectionnez des cartes pour habiller votre personnage autrement. Elles n'ont aucun effet sur la gestion.", "PaperLabel", true))
	for o: Dictionary in album.outfits:
		var ok := album.outfit_unlocked(o)
		var worn := str(o["id"]) == album.outfit
		var b := Button.new()
		b.custom_minimum_size = CARD_SIZE
		b.theme_type_variation = &"FlatButton"
		b.disabled = not ok
		b.tooltip_text = str(o["label"]) if ok else "À débloquer : " + album.outfit_condition(o)
		var col := UiKit.vbox([], 4)
		col.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		col.mouse_filter = Control.MOUSE_FILTER_IGNORE
		col.offset_top = 8
		b.add_child(col)
		var pic := TextureRect.new()
		pic.texture = _sprite_frame(str(o["sprite"]))
		pic.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(0, 104)
		pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if not ok:
			pic.modulate = Color(0.08, 0.06, 0.12, 0.85)
		col.add_child(pic)
		var l := UiKit.label(str(o["label"]) if ok else album.outfit_condition(o), "SmallLabel", true)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if worn:
			l.text = "✓ " + l.text
			l.add_theme_color_override("font_color", UiKit.GOLD)
		col.add_child(l)
		var oid := str(o["id"])
		b.pressed.connect(func() -> void:
			if album.set_outfit(oid):
				AudioDirector.play_sfx("confirm")
				if on_outfit.is_valid():
					on_outfit.call()
				refresh.call())
		grid.add_child(b)


## Image d'une carte : personnage, vue du lieu, affiche ou trésor.
static func picture(c: Dictionary, size: Vector2) -> TextureRect:
	var r := TextureRect.new()
	r.custom_minimum_size = size
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	r.texture = texture_for(c)
	return r


static func texture_for(c: Dictionary) -> Texture2D:
	match str(c["category"]):
		"rencontres":
			var who := str(c["id"]).substr(2)
			return UiKit.portrait(who) if who in WorldScreen.WITH_PORTRAIT else _sprite_frame(str(c.get("sprite", who)))
		"lieux":
			return _place_crop(str(c["map"]), Vector2i(int(c["cell"][0]), int(c["cell"][1])))
		"affiches":
			return UiKit.poster(str(c["show"]))
		"tresors":
			var path := "res://assets/world/fx/tresor_%s.png" % c["icon"]
			return load(path) if ResourceLoader.exists(path) else null
	return null


static func _sprite_frame(sprite: String) -> Texture2D:
	var path := "res://assets/world/people/%s.png" % sprite
	if not ResourceLoader.exists(path):
		return null
	var a := AtlasTexture.new()
	a.atlas = load(path)
	a.region = Rect2(0, 0, 16, 24)
	return a


## Vue du lieu découpée dans l'image de la carte (été pour la ville).
static func _place_crop(map_id: String, cell: Vector2i) -> Texture2D:
	var key := "%s:%s" % [map_id, cell]
	if _crop_cache.has(key):
		return _crop_cache[key]
	var path := "res://assets/world/maps/%s_base.png" % map_id
	for p: String in ["res://assets/world/maps/%s_ete_base.png" % map_id, "res://assets/world/maps/%s_automne_base.png" % map_id]:
		if ResourceLoader.exists(p):
			path = p
	if not ResourceLoader.exists(path):
		return null
	var tex: Texture2D = load(path)
	var w := 8 * 16
	var h := 6 * 16
	var x := clampi(cell.x * 16 + 8 - w / 2, 0, maxi(0, tex.get_width() - w))
	var y := clampi(cell.y * 16 - h + 40, 0, maxi(0, tex.get_height() - h))
	var a := AtlasTexture.new()
	a.atlas = tex
	a.region = Rect2(x, y, mini(w, tex.get_width()), mini(h, tex.get_height()))
	_crop_cache[key] = a
	return a

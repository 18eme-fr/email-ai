class_name CityPlan
extends RefCounted
## Plan de Bréval-sur-Ondine (touche M) : quartiers, lieux culturels, arrêts de
## bus, position du joueur et de l'objectif. Fenêtre d'information seulement.

const MINIMAP := "res://assets/world/maps/city_minimap.png"
const SCALE := 3.0          ## la mini-carte compte 2 px par case
const PX := 2.0 * SCALE     ## pixels du plan par case


## `player_cell` : position du joueur sur la carte de la ville, ou (-1, -1)
## s'il est à l'intérieur du théâtre. `target_cell` : objectif à montrer, ou (-1, -1).
static func open(parent: Node, city: WorldMap, player_cell: Vector2i, target_cell: Vector2i = Vector2i(-1, -1)) -> Modal:
	var m := Modal.open(parent, "Plan de %s" % city.name, 1000, 660)
	var row := UiKit.hbox([], 16)
	m.content.add_child(row)
	var plan := Control.new()
	plan.custom_minimum_size = Vector2(city.size.x, city.size.y) * PX
	plan.clip_contents = true
	row.add_child(plan)
	var tex: Texture2D = load(MINIMAP) if ResourceLoader.exists(MINIMAP) else null
	if tex != null:
		var img := TextureRect.new()
		img.texture = tex
		img.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		img.stretch_mode = TextureRect.STRETCH_SCALE
		img.size = plan.custom_minimum_size
		plan.add_child(img)
	# Noms des quartiers (une seule fois chacun : le parc s'étend sur deux zones)
	var named := {}
	for d: Dictionary in city.districts:
		if named.has(d["name"]):
			continue
		named[d["name"]] = true
		var r: Rect2i = d["rect"]
		var l := UiKit.label(str(d["name"]), "SmallLabel")
		l.add_theme_font_size_override("font_size", 13)
		l.add_theme_color_override("font_color", Color(1, 0.97, 0.88))
		l.add_theme_color_override("font_outline_color", Color(0.09, 0.06, 0.12))
		l.add_theme_constant_override("outline_size", 5)
		l.position = Vector2(r.position.x + 1, r.position.y + 0.4) * PX
		l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		plan.add_child(l)
	# Arrêts de bus
	for sp: Dictionary in city.bus_stops():
		var c: Vector2i = (sp["cells"] as Array)[0]
		_pin(plan, c, "bus", "Arrêt « %s »" % sp.get("stop", ""))
	# Le théâtre et l'objectif
	var facade := city.spot("facade")
	if not facade.is_empty():
		_pin(plan, (facade["cells"] as Array)[0], "lantern", "Théâtre de la Lanterne")
	if target_cell.x >= 0:
		_pin(plan, target_cell, "star", "Objectif")
	if player_cell.x >= 0:
		var dot := ColorRect.new()
		dot.color = Color(0.94, 0.83, 0.54)
		dot.size = Vector2(10, 10)
		dot.position = (Vector2(player_cell) + Vector2(0.5, 0.5)) * PX - Vector2(5, 5)
		dot.tooltip_text = "Vous êtes ici"
		plan.add_child(dot)
		var tw := dot.create_tween().set_loops()
		tw.tween_property(dot, "modulate:a", 0.25, 0.5)
		tw.tween_property(dot, "modulate:a", 1.0, 0.5)
	# Légende
	var side := UiKit.vbox([], 8)
	side.custom_minimum_size = Vector2(260, 0)
	row.add_child(side)
	var here := city.district_at(player_cell) if player_cell.x >= 0 else {}
	side.add_child(UiKit.label("Vous êtes : %s" % (str(here.get("name", city.name)) if player_cell.x >= 0 else "au Théâtre de la Lanterne"), "SubHeaderLabel", true))
	for spec: Array in [["lantern", "Le théâtre"], ["star", "Votre objectif"], ["bus", "Arrêt de bus : voyagez d'un quartier à l'autre"]]:
		var line := UiKit.hbox([UiKit.icon_rect(spec[0], 24)], 6)
		line.add_child(UiKit.label(spec[1], "", true))
		(line.get_child(1) as Control).size_flags_horizontal = Control.SIZE_EXPAND_FILL
		side.add_child(line)
	side.add_child(HSeparator.new())
	side.add_child(UiKit.label("Lieux à découvrir : gare, friche de la Fabrique, cinéma Le Rex, conservatoire, médiathèque, librairie, collège et maison de quartier des Coteaux, siège d'Ondine Énergie… Parlez aux habitants : chacun a son regard sur la vie culturelle de la ville.", "SmallLabel", true))
	return m


static func _pin(plan: Control, cell: Vector2i, icon_name: String, tip: String) -> void:
	var r := UiKit.icon_rect(icon_name, 20)
	r.position = (Vector2(cell) + Vector2(0.5, 0.5)) * PX - Vector2(10, 10)
	r.tooltip_text = tip
	r.mouse_filter = Control.MOUSE_FILTER_STOP
	plan.add_child(r)

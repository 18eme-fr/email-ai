class_name WorldScreen
extends Node2D
## Écran de jeu principal : le Théâtre de la Lanterne et sa place, à explorer
## à pied. Toutes les décisions passent par GameSession ; cet écran offre le
## même contrat que l'écran de gestion aux panneaux d'étape (session, advance,
## refresh_all, toast, theatre), qu'il affiche dans une fenêtre.

signal performance_finished

const T := 16
const ZOOM := 3.0
const VIEW := Vector2(1280.0 / ZOOM, 720.0 / ZOOM)
const MAPS_DIR := "res://assets/world/maps/"
const META_PATH := "res://assets/world/meta.json"
const WITH_PORTRAIT := ["helene", "bastien", "ines", "pommier", "louison"]
const PHASE_TITLES := {
	"situation": "Cahier de la période", "programmation": "Cahier de la période — programmation",
	"gestion": "Feuille de route — actions", "evenement": "Imprévu", "bilan": "Bilan", "fin": "Bilan",
}
const DIRS := {"up": Vector2i(0, -1), "down": Vector2i(0, 1), "left": Vector2i(-1, 0), "right": Vector2i(1, 0)}

var session: GameSession
var world: WorldData
## Les panneaux appellent screen.theatre.play_performance() : c'est cet écran.
var theatre: Node = self
var map: WorldMap
var player: WorldActor
var npcs: Dictionary = {}           ## id -> WorldActor (personnages de la carte)
var overlay: Control                ## fenêtres modales (carnet, budget, menu…)
var window: WorldWindow
var speech: SpeechBox
var hud: WorldHud

var _map_root: Node2D
var _actors: Node2D
var _top: Sprite2D
var _lights: Sprite2D
var _fx: Node2D
var _camera: Camera2D
var _modulate: CanvasModulate
var _fade: ColorRect
var _banner: Label
var _meta: Dictionary = {}
var _busy := false
var _path: Array[Vector2i] = []
var _on_arrival: Callable = Callable()
var _prev_phase := ""
var _rng := RandomNumberGenerator.new()
var _performing := false
var _spot_markers: Array[Sprite2D] = []
var _debrief: Array = []          ## missions terminées à commenter en début de période
var _water: Sprite2D               ## reflets animés de la rivière (deux images alternées)
var _water_frames: Array[Texture2D] = []
var _water_time := 0.0
var _weather: CPUParticles2D
var _water_cells: Array = []       ## cases d'eau de la carte (volume du bruit de la rivière)
var _sky: String = "clair"         ## météo de la période : clair, pluie, neige
var sky_override := ""             ## force une météo (captures d'écran, essais)
var _sky_timer := 0.0              ## prochain passage d'oiseaux
var _train: Sprite2D
var _train_timer := 0.0
var _life_timer := 0.0             ## petits sons de vie (canards, pigeons)
var _surface := ""
var _district := ""                ## quartier de la ville où se trouve le joueur
var _pickups: Dictionary = {}      ## case -> {id, nodes} : objets de collection posés sur cette carte
var _collection_queue: Array = []  ## résultats de collection en attente d'affichage
var _showing_collection := false


func _ready() -> void:
	if not Game.has_game():
		# Lancement direct de la scène (éditeur) : partie de démonstration.
		Game.session = GameSession.new()
		Game.session.new_game(1234, "standard")
	session = Game.session
	world = WorldData.get_default()
	_rng.seed = hash([session.state.game_seed, "monde"])
	var meta: Variant = GameData.read_json(META_PATH)
	_meta = meta if meta is Dictionary else {}
	_build()
	_prev_phase = session.state.phase
	var start := world.start
	load_map(str(start["map"]), WorldMap.to_cell(start["cell"]), str(start["facing"]))
	Game.notice.connect(toast)
	Game.collection_results.connect(_on_collection_results)
	AudioDirector.play_music("foyer")  # remplacée par la musique du lieu au chargement de la carte
	refresh_all()
	var pending := Game.take_pending_notice()
	if pending != "":
		toast(pending, "warning")
	_resume.call_deferred()


func _build() -> void:
	_modulate = CanvasModulate.new()
	add_child(_modulate)
	_map_root = Node2D.new()
	add_child(_map_root)
	_camera = Camera2D.new()
	_camera.zoom = Vector2(ZOOM, ZOOM)
	_camera.position_smoothing_enabled = true
	_camera.position_smoothing_speed = 9.0
	add_child(_camera)
	var ui := CanvasLayer.new()
	ui.layer = 5
	add_child(ui)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	hud = WorldHud.new()
	hud.menu_pressed.connect(open_menu)
	hud.glossary_pressed.connect(func() -> void: GlossaryPanel.open(overlay))
	hud.budget_pressed.connect(func() -> void: BudgetPanel.open(overlay, session))
	hud.reports_pressed.connect(func() -> void: ReportsHistory.open(overlay, session))
	hud.journal_pressed.connect(open_journal)
	hud.plan_pressed.connect(open_city_plan)
	hud.album_pressed.connect(open_collection)
	root.add_child(hud)
	speech = SpeechBox.new()
	speech.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	speech.offset_left = 120
	speech.offset_right = -120
	speech.offset_top = -190
	speech.offset_bottom = -16
	speech.grow_vertical = Control.GROW_DIRECTION_BEGIN
	root.add_child(speech)
	window = WorldWindow.new()
	window.closed.connect(_on_window_closed)
	root.add_child(window)
	_banner = UiKit.label("", "TitleLabel")
	_banner.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner.grow_horizontal = Control.GROW_DIRECTION_BOTH
	_banner.grow_vertical = Control.GROW_DIRECTION_BOTH
	_banner.visible = false
	_fade = ColorRect.new()
	_fade.color = Color(0.05, 0.03, 0.08, 0.0)
	_fade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_fade)
	root.add_child(_banner)
	overlay = Control.new()
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(overlay)


# --- Cartes --------------------------------------------------------------------

func _season() -> String:
	return WorldRules.season(world, session.state.turn)


func _texture(path: String) -> Texture2D:
	return load(path) if ResourceLoader.exists(path) else null


func _sprite(tex: Texture2D, z: int = 0) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = tex
	s.centered = false
	s.z_index = z
	return s


## Charge une carte et y place le joueur.
func load_map(map_id: String, cell: Vector2i, facing: String) -> void:
	map = world.map(map_id)
	for child in _map_root.get_children():
		child.queue_free()
	npcs.clear()
	_spot_markers.clear()
	var season := _season()
	var festive := WorldRules.is_festive(world, session.state.turn)
	var variants: Array = _meta.get("variants", {}).get(map_id, [])
	var base_path := MAPS_DIR + ("%s_%s_base.png" % [map_id, season] if season in variants else "%s_base.png" % map_id)
	_map_root.add_child(_sprite(_texture(base_path), -10))
	_add_water(map_id, season)
	for u: String in session.state.upgrades:
		var tex := _texture(MAPS_DIR + "%s_upgrade_%s.png" % [map_id, u])
		if tex:
			_map_root.add_child(_sprite(tex, -9))
	if festive:
		var fest := _texture(MAPS_DIR + "%s_festive.png" % map_id)
		if fest:
			_map_root.add_child(_sprite(fest, -8))
	_add_posters(map_id)
	_actors = Node2D.new()
	_actors.y_sort_enabled = true
	_map_root.add_child(_actors)
	player = WorldActor.new().setup("joueur", Game.collection.outfit_sprite(), cell, facing)
	player.step_time = 0.16
	_actors.add_child(player)
	_spawn_people()
	_add_fauna(season)
	_add_collection_items()
	var top_path := MAPS_DIR + ("%s_%s_top.png" % [map_id, "hiver_fetes" if festive and season == "hiver" else season] if season in variants and map_id == "rue" else "%s_top.png" % map_id)
	_top = _sprite(_texture(top_path), 20)
	_map_root.add_child(_top)
	_lights = _sprite(_texture(MAPS_DIR + "%s_lights.png" % map_id), 21)
	var add := CanvasItemMaterial.new()
	add.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	_lights.material = add
	_map_root.add_child(_lights)
	_fx = Node2D.new()
	_fx.z_index = 22
	_map_root.add_child(_fx)
	_sky = sky_override if sky_override != "" else WorldRules.weather(world, session.state)
	_water_cells = map.water_cells()
	_apply_light()
	_add_weather(season)
	_add_sky_life(season)
	_add_sound_sources()
	_setup_camera()
	_path.clear()
	_district = ""
	_update_district(false)
	refresh_all()
	_update_pickup_prompts()
	_refresh_soundscape()
	Game.collection_event(Game.collection.on_enter_map(session, map_id))


func _add_water(map_id: String, season: String) -> void:
	_water = null
	_water_frames.clear()
	var stem := MAPS_DIR + "%s_water%s_" % [map_id, "_hiver" if season == "hiver" else ""]
	for f: String in ["a", "b"]:
		var tex := _texture(stem + f + ".png")
		if tex != null:
			_water_frames.append(tex)
	if _water_frames.size() == 2:
		_water = _sprite(_water_frames[0], -10)
		_map_root.add_child(_water)


## Canards sur l'étang (sauf quand il gèle) et pigeons sur la place.
func _add_fauna(season: String) -> void:
	if not map.outdoor:
		return
	var duck: Array[Texture2D] = [_texture("res://assets/world/fx/duck_0.png"), _texture("res://assets/world/fx/duck_1.png")]
	var pigeon: Array[Texture2D] = [_texture("res://assets/world/fx/pigeon_0.png"), _texture("res://assets/world/fx/pigeon_1.png")]
	for d: Dictionary in map.decor:
		if str(d.get("kind", "")) != "ducks" or season == "hiver" or duck[0] == null:
			continue
		var r: Array = d["rect"]
		var area := Rect2(float(r[0]) * T + 6, float(r[1]) * T + 6, float(r[2]) * T - 22, float(r[3]) * T - 20)
		for i in 3:
			_critter(duck, area, 7.0, -6)
	var place := Rect2i()
	for dist: Dictionary in map.districts:
		if dist["id"] == "centre":
			place = dist["rect"]
	if pigeon[0] == null or place.size == Vector2i.ZERO:
		return
	var cells: Array = []
	for y in range(place.position.y, place.end.y):
		for x in range(place.position.x, place.end.x):
			if map.char_at(Vector2i(x, y)) == "+":
				cells.append(Vector2i(x, y))
	for i in mini(6, cells.size()):
		var c: Vector2i = cells[_rng.randi_range(0, cells.size() - 1)]
		var area := Rect2(Vector2(c * T) - Vector2(10, 10), Vector2(36, 30))
		_critter(pigeon, area, 2.5, -6)


## Objets de la collection visibles sur cette carte (posés au sol) et vitrines du hall.
func _add_collection_items() -> void:
	_pickups.clear()
	var col := Game.collection
	var spark: Array[Texture2D] = [_texture("res://assets/world/fx/sparkle_0.png"), _texture("res://assets/world/fx/sparkle_1.png")]
	for p: Dictionary in col.visible_pickups(session, map.id):
		var c: Vector2i = p["cell"]
		var item := _sprite(CollectionPanel.icon(col.object(p["id"])), -6)
		item.position = Vector2(c.x * T, c.y * T - 1)
		_map_root.add_child(item)
		var s := _sprite(spark[0], -5)
		s.position = Vector2(c.x * T + 8, c.y * T - 6)
		_map_root.add_child(s)
		var prompt := _sprite(_texture("res://assets/world/fx/bubble_alert.png"), 23)
		prompt.position = Vector2(c.x * T + 2, c.y * T - 20)
		prompt.visible = false
		_map_root.add_child(prompt)
		_pickups[c] = {"id": p["id"], "nodes": [item, s, prompt]}
		if not Settings.reduce_motion() and spark[0] != null:
			var tw := s.create_tween().set_loops()
			tw.tween_interval(_rng.randf_range(0.2, 0.9))
			tw.tween_callback(func() -> void: s.texture = spark[1])
			tw.tween_interval(0.35)
			tw.tween_callback(func() -> void: s.texture = spark[0])
			var bob := item.create_tween().set_loops()
			bob.tween_property(item, "position:y", item.position.y - 2, 0.6).set_trans(Tween.TRANS_SINE)
			bob.tween_property(item, "position:y", item.position.y, 0.6).set_trans(Tween.TRANS_SINE)
	if map.id == "hall":
		if col.has_reward("guirlande"):
			var g := _texture(MAPS_DIR + "hall_upgrade_reward_guirlande.png")
			if g:
				_map_root.add_child(_sprite(g, -8))
		var cases := map.spot("vitrines")
		var cells: Array = cases.get("cells", [])
		for i in mini(col.exhibit.size(), cells.size()):
			var c: Vector2i = cells[i]
			var shown := _sprite(CollectionPanel.icon(col.object(str(col.exhibit[i]))), -6)
			shown.position = Vector2(c.x * T, c.y * T - 6)
			_map_root.add_child(shown)


## Bulle « ! » au-dessus d'un objet quand le joueur est tout près (Entrée / E pour le prendre).
func _update_pickup_prompts() -> void:
	for c: Vector2i in _pickups:
		var near: bool = player != null and absi(player.cell.x - c.x) + absi(player.cell.y - c.y) <= 1
		(_pickups[c]["nodes"][2] as Sprite2D).visible = near


## Ramasse l'objet posé devant le joueur ou sous ses pieds. Retourne vrai si un objet a été pris.
func _try_pickup() -> bool:
	for c: Vector2i in [player.cell + DIRS[player.facing], player.cell]:
		if not _pickups.has(c):
			continue
		var p: Dictionary = _pickups[c]
		var results := Game.collection.on_pickup(session, map.id, c)
		if results.is_empty():
			return false
		AudioDirector.play_sfx("ramasser")
		_pickups.erase(c)
		for n: Node in p["nodes"]:
			n.queue_free()
		Game.collection_event(results)
		return true
	return false


## Fouille ce qui se trouve devant le joueur (ou sous ses pieds : une trappe…).
func _try_search() -> void:
	for c: Vector2i in [player.cell + DIRS[player.facing], player.cell]:
		var results := Game.collection.on_search(session, map.id, c)
		if not results.is_empty():
			_busy = true
			await _say_collection("", null, results)
			speech.close()
			_busy = false
			refresh_all()
			return


## Dit les répliques produites par la collection, puis montre les trouvailles.
func _say_collection(speaker: String, portrait: Texture2D, results: Array) -> void:
	for r: Dictionary in results:
		var line := str(r.get("text", ""))
		if line != "":
			await speech.say(speaker, portrait, line)
	speech.close()
	Game.collection_event(results)
	while _showing_collection:
		await get_tree().process_frame


func _on_collection_results(results: Array) -> void:
	_collection_queue.append_array(results)
	if _showing_collection:
		return
	_showing_collection = true
	while not _collection_queue.is_empty():
		var r: Dictionary = _collection_queue.pop_front()
		match str(r["kind"]):
			"object":
				var o: Dictionary = r["object"]
				var big: bool = o["rarity"] in ["rare", "legendaire", "mythique"]
				AudioDirector.play_sfx("decouverte_legendaire" if o["rarity"] in ["legendaire", "mythique"] else ("decouverte_rare" if big else "decouverte"))
				await hud.show_discovery(o, CollectionPanel.icon(o), Game.collection.rarity_info(o["rarity"]), Game.collection.count(), Game.collection.total())
				if o.get("trigger", {}).get("type", "") == "state" and str(r.get("text", "")) != "":
					toast(str(r["text"]))
			"clue":
				AudioDirector.play_sfx("indice")
				toast("Nouvel indice noté : %s (Collection > Enquêtes)." % r["clue"]["title"])
			"quest_step":
				AudioDirector.play_sfx("quete")
				var q := Game.collection.quest(str(r["quest"]))
				if r.get("done", false):
					toast("Enquête « %s » terminée !" % q["title"])
				else:
					toast("Enquête « %s » : %s" % [q["title"], Game.collection.quest_current_step(q["id"])])
			"reward":
				var rw: Dictionary = r["reward"]
				AudioDirector.play_sfx("coins")
				var what: String = {"outfit": "Nouvelle tenue", "decor": "Nouveau décor", "title": "Distinction"}.get(str(rw["kind"]), "Récompense")
				toast("%s : %s ! (Collection > Récompenses)" % [what, rw["label"]])
				if rw["kind"] == "decor" and map.id == "hall":
					_reload_here.call_deferred()
	_showing_collection = false
	hud.set_album_badge(Game.collection.unseen.size())
	refresh_all()


func open_collection(tab: String = "") -> void:
	CollectionPanel.open(overlay, Game.collection, session, tab, func() -> void: _reload_here())
	hud.set_album_badge(0)


## Fernand, l'ancien régisseur, donne un indice précis par période.
func _fernand_advice(name: String) -> void:
	var col := Game.collection
	if not col.can_advise(session):
		await speech.say(name, null, "Revenez à la prochaine période : un vieux régisseur a besoin de temps pour se souvenir.")
		return
	var labels: Array = []
	for f: Dictionary in col.families:
		labels.append("%s (%d/%d)" % [f["label"], col.count(f["id"]), col.total(f["id"])])
	labels.append("Non merci")
	var pick := await speech.ask(name, null, "Je connais ce théâtre par cœur. Un conseil pour votre collection ? Dites-moi laquelle vous intéresse.", labels)
	if pick >= col.families.size():
		return
	var o := col.advise(session, str(col.families[pick]["id"]))
	if o.is_empty():
		await speech.say(name, null, "Cette collection, je n'ai plus rien à vous apprendre dessus. Bravo !")
		return
	await speech.say(name, null, "Un objet %s… %s" % [str(col.rarity_info(o["rarity"])["label"]).to_lower(), o["hint3"]])


func _critter(frames: Array[Texture2D], area: Rect2, speed: float, z: int) -> void:
	var s := _sprite(frames[0], z)
	s.position = area.position + Vector2(_rng.randf() * area.size.x, _rng.randf() * area.size.y)
	_map_root.add_child(s)
	if Settings.reduce_motion():
		return
	var tw := s.create_tween().set_loops()
	for i in 4:
		var to := area.position + Vector2(_rng.randf() * area.size.x, _rng.randf() * area.size.y)
		var flip := to.x < s.position.x
		tw.tween_callback(func() -> void:
			s.flip_h = flip
			s.texture = frames[1])
		tw.tween_property(s, "position", to, maxf(0.6, s.position.distance_to(to) / speed))
		tw.tween_callback(func() -> void: s.texture = frames[0])
		tw.tween_interval(_rng.randf_range(0.8, 3.0))


func _add_posters(map_id: String) -> void:
	var slots: Array = _meta.get("poster_slots", {}).get(map_id, [])
	var shows: Array = []
	for entry: Dictionary in session.state.programmed:
		shows.append(str(entry["show_id"]))
	if shows.is_empty():
		return
	for i in slots.size():
		var slot: Array = slots[i]
		var tex := UiKit.poster(shows[i % shows.size()])
		if tex == null:
			continue
		var s := _sprite(tex, -7)
		s.position = Vector2(float(slot[0]), float(slot[1]))
		s.scale = Vector2(float(slot[2]) / tex.get_width(), float(slot[3]) / tex.get_height())
		_map_root.add_child(s)


func _spawn_people() -> void:
	for n: Dictionary in map.npcs:
		var pid := str(n["id"])
		var person: Dictionary = world.people.get(pid, {})
		if not Rules.check(person.get("requires", {}), session.data, session.state):
			continue  # cette personne n'arrive en ville que plus tard dans la saison
		var a := WorldActor.new().setup(pid, str(person.get("sprite", pid)), n["cell"], "down")
		a.radius = int(n["radius"])
		a.step_time = 0.28
		a.wander_wait = _rng.randf_range(0.5, 3.0)
		_actors.add_child(a)
		npcs[pid] = a
	if map.id == "hall":
		var free := _free_cells(Rect2i(1, 4, 20, 8))
		for i in mini(WorldRules.hall_crowd(session.state), free.size()):
			var c: Vector2i = free[_rng.randi_range(0, free.size() - 1)]
			free.erase(c)
			var sid: String = ["spectateur_a", "spectateur_b", "spectateur_c", "passant_a", "passant_c"][i % 5]
			var a := WorldActor.new().setup("spectateur_%d" % i, sid, c, ["down", "left", "right", "up"][i % 4])
			a.radius = 2
			a.step_time = 0.3
			a.wander_wait = _rng.randf_range(1.0, 4.0)
			_actors.add_child(a)
			npcs[a.person_id] = a


func _free_cells(rect: Rect2i) -> Array:
	var out: Array = []
	for y in range(rect.position.y, rect.end.y):
		for x in range(rect.position.x, rect.end.x):
			var c := Vector2i(x, y)
			if map.is_walkable(c) and map.door_at(c).is_empty() and not _occupied(c):
				out.append(c)
	return out


## Teinte selon le moment de la journée et la météo ; lampadaires allumés dès la fin de journée.
func _apply_light() -> void:
	var tod := "nuit" if _performing else WorldRules.time_of_day(session.state)
	var outdoor := map.outdoor
	var c: Color = {
		"matin": Color(1.0, 0.94, 0.86) if outdoor else Color(1.0, 0.97, 0.92),
		"jour": Color.WHITE,
		"fin_de_journee": Color(1.0, 0.8, 0.66) if outdoor else Color(1.0, 0.92, 0.84),
		"nuit": Color(0.42, 0.42, 0.68) if outdoor else Color(0.62, 0.58, 0.76),
	}[tod]
	if outdoor and _sky == "pluie":
		c *= Color(0.8, 0.82, 0.9)
	_modulate.color = c
	_lights.visible = tod in ["nuit", "fin_de_journee"]
	_lights.modulate.a = 1.0 if tod == "nuit" else 0.45
	if _lights.visible and outdoor and not Settings.reduce_motion():
		var tw := _lights.create_tween().set_loops()  # léger vacillement des lampadaires
		tw.tween_property(_lights, "modulate:a", _lights.modulate.a * 0.88, 0.9).set_trans(Tween.TRANS_SINE)
		tw.tween_property(_lights, "modulate:a", _lights.modulate.a, 1.3).set_trans(Tween.TRANS_SINE)


func _add_weather(season: String) -> void:
	_weather = null
	if not map.outdoor or Settings.reduce_motion():
		return
	if season == "hiver" and _sky != "neige":
		return  # un ciel d'hiver dégagé : pas de flocons
	var tex_name: String = {"automne": "leaf", "hiver": "snow", "printemps": "petal", "ete": "mote"}[season]
	var p := CPUParticles2D.new()
	p.texture = _texture("res://assets/world/fx/%s.png" % tex_name)
	p.amount = 40 if season == "hiver" else 14
	p.lifetime = 9.0
	p.preprocess = 9.0
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	# Les particules suivent la caméra (la ville est bien plus grande que l'écran).
	p.local_coords = false
	p.emission_rect_extents = Vector2(VIEW.x * 0.75, 4)
	p.position = Vector2(map.size.x * T / 2.0, -8)
	p.direction = Vector2(0.3, 1)
	p.spread = 15.0
	p.gravity = Vector2(6, 14 if season == "hiver" else 9)
	p.initial_velocity_min = 4.0
	p.initial_velocity_max = 12.0
	p.angular_velocity_min = -90.0
	p.angular_velocity_max = 90.0
	if season == "ete":
		p.gravity = Vector2(2, -2)
		p.emission_rect_extents.y = VIEW.y * 0.5
		p.color = Color(1, 1, 1, 0.6)
	if _sky == "pluie":
		p.texture = _texture("res://assets/world/fx/rain.png")
		p.amount = 160
		p.lifetime = 1.6
		p.preprocess = 2.0
		p.direction = Vector2(0.12, 1)
		p.spread = 3.0
		p.gravity = Vector2(0, 0)
		p.initial_velocity_min = 260.0
		p.initial_velocity_max = 320.0
		p.angular_velocity_min = 0.0
		p.angular_velocity_max = 0.0
		p.color = Color(1, 1, 1, 0.75)
	_fx.add_child(p)
	_weather = p
	_follow_weather()


## Nuages qui passent, lucioles les nuits d'été au parc, poussière dans la réserve, train en gare.
func _add_sky_life(season: String) -> void:
	_train = null
	_sky_timer = _rng.randf_range(4.0, 10.0)
	var tod := WorldRules.time_of_day(session.state)
	var calm := Settings.reduce_motion()
	if map.outdoor and tod != "nuit" and not calm:
		var cloud_tex := _texture("res://assets/world/fx/cloud.png")
		for i in (6 if _sky == "pluie" else 4):
			var cl := _sprite(cloud_tex, 19)
			cl.scale = Vector2(3, 3)
			cl.modulate.a = 0.22 if _sky == "pluie" else 0.12
			var y := _rng.randf_range(0, map.size.y * T)
			var x0 := _rng.randf_range(-400, map.size.x * T)
			cl.position = Vector2(x0, y)
			_map_root.add_child(cl)
			var tw := cl.create_tween().set_loops()
			var speed := _rng.randf_range(6.0, 11.0)
			tw.tween_property(cl, "position:x", map.size.x * T + 50.0, (map.size.x * T + 50.0 - x0) / speed)
			tw.tween_callback(func() -> void: cl.position.x = -420.0)
	if map.outdoor and tod == "nuit" and season in ["ete", "printemps"] and _sky != "pluie" and not calm:
		for dist: Dictionary in map.districts:
			if dist["id"] == "parc":
				var r: Rect2i = dist["rect"]
				var f := CPUParticles2D.new()
				f.texture = _texture("res://assets/world/fx/firefly.png")
				f.amount = 26
				f.lifetime = 5.0
				f.preprocess = 5.0
				f.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
				f.position = Vector2(r.get_center() * T)
				f.emission_rect_extents = Vector2(r.size * T) / 2.0
				f.gravity = Vector2.ZERO
				f.initial_velocity_min = 2.0
				f.initial_velocity_max = 8.0
				f.spread = 180.0
				f.color_ramp = Gradient.new()
				f.color_ramp.set_color(0, Color(1, 1, 1, 0))
				f.color_ramp.add_point(0.5, Color(1, 1, 1, 1))
				f.color_ramp.set_color(f.color_ramp.get_point_count() - 1, Color(1, 1, 1, 0))
				_fx.add_child(f)
	if map.id in ["reserve", "salle", "coulisses"] and not calm:
		var d := CPUParticles2D.new()
		d.texture = _texture("res://assets/world/fx/dust.png")
		d.amount = 30 if map.id == "reserve" else 14
		d.lifetime = 8.0
		d.preprocess = 8.0
		d.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
		d.position = Vector2(map.size * T) / 2.0
		d.emission_rect_extents = Vector2(map.size * T) / 2.0
		d.gravity = Vector2(0, 1.5)
		d.initial_velocity_min = 1.0
		d.initial_velocity_max = 4.0
		d.spread = 180.0
		d.color = Color(1, 1, 1, 0.35)
		_fx.add_child(d)
	for dec: Dictionary in map.decor:
		if dec.get("kind", "") == "train":
			var r: Array = dec["rect"]
			_train = _sprite(_texture(MAPS_DIR + "rue_train.png"), -6)
			_train.set_meta("station", Vector2(float(r[0]) * T, float(r[1]) * T))
			# Au chargement, le train est à quai une fois sur deux.
			_train.visible = _rng.randf() < 0.5
			_train.position = _train.get_meta("station")
			_map_root.add_child(_train)
			_train_timer = _rng.randf_range(6.0, 14.0) if _train.visible else _rng.randf_range(15.0, 35.0)


## Sources sonores localisées : fontaine, café, marché, fanfare du kiosque.
func _add_sound_sources() -> void:
	if not map.outdoor:
		return
	var tod := WorldRules.time_of_day(session.state)
	var season := _season()
	var sources: Array = [["fontaine", "fontaine", -2.0], ["cafe", "cafe", 0.0]]
	if tod != "nuit":
		sources.append(["marche", "marche", 0.0])
		if season != "hiver" and _sky != "pluie":
			sources.append(["kiosque", "fanfare", -6.0])
	for spec: Array in sources:
		var sp := map.spot(str(spec[0]))
		if sp.is_empty():
			continue
		var cells: Array = sp["cells"]
		var e := AudioDirector.make_emitter(str(spec[1]), float(spec[2]))
		e.position = Vector2((cells[0] as Vector2i) * T) + Vector2(T / 2.0, T / 2.0)
		_map_root.add_child(e)


## Choisit la musique et les ambiances du lieu où se trouve le joueur.
func _refresh_soundscape() -> void:
	if map == null or player == null:
		return
	var dist := 99
	for c: Vector2i in _water_cells:
		dist = mini(dist, absi(c.x - player.cell.x) + absi(c.y - player.cell.y))
	var crowd := WorldRules.hall_crowd(session.state) if map.id == "hall" else 0
	var sc := WorldRules.soundscape(map, player.cell, _season(), WorldRules.time_of_day(session.state), _sky,
		WorldRules.is_festive(world, session.state.turn), dist, crowd)
	if _performing:
		return
	AudioDirector.play_music(str(sc["music"]))
	AudioDirector.set_ambience(sc["layers"])
	_surface = WorldRules.footstep_surface(map, player.cell, _season(), _sky)


## Passages d'oiseaux, train qui entre en gare puis repart, canards et pigeons.
func _tick_life(delta: float) -> void:
	if not map.outdoor:
		return
	var tod := WorldRules.time_of_day(session.state)
	_sky_timer -= delta
	if _sky_timer <= 0.0:
		_sky_timer = _rng.randf_range(12.0, 25.0)
		if tod != "nuit" and _sky != "pluie" and not Settings.reduce_motion():
			_spawn_birds()
	_life_timer -= delta
	if _life_timer <= 0.0:
		_life_timer = _rng.randf_range(5.0, 11.0)
		for d: Dictionary in map.decor:
			if d.get("kind", "") == "ducks" and _season() != "hiver" and tod != "nuit":
				var r: Array = d["rect"]
				AudioDirector.play_at("canard", _map_root, Vector2(float(r[0]) + float(r[2]) / 2.0, float(r[1]) + float(r[3]) / 2.0) * T, -4.0, 260.0)
		var place := map.spot("fontaine")
		if not place.is_empty() and tod != "nuit" and _rng.randf() < 0.5:
			AudioDirector.play_at("pigeon", _map_root, Vector2((place["cells"][0] as Vector2i) * T) + Vector2(_rng.randf_range(-60, 60), 30), -6.0, 200.0)
	if _train == null:
		return
	_train_timer -= delta
	if _train_timer > 0.0 or _train.has_meta("moving"):
		return
	var station: Vector2 = _train.get_meta("station")
	_train.set_meta("moving", true)
	var tw := _train.create_tween()
	var quick := Settings.reduce_motion()
	if _train.visible:
		# Départ : coup de sifflet, puis le train file vers l'est.
		AudioDirector.play_at("sifflet", _map_root, station + Vector2(200, 16), 0.0, 420.0)
		AudioDirector.play_at("train", _map_root, station + Vector2(200, 16), 0.0, 520.0)
		tw.tween_interval(1.2)
		tw.tween_property(_train, "position:x", map.size.x * T + 40.0, 0.1 if quick else 6.0).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
		tw.tween_callback(func() -> void:
			_train.visible = false
			_train_timer = _rng.randf_range(25.0, 50.0))
	else:
		# Arrivée depuis l'ouest, freinage jusqu'au quai.
		_train.position = Vector2(-float(_train.texture.get_width()) - 40.0, station.y)
		_train.visible = true
		AudioDirector.play_at("train", _map_root, station + Vector2(200, 16), 0.0, 520.0)
		tw.tween_property(_train, "position:x", station.x, 0.1 if quick else 6.0).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
		tw.tween_callback(func() -> void: _train_timer = _rng.randf_range(10.0, 18.0))
	tw.tween_callback(func() -> void: _train.remove_meta("moving"))


func _spawn_birds() -> void:
	var frames: Array[Texture2D] = [_texture("res://assets/world/fx/bird_0.png"), _texture("res://assets/world/fx/bird_1.png")]
	if frames[0] == null:
		return
	var from_left := _rng.randf() < 0.5
	var y0 := player.position.y - _rng.randf_range(40, 110)
	var x0 := player.position.x + (-VIEW.x if from_left else VIEW.x)
	var x1 := player.position.x + (VIEW.x if from_left else -VIEW.x)
	for i in _rng.randi_range(3, 5):
		var b := _sprite(frames[0], 25)
		b.position = Vector2(x0 - (i * 10 if from_left else -i * 10), y0 + abs(i - 2) * 6)
		b.flip_h = not from_left
		_map_root.add_child(b)
		var flap := b.create_tween().set_loops(40)
		flap.tween_callback(func() -> void: b.texture = frames[1])
		flap.tween_interval(0.18)
		flap.tween_callback(func() -> void: b.texture = frames[0])
		flap.tween_interval(0.18)
		var tw := b.create_tween()
		tw.tween_property(b, "position", Vector2(x1, y0 - 30), 7.0)
		tw.tween_callback(b.queue_free)


func _follow_weather() -> void:
	if not is_instance_valid(_weather) or player == null:
		return
	var y := player.position.y - VIEW.y * 0.6 if _weather.gravity.y > 0.0 else player.position.y
	_weather.position = Vector2(player.position.x, y)


func _setup_camera() -> void:
	var size := Vector2(map.size * T)
	# Bande réservée en haut pour les informations : la carte commence dessous.
	var top_margin := 34.0
	var lim_l := 0.0
	var lim_r := size.x
	var lim_t := -top_margin
	var lim_b := size.y
	if size.x < VIEW.x:
		lim_l = -(VIEW.x - size.x) / 2.0
		lim_r = size.x + (VIEW.x - size.x) / 2.0
	if size.y + top_margin < VIEW.y:
		var extra := (VIEW.y - size.y - top_margin) / 2.0
		lim_t = -top_margin - extra
		lim_b = size.y + extra
	_camera.limit_left = int(lim_l)
	_camera.limit_right = int(lim_r)
	_camera.limit_top = int(lim_t)
	_camera.limit_bottom = int(lim_b)
	_camera.position = player.position
	_camera.reset_smoothing()


# --- Rafraîchissement --------------------------------------------------------------

func refresh_all() -> void:
	if map == null:
		return
	var obj := WorldRules.objective(session)
	var text := str(obj["text"])
	if obj.get("kind", "") == "npc" and npcs.has(str(obj["id"])):
		pass
	elif str(obj["map"]) != map.id:
		text += "\n→ Direction : %s." % world.map(str(obj["map"])).name
	hud.refresh(session, _place_name(), WorldRules.SEASON_LABELS.get(_season(), ""), text)
	hud.set_missions(session)
	_refresh_markers(obj)


func _place_name() -> String:
	var d := map.district_at(player.cell) if player != null else {}
	return map.name if d.is_empty() else "%s · %s" % [map.name, d["name"]]


## Annonce le quartier quand le joueur en change.
func _update_district(announce: bool = true) -> void:
	if player == null or map.districts.is_empty():
		return
	var d := map.district_at(player.cell)
	var id := str(d.get("id", ""))
	if id == _district:
		return
	_district = id
	hud.set_place(_place_name())
	if announce and id != "":
		hud.announce_place(str(d["name"]))


func _refresh_markers(obj: Dictionary) -> void:
	for m in _spot_markers:
		if is_instance_valid(m):
			m.queue_free()
	_spot_markers.clear()
	for a: WorldActor in npcs.values():
		a.set_bubble("")
		a.set_arrow(false)
	var s := session.state
	var event_who := WorldRules.event_character(session)
	# Actions de gestion : « ! » à proposer, coche si déjà prévue.
	if s.phase == GameState.PHASE_MANAGEMENT:
		var room := s.actions.size() < session.action_capacity()
		for src: Dictionary in WorldRules.action_sources(world):
			if src["map"] != map.id:
				continue
			var planned: bool = src["action"] in s.actions
			if not planned and not room:
				continue
			if src["kind"] == "npc" and npcs.has(src["id"]):
				(npcs[src["id"]] as WorldActor).set_bubble("ok" if planned else "alert")
			elif src["kind"] == "spot":
				_spot_marker(str(src["id"]), "ok" if planned else "alert")
	# Rénovations possibles maintenant.
	for sp: Dictionary in map.spots:
		if sp.get("kind", "") == "upgrade" and session.upgrade_block_reason(str(sp["upgrade"])) == "":
			_spot_marker(str(sp["id"]), "build")
	# Missions : « ? » pour une proposition, « … » pour un dossier à rendre.
	for id: String in MissionSystem.with_status(s, "active"):
		var giver := str(session.data.missions[id]["giver"])
		if session.data.missions[id]["goal"]["kind"] == "dossier" and npcs.has(giver):
			(npcs[giver] as WorldActor).set_bubble("dots")
	for id: String in MissionSystem.with_status(s, "offered"):
		var giver := str(session.data.missions[id]["giver"])
		if npcs.has(giver):
			(npcs[giver] as WorldActor).set_bubble("question")
	# Enquêtes de collection : « ? » au-dessus des personnes qui ont du nouveau.
	for who: String in Game.collection.people_with_quest_news(session):
		for a: WorldActor in npcs.values():
			if world.bark_key(a.person_id) == who and a.bubble == "":
				a.set_bubble("question")
	if event_who != "" and npcs.has(event_who):
		(npcs[event_who] as WorldActor).set_bubble("alert")
	# Flèche dorée vers l'objectif (ou vers la porte qui y mène).
	if str(obj["map"]) == map.id or (obj.get("kind", "") == "npc" and npcs.has(str(obj["id"]))):
		if obj["kind"] == "npc" and npcs.has(str(obj["id"])):
			(npcs[str(obj["id"])] as WorldActor).set_arrow(true)
		elif obj["kind"] == "spot":
			_spot_marker(str(obj["id"]), "arrow")
	else:
		var door := _door_towards(str(obj["map"]))
		if not door.is_empty():
			_cell_marker(door["cell"], "arrow")


func _spot_marker(spot_id: String, kind: String) -> void:
	var sp := map.spot(spot_id)
	if sp.is_empty():
		return
	var cells: Array = sp["cells"]
	var c: Vector2i = cells[cells.size() / 2]
	_cell_marker(c, kind)


func _cell_marker(c: Vector2i, kind: String) -> void:
	var tex := _texture("res://assets/world/fx/%s.png" % ("arrow" if kind == "arrow" else "bubble_" + kind))
	if tex == null:
		return
	var s := Sprite2D.new()
	s.texture = tex
	s.z_index = 23
	s.position = Vector2(c.x * T + T / 2.0, c.y * T - (2 if kind == "arrow" else 12))
	_map_root.add_child(s)
	_spot_markers.append(s)
	var tw := s.create_tween().set_loops()
	tw.tween_property(s, "position:y", s.position.y - 3, 0.45).set_trans(Tween.TRANS_SINE)
	tw.tween_property(s, "position:y", s.position.y, 0.45).set_trans(Tween.TRANS_SINE)


## Porte de la carte actuelle qui rapproche de la carte visée (parcours en largeur).
func _door_towards(target: String) -> Dictionary:
	var first: Dictionary = {}
	var seen := {map.id: true}
	var queue: Array = []
	for d: Dictionary in map.doors:
		if not seen.has(d["to"]):
			queue.append([str(d["to"]), d])
			seen[d["to"]] = true
	while not queue.is_empty():
		var item: Array = queue.pop_front()
		if item[0] == target:
			return item[1]
		for d: Dictionary in world.map(item[0]).doors:
			if not seen.has(d["to"]):
				seen[d["to"]] = true
				queue.append([str(d["to"]), item[1]])
	return first


func toast(message: String, kind: String = "info") -> void:
	hud.toast(message, kind)


# --- Contrat des panneaux d'étape ----------------------------------------------------

## Appelé par les panneaux quand le joueur valide une étape.
func advance() -> void:
	Game.autosave()
	var s := session.state
	var phase := s.phase
	var prev := _prev_phase
	_prev_phase = phase
	if phase == GameState.PHASE_FINISHED and s.reports.is_empty():
		Game.go_to_end()
		return
	if phase == GameState.PHASE_MANAGEMENT and prev == GameState.PHASE_PROGRAMMING:
		window.close_window()
		_reload_here()
		_after_programming.call_deferred()
	elif phase == GameState.PHASE_EVENT and prev != GameState.PHASE_EVENT:
		window.close_window()
		_start_event.call_deferred()
	elif phase == GameState.PHASE_SITUATION and prev in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]:
		window.close_window()
		_new_period.call_deferred()
	elif phase in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]:
		open_phase_window()
	elif window.is_open():
		open_phase_window()
	refresh_all()
	_show_notices()


## Messages de la partie : niveaux, trophées, missions proposées (bandeau) ;
## missions terminées en fin de période (commentées au début de la suivante).
func _show_notices() -> void:
	var texts: Array = []
	var offers: Array = []
	for n: Dictionary in session.take_notices():
		match str(n["kind"]):
			"mission_offered":
				offers.append("« %s »" % session.data.missions[n["mission"]]["title"])
			"mission_done", "mission_failed":
				if n.has("outcome") and session.state.phase in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]:
					_debrief.append(n["outcome"])
				else:
					texts.append(str(n["text"]))
			"level_up", "achievement":
				AudioDirector.play_sfx("coins")
				texts.append(str(n["text"]))
			_:
				texts.append(str(n["text"]))
	if not offers.is_empty():
		texts.append(("1 nouvelle mission" if offers.size() == 1 else "%d nouvelles missions" % offers.size()) + " : cherchez les bulles « ? ».")
	if not texts.is_empty():
		toast("\n".join(texts.slice(0, 3)), "warning")
	refresh_all()


func open_journal() -> void:
	JournalPanel.open(overlay, session, func() -> void:
		Game.autosave()
		_show_notices())


## Les personnes qui ont confié une mission terminée la commentent.
func _play_debrief() -> void:
	if _debrief.is_empty():
		return
	_busy = true
	for o: Dictionary in _debrief.slice(0, 4):
		var who := str(o["giver"])
		var head := "Mission réussie : « %s » !" % o["title"] if o["success"] else "Mission échouée : « %s »." % o["title"]
		await speech.say(_speaker_name(who), UiKit.portrait(who, "happy" if o["success"] else "worried"), "%s %s" % [head, o["text"]])
		await speech.say(_speaker_name(who), _portrait(who), "À retenir : %s" % o["takeaway"])
	_debrief.clear()
	speech.close()
	_busy = false


func open_phase_window() -> void:
	var s := session.state
	var panel: Control
	match s.phase:
		GameState.PHASE_SITUATION:
			panel = SituationPanel.new()
		GameState.PHASE_PROGRAMMING:
			panel = ProgrammingPanel.new()
		GameState.PHASE_MANAGEMENT:
			panel = ActionsPanel.new()
		GameState.PHASE_EVENT:
			panel = EventPanel.new()
		_:
			panel = ReportPanel.new()
	panel.set("screen", self)
	window.open_panel(str(PHASE_TITLES.get(s.phase, "")), panel)


func _on_window_closed() -> void:
	refresh_all()


func _reload_here() -> void:
	load_map(map.id, player.cell, player.facing)


## Reprise d'une partie enregistrée au milieu d'une étape.
func _resume() -> void:
	var s := session.state
	if s.phase == GameState.PHASE_EVENT:
		_start_event()
	elif s.phase in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]:
		open_phase_window()
	elif s.turn == 1 and s.phase == GameState.PHASE_SITUATION:
		if not s.tutorial_seen.has("case"):
			s.tutorial_seen["case"] = true
			_busy = true
			var m := CaseStudy.open(overlay, session)
			await m.closed
			_busy = false
		if not s.tutorial_seen.has("world") and bool(Settings.get_value("show_tutorial")):
			await _intro()
	_show_notices()


func _intro() -> void:
	_busy = true
	var who := "helene"
	var lines := [
		"Bienvenue à la direction du Théâtre de la Lanterne ! Je suis Hélène, l'administratrice.",
		"Pour vous déplacer : les flèches ou Z Q S D. Vous pouvez aussi cliquer là où vous voulez aller.",
		"Pour parler à quelqu'un ou utiliser un objet : placez-vous devant et appuyez sur Entrée ou E. Un clic marche aussi.",
		"Tout se décide ici, à votre bureau. La flèche dorée vous indique toujours la prochaine étape.",
		"Les personnes avec une bulle « ? » ont une mission à vous confier : objectifs, échéance, récompense. Le journal de bord (touche J) les rassemble. On verra au bilan !",
	]
	for line: String in lines:
		await speech.say(_speaker_name(who), _portrait(who), line)
	speech.close()
	session.state.tutorial_seen["world"] = true
	_busy = false


func _after_programming() -> void:
	var s := session.state
	toast("Programmation signée ! Les affiches sont posées. Choisissez maintenant jusqu'à %d actions." % session.action_capacity())
	if s.turn == 1 and not s.tutorial_seen.has("world_actions") and bool(Settings.get_value("show_tutorial")):
		_busy = true
		await speech.say(_speaker_name("helene"), _portrait("helene"),
			"C'est signé ! Maintenant, répartissez les forces de l'équipe : Inès dans le hall pour la médiation, Bastien sur le plateau pour l'entretien, l'imprimerie de la place pour la communication…")
		await speech.say(_speaker_name("helene"), _portrait("helene"),
			"Les points « ! » montrent qui attend une décision. Quand c'est bon, revenez signer la feuille de route ici, à votre bureau.")
		speech.close()
		s.tutorial_seen["world_actions"] = true
		_busy = false


# --- Événement et soirée ------------------------------------------------------------

func _start_event() -> void:
	var who := WorldRules.event_character(session)
	if who == "":
		open_phase_window()
		return
	_busy = true
	var actor: WorldActor = npcs.get(who)
	if actor == null:
		actor = _spawn_visitor(who)
	if actor == null:
		_busy = false
		open_phase_window()
		return
	actor.set_bubble("alert")
	AudioDirector.play_sfx("blip")
	await _walk_actor_to_player(actor)
	actor.face_toward(player.cell)
	player.face_toward(actor.cell)
	_busy = false
	open_phase_window()


## Fait venir un personnage d'ailleurs (il arrive près du joueur).
func _spawn_visitor(who: String) -> WorldActor:
	var best := Vector2i(-1, -1)
	for r in [4, 3, 5, 2, 6]:
		for c: Vector2i in _free_cells(Rect2i(player.cell - Vector2i(r, r), Vector2i(r * 2 + 1, r * 2 + 1))):
			if (c - player.cell).length() >= r - 1 and not map.find_path(c, player.cell, _occupied_cells()).is_empty():
				best = c
				break
		if best.x >= 0:
			break
	if best.x < 0:
		return null
	var person: Dictionary = world.people.get(who, {})
	var a := WorldActor.new().setup(who, str(person.get("sprite", who)), best, "down")
	a.step_time = 0.22
	_actors.add_child(a)
	npcs[who] = a
	return a


func _walk_actor_to_player(actor: WorldActor) -> void:
	var guard := 0
	while (actor.cell - player.cell).length() > 1.0 and guard < 40:
		guard += 1
		var blocked := _occupied_cells()
		blocked.erase(actor.cell)
		var path := map.find_path(actor.cell, player.cell, blocked)
		if path.is_empty():
			return
		actor.step_to(path[0])
		await actor.step_finished


## Soirée de représentation (appelée par EventPanel après la résolution).
func play_performance(ratio: float) -> void:
	window.hide_for_now()
	_busy = true
	_performing = true
	hud.visible = false
	await _fade_to(1.0)
	var perf: Dictionary = world.map("salle").performance
	load_map("salle", WorldMap.to_cell(perf["player_cell"]), str(perf["facing"]))
	npcs.erase("bastien")
	for child in _actors.get_children():
		if child is WorldActor and child.person_id == "bastien":
			child.queue_free()
	_seat_audience(perf, ratio)
	AudioDirector.play_music("")
	AudioDirector.set_ambience({"salle": 0.5, "foule": clampf(ratio, 0.1, 1.0) * 0.5})
	var performers: Array[WorldActor] = []
	for i in 3:
		var a := WorldActor.new().setup("artiste_%d" % i, ["louison", "spectateur_c", "passant_b"][i], Vector2i(7 + i * 3, 4), "down")
		_actors.add_child(a)
		performers.append(a)
	await _fade_to(0.0)
	AudioDirector.set_ambience({"salle": 0.4}, 0.8)  # le public se tait au lever de rideau
	AudioDirector.play_sfx("curtain")
	var quick := Settings.reduce_motion()
	await get_tree().create_timer(0.6 if quick else 1.2).timeout
	if not quick:
		for k in 6:
			for a in performers:
				a.step_to(a.cell + (Vector2i(1, 0) if (k + performers.find(a)) % 2 == 0 else Vector2i(-1, 0)))
			await get_tree().create_timer(0.5).timeout
	for a in performers:
		a.face("down")
	AudioDirector.play_sfx("applause")
	await get_tree().create_timer(1.0 if quick else 2.2).timeout
	_performing = false
	_busy = false
	hud.visible = true
	_refresh_soundscape()
	performance_finished.emit()


func _seat_audience(perf: Dictionary, ratio: float) -> void:
	var seats: Array = []
	for y: Variant in perf["seat_rows"]:
		for span: Array in perf["seat_cols"]:
			for x in range(int(span[0]), int(span[1]) + 1):
				seats.append(Vector2i(x, int(y)))
	var tex := _texture("res://assets/world/people/audience.png")
	var n := roundi(clampf(ratio, 0.0, 1.0) * seats.size())
	var rng := RandomNumberGenerator.new()
	rng.seed = hash([session.state.game_seed, session.state.turn, "public"])
	for i in n:
		var c: Vector2i = seats.pop_at(rng.randi_range(0, seats.size() - 1))
		var s := Sprite2D.new()
		s.texture = tex
		s.hframes = 8
		s.frame = rng.randi_range(0, 7)
		s.centered = false
		s.position = Vector2(c.x * T, c.y * T - 6)
		s.z_index = 1
		_map_root.add_child(s)


func _new_period() -> void:
	_busy = true
	await _fade_to(1.0)
	var start := world.start
	load_map(str(start["map"]), WorldMap.to_cell(start["cell"]), str(start["facing"]))
	_banner.text = "%s\n%s" % [session.period_name(), WorldRules.SEASON_LABELS.get(_season(), "")]
	_banner.visible = true
	AudioDirector.play_sfx("cloche", 0.0, -4.0)
	await get_tree().create_timer(0.4 if Settings.reduce_motion() else 1.4).timeout
	_banner.visible = false
	await _fade_to(0.0)
	_busy = false
	await _play_debrief()
	toast("Nouvelle période : %s. Le cahier vous attend sur votre bureau." % session.period_name())
	_show_notices.call_deferred()


func _fade_to(alpha: float) -> void:
	var d := 0.05 if Settings.reduce_motion() else 0.3
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", alpha, d)
	await tw.finished


# --- Déplacements -------------------------------------------------------------------

func _blocked() -> bool:
	return _busy or window.is_open() or speech.visible or overlay.get_child_count() > 0


func _occupied(c: Vector2i) -> bool:
	if player != null and player.cell == c:
		return true
	for a: WorldActor in npcs.values():
		if a.cell == c:
			return true
	return false


func _occupied_cells() -> Array:
	var out: Array = []
	for a: WorldActor in npcs.values():
		out.append(a.cell)
	return out


func _npc_at(c: Vector2i) -> WorldActor:
	for a: WorldActor in npcs.values():
		if a.cell == c:
			return a
	return null


func _held_direction() -> String:
	for dir: String in ["up", "down", "left", "right"]:
		if Input.is_action_pressed("rideau_" + dir):
			return dir
	return ""


func _process(delta: float) -> void:
	if map == null or player == null:
		return
	_camera.position = player.position + Vector2(0, -8)
	_follow_weather()
	if _water != null and not Settings.reduce_motion():
		_water_time += delta
		if _water_time >= 0.7:
			_water_time = 0.0
			_water.texture = _water_frames[1] if _water.texture == _water_frames[0] else _water_frames[0]
	_wander(delta)
	_tick_life(delta)
	if _blocked() or player.moving:
		return
	var dir := _held_direction()
	if dir != "":
		_path.clear()
		_on_arrival = Callable()
		_try_step(dir)
	elif not _path.is_empty():
		var next: Vector2i = _path.pop_front()
		if _occupied(next) or not (map.is_walkable(next)) or _door_locked(next):
			_path.clear()
			return
		_step_player(next)
	elif _on_arrival.is_valid():
		var cb := _on_arrival
		_on_arrival = Callable()
		cb.call()


func _try_step(dir: String) -> void:
	var target: Vector2i = player.cell + DIRS[dir]
	player.face(dir)
	if _door_locked(target):
		return
	if map.is_walkable(target) and not _occupied(target):
		_step_player(target)


## Une porte qui demande une clé (indice de collection) : prévient le joueur.
func _door_locked(c: Vector2i) -> bool:
	var door := map.door_at(c)
	if door.is_empty() or not door.has("requires_clue") or Game.collection.known_clues.has(str(door["requires_clue"])):
		return false
	_path.clear()
	_on_arrival = Callable()
	AudioDirector.play_sfx("verrou")
	toast(str(door.get("locked", "C'est fermé à clé.")))
	return true


func _step_player(target: Vector2i) -> void:
	player.step_to(target)
	await player.step_finished
	_update_district()
	_update_pickup_prompts()
	_refresh_soundscape()
	AudioDirector.footstep(_surface)
	var door := map.door_at(player.cell)
	if not door.is_empty():
		_path.clear()
		_on_arrival = Callable()
		_go_through(door)


func _go_through(door: Dictionary) -> void:
	_busy = true
	AudioDirector.play_sfx("porte", 0.08)
	await _fade_to(1.0)
	load_map(str(door["to"]), door["to_cell"], str(door["facing"]))
	if WorldRules.event_character(session) != "":
		var actor: WorldActor = npcs.get(WorldRules.event_character(session))
		if actor == null:
			_spawn_visitor(WorldRules.event_character(session))
		refresh_all()
	await _fade_to(0.0)
	_busy = false


func _wander(delta: float) -> void:
	if _busy:
		return
	var talking := speech.visible
	for a: WorldActor in npcs.values():
		if a.moving or a.radius <= 0 or talking:
			continue
		a.wander_wait -= delta
		if a.wander_wait > 0.0:
			continue
		a.wander_wait = _rng.randf_range(1.5, 4.5)
		var dir: String = ["up", "down", "left", "right"][_rng.randi_range(0, 3)]
		var target: Vector2i = a.cell + DIRS[dir]
		if (target - a.home).length() > a.radius or not map.is_walkable(target) or not map.door_at(target).is_empty() or _occupied(target):
			a.face(dir)
			continue
		if not _path.is_empty() and target in _path:
			continue
		a.step_to(target)


# --- Commandes ----------------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if map == null or _blocked():
		return
	if event.is_action_pressed("rideau_pause"):
		get_viewport().set_input_as_handled()
		open_menu()
	elif event.is_action_pressed("rideau_glossary"):
		get_viewport().set_input_as_handled()
		GlossaryPanel.open(overlay)
	elif event.is_action_pressed("rideau_journal"):
		get_viewport().set_input_as_handled()
		open_journal()
	elif event.is_action_pressed("rideau_album"):
		get_viewport().set_input_as_handled()
		open_collection()
	elif event.is_action_pressed("rideau_map"):
		get_viewport().set_input_as_handled()
		open_city_plan()
	elif event.is_action_pressed("ui_accept") or event.is_action_pressed("rideau_interact"):
		get_viewport().set_input_as_handled()
		if not player.moving:
			interact()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		get_viewport().set_input_as_handled()
		_click(get_global_mouse_position())


func _click(world_pos: Vector2) -> void:
	var c := Vector2i(floori(world_pos.x / T), floori(world_pos.y / T))
	if not map.in_bounds(c):
		return
	var npc := _npc_at(c)
	var spot := map.spot_at(c)
	# Clic sur la tête d'un personnage (sprite plus haut que sa case).
	if npc == null:
		npc = _npc_at(c + Vector2i(0, 1)) if world_pos.y - c.y * T > 4 else null
	if npc != null:
		_walk_then(_adjacent_cells(npc.cell), func() -> void:
			player.face_toward(npc.cell)
			interact())
	elif not spot.is_empty():
		var cells: Array = []
		for sc: Vector2i in spot["cells"]:
			cells.append_array(_adjacent_cells(sc))
		_walk_then(cells, func() -> void:
			for sc: Vector2i in spot["cells"]:
				if (sc - player.cell).length() == 1.0:
					player.face_toward(sc)
					break
			interact())
	elif _pickups.has(c):
		_walk_then([c] + _adjacent_cells(c), func() -> void:
			if player.cell != c:
				player.face_toward(c)
			_try_pickup())
	elif map.is_walkable(c):
		_walk_then([c], Callable())


func _adjacent_cells(c: Vector2i) -> Array:
	var out: Array = []
	for d: Vector2i in DIRS.values():
		var n: Vector2i = c + d
		if map.is_walkable(n) and map.door_at(n).is_empty():
			out.append(n)
	return out


## Marche vers la plus proche des cases données, puis appelle `then`.
func _walk_then(targets: Array, then: Callable) -> void:
	if player.cell in targets:
		_path.clear()
		_on_arrival = then
		return
	var best: Array[Vector2i] = []
	for t: Vector2i in targets:
		if _occupied(t):
			continue
		var p := map.find_path(player.cell, t, _occupied_cells())
		if not p.is_empty() and (best.is_empty() or p.size() < best.size()):
			best = p
	if best.is_empty():
		return
	_path = best
	_on_arrival = then


func interact() -> void:
	var front: Vector2i = player.cell + DIRS[player.facing]
	var npc := _npc_at(front)
	if npc != null:
		talk_to(npc)
		return
	var spot := map.spot_at(front)
	if not spot.is_empty():
		use_spot(spot)
		return
	if not _try_pickup():
		_try_search()


# --- Personnes et objets ---------------------------------------------------------------

func _speaker_name(who: String) -> String:
	if session.data.characters.has(who):
		return session.data.character_name(who)
	var person: Dictionary = world.people.get(who, {})
	return str(person.get("name", "")) if person.has("name") else ("Spectateur" if who.begins_with("spectateur") else "")


func _portrait(who: String) -> Texture2D:
	return UiKit.portrait(who) if who in WITH_PORTRAIT else null


func talk_to(npc: WorldActor) -> void:
	var who := npc.person_id
	npc.face(WorldActor.opposite(player.facing))
	if who == WorldRules.event_character(session):
		open_phase_window()
		return
	var mission := _mission_of(who)
	if mission != "":
		await _talk_mission(who, mission)
		return
	_busy = true
	var found := Game.collection.on_talk(session, world.bark_key(who))
	if not found.is_empty():
		await _say_collection(_speaker_name(who), _portrait(who), found)
		_busy = false
		refresh_all()
		return
	if who == "fernand":
		await _fernand_advice(_speaker_name(who))
		speech.close()
		_busy = false
		refresh_all()
		return
	var person: Dictionary = world.people.get(who, {})
	var action := str(person.get("action", ""))
	if action != "" and session.state.phase == GameState.PHASE_MANAGEMENT:
		await _offer_action(_speaker_name(who), _portrait(who), action)
	else:
		var line := WorldRules.bark(session.data, session.state, world, world.bark_key(who), _rng.randf())
		await speech.say(_speaker_name(who), _portrait(who), line)
		if action != "" and session.state.phase in [GameState.PHASE_SITUATION, GameState.PHASE_PROGRAMMING]:
			await speech.say(_speaker_name(who), _portrait(who),
				"Une fois la programmation signée, revenez me voir si vous voulez lancer : « %s »." % session.data.actions[action]["label"])
	speech.close()
	_busy = false
	refresh_all()


## Mission à évoquer avec cette personne : une proposition, ou un dossier à rendre.
func _mission_of(who: String) -> String:
	for id: String in MissionSystem.with_status(session.state, "offered"):
		if session.data.missions[id]["giver"] == who:
			return id
	for id: String in MissionSystem.with_status(session.state, "active"):
		var def: Dictionary = session.data.missions[id]
		if def["giver"] == who and def["goal"]["kind"] == "dossier":
			return id
	return ""


func _talk_mission(who: String, mission_id: String) -> void:
	_busy = true
	var def: Dictionary = session.data.missions[mission_id]
	var name := _speaker_name(who)
	var portrait := _portrait(who)
	var open_dossier := ""
	if MissionSystem.status(session.state, mission_id) == "offered":
		var delay := "jusqu'à la période %d" % int(def["deadline_turn"]) if def.has("deadline_turn") else "%d période(s)" % int(def["duration"])
		await speech.say(name, portrait, str(def["pitch"]))
		var pick := await speech.ask(name, portrait, "Mission « %s »\nObjectif : %s · délai : %s\nRécompense : %s" % [def["title"], def["goal"].get("text", ""), delay, MissionSystem.reward_text(session.data, def.get("reward", {}))],
			["J'accepte", "Plus tard", "Non merci"])
		if pick == 0:
			var err := session.accept_mission(mission_id)
			if err != "":
				await speech.say(name, portrait, err)
			else:
				AudioDirector.play_sfx("confirm")
				Game.autosave()
				if def["goal"]["kind"] == "dossier":
					var now := await speech.ask(name, portrait, "Merci ! Le dossier est prêt, on s'y met tout de suite ?", ["Ouvrir le dossier", "Plus tard"])
					if now == 0:
						open_dossier = str(def["goal"]["dossier"])
				else:
					await speech.say(name, portrait, "Merci ! Je compte sur vous. Vous suivrez l'avancement dans le journal de bord (touche J).")
		elif pick == 2:
			session.decline_mission(mission_id)
			await speech.say(name, portrait, "Tant pis… Une autre fois, peut-être.")
	else:
		var go := await speech.ask(name, portrait, "Le dossier « %s » vous attend. On s'y met ?" % Dossiers.CATALOG[def["goal"]["dossier"]]["title"], ["Ouvrir le dossier", "Plus tard"])
		if go == 0:
			open_dossier = str(def["goal"]["dossier"])
	speech.close()
	_busy = false
	refresh_all()
	if open_dossier != "":
		DossierPanel.open(overlay, session, open_dossier, false, func(_r: Dictionary) -> void:
			Game.autosave()
			_show_notices())


func _offer_action(speaker: String, portrait: Texture2D, action: String) -> void:
	var s := session.state
	var a: Dictionary = session.data.actions[action]
	if action in s.actions:
		var keep := await speech.ask(speaker, portrait, "« %s » est prévu pour cette période. On le garde ?" % a["label"], ["On le garde", "Finalement, non"])
		if keep == 1:
			session.plan_action(action, false)
			AudioDirector.play_sfx("cancel")
			await speech.say(speaker, portrait, "Entendu, j'annule. Il reste %d action(s) possible(s)." % (session.action_capacity() - s.actions.size()))
	else:
		var pick := await speech.ask(speaker, portrait, WorldRules.action_pitch(session, action) + "\nOn le fait ?", ["Oui, c'est parti", "En savoir plus", "Pas maintenant"])
		if pick == 0:
			var err := session.plan_action(action, true)
			if err != "":
				await speech.say(speaker, portrait, err)
			else:
				AudioDirector.play_sfx("confirm")
				await speech.say(speaker, portrait, "Parfait, je m'en occupe ! (%d / %d actions prévues)" % [s.actions.size(), session.action_capacity()])
				Game.autosave()
		elif pick == 1:
			speech.close()
			GlossaryPanel.open(overlay, str(a.get("notion", "")))


func use_spot(spot: Dictionary) -> void:
	var kind := str(spot.get("kind", ""))
	match kind:
		"exhibit":
			open_collection("exposition")
			return
		"desk":
			AudioDirector.play_sfx("page")
			open_phase_window()
			return
		"glossary":
			GlossaryPanel.open(overlay)
			return
		"budget":
			BudgetPanel.open(overlay, session)
			return
		"reports":
			ReportsHistory.open(overlay, session)
			return
	_busy = true
	var found := Game.collection.on_examine(session, WorldData.spot_bark_key(spot))
	if not found.is_empty():
		await _say_collection(str(spot["label"]), null, found)
		if not kind in ["action", "upgrade", "bus"]:
			_busy = false
			refresh_all()
			return
	match kind:
		"posters":
			var titles: Array = []
			for entry: Dictionary in session.state.programmed:
				titles.append("« %s »" % session.data.shows[entry["show_id"]]["title"])
			var text := "À l'affiche cette période : %s." % ", ".join(titles) if not titles.is_empty() else "Les cadres attendent les affiches de la prochaine programmation."
			await speech.say(str(spot["label"]), null, text)
		"action":
			var action := str(spot["action"])
			if session.state.phase == GameState.PHASE_MANAGEMENT:
				await _offer_action(str(spot["label"]), null, action)
			else:
				await speech.say(str(spot["label"]), null, "%s\n(À décider une fois la programmation signée : « %s ».)" % [session.data.actions[action]["summary"], session.data.actions[action]["label"]])
		"upgrade":
			await _offer_upgrade(spot)
		"bus":
			var dest := await _ask_bus(spot)
			if not dest.is_empty():
				speech.close()
				await _ride_bus(dest)
				_busy = false
				return
		_:
			var who := str(spot.get("character", spot["id"]))
			var line := WorldRules.bark(session.data, session.state, world, WorldData.spot_bark_key(spot), _rng.randf())
			if line == "":
				line = WorldRules.bark(session.data, session.state, world, who, _rng.randf())
			await speech.say(str(spot["label"]), null, line)
	speech.close()
	_busy = false
	refresh_all()


## Choix de la destination à un arrêt de bus ({} pour rester).
func _ask_bus(spot: Dictionary) -> Dictionary:
	var others: Array = []
	var names: Array = []
	for stop: Dictionary in map.bus_stops():
		if stop["id"] != spot["id"]:
			others.append(stop)
			names.append(str(stop.get("stop", stop["label"])))
	names.append("Rester ici")
	var pick := await speech.ask(str(spot["label"]), null, "La ligne 1 dessert tous les quartiers de Bréval, et le ticket est gratuit pour les habitants le week-end. Où allez-vous ?", names)
	return others[pick] if pick < others.size() else {}


func _ride_bus(stop: Dictionary) -> void:
	_busy = true
	_path.clear()
	_on_arrival = Callable()
	AudioDirector.play_sfx("bus")
	await _fade_to(1.0)
	var arrive := WorldMap.to_cell(stop.get("arrive", (stop["cells"] as Array)[0]))
	for a: WorldActor in npcs.values():
		if a.cell == arrive:
			a.place(a.home)  # un habitant libère la place
	player.place(arrive)
	player.face("down")
	_camera.position = player.position
	_camera.reset_smoothing()
	_district = ""
	_update_district(false)
	refresh_all()
	await _fade_to(0.0)
	toast("Arrêt « %s »." % stop.get("stop", stop["label"]))
	_busy = false


## Plan de la ville (touche M), aussi accessible depuis l'intérieur du théâtre.
func open_city_plan() -> void:
	var city := world.map("rue")
	if city == null:
		return
	var here := player.cell if map.id == "rue" else Vector2i(-1, -1)
	var target := Vector2i(-1, -1)
	var obj := WorldRules.objective(session)
	if str(obj["map"]) == "rue":
		if obj["kind"] == "npc":
			target = (world.person_start(str(obj["id"])) as Dictionary).get("cell", target)
		elif not city.spot(str(obj["id"])).is_empty():
			target = (city.spot(str(obj["id"]))["cells"] as Array)[0]
	CityPlan.open(overlay, city, here, target)


func _offer_upgrade(spot: Dictionary) -> void:
	var uid := str(spot["upgrade"])
	var u: Dictionary = session.data.upgrades[uid]
	var who := str(u.get("character", ""))
	var speaker := _speaker_name(who) if who != "" else str(spot["label"])
	var portrait := _portrait(who)
	if uid in session.state.upgrades:
		await speech.say(speaker, portrait, "%s : c'est fait ! %s" % [u["label"], u["description"]])
		return
	var pitch := WorldRules.upgrade_pitch(session, uid)
	var reason := session.upgrade_block_reason(uid)
	if reason != "":
		await speech.say(speaker, portrait, pitch + "\n" + reason)
		return
	var pick := await speech.ask(speaker, portrait, pitch, ["Lancer les travaux", "Investir, ça veut dire quoi ?", "Pas maintenant"])
	if pick == 0:
		var err := session.buy_upgrade(uid)
		if err != "":
			await speech.say(speaker, portrait, err)
			return
		AudioDirector.play_sfx("coins")
		await _fade_to(1.0)
		_reload_here()
		await _fade_to(0.0)
		Game.autosave()
		await speech.say(speaker, portrait, "Les travaux sont terminés : %s ! Le prix sort de la trésorerie, et le résultat supportera %s d'amortissement par période." % [str(u["label"]).to_lower(), Format.money(session.amortization_per_turn(uid))])
	elif pick == 1:
		speech.close()
		GlossaryPanel.open(overlay, "investissement")


# --- Menu ------------------------------------------------------------------------------

func open_menu() -> void:
	var m := Modal.open(overlay, "Menu", 460, 700)
	var items: Array = [
		["Reprendre", "GoldButton", "play", m.close_modal],
		["Cahier de la période", "", "book", func() -> void:
			m.close_modal()
			open_phase_window()],
		["Journal de bord", "SecondaryButton", "star", func() -> void: open_journal()],
		["Collection", "SecondaryButton", "album", func() -> void: open_collection()],
		["Carnet du directeur", "SecondaryButton", "question", func() -> void: GlossaryPanel.open(overlay)],
		["Budget et trésorerie", "SecondaryButton", "cash", func() -> void: BudgetPanel.open(overlay, session)],
		["Bilans des périodes", "SecondaryButton", "chart", func() -> void: ReportsHistory.open(overlay, session)],
		["État du théâtre", "SecondaryButton", "building", func() -> void: TheatreStatus.open(overlay, session)],
		["Enregistrer la partie", "SecondaryButton", "save", func() -> void:
			var r := Game.saves.save(session.state)
			toast(str(r["message"]), "info" if r["status"] == SaveSystem.Status.OK else "error")],
		["Paramètres", "SecondaryButton", "gear", func() -> void: SettingsPanel.open(overlay)],
		["Retour au menu principal", "SecondaryButton", "door", func() -> void: Game.go_to_menu()],
	]
	var first: Button = null
	for it: Array in items:
		var b := UiKit.button(it[0], it[1], it[2])
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(it[3])
		m.content.add_child(b)
		if first == null:
			first = b
	m.content.add_child(UiKit.label("La partie est enregistrée automatiquement à chaque étape.", "SmallLabel", true))
	first.grab_focus.call_deferred()

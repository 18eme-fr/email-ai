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
var _district := ""                ## quartier de la ville où se trouve le joueur


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
	AudioDirector.play_music("foyer")
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
	player = WorldActor.new().setup("joueur", "directeur", cell, facing)
	player.step_time = 0.16
	_actors.add_child(player)
	_spawn_people()
	_add_fauna(season)
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
	_apply_light()
	_add_weather(season)
	_setup_camera()
	_path.clear()
	_district = ""
	_update_district(false)
	refresh_all()


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


func _apply_light() -> void:
	var evening := WorldRules.is_evening(session.state) or _performing
	_lights.visible = evening
	if not evening:
		_modulate.color = Color.WHITE
	elif map.outdoor:
		_modulate.color = Color(0.42, 0.42, 0.68)
	else:
		_modulate.color = Color(0.62, 0.58, 0.76)


func _add_weather(season: String) -> void:
	_weather = null
	if not map.outdoor or Settings.reduce_motion():
		return
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
	_fx.add_child(p)
	_weather = p
	_follow_weather()


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
		texts.append("Nouvelles missions : %s. Parlez aux personnes qui ont une bulle « ? »." % ", ".join(offers))
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
	var performers: Array[WorldActor] = []
	for i in 3:
		var a := WorldActor.new().setup("artiste_%d" % i, ["louison", "spectateur_c", "passant_b"][i], Vector2i(7 + i * 3, 4), "down")
		_actors.add_child(a)
		performers.append(a)
	await _fade_to(0.0)
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
	if _blocked() or player.moving:
		return
	var dir := _held_direction()
	if dir != "":
		_path.clear()
		_on_arrival = Callable()
		_try_step(dir)
	elif not _path.is_empty():
		var next: Vector2i = _path.pop_front()
		if _occupied(next) or not (map.is_walkable(next)):
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
	if map.is_walkable(target) and not _occupied(target):
		_step_player(target)


func _step_player(target: Vector2i) -> void:
	player.step_to(target)
	await player.step_finished
	_update_district()
	var door := map.door_at(player.cell)
	if not door.is_empty():
		_path.clear()
		_on_arrival = Callable()
		_go_through(door)


func _go_through(door: Dictionary) -> void:
	_busy = true
	AudioDirector.play_sfx("page", 0.1)
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
	AudioDirector.play_sfx("page", 0.1)
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

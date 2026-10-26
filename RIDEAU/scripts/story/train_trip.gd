extends Control
## Le voyage en train vers Paris, en fin de saison : la campagne défile en parallaxe,
## puis Paris au soleil couchant ; la troupe parle de la première (data/story/creation.json).
## Entrée, espace ou clic : réplique suivante ; Échap : arriver tout de suite.

const DIR := "res://assets/story/train/"
const SCALE := 4.0
const NAMES := {"lazare": "Victor Lazare", "helene": "Hélène", "bastien": "Bastien", "louison": "Louison", "ines": "Inès"}

var lines: Array = []
var index := -1
var speed := 1.0                     ## multiplicateur de vitesse (ralentit à l'arrivée)
var _layers: Array = []              ## [{sprite, speed, offset}]
var _country: Array[Sprite2D] = []   ## couches de campagne (s'effacent)
var _city: Array[Sprite2D] = []      ## couches parisiennes (apparaissent)
var _sky_dusk: Sprite2D
var _train: Sprite2D
var _text: Label
var _name: Label
var _portrait: TextureRect
var _typing: Tween
var _wait := 0.0
var _bob := 0.0
var _done := false
var _arriving := false
var _in_paris := false


func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.03, 0.08)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var stage := Node2D.new()
	stage.scale = Vector2(SCALE, SCALE)
	add_child(stage)
	_add(stage, "ciel_jour", 0, 0.0)
	_sky_dusk = _add(stage, "ciel_soir", 0, 0.0)
	_sky_dusk.modulate.a = 0.0
	_country.append(_add(stage, "loin_campagne", 30, 6.0))
	var far_paris := _add(stage, "loin_paris", 20, 6.0)
	_country.append(_add(stage, "milieu_campagne", 64, 38.0))
	var mid_paris := _add(stage, "milieu_paris", 64, 38.0)
	for s: Sprite2D in [far_paris, mid_paris]:
		s.modulate.a = 0.0
		_city.append(s)
	stage.move_child(far_paris, _country[0].get_index() + 1)
	_add(stage, "voie", 120, 150.0)
	_train = Sprite2D.new()
	_train.texture = load(DIR + "train.png")
	_train.centered = false
	_train.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_train.position = Vector2(10, 82)
	stage.add_child(_train)
	_add(stage, "herbes", 128, 260.0)
	# Bande de dialogue, comme au cinéma
	var band := ColorRect.new()
	band.color = Color(0.03, 0.02, 0.05, 0.9)
	band.position = Vector2(0, 720 - 140)
	band.size = Vector2(1280, 140)
	band.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(band)
	_portrait = TextureRect.new()
	_portrait.position = Vector2(40, 720 - 124)
	_portrait.size = Vector2(108, 108)
	_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_portrait.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	add_child(_portrait)
	_name = UiKit.label("", "SubHeaderLabel")
	_name.position = Vector2(172, 720 - 128)
	_name.add_theme_color_override("font_color", UiKit.GOLD)
	add_child(_name)
	_text = UiKit.label("", "", true)
	_text.position = Vector2(172, 720 - 96)
	_text.size = Vector2(1060, 80)
	_text.add_theme_font_size_override("font_size", 22)
	_text.add_theme_color_override("font_color", UiKit.CREAM)
	add_child(_text)
	var hint := UiKit.label("Entrée : suite   ·   Échap : arriver à Paris", "SmallLabel")
	hint.position = Vector2(0, 14)
	hint.size = Vector2(1250, 24)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(hint)
	var title := "La Lanterne magique"
	if Game.has_game():
		title = CreationSystem.show_title(Game.data, Game.session.state)
	for l: Array in Game.data.creation.get("train", {}).get("lines", []):
		var t := str(l[1])
		lines.append([str(l[0]), t % title if t.contains("%s") else t])
	AudioDirector.clear_ambience()
	AudioDirector.play_music("paris")
	AudioDirector.play_sfx("train", 0.0, -6.0)
	next()


## Une couche de décor qui défile (texture répétée, découpée en fenêtre de 320 px).
func _add(stage: Node2D, name: String, y: int, px_per_s: float) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = load(DIR + name + ".png")
	s.centered = false
	s.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	s.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
	s.region_enabled = true
	s.region_rect = Rect2(0, 0, 320, s.texture.get_height() if s.texture else 1)
	s.position = Vector2(0, y)
	stage.add_child(s)
	if px_per_s > 0.0:
		_layers.append({"sprite": s, "speed": px_per_s, "offset": 0.0})
	return s


func _process(delta: float) -> void:
	for l: Dictionary in _layers:
		l["offset"] = fmod(float(l["offset"]) + float(l["speed"]) * speed * delta, 640.0)
		var s: Sprite2D = l["sprite"]
		s.region_rect.position.x = floorf(float(l["offset"]))
	_bob += delta * speed
	_train.position.y = 82 + (1 if fmod(_bob, 0.5) < 0.12 else 0)
	if _done or _arriving or (_typing and _typing.is_running()):
		return
	_wait -= delta
	if _wait <= 0.0:
		next()


func next() -> void:
	if _done or _arriving:
		return
	index += 1
	if index >= lines.size():
		arrive()
		return
	var who := str(lines[index][0])
	_name.text = str(NAMES.get(who, who))
	_portrait.texture = UiKit.portrait(who, "happy" if index == lines.size() - 1 else "neutral")
	_text.text = str(lines[index][1])
	_text.visible_ratio = 0.0
	if _typing:
		_typing.kill()
	var quick := Settings.reduce_motion()
	_typing = create_tween()
	_typing.tween_property(_text, "visible_ratio", 1.0, 0.05 if quick else clampf(_text.text.length() * 0.03, 0.4, 3.0))
	_wait = 3.5 + _text.text.length() * 0.04
	# À mi-parcours, Paris se lève à l'horizon et le soleil se couche.
	if index >= lines.size() / 2 and not _in_paris:
		_in_paris = true
		var tw := create_tween().set_parallel(true)
		var d := 0.1 if quick else 4.0
		tw.tween_property(_sky_dusk, "modulate:a", 1.0, d)
		for s: Sprite2D in _country:
			tw.tween_property(s, "modulate:a", 0.0, d)
		for s: Sprite2D in _city:
			tw.tween_property(s, "modulate:a", 1.0, d)


## Le train ralentit, siffle, et la troupe descend à Paris.
func arrive() -> void:
	if _done:
		return
	_arriving = true
	AudioDirector.play_sfx("sifflet")
	var quick := Settings.reduce_motion()
	var tw := create_tween()
	tw.tween_property(self, "speed", 0.0, 0.1 if quick else 2.5).set_ease(Tween.EASE_OUT)
	tw.tween_callback(finish)


func finish() -> void:
	if _done:
		return
	_done = true
	var veil := ColorRect.new()
	veil.color = Color(0.05, 0.03, 0.08, 0.0)
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(veil)
	var tw := create_tween()
	tw.tween_property(veil, "color:a", 1.0, 0.05 if Settings.reduce_motion() else 0.7)
	tw.tween_callback(func() -> void:
		if Game.has_game():
			Game.arrive_in_paris()
		else:
			get_tree().change_scene_to_file(Game.MAIN_MENU))


func _unhandled_input(event: InputEvent) -> void:
	if _done:
		return
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("rideau_pause"):
		get_viewport().set_input_as_handled()
		finish()
	elif event.is_action_pressed("ui_accept") or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT):
		get_viewport().set_input_as_handled()
		if _typing and _typing.is_running():
			_typing.kill()
			_text.visible_ratio = 1.0
		elif not _arriving:
			next()

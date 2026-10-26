extends Control
## Prologue : l'histoire de la Lanterne en neuf tableaux (data/story/prologue.json),
## montré au lancement de la toute première partie, puis à revoir depuis le menu.
## Entrée, espace ou clic : suite (ou fin du texte en cours) ; Échap : passer.

const DATA := "res://data/story/prologue.json"
const IMAGES := "res://assets/prologue/"
const SCALE := 4.0

var scenes: Array = []
var index := -1
var _image: TextureRect
var _image_old: TextureRect
var _text: Label
var _title: Label
var _hint: Label
var _typing: Tween
var _pan: Tween
var _wait := 0.0
var _done := false


func _ready() -> void:
	var raw: Variant = GameData.read_json(DATA)
	scenes = (raw as Dictionary).get("scenes", []) if raw is Dictionary else []
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.03, 0.08)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_image_old = _make_image()
	_image = _make_image()
	# Bandes noires de cinéma et texte
	for top: bool in [true, false]:
		var band := ColorRect.new()
		band.color = Color(0.03, 0.02, 0.05, 0.92)
		band.position = Vector2(0, 0 if top else 720 - 150)
		band.size = Vector2(1280, 56 if top else 150)
		band.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(band)
	_text = UiKit.label("", "", true)
	_text.position = Vector2(160, 600)
	_text.size = Vector2(960, 90)
	_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_text.add_theme_font_size_override("font_size", 22)
	_text.add_theme_color_override("font_color", UiKit.CREAM)
	add_child(_text)
	_title = UiKit.label("RIDEAU !", "TitleLabel")
	_title.position = Vector2(0, 470)
	_title.size = Vector2(1280, 80)
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.add_theme_font_size_override("font_size", 64)
	_title.add_theme_color_override("font_color", UiKit.GOLD)
	_title.modulate.a = 0.0
	add_child(_title)
	_hint = UiKit.label("Entrée : suite   ·   Échap : passer le prologue", "SmallLabel")
	_hint.position = Vector2(0, 20)
	_hint.size = Vector2(1240, 24)
	_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(_hint)
	var skip := UiKit.button("Passer", "SecondaryButton")
	skip.position = Vector2(24, 12)
	skip.focus_mode = Control.FOCUS_NONE
	skip.pressed.connect(finish)
	add_child(skip)
	AudioDirector.clear_ambience()
	next()


func _make_image() -> TextureRect:
	var r := TextureRect.new()
	r.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	r.stretch_mode = TextureRect.STRETCH_SCALE
	r.size = Vector2(320, 180) * SCALE * 1.06
	r.position = -(r.size - Vector2(1280, 720)) / 2.0
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(r)
	return r


## Tableau suivant (ou fin du prologue).
func next() -> void:
	if _done:
		return
	index += 1
	if index >= scenes.size():
		finish()
		return
	var sc: Dictionary = scenes[index]
	var quick := Settings.reduce_motion()
	# Fondu enchaîné : l'image actuelle passe derrière et s'efface.
	_image_old.texture = _image.texture
	_image_old.position = _image.position
	_image_old.modulate.a = 1.0
	var path := IMAGES + str(sc["image"]) + ".png"
	_image.texture = load(path) if ResourceLoader.exists(path) else null
	_image.position = -(_image.size - Vector2(1280, 720)) / 2.0
	_image.modulate.a = 0.0
	move_child(_image, _image_old.get_index() + 1)
	var fade := create_tween()
	fade.tween_property(_image, "modulate:a", 1.0, 0.05 if quick else 0.9)
	fade.parallel().tween_property(_image_old, "modulate:a", 0.0, 0.05 if quick else 0.9)
	if _pan:
		_pan.kill()
	if not quick:
		var pan: Array = sc.get("pan", [0, 0])
		_pan = create_tween()
		_pan.tween_property(_image, "position", _image.position + Vector2(float(pan[0]), float(pan[1])) * SCALE, 9.0) \
			.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	# Son
	if sc.has("music"):
		AudioDirector.play_music(str(sc["music"]))
	AudioDirector.set_ambience(sc.get("ambience", {}), 1.5)
	if sc.has("sfx"):
		AudioDirector.play_sfx(str(sc["sfx"]))
	# Texte
	_text.text = str(sc["text"])
	_text.visible_ratio = 0.0
	if _typing:
		_typing.kill()
	_typing = create_tween()
	_typing.tween_interval(0.0 if quick else 0.6)
	var speed := maxf(0.2, float(Settings.get_value("text_speed")))
	_typing.tween_property(_text, "visible_ratio", 1.0, 0.05 if quick else clampf(_text.text.length() * 0.035 / speed, 0.5, 4.0))
	_title.modulate.a = 0.0
	if bool(sc.get("title", false)):
		_typing.tween_property(_title, "modulate:a", 1.0, 0.8)
	# Avance seule après un temps de lecture confortable.
	_wait = 4.0 + _text.text.length() * 0.045


func _process(delta: float) -> void:
	if _done or (_typing and _typing.is_running()):
		return
	_wait -= delta
	if _wait <= 0.0:
		next()


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
			if bool(scenes[index].get("title", false)):
				_title.modulate.a = 1.0
		else:
			next()


## Fin (ou saut) du prologue : on le note, puis on rejoint la partie ou le menu.
func finish() -> void:
	if _done:
		return
	_done = true
	Settings.set_value("prologue_seen", true)
	AudioDirector.clear_ambience()
	var veil := ColorRect.new()
	veil.color = Color(0.05, 0.03, 0.08, 0.0)
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(veil)
	var tw := create_tween()
	tw.tween_property(veil, "color:a", 1.0, 0.05 if Settings.reduce_motion() else 0.6)
	tw.tween_callback(func() -> void:
		if Game.after_prologue != "":
			get_tree().change_scene_to_file(Game.after_prologue))

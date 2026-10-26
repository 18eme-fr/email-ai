extends Control
## La première au Théâtre des Lumières : la salle comble, le rideau qui se lève sur le
## décor et les costumes choisis avec Victor Lazare, les rappels, puis la critique de
## la Gazette des Planches et le bilan de saison. L'accueil vient de CreationSystem.
## Entrée, espace ou clic : suite ; Échap : aller directement à la critique.

const DIR := "res://assets/story/premiere/"
const SCALE := 4.0

var session: GameSession
var result: Dictionary = {}
var index := -1
var _tableaux: Array = []    ## [{image, text, sfx}]
var _image: TextureRect
var _old: TextureRect
var _text: Label
var _typing: Tween
var _wait := 0.0
var _gazette: Control
var _done := false


func _ready() -> void:
	if Game.has_game():
		session = Game.session
	else:  # écran ouvert seul (essais, captures) : une création tranchée par Lazare
		session = GameSession.new()
		session.new_game(7, "standard")
		session.state.finished = true
	result = session.state.creation.get("paris", {})
	if result.is_empty():
		result = CreationSystem.play_premiere(session.data, session.state, session.rayonnement())
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.03, 0.08)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_old = _make_image()
	_image = _make_image()
	var band := ColorRect.new()
	band.color = Color(0.03, 0.02, 0.05, 0.9)
	band.position = Vector2(0, 720 - 130)
	band.size = Vector2(1280, 130)
	band.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(band)
	_text = UiKit.label("", "", true)
	_text.position = Vector2(120, 720 - 112)
	_text.size = Vector2(1040, 96)
	_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_text.add_theme_font_size_override("font_size", 22)
	_text.add_theme_color_override("font_color", UiKit.CREAM)
	add_child(_text)
	_build_tableaux()
	AudioDirector.play_music("theme")
	AudioDirector.set_ambience({"foule": 0.6})
	next()


func _make_image() -> TextureRect:
	var r := TextureRect.new()
	r.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	r.stretch_mode = TextureRect.STRETCH_SCALE
	r.size = Vector2(320, 180) * SCALE
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(r)
	return r


func _lower_first(s: String) -> String:
	return s.substr(0, 1).to_lower() + s.substr(1) if s != "" else s


func _build_tableaux() -> void:
	var data := session.data
	var c := CreationSystem.choices(session.state)
	var decor := str(c.get("decor", "monumental"))
	var costumes := str(c.get("costumes", "epoque"))
	var parts: Array = []
	for step_id: String in ["sujet", "forme", "distribution", "musique"]:
		var o := CreationSystem.option(data, step_id, str(c.get(step_id, "")))
		if not o.is_empty():
			parts.append(_lower_first(str(o["label"])))
	var calls := int(result.get("calls", 1))
	_tableaux = [
		{"image": "salle", "sfx": "", "text": "Le Théâtre des Lumières affiche complet : le public parisien, la presse… et un car entier venu de Bréval-sur-Ondine."},
		{"image": "scene_%s_%s" % [decor, costumes], "sfx": "curtain",
		 "text": "Le rideau se lève sur « %s » : %s." % [result.get("show", ""), " · ".join(parts)]},
		{"image": "saluts_%s_%s" % [decor, costumes], "sfx": "applause",
		 "text": "%s %s" % [str(result.get("title", "")), str(result.get("text", ""))], "calls": calls},
	]


func next() -> void:
	if _done:
		return
	index += 1
	if index >= _tableaux.size():
		show_gazette()
		return
	var t: Dictionary = _tableaux[index]
	var quick := Settings.reduce_motion()
	_old.texture = _image.texture
	_old.modulate.a = 1.0
	var path := DIR + str(t["image"]) + ".png"
	_image.texture = load(path) if ResourceLoader.exists(path) else null
	_image.modulate.a = 0.0
	var fade := create_tween().set_parallel(true)
	fade.tween_property(_image, "modulate:a", 1.0, 0.05 if quick else 0.8)
	fade.tween_property(_old, "modulate:a", 0.0, 0.05 if quick else 0.8)
	if str(t["sfx"]) != "":
		AudioDirector.play_sfx(str(t["sfx"]))
	if t.has("calls"):  # les rappels : les applaudissements reviennent, encore et encore
		AudioDirector.set_ambience({"foule": 0.2})
		for k in range(1, mini(int(t["calls"]), 5)):
			get_tree().create_timer(1.3 * k).timeout.connect(func() -> void:
				if not _done:
					AudioDirector.play_sfx("applause"))
	elif index == 1:
		AudioDirector.set_ambience({})
	_text.text = str(t["text"])
	_text.visible_ratio = 0.0
	if _typing:
		_typing.kill()
	_typing = create_tween()
	_typing.tween_property(_text, "visible_ratio", 1.0, 0.05 if quick else clampf(_text.text.length() * 0.03, 0.4, 3.5))
	_wait = 4.0 + _text.text.length() * 0.045


func _process(delta: float) -> void:
	if _done or _gazette != null or (_typing and _typing.is_running()):
		return
	_wait -= delta
	if _wait <= 0.0:
		next()


## La critique de la Gazette des Planches, le récapitulatif des choix, puis le bilan.
func show_gazette() -> void:
	if _gazette != null:
		return
	index = _tableaux.size()
	if _typing:
		_typing.kill()
	_text.visible = false
	AudioDirector.set_ambience({})
	AudioDirector.play_sfx("page")
	_gazette = UiKit.panel("PaperPanel")
	_gazette.position = Vector2(190, 40)
	_gazette.custom_minimum_size = Vector2(900, 0)
	_gazette.size = Vector2(900, 0)
	add_child(_gazette)
	var col := UiKit.vbox([], 8)
	_gazette.add_child(col)
	var head := UiKit.label("LA GAZETTE DES PLANCHES", "HeaderLabel")
	head.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	head.add_theme_color_override("font_color", Color("3a2a22"))
	col.add_child(head)
	var verdict := UiKit.label("%s — « %s »" % [result.get("title", ""), result.get("show", "")], "SubHeaderLabel", true)
	verdict.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	verdict.add_theme_color_override("font_color", Color("8a1a2a"))
	col.add_child(verdict)
	var critic := UiKit.label(str(result.get("critic", "")), "PaperLabel", true)
	critic.custom_minimum_size = Vector2(860, 0)
	col.add_child(critic)
	col.add_child(UiKit.label("%d rappel%s · accueil %d / 100 (qualité des choix, cohérence de la vision, rayonnement du théâtre)" % [
		int(result.get("calls", 1)), "s" if int(result.get("calls", 1)) > 1 else "", int(result.get("score", 0))], "PaperLabel", true))
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 24)
	col.add_child(grid)
	for e: Dictionary in CreationSystem.summary(session.data, session.state):
		var l := UiKit.label("%s : %s%s" % [e["title"], e["label"], " (choisi par Lazare)" if e["defaulted"] else ""], "PaperLabel", true)
		l.add_theme_font_size_override("font_size", 15)
		l.custom_minimum_size = Vector2(420, 0)
		grid.add_child(l)
	var row := UiKit.hbox([UiKit.spacer()])
	var go := UiKit.primary("Rentrer à Bréval : le bilan de la saison", "star")
	go.pressed.connect(finish)
	row.add_child(go)
	col.add_child(row)
	go.grab_focus.call_deferred()


func finish() -> void:
	if _done:
		return
	_done = true
	if Game.has_game():
		Game.autosave()
	get_tree().change_scene_to_file(Game.END_SCREEN)


func _unhandled_input(event: InputEvent) -> void:
	if _done or _gazette != null:
		return
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("rideau_pause"):
		get_viewport().set_input_as_handled()
		show_gazette()
	elif event.is_action_pressed("ui_accept") or (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT):
		get_viewport().set_input_as_handled()
		if _typing and _typing.is_running():
			_typing.kill()
			_text.visible_ratio = 1.0
		else:
			next()

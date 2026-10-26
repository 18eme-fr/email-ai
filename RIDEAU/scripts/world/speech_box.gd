class_name SpeechBox
extends PanelContainer
## Boîte de dialogue du monde explorable, façon jeu de rôle : nom, portrait,
## texte tapé à la machine, puis « Suite » ou une liste de réponses.
##   await speech.say("Hélène", portrait, "Bonjour !")
##   var i: int = await speech.ask("Hélène", portrait, "On y va ?", ["Oui", "Non"])
## Entrée, Espace, E ou un clic font avancer ; Échap choisit la dernière réponse.

signal advanced
signal chosen(index: int)

var _portrait: TextureRect
var _name: Label
var _text: RichTextLabel
var _hint: Label
var _choices: VBoxContainer
var _tween: Tween
var _asking := false


func _init() -> void:
	theme_type_variation = "PaperPanel"
	visible = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	var row := UiKit.hbox([], 12)
	add_child(row)
	_portrait = TextureRect.new()
	_portrait.custom_minimum_size = Vector2(96, 96)
	_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_portrait.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	row.add_child(_portrait)
	var col := UiKit.vbox([], 4)
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(col)
	_name = UiKit.label("", "PaperTitleLabel")
	col.add_child(_name)
	_text = RichTextLabel.new()
	_text.theme_type_variation = "PaperRichText"
	_text.bbcode_enabled = true
	_text.fit_content = true
	_text.scroll_active = false
	_text.custom_minimum_size = Vector2(200, 54)
	_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(_text)
	_choices = UiKit.vbox([], 2)
	col.add_child(_choices)
	_hint = UiKit.label("▼ Entrée", "PaperLabel")
	_hint.add_theme_font_size_override("font_size", 13)
	_hint.add_theme_color_override("font_color", Color("7a1a2e"))
	_hint.size_flags_horizontal = Control.SIZE_SHRINK_END
	col.add_child(_hint)


func say(speaker: String, portrait: Texture2D, text: String) -> void:
	_show(speaker, portrait, text)
	_asking = false
	await advanced


func ask(speaker: String, portrait: Texture2D, text: String, options: Array) -> int:
	_show(speaker, portrait, text)
	_asking = true
	_hint.visible = false
	UiKit.clear(_choices)
	for i in options.size():
		var b := UiKit.button("▸ " + str(options[i]), "FlatButton")
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.add_theme_color_override("font_color", Color("4a2a2e"))
		b.add_theme_color_override("font_hover_color", Color("b02a3a"))
		b.add_theme_color_override("font_focus_color", Color("b02a3a"))
		var idx := i
		b.pressed.connect(func() -> void: _pick(idx))
		_choices.add_child(b)
	_choices.visible = true
	_finish_typing()
	(_choices.get_child(0) as Button).grab_focus.call_deferred()
	var picked: int = await chosen
	return picked


func close() -> void:
	visible = false
	UiKit.clear(_choices)


func _show(speaker: String, portrait: Texture2D, text: String) -> void:
	visible = true
	UiKit.clear(_choices)
	_choices.visible = false
	_name.text = speaker
	_name.visible = speaker != ""
	_portrait.texture = portrait
	_portrait.visible = portrait != null
	_text.text = text
	_hint.visible = true
	if _tween:
		_tween.kill()
	if Settings.reduce_motion():
		_text.visible_ratio = 1.0
	else:
		_text.visible_ratio = 0.0
		var speed := maxf(0.2, float(Settings.get_value("text_speed")))
		_tween = create_tween()
		_tween.tween_property(_text, "visible_ratio", 1.0, clampf(text.length() * 0.018 / speed, 0.15, 2.5))
	AudioDirector.play_sfx("blip", 0.1)


func _typing() -> bool:
	return _tween != null and _tween.is_running()


## Petite « voix » pendant que le texte s'écrit (une syllabe toutes les trois lettres).
var _voiced := 0


func _process(_delta: float) -> void:
	if not visible or _text == null or not _typing():
		_voiced = 0
		return
	var shown := int(_text.visible_ratio * _text.text.length())
	if shown - _voiced >= 3:
		_voiced = shown
		AudioDirector.play_sfx("voix", 0.15, -10.0)


func _finish_typing() -> void:
	if _tween:
		_tween.kill()
	_text.visible_ratio = 1.0


func _pick(i: int) -> void:
	AudioDirector.play_sfx("click")
	_asking = false
	chosen.emit(i)


func _advance() -> void:
	if _typing():
		_finish_typing()
		return
	if _asking:
		return
	advanced.emit()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if _asking:
		if event.is_action_pressed("ui_cancel") or event.is_action_pressed("rideau_pause"):
			get_viewport().set_input_as_handled()
			_pick(_choices.get_child_count() - 1)
		return
	if event.is_action_pressed("ui_accept") or event.is_action_pressed("rideau_interact") or event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_advance()


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT and not _asking:
		accept_event()
		_advance()

class_name SettingsPanel
extends RefCounted
## Construit le contenu de la fenêtre « Paramètres » (menu principal et pause).


static func open(parent: Node) -> Modal:
	var m := Modal.open(parent, "Paramètres", 640, 520)
	var c := m.content
	c.add_child(UiKit.label("Son", "SubHeaderLabel"))
	_slider(c, "Volume général", "master_volume")
	_slider(c, "Musique", "music_volume")
	_slider(c, "Effets sonores", "sfx_volume")
	c.add_child(HSeparator.new())
	c.add_child(UiKit.label("Affichage et confort", "SubHeaderLabel"))
	_check(c, "Réduire les animations", "reduce_motion", "Désactive les fondus, le rideau animé et l'effet machine à écrire.")
	_check(c, "Police très lisible (Atkinson Hyperlegible)", "readable_font", "Remplace la police pixel par une police conçue pour la lisibilité.")
	if not OS.has_feature("web"):
		_check(c, "Plein écran", "fullscreen", "")
	_check(c, "Afficher les conseils de prise en main", "show_tutorial", "Hélène et Inès expliquent chaque étape lors de la première période.")
	return m


static func _slider(parent: Control, text: String, key: String) -> void:
	var row := UiKit.hbox()
	var l := UiKit.label(text)
	l.custom_minimum_size.x = 200
	row.add_child(l)
	var s := HSlider.new()
	s.min_value = 0.0
	s.max_value = 1.0
	s.step = 0.05
	s.value = float(Settings.get_value(key))
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.custom_minimum_size.y = 24
	s.focus_mode = Control.FOCUS_ALL
	var pct := UiKit.label("%d %%" % roundi(s.value * 100), "SmallLabel")
	pct.custom_minimum_size.x = 50
	s.value_changed.connect(func(v: float) -> void:
		Settings.set_value(key, v)
		pct.text = "%d %%" % roundi(v * 100))
	s.drag_ended.connect(func(_changed: bool) -> void: AudioDirector.play_sfx("blip"))
	row.add_child(s)
	row.add_child(pct)
	parent.add_child(row)


static func _check(parent: Control, text: String, key: String, help: String) -> void:
	var cb := CheckBox.new()
	cb.text = text
	cb.button_pressed = bool(Settings.get_value(key))
	cb.tooltip_text = help
	cb.toggled.connect(func(on: bool) -> void:
		AudioDirector.play_sfx("click")
		Settings.set_value(key, on))
	parent.add_child(cb)
	if help != "":
		var h := UiKit.label(help, "SmallLabel", true)
		h.custom_minimum_size.x = 520
		parent.add_child(h)

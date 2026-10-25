extends Control
## Menu principal : nouvelle saison, reprise, paramètres, crédits, quitter.

@onready var _continue: Button = $Center/Column/Buttons/Continue
@onready var _message: Label = $Center/Column/Message
@onready var _overlay: Control = $Overlay


func _ready() -> void:
	$Version.text = "RIDEAU ! v%s — Godot %s" % [ProjectSettings.get_setting("application/config/version"), Engine.get_version_info()["string"]]
	var buttons := $Center/Column/Buttons
	buttons.get_node("NewGame").pressed.connect(_on_new_game)
	_continue.pressed.connect(_on_continue)
	buttons.get_node("Settings").pressed.connect(func() -> void: SettingsPanel.open(_overlay))
	buttons.get_node("Credits").pressed.connect(_on_credits)
	var quit := buttons.get_node("Quit") as Button
	quit.pressed.connect(func() -> void: get_tree().quit())
	quit.visible = not OS.has_feature("web")
	for b: Button in buttons.get_children():
		b.mouse_entered.connect(func() -> void: AudioDirector.play_sfx("hover"))
		b.pressed.connect(func() -> void: AudioDirector.play_sfx("click"))
	_continue.disabled = not Game.saves.has_save()
	_continue.tooltip_text = "" if not _continue.disabled else "Aucune partie enregistrée."
	buttons.get_node("NewGame").grab_focus()
	AudioDirector.play_music("theme")
	if not Settings.reduce_motion():
		var title := $Center/Column/Title
		title.pivot_offset = title.size / 2
		var tw := create_tween().set_loops()
		tw.tween_property($Center/Column/Lantern, "modulate", Color(1.15, 1.05, 0.85), 1.4)
		tw.tween_property($Center/Column/Lantern, "modulate", Color.WHITE, 1.4)


func _on_continue() -> void:
	var msg := Game.continue_game()
	if msg != "" and not Game.has_game():
		_message.text = msg
		AudioDirector.play_sfx("error")
	elif msg != "":
		# La partie a été restaurée depuis la copie de secours : on le signale au joueur.
		Game.notice.emit(msg, "warning")


func _on_new_game() -> void:
	var m := Modal.open(_overlay, "Nouvelle saison", 700, 560)
	var c := m.content
	c.add_child(UiKit.rich("Vous prenez la direction du [b]Théâtre de la Lanterne[/b], à Bréval-sur-Ondine (ville fictive). Une saison dure [b]huit périodes[/b], de la rentrée à juin. Objectif : tenir vos engagements envers la Ville sans mettre le théâtre en faillite."))
	if Game.saves.has_save():
		c.add_child(UiKit.label("Attention : commencer une nouvelle saison remplace la partie enregistrée.", "MutedLabel", true))
	c.add_child(UiKit.label("Difficulté", "SubHeaderLabel"))
	var group := ButtonGroup.new()
	var chosen := ["standard"]
	var diffs: Dictionary = Game.data.balance["difficulties"]
	for id: String in diffs:
		var cb := CheckBox.new()
		cb.button_group = group
		cb.text = "%s — %s" % [diffs[id]["label"], diffs[id]["description"]]
		cb.button_pressed = id == "standard"
		cb.toggled.connect(func(on: bool) -> void:
			if on:
				chosen[0] = id)
		c.add_child(cb)
	c.add_child(UiKit.label("Graine (facultatif)", "SubHeaderLabel"))
	var seed_edit := LineEdit.new()
	seed_edit.placeholder_text = "Laisser vide pour une saison au hasard"
	seed_edit.tooltip_text = "Une même graine et les mêmes décisions donnent toujours la même saison : pratique pour comparer des stratégies."
	c.add_child(seed_edit)
	c.add_child(UiKit.label("La graine permet de rejouer exactement la même saison.", "SmallLabel", true))
	var start := UiKit.button("Lever le rideau", "GoldButton", "play")
	start.size_flags_horizontal = Control.SIZE_SHRINK_END
	start.pressed.connect(func() -> void:
		AudioDirector.play_sfx("curtain")
		var s := seed_edit.text.strip_edges()
		var game_seed: int = int(s) if s.is_valid_int() else (absi(hash(s)) % 1_000_000 if s != "" else -1)
		Game.new_game(chosen[0], game_seed))
	c.add_child(start)
	start.grab_focus.call_deferred()


func _on_credits() -> void:
	var m := Modal.open(_overlay, "Crédits", 760, 560)
	m.content.add_child(UiKit.rich(CreditsText.BBCODE))

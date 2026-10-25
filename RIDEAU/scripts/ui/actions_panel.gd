class_name ActionsPanel
extends VBoxContainer
## Étape 3 : répartir les forces de l'équipe entre quelques actions de gestion.

var screen: Node
var session: GameSession
var chosen: Array = []

var _grid: GridContainer
var _summary: RichTextLabel
var _error: Label


func _ready() -> void:
	session = screen.session
	chosen = session.state.actions.duplicate()
	add_theme_constant_override("separation", 6)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(UiKit.hbox([UiKit.label("Gestion", "HeaderLabel"), UiKit.spacer(), UiKit.notion_link("equipe", "L'équipe ?")]))
	var cap := session.action_capacity()
	var cap_text := "Votre petite équipe peut mener [b]%d actions[/b] cette période." % cap
	if cap > int(session.data.balance["team_actions_per_turn"]):
		cap_text += " Elle est en grande forme : une action de plus !"
	else:
		cap_text += " (Une équipe à %d ou plus en mène une de plus.)" % int(session.data.balance["team_actions_bonus_threshold"])
	add_child(UiKit.rich(cap_text))
	if session.state.turn == 1 and not session.state.tutorial_seen.has("management") and bool(Settings.get_value("show_tutorial")):
		var box := DialogueBox.new()
		add_child(box)
		box.finished.connect(func() -> void:
			session.state.tutorial_seen["management"] = true
			box.queue_free())
		box.start(load("res://dialogue/story.dialogue"), "first_management")
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	_grid = GridContainer.new()
	_grid.columns = 2
	_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_grid)
	_summary = UiKit.rich("")
	add_child(_summary)
	_error = UiKit.label("", "MutedLabel", true)
	_error.add_theme_color_override("font_color", UiKit.BAD)
	_error.visible = false
	add_child(_error)
	var footer := UiKit.hbox()
	var back := UiKit.button("Retour", "SecondaryButton")
	back.pressed.connect(func() -> void:
		session.go_back()
		screen.advance())
	footer.add_child(back)
	footer.add_child(UiKit.spacer())
	var go := UiKit.primary("Valider les actions")
	go.pressed.connect(_on_validate)
	footer.add_child(go)
	add_child(footer)
	_build()


func _build() -> void:
	UiKit.clear(_grid)
	for id: String in session.data.action_order:
		_grid.add_child(_card(id))
	var proj := session.projected_cash(session.state.programmed, chosen)
	_summary.text = "Actions : [b]%d / %d[/b]   ·   Trésorerie prévue en fin de période : [b]%s[/b] [color=#b9b0c8](si public faible : %s)[/color]" % [
		chosen.size(), session.action_capacity(), Format.money(int(proj["expected"])), Format.money(int(proj["low"]))]


func _card(id: String) -> Control:
	var a: Dictionary = session.data.actions[id]
	var on := id in chosen
	var card := UiKit.panel("PaperPanel" if on else "InsetPanel")
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.custom_minimum_size.x = 255
	var col := UiKit.vbox([], 2)
	card.add_child(col)
	var title := UiKit.label(str(a["label"]), "PaperLabel" if on else "SubHeaderLabel", true)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(UiKit.hbox([UiKit.icon_rect(UiKit.ACTION_ICONS.get(id, "star"), 32), title]))
	var delay := int(a.get("payment_delay", 0))
	var cost := "%s, payé %s" % [Format.money(int(a["cost"])), "cette période" if delay == 0 else "à la période suivante"]
	var c := UiKit.label(cost, "SmallLabel", true)
	if on:
		c.add_theme_color_override("font_color", UiKit.INK)
	col.add_child(c)
	var s := UiKit.label(str(a["summary"]), "SmallLabel", true)
	if on:
		s.add_theme_color_override("font_color", Color("4a3a40"))
	col.add_child(s)
	var effects: Array[String] = []
	for sid: String in a.get("effects", {}).get("stats", {}):
		effects.append("%s +%d" % [Rules.STAT_LABELS.get(sid, sid), int(a["effects"]["stats"][sid])])
	if a.get("effects", {}).has("eac"):
		effects.append("action EAC")
	var e := UiKit.label(", ".join(effects), "SmallLabel", true)
	e.add_theme_color_override("font_color", Color("24552d") if on else UiKit.GOOD)
	col.add_child(e)
	var row := UiKit.hbox()
	row.add_child(UiKit.notion_link(str(a.get("notion", "")), "En savoir plus", on))
	row.add_child(UiKit.spacer())
	var b := UiKit.button("Retirer" if on else "Choisir", "SecondaryButton" if on else "")
	b.tooltip_text = str(a["description"])
	b.pressed.connect(func() -> void: _toggle(id))
	row.add_child(b)
	col.add_child(row)
	card.tooltip_text = str(a["description"])
	return card


func _toggle(id: String) -> void:
	_error.visible = false
	if id in chosen:
		chosen.erase(id)
		AudioDirector.play_sfx("cancel")
	else:
		if chosen.size() >= session.action_capacity():
			_error.text = "L'équipe est déjà mobilisée : retirez une action avant d'en choisir une autre."
			_error.visible = true
			AudioDirector.play_sfx("error")
			return
		chosen.append(id)
		AudioDirector.play_sfx("confirm")
	_build()


func _on_validate() -> void:
	var err := session.confirm_actions(chosen)
	if err != "":
		_error.text = err
		_error.visible = true
		AudioDirector.play_sfx("error")
		return
	AudioDirector.play_sfx("confirm")
	screen.advance()

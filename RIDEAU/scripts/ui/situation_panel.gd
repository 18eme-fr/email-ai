class_name SituationPanel
extends VBoxContainer
## Étape 1 : la situation en début de période.

var screen: Node


func _ready() -> void:
	var session: GameSession = screen.session
	var s := session.state
	add_theme_constant_override("separation", 8)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(UiKit.label("Situation — %s" % session.period_name(), "HeaderLabel"))

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	var body := UiKit.vbox([], 10)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(body)

	var first_time := s.turn == 1 and not s.tutorial_seen.has("intro") and bool(Settings.get_value("show_tutorial"))
	if first_time:
		var box := DialogueBox.new()
		body.add_child(box)
		box.finished.connect(func() -> void:
			s.tutorial_seen["intro"] = true
			box.queue_free()
			_fill(body, session))
		box.start(load("res://dialogue/story.dialogue"), "intro")
	else:
		_fill(body, session)

	var footer := UiKit.hbox()
	footer.add_child(UiKit.notion_link("budget_previsionnel", "Budget prévisionnel ?"))
	footer.add_child(UiKit.spacer())
	var go := UiKit.primary("Préparer la programmation")
	go.pressed.connect(func() -> void:
		session.open_programming()
		screen.advance())
	footer.add_child(go)
	add_child(footer)
	go.grab_focus.call_deferred()


func _fill(body: VBoxContainer, session: GameSession) -> void:
	for brief: Dictionary in Briefing.lines(session):
		body.add_child(_brief_card(brief))
	if not session.last_report.is_empty():
		var r := session.last_report
		var fin: Dictionary = r["finance"]
		var card := UiKit.panel("InsetPanel")
		var col := UiKit.vbox([], 4)
		card.add_child(col)
		col.add_child(UiKit.label("Période précédente (%s)" % r["period"], "SubHeaderLabel"))
		col.add_child(UiKit.rich("Résultat : %s   ·   Trésorerie : %s   ·   Entrées : %s" % [
			UiKit.delta_text(fin["resultat"], true), UiKit.delta_text(fin["variation"], true), Format.thousands(int(r["attendance"]))]))
		body.add_child(card)
	body.add_child(_upcoming(session))


func _brief_card(brief: Dictionary) -> Control:
	var card := UiKit.panel("PaperPanel")
	var row := UiKit.hbox([], 10)
	card.add_child(row)
	var p := TextureRect.new()
	p.texture = UiKit.portrait(brief["character"], brief.get("mood", "neutral"))
	p.custom_minimum_size = Vector2(72, 72)
	p.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	p.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT
	p.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	row.add_child(p)
	var data := GameData.get_default()
	var text := UiKit.rich("[b]%s[/b]  [color=#6e5a4a]%s[/color]\n%s" % [data.character_name(brief["character"]), data.characters[brief["character"]]["role"], brief["text"]])
	text.theme_type_variation = "PaperRichText"
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(text)
	return card


## Échéancier : ce qui sera encaissé ou payé dans les périodes à venir.
func _upcoming(session: GameSession) -> Control:
	var s := session.state
	var card := UiKit.panel("InsetPanel")
	var col := UiKit.vbox([], 4)
	card.add_child(col)
	var head := UiKit.hbox([UiKit.label("Échéancier de trésorerie", "SubHeaderLabel"), UiKit.spacer(), UiKit.notion_link("tresorerie_resultat")])
	col.add_child(head)
	var rows: Array = []
	for entry: Dictionary in s.ledger:
		if entry["settled"] or entry["cancelled"]:
			continue
		if int(entry["due_turn"]) <= s.turn + 2:
			rows.append(entry)
	rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a["due_turn"]) < int(b["due_turn"]))
	if rows.is_empty():
		col.add_child(UiKit.label("Aucune échéance particulière dans les deux prochaines périodes.", "SmallLabel"))
	for entry: Dictionary in rows:
		var when := "cette période" if int(entry["due_turn"]) <= s.turn else "période %d" % int(entry["due_turn"])
		var amount := int(entry["amount"]) * int(entry["direction"])
		var cond := " [i](sous condition)[/i]" if entry["conditional"] else ""
		col.add_child(UiKit.rich("%s  —  %s%s  [color=#b9b0c8](%s)[/color]" % [UiKit.delta_text(amount, true), entry["label"], cond, when]))
	col.add_child(UiKit.label("Charges fixes de la période : %s (salaires, bâtiment)." % Format.money(session.fixed_costs_total()), "SmallLabel", true))
	return card

class_name EventPanel
extends VBoxContainer
## Étape 4 : l'événement de la période (dialogue Dialogue Manager + choix aux effets réels),
## puis lancement de la période (étape 5, résolution animée).

const EVENTS_DIALOGUE := "res://dialogue/events.dialogue"

var screen: Node
var session: GameSession
var _choices: VBoxContainer
var _outcome: RichTextLabel
var _launch: Button
var _box: DialogueBox


func _ready() -> void:
	session = screen.session
	add_theme_constant_override("separation", 8)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	var event := session.current_event()
	var head := UiKit.hbox([UiKit.label(str(event.get("title", "Une période calme")), "HeaderLabel", true)])
	if event.has("notion"):
		head.add_child(UiKit.notion_link(str(event["notion"]), "Comprendre l'enjeu"))
	add_child(head)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	var body := UiKit.vbox([], 8)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(body)
	_box = DialogueBox.new()
	body.add_child(_box)
	_choices = UiKit.vbox([], 6)
	body.add_child(_choices)
	_outcome = UiKit.rich("")
	_outcome.visible = false
	body.add_child(_outcome)
	var footer := UiKit.hbox([UiKit.spacer()])
	_launch = UiKit.primary("Lancer la période")
	_launch.visible = false
	_launch.pressed.connect(_on_launch)
	footer.add_child(_launch)
	add_child(footer)

	if event.is_empty():
		_box.visible = false
		body.add_child(UiKit.label("Aucun imprévu cette fois-ci : l'équipe peut se concentrer sur les représentations.", "", true))
		_show_launch()
	elif session.state.event_choice != "":
		_box.visible = false
		_show_outcome()
		_show_launch()
	else:
		_box.responses_ready.connect(_on_responses)
		_box.finished.connect(_show_launch)
		_box.start(load(EVENTS_DIALOGUE), session.state.current_event)


func _on_responses(responses: Array) -> void:
	UiKit.clear(_choices)
	var data := session.data
	var event_id := session.state.current_event
	var first: Button = null
	for response: DialogueResponse in responses:
		var cid := DialogueBox.choice_id(response)
		var choice := EventSystem.find_choice(data, event_id, cid)
		var reason := EventSystem.choice_block_reason(data, session.state, event_id, cid)
		var card := UiKit.panel("InsetPanel")
		var col := UiKit.vbox([], 2)
		card.add_child(col)
		var b := UiKit.button(response.text, "" if reason == "" else "SecondaryButton")
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		b.custom_minimum_size.x = 40
		b.disabled = reason != ""
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func() -> void: _choose(response, cid))
		col.add_child(b)
		var hint := str(choice.get("hint", ""))
		var p := EventSystem.choice_probability(data, session.state, event_id, cid)
		if p >= 0.0:
			hint += "  — Chances de réussite : %d %%" % roundi(p * 100)
		if reason != "":
			hint = "Indisponible : " + reason
		var h := UiKit.label(hint, "SmallLabel", true)
		col.add_child(h)
		_choices.add_child(card)
		if first == null and reason == "":
			first = b
	if first:
		first.grab_focus.call_deferred()


func _choose(response: DialogueResponse, choice_id: String) -> void:
	var result := session.choose_event(choice_id)
	if result.has("error"):
		screen.toast(str(result["error"]), "error")
		return
	AudioDirector.play_sfx("confirm")
	UiKit.clear(_choices)
	_show_outcome()
	screen.refresh_all()
	_box.choose(response)


func _show_outcome() -> void:
	var choice := EventSystem.find_choice(session.data, session.state.current_event, session.state.event_choice)
	var txt := "[color=#c9a24b]Votre décision :[/color] %s" % choice.get("label", "")
	var outcome := session.state.event_outcome
	if not outcome.is_empty():
		txt += "\n%s : %s [color=#b9b0c8](probabilité %d %%)[/color]" % [outcome["label"],
			"[color=#8fd19e]réussite ![/color]" if outcome["success"] else "[color=#f08a8a]échec…[/color]", roundi(float(outcome["probability"]) * 100)]
	_outcome.text = txt
	_outcome.visible = true


func _show_launch() -> void:
	_launch.visible = true
	_launch.grab_focus.call_deferred()


func _on_launch() -> void:
	if not session.event_resolved():
		screen.toast("Faites d'abord un choix face à l'événement.", "error")
		return
	_launch.disabled = true
	var report := session.resolve_turn()
	if report.has("error"):
		screen.toast(str(report["error"]), "error")
		_launch.disabled = false
		return
	var ratio := 0.0
	for s: Dictionary in report.get("shows", []):
		if not s.get("cancelled", false) and session.data.shows[s["show_id"]].get("format", "") == "salle":
			ratio = maxf(ratio, float(s["fill"]))
	if ratio > 0.0:
		screen.theatre.play_performance(ratio)
		await screen.theatre.performance_finished
	AudioDirector.play_sfx("coins")
	screen.advance()

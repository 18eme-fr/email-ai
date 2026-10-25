class_name DialogueBox
extends PanelContainer
## Boîte de dialogue reposant sur Dialogue Manager (addon) :
## portrait + nom + texte tapé à la machine, puis « Suite » ou réponses.
## Les réponses sont transmises au panneau parent via `responses_ready`,
## qui les affiche avec leurs conséquences et rappelle `choose()`.

signal finished
signal responses_ready(responses: Array)
signal line_shown(line: DialogueLine)

const NAME_TO_ID := {
	"Hélène": "helene", "Bastien": "bastien", "Inès": "ines", "Pommier": "pommier", "Louison": "louison",
}

var resource: DialogueResource
var _portrait: TextureRect
var _name: Label
var _role: Label
var _label: DialogueLabel
var _next: Button
var _line: DialogueLine
var _waiting_response := false


func _init() -> void:
	theme_type_variation = "PaperPanel"
	var row := UiKit.hbox([], 12)
	add_child(row)
	_portrait = TextureRect.new()
	_portrait.custom_minimum_size = Vector2(144, 144)
	_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_portrait.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	row.add_child(_portrait)
	var col := UiKit.vbox([], 4)
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(col)
	_name = UiKit.label("", "PaperTitleLabel")
	_role = UiKit.label("", "PaperLabel")
	_role.add_theme_font_size_override("font_size", 14)
	_role.add_theme_color_override("font_color", Color("6e5a4a"))
	_role.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_role.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_role.custom_minimum_size.x = 40
	col.add_child(UiKit.vbox([_name, _role], 0))
	_label = DialogueLabel.new()
	_label.theme_type_variation = "PaperRichText"
	_label.fit_content = true
	_label.scroll_active = false
	_label.custom_minimum_size = Vector2(200, 60)
	_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_label.seconds_per_step = 0.018
	col.add_child(_label)
	_next = UiKit.button("Suite", "FlatButton")
	_next.size_flags_horizontal = Control.SIZE_SHRINK_END
	_next.pressed.connect(_advance)
	col.add_child(UiKit.spacer(false))
	col.add_child(_next)


func start(dialogue: DialogueResource, cue: String) -> void:
	resource = dialogue
	visible = true
	_show(await DialogueManager.get_next_dialogue_line(resource, cue))


func _show(line: DialogueLine) -> void:
	_line = line
	if line == null:
		_next.visible = false
		finished.emit()
		return
	var cid: String = NAME_TO_ID.get(line.character, "")
	var mood := line.get_tag_value("mood")
	_portrait.texture = UiKit.portrait(cid, mood if mood != "" else "neutral") if cid != "" else null
	_portrait.visible = cid != ""
	var data := GameData.get_default()
	_name.text = data.character_name(cid) if cid != "" else line.character
	_role.text = str(data.characters.get(cid, {}).get("role", ""))
	_label.dialogue_line = line
	if Settings.reduce_motion():
		_label.visible_ratio = 1.0
	else:
		_label.type_out()
		AudioDirector.play_sfx("blip")
	line_shown.emit(line)
	_waiting_response = not line.responses.is_empty()
	_next.visible = not _waiting_response
	_next.text = "Suite ▸" if line.next_id != "" and line.next_id != "end" else "Fermer"
	if _waiting_response:
		responses_ready.emit(line.responses)
	else:
		_next.grab_focus.call_deferred()


func _advance() -> void:
	if _label.is_typing:
		_label.skip_typing()
		return
	if _line == null:
		return
	_show(await DialogueManager.get_next_dialogue_line(resource, _line.next_id))


## Choix d'une réponse par le panneau parent.
func choose(response: DialogueResponse) -> void:
	_waiting_response = false
	_show(await DialogueManager.get_next_dialogue_line(resource, response.next_id))


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if _label.is_typing:
			_label.skip_typing()
		elif not _waiting_response and _next.visible:
			_advance()


static func choice_id(response: DialogueResponse) -> String:
	return response.get_tag_value("choice")

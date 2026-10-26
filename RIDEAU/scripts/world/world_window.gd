class_name WorldWindow
extends Control
## Fenêtre qui accueille les panneaux d'étape (situation, programmation,
## gestion, événement, bilan) par-dessus le monde explorable.
## Échap ou « Fermer » la referment ; le monde reste en l'état.

signal closed

const WIDTH := 660
const HEIGHT := 690

var host: MarginContainer
var _title: Label
var _frame: PanelContainer


func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	var veil := ColorRect.new()
	veil.color = Color(0.05, 0.03, 0.08, 0.55)
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(veil)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	_frame = UiKit.panel("WoodPanel")
	_frame.custom_minimum_size = Vector2(WIDTH, HEIGHT)
	center.add_child(_frame)
	var col := UiKit.vbox([], 6)
	_frame.add_child(col)
	var head := UiKit.hbox()
	_title = UiKit.label("", "SubHeaderLabel")
	head.add_child(_title)
	head.add_child(UiKit.spacer())
	var close := UiKit.button("Fermer (Échap)", "SecondaryButton")
	close.focus_mode = Control.FOCUS_NONE
	close.pressed.connect(close_window)
	head.add_child(close)
	col.add_child(head)
	host = MarginContainer.new()
	host.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(host)


func is_open() -> bool:
	return visible


func open_panel(title: String, panel: Control) -> void:
	UiKit.clear(host)
	_title.text = title
	host.add_child(panel)
	if not visible:
		visible = true
		UiKit.fade_in(self, 0.15)
		AudioDirector.play_sfx("page")


## Masque la fenêtre sans détruire le panneau (il peut attendre une animation).
func hide_for_now() -> void:
	visible = false


func close_window() -> void:
	if not visible:
		return
	visible = false
	UiKit.clear(host)
	closed.emit()


func _unhandled_input(event: InputEvent) -> void:
	if visible and (event.is_action_pressed("ui_cancel") or event.is_action_pressed("rideau_pause")):
		get_viewport().set_input_as_handled()
		close_window()

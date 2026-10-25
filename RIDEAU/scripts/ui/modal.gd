class_name Modal
extends Control
## Fenêtre modale simple : voile sombre + panneau centré + bouton Fermer.
## Échap ferme la fenêtre ; le focus revient à l'élément précédent.

signal closed

var content: VBoxContainer
var _previous_focus: Control


static func open(parent: Node, title: String, width: int = 760, height: int = 560) -> Modal:
	var m := Modal.new()
	m.name = "Modal"
	parent.add_child(m)
	m._build(title, width, height)
	return m


func _build(title: String, width: int, height: int) -> void:
	_previous_focus = get_viewport().gui_get_focus_owner()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	process_mode = Node.PROCESS_MODE_ALWAYS
	var veil := ColorRect.new()
	veil.color = Color(0.05, 0.03, 0.08, 0.72)
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(veil)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)
	var frame := UiKit.panel("WoodPanel")
	frame.custom_minimum_size = Vector2(width, height)
	center.add_child(frame)
	var col := UiKit.vbox([], 10)
	frame.add_child(col)
	var head := UiKit.hbox()
	head.add_child(UiKit.label(title, "HeaderLabel"))
	head.add_child(UiKit.spacer())
	var close := UiKit.button("Fermer", "SecondaryButton")
	close.pressed.connect(close_modal)
	head.add_child(close)
	col.add_child(head)
	col.add_child(HSeparator.new())
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	content = UiKit.vbox([], 10)
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(content)
	UiKit.fade_in(self, 0.15)
	close.grab_focus.call_deferred()
	AudioDirector.play_sfx("page")


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("rideau_pause"):
		get_viewport().set_input_as_handled()
		close_modal()


func close_modal() -> void:
	closed.emit()
	if is_instance_valid(_previous_focus) and _previous_focus.is_inside_tree():
		_previous_focus.grab_focus()
	queue_free()

class_name WorldHud
extends Control
## Informations permanentes du monde explorable : période et saison,
## trésorerie, publics, rayonnement, objectif en cours, raccourcis.

signal menu_pressed
signal glossary_pressed
signal budget_pressed
signal reports_pressed

var _period: Label
var _place: Label
var _chips: HBoxContainer
var _objective: Label
var _objective_panel: PanelContainer
var _toast: PanelContainer
var _toast_text: Label
var _toast_tween: Tween
var _hint: Label


func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	# En haut à gauche : période, lieu, chiffres clés.
	var card := UiKit.panel("WoodPanel")
	card.position = Vector2(12, 10)
	card.mouse_filter = Control.MOUSE_FILTER_PASS
	add_child(card)
	var col := UiKit.vbox([], 2)
	card.add_child(col)
	_period = UiKit.label("", "SubHeaderLabel")
	col.add_child(_period)
	_place = UiKit.label("", "SmallLabel")
	col.add_child(_place)
	_chips = UiKit.hbox([], 14)
	col.add_child(_chips)
	# Objectif, en haut au centre-droit.
	_objective_panel = UiKit.panel("PaperPanel")
	_objective_panel.position = Vector2(1280 - 12 - 470 - 196, 10)
	_objective_panel.custom_minimum_size = Vector2(470, 0)
	_objective_panel.size = Vector2(470, 0)
	_objective_panel.mouse_filter = Control.MOUSE_FILTER_PASS
	add_child(_objective_panel)
	var orow := UiKit.hbox([UiKit.icon_rect("star", 24)], 8)
	_objective_panel.add_child(orow)
	_objective = UiKit.label("", "PaperLabel", true)
	orow.add_child(_objective)
	# Raccourcis, en haut à droite.
	var buttons := UiKit.hbox([], 4)
	buttons.position = Vector2(1280 - 12 - 180, 12)
	add_child(buttons)
	for spec: Array in [["question", "Carnet du directeur (F1)", glossary_pressed], ["cash", "Budget et trésorerie", budget_pressed],
			["chart", "Bilans des périodes", reports_pressed], ["gear", "Menu (Échap)", menu_pressed]]:
		var b := Button.new()
		b.icon = UiKit.icon(spec[0])
		b.tooltip_text = spec[1]
		b.accessibility_name = spec[1]
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(42, 42)
		b.expand_icon = true
		var sig: Signal = spec[2]
		b.pressed.connect(func() -> void:
			AudioDirector.play_sfx("click")
			sig.emit())
		buttons.add_child(b)
	# Aide aux commandes, en bas à gauche.
	_hint = UiKit.label("Flèches ou ZQSD : marcher   ·   Entrée / E : parler, utiliser   ·   Clic : aller   ·   Échap : menu", "SmallLabel")
	_hint.position = Vector2(14, 720 - 30)
	_hint.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	_hint.add_theme_constant_override("shadow_offset_x", 1)
	_hint.add_theme_constant_override("shadow_offset_y", 1)
	add_child(_hint)
	# Message éphémère.
	_toast = UiKit.panel("InsetPanel")
	_toast.visible = false
	_toast.position = Vector2(340, 610)
	_toast.custom_minimum_size = Vector2(600, 0)
	add_child(_toast)
	_toast_text = UiKit.label("", "", true)
	_toast_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast.add_child(_toast_text)


func refresh(session: GameSession, place: String, season_label: String, objective: String) -> void:
	var s := session.state
	_period.text = "Période %d / %d — %s · %s" % [s.turn, session.data.turns(), session.period_name(), season_label]
	_place.text = place
	UiKit.clear(_chips)
	var recv := Ledger.outstanding_total(s, Ledger.INCOME)
	var pay := Ledger.outstanding_total(s, Ledger.EXPENSE)
	_chips.add_child(_chip("cash", Format.money(s.cash), UiKit.CREAM if s.cash >= 0 else UiKit.BAD,
		"Trésorerie : l'argent disponible sur le compte.\nÀ recevoir plus tard : %s\nÀ payer plus tard : %s" % [Format.money(recv), Format.money(pay)]))
	_chips.add_child(_chip("people", "%d" % roundi(s.stat("fidelite")), UiKit.CREAM,
		"Fidélité des publics : %d / 100.\nSpectateurs depuis le début de la saison : %s." % [roundi(s.stat("fidelite")), Format.thousands(int(s.totals["attendance_total"]))]))
	_chips.add_child(_chip("star", "%d" % roundi(session.rayonnement()), UiKit.GOLD,
		"Rayonnement : réputation artistique, relations avec les partenaires et diversité des publics."))
	_objective.text = objective
	_hint.visible = s.turn <= 2


func _chip(icon_name: String, value: String, color: Color, tip: String) -> Control:
	var box := UiKit.hbox([UiKit.icon_rect(icon_name, 24)], 4)
	var v := UiKit.label(value, "NumberLabel")
	v.add_theme_color_override("font_color", color)
	box.add_child(v)
	box.tooltip_text = tip
	box.mouse_filter = Control.MOUSE_FILTER_STOP
	return box


func toast(message: String, kind: String = "info") -> void:
	_toast_text.text = message
	_toast.visible = true
	_toast.modulate.a = 1.0
	if kind == "error":
		AudioDirector.play_sfx("error")
	if _toast_tween:
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_interval(3.5 if kind != "warning" else 7.0)
	_toast_tween.tween_property(_toast, "modulate:a", 0.0, 0.4)
	_toast_tween.tween_callback(func() -> void: _toast.visible = false)

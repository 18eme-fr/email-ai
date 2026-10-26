extends Control
## Écran principal de gestion. Il affiche l'état du théâtre et héberge le
## panneau de l'étape en cours (situation, programmation, gestion, événement, bilan).

const STEPS := [
	["situation", "Situation"],
	["programmation", "Programme"],
	["gestion", "Gestion"],
	["evenement", "Événement"],
	["bilan", "Bilan"],
]

@onready var theatre: TheatreView = $Margin/Rows/Body/Left/TheatreFrame/TheatreView
@onready var overlay: Control = $Overlay
@onready var _chips: HBoxContainer = $Margin/Rows/TopBar/Items/Chips
@onready var _turn_label: Label = $Margin/Rows/TopBar/Items/Period/Turn
@onready var _period_label: Label = $Margin/Rows/TopBar/Items/Period/Name
@onready var _status: VBoxContainer = $Margin/Rows/Body/Left/Status/StatusRows
@onready var _stepper: HBoxContainer = $Margin/Rows/Body/Right/Rows/Stepper
@onready var _host: MarginContainer = $Margin/Rows/Body/Right/Rows/PhaseHost
@onready var _toast: PanelContainer = $Toast

var session: GameSession
var _toast_tween: Tween


func _ready() -> void:
	if not Game.has_game():
		# Lancement direct de la scène (éditeur) : on démarre une partie de démonstration.
		Game.session = GameSession.new()
		Game.session.new_game(1234, "standard")
	session = Game.session
	var items := $Margin/Rows/TopBar/Items
	items.get_node("Glossary").icon = UiKit.icon("question")
	items.get_node("Budget").icon = UiKit.icon("cash")
	items.get_node("Reports").icon = UiKit.icon("chart")
	items.get_node("Menu").icon = UiKit.icon("gear")
	items.get_node("Glossary").pressed.connect(func() -> void: GlossaryPanel.open(overlay))
	items.get_node("Budget").pressed.connect(func() -> void: BudgetPanel.open(overlay, session))
	items.get_node("Reports").pressed.connect(func() -> void: ReportsHistory.open(overlay, session))
	items.get_node("Menu").pressed.connect(open_pause)
	var journal := Button.new()
	journal.name = "Journal"
	journal.text = "Journal"
	journal.tooltip_text = "Missions, compétences, trophées (J)"
	journal.icon = UiKit.icon("book")
	journal.pressed.connect(open_journal)
	items.add_child(journal)
	items.move_child(journal, items.get_node("Glossary").get_index())
	for b: Button in [journal, items.get_node("Glossary"), items.get_node("Budget"), items.get_node("Reports"), items.get_node("Menu")]:
		b.pressed.connect(func() -> void: AudioDirector.play_sfx("click"))
		# Boutons compacts : icône seule, le libellé reste dans l'infobulle et pour les lecteurs d'écran.
		b.tooltip_text = "%s — %s" % [b.text, b.tooltip_text]
		b.accessibility_name = b.text
		b.text = ""
	Game.notice.connect(toast)
	AudioDirector.play_music("foyer")
	refresh_all()
	show_phase()
	var pending := Game.take_pending_notice()
	if pending != "":
		toast(pending, "warning")
	var s := session.state
	if s.turn == 1 and s.phase == GameState.PHASE_SITUATION and not s.tutorial_seen.has("case"):
		s.tutorial_seen["case"] = true
		CaseStudy.open.call_deferred(overlay, session)
	_show_notices()


func open_journal() -> void:
	JournalPanel.open(overlay, session, func() -> void:
		Game.autosave()
		refresh_all()
		_show_notices())


## Messages des missions, niveaux et trophées.
func _show_notices() -> void:
	var texts: Array = []
	for n: Dictionary in session.take_notices():
		texts.append(str(n["text"]))
	if not texts.is_empty():
		toast("\n".join(texts.slice(0, 3)), "warning")


func _unhandled_input(event: InputEvent) -> void:
	if overlay.get_child_count() > 0:
		return
	if event.is_action_pressed("rideau_pause"):
		get_viewport().set_input_as_handled()
		open_pause()
	elif event.is_action_pressed("rideau_glossary"):
		get_viewport().set_input_as_handled()
		GlossaryPanel.open(overlay)
	elif event.is_action_pressed("rideau_journal"):
		get_viewport().set_input_as_handled()
		open_journal()


# --- Rafraîchissement ---------------------------------------------------------

func refresh_all() -> void:
	var s := session.state
	_turn_label.text = "Période %d / %d" % [s.turn, session.data.turns()]
	_period_label.text = session.period_name()
	_refresh_chips()
	_refresh_status()
	_refresh_stepper()
	refresh_theatre()


func _refresh_chips() -> void:
	UiKit.clear(_chips)
	var s := session.state
	var cash_color := UiKit.CREAM if s.cash >= 0 else UiKit.BAD
	var recv := Ledger.outstanding_total(s, Ledger.INCOME)
	var pay := Ledger.outstanding_total(s, Ledger.EXPENSE)
	_chips.add_child(_chip("cash", "Trésorerie", Format.money(s.cash), cash_color,
		"Trésorerie : l'argent réellement disponible sur le compte.\nÀ recevoir plus tard : %s\nÀ payer plus tard : %s" % [Format.money(recv), Format.money(pay)]))
	_chips.add_child(_chip("people", "Publics", "%d" % roundi(s.stat("fidelite")), UiKit.CREAM,
		"Fidélité des publics : %d / 100.\nSpectateurs et participants depuis le début de la saison : %s." % [roundi(s.stat("fidelite")), Format.thousands(int(s.totals["attendance_total"]))]))
	_chips.add_child(_chip("star", "Rayonnement", "%d" % roundi(session.rayonnement()), UiKit.GOLD,
		"Rayonnement : réputation artistique (50 %%), relations avec les partenaires (25 %%) et diversité des publics (25 %%)."))


func _chip(icon_name: String, title: String, value: String, color: Color, tip: String) -> Control:
	var box := UiKit.hbox([UiKit.icon_rect(icon_name, 32)], 6)
	var col := UiKit.vbox([], -4)
	col.add_child(UiKit.label(title, "SmallLabel"))
	var v := UiKit.label(value, "NumberLabel")
	v.add_theme_color_override("font_color", color)
	col.add_child(v)
	box.add_child(col)
	box.tooltip_text = tip
	box.mouse_filter = Control.MOUSE_FILTER_STOP
	return box


func _refresh_status() -> void:
	UiKit.clear(_status)
	var head := UiKit.hbox([UiKit.label("État du théâtre", "SubHeaderLabel"), UiKit.spacer()])
	head.add_child(UiKit.notion_link("rayonnement", "Comprendre"))
	_status.add_child(head)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 18)
	grid.add_theme_constant_override("v_separation", 2)
	var tips := {
		"reputation": "Reconnaissance artistique du lieu par la critique et la profession.",
		"fidelite": "Envie des spectateurs de revenir. Augmente la fréquentation de tous les spectacles.",
		"diversite": "Variété des publics touchés (âges, quartiers, milieux).",
		"equipe": "Forme de l'équipe. Influence la qualité des représentations.",
		"equipement": "État du matériel et de la salle. Sous %d, risque d'incident sur les spectacles techniques." % int(session.data.balance["incident"]["threshold"]),
		"communication": "Visibilité de la programmation. S'estompe d'une période à l'autre.",
		"relations": "Confiance de la Ville et des partenaires.",
	}
	for id: String in ["reputation", "fidelite", "diversite", "relations", "equipe", "equipement", "communication"]:
		var g := UiKit.gauge(id, session.state.stat(id), tips[id])
		g.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		grid.add_child(g)
	_status.add_child(grid)
	var obj_row := UiKit.hbox([], 10)
	obj_row.add_child(UiKit.label("Convention :", "SmallLabel"))
	for obj: Dictionary in SeasonEvaluator.objectives(session.data, session.state):
		var mark := UiKit.icon_rect("check" if obj["met"] else "lock", 20)
		var text := _objective_short(obj)
		var l := UiKit.label(text, "SmallLabel")
		if obj["met"]:
			l.add_theme_color_override("font_color", UiKit.GOOD)
		var cell := UiKit.hbox([mark, l], 2)
		cell.tooltip_text = "%s\nActuellement : %s" % [obj["label"], _objective_value(obj)]
		cell.mouse_filter = Control.MOUSE_FILTER_STOP
		obj_row.add_child(cell)
	_status.add_child(obj_row)


static func _objective_short(obj: Dictionary) -> String:
	match str(obj["id"]):
		"equilibre":
			return "Trésorerie ≥ 0"
		"publics":
			return "%s / %s entrées" % [Format.thousands(int(obj["value"])), Format.thousands(int(obj["target"]))]
		"eac":
			return "EAC %d/%d" % [int(obj["value"]), int(obj["target"])]
		"exigence":
			return "Exigence %d/%d" % [int(obj["value"]), int(obj["target"])]
	return str(obj["label"])


static func _objective_value(obj: Dictionary) -> String:
	if obj["id"] == "equilibre":
		return Format.money(int(obj["value"]))
	return Format.thousands(int(obj["value"]))


func _refresh_stepper() -> void:
	UiKit.clear(_stepper)
	var phase := session.state.phase
	if phase == GameState.PHASE_FINISHED:
		phase = GameState.PHASE_REPORT
	var reached := true
	for step: Array in STEPS:
		var active: bool = step[0] == phase
		var chip := UiKit.panel("InsetPanel" if not active else "PaperPanel")
		var l := UiKit.label(step[1], "SmallLabel" if not active else "PaperLabel")
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if not active and not reached:
			l.add_theme_color_override("font_color", Color("908aa6"))
		chip.add_child(l)
		chip.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_stepper.add_child(chip)
		if active:
			reached = false


func refresh_theatre() -> void:
	var s := session.state
	match s.phase:
		GameState.PHASE_EVENT:
			theatre.set_hall(0.0, 0.0, false)
		GameState.PHASE_REPORT, GameState.PHASE_FINISHED:
			var att := 0.0
			if not session.last_report.is_empty():
				att = _report_fill(session.last_report)
			theatre.set_hall(att, 1.0, true, 0.8)
		_:
			var textures: Array[Texture2D] = []
			for entry: Dictionary in s.programmed:
				textures.append(UiKit.poster(entry["show_id"]))
			theatre.set_facade(textures)


func _report_fill(report: Dictionary) -> float:
	var best := 0.0
	for sh: Dictionary in report.get("shows", []):
		if not sh.get("cancelled", false) and sh.get("capacity_total", 0) > 0:
			if session.data.shows.get(sh["show_id"], {}).get("format", "") == "salle":
				best = maxf(best, float(sh["fill"]))
	return best


## Affiche le panneau correspondant à l'étape en cours.
func show_phase() -> void:
	UiKit.clear(_host)
	var s := session.state
	if s.phase == GameState.PHASE_FINISHED and s.reports.size() == 0:
		Game.go_to_end()
		return
	var panel: Control
	match s.phase:
		GameState.PHASE_SITUATION:
			panel = SituationPanel.new()
		GameState.PHASE_PROGRAMMING:
			panel = ProgrammingPanel.new()
		GameState.PHASE_MANAGEMENT:
			panel = ActionsPanel.new()
		GameState.PHASE_EVENT:
			panel = EventPanel.new()
		_:
			panel = ReportPanel.new()
	panel.set("screen", self)
	_host.add_child(panel)
	UiKit.fade_in(panel)


## Appelé par les panneaux quand le joueur valide une étape.
func advance() -> void:
	Game.autosave()
	refresh_all()
	show_phase()
	_show_notices()


func toast(message: String, kind: String = "info") -> void:
	_toast.get_node("Text").text = message
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


func open_pause() -> void:
	var m := Modal.open(overlay, "Pause", 460, 420)
	var resume := UiKit.button("Reprendre", "GoldButton", "play")
	resume.pressed.connect(m.close_modal)
	var save := UiKit.button("Enregistrer la partie", "", "save")
	save.pressed.connect(func() -> void:
		var r := Game.saves.save(session.state)
		toast(str(r["message"]), "info" if r["status"] == SaveSystem.Status.OK else "error"))
	var settings := UiKit.button("Paramètres", "SecondaryButton", "gear")
	settings.pressed.connect(func() -> void: SettingsPanel.open(overlay))
	var menu := UiKit.button("Retour au menu principal", "SecondaryButton")
	menu.pressed.connect(func() -> void: Game.go_to_menu())
	for b in [resume, save, settings, menu]:
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		m.content.add_child(b)
	m.content.add_child(UiKit.label("La partie est enregistrée automatiquement au début de chaque étape.", "SmallLabel", true))
	resume.grab_focus.call_deferred()

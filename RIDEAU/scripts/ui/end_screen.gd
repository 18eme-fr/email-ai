extends Control
## Fin de saison : bilan, décisions marquantes, enseignements, rejouer.

const TONE_COLORS := {"great": Color("f0d48a"), "good": Color("8fd19e"), "mixed": Color("e3b341"), "bad": Color("f08a8a")}

@onready var _rows: VBoxContainer = $Margin/Frame/Rows

var session: GameSession


func _ready() -> void:
	if not Game.has_game():
		var demo := GameSession.new()
		demo.new_game(77, "standard")
		StrategyBot.new("equilibre", 77).play_season(demo)
		Game.session = demo
	session = Game.session
	var s := session.state
	var pending := Game.take_pending_notice()
	if s.ending.is_empty():
		s.ending = SeasonEvaluator.evaluate(session.data, s)
	var e := s.ending
	AudioDirector.play_music("theme")
	AudioDirector.clear_ambience()
	AudioDirector.play_sfx("applause" if e.get("renewed", false) else "curtain")

	var head := UiKit.hbox([], 16)
	var title := UiKit.label(str(e.get("title", "Fin de saison")), "TitleLabel")
	title.add_theme_font_size_override("font_size", 44)
	title.add_theme_color_override("font_color", TONE_COLORS.get(e.get("tone", "mixed"), Color.WHITE))
	head.add_child(title)
	head.add_child(UiKit.spacer())
	var score := UiKit.label("Score %d / 100" % int(e.get("score", 0)), "HeaderLabel")
	score.tooltip_text = "Indicatif : objectifs de la convention, rayonnement et fidélité."
	head.add_child(score)
	_rows.add_child(head)

	var verdict := UiKit.panel("PaperPanel")
	var vrow := UiKit.hbox([], 12)
	verdict.add_child(vrow)
	var who := "helene" if s.bankrupt else "pommier"
	var p := TextureRect.new()
	p.texture = UiKit.portrait(who, "worried" if not e.get("renewed", false) else "happy")
	p.custom_minimum_size = Vector2(72, 72)
	p.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	vrow.add_child(p)
	var vt := UiKit.rich("[b]%s[/b]  %s\n[color=#5a4636]%s[/color]" % [
		"Convention renouvelée !" if e.get("renewed", false) else ("Faillite." if s.bankrupt else "Convention non renouvelée."),
		e.get("text", ""), "Scénario « %s », mode %s, graine %d." % [session.scenario().get("title", ""), session.data.difficulty(s.difficulty).get("label", s.difficulty), s.game_seed]])
	vt.theme_type_variation = "PaperRichText"
	vt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vrow.add_child(vt)
	_rows.add_child(verdict)
	if pending != "":
		var warn := UiKit.label(pending, "MutedLabel", true)
		warn.add_theme_color_override("font_color", UiKit.BAD)
		_rows.add_child(warn)

	var cols := UiKit.hbox([], 14)
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_rows.add_child(cols)
	var left := UiKit.vbox([], 6)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(left)
	var right_scroll := ScrollContainer.new()
	right_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	cols.add_child(right_scroll)
	var right := UiKit.vbox([], 6)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_scroll.add_child(right)

	left.add_child(UiKit.label("Objectifs de la convention", "SubHeaderLabel"))
	for obj: Dictionary in e.get("objectives", []):
		var value := Format.money(int(obj["value"])) if obj["id"] == "equilibre" else Format.thousands(int(obj["value"]))
		left.add_child(UiKit.hbox([UiKit.icon_rect("check" if obj["met"] else "cross", 24), UiKit.label("%s — %s" % [obj["label"], value], "", true)]))
	left.add_child(UiKit.rich("Trésorerie finale [b]%s[/b] · Entrées [b]%s[/b] · Rayonnement [b]%d[/b] · Fidélité [b]%d[/b] · Diversité [b]%d[/b]" % [
		Format.money(s.cash), Format.thousands(int(s.totals["attendance_total"])), roundi(Rules.rayonnement(session.data, s)), roundi(s.stat("fidelite")), roundi(s.stat("diversite"))]))
	var chart := LineChart.new()
	chart.custom_minimum_size = Vector2(520, 110)
	var pts: Array[float] = [float(session.starting_cash())]
	var att: Array[float] = []
	for h: Dictionary in s.history:
		pts.append(float(h["cash"]))
		att.append(float(h["attendance"]))
	chart.series = pts
	chart.title = "Trésorerie (début, puis fin de chaque période)"
	left.add_child(chart)
	if att.size() >= 2:
		var chart2 := LineChart.new()
		chart2.custom_minimum_size = Vector2(520, 84)
		chart2.series = att
		chart2.labels_from = 1
		chart2.zero_line = false
		chart2.color = Color("8fd19e")
		chart2.title = "Entrées par période"
		left.add_child(chart2)

	# La création avec Victor Lazare et la première à Paris.
	var paris: Dictionary = s.creation.get("paris", {})
	right.add_child(UiKit.label("La création, à Paris", "SubHeaderLabel"))
	if paris.is_empty():
		right.add_child(UiKit.label("La troupe est invitée à jouer « %s » au Théâtre des Lumières. %d / %d décisions prises avec Victor Lazare." % [
			CreationSystem.show_title(session.data, s), CreationSystem.choices(s).size(), CreationSystem.steps(session.data).size()], "", true))
		var trip := UiKit.button("Prendre le train pour Paris", "", "play")
		trip.pressed.connect(func() -> void: Game.start_paris_trip())
		right.add_child(trip)
	else:
		right.add_child(UiKit.rich("[b]« %s »[/b] — %s (%d rappel%s, accueil %d / 100)\n[i]%s[/i]" % [
			paris.get("show", ""), paris.get("title", ""), int(paris.get("calls", 1)), "s" if int(paris.get("calls", 1)) > 1 else "",
			int(paris.get("score", 0)), paris.get("critic", "")]))
	right.add_child(HSeparator.new())
	right.add_child(UiKit.label("Décisions marquantes", "SubHeaderLabel"))
	for d: Dictionary in _key_decisions(s):
		right.add_child(UiKit.label("Période %d · %s" % [int(d["turn"]), d["text"]], "SmallLabel", true))
	right.add_child(HSeparator.new())
	var done := MissionSystem.with_status(s, "done").size()
	var failed := MissionSystem.with_status(s, "failed").size()
	right.add_child(UiKit.label("Missions, compétences, trophées", "SubHeaderLabel"))
	right.add_child(UiKit.label("Missions réussies : %d · échouées : %d · trophées : %d / %d" % [done, failed, s.achievements.size(), session.data.achievements.size()], "", true))
	var skills: Array = []
	for skill: String in session.data.skill_order:
		skills.append("%s %d" % [session.data.skills[skill]["label"], SkillSystem.level(session.data, s, skill)])
	right.add_child(UiKit.label("Niveaux : " + ", ".join(skills), "SmallLabel", true))
	var report_b := UiKit.button("Télécharger le rapport de saison", "", "save")
	report_b.tooltip_text = "Rapport complet (Markdown) : verdict, périodes, missions, dossiers, compétences, notions, questions de débriefing. À remettre à votre enseignant·e."
	var report_msg := UiKit.label("", "SmallLabel", true)
	report_b.pressed.connect(func() -> void:
		report_msg.text = Game.export_report()
		_show_report_text())
	right.add_child(report_b)
	right.add_child(report_msg)
	var journal := UiKit.button("Journal de bord", "SecondaryButton", "book")
	journal.pressed.connect(func() -> void: JournalPanel.open(self, session, Callable(), "trophees"))
	right.add_child(journal)
	right.add_child(HSeparator.new())
	right.add_child(UiKit.label("Ce que cette saison vous a appris", "SubHeaderLabel"))
	for lesson: String in e.get("lessons", []):
		right.add_child(UiKit.label("• " + lesson, "", true))

	var footer := UiKit.hbox()
	var menu := UiKit.button("Menu principal", "SecondaryButton")
	menu.pressed.connect(func() -> void:
		Game.saves.delete()
		get_tree().change_scene_to_file(Game.MAIN_MENU))
	footer.add_child(menu)
	footer.add_child(UiKit.spacer())
	var same := UiKit.button("Rejouer la même saison", "SecondaryButton")
	same.tooltip_text = "Même graine : mêmes propositions et mêmes imprévus, pour tester une autre stratégie."
	same.pressed.connect(func() -> void: Game.new_game(s.difficulty, s.game_seed, s.scenario))
	footer.add_child(same)
	var again := UiKit.primary("Nouvelle saison")
	again.pressed.connect(func() -> void: Game.new_game(s.difficulty, -1, s.scenario))
	footer.add_child(again)
	_rows.add_child(footer)
	again.grab_focus.call_deferred()


## Le rapport affiché en clair, sélectionnable (pour le copier si le téléchargement est bloqué).
func _show_report_text() -> void:
	var m := Modal.open(self, "Rapport de saison", 980, 640)
	var edit := TextEdit.new()
	edit.text = SeasonReport.markdown(session)
	edit.editable = false
	edit.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	edit.custom_minimum_size = Vector2(920, 470)
	m.content.add_child(edit)
	var copy := UiKit.button("Copier le texte", "", "save")
	copy.pressed.connect(func() -> void:
		DisplayServer.clipboard_set(edit.text)
		copy.text = "Copié !")
	m.content.add_child(copy)


## Les choix d'événements, plus le meilleur et le pire spectacle de la saison.
func _key_decisions(s: GameState) -> Array:
	var out: Array = []
	for d: Dictionary in s.key_decisions:
		if d.get("kind", "") != "show":
			out.append(d)
	var best := {}
	var worst := {}
	for r: Dictionary in s.reports:
		for sh: Dictionary in r.get("shows", []):
			if sh.get("cancelled", false):
				continue
			var m := int(sh["finance"]["margin"])
			if best.is_empty() or m > int(best["m"]):
				best = {"m": m, "t": sh["title"], "turn": r["turn"]}
			if worst.is_empty() or m < int(worst["m"]):
				worst = {"m": m, "t": sh["title"], "turn": r["turn"]}
	if not best.is_empty():
		out.append({"turn": best["turn"], "text": "Meilleure marge : « %s » (%s)" % [best["t"], Format.signed_money(best["m"])]})
		if int(worst["m"]) < 0:
			out.append({"turn": worst["turn"], "text": "Plus gros déficit : « %s » (%s)" % [worst["t"], Format.signed_money(worst["m"])]})
	out.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a["turn"]) < int(b["turn"]))
	return out

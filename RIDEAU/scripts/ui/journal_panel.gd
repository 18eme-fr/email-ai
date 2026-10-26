class_name JournalPanel
extends RefCounted
## « Journal de bord » : missions (proposées, en cours, terminées), compétences
## et entraînement aux dossiers, trophées, étude de cas de la saison.
## `on_change` est appelé quand une décision modifie la partie (acceptation, dossier).

const TABS := [["missions", "Missions"], ["competences", "Compétences"], ["trophees", "Trophées"], ["saison", "La saison"]]


static func open(parent: Node, session: GameSession, on_change: Callable = Callable(), tab: String = "missions") -> Modal:
	var m := Modal.open(parent, "Journal de bord", 960, 660)
	var tabs := UiKit.hbox([], 4)
	m.content.add_child(tabs)
	var body := UiKit.vbox([], 8)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	m.content.add_child(body)
	var group := ButtonGroup.new()
	# Les lambdas capturent les variables par valeur : on passe par un tableau pour pouvoir se rappeler.
	var holder: Array = []
	var show := func(id: String) -> void:
		UiKit.clear(body)
		match id:
			"missions":
				_missions(body, parent, session, on_change, func() -> void: holder[0].call("missions"))
			"competences":
				_skills(body, parent, session, on_change)
			"trophees":
				_trophies(body, session)
			_:
				_season(body, session)
	for t: Array in TABS:
		var b := UiKit.button(t[1], "SecondaryButton")
		b.toggle_mode = true
		b.button_group = group
		b.button_pressed = t[0] == tab
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var id: String = t[0]
		b.pressed.connect(func() -> void: show.call(id))
		tabs.add_child(b)
	holder.append(show)
	show.call(tab)
	return m


static func _deadline_text(session: GameSession, m: Dictionary) -> String:
	var left := int(m.get("deadline", session.state.turn)) - session.state.turn
	if left <= 0:
		return "échéance : fin de cette période"
	return "échéance : fin de la période %d (encore %d période%s)" % [int(m["deadline"]), left + 1, "s" if left + 1 > 1 else ""]


static func _missions(body: VBoxContainer, parent: Node, session: GameSession, on_change: Callable, refresh: Callable) -> void:
	var data := session.data
	var s := session.state
	var offered := MissionSystem.with_status(s, "offered")
	var active := MissionSystem.with_status(s, "active")
	body.add_child(UiKit.label("En cours (%d / %d)" % [active.size(), data.missions_max_active], "SubHeaderLabel"))
	if active.is_empty():
		body.add_child(UiKit.label("Aucune mission en cours. Acceptez-en une ci-dessous, ou parlez aux personnages qui ont une bulle « ? ».", "SmallLabel", true))
	for id: String in active:
		var def: Dictionary = data.missions[id]
		var card := _card(def, data)
		var col: VBoxContainer = card.get_child(0).get_child(1)
		var prog := MissionSystem.progress(data, s, id)
		col.add_child(UiKit.label("Objectif : %s — %s" % [def["goal"].get("text", ""), prog["text"]], "PaperLabel", true))
		var bar := ProgressBar.new()
		bar.value = float(prog["ratio"]) * 100.0
		bar.show_percentage = false
		bar.custom_minimum_size.y = 10
		col.add_child(bar)
		col.add_child(UiKit.label("%s · récompense : %s" % [_deadline_text(session, s.missions[id]), MissionSystem.reward_text(data, def.get("reward", {}))], "PaperLabel", true))
		if def["goal"]["kind"] == "dossier":
			var open_b := UiKit.button("Ouvrir le dossier", "GoldButton", "book")
			open_b.pressed.connect(func() -> void:
				DossierPanel.open(parent, session, str(def["goal"]["dossier"]), false, func(_r: Dictionary) -> void:
					if on_change.is_valid():
						on_change.call()
					refresh.call()))
			col.add_child(open_b)
		body.add_child(card)
	if not offered.is_empty():
		body.add_child(UiKit.label("Proposées", "SubHeaderLabel"))
	for id: String in offered:
		var def: Dictionary = data.missions[id]
		var card := _card(def, data)
		var col: VBoxContainer = card.get_child(0).get_child(1)
		col.add_child(UiKit.label("« %s »" % def["pitch"], "PaperLabel", true))
		var duration := "jusqu'à la période %d" % int(def["deadline_turn"]) if def.has("deadline_turn") else "%d période%s" % [int(def["duration"]), "s" if int(def["duration"]) > 1 else ""]
		col.add_child(UiKit.label("Objectif : %s · délai : %s · récompense : %s" % [def["goal"].get("text", ""), duration, MissionSystem.reward_text(data, def.get("reward", {}))], "PaperLabel", true))
		var row := UiKit.hbox()
		var accept := UiKit.button("Accepter", "GoldButton", "check")
		var err_label := UiKit.label("", "SmallLabel", true)
		err_label.add_theme_color_override("font_color", UiKit.BAD)
		accept.pressed.connect(func() -> void:
			var err := session.accept_mission(id)
			if err != "":
				err_label.text = err
				AudioDirector.play_sfx("error")
				return
			AudioDirector.play_sfx("confirm")
			if on_change.is_valid():
				on_change.call()
			refresh.call())
		var decline := UiKit.button("Refuser", "SecondaryButton")
		decline.pressed.connect(func() -> void:
			session.decline_mission(id)
			if on_change.is_valid():
				on_change.call()
			refresh.call())
		row.add_child(accept)
		row.add_child(decline)
		row.add_child(err_label)
		col.add_child(row)
		body.add_child(card)
	var ended: Array = MissionSystem.with_status(s, "done") + MissionSystem.with_status(s, "failed")
	if not ended.is_empty():
		body.add_child(UiKit.label("Terminées", "SubHeaderLabel"))
	for id: String in ended:
		var def: Dictionary = data.missions[id]
		var ok: bool = s.missions[id]["status"] == "done"
		var line := UiKit.hbox([UiKit.icon_rect("check" if ok else "cross", 20)], 6)
		var l := UiKit.rich("[b]%s[/b] — %s [color=#b9b0c8]À retenir : %s[/color]" % [def["title"], "réussie" if ok else "échouée", def["takeaway"]])
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		line.add_child(l)
		body.add_child(line)


static func _card(def: Dictionary, data: GameData) -> PanelContainer:
	var card := UiKit.panel("PaperPanel")
	var row := UiKit.hbox([], 10)
	card.add_child(row)
	var p := TextureRect.new()
	p.texture = UiKit.portrait(str(def["giver"]))
	p.custom_minimum_size = Vector2(56, 56)
	p.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	p.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	p.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	row.add_child(p)
	var col := UiKit.vbox([], 2)
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(col)
	var head := UiKit.hbox([UiKit.label(str(def["title"]), "PaperTitleLabel", true)])
	head.add_child(UiKit.label(data.character_name(str(def["giver"])), "PaperLabel"))
	head.add_child(UiKit.notion_link(str(def.get("notion", "")), "?", true))
	col.add_child(head)
	return card


static func _skills(body: VBoxContainer, parent: Node, session: GameSession, on_change: Callable) -> void:
	var data := session.data
	var s := session.state
	body.add_child(UiKit.label("Vos compétences progressent avec les missions et les dossiers. Chaque niveau débloque un avantage.", "SmallLabel", true))
	for skill: String in data.skill_order:
		var def: Dictionary = data.skills[skill]
		var lvl := SkillSystem.level(data, s, skill)
		var next := SkillSystem.next_threshold(data, s, skill)
		var box := UiKit.panel("InsetPanel")
		var col := UiKit.vbox([], 2)
		box.add_child(col)
		var head := UiKit.hbox([UiKit.icon_rect(str(def.get("icon", "star")), 24), UiKit.label("%s — niveau %d" % [def["label"], lvl], "SubHeaderLabel"), UiKit.spacer()])
		head.add_child(UiKit.label("%d XP%s" % [SkillSystem.xp(s, skill), (" / %d" % next) if next > 0 else " (niveau maximal)"], "SmallLabel"))
		col.add_child(head)
		var bar := ProgressBar.new()
		bar.show_percentage = false
		bar.custom_minimum_size.y = 8
		bar.value = 100.0 if next < 0 else 100.0 * SkillSystem.xp(s, skill) / float(next)
		col.add_child(bar)
		col.add_child(UiKit.label(str(def["description"]), "SmallLabel", true))
		var perks: Dictionary = def.get("perks", {})
		for key: String in perks:
			var unlocked := int(key) <= lvl
			var pl := UiKit.label("%s Niveau %s — %s : %s" % ["✓" if unlocked else "·", key, perks[key]["label"], perks[key]["text"]], "SmallLabel", true)
			if unlocked:
				pl.add_theme_color_override("font_color", UiKit.GOOD)
			col.add_child(pl)
		body.add_child(box)
	body.add_child(UiKit.label("S'entraîner aux dossiers", "SubHeaderLabel"))
	body.add_child(UiKit.label("Sans enjeu ni expérience : de nouveaux chiffres à chaque essai.", "SmallLabel", true))
	var grid := GridContainer.new()
	grid.columns = 3
	for id: String in Dossiers.CATALOG:
		var b := UiKit.button(str(Dossiers.CATALOG[id]["title"]), "SecondaryButton", "book")
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func() -> void: DossierPanel.open(parent, session, id, true))
		grid.add_child(b)
	body.add_child(grid)


static func _trophies(body: VBoxContainer, session: GameSession) -> void:
	var s := session.state
	body.add_child(UiKit.label("%d trophée(s) sur %d" % [s.achievements.size(), session.data.achievements.size()], "SubHeaderLabel"))
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 12)
	for a: Dictionary in session.data.achievements:
		var won: bool = a["id"] in s.achievements
		var box := UiKit.panel("PaperPanel" if won else "InsetPanel")
		box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var icon := UiKit.icon_rect(str(a["icon"]) if won else "lock", 32)
		var col := UiKit.vbox([UiKit.label(str(a["title"]), "PaperTitleLabel" if won else "SubHeaderLabel"), UiKit.label(str(a["text"]), "PaperLabel" if won else "SmallLabel", true)], 0)
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		box.add_child(UiKit.hbox([icon, col], 8))
		grid.add_child(box)
	body.add_child(grid)


static func _season(body: VBoxContainer, session: GameSession) -> void:
	CaseStudy.fill(body, session)

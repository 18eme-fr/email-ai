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
	if s.ending.is_empty():
		s.ending = SeasonEvaluator.evaluate(session.data, s)
	var e := s.ending
	AudioDirector.play_music("theme")
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
		e.get("text", ""), "Saison jouée en mode %s, graine %d." % [session.data.difficulty(s.difficulty).get("label", s.difficulty), s.game_seed]])
	vt.theme_type_variation = "PaperRichText"
	vt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vrow.add_child(vt)
	_rows.add_child(verdict)

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
	var pts: Array[float] = [float(session.data.balance["start"]["cash"]) * float(session.data.difficulty(s.difficulty).get("cash_mult", 1.0))]
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

	right.add_child(UiKit.label("Décisions marquantes", "SubHeaderLabel"))
	for d: Dictionary in _key_decisions(s):
		right.add_child(UiKit.label("Période %d · %s" % [int(d["turn"]), d["text"]], "SmallLabel", true))
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
	same.pressed.connect(func() -> void: Game.new_game(s.difficulty, s.game_seed))
	footer.add_child(same)
	var again := UiKit.primary("Nouvelle saison")
	again.pressed.connect(func() -> void: Game.new_game(s.difficulty))
	footer.add_child(again)
	_rows.add_child(footer)
	again.grab_focus.call_deferred()


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
		out.append({"turn": worst["turn"], "text": "Plus gros déficit : « %s » (%s)" % [worst["t"], Format.signed_money(worst["m"])]})
	out.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a["turn"]) < int(b["turn"]))
	return out

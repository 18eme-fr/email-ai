class_name DossierPanel
extends RefCounted
## Fenêtre d'un dossier de compétences : questions, puis correction expliquée,
## expérience gagnée et missions éventuellement réussies.


static func open(parent: Node, session: GameSession, dossier_id: String, practice: bool = false, on_done: Callable = Callable()) -> Modal:
	var dossier := session.open_dossier(dossier_id, practice)
	var title := "%s%s" % [dossier["title"], " — entraînement" if practice else ""]
	var m := Modal.open(parent, title, 960, 660)
	var answers := {}
	var c := m.content
	var intro := UiKit.rich(str(dossier["intro"]))
	c.add_child(UiKit.panel("InsetPanel", intro))
	var questions := UiKit.vbox([], 10)
	c.add_child(questions)
	var n := 1
	for item: Dictionary in dossier["items"]:
		questions.add_child(_question(item, n, answers))
		n += 1
	var footer := UiKit.hbox([UiKit.notion_link(str(dossier["notion"]), "Revoir la notion"), UiKit.spacer()])
	var hint := UiKit.label("Répondez à toutes les questions.", "SmallLabel")
	footer.add_child(hint)
	var submit := UiKit.primary("Rendre le dossier", "check")
	footer.add_child(submit)
	c.add_child(footer)
	submit.pressed.connect(func() -> void:
		if answers.size() < (dossier["items"] as Array).size():
			hint.add_theme_color_override("font_color", UiKit.BAD)
			AudioDirector.play_sfx("error")
			return
		var result := session.submit_dossier(dossier, answers)
		AudioDirector.play_sfx("confirm" if float(result["score"]) >= 0.6 else "cancel")
		UiKit.clear(c)
		_show_result(c, session, dossier, answers, result)
		if on_done.is_valid():
			on_done.call(result))
	return m


static func _question(item: Dictionary, n: int, answers: Dictionary) -> Control:
	var box := UiKit.panel("PaperPanel")
	var col := UiKit.vbox([], 4)
	box.add_child(col)
	var prompt := UiKit.label("%d. %s" % [n, item["prompt"]], "PaperLabel", true)
	col.add_child(prompt)
	var id: String = item["id"]
	match str(item["kind"]):
		"choice":
			var group := ButtonGroup.new()
			for i in (item["options"] as Array).size():
				var cb := CheckBox.new()
				cb.text = str(item["options"][i])
				cb.button_group = group
				cb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
				cb.add_theme_color_override("font_color", UiKit.INK)
				cb.add_theme_color_override("font_hover_color", Color("7a1a2e"))
				cb.add_theme_color_override("font_pressed_color", Color("7a1a2e"))
				cb.add_theme_color_override("font_focus_color", Color("7a1a2e"))
				var idx := i
				cb.toggled.connect(func(on: bool) -> void:
					if on:
						answers[id] = idx)
				col.add_child(cb)
		"number":
			var row := UiKit.hbox()
			var spin := SpinBox.new()
			spin.min_value = 0
			spin.max_value = 100000
			spin.step = 1
			spin.custom_minimum_size.x = 160
			spin.value_changed.connect(func(v: float) -> void: answers[id] = v)
			row.add_child(spin)
			var unit := UiKit.label(str(item.get("unit", "")), "PaperLabel")
			row.add_child(unit)
			col.add_child(row)
		"multi":
			var total := UiKit.label("Total des contreparties : 0 €", "PaperLabel")
			var selected: Array = []
			for i in (item["options"] as Array).size():
				var opt: Dictionary = item["options"][i]
				var cb := CheckBox.new()
				cb.text = "%s — %s" % [opt["label"], Format.money(int(opt["value"]))]
				cb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
				cb.add_theme_color_override("font_color", UiKit.INK)
				cb.add_theme_color_override("font_hover_color", Color("7a1a2e"))
				cb.add_theme_color_override("font_pressed_color", Color("7a1a2e"))
				var idx := i
				cb.toggled.connect(func(on: bool) -> void:
					if on:
						selected.append(idx)
					else:
						selected.erase(idx)
					var sum := 0
					for k: int in selected:
						sum += int(item["options"][k]["value"])
					total.text = "Total des contreparties : %s" % Format.money(sum)
					if selected.is_empty():
						answers.erase(id)
					else:
						answers[id] = selected.duplicate())
				col.add_child(cb)
			col.add_child(total)
	return box


static func _show_result(c: VBoxContainer, session: GameSession, dossier: Dictionary, answers: Dictionary, result: Dictionary) -> void:
	var score := roundi(float(result["score"]) * 100)
	var head := UiKit.label("Score : %d %% (%d / %d)" % [score, int(result["correct"]), int(result["total"])], "HeaderLabel")
	head.add_theme_color_override("font_color", UiKit.GOOD if score >= 60 else UiKit.BAD)
	c.add_child(head)
	if int(result.get("xp", 0)) > 0:
		c.add_child(UiKit.label("+%d XP en %s" % [int(result["xp"]), str(session.data.skills[dossier["skill"]]["label"]).to_lower()], "SubHeaderLabel"))
	elif dossier.get("practice", false):
		c.add_child(UiKit.label("Entraînement : pas d'expérience gagnée, mais de nouveaux chiffres à chaque essai.", "SmallLabel", true))
	for o: Dictionary in result.get("missions", []):
		var p := UiKit.panel("PaperPanel")
		var col := UiKit.vbox([], 2)
		p.add_child(col)
		col.add_child(UiKit.label("Mission réussie : « %s »" % o["title"], "PaperTitleLabel", true))
		col.add_child(UiKit.label("%s %s" % [o["text"], ("(%s)" % o["reward"]) if o["reward"] != "" else ""], "PaperLabel", true))
		c.add_child(p)
	var n := 1
	for r: Dictionary in result["results"]:
		var item: Dictionary = {}
		for it: Dictionary in dossier["items"]:
			if it["id"] == r["id"]:
				item = it
		var box := UiKit.panel("InsetPanel")
		var col := UiKit.vbox([], 2)
		box.add_child(col)
		var mark := UiKit.icon_rect("check" if r["correct"] else "cross", 20)
		col.add_child(UiKit.hbox([mark, UiKit.label("%d. %s" % [n, item.get("prompt", "")], "", true)], 6))
		if not r["correct"]:
			col.add_child(UiKit.label("Réponse attendue : %s" % r["expected"], "SmallLabel", true))
		col.add_child(UiKit.rich(str(r["explain"])))
		c.add_child(box)
		n += 1
	var take := UiKit.panel("PaperPanel")
	var tr := UiKit.rich("[b]À retenir.[/b] %s" % dossier["takeaway"])
	tr.theme_type_variation = "PaperRichText"
	take.add_child(tr)
	c.add_child(take)

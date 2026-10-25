class_name ProgrammingPanel
extends VBoxContainer
## Étape 2 : choisir les spectacles de la période parmi les propositions reçues.

var screen: Node
var session: GameSession
var selected: Array = []      ## [{show_id, price_level}]
var prices := {}              ## show_id -> niveau de tarif
var current := ""

var _cards: HBoxContainer
var _detail: VBoxContainer
var _summary: RichTextLabel
var _error: Label
var _validate: Button


func _ready() -> void:
	session = screen.session
	add_theme_constant_override("separation", 6)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	for entry: Dictionary in session.state.programmed:
		selected.append(entry.duplicate())
		prices[entry["show_id"]] = entry["price_level"]
	var head := UiKit.hbox([UiKit.label("Programmation", "HeaderLabel"), UiKit.spacer(), UiKit.notion_link("programmation", "Programmer ?")])
	head.tooltip_text = "Propositions reçues pour %s. Cliquez sur une affiche pour lire sa fiche." % session.period_name().to_lower()
	add_child(head)
	_cards = UiKit.hbox([], 5)
	add_child(_cards)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	_detail = UiKit.vbox([], 6)
	_detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_detail)
	_summary = UiKit.rich("")
	_summary.add_theme_font_size_override("normal_font_size", 15)
	_summary.add_theme_font_size_override("bold_font_size", 15)
	add_child(_summary)
	_error = UiKit.label("", "MutedLabel", true)
	_error.add_theme_color_override("font_color", UiKit.BAD)
	_error.visible = false
	add_child(_error)
	var footer := UiKit.hbox()
	var back := UiKit.button("Retour", "SecondaryButton")
	back.pressed.connect(func() -> void:
		session.state.phase = GameState.PHASE_SITUATION
		screen.advance())
	footer.add_child(back)
	footer.add_child(UiKit.spacer())
	_validate = UiKit.primary("Valider la programmation")
	_validate.pressed.connect(_on_validate)
	footer.add_child(_validate)
	add_child(footer)
	_build_cards()
	if not session.state.offers.is_empty():
		_show_detail(str(session.state.offers[0]))
	if session.state.turn == 1 and not session.state.tutorial_seen.has("programming") and bool(Settings.get_value("show_tutorial")):
		var box := DialogueBox.new()
		_detail.add_child(box)
		_detail.move_child(box, 0)
		box.finished.connect(func() -> void:
			session.state.tutorial_seen["programming"] = true
			box.queue_free())
		box.start(load("res://dialogue/story.dialogue"), "first_programming")
	_refresh_summary()


func _is_selected(id: String) -> bool:
	for e: Dictionary in selected:
		if e["show_id"] == id:
			return true
	return false


func _build_cards() -> void:
	UiKit.clear(_cards)
	var data := session.data
	for id: String in session.state.offers:
		var show: Dictionary = data.shows[id]
		var chosen := _is_selected(id)
		var card := Button.new()
		card.custom_minimum_size = Vector2(100, 146)
		card.theme_type_variation = "FlatButton"
		card.toggle_mode = false
		card.tooltip_text = "%s\n%s" % [show["title"], show["pitch"]]
		card.focus_mode = Control.FOCUS_ALL
		var frame := UiKit.panel("PaperPanel" if chosen else ("InsetPanel" if id != current else "WoodPanel"))
		frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
		frame.set_anchors_preset(Control.PRESET_FULL_RECT)
		card.add_child(frame)
		var col := UiKit.vbox([], 2)
		col.mouse_filter = Control.MOUSE_FILTER_IGNORE
		frame.add_child(col)
		var poster := TextureRect.new()
		poster.texture = UiKit.poster(id)
		poster.custom_minimum_size = Vector2(64, 88)
		poster.stretch_mode = TextureRect.STRETCH_KEEP_CENTERED
		poster.mouse_filter = Control.MOUSE_FILTER_IGNORE
		col.add_child(poster)
		var t := UiKit.label(str(show["title"]), "PaperLabel" if chosen else "SmallLabel", true)
		t.add_theme_font_size_override("font_size", 13)
		t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		t.max_lines_visible = 2
		t.mouse_filter = Control.MOUSE_FILTER_IGNORE
		col.add_child(t)
		if chosen:
			var mark := UiKit.label("✓ Programmé", "PaperLabel")
			mark.add_theme_font_size_override("font_size", 13)
			mark.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			col.add_child(mark)
		elif Programming.unavailable_reason(data, session.state, id) != "":
			var lock := UiKit.label("Indisponible", "SmallLabel")
			lock.add_theme_color_override("font_color", UiKit.BAD)
			lock.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			col.add_child(lock)
		card.pressed.connect(func() -> void:
			AudioDirector.play_sfx("page")
			_show_detail(id))
		_cards.add_child(card)


func _show_detail(id: String) -> void:
	current = id
	_build_cards()
	for c in _detail.get_children():
		if not c is DialogueBox:
			c.queue_free()
	var data := session.data
	var show: Dictionary = data.shows[id]
	var price: String = prices.get(id, "normal")
	var est := session.estimate(id, price)
	var fin: Dictionary = est["finance"]

	var sheet := UiKit.panel("PaperPanel")
	var col := UiKit.vbox([], 4)
	sheet.add_child(col)
	_detail.add_child(sheet)
	var title_row := UiKit.hbox()
	var title := UiKit.label(str(show["title"]), "PaperTitleLabel", true)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_row.add_child(title)
	var genre := UiKit.label(data.genre_label(show), "PaperLabel")
	genre.add_theme_color_override("font_color", Color(data.genres.get(show["genre"], {}).get("color", "#5a4636")).darkened(0.35))
	title_row.add_child(genre)
	col.add_child(title_row)
	var company := UiKit.label(str(show["company"]), "PaperLabel")
	company.add_theme_color_override("font_color", Color("5a4636"))
	col.add_child(company)
	var desc := UiKit.rich(str(show["description"]))
	desc.theme_type_variation = "PaperRichText"
	col.add_child(desc)

	var facts := GridContainer.new()
	facts.columns = 2
	facts.add_theme_constant_override("h_separation", 16)
	facts.add_theme_constant_override("v_separation", 2)
	_fact(facts, "Contrat", _contract_text(show), _contract_notion(show))
	_fact(facts, "Représentations", "%d × %d places (%s)" % [int(est["reps"]), data.show_capacity(show), "foyer" if show["format"] == "petit" else ("plateau" if show["format"] == "residence" else "grande salle")], "jauge")
	_fact(facts, "Public ciblé", _audiences(show), "diversification")
	_fact(facts, "Intérêt artistique", _stars(float(show["art"])), "programmation")
	_fact(facts, "Risque", _risk(float(show["risk"])), "")
	_fact(facts, "Technique", _tech(show, est), "charges_fixes_variables")
	col.add_child(facts)
	_detail.add_child(_price_row(id, show))
	_detail.add_child(_estimate_block(show, est, fin))

	var reason := Programming.unavailable_reason(data, session.state, id)
	var action_row := UiKit.hbox()
	action_row.add_child(UiKit.spacer())
	if reason != "" and not _is_selected(id):
		var warn := UiKit.label(reason, "MutedLabel", true)
		warn.add_theme_color_override("font_color", UiKit.BAD)
		warn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		action_row.add_child(warn)
	else:
		var toggle := UiKit.button("Retirer de la programmation" if _is_selected(id) else "Programmer ce spectacle", "SecondaryButton" if _is_selected(id) else "", "cross" if _is_selected(id) else "check")
		toggle.pressed.connect(func() -> void: _toggle(id))
		action_row.add_child(toggle)
	_detail.add_child(action_row)


func _fact(grid: GridContainer, key: String, value: String, notion: String) -> void:
	var k := UiKit.label(key, "SmallLabel")
	k.add_theme_color_override("font_color", Color("5a4636"))
	var row := UiKit.hbox([k], 2)
	if notion != "":
		row.add_child(UiKit.notion_link(notion, "?", true))
	grid.add_child(row)
	var v := UiKit.label(value, "", true)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_theme_color_override("font_color", UiKit.INK)
	grid.add_child(v)


func _contract_text(show: Dictionary) -> String:
	match str(show["contract"]):
		"corealisation":
			return "Coréalisation : %d %% de la recette nette pour la compagnie" % roundi(float(show["company_share"]) * 100)
		"coproduction":
			return "Coproduction : apport de %s" % Format.money(int(show["fee"]))
		"interne":
			return "Organisé par le théâtre : %s de frais" % Format.money(int(show["fee"]))
		"residence":
			return "Résidence : %s d'accueil" % Format.money(int(show["fee"]))
		_:
			return "Cession : %s (prix fixe)" % Format.money(int(show["fee"]))


func _contract_notion(show: Dictionary) -> String:
	match str(show["contract"]):
		"corealisation":
			return "corealisation"
		"coproduction":
			return "production_diffusion"
		"residence":
			return "residence"
		"interne":
			return "mediation"
	return "contrat_cession"


func _audiences(show: Dictionary) -> String:
	var names := {"grand_public": "grand public", "seniors": "seniors", "jeunes": "jeunes", "familles": "familles",
		"scolaires": "scolaires", "curieux": "curieux", "amateurs": "amateurs"}
	var out: Array[String] = []
	for a: String in show.get("audiences", []):
		out.append(names.get(a, a))
	return ", ".join(out)


func _stars(art: float) -> String:
	var n := roundi(art * 5.0)
	return "★".repeat(n) + "☆".repeat(5 - n)


func _risk(r: float) -> String:
	if r < 0.2:
		return "Faible : fréquentation prévisible"
	if r < 0.35:
		return "Moyen"
	return "Élevé : succès ou échec, difficile à prévoir"


func _tech(show: Dictionary, est: Dictionary) -> String:
	var lvl := int(show.get("tech_level", 0))
	var names := ["Légère", "Simple", "Exigeante", "Très exigeante"]
	var txt: String = names[clampi(lvl, 0, 3)]
	if show.has("min_equipement"):
		txt += " (équipements ≥ %d)" % int(show["min_equipement"])
	var p := float(est["incident_risk"])
	if p > 0.0:
		txt += " — risque d'incident %d %%" % roundi(p * 100)
	return txt


func _price_row(id: String, show: Dictionary) -> Control:
	var row := UiKit.hbox([UiKit.label("Tarif", "SubHeaderLabel"), UiKit.notion_link("tarification")])
	if float(show["price"]) <= 0.0:
		row.add_child(UiKit.label("Entrée libre", "MutedLabel"))
		return row
	var group := ButtonGroup.new()
	for level: Dictionary in session.data.balance["price_levels"]:
		var short := {"reduit": "Solidaire", "normal": "Normal", "plein": "Élevé"}
		var b := UiKit.button("%s %s" % [short.get(level["id"], level["label"]), Format.money(roundi(float(show["price"]) * float(level["mult"])))], "SecondaryButton")
		b.tooltip_text = str(level["label"])
		b.toggle_mode = true
		b.button_group = group
		b.button_pressed = prices.get(id, "normal") == level["id"]
		b.add_theme_font_size_override("font_size", 14)
		var level_id: String = level["id"]
		b.pressed.connect(func() -> void:
			prices[id] = level_id
			for e: Dictionary in selected:
				if e["show_id"] == id:
					e["price_level"] = level_id
			_show_detail(id)
			_refresh_summary())
		row.add_child(b)
	return row


func _estimate_block(show: Dictionary, est: Dictionary, fin: Dictionary) -> Control:
	var box := UiKit.panel("InsetPanel")
	var col := UiKit.vbox([], 2)
	box.add_child(col)
	col.add_child(UiKit.hbox([UiKit.label("Estimation (budget prévisionnel)", "SubHeaderLabel"), UiKit.notion_link("budget_previsionnel")]))
	var seats_txt := "Places vendues : entre [b]%d[/b] et [b]%d[/b] (attendu %d) sur %d." % [int(est["seats_low"]), int(est["seats_high"]), int(est["seats"]), int(est["capacity_total"])]
	if bool(show.get("school", false)):
		seats_txt += " Dont une séance scolaire à %s." % Format.money(ShowEconomics.school_price(session.data))
	col.add_child(UiKit.rich(seats_txt))
	var lines := "Recette nette attendue %s (TVA déduite)" % Format.money(int(fin["net"]))
	lines += "  ·  coûts %s" % Format.money(int(fin["costs"]))
	col.add_child(UiKit.rich(lines))
	var detail := "[color=#b9b0c8]Détail des coûts : "
	var parts: Array[String] = []
	if fin["fee"] > 0:
		parts.append("contrat %s" % Format.money(int(fin["fee"])))
	if fin["company_share"] > 0:
		parts.append("part compagnie %s" % Format.money(int(fin["company_share"])))
	if fin["tech"] > 0:
		parts.append("technique %s" % Format.money(int(fin["tech"])))
	if fin["hosting"] > 0:
		parts.append("défraiements %s" % Format.money(int(fin["hosting"])))
	if fin["rights"] > 0:
		parts.append("droits d'auteur %s" % Format.money(int(fin["rights"])))
	detail += ", ".join(parts) + "[/color]"
	col.add_child(UiKit.rich(detail))
	col.add_child(UiKit.rich("Marge estimée : %s  [color=#b9b0c8](fourchette %s à %s)[/color]" % [
		UiKit.delta_text(est["margin"], true), Format.signed_money(int(est["margin_low"])), Format.signed_money(int(est["margin_high"]))]))
	var effects: Array[String] = []
	for sid: String in show.get("stats", {}):
		effects.append("%s %s" % [Rules.STAT_LABELS.get(sid, sid), "↑" if float(show["stats"][sid]) > 0 else "↓"])
	if bool(show.get("eac", false)):
		effects.append("compte comme action EAC")
	if session.data.is_artistic(show):
		effects.append("œuvre exigeante (convention)")
	if not effects.is_empty():
		col.add_child(UiKit.rich("[color=#c9a24b]Effets attendus :[/color] " + ", ".join(effects)))
	return box


func _toggle(id: String) -> void:
	if _is_selected(id):
		for i in selected.size():
			if selected[i]["show_id"] == id:
				selected.remove_at(i)
				break
		AudioDirector.play_sfx("cancel")
	else:
		var candidate := selected.duplicate(true)
		candidate.append({"show_id": id, "price_level": prices.get(id, "normal")})
		var err := Programming.validate(session.data, session.state, candidate)
		if err != "":
			_show_error(err)
			return
		selected = candidate
		AudioDirector.play_sfx("confirm")
	_error.visible = false
	_show_detail(id)
	_refresh_summary()


func _refresh_summary() -> void:
	var data := session.data
	var hall := 0
	for e: Dictionary in selected:
		if data.uses_hall(data.shows[e["show_id"]]):
			hall += 1
	var proj := session.projected_cash(selected, [])
	var slots: Dictionary = data.balance["slots"]
	var txt := "Créneaux [b]%d/%d[/b] (grande salle %d/%d) · Trésorerie fin de période : %s [color=#b9b0c8](public faible : %s)[/color]" % [
		selected.size(), int(slots["total"]), hall, int(slots["hall_max"]), _money_colored(int(proj["expected"])), Format.money(int(proj["low"]))]
	_summary.text = txt
	_validate.text = "Valider la programmation" if not selected.is_empty() else "Faire relâche cette période"


func _money_colored(v: int) -> String:
	return "[color=%s][b]%s[/b][/color]" % ["#8fd19e" if v >= 0 else "#f08a8a", Format.money(v)]


func _show_error(msg: String) -> void:
	_error.text = msg
	_error.visible = true
	AudioDirector.play_sfx("error")


func _on_validate() -> void:
	var err := session.confirm_programming(selected)
	if err != "":
		_show_error(err)
		return
	AudioDirector.play_sfx("confirm")
	screen.advance()

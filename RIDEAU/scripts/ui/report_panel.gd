class_name ReportPanel
extends VBoxContainer
## Étape 6 : le bilan de la période, avec des explications sur chaque évolution.

var screen: Node
var session: GameSession
var report: Dictionary
var _content: VBoxContainer
var _tabs: HBoxContainer


func _ready() -> void:
	session = screen.session
	report = session.last_report
	add_theme_constant_override("separation", 6)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(UiKit.label("Bilan — %s" % report.get("period", ""), "HeaderLabel"))
	_tabs = UiKit.hbox([], 4)
	add_child(_tabs)
	var group := ButtonGroup.new()
	for tab: Array in [["synthese", "Synthèse"], ["finances", "Finances"], ["spectacles", "Spectacles"], ["indicateurs", "Indicateurs"]]:
		var b := UiKit.button(tab[1], "SecondaryButton")
		b.toggle_mode = true
		b.button_group = group
		b.button_pressed = tab[0] == "synthese"
		var id: String = tab[0]
		b.pressed.connect(func() -> void: _show(id))
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		_tabs.add_child(b)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	add_child(scroll)
	_content = UiKit.vbox([], 8)
	_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_content)
	var footer := UiKit.hbox([UiKit.spacer()])
	var go: Button
	if session.state.finished:
		go = UiKit.primary("Voir le bilan de la saison", "star")
		go.pressed.connect(func() -> void: Game.go_to_end())
	else:
		go = UiKit.primary("Période suivante")
		go.pressed.connect(func() -> void:
			session.next_turn()
			AudioDirector.play_sfx("page")
			screen.advance())
	footer.add_child(go)
	add_child(footer)
	_show("synthese")
	go.grab_focus.call_deferred()


func _show(tab: String) -> void:
	UiKit.clear(_content)
	match tab:
		"synthese":
			_synthese()
		"finances":
			_finances()
		"spectacles":
			_spectacles()
		_:
			_indicateurs()


func _synthese() -> void:
	var fin: Dictionary = report["finance"]
	var row := UiKit.hbox([], 8)
	row.add_child(_big_number("Résultat de la période", fin["resultat"], "Produits − charges engagés pendant la période.", "tresorerie_resultat"))
	row.add_child(_big_number("Variation de trésorerie", fin["variation"], "Argent réellement entré − argent réellement sorti.", "tresorerie_resultat"))
	_content.add_child(row)
	var att := UiKit.rich("Entrées de la période : [b]%s[/b]   ·   Trésorerie : [b]%s[/b]" % [Format.thousands(int(report["attendance"])), Format.money(int(fin["cash_after"]))])
	_content.add_child(att)
	for w: String in report.get("warnings", []):
		var l := UiKit.label("⚠ " + w, "", true)
		l.add_theme_color_override("font_color", UiKit.BAD)
		_content.add_child(l)
	if not report.get("event", {}).is_empty():
		var ev: Dictionary = report["event"]
		_content.add_child(UiKit.rich("[color=#c9a24b]Événement :[/color] %s — %s" % [ev["title"], ev["choice"]]))
	var box := UiKit.panel("PaperPanel")
	var col := UiKit.vbox([], 4)
	box.add_child(col)
	col.add_child(UiKit.label("Pourquoi ces résultats ?", "PaperTitleLabel"))
	for line: String in report.get("explanations", []):
		var r := UiKit.rich("• " + line)
		r.theme_type_variation = "PaperRichText"
		col.add_child(r)
	_content.add_child(box)


func _big_number(title: String, value: int, help: String, notion: String) -> Control:
	var p := UiKit.panel("InsetPanel")
	p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var col := UiKit.vbox([], 0)
	p.add_child(col)
	col.add_child(UiKit.hbox([UiKit.label(title, "SmallLabel"), UiKit.spacer(), UiKit.notion_link(notion)]))
	var v := UiKit.label(Format.signed_money(value), "NumberLabel")
	v.add_theme_font_size_override("font_size", 40)
	v.add_theme_color_override("font_color", UiKit.GOOD if value >= 0 else UiKit.BAD)
	col.add_child(v)
	col.add_child(UiKit.label(help, "SmallLabel", true))
	return p


func _finances() -> void:
	var fin: Dictionary = report["finance"]
	_content.add_child(UiKit.rich("Le [b]résultat[/b] compte ce qui a été engagé pendant la période, même si l'argent bouge plus tard. La [b]trésorerie[/b] ne compte que l'argent réellement encaissé ou payé."))
	_content.add_child(_table("Produits engagés", fin["produits_detail"], fin["produits"], true, "due_turn"))
	_content.add_child(_table("Charges engagées", fin["charges_detail"], fin["charges"], false, "due_turn"))
	_content.add_child(_table("Encaissements (argent reçu)", fin["encaissements"], fin["encaisse_total"], true, "turn_engaged"))
	_content.add_child(_table("Décaissements (argent payé)", fin["decaissements"], fin["decaisse_total"], false, "turn_engaged"))
	_content.add_child(UiKit.rich("Reste à recevoir : [b]%s[/b]   ·   Reste à payer : [b]%s[/b]" % [Format.money(int(fin["a_recevoir"])), Format.money(int(fin["a_payer"]))]))
	var links := UiKit.hbox([UiKit.notion_link("billetterie", "TVA et billetterie"), UiKit.notion_link("droits_auteur", "Droits d'auteur"), UiKit.notion_link("charges_fixes_variables", "Charges fixes")])
	_content.add_child(links)


func _table(title: String, rows: Array, total: int, income: bool, timing_key: String) -> Control:
	var box := UiKit.panel("InsetPanel")
	var col := UiKit.vbox([], 1)
	box.add_child(col)
	col.add_child(UiKit.hbox([UiKit.label(title, "SubHeaderLabel"), UiKit.spacer(), UiKit.label(Format.money(total), "SubHeaderLabel")]))
	if rows.is_empty():
		col.add_child(UiKit.label("—", "SmallLabel"))
	for r: Dictionary in rows:
		var note := ""
		var t := int(r.get(timing_key, report["turn"]))
		if timing_key == "due_turn" and t > int(report["turn"]):
			note = "  (réglé période %d)" % t
		elif timing_key == "turn_engaged" and t < int(report["turn"]):
			note = "  (engagé période %d)" % t
		var line := UiKit.hbox()
		var name := UiKit.label(str(r["label"]) + note, "SmallLabel", true)
		name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		line.add_child(name)
		var amount := UiKit.label(("+" if income else "−") + Format.money(int(r["amount"])), "SmallLabel")
		amount.add_theme_color_override("font_color", UiKit.GOOD if income else UiKit.BAD)
		line.add_child(amount)
		col.add_child(line)
	return box


func _spectacles() -> void:
	var shows: Array = report.get("shows", [])
	if shows.is_empty():
		_content.add_child(UiKit.label("Relâche : aucun spectacle cette période. La fidélité des publics s'érode plus vite.", "", true))
	for s: Dictionary in shows:
		var card := UiKit.panel("InsetPanel")
		var row := UiKit.hbox([], 10)
		card.add_child(row)
		var poster := TextureRect.new()
		poster.texture = UiKit.poster(s["show_id"])
		poster.stretch_mode = TextureRect.STRETCH_KEEP_CENTERED
		poster.custom_minimum_size = Vector2(64, 88)
		row.add_child(poster)
		var col := UiKit.vbox([], 2)
		col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(col)
		col.add_child(UiKit.label(str(s["title"]), "SubHeaderLabel", true))
		if s.get("cancelled", false):
			col.add_child(UiKit.label("Annulé.", "MutedLabel"))
			_content.add_child(card)
			continue
		var bar := ProgressBar.new()
		bar.max_value = int(s["capacity_total"])
		bar.value = int(s["sold"])
		bar.show_percentage = false
		bar.custom_minimum_size = Vector2(200, 16)
		col.add_child(UiKit.hbox([UiKit.label("%d / %d places" % [int(s["sold"]), int(s["capacity_total"])], "SmallLabel"), bar]))
		col.add_child(UiKit.label("Prévu : %d à %d places (attendu %d)" % [int(s["estimate_low"]), int(s["estimate_high"]), int(s["estimate_seats"])], "SmallLabel"))
		var f: Dictionary = s["finance"]
		col.add_child(UiKit.rich("Qualité : [b]%s[/b]%s   ·   Marge : %s [color=#b9b0c8](prévue %s)[/color]" % [
			s["quality_label"], "  ⚠ incident technique" if s["incident"] else "", UiKit.delta_text(f["margin"], true), Format.signed_money(int(s["estimate_margin"]))]))
		col.add_child(UiKit.label("Billetterie TTC %s, dont TVA %s · recette nette %s · coûts %s" % [Format.money(int(f["gross"])), Format.money(int(f["vat"])), Format.money(int(f["net"])), Format.money(int(f["costs"]))], "SmallLabel", true))
		_content.add_child(card)


func _indicateurs() -> void:
	var before: Dictionary = report["stats_before"]
	var after: Dictionary = report["stats_after"]
	var changes: Dictionary = report.get("stat_changes", {})
	for id: String in ["rayonnement", "reputation", "fidelite", "diversite", "relations", "equipe", "equipement", "communication"]:
		var b := float(before.get(id, 0))
		var a := float(after.get(id, 0))
		var row := UiKit.hbox([UiKit.icon_rect(UiKit.STAT_ICONS.get(id, "star"), 24)], 6)
		var name := UiKit.label(Rules.STAT_LABELS.get(id, id), "")
		name.custom_minimum_size.x = 190
		row.add_child(name)
		row.add_child(UiKit.rich("%d → [b]%d[/b]  %s" % [roundi(b), roundi(a), UiKit.delta_text(a - b)]))
		_content.add_child(row)
		if changes.has(id):
			var src: Dictionary = changes[id]
			var parts: Array[String] = []
			var keys := src.keys()
			keys.sort_custom(func(x: Variant, y: Variant) -> bool: return absf(float(src[x])) > absf(float(src[y])))
			for k: Variant in keys.slice(0, 4):
				if absf(float(src[k])) >= 0.5:
					parts.append("%s %s" % [k, Format.signed_int(roundi(float(src[k])))])
			if not parts.is_empty():
				var l := UiKit.label("      " + " · ".join(parts), "SmallLabel", true)
				_content.add_child(l)
	_content.add_child(UiKit.label("Le rayonnement combine réputation (50 %), relations (25 %) et diversité (25 %).", "SmallLabel", true))

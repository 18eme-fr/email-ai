extends GdUnitTestSuite
## Interface : menus, navigation complète d'une période, chiffres, lisibilité, résolutions.

const MENU := "res://scenes/menus/main_menu.tscn"
const MANAGEMENT := "res://scenes/management/management_screen.tscn"
const END := "res://scenes/reports/end_screen.tscn"


func before_test() -> void:
	Game.saves = SaveSystem.new("user://test_ui_saves")
	Game.saves.delete()
	Settings.values["show_tutorial"] = false
	Settings.values["reduce_motion"] = true
	Settings.values["readable_font"] = false
	Settings.apply("readable_font")


func after_test() -> void:
	Settings.values["readable_font"] = false
	Settings.apply("readable_font")
	Game.saves.delete()
	Game.saves = SaveSystem.new()
	Game.session = null


func _new_session(game_seed: int = 5) -> void:
	Game.session = GameSession.new()
	Game.session.new_game(game_seed, "standard")


func _buttons(root: Node) -> Array[Button]:
	var out: Array[Button] = []
	for n in root.find_children("*", "Button", true, false):
		out.append(n as Button)
	return out


func _find_button(root: Node, text_part: String) -> Button:
	for b in _buttons(root):
		if b.is_visible_in_tree() and not b.disabled and (b.text.contains(text_part) or b.tooltip_text.contains(text_part)):
			return b
	return null


func test_number_formatting() -> void:
	assert_str(Format.money(12450)).is_equal("12 450 €")
	assert_str(Format.money(-6000)).is_equal("−6 000 €")
	assert_str(Format.signed_money(250)).is_equal("+250 €")
	assert_str(Format.signed_int(0)).is_equal("0")
	assert_str(Format.thousands(1234567)).is_equal("1 234 567")
	assert_str(Format.percent(0.856)).is_equal("86 %")


func test_main_menu_buttons() -> void:
	var runner := scene_runner(MENU)
	await runner.simulate_frames(5)
	var names := ["NewGame", "Continue", "Settings", "Credits", "Quit"]
	for n: String in names:
		assert_object(runner.find_child(n)).override_failure_message("Bouton manquant : " + n).is_not_null()
	var cont := runner.find_child("Continue") as Button
	assert_bool(cont.disabled).override_failure_message("Continuer doit être grisé sans sauvegarde").is_true()
	assert_str((runner.find_child("Title") as Label).text).is_equal("RIDEAU !")


func test_main_menu_opens_settings_and_credits() -> void:
	var runner := scene_runner(MENU)
	await runner.simulate_frames(3)
	(runner.find_child("Settings") as Button).pressed.emit()
	await runner.simulate_frames(3)
	var overlay := runner.find_child("Overlay")
	assert_int(overlay.get_child_count()).is_equal(1)
	assert_int(overlay.find_children("*", "HSlider", true, false).size()).is_equal(3)
	(overlay.get_child(0) as Modal).close_modal()
	await runner.simulate_frames(3)
	(runner.find_child("Credits") as Button).pressed.emit()
	await runner.simulate_frames(3)
	var texts := ""
	for r in overlay.find_children("*", "RichTextLabel", true, false):
		texts += (r as RichTextLabel).get_parsed_text()
	assert_str(texts).contains("Dialogue Manager")
	assert_str(texts).contains("SIL Open Font License")


func test_continue_enabled_after_save() -> void:
	_new_session()
	Game.autosave()
	var runner := scene_runner(MENU)
	await runner.simulate_frames(3)
	assert_bool((runner.find_child("Continue") as Button).disabled).is_false()


func test_full_turn_through_the_interface() -> void:
	_new_session(31)
	var runner := scene_runner(MANAGEMENT)
	await runner.simulate_frames(5)
	var screen := runner.scene()
	var s: GameSession = Game.session
	# 1. Situation -> Programmation
	_find_button(screen, "Préparer la programmation").pressed.emit()
	await runner.simulate_frames(3)
	assert_str(s.state.phase).is_equal(GameState.PHASE_PROGRAMMING)
	# 2. Programmer le premier spectacle disponible
	var panel := screen.find_children("*", "ProgrammingPanel", true, false)[0] as ProgrammingPanel
	for id: String in s.state.offers:
		if Programming.unavailable_reason(s.data, s.state, id) == "":
			panel._show_detail(id)
			await runner.simulate_frames(2)
			_find_button(screen, "Programmer ce spectacle").pressed.emit()
			break
	await runner.simulate_frames(2)
	assert_int(panel.selected.size()).is_equal(1)
	_find_button(screen, "Valider la programmation").pressed.emit()
	await runner.simulate_frames(3)
	assert_str(s.state.phase).is_equal(GameState.PHASE_MANAGEMENT)
	assert_int(s.state.programmed.size()).is_equal(1)
	# 3. Choisir une action
	_find_button(screen, "Choisir").pressed.emit()
	await runner.simulate_frames(2)
	_find_button(screen, "Valider les actions").pressed.emit()
	await runner.simulate_frames(3)
	assert_str(s.state.phase).is_equal(GameState.PHASE_EVENT)
	assert_int(s.state.actions.size()).is_equal(1)
	# 4. Événement : attendre les réponses du dialogue puis choisir la première possible
	if s.state.current_event != "":
		var choice_button: Button = null
		for i in 60:
			await runner.simulate_frames(5)
			var box := screen.find_children("*", "DialogueBox", true, false)
			if box.is_empty():
				break
			var next := _find_button(box[0], "Suite")
			if next:
				next.pressed.emit()
			var panel_ev := screen.find_children("*", "EventPanel", true, false)[0] as EventPanel
			for b in _buttons(panel_ev._choices):
				if not b.disabled:
					choice_button = b
			if choice_button:
				break
		assert_object(choice_button).override_failure_message("Aucun choix proposé pour " + s.state.current_event).is_not_null()
		choice_button.pressed.emit()
		for i in 40:
			await runner.simulate_frames(5)
			if s.state.event_choice != "":
				var box2 := screen.find_children("*", "DialogueBox", true, false)
				if not box2.is_empty():
					var close := _find_button(box2[0], "Fermer")
					var more := _find_button(box2[0], "Suite")
					if close:
						close.pressed.emit()
					elif more:
						more.pressed.emit()
			if _find_button(screen, "Lancer la période"):
				break
		assert_str(s.state.event_choice).is_not_empty()
	# 5. Résolution -> bilan
	var launch := _find_button(screen, "Lancer la période")
	assert_object(launch).is_not_null()
	launch.pressed.emit()
	for i in 30:
		await runner.simulate_frames(5)
		if s.state.phase == GameState.PHASE_REPORT:
			break
	await runner.simulate_frames(5)
	assert_str(s.state.phase).is_equal(GameState.PHASE_REPORT)
	assert_object(_find_button(screen, "Période suivante")).is_not_null()
	# Onglets du bilan
	for tab: String in ["Finances", "Spectacles", "Indicateurs", "Synthèse"]:
		_find_button(screen, tab).pressed.emit()
		await runner.simulate_frames(2)
	# 6. Période suivante
	_find_button(screen, "Période suivante").pressed.emit()
	await runner.simulate_frames(3)
	assert_int(s.state.turn).is_equal(2)
	assert_str(s.state.phase).is_equal(GameState.PHASE_SITUATION)
	# La sauvegarde automatique a eu lieu.
	assert_bool(Game.saves.has_save()).is_true()


func test_top_bar_shows_formatted_cash() -> void:
	_new_session()
	Game.session.state.cash = 12450
	var runner := scene_runner(MANAGEMENT)
	await runner.simulate_frames(3)
	var found := false
	for l in runner.scene().find_children("*", "Label", true, false):
		if (l as Label).text == "12 450 €":
			found = true
	assert_bool(found).is_true()


func test_modals_open_and_close_with_escape() -> void:
	_new_session()
	var runner := scene_runner(MANAGEMENT)
	await runner.simulate_frames(3)
	var overlay := runner.find_child("Overlay")
	for key: String in ["Carnet", "Budget", "Bilans", "Menu"]:
		var b := _find_button(runner.scene(), key)
		assert_object(b).override_failure_message("Bouton %s introuvable" % key).is_not_null()
		b.pressed.emit()
		await runner.simulate_frames(3)
		assert_int(overlay.get_child_count()).override_failure_message("%s n'ouvre pas de fenêtre" % key).is_equal(1)
		runner.simulate_action_pressed("ui_cancel")
		await runner.simulate_frames(3)
		assert_int(overlay.get_child_count()).override_failure_message("%s ne se ferme pas avec Échap" % key).is_equal(0)


func test_every_phase_panel_builds_without_error() -> void:
	_new_session(57)
	var s: GameSession = Game.session
	for steps in [0, 1, 2, 3, 5]:
		_new_session(57)
		ScreenshotScenario.advance(Game.session, steps)
		var runner := scene_runner(MANAGEMENT)
		await runner.simulate_frames(5)
		assert_int(runner.scene().find_child("PhaseHost", true, false).get_child_count()).is_equal(1)


## Le jeu est conçu pour 1280×720 ; les autres résolutions sont obtenues par mise à
## l'échelle (« canvas_items », aspect « expand »). Il suffit donc que chaque écran tienne
## dans 1280×720 à chaque étape de jeu.
func test_layout_fits_reference_resolution() -> void:
	for steps in [0, 1, 2, 3, 5]:
		_new_session(3)
		ScreenshotScenario.advance(Game.session, steps)
		var runner := scene_runner(MANAGEMENT)
		await runner.simulate_frames(3)
		var minimum := (runner.scene().get_node("Margin") as Control).get_combined_minimum_size() + Vector2(0, 0)
		assert_float(minimum.x).override_failure_message("Étape %d : largeur minimale %d > 1280" % [steps, minimum.x]).is_less_equal(1280.0)
		assert_float(minimum.y).override_failure_message("Étape %d : hauteur minimale %d > 720" % [steps, minimum.y]).is_less_equal(720.0)
	_new_session(77)
	StrategyBot.new("equilibre", 77).play_season(Game.session)
	var end := scene_runner(END)
	await end.simulate_frames(3)
	var m := (end.scene().get_node("Margin") as Control).get_combined_minimum_size()
	assert_float(m.y).override_failure_message("Écran de fin : hauteur minimale %d > 720" % m.y).is_less_equal(720.0)


func test_readable_font_toggle_and_layout() -> void:
	var project_font := ThemeDB.get_project_theme().default_font
	Settings.values["readable_font"] = true
	Settings.apply("readable_font")
	assert_object(get_tree().root.theme).is_not_null()
	for steps in [0, 1, 2, 3, 5]:
		_new_session(3)
		ScreenshotScenario.advance(Game.session, steps)
		var runner := scene_runner(MANAGEMENT)
		await runner.simulate_frames(3)
		var minimum := (runner.scene().get_node("Margin") as Control).get_combined_minimum_size()
		assert_float(minimum.x).override_failure_message("Police lisible, étape %d : largeur %d > 1280" % [steps, minimum.x]).is_less_equal(1280.0)
		assert_float(minimum.y).override_failure_message("Police lisible, étape %d : hauteur %d > 720" % [steps, minimum.y]).is_less_equal(720.0)
	Settings.values["readable_font"] = false
	Settings.apply("readable_font")
	assert_object(get_tree().root.theme).is_null()
	# Le thème du projet n'a jamais été modifié.
	assert_object(ThemeDB.get_project_theme().default_font).is_same(project_font)


func test_texts_use_readable_sizes() -> void:
	_new_session()
	var runner := scene_runner(MANAGEMENT)
	await runner.simulate_frames(3)
	for l in runner.scene().find_children("*", "Label", true, false):
		var size := (l as Label).get_theme_font_size("font_size")
		assert_int(size).override_failure_message("Texte trop petit (%d px) : %s" % [size, (l as Label).text]).is_greater_equal(13)


func test_end_screen_shows_results() -> void:
	_new_session(77)
	StrategyBot.new("equilibre", 77).play_season(Game.session)
	var runner := scene_runner(END)
	await runner.simulate_frames(5)
	var all := ""
	for l in runner.scene().find_children("*", "Label", true, false):
		all += (l as Label).text + "\n"
	assert_str(all).contains("Objectifs de la convention")
	assert_str(all).contains("Décisions marquantes")
	assert_object(_find_button(runner.scene(), "Nouvelle saison")).is_not_null()
	assert_object(_find_button(runner.scene(), "Rejouer la même saison")).is_not_null()

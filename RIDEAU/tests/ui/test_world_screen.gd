extends GdUnitTestSuite
## Monde explorable : une période complète jouée à pied (bureau, actions auprès
## des personnes, porte, événement, soirée, bilan), rénovation, clic pour aller.

const WORLD := "res://scenes/world/world_screen.tscn"


func before_test() -> void:
	Game.saves = SaveSystem.new("user://test_world_saves")
	Game.saves.delete()
	Settings.values["show_tutorial"] = false
	Settings.values["reduce_motion"] = true
	Game.collection = Collection.new("user://test_world_collection.json", "")
	Game.collection.reset()


func after_test() -> void:
	Game.collection.reset()
	Game.collection = Collection.new()
	Game.saves.delete()
	Game.saves = SaveSystem.new()
	Game.session = null


func _new_session(game_seed: int) -> GameSession:
	Game.session = GameSession.new()
	Game.session.new_game(game_seed, "standard")
	Game.session.state.tutorial_seen["case"] = true
	return Game.session


func _buttons(root: Node) -> Array[Button]:
	var out: Array[Button] = []
	for n in root.find_children("*", "Button", true, false):
		out.append(n as Button)
	return out


func _find_button(root: Node, text_part: String) -> Button:
	for b in _buttons(root):
		if b.is_visible_in_tree() and not b.disabled and b.text.contains(text_part):
			return b
	return null


## Attend qu'une condition soit vraie (au plus `tries` × 5 images).
func _wait(runner: GdUnitSceneRunner, cond: Callable, tries: int = 80) -> bool:
	for i in tries:
		if cond.call():
			return true
		await runner.simulate_frames(5)
	return cond.call()


## Répond à la boîte de dialogue du monde (index de la réponse, ou « Suite »).
func _answer(runner: GdUnitSceneRunner, screen: WorldScreen, index: int) -> void:
	await _wait(runner, func() -> bool: return screen.speech.visible)
	await runner.simulate_frames(5)
	if screen.speech._asking:
		screen.speech._pick(index)
	else:
		screen.speech._advance()
	await runner.simulate_frames(5)


func test_a_full_period_on_foot() -> void:
	var s := _new_session(31)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	assert_str(screen.map.id).is_equal("bureau")
	# 1. Monter d'une case vers le bureau et l'utiliser : le cahier s'ouvre.
	screen._try_step("up")
	await _wait(runner, func() -> bool: return not screen.player.moving)
	screen.interact()
	await runner.simulate_frames(5)
	assert_bool(screen.window.is_open()).is_true()
	_find_button(screen, "Préparer la programmation").pressed.emit()
	await runner.simulate_frames(5)
	assert_str(s.state.phase).is_equal(GameState.PHASE_PROGRAMMING)
	# 2. Programmer un spectacle : la fenêtre se ferme, place aux actions.
	var panel := screen.find_children("*", "ProgrammingPanel", true, false)[0] as ProgrammingPanel
	for id: String in s.state.offers:
		if Programming.unavailable_reason(s.data, s.state, id) == "":
			panel._show_detail(id)
			await runner.simulate_frames(2)
			_find_button(screen, "Programmer ce spectacle").pressed.emit()
			break
	await runner.simulate_frames(2)
	_find_button(screen, "Valider la programmation").pressed.emit()
	await runner.simulate_frames(10)
	assert_str(s.state.phase).is_equal(GameState.PHASE_MANAGEMENT)
	assert_bool(screen.window.is_open()).is_false()
	# 3. Parler à Hélène : elle propose de former l'équipe (missions écartées pour ce test).
	await _wait(runner, func() -> bool: return not screen._busy)
	for id: String in MissionSystem.with_status(s.state, "offered"):
		s.decline_mission(id)
	screen.talk_to(screen.npcs["helene"])
	await _answer(runner, screen, 0)
	await _answer(runner, screen, 0)
	assert_array(s.state.actions).contains(["formation"])
	await _wait(runner, func() -> bool: return not screen._busy)
	# 4. Descendre au hall par la porte du bureau.
	screen._walk_then([Vector2i(6, 9)], Callable())
	assert_bool(await _wait(runner, func() -> bool: return screen.map.id == "hall" and not screen._busy)).is_true()
	assert_bool(screen.npcs.has("ines")).is_true()
	# 5. Signer la feuille de route : l'événement arrive, quelqu'un vient vous voir.
	screen.open_phase_window()
	await runner.simulate_frames(5)
	_find_button(screen, "Valider les actions").pressed.emit()
	await runner.simulate_frames(5)
	assert_str(s.state.phase).is_equal(GameState.PHASE_EVENT)
	assert_bool(await _wait(runner, func() -> bool: return screen.window.is_open())).is_true()
	if s.state.current_event != "":
		var choice_button: Button = null
		for i in 60:
			await runner.simulate_frames(5)
			var box := screen.find_children("*", "DialogueBox", true, false)
			if box.is_empty():
				break
			var more := _find_button(box[0], "Suite")
			if more:
				more.pressed.emit()
			var ev := screen.find_children("*", "EventPanel", true, false)[0] as EventPanel
			for b in _buttons(ev._choices):
				if not b.disabled:
					choice_button = b
			if choice_button:
				break
		assert_object(choice_button).is_not_null()
		choice_button.pressed.emit()
		await _wait(runner, func() -> bool:
			var box2 := screen.find_children("*", "DialogueBox", true, false)
			if not box2.is_empty():
				var close := _find_button(box2[0], "Fermer")
				var more := _find_button(box2[0], "Suite")
				if close:
					close.pressed.emit()
				elif more:
					more.pressed.emit()
			return _find_button(screen, "Lancer la période") != null)
	# 6. Soirée de représentation dans la salle, puis bilan.
	_find_button(screen, "Lancer la période").pressed.emit()
	assert_bool(await _wait(runner, func() -> bool: return s.state.phase == GameState.PHASE_REPORT and screen.window.is_open(), 200)).is_true()
	assert_str(screen.map.id).is_equal("salle")
	assert_object(_find_button(screen, "Période suivante")).is_not_null()
	# 7. Période suivante : retour au bureau, nouvelle saison éventuelle.
	_find_button(screen, "Période suivante").pressed.emit()
	assert_bool(await _wait(runner, func() -> bool: return screen.map.id == "bureau" and not screen._busy, 100)).is_true()
	assert_int(s.state.turn).is_equal(2)
	assert_bool(screen.window.is_open()).is_false()
	assert_bool(Game.saves.has_save()).is_true()


func test_buying_an_upgrade_on_the_spot() -> void:
	var s := _new_session(8)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	screen.load_map("hall", Vector2i(17, 4), "up")
	await runner.simulate_frames(5)
	var cash_due := Ledger.outstanding_total(s.state, Ledger.EXPENSE)
	screen.use_spot(screen.map.spot("bar"))
	await _answer(runner, screen, 0)
	await _wait(runner, func() -> bool: return s.state.upgrades.has("foyer_bar"))
	await _answer(runner, screen, 0)
	assert_array(s.state.upgrades).contains(["foyer_bar"])
	assert_int(Ledger.outstanding_total(s.state, Ledger.EXPENSE)).is_equal(cash_due + int(s.data.upgrades["foyer_bar"]["cost"]))
	await _wait(runner, func() -> bool: return not screen._busy)
	# Une seconde visite ne rachète pas les travaux.
	screen.use_spot(screen.map.spot("bar"))
	await _answer(runner, screen, 0)
	assert_int(s.state.upgrades.size()).is_equal(1)


func test_click_to_walk_and_doors_lead_somewhere() -> void:
	_new_session(3)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	screen._click(Vector2(3 * 16 + 8, 6 * 16 + 8))
	assert_array(screen._path).is_not_empty()
	assert_bool(await _wait(runner, func() -> bool: return screen.player.cell == Vector2i(3, 6))).is_true()
	# Objectif hors de la carte : une flèche indique la porte à prendre.
	screen.load_map("rue", Vector2i(51, 31), "down")
	await runner.simulate_frames(5)
	assert_str(str(screen._door_towards("bureau").get("to", ""))).is_equal("hall")


## On entre dans un commerce par sa porte, et on parle à la patronne par-dessus le comptoir.
func test_entering_a_shop_and_talking_across_the_counter() -> void:
	_new_session(3)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	# Porte du café (62, 29) : on y entre depuis la place.
	screen.load_map("rue", Vector2i(62, 30), "up")
	await runner.simulate_frames(5)
	screen._try_step("up")
	assert_bool(await _wait(runner, func() -> bool: return screen.map.id == "int_cafe" and not screen._busy)).is_true()
	assert_bool(screen.npcs.has("patronne_cafe")).is_true()
	# La clochette de la boutique a sonné (version « on entre »).
	var played: Array = []
	for p: AudioStreamPlayer in AudioDirector._players:
		if p.stream != null:
			played.append(p.stream.resource_path.get_file())
	assert_array(played).contains(["porte_boutique_in.wav"])
	# Devant le comptoir, la patronne est derrière : c'est elle qui répond.
	screen.player.cell = Vector2i(9, 4)
	screen.player.face("up")
	screen.interact()
	assert_bool(await _wait(runner, func() -> bool: return screen.speech.visible)).is_true()
	assert_str(screen.speech._name.text).contains("Mado")
	screen.speech.close()
	screen._busy = false
	# Un clic sur elle mène aussi de l'autre côté du comptoir.
	screen.player.cell = Vector2i(3, 8)
	screen._click(Vector2(9 * 16 + 8, 2 * 16 + 8))
	assert_array(screen._path).is_not_empty()
	assert_int(screen._path[screen._path.size() - 1].y).is_equal(4)


func test_city_bus_districts_and_plan() -> void:
	_new_session(5)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	screen.load_map("rue", Vector2i(51, 31), "down")
	await runner.simulate_frames(5)
	assert_str(screen.hud._place.text).contains("place de la Lanterne")
	# Prendre le bus jusqu'aux Coteaux.
	var stop := screen.map.spot("bus_place")
	screen.use_spot(stop)
	await runner.simulate_frames(3)
	var names: Array = []
	for st: Dictionary in screen.map.bus_stops():
		if st["id"] != "bus_place":
			names.append(st["id"])
	await _answer(runner, screen, names.find("bus_coteaux"))
	assert_bool(await _wait(runner, func() -> bool: return screen.player.cell == WorldMap.to_cell(screen.map.spot("bus_coteaux")["arrive"]) and not screen._busy)).is_true()
	assert_str(screen.hud._place.text).contains("Coteaux")
	# Le plan de la ville s'ouvre (touche M) et se referme.
	screen.open_city_plan()
	await runner.simulate_frames(3)
	assert_int(screen.overlay.get_child_count()).is_equal(1)
	(screen.overlay.get_child(0) as Modal).close_modal()
	await runner.simulate_frames(3)
	assert_int(screen.overlay.get_child_count()).is_equal(0)


func test_objective_and_hud_are_shown() -> void:
	_new_session(4)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	assert_str(screen.hud._objective.text).contains("bureau")
	assert_str(screen.hud._period.text).contains("Période 1")
	assert_str(screen.hud._period.text).contains("Automne")


func test_a_whole_season_goes_through_the_world() -> void:
	var s := _new_session(2024)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	var bot := StrategyBot.new("batisseur", 2024)
	var seasons_seen := {}
	for turn in s.data.turns():
		seasons_seen[WorldRules.season(screen.world, s.state.turn)] = true
		bot._build(s)
		s.open_programming()
		screen.advance()
		s.confirm_programming(bot.choose_programming(s))
		screen.advance()
		await _wait(runner, func() -> bool: return not screen._busy)
		s.confirm_actions(bot.choose_actions(s))
		screen.advance()
		await _wait(runner, func() -> bool: return screen.window.is_open() and not screen._busy)
		if s.state.current_event != "":
			s.choose_event(bot.choose_event(s))
		var report := s.resolve_turn()
		assert_bool(report.has("error")).is_false()
		await screen.play_performance(0.7)
		screen.advance()
		assert_bool(screen.window.is_open()).is_true()
		if s.state.finished:
			break
		s.next_turn()
		screen.advance()
		await _wait(runner, func() -> bool: return not screen._busy and screen.map.id == "bureau", 100)
	assert_bool(s.state.finished).is_true()
	assert_int(seasons_seen.size()).is_equal(4)
	assert_object(_find_button(screen, "Voir le bilan de la saison")).is_not_null()


func test_case_study_opens_on_a_new_game() -> void:
	var s := _new_session(12)
	s.state.tutorial_seen.erase("case")
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	assert_int(screen.overlay.get_child_count()).is_equal(1)
	assert_object(_find_button(screen, "Prendre mes fonctions")).is_not_null()
	_find_button(screen, "Prendre mes fonctions").pressed.emit()
	await runner.simulate_frames(10)
	assert_bool(s.state.tutorial_seen.has("case")).is_true()


func test_accepting_a_mission_by_talking_and_doing_the_dossier() -> void:
	var s := _new_session(21)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("offered")
	assert_str(screen._mission_of("helene")).is_equal("budget_saison")
	screen.talk_to(screen.npcs["helene"])
	await _answer(runner, screen, 0)   # présentation
	await _answer(runner, screen, 0)   # « J'accepte »
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("active")
	await _answer(runner, screen, 0)   # « Ouvrir le dossier »
	assert_bool(await _wait(runner, func() -> bool: return screen.overlay.get_child_count() > 0)).is_true()
	# Répondre juste à toutes les questions, puis rendre le dossier.
	var dossier := s.open_dossier("budget")
	for item: Dictionary in dossier["items"]:
		pass
	var modal := screen.overlay.get_child(0)
	var boxes := modal.find_children("*", "CheckBox", true, false)
	assert_int(boxes.size()).is_greater(0)
	# Cocher la bonne réponse de chaque question à partir de la correction attendue.
	var answers := Dossiers.auto_answers(dossier, RandomNumberGenerator.new(), 1.0)
	var result := s.submit_dossier(dossier, answers)
	assert_float(float(result["score"])).is_equal(1.0)
	assert_str(MissionSystem.status(s.state, "budget_saison")).is_equal("done")
	(modal as Modal).close_modal()
	await runner.simulate_frames(5)
	screen._show_notices()
	await runner.simulate_frames(5)
	assert_str(screen._mission_of("helene")).is_equal("")


func test_dossier_window_grades_the_answers() -> void:
	var s := _new_session(5)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	var m := DossierPanel.open(screen.overlay, s, "tresorerie", true)
	await runner.simulate_frames(5)
	# Rendre sans répondre : refusé.
	_find_button(m, "Rendre le dossier").pressed.emit()
	await runner.simulate_frames(3)
	assert_object(_find_button(m, "Rendre le dossier")).is_not_null()
	# Répondre à tout (premières propositions) puis rendre : la correction s'affiche.
	var groups := {}
	for cb in m.find_children("*", "CheckBox", true, false):
		var g: ButtonGroup = (cb as CheckBox).button_group
		if g != null and not groups.has(g):
			groups[g] = true
			(cb as CheckBox).button_pressed = true
	await runner.simulate_frames(3)
	_find_button(m, "Rendre le dossier").pressed.emit()
	await runner.simulate_frames(5)
	assert_object(_find_button(m, "Rendre le dossier")).is_null()
	var texts := ""
	for l in m.find_children("*", "Label", true, false):
		texts += (l as Label).text + "\n"
	assert_str(texts).contains("Score")
	assert_int(s.state.dossiers.size()).is_equal(1)
	assert_bool(s.state.dossiers[0]["practice"]).is_true()


func test_journal_tabs_and_season_report() -> void:
	var s := _new_session(6)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	screen.open_journal()
	await runner.simulate_frames(5)
	var j := screen.overlay.get_child(0)
	_find_button(j, "Accepter").pressed.emit()
	await runner.simulate_frames(5)
	assert_int(MissionSystem.with_status(s.state, "active").size()).is_equal(1)
	for tab: String in ["Compétences", "Trophées", "La saison", "Missions"]:
		_find_button(j, tab).pressed.emit()
		await runner.simulate_frames(3)
	var report := SeasonReport.markdown(s)
	assert_str(report).contains("Rapport de saison")
	assert_str(report).contains(str(s.scenario()["title"]))
	assert_str(report).contains("Questions pour le débriefing")




func _finish_speech(runner: GdUnitSceneRunner, screen: WorldScreen) -> void:
	for i in 12:
		await runner.simulate_frames(4)
		if not screen.speech.visible and not screen._busy:
			return
		if screen.speech.visible:
			await _answer(runner, screen, 0)


func test_collection_talk_pickup_and_discovery() -> void:
	_new_session(6)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	# Une rencontre : la touriste offre sa miniature, une vignette apparaît.
	screen.load_map("rue", Vector2i(51, 31), "down")
	await runner.simulate_frames(5)
	screen.talk_to(screen.npcs["touriste"])
	await _finish_speech(runner, screen)
	assert_bool(Game.collection.has("miniature_lanterne")).is_true()
	assert_bool(screen.hud._card_pop.visible).is_true()
	# Un objet posé au sol dans le hall : on le ramasse face à lui, une seule fois.
	screen.load_map("hall", Vector2i(2, 10), "down")
	await runner.simulate_frames(5)
	assert_bool(screen._pickups.has(Vector2i(2, 11))).is_true()
	screen.interact()
	await runner.simulate_frames(5)
	assert_bool(Game.collection.has("talkie")).is_true()
	assert_bool(screen._pickups.has(Vector2i(2, 11))).is_false()
	assert_int(Game.collection.count()).is_equal(2)
	screen.load_map("hall", Vector2i(2, 10), "down")
	await runner.simulate_frames(5)
	assert_bool(screen._pickups.has(Vector2i(2, 11))).override_failure_message("Un objet ramassé ne réapparaît pas").is_false()
	# La collection s'ouvre et se referme.
	screen.open_collection()
	await runner.simulate_frames(3)
	assert_int(screen.overlay.get_child_count()).is_equal(1)
	(screen.overlay.get_child(0) as Modal).close_modal()
	await runner.simulate_frames(3)
	assert_array(Game.collection.unseen).is_empty()


func test_archives_quest_through_the_locked_storeroom() -> void:
	_new_session(7)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	# Sans la clé, la porte de la réserve reste fermée.
	screen.load_map("coulisses", Vector2i(9, 10), "down")
	await runner.simulate_frames(5)
	screen._try_step("down")
	await runner.simulate_frames(20)
	assert_str(screen.map.id).is_equal("coulisses")
	assert_str(screen.hud._toast_text.text).contains("fermée à clé")
	# Fernand confie la clé : l'enquête commence (bulle « ? » au-dessus de lui).
	screen.load_map("rue", Vector2i(63, 32), "up")
	await runner.simulate_frames(5)
	assert_str(screen.npcs["fernand"].bubble).is_equal("question")
	screen.talk_to(screen.npcs["fernand"])
	await _finish_speech(runner, screen)
	assert_bool(Game.collection.known_clues.has("cle_reserve")).is_true()
	# La porte s'ouvre désormais.
	screen.load_map("coulisses", Vector2i(9, 10), "down")
	await runner.simulate_frames(5)
	screen._try_step("down")
	assert_bool(await _wait(runner, func() -> bool: return screen.map.id == "reserve" and not screen._busy)).is_true()
	assert_int(int(Game.collection.quest_steps["archives_oubliees"])).is_equal(2)
	# L'armoire des archives, puis retour chez Fernand.
	screen.use_spot(screen.map.spot("armoire_archives"))
	await _finish_speech(runner, screen)
	screen.load_map("rue", Vector2i(63, 32), "up")
	await runner.simulate_frames(5)
	screen.talk_to(screen.npcs["fernand"])
	await _finish_speech(runner, screen)
	assert_bool(await _wait(runner, func() -> bool: return not screen._showing_collection, 300)).is_true()
	assert_bool(Game.collection.has("affiche_1924")).is_true()
	assert_str(Game.collection.quest_status("archives_oubliees")).is_equal("done")


func test_the_lost_lantern_only_on_a_show_night() -> void:
	var s := _new_session(8)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	Game.collection.quest_steps["representation_perdue"] = 4
	screen.load_map("salle", Vector2i(10, 5), "up")
	await runner.simulate_frames(5)
	screen.interact()
	await _finish_speech(runner, screen)
	assert_bool(Game.collection.has("lanterne_ondine")).is_false()
	s.state.phase = GameState.PHASE_REPORT
	screen.interact()
	await _finish_speech(runner, screen)
	assert_bool(await _wait(runner, func() -> bool: return Game.collection.has("lanterne_ondine"), 100)).is_true()
	assert_bool(await _wait(runner, func() -> bool: return not screen._showing_collection, 400)).is_true()


func test_exhibited_objects_appear_in_the_hall() -> void:
	_new_session(9)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	for id: String in ["talkie", "masque_arlequin"]:
		Game.collection.owned[id] = Game.collection.owned.size() + 1
		Game.collection.set_exhibited(id, true)
	screen.load_map("hall", Vector2i(4, 10), "up")
	await runner.simulate_frames(5)
	var shown := 0
	for n in screen._map_root.get_children():
		if n is Sprite2D and (n as Sprite2D).texture == CollectionPanel.icon(Game.collection.object("talkie")):
			shown += 1
	assert_int(shown).is_equal(1)
	screen.interact()
	await runner.simulate_frames(3)
	assert_int(screen.overlay.get_child_count()).override_failure_message("Les vitrines ouvrent l'exposition").is_equal(1)


func test_sound_and_atmosphere_follow_the_world() -> void:
	var s := _new_session(12)
	var runner := scene_runner(WORLD)
	await runner.simulate_frames(10)
	var screen := runner.scene() as WorldScreen
	screen.load_map("rue", Vector2i(52, 33), "up")
	await runner.simulate_frames(10)
	assert_array(["ville_jour", "ville_fetes"]).contains([AudioDirector.current_music()])
	assert_bool(AudioDirector.ambience_levels().has("ville")).is_true()
	assert_object(screen._train).is_not_null()
	var emitters := screen._map_root.find_children("*", "AudioStreamPlayer2D", true, false)
	assert_int(emitters.size()).is_greater_equal(2)
	# Le soir, la lumière baisse et la musique de nuit prend le relais.
	s.state.phase = GameState.PHASE_REPORT
	screen.load_map("rue", Vector2i(52, 33), "up")
	await runner.simulate_frames(10)
	assert_str(AudioDirector.current_music()).is_equal("ville_nuit")
	assert_bool(screen._lights.visible).is_true()
	assert_float(screen._modulate.color.b).is_greater(screen._modulate.color.r)
	# À l'intérieur : plus de bruit de ville, l'ambiance du lieu.
	screen.load_map("reserve", Vector2i(7, 3), "down")
	await runner.simulate_frames(90)
	assert_str(AudioDirector.current_music()).is_equal("reserve")
	assert_bool(AudioDirector.ambience_levels().has("reserve")).is_true()
	assert_bool(await _wait(runner, func() -> bool: return not AudioDirector.ambience_levels().has("ville"), 300)).override_failure_message("La ville doit s'éteindre en fondu").is_true()
	# Le train finit par partir puis revenir (minuteries accélérées).
	screen.load_map("rue", Vector2i(48, 10), "up")
	await runner.simulate_frames(5)
	var was: bool = screen._train.visible
	screen._train_timer = 0.0
	await runner.simulate_frames(30)
	assert_bool(screen._train.has_meta("moving") or screen._train.visible != was).is_true()

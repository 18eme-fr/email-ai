extends GdUnitTestSuite
## Événements narratifs : déclenchement, conditions, effets distincts.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _session(game_seed: int = 2) -> GameSession:
	var s := GameSession.new(data)
	s.new_game(game_seed, "standard")
	return s


func test_forced_midseason_review_happens_at_turn_four() -> void:
	var s := _session()
	s.state.turn = 4
	s.state.cash = 5000
	assert_str(EventSystem.pick(data, s.state)).is_equal("bilan_mi_parcours")


func test_cash_alert_has_priority_when_overdrawn() -> void:
	var s := _session()
	s.state.turn = 4
	s.state.cash = -100
	assert_str(EventSystem.pick(data, s.state)).is_equal("alerte_tresorerie")


func test_once_events_are_not_repeated() -> void:
	var s := _session()
	s.state.turn = 4
	s.state.seen_events.append("bilan_mi_parcours")
	assert_str(EventSystem.pick(data, s.state)).is_not_equal("bilan_mi_parcours")


func test_conditions_on_programmed_shows() -> void:
	var s := _session()
	s.state.turn = 3
	assert_array(EventSystem.eligible(data, s.state)).not_contains(["annulation_maladie", "exigences_techniques"])
	s.state.programmed = [{"show_id": "danse_lignes", "price_level": "normal"}]
	assert_array(EventSystem.eligible(data, s.state)).contains(["annulation_maladie", "exigences_techniques", "bonnes_critiques"])


func test_every_event_offers_choices_with_different_effects() -> void:
	for id: String in data.event_order:
		var choices: Array = data.events[id]["choices"]
		assert_int(choices.size()).is_greater_equal(2)
		var signatures := {}
		for c: Dictionary in choices:
			signatures[JSON.stringify(c.get("effects", {}), "", true)] = true
		# Pas de faux choix : chaque option a des conséquences différentes.
		assert_int(signatures.size()).override_failure_message("Choix identiques dans %s" % id).is_equal(choices.size())


func test_choice_applies_cash_and_stats() -> void:
	var s := _session()
	s.state.turn = 2
	s.open_programming()
	s.confirm_programming([])
	s.confirm_actions([])
	s.state.current_event = "panne_console"
	s.state.event_choice = ""
	var eq := s.state.stat("equipement")
	s.choose_event("reparer")
	assert_float(s.state.stat("equipement")).is_greater(eq)
	var found := false
	for e: Dictionary in s.state.ledger:
		if e["label"] == "Console lumière d'occasion":
			found = true
			assert_int(int(e["amount"])).is_equal(1800)
	assert_bool(found).is_true()


func test_choice_cannot_be_made_twice() -> void:
	var s := _session()
	s.state.current_event = "journaliste"
	s.state.event_choice = ""
	s.choose_event("decliner")
	var equipe := s.state.stat("equipe")
	s.choose_event("interview")
	assert_str(s.state.event_choice).is_equal("decliner")
	assert_float(s.state.stat("equipe")).is_equal(equipe)


func test_blocked_choice_is_refused() -> void:
	var s := _session()
	s.state.stats["relations"] = 20.0
	s.state.current_event = "appel_projets"
	s.state.event_choice = ""
	assert_str(EventSystem.choice_block_reason(data, s.state, "appel_projets", "deposer_reseau")).is_not_empty()
	var result := s.choose_event("deposer_reseau")
	assert_dict(result).contains_keys(["error"])
	assert_str(s.state.event_choice).is_empty()


func test_chance_outcome_is_reproducible() -> void:
	var outcomes: Array = []
	for i in 2:
		var s := _session(77)
		s.state.turn = 3
		s.state.current_event = "journaliste"
		s.state.event_choice = ""
		s.choose_event("creation")
		outcomes.append(s.state.event_outcome["success"])
	assert_bool(outcomes[0] == outcomes[1]).is_true()


func test_conditional_subsidy_depends_on_objectives() -> void:
	var s := _session()
	s.state.stats["relations"] = 60.0
	s.state.totals = {"attendance_total": 0, "eac_count": 0, "art_count": 0, "shows_count": 0}
	assert_bool(SeasonEvaluator.conditional_subsidy_granted(data, s.state)).is_false()
	s.state.totals = {"attendance_total": 5000, "eac_count": 9, "art_count": 0, "shows_count": 10}
	assert_bool(SeasonEvaluator.conditional_subsidy_granted(data, s.state)).is_true()
	s.state.stats["relations"] = 10.0
	assert_bool(SeasonEvaluator.conditional_subsidy_granted(data, s.state)).is_false()

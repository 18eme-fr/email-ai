extends GdUnitTestSuite
## Déroulement d'une partie : début, tours, décisions, fin, reproductibilité.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _new(game_seed: int, difficulty: String = "standard") -> GameSession:
	var s := GameSession.new(data)
	s.new_game(game_seed, difficulty)
	return s


func test_new_game_initial_state() -> void:
	var s := _new(1)
	assert_int(s.state.turn).is_equal(1)
	assert_str(s.state.phase).is_equal(GameState.PHASE_SITUATION)
	assert_int(s.state.cash).is_equal(int(data.balance["start"]["cash"]))
	assert_int(s.state.offers.size()).is_equal(5)
	# La subvention est programmée en trois versements, le dernier conditionnel.
	var conditional := Ledger.conditional_entries(s.state)
	assert_int(conditional.size()).is_equal(1)


func test_difficulty_changes_starting_cash() -> void:
	assert_int(_new(1, "decouverte").state.cash).is_greater(_new(1, "standard").state.cash)
	assert_int(_new(1, "exigeant").state.cash).is_less(_new(1, "standard").state.cash)


func test_full_season_reaches_end_with_eight_reports() -> void:
	var s := _new(42)
	StrategyBot.new("equilibre", 42).play_season(s)
	assert_bool(s.state.finished).is_true()
	assert_int(s.state.reports.size()).is_equal(8)
	assert_str(s.state.phase).is_equal(GameState.PHASE_FINISHED)
	assert_dict(s.state.ending).contains_keys(["title", "objectives", "lessons", "renewed"])


func test_every_turn_can_be_resolved_even_with_nothing_programmed() -> void:
	var s := _new(7)
	StrategyBot.new("passive", 7).play_season(s)
	assert_bool(s.state.finished).is_true()
	assert_bool(s.state.bankrupt).is_false()
	assert_bool(bool(s.state.ending["renewed"])).is_false()


func test_same_seed_and_choices_give_same_season() -> void:
	var a := _new(99)
	var b := _new(99)
	StrategyBot.new("equilibre", 1).play_season(a)
	StrategyBot.new("equilibre", 1).play_season(b)
	assert_int(a.state.cash).is_equal(b.state.cash)
	assert_int(int(a.state.totals["attendance_total"])).is_equal(int(b.state.totals["attendance_total"]))


func test_different_seeds_give_different_seasons() -> void:
	var results := {}
	for game_seed in [1, 2, 3, 4, 5]:
		var s := _new(game_seed)
		StrategyBot.new("equilibre", 1).play_season(s)
		results[s.state.cash] = true
	assert_int(results.size()).is_greater(1)


func test_programming_rules_are_enforced() -> void:
	var s := _new(13)
	s.open_programming()
	var offers: Array = s.state.offers
	var too_many: Array = []
	for id: String in offers:
		too_many.append({"show_id": id, "price_level": "normal"})
	assert_str(s.confirm_programming(too_many)).is_not_empty()
	assert_str(s.confirm_programming([{"show_id": "inexistant", "price_level": "normal"}])).is_not_empty()
	assert_str(s.confirm_programming([{"show_id": offers[0], "price_level": "gratuit"}])).is_not_empty()
	assert_str(s.confirm_programming([{"show_id": offers[0], "price_level": "normal"}, {"show_id": offers[0], "price_level": "normal"}])).is_not_empty()
	assert_str(s.state.phase).is_equal(GameState.PHASE_PROGRAMMING)


func test_actions_capacity_is_enforced() -> void:
	var s := _new(13)
	s.open_programming()
	s.confirm_programming([])
	var all := data.action_order.duplicate()
	assert_str(s.confirm_actions(all)).is_not_empty()
	assert_str(s.confirm_actions(["mediation", "mediation"])).is_not_empty()
	assert_str(s.confirm_actions(["mediation"])).is_empty()


func test_unaffordable_spending_is_rejected() -> void:
	var s := _new(13)
	s.state.cash = int(data.balance["overdraft_limit"]) - 20000
	s.open_programming()
	# On choisit la proposition qui dégrade le plus la trésorerie dans le pire des cas.
	var worst := ""
	var worst_low := INF
	for id: String in s.state.offers:
		if Programming.unavailable_reason(data, s.state, id) == "":
			var low := float(s.projected_cash([{"show_id": id, "price_level": "normal"}], [])["low"])
			if low < worst_low:
				worst_low = low
				worst = id
	assert_float(worst_low).is_less(float(s.projected_cash([], [])["low"]))
	var err := s.confirm_programming([{"show_id": worst, "price_level": "normal"}])
	assert_str(err).contains("Dépenses refusées")
	# Ne rien programmer reste possible : le joueur n'est jamais bloqué.
	assert_str(s.confirm_programming([])).is_empty()


func test_actions_produce_their_effects() -> void:
	var s := _new(17)
	var before := s.state.stat("diversite")
	s.open_programming()
	s.confirm_programming([])
	s.confirm_actions(["mediation"])
	if s.state.current_event != "":
		s.choose_event(s.current_event()["choices"][0]["id"])
	s.resolve_turn()
	assert_float(s.state.stat("diversite")).is_greater(before - 0.01)
	assert_int(int(s.state.totals["eac_count"])).is_greater_equal(1)


func test_next_turn_draws_new_offers_without_played_shows() -> void:
	var s := _new(23)
	var first: String = s.state.offers[0]
	s.open_programming()
	s.confirm_programming([{"show_id": first, "price_level": "normal"}])
	s.confirm_actions([])
	if s.state.current_event != "":
		s.choose_event(s.current_event()["choices"][-1]["id"])
	s.resolve_turn()
	s.next_turn()
	assert_int(s.state.turn).is_equal(2)
	assert_array(s.state.offers).not_contains([first])


func test_resolve_requires_no_double_resolution() -> void:
	var s := _new(29)
	s.open_programming()
	s.confirm_programming([])
	s.confirm_actions([])
	if s.state.current_event != "":
		s.choose_event(s.current_event()["choices"][0]["id"])
	s.resolve_turn()
	var cash := s.state.cash
	s.resolve_turn()
	assert_int(s.state.cash).is_equal(cash)
	assert_int(s.state.reports.size()).is_equal(1)

extends GdUnitTestSuite
## Résolution d'une période : cohérence entre grand livre, trésorerie et rapport.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _session(game_seed: int = 11) -> GameSession:
	var s := GameSession.new(data)
	s.new_game(game_seed, "standard")
	return s


func _play_turn(session: GameSession, programmed: Array, actions: Array) -> Dictionary:
	session.open_programming()
	assert_str(session.confirm_programming(programmed)).is_empty()
	assert_str(session.confirm_actions(actions)).is_empty()
	if session.state.current_event != "":
		var choices: Array = session.current_event()["choices"]
		for c: Dictionary in choices:
			if EventSystem.choice_block_reason(data, session.state, session.state.current_event, c["id"]) == "":
				session.choose_event(c["id"])
				break
	return session.resolve_turn()


func test_cash_variation_equals_settled_flows() -> void:
	var session := _session()
	var id: String = session.state.offers[0]
	var report := _play_turn(session, [{"show_id": id, "price_level": "normal"}], ["communication"])
	var fin: Dictionary = report["finance"]
	assert_int(int(fin["variation"])).is_equal(int(fin["encaisse_total"]) - int(fin["decaisse_total"]))
	assert_int(int(fin["cash_after"])).is_equal(session.state.cash)
	assert_int(int(fin["cash_after"]) - int(fin["cash_before"])).is_equal(int(fin["variation"]))


func test_result_equals_engaged_income_minus_charges() -> void:
	var session := _session()
	var report := _play_turn(session, [], [])
	var fin: Dictionary = report["finance"]
	assert_int(int(fin["resultat"])).is_equal(int(fin["produits"]) - int(fin["charges"]))
	# Période 1 sans activité : subvention (40 %) − charges fixes.
	var subsidy := roundi(float(data.balance["municipal_subsidy"]["total"]) * 0.4)
	assert_int(int(fin["resultat"])).is_equal(subsidy - session.fixed_costs_total())


func test_each_expense_is_counted_once_across_season() -> void:
	# Somme des variations de trésorerie = encaissements − décaissements de tout le grand livre réglé.
	var session := _session(21)
	var bot := StrategyBot.new("equilibre", 21)
	var start_cash := session.state.cash
	bot.play_season(session)
	var settled_sum := 0
	for e: Dictionary in session.state.ledger:
		if e["settled"]:
			settled_sum += int(e["amount"]) * int(e["direction"])
	assert_int(session.state.cash - start_cash).is_equal(settled_sum)
	var report_sum := 0
	for r: Dictionary in session.state.reports:
		report_sum += int(r["finance"]["variation"])
	assert_int(report_sum).is_equal(session.state.cash - start_cash)


func test_vat_and_rights_are_paid_next_period() -> void:
	var session := _session(3)
	var hall_id := ""
	for id: String in session.state.offers:
		var show: Dictionary = data.shows[id]
		if show["format"] == "salle" and bool(show.get("rights", false)) and Programming.unavailable_reason(data, session.state, id) == "":
			hall_id = id
			break
	if hall_id == "":
		return
	_play_turn(session, [{"show_id": hall_id, "price_level": "normal"}], [])
	var deferred := 0
	for e: Dictionary in session.state.ledger:
		if e["category"] in ["tva", "droits"] and int(e["direction"]) == Ledger.EXPENSE:
			assert_bool(bool(e["settled"])).is_false()
			assert_int(int(e["due_turn"])).is_equal(2)
			deferred += 1
	assert_int(deferred).is_greater(0)


func test_cancelled_show_has_no_ticket_income() -> void:
	var session := _session(8)
	var hall_id := ""
	for id: String in session.state.offers:
		if data.shows[id]["format"] == "salle" and Programming.unavailable_reason(data, session.state, id) == "":
			hall_id = id
			break
	session.open_programming()
	session.confirm_programming([{"show_id": hall_id, "price_level": "normal"}])
	session.confirm_actions([])
	session.state.current_event = "annulation_maladie"
	session.state.event_choice = ""
	session.choose_event("annuler")
	var report := session.resolve_turn()
	assert_bool(bool(report["shows"][0]["cancelled"])).is_true()
	for e: Dictionary in session.state.ledger:
		assert_str(str(e["category"])).is_not_equal("billetterie")


func test_deficit_is_reported_and_bankruptcy_triggers_below_limit() -> void:
	var session := _session(4)
	session.state.cash = int(data.balance["overdraft_limit"]) + 100
	var report := _play_turn(session, [], [])
	# Les charges fixes font passer sous la limite… mais la subvention de période 1 compense :
	# on vérifie donc sur une période sans versement.
	if not session.state.bankrupt:
		session.next_turn()
		session.state.cash = int(data.balance["overdraft_limit"]) + 100
		report = _play_turn(session, [], [])
	assert_bool(session.state.bankrupt).is_true()
	assert_bool(session.state.finished).is_true()
	assert_str(str(session.state.ending["ending_id"])).is_equal("faillite")
	assert_array(report["warnings"]).is_not_empty()


func test_report_explains_results() -> void:
	var session := _session()
	var id: String = session.state.offers[0]
	var report := _play_turn(session, [{"show_id": id, "price_level": "normal"}], ["mediation"])
	assert_array(report["explanations"]).is_not_empty()
	assert_str(str(report["explanations"][0])).contains("Résultat de la période")
	assert_dict(report["stat_changes"]).contains_keys(["diversite"])


func test_digest_explains_the_result_in_a_few_lines() -> void:
	var session := _session()
	var report := _play_turn(session, [{"show_id": session.state.offers[0], "price_level": "normal"}], ["communication"])
	var d := ReportDigest.digest(session, report)
	var total := 0
	for line: Dictionary in d["lines"]:
		total += int(line["amount"])
	assert_int(total).is_equal(int(report["finance"]["resultat"]))
	assert_int((d["lines"] as Array).size()).is_less_equal(9)
	assert_int((d["figures"] as Array).size()).is_equal(3)
	assert_str(str(d["verdict"])).contains("cette période")
	assert_str(str(d["tip"])).is_not_empty()
	# Relâche : le conseil invite à programmer.
	var idle := _session(12)
	var empty := _play_turn(idle, [], [])
	assert_str(str(ReportDigest.digest(idle, empty)["tip"])).contains("programmez")

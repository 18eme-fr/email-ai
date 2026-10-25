extends GdUnitTestSuite
## Rénovations du théâtre : l'investissement sort de la trésorerie à l'achat,
## le résultat ne supporte que les amortissements, les effets durent.


func _session() -> GameSession:
	var s := GameSession.new()
	s.new_game(2024, "standard")
	return s


## Joue la période en cours sans spectacle ni action (phase par phase).
func _play_empty_turn(s: GameSession) -> Dictionary:
	s.open_programming()
	assert_str(s.confirm_programming([])).is_empty()
	assert_str(s.confirm_actions([])).is_empty()
	if s.state.current_event != "":
		var event := s.current_event()
		for choice: Dictionary in event["choices"]:
			if EventSystem.choice_block_reason(s.data, s.state, s.state.current_event, str(choice["id"])) == "":
				s.choose_event(str(choice["id"]))
				break
	return s.resolve_turn()


func test_every_upgrade_is_valid() -> void:
	var data := GameData.get_default()
	assert_int(data.upgrade_order.size()).is_greater_equal(4)
	for id: String in data.upgrade_order:
		var u: Dictionary = data.upgrades[id]
		assert_int(int(u["cost"])).is_greater(0)
		assert_int(int(u["useful_life_years"])).is_greater(0)
		assert_bool(data.glossary.has(str(u["notion"]))).is_true()
		assert_bool(data.characters.has(str(u["character"]))).is_true()
		for stat: String in u.get("effects", {}).get("stats", {}):
			assert_bool(stat in GameState.STAT_IDS).is_true()
		for stat: String in u.get("per_turn", {}).get("stats", {}):
			assert_bool(stat in GameState.STAT_IDS).is_true()


func test_purchase_hits_cash_not_result() -> void:
	var s := _session()
	var cost := int(s.data.upgrades["loges"]["cost"])
	var per := s.amortization_per_turn("loges")
	assert_int(per).is_equal(roundi(1600.0 / 80.0))
	assert_str(s.buy_upgrade("loges")).is_empty()
	var cash_before := s.state.cash
	var report := _play_empty_turn(s)
	var fin: Dictionary = report["finance"]
	# Le prix entier part de la trésorerie dans la période (payable comptant)…
	var paid := 0
	for line: Dictionary in fin["decaissements"]:
		if line["category"] == "investissement":
			paid += int(line["amount"])
	assert_int(paid).is_equal(cost)
	# … mais le résultat n'en supporte que la dotation de la période.
	var amort := 0
	for line: Dictionary in fin["charges_detail"]:
		if line["category"] == "investissement":
			fail("L'investissement ne doit pas compter en charge.")
		if line["category"] == "amortissement":
			amort += int(line["amount"])
	assert_int(amort).is_equal(per)
	assert_int(int(fin["variation"])).is_equal(s.state.cash - cash_before)


func test_amortization_never_moves_cash() -> void:
	var s := _session()
	assert_str(s.buy_upgrade("enseigne")).is_empty()
	var non_cash_total := 0
	for e: Dictionary in s.state.ledger:
		if e.get("non_cash", false):
			non_cash_total += int(e["amount"])
	assert_int(non_cash_total).is_equal(s.amortization_per_turn("enseigne") * s.data.turns())
	# Rien à payer « plus tard » au titre des amortissements.
	var outstanding := Ledger.outstanding_total(s.state, Ledger.EXPENSE)
	assert_int(outstanding).is_equal(int(s.data.upgrades["enseigne"]["cost"]))
	var cash_flow := 0
	for t in range(1, s.data.turns() + 1):
		var before := s.state.cash
		for e in Ledger.settle_due(s.state, t):
			assert_bool(e.get("non_cash", false)).is_false()
		cash_flow += s.state.cash - before
	# Seuls le prix de l'enseigne et les subventions programmées ont bougé la trésorerie.
	var expected := -int(s.data.upgrades["enseigne"]["cost"])
	for e: Dictionary in s.state.ledger:
		if e["category"] == "subvention" and not e["conditional"]:
			expected += int(e["amount"])
	assert_int(cash_flow).is_equal(expected)


func test_upgrade_is_bought_once_and_only_before_the_event() -> void:
	var s := _session()
	assert_str(s.buy_upgrade("foyer_bar")).is_empty()
	assert_str(s.buy_upgrade("foyer_bar")).is_not_empty()
	assert_str(s.buy_upgrade("inconnue")).is_not_empty()
	s.open_programming()
	s.confirm_programming([])
	s.confirm_actions([])
	assert_str(s.upgrade_block_reason("loges")).is_not_empty()
	assert_array(s.state.upgrades).contains_exactly(["foyer_bar"])


func test_upgrade_refused_when_cash_would_break_the_overdraft() -> void:
	var s := _session()
	# Trésorerie prévue (subvention de la période comprise) juste au-dessus du découvert autorisé.
	var margin := int(s.projected_cash([], [])["low"]) - int(s.data.balance["overdraft_limit"])
	s.state.cash -= margin - 500
	assert_str(s.upgrade_block_reason("projecteurs_led")).contains("Trésorerie insuffisante")
	assert_str(s.buy_upgrade("projecteurs_led")).is_not_empty()
	assert_array(s.state.upgrades).is_empty()


func test_per_turn_effects_and_income_apply_every_period() -> void:
	var s := _session()
	assert_str(s.buy_upgrade("foyer_bar")).is_empty()
	for turn in 2:
		var report := _play_empty_turn(s)
		var bar := 0
		for line: Dictionary in report["finance"]["produits_detail"]:
			if line["category"] == "renovation":
				bar += int(line["amount"])
		assert_int(bar).is_equal(int(s.data.upgrades["foyer_bar"]["per_turn"]["income"]))
		assert_bool(report["stat_changes"].get("fidelite", {}).has("Foyer-bar rénové")).is_true()
		s.next_turn()


func test_late_purchase_amortizes_only_remaining_periods() -> void:
	var s := _session()
	s.state.turn = 7
	assert_str(s.buy_upgrade("accessibilite")).is_empty()
	var count := 0
	for e: Dictionary in s.state.ledger:
		if e["category"] == "amortissement":
			count += 1
			assert_int(int(e["turn_engaged"])).is_greater_equal(7)
	assert_int(count).is_equal(2)

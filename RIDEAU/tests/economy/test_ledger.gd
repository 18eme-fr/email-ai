extends GdUnitTestSuite
## Grand livre : engagement vs règlement, absence de double comptage, rejets.


func _state() -> GameState:
	var s := GameState.new()
	s.cash = 10000
	for id: String in GameState.STAT_IDS:
		s.stats[id] = 50.0
	return s


func test_expense_paid_now_moves_cash_once() -> void:
	var s := _state()
	Ledger.add(s, "Cachet", "artistique", 3000, Ledger.EXPENSE, 1, 1)
	Ledger.settle_due(s, 1)
	assert_int(s.cash).is_equal(7000)
	# Un second règlement ne doit rien débiter de plus.
	Ledger.settle_due(s, 1)
	Ledger.settle_due(s, 2)
	assert_int(s.cash).is_equal(7000)


func test_deferred_expense_counts_in_result_but_not_in_cash() -> void:
	var s := _state()
	Ledger.add(s, "Facture à 30 jours", "action", 900, Ledger.EXPENSE, 1, 2)
	Ledger.settle_due(s, 1)
	assert_int(s.cash).is_equal(10000)
	assert_int(Ledger.result_of(s, 1)).is_equal(-900)
	assert_int(Ledger.outstanding_total(s, Ledger.EXPENSE)).is_equal(900)
	Ledger.settle_due(s, 2)
	assert_int(s.cash).is_equal(9100)
	assert_int(Ledger.result_of(s, 2)).is_equal(0)
	assert_int(Ledger.outstanding_total(s, Ledger.EXPENSE)).is_equal(0)


func test_expected_income_is_not_cash_until_due() -> void:
	var s := _state()
	Ledger.add(s, "Aide votée", "subvention", 1500, Ledger.INCOME, 2, 4)
	for t in [2, 3]:
		Ledger.settle_due(s, t)
	assert_int(s.cash).is_equal(10000)
	assert_int(Ledger.result_of(s, 2)).is_equal(1500)
	Ledger.settle_due(s, 4)
	assert_int(s.cash).is_equal(11500)


func test_negative_or_zero_amounts_are_rejected() -> void:
	var s := _state()
	assert_dict(Ledger.add(s, "Négatif", "x", -500, Ledger.EXPENSE, 1, 1)).is_empty()
	assert_dict(Ledger.add(s, "Nul", "x", 0, Ledger.INCOME, 1, 1)).is_empty()
	assert_dict(Ledger.add(s, "Sens invalide", "x", 100, 0, 1, 1)).is_empty()
	assert_int(s.ledger.size()).is_equal(0)


func test_neutral_entries_move_cash_without_result() -> void:
	var s := _state()
	Ledger.add(s, "TVA collectée", "tva", 200, Ledger.INCOME, 1, 1, {"neutral": true})
	Ledger.add(s, "TVA reversée", "tva", 200, Ledger.EXPENSE, 1, 2, {"neutral": true})
	Ledger.settle_due(s, 1)
	assert_int(s.cash).is_equal(10200)
	assert_int(Ledger.result_of(s, 1)).is_equal(0)
	Ledger.settle_due(s, 2)
	assert_int(s.cash).is_equal(10000)


func test_conditional_entries_wait_for_confirmation() -> void:
	var s := _state()
	var e := Ledger.add(s, "Solde", "subvention", 5000, Ledger.INCOME, 8, 8, {"conditional": true})
	Ledger.settle_due(s, 8)
	assert_int(s.cash).is_equal(10000)
	assert_int(Ledger.result_of(s, 8)).is_equal(0)
	Ledger.confirm_conditional(e)
	Ledger.settle_due(s, 8)
	assert_int(s.cash).is_equal(15000)


func test_cancelled_conditional_entry_never_pays() -> void:
	var s := _state()
	var e := Ledger.add(s, "Solde", "subvention", 5000, Ledger.INCOME, 8, 8, {"conditional": true})
	Ledger.cancel(e)
	Ledger.confirm_conditional(e)
	Ledger.settle_due(s, 8)
	assert_int(s.cash).is_equal(10000)


func test_due_turn_cannot_precede_engagement() -> void:
	var s := _state()
	var e := Ledger.add(s, "Rétroactif", "x", 100, Ledger.EXPENSE, 3, 1)
	assert_int(int(e["due_turn"])).is_equal(3)

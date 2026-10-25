extends GdUnitTestSuite
## Demande, jauge, TVA, contrats et estimations.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _session(game_seed: int = 5) -> GameSession:
	var s := GameSession.new(data)
	s.new_game(game_seed, "standard")
	return s


func test_finance_cession_pays_fixed_fee_and_rights() -> void:
	var show: Dictionary = data.shows["comedie_diner"]
	var fin := ShowEconomics.finance(data, show, 10550, 2)
	# TVA 5,5 % incluse dans le prix TTC : 10 550 / 1,055 = 10 000 net.
	assert_int(fin["vat"]).is_equal(550)
	assert_int(fin["net"]).is_equal(10000)
	assert_int(fin["fee"]).is_equal(int(show["fee"]))
	assert_int(fin["company_share"]).is_equal(0)
	assert_int(fin["rights"]).is_equal(1050)  # 10,5 % de la recette nette
	assert_int(fin["tech"]).is_equal(int(show["tech_cost"]) * 2)
	assert_int(fin["margin"]).is_equal(fin["net"] - fin["costs"])
	assert_int(fin["costs"]).is_equal(fin["fee"] + fin["tech"] + fin["hosting"] + fin["rights"])


func test_finance_corealisation_shares_net_receipts() -> void:
	var show: Dictionary = data.shows["contemporain_heures"]
	var fin := ShowEconomics.finance(data, show, 10550, 2)
	assert_int(fin["fee"]).is_equal(0)
	assert_int(fin["company_share"]).is_equal(7000)
	# Sans billetterie, la coréalisation ne coûte que les frais techniques et d'accueil.
	var empty := ShowEconomics.finance(data, show, 0, 2)
	assert_int(empty["company_share"]).is_equal(0)
	assert_int(empty["costs"]).is_equal(int(show["tech_cost"]) * 2 + int(show["hosting"]))


func test_creation_uses_super_reduced_vat_and_public_domain_has_no_rights() -> void:
	var creation := ShowEconomics.finance(data, data.shows["creation_machine"], 1021, 1)
	assert_int(creation["vat"]).is_equal(21)
	var moliere := ShowEconomics.finance(data, data.shows["classique_malade"], 5000, 2)
	assert_int(moliere["rights"]).is_equal(0)


func test_seats_never_exceed_capacity() -> void:
	var session := _session()
	var s := session.state
	s.stats["communication"] = 100.0
	s.stats["fidelite"] = 100.0
	s.stats["reputation"] = 100.0
	s.turn_mods["demand_mult"] = 5.0
	for id: String in data.show_order:
		var show: Dictionary = data.shows[id]
		var plan := ShowEconomics.rep_plan(data, s, show, "reduit", 0)
		for i in 30:
			var seats := ShowEconomics.draw_seats(data, s, show, plan, SeededRng.make(i, 1, 4, 0))
			for r in plan.size():
				assert_int(int(seats[r])).is_between(0, int(plan[r]["capacity"]))
		var est := ShowEconomics.estimate(data, s, show, "reduit")
		assert_int(int(est["seats_high"])).is_less_equal(int(est["capacity_total"]))


func test_estimate_range_is_ordered() -> void:
	var session := _session()
	for id: String in data.show_order:
		var est := ShowEconomics.estimate(data, session.state, data.shows[id], "normal")
		assert_int(int(est["seats_low"])).is_less_equal(int(est["seats"]))
		assert_int(int(est["seats"])).is_less_equal(int(est["seats_high"]))
		assert_int(int(est["margin_low"])).is_less_equal(int(est["margin_high"]))


func test_lower_price_increases_attendance() -> void:
	var session := _session()
	var low := ShowEconomics.estimate(data, session.state, data.shows["comedie_diner"], "reduit")
	var high := ShowEconomics.estimate(data, session.state, data.shows["comedie_diner"], "plein")
	assert_int(int(low["seats"])).is_greater_equal(int(high["seats"]))


func test_communication_increases_demand() -> void:
	var session := _session()
	var show: Dictionary = data.shows["contemporain_heures"]
	var before := ShowEconomics.expected_fill(data, session.state, show, "normal")
	session.state.stats["communication"] = 80.0
	assert_float(ShowEconomics.expected_fill(data, session.state, show, "normal")).is_greater(before)


func test_full_house_is_not_always_profitable() -> void:
	# Une salle pleine à tarif solidaire peut rester déficitaire : la fréquentation n'est pas la rentabilité.
	var show: Dictionary = data.shows["cirque_bascule"]
	var capacity := data.show_capacity(show) * int(show["representations"])
	var gross := roundi(capacity * float(show["price"]) * 0.75)
	var fin := ShowEconomics.finance(data, show, gross, int(show["representations"]))
	assert_int(int(fin["margin"])).is_less(0)


func test_incident_probability_only_when_equipment_is_low() -> void:
	var session := _session()
	var show: Dictionary = data.shows["danse_lignes"]
	session.state.stats["equipement"] = 80.0
	assert_float(ShowEconomics.incident_probability(data, session.state, show)).is_equal(0.0)
	session.state.stats["equipement"] = 20.0
	assert_float(ShowEconomics.incident_probability(data, session.state, show)).is_greater(0.0)

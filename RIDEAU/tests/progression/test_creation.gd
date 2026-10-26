extends GdUnitTestSuite
## Création avec le metteur en scène : une étape par période, rattrapage, choix
## tranchés au départ, accueil à Paris déterministe et récompensant la cohérence.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func _state(turn: int = 1) -> GameState:
	var s := GameSession.new(data)
	s.new_game(5, "standard")
	s.state.turn = turn
	return s.state


func test_data_has_eight_steps_of_three_options_and_a_place_each_month() -> void:
	var steps := CreationSystem.steps(data)
	assert_int(steps.size()).is_equal(data.turns())
	var world := WorldData.get_default()
	for st: Dictionary in steps:
		assert_int((st["options"] as Array).size()).is_equal(3)
		var visions := {}
		for o: Dictionary in st["options"]:
			visions[o["vision"]] = true
			assert_bool(data.creation["visions"].has(o["vision"])).is_true()
		assert_int(visions.size()).override_failure_message("%s : une option par vision" % st["id"]).is_equal(3)
	for key: String in ["1", "2", "3", "4", "5", "6", "7", "8", "depart"]:
		var loc: Dictionary = data.creation["locations"][key]
		var m := world.map(str(loc["map"]))
		assert_object(m).override_failure_message("Lieu inconnu : %s" % loc["map"]).is_not_null()
		var c := WorldMap.to_cell(loc["cell"])
		assert_bool(m.is_walkable(c) and m.door_at(c).is_empty()).override_failure_message("Lazare mal placé (%s)" % key).is_true()


func test_one_step_opens_each_period_and_missed_steps_can_be_caught_up() -> void:
	var s := _state(1)
	assert_str(str(CreationSystem.pending_step(data, s)["id"])).is_equal("sujet")
	assert_str(CreationSystem.choose(data, s, "forme", "texte")).is_not_empty()  # pas encore ouverte
	assert_str(CreationSystem.choose(data, s, "sujet", "inconnue")).is_not_empty()
	assert_str(CreationSystem.choose(data, s, "sujet", "memoire")).is_empty()
	assert_dict(CreationSystem.pending_step(data, s)).is_empty()
	s.turn = 4  # trois mois sans aller le voir
	assert_int(CreationSystem.pending_count(data, s)).is_equal(3)
	assert_str(str(CreationSystem.pending_step(data, s)["id"])).is_equal("forme")


func test_lazare_moves_every_month_then_waits_at_the_station() -> void:
	var s := _state(1)
	var seen := {}
	for t in range(1, 9):
		s.turn = t
		var loc := CreationSystem.location(data, s)
		seen["%s %s" % [loc["map"], loc["cell"]]] = true
	assert_int(seen.size()).is_equal(8)
	s.finished = true
	assert_str(str(CreationSystem.location(data, s)["where"])).contains("gare")
	CreationSystem.play_premiere(data, s, 50.0)
	assert_dict(CreationSystem.location(data, s)).is_empty()


func test_departure_fills_missing_choices_with_the_dominant_vision() -> void:
	var s := _state(3)
	CreationSystem.choose(data, s, "sujet", "texte_neuf")
	CreationSystem.choose(data, s, "forme", "marionnettes")
	s.finished = true
	var filled := CreationSystem.fill_defaults(data, s)
	assert_int(filled.size()).is_equal(6)
	assert_int(int(CreationSystem.vision_counts(data, s)["moderne"])).is_equal(8)
	assert_array(s.creation["defaulted"]).contains(["titre"])
	assert_str(CreationSystem.show_title(data, s)).is_equal("Ondine, nuit blanche")
	assert_str(CreationSystem.show_title(data, s, true)).is_equal("ONDINE, NUIT BLANCHE")


func _all(s: GameState, vision: String) -> void:
	s.finished = true
	for st: Dictionary in CreationSystem.steps(data):
		for o: Dictionary in st["options"]:
			if o["vision"] == vision:
				assert_str(CreationSystem.choose(data, s, st["id"], o["id"])).is_empty()


func test_a_coherent_creation_is_rewarded_and_each_vision_can_triumph() -> void:
	for vision: String in ["classique", "moderne", "populaire"]:
		var s := _state(8)
		_all(s, vision)
		var r := CreationSystem.reception(data, s, 70.0)
		assert_str(str(r["id"])).override_failure_message("%s : %s" % [vision, r]).is_equal("triomphe")
		assert_str(str(r["critic"])).contains(CreationSystem.show_title(data, s))
		var weak := CreationSystem.reception(data, s, 0.0)
		assert_int(int(weak["score"])).is_less(int(r["score"]))
	# Un spectacle qui change de direction à chaque étape est moins bien reçu.
	var mixed := _state(8)
	mixed.finished = true
	var visions := ["classique", "moderne", "populaire"]
	var i := 0
	for st: Dictionary in CreationSystem.steps(data):
		for o: Dictionary in st["options"]:
			if o["vision"] == visions[i % 3]:
				CreationSystem.choose(data, mixed, st["id"], o["id"])
		i += 1
	var rm := CreationSystem.reception(data, mixed, 70.0)
	assert_array(["mitige", "difficile"]).contains([str(rm["id"])])


func test_premiere_is_deterministic_and_stored() -> void:
	var a := _state(8)
	var b := _state(8)
	_all(a, "populaire")
	_all(b, "populaire")
	var ra := CreationSystem.play_premiere(data, a, 42.0)
	assert_dict(ra).is_equal(CreationSystem.play_premiere(data, b, 42.0))
	assert_dict(a.creation["paris"]).is_equal(ra)
	assert_int(CreationSystem.summary(data, a).size()).is_equal(8)


func test_never_meeting_the_director_costs_the_premiere() -> void:
	var alone := _state(8)
	alone.finished = true
	var r := CreationSystem.play_premiere(data, alone, 70.0)
	assert_array(["mitige", "difficile"]).contains([str(r["id"])])
	var together := _state(8)
	_all(together, "classique")
	assert_int(int(CreationSystem.play_premiere(data, together, 70.0)["score"])).is_greater(int(r["score"]) + 25)

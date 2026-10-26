extends GdUnitTestSuite
## Monde explorable : cartes cohérentes, tout est atteignable à pied, chaque
## décision de gestion a un lieu, l'objectif suit les étapes du tour.

var world: WorldData
var data: GameData


func before() -> void:
	world = WorldData.get_default()
	data = GameData.get_default()


func test_maps_are_rectangular_and_use_the_legend() -> void:
	assert_int(world.maps.size()).is_equal(6)
	for id: String in world.maps:
		var m: WorldMap = world.maps[id]
		for y in m.size.y:
			assert_int(m.rows[y].length()).override_failure_message("%s ligne %d" % [id, y]).is_equal(m.size.x)
			for ch in m.rows[y]:
				assert_bool(m.legend.has(ch)).override_failure_message("%s : caractère « %s » hors légende" % [id, ch]).is_true()


func test_doors_lead_to_walkable_cells_and_back() -> void:
	for id: String in world.maps:
		var m: WorldMap = world.maps[id]
		for d: Dictionary in m.doors:
			assert_bool(m.is_walkable(d["cell"])).override_failure_message("%s : porte %s non praticable" % [id, d["cell"]]).is_true()
			var target := world.map(str(d["to"]))
			assert_object(target).is_not_null()
			assert_bool(target.is_walkable(d["to_cell"])).override_failure_message("%s → %s : arrivée %s" % [id, d["to"], d["to_cell"]]).is_true()
			assert_bool(target.door_at(d["to_cell"]).is_empty()).override_failure_message("%s → %s : arrivée sur une porte" % [id, d["to"]]).is_true()
			var back := false
			for d2: Dictionary in target.doors:
				if d2["to"] == id:
					back = true
			assert_bool(back).override_failure_message("%s → %s sans retour" % [id, d["to"]]).is_true()


func test_every_spot_and_npc_is_reachable_on_foot() -> void:
	for id: String in world.maps:
		var m: WorldMap = world.maps[id]
		var entry: Vector2i = m.doors[0]["cell"]
		var origin := entry
		for dir: Vector2i in WorldMap.DIRS.values():
			if m.is_walkable(entry + dir) and m.door_at(entry + dir).is_empty():
				origin = entry + dir
		for sp: Dictionary in m.spots:
			var cell := m.approach_cell(str(sp["id"]))
			assert_bool(m.in_bounds(cell)).override_failure_message("%s : %s sans case d'approche" % [id, sp["id"]]).is_true()
			if cell != origin:
				assert_array(m.find_path(origin, cell)).override_failure_message("%s : %s inaccessible" % [id, sp["id"]]).is_not_empty()
		for n: Dictionary in m.npcs:
			assert_bool(m.is_walkable(n["cell"])).override_failure_message("%s : %s mal placé" % [id, n["id"]]).is_true()
			assert_bool(world.people.has(str(n["id"]))).is_true()
		for d: Dictionary in m.doors:
			if d["cell"] != entry:
				assert_array(m.find_path(origin, d["cell"])).override_failure_message("%s : porte %s inaccessible" % [id, d["cell"]]).is_not_empty()


func test_player_start_is_valid() -> void:
	var m := world.map(str(world.start["map"]))
	assert_bool(m.is_walkable(WorldMap.to_cell(world.start["cell"]))).is_true()


func test_path_avoids_people_and_stops_before_objects() -> void:
	var m := world.map("bureau")
	var path := m.find_path(Vector2i(6, 8), Vector2i(6, 4))
	assert_array(path).is_not_empty()
	assert_object(path.back()).is_equal(Vector2i(6, 5))
	var blocked: Array = [Vector2i(6, 7)]
	for c: Vector2i in m.find_path(Vector2i(6, 8), Vector2i(6, 5), blocked):
		assert_bool(c in blocked).is_false()


func test_every_action_and_upgrade_has_a_place() -> void:
	var sources := WorldRules.action_sources(world)
	for action_id: String in data.action_order:
		var found := false
		for src: Dictionary in sources:
			if src["action"] == action_id:
				found = true
		assert_bool(found).override_failure_message("Action sans lieu : %s" % action_id).is_true()
	for upgrade_id: String in data.upgrade_order:
		var found := false
		for id: String in world.maps:
			for sp: Dictionary in (world.maps[id] as WorldMap).spots:
				if sp.get("upgrade", "") == upgrade_id:
					found = true
					assert_str(id).is_equal(str(data.upgrades[upgrade_id]["place"]))
		assert_bool(found).override_failure_message("Rénovation sans lieu : %s" % upgrade_id).is_true()


func test_every_period_has_a_season() -> void:
	for t in range(1, data.turns() + 1):
		assert_bool(WorldRules.SEASON_LABELS.has(WorldRules.season(world, t))).is_true()


func test_everyone_has_something_to_say() -> void:
	var s := GameSession.new()
	s.new_game(77, "standard")
	var speakers: Array = []
	for pid: String in world.people:
		speakers.append(world.bark_key(pid))
	for id: String in world.maps:
		for sp: Dictionary in (world.maps[id] as WorldMap).spots:
			if sp["kind"] == "flavor":
				speakers.append(WorldData.spot_bark_key(sp))
	for who: String in speakers:
		for roll in [0.0, 0.5, 0.99]:
			assert_str(WorldRules.bark(data, s.state, world, who, roll)).override_failure_message("Rien à dire : %s" % who).is_not_empty()


func test_bark_prefers_the_most_specific_line() -> void:
	var s := GameSession.new()
	s.new_game(77, "standard")
	s.state.set_stat("equipement", 20.0)
	assert_str(WorldRules.bark(data, s.state, world, "bastien", 0.0)).contains("projecteur 4")
	s.state.upgrades.append("projecteurs_led")
	s.state.set_stat("equipement", 70.0)
	assert_str(WorldRules.bark(data, s.state, world, "bastien", 0.0)).contains("LED")


func test_objective_follows_the_turn() -> void:
	var s := GameSession.new()
	s.new_game(5, "standard")
	assert_str(str(WorldRules.objective(s)["id"])).is_equal("cahier")
	s.open_programming()
	s.confirm_programming([])
	assert_str(str(WorldRules.objective(s)["text"])).contains("0 / %d" % s.action_capacity())
	assert_str(s.plan_action("communication", true)).is_empty()
	assert_str(str(WorldRules.objective(s)["text"])).contains("1 / ")
	s.confirm_actions(s.state.actions.duplicate())
	var obj := WorldRules.objective(s)
	if s.state.current_event != "":
		assert_str(str(obj["kind"])).is_equal("npc")
		assert_str(str(obj["id"])).is_equal(str(s.current_event()["character"]))
		assert_bool(world.maps.has(str(obj["map"]))).is_true()


func test_plan_action_respects_phase_and_capacity() -> void:
	var s := GameSession.new()
	s.new_game(9, "standard")
	assert_str(s.plan_action("communication", true)).is_not_empty()
	s.open_programming()
	s.confirm_programming([])
	var cap := s.action_capacity()
	var planned := 0
	for id: String in data.action_order:
		var err := s.plan_action(id, true)
		if planned < cap:
			assert_str(err).is_empty()
			planned += 1
		else:
			assert_str(err).is_not_empty()
	assert_int(s.state.actions.size()).is_equal(cap)
	assert_str(s.plan_action(str(s.state.actions[0]), false)).is_empty()
	assert_int(s.state.actions.size()).is_equal(cap - 1)
	assert_str(s.confirm_actions(s.state.actions.duplicate())).is_empty()


func test_the_city_has_districts_bus_stops_and_inhabitants() -> void:
	var city := world.map("rue")
	assert_int(city.size.x * city.size.y).is_greater_equal(100 * 70)
	assert_int(city.districts.size()).is_greater_equal(6)
	assert_int(city.npcs.size()).is_greater_equal(25)
	# Chaque case praticable appartient à un quartier (le nom s'affiche en marchant).
	for y in city.size.y:
		for x in city.size.x:
			if city.is_walkable(Vector2i(x, y)):
				assert_bool(city.district_at(Vector2i(x, y)).is_empty()).override_failure_message("case %d,%d hors quartier" % [x, y]).is_false()
	# Les arrêts de bus mènent à des cases libres, reliées à pied au théâtre.
	var stops := city.bus_stops()
	assert_int(stops.size()).is_greater_equal(4)
	var theatre: Vector2i = city.doors[0]["cell"] + Vector2i(0, 1)
	for stop: Dictionary in stops:
		assert_str(str(stop.get("stop", ""))).is_not_empty()
		var arrive := WorldMap.to_cell(stop["arrive"])
		assert_bool(city.is_walkable(arrive)).override_failure_message("%s : arrivée bloquée" % stop["id"]).is_true()
		assert_bool(city.door_at(arrive).is_empty()).is_true()
		assert_array(city.find_path(theatre, arrive)).override_failure_message("%s inaccessible à pied" % stop["id"]).is_not_empty()


func test_every_person_has_a_sprite() -> void:
	for pid: String in world.people:
		var sprite := str(world.people[pid].get("sprite", pid))
		assert_bool(ResourceLoader.exists("res://assets/world/people/%s.png" % sprite)).override_failure_message("Sprite manquant : %s" % sprite).is_true()

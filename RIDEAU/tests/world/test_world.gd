extends GdUnitTestSuite
## Monde explorable : cartes cohérentes, tout est atteignable à pied, chaque
## décision de gestion a un lieu, l'objectif suit les étapes du tour.

var world: WorldData
var data: GameData


func before() -> void:
	world = WorldData.get_default()
	data = GameData.get_default()


func test_maps_are_rectangular_and_use_the_legend() -> void:
	assert_int(world.maps.size()).is_equal(38)  # ville, 9 pièces du théâtre, 27 intérieurs, Paris
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
		# Paris n'a pas de porte : on y arrive par le train, devant la gare.
		var entry: Vector2i = m.doors[0]["cell"] if not m.doors.is_empty() else WorldMap.to_cell(world.raw["maps"][id]["arrival"]["cell"])
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


func test_time_of_day_and_weather() -> void:
	var s := GameSession.new()
	s.new_game(31, "standard")
	assert_str(WorldRules.time_of_day(s.state)).is_equal("matin")
	s.state.phase = GameState.PHASE_MANAGEMENT
	assert_str(WorldRules.time_of_day(s.state)).is_equal("jour")
	s.state.phase = GameState.PHASE_EVENT
	assert_str(WorldRules.time_of_day(s.state)).is_equal("fin_de_journee")
	s.state.phase = GameState.PHASE_REPORT
	assert_str(WorldRules.time_of_day(s.state)).is_equal("nuit")
	# Même graine, même période : même ciel. La neige n'existe qu'en hiver.
	var seen := {}
	for g in 40:
		var st := GameSession.new()
		st.new_game(g, "standard")
		for t in range(1, data.turns() + 1):
			st.state.turn = t
			var w := WorldRules.weather(world, st.state)
			assert_str(w).is_equal(WorldRules.weather(world, st.state))
			seen[w] = true
			if w == "neige":
				assert_str(WorldRules.season(world, t)).is_equal("hiver")
	assert_bool(seen.has("pluie") and seen.has("neige") and seen.has("clair")).is_true()


func test_soundscape_follows_place_time_and_weather() -> void:
	var city := world.map("rue")
	var park := Vector2i(10, 30)
	var day := WorldRules.soundscape(city, park, "printemps", "jour", "clair", false, 99)
	assert_str(str(day["music"])).is_equal("ville_jour")
	assert_bool((day["layers"] as Dictionary).has("oiseaux")).is_true()
	assert_bool((day["layers"] as Dictionary).has("pluie")).is_false()
	var night := WorldRules.soundscape(city, park, "ete", "nuit", "pluie", false, 2)
	assert_str(str(night["music"])).is_equal("ville_nuit")
	var layers: Dictionary = night["layers"]
	assert_bool(layers.has("grillons")).is_true()
	assert_bool(layers.has("oiseaux")).is_false()
	# Plus de nappe d'eau en continu dehors (pluie, rivière), même au bord de l'eau sous la pluie.
	assert_bool(layers.has("pluie") or layers.has("riviere")).is_false()
	assert_str(str(WorldRules.soundscape(city, park, "hiver", "jour", "neige", true)["music"])).is_equal("ville_fetes")
	assert_str(str(WorldRules.soundscape(world.map("reserve"), Vector2i(7, 3), "ete", "jour", "clair", false)["music"])).is_equal("reserve")
	var hall: Dictionary = WorldRules.soundscape(world.map("hall"), Vector2i(10, 8), "ete", "jour", "clair", false, 99, 5)["layers"]
	assert_float(float(hall["foule"])).is_greater(0.0)
	# Hall vide : pas de brouhaha.
	assert_bool((WorldRules.soundscape(world.map("hall"), Vector2i(10, 8), "ete", "jour", "clair", false, 99, 0)["layers"] as Dictionary).has("foule")).is_false()


func test_footstep_surfaces() -> void:
	var city := world.map("rue")
	assert_str(WorldRules.footstep_surface(city, Vector2i(52, 33), "ete", "clair")).is_equal("pierre")
	assert_str(WorldRules.footstep_surface(city, Vector2i(11, 30), "ete", "clair")).is_equal("herbe")
	assert_str(WorldRules.footstep_surface(city, Vector2i(11, 30), "hiver", "neige")).is_equal("neige")
	assert_str(WorldRules.footstep_surface(world.map("hall"), Vector2i(10, 8), "ete", "clair")).is_equal("tapis")
	assert_str(WorldRules.footstep_surface(world.map("salle"), Vector2i(10, 5), "ete", "clair")).is_equal("bois")
	assert_str(WorldRules.footstep_surface(world.map("reserve"), Vector2i(7, 3), "ete", "clair")).is_equal("beton")
	for id: String in ["pierre", "herbe", "bois", "tapis", "beton", "neige"]:
		assert_bool(ResourceLoader.exists("res://assets/audio/sfx/pas_%s.wav" % id)).is_true()


## On peut entrer dans tous les bâtiments de la ville : chaque porte mène quelque part.
func test_every_city_building_opens_on_an_interior() -> void:
	var city := world.map("rue")
	var raw: Array = world.raw["maps"]["rue"]["buildings"]
	assert_int(raw.size()).is_greater(20)
	for b: Dictionary in raw:
		for c: Array in b["doors"]:
			var door := city.door_at(WorldMap.to_cell(c))
			assert_bool(door.is_empty()).override_failure_message("%s : porte %s fermée" % [b["id"], c]).is_false()
			if b["id"] != "theatre":
				assert_str(str(door["to"])).is_equal("int_" + str(b["id"]))


## Tous les objets à examiner et toutes les personnes ont quelque chose à dire.
func test_every_spot_and_person_has_lines() -> void:
	var keys := {}
	for b: Dictionary in world.barks:
		keys[str(b["who"])] = true
	for id: String in world.maps:
		var m: WorldMap = world.maps[id]
		for sp: Dictionary in m.spots:
			if str(sp.get("kind", "flavor")) == "flavor":
				assert_bool(keys.has(WorldData.spot_bark_key(sp))).override_failure_message("%s : %s muet" % [id, sp["id"]]).is_true()
		for n: Dictionary in m.npcs:
			assert_bool(keys.has(world.bark_key(str(n["id"])))).override_failure_message("%s : %s muet" % [id, n["id"]]).is_true()


## Un intérieur de la ville prend sa musique, son ambiance et ses bruits de pas dans les données.
func test_interior_sound_comes_from_data() -> void:
	var cafe := world.map("int_cafe")
	var sc := WorldRules.soundscape(cafe, Vector2i(3, 4), "ete", "jour", "clair", false)
	assert_str(str(sc["music"])).is_equal("foyer")
	assert_bool((sc["layers"] as Dictionary).has("cafe")).is_true()
	assert_str(WorldRules.footstep_surface(cafe, Vector2i(3, 4), "ete", "clair")).is_equal("pierre")
	var halle := world.map("int_halle")
	assert_str(str(WorldRules.soundscape(halle, Vector2i(3, 3), "ete", "nuit", "clair", false)["music"])).is_equal("ville_nuit")
	assert_str(WorldRules.footstep_surface(world.map("int_librairie"), Vector2i(3, 3), "ete", "clair")).is_equal("bois")


## Les halls des huit tours partagent un même décor ; leurs images existent.
func test_interior_art_exists() -> void:
	for id: String in world.maps:
		if not id.begins_with("int_"):
			continue
		var art := (world.maps[id] as WorldMap).art
		assert_bool(ResourceLoader.exists("res://assets/world/maps/%s_base.png" % art)).override_failure_message("Décor manquant : %s" % art).is_true()
	assert_str(world.map("int_tour_c").art).is_equal("int_tour")


## Pas de nappe de bruit continue sous la musique : partout, chaque couche d'ambiance
## demandée existe, et aucune n'est un simple souffle (ville, vent, salle, coulisses).
func test_no_background_hiss_anywhere() -> void:
	for id: String in world.maps:
		var m: WorldMap = world.maps[id]
		for season: String in ["automne", "hiver", "printemps", "ete"]:
			for tod: String in ["matin", "jour", "nuit"]:
				for sky: String in ["clair", "pluie"]:
					var layers: Dictionary = WorldRules.soundscape(m, Vector2i(5, 5), season, tod, sky, false, 4, 3)["layers"]
					for layer: String in layers:
						assert_bool(layer in ["ville", "vent", "salle", "coulisses", "pluie", "riviere", "fontaine", "cigales"]).override_failure_message("%s : nappe de bruit %s" % [id, layer]).is_false()
						assert_bool(ResourceLoader.exists("res://assets/audio/ambience/%s.wav" % layer)).override_failure_message("%s : ambiance manquante %s" % [id, layer]).is_true()
	var prologue: Variant = GameData.read_json("res://data/story/prologue.json")
	for sc: Dictionary in (prologue as Dictionary)["scenes"]:
		for layer: String in sc.get("ambience", {}):
			assert_bool(ResourceLoader.exists("res://assets/audio/ambience/%s.wav" % layer)).override_failure_message("prologue : ambiance manquante %s" % layer).is_true()


## Entre le hall et le bureau : une cage d'escalier, puis un couloir à trois portes
## (bureau, toilettes, archives). La malle des archives cache la redingote de 1923.
func test_office_floor_is_reached_by_a_stairwell() -> void:
	var hall := world.map("hall")
	for y in hall.size.y:
		for x in hall.size.x:
			assert_str(hall.char_at(Vector2i(x, y))).override_failure_message("plus d'escalier dans le hall").is_not_equal("S")
	var to := func(m: WorldMap) -> Array:
		return m.doors.map(func(d: Dictionary) -> String: return str(d["to"]))
	assert_array(to.call(hall)).contains(["escalier"])
	assert_array(to.call(world.map("escalier"))).contains(["hall", "couloir"])
	assert_array(to.call(world.map("couloir"))).contains(["bureau", "toilettes", "archives", "escalier"])
	assert_array(to.call(world.map("bureau"))).contains_exactly(["couloir"])
	var stairs := world.map("escalier")
	assert_array(stairs.find_path(Vector2i(5, 7), Vector2i(5, 2))).is_not_empty()
	var archives := world.map("archives")
	assert_bool(archives.spot("malle_archives").is_empty()).is_false()
	assert_str(WorldRules.footstep_surface(stairs, Vector2i(5, 3), "ete", "clair")).is_equal("tapis")

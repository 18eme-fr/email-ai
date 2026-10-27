extends GdUnitTestSuite
## Collection permanente : catalogue conforme aux quotas, références valides,
## chaque objet réellement obtenable par son déclencheur, prérequis respectés,
## pas de doublon, sauvegarde et migration, indices, récompenses sans effet
## sur la gestion.

const PATH := "user://test_collection.json"
const LEGACY := "user://test_collection_legacy_album.json"

var world: WorldData
var data: GameData


func before() -> void:
	world = WorldData.get_default()
	data = GameData.get_default()


func after_test() -> void:
	for p: String in [PATH, LEGACY]:
		DirAccess.remove_absolute(ProjectSettings.globalize_path(p))


func _fresh() -> Collection:
	var c := Collection.new(PATH, "")
	c.reset()
	return c


func _session(game_seed: int = 5) -> GameSession:
	var s := GameSession.new()
	s.new_game(game_seed, "standard")
	return s


func _count_by(col: Collection, key: String) -> Dictionary:
	var out := {}
	for o: Dictionary in col.objects:
		out[o[key]] = int(out.get(o[key], 0)) + 1
	return out


# --- Catalogue ---------------------------------------------------------------------------

func test_catalog_respects_the_quotas() -> void:
	var col := _fresh()
	assert_int(col.total()).is_equal(51)
	assert_dict(_count_by(col, "family")).is_equal({"archives": 10, "costumes": 11, "decors": 10, "technique": 10, "legendes": 10})
	assert_dict(_count_by(col, "rarity")).is_equal({"commun": 20, "peu_commun": 16, "rare": 10, "legendaire": 4, "mythique": 1})
	assert_dict(_count_by(col, "method")).is_equal({"exploration": 15, "mission": 12, "pnj": 8, "secret": 6, "progression": 5, "evenement": 5})
	var ids := {}
	var icons := {}
	for o: Dictionary in col.objects:
		assert_bool(ids.has(o["id"])).override_failure_message("Identifiant en double : %s" % o["id"]).is_false()
		ids[o["id"]] = true
		icons[o["icon"]] = true
		for key: String in ["name", "description", "hint2", "hint3"]:
			assert_str(str(o[key])).override_failure_message("%s : %s vide" % [o["id"], key]).is_not_empty()
		assert_bool(ResourceLoader.exists("res://assets/collection/%s.png" % o["icon"])).override_failure_message("Icône manquante : %s" % o["icon"]).is_true()
	assert_int(icons.size()).override_failure_message("Chaque objet doit avoir sa propre illustration").is_equal(51)


func test_every_reference_exists_in_the_game() -> void:
	var col := _fresh()
	var people := {}
	for pid: String in world.people:
		people[world.bark_key(pid)] = true
	var spots := {}
	for mid: String in world.maps:
		for sp: Dictionary in (world.maps[mid] as WorldMap).spots:
			spots[WorldData.spot_bark_key(sp)] = true
	var triggers: Array = []
	for o: Dictionary in col.objects:
		triggers.append([o["id"], o["trigger"], o.get("requires", {})])
	for q: Dictionary in col.quests:
		assert_bool(col.object(str(q["reward"])).is_empty()).is_false()
		for st: Dictionary in q["steps"]:
			triggers.append([q["id"], st["trigger"], st.get("requires", {})])
			if st.has("gives_clue"):
				assert_bool(col.clues.has(st["gives_clue"])).is_true()
	for c: Dictionary in col.clue_sources:
		assert_bool(col.clues.has(c["clue"])).is_true()
		triggers.append([c["clue"], c["trigger"], c.get("requires", {})])
	for t: Array in triggers:
		var tr: Dictionary = t[1]
		var who := str(t[0])
		match str(tr["type"]):
			"talk":
				assert_bool(people.has(tr["person"])).override_failure_message("%s : personne inconnue %s" % [who, tr["person"]]).is_true()
			"examine":
				assert_bool(spots.has(tr["spot"])).override_failure_message("%s : lieu inconnu %s" % [who, tr["spot"]]).is_true()
			"visit":
				assert_object(world.map(str(tr["map"]))).is_not_null()
			"pickup", "search":
				var m := world.map(str(tr["map"]))
				var cell := Vector2i(int(tr["cell"][0]), int(tr["cell"][1]))
				assert_bool(m.in_bounds(cell)).is_true()
				var origin: Vector2i = m.doors[0]["cell"]
				if tr["type"] == "pickup":
					assert_bool(m.is_walkable(cell)).override_failure_message("%s : objet posé sur une case bloquée" % who).is_true()
					assert_array(m.find_path(origin, cell)).override_failure_message("%s : objet inaccessible à pied" % who).is_not_empty()
				else:
					var reach := m.is_walkable(cell)
					for d: Vector2i in WorldMap.DIRS.values():
						if m.is_walkable(cell + d) and not m.find_path(origin, cell + d).is_empty():
							reach = true
					assert_bool(reach).override_failure_message("%s : cachette impossible à approcher" % who).is_true()
			"state":
				_check_state_refs(who, tr["when"])
	for o: Dictionary in col.objects:
		if o.has("gives_clue"):
			assert_bool(col.clues.has(o["gives_clue"])).is_true()


func _check_state_refs(who: String, req: Dictionary) -> void:
	for sub: Dictionary in req.get("any", []):
		_check_state_refs(who, sub)
	if req.has("mission_done"):
		assert_bool(data.missions.has(req["mission_done"])).override_failure_message("%s : mission inconnue" % who).is_true()
	if req.has("upgrade"):
		assert_bool(data.upgrades.has(req["upgrade"])).override_failure_message("%s : rénovation inconnue" % who).is_true()
	if req.has("achievement"):
		var ok := false
		for a: Dictionary in data.achievements:
			ok = ok or a["id"] == req["achievement"]
		assert_bool(ok).override_failure_message("%s : trophée inconnu" % who).is_true()
	if req.has("dossier_min"):
		assert_bool(Dossiers.CATALOG.has(req["dossier_min"]["dossier"])).is_true()
	if req.has("event_choice"):
		var ev: Dictionary = req["event_choice"]
		assert_bool(data.events.has(ev["event"])).override_failure_message("%s : événement inconnu" % who).is_true()
		for ch: String in ev["choices"]:
			assert_bool(EventSystem.find_choice(data, str(ev["event"]), ch).is_empty()).override_failure_message("%s : choix inconnu %s" % [who, ch]).is_false()


## Tout ce qu'un joueur peut faire, répété jusqu'à ce que plus rien ne change.
func _do_everything(col: Collection, s: GameSession) -> void:
	for round in 12:
		var before := col.count() + col.known_clues.size()
		for q: Dictionary in col.quests:
			for st: Dictionary in q["steps"]:
				_fire(col, s, st["trigger"])
		for o: Dictionary in col.objects:
			_fire(col, s, o["trigger"])
		for c: Dictionary in col.clue_sources:
			_fire(col, s, c["trigger"])
		for o: Dictionary in col.objects:
			if col.has(o["id"]) and col.exhibit.size() < 3:
				col.set_exhibited(o["id"], true)
		col.check_state(s)
		var quests_done := 0
		for q: Dictionary in col.quests:
			quests_done += int(col.quest_steps.get(q["id"], 0))
		if col.count() + col.known_clues.size() == before and round > 2:
			break


func _fire(col: Collection, s: GameSession, t: Dictionary) -> void:
	match str(t["type"]):
		"talk":
			col.on_talk(s, str(t["person"]))
		"examine":
			col.on_examine(s, str(t["spot"]))
		"visit":
			col.on_enter_map(s, str(t["map"]))
		"pickup":
			col.on_pickup(s, str(t["map"]), Vector2i(int(t["cell"][0]), int(t["cell"][1])))
		"search":
			col.on_search(s, str(t["map"]), Vector2i(int(t["cell"][0]), int(t["cell"][1])))


func test_all_fifty_objects_can_really_be_obtained() -> void:
	var col := _fresh()
	var s := _session()
	var st := s.state
	# Une saison bien avancée : dernière période, soir de spectacle, travaux faits,
	# missions réussies, événements vécus, trophées.
	st.turn = data.turns()
	st.phase = GameState.PHASE_REPORT
	st.played_shows.append(str(data.shows.keys()[0]))
	for u: String in data.upgrades:
		st.upgrades.append(u)
	for mid: String in ["contrat_negociation", "budget_saison", "parcours_eac", "mecenat", "frequentation_mi_saison", "seuil_rentabilite", "commission_securite"]:
		st.missions[mid] = {"status": "done"}
	for ev: Array in [["annulation_maladie", "doublure"], ["panne_console", "reparer"], ["journaliste", "interview"]]:
		st.key_decisions.append({"turn": 3, "text": "", "event": ev[0], "choice": ev[1]})
	st.achievements.append_array(["salle_comble", "convention"])
	st.stats["reputation"] = 80.0
	var cash := st.cash
	var stats := st.stats.duplicate()
	_do_everything(col, s)
	var missing: Array = []
	for o: Dictionary in col.objects:
		if not col.has(o["id"]):
			missing.append(o["id"])
	assert_array(missing).override_failure_message("Objets impossibles à obtenir : %s" % [missing]).is_empty()
	assert_int(col.count()).is_equal(51)
	for q: Dictionary in col.quests:
		assert_str(col.quest_status(q["id"])).is_equal("done")
	# La collection ne touche jamais à la gestion.
	assert_int(st.cash).is_equal(cash)
	assert_dict(st.stats).is_equal(stats)
	assert_int(col.unlocked_rewards().size()).is_equal(col.rewards.size())


func test_an_object_is_never_obtained_twice() -> void:
	var col := _fresh()
	var s := _session()
	assert_array(col.on_talk(s, "touriste")).is_not_empty()
	assert_bool(col.has("miniature_lanterne")).is_true()
	assert_array(col.on_talk(s, "touriste")).is_empty()
	assert_array(col.on_pickup(s, "hall", Vector2i(2, 11))).is_not_empty()
	assert_array(col.on_pickup(s, "hall", Vector2i(2, 11))).is_empty()
	assert_int(col.count()).is_equal(2)
	assert_int(col.owned["miniature_lanterne"]).is_equal(1)
	assert_int(col.owned["talkie"]).is_equal(2)


func test_prerequisites_and_secrets_stay_hidden() -> void:
	var col := _fresh()
	var s := _session()
	# Le programme du TNP n'est offert qu'à partir de la 2ᵉ période.
	assert_array(col.on_talk(s, "bibliothecaire")).is_empty()
	s.state.turn = 2
	col.on_talk(s, "bibliothecaire")
	assert_bool(col.has("programme_tnp")).is_true()
	# Sans indice, une cachette ne livre rien ; les objets de la réserve sont invisibles sans y avoir accès.
	assert_array(col.on_search(s, "coulisses", Vector2i(4, 2))).is_empty()
	assert_array(col.on_search(s, "coulisses", Vector2i(17, 4))).is_empty()
	assert_bool(col.has("escarpins_lys")).is_false()
	for p: Dictionary in col.visible_pickups(s, "hall"):
		assert_bool(col.has(p["id"])).is_false()
	# La trappe de 1924 reste fermée le jour, même avec l'enquête presque finie.
	col.quest_steps["representation_perdue"] = 4
	var r := col.on_search(s, "salle", Vector2i(10, 5))
	assert_str(str(r[0]["kind"])).is_equal("tease")
	assert_bool(col.has("lanterne_ondine")).is_false()
	s.state.phase = GameState.PHASE_REPORT
	col.on_search(s, "salle", Vector2i(10, 5))
	assert_bool(col.has("lanterne_ondine")).is_true()
	# Une enquête secrète ne se trahit pas : Louison ne parle pas de 1924 sans l'affiche.
	var col2 := _fresh()
	var r2 := col2.on_talk(s, "louison")
	for x: Dictionary in r2:
		assert_str(str(x.get("quest", ""))).is_not_equal("representation_perdue")


func test_quest_steps_follow_their_order() -> void:
	var col := _fresh()
	var s := _session()
	col.on_examine(s, "armoire_archives")
	assert_int(int(col.quest_steps.get("archives_oubliees", 0))).is_equal(0)
	var r := col.on_talk(s, "fernand")
	assert_str(str(r[0]["kind"])).is_equal("quest_step")
	assert_bool(col.known_clues.has("cle_reserve")).is_true()
	assert_array(col.on_talk(s, "fernand")).override_failure_message("Il faut d'abord aller dans la réserve").is_empty()
	col.on_enter_map(s, "reserve")
	col.on_examine(s, "armoire_archives")
	col.on_talk(s, "fernand")
	assert_bool(col.has("affiche_1924")).is_true()
	assert_bool(col.known_clues.has("troupe_vasseur")).is_true()
	assert_str(col.quest_status("archives_oubliees")).is_equal("done")
	# Le collectionneur explique ce qu'il attend tant qu'il manque des objets.
	var t := col.on_talk(s, "collectionneur")
	assert_str(str(t[0]["kind"])).is_equal("tease")


func test_mission_objects_have_alternatives() -> void:
	var col := _fresh()
	var s := _session()
	col.check_state(s)
	assert_bool(col.has("registre_1959")).is_false()
	# Un dossier d'entraînement réussi à 80 % suffit, même sans la mission.
	s.state.dossiers.append({"id": "budget", "turn": 1, "score": 0.85, "practice": true})
	s.state.totals["eac_count"] = 6
	col.check_state(s)
	assert_bool(col.has("registre_1959")).is_true()
	assert_bool(col.has("costume_eleves")).is_true()


func test_event_decisions_are_recorded_for_the_collection() -> void:
	var col := _fresh()
	var s := _session()
	s.state.phase = GameState.PHASE_EVENT
	s.state.current_event = "panne_console"
	s.state.event_choice = ""
	var summary := s.choose_event("reparer")
	assert_bool(summary.has("error")).is_false()
	var last: Dictionary = s.state.key_decisions.back()
	assert_str(str(last["event"])).is_equal("panne_console")
	assert_str(str(last["choice"])).is_equal("reparer")
	col.check_state(s)
	assert_bool(col.has("console_1975")).is_true()


func test_progress_is_saved_and_reloaded() -> void:
	var col := _fresh()
	var s := _session()
	col.on_talk(s, "touriste")
	col.on_talk(s, "fernand")
	col.set_exhibited("miniature_lanterne", true)
	for o: Dictionary in col.objects.slice(0, 5):
		col.on_talk(s, "x")
		col.owned[o["id"]] = col.owned.size() + 1
	col.save_profile()
	assert_bool(col.set_outfit("echarpe")).is_true()
	col.advise(s, "archives")
	var again := Collection.new(PATH, "")
	assert_int(again.count()).is_equal(col.count())
	assert_bool(again.has("miniature_lanterne")).is_true()
	assert_bool(again.known_clues.has("cle_reserve")).is_true()
	assert_int(int(again.quest_steps["archives_oubliees"])).is_equal(1)
	assert_array(again.exhibit).contains(["miniature_lanterne"])
	assert_str(again.outfit_sprite()).is_equal("directeur_echarpe")
	assert_bool(again.can_advise(s)).override_failure_message("Un seul conseil de Fernand par période").is_false()


func test_damaged_profile_and_album_migration() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	f.store_string("{pas du json")
	f.close()
	var col := Collection.new(PATH, "")
	assert_int(col.count()).is_equal(0)
	DirAccess.remove_absolute(ProjectSettings.globalize_path(PATH))
	var old := FileAccess.open(LEGACY, FileAccess.WRITE)
	old.store_string(JSON.stringify({"version": 1, "collected": {"t_masque": 1, "p_helene": 2, "t_ticket_avignon": 3}, "outfit": "gala"}))
	old.close()
	var migrated := Collection.new(PATH, LEGACY)
	assert_bool(migrated.has("masque_arlequin")).is_true()
	assert_bool(migrated.has("billet_avignon")).is_true()
	assert_int(migrated.count()).is_equal(2)
	assert_str(migrated.outfit).override_failure_message("Tenue non méritée dans la nouvelle collection").is_equal("")
	assert_bool(FileAccess.file_exists(PATH)).is_true()


func test_hints_unlock_progressively() -> void:
	var col := _fresh()
	var s := _session()
	assert_int(col.hint_level("brigadier")).is_equal(1)
	assert_int(col.hints("brigadier").size()).is_equal(1)
	col.on_talk(s, "libraire")
	col.on_examine(s, "loges")
	assert_int(col.count("legendes")).is_equal(2)
	assert_int(col.hint_level("brigadier")).is_equal(2)
	# Fernand : un conseil par période, l'objet le moins rare de la famille d'abord.
	var o := col.advise(s, "legendes")
	assert_str(str(o["rarity"])).is_equal("commun")
	assert_int(col.hint_level(o["id"])).is_equal(3)
	assert_dict(col.advise(s, "legendes")).is_empty()
	s.state.turn += 1
	assert_bool(col.can_advise(s)).is_true()


func test_rewards_follow_the_steps_and_family_completion() -> void:
	var col := _fresh()
	var got: Array = []
	for o: Dictionary in col.in_family("technique"):
		var out: Array = []
		col._grant(o["id"], "", out)
		for r: Dictionary in out:
			if r["kind"] == "reward":
				got.append(r["reward"]["id"])
	assert_array(got).contains_exactly(["echarpe", "guirlande", "regie"])
	assert_bool(col.set_outfit("regie")).is_true()
	assert_bool(col.set_outfit("gala")).is_false()
	assert_bool(col.has_reward("guirlande")).is_true()
	assert_bool(col.has_reward("collectionneur")).is_false()


func test_exhibition_never_removes_an_object() -> void:
	var col := _fresh()
	assert_bool(col.set_exhibited("talkie", true)).override_failure_message("On n'expose que ce qu'on possède").is_false()
	for o: Dictionary in col.objects.slice(0, 8):
		col.owned[o["id"]] = col.owned.size() + 1
	for o: Dictionary in col.objects.slice(0, 8):
		col.set_exhibited(o["id"], true)
	assert_int(col.exhibit.size()).is_equal(col.exhibit_slots)
	col.set_exhibited(str(col.exhibit[0]), false)
	assert_int(col.count()).is_equal(8)
	assert_int(col.exhibit.size()).is_equal(col.exhibit_slots - 1)


func test_a_whole_season_with_the_collection() -> void:
	var col := _fresh()
	var s := _session(2024)
	var bot := StrategyBot.new("equilibre", 2024)
	var guard := 0
	while not s.state.finished and guard < 200:
		bot.play_turn(s)
		col.check_state(s)
		guard += 1
	assert_bool(s.state.finished).is_true()
	assert_int(col.count()).is_greater(0)
	for id: String in col.owned:
		assert_str(str(col.object(id)["trigger"]["type"])).is_equal("state")


## La redingote de 1923, dans la malle des archives, débloque aussitôt sa tenue.
func test_archive_costume_unlocks_its_outfit() -> void:
	var col := _fresh()
	var s := _session()
	assert_bool(col.has_reward("redingote")).is_false()
	assert_bool(col.set_outfit("redingote")).is_false()
	col.on_examine(s, "malle_archives")
	assert_bool(col.has("redingote_1923")).is_true()
	assert_bool(col.set_outfit("redingote")).is_true()
	assert_str(col.outfit_sprite()).is_equal("directeur_redingote")

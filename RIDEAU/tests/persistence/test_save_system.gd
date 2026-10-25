extends GdUnitTestSuite
## Sauvegarde : aller-retour fidèle, fichiers endommagés, copie de secours, versions.

const DIR := "user://test_saves"

var saves: SaveSystem


func before_test() -> void:
	saves = SaveSystem.new(DIR)
	saves.delete("slot")


func after_test() -> void:
	saves.delete("slot")


func _played_session(turns: int = 3) -> GameSession:
	var s := GameSession.new()
	s.new_game(314, "standard")
	var bot := StrategyBot.new("equilibre", 314)
	for i in turns:
		bot.play_turn(s)
	return s


func test_roundtrip_restores_all_values() -> void:
	var s := _played_session()
	assert_int(int(saves.save(s.state, "slot")["status"])).is_equal(SaveSystem.Status.OK)
	var result := saves.load("slot")
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.OK)
	var loaded: GameState = result["state"]
	assert_int(loaded.cash).is_equal(s.state.cash)
	assert_int(loaded.turn).is_equal(s.state.turn)
	assert_int(loaded.game_seed).is_equal(s.state.game_seed)
	assert_str(loaded.phase).is_equal(s.state.phase)
	for id: String in GameState.STAT_IDS:
		assert_float(loaded.stat(id)).is_equal_approx(s.state.stat(id), 0.0001)
	assert_int(loaded.ledger.size()).is_equal(s.state.ledger.size())
	assert_int(loaded.reports.size()).is_equal(s.state.reports.size())
	assert_dict(loaded.totals).is_equal(s.state.totals)


func test_loaded_game_continues_identically() -> void:
	var a := _played_session(3)
	saves.save(a.state, "slot")
	var b := GameSession.new()
	b.load_state(saves.load("slot")["state"])
	var bot_a := StrategyBot.new("equilibre", 9)
	var bot_b := StrategyBot.new("equilibre", 9)
	bot_a.play_season(a)
	bot_b.play_season(b)
	assert_int(b.state.cash).is_equal(a.state.cash)
	assert_str(str(b.state.ending["ending_id"])).is_equal(str(a.state.ending["ending_id"]))


func test_corrupted_file_falls_back_to_backup_and_warns() -> void:
	var s := _played_session(1)
	saves.save(s.state, "slot")
	var bot := StrategyBot.new("equilibre", 1)
	bot.play_turn(s)
	saves.save(s.state, "slot")  # la sauvegarde précédente devient la copie de secours
	var f := FileAccess.open(saves.path_for("slot"), FileAccess.WRITE)
	f.store_string("{ ceci n'est plus du JSON")
	f.close()
	var result := saves.load("slot")
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.RESTORED_FROM_BACKUP)
	assert_str(str(result["message"])).is_not_empty()
	assert_int((result["state"] as GameState).turn).is_equal(2)


func test_tampered_file_is_detected() -> void:
	var s := _played_session(1)
	saves.save(s.state, "slot")
	var text := FileAccess.get_file_as_string(saves.path_for("slot"))
	var tampered := text.replace("\"cash\": %d" % s.state.cash, "\"cash\": 999999")
	assert_str(tampered).is_not_equal(text)
	assert_int(int(SaveSystem.deserialize(tampered)["status"])).is_equal(SaveSystem.Status.CORRUPTED)


func test_missing_save_reports_clearly() -> void:
	var result := saves.load("slot")
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.MISSING)
	assert_object(result["state"]).is_null()
	assert_bool(saves.has_save("slot")).is_false()


func test_incomplete_state_is_rejected() -> void:
	var envelope := {"format": SaveSystem.FORMAT_ID, "version": 0, "state": {"turn": 2}}
	var result := SaveSystem.deserialize(JSON.stringify(envelope))
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.CORRUPTED)


func test_downgrading_version_does_not_bypass_checksum() -> void:
	var s := _played_session(1)
	var text := SaveSystem.serialize(s.state).replace("\"version\": %d" % SaveSystem.CURRENT_VERSION, "\"version\": 0")
	text = text.replace("\"cash\": %d" % s.state.cash, "\"cash\": 999999")
	assert_int(int(SaveSystem.deserialize(text)["status"])).is_equal(SaveSystem.Status.CORRUPTED)


func test_wrong_field_types_are_rejected_without_crash() -> void:
	var s := _played_session(1)
	var d := s.state.to_dict()
	d["flags"] = []
	assert_object(GameState.from_dict(d)).is_null()
	d = s.state.to_dict()
	d["ledger"] = [42]
	assert_object(GameState.from_dict(d)).is_null()


func test_future_version_is_not_loaded() -> void:
	var s := _played_session(1)
	var text := SaveSystem.serialize(s.state).replace("\"version\": %d" % SaveSystem.CURRENT_VERSION, "\"version\": 99")
	assert_int(int(SaveSystem.deserialize(text)["status"])).is_equal(SaveSystem.Status.INCOMPATIBLE)


func test_old_version_is_migrated() -> void:
	var s := _played_session(1)
	var d := s.state.to_dict()
	d.erase("stat_log")
	d.erase("totals")
	var envelope := {"format": SaveSystem.FORMAT_ID, "version": 0, "state": d, "checksum": SaveSystem.checksum(d)}
	# Pleine précision, comme SaveSystem.serialize, pour que la somme de contrôle corresponde.
	var result := SaveSystem.deserialize(JSON.stringify(envelope, "", true, true))
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.OK)
	assert_int(int((result["state"] as GameState).totals["attendance_total"])).is_equal(0)


func test_version_1_save_gets_empty_upgrades() -> void:
	var s := _played_session(1)
	var d := s.state.to_dict()
	d.erase("upgrades")
	var envelope := {"format": SaveSystem.FORMAT_ID, "version": 1, "state": d, "checksum": SaveSystem.checksum(d)}
	var result := SaveSystem.deserialize(JSON.stringify(envelope, "", true, true))
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.OK)
	assert_array((result["state"] as GameState).upgrades).is_empty()


func test_upgrades_survive_a_roundtrip() -> void:
	var s := _played_session(1)
	s.next_turn()
	assert_str(s.buy_upgrade("foyer_bar")).is_empty()
	var result := SaveSystem.deserialize(SaveSystem.serialize(s.state))
	assert_int(int(result["status"])).is_equal(SaveSystem.Status.OK)
	assert_array((result["state"] as GameState).upgrades).contains_exactly(["foyer_bar"])


func test_failed_write_keeps_previous_save() -> void:
	var s := _played_session(1)
	saves.save(s.state, "slot")
	var before := FileAccess.get_file_as_string(saves.path_for("slot"))
	# Un fichier ordinaire bloque la création du dossier de sauvegarde.
	var blocker := FileAccess.open("user://test_saves_blocker", FileAccess.WRITE)
	blocker.store_string("x")
	blocker.close()
	var bad := SaveSystem.new("user://test_saves_blocker/sous_dossier")
	var r := bad.save(s.state, "slot")
	assert_int(int(r["status"])).is_not_equal(SaveSystem.Status.OK)
	assert_str(FileAccess.get_file_as_string(saves.path_for("slot"))).is_equal(before)
	DirAccess.remove_absolute("user://test_saves_blocker")

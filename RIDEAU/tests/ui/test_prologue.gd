extends GdUnitTestSuite
## Prologue : données complètes, neuf tableaux qui s'enchaînent avec leur son,
## et passage possible à tout moment (noté pour ne plus le montrer).

const SCENE := "res://scenes/menus/prologue.tscn"


var _saved: Dictionary
var _file := ""


func before_test() -> void:
	_saved = Settings.values.duplicate()
	_file = FileAccess.get_file_as_string(Settings.PATH) if FileAccess.file_exists(Settings.PATH) else ""
	Settings.values["reduce_motion"] = true
	Settings.values["prologue_seen"] = false
	Game.after_prologue = ""


## Le prologue enregistre « déjà vu » : on remet les réglages tels qu'ils étaient, sur le disque aussi.
func after_test() -> void:
	Settings.values = _saved
	if _file == "":
		DirAccess.remove_absolute(ProjectSettings.globalize_path(Settings.PATH))
	else:
		var f := FileAccess.open(Settings.PATH, FileAccess.WRITE)
		f.store_string(_file)
		f.close()
	Game.after_prologue = Game.MAIN_MENU


func test_prologue_data_is_complete() -> void:
	var raw: Variant = GameData.read_json("res://data/story/prologue.json")
	var scenes: Array = (raw as Dictionary)["scenes"]
	assert_int(scenes.size()).is_equal(9)
	for sc: Dictionary in scenes:
		assert_bool(ResourceLoader.exists("res://assets/prologue/%s.png" % sc["image"])).override_failure_message("Image manquante : %s" % sc["image"]).is_true()
		assert_int(str(sc["text"]).length()).override_failure_message("Texte trop long : %s" % sc["image"]).is_less_equal(140)
		if str(sc.get("music", "")) != "":
			assert_bool(AudioDirector.MUSIC.has(sc["music"])).is_true()
		for amb: String in sc.get("ambience", {}):
			assert_bool(ResourceLoader.exists("res://assets/audio/ambience/%s.wav" % amb)).is_true()
		if sc.has("sfx"):
			assert_object(AudioDirector.sfx_stream(str(sc["sfx"]))).is_not_null()


func test_prologue_plays_through_and_can_be_skipped() -> void:
	var runner := scene_runner(SCENE)
	await runner.simulate_frames(5)
	var p := runner.scene()
	assert_int(p.index).is_equal(0)
	assert_object(p._image.texture).is_not_null()
	assert_str(AudioDirector.current_music()).is_equal("ville_nuit")
	var seen := {}
	for i in 8:
		p._typing.kill()
		p.next()
		await runner.simulate_frames(3)
		seen[p._image.texture] = true
	assert_int(p.index).is_equal(8)
	assert_int(seen.size()).is_equal(8)
	assert_str(AudioDirector.current_music()).is_equal("theme")
	runner.simulate_key_pressed(KEY_ESCAPE)
	await runner.simulate_frames(5)
	assert_bool(p._done).is_true()
	assert_bool(bool(Settings.get_value("prologue_seen"))).is_true()

extends GdUnitTestSuite
## Album de collection : cartes cohérentes avec le monde et le catalogue,
## conservées d'une partie à l'autre, tenues débloquées par paliers.

const PATH := "user://test_album.json"

var world: WorldData
var data: GameData


func before() -> void:
	world = WorldData.get_default()
	data = GameData.get_default()


func _fresh() -> Album:
	var a := Album.new(PATH)
	a.reset()
	return a


func after_test() -> void:
	DirAccess.remove_absolute(ProjectSettings.globalize_path(PATH))


func test_cards_are_short_and_well_formed() -> void:
	var a := _fresh()
	var ids := {}
	for c: Dictionary in a.cards:
		assert_bool(ids.has(c["id"])).override_failure_message("Carte en double : %s" % c["id"]).is_false()
		ids[c["id"]] = true
		assert_bool(AlbumPanel.RARITY.has(str(c["rarity"]))).is_true()
		assert_int(str(c["text"]).length()).override_failure_message("Texte trop long : %s" % c["id"]).is_less_equal(140)
		assert_str(str(c["title"])).is_not_empty()
	assert_int(a.total()).is_greater_equal(90)


func test_everything_in_the_world_has_a_card() -> void:
	var a := _fresh()
	for pid: String in world.people:
		var key := world.bark_key(pid)
		if key != "passant":
			assert_str(a.card_for("rencontres", key)).override_failure_message("Personne sans carte : %s" % pid).is_not_empty()
	for mid: String in world.maps:
		for sp: Dictionary in (world.maps[mid] as WorldMap).spots:
			if sp["kind"] in ["flavor", "place", "action", "upgrade", "posters"]:
				assert_str(a.card_for("lieux", WorldData.spot_bark_key(sp))).override_failure_message("Lieu sans carte : %s" % sp["id"]).is_not_empty()
	for show_id: String in data.shows:
		assert_str(a.card_for("affiches", show_id)).override_failure_message("Spectacle sans affiche : %s" % show_id).is_not_empty()


func test_treasures_lie_on_free_walkable_cells() -> void:
	var a := _fresh()
	assert_int(a.total("tresors")).is_equal(12)
	for c: Dictionary in a.in_category("tresors"):
		var m := world.map(str(c["map"]))
		var cell := Vector2i(int(c["cell"][0]), int(c["cell"][1]))
		assert_bool(m.is_walkable(cell)).override_failure_message("Trésor sur une case bloquée : %s" % c["id"]).is_true()
		assert_bool(m.door_at(cell).is_empty()).is_true()
		var origin: Vector2i = m.doors[0]["cell"]
		assert_array(m.find_path(origin, cell)).override_failure_message("Trésor inaccessible : %s" % c["id"]).is_not_empty()
		assert_bool(ResourceLoader.exists("res://assets/world/fx/tresor_%s.png" % c["icon"])).is_true()
	assert_int(a.hidden_treasures("rue").size()).is_equal(10)


func test_collecting_is_kept_between_games() -> void:
	var a := _fresh()
	assert_dict(a.collect("p_helene")).is_not_empty()
	assert_dict(a.collect("p_helene")).override_failure_message("Une carte ne compte qu'une fois").is_empty()
	assert_dict(a.collect("carte_inconnue")).is_empty()
	a.collect("t_masque")
	assert_int(a.count()).is_equal(2)
	assert_int(a.count("tresors")).is_equal(1)
	assert_array(a.unseen).contains(["p_helene", "t_masque"])
	var b := Album.new(PATH)
	assert_bool(b.has("p_helene")).is_true()
	assert_bool(b.has("t_masque")).is_true()
	assert_int(b.hidden_treasures("rue").size()).is_equal(9)
	b.mark_seen()
	assert_array(Album.new(PATH).unseen).is_empty()


func test_damaged_profile_gives_an_empty_album() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	f.store_string("{pas du json")
	f.close()
	var a := Album.new(PATH)
	assert_int(a.count()).is_equal(0)
	assert_dict(a.collect("p_ines")).is_not_empty()


func test_outfits_unlock_by_steps() -> void:
	var a := _fresh()
	assert_str(a.outfit_sprite()).is_equal("directeur")
	assert_bool(a.set_outfit("echarpe")).override_failure_message("Tenue verrouillée portée").is_false()
	var n := 0
	var unlocked_at := -1
	for c: Dictionary in a.in_category("lieux"):
		a.collect(c["id"])
		n += 1
		if not a.outfit_just_unlocked().is_empty() and unlocked_at < 0:
			unlocked_at = n
	assert_int(unlocked_at).is_equal(8)
	assert_bool(a.set_outfit("echarpe")).is_true()
	assert_str(Album.new(PATH).outfit_sprite()).is_equal("directeur_echarpe")
	assert_bool(a.set_outfit("lanterne")).is_false()
	for c: Dictionary in a.in_category("tresors"):
		a.collect(c["id"])
	assert_bool(a.set_outfit("lanterne")).is_true()
	for o: Dictionary in a.outfits:
		assert_bool(ResourceLoader.exists("res://assets/world/people/%s.png" % o["sprite"])).is_true()

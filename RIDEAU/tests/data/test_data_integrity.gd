extends GdUnitTestSuite
## Cohérence des données : catalogue, actions, événements, dialogues, notions, ressources.

var data: GameData


func before() -> void:
	data = GameData.get_default()


func test_data_files_load_without_errors() -> void:
	assert_array(Array(data.load_errors)).is_empty()
	assert_int(data.shows.size()).is_greater_equal(12)
	assert_int(data.events.size()).is_greater_equal(10)
	assert_int(data.actions.size()).is_equal(6)
	assert_int(data.turns()).is_equal(8)
	assert_int((data.balance["periods"] as Array).size()).is_equal(8)


func test_shows_have_required_fields_and_valid_values() -> void:
	var required := ["id", "title", "company", "genre", "format", "contract", "fee", "representations", "price",
		"popularity", "art", "risk", "audiences", "tech_level", "tech_cost", "hosting", "workload", "description", "pitch", "poster"]
	for id: String in data.show_order:
		var show: Dictionary = data.shows[id]
		for key: String in required:
			assert_bool(show.has(key)).override_failure_message("%s : champ « %s » manquant" % [id, key]).is_true()
		assert_bool(data.genres.has(show["genre"])).override_failure_message("%s : genre inconnu" % id).is_true()
		assert_int(int(show["fee"])).is_greater_equal(0)
		assert_int(int(show["representations"])).is_greater(0)
		assert_float(float(show["popularity"])).is_between(0.0, 1.0)
		assert_float(float(show["art"])).is_between(0.0, 1.0)
		assert_float(float(show["risk"])).is_between(0.0, 1.0)
		assert_bool(str(show["format"]) in ["salle", "petit", "residence"]).is_true()
		assert_bool(str(show["contract"]) in ["cession", "corealisation", "coproduction", "interne", "residence"]).is_true()
		if show["contract"] == "corealisation":
			assert_float(float(show["company_share"])).is_between(0.0, 1.0)
		assert_bool(ResourceLoader.exists("res://assets/pixel_art/posters/%s.png" % id)).override_failure_message("Affiche manquante : " + id).is_true()
		for notion: String in show.get("notions", []):
			assert_bool(data.glossary.has(notion)).override_failure_message("%s : notion inconnue %s" % [id, notion]).is_true()


func test_actions_are_valid() -> void:
	for id: String in data.action_order:
		var a: Dictionary = data.actions[id]
		assert_int(int(a["cost"])).is_greater(0)
		assert_bool(data.glossary.has(str(a["notion"]))).is_true()
		for stat: String in a["effects"].get("stats", {}):
			assert_bool(stat in GameState.STAT_IDS).is_true()


func test_event_choices_match_dialogue_responses() -> void:
	var dialogue := FileAccess.get_file_as_string("res://dialogue/events.dialogue")
	for id: String in data.event_order:
		var event: Dictionary = data.events[id]
		assert_bool(dialogue.contains("~ %s\n" % id)).override_failure_message("Étiquette de dialogue manquante : " + id).is_true()
		assert_bool(data.characters.has(str(event["character"]))).is_true()
		assert_bool(data.glossary.has(str(event.get("notion", "")))).override_failure_message("%s : notion inconnue" % id).is_true()
		var block := dialogue.get_slice("~ %s\n" % id, 1).get_slice("=> END", 0)
		for choice: Dictionary in event["choices"]:
			assert_bool(block.contains("[#choice=%s]" % choice["id"])).override_failure_message("%s : réponse %s absente du dialogue" % [id, choice["id"]]).is_true()
			for stat: String in choice.get("effects", {}).get("stats", {}):
				assert_bool(stat in GameState.STAT_IDS).override_failure_message("%s/%s : indicateur %s inconnu" % [id, choice["id"], stat]).is_true()


func test_dialogue_files_compile_with_dialogue_manager() -> void:
	for path: String in ["res://dialogue/events.dialogue", "res://dialogue/story.dialogue"]:
		var res: Variant = load(path)
		assert_object(res).override_failure_message("Dialogue non compilé : " + path).is_not_null()
		assert_bool(res is DialogueResource).is_true()


func test_dialogue_lines_resolve_for_every_event() -> void:
	var res: DialogueResource = load("res://dialogue/events.dialogue")
	for id: String in data.event_order:
		var line: DialogueLine = await DialogueManager.get_next_dialogue_line(res, id)
		assert_object(line).override_failure_message("Aucune ligne pour " + id).is_not_null()
		var guard := 0
		while line != null and line.responses.is_empty() and guard < 10:
			line = await DialogueManager.get_next_dialogue_line(res, line.next_id)
			guard += 1
		assert_object(line).is_not_null()
		assert_int(line.responses.size()).is_equal((data.events[id]["choices"] as Array).size())


func test_glossary_entries_are_complete_and_sourced() -> void:
	var sources := FileAccess.get_file_as_string("res://SOURCES.md")
	for id: String in data.glossary:
		var n: Dictionary = data.glossary[id]
		for key: String in ["title", "short", "game", "reality"]:
			assert_str(str(n.get(key, ""))).override_failure_message("%s : « %s » vide" % [id, key]).is_not_empty()
		for src: String in n.get("sources", []):
			assert_bool(sources.contains("**%s**" % src)).override_failure_message("%s : source %s absente de SOURCES.md" % [id, src]).is_true()


func test_portraits_exist_for_all_moods() -> void:
	for cid: String in data.characters:
		for mood: String in ["neutral", "happy", "worried", "angry"]:
			assert_bool(ResourceLoader.exists("res://assets/pixel_art/portraits/%s_%s.png" % [cid, mood])).is_true()


func test_endings_cover_all_cases() -> void:
	var ids := []
	for e: Dictionary in data.endings:
		ids.append(e["id"])
	assert_array(ids).contains(["faillite", "equilibre", "dans_le_rouge"])
	# La dernière fin sans condition de stat garantit qu'une fin est toujours trouvée.
	var last: Dictionary = data.endings[-1]
	assert_bool(last["conditions"].has("stat_min")).is_false()

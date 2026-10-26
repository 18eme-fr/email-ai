extends SceneTree
## Capture d'écran d'une scène, pour la QA visuelle et la documentation.
## Usage : godot --path . -s res://tools/screenshot.gd -- <scène> <sortie.png> [scénario]
## Scénarios : "" (scène seule), "game:<graine>:<étape>" (lance une partie et avance jusqu'à une phase).

var scene_path := "res://scenes/menus/main_menu.tscn"
var out_path := "user://screenshot.png"
var scenario := ""


func _init() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() > 0:
		scene_path = args[0]
	if args.size() > 1:
		out_path = args[1]
	if args.size() > 2:
		scenario = args[2]
	_run.call_deferred()


func _run() -> void:
	await process_frame
	var game := root.get_node("Game")
	if scenario.begins_with("game:"):
		var parts := scenario.split(":")
		game.session = GameSession.new()
		# game:<graine>:<étapes>[:<scénario>][:tuto]
		var scenario := "premiere_saison"
		if parts.size() > 3 and parts[3] != "tuto":
			scenario = parts[3]
		game.session.new_game(int(parts[1]), "standard", scenario)
		if not scenario_string_has_case(scenario):
			game.session.state.tutorial_seen["case"] = true
		var steps := int(parts[2]) if parts.size() > 2 else 0
		ScreenshotScenario.advance(game.session, steps)
	root.get_node("Settings").values["show_tutorial"] = scenario.contains(":tuto")
	change_scene_to_file(scene_path)
	for i in 60:
		await process_frame
	var action := ""
	var args := OS.get_cmdline_user_args()
	if args.size() > 3:
		action = args[3]
	# Plusieurs actions possibles, séparées par « ; » (monde explorable).
	for one in action.split(";"):
		_do_action(one)
		for i in 40:
			await process_frame
	var img := root.get_texture().get_image()
	img.save_png(out_path)
	print("Capture enregistrée : ", out_path, " ", img.get_size())
	quit()


## L'étude de cas ne s'ouvre d'elle-même que si l'on capture précisément cet écran.
func scenario_string_has_case(_scenario: String) -> bool:
	return OS.get_cmdline_user_args().size() > 3 and OS.get_cmdline_user_args()[3] == "startcase"


## Ouvre une fenêtre ou un onglet avant la capture (QA visuelle).
## Les classes d'interface sont chargées dynamiquement : ce script est compilé avant les autoloads.
func _do_action(action: String) -> void:
	var scene := current_scene
	if action == "":
		return
	var overlay: Node = scene.get_node_or_null("Overlay")
	match action:
		"glossary":
			load("res://scripts/ui/glossary_panel.gd").open(overlay, "tresorerie_resultat")
		"budget":
			load("res://scripts/ui/budget_panel.gd").open(overlay, root.get_node("Game").session)
		"reports":
			load("res://scripts/ui/reports_history.gd").open(overlay, root.get_node("Game").session)
		"settings":
			load("res://scripts/ui/settings_panel.gd").open(overlay)
		"pause":
			scene.open_pause()
		"menu":
			scene.open_menu()
		"window":
			scene.open_phase_window()
		"talk":
			scene.interact()
		"journal":
			scene.open_journal()
		"plan":
			scene.open_city_plan()
		"collection":
			scene.open_collection()
		"rain":
			scene.sky_override = "pluie"
			scene._reload_here()
		"phase_gestion":
			root.get_node("Game").session.state.phase = "gestion"
			scene._reload_here()
		"phase_event":
			root.get_node("Game").session.state.phase = "evenement"
			scene._reload_here()
		"phase_night":
			root.get_node("Game").session.state.phase = "bilan"
			scene._reload_here()
		"coldemo":
			# Collection partiellement remplie, pour la capture (profil de capture séparé).
			var col = load("res://scripts/progression/collection.gd").new("user://capture_collection.json", "")
			col.reset()
			for o in col.objects.slice(0, 23):
				col.owned[o["id"]] = col.owned.size() + 1
			col.known_clues["cle_reserve"] = true
			col.known_clues["troupe_vasseur"] = true
			col.quest_steps["archives_oubliees"] = 4
			col.quest_steps["restauration"] = 2
			for id in ["programme_1987", "billet_avignon", "masque_arlequin", "eventail_diva"]:
				col.exhibit.append(id)
			col.outfit = "festival"
			col.save_profile()
			root.get_node("Game").collection = col
			scene._reload_here()
		"discover":
			var game = root.get_node("Game")
			game.collection.owned.erase("affiche_1924")
			game.collection_event([{"kind": "object", "id": "affiche_1924", "object": game.collection.object("affiche_1924"), "text": ""}])
		"discoverc":
			var game = root.get_node("Game")
			game.collection_event([{"kind": "object", "id": "gelatine_ambre", "object": game.collection.object("gelatine_ambre"), "text": ""}])
		"case":
			load("res://scripts/ui/case_study.gd").open(scene.overlay, root.get_node("Game").session)
		"dossier":
			load("res://scripts/ui/dossier_panel.gd").open(scene.overlay, root.get_node("Game").session, "seuil", false)
		"status":
			load("res://scripts/ui/theatre_status.gd").open(scene.overlay, root.get_node("Game").session)
		"evening":
			scene._performing = true
			scene._apply_light()
		"readable":
			# Sans enregistrer : une capture ne doit pas modifier les réglages du joueur.
			var settings := root.get_node("Settings")
			settings.values["readable_font"] = true
			settings.apply("readable_font")
		_:
			if action.begins_with("map:"):
				# map:<carte>:<x>:<y>:<direction>
				var p := action.split(":")
				scene.load_map(p[1], Vector2i(int(p[2]), int(p[3])), p[4] if p.size() > 4 else "down")
			elif action.begins_with("upgrade:"):
				root.get_node("Game").session.buy_upgrade(action.substr(8))
				scene._reload_here()
			elif action.begins_with("turn:"):
				root.get_node("Game").session.state.turn = int(action.substr(5))
				scene._reload_here()
			elif action.begins_with("prologue:"):
				for i in int(action.substr(9)):
					scene.next()
				if scene._typing:
					scene._typing.kill()
				scene._text.visible_ratio = 1.0
				if bool(scene.scenes[scene.index].get("title", false)):
					scene._title.modulate.a = 1.0
				scene._image_old.modulate.a = 0.0
				scene._image.modulate.a = 1.0
			elif action.begins_with("perf:"):
				scene.play_performance(float(action.substr(5)))
			elif action.begins_with("tab:"):
				for b in scene.find_children("*", "Button", true, false):
					if (b as Button).text == action.substr(4):
						(b as Button).pressed.emit()
			elif action.begins_with("show:"):
				var panel := scene.find_children("*", "VBoxContainer", true, false).filter(func(n: Node) -> bool: return n.has_method("_show_detail"))
				if not panel.is_empty():
					panel[0]._show_detail(action.substr(5))

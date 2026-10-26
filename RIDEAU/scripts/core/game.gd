extends Node
## Autoload « Game » : la partie en cours, partagée par toutes les scènes.
## Toute la logique est dans GameSession ; ce nœud relaie les signaux vers
## l'interface et s'occupe de la sauvegarde automatique.

signal state_changed
signal phase_changed(phase: String)
signal notice(message: String, kind: String)
## Résultats de la collection à montrer (objets, indices, étapes d'enquête, récompenses).
signal collection_results(results: Array)

const MAIN_MENU := "res://scenes/menus/main_menu.tscn"
const MANAGEMENT := "res://scenes/management/management_screen.tscn"
const WORLD := "res://scenes/world/world_screen.tscn"
const END_SCREEN := "res://scenes/reports/end_screen.tscn"
const PROLOGUE := "res://scenes/menus/prologue.tscn"
const TRAIN := "res://scenes/story/train_trip.tscn"
const PREMIERE := "res://scenes/story/paris_premiere.tscn"

var session: GameSession = null
## Message à afficher par le prochain écran (ex. restauration depuis la copie de secours).
var pending_notice := ""
## Écran à ouvrir à la fin du prologue (la partie, ou le menu si on le revoit).
var after_prologue := MAIN_MENU
var saves := SaveSystem.new()
## Carte où entrer à l'ouverture du monde ({map, cell, facing}) : l'arrivée à Paris.
var world_entry: Dictionary = {}
## Collection permanente, commune à toutes les parties (user://collection.json).
var collection := Collection.new()
var data: GameData:
	get:
		return GameData.get_default()


func _ready() -> void:
	if "--smoke-test" in OS.get_cmdline_user_args():
		_smoke_test.call_deferred()


## Autotest d'une version exportée : `RIDEAU -- --smoke-test`.
## Vérifie que les données, les dialogues et la sauvegarde sont bien dans le paquet,
## joue une saison complète avec le bot, puis quitte (code 0 si tout va bien).
func _smoke_test() -> void:
	var ok := true
	var d := GameData.get_default()
	print("[autotest] données : %d spectacles, %d événements, %d notions, erreurs %s" % [d.shows.size(), d.events.size(), d.glossary.size(), d.load_errors])
	ok = ok and d.load_errors.is_empty() and d.shows.size() > 0
	var dialogue: Variant = load("res://dialogue/events.dialogue")
	var line: DialogueLine = await DialogueManager.get_next_dialogue_line(dialogue, "journaliste") if dialogue else null
	print("[autotest] dialogue : ", line.text if line else "INTROUVABLE")
	ok = ok and line != null
	var world_data := WorldData.get_default()
	var world_ok := world_data.maps.size() > 6 and load("res://assets/world/maps/rue_hiver_base.png") != null \
			and load("res://assets/world/people/directeur.png") != null and load(WORLD) != null
	for id: String in world_data.maps:  # chaque intérieur a son décor
		if id.begins_with("int_"):
			world_ok = world_ok and load("res://assets/world/maps/%s_base.png" % world_data.map(id).art) != null
	print("[autotest] monde : %d cartes, %d répliques, images et scène %s" % [world_data.maps.size(), world_data.barks.size(), "OK" if world_ok else "MANQUANTES"])
	ok = ok and world_ok
	var col := Collection.new("user://autotest_collection.json", "")
	col.reset()
	var col_ok := col.total() == 50 and not col.on_talk(null, "touriste").is_empty() and col.has("miniature_lanterne") \
			and load("res://assets/collection/miniature.png") != null
	col.reset()
	print("[autotest] collection : %d objets, %s" % [col.total(), "OK" if col_ok else "ÉCHEC"])
	ok = ok and col_ok
	var s := GameSession.new(d)
	s.new_game(2024, "standard")
	StrategyBot.new("equilibre", 2024).play_season(s)
	print("[autotest] saison : %s, trésorerie %s, %d entrées" % [s.state.ending.get("title", "?"), Format.money(s.state.cash), int(s.state.totals["attendance_total"])])
	ok = ok and s.state.finished
	var premiere := CreationSystem.play_premiere(d, s.state, s.rayonnement())
	print("[autotest] création : « %s », %s (%d / 100)" % [premiere["show"], premiere["title"], int(premiere["score"])])
	ok = ok and str(premiere["title"]) != "" and ResourceLoader.exists("res://assets/story/premiere/salle.png") and ResourceLoader.exists("res://assets/world/maps/paris_base.png")
	var saves_test := SaveSystem.new("user://autotest")
	var w := saves_test.save(s.state, "autotest")
	var r := saves_test.load("autotest")
	saves_test.delete("autotest")
	print("[autotest] sauvegarde : ", "OK" if r["status"] == SaveSystem.Status.OK else str(r["message"]))
	ok = ok and w["status"] == SaveSystem.Status.OK and r["status"] == SaveSystem.Status.OK
	print("[autotest] RÉSULTAT : ", "SUCCÈS" if ok else "ÉCHEC")
	get_tree().quit(0 if ok else 1)


func has_game() -> bool:
	return session != null and session.state != null


func state() -> GameState:
	return session.state if has_game() else null


func new_game(difficulty: String, game_seed: int = -1, scenario: String = GameData.DEFAULT_SCENARIO) -> void:
	if game_seed < 0:
		game_seed = randi() % 1_000_000
	session = GameSession.new(data)
	session.new_game(game_seed, difficulty, scenario)
	autosave()
	if not bool(Settings.get_value("prologue_seen")):
		# Toute première partie : le prologue raconte l'histoire de la Lanterne.
		after_prologue = play_scene()
		get_tree().change_scene_to_file(PROLOGUE)
		return
	get_tree().change_scene_to_file(play_scene())


## Revoir le prologue depuis le menu principal.
func show_prologue() -> void:
	after_prologue = MAIN_MENU
	get_tree().change_scene_to_file(PROLOGUE)


## Charge la sauvegarde. Retourne le message à afficher ("" si tout va bien).
func continue_game() -> String:
	var result := saves.load()
	if result["state"] == null:
		return str(result["message"])
	session = GameSession.new(data)
	session.load_state(result["state"])
	get_tree().change_scene_to_file(END_SCREEN if session.state.finished else play_scene())
	return str(result["message"])


## Écran de jeu : le monde à explorer, ou le tableau de bord (paramètre).
func play_scene() -> String:
	return MANAGEMENT if bool(Settings.get_value("dashboard_view")) else WORLD


func autosave() -> void:
	if not has_game():
		return
	sync_collection()
	var result := saves.save(session.state)
	if result["status"] != SaveSystem.Status.OK:
		notice.emit(str(result["message"]), "error")


## Transmet à l'écran ce que la collection vient de produire.
func collection_event(results: Array) -> Array:
	if not results.is_empty():
		collection_results.emit(results)
	return results


## Vérifie la partie (missions, rénovations, événements, trophées) après chaque étape.
func sync_collection() -> void:
	if has_game():
		collection_event(collection.check_state(session))


func go_to_menu() -> void:
	if has_game() and not session.state.finished:
		autosave()
	get_tree().change_scene_to_file(MAIN_MENU)


## Fin de saison : la troupe prend le train pour jouer la création à Paris.
func start_paris_trip() -> void:
	if not has_game():
		return
	CreationSystem.fill_defaults(data, session.state)
	session.state.creation["departed"] = true
	autosave()
	get_tree().change_scene_to_file(TRAIN)


## Descente du train : le quartier parisien, autour du Théâtre des Lumières.
func arrive_in_paris() -> void:
	var arrival: Dictionary = WorldData.get_default().raw.get("maps", {}).get("paris", {}).get("arrival", {})
	world_entry = {"map": "paris", "cell": arrival.get("cell", [10, 20]), "facing": arrival.get("facing", "down")}
	get_tree().change_scene_to_file(WORLD)


## La première au Théâtre des Lumières, puis le bilan de saison.
func start_premiere() -> void:
	if has_game() and session.state.creation.get("paris", {}).is_empty():
		CreationSystem.play_premiere(data, session.state, session.rayonnement())
		autosave()
	get_tree().change_scene_to_file(PREMIERE)


func go_to_end() -> void:
	get_tree().change_scene_to_file(END_SCREEN)


## Exporte le rapport de saison (Markdown). Retourne un message pour le joueur.
## Navigateur : la page d'accueil du jeu propose le fichier (window.rideauExportReport),
## sinon téléchargement direct. Ordinateur : fichier dans le dossier des données du jeu.
func export_report() -> String:
	if not has_game():
		return ""
	var text := SeasonReport.markdown(session)
	var file := SeasonReport.file_name(session)
	if OS.has_feature("web"):
		var hook: Variant = JavaScriptBridge.eval("typeof window.rideauExportReport === 'function'", true)
		if hook == true:
			JavaScriptBridge.eval("window.rideauExportReport(%s, %s)" % [JSON.stringify(file), JSON.stringify(text)], true)
		else:
			JavaScriptBridge.download_buffer(text.to_utf8_buffer(), file, "text/markdown")
		return "Rapport « %s » proposé au téléchargement. Il est aussi affiché ci-dessous pour être copié." % file
	DirAccess.make_dir_recursive_absolute("user://rapports")
	var path := "user://rapports/" + file
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		return "Impossible d'écrire le rapport (%s)." % error_string(FileAccess.get_open_error())
	f.store_string(text)
	f.close()
	OS.shell_open(ProjectSettings.globalize_path("user://rapports"))
	return "Rapport enregistré : %s" % ProjectSettings.globalize_path(path)


## Renvoie et efface le message en attente.
func take_pending_notice() -> String:
	var msg := pending_notice
	pending_notice = ""
	return msg


func notify_changed() -> void:
	state_changed.emit()
	if has_game():
		phase_changed.emit(session.state.phase)

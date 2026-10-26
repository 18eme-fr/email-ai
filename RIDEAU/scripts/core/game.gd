extends Node
## Autoload « Game » : la partie en cours, partagée par toutes les scènes.
## Toute la logique est dans GameSession ; ce nœud relaie les signaux vers
## l'interface et s'occupe de la sauvegarde automatique.

signal state_changed
signal phase_changed(phase: String)
signal notice(message: String, kind: String)

const MAIN_MENU := "res://scenes/menus/main_menu.tscn"
const MANAGEMENT := "res://scenes/management/management_screen.tscn"
const WORLD := "res://scenes/world/world_screen.tscn"
const END_SCREEN := "res://scenes/reports/end_screen.tscn"

var session: GameSession = null
## Message à afficher par le prochain écran (ex. restauration depuis la copie de secours).
var pending_notice := ""
var saves := SaveSystem.new()
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
	var s := GameSession.new(d)
	s.new_game(2024, "standard")
	StrategyBot.new("equilibre", 2024).play_season(s)
	print("[autotest] saison : %s, trésorerie %s, %d entrées" % [s.state.ending.get("title", "?"), Format.money(s.state.cash), int(s.state.totals["attendance_total"])])
	ok = ok and s.state.finished
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


func new_game(difficulty: String, game_seed: int = -1) -> void:
	if game_seed < 0:
		game_seed = randi() % 1_000_000
	session = GameSession.new(data)
	session.new_game(game_seed, difficulty)
	autosave()
	get_tree().change_scene_to_file(play_scene())


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
	var result := saves.save(session.state)
	if result["status"] != SaveSystem.Status.OK:
		notice.emit(str(result["message"]), "error")


func go_to_menu() -> void:
	if has_game() and not session.state.finished:
		autosave()
	get_tree().change_scene_to_file(MAIN_MENU)


func go_to_end() -> void:
	get_tree().change_scene_to_file(END_SCREEN)


## Renvoie et efface le message en attente.
func take_pending_notice() -> String:
	var msg := pending_notice
	pending_notice = ""
	return msg


func notify_changed() -> void:
	state_changed.emit()
	if has_game():
		phase_changed.emit(session.state.phase)

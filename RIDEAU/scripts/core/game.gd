extends Node
## Autoload « Game » : la partie en cours, partagée par toutes les scènes.
## Toute la logique est dans GameSession ; ce nœud relaie les signaux vers
## l'interface et s'occupe de la sauvegarde automatique.

signal state_changed
signal phase_changed(phase: String)
signal notice(message: String, kind: String)

const MAIN_MENU := "res://scenes/menus/main_menu.tscn"
const MANAGEMENT := "res://scenes/management/management_screen.tscn"
const END_SCREEN := "res://scenes/reports/end_screen.tscn"

var session: GameSession = null
var saves := SaveSystem.new()
var data: GameData:
	get:
		return GameData.get_default()


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
	get_tree().change_scene_to_file(MANAGEMENT)


## Charge la sauvegarde. Retourne le message à afficher ("" si tout va bien).
func continue_game() -> String:
	var result := saves.load()
	if result["state"] == null:
		return str(result["message"])
	session = GameSession.new(data)
	session.load_state(result["state"])
	get_tree().change_scene_to_file(END_SCREEN if session.state.finished else MANAGEMENT)
	return str(result["message"])


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


func notify_changed() -> void:
	state_changed.emit()
	if has_game():
		phase_changed.emit(session.state.phase)

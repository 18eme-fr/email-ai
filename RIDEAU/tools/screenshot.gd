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
		game.session.new_game(int(parts[1]), "standard")
		var steps := int(parts[2]) if parts.size() > 2 else 0
		ScreenshotScenario.advance(game.session, steps)
	change_scene_to_file(scene_path)
	for i in 90:
		await process_frame
	if scenario.contains(":open:"):
		pass
	var img := root.get_texture().get_image()
	img.save_png(out_path)
	print("Capture enregistrée : ", out_path, " ", img.get_size())
	quit()

extends SceneTree
## Diagnostic de mise en page : liste les contrôles dont la largeur minimale dépasse un seuil.
## Usage : godot --headless --path . -s res://tools/layout_probe.gd -- <étapes> <seuil>

func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	await process_frame
	var args := OS.get_cmdline_user_args()
	var steps := int(args[0]) if args.size() > 0 else 0
	var threshold := float(args[1]) if args.size() > 1 else 560.0
	var game := root.get_node("Game")
	game.session = GameSession.new()
	game.session.new_game(3, "standard")
	ScreenshotScenario.advance(game.session, steps)
	root.get_node("Settings").values["show_tutorial"] = false
	change_scene_to_file("res://scenes/management/management_screen.tscn")
	for i in 10:
		await process_frame
	var host := current_scene.find_child("Right", true, false)
	_walk(host, threshold, 0)
	quit()


func _walk(n: Node, threshold: float, depth: int) -> void:
	if n is Control:
		var w := (n as Control).get_combined_minimum_size().x
		if w > threshold:
			var txt := ""
			if n is Label:
				txt = (n as Label).text.left(50)
			elif n is Button:
				txt = (n as Button).text.left(50)
			print("  ".repeat(depth), n.name, " [", n.get_class(), "] min=", w, " ", txt, " <- ", n.get_parent().get_class(), "/", n.get_parent().get_parent().get_class())
	for c in n.get_children(true):
		_walk(c, threshold, depth + 1)

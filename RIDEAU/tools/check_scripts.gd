extends SceneTree
## Charge tous les scripts et scènes du projet pour détecter les erreurs d'analyse.
## Usage : godot --headless --path . -s res://tools/check_scripts.gd

var failures := 0


func _init() -> void:
	_run.call_deferred()


## Différé : les autoloads (Game, Settings…) doivent exister avant la compilation des scripts.
func _run() -> void:
	await process_frame
	for dir in ["res://scripts", "res://scenes", "res://tools", "res://tests"]:
		_scan(dir)
	print("Vérification terminée : %d échec(s)." % failures)
	quit(1 if failures > 0 else 0)


func _scan(path: String) -> void:
	var d := DirAccess.open(path)
	if d == null:
		return
	for f in d.get_files():
		if f.ends_with(".gd") or f.ends_with(".tscn"):
			var full := path.path_join(f)
			if full == "res://tools/check_scripts.gd":
				continue
			var res := ResourceLoader.load(full, "", ResourceLoader.CACHE_MODE_IGNORE)
			if res == null or (res is GDScript and not (res as GDScript).can_instantiate() and not full.contains("/tools/")):
				failures += 1
				print("ÉCHEC : ", full)
	for sub in d.get_directories():
		_scan(path.path_join(sub))

extends Node
## Paramètres du joueur (autoload « Settings »), enregistrés dans user://settings.cfg.

signal changed

const PATH := "user://settings.cfg"
const READABLE_THEME := "res://assets/ui/rideau_theme_readable.tres"
const DEFAULTS := {
	"master_volume": 0.8,
	"music_volume": 0.6,
	"sfx_volume": 0.8,
	"reduce_motion": false,
	"readable_font": false,
	"fullscreen": false,
	"text_speed": 1.0,
	"show_tutorial": true,
}

var values: Dictionary = DEFAULTS.duplicate()


func _ready() -> void:
	load_settings()
	apply()


func get_value(key: String) -> Variant:
	return values.get(key, DEFAULTS.get(key))


## `persist = false` applique sans écrire sur le disque (glissement d'un curseur).
func set_value(key: String, value: Variant, persist: bool = true) -> void:
	values[key] = value
	apply(key)
	if persist:
		save_settings()
	changed.emit()


func load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(PATH) != OK:
		return
	for key: String in DEFAULTS:
		var v: Variant = cfg.get_value("settings", key, DEFAULTS[key])
		if typeof(v) == typeof(DEFAULTS[key]) or (typeof(DEFAULTS[key]) == TYPE_FLOAT and typeof(v) == TYPE_INT):
			values[key] = v


func save_settings() -> void:
	var cfg := ConfigFile.new()
	for key: String in values:
		cfg.set_value("settings", key, values[key])
	cfg.save(PATH)


## Applique les paramètres (tous, ou seulement celui qui vient de changer).
func apply(key: String = "") -> void:
	if key == "" or key.ends_with("_volume"):
		_set_bus("Master", float(values["master_volume"]))
		_set_bus("Music", float(values["music_volume"]))
		_set_bus("SFX", float(values["sfx_volume"]))
	if key == "" or key == "readable_font":
		_apply_font(bool(values["readable_font"]))
	if (key == "" or key == "fullscreen") and DisplayServer.get_name() != "headless":
		var mode := DisplayServer.WINDOW_MODE_FULLSCREEN if values["fullscreen"] else DisplayServer.WINDOW_MODE_WINDOWED
		if DisplayServer.window_get_mode() != mode and not OS.has_feature("web"):
			DisplayServer.window_set_mode(mode)


func _set_bus(bus_name: String, linear: float) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx < 0:
		return
	AudioServer.set_bus_mute(idx, linear <= 0.001)
	AudioServer.set_bus_volume_db(idx, linear_to_db(maxf(linear, 0.001)))


## Police « très lisible » : un second thème complet (généré par tools/build_theme.gd)
## est posé sur la fenêtre racine ; il prime sur le thème du projet, sans le modifier.
func _apply_font(readable: bool) -> void:
	var tree := get_tree()
	if tree == null:
		return
	var wanted: Theme = load(READABLE_THEME) if readable else null
	if tree.root.theme != wanted:
		tree.root.theme = wanted


func reduce_motion() -> bool:
	return bool(values["reduce_motion"])

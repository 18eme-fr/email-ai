class_name GameData
extends RefCounted
## Données statiques du jeu, chargées depuis res://data/*.json.
## Une instance est immuable une fois chargée ; elle est partagée entre la
## session de jeu, la simulation et les tests.

const BALANCE_PATH := "res://data/balancing/balance.json"
const CATALOG_PATH := "res://data/performances/catalog.json"
const ACTIONS_PATH := "res://data/actions/actions.json"
const EVENTS_PATH := "res://data/events/events.json"
const CHARACTERS_PATH := "res://data/characters/characters.json"
const GLOSSARY_PATH := "res://data/pedagogy/glossary.json"
const ENDINGS_PATH := "res://data/pedagogy/endings.json"

static var _default: GameData = null

var balance: Dictionary = {}
var genres: Dictionary = {}
var shows: Dictionary = {}          ## id -> show
var show_order: Array[String] = []
var actions: Dictionary = {}        ## id -> action
var action_order: Array[String] = []
var events: Dictionary = {}         ## id -> event
var event_order: Array[String] = []
var characters: Dictionary = {}
var glossary: Dictionary = {}
var endings: Array = []
var lessons: Array = []
var load_errors: PackedStringArray = []


static func get_default() -> GameData:
	if _default == null:
		_default = GameData.new()
		_default.load_all()
	return _default


static func read_json(path: String) -> Variant:
	if not FileAccess.file_exists(path):
		push_error("Fichier de données introuvable : %s" % path)
		return null
	var text := FileAccess.get_file_as_string(path)
	var json := JSON.new()
	var err := json.parse(text)
	if err != OK:
		push_error("JSON invalide dans %s (ligne %d) : %s" % [path, json.get_error_line(), json.get_error_message()])
		return null
	return json.data


func load_all() -> void:
	load_errors.clear()
	balance = _read_dict(BALANCE_PATH)
	var catalog := _read_dict(CATALOG_PATH)
	genres = catalog.get("genres", {})
	shows.clear()
	show_order.clear()
	for show: Dictionary in catalog.get("shows", []):
		shows[show["id"]] = show
		show_order.append(show["id"])
	actions.clear()
	action_order.clear()
	for action: Dictionary in _read_dict(ACTIONS_PATH).get("actions", []):
		actions[action["id"]] = action
		action_order.append(action["id"])
	events.clear()
	event_order.clear()
	for event: Dictionary in _read_dict(EVENTS_PATH).get("events", []):
		events[event["id"]] = event
		event_order.append(event["id"])
	characters = _read_dict(CHARACTERS_PATH).get("characters", {})
	glossary = _read_dict(GLOSSARY_PATH).get("notions", {})
	var endings_data := _read_dict(ENDINGS_PATH)
	endings = endings_data.get("endings", [])
	lessons = endings_data.get("lessons", [])


func _read_dict(path: String) -> Dictionary:
	var data: Variant = read_json(path)
	if data is Dictionary:
		return data
	load_errors.append(path)
	return {}


# --- Accès pratiques ---------------------------------------------------------

func turns() -> int:
	return int(balance.get("turns", 8))


func period(turn: int) -> Dictionary:
	var periods: Array = balance.get("periods", [])
	if turn < 1 or turn > periods.size():
		return {}
	return periods[turn - 1]


func difficulty(id: String) -> Dictionary:
	var all: Dictionary = balance.get("difficulties", {})
	return all.get(id, all.get("standard", {}))


func price_level(id: String) -> Dictionary:
	for level: Dictionary in balance.get("price_levels", []):
		if level["id"] == id:
			return level
	return {}


func genre_label(show: Dictionary) -> String:
	return str(genres.get(show.get("genre", ""), {}).get("label", show.get("genre", "")))


func show_capacity(show: Dictionary) -> int:
	if show.has("capacity"):
		return int(show["capacity"])
	var venue: Dictionary = balance.get("venue", {})
	if show.get("format", "salle") == "petit":
		return int(venue.get("capacity_small", 80))
	return int(venue.get("capacity_hall", 220))


func uses_hall(show: Dictionary) -> bool:
	return show.get("format", "salle") in ["salle", "residence"]


func is_artistic(show: Dictionary) -> bool:
	return float(show.get("art", 0.0)) >= float(balance.get("art_threshold", 0.7))


func character_name(id: String) -> String:
	return str(characters.get(id, {}).get("name", id))

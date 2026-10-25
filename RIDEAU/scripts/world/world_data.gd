class_name WorldData
extends RefCounted
## Données du monde explorable (res://data/world/*.json), chargées une fois.

const WORLD_PATH := "res://data/world/world.json"
const BARKS_PATH := "res://data/world/barks.json"

static var _default: WorldData = null

var raw: Dictionary = {}
var maps: Dictionary = {}       ## id -> WorldMap
var people: Dictionary = {}     ## id -> {sprite, action?, name?, role?, home}
var barks: Array = []
var seasons: Dictionary = {}
var festive_turns: Array = []
var start: Dictionary = {}


static func get_default() -> WorldData:
	if _default == null:
		_default = WorldData.new()
		_default.load_all()
	return _default


func load_all() -> void:
	var w: Variant = GameData.read_json(WORLD_PATH)
	raw = w if w is Dictionary else {}
	maps.clear()
	for id: String in raw.get("maps", {}):
		maps[id] = WorldMap.from_data(raw, id)
	people = raw.get("people", {})
	seasons = raw.get("seasons", {})
	festive_turns = raw.get("festive_turns", [])
	start = raw.get("start", {})
	var b: Variant = GameData.read_json(BARKS_PATH)
	barks = (b as Dictionary).get("barks", []) if b is Dictionary else []


func map(id: String) -> WorldMap:
	return maps.get(id)


## Carte où se trouve un personnage par défaut.
func home_of(person_id: String) -> String:
	return str(people.get(person_id, {}).get("home", ""))


func person_start(person_id: String) -> Dictionary:
	var m := map(home_of(person_id))
	if m == null:
		return {}
	for n: Dictionary in m.npcs:
		if n["id"] == person_id:
			return n
	return {}

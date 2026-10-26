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
const UPGRADES_PATH := "res://data/upgrades/upgrades.json"
const SCENARIOS_PATH := "res://data/scenarios/scenarios.json"
const MISSIONS_PATH := "res://data/missions/missions.json"
const SKILLS_PATH := "res://data/progression/skills.json"
const ACHIEVEMENTS_PATH := "res://data/progression/achievements.json"
const CREATION_PATH := "res://data/story/creation.json"
const DEFAULT_SCENARIO := "premiere_saison"

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
var upgrades: Dictionary = {}       ## id -> rénovation
var upgrade_order: Array[String] = []
var periods_per_year: int = 8
var scenarios: Dictionary = {}      ## id -> scénario (étude de cas)
var scenario_order: Array = []
var missions: Dictionary = {}       ## id -> mission
var mission_order: Array[String] = []
var missions_max_active: int = 3
var skills: Dictionary = {}         ## id -> compétence
var skill_order: Array = []
var skill_levels: Array = [0]
var achievements: Array = []
var glossary: Dictionary = {}
var creation: Dictionary = {}       ## création avec le metteur en scène (CreationSystem)
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
	creation = _read_dict(CREATION_PATH)
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
	upgrades.clear()
	upgrade_order.clear()
	var upgrades_data := _read_dict(UPGRADES_PATH)
	periods_per_year = int(upgrades_data.get("periods_per_year", 8))
	for upgrade: Dictionary in upgrades_data.get("upgrades", []):
		upgrades[upgrade["id"]] = upgrade
		upgrade_order.append(upgrade["id"])
	glossary = _read_dict(GLOSSARY_PATH).get("notions", {})
	var scen := _read_dict(SCENARIOS_PATH)
	scenarios = scen.get("scenarios", {})
	scenario_order = scen.get("order", scenarios.keys())
	var mis := _read_dict(MISSIONS_PATH)
	missions.clear()
	mission_order.clear()
	missions_max_active = int(mis.get("max_active", 3))
	for m: Dictionary in mis.get("missions", []):
		missions[m["id"]] = m
		mission_order.append(m["id"])
	var sk := _read_dict(SKILLS_PATH)
	skills = sk.get("skills", {})
	skill_order = sk.get("order", skills.keys())
	skill_levels = sk.get("levels", [0])
	achievements = _read_dict(ACHIEVEMENTS_PATH).get("achievements", [])
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


func scenario(id: String) -> Dictionary:
	return scenarios.get(id, scenarios.get(DEFAULT_SCENARIO, {}))


## Objectifs de la convention : ceux du scénario s'il en fixe, sinon ceux de balance.json.
func objectives_for(state: GameState) -> Array:
	var sc := scenario(state.scenario)
	return sc.get("objectives", balance.get("objectives", []))


func renewal_rule_for(state: GameState) -> Dictionary:
	return scenario(state.scenario).get("renewal_rule", balance.get("renewal_rule", {}))


func character_name(id: String) -> String:
	return str(characters.get(id, {}).get("name", id))

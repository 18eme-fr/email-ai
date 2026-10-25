class_name GameState
extends RefCounted
## État complet d'une partie. Ne contient que des données sérialisables :
## c'est ce qui est enregistré dans les sauvegardes.

const STAT_IDS: Array[String] = ["reputation", "fidelite", "diversite", "equipe", "equipement", "communication", "relations"]

const PHASE_SITUATION := "situation"
const PHASE_PROGRAMMING := "programmation"
const PHASE_MANAGEMENT := "gestion"
const PHASE_EVENT := "evenement"
const PHASE_REPORT := "bilan"
const PHASE_FINISHED := "fin"

var game_seed: int = 0
var difficulty: String = "standard"
var turn: int = 1
var phase: String = PHASE_SITUATION

var cash: int = 0
var stats: Dictionary = {}
var flags: Dictionary = {}

## Écritures du grand livre simplifié (voir Ledger).
var ledger: Array = []
var next_ledger_id: int = 1

var offers: Array = []          ## ids des propositions de la période
var programmed: Array = []      ## [{show_id, price_level}]
var actions: Array = []         ## ids des actions de gestion retenues
var turn_mods: Dictionary = {}  ## modificateurs de la période (événements)
var stat_log: Array = []        ## [{stat, delta, source}] variations de la période en cours
var current_event: String = ""
var event_choice: String = ""
var event_outcome: Dictionary = {}

var played_shows: Array = []    ## ids déjà programmés cette saison
var genre_history: Array = []   ## genres programmés par période
var seen_events: Array = []
var reports: Array = []
var history: Array = []         ## instantanés par fin de période (graphiques)
var key_decisions: Array = []
var upgrades: Array = []        ## ids des rénovations réalisées (investissements)
var totals: Dictionary = {"attendance_total": 0, "eac_count": 0, "art_count": 0, "shows_count": 0}

var bankrupt: bool = false
var finished: bool = false
var ending: Dictionary = {}
var tutorial_seen: Dictionary = {}


func stat(id: String) -> float:
	return float(stats.get(id, 0.0))


func set_stat(id: String, value: float) -> void:
	stats[id] = clampf(value, 0.0, 100.0)


func has_flag(id: String) -> bool:
	return flags.has(id)


func to_dict() -> Dictionary:
	return {
		"seed": game_seed,
		"difficulty": difficulty,
		"turn": turn,
		"phase": phase,
		"cash": cash,
		"stats": stats.duplicate(true),
		"flags": flags.duplicate(true),
		"ledger": ledger.duplicate(true),
		"next_ledger_id": next_ledger_id,
		"offers": offers.duplicate(true),
		"programmed": programmed.duplicate(true),
		"actions": actions.duplicate(true),
		"turn_mods": turn_mods.duplicate(true),
		"stat_log": stat_log.duplicate(true),
		"current_event": current_event,
		"event_choice": event_choice,
		"event_outcome": event_outcome.duplicate(true),
		"played_shows": played_shows.duplicate(true),
		"genre_history": genre_history.duplicate(true),
		"seen_events": seen_events.duplicate(true),
		"reports": reports.duplicate(true),
		"history": history.duplicate(true),
		"key_decisions": key_decisions.duplicate(true),
		"totals": totals.duplicate(true),
		"bankrupt": bankrupt,
		"finished": finished,
		"ending": ending.duplicate(true),
		"tutorial_seen": tutorial_seen.duplicate(true),
		"upgrades": upgrades.duplicate(),
	}


## Reconstruit un état depuis un dictionnaire. Retourne null si une donnée
## essentielle manque ou a un type incohérent (sauvegarde endommagée).
static func from_dict(d: Dictionary) -> GameState:
	var required := {
		"seed": TYPE_INT, "difficulty": TYPE_STRING, "turn": TYPE_INT, "phase": TYPE_STRING,
		"cash": TYPE_INT, "stats": TYPE_DICTIONARY, "ledger": TYPE_ARRAY,
	}
	for key: String in required:
		if not d.has(key):
			return null
		var expected: int = required[key]
		var actual := typeof(d[key])
		# Le JSON ne distingue pas entiers et flottants : on accepte un flottant entier.
		if expected == TYPE_INT and actual == TYPE_FLOAT:
			if float(d[key]) != floorf(float(d[key])):
				return null
		elif actual != expected:
			return null
	# Champs facultatifs : s'ils sont présents, leur type doit être le bon.
	var optional := {
		"flags": TYPE_DICTIONARY, "turn_mods": TYPE_DICTIONARY, "event_outcome": TYPE_DICTIONARY,
		"totals": TYPE_DICTIONARY, "ending": TYPE_DICTIONARY, "tutorial_seen": TYPE_DICTIONARY,
		"offers": TYPE_ARRAY, "programmed": TYPE_ARRAY, "actions": TYPE_ARRAY, "stat_log": TYPE_ARRAY,
		"played_shows": TYPE_ARRAY, "genre_history": TYPE_ARRAY, "seen_events": TYPE_ARRAY,
		"reports": TYPE_ARRAY, "history": TYPE_ARRAY, "key_decisions": TYPE_ARRAY,
		"upgrades": TYPE_ARRAY,
	}
	for key: String in optional:
		if d.has(key) and typeof(d[key]) != optional[key]:
			return null
	for entry: Variant in d["ledger"]:
		if not entry is Dictionary:
			return null
		for key: String in ["amount", "direction", "turn_engaged", "due_turn", "label", "settled"]:
			if not (entry as Dictionary).has(key):
				return null
	var s := GameState.new()
	s.game_seed = int(d["seed"])
	s.difficulty = str(d["difficulty"])
	s.turn = int(d["turn"])
	s.phase = str(d["phase"])
	s.cash = int(d["cash"])
	for id: String in STAT_IDS:
		if not d["stats"].has(id):
			return null
		s.stats[id] = float(d["stats"][id])
	s.flags = d.get("flags", {})
	s.ledger = _normalize_ledger(d["ledger"])
	s.next_ledger_id = int(d.get("next_ledger_id", s.ledger.size() + 1))
	s.offers = d.get("offers", [])
	s.programmed = d.get("programmed", [])
	s.actions = d.get("actions", [])
	s.turn_mods = d.get("turn_mods", {})
	s.stat_log = d.get("stat_log", [])
	s.current_event = str(d.get("current_event", ""))
	s.event_choice = str(d.get("event_choice", ""))
	s.event_outcome = d.get("event_outcome", {})
	s.played_shows = d.get("played_shows", [])
	s.genre_history = d.get("genre_history", [])
	s.seen_events = d.get("seen_events", [])
	s.reports = d.get("reports", [])
	s.history = d.get("history", [])
	s.key_decisions = d.get("key_decisions", [])
	var totals_in: Dictionary = d.get("totals", {})
	for key: String in s.totals:
		s.totals[key] = int(totals_in.get(key, 0))
	s.bankrupt = bool(d.get("bankrupt", false))
	s.finished = bool(d.get("finished", false))
	s.ending = d.get("ending", {})
	s.tutorial_seen = d.get("tutorial_seen", {})
	for id: Variant in d.get("upgrades", []):
		if not id is String:
			return null
		s.upgrades.append(id)
	return s


## Le JSON renvoie des flottants : on remet les montants et tours en entiers.
static func _normalize_ledger(entries: Array) -> Array:
	var out: Array = []
	for e: Dictionary in entries:
		var entry := e.duplicate()
		for key: String in ["id", "amount", "direction", "turn_engaged", "due_turn"]:
			if entry.has(key):
				entry[key] = int(entry[key])
		out.append(entry)
	return out

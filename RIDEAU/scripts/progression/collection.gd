class_name Collection
extends RefCounted
## Collection permanente de la Lanterne : 51 objets en 5 familles
## (data/progression/collection.json), conservés d'une partie à l'autre dans
## user://collection.json. Toute acquisition se décide ici, côté logique :
## l'écran du monde se contente de signaler ce que fait le joueur (parler,
## examiner, fouiller, ramasser, entrer dans un lieu) et la partie est
## vérifiée après chaque étape (missions, rénovations, événements, trophées).
##
## Chaque fonction `on_*` retourne une liste de résultats à montrer :
##   {kind: "object", id, object, text}     objet obtenu (text = phrase de la personne ou du lieu)
##   {kind: "clue", id, clue, text}         indice noté dans le carnet d'enquête
##   {kind: "quest_step", quest, text, done: bool}   étape d'enquête franchie
##   {kind: "tease", text}                  la personne explique ce qu'il manque
##   {kind: "reward", reward}               récompense de collection débloquée
## Aucune acquisition ne donne d'avantage de gestion (argent, indicateurs).

const DATA_PATH := "res://data/progression/collection.json"
const DEFAULT_PATH := "user://collection.json"
const LEGACY_ALBUM_PATH := "user://album.json"
const PROFILE_VERSION := 1
const RARITY_ORDER := ["commun", "peu_commun", "rare", "legendaire", "mythique"]

var families: Array = []
var rarities: Array = []
var methods: Dictionary = {}
var objects: Array = []
var quests: Array = []
var clues: Dictionary = {}
var clue_sources: Array = []
var rewards: Array = []
var exhibit_slots := 6
var _by_id: Dictionary = {}
var _migrate: Dictionary = {}

var path := DEFAULT_PATH
var legacy_path := LEGACY_ALBUM_PATH
# --- Profil du joueur (sauvegardé à chaque changement)
var owned: Dictionary = {}          ## id -> rang d'obtention (1, 2, 3…)
var unseen: Array = []              ## objets pas encore regardés dans la collection
var known_clues: Dictionary = {}    ## indice -> true
var quest_steps: Dictionary = {}    ## enquête -> nombre d'étapes franchies
var revealed_hints: Dictionary = {} ## objet -> true (indice précis donné par Fernand)
var exhibit: Array = []             ## objets exposés dans les vitrines du hall
var outfit := ""
var advice_period := ""             ## « graine:période » du dernier conseil de Fernand


func _init(profile_path: String = DEFAULT_PATH, legacy: String = LEGACY_ALBUM_PATH) -> void:
	path = profile_path
	legacy_path = legacy
	var raw: Variant = GameData.read_json(DATA_PATH)
	var d: Dictionary = raw if raw is Dictionary else {}
	families = d.get("families", [])
	rarities = d.get("rarities", [])
	methods = d.get("methods", {})
	objects = d.get("objects", [])
	quests = d.get("quests", [])
	clues = d.get("clues", {})
	clue_sources = d.get("clue_sources", [])
	rewards = d.get("rewards", [])
	exhibit_slots = int(d.get("exhibit_slots", 6))
	_migrate = d.get("migrate_album", {})
	for o: Dictionary in objects:
		_by_id[o["id"]] = o
	load_profile()


# --- Catalogue ------------------------------------------------------------------

func object(id: String) -> Dictionary:
	return _by_id.get(id, {})


func quest(id: String) -> Dictionary:
	for q: Dictionary in quests:
		if q["id"] == id:
			return q
	return {}


func in_family(family: String) -> Array:
	return objects.filter(func(o: Dictionary) -> bool: return o["family"] == family)


func has(id: String) -> bool:
	return owned.has(id)


func count(family: String = "") -> int:
	if family == "":
		return owned.size()
	var n := 0
	for id: String in owned:
		if object(id).get("family", "") == family:
			n += 1
	return n


func total(family: String = "") -> int:
	return objects.size() if family == "" else in_family(family).size()


func rarity_info(rarity: String) -> Dictionary:
	for r: Dictionary in rarities:
		if r["id"] == rarity:
			return r
	return {"id": rarity, "label": rarity, "color": "ffffff"}


func family_info(family: String) -> Dictionary:
	for f: Dictionary in families:
		if f["id"] == family:
			return f
	return {"id": family, "label": family, "title": family}


# --- Conditions -------------------------------------------------------------------

## Conditions d'un objet, d'une étape ou d'un indice. Les clés qui portent sur la
## partie en cours sont fausses sans partie (menu principal).
func conditions_met(req: Dictionary, session: GameSession) -> bool:
	if req.is_empty():
		return true
	if req.has("any"):
		var ok := false
		for sub: Dictionary in req["any"]:
			if conditions_met(sub, session):
				ok = true
				break
		if not ok:
			return false
	for id: Variant in req.get("owned", []):
		if not owned.has(str(id)):
			return false
	if req.has("owned_min") and owned.size() < int(req["owned_min"]):
		return false
	for id: Variant in req.get("clues", []):
		if not known_clues.has(str(id)):
			return false
	if req.has("exhibit_min") and exhibit.size() < int(req["exhibit_min"]):
		return false
	var game_keys := ["min_turn", "rules", "metric_min", "mission_done", "upgrade", "achievement", "event_choice",
		"dossier_min", "played_min", "evening"]
	var needs_game := false
	for k: String in game_keys:
		if req.has(k):
			needs_game = true
	if not needs_game:
		return true
	if session == null or session.state == null:
		return false
	var s := session.state
	if req.has("min_turn") and s.turn < int(req["min_turn"]):
		return false
	if req.has("rules") and not Rules.check(req["rules"], session.data, s):
		return false
	for m: String in req.get("metric_min", {}):
		if SeasonEvaluator.metric(session.data, s, m) < float(req["metric_min"][m]):
			return false
	if req.has("mission_done") and MissionSystem.status(s, str(req["mission_done"])) != "done":
		return false
	if req.has("upgrade") and not str(req["upgrade"]) in s.upgrades:
		return false
	if req.has("achievement") and not str(req["achievement"]) in s.achievements:
		return false
	if req.has("event_choice"):
		var ec: Dictionary = req["event_choice"]
		var found := false
		for k: Dictionary in s.key_decisions:
			if str(k.get("event", "")) == str(ec["event"]) and str(k.get("choice", "")) in ec.get("choices", []):
				found = true
		if not found:
			return false
	if req.has("dossier_min"):
		var dm: Dictionary = req["dossier_min"]
		var best := -1.0
		for r: Dictionary in s.dossiers:
			if r["id"] == dm["dossier"]:
				best = maxf(best, float(r["score"]))
		if best < float(dm["score"]):
			return false
	if req.has("played_min") and s.played_shows.size() < int(req["played_min"]):
		return false
	if req.has("evening") and bool(req["evening"]) != (s.phase in [GameState.PHASE_REPORT, GameState.PHASE_FINISHED]):
		return false
	return true


static func _matches(trigger: Dictionary, kind: String, params: Dictionary) -> bool:
	if str(trigger.get("type", "")) != kind:
		return false
	match kind:
		"talk":
			return str(trigger["person"]) == str(params["person"])
		"examine":
			return str(trigger["spot"]) == str(params["spot"])
		"visit":
			return str(trigger["map"]) == str(params["map"])
		"search", "pickup":
			return str(trigger["map"]) == str(params["map"]) and Vector2i(int(trigger["cell"][0]), int(trigger["cell"][1])) == params["cell"]
	return false


# --- Événements du monde et de la partie -------------------------------------------

## Le joueur parle à quelqu'un (clé de répliques : « bastien », « enfant »…).
func on_talk(session: GameSession, person: String) -> Array:
	return _dispatch(session, "talk", {"person": person})


## Le joueur examine un objet du décor (clé du spot : « fontaine », « tour »…).
func on_examine(session: GameSession, spot: String) -> Array:
	return _dispatch(session, "examine", {"spot": spot})


## Le joueur fouille une case (devant lui ou sous ses pieds).
func on_search(session: GameSession, map_id: String, cell: Vector2i) -> Array:
	return _dispatch(session, "search", {"map": map_id, "cell": cell})


## Le joueur ramasse l'objet posé sur une case.
func on_pickup(session: GameSession, map_id: String, cell: Vector2i) -> Array:
	return _dispatch(session, "pickup", {"map": map_id, "cell": cell})


## Le joueur entre dans un lieu.
func on_enter_map(session: GameSession, map_id: String) -> Array:
	return _dispatch(session, "visit", {"map": map_id})


## Après chaque étape de la partie : missions, rénovations, événements, trophées.
func check_state(session: GameSession) -> Array:
	var out: Array = []
	for o: Dictionary in objects:
		var t: Dictionary = o["trigger"]
		if t["type"] == "state" and not has(o["id"]) and conditions_met(t["when"], session):
			_grant(str(o["id"]), str(o.get("say", "")), out)
	return out


func _dispatch(session: GameSession, kind: String, params: Dictionary) -> Array:
	var out: Array = []
	var teases: Array = []
	# 1. Enquêtes : une étape au plus par enquête et par action.
	for q: Dictionary in quests:
		var done := int(quest_steps.get(q["id"], 0))
		var steps: Array = q["steps"]
		if done >= steps.size():
			continue
		var step: Dictionary = steps[done]
		if not _matches(step["trigger"], kind, params):
			continue
		if done == 0 and not conditions_met(q.get("requires", {}), session):
			continue  # enquête encore secrète : rien ne la trahit
		if not conditions_met(step.get("requires", {}), session):
			if step.has("tease"):
				teases.append(str(step["tease"]))
			continue
		quest_steps[q["id"]] = done + 1
		var finished := done + 1 >= steps.size()
		out.append({"kind": "quest_step", "quest": q["id"], "text": str(step.get("say", "")), "done": finished, "started": done == 0})
		if step.has("gives_clue"):
			_learn(str(step["gives_clue"]), "", out)
		if finished:
			_grant(str(q["reward"]), "", out)
		save_profile()
	# 2. Objets
	for o: Dictionary in objects:
		if has(o["id"]) or not _matches(o["trigger"], kind, params):
			continue
		if conditions_met(o.get("requires", {}), session):
			_grant(str(o["id"]), str(o.get("say", "")), out)
	# 3. Indices
	for c: Dictionary in clue_sources:
		if known_clues.has(c["clue"]) or not _matches(c["trigger"], kind, params):
			continue
		if conditions_met(c.get("requires", {}), session):
			_learn(str(c["clue"]), str(c.get("say", "")), out)
	if out.is_empty():
		for t: String in teases:
			out.append({"kind": "tease", "text": t})
	return out


func _grant(id: String, say: String, out: Array) -> void:
	if id == "" or not _by_id.has(id) or owned.has(id):
		return
	var before: Array = unlocked_rewards().map(func(r: Dictionary) -> String: return str(r["id"]))
	owned[id] = owned.size() + 1
	unseen.append(id)
	var o: Dictionary = _by_id[id]
	out.append({"kind": "object", "id": id, "object": o, "text": say})
	if o.has("gives_clue"):
		_learn(str(o["gives_clue"]), "", out)
	for r: Dictionary in unlocked_rewards():
		if not str(r["id"]) in before:
			out.append({"kind": "reward", "reward": r})
	save_profile()


func _learn(clue_id: String, say: String, out: Array) -> void:
	if known_clues.has(clue_id) or not clues.has(clue_id):
		return
	known_clues[clue_id] = true
	out.append({"kind": "clue", "id": clue_id, "clue": clues[clue_id], "text": say})
	save_profile()


# --- Ce que le monde montre ----------------------------------------------------------

## Objets posés à ramasser sur cette carte (seulement ceux qui sont accessibles).
func visible_pickups(session: GameSession, map_id: String) -> Array:
	var out: Array = []
	for o: Dictionary in objects:
		var t: Dictionary = o["trigger"]
		if t["type"] == "pickup" and str(t["map"]) == map_id and not has(o["id"]) and conditions_met(o.get("requires", {}), session):
			out.append({"id": o["id"], "cell": Vector2i(int(t["cell"][0]), int(t["cell"][1]))})
	return out


## Personnes qui ont quelque chose de nouveau à raconter pour une enquête (bulle « ? »).
func people_with_quest_news(session: GameSession) -> Array:
	var out: Array = []
	for q: Dictionary in quests:
		var done := int(quest_steps.get(q["id"], 0))
		var steps: Array = q["steps"]
		if done >= steps.size():
			continue
		var step: Dictionary = steps[done]
		if step["trigger"]["type"] != "talk":
			continue
		if done == 0 and not conditions_met(q.get("requires", {}), session):
			continue
		if conditions_met(step.get("requires", {}), session):
			out.append(str(step["trigger"]["person"]))
	return out


func quest_status(quest_id: String) -> String:
	var q := quest(quest_id)
	var done := int(quest_steps.get(quest_id, 0))
	if done == 0:
		return "unknown"
	return "done" if done >= (q["steps"] as Array).size() else "active"


## Étape en cours d'une enquête commencée ("" si terminée ou pas commencée).
func quest_current_step(quest_id: String) -> String:
	var q := quest(quest_id)
	var done := int(quest_steps.get(quest_id, 0))
	if done == 0 or done >= (q["steps"] as Array).size():
		return ""
	return str(q["steps"][done]["text"])


func active_quests() -> Array:
	return quests.filter(func(q: Dictionary) -> bool: return quest_status(q["id"]) == "active")


# --- Indices progressifs ----------------------------------------------------------------

## 1 : le mode d'obtention ; 2 : la région ou le type de lieu (deux objets de la
## famille, ou dix objets en tout) ; 3 : l'indication précise (conseil de Fernand,
## ou quarante objets en tout, pour ne jamais rester bloqué en fin de collection).
func hint_level(id: String) -> int:
	var o := object(id)
	if o.is_empty():
		return 0
	if revealed_hints.has(id) or owned.size() >= 40:
		return 3
	if count(str(o["family"])) >= 2 or owned.size() >= 10:
		return 2
	return 1


func hints(id: String) -> Array:
	var o := object(id)
	var out: Array = [str(methods.get(o.get("method", ""), {}).get("hint", ""))]
	var level := hint_level(id)
	if level >= 2:
		out.append(str(o["hint2"]))
	if level >= 3:
		out.append(str(o["hint3"]))
	return out


static func _period_key(session: GameSession) -> String:
	return "%d:%d" % [session.state.game_seed, session.state.turn] if session != null and session.state != null else ""


## Fernand donne un conseil précis par période de jeu (pas de connexion quotidienne).
func can_advise(session: GameSession) -> bool:
	return session != null and advice_period != _period_key(session) and owned.size() < objects.size()


## Révèle l'indice précis du prochain objet manquant d'une famille (le moins rare d'abord).
func advise(session: GameSession, family: String) -> Dictionary:
	if not can_advise(session):
		return {}
	for rarity: String in RARITY_ORDER:
		for o: Dictionary in in_family(family):
			if o["rarity"] == rarity and not has(o["id"]) and not revealed_hints.has(o["id"]):
				revealed_hints[o["id"]] = true
				advice_period = _period_key(session)
				save_profile()
				return o
	return {}


# --- Récompenses, tenues, exposition ------------------------------------------------------

func reward_unlocked(r: Dictionary) -> bool:
	var when: Dictionary = r.get("when", {})
	if when.has("total") and owned.size() < int(when["total"]):
		return false
	if when.has("family") and count(str(when["family"])) < total(str(when["family"])):
		return false
	if when.has("item") and not has(str(when["item"])):
		return false
	return true


func unlocked_rewards() -> Array:
	return rewards.filter(func(r: Dictionary) -> bool: return reward_unlocked(r))


func has_reward(id: String) -> bool:
	for r: Dictionary in rewards:
		if r["id"] == id:
			return reward_unlocked(r)
	return false


func reward_condition(r: Dictionary) -> String:
	var when: Dictionary = r.get("when", {})
	if when.has("family"):
		return "Famille « %s » complète" % family_info(str(when["family"]))["label"]
	if when.has("item"):
		return "Trouver « %s »" % object(str(when["item"])).get("name", "?")
	return "%d objets" % int(when.get("total", 0))


## Tenues : la tenue de base, puis celles débloquées par la collection.
func outfits() -> Array:
	var out: Array = [{"id": "", "label": "Tenue de directeur", "sprite": "directeur", "kind": "outfit", "when": {}}]
	for r: Dictionary in rewards:
		if r["kind"] == "outfit":
			out.append(r)
	return out


func set_outfit(id: String) -> bool:
	for o: Dictionary in outfits():
		if str(o["id"]) == id and reward_unlocked(o):
			outfit = id
			save_profile()
			return true
	return false


func outfit_sprite() -> String:
	for o: Dictionary in outfits():
		if str(o["id"]) == outfit and reward_unlocked(o):
			return str(o["sprite"])
	return "directeur"


## Expose ou retire un objet des vitrines (il reste toujours dans la collection).
func set_exhibited(id: String, on: bool) -> bool:
	if on:
		if not has(id) or id in exhibit or exhibit.size() >= exhibit_slots:
			return false
		exhibit.append(id)
	else:
		if not id in exhibit:
			return false
		exhibit.erase(id)
	save_profile()
	return true


func mark_seen() -> void:
	if unseen.is_empty():
		return
	unseen.clear()
	save_profile()


# --- Sauvegarde du profil ------------------------------------------------------------------

func load_profile() -> void:
	_clear()
	if not FileAccess.file_exists(path):
		_migrate_album()
		return
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if not parsed is Dictionary:
		return  # profil illisible : collection vide, sans planter
	var p: Dictionary = parsed
	var got: Variant = p.get("owned", {})
	if got is Dictionary:
		for id: String in got:
			if _by_id.has(id):
				owned[id] = int(got[id])
	for id: Variant in p.get("unseen", []):
		if owned.has(str(id)) and not str(id) in unseen:
			unseen.append(str(id))
	var c: Variant = p.get("clues", {})
	if c is Dictionary:
		for id: String in c:
			if clues.has(id):
				known_clues[id] = true
	var qs: Variant = p.get("quests", {})
	if qs is Dictionary:
		for id: String in qs:
			var q := quest(id)
			if not q.is_empty():
				quest_steps[id] = clampi(int(qs[id]), 0, (q["steps"] as Array).size())
	var h: Variant = p.get("hints", {})
	if h is Dictionary:
		for id: String in h:
			if _by_id.has(id):
				revealed_hints[id] = true
	for id: Variant in p.get("exhibit", []):
		if owned.has(str(id)) and not str(id) in exhibit and exhibit.size() < exhibit_slots:
			exhibit.append(str(id))
	outfit = str(p.get("outfit", ""))
	advice_period = str(p.get("advice_period", ""))


## Reprend les objets de l'album de la version 0.13 qui existent encore.
func _migrate_album() -> void:
	if legacy_path == "" or not FileAccess.file_exists(legacy_path):
		return
	var f := FileAccess.open(legacy_path, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if not parsed is Dictionary:
		return
	var old: Variant = (parsed as Dictionary).get("collected", {})
	if old is Dictionary:
		for old_id: String in old:
			var new_id := str(_migrate.get(old_id, ""))
			if _by_id.has(new_id) and not owned.has(new_id):
				owned[new_id] = owned.size() + 1
	outfit = str((parsed as Dictionary).get("outfit", ""))
	if not set_outfit(outfit):
		outfit = ""
	save_profile()


func save_profile() -> void:
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify({"version": PROFILE_VERSION, "owned": owned, "unseen": unseen, "clues": known_clues,
		"quests": quest_steps, "hints": revealed_hints, "exhibit": exhibit, "outfit": outfit, "advice_period": advice_period}, " "))


func _clear() -> void:
	owned.clear()
	unseen.clear()
	known_clues.clear()
	quest_steps.clear()
	revealed_hints.clear()
	exhibit.clear()
	outfit = ""
	advice_period = ""


## Efface la collection (paramètres ou tests).
func reset() -> void:
	_clear()
	save_profile()

class_name Album
extends RefCounted
## Album de collection (data/progression/album.json), conservé d'une partie à
## l'autre dans un petit fichier de profil : rencontres, lieux, affiches et
## trésors cachés. Il n'a aucun effet sur la gestion : il récompense la
## curiosité par des cartes et des tenues pour le directeur.

const DATA_PATH := "res://data/progression/album.json"
const DEFAULT_PATH := "user://album.json"

var categories: Array = []
var outfits: Array = []
var cards: Array = []               ## dans l'ordre des données
var _by_id: Dictionary = {}
var _by_key: Dictionary = {}        ## "<catégorie>:<clé>" -> id de carte

var path := DEFAULT_PATH
var collected: Dictionary = {}      ## id -> ordre d'obtention
var unseen: Array = []              ## cartes pas encore regardées dans l'album
var outfit := ""


func _init(profile_path: String = DEFAULT_PATH) -> void:
	path = profile_path
	var raw: Variant = GameData.read_json(DATA_PATH)
	var d: Dictionary = raw if raw is Dictionary else {}
	categories = d.get("categories", [])
	outfits = d.get("outfits", [])
	cards = d.get("cards", [])
	for c: Dictionary in cards:
		_by_id[c["id"]] = c
		match str(c["category"]):
			"rencontres":
				_by_key["rencontres:" + str(c["id"]).substr(2)] = c["id"]
			"lieux":
				for k: String in c.get("keys", []):
					_by_key["lieux:" + k] = c["id"]
			"affiches":
				_by_key["affiches:" + str(c["show"])] = c["id"]
	load_profile()


func card(id: String) -> Dictionary:
	return _by_id.get(id, {})


## Carte liée à une personne (clé de répliques), un lieu (clé de spot) ou un spectacle.
func card_for(category: String, key: String) -> String:
	return str(_by_key.get(category + ":" + key, ""))


func has(id: String) -> bool:
	return collected.has(id)


func count(category: String = "") -> int:
	var n := 0
	for id: String in collected:
		if category == "" or card(id).get("category", "") == category:
			n += 1
	return n


func total(category: String = "") -> int:
	if category == "":
		return cards.size()
	return cards.filter(func(c: Dictionary) -> bool: return c["category"] == category).size()


func in_category(category: String) -> Array:
	return cards.filter(func(c: Dictionary) -> bool: return c["category"] == category)


## Ajoute une carte. Retourne la carte si elle est nouvelle, {} sinon.
## Les tenues débloquées par cette carte sont dans `newly_unlocked_outfits()`.
func collect(id: String) -> Dictionary:
	if id == "" or not _by_id.has(id) or collected.has(id):
		return {}
	collected[id] = collected.size() + 1
	unseen.append(id)
	save_profile()
	return _by_id[id]


## Trésors encore cachés sur une carte : [{id, cell: Vector2i}].
func hidden_treasures(map_id: String) -> Array:
	var out: Array = []
	for c: Dictionary in in_category("tresors"):
		if str(c["map"]) == map_id and not has(c["id"]):
			out.append({"id": c["id"], "cell": Vector2i(int(c["cell"][0]), int(c["cell"][1]))})
	return out


func outfit_unlocked(o: Dictionary) -> bool:
	return count() >= int(o.get("cards_min", 0)) and count("tresors") >= int(o.get("tresors_min", 0))


## Tenue débloquée exactement par la dernière carte obtenue ({} sinon).
func outfit_just_unlocked() -> Dictionary:
	for o: Dictionary in outfits:
		if not outfit_unlocked(o):
			continue
		var by_cards := int(o.get("cards_min", 0)) > 0 and count() == int(o["cards_min"])
		var by_treasures := int(o.get("tresors_min", 0)) > 0 and count("tresors") == int(o["tresors_min"])
		if by_cards or by_treasures:
			return o
	return {}


## Condition à remplir pour une tenue, en clair.
func outfit_condition(o: Dictionary) -> String:
	if int(o.get("tresors_min", 0)) > 0:
		return "%d trésors" % int(o["tresors_min"])
	return "%d cartes" % int(o.get("cards_min", 0))


func set_outfit(id: String) -> bool:
	for o: Dictionary in outfits:
		if str(o["id"]) == id and outfit_unlocked(o):
			outfit = id
			save_profile()
			return true
	return false


func outfit_sprite() -> String:
	for o: Dictionary in outfits:
		if str(o["id"]) == outfit and outfit_unlocked(o):
			return str(o["sprite"])
	return "directeur"


func mark_seen() -> void:
	if unseen.is_empty():
		return
	unseen.clear()
	save_profile()


func load_profile() -> void:
	collected.clear()
	unseen.clear()
	outfit = ""
	if not FileAccess.file_exists(path):
		return
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if not parsed is Dictionary:
		return  # profil illisible : on repart d'un album vide, sans planter
	var p: Dictionary = parsed
	var got: Variant = p.get("collected", {})
	if got is Dictionary:
		for id: String in got:
			if _by_id.has(id):
				collected[id] = int(got[id])
	for id: Variant in p.get("unseen", []):
		if collected.has(str(id)):
			unseen.append(str(id))
	outfit = str(p.get("outfit", ""))


func save_profile() -> void:
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify({"version": 1, "collected": collected, "unseen": unseen, "outfit": outfit}, " "))


## Efface l'album (paramètres ou tests).
func reset() -> void:
	collected.clear()
	unseen.clear()
	outfit = ""
	save_profile()

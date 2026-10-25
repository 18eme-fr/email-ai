class_name SaveSystem
extends RefCounted
## Sauvegarde JSON versionnée, avec somme de contrôle et copie de secours.
##
## Format du fichier :
## {"format": "rideau-save", "version": 1, "game_version": "...", "saved_at": "...",
##  "checksum": "<sha256 du JSON de 'state'>", "state": {...}}
##
## Écriture : on écrit d'abord un fichier temporaire, puis on remplace
## l'ancien fichier, conservé en .bak. Lecture : si le fichier principal est
## endommagé, on tente la copie de secours, et on le signale toujours au joueur.

const FORMAT_ID := "rideau-save"
const CURRENT_VERSION := 1
const DEFAULT_DIR := "user://saves"
const DEFAULT_SLOT := "saison"

enum Status { OK, MISSING, CORRUPTED, RESTORED_FROM_BACKUP, INCOMPATIBLE, WRITE_ERROR }

var directory: String


func _init(dir: String = DEFAULT_DIR) -> void:
	directory = dir


func path_for(slot: String) -> String:
	return "%s/%s.json" % [directory, slot]


func has_save(slot: String = DEFAULT_SLOT) -> bool:
	return FileAccess.file_exists(path_for(slot)) or FileAccess.file_exists(path_for(slot) + ".bak")


static func serialize(state: GameState) -> String:
	var state_dict := state.to_dict()
	var envelope := {
		"format": FORMAT_ID,
		"version": CURRENT_VERSION,
		"game_version": str(ProjectSettings.get_setting("application/config/version", "dev")),
		"saved_at": Time.get_datetime_string_from_system(true),
		"checksum": checksum(state_dict),
		"state": state_dict,
	}
	return JSON.stringify(envelope, "\t", true, true)


## Somme de contrôle sur une forme canonique (aller-retour JSON) : le JSON ne
## distingue pas 5 et 5.0, il faut donc comparer des données déjà relues.
static func checksum(state_dict: Dictionary) -> String:
	var canonical: Variant = JSON.parse_string(JSON.stringify(state_dict, "", true, true))
	return JSON.stringify(canonical, "", true, true).sha256_text()


## Retourne {status, state (GameState ou null), message}.
static func deserialize(text: String) -> Dictionary:
	var json := JSON.new()
	if json.parse(text) != OK or not json.data is Dictionary:
		return _fail(Status.CORRUPTED, "Le fichier de sauvegarde est illisible.")
	var envelope: Dictionary = json.data
	if envelope.get("format", "") != FORMAT_ID or not envelope.get("state") is Dictionary:
		return _fail(Status.CORRUPTED, "Ce fichier n'est pas une sauvegarde de RIDEAU !.")
	var version := int(envelope.get("version", 0))
	if version > CURRENT_VERSION:
		return _fail(Status.INCOMPATIBLE, "Cette sauvegarde provient d'une version plus récente du jeu.")
	var state_dict: Dictionary = migrate(envelope["state"], version)
	if version == CURRENT_VERSION:
		var expected := str(envelope.get("checksum", ""))
		if expected != checksum(envelope["state"]):
			return _fail(Status.CORRUPTED, "La sauvegarde a été modifiée ou endommagée (somme de contrôle invalide).")
	var state := GameState.from_dict(state_dict)
	if state == null:
		return _fail(Status.CORRUPTED, "La sauvegarde est incomplète.")
	return {"status": Status.OK, "state": state, "message": ""}


## Migrations successives des anciens formats. Chaque version future ajoutera
## une étape ici, de façon à ne jamais perdre une ancienne partie.
static func migrate(state_dict: Dictionary, from_version: int) -> Dictionary:
	var d := state_dict.duplicate(true)
	if from_version < 1:
		# Version 0 (prototype) : pas de journal des variations ni de totaux.
		if not d.has("stat_log"):
			d["stat_log"] = []
		if not d.has("totals"):
			d["totals"] = {}
	return d


static func _fail(status: Status, message: String) -> Dictionary:
	return {"status": status, "state": null, "message": message}


func save(state: GameState, slot: String = DEFAULT_SLOT) -> Dictionary:
	var dir_err := DirAccess.make_dir_recursive_absolute(directory)
	if dir_err != OK and not DirAccess.dir_exists_absolute(directory):
		return {"status": Status.WRITE_ERROR, "message": "Impossible de créer le dossier de sauvegarde."}
	var path := path_for(slot)
	var tmp := path + ".tmp"
	var file := FileAccess.open(tmp, FileAccess.WRITE)
	if file == null:
		return {"status": Status.WRITE_ERROR, "message": "Impossible d'écrire la sauvegarde (%s)." % error_string(FileAccess.get_open_error())}
	file.store_string(serialize(state))
	file.close()
	# Vérifie le fichier écrit avant de remplacer l'ancien.
	var check := deserialize(FileAccess.get_file_as_string(tmp))
	if check["status"] != Status.OK:
		DirAccess.remove_absolute(tmp)
		return {"status": Status.WRITE_ERROR, "message": "La sauvegarde écrite n'a pas pu être relue : l'ancienne est conservée."}
	if FileAccess.file_exists(path):
		if FileAccess.file_exists(path + ".bak"):
			DirAccess.remove_absolute(path + ".bak")
		DirAccess.rename_absolute(path, path + ".bak")
	var err := DirAccess.rename_absolute(tmp, path)
	if err != OK:
		return {"status": Status.WRITE_ERROR, "message": "Impossible de finaliser la sauvegarde (%s)." % error_string(err)}
	return {"status": Status.OK, "message": "Partie enregistrée."}


func load(slot: String = DEFAULT_SLOT) -> Dictionary:
	var path := path_for(slot)
	if not FileAccess.file_exists(path):
		if FileAccess.file_exists(path + ".bak"):
			return _load_backup(path, "La sauvegarde principale est introuvable.")
		return _fail(Status.MISSING, "Aucune sauvegarde trouvée.")
	var result := deserialize(FileAccess.get_file_as_string(path))
	if result["status"] == Status.OK or result["status"] == Status.INCOMPATIBLE:
		return result
	return _load_backup(path, str(result["message"]))


func _load_backup(path: String, reason: String) -> Dictionary:
	var bak := path + ".bak"
	if not FileAccess.file_exists(bak):
		return _fail(Status.CORRUPTED, reason + " Aucune copie de secours n'est disponible.")
	var result := deserialize(FileAccess.get_file_as_string(bak))
	if result["status"] != Status.OK:
		return _fail(Status.CORRUPTED, reason + " La copie de secours est elle aussi endommagée.")
	result["status"] = Status.RESTORED_FROM_BACKUP
	result["message"] = reason + " La partie a été restaurée depuis la sauvegarde précédente (une période peut avoir été perdue)."
	return result


func delete(slot: String = DEFAULT_SLOT) -> void:
	for p: String in [path_for(slot), path_for(slot) + ".bak", path_for(slot) + ".tmp"]:
		if FileAccess.file_exists(p):
			DirAccess.remove_absolute(p)

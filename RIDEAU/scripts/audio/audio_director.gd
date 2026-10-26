extends Node
## Son du jeu (autoload « AudioDirector ») : musiques en fondu enchaîné,
## ambiances en couches (ville, oiseaux, pluie…), sons localisés dans le monde,
## bruits de pas et sons d'interface. Tout est généré pour le projet
## (tools/generate_audio.py et tools/audio_world.py).
##
## Bus : « Music », « SFX » et « Ambience » (réglables dans les paramètres).

const SFX_DIR := "res://assets/audio/sfx/"
const AMB_DIR := "res://assets/audio/ambience/"
const SFX := ["click", "hover", "confirm", "cancel", "coins", "applause", "curtain", "page", "error", "blip",
	"porte", "verrou", "ramasser", "decouverte", "decouverte_rare", "decouverte_legendaire", "quete", "indice",
	"bus", "cloche", "sifflet", "train", "canard", "pigeon", "voix",
	"pas_pierre", "pas_herbe", "pas_bois", "pas_tapis", "pas_beton", "pas_neige"]
const MUSIC := {
	"theme": "res://assets/audio/music/lanterne_theme.wav",
	"foyer": "res://assets/audio/music/foyer_loop.wav",
	"ville_jour": "res://assets/audio/music/ville_jour.wav",
	"ville_fetes": "res://assets/audio/music/ville_fetes.wav",
	"ville_nuit": "res://assets/audio/music/ville_nuit.wav",
	"reserve": "res://assets/audio/music/reserve.wav",
}
const MUSIC_DB := -7.0
const FADE := 1.4

var _music: Array[AudioStreamPlayer] = []
var _active := 0
var _players: Array[AudioStreamPlayer] = []
var _layers: Dictionary = {}        ## ambiance -> AudioStreamPlayer
var _layer_tweens: Dictionary = {}
var _music_tween: Tween
var _cache: Dictionary = {}
var _current_music := ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in 2:
		var m := AudioStreamPlayer.new()
		m.bus = "Music"
		m.volume_db = -60.0
		add_child(m)
		_music.append(m)
	for i in 8:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_players.append(p)


func _stream(path: String, loop: bool = false) -> AudioStream:
	var key := path + ("#loop" if loop else "")
	if not _cache.has(key):
		var s: AudioStream = load(path) if ResourceLoader.exists(path) else null
		if s is AudioStreamWAV and loop:
			var wav := (s as AudioStreamWAV).duplicate() as AudioStreamWAV
			wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
			wav.loop_begin = 0
			wav.loop_end = int(wav.get_length() * wav.mix_rate)
			s = wav
		_cache[key] = s
	return _cache[key]


func sfx_stream(id: String) -> AudioStream:
	return _stream(SFX_DIR + id + ".wav") if id in SFX else null


func play_sfx(id: String, pitch_jitter: float = 0.0, volume_db: float = 0.0) -> void:
	var stream := sfx_stream(id)
	if stream == null:
		return
	for p in _players:
		if not p.playing:
			p.stream = stream
			p.pitch_scale = 1.0 + randf_range(-pitch_jitter, pitch_jitter)
			p.volume_db = volume_db
			p.play()
			return


## Bruit de pas du joueur (surface : pierre, herbe, bois, tapis, beton, neige).
func footstep(surface: String) -> void:
	play_sfx("pas_" + surface, 0.12, -9.0)


# --- Musique ----------------------------------------------------------------------------

## Fondu enchaîné vers une musique ("" : silence progressif).
func play_music(id: String) -> void:
	if id == _current_music and (id == "" or _music[_active].playing):
		return
	var stream: AudioStream = _stream(MUSIC[id], true) if MUSIC.has(id) else null
	if id != "" and stream == null:
		return
	_current_music = id
	var old := _music[_active]
	_active = 1 - _active
	var new := _music[_active]
	if _music_tween:
		_music_tween.kill()
	_music_tween = create_tween().set_parallel(true)
	_music_tween.tween_property(old, "volume_db", -60.0, FADE)
	if stream != null:
		new.stream = stream
		new.volume_db = -40.0
		new.play()
		_music_tween.tween_property(new, "volume_db", MUSIC_DB, FADE)
	_music_tween.chain().tween_callback(func() -> void:
		if old != _music[_active]:
			old.stop())


func current_music() -> String:
	return _current_music


func stop_music() -> void:
	play_music("")


# --- Ambiances --------------------------------------------------------------------------

## Volume de chaque couche d'ambiance (0..1) ; les couches absentes s'éteignent en fondu.
func set_ambience(levels: Dictionary, fade: float = 1.2) -> void:
	for id: String in levels:
		var lvl := clampf(float(levels[id]), 0.0, 1.0)
		var p: AudioStreamPlayer = _layers.get(id)
		if p == null:
			if lvl <= 0.0:
				continue
			var stream := _stream(AMB_DIR + id + ".wav", true)
			if stream == null:
				continue
			p = AudioStreamPlayer.new()
			p.bus = "Ambience"
			p.stream = stream
			p.volume_db = -60.0
			add_child(p)
			p.play(randf() * maxf(0.0, stream.get_length() - 0.1))
			_layers[id] = p
		_fade_layer(id, p, lvl, fade)
	for id: String in _layers.keys():
		if not levels.has(id):
			_fade_layer(id, _layers[id], 0.0, fade)


func _fade_layer(id: String, p: AudioStreamPlayer, lvl: float, fade: float) -> void:
	if _layer_tweens.has(id):
		(_layer_tweens[id] as Tween).kill()
	var target := linear_to_db(maxf(lvl, 0.0001)) if lvl > 0.0 else -60.0
	var tw := create_tween()
	tw.tween_property(p, "volume_db", target, fade)
	if lvl <= 0.0:
		tw.tween_callback(func() -> void:
			p.queue_free()
			_layers.erase(id)
			_layer_tweens.erase(id))
	_layer_tweens[id] = tw


func ambience_levels() -> Dictionary:
	var out := {}
	for id: String in _layers:
		out[id] = db_to_linear((_layers[id] as AudioStreamPlayer).volume_db)
	return out


func clear_ambience() -> void:
	set_ambience({})


## Source sonore localisée en boucle (fontaine, café, fanfare…), à placer dans le monde.
func make_emitter(id: String, volume_db: float = 0.0, max_distance: float = 220.0) -> AudioStreamPlayer2D:
	var e := AudioStreamPlayer2D.new()
	e.stream = _stream(AMB_DIR + id + ".wav", true)
	e.bus = "Ambience"
	e.volume_db = volume_db
	e.max_distance = max_distance
	e.attenuation = 1.6
	e.autoplay = e.stream != null
	return e


## Son ponctuel localisé (train, canard…).
func play_at(id: String, parent: Node, pos: Vector2, volume_db: float = 0.0, max_distance: float = 320.0) -> void:
	var stream := sfx_stream(id)
	if stream == null or parent == null:
		return
	var p := AudioStreamPlayer2D.new()
	p.stream = stream
	p.bus = "SFX"
	p.position = pos
	p.volume_db = volume_db
	p.max_distance = max_distance
	p.pitch_scale = randf_range(0.95, 1.05)
	parent.add_child(p)
	p.finished.connect(p.queue_free)
	p.play()

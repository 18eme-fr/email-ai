extends Node
## Musique d'ambiance et sons d'interface (autoload « AudioDirector »).
## Les sons sont générés pour le projet (voir tools/generate_audio.py).

const SFX := {
	"click": "res://assets/audio/sfx/click.wav",
	"hover": "res://assets/audio/sfx/hover.wav",
	"confirm": "res://assets/audio/sfx/confirm.wav",
	"cancel": "res://assets/audio/sfx/cancel.wav",
	"coins": "res://assets/audio/sfx/coins.wav",
	"applause": "res://assets/audio/sfx/applause.wav",
	"curtain": "res://assets/audio/sfx/curtain.wav",
	"page": "res://assets/audio/sfx/page.wav",
	"error": "res://assets/audio/sfx/error.wav",
	"blip": "res://assets/audio/sfx/blip.wav",
}
const MUSIC := {
	"theme": "res://assets/audio/music/lanterne_theme.wav",
	"foyer": "res://assets/audio/music/foyer_loop.wav",
}

var _music: AudioStreamPlayer
var _players: Array[AudioStreamPlayer] = []
var _cache: Dictionary = {}
var _current_music := ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_music = AudioStreamPlayer.new()
	_music.bus = "Music"
	add_child(_music)
	for i in 6:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_players.append(p)


func _stream(path: String) -> AudioStream:
	if not _cache.has(path):
		_cache[path] = load(path) if ResourceLoader.exists(path) else null
	return _cache[path]


func play_sfx(id: String, pitch_jitter: float = 0.0) -> void:
	var stream := _stream(SFX.get(id, ""))
	if stream == null:
		return
	for p in _players:
		if not p.playing:
			p.stream = stream
			p.pitch_scale = 1.0 + randf_range(-pitch_jitter, pitch_jitter)
			p.play()
			return


func play_music(id: String) -> void:
	if id == _current_music and _music.playing:
		return
	var stream := _stream(MUSIC.get(id, ""))
	if stream == null:
		return
	_current_music = id
	if stream is AudioStreamWAV:
		var wav := stream as AudioStreamWAV
		wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
		wav.loop_end = int(wav.get_length() * wav.mix_rate)
	_music.stream = stream
	_music.volume_db = -6.0
	_music.play()


func stop_music() -> void:
	_music.stop()
	_current_music = ""

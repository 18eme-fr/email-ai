class_name TheatreView
extends Control
## Vue 2D du Théâtre de la Lanterne : façade (avec les affiches de la période)
## ou salle (rideau, comédiens, public). Dessinée en _draw à l'échelle exacte
## des pixels (les textures sont déjà agrandies ×2).

signal performance_finished

const DIR := "res://assets/pixel_art/theatre/"

var mode := "facade"
var posters: Array[Texture2D] = []
var audience_ratio := 0.0
var curtain_open := 0.0
var show_performers := false
var lights := 1.0  ## 1 = salle éclairée, 0.35 = noir salle

var _layout: Dictionary = {}
var _scale := 2
var _tex := {}
var _heads: Array[Texture2D] = []
var _performers: Array[Texture2D] = []
var _seat_order: Array[int] = []
var _time := 0.0


func _ready() -> void:
	custom_minimum_size = Vector2(640, 360)
	clip_contents = true
	_layout = GameData.read_json(DIR + "theatre_layout.json")
	_scale = int(_layout.get("scale", 2))
	for key in ["hall", "facade", "curtain_left", "curtain_right", "spotlight"]:
		_tex[key] = load(DIR + key + ".png")
	for i in int(_layout.get("heads", 12)):
		_heads.append(load(DIR + "head_%d.png" % i))
	for i in int(_layout.get("performers", 5)):
		_performers.append(load(DIR + "performer_%d.png" % i))
	var seats: Array = _layout.get("seats", [])
	for i in seats.size():
		_seat_order.append(i)
	# Ordre de remplissage stable : les premiers rangs d'abord, avec un peu de désordre.
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	_seat_order.sort_custom(func(a: int, b: int) -> bool:
		return float(seats[a]["row"]) + rng.randf() * 1.5 < float(seats[b]["row"]) + rng.randf() * 1.5)


func _process(delta: float) -> void:
	_time += delta
	if mode == "hall" and show_performers and not Settings.reduce_motion():
		queue_redraw()


func set_facade(poster_textures: Array[Texture2D]) -> void:
	mode = "facade"
	posters = poster_textures
	queue_redraw()


func set_hall(ratio: float, open: float, performers: bool, light_level: float = 1.0) -> void:
	mode = "hall"
	audience_ratio = clampf(ratio, 0.0, 1.0)
	curtain_open = open
	show_performers = performers
	lights = light_level
	queue_redraw()


## Représentation animée : la salle se remplit, le noir se fait, le rideau s'ouvre.
func play_performance(ratio: float) -> void:
	set_hall(0.0, 0.0, false, 1.0)
	if Settings.reduce_motion():
		set_hall(ratio, 1.0, true, 0.6)
		AudioDirector.play_sfx("applause")
		performance_finished.emit.call_deferred()
		return
	var tw := create_tween()
	tw.tween_method(func(v: float) -> void:
		audience_ratio = v
		queue_redraw(), 0.0, ratio, 1.2)
	tw.tween_method(func(v: float) -> void:
		lights = v
		queue_redraw(), 1.0, 0.55, 0.5)
	tw.tween_callback(func() -> void:
		AudioDirector.play_sfx("curtain")
		show_performers = true)
	tw.tween_method(func(v: float) -> void:
		curtain_open = v
		queue_redraw(), 0.0, 1.0, 1.1).set_trans(Tween.TRANS_SINE)
	tw.tween_interval(1.0)
	tw.tween_callback(func() -> void: AudioDirector.play_sfx("applause"))
	tw.tween_interval(0.6)
	tw.tween_callback(func() -> void: performance_finished.emit())


func _draw() -> void:
	var origin := ((size - Vector2(640, 360)) / 2.0).floor()
	if mode == "facade":
		_draw_facade(origin)
	else:
		_draw_hall(origin)


func _draw_facade(o: Vector2) -> void:
	draw_texture(_tex["facade"], o)
	var slots: Array = _layout.get("poster_slots", [])
	for i in mini(slots.size(), posters.size()):
		var s: Dictionary = slots[i]
		if posters[i]:
			draw_texture(posters[i], o + Vector2(float(s["x"]), float(s["y"])) * _scale)


func _draw_hall(o: Vector2) -> void:
	draw_texture(_tex["hall"], o)
	var st: Dictionary = _layout["stage"]
	var stage_pos := o + Vector2(float(st["x"]), float(st["y"])) * _scale
	var stage_size := Vector2(float(st["w"]), float(st["h"])) * _scale
	if show_performers:
		var floor_y := stage_pos.y + stage_size.y - 14 * _scale
		var count := 3
		for i in count:
			var tex: Texture2D = _performers[i % _performers.size()]
			var x := stage_pos.x + stage_size.x * (0.3 + 0.2 * i)
			var bob := 0.0 if Settings.reduce_motion() else roundf(sin(_time * 2.0 + i * 1.7) * 1.0) * _scale
			draw_texture(tex, Vector2(x - tex.get_width() / 2.0, floor_y - tex.get_height() + bob))
		var spot: Texture2D = _tex["spotlight"]
		draw_texture(spot, Vector2(stage_pos.x + stage_size.x * 0.5 - spot.get_width() / 2.0, stage_pos.y + 10 * _scale), Color(1, 1, 1, 0.9))
	# rideau (deux moitiés qui glissent vers les côtés)
	var left: Texture2D = _tex["curtain_left"]
	var right: Texture2D = _tex["curtain_right"]
	var travel := (left.get_width() - 8 * _scale) * curtain_open
	var lx := roundf(stage_pos.x - travel)
	var rx := roundf(stage_pos.x + stage_size.x - right.get_width() + travel)
	draw_set_transform(Vector2.ZERO)
	_draw_clipped(left, Vector2(lx, stage_pos.y), stage_pos.x, stage_pos.x + stage_size.x)
	_draw_clipped(right, Vector2(rx, stage_pos.y), stage_pos.x, stage_pos.x + stage_size.x)
	# noir salle : on assombrit tout sauf la scène
	if lights < 1.0:
		var dark := Color(0.04, 0.02, 0.07, (1.0 - lights) * 0.9)
		draw_rect(Rect2(o, Vector2(640, stage_pos.y - o.y)), dark)
		draw_rect(Rect2(Vector2(o.x, stage_pos.y), Vector2(stage_pos.x - o.x, stage_size.y)), dark)
		draw_rect(Rect2(Vector2(stage_pos.x + stage_size.x, stage_pos.y), Vector2(o.x + 640 - stage_pos.x - stage_size.x, stage_size.y)), dark)
		draw_rect(Rect2(Vector2(o.x, stage_pos.y + stage_size.y), Vector2(640, o.y + 360 - stage_pos.y - stage_size.y)), dark)
	# public (dessiné après le noir pour rester lisible, légèrement assombri)
	var seats: Array = _layout.get("seats", [])
	var n := roundi(audience_ratio * seats.size())
	var tint := Color(lights * 0.5 + 0.5, lights * 0.5 + 0.5, lights * 0.5 + 0.5)
	for k in mini(n, _seat_order.size()):
		var idx := _seat_order[k]
		var s: Dictionary = seats[idx]
		var head: Texture2D = _heads[idx % _heads.size()]
		draw_texture(head, o + Vector2(float(s["x"]), float(s["y"]) + 2) * _scale, tint)


func _draw_clipped(tex: Texture2D, pos: Vector2, min_x: float, max_x: float) -> void:
	var x0 := maxf(pos.x, min_x)
	var x1 := minf(pos.x + tex.get_width(), max_x)
	if x1 <= x0:
		return
	var src := Rect2(x0 - pos.x, 0, x1 - x0, tex.get_height())
	draw_texture_rect_region(tex, Rect2(Vector2(x0, pos.y), src.size), src)

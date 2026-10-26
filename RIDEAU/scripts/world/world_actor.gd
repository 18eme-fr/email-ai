class_name WorldActor
extends Node2D
## Personnage du monde explorable : déplacement case par case, animation de
## marche (3 images × 4 directions), bulle et flèche au-dessus de la tête.
## La position du nœud est celle des pieds (bas de la case), pour le tri en profondeur.

signal step_finished

const T := 16
const PEOPLE_DIR := "res://assets/world/people/"
const FX_DIR := "res://assets/world/fx/"
const DIR_ROWS := {"down": 0, "up": 1, "left": 2, "right": 3}

var person_id := ""
var cell := Vector2i.ZERO
var facing := "down"
var moving := false
var step_time := 0.18
var home := Vector2i.ZERO
var bubble := ""            ## bulle affichée ("" si aucune)
var radius := 0
var wander_wait := 0.0

var _sprite: Sprite2D
var _bubble: Sprite2D
var _arrow: Sprite2D
var _stride := false
var _time := 0.0


static func cell_to_pos(c: Vector2i) -> Vector2:
	return Vector2(c.x * T + T / 2.0, c.y * T + T)


static func dir_name(d: Vector2i) -> String:
	if d.x > 0:
		return "right"
	if d.x < 0:
		return "left"
	if d.y < 0:
		return "up"
	return "down"


static func opposite(dir: String) -> String:
	return {"up": "down", "down": "up", "left": "right", "right": "left"}.get(dir, "down")


func setup(id: String, sprite_id: String, start: Vector2i, dir: String = "down") -> WorldActor:
	person_id = id
	name = id
	home = start
	var shadow := Sprite2D.new()
	shadow.texture = load(FX_DIR + "shadow.png")
	shadow.position = Vector2(0, -2)
	add_child(shadow)
	_sprite = Sprite2D.new()
	_sprite.texture = load(PEOPLE_DIR + sprite_id + ".png")
	_sprite.hframes = 3
	_sprite.vframes = 4
	_sprite.centered = false
	_sprite.position = Vector2(-8, -24)
	add_child(_sprite)
	_bubble = Sprite2D.new()
	_bubble.position = Vector2(0, -31)
	_bubble.visible = false
	add_child(_bubble)
	_arrow = Sprite2D.new()
	_arrow.texture = load(FX_DIR + "arrow.png")
	_arrow.position = Vector2(0, -30)
	_arrow.visible = false
	add_child(_arrow)
	place(start)
	face(dir)
	return self


func place(c: Vector2i) -> void:
	cell = c
	position = cell_to_pos(c)


func face(dir: String) -> void:
	facing = dir
	_sprite.frame = DIR_ROWS.get(dir, 0) * 3


func face_toward(other: Vector2i) -> void:
	if other != cell:
		face(dir_name(other - cell))


## Avance d'une case (voisine). Le signal step_finished est émis à l'arrivée.
func step_to(c: Vector2i) -> void:
	face(dir_name(c - cell))
	cell = c
	moving = true
	_stride = not _stride
	var row: int = DIR_ROWS[facing] * 3
	_sprite.frame = row + (1 if _stride else 2)
	var tw := create_tween()
	tw.tween_property(self, "position", cell_to_pos(c), step_time)
	tw.parallel().tween_callback(func() -> void: _sprite.frame = row).set_delay(step_time * 0.6)
	tw.tween_callback(func() -> void:
		moving = false
		step_finished.emit())


func set_bubble(kind: String) -> void:
	bubble = kind
	if kind == "":
		_bubble.visible = false
		return
	var path := FX_DIR + "bubble_%s.png" % kind
	_bubble.texture = load(path) if ResourceLoader.exists(path) else null
	_bubble.visible = _bubble.texture != null


func set_arrow(on: bool) -> void:
	_arrow.visible = on


func _process(delta: float) -> void:
	_time += delta
	var bob := sin(_time * 5.0) * 1.5
	_bubble.position.y = -31 + bob
	_arrow.position.y = -30 + bob - (10 if _bubble.visible else 0)

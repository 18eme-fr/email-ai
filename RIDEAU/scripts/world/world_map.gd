class_name WorldMap
extends RefCounted
## Une carte du monde explorable : grille de cases, collisions, portes et objets.
## Indépendante de l'affichage (testable sans nœud).

const DIRS := {
	"up": Vector2i(0, -1), "down": Vector2i(0, 1), "left": Vector2i(-1, 0), "right": Vector2i(1, 0),
}

var id := ""
var name := ""
var outdoor := false
var size := Vector2i.ZERO
var rows: PackedStringArray = []
var legend: Dictionary = {}
var doors: Array = []        ## [{cell: Vector2i, to, to_cell: Vector2i, facing}]
var spots: Array = []        ## [{id, cells: [Vector2i], label, kind, ...}]
var npcs: Array = []         ## [{id, cell: Vector2i, radius}]
var performance: Dictionary = {}

var _astar: AStarGrid2D


static func from_data(world: Dictionary, map_id: String) -> WorldMap:
	var raw: Dictionary = world.get("maps", {}).get(map_id, {})
	if raw.is_empty():
		return null
	var m := WorldMap.new()
	m.id = map_id
	m.name = str(raw.get("name", map_id))
	m.outdoor = bool(raw.get("outdoor", false))
	m.legend = world.get("legend", {})
	for line: String in raw["grid"]:
		m.rows.append(line)
	m.size = Vector2i(m.rows[0].length() if not m.rows.is_empty() else 0, m.rows.size())
	for d: Dictionary in raw.get("doors", []):
		var door := d.duplicate()
		door["cell"] = to_cell(d["cell"])
		door["to_cell"] = to_cell(d["to_cell"])
		m.doors.append(door)
	for sp: Dictionary in raw.get("spots", []):
		var spot := sp.duplicate()
		var cells: Array[Vector2i] = []
		for c: Array in sp["cells"]:
			cells.append(to_cell(c))
		spot["cells"] = cells
		m.spots.append(spot)
	for n: Dictionary in raw.get("npcs", []):
		m.npcs.append({"id": str(n["id"]), "cell": to_cell(n["cell"]), "radius": int(n.get("radius", 0))})
	m.performance = raw.get("performance", {})
	return m


static func to_cell(a: Variant) -> Vector2i:
	if a is Vector2i:
		return a
	return Vector2i(int(a[0]), int(a[1]))


func in_bounds(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < size.x and cell.y < size.y


func char_at(cell: Vector2i) -> String:
	if not in_bounds(cell):
		return " "
	return rows[cell.y][cell.x]


func is_walkable(cell: Vector2i) -> bool:
	return bool(legend.get(char_at(cell), {}).get("walk", false))


func door_at(cell: Vector2i) -> Dictionary:
	for d: Dictionary in doors:
		if d["cell"] == cell:
			return d
	return {}


func spot_at(cell: Vector2i) -> Dictionary:
	for sp: Dictionary in spots:
		if cell in sp["cells"]:
			return sp
	return {}


func spot(spot_id: String) -> Dictionary:
	for sp: Dictionary in spots:
		if sp["id"] == spot_id:
			return sp
	return {}


## Case où se placer pour utiliser un objet (première case praticable devant lui).
func approach_cell(spot_id: String) -> Vector2i:
	var sp := spot(spot_id)
	for c: Vector2i in sp.get("cells", []):
		for dir: Vector2i in [Vector2i(0, 1), Vector2i(0, -1), Vector2i(-1, 0), Vector2i(1, 0)]:
			if is_walkable(c + dir) and door_at(c + dir).is_empty():
				return c + dir
	return Vector2i(-1, -1)


## Chemin case par case (sans la case de départ). Les cases de `blocked`
## (personnages) sont évitées, sauf la destination elle-même.
func find_path(from: Vector2i, to: Vector2i, blocked: Array = []) -> Array[Vector2i]:
	var out: Array[Vector2i] = []
	if not in_bounds(from) or not in_bounds(to) or from == to:
		return out
	var grid := _grid()
	for c: Vector2i in blocked:
		if c != to and c != from and in_bounds(c):
			grid.set_point_solid(c, true)
	var to_solid := grid.is_point_solid(to)
	if to_solid:
		grid.set_point_solid(to, false)
	var path := grid.get_id_path(from, to)
	for c: Vector2i in blocked:
		if in_bounds(c):
			grid.set_point_solid(c, not is_walkable(c))
	if to_solid:
		grid.set_point_solid(to, true)
	for i in range(1, path.size()):
		out.append(path[i])
	# Destination non praticable (un objet) : on s'arrête devant.
	if to_solid and not out.is_empty():
		out.pop_back()
	return out


func _grid() -> AStarGrid2D:
	if _astar == null:
		_astar = AStarGrid2D.new()
		_astar.region = Rect2i(Vector2i.ZERO, size)
		_astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
		_astar.default_compute_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
		_astar.update()
		for y in size.y:
			for x in size.x:
				_astar.set_point_solid(Vector2i(x, y), not is_walkable(Vector2i(x, y)))
	return _astar

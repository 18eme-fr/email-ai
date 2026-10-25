class_name LineChart
extends Control
## Petit graphique en courbe, dessiné nativement (pas besoin d'extension pour si peu).

var series: Array[float] = []
var title := ""
var color := Color("f0d48a")
var zero_line := true
var labels_from := 0  ## numéro de la première période affichée


func _draw() -> void:
	var font := get_theme_default_font()
	var r := Rect2(Vector2(56, 22), size - Vector2(70, 40))
	draw_rect(Rect2(Vector2.ZERO, size), Color("160f1e"))
	draw_string(font, Vector2(8, 16), title, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("c9a24b"))
	if series.size() < 2:
		return
	var lo: float = series.min()
	var hi: float = series.max()
	if zero_line:
		lo = minf(lo, 0.0)
		hi = maxf(hi, 0.0)
	if is_equal_approx(lo, hi):
		hi = lo + 1.0
	var to_point := func(i: int, v: float) -> Vector2:
		return Vector2(r.position.x + r.size.x * i / float(series.size() - 1), r.position.y + r.size.y * (1.0 - (v - lo) / (hi - lo)))
	for k in 3:
		var v := lerpf(lo, hi, k / 2.0)
		var y: float = to_point.call(0, v).y
		draw_line(Vector2(r.position.x, y), Vector2(r.end.x, y), Color(1, 1, 1, 0.08), 1.0)
		draw_string(font, Vector2(2, y + 5), Format.thousands(roundi(v)), HORIZONTAL_ALIGNMENT_LEFT, 52, 12, Color("b9b0c8"))
	if zero_line and lo < 0.0:
		var zy: float = to_point.call(0, 0.0).y
		draw_line(Vector2(r.position.x, zy), Vector2(r.end.x, zy), Color("f08a8a", 0.6), 2.0)
	var pts := PackedVector2Array()
	for i in series.size():
		pts.append(to_point.call(i, series[i]))
	draw_polyline(pts, color, 3.0)
	for i in pts.size():
		draw_rect(Rect2(pts[i] - Vector2(3, 3), Vector2(6, 6)), color if series[i] >= 0.0 else Color("f08a8a"))
		draw_string(font, Vector2(pts[i].x - 8, r.end.y + 16), str(labels_from + i), HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color("b9b0c8"))

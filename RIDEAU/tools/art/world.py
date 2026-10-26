"""Monde explorable de RIDEAU ! : cartes en vue de dessus (façon jeux de rôle
16 bits), saisons, décors des rénovations et personnages animés.

Les cartes sont dessinées à partir des grilles de data/world/world.json : la
même source sert aux collisions dans le jeu et au dessin ici.

Sorties (assets/world/) :
  maps/<carte>_<variante>_base.png   sol, murs et mobilier
  maps/<carte>_<variante>_top.png    ce qui passe devant les personnages
  maps/<carte>_lights.png            lumières de nuit (fusion additive)
  maps/<carte>_upgrade_<id>.png      décor ajouté par une rénovation
  maps/<carte>_festive.png           décorations des fêtes
  people/<sprite>.png                3 images × 4 directions (16×24)
  fx/*.png                           particules, bulles, marqueurs
  meta.json                          emplacements des affiches
"""
import json
import math
import os

from pixel import P, Canvas, mix, shade, rng, hex2rgb
from theatre import FONT5, text, text_width

# Lettres manquantes de la petite police de theatre.py (enseignes de la place).
FONT5.update({
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
})

T = 16
SEASONS = ["automne", "hiver", "printemps", "ete"]

GRASS = {
    "automne": [(118, 128, 64), (98, 110, 54), (140, 140, 70)],
    "hiver": [(226, 232, 240), (206, 214, 228), (244, 246, 250)],
    "printemps": [(110, 170, 90), (88, 146, 76), (132, 188, 104)],
    "ete": [(92, 150, 70), (74, 128, 60), (116, 168, 82)],
}
FOLIAGE = {
    "automne": [(176, 96, 40), (214, 132, 52), (232, 176, 70), (140, 70, 36)],
    "hiver": [(120, 104, 92), (150, 136, 124), (236, 240, 246), (90, 78, 70)],
    "printemps": [(110, 170, 90), (150, 200, 110), (240, 190, 210), (80, 130, 70)],
    "ete": [(60, 120, 56), (84, 150, 70), (120, 180, 90), (40, 92, 46)],
}


def load_world(root):
    with open(os.path.join(root, "data", "world", "world.json"), encoding="utf-8") as f:
        return json.load(f)


# --- Outils --------------------------------------------------------------------

def noise_tile(c, x0, y0, base, dots, seed, n=6):
    r = rng(seed)
    c.rect(x0, y0, T, T, base)
    for _ in range(n):
        c.set(x0 + r.randrange(T), y0 + r.randrange(T), dots[r.randrange(len(dots))])


def cell_seed(x, y, salt=0):
    return (x * 73856093) ^ (y * 19349663) ^ salt


def outlined(w, h, draw):
    """Dessine un objet sur sa propre toile, ajoute un contour, renvoie la toile."""
    o = Canvas(w, h)
    draw(o)
    o.outline(P["ink"])
    return o


# --- Sols intérieurs -----------------------------------------------------------

def floor_marble(c, x0, y0, gx, gy):
    a, b = P["paper"], P["paper2"]
    for yy in range(2):
        for xx in range(2):
            col = a if (gx * 2 + xx + gy * 2 + yy) % 2 == 0 else b
            c.rect(x0 + xx * 8, y0 + yy * 8, 8, 8, col)
            c.hline(x0 + xx * 8, x0 + xx * 8 + 7, y0 + yy * 8, shade(col, 1.08))
    c.set(x0 + 8, y0 + 8, P["gold2"])


def floor_carpet(c, x0, y0, gx, gy, left_edge, right_edge):
    c.rect(x0, y0, T, T, P["velvet2"])
    r = rng(cell_seed(gx, gy, 7))
    for _ in range(5):
        c.set(x0 + r.randrange(T), y0 + r.randrange(T), P["velvet1"])
    for yy in range(0, T, 4):
        c.set(x0 + 8, y0 + yy + (gy % 2) * 2, P["velvet3"])
    if left_edge:
        c.vline(x0, y0, y0 + T - 1, P["gold1"])
        c.vline(x0 + 1, y0, y0 + T - 1, P["gold2"])
    if right_edge:
        c.vline(x0 + T - 1, y0, y0 + T - 1, P["gold1"])
        c.vline(x0 + T - 2, y0, y0 + T - 1, P["gold2"])


def floor_planks(c, x0, y0, gx, gy, light=False):
    base = P["wood3"] if light else P["wood2"]
    dark = shade(base, 0.8)
    c.rect(x0, y0, T, T, base)
    for yy in range(0, T, 4):
        c.hline(x0, x0 + T - 1, y0 + yy, dark)
        off = ((gy * 4 + yy // 4) * 7 + gx * 5) % 16
        c.set(x0 + off, y0 + yy + 1, dark)
        c.set(x0 + (off + 9) % 16, y0 + yy + 2, shade(base, 1.1))


def floor_parquet(c, x0, y0, gx, gy):
    a, b = P["wood3"], P["wood2"]
    for i in range(4):
        for j in range(4):
            col = a if (i + j + gx + gy) % 2 == 0 else b
            c.rect(x0 + i * 4, y0 + j * 4, 4, 4, col)
            if (i + j) % 2 == 0:
                c.hline(x0 + i * 4, x0 + i * 4 + 3, y0 + j * 4 + 1, shade(col, 0.9))
            else:
                c.vline(x0 + i * 4 + 1, y0 + j * 4, y0 + j * 4 + 3, shade(col, 0.9))


def floor_concrete(c, x0, y0, gx, gy):
    noise_tile(c, x0, y0, P["grey1"], [P["grey0"], P["grey2"]], cell_seed(gx, gy, 3), 7)
    r = rng(cell_seed(gx, gy, 11))
    if r.random() < 0.18:
        col = [P["velvet3"], P["blue"], P["gold2"], P["teal"]][r.randrange(4)]
        c.ellipse(x0 + 4 + r.randrange(8), y0 + 4 + r.randrange(8), 2, 1.5, col)


def floor_salle(c, x0, y0, gx, gy):
    c.rect(x0, y0, T, T, P["velvet0"])
    r = rng(cell_seed(gx, gy, 5))
    for _ in range(6):
        c.set(x0 + r.randrange(T), y0 + r.randrange(T), P["velvet1"])


# --- Murs intérieurs -----------------------------------------------------------

WALLS = {
    "hall": {"paper": P["velvet1"], "pattern": P["velvet2"], "wainscot": P["wood1"], "trim": P["gold2"]},
    "salle": {"paper": P["night2"], "pattern": P["night"], "wainscot": P["velvet0"], "trim": P["gold1"]},
    "coulisses": {"paper": P["grey1"], "pattern": P["grey0"], "wainscot": P["grey0"], "trim": P["grey2"], "brick": True},
    "bureau": {"paper": P["green0"], "pattern": P["green1"], "wainscot": P["wood1"], "trim": P["wood3"]},
    "reserve": {"paper": P["wood1"], "pattern": P["wood0"], "wainscot": P["wood0"], "trim": P["wood2"], "brick": True},
}


def wall_cap(c, x0, y0):
    c.rect(x0, y0, T, T, P["wood0"])
    c.hline(x0, x0 + T - 1, y0 + T - 1, P["ink"])
    c.rect(x0 + 1, y0 + 1, T - 2, T - 3, P["night"])


def wall_face(c, x0, y0, gx, style):
    s = WALLS[style]
    c.rect(x0, y0, T, T, s["paper"])
    if s.get("brick"):
        for yy in range(0, 11, 3):
            c.hline(x0, x0 + T - 1, y0 + yy, s["pattern"])
            off = 0 if (yy // 3) % 2 == 0 else 4
            for xx in range(off, T, 8):
                c.vline(x0 + xx, y0 + yy, y0 + yy + 2, s["pattern"])
    else:
        for yy in (2, 7):
            for xx in (3, 11):
                c.set(x0 + xx, y0 + yy, s["pattern"])
                c.set(x0 + xx - 1, y0 + yy + 1, s["pattern"])
                c.set(x0 + xx + 1, y0 + yy + 1, s["pattern"])
                c.set(x0 + xx, y0 + yy + 2, s["pattern"])
    c.rect(x0, y0 + 11, T, 5, s["wainscot"])
    c.hline(x0, x0 + T - 1, y0 + 11, s["trim"])
    c.hline(x0, x0 + T - 1, y0 + 15, P["ink"])


# --- Mobilier --------------------------------------------------------------------

def draw_counter(c, x0, y0, w, bar=False):
    """Comptoir en bois vu de dessus (plateau + façade)."""
    def d(o):
        o.rect(0, 2, w, 14, P["wood2"])
        o.rect(0, 2, w, 5, P["wood3"])
        o.hline(0, w - 1, 2, P["wood4"])
        o.hline(0, w - 1, 7, P["wood1"])
        for xx in range(4, w, 12):
            o.rect(xx, 9, 8, 5, P["wood1"])
            o.frame(xx, 9, 8, 5, P["gold1"])
    c.paste(outlined(w, 16, d), x0, y0)


def draw_plant(base, top, x0, y0):
    """Plante en pot : le pot sur la base, le feuillage déborde vers le haut."""
    pot = outlined(12, 8, lambda o: (o.rect(1, 0, 10, 8, P["orange"]), o.rect(1, 0, 10, 2, shade(P["orange"], 1.2)),
                                     o.hline(1, 10, 7, shade(P["orange"], 0.7))))
    base.paste(pot, x0 + 2, y0 + 8)

    def leaves(o):
        for (cx, cy, rx, ry, col) in [(8, 10, 6, 5, P["green0"]), (5, 8, 4, 4, P["green1"]), (11, 7, 4, 4, P["green1"]),
                                      (8, 5, 4, 4, P["green2"]), (6, 6, 2, 2, (170, 205, 130))]:
            o.ellipse(cx, cy, rx, ry, col)
    lv = outlined(16, 16, leaves)
    top.paste(lv, x0, y0 - 6)


def draw_bench(c, x0, y0, w=16, velvet=False):
    seat = P["velvet3"] if velvet else P["wood3"]

    def d(o):
        o.rect(0, 2, w, 5, shade(seat, 0.8))
        o.rect(0, 2, w, 2, seat)
        o.rect(0, 7, w, 4, seat)
        o.hline(0, w - 1, 7, shade(seat, 1.2))
        o.rect(1, 11, 2, 3, P["wood0"])
        o.rect(w - 3, 11, 2, 3, P["wood0"])
    c.paste(outlined(w, 15, d), x0, y0 + 1)


def draw_sign(c, x0, y0, txt_color=P["ink"]):
    def d(o):
        o.rect(7, 8, 2, 8, P["wood1"])
        o.rect(1, 1, 14, 9, P["gold3"])
        o.rect(1, 1, 14, 2, P["orange"])
        for i in range(1, 15, 3):
            o.set(i, 1, P["ink"])
        o.hline(3, 12, 5, P["paper3"])
        o.hline(3, 10, 7, P["paper3"])
    c.paste(outlined(16, 16, d), x0, y0)


def draw_seat_row(c, x0, y0, n):
    for i in range(n):
        x = x0 + i * T

        def d(o):
            o.rect(1, 2, 14, 7, P["velvet3"])
            o.rect(2, 3, 12, 2, P["velvet4"])
            o.rect(1, 9, 14, 5, P["velvet2"])
            o.rect(0, 4, 1, 10, P["wood1"])
            o.rect(15, 4, 1, 10, P["wood1"])
        c.paste(outlined(16, 16, d), x, y0)


def draw_desk(c, x0, y0, w, items=()):
    def d(o):
        o.rect(0, 0, w, 12, P["wood3"])
        o.hline(0, w - 1, 0, P["wood4"])
        o.rect(0, 12, w, 4, P["wood1"])
        o.rect(2, 13, 4, 3, P["wood0"])
        o.rect(w - 6, 13, 4, 3, P["wood0"])
        for kind, ix in items:
            if kind == "paper":
                o.rect(ix, 3, 7, 6, P["cream"])
                o.hline(ix + 1, ix + 5, 5, P["paper3"])
                o.hline(ix + 1, ix + 4, 7, P["paper3"])
            elif kind == "book":
                o.rect(ix, 2, 10, 8, P["velvet3"])
                o.rect(ix + 1, 3, 8, 6, P["cream"])
                o.vline(ix + 5, 3, 8, P["velvet3"])
                o.hline(ix + 2, ix + 4, 5, P["paper3"])
                o.hline(ix + 6, ix + 8, 5, P["paper3"])
            elif kind == "lamp":
                o.ellipse(ix + 3, 4, 3, 2, P["gold2"])
                o.rect(ix + 2, 5, 2, 4, P["gold1"])
            elif kind == "computer":
                o.rect(ix, 0, 12, 8, P["grey0"])
                o.rect(ix + 1, 1, 10, 6, P["teal"])
                o.hline(ix + 2, ix + 8, 3, P["cream"])
                o.rect(ix + 2, 9, 8, 2, P["grey2"])
            elif kind == "mug":
                o.rect(ix, 4, 3, 3, P["cream"])
                o.set(ix + 3, 5, P["cream"])
    c.paste(outlined(w, 16, d), x0, y0)


def draw_showcase(base, top, x0, y0, n):
    """Vitrine d'exposition de la collection : socle de bois, verre, plateau (objets posés par le jeu)."""
    w = n * T

    def d(o):
        o.rect(0, 9, w, 7, P["wood2"])
        o.hline(0, w - 1, 9, P["wood3"])
        o.rect(1, 0, w - 2, 9, (200, 220, 235))
        o.hline(1, w - 2, 7, P["paper2"])
        for xx in range(T, w, T):
            o.vline(xx, 0, 8, P["gold2"])
        o.set(3, 1, P["white"])
        o.set(4, 2, P["white"])
    base.paste(outlined(w, 16, d), x0, y0)


def draw_old_projector(base, x0, y0):
    def d(o):
        o.rect(3, 3, 20, 9, P["navy"])
        o.ellipse(25, 7, 4, 4, P["grey2"])
        o.line(23, 4, 28, 10, P["ink"])
        o.rect(10, 12, 3, 4, P["grey1"])
        o.rect(5, 0, 10, 3, P["grey1"])
    base.paste(outlined(32, 16, d), x0, y0)


def draw_bookshelf(base, x0, y0, w):
    def d(o):
        o.rect(0, 0, w, 26, P["wood1"])
        o.rect(1, 1, w - 2, 24, P["wood0"])
        r = rng(w)
        for shelf in range(3):
            sy = 2 + shelf * 8
            x = 2
            while x < w - 3:
                bw = 2 + r.randrange(2)
                col = [P["velvet3"], P["blue"], P["green1"], P["gold2"], P["purple1"], P["paper2"]][r.randrange(6)]
                bh = 5 + r.randrange(2)
                o.rect(x, sy + 7 - bh, bw, bh, col)
                x += bw + (1 if r.random() < 0.3 else 0)
            o.hline(1, w - 2, sy + 7, P["wood2"])
    base.paste(outlined(w, 26, d), x0, y0 - 10)


def draw_cabinet(base, x0, y0, w):
    def d(o):
        o.rect(0, 0, w, 24, P["grey2"])
        for i in range(3):
            o.rect(1, 1 + i * 8, w - 2, 7, P["grey3"])
            o.rect(w // 2 - 2, 3 + i * 8, 4, 1, P["grey0"])
    base.paste(outlined(w, 24, d), x0, y0 - 8)


def draw_makeup(base, x0, y0, w):
    def d(o):
        o.rect(0, 10, w, 6, P["wood2"])
        o.hline(0, w - 1, 10, P["wood3"])
        for i in range(0, w - 8, 16):
            o.rect(i + 2, 0, 12, 10, P["grey3"])
            o.rect(i + 3, 1, 10, 8, P["sky"])
            for k in range(0, 12, 3):
                o.set(i + 2 + k, 0, P["light"])
            o.set(i + 4, 12, P["velvet3"])
            o.set(i + 8, 12, P["gold3"])
    base.paste(outlined(w, 16, d), x0, y0)


def draw_workbench(base, x0, y0, w):
    def d(o):
        o.rect(0, 2, w, 10, P["wood3"])
        o.hline(0, w - 1, 2, P["wood4"])
        o.rect(0, 12, w, 4, P["wood1"])
        o.rect(4, 4, 8, 2, P["grey2"])   # scie
        o.rect(16, 5, 3, 5, P["velvet3"])  # pot de peinture
        o.rect(22, 4, 6, 3, P["gold2"])
        o.rect(34, 5, 10, 4, P["paper"])
        o.line(34, 5, 43, 8, P["paper3"])
        o.rect(50, 4, 6, 4, P["grey1"])
    base.paste(outlined(w, 16, d), x0, y0)


def draw_crate(base, x0, y0):
    def d(o):
        o.rect(1, 2, 14, 13, P["wood3"])
        o.frame(1, 2, 14, 13, P["wood1"])
        o.line(1, 2, 14, 14, P["wood1"])
        o.hline(1, 14, 4, P["wood4"])
    base.paste(outlined(16, 16, d), x0, y0)


def draw_rack(base, top, x0, y0, w):
    def d(o):
        o.rect(0, 2, 1, 20, P["grey2"])
        o.rect(w - 1, 2, 1, 20, P["grey2"])
        o.hline(0, w - 1, 2, P["grey3"])
        cols = [P["velvet3"], P["purple1"], P["gold2"], P["blue"], P["green1"]]
        for i, x in enumerate(range(2, w - 3, 5)):
            o.rect(x, 3, 4, 14, cols[i % len(cols)])
            o.hline(x, x + 3, 3, shade(cols[i % len(cols)], 1.3))
    o = outlined(w, 24, d)
    base.paste(o, x0, y0 - 8)


def draw_console(base, x0, y0, w):
    def d(o):
        o.rect(0, 2, w, 12, P["grey0"])
        o.rect(1, 3, w - 2, 6, P["night2"])
        r = rng(3)
        for x in range(2, w - 2, 3):
            o.rect(x, 4 + r.randrange(3), 1, 2, P["grey3"])
            o.set(x + 1, 4, [P["velvet4"], P["teal"], P["gold3"]][r.randrange(3)])
        o.rect(4, 0, 10, 3, P["grey1"])
        o.rect(5, 0, 8, 2, P["teal"])
        o.rect(w - 14, 0, 10, 3, P["grey1"])
        o.rect(w - 13, 0, 8, 2, P["sky"])
    base.paste(outlined(w, 16, d), x0, y0)


def double_door(c, x0, y0, wood=P["wood2"], h=16):
    c.rect(x0, y0, 32, h, P["ink"])
    for i in range(2):
        x = x0 + 1 + i * 15
        c.rect(x, y0 + 1, 15, h - 1, wood)
        c.frame(x + 2, y0 + 3, 11, h - 6, shade(wood, 0.8))
        c.set(x + (13 if i == 0 else 1), y0 + h // 2, P["gold3"])


# --- Cartes intérieures ----------------------------------------------------------

def interior(world, map_id):
    m = world["maps"][map_id]
    g = m["grid"]
    W, H = len(g[0]), len(g)
    base = Canvas(W * T, H * T, P["ink"])
    top = Canvas(W * T, H * T)
    style = map_id

    def ch(x, y):
        if 0 <= y < H and 0 <= x < W:
            return g[y][x]
        return " "

    # Sols
    for y in range(H):
        for x in range(W):
            k = ch(x, y)
            x0, y0 = x * T, y * T
            if k in "#":
                continue
            if map_id == "hall":
                if k == ",":
                    floor_carpet(base, x0, y0, x, y, ch(x - 1, y) != ",", ch(x + 1, y) != ",")
                else:
                    floor_marble(base, x0, y0, x, y)
            elif map_id == "salle":
                if k in "pCr":
                    floor_planks(base, x0, y0, x, y, light=True)
                elif k == "e":
                    pass
                else:
                    floor_salle(base, x0, y0, x, y)
            elif map_id in ("coulisses", "reserve"):
                floor_concrete(base, x0, y0, x, y)
            elif map_id == "bureau":
                floor_parquet(base, x0, y0, x, y)
    # Murs : rangée de chapeau (y=0) + façade (y=1) en haut ; chapeaux ailleurs.
    for y in range(H):
        for x in range(W):
            if ch(x, y) != "#" and not (ch(x, y) in "DS" and (x == 0 or x == W - 1 or y == H - 1 or y == 1)):
                continue
            x0, y0 = x * T, y * T
            if y == 1 and ch(x, 2) not in "#":
                wall_face(base, x0, y0, x, style)
            elif ch(x, y) == "#" and y >= 2 and ch(x, y + 1) in ".,p" and 0 < x < W - 1 and y < H - 1:
                wall_face(base, x0, y0, x, style)
            elif ch(x, y) == "#":
                wall_cap(base, x0, y0)
    # Portes
    for d in m["doors"]:
        x, y = d["cell"]
        x0, y0 = x * T, y * T
        if y == 1:
            if ch(x + 1, y) == "D" and ch(x - 1, y) != "D":
                double_door(base, x0, y0, P["wood2"] if map_id != "salle" else P["velvet2"])
                base.rect(x0 + 2, y0 - 6, 28, 6, P["gold2"])
                base.frame(x0 + 2, y0 - 6, 28, 6, P["gold0"])
            elif ch(x + 1, y) != "D" and ch(x - 1, y) != "D":
                base.rect(x0 + 2, y0 - 4, 12, 20, P["wood1"])
                base.rect(x0 + 3, y0 - 3, 10, 19, P["wood2"])
                base.set(x0 + 11, y0 + 6, P["gold3"])
        elif y == H - 1:
            base.rect(x0, y0, T, T, P["wood1"])
            base.rect(x0, y0, T, 4, P["light"])
            base.rect(x0, y0 + 4, T, 12, (70, 60, 50))
            base.dither_rect(x0, y0 + 4, T, 12, P["paper3"], 0.3)
        elif x == 0 or x == W - 1:
            base.rect(x0, y0 - 8, T, 24, P["ink"])
            base.rect(x0 + (3 if x == 0 else 2), y0 - 6, 11, 22, P["wood2"])
            base.frame(x0 + (3 if x == 0 else 2), y0 - 6, 11, 22, P["wood0"])
            base.set(x0 + (12 if x == 0 else 4), y0 + 4, P["gold3"])
        if ch(x, y) == "S":
            for i in range(4):
                base.rect(x0 + i * 4, y0, 4, T, shade(P["wood3"], 1 - i * 0.12))
                base.vline(x0 + i * 4, y0, y0 + T - 1, P["wood0"])

    if map_id == "hall":
        # Guichet de billetterie et bar (fermé tant que le foyer n'est pas rénové)
        draw_counter(base, 2 * T, 3 * T - 2, 5 * T)
        base.rect(2 * T + 4, 1 * T + 1, 44, 9, P["gold2"])
        base.frame(2 * T + 4, 1 * T + 1, 44, 9, P["gold0"])
        text(base, 2 * T + 26 - text_width("BILLETS") // 2, 1 * T + 2, "BILLETS", P["velvet1"])
        draw_counter(base, 15 * T, 3 * T - 2, 5 * T)
        for i in range(5):
            base.rect(15 * T + 4 + i * 15, 3 * T + 1, 10, 5, P["paper2"])  # draps sur le bar fermé
            base.dither_rect(15 * T + 4 + i * 15, 3 * T + 1, 10, 5, P["paper3"], 0.3)
        for (x, y) in [(1, 2), (20, 2), (1, 12), (20, 12)]:
            draw_plant(base, top, x * T, y * T)
        for vx in (3, 17):
            draw_showcase(base, top, vx * T, 9 * T, 3)
        draw_sign(base, 7 * T, 12 * T)
        # Cadres d'affiches au mur (remplis dans le jeu)
        for fx in (5 * T + 6, 15 * T + 4):
            base.rect(fx - 2, T - 10, 44, 24, P["gold1"])
            base.rect(fx, T - 8, 40, 20, P["ink"])
    elif map_id == "salle":
        # Bord de scène (façade du plateau)
        for x in range(1, W - 1):
            k = ch(x, 7)
            x0, y0 = x * T, 7 * T
            if k == "e":
                base.rect(x0, y0, T, T, P["wood1"])
                base.hline(x0, x0 + T - 1, y0, P["wood3"])
                base.hline(x0, x0 + T - 1, y0 + T - 1, P["ink"])
                if x % 2 == 0:
                    base.rect(x0 + 6, y0 + 2, 4, 2, P["gold3"])
            elif k == "r":
                for i in range(3):
                    base.rect(x0, y0 + i * 5, T, 5, shade(P["wood3"], 1 - i * 0.15))
                    base.hline(x0, x0 + T - 1, y0 + i * 5, P["wood4"])
        # Pendrillons et lambrequin
        for (x, y) in [(2, 2), (2, 3), (2, 5), (2, 6), (19, 2), (19, 3), (19, 4), (19, 5), (19, 6)]:
            x0, y0 = x * T, y * T
            for xx in range(T):
                col = [P["velvet1"], P["velvet2"], P["velvet3"], P["velvet2"]][(xx // 2) % 4]
                base.vline(x0 + xx, y0, y0 + T - 1, col)
        for x in range(1, W - 1):
            x0 = x * T
            for xx in range(T):
                col = [P["velvet2"], P["velvet3"], P["velvet4"], P["velvet3"]][((x0 + xx) // 3) % 4]
                base.vline(x0 + xx, T, T + 9, col)
            base.hline(x0, x0 + T - 1, T + 10, P["gold2"])
            for xx in range(0, T, 2):
                base.set(x0 + xx, T + 11, P["gold1"])
        # Rampe de projecteurs (anciens halogènes)
        for sx in (5, 14):
            base.rect(sx * T, T + 12, 3 * T, 2, P["grey0"])
            for i in range(4):
                px = sx * T + 4 + i * 11
                base.rect(px, T + 13, 6, 6, P["grey1"])
                base.rect(px + 1, T + 18, 4, 1, (255, 200, 120))
        for y in (9, 11, 13):
            draw_seat_row(base, 3 * T, y * T, 7)
            draw_seat_row(base, 12 * T, y * T, 7)
        draw_console(base, 15 * T, 14 * T, 4 * T)
    elif map_id == "coulisses":
        draw_makeup(base, 2 * T, 2 * T, 5 * T)
        draw_workbench(base, 10 * T, 2 * T, 4 * T)
        draw_rack(base, top, 2 * T, 8 * T, 2 * T)
        for (x, y) in [(14, 8), (15, 8), (15, 9)]:
            draw_crate(base, x * T, y * T)
        draw_plant(base, top, 1 * T, 10 * T)
        # Ampoules des loges
        for i in range(5):
            top.set(2 * T + 6 + i * 16, 2 * T - 1, P["light"])
    elif map_id == "reserve":
        draw_bookshelf(base, 1 * T, 2 * T, 4 * T)
        draw_cabinet(base, 8 * T, 2 * T, 2 * T)
        draw_workbench(base, 12 * T, 2 * T, 2 * T)
        for (x, y) in [(3, 4), (3, 5), (11, 7), (12, 7)]:
            draw_crate(base, x * T, y * T)
        draw_rack(base, top, 1 * T, 8 * T, 2 * T)
        draw_old_projector(base, 7 * T, 6 * T)
        # Toiles roulées et poussière
        base.rect(12 * T + 2, 4 * T + 6, 2 * T - 4, 5, P["paper2"])
        base.rect(12 * T + 2, 5 * T + 2, 2 * T - 4, 5, P["paper3"])
        r = rng(77)
        for _ in range(120):
            base.set(T + r.randrange(14 * T), 3 * T + r.randrange(6 * T), P["grey1"], 60)
    elif map_id == "bureau":
        draw_desk(base, 5 * T, 4 * T, 3 * T, [("book", 14), ("lamp", 36), ("paper", 3), ("mug", 28)])
        draw_desk(base, 9 * T, 6 * T, 2 * T, [("computer", 4), ("paper", 20)])
        draw_bookshelf(base, 1 * T, 2 * T, 3 * T)
        draw_cabinet(base, 11 * T, 2 * T, 2 * T)
        draw_plant(base, top, 12 * T, 8 * T)
        draw_plant(base, top, 1 * T, 8 * T)
        # Tableau de trésorerie au mur
        bx, by = 8 * T + 2, T + 1
        base.rect(bx, by, 28, 13, P["cream"])
        base.frame(bx, by, 28, 13, P["wood0"])
        for i, h in enumerate([4, 6, 3, 8, 7]):
            base.rect(bx + 3 + i * 5, by + 11 - h, 3, h, P["green1"] if i != 2 else P["velvet3"])
    return base, top


def window_view(season, w=24, h=12):
    """Vue par la fenêtre du bureau, selon la saison."""
    o = Canvas(w, h)
    sky = {"automne": P["sky"], "hiver": (200, 210, 225), "printemps": (170, 205, 235), "ete": (130, 185, 235)}[season]
    o.rect(0, 0, w, h, sky)
    fol = FOLIAGE[season]
    o.ellipse(6, 9, 6, 5, fol[0])
    o.ellipse(18, 10, 5, 4, fol[1])
    if season == "hiver":
        r = rng(4)
        for _ in range(10):
            o.set(r.randrange(w), r.randrange(h), P["white"])
    o.rect(0, 0, w, 1, P["wood1"])
    o.vline(w // 2, 0, h - 1, P["wood1"])
    o.hline(0, w - 1, h // 2, P["wood1"])
    o.frame(0, 0, w, h, P["wood0"])
    return o


# --- Rue -------------------------------------------------------------------------

def ground(c, x0, y0, k, gx, gy, season):
    if k == "_":
        noise_tile(c, x0, y0, P["grey2"], [P["grey1"], P["grey3"]], cell_seed(gx, gy, 1), 4)
        c.hline(x0, x0 + T - 1, y0, P["grey1"])
        c.vline(x0, y0, y0 + T - 1, P["grey1"])
        c.hline(x0, x0 + T - 1, y0 + 8, P["grey1"])
        c.vline(x0 + 8, y0 + 8, y0 + T - 1, P["grey1"])
        if season == "hiver":
            r = rng(cell_seed(gx, gy, 31))
            for _ in range(5):
                c.set(x0 + r.randrange(T), y0 + r.randrange(T), P["white"])
    elif k in "=z":
        noise_tile(c, x0, y0, P["grey0"], [P["grey1"], P["night2"]], cell_seed(gx, gy, 2), 5)
        if k == "z":
            for xx in range(1, T, 6):
                c.rect(x0 + xx, y0 + 1, 3, T - 2, P["grey3"])
        elif gy == 11 and gx % 3 == 0:
            c.rect(x0 + 2, y0 + 7, 10, 2, P["gold3"])
        if season == "hiver" and gy in (10, 12):
            r = rng(cell_seed(gx, gy, 33))
            for _ in range(3):
                c.set(x0 + r.randrange(T), y0 + (r.randrange(4) if gy == 10 else 12 + r.randrange(4)), P["grey3"])
    elif k in "gTBfFLK" or k == "t":
        cols = GRASS[season]
        noise_tile(c, x0, y0, cols[0], cols[1:], cell_seed(gx, gy, 9), 10)
        r = rng(cell_seed(gx, gy, 21))
        if season == "automne" and r.random() < 0.5:
            for _ in range(3):
                c.set(x0 + r.randrange(T), y0 + r.randrange(T), FOLIAGE["automne"][r.randrange(3)])
        if season == "printemps" and r.random() < 0.4:
            fx, fy = x0 + r.randrange(2, 14), y0 + r.randrange(2, 14)
            c.set(fx, fy, (240, 190, 210))
            c.set(fx + 1, fy, P["gold3"])
        if season == "ete" and r.random() < 0.3:
            c.set(x0 + r.randrange(T), y0 + r.randrange(T), P["gold3"])


def draw_tree(base, top, x0, y0, season, seed):
    trunk = outlined(8, 14, lambda o: (o.rect(1, 0, 6, 14, P["wood1"]), o.vline(2, 0, 13, P["wood2"])))
    base.paste(trunk, x0 + 4, y0 + 2)
    base.ellipse(x0 + 8, y0 + 15, 7, 2, shade(GRASS[season][1], 0.75))
    fol = FOLIAGE[season]

    def canopy(o):
        r = rng(seed)
        if season == "hiver":
            for i in range(9):
                a = -math.pi / 2 + (i - 4) * 0.33
                o.line(12, 22, int(12 + math.cos(a) * 10), int(22 + math.sin(a) * 14), P["wood1"])
            for _ in range(14):
                o.set(r.randrange(4, 20), r.randrange(4, 18), P["white"])
            return
        o.ellipse(12, 13, 11, 10, fol[3])
        o.ellipse(11, 11, 10, 9, fol[0])
        o.ellipse(9, 9, 6, 5, fol[1])
        o.ellipse(15, 12, 5, 4, fol[1])
        for _ in range(10):
            o.set(r.randrange(4, 20), r.randrange(3, 18), fol[2])
    cp = outlined(24, 26, canopy)
    top.paste(cp, x0 - 4, y0 - 18)


def draw_lamp(base, top, x0, y0):
    base.rect(x0 + 6, y0 + 4, 4, 12, P["ink"])
    base.rect(x0 + 7, y0 + 4, 2, 11, P["night2"])
    base.rect(x0 + 5, y0 + 13, 6, 3, P["ink"])

    def head(o):
        o.rect(5, 6, 6, 14, P["night2"])
        o.rect(6, 6, 2, 14, P["navy"])
        o.rect(3, 0, 10, 7, P["night2"])
        o.rect(4, 1, 8, 4, (255, 226, 150))
        o.hline(2, 13, 0, P["ink"])
    top.paste(outlined(16, 20, head), x0, y0 - 14)


def draw_morris(base, top, x0, y0):
    def col(o):
        o.rect(2, 8, 12, 24, (46, 96, 70))
        o.rect(3, 8, 3, 24, (70, 126, 92))
        o.rect(2, 12, 12, 14, P["paper"])
        o.rect(0, 30, 16, 2, (36, 76, 56))
        o.ellipse(8, 6, 7, 4, (46, 96, 70))
        o.rect(7, 0, 2, 4, P["gold2"])
    sprite = outlined(16, 32, col)
    # Bas sur la base, haut (au-dessus de la case) devant les personnages.
    lower = Canvas(16, 16)
    upper = Canvas(16, 16)
    for y in range(32):
        for x in range(16):
            p = sprite.px[x, y]
            if p[3]:
                (upper if y < 16 else lower).set(x, y if y < 16 else y - 16, p[:3])
    base.paste(lower, x0, y0)
    top.paste(upper, x0, y0 - 16)


def draw_fountain(base, x0, y0, season):
    def f(o):
        o.ellipse(16, 18, 15, 11, P["grey2"])
        o.ellipse(16, 18, 12, 8, (120, 170, 210) if season != "hiver" else (220, 232, 245))
        o.ellipse(16, 15, 4, 3, P["grey3"])
        o.rect(15, 6, 3, 9, P["grey3"])
        o.ellipse(16, 6, 3, 2, P["grey2"])
        if season != "hiver":
            for i in range(-2, 3):
                o.set(16 + i * 2, 4 + abs(i), (190, 225, 245))
    base.paste(outlined(32, 32, f), x0, y0)


def draw_flowers(base, x0, y0, season):
    cols = {"automne": [P["orange"], P["gold2"]], "hiver": [P["white"], P["grey3"]],
            "printemps": [(240, 150, 190), P["gold3"], (190, 150, 240)], "ete": [P["velvet4"], P["gold3"], (240, 120, 160)]}[season]

    def f(o):
        o.ellipse(8, 10, 7, 5, P["wood1"])
        o.ellipse(8, 9, 6, 4, P["green0"] if season != "hiver" else P["grey3"])
        r = rng(x0 + y0)
        for _ in range(10):
            o.set(r.randrange(3, 13), r.randrange(6, 12), cols[r.randrange(len(cols))])
    base.paste(outlined(16, 16, f), x0, y0)


def draw_table(base, top, x0, y0, season):
    def t(o):
        o.ellipse(8, 9, 6, 4, P["cream"])
        o.rect(7, 10, 2, 5, P["grey0"])
        o.rect(1, 9, 3, 5, P["wood2"])
        o.rect(12, 9, 3, 5, P["wood2"])
    base.paste(outlined(16, 16, t), x0, y0)
    if season in ("printemps", "ete"):
        def u(o):
            for i in range(20):
                o.hline(10 - i // 2, 10 + i // 2, i // 2, P["velvet3"] if (i // 4) % 2 == 0 else P["cream"])
            o.rect(9, 10, 2, 8, P["grey0"])
        top.paste(outlined(20, 18, u), x0 - 2, y0 - 12)


def facade_theatre(c, x0, y0, w, h, season):
    """Façade du Théâtre de la Lanterne (12 × 8 cases)."""
    stone, stone_d = P["paper"], P["paper2"]
    c.rect(x0, y0 + 14, w, h - 14, stone)
    for yy in range(y0 + 22, y0 + h, 8):
        c.hline(x0, x0 + w - 1, yy, stone_d)
    # fronton triangulaire
    c.poly([(x0 + 6, y0 + 22), (x0 + w // 2, y0 + 1), (x0 + w - 6, y0 + 22)], P["paper3"])
    c.poly([(x0 + 14, y0 + 20), (x0 + w // 2, y0 + 6), (x0 + w - 14, y0 + 20)], stone)
    c.rect(x0 + 2, y0 + 20, w - 4, 4, P["paper3"])
    c.ellipse(x0 + w // 2, y0 + 15, 5, 5, P["gold2"])
    c.ellipse(x0 + w // 2, y0 + 15, 3, 3, P["light"])
    # bandeau titre
    c.rect(x0 + 10, y0 + 26, w - 20, 11, P["velvet1"])
    c.frame(x0 + 10, y0 + 26, w - 20, 11, P["gold1"])
    label = "THEATRE DE LA LANTERNE"
    text(c, x0 + w // 2 - text_width(label) // 2, y0 + 28, label, P["gold3"])
    # colonnes
    for i in range(6):
        cx = x0 + 10 + i * 34
        c.rect(cx, y0 + 40, 8, h - 50, P["cream"])
        c.vline(cx + 1, y0 + 40, y0 + h - 11, P["white"])
        c.vline(cx + 7, y0 + 40, y0 + h - 11, stone_d)
        c.rect(cx - 2, y0 + 38, 12, 3, P["paper2"])
        c.rect(cx - 2, y0 + h - 12, 12, 3, P["paper2"])
    # fenêtres hautes (éclairées la nuit par le calque de lumière)
    for i in range(5):
        wx = x0 + 22 + i * 34
        c.rect(wx, y0 + 42, 14, 18, P["navy"])
        c.rect(wx + 1, y0 + 43, 12, 16, P["blue"])
        c.vline(wx + 7, y0 + 43, y0 + 58, P["navy"])
        c.ellipse(wx + 7, y0 + 43, 7, 3, P["navy"])
    # portes et marquise
    door_x = x0 + w // 2 - 16
    c.rect(x0 + 40, y0 + h - 40, w - 80, 4, P["gold1"])
    c.rect(x0 + 40, y0 + h - 36, w - 80, 2, P["gold0"])
    double_door(c, door_x, y0 + h - 30, P["velvet2"], h=30)
    # cadres d'affiches de part et d'autre de la porte
    for fx in (x0 + 52, x0 + w - 52 - 22):
        c.rect(fx - 2, y0 + h - 34, 26, 30, P["gold1"])
        c.rect(fx, y0 + h - 32, 22, 26, P["ink"])
    # marches
    c.rect(x0 + 34, y0 + h - 4, w - 68, 4, P["grey3"])
    if season == "hiver":
        for xx in range(x0 + 6, x0 + w - 6):
            t = abs(xx - (x0 + w // 2)) / (w // 2)
            yy = int(y0 + 1 + t * 21)
            c.set(xx, yy - 1, P["white"])
            c.set(xx, yy, P["white"])
        c.rect(x0 + 2, y0 + 19, w - 4, 2, P["white"])


def facade_mairie(c, x0, y0, w, h, season):
    c.rect(x0, y0 + 10, w, h - 10, (214, 196, 160))
    for yy in range(y0 + 18, y0 + h, 7):
        c.hline(x0, x0 + w - 1, yy, (190, 170, 136))
    c.rect(x0, y0 + 4, w, 8, P["blue"])
    c.hline(x0, x0 + w - 1, y0 + 4, P["navy"])
    if season == "hiver":
        c.rect(x0, y0 + 3, w, 2, P["white"])
    c.rect(x0 + w // 2 - 18, y0 + 14, 36, 9, P["cream"])
    text(c, x0 + w // 2 - text_width("MAIRIE") // 2, y0 + 15, "MAIRIE", P["navy"])
    # horloge et drapeaux
    c.ellipse(x0 + w // 2, y0 + 3, 5, 5, P["cream"])
    c.set(x0 + w // 2, y0 + 1, P["ink"])
    c.set(x0 + w // 2 + 1, y0 + 3, P["ink"])
    for i, col in enumerate([(40, 70, 160), P["white"], (200, 40, 50)]):
        c.rect(x0 + 8 + i * 3, y0 + 26, 3, 7, col)
    c.vline(x0 + 7, y0 + 24, y0 + 40, P["grey0"])
    for i in range(4):
        wx = x0 + 12 + i * 38 if i < 2 else x0 + w - 50 + (i - 2) * 30
        c.rect(wx, y0 + 30, 14, 18, P["navy"])
        c.rect(wx + 1, y0 + 31, 12, 16, P["blue"])
        c.vline(wx + 7, y0 + 31, y0 + 46, P["navy"])
    double_door(c, x0 + 4 * T, y0 + h - 22, P["wood1"], h=22)
    c.rect(x0 + 60, y0 + h - 2, 50, 2, P["grey3"])


def facade_cafe(c, x0, y0, w, h, season):
    c.rect(x0, y0, w, h, (196, 120, 90))
    for yy in range(y0 + 4, y0 + h, 6):
        for xx in range(x0 + ((yy // 6) % 2) * 4, x0 + w, 8):
            c.rect(xx, yy, 7, 5, (176, 104, 78))
    c.rect(x0 + 6, y0 + 8, w - 12, 9, P["green0"])
    text(c, x0 + w // 2 - text_width("CAFE") // 2, y0 + 9, "CAFE", P["gold3"])
    for i in range(w // 8):
        col = P["green1"] if i % 2 == 0 else P["cream"]
        c.rect(x0 + i * 8, y0 + 28, 8, 10, col)
        c.set(x0 + i * 8 + 4, y0 + 38, col)
    c.rect(x0 + 6, y0 + 42, 30, 34, P["light"])
    c.rect(x0 + 7, y0 + 43, 28, 32, (255, 214, 150))
    c.vline(x0 + 21, y0 + 43, y0 + 74, P["wood1"])
    c.rect(x0 + w - 36, y0 + 42, 30, 20, P["light"])
    c.rect(x0 + w - 35, y0 + 43, 28, 18, (255, 214, 150))
    c.rect(x0 + 2 * T - 1, y0 + h - 22, 18, 22, P["wood1"])
    c.rect(x0 + 2 * T + 1, y0 + h - 20, 14, 18, P["wood2"])


def facade_imprimerie(c, x0, y0, w, h, season):
    c.rect(x0, y0, w, h, (150, 160, 180))
    c.rect(x0, y0, w, 6, P["navy"])
    c.rect(x0 + 3, y0 + 10, w - 6, 9, P["navy"])
    text(c, x0 + w // 2 - text_width("IMPRIMERIE") // 2, y0 + 11, "IMPRIMERIE", P["cream"])
    c.rect(x0 + 4, y0 + 26, w - 8, 26, P["sky"])
    c.frame(x0 + 4, y0 + 26, w - 8, 26, P["navy"])
    r = rng(8)
    for i in range(5):
        col = [P["velvet3"], P["gold2"], P["teal"], P["purple2"], P["orange"]][i]
        c.rect(x0 + 8 + i * 14, y0 + 30 + r.randrange(4), 10, 14, col)
    c.rect(x0 + 2 * T - 1, y0 + h - 22, 18, 22, P["navy"])
    c.rect(x0 + 2 * T + 1, y0 + h - 20, 14, 18, P["blue"])


def backdrop(c, x0, y0, season, seed):
    """Fond derrière la place (haies, murets, toits lointains)."""
    r = rng(seed)
    c.rect(x0, y0, T, T, (120, 104, 120))
    for yy in range(0, T, 4):
        c.hline(x0, x0 + T - 1, y0 + yy, (104, 88, 104))
    fol = FOLIAGE[season]
    c.ellipse(x0 + 8, y0 + 12, 9, 7, fol[3] if season != "hiver" else P["grey3"])
    c.ellipse(x0 + 7, y0 + 11, 7, 5, fol[0] if season != "hiver" else P["white"])
    for _ in range(4):
        c.set(x0 + r.randrange(T), y0 + 8 + r.randrange(8), fol[2])


def street(world, season, festive=False):
    m = world["maps"]["rue"]
    g = m["grid"]
    W, H = len(g[0]), len(g)
    base = Canvas(W * T, H * T, P["ink"])
    top = Canvas(W * T, H * T)
    for y in range(H):
        for x in range(W):
            k = g[y][x]
            x0, y0 = x * T, y * T
            if k in "Hd":
                c0 = (110, 100, 110)
                base.rect(x0, y0, T, T, c0)
            elif k == "X":
                backdrop(base, x0, y0, season, cell_seed(x, y))
            elif k in "DLKt":
                ground(base, x0, y0, "_", x, y, season)
            else:
                ground(base, x0, y0, k, x, y, season)
    # bordure de trottoir
    for x in range(W):
        base.hline(x * T, x * T + T - 1, 10 * T, P["grey3"])
        base.hline(x * T, x * T + T - 1, 13 * T, P["grey3"])
    facade_mairie(base, 1 * T, 1 * T, 10 * T, 7 * T, season)
    facade_theatre(base, 14 * T, 0, 12 * T, 8 * T, season)
    facade_cafe(base, 28 * T, 2 * T, 6 * T, 6 * T, season)
    facade_imprimerie(base, 35 * T, 2 * T, 5 * T, 6 * T, season)
    for y in range(H):
        for x in range(W):
            k = g[y][x]
            x0, y0 = x * T, y * T
            if k == "T":
                draw_tree(base, top, x0, y0, season, cell_seed(x, y))
            elif k == "L":
                draw_lamp(base, top, x0, y0)
            elif k == "K":
                draw_morris(base, top, x0, y0)
            elif k == "B":
                if g[y][x - 1] != "B":
                    draw_bench(base, x0, y0, 32)
            elif k == "f":
                draw_flowers(base, x0, y0, season)
            elif k == "t":
                draw_table(base, top, x0, y0, season)
            elif k == "F" and g[y - 1][x] != "F" and g[y][x - 1] != "F":
                draw_fountain(base, x0, y0, season)
    if season == "hiver":
        r = rng(99)
        for _ in range(140):
            x, y = r.randrange(W * T), r.randrange(8 * T, H * T)
            base.set(x, y, P["white"], 160)
    if festive:
        festive_street(top, W)
    return base, top


def festive_street(top, W):
    """Guirlandes lumineuses tendues au-dessus du trottoir."""
    cols = [P["velvet4"], P["gold3"], (120, 200, 120), (130, 180, 240)]
    for i, (xa, xb) in enumerate([(0, 12), (12, 27), (27, 34), (34, 39)]):
        x0, x1 = xa * T + 8, xb * T + 8
        for x in range(x0, x1):
            t = (x - x0) / max(1, x1 - x0)
            y = int(7 * T + 2 + math.sin(t * math.pi) * 10)
            top.set(x, y, P["night2"])
            if (x - x0) % 6 == 0:
                top.set(x, y + 1, cols[(x // 6) % 4])
                top.set(x, y + 2, cols[(x // 6) % 4])


def street_lights(world):
    m = world["maps"]["rue"]
    g = m["grid"]
    W, H = len(g[0]), len(g)
    c = Canvas(W * T, H * T)

    def glow(cx, cy, r, col, strength):
        for y in range(int(cy - r), int(cy + r)):
            for x in range(int(cx - r), int(cx + r)):
                d = math.hypot(x - cx, y - cy) / r
                if d < 1:
                    c.set(x, y, col, int(strength * (1 - d) ** 1.6))
    for y in range(H):
        for x in range(W):
            if g[y][x] == "L":
                glow(x * T + 8, y * T - 6, 30, P["light"], 170)
            if g[y][x] == "K":
                glow(x * T + 8, y * T - 4, 14, P["light"], 90)
    # fenêtres du théâtre, du café, de la mairie
    for i in range(5):
        wx = 14 * T + 22 + i * 34
        c.rect(wx + 1, 43, 12, 16, (255, 214, 140), 220)
        glow(wx + 7, 52, 18, P["light"], 70)
    glow(20 * T, 7 * T, 34, P["light"], 120)
    c.rect(28 * T + 7, 2 * T + 43, 28, 32, (255, 200, 120), 200)
    for (wx, wy) in [(1 * T + 12, 1 * T + 30), (1 * T + 50, 1 * T + 30)]:
        c.rect(wx + 1, wy + 1, 12, 16, (255, 220, 160), 160)
    return c


def interior_lights(world, map_id, base_size):
    c = Canvas(*base_size)

    def glow(cx, cy, r, col, strength):
        for y in range(int(cy - r), int(cy + r)):
            for x in range(int(cx - r), int(cx + r)):
                d = math.hypot(x - cx, y - cy) / r
                if d < 1:
                    c.set(x, y, col, int(strength * (1 - d) ** 1.5))
    if map_id == "salle":
        for sx in (5, 14):
            for i in range(4):
                px = sx * T + 7 + i * 11
                for y in range(T + 19, 6 * T):
                    half = 2 + (y - T - 19) * 0.25
                    for x in range(int(px - half), int(px + half)):
                        c.set(x, y, P["light"], 40)
        glow(10.5 * T, 4 * T, 70, P["light"], 70)
    elif map_id == "hall":
        for x in (5, 16):
            glow(x * T, 2 * T, 50, P["light"], 60)
    return c


# --- Rénovations -------------------------------------------------------------------

def upgrade_overlays(world):
    out = {}
    hall_w, hall_h = 22 * T, 14 * T
    # Foyer-bar : bouteilles, lumière chaude, tabourets
    c = Canvas(hall_w, hall_h)
    draw_counter(c, 15 * T, 3 * T - 2, 5 * T)
    for i in range(14):
        col = [P["green1"], P["velvet3"], P["gold2"], P["teal"]][i % 4]
        c.rect(15 * T + 4 + i * 5, T + 4, 3, 8, col)
        c.rect(15 * T + 5 + i * 5, T + 2, 1, 2, col)
    c.rect(15 * T, T + 12, 5 * T, 2, P["wood3"])
    for i in range(4):
        def stool(o):
            o.ellipse(5, 3, 4, 3, P["velvet3"])
            o.rect(4, 5, 2, 7, P["gold1"])
            o.hline(2, 8, 11, P["gold1"])
        c.paste(outlined(10, 13, stool), 15 * T + 6 + i * 18, 4 * T + 2)
    c.rect(15 * T + 6, 3 * T + 2, 6, 3, P["cream"])
    out[("hall", "foyer_bar")] = c
    # Accessibilité : rampe, pictogramme, places réservées
    c = Canvas(hall_w, hall_h)

    def ramp(o):
        for i in range(12):
            o.hline(0, 31, i, mix(P["grey3"], P["grey2"], i / 12))
        o.hline(0, 31, 0, P["gold2"])
        o.hline(0, 31, 11, P["gold2"])
    c.paste(outlined(32, 12, ramp), 10 * T, 12 * T + 3)

    def picto(o):
        o.rect(0, 0, 14, 14, P["blue"])
        o.ellipse(7, 3, 1.5, 1.5, P["white"])
        o.vline(6, 4, 8, P["white"])
        o.hline(6, 9, 8, P["white"])
        o.ellipse(6, 10, 3, 3, P["white"])
        o.ellipse(6, 10, 2, 2, P["blue"])
    c.paste(outlined(14, 14, picto), 7 * T + 1, 12 * T)
    out[("hall", "accessibilite")] = c
    # Projecteurs LED : nouvelles barres, couleurs vives
    sw, sh = 22 * T, 16 * T
    c = Canvas(sw, sh)
    for sx in (5, 14):
        c.rect(sx * T, T + 12, 3 * T, 2, P["grey2"])
        for i in range(4):
            px = sx * T + 4 + i * 11
            c.rect(px, T + 13, 6, 5, P["ink"])
            c.rect(px + 1, T + 17, 4, 1, [P["velvet4"], P["teal"], P["gold3"], P["purple2"]][i])
    out[("salle", "projecteurs_led")] = c
    # Loges : radiateur, établi rangé, lampes
    cw, ch = 18 * T, 12 * T
    c = Canvas(cw, ch)
    for i in range(6):
        c.rect(10 * T + 2 + i * 10, T + 3, 8, 10, [P["velvet3"], P["blue"], P["gold2"], P["green1"], P["purple1"], P["grey2"]][i])
        c.frame(10 * T + 2 + i * 10, T + 3, 8, 10, P["ink"])
    c.rect(2, 4 * T, 5, 30, P["grey3"])
    for y in range(4 * T + 2, 4 * T + 30, 4):
        c.hline(2, 6, y, P["grey2"])
    for i in range(5):
        c.rect(2 * T + 4 + i * 16, 2 * T - 4, 8, 2, P["light"])
    out[("coulisses", "loges")] = c
    # Récompense de collection : guirlande de lanternes dans le hall (10 objets)
    c = Canvas(hall_w, hall_h)
    for x in range(T, 21 * T, 4):
        sag = int(4 * math.sin((x - T) / (20 * T) * math.pi * 4) ** 2)
        c.set(x, 2 * T + 2 + sag, P["grey0"])
        c.set(x + 1, 2 * T + 2 + sag, P["grey0"])
        if (x // 4) % 6 == 0:
            c.rect(x - 1, 2 * T + 3 + sag, 4, 5, P["gold2"])
            c.rect(x, 2 * T + 4 + sag, 2, 3, P["light"])
    out[("hall", "reward_guirlande")] = c
    # Enseigne lumineuse sur la façade
    rw, rh = 40 * T, 18 * T
    c = Canvas(rw, rh)
    sx, sy = 14 * T + 54, 4 * T + 6
    c.rect(sx, sy, 84, 12, P["ink"])
    c.frame(sx, sy, 84, 12, P["gold2"])
    label = "LA LANTERNE"
    text(c, sx + 42 - text_width(label) // 2, sy + 3, label, P["light"], shadow=P["velvet3"])
    for x in range(sx + 2, sx + 82, 4):
        c.set(x, sy + 1, P["gold3"])
        c.set(x, sy + 10, P["gold3"])
    out[("rue", "enseigne")] = c
    return out


def festive_interior(map_id):
    """Sapin de Noël dans le hall."""
    if map_id != "hall":
        return None
    c = Canvas(22 * T, 14 * T)

    def tree(o):
        for i in range(4):
            o.poly([(12 - 4 - i * 2, 8 + i * 6), (12, i * 6), (12 + 4 + i * 2, 8 + i * 6)], P["green0"] if i % 2 else P["green1"])
        o.rect(10, 30, 4, 4, P["wood1"])
        r = rng(12)
        for _ in range(12):
            o.set(r.randrange(5, 19), r.randrange(4, 28), [P["velvet4"], P["gold3"], P["teal"]][r.randrange(3)])
        o.set(12, 0, P["gold3"])
    c.paste(outlined(24, 34, tree), 7 * T - 4, 6 * T - 6)
    return c


# --- Personnages ---------------------------------------------------------------------

PEOPLE = {
    "directeur": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["navy"], "legs": P["night"],
                  "accent": P["gold2"], "scarf": True},
    "helene": {"skin": P["skin1"], "hair": P["grey3"], "hair_style": "bob", "top": P["navy"], "legs": P["grey1"],
               "accent": P["gold2"], "glasses": True, "scarf": True},
    "bastien": {"skin": P["skin4"], "hair": P["ink"], "hair_style": "beanie", "top": P["grey0"], "legs": P["navy"],
                "accent": P["velvet3"], "beard": True},
    "ines": {"skin": P["skin3"], "hair": P["wood0"], "hair_style": "curly", "top": P["velvet3"], "legs": P["blue"],
             "accent": P["gold3"]},
    "pommier": {"skin": P["skin0"], "hair": P["grey2"], "hair_style": "bald", "top": P["night2"], "legs": P["night2"],
                "accent": P["blue"], "tie": True},
    "louison": {"skin": P["skin2"], "hair": P["purple2"], "hair_style": "swoop", "top": P["ink"], "legs": P["night"],
                "accent": P["purple1"], "glasses": True},
    "accueil": {"skin": P["skin2"], "hair": P["wood0"], "hair_style": "short", "top": P["velvet2"], "legs": P["night"],
                "accent": P["gold2"], "tie": True},
    "passant_a": {"skin": P["skin0"], "hair": P["gold1"], "hair_style": "long", "top": P["teal"], "legs": P["navy"], "accent": P["cream"]},
    "passant_b": {"skin": P["skin3"], "hair": P["ink"], "hair_style": "short", "top": P["orange"], "legs": P["grey0"], "accent": P["cream"]},
    "passant_c": {"skin": P["skin5"], "hair": P["ink"], "hair_style": "curly", "top": P["purple1"], "legs": P["wood1"], "accent": P["gold3"]},
    "passant_d": {"skin": P["skin1"], "hair": P["grey3"], "hair_style": "bald", "top": P["green1"], "legs": P["wood1"], "accent": P["cream"], "cane": True},
    # Tenues du directeur débloquées par l'album de collection
    "directeur_echarpe": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["navy"], "legs": P["night"],
                          "accent": P["velvet4"], "scarf": True},
    "directeur_festival": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["teal"], "legs": P["wood3"],
                           "accent": P["gold3"], "scarf": True},
    "directeur_beret": {"skin": P["skin1"], "hair": P["velvet2"], "hair_style": "beanie", "top": P["ink"], "legs": P["night"],
                        "accent": P["velvet4"], "scarf": True},
    "directeur_gala": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["ink"], "legs": P["ink"],
                       "accent": P["velvet3"], "tie": True},
    "directeur_lanterne": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["gold2"], "legs": P["velvet1"],
                           "accent": P["velvet3"], "scarf": True, "glasses": True},
    "directeur_archiviste": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["wood3"], "legs": P["navy"],
                             "accent": P["green1"], "glasses": True, "scarf": True},
    "directeur_regie": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "beanie", "top": P["ink"], "legs": P["grey0"],
                        "accent": P["gold2"]},
    "fernand": {"skin": P["skin1"], "hair": P["white"], "hair_style": "bald", "top": P["grey1"], "legs": P["navy"],
                "accent": P["velvet3"], "glasses": True, "cane": True},
    "collectionneur": {"skin": P["skin0"], "hair": P["ink"], "hair_style": "swoop", "top": P["purple0"], "legs": P["ink"],
                       "accent": P["gold3"], "scarf": True},
    "spectateur_a": {"skin": P["skin2"], "hair": P["velvet1"], "hair_style": "long", "top": P["gold1"], "legs": P["night"], "accent": P["cream"]},
    "spectateur_b": {"skin": P["skin4"], "hair": P["ink"], "hair_style": "short", "top": P["blue"], "legs": P["night"], "accent": P["cream"]},
    "spectateur_c": {"skin": P["skin0"], "hair": P["wood2"], "hair_style": "bob", "top": P["green0"], "legs": P["grey1"], "accent": P["gold3"]},
    # Habitants de Bréval-sur-Ondine (grande ville)
    "passant_e": {"skin": P["skin2"], "hair": P["velvet1"], "hair_style": "bob", "top": P["sky"], "legs": P["navy"], "accent": P["cream"]},
    "passant_f": {"skin": P["skin4"], "hair": P["ink"], "hair_style": "beanie", "top": P["velvet3"], "legs": P["grey0"], "accent": P["cream"]},
    "voyageur": {"skin": P["skin1"], "hair": P["wood2"], "hair_style": "short", "top": P["wood3"], "legs": P["navy"], "accent": P["teal"], "scarf": True},
    "principale": {"skin": P["skin5"], "hair": P["ink"], "hair_style": "curly", "top": P["teal"], "legs": P["night"], "accent": P["gold2"], "glasses": True},
    "animateur": {"skin": P["skin3"], "hair": P["ink"], "hair_style": "short", "top": P["orange"], "legs": P["blue"], "accent": P["cream"], "beard": True},
    "directrice": {"skin": P["skin0"], "hair": P["gold2"], "hair_style": "bob", "top": P["grey1"], "legs": P["grey0"], "accent": P["teal"], "scarf": True},
    "chef_gare": {"skin": P["skin1"], "hair": P["grey3"], "hair_style": "bald", "top": P["navy"], "legs": P["navy"], "accent": P["velvet3"], "tie": True},
    "maraichere": {"skin": P["skin2"], "hair": P["wood1"], "hair_style": "long", "top": P["green1"], "legs": P["wood2"], "accent": P["paper"], "scarf": True},
    "musicien": {"skin": P["skin4"], "hair": P["ink"], "hair_style": "swoop", "top": P["purple0"], "legs": P["night"], "accent": P["gold3"]},
    "bibliothecaire": {"skin": P["skin0"], "hair": P["grey2"], "hair_style": "bob", "top": P["purple1"], "legs": P["grey1"], "accent": P["cream"], "glasses": True},
    "pecheur": {"skin": P["skin1"], "hair": P["green0"], "hair_style": "beanie", "top": P["gold1"], "legs": P["green0"], "accent": P["cream"], "beard": True},
    "sportif_a": {"skin": P["skin3"], "hair": P["ink"], "hair_style": "short", "top": P["velvet4"], "legs": P["white"], "accent": P["white"]},
    "sportif_b": {"skin": P["skin1"], "hair": P["gold1"], "hair_style": "short", "top": P["blue"], "legs": P["white"], "accent": P["white"]},
    "jardiniere": {"skin": P["skin2"], "hair": P["grey3"], "hair_style": "long", "top": P["green2"], "legs": P["wood1"], "accent": P["gold2"]},
    "libraire": {"skin": P["skin1"], "hair": P["wood0"], "hair_style": "short", "top": P["paper3"], "legs": P["wood1"], "accent": P["velvet3"], "glasses": True, "scarf": True},
    "projectionniste": {"skin": P["skin4"], "hair": P["grey2"], "hair_style": "beanie", "top": P["ink"], "legs": P["grey0"], "accent": P["velvet3"]},
    # Habitants des intérieurs (interiors_layout.py)
    "guichetiere": {"skin": P["skin2"], "hair": P["wood1"], "hair_style": "bob", "top": P["navy"], "legs": P["navy"], "accent": P["velvet3"], "scarf": True},
    "artiste": {"skin": P["skin3"], "hair": P["velvet3"], "hair_style": "swoop", "top": P["teal"], "legs": P["blue"], "accent": P["gold3"], "apron": True, "apron_color": P["grey2"]},
    "receptionniste": {"skin": P["skin1"], "hair": P["ink"], "hair_style": "short", "top": P["velvet1"], "legs": P["ink"], "accent": P["gold2"], "tie": True},
    "agent_mairie": {"skin": P["skin4"], "hair": P["ink"], "hair_style": "short", "top": P["blue"], "legs": P["grey0"], "accent": P["cream"], "glasses": True},
    "patronne": {"skin": P["skin1"], "hair": P["velvet2"], "hair_style": "curly", "top": P["ink"], "legs": P["night"], "accent": P["gold2"], "apron": True, "apron_color": P["cream"]},
    "imprimeur": {"skin": P["skin1"], "hair": P["grey3"], "hair_style": "bald", "top": P["blue"], "legs": P["navy"], "accent": P["ink"], "apron": True, "apron_color": P["grey1"], "glasses": True, "beard": True},
    "boulangere": {"skin": P["skin0"], "hair": P["gold1"], "hair_style": "bob", "top": P["white"], "legs": P["grey1"], "accent": P["cream"], "apron": True, "apron_color": P["paper2"]},
    "caissiere": {"skin": P["skin5"], "hair": P["ink"], "hair_style": "long", "top": P["velvet3"], "legs": P["ink"], "accent": P["gold3"], "tie": True},
    "prof_piano": {"skin": P["skin0"], "hair": P["grey2"], "hair_style": "swoop", "top": P["ink"], "legs": P["ink"], "accent": P["white"], "tie": True, "glasses": True},
    "fleuriste": {"skin": P["skin2"], "hair": P["orange"], "hair_style": "long", "top": P["sky"], "legs": P["navy"], "accent": P["green1"], "apron": True, "apron_color": P["green1"]},
    "disquaire": {"skin": P["skin3"], "hair": P["ink"], "hair_style": "beanie", "top": P["purple1"], "legs": P["blue"], "accent": P["gold3"], "beard": True},
    "galeriste": {"skin": P["skin0"], "hair": P["ink"], "hair_style": "bob", "top": P["ink"], "legs": P["ink"], "accent": P["velvet4"], "scarf": True, "glasses": True},
    "fromager": {"skin": P["skin1"], "hair": P["wood1"], "hair_style": "short", "top": P["green0"], "legs": P["wood1"], "accent": P["cream"], "apron": True, "apron_color": P["white"], "beard": True},
    "marchande": {"skin": P["skin3"], "hair": P["ink"], "hair_style": "curly", "top": P["orange"], "legs": P["green0"], "accent": P["gold2"], "apron": True, "apron_color": P["green2"]},
    "instituteur": {"skin": P["skin4"], "hair": P["ink"], "hair_style": "short", "top": P["wood3"], "legs": P["navy"], "accent": P["cream"], "glasses": True},
    "hotesse": {"skin": P["skin1"], "hair": P["gold2"], "hair_style": "long", "top": P["teal"], "legs": P["grey0"], "accent": P["white"], "scarf": True},
    "gardienne": {"skin": P["skin2"], "hair": P["grey3"], "hair_style": "curly", "top": P["purple0"], "legs": P["blue"], "accent": P["cream"], "apron": True, "apron_color": P["sky"]},
    "etudiant": {"skin": P["skin4"], "hair": P["wood0"], "hair_style": "beanie", "top": P["green2"], "legs": P["blue"], "accent": P["cream"]},
    "cpe": {"skin": P["skin1"], "hair": P["wood2"], "hair_style": "short", "top": P["grey1"], "legs": P["navy"], "accent": P["velvet3"], "tie": True},
    "benevole": {"skin": P["skin3"], "hair": P["ink"], "hair_style": "long", "top": P["gold2"], "legs": P["blue"], "accent": P["velvet3"], "scarf": True},
    "enfant_a": {"skin": P["skin2"], "hair": P["wood1"], "hair_style": "curly", "top": P["gold2"], "legs": P["blue"], "accent": P["cream"], "child": True},
    "enfant_b": {"skin": P["skin0"], "hair": P["gold1"], "hair_style": "bob", "top": P["velvet4"], "legs": P["navy"], "accent": P["cream"], "child": True},
    "touriste": {"skin": P["skin0"], "hair": P["velvet1"], "hair_style": "short", "top": P["white"], "legs": P["wood3"], "accent": P["sky"], "glasses": True},
}

DIRS = ["down", "up", "left", "right"]


def person_frame(spec, direction, frame):
    """Un personnage 16×24 vu de 3/4 ; frame 0 = immobile, 1 et 2 = pas."""
    o = Canvas(16, 24)
    skin, hair, top_c, legs = spec["skin"], spec["hair"], spec["top"], spec["legs"]
    skin_d = shade(skin, 0.82)
    bob = 1 if frame in (1, 2) else 0
    y = bob
    # jambes
    if direction in ("down", "up"):
        l_len = 5 if frame != 1 else 4
        r_len = 5 if frame != 2 else 4
        o.rect(5, 18 + y, 3, l_len - y, legs)
        o.rect(8, 18 + y, 3, r_len - y, legs)
        o.rect(5, 18 + l_len - 1, 3, 1, P["ink"])
        o.rect(8, 18 + r_len - 1, 3, 1, P["ink"])
    else:
        if frame == 0:
            o.rect(6, 18, 4, 5, legs)
            o.rect(6, 22, 5 if direction == "right" else 4, 1, P["ink"])
        else:
            front = 1 if frame == 1 else -1
            o.rect(6 + front, 18 + y, 3, 5 - y, legs)
            o.rect(6 - front, 18 + y, 3, 4 - y, shade(legs, 0.8))
            o.rect(6 + front, 22, 3, 1, P["ink"])
    # buste
    o.rect(4, 11 + y, 8, 8, top_c)
    o.hline(4, 11, 11 + y, shade(top_c, 1.2))
    o.vline(4, 12 + y, 18 + y, shade(top_c, 0.8))
    # bras
    swing = 0 if frame == 0 else (1 if frame == 1 else -1)
    if direction in ("down", "up"):
        o.rect(2, 12 + y + swing, 2, 6, shade(top_c, 0.85))
        o.rect(12, 12 + y - swing, 2, 6, shade(top_c, 0.85))
        o.rect(2, 17 + y + swing, 2, 2, skin)
        o.rect(12, 17 + y - swing, 2, 2, skin)
    else:
        ax = 7 + swing
        o.rect(ax, 12 + y, 2, 6, shade(top_c, 0.75))
        o.rect(ax, 17 + y, 2, 2, skin)
    # accessoires du buste
    if spec.get("scarf") and direction != "up":
        o.rect(5, 11 + y, 6, 2, spec["accent"])
        if direction == "down":
            o.rect(9, 12 + y, 2, 4, spec["accent"])
    if spec.get("tie") and direction == "down":
        o.rect(7, 11 + y, 2, 1, P["cream"])
        o.rect(7, 12 + y, 2, 5, spec["accent"])
    if spec.get("apron") and direction != "up":
        ap = spec.get("apron_color", P["white"])
        if direction == "down":
            o.rect(5, 13 + y, 6, 6, ap)
            o.hline(5, 10, 13 + y, shade(ap, 0.85))
        else:
            o.rect(6 if direction == "left" else 5, 13 + y, 5, 6, ap)
    if spec.get("cane") and direction in ("down", "left", "right"):
        cx = 13 if direction != "left" else 2
        o.vline(cx, 13 + y, 23, P["wood1"])
    # tête
    hy = 2 + y
    o.rect(4, hy, 8, 9, skin)
    o.rect(4, hy + 7, 8, 2, skin_d)
    style = spec["hair_style"]
    hd = shade(hair, 0.75)
    if direction == "up":
        o.rect(4, hy, 8, 8, hair)
        o.hline(5, 10, hy, shade(hair, 1.2))
        if style == "bald":
            o.rect(5, hy, 6, 4, skin)
        if style == "beanie":
            o.rect(3, hy - 1, 10, 5, hair)
            o.hline(3, 12, hy + 3, P["grey0"])
        if style in ("long", "curly"):
            o.rect(3, hy + 2, 10, 8, hair)
        if style == "bob":
            o.rect(3, hy + 1, 10, 7, hair)
    else:
        if direction == "down":
            o.set(6, hy + 5, P["ink"])
            o.set(9, hy + 5, P["ink"])
            o.set(6, hy + 4, shade(skin, 0.7))
            o.set(9, hy + 4, shade(skin, 0.7))
            if spec.get("glasses"):
                o.hline(5, 10, hy + 5, P["grey0"])
                o.set(6, hy + 5, P["sky"])
                o.set(9, hy + 5, P["sky"])
            if spec.get("beard"):
                o.rect(4, hy + 7, 8, 2, hair)
                o.set(7, hy + 7, skin_d)
        else:
            ex = 9 if direction == "right" else 6
            o.set(ex, hy + 5, P["ink"])
            if spec.get("glasses"):
                o.hline(ex - 1, ex + 1, hy + 5, P["grey0"])
                o.set(ex, hy + 5, P["sky"])
            if spec.get("beard"):
                bx = 7 if direction == "right" else 4
                o.rect(bx, hy + 7, 5, 2, hair)
            nose = 12 if direction == "right" else 3
            o.set(nose, hy + 5, skin_d)
        # cheveux (face et profil)
        if style == "short":
            o.rect(4, hy, 8, 3, hair)
            o.set(4, hy + 3, hair)
            o.set(11, hy + 3, hair)
            if direction == "left":
                o.rect(9, hy, 3, 6, hair)
            if direction == "right":
                o.rect(4, hy, 3, 6, hair)
        elif style == "bob":
            o.rect(3, hy, 10, 3, hair)
            o.rect(3, hy + 2, 2, 7, hair)
            o.rect(11, hy + 2, 2, 7, hair)
            if direction == "left":
                o.rect(9, hy, 4, 9, hair)
            if direction == "right":
                o.rect(3, hy, 4, 9, hair)
        elif style == "long":
            o.rect(3, hy, 10, 3, hair)
            o.rect(3, hy + 2, 2, 10, hair)
            o.rect(11, hy + 2, 2, 10, hair)
            if direction in ("left", "right"):
                o.rect(9 if direction == "left" else 3, hy, 4, 11, hair)
        elif style == "curly":
            for (cx, cy) in [(4, hy), (7, hy - 1), (10, hy), (3, hy + 3), (12, hy + 3), (3, hy + 6), (12, hy + 6)]:
                o.ellipse(cx + 0.5, cy + 1.5, 2, 2, hair)
            if direction == "left":
                o.ellipse(11, hy + 4, 3, 4, hair)
            if direction == "right":
                o.ellipse(5, hy + 4, 3, 4, hair)
        elif style == "beanie":
            o.rect(3, hy - 1, 10, 4, hair)
            o.hline(3, 12, hy + 2, P["grey0"])
            o.set(7, hy - 2, hair)
        elif style == "swoop":
            o.rect(4, hy, 8, 2, hair)
            o.rect(3 if direction != "right" else 8, hy + 1, 5, 3, hair)
            o.rect(4, hy, 2, 5, shade(hair, 0.7))
        elif style == "bald":
            o.rect(3, hy + 3, 2, 3, hair)
            o.rect(11, hy + 3, 2, 3, hair)
            if spec.get("tie"):
                o.hline(6, 9, hy + 7, hd)  # moustache
    o.outline(P["ink"])
    if spec.get("child"):
        return _shrink_child(o)
    return o


def _shrink_child(o):
    """Version enfant : même tête, corps raccourci (le sprite garde 16×24, pieds en bas)."""
    c = Canvas(16, 24)
    # tête et épaules (lignes 0..12) descendues de 5 px, corps (13..23) tassé sur 6 lignes
    for y in range(13):
        for x in range(16):
            px = o.get(x, y)
            if px[3]:
                c.set(x, y + 5, px[:3], px[3])
    for i in range(6):
        sy = 13 + int(i * 11 / 6)
        for x in range(16):
            px = o.get(x, sy)
            if px[3]:
                c.set(x, 18 + i, px[:3], px[3])
    return c


def person_sheet(spec):
    sheet = Canvas(16 * 3, 24 * 4)
    for row, d in enumerate(DIRS):
        for f in range(3):
            sheet.paste(person_frame(spec, d, f), f * 16, row * 24)
    return sheet


def seated_audience():
    """Spectateurs assis vus de dos (8 variantes, 16×16)."""
    sheet = Canvas(16 * 8, 16)
    hairs = [P["wood1"], P["ink"], P["gold1"], P["grey3"], P["velvet1"], P["wood2"], P["ink"], P["purple1"]]
    tops = [P["navy"], P["teal"], P["orange"], P["green1"], P["gold1"], P["purple1"], P["velvet3"], P["blue"]]
    for i in range(8):
        def d(o, i=i):
            o.rect(3, 9, 10, 6, tops[i])
            o.ellipse(8, 6, 4, 4.5, hairs[i])
            if i % 3 == 0:
                o.ellipse(8, 4, 5, 3, hairs[i])
        sheet.paste(outlined(16, 16, d), i * 16, 0)
    return sheet


# --- Effets et interface ---------------------------------------------------------------

def fx_assets():
    out = {}
    leaf = Canvas(5, 4)
    leaf.rect(1, 1, 3, 2, P["orange"])
    leaf.set(0, 1, P["gold2"])
    leaf.set(4, 2, P["wood2"])
    out["leaf"] = leaf
    snow = Canvas(3, 3)
    snow.set(1, 0, P["white"])
    snow.set(0, 1, P["white"])
    snow.set(1, 1, P["white"])
    snow.set(2, 1, P["white"])
    snow.set(1, 2, P["white"])
    out["snow"] = snow
    petal = Canvas(3, 3)
    petal.rect(0, 1, 3, 1, (246, 196, 214))
    petal.set(1, 0, (250, 216, 230))
    out["petal"] = petal
    mote = Canvas(2, 2)
    mote.rect(0, 0, 2, 2, P["light"])
    out["mote"] = mote

    def bubble(symbol):
        def d(o):
            o.rect(1, 1, 10, 10, P["white"])
            o.rect(5, 11, 2, 2, P["white"])
            if symbol == "!":
                o.rect(5, 3, 2, 5, P["velvet3"])
                o.rect(5, 9, 2, 1, P["velvet3"])
            elif symbol == "?":
                o.hline(4, 7, 3, P["navy"])
                o.set(8, 4, P["navy"])
                o.set(7, 5, P["navy"])
                o.set(6, 6, P["navy"])
                o.set(6, 7, P["navy"])
                o.set(6, 9, P["navy"])
            elif symbol == "ok":
                o.set(3, 6, P["green1"])
                o.set(4, 7, P["green1"])
                o.set(5, 8, P["green1"])
                o.set(6, 7, P["green1"])
                o.set(7, 6, P["green1"])
                o.set(8, 5, P["green1"])
                o.set(9, 4, P["green1"])
                o.set(4, 6, P["green1"])
                o.set(5, 7, P["green1"])
            elif symbol == "dots":
                for x in (3, 6, 9):
                    o.rect(x - 1, 6, 2, 2, P["grey1"])
            elif symbol == "build":
                o.rect(3, 4, 6, 3, P["grey1"])
                o.rect(5, 7, 2, 4, P["wood2"])
            elif symbol == "coin":
                o.ellipse(6, 6, 3.5, 3.5, P["gold2"])
                o.ellipse(6, 6, 2, 2, P["gold3"])
        return outlined(12, 14, d)
    for sym in ("!", "?", "ok", "dots", "build", "coin"):
        out["bubble_" + {"!": "alert", "?": "question"}.get(sym, sym)] = bubble(sym)

    arrow = Canvas(9, 7)
    for i in range(4):
        arrow.hline(i, 8 - i, i + 1, P["gold3"])
    arrow.outline(P["ink"])
    out["arrow"] = arrow

    # Petite faune de la ville : canards de l'étang, pigeons de la place (2 images chacun)
    for f in range(2):
        duck = Canvas(10, 8)
        duck.ellipse(5, 5, 4, 2.5, P["white"])
        duck.ellipse(7.5, 2.5, 2, 2, P["green1"])
        duck.set(9, 3, P["orange"])
        duck.set(8, 2, P["ink"])
        duck.rect(2, 4 + f, 3, 1, P["grey3"])
        duck.hline(1, 8, 7, (120, 170, 220), 160)
        duck.outline(P["ink"])
        out["duck_%d" % f] = duck
        pigeon = Canvas(8, 7)
        pigeon.ellipse(4, 4, 3, 2, P["grey2"])
        pigeon.ellipse(6, 2 + f, 1.5, 1.5, P["grey1"])
        pigeon.set(7, 2 + f, P["orange"])
        pigeon.rect(1, 3, 3, 1, P["grey1"])
        pigeon.set(3, 6, P["velvet4"])
        pigeon.set(5, 6, P["velvet4"])
        pigeon.outline(P["ink"])
        out["pigeon_%d" % f] = pigeon

    # Étincelle des trésors cachés (2 images) et icônes des 12 trésors de l'album
    for f in range(2):
        sp = Canvas(11, 11)
        r = 5 if f == 0 else 3
        sp.vline(5, 5 - r, 5 + r, P["gold3"])
        sp.hline(5 - r, 5 + r, 5, P["gold3"])
        sp.set(5, 5, P["white"])
        if f == 0:
            for d in (2, -2):
                sp.set(5 + d, 5 + d, P["light"])
                sp.set(5 + d, 5 - d, P["light"])
        out["sparkle_%d" % f] = sp

    # Météo et vie du ciel : pluie, ombre de nuage, oiseaux (2 images), luciole, poussière
    rain = Canvas(2, 9)
    for y in range(9):
        rain.set(1 if y > 4 else 0, y, (200, 220, 245), 120 + y * 12)
    out["rain"] = rain
    cloud = Canvas(128, 64)
    for (cx, cy, rx, ry) in [(40, 34, 34, 20), (72, 28, 38, 22), (98, 36, 26, 17), (60, 42, 44, 16)]:
        for y in range(64):
            for x in range(128):
                d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
                if d < 1:
                    a = int(255 * (1 - d) ** 0.6)
                    r0, g0, b0, a0 = cloud.get(x, y)
                    if a > a0:
                        cloud.px[x, y] = (20, 18, 40, a)
    out["cloud"] = cloud
    for f in range(2):
        bird = Canvas(9, 5)
        if f == 0:
            bird.set(0, 1, P["ink"]); bird.set(1, 2, P["ink"]); bird.set(2, 3, P["ink"]); bird.set(3, 2, P["ink"])
            bird.set(4, 3, P["ink"]); bird.set(5, 2, P["ink"]); bird.set(6, 3, P["ink"]); bird.set(7, 2, P["ink"]); bird.set(8, 1, P["ink"])
        else:
            bird.set(0, 3, P["ink"]); bird.set(1, 2, P["ink"]); bird.set(2, 2, P["ink"]); bird.set(3, 2, P["ink"])
            bird.set(4, 3, P["ink"]); bird.set(5, 2, P["ink"]); bird.set(6, 2, P["ink"]); bird.set(7, 2, P["ink"]); bird.set(8, 3, P["ink"])
        out["bird_%d" % f] = bird
    fly = Canvas(5, 5)
    fly.set(2, 2, (240, 255, 170))
    for (x, y) in [(1, 2), (3, 2), (2, 1), (2, 3)]:
        fly.set(x, y, (200, 240, 120), 120)
    out["firefly"] = fly
    dust = Canvas(2, 2)
    dust.rect(0, 0, 2, 2, P["light"], 160)
    out["dust"] = dust

    shadow = Canvas(14, 5)
    shadow.ellipse(7, 2.5, 6, 2, P["ink"], 110)
    out["shadow"] = shadow
    return out


def generate(root, out_dir):
    world = load_world(root)
    maps_dir = os.path.join(out_dir, "maps")
    people_dir = os.path.join(out_dir, "people")
    fx_dir = os.path.join(out_dir, "fx")
    for d in (maps_dir, people_dir, fx_dir):
        os.makedirs(d, exist_ok=True)
    meta = {"poster_slots": {}, "variants": {}}
    # Rue : la grande ville de Bréval-sur-Ondine (tools/art/city.py), une variante par saison
    import city
    meta["variants"]["rue"] = SEASONS
    meta["poster_slots"]["rue"] = city.generate(root, maps_dir)
    for map_id in ("hall", "salle", "coulisses", "bureau", "reserve"):
        base, top = interior(world, map_id)
        if map_id == "bureau":
            for season in SEASONS:
                b2 = Canvas(base.w, base.h)
                b2.paste(base, 0, 0)
                b2.paste(window_view(season), 4 * T + 4, T + 1)
                b2.save(os.path.join(maps_dir, f"bureau_{season}_base.png"))
            meta["variants"]["bureau"] = SEASONS
        else:
            base.save(os.path.join(maps_dir, f"{map_id}_base.png"))
            meta["variants"][map_id] = []
        top.save(os.path.join(maps_dir, f"{map_id}_top.png"))
        interior_lights(world, map_id, (base.w, base.h)).save(os.path.join(maps_dir, f"{map_id}_lights.png"))
        fest = festive_interior(map_id)
        if fest is not None:
            fest.save(os.path.join(maps_dir, f"{map_id}_festive.png"))
    # Intérieurs de tous les bâtiments de la ville (interiors.py)
    import interiors
    for art in interiors.generate(world, maps_dir):
        meta["variants"][art] = []
    meta["poster_slots"]["hall"] = [[5 * T + 6, T - 8, 12, 20], [5 * T + 20, T - 8, 12, 20], [5 * T + 34, T - 8, 12, 20],
                                    [15 * T + 4, T - 8, 12, 20], [15 * T + 18, T - 8, 12, 20], [15 * T + 32, T - 8, 12, 20]]
    for (map_id, upgrade_id), canvas in upgrade_overlays(world).items():
        if map_id == "rue":
            continue  # l'enseigne de la ville est dessinée par city.py
        canvas.save(os.path.join(maps_dir, f"{map_id}_upgrade_{upgrade_id}.png"))
    for sprite_id, spec in PEOPLE.items():
        person_sheet(spec).save(os.path.join(people_dir, f"{sprite_id}.png"))
    seated_audience().save(os.path.join(people_dir, "audience.png"))
    for name, canvas in fx_assets().items():
        canvas.save(os.path.join(fx_dir, f"{name}.png"))
    with open(os.path.join(out_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

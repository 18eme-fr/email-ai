"""Dessin de la grande ville de Bréval-sur-Ondine (carte « rue »).

Lit le plan écrit par city_layout.py dans data/world/world.json (grille, sol,
bâtiments, décors) et produit, pour chaque saison :
  maps/rue_<saison>_base.png, maps/rue_<saison>_top.png, maps/rue_hiver_fetes_top.png,
  maps/rue_lights.png, maps/rue_water_a.png / _b.png (reflets animés),
  maps/rue_upgrade_enseigne.png, maps/city_minimap.png
"""
import math

from pixel import P, Canvas, mix, shade, rng
import world as W0
from world import (T, GRASS, FOLIAGE, FONT5, text, text_width, outlined, cell_seed, noise_tile,
                   draw_tree, draw_lamp, draw_morris, draw_bench, draw_flowers, draw_table, draw_fountain,
                   draw_sign, double_door, facade_theatre, facade_mairie, facade_cafe, facade_imprimerie)

# Lettres supplémentaires pour les enseignes de la ville.
FONT5.update({
    "G": ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
    "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "È": ["01000", "11111", "10000", "11110", "10000", "10000", "11111"],
    "-": ["000", "000", "000", "111", "000", "000", "000"],
    ".": ["0", "0", "0", "0", "0", "0", "1"],
    "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
})

SEASONS = W0.SEASONS
ROOF_BANDS = ((4, 8), (22, 29), (35, 40), (46, 53))


def sign(c, cx, y, label, bg, fg, frame=P["gold1"]):
    w = text_width(label) + 6
    x = cx - w // 2
    c.rect(x, y, w, 11, bg)
    c.frame(x, y, w, 11, frame)
    text(c, x + 3, y + 2, label, fg)


def roof(c, x0, y0, w, h, col, season, style="tiles"):
    dark = shade(col, 0.78)
    c.rect(x0, y0, w, h, col)
    if style == "tiles":
        for yy in range(y0, y0 + h, 4):
            c.hline(x0, x0 + w - 1, yy, dark)
            off = 0 if ((yy - y0) // 4) % 2 == 0 else 4
            for xx in range(x0 + off, x0 + w, 8):
                c.vline(xx, yy, yy + 3, dark)
    elif style == "zinc":
        for xx in range(x0, x0 + w, 6):
            c.vline(xx, y0, y0 + h - 1, shade(col, 1.12))
    elif style == "flat":
        c.frame(x0, y0, w, h, dark)
        c.rect(x0 + 6, y0 + 3, 10, 6, P["grey1"])
        c.rect(x0 + w - 20, y0 + 4, 8, 5, P["grey1"])
    elif style == "glass":
        for xx in range(x0, x0 + w, 12):
            c.vline(xx, y0, y0 + h - 1, shade(col, 0.7))
        for yy in range(y0, y0 + h, 6):
            c.hline(x0, x0 + w - 1, yy, shade(col, 0.85))
    c.hline(x0, x0 + w - 1, y0 + h - 1, P["ink"])
    if season == "hiver":
        c.rect(x0, y0, w, max(3, h // 2), P["white"])
        r = rng(x0 * 7 + y0)
        for _ in range(w // 3):
            c.set(x0 + r.randrange(w), y0 + h // 2 + r.randrange(max(1, h // 2)), P["white"])


def windows(c, x0, y0, w, rows, cols, ww, wh, frame_col, glass, gap_y=4, out=None, balcony=None):
    if cols <= 0:
        return
    span = w // cols
    for r_ in range(rows):
        for k in range(cols):
            wx = x0 + k * span + (span - ww) // 2
            wy = y0 + r_ * (wh + gap_y)
            c.rect(wx - 1, wy - 1, ww + 2, wh + 2, frame_col)
            c.rect(wx, wy, ww, wh, glass)
            c.hline(wx, wx + ww - 1, wy, shade(glass, 1.3))
            if balcony:
                c.rect(wx - 2, wy + wh + 1, ww + 4, 2, balcony)
            if out is not None:
                out.append((wx, wy, ww, wh))


def door_px(cells, y_px_bottom):
    xs = [d[0] for d in cells]
    return min(xs) * T, (max(xs) - min(xs) + 1) * T


def paint_building(c, top, b, season, lights):
    x, y, w, h = b["rect"]
    X0, Y0, PW, PH = x * T, y * T, w * T, h * T
    style = b["style"]
    doors = b["doors"]
    dx, dw = door_px(doors, Y0 + PH)
    win = []
    if style == "theatre":
        facade_theatre(c, X0, Y0, PW, PH, season)
        for i in range(5):
            wx = X0 + 22 + i * 34
            win.append((wx + 1, Y0 + 43, 12, 16))
        lights.append(("marquee", X0 + PW // 2, Y0 + PH - 30))
    elif style == "mairie":
        facade_mairie(c, X0, Y0 + T, PW, PH - T, season)
        roof(c, X0, Y0, PW, T + 4, P["blue"], season, "zinc")
        sign(c, X0 + PW // 2, Y0 + T + 14, "MAIRIE", P["cream"], P["navy"], P["navy"])
        c.ellipse(X0 + PW // 2, Y0 + 8, 6, 6, P["cream"])
        c.ellipse(X0 + PW // 2, Y0 + 8, 4, 4, P["white"])
        c.set(X0 + PW // 2, Y0 + 5, P["ink"])
        c.set(X0 + PW // 2 + 2, Y0 + 8, P["ink"])
        windows(c, X0 + 6, Y0 + 2 * T + 14, PW - 12, 2, 5, 12, 14, P["navy"], P["blue"], 6, win)
    elif style == "cafe":
        facade_cafe(c, X0, Y0, PW, PH, season)
        win += [(X0 + 7, Y0 + 43, 28, 32), (X0 + PW - 35, Y0 + 43, 28, 18)]
    elif style == "imprimerie":
        facade_imprimerie(c, X0, Y0, PW, PH, season)
        win.append((X0 + 5, Y0 + 27, PW - 10, 24))
    else:
        spec = STYLES.get(style, STYLES["shop"])
        wall, roof_col, roof_style, label, label_bg, label_fg = spec["wall"], spec["roof"], spec["roof_style"], spec.get("sign", b["label"].upper()), spec["sign_bg"], spec["sign_fg"]
        roof_h = spec.get("roof_h", 22)
        c.rect(X0, Y0 + roof_h, PW, PH - roof_h, wall)
        # texture du mur
        if spec.get("brick"):
            for yy in range(Y0 + roof_h, Y0 + PH, 5):
                c.hline(X0, X0 + PW - 1, yy, shade(wall, 0.85))
                off = 0 if ((yy - Y0) // 5) % 2 == 0 else 5
                for xx in range(X0 + off, X0 + PW, 10):
                    c.vline(xx, yy, yy + 4, shade(wall, 0.85))
        elif spec.get("panels"):
            for xx in range(X0, X0 + PW, 16):
                c.vline(xx, Y0 + roof_h, Y0 + PH - 1, shade(wall, 0.9))
        roof(c, X0, Y0, PW, roof_h, roof_col, season, roof_style)
        rows = spec.get("rows", max(1, (PH - roof_h - 40) // 22))
        cols = max(2, PW // spec.get("col_w", 20))
        windows(c, X0 + 4, Y0 + roof_h + 8, PW - 8, rows, cols, spec.get("win_w", 10), spec.get("win_h", 12),
                spec.get("frame", P["ink"]), spec.get("glass", P["blue"]), spec.get("gap", 8), win, spec.get("balcony"))
        if spec.get("shopfront"):
            sy = Y0 + PH - 24
            c.rect(X0 + 2, sy, PW - 4, 22, spec.get("front", P["paper"]))
            for k in range(X0 + 4, X0 + PW - 4, 14):
                if not (dx - 2 <= k <= dx + dw):
                    c.rect(k, sy + 3, 10, 14, spec.get("glass", P["sky"]))
                    win.append((k, sy + 3, 10, 14))
                    r = rng(k)
                    for _ in range(3):
                        c.set(k + r.randrange(10), sy + 8 + r.randrange(8), [P["velvet3"], P["gold2"], P["green1"], P["purple2"]][r.randrange(4)])
            awning = spec.get("awning")
            if awning:
                for i in range(0, PW, 8):
                    c.rect(X0 + i, sy - 8, 8, 7, awning if (i // 8) % 2 == 0 else P["cream"])
                    c.set(X0 + i + 4, sy - 1, awning)
        sign_y = Y0 + roof_h + 1 if not spec.get("shopfront") else Y0 + PH - 24 - 20
        sign(c, X0 + PW // 2, sign_y, label, label_bg, label_fg, spec.get("sign_frame", P["gold1"]))
        if spec.get("extra"):
            spec["extra"](c, X0, Y0, PW, PH, season)
        # porte(s)
        door_h = 20
        if dw >= 2 * T:
            double_door(c, dx, Y0 + PH - door_h, spec.get("door", P["wood2"]), h=door_h)
        else:
            c.rect(dx + 1, Y0 + PH - door_h, T - 2, door_h, P["ink"])
            c.rect(dx + 2, Y0 + PH - door_h + 1, T - 4, door_h - 1, spec.get("door", P["wood2"]))
            c.set(dx + T - 5, Y0 + PH - 10, P["gold3"])
        c.hline(X0, X0 + PW - 1, Y0 + PH - 1, shade(wall, 0.6))
    for wr in win:
        lights.append(("window", wr))


def _cinema_extra(c, x0, y0, w, h, season):
    c.rect(x0 + 10, y0 + h - 44, w - 20, 10, P["ink"])
    for i in range(x0 + 12, x0 + w - 12, 3):
        c.set(i, y0 + h - 43, P["light"])
        c.set(i, y0 + h - 36, P["light"])
    text(c, x0 + w // 2 - text_width("FILM DU MOIS") // 2, y0 + h - 42, "FILM DU MOIS", P["gold3"])


def _conservatoire_extra(c, x0, y0, w, h, season):
    for i in range(4):
        cx = x0 + 16 + i * (w - 32) // 3
        c.rect(cx - 2, y0 + 30, 5, h - 52, P["cream"])
    for i, nx in enumerate(range(x0 + 20, x0 + w - 20, 24)):
        c.rect(nx, y0 + 26 + (i % 2) * 2, 2, 6, P["ink"])
        c.ellipse(nx, y0 + 32 + (i % 2) * 2, 2, 1.5, P["ink"])


def _ecole_extra(c, x0, y0, w, h, season):
    c.vline(x0 + w - 10, y0 + 8, y0 + 34, P["grey0"])
    for i, col in enumerate([(40, 70, 160), P["white"], (200, 40, 50)]):
        c.rect(x0 + w - 9 + i * 3, y0 + 9, 3, 7, col)
    motto = "LIBERTE EGALITE FRATERNITE"
    if text_width(motto) > w - 24:
        motto = "LIBERTE EGALITE"
    text(c, x0 + 8, y0 + h - 40, motto, P["navy"])


def _tour_extra(c, x0, y0, w, h, season):
    r = rng(x0 + y0)
    for _ in range(3):
        bx = x0 + 6 + r.randrange(w - 16)
        by = y0 + 30 + r.randrange(h - 70)
        for i in range(6):
            c.set(bx + i, by, [P["velvet3"], P["sky"], P["gold3"], P["white"]][r.randrange(4)])
    c.ellipse(x0 + w - 12, y0 + 8, 4, 3, P["grey3"])
    c.vline(x0 + w - 12, y0 + 8, y0 + 13, P["grey1"])


def _maison_extra(c, x0, y0, w, h, season):
    for i, col in enumerate([P["velvet4"], P["gold3"], P["teal"], P["purple2"], P["orange"]]):
        c.rect(x0 + 6 + i * 22, y0 + h - 52, 18, 6, col)


def _halle_extra(c, x0, y0, w, h, season):
    for xx in range(x0 + 8, x0 + w - 4, 24):
        c.rect(xx, y0 + 24, 3, h - 24, P["navy"])
    c.rect(x0, y0 + 24, w, 3, P["navy"])


def _siege_extra(c, x0, y0, w, h, season):
    for i in range(0, w, 6):
        c.vline(x0 + i, y0 + 20, y0 + h - 30, shade(P["sky"], 0.9))
    c.ellipse(x0 + 18, y0 + 30, 8, 8, P["gold3"])
    c.ellipse(x0 + 18, y0 + 30, 5, 5, P["orange"])


def _fabrique_extra(c, x0, y0, w, h, season):
    c.rect(x0 + w - 14, y0 - 2, 8, 22, P["velvet1"])
    for i, col in enumerate([P["velvet4"], P["teal"], P["gold3"], P["purple2"]]):
        c.rect(x0 + 10 + i * 30, y0 + 40, 22, 26, col)
        c.rect(x0 + 12 + i * 30, y0 + 42, 18, 22, shade(col, 0.8))


def _gare_extra(c, x0, y0, w, h, season):
    cx, cy = x0 + w - 30, y0 + 9
    c.ellipse(cx, cy, 8, 8, P["gold1"])
    c.ellipse(cx, cy, 6, 6, P["white"])
    c.vline(cx, cy - 5, cy, P["ink"])
    c.hline(cx, cx + 3, cy, P["ink"])


STYLES = {
    "gare": {"wall": (214, 196, 160), "roof": P["velvet2"], "roof_style": "tiles", "sign": "GARE DE BREVAL", "sign_bg": P["navy"], "sign_fg": P["cream"], "rows": 1, "col_w": 26, "win_w": 14, "win_h": 18, "glass": P["sky"], "extra": _gare_extra, "roof_h": 18},
    "fabrique": {"wall": (150, 92, 76), "roof": P["grey1"], "roof_style": "zinc", "sign": "LA FABRIQUE", "sign_bg": P["ink"], "sign_fg": P["gold3"], "brick": True, "rows": 0, "extra": _fabrique_extra, "roof_h": 18},
    "hotel": {"wall": (220, 206, 176), "roof": P["blue"], "roof_style": "zinc", "sign": "HOTEL DU COMMERCE", "sign_bg": P["velvet1"], "sign_fg": P["gold3"], "rows": 2, "col_w": 20, "balcony": P["ink"], "roof_h": 16},
    "cinema": {"wall": (120, 46, 60), "roof": P["ink"], "roof_style": "flat", "sign": "CINEMA LE REX", "sign_bg": P["ink"], "sign_fg": P["light"], "rows": 1, "col_w": 26, "extra": _cinema_extra, "sign_frame": P["light"], "door": P["velvet2"]},
    "conservatoire": {"wall": (230, 222, 200), "roof": P["grey1"], "roof_style": "zinc", "sign": "CONSERVATOIRE", "sign_bg": P["navy"], "sign_fg": P["cream"], "rows": 2, "col_w": 24, "win_h": 16, "extra": _conservatoire_extra},
    "boulangerie": {"wall": (230, 214, 180), "roof": P["velvet2"], "roof_style": "tiles", "sign": "BOULANGERIE", "sign_bg": P["gold2"], "sign_fg": P["wood0"], "shopfront": True, "awning": P["gold2"], "front": P["wood3"], "rows": 1, "glass": P["light"]},
    "librairie": {"wall": (196, 168, 140), "roof": P["grey1"], "roof_style": "zinc", "sign": "LIBRAIRIE", "sign_bg": P["green0"], "sign_fg": P["cream"], "shopfront": True, "awning": P["green1"], "front": P["green0"], "rows": 1},
    "fleuriste": {"wall": (226, 200, 200), "roof": P["velvet2"], "roof_style": "tiles", "sign": "FLEURS", "sign_bg": P["cream"], "sign_fg": P["velvet2"], "shopfront": True, "awning": (220, 120, 160), "front": P["cream"], "rows": 1},
    "disquaire": {"wall": (90, 80, 120), "roof": P["grey0"], "roof_style": "flat", "sign": "DISQUES", "sign_bg": P["ink"], "sign_fg": P["purple2"], "shopfront": True, "awning": P["purple1"], "front": P["ink"], "rows": 1},
    "galerie": {"wall": (240, 238, 232), "roof": P["grey2"], "roof_style": "flat", "sign": "GALERIE", "sign_bg": P["white"], "sign_fg": P["ink"], "shopfront": True, "front": P["white"], "rows": 1, "sign_frame": P["ink"]},
    "mediatheque": {"wall": (170, 120, 80), "roof": P["green1"], "roof_style": "flat", "sign": "MEDIATHEQUE", "sign_bg": P["cream"], "sign_fg": P["wood0"], "panels": True, "rows": 2, "col_w": 18, "win_w": 14, "win_h": 18, "glass": P["sky"], "gap": 6},
    "halle": {"wall": (200, 190, 170), "roof": P["teal"], "roof_style": "glass", "sign": "HALLE DU MARCHE", "sign_bg": P["navy"], "sign_fg": P["gold3"], "rows": 1, "col_w": 24, "win_w": 18, "win_h": 30, "glass": P["sky"], "extra": _halle_extra, "roof_h": 24},
    "ecole": {"wall": (196, 120, 90), "roof": P["velvet2"], "roof_style": "tiles", "sign": "ECOLE DES TILLEULS", "sign_bg": P["cream"], "sign_fg": P["navy"], "brick": True, "rows": 2, "col_w": 18, "win_h": 14, "glass": P["sky"], "extra": _ecole_extra},
    "college": {"wall": (226, 214, 180), "roof": P["grey1"], "roof_style": "flat", "sign": "COLLEGE DES COTEAUX", "sign_bg": P["navy"], "sign_fg": P["cream"], "rows": 2, "col_w": 16, "win_h": 14, "glass": P["sky"]},
    "maison": {"wall": (240, 220, 160), "roof": P["orange"], "roof_style": "tiles", "sign": "MAISON DE QUARTIER", "sign_bg": P["teal"], "sign_fg": P["white"], "rows": 1, "col_w": 22, "extra": _maison_extra},
    "siege": {"wall": (120, 160, 200), "roof": P["navy"], "roof_style": "flat", "sign": "ONDINE ENERGIE", "sign_bg": P["navy"], "sign_fg": P["gold3"], "rows": 3, "col_w": 14, "win_w": 12, "win_h": 12, "glass": (170, 210, 240), "gap": 6, "extra": _siege_extra},
    "tour": {"wall": (206, 200, 190), "roof": P["grey1"], "roof_style": "flat", "sign": "RESIDENCE", "sign_bg": P["grey0"], "sign_fg": P["cream"], "rows": 3, "col_w": 20, "win_w": 10, "win_h": 12, "balcony": P["grey0"], "gap": 10, "extra": _tour_extra},
    "shop": {"wall": (210, 200, 180), "roof": P["grey1"], "roof_style": "zinc", "sign_bg": P["cream"], "sign_fg": P["ink"], "shopfront": True, "rows": 1},
}


# --- Sol ----------------------------------------------------------------------------

def paving(c, x0, y0, gx, gy, season):
    base = (196, 178, 150)
    c.rect(x0, y0, T, T, base)
    for yy in range(0, T, 4):
        off = 0 if ((gy * 4 + yy // 4) % 2 == 0) else 4
        c.hline(x0, x0 + T - 1, y0 + yy, shade(base, 0.86))
        for xx in range(off, T, 8):
            c.vline(x0 + xx, y0 + yy, y0 + yy + 3, shade(base, 0.86))
    r = rng(cell_seed(gx, gy, 41))
    if season == "hiver":
        for _ in range(5):
            c.set(x0 + r.randrange(T), y0 + r.randrange(T), P["white"])
    if season == "automne" and r.random() < 0.25:
        c.set(x0 + r.randrange(T), y0 + r.randrange(T), FOLIAGE["automne"][1])


def water(c, x0, y0, gx, gy, season, frozen=False):
    if frozen:
        c.rect(x0, y0, T, T, (200, 220, 236))
        r = rng(cell_seed(gx, gy, 51))
        for _ in range(3):
            c.line(x0 + r.randrange(T), y0 + r.randrange(T), x0 + r.randrange(T), y0 + r.randrange(T), (230, 240, 250))
        return
    deep, mid = (50, 92, 140), (70, 120, 170)
    c.rect(x0, y0, T, T, deep)
    for yy in range(0, T, 4):
        for xx in range(((gy + yy // 4) % 2) * 4, T, 8):
            c.hline(x0 + xx, x0 + xx + 2, y0 + yy + 1, mid)


def court(c, x0, y0):
    c.rect(x0, y0, T, T, (70, 130, 110))


def rails_tile(c, x0, y0):
    c.rect(x0, y0, T, T, (120, 112, 104))
    r = rng(x0 * 3 + y0)
    for _ in range(10):
        c.set(x0 + r.randrange(T), y0 + r.randrange(T), (90, 84, 80))
    for xx in range(0, T, 4):
        c.rect(x0 + xx, y0 + 2, 2, 12, P["wood1"])
    c.hline(x0, x0 + T - 1, y0 + 4, P["grey3"])
    c.hline(x0, x0 + T - 1, y0 + 11, P["grey3"])


def bridge(c, x0, y0, gx, gy):
    c.rect(x0, y0, T, T, (170, 150, 120))
    for yy in range(0, T, 4):
        c.hline(x0, x0 + T - 1, y0 + yy, (140, 120, 96))


HOUSE_WALLS = [(222, 200, 160), (200, 150, 120), (230, 214, 186), (178, 160, 140), (206, 180, 130), (190, 120, 100)]
HOUSE_ROOFS = [P["velvet2"], (150, 80, 60), P["grey1"], (120, 70, 60), (96, 92, 110)]


def roofs_backdrop(c, x0, y0, gx, gy, season, facade=False, ridge=False):
    """Pâtés de maisons vus de haut ; la rangée qui borde la rue montre la façade."""
    house = (gx + (gy // 6) * 2) // 3
    roof_c = HOUSE_ROOFS[(house * 7 + gy // 6) % len(HOUSE_ROOFS)]
    if facade:
        wall = HOUSE_WALLS[(house * 5 + gy) % len(HOUSE_WALLS)]
        c.rect(x0, y0, T, T, wall)
        c.rect(x0, y0, T, 3, shade(roof_c, 0.8))
        if (gx + gy) % 3 == 1 and house % 2 == 0:
            c.rect(x0 + 4, y0 + 6, 8, 10, P["wood1"])
            c.rect(x0 + 5, y0 + 7, 6, 9, P["wood2"])
            c.set(x0 + 10, y0 + 11, P["gold2"])
        else:
            c.rect(x0 + 4, y0 + 5, 8, 7, P["ink"])
            c.rect(x0 + 5, y0 + 6, 6, 5, P["sky"] if season != "hiver" else P["light"])
            c.vline(x0 + 8, y0 + 6, y0 + 10, shade(wall, 0.6))
            shutter = [P["green1"], P["blue"], P["velvet3"], P["wood3"]][house % 4]
            c.rect(x0 + 2, y0 + 5, 2, 7, shutter)
            c.rect(x0 + 12, y0 + 5, 2, 7, shutter)
            c.hline(x0 + 3, x0 + 12, y0 + 12, shade(wall, 0.75))
        if (gx + (gy // 6) * 2) % 3 == 0:
            c.vline(x0, y0, y0 + T - 1, shade(wall, 0.7))
        return
    c.rect(x0, y0, T, T, roof_c)
    for yy in range(0, T, 4):
        c.hline(x0, x0 + T - 1, y0 + yy, shade(roof_c, 0.8))
        off = 0 if (yy // 4) % 2 == 0 else 4
        for xx in range(off, T, 8):
            c.vline(x0 + xx, y0 + yy, y0 + yy + 3, shade(roof_c, 0.85))
    if (gx + (gy // 6) * 2) % 3 == 0:
        c.vline(x0, y0, y0 + T - 1, shade(roof_c, 0.6))
    if ridge:
        c.rect(x0, y0, T, 2, shade(roof_c, 1.25))
    if (gx * 7 + gy * 3) % 11 == 0:
        c.rect(x0 + 5, y0 + 2, 5, 8, (150, 90, 70))
        c.rect(x0 + 5, y0 + 2, 5, 2, P["grey0"])
    elif (gx * 5 + gy) % 13 == 0:
        c.rect(x0 + 4, y0 + 4, 7, 6, P["ink"])
        c.rect(x0 + 5, y0 + 5, 5, 4, P["sky"])
    if season == "hiver":
        c.rect(x0, y0, T, 6, P["white"])
        c.rect(x0, y0 + 6, T, 1, P["grey3"])


def hedge(c, top, x0, y0, season):
    col = FOLIAGE["ete"][3] if season != "automne" else (90, 100, 50)
    c.rect(x0, y0 + 2, T, 14, col)
    c.rect(x0, y0 + 2, T, 4, shade(col, 1.25))
    r = rng(x0 + y0)
    for _ in range(6):
        c.set(x0 + r.randrange(T), y0 + 4 + r.randrange(10), shade(col, 0.75))
    if season == "hiver":
        c.rect(x0, y0 + 2, T, 3, P["white"])


# --- Mobilier -------------------------------------------------------------------------

CAR_COLORS = [P["velvet3"], P["blue"], P["grey3"], P["gold2"], P["green1"], P["ink"], P["teal"], P["orange"]]


def draw_car(c, x0, y0, seed, season):
    col = CAR_COLORS[seed % len(CAR_COLORS)]

    def d(o):
        o.rect(1, 4, 30, 10, col)
        o.rect(6, 1, 18, 6, shade(col, 0.85))
        o.rect(8, 2, 6, 4, P["sky"])
        o.rect(16, 2, 6, 4, P["sky"])
        o.hline(1, 30, 9, shade(col, 0.7))
        o.rect(4, 12, 6, 4, P["ink"])
        o.rect(22, 12, 6, 4, P["ink"])
        o.rect(0, 6, 2, 3, P["light"])
        o.rect(30, 6, 2, 3, (220, 60, 60))
        if season == "hiver":
            o.rect(6, 0, 18, 2, P["white"])
    c.paste(outlined(32, 16, d), x0, y0)


def draw_stall(c, top, x0, y0, seed):
    cols = [P["velvet3"], P["green1"], P["gold2"], P["blue"], P["orange"]]
    col = cols[seed % len(cols)]

    def table(o):
        o.rect(1, 6, 30, 9, P["wood3"])
        o.hline(1, 30, 6, P["wood4"])
        r = rng(seed)
        for i in range(10):
            fx = 2 + i * 3
            o.ellipse(fx + 1, 8, 1.5, 1.5, [P["velvet4"], P["green2"], P["orange"], P["gold3"], (180, 90, 170)][r.randrange(5)])
    c.paste(outlined(32, 16, table), x0, y0)

    def awning(o):
        for i in range(0, 32, 6):
            o.rect(i, 0, 6, 7, col if (i // 6) % 2 == 0 else P["cream"])
        o.vline(1, 7, 13, P["grey1"])
        o.vline(30, 7, 13, P["grey1"])
    top.paste(outlined(32, 14, awning), x0, y0 - 10)


def draw_bus_stop(c, top, x0, y0):
    def d(o):
        o.rect(1, 6, 14, 18, (170, 200, 220))
        o.frame(1, 6, 14, 18, P["grey0"])
        o.rect(0, 4, 16, 3, P["navy"])
        o.rect(3, 18, 10, 3, P["wood3"])
        o.rect(10, 0, 5, 5, P["gold3"])
        o.set(12, 2, P["navy"])
    s = outlined(16, 26, d)
    lower = Canvas(16, 16)
    upper = Canvas(16, 16)
    for yy in range(26):
        for xx in range(16):
            p = s.px[xx, yy]
            if p[3]:
                if yy >= 10:
                    lower.set(xx, yy - 10, p[:3])
                else:
                    upper.set(xx, yy + 6, p[:3])
    c.paste(lower, x0, y0)
    top.paste(upper, x0, y0 - 16)


def draw_statue(c, top, x0, y0, season):
    def d(o):
        o.rect(2, 18, 12, 10, P["grey2"])
        o.rect(1, 26, 14, 3, P["grey1"])
        o.rect(5, 6, 6, 12, (120, 140, 130))
        o.ellipse(8, 4, 3, 3, (120, 140, 130))
        o.line(10, 8, 14, 3, (120, 140, 130))
        if season == "hiver":
            o.rect(5, 1, 6, 2, P["white"])
    s = outlined(16, 30, d)
    c.paste(s, x0, y0 - 14)


def draw_bandstand(c, top, x0, y0, season):
    def base(o):
        o.ellipse(24, 30, 22, 14, P["grey3"])
        o.ellipse(24, 30, 20, 12, P["wood3"])
        for a in range(8):
            ang = a * math.pi / 4
            px, py = 24 + math.cos(ang) * 18, 28 + math.sin(ang) * 10
            o.rect(int(px), int(py) - 14, 2, 14, P["cream"])
    c.paste(outlined(48, 48, base), x0, y0)

    def roof_(o):
        o.poly([(4, 22), (24, 0), (44, 22)], P["green1"] if season != "hiver" else P["white"])
        o.rect(4, 20, 40, 4, P["green0"])
        for i in range(4, 44, 4):
            o.set(i, 24, P["gold2"])
    top.paste(outlined(48, 26, roof_), x0, y0 - 8)


def draw_playground(c, x0, y0, w, h, season):
    c.rect(x0, y0, w, h, (220, 200, 150) if season != "hiver" else (236, 240, 246))
    c.frame(x0, y0, w, h, P["wood1"])

    def swing(o):
        o.line(2, 22, 8, 2, P["velvet3"])
        o.line(14, 22, 8, 2, P["velvet3"])
        o.line(30, 22, 24, 2, P["velvet3"])
        o.line(18, 22, 24, 2, P["velvet3"])
        o.hline(6, 26, 2, P["velvet3"])
        o.vline(12, 2, 14, P["grey0"])
        o.vline(20, 2, 14, P["grey0"])
        o.rect(10, 14, 5, 2, P["wood2"])
        o.rect(18, 14, 5, 2, P["wood2"])
    c.paste(outlined(32, 24, swing), x0 + 4, y0 + 4)

    def slide(o):
        o.rect(2, 4, 6, 18, P["blue"])
        o.line(8, 4, 22, 20, P["gold2"])
        o.line(9, 4, 23, 20, P["gold2"])
        o.line(10, 4, 24, 20, P["gold3"])
    if w >= 64:
        c.paste(outlined(26, 24, slide), x0 + w - 32, y0 + 6)


def draw_bin(c, x0, y0):
    def d(o):
        o.rect(4, 5, 8, 10, P["green0"])
        o.rect(3, 4, 10, 2, P["green1"])
    c.paste(outlined(16, 16, d), x0, y0)


def draw_bikes(c, x0, y0, seed):
    def d(o):
        col = [P["velvet3"], P["teal"], P["gold2"]][seed % 3]
        o.ellipse(4, 11, 3, 3, P["ink"])
        o.ellipse(12, 11, 3, 3, P["ink"])
        o.ellipse(4, 11, 2, 2, (0, 0, 0))
        o.line(4, 11, 8, 6, col)
        o.line(8, 6, 12, 11, col)
        o.line(8, 6, 6, 4, col)
        o.hline(10, 13, 5, P["grey0"])
    s = Canvas(16, 16)
    d(s)
    c.paste(s, x0, y0)


def draw_fence(c, x0, y0, mural=False, seed=0):
    if mural:
        c.rect(x0, y0 + 2, T, 14, P["grey2"])
        r = rng(seed)
        cols = [P["velvet4"], P["gold3"], P["teal"], P["purple2"], P["orange"], P["green2"]]
        for _ in range(4):
            c.ellipse(x0 + r.randrange(T), y0 + 4 + r.randrange(10), 2 + r.randrange(3), 2, cols[r.randrange(len(cols))])
        c.hline(x0, x0 + T - 1, y0 + 2, P["grey3"])
        return
    for xx in range(0, T, 4):
        c.vline(x0 + xx, y0 + 4, y0 + 15, P["grey2"])
    c.hline(x0, x0 + T - 1, y0 + 4, P["grey3"])
    c.hline(x0, x0 + T - 1, y0 + 10, P["grey2"])


def draw_garden(c, x0, y0, season):
    c.rect(x0, y0, T, T, P["wood1"])
    for yy in range(2, T, 4):
        c.hline(x0, x0 + T - 1, y0 + yy, P["wood0"])
    if season in ("printemps", "ete", "automne"):
        r = rng(x0 * 5 + y0)
        cols = {"printemps": [P["green2"], P["green1"]], "ete": [P["green1"], P["velvet4"], P["orange"]], "automne": [P["orange"], P["gold2"]]}[season]
        for _ in range(6):
            c.set(x0 + r.randrange(T), y0 + r.randrange(T), cols[r.randrange(len(cols))])
    else:
        c.dither_rect(x0, y0, T, T, P["white"], 0.4)


def draw_kiosk(c, top, x0, y0, season):
    def d(o):
        o.rect(1, 6, 14, 18, (46, 96, 70))
        o.rect(3, 9, 10, 8, P["paper"])
        for i in range(3):
            o.hline(4, 11, 10 + i * 2, P["paper3"])
        o.ellipse(8, 5, 8, 4, (36, 76, 56) if season != "hiver" else P["white"])
    s = outlined(16, 26, d)
    c.paste(s, x0, y0 - 10)


def draw_pot(c, top, x0, y0, season):
    W0.draw_plant(c, top, x0, y0)


def draw_train(c, x0, y0, w, h):
    def d(o):
        o.rect(0, 2, w * T - 1, h * T - 4, (230, 230, 236))
        o.rect(0, 2, w * T - 1, 6, P["blue"])
        o.rect(0, h * T - 10, w * T - 1, 4, P["velvet3"])
        for i in range(6, w * T - 12, 14):
            o.rect(i, 10, 9, 8, P["sky"])
        o.rect(w * T - 14, 6, 12, 14, P["navy"])
    c.paste(outlined(w * T, h * T, d), x0, y0)


def draw_boat(c, x0, y0, seed):
    def d(o):
        col = [P["velvet3"], P["blue"], P["wood3"]][seed % 3]
        o.poly([(0, 6), (28, 6), (24, 13), (4, 13)], col)
        o.rect(4, 6, 20, 2, P["cream"])
        o.rect(12, 0, 2, 6, P["wood1"])
    c.paste(outlined(30, 16, d), x0, y0)


# --- Ville ----------------------------------------------------------------------------

def render(world, season, festive=False):
    m = world["maps"]["rue"]
    g = m["grid"]
    gr = m["ground"]
    Wt, Ht = len(g[0]), len(g)
    base = Canvas(Wt * T, Ht * T, P["ink"])
    top = Canvas(Wt * T, Ht * T)
    lights = []
    pond = None
    for d in m.get("decor", []):
        if d["kind"] == "ducks":
            pond = d["rect"]

    def in_roof_band(y):
        return any(a <= y <= b for a, b in ROOF_BANDS)
    # 1. Sol
    for y in range(Ht):
        for x in range(Wt):
            k = gr[y][x]
            x0, y0 = x * T, y * T
            if k == "_":
                W0.ground(base, x0, y0, "_", x, y, season)
            elif k in "=z":
                W0.ground(base, x0, y0, k, x, y, season)
            elif k == "+":
                paving(base, x0, y0, x, y, season)
            elif k == "~":
                frozen = season == "hiver" and pond and pond[0] <= x < pond[0] + pond[2] and pond[1] <= y < pond[1] + pond[3]
                water(base, x0, y0, x, y, season, frozen)
            elif k == ":":
                court(base, x0, y0)
            elif k == "P":
                bridge(base, x0, y0, x, y)
            elif k == "r":
                rails_tile(base, x0, y0)
            elif k == "X":
                if in_roof_band(y) and 0 < x < Wt - 1 and 0 < y:
                    facade = y + 1 < Ht and g[y + 1][x] != "X"
                    ridge = g[y - 1][x] != "X"
                    roofs_backdrop(base, x0, y0, x, y, season, facade, ridge)
                else:
                    W0.backdrop(base, x0, y0, season, cell_seed(x, y))
            elif k == "H":
                base.rect(x0, y0, T, T, (110, 100, 110))
            else:
                W0.ground(base, x0, y0, "g", x, y, season)
    # Quais : bordure de pierre le long de l'eau ; garde-corps des ponts.
    for y in range(Ht):
        for x in range(Wt):
            if gr[y][x] == "~":
                if y > 0 and gr[y - 1][x] not in "~P":
                    base.rect(x * T, y * T, T, 3, P["grey2"])
                if y < Ht - 1 and gr[y + 1][x] not in "~P":
                    base.rect(x * T, y * T + T - 3, T, 3, P["grey1"])
                if x > 0 and gr[y][x - 1] not in "~P":
                    base.rect(x * T, y * T, 3, T, P["grey2"])
                if x < Wt - 1 and gr[y][x + 1] not in "~P":
                    base.rect(x * T + T - 3, y * T, 3, T, P["grey2"])
            if gr[y][x] == "P" and (gr[y][x - 1] != "P" or gr[y][x + 1] != "P"):
                xx = x * T + (0 if gr[y][x - 1] != "P" else T - 3)
                if any(gr[yy][x] == "~" for yy in range(max(0, y - 1), min(Ht, y + 2))):
                    base.rect(xx, y * T, 3, T, P["grey3"])
                    top.rect(xx, y * T - 6, 3, 6, P["grey3"])
    # Terrain de sport : lignes blanches.
    xs = [x for y in range(Ht) for x in range(Wt) if g[y][x] == ":"]
    ys = [y for y in range(Ht) for x in range(Wt) if g[y][x] == ":"]
    if xs:
        cx0, cy0, cx1, cy1 = min(xs) * T + 4, min(ys) * T + 4, (max(xs) + 1) * T - 5, (max(ys) - 0) * T - 5
        base.frame(cx0, cy0, cx1 - cx0, cy1 - cy0, P["white"])
        base.vline((cx0 + cx1) // 2, cy0, cy1, P["white"])
        base.ellipse((cx0 + cx1) // 2, (cy0 + cy1) // 2, 10, 10, P["white"])
        base.ellipse((cx0 + cx1) // 2, (cy0 + cy1) // 2, 9, 9, (70, 130, 110))
        for gx_ in (cx0, cx1 - 10):
            base.frame(gx_, (cy0 + cy1) // 2 - 12, 10, 24, P["white"])
    # Bordures de trottoir
    for y in range(Ht):
        for x in range(Wt):
            if gr[y][x] == "_" and y + 1 < Ht and gr[y + 1][x] in "=z":
                base.hline(x * T, x * T + T - 1, y * T + T - 1, P["grey3"])
            if gr[y][x] == "_" and y > 0 and gr[y - 1][x] in "=z":
                base.hline(x * T, x * T + T - 1, y * T, P["grey3"])
    # 2. Décors fixes (train, bateaux)
    for d in m.get("decor", []):
        if d["kind"] == "train":
            pass  # le train est un sprite animé (rue_train.png) : il entre en gare et repart
        elif d["kind"] == "boat":
            x, y = d["cell"]
            draw_boat(base, x * T - 6, y * T, x + y)
    # 3. Bâtiments
    for b in m["buildings"]:
        paint_building(base, top, b, season, lights)
    # 4. Objets
    done = set()
    for y in range(Ht):
        for x in range(Wt):
            k = g[y][x]
            x0, y0 = x * T, y * T
            if (x, y) in done:
                continue
            if k == "T":
                if gr[y][x] == "_" or gr[y][x] == "+":
                    base.rect(x0 + 3, y0 + 10, 10, 5, P["grey1"])
                draw_tree(base, top, x0, y0, season, cell_seed(x, y))
            elif k == "L":
                draw_lamp(base, top, x0, y0)
                lights.append(("lamp", x0 + 8, y0 - 6))
            elif k == "K":
                draw_morris(base, top, x0, y0)
                lights.append(("small", x0 + 8, y0 - 4))
            elif k == "B":
                if x + 1 < Wt and g[y][x + 1] == "B":
                    draw_bench(base, x0, y0, 32)
                    done.add((x + 1, y))
                else:
                    draw_bench(base, x0, y0, 16)
            elif k == "f":
                draw_flowers(base, x0, y0, season)
            elif k == "t":
                draw_table(base, top, x0, y0, season)
            elif k == "F" and (x, y) not in done:
                draw_fountain(base, x0, y0, season)
                done.update({(x + 1, y), (x, y + 1), (x + 1, y + 1)})
            elif k == "v":
                if x + 1 < Wt and g[y][x + 1] == "v":
                    draw_car(base, x0, y0, cell_seed(x, y), season)
                    done.add((x + 1, y))
            elif k == "M":
                if x + 1 < Wt and g[y][x + 1] == "M":
                    draw_stall(base, top, x0, y0, x)
                    done.add((x + 1, y))
            elif k == "A":
                draw_bus_stop(base, top, x0, y0)
            elif k == "Y":
                draw_statue(base, top, x0, y0, season)
            elif k == "Q":
                draw_bandstand(base, top, x0, y0, season)
                for yy in range(3):
                    for xx in range(3):
                        done.add((x + xx, y + yy))
            elif k == "J":
                w = 0
                while x + w < Wt and g[y][x + w] == "J":
                    w += 1
                h = 0
                while y + h < Ht and g[y + h][x] == "J":
                    h += 1
                draw_playground(base, x0, y0, w * T, h * T, season)
                for yy in range(h):
                    for xx in range(w):
                        done.add((x + xx, y + yy))
            elif k == "E":
                draw_bin(base, x0, y0)
            elif k == "V":
                draw_bikes(base, x0, y0, x)
            elif k == "W":
                draw_fence(base, x0, y0, mural=(y == 71), seed=cell_seed(x, y))
            elif k == "G":
                draw_garden(base, x0, y0, season)
            elif k == "N":
                draw_kiosk(base, top, x0, y0, season)
            elif k == "n":
                draw_sign(base, x0, y0)
            elif k == "o":
                draw_pot(base, top, x0, y0, season)
            elif k == "h":
                hedge(base, top, x0, y0, season)
    if season == "hiver":
        r = rng(77)
        for _ in range(900):
            x, y = r.randrange(Wt * T), r.randrange(Ht * T)
            if gr[y // T][x // T] in "g":
                base.set(x, y, P["white"], 180)
    if festive:
        festive_city(top, m)
    return base, top, lights


def festive_city(top, m):
    """Guirlandes au-dessus des trottoirs du centre et de la place."""
    cols = [P["velvet4"], P["gold3"], (120, 200, 120), (130, 180, 240)]
    for (y, x0, x1) in [(21, 31, 77), (29, 31, 46), (41, 31, 77), (17, 1, 110), (30, 83, 110)]:
        for seg in range(x0, x1, 9):
            a, b = seg * T + 8, min(x1, seg + 9) * T + 8
            for x in range(a, b):
                t = (x - a) / max(1, b - a)
                yy = int(y * T - 2 + math.sin(t * math.pi) * 8)
                top.set(x, yy, P["night2"])
                if (x - a) % 6 == 0:
                    top.set(x, yy + 1, cols[(x // 6) % 4])
                    top.set(x, yy + 2, cols[(x // 6) % 4])


def lights_layer(size, lights):
    c = Canvas(*size)

    def glow(cx, cy, r, col, strength):
        for y in range(int(cy - r), int(cy + r)):
            for x in range(int(cx - r), int(cx + r)):
                d = math.hypot(x - cx, y - cy) / r
                if d < 1:
                    c.set(x, y, col, int(strength * (1 - d) ** 1.6))
    r = rng(4)
    for L in lights:
        if L[0] == "lamp":
            glow(L[1], L[2], 30, P["light"], 160)
        elif L[0] == "small":
            glow(L[1], L[2], 14, P["light"], 90)
        elif L[0] == "marquee":
            glow(L[1], L[2], 40, P["light"], 130)
        elif L[0] == "window":
            wx, wy, ww, wh = L[1]
            if r.random() < 0.7:
                c.rect(wx, wy, ww, wh, (255, 214, 140), 210)
    return c


def water_frames(world, skip_pond=False):
    """Reflets animés (deux images alternées). En hiver l'étang gelé reste immobile."""
    m = world["maps"]["rue"]
    gr = m["ground"]
    Wt, Ht = len(gr[0]), len(gr)
    pond = next((d["rect"] for d in m.get("decor", []) if d["kind"] == "ducks"), None)
    frames = []
    for f in range(2):
        c = Canvas(Wt * T, Ht * T)
        for y in range(Ht):
            for x in range(Wt):
                if gr[y][x] == "~":
                    if skip_pond and pond and pond[0] <= x < pond[0] + pond[2] and pond[1] <= y < pond[1] + pond[3]:
                        continue
                    rr = rng(cell_seed(x, y, 60 + f))
                    for _ in range(2):
                        sx, sy = x * T + 3 + rr.randrange(10), y * T + 3 + rr.randrange(10)
                        c.hline(sx, sx + 2, sy, (170, 210, 240), 200)
        frames.append(c)
    return frames


MINI = {"_": (190, 190, 196), "=": (90, 92, 104), "z": (220, 220, 226), "+": (214, 196, 160), ":": (80, 150, 120),
        "~": (70, 120, 180), "P": (170, 150, 120), "g": (110, 160, 90), "X": (70, 60, 80), "H": (150, 80, 70),
        "r": (110, 104, 100)}


def minimap(world):
    m = world["maps"]["rue"]
    g, gr = m["grid"], m["ground"]
    Wt, Ht = len(g[0]), len(g)
    c = Canvas(Wt * 2, Ht * 2)
    for y in range(Ht):
        for x in range(Wt):
            col = MINI.get(gr[y][x], (110, 160, 90))
            if g[y][x] == "T":
                col = (60, 110, 60)
            elif g[y][x] in "dD":
                col = P["gold3"]
            elif g[y][x] == "A":
                col = P["velvet4"]
            c.rect(x * 2, y * 2, 2, 2, col)
    for b in m["buildings"]:
        x, y, w, h = b["rect"]
        c.frame(x * 2, y * 2, w * 2, h * 2, (90, 40, 40))
    return c


def enseigne_overlay(world):
    m = world["maps"]["rue"]
    Wt, Ht = len(m["grid"][0]), len(m["grid"])
    c = Canvas(Wt * T, Ht * T)
    th = [b for b in m["buildings"] if b["id"] == "theatre"][0]
    x, y = th["rect"][0] * T, th["rect"][1] * T
    sx, sy = x + 54, y + 4 * T + 6
    c.rect(sx, sy, 84, 12, P["ink"])
    c.frame(sx, sy, 84, 12, P["gold2"])
    label = "LA LANTERNE"
    text(c, sx + 42 - text_width(label) // 2, sy + 3, label, P["light"], shadow=P["velvet3"])
    for xx in range(sx + 2, sx + 82, 4):
        c.set(xx, sy + 1, P["gold3"])
        c.set(xx, sy + 10, P["gold3"])
    return c


def poster_slots(world):
    m = world["maps"]["rue"]
    th = [b for b in m["buildings"] if b["id"] == "theatre"][0]
    x, y, w, h = th["rect"]
    X0, Y0 = x * T, y * T
    slots = [[X0 + 52, Y0 + h * T - 32, 22, 26], [X0 + w * T - 74, Y0 + h * T - 32, 22, 26]]
    for yy, row in enumerate(m["grid"]):
        for xx, ch in enumerate(row):
            if ch == "K":
                slots.append([xx * T + 3, yy * T - 4, 10, 13])
    return slots


def generate(root, maps_dir, people_dir=None):
    import os
    world = W0.load_world(root)
    lights = []
    for d in world["maps"]["rue"].get("decor", []):
        if d["kind"] == "train":
            _, _, w, h = d["rect"]
            tc = Canvas(w * T, h * T)
            draw_train(tc, 0, 0, w, h)
            tc.save(os.path.join(maps_dir, "rue_train.png"))
    for season in SEASONS:
        base, top, lights = render(world, season)
        base.save(os.path.join(maps_dir, "rue_%s_base.png" % season))
        top.save(os.path.join(maps_dir, "rue_%s_top.png" % season))
        print("ville :", season)
    _, ftop, _ = render(world, "hiver", festive=True)
    ftop.save(os.path.join(maps_dir, "rue_hiver_fetes_top.png"))
    m = world["maps"]["rue"]
    lights_layer((len(m["grid"][0]) * T, len(m["grid"]) * T), lights).save(os.path.join(maps_dir, "rue_lights.png"))
    a, b = water_frames(world)
    a.save(os.path.join(maps_dir, "rue_water_a.png"))
    b.save(os.path.join(maps_dir, "rue_water_b.png"))
    a, b = water_frames(world, skip_pond=True)
    a.save(os.path.join(maps_dir, "rue_water_hiver_a.png"))
    b.save(os.path.join(maps_dir, "rue_water_hiver_b.png"))
    enseigne_overlay(world).save(os.path.join(maps_dir, "rue_upgrade_enseigne.png"))
    minimap(world).save(os.path.join(maps_dir, "city_minimap.png"))
    return poster_slots(world)

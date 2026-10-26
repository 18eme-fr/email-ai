"""Dessin des intérieurs de la ville (cartes « int_* » de world.json).

Chaque intérieur est peint à partir de sa grille et de son « style » (sol, murs,
décor mural) écrits par interiors_layout.py : la même source sert aux
collisions dans le jeu et au dessin ici. Le mobilier est dessiné par caractère,
avec une variante selon le lieu (une « machine » est une presse à l'imprimerie,
un four à la boulangerie, une platine chez le disquaire…).

Sorties (assets/world/maps/) : <art>_base.png, <art>_top.png, <art>_lights.png
"""
import math
import os

from pixel import P, Canvas, shade, rng
import world as W0
from world import T, outlined, cell_seed, noise_tile, text, text_width

# Papier peint, motif, lambris et baguette de chaque lieu.
WALLS = {
    "gare": {"paper": (196, 186, 160), "pattern": (176, 164, 136), "wainscot": P["green0"], "trim": P["gold1"]},
    "fabrique": {"paper": (150, 92, 76), "pattern": (122, 72, 60), "wainscot": P["grey0"], "trim": P["grey2"], "brick": True},
    "hotel": {"paper": P["green0"], "pattern": P["green1"], "wainscot": P["wood1"], "trim": P["gold2"]},
    "mairie": {"paper": (226, 216, 190), "pattern": (206, 194, 166), "wainscot": P["wood1"], "trim": P["gold2"]},
    "cafe": {"paper": (120, 60, 40), "pattern": (96, 46, 32), "wainscot": P["wood0"], "trim": P["gold2"]},
    "imprimerie": {"paper": (170, 170, 160), "pattern": (150, 150, 140), "wainscot": P["grey0"], "trim": P["grey2"], "brick": True},
    "boulangerie": {"paper": (238, 222, 190), "pattern": (220, 200, 160), "wainscot": P["wood2"], "trim": P["gold2"]},
    "cinema": {"paper": P["velvet1"], "pattern": P["velvet0"], "wainscot": P["ink"], "trim": P["gold2"]},
    "conservatoire": {"paper": (220, 214, 200), "pattern": (200, 194, 180), "wainscot": P["wood1"], "trim": P["gold1"]},
    "librairie": {"paper": (150, 110, 70), "pattern": (130, 92, 58), "wainscot": P["wood0"], "trim": P["wood3"]},
    "fleuriste": {"paper": (226, 236, 214), "pattern": (196, 220, 186), "wainscot": P["green1"], "trim": P["white"]},
    "disquaire": {"paper": P["purple0"], "pattern": P["night2"], "wainscot": P["ink"], "trim": P["gold3"]},
    "galerie": {"paper": (240, 238, 232), "pattern": (240, 238, 232), "wainscot": (220, 218, 212), "trim": (200, 198, 192)},
    "mediatheque": {"paper": (210, 170, 110), "pattern": (196, 154, 96), "wainscot": P["wood1"], "trim": P["wood3"]},
    "halle": {"paper": (190, 180, 160), "pattern": (170, 160, 140), "wainscot": P["grey0"], "trim": P["teal"], "brick": True},
    "ecole": {"paper": (236, 222, 170), "pattern": (220, 204, 150), "wainscot": P["blue"], "trim": P["white"]},
    "siege": {"paper": (200, 214, 226), "pattern": (184, 200, 214), "wainscot": P["navy"], "trim": P["teal"]},
    "tour": {"paper": (200, 196, 186), "pattern": (184, 180, 170), "wainscot": P["grey0"], "trim": P["grey2"]},
    "college": {"paper": (190, 214, 220), "pattern": (172, 198, 206), "wainscot": P["teal"], "trim": P["white"]},
    "maison": {"paper": (236, 200, 140), "pattern": (220, 180, 120), "wainscot": P["orange"], "trim": P["gold2"]},
}


# --- Sols ------------------------------------------------------------------------------

def floor(c, kind, x0, y0, gx, gy):
    if kind == "marble":
        W0.floor_marble(c, x0, y0, gx, gy)
    elif kind == "marble_dark":
        for yy in range(2):
            for xx in range(2):
                col = (70, 80, 96) if (gx * 2 + xx + gy * 2 + yy) % 2 == 0 else (92, 104, 120)
                c.rect(x0 + xx * 8, y0 + yy * 8, 8, 8, col)
                c.hline(x0 + xx * 8, x0 + xx * 8 + 7, y0 + yy * 8, shade(col, 1.12))
    elif kind in ("checker", "checker_green"):
        a, b = (P["cream"], P["ink"]) if kind == "checker" else ((226, 232, 214), (110, 150, 110))
        for yy in range(2):
            for xx in range(2):
                col = a if (xx + yy) % 2 == 0 else b
                c.rect(x0 + xx * 8, y0 + yy * 8, 8, 8, col)
        c.hline(x0, x0 + T - 1, y0, shade(a, 0.9))
    elif kind == "tiles_grey":
        c.rect(x0, y0, T, T, (176, 176, 170))
        c.frame(x0, y0, T, T, (150, 150, 146))
        r = rng(cell_seed(gx, gy, 5))
        for _ in range(3):
            c.set(x0 + 1 + r.randrange(14), y0 + 1 + r.randrange(14), (160, 160, 156))
    elif kind == "parquet":
        W0.floor_parquet(c, x0, y0, gx, gy)
    elif kind == "planks":
        W0.floor_planks(c, x0, y0, gx, gy)
    elif kind == "carpet_red":
        c.rect(x0, y0, T, T, P["velvet2"])
        for yy in range(0, T, 8):
            for xx in range(0, T, 8):
                c.set(x0 + xx + 4 - (gy % 2) * 2, y0 + yy + 4, P["gold1"])
        r = rng(cell_seed(gx, gy, 9))
        for _ in range(4):
            c.set(x0 + r.randrange(T), y0 + r.randrange(T), P["velvet1"])
    elif kind == "concrete":
        noise_tile(c, x0, y0, P["grey1"], [P["grey0"], P["grey2"]], cell_seed(gx, gy, 3), 7)
    elif kind == "concrete_light":
        noise_tile(c, x0, y0, (214, 212, 206), [(200, 198, 192), (226, 224, 218)], cell_seed(gx, gy, 3), 5)
    elif kind == "lino":
        c.rect(x0, y0, T, T, (150, 176, 160))
        r = rng(cell_seed(gx, gy, 13))
        for _ in range(6):
            c.set(x0 + r.randrange(T), y0 + r.randrange(T), (130, 160, 144))
        if gy % 3 == 0:
            c.hline(x0, x0 + T - 1, y0, (136, 162, 148))


def rug(c, x0, y0, gx, gy, left, right, top_edge, bottom):
    """Tapis (« , ») : couleur unie bordée d'or."""
    W0.floor_carpet(c, x0, y0, gx, gy, left, right)
    if top_edge:
        c.hline(x0, x0 + T - 1, y0, P["gold1"])
        c.hline(x0, x0 + T - 1, y0 + 1, P["gold2"])
    if bottom:
        c.hline(x0, x0 + T - 1, y0 + T - 1, P["gold1"])
        c.hline(x0, x0 + T - 1, y0 + T - 2, P["gold2"])


# --- Mobilier --------------------------------------------------------------------------

def table(base, top, x0, y0, theme, seed):
    """Table et chaises (café, médiathèque, maison de quartier) ou guéridon et fauteuils (hôtel, accueil)."""
    soft = theme in ("hotel", "siege")
    def d(o):
        if soft:
            for cx in (0, 10):
                o.rect(cx, 3, 6, 9, P["velvet3"] if theme == "hotel" else P["teal"])
                o.rect(cx, 3, 6, 2, shade(P["velvet3"] if theme == "hotel" else P["teal"], 1.25))
            o.ellipse(8, 9, 3, 2, P["wood3"])
        else:
            o.rect(1, 6, 3, 7, P["wood1"])   # chaises
            o.rect(12, 6, 3, 7, P["wood1"])
            o.ellipse(8, 7, 5, 4, P["wood3"] if theme != "cafe" else P["grey3"])
            o.vline(8, 10, 14, P["wood0"])
            r = rng(seed)
            if theme == "cafe":
                o.rect(6, 5, 2, 2, P["white"])
                o.set(10, 6, P["wood0"])
            elif r.random() < 0.6:
                o.rect(5 + r.randrange(4), 5, 4, 3, [P["velvet3"], P["blue"], P["cream"]][r.randrange(3)])
    base.paste(outlined(16, 16, d), x0, y0)


def piano(base, top, x0, y0, w):
    def d(o):
        if w >= 32:
            o.rect(0, 0, w, 12, P["ink"])
            o.rect(1, 1, w - 2, 3, P["night2"])
            o.rect(2, 12, w - 4, 4, P["white"])
            for xx in range(3, w - 4, 3):
                o.vline(xx, 12, 15, P["grey2"])
                if xx % 7:
                    o.rect(xx, 12, 1, 2, P["ink"])
            o.rect(w // 2 - 3, 5, 6, 4, P["cream"])  # partition
        else:
            o.rect(0, 0, w, 14, P["ink"])
            o.rect(2, 10, w - 4, 3, P["white"])
    base.paste(outlined(w, 16, d), x0, y0)


def machine(base, top, x0, y0, w, theme):
    def d(o):
        if theme == "imprimerie":
            o.rect(1, 2, w - 2, 12, P["grey0"])
            o.ellipse(w // 2, 7, 5, 5, P["grey2"])
            o.ellipse(w // 2, 7, 2, 2, P["ink"])
            o.rect(2, 12, w - 4, 3, P["paper"])
            o.set(w - 4, 4, P["velvet4"])
        elif theme == "boulangerie":
            o.rect(0, 0, w, 15, (150, 90, 70))
            o.rect(2, 2, w - 4, 3, (120, 70, 56))
            o.rect(4, 6, w - 8, 7, P["ink"])
            o.rect(5, 7, w - 10, 5, P["orange"])
            o.rect(6, 9, 6, 2, P["gold2"])
        elif theme == "cinema":
            o.rect(1, 0, w - 2, 15, P["velvet3"])
            o.rect(3, 2, w - 6, 7, (250, 240, 200))
            for k in range(6):
                o.set(4 + (k * 5) % (w - 8), 3 + (k * 3) % 5, P["white"])
            o.rect(1, 10, w - 2, 5, P["gold2"])
        elif theme == "disquaire":
            o.rect(0, 4, w, 10, P["wood1"])
            o.ellipse(7, 9, 5, 4, P["ink"])
            o.set(7, 9, P["velvet4"])
            o.line(12, 5, 14, 10, P["grey3"])
        elif theme == "gare":
            o.rect(2, 0, w - 4, 15, P["teal"])
            o.rect(4, 2, w - 8, 6, P["sky"])
            o.rect(5, 10, w - 10, 2, P["ink"])
        elif theme == "tour":
            o.rect(1, -0, w - 2, 15, P["grey2"])
            o.vline(w // 2, 1, 14, P["grey0"])
            o.rect(w - 4, 6, 2, 3, P["velvet4"])
    base.paste(outlined(w, 16, d), x0, y0)


ETAL = {
    "boulangerie": [P["gold2"], P["orange"], (220, 170, 100)],
    "fleuriste": [P["velvet4"], P["gold3"], (240, 160, 200), P["white"], P["purple2"]],
    "disquaire": [P["velvet3"], P["blue"], P["gold2"], P["teal"], P["ink"]],
    "librairie": [P["velvet3"], P["blue"], P["green1"], P["cream"], P["gold2"]],
    "halle": [(220, 60, 50), P["orange"], P["green2"], P["gold3"], (130, 70, 140)],
}


def etal(base, top, x0, y0, w, theme, seed):
    cols = ETAL.get(theme, ETAL["halle"])
    r = rng(seed)

    def d(o):
        if theme == "fleuriste":
            for i in range(0, w, 8):
                o.rect(i + 1, 9, 6, 6, P["grey2"])   # seaux
                o.rect(i + 1, 9, 6, 1, P["grey3"])
                for k in range(7):
                    o.set(i + 1 + r.randrange(6), 2 + r.randrange(7), cols[r.randrange(len(cols))])
                o.vline(i + 3, 6, 9, P["green1"])
                o.vline(i + 5, 5, 9, P["green1"])
        elif theme in ("disquaire", "librairie"):
            o.rect(0, 5, w, 11, P["wood2"])
            o.hline(0, w - 1, 5, P["wood3"])
            for x in range(1, w - 1, 2):
                o.rect(x, 1 + r.randrange(3), 2, 6, cols[r.randrange(len(cols))])
        elif theme == "boulangerie":
            o.rect(0, 0, w, 16, P["wood1"])
            for shelf in range(3):
                o.hline(1, w - 2, 5 + shelf * 5, P["wood3"])
                for x in range(2, w - 4, 5):
                    o.ellipse(x + 2, 3 + shelf * 5, 2, 1, cols[r.randrange(len(cols))])
        else:  # cagettes de primeurs
            o.rect(0, 6, w, 10, P["wood3"])
            o.frame(0, 6, w, 10, P["wood1"])
            for x in range(0, w, 8):
                col = cols[r.randrange(len(cols))]
                for k in range(8):
                    o.set(x + 1 + r.randrange(6), 2 + r.randrange(6), col)
                o.vline(x, 6, 15, P["wood1"])
    base.paste(outlined(w, 16, d), x0, y0)


def pupitre(base, x0, y0, theme):
    def d(o):
        if theme == "conservatoire":
            o.vline(8, 6, 15, P["ink"])
            o.rect(3, 1, 10, 6, P["ink"])
            o.rect(4, 2, 8, 4, P["cream"])
            o.hline(5, 10, 3, P["grey1"])
        else:
            o.rect(1, 2, 14, 8, P["wood3"])
            o.hline(1, 14, 2, P["wood4"])
            o.rect(3, 4, 4, 3, P["cream"])
            o.rect(3, 11, 10, 4, P["blue"] if theme == "ecole" else P["grey1"])  # chaise
    base.paste(outlined(16, 16, d), x0, y0)


def oeuvre(base, top, x0, y0, w, theme, seed):
    r = rng(seed)

    def d(o):
        if theme == "siege":  # maquette de quartier
            o.rect(0, 4, w, 12, P["white"])
            o.rect(1, 5, w - 2, 10, (150, 190, 130))
            for k in range(6):
                bx, by = 2 + r.randrange(w - 8), 6 + r.randrange(5)
                o.rect(bx, by, 4, 3, [P["cream"], P["grey3"], P["sky"]][k % 3])
            o.hline(1, w - 2, 12, P["sky"])
        else:  # socle + sculpture
            o.rect(w // 2 - 5, 8, 10, 8, P["white"])
            o.hline(w // 2 - 5, w // 2 + 4, 8, (225, 225, 225))
            col = [P["velvet3"], P["teal"], P["gold2"], P["grey0"], P["orange"]][r.randrange(5)]
            if w >= 32:
                o.poly([(w // 2 - 8, 8), (w // 2 - 2, -0), (w // 2 + 3, 4), (w // 2 + 9, 8)], col)
            else:
                o.ellipse(w // 2, 4, 3, 4, col)
    h = 16
    base.paste(outlined(w, h, d), x0, y0)


def stairs(base, x0, y0, w, h):
    """Escalier qui monte vers les étages (non praticable : réservé aux habitants)."""
    for i in range(h // 3):
        y = y0 + i * 3
        base.rect(x0, y, w, 3, shade(P["wood3"], 0.7 + i * 0.03))
        base.hline(x0, x0 + w - 1, y, shade(P["wood4"], 0.8 + i * 0.02))
    base.rect(x0, y0, 2, h, P["wood0"])
    base.rect(x0 + w - 2, y0, 2, h, P["wood0"])
    base.rect(x0 + 2, y0, w - 4, 6, P["ink"], 120)


def mailboxes(base, x0, y0, w):
    def d(o):
        o.rect(0, 0, w, 16, P["grey2"])
        for yy in range(1, 15, 5):
            for xx in range(1, w - 4, 6):
                o.rect(xx, yy, 5, 4, P["grey3"])
                o.hline(xx + 1, xx + 3, yy + 1, P["ink"])
    base.paste(outlined(w, 16, d), x0, y0 - 4)


def lockers(base, x0, y0, w):
    def d(o):
        o.rect(0, 0, w, 24, P["blue"])
        for xx in range(0, w, 6):
            o.vline(xx, 0, 23, P["navy"])
            o.rect(xx + 2, 4, 2, 1, P["grey3"])
            o.rect(xx + 2, 16, 2, 1, P["grey3"])
        o.hline(0, w - 1, 12, P["navy"])
    base.paste(outlined(w, 24, d), x0, y0 - 8)


def stage_edge(base, x0, y0):
    base.rect(x0, y0, T, T, P["wood1"])
    base.hline(x0, x0 + T - 1, y0, P["wood3"])
    base.hline(x0, x0 + T - 1, y0 + T - 1, P["ink"])
    base.rect(x0 + 6, y0 + 4, 4, 2, P["grey3"])


def counter(base, x0, y0, w, theme):
    if theme in ("cafe", "boulangerie", "cinema"):
        def d(o):
            o.rect(0, 2, w, 14, P["wood1"])
            o.rect(0, 2, w, 5, P["grey3"] if theme == "cafe" else (P["cream"] if theme == "boulangerie" else P["gold2"]))
            o.hline(0, w - 1, 2, P["white"])
            if theme == "cafe":
                o.rect(4, 0, 6, 4, P["grey2"])   # percolateur
                o.rect(5, 1, 4, 2, P["grey3"])
                for x in range(14, w - 4, 7):
                    o.rect(x, 3, 3, 3, P["white"])
            elif theme == "boulangerie":
                o.rect(2, 8, w - 4, 6, (200, 220, 230))  # vitrine réfrigérée
                for x in range(4, w - 6, 6):
                    o.ellipse(x + 2, 11, 2, 1, [P["gold2"], P["velvet4"], P["orange"]][x % 3])
            else:
                o.rect(w - 12, 3, 9, 3, P["ink"])  # caisse
        base.paste(outlined(w, 16, d), x0, y0 - 2)
    else:
        W0.draw_counter(base, x0, y0 - 2, w)
        if theme in ("gare", "hotel", "mairie", "siege", "mediatheque"):
            # sonnette, écran ou registre posés dessus
            base.rect(x0 + 6, y0 + 1, 8, 4, P["cream"] if theme != "siege" else P["teal"])
            base.set(x0 + w - 8, y0 + 2, P["gold3"])


# --- Décor mural -----------------------------------------------------------------------

def wall_item(base, item, theme, season="ete"):
    kind = item[0]
    x = item[1] * T
    w = item[2] * T if len(item) > 2 else T
    y = T
    if kind == "window":
        base.rect(x + 2, y - 10, w - 4, 20, P["wood1"])
        view = W0.window_view(season, w - 8, 16)
        base.paste(view, x + 4, y - 8)
        base.vline(x + w // 2, y - 8, y + 7, P["wood1"])
        base.hline(x + 4, x + w - 5, y, P["wood1"])
    elif kind == "board":  # tableau des départs
        base.rect(x, y - 10, w, 22, P["ink"])
        base.frame(x, y - 10, w, 22, P["grey1"])
        r = rng(4)
        for row in range(4):
            yy = y - 7 + row * 5
            for xx in range(x + 3, x + w - 4, 3):
                if r.random() < 0.7:
                    base.rect(xx, yy, 2, 3, P["gold3"] if xx < x + w // 2 else P["white"])
    elif kind == "clock":
        base.ellipse(x + 8, y - 2, 6, 6, P["white"])
        base.ellipse(x + 8, y - 2, 5, 5, P["cream"])
        base.vline(x + 8, y - 6, y - 2, P["ink"])
        base.hline(x + 8, x + 11, y - 2, P["ink"])
    elif kind in ("poster", "posters"):
        n = 1 if kind == "poster" else max(1, w // 12)
        cols = [P["velvet3"], P["gold2"], P["teal"], P["orange"], P["purple1"], P["blue"]]
        for i in range(n):
            px = x + 2 + i * 12
            col = cols[(item[1] + i) % len(cols)]
            base.rect(px, y - 8, 10, 14, col)
            base.rect(px + 2, y - 6, 6, 5, shade(col, 1.3))
            base.hline(px + 2, px + 7, y + 1, P["cream"])
            base.hline(px + 2, px + 5, y + 3, P["cream"])
    elif kind == "graffiti":
        r = rng(item[1])
        for i in range(w // 4):
            col = [P["velvet4"], P["gold3"], P["teal"], P["purple2"], P["sky"]][r.randrange(5)]
            base.ellipse(x + 4 + i * 4, y - 2 + r.randrange(6), 3, 2, col)
        base.hline(x + 4, x + w - 6, y + 4, P["white"])
    elif kind == "keys":
        base.rect(x, y - 8, w, 14, P["wood1"])
        for i in range(0, w - 4, 5):
            base.set(x + 3 + i, y - 5, P["gold3"])
            base.set(x + 3 + i, y + 1, P["gold3"])
            base.vline(x + 3 + i, y - 4, y - 2, P["gold2"])
    elif kind in ("frame", "painting"):
        fw = 12 if kind == "frame" else 20
        fx = x + (T - fw) // 2 if kind == "frame" else x - 2
        r = rng(item[1] * 7)
        base.rect(fx, y - 9, fw, 14, P["gold1"] if kind == "frame" else P["ink"])
        base.rect(fx + 1, y - 8, fw - 2, 12, [P["sky"], P["green1"], P["velvet3"], P["orange"]][r.randrange(4)])
        for _ in range(6):
            base.rect(fx + 2 + r.randrange(fw - 5), y - 7 + r.randrange(8), 3, 2,
                      [P["gold3"], P["white"], P["navy"], P["teal"], P["velvet4"]][r.randrange(5)])
    elif kind == "bust":
        base.rect(x + 4, y + 2, 24, 4, P["grey2"])
        base.ellipse(x + 16, y - 4, 5, 6, P["white"])
        base.rect(x + 11, y, 10, 3, P["white"])
        base.rect(x + 12, y - 9, 8, 2, P["velvet3"])  # bonnet phrygien
    elif kind == "flag":
        base.vline(x + 3, y - 10, y + 6, P["gold1"])
        base.rect(x + 4, y - 9, 3, 7, P["blue"])
        base.rect(x + 7, y - 9, 3, 7, P["white"])
        base.rect(x + 10, y - 9, 3, 7, P["velvet3"])
    elif kind == "bottles":
        base.rect(x, y - 2, w, 2, P["wood3"])
        base.rect(x, y + 5, w, 2, P["wood3"])
        r = rng(9)
        for xx in range(x + 2, x + w - 2, 4):
            for yy in (y - 8, y - 1):
                base.rect(xx, yy, 2, 6, [P["green1"], P["velvet2"], P["gold2"], P["sky"]][r.randrange(4)])
                base.set(xx, yy, P["white"])
    elif kind == "mirror":
        base.rect(x, y - 9, 16, 14, P["gold1"])
        base.rect(x + 2, y - 7, 12, 10, (190, 210, 220))
        base.line(x + 4, y - 5, x + 8, y - 1, P["white"])
    elif kind == "slate":
        base.rect(x, y - 9, w, 14, P["wood1"])
        base.rect(x + 1, y - 8, w - 2, 12, P["ink"])
        for i in range(3):
            base.hline(x + 3, x + w - 6 - i * 3, y - 6 + i * 4, P["white"])
    elif kind == "screen":
        base.rect(x, y - 12, w, 22, P["white"])
        base.frame(x - 1, y - 13, w + 2, 24, P["ink"])
        base.rect(x + 2, y - 10, w - 4, 18, (200, 214, 230))
        base.ellipse(x + w // 2, y - 1, 30, 6, (170, 190, 210))
    elif kind == "staff":  # portée musicale décorative
        for i in range(5):
            base.hline(x, x + w - 1, y - 6 + i * 2, P["ink"])
        for i in range(0, w - 6, 9):
            base.ellipse(x + 4 + i, y - 6 + (i * 3) % 8, 2, 1, P["ink"])
    elif kind == "records":
        for i in range(0, w - 4, 14):
            base.ellipse(x + 8 + i, y - 2, 6, 6, P["ink"])
            base.ellipse(x + 8 + i, y - 2, 2, 2, [P["velvet4"], P["gold3"], P["teal"]][(i // 14) % 3])
    elif kind == "glass":  # verrière de la halle
        for xx in range(x, x + w, 8):
            base.rect(xx, y - 12, 7, 18, (170, 200, 210))
            base.vline(xx + 7, y - 12, y + 5, P["teal"])
        base.hline(x, x + w - 1, y - 4, P["teal"])
    elif kind == "blackboard":
        base.rect(x, y - 10, w, 20, P["wood1"])
        base.rect(x + 2, y - 8, w - 4, 16, (40, 70, 60))
        txt = "LE THEATRE"
        text(base, x + w // 2 - text_width(txt) // 2, y - 6, txt, P["white"])
        base.hline(x + 6, x + w - 8, y + 4, P["cream"])
    elif kind == "map":
        base.rect(x, y - 9, w, 15, P["cream"])
        base.frame(x, y - 9, w, 15, P["wood1"])
        base.poly([(x + 8, y - 6), (x + 22, y - 7), (x + 30, y), (x + 16, y + 3), (x + 6, y)], (150, 190, 130))
    elif kind == "logo":
        base.rect(x, y - 8, w, 14, P["white"])
        base.ellipse(x + 10, y - 1, 5, 5, P["gold2"])
        t = "ONDINE"
        text(base, x + 18, y - 4, t, P["navy"])
    elif kind == "screen_small":
        base.rect(x, y - 9, w, 14, P["ink"])
        base.rect(x + 2, y - 7, w - 4, 10, P["teal"])
        base.hline(x + 4, x + w - 8, y - 3, P["white"])
    elif kind == "garland":
        cols = [P["velvet4"], P["gold3"], P["teal"], P["orange"], P["purple2"]]
        for i, xx in enumerate(range(x, x + w, 6)):
            yy = y - 10 + int(2 * math.sin(i))
            base.poly([(xx, yy), (xx + 5, yy), (xx + 2, yy + 5)], cols[i % len(cols)])


def upper_wall(c, x0, y0, gx, theme):
    """Haut du mur du fond (rangée 0) : le mur paraît plus haut, les cadres y tiennent."""
    w = WALLS[theme]
    c.rect(x0, y0, T, T, w["paper"])
    if w.get("brick"):
        for yy in range(4, T, 3):
            c.hline(x0, x0 + T - 1, y0 + yy, w["pattern"])
            off = 0 if (yy // 3) % 2 == 0 else 4
            for xx in range(off, T, 8):
                c.vline(x0 + xx, y0 + yy, y0 + yy + 2, w["pattern"])
    else:
        for xx in (3, 11):
            c.set(x0 + xx, y0 + 9, w["pattern"])
            c.set(x0 + xx - 1, y0 + 10, w["pattern"])
            c.set(x0 + xx + 1, y0 + 10, w["pattern"])
    c.rect(x0, y0, T, 3, P["wood0"])
    c.hline(x0, x0 + T - 1, y0 + 3, w["trim"])
    c.hline(x0, x0 + T - 1, y0 + 4, shade(w["paper"], 0.8))


# --- Assemblage -------------------------------------------------------------------------

def runs(g, ch):
    """Suites horizontales du caractère `ch` : [(x, y, longueur)]."""
    out = []
    for y, row in enumerate(g):
        x = 0
        while x < len(row):
            if row[x] == ch:
                x1 = x
                while x1 < len(row) and row[x1] == ch:
                    x1 += 1
                out.append((x, y, x1 - x))
                x = x1
            else:
                x += 1
    return out


def blocks(g, ch):
    """Rectangles du caractère `ch` (escaliers 2×2…) : [(x, y, w, h)]."""
    seen = set()
    out = []
    for (x, y, w) in runs(g, ch):
        if (x, y) in seen:
            continue
        h = 1
        while y + h < len(g) and g[y + h][x:x + w] == ch * w:
            h += 1
        for yy in range(y, y + h):
            seen.add((x, yy))
        out.append((x, y, w, h))
    return out


def paint(m, theme_walls):
    g = m["grid"]
    style = m["style"]
    theme = style["walls"]
    Wd, Hd = len(g[0]), len(g)
    base = Canvas(Wd * T, Hd * T, P["ink"])
    top = Canvas(Wd * T, Hd * T)
    lights = Canvas(Wd * T, Hd * T)
    W0.WALLS[theme] = WALLS[theme]

    def ch(x, y):
        return g[y][x] if 0 <= y < Hd and 0 <= x < Wd else "#"

    # Sols (sous le mobilier aussi)
    for y in range(Hd):
        for x in range(Wd):
            if ch(x, y) == "#":
                continue
            x0, y0 = x * T, y * T
            if ch(x, y) == ",":
                rug(base, x0, y0, x, y, ch(x - 1, y) != ",", ch(x + 1, y) != ",", ch(x, y - 1) != ",", ch(x, y + 1) != ",")
            elif ch(x, y) == "p":
                W0.floor_planks(base, x0, y0, x, y, light=True)
            else:
                floor(base, style["floor"], x0, y0, x, y)
    # Murs : chapeau, puis face du mur du fond (rangée 1)
    for y in range(Hd):
        for x in range(Wd):
            if ch(x, y) != "#":
                continue
            x0, y0 = x * T, y * T
            if y == 1 and 0 < x < Wd - 1:
                W0.wall_face(base, x0, y0, x, theme)
            elif y == 0 and 0 < x < Wd - 1:
                upper_wall(base, x0, y0, x, theme)
            else:
                W0.wall_cap(base, x0, y0)
    # Ombre du mur du fond et des murs latéraux sur le sol
    for x in range(1, Wd - 1):
        for k, a in enumerate((70, 35)):
            base.hline(x * T, x * T + T - 1, 2 * T + k, P["ink"], a)
    for y in range(2, Hd - 1):
        for k, a in enumerate((60, 25)):
            base.vline(T + k, y * T, y * T + T - 1, P["ink"], a)
            base.vline((Wd - 1) * T - 1 - k, y * T, y * T + T - 1, P["ink"], a)
    # Décor mural
    for item in style.get("wall", []):
        wall_item(base, item, theme)
    # Porte de sortie : paillasson et encadrement
    for d in m["doors"]:
        x, y = d["cell"]
        x0, y0 = x * T, y * T
        base.rect(x0, y0, T, T, P["wood1"])
        base.rect(x0, y0, T, 4, P["light"])
        base.rect(x0, y0 + 4, T, 12, (70, 60, 50))
        base.dither_rect(x0, y0 + 4, T, 12, P["paper3"], 0.3)
        lights.rect(x0, y0 - 6, T, 10, P["light"], 60)
    # Mobilier
    for (x, y, w) in runs(g, "c"):
        counter(base, x * T, y * T, w * T, theme)
    for (x, y, w) in runs(g, "b"):
        W0.draw_bookshelf(base, x * T, y * T, w * T)
    for (x, y, w) in runs(g, "k"):
        if theme == "tour":
            mailboxes(base, x * T, y * T, w * T)
        elif theme == "college":
            lockers(base, x * T, y * T, w * T)
        else:
            W0.draw_cabinet(base, x * T, y * T, w * T)
    for (x, y, w) in runs(g, "w"):
        W0.draw_workbench(base, x * T, y * T, w * T)
    for (x, y, w) in runs(g, "R"):
        W0.draw_rack(base, top, x * T, y * T, w * T)
    for (x, y, w) in runs(g, "s"):
        W0.draw_seat_row(base, x * T, y * T, w)
    for (x, y, w) in runs(g, "U"):
        W0.draw_showcase(base, top, x * T, y * T, w)
    for (x, y, w) in runs(g, "d"):
        items = [("computer", 4)] if theme in ("mediatheque", "siege") else [("paper", 3), ("book", w * T - 14)]
        if theme == "mediatheque":
            items = [("computer", 2 + i * T) for i in range(w)]
        W0.draw_desk(base, x * T, y * T, w * T, items)
    for (x, y, w) in runs(g, "B"):
        W0.draw_bench(base, x * T, y * T, w * T)
    for (x, y, w) in runs(g, "Z"):
        piano(base, top, x * T, y * T, w * T)
    for (x, y, w) in runs(g, "j"):
        machine(base, top, x * T, y * T, w * T, theme)
    for (x, y, w) in runs(g, "l"):
        etal(base, top, x * T, y * T, w * T, theme, cell_seed(x, y, 31))
    for (x, y, w) in runs(g, "y"):
        oeuvre(base, top, x * T, y * T, w * T, theme, cell_seed(x, y, 17))
    for (x, y, w, h) in blocks(g, "O"):
        stairs(base, x * T, y * T, w * T, h * T)
    for (x, y, w) in runs(g, "e"):
        for i in range(w):
            stage_edge(base, (x + i) * T, y * T)
    for y in range(Hd):
        for x in range(Wd):
            k = ch(x, y)
            x0, y0 = x * T, y * T
            if k == "t":
                table(base, top, x0, y0, theme, cell_seed(x, y))
            elif k == "i":
                pupitre(base, x0, y0, theme)
            elif k == "x":
                W0.draw_crate(base, x0, y0)
            elif k == "o":
                W0.draw_plant(base, top, x0, y0)
            elif k == "n":
                W0.draw_sign(base, x0, y0)
    # Lumières : plafonniers chauds, réguliers
    for y in range(3, Hd - 1, 3):
        for x in range(2, Wd - 1, 4):
            cx, cy = x * T + 8, y * T
            for yy in range(cy - 28, cy + 28):
                for xx in range(cx - 28, cx + 28):
                    dd = math.hypot(xx - cx, yy - cy) / 28
                    if dd < 1:
                        lights.set(xx, yy, P["light"], int(40 * (1 - dd) ** 1.5))
    return base, top, lights


def generate(world, maps_dir):
    """Dessine chaque décor d'intérieur une seule fois (les tours partagent le leur)."""
    done = []
    for mid, m in world["maps"].items():
        if not mid.startswith("int_"):
            continue
        art = m.get("art", mid)
        if art in done:
            continue
        base, top, lights = paint(m, WALLS)
        base.save(os.path.join(maps_dir, f"{art}_base.png"))
        top.save(os.path.join(maps_dir, f"{art}_top.png"))
        lights.save(os.path.join(maps_dir, f"{art}_lights.png"))
        done.append(art)
    return done

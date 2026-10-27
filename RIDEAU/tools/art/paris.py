"""Dessin du quartier parisien (carte « paris » de world.json, écrite par paris_layout.py).

Une architecture qui ne ressemble pas à Bréval :
- immeubles haussmanniens hauts de six étages (11 cases contre 5 à 8 à Bréval), pierre de
  taille crème, balcons filants en fer forgé aux 2e et 5e étages, frontons au-dessus des
  fenêtres de l'étage noble, toits de zinc à la Mansard, lucarnes et cheminées à pots orange ;
- un théâtre façon Opéra Garnier (arcades, colonnes jumelées, statues dorées, dôme de cuivre),
  la gare de l'Est et sa grande verrière en demi-lune ;
- la Seine, ses quais de pierre, un pont, des péniches et un bateau-mouche ; sur l'autre rive,
  les toits, Notre-Dame, le Sacré-Cœur et une grande tour Eiffel ;
- boulevards d'asphalte avec marquage, pavés de granit en éventail, trottoirs gris, platanes et
  grilles d'arbres, candélabres, bancs verts, kiosque, colonnes Morris, fontaine Wallace, métro
  Guimard, terrasse aux chaises en rotin ; les toits de Paris au fond.

Sorties (assets/world/maps/) : paris_base.png, paris_top.png, paris_lights.png,
paris_water_a.png / paris_water_b.png.
"""
import math
import os

from pixel import P, Canvas, shade, rng
import world as W0
import city as C
from world import T, text, text_width, cell_seed

STONE = (236, 222, 192)
STONE_D = shade(STONE, 0.84)
ZINC = (118, 130, 150)
ZINC_D = (92, 102, 120)
IRON = (34, 36, 42)
GREEN = (38, 70, 56)          # vert des kiosques, bancs et candélabres parisiens
GOLD = (222, 180, 80)
CLAY = (206, 112, 70)         # pots de cheminée
SHOPS = {
    "paris_cafe": {"name": "CAFE DE LA COMEDIE", "front": (110, 24, 36), "awning": (170, 32, 44), "glass": (250, 214, 150)},
    "paris_boulangerie": {"name": "BOULANGERIE", "front": (36, 70, 96), "awning": None, "glass": (250, 226, 170)},
    "paris_librairie": {"name": "LIBRAIRIE", "front": (32, 64, 48), "awning": (40, 88, 64), "glass": (214, 222, 214)},
}


# --- Immeubles haussmanniens -------------------------------------------------------------

def chimneys(c, x0, y0, w, seed):
    """Souches de cheminée en brique couronnées de pots en terre cuite."""
    r = rng(seed)
    x = x0 + 6 + r.randrange(10)
    while x < x0 + w - 14:
        sw = r.choice((8, 10, 12))
        c.rect(x, y0, sw, 8, (168, 92, 70))
        c.hline(x, x + sw - 1, y0, (196, 120, 92))
        for px in range(x + 1, x + sw - 1, 3):
            c.rect(px, y0 - 4, 2, 4, CLAY)
            c.set(px, y0 - 4, shade(CLAY, 1.2))
        x += sw + r.randrange(14, 30)


def mansard(c, x0, y0, w, bay, seed):
    """Toit à la Mansard : terrasson, brisis de zinc à joints debout, lucarnes à fronton."""
    c.rect(x0, y0, w, 10, ZINC_D)
    c.hline(x0, x0 + w - 1, y0, shade(ZINC, 1.25))
    chimneys(c, x0, y0 + 2, w, seed)
    c.rect(x0, y0 + 10, w, 24, ZINC)
    for xx in range(x0, x0 + w, 4):
        c.vline(xx, y0 + 10, y0 + 33, shade(ZINC, 1.1))
    for bx in range(x0 + (bay - 10) // 2, x0 + w - 10, bay):  # lucarnes
        c.rect(bx - 1, y0 + 15, 12, 16, STONE)
        c.ellipse(bx + 5, y0 + 15, 6, 4, STONE)
        c.rect(bx + 1, y0 + 17, 8, 12, (70, 86, 110))
        c.ellipse(bx + 5, y0 + 17, 4, 2, (70, 86, 110))
        c.rect(bx + 1, y0 + 17, 8, 3, (110, 130, 160))
        c.vline(bx + 5, y0 + 17, y0 + 28, STONE)
    c.rect(x0, y0 + 34, w, 4, STONE)                          # corniche
    c.hline(x0, x0 + w - 1, y0 + 34, shade(STONE, 1.06))
    c.hline(x0, x0 + w - 1, y0 + 37, STONE_D)
    for xx in range(x0 + 2, x0 + w, 6):                        # modillons
        c.set(xx, y0 + 38, STONE_D)
        c.set(xx, y0 + 39, shade(STONE, 0.7))


def tall_window(c, wx, wy, ww, wh, win):
    """Porte-fenêtre parisienne : chambranle de pierre, petits bois blancs, reflet du ciel."""
    c.rect(wx - 2, wy - 2, ww + 4, wh + 3, shade(STONE, 0.92))
    c.rect(wx, wy, ww, wh, (64, 80, 104))
    c.rect(wx, wy, ww, wh // 3, (118, 140, 170))
    c.vline(wx + ww // 2, wy, wy + wh - 1, (236, 232, 222))
    for yy in range(wy + wh // 3, wy + wh, wh // 3):
        c.hline(wx, wx + ww - 1, yy, (236, 232, 222))
    c.frame(wx, wy, ww, wh, (236, 232, 222))
    win.append((wx + 1, wy + 1, ww - 2, wh - 2))


def railing(c, x0, x1, y, h=5):
    """Garde-corps en fer forgé à volutes."""
    c.hline(x0, x1, y, IRON)
    c.hline(x0, x1, y + h, IRON)
    for xx in range(x0, x1, 4):
        c.vline(xx, y, y + h, IRON)
        c.set(xx + 2, y + 2, IRON)
        c.set(xx + 1, y + 3, IRON)
        c.set(xx + 3, y + 3, IRON)


def haussmann(c, X0, Y0, PW, PH, spec, doors_px, lights, win, seed):
    """Immeuble haussmannien de six niveaux, travées régulières de 18 px."""
    bay = 18
    c.rect(X0, Y0, PW, PH, STONE)
    r = rng(seed)
    for yy in range(Y0 + 40, Y0 + PH - 38, 6):                 # joints des pierres de taille
        c.hline(X0, X0 + PW - 1, yy, shade(STONE, 0.95))
    for _ in range(PW * PH // 60):
        c.set(X0 + r.randrange(PW), Y0 + 40 + r.randrange(PH - 78), shade(STONE, r.choice((0.93, 1.04))))
    mansard(c, X0, Y0, PW, bay, seed)
    first = X0 + (PW - (PW // bay) * bay) // 2
    bays = [first + k * bay + (bay - 10) // 2 for k in range(PW // bay)]
    # 5e étage : balcon filant
    for wx in bays:
        tall_window(c, wx, Y0 + 43, 10, 15, win)
    c.rect(X0 + 1, Y0 + 58, PW - 2, 2, STONE_D)
    railing(c, X0 + 1, X0 + PW - 2, Y0 + 52)
    # 4e et 3e étages : balconnets
    for fy in (Y0 + 62, Y0 + 80):
        for wx in bays:
            tall_window(c, wx, fy, 10, 15, win)
            railing(c, wx - 1, wx + 10, fy + 10, 4)
        c.hline(X0, X0 + PW - 1, fy + 18, shade(STONE, 0.9))
    # 2e étage, l'étage noble : frontons alternés, balcon filant sur consoles
    for k, wx in enumerate(bays):
        tall_window(c, wx, Y0 + 106, 10, 18, win)
        if k % 2 == 0:
            c.poly([(wx - 3, Y0 + 103), (wx + 5, Y0 + 98), (wx + 13, Y0 + 103)], shade(STONE, 1.05))
            c.hline(wx - 3, wx + 13, Y0 + 103, STONE_D)
        else:
            c.ellipse(wx + 5, Y0 + 103, 7, 3, shade(STONE, 1.05))
            c.hline(wx - 2, wx + 12, Y0 + 103, STONE_D)
    c.rect(X0 + 1, Y0 + 124, PW - 2, 3, STONE_D)
    railing(c, X0 + 1, X0 + PW - 2, Y0 + 118)
    for wx in bays:  # consoles sous le balcon
        c.rect(wx - 1, Y0 + 127, 3, 3, STONE_D)
        c.rect(wx + 8, Y0 + 127, 3, 3, STONE_D)
    # Entresol : petites baies
    for wx in bays:
        c.rect(wx, Y0 + 131, 10, 7, (64, 80, 104))
        c.frame(wx, Y0 + 131, 10, 7, (236, 232, 222))
        win.append((wx + 1, Y0 + 132, 8, 5))
    # Rez-de-chaussée à bossages, devanture, store, enseigne, porte cochère
    gy = Y0 + PH - 36
    c.rect(X0, gy, PW, 36, shade(STONE, 0.97))
    for yy in range(gy + 3, Y0 + PH, 5):
        c.hline(X0, X0 + PW - 1, yy, shade(STONE, 0.82))
    if spec is not None:
        front = spec["front"]
        c.rect(X0 + 3, gy + 2, PW - 6, 32, front)
        c.rect(X0 + 3, gy + 2, PW - 6, 10, shade(front, 0.75))
        c.frame(X0 + 3, gy + 2, PW - 6, 10, GOLD)
        label = spec["name"]
        text(c, X0 + PW // 2 - text_width(label) // 2, gy + 4, label, GOLD)
        for gx in range(X0 + 7, X0 + PW - 18, 18):
            if any(gx + 14 > dx - 3 and gx < dx + dw + 3 for dx, dw in doors_px):
                continue
            c.rect(gx, gy + 18, 14, 15, spec["glass"])
            c.rect(gx, gy + 18, 14, 4, shade(spec["glass"], 1.1))
            c.frame(gx - 1, gy + 17, 16, 17, shade(front, 1.3))
            rr = rng(gx)
            for _ in range(3):
                c.rect(gx + 2 + rr.randrange(9), gy + 27 + rr.randrange(4), 3, 3,
                       [P["velvet3"], P["gold2"], P["cream"], (230, 170, 90), P["blue"]][rr.randrange(5)])
            win.append((gx, gy + 18, 14, 15))
        if spec["awning"] is not None:  # store à festons
            for i in range(0, PW - 6, 6):
                c.rect(X0 + 3 + i, gy + 12, min(6, PW - 6 - i), 5, spec["awning"])
                c.ellipse(X0 + 6 + i, gy + 17, 3, 1, spec["awning"])
            c.hline(X0 + 3, X0 + PW - 4, gy + 12, shade(spec["awning"], 1.3))
    for dx, dw in doors_px:
        c.rect(dx - 1, Y0 + PH - 21, dw + 2, 21, shade(STONE, 0.7))
        c.rect(dx + 1, Y0 + PH - 20, dw - 2, 20, (44, 60, 52))
        c.rect(dx + 2, Y0 + PH - 19, dw - 4, 3, (200, 210, 214))  # imposte vitrée
        c.vline(dx + dw // 2, Y0 + PH - 19, Y0 + PH - 1, IRON)
        for yy in range(Y0 + PH - 17, Y0 + PH - 2, 6):
            c.rect(dx + 3, yy, dw // 2 - 4, 4, (56, 76, 66))
            c.rect(dx + dw // 2 + 2, yy, dw // 2 - 4, 4, (56, 76, 66))
        c.set(dx + dw // 2 - 2, Y0 + PH - 10, GOLD)
        lights.append(("sconce", dx - 3, Y0 + PH - 18))
        lights.append(("sconce", dx + dw + 2, Y0 + PH - 18))
    # Pilastres d'angle et murs mitoyens
    for px in (X0, X0 + PW - 3):
        c.rect(px, Y0 + 40, 3, PH - 40, shade(STONE, 0.9))
    c.hline(X0, X0 + PW - 1, Y0 + PH - 1, shade(STONE, 0.55))


# --- Monuments -------------------------------------------------------------------------

def statue(c, x, y, h=26, wings=True):
    """Groupe sculpté doré (à l'angle de l'Opéra)."""
    c.rect(x - 6, y + h - 6, 12, 6, STONE_D)
    c.ellipse(x, y + 4, 3, 3, GOLD)
    c.rect(x - 3, y + 7, 6, h - 14, GOLD)
    c.poly([(x - 6, y + h - 6), (x, y + 10), (x + 6, y + h - 6)], shade(GOLD, 0.9))
    c.line(x + 3, y + 8, x + 8, y + 1, GOLD)  # bras levé avec une lyre
    c.ellipse(x + 9, y, 2, 2, GOLD)
    if wings:
        c.poly([(x - 2, y + 8), (x - 12, y + 2), (x - 9, y + 14)], shade(GOLD, 1.1))


def opera(c, X0, Y0, PW, PH, doors_px, lights, win):
    """Le Théâtre des Lumières, façon Opéra Garnier."""
    cx = X0 + PW // 2
    patina = (92, 158, 138)
    c.rect(X0, Y0, PW, PH, (236, 226, 204))
    # Dôme vert et couronne dorée, toiture derrière
    c.rect(X0, Y0 + 10, PW, 22, patina)
    for xx in range(X0, X0 + PW, 5):
        c.vline(xx, Y0 + 10, Y0 + 31, shade(patina, 1.12))
    c.ellipse(cx, Y0 + 14, 46, 14, patina)
    c.ellipse(cx, Y0 + 14, 42, 11, shade(patina, 1.12))
    for k in range(-40, 41, 10):
        c.line(cx + k // 3, Y0 + 2, cx + k, Y0 + 18, shade(patina, 0.85))
    c.rect(cx - 10, Y0, 20, 4, GOLD)
    statue(c, cx, Y0 - 2, 14, wings=False)
    # Attique et inscription dorée
    c.rect(X0, Y0 + 30, PW, 18, (226, 214, 190))
    c.hline(X0, X0 + PW - 1, Y0 + 30, GOLD)
    c.hline(X0, X0 + PW - 1, Y0 + 47, shade(STONE, 0.75))
    label = "THEATRE DES LUMIERES"
    c.rect(cx - text_width(label) // 2 - 6, Y0 + 34, text_width(label) + 12, 11, (60, 30, 30))
    text(c, cx - text_width(label) // 2, Y0 + 36, label, GOLD)
    for sx in (X0 + 14, X0 + PW - 14):  # groupes dorés aux angles
        statue(c, sx, Y0 + 6, 26)
    for k in range(0, PW, 8):  # balustrade
        c.rect(X0 + k + 2, Y0 + 26, 2, 4, STONE_D)
    # Loggia : colonnes jumelées, baies cintrées, bustes dorés dans les oculi
    c.rect(X0, Y0 + 48, PW, 64, (240, 230, 208))
    pairs = 7
    step = (PW - 20) / (pairs - 1)
    cols = [int(X0 + 10 + i * step) for i in range(pairs)]
    for i in range(pairs - 1):
        a, b = cols[i] + 8, cols[i + 1] - 4
        wx = (a + b) // 2 - 7
        c.rect(wx, Y0 + 68, 14, 40, (60, 44, 46))
        c.ellipse(wx + 7, Y0 + 68, 7, 6, (60, 44, 46))
        c.rect(wx + 1, Y0 + 70, 12, 37, (250, 210, 140))
        c.ellipse(wx + 7, Y0 + 70, 6, 5, (250, 210, 140))
        c.vline(wx + 7, Y0 + 66, Y0 + 106, GOLD)
        win.append((wx + 1, Y0 + 70, 12, 37))
        c.ellipse(wx + 7, Y0 + 56, 5, 5, (120, 150, 120))  # oculus de marbre vert
        c.ellipse(wx + 7, Y0 + 56, 3, 3, GOLD)            # buste doré
    for x in cols:
        for dxp in (0, 5):
            c.rect(x + dxp - 2, Y0 + 52, 4, 58, (248, 242, 228))
            c.vline(x + dxp + 1, Y0 + 52, Y0 + 109, (210, 200, 184))
            c.rect(x + dxp - 3, Y0 + 50, 6, 3, GOLD)
        c.rect(x - 4, Y0 + 108, 14, 4, (200, 150, 150))  # socle de marbre rose
    c.rect(X0, Y0 + 112, PW, 3, GOLD)
    # Arcades du rez-de-chaussée, bandeau d'affiche (le titre est écrit par le jeu), marches
    arches = 7
    aw = (PW - 16) // arches
    door_mid = [dx + dw // 2 for dx, dw in doors_px]
    for i in range(arches):
        ax = X0 + 8 + i * aw
        c.rect(ax + 3, Y0 + 132, aw - 6, PH - 136, (52, 40, 40))
        c.ellipse(ax + aw // 2, Y0 + 132, aw // 2 - 3, 7, (52, 40, 40))
        c.rect(ax, Y0 + 116, 3, PH - 120, shade(STONE, 0.86))
        lights.append(("small", ax + aw // 2, Y0 + 140))
    for dx, dw in doors_px:
        W0.double_door(c, dx, Y0 + PH - 26, P["velvet2"], h=26)
    bx = (door_mid[0] + door_mid[-1]) // 2 if door_mid else cx
    c.rect(bx - 113, Y0 + 125, 226, 14, GOLD)
    c.rect(bx - 111, Y0 + 126, 222, 12, (120, 20, 36))
    for k in range(4):
        c.rect(X0 + 10 + k * (PW - 20) // 3, Y0 + PH - 4, 3, 4, STONE_D)
    c.rect(X0 + 4, Y0 + PH - 3, PW - 8, 3, (210, 204, 196))
    lights.append(("marquee", bx, Y0 + 132))


def gare_est(c, X0, Y0, PW, PH, doors_px, lights, win):
    """La gare de l'Est : grande verrière en demi-lune entre deux pavillons, statue, horloge."""
    cx = X0 + PW // 2
    c.rect(X0, Y0, PW, PH, STONE)
    for yy in range(Y0 + 12, Y0 + PH, 6):
        c.hline(X0, X0 + PW - 1, yy, shade(STONE, 0.95))
    c.rect(X0, Y0 + 6, PW, 6, ZINC)
    for k in range(0, PW, 6):
        c.rect(X0 + k + 1, Y0 + 2, 2, 5, STONE_D)  # balustrade
    statue(c, cx, Y0 - 2, 20, wings=False)
    # Grande verrière
    c.ellipse(cx, Y0 + 104, 70, 82, STONE_D)
    c.ellipse(cx, Y0 + 104, 64, 76, (150, 176, 196))
    c.rect(cx - 72, Y0 + 104, 144, 40, STONE)
    for a in range(0, 181, 12):
        rad = math.radians(a)
        c.line(cx, Y0 + 104, int(cx - 64 * math.cos(rad)), int(Y0 + 104 - 76 * math.sin(rad)), (90, 100, 110))
    for rr in (24, 48):
        for a in range(0, 181, 2):
            rad = math.radians(a)
            c.set(int(cx - rr * math.cos(rad)), int(Y0 + 104 - rr * 1.18 * math.sin(rad)), (90, 100, 110))
    win.append((cx - 40, Y0 + 50, 80, 50))
    c.ellipse(cx, Y0 + 32, 8, 8, GOLD)
    c.ellipse(cx, Y0 + 32, 6, 6, P["white"])
    c.vline(cx, Y0 + 28, Y0 + 32, IRON)
    c.hline(cx, cx + 4, Y0 + 32, IRON)
    label = "GARE DE L'EST"
    c.rect(cx - text_width(label) // 2 - 5, Y0 + 108, text_width(label) + 10, 11, (40, 50, 80))
    text(c, cx - text_width(label) // 2, Y0 + 110, label, GOLD)
    # Pavillons latéraux
    for side in (X0 + 4, X0 + PW - 34):
        for fy in (Y0 + 22, Y0 + 52, Y0 + 82):
            for k in range(2):
                tall_window(c, side + 4 + k * 14, fy, 9, 18, win)
            c.poly([(side + 1, fy - 3), (side + 15, fy - 9), (side + 29, fy - 3)], shade(STONE, 1.05))
    # Arcades d'entrée
    for k in range(5):
        ax = cx - 70 + k * 28
        c.rect(ax, Y0 + 124, 24, PH - 124, STONE_D)
        c.ellipse(ax + 12, Y0 + 124, 12, 6, STONE_D)
        c.rect(ax + 3, Y0 + 126, 18, PH - 126, (60, 66, 74))
        c.ellipse(ax + 12, Y0 + 126, 9, 4, (60, 66, 74))
        c.rect(ax + 4, Y0 + 128, 16, 10, (196, 212, 220))
    lights.append(("marquee", cx, Y0 + 140))


# --- L'autre rive, la Seine, les toits ------------------------------------------------

def eiffel(c, x0, y_base, h):
    """La tour Eiffel : quatre pieds, grande arche, trois étages, dentelle de fer."""
    col = (118, 92, 78)
    dark = (90, 70, 62)
    base_w = int(h * 0.56)
    for yy in range(h):
        t = yy / h
        half = int(base_w / 2 * (1 - t) ** 2.1) + 1
        y = y_base - yy
        c.set(x0 - half, y, dark)
        c.set(x0 + half, y, dark)
        c.set(x0 - half + 1, y, col)
        c.set(x0 + half - 1, y, col)
        if yy % 5 == 0:
            c.hline(x0 - half, x0 + half, y, col)
        if yy % 10 < 5:  # croisillons
            k = (yy % 5) * half // 5
            c.set(x0 - half + k, y, col)
            c.set(x0 + half - k, y, col)
    for frac, thick in ((0.2, 4), (0.45, 3), (0.73, 2)):  # plateformes
        y = y_base - int(h * frac)
        half = int(base_w / 2 * (1 - frac) ** 2.1) + 4
        c.rect(x0 - half, y - thick, 2 * half + 1, thick, dark)
    c.vline(x0, y_base - h - 10, y_base - h, dark)


def far_bank(c, Wpx):
    """Rangées 0 à 12 : ciel du soir, toits de l'autre rive, Notre-Dame, Sacré-Cœur, tour Eiffel."""
    sky_h = 132
    for y in range(sky_h):
        t = y / sky_h
        top, bottom = (126, 150, 196), (246, 206, 168)
        c.hline(0, Wpx - 1, y, tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    r = rng(5)
    for _ in range(5):
        cx, cy = r.randrange(Wpx), r.randrange(10, 70)
        for k in range(4):
            c.ellipse(cx + k * 10 - 15, cy + (k % 2) * 2, 10, 4, (250, 214, 190), 170)
    # Butte Montmartre et Sacré-Cœur
    c.ellipse(170, 150, 110, 40, (150, 160, 150))
    sc = (240, 236, 228)
    c.rect(150, 96, 44, 30, sc)
    c.ellipse(172, 92, 14, 16, sc)
    c.vline(172, 70, 78, sc)
    c.ellipse(172, 76, 3, 3, sc)
    for dx in (-18, 18):
        c.ellipse(172 + dx, 98, 7, 9, sc)
    c.rect(186, 80, 8, 30, sc)  # campanile
    c.ellipse(190, 80, 4, 5, sc)
    # Toits de l'autre rive
    x = 0
    while x < Wpx:
        bw = r.randrange(26, 54)
        bh = r.randrange(26, 46)
        top = 172 - bh
        c.rect(x, top, bw, bh, (196, 186, 170))
        c.rect(x, top, bw, 8, (120, 132, 152))
        for wx in range(x + 4, x + bw - 4, 7):
            for wy in range(top + 12, 168, 9):
                c.rect(wx, wy, 3, 5, (255, 214, 150) if r.random() < 0.45 else (90, 104, 128))
        for k in range(0, bw - 8, 14):
            c.rect(x + 4 + k, top - 5, 5, 5, (168, 92, 70))
            c.rect(x + 5 + k, top - 7, 1, 2, CLAY)
            c.rect(x + 7 + k, top - 7, 1, 2, CLAY)
        x += bw
    # Notre-Dame
    nd = (214, 204, 186)
    c.rect(330, 110, 22, 62, nd)
    c.rect(362, 110, 22, 62, nd)
    c.rect(330, 132, 54, 40, nd)
    c.ellipse(357, 140, 8, 8, (150, 130, 160))
    for tx in (330, 362):
        for k in range(3):
            c.rect(tx + 3 + k * 7, 120, 3, 12, (120, 110, 100))
    c.vline(357, 92, 132, (120, 110, 100))
    # Arbres et quai de pierre de l'autre rive
    for x in range(0, Wpx, 14):
        c.ellipse(x + 7, 180, 9, 9, (86, 128, 80))
        c.ellipse(x + 5, 177, 5, 4, (110, 156, 96))
    c.rect(0, 190, Wpx, 18, (206, 194, 168))
    for x in range(0, Wpx, 12):
        c.vline(x, 190, 207, (180, 168, 144))
    c.hline(0, Wpx - 1, 190, (226, 216, 194))
    eiffel(c, 47 * T, 196, 190)


def rooftops(c, y0, y1, Wpx):
    """Les toits de Paris au fond : zinc, lucarnes, souches et pots de cheminée."""
    r = rng(41)
    x = 0
    while x < Wpx:
        bw = r.randrange(48, 96)
        top = y0 + r.randrange(0, 10)
        c.rect(x, top, bw, y1 - top, ZINC)
        for xx in range(x, x + bw, 4):
            c.vline(xx, top, y1 - 1, shade(ZINC, 1.1))
        c.rect(x, top, bw, 4, shade(ZINC, 1.25))
        c.vline(x, top, y1 - 1, ZINC_D)
        chimneys(c, x, top + 6, bw, r.randrange(1000))
        for bx in range(x + 8, x + bw - 12, 20):
            dy = top + 22 + r.randrange(8)
            c.rect(bx, dy, 10, 12, STONE)
            c.rect(bx + 2, dy + 2, 6, 8, (70, 86, 110) if r.random() < 0.6 else (255, 210, 140))
        if r.random() < 0.4:
            c.rect(x + bw // 2, top + 40, 14, 8, (150, 176, 196))  # verrière d'atelier
        x += bw


def pave_fan(c, x0, y0, gx, gy):
    """Pavés de granit posés en éventail (queue de paon)."""
    base = (150, 150, 158)
    c.rect(x0, y0, T, T, base)
    for py in range(T):
        for px in range(T):
            X, Y = gx * T + px, gy * T + py
            u = (X % 32) - 16
            v = (Y % 16) + (16 if (X // 32) % 2 else 0)
            d = math.hypot(u, v)
            ring = d % 6
            ang = int(math.degrees(math.atan2(v, u)) // 20)
            edge = ring < 0.9 or (int(d // 6) + ang) % 2 == 0 and (math.degrees(math.atan2(v, u)) % 20) < 1.4
            if edge:
                c.set(x0 + px, y0 + py, (118, 118, 128))
            elif ring > 4.6:
                c.set(x0 + px, y0 + py, (166, 166, 174))


def asphalt(c, x0, y0, gx, gy, light=False):
    base = (176, 172, 166) if light else (64, 64, 72)
    c.rect(x0, y0, T, T, base)
    r = rng(cell_seed(gx, gy, 9))
    for _ in range(10):
        c.set(x0 + r.randrange(T), y0 + r.randrange(T), shade(base, r.choice((0.9, 1.12))))


def seine(c, x0, y0, gx, gy):
    c.rect(x0, y0, T, T, (76, 104, 108))
    r = rng(cell_seed(gx, gy, 31))
    for _ in range(3):
        sx, sy = x0 + r.randrange(12), y0 + r.randrange(T)
        c.hline(sx, sx + 4, sy, (96, 126, 128))


# --- Mobilier parisien ---------------------------------------------------------------

def plane_tree(base, top, x0, y0, seed):
    """Platane : tronc écaillé, houppier clair, grille de fonte au pied."""
    base.rect(x0, y0 + 9, T, 7, IRON)
    for xx in range(x0 + 1, x0 + T - 1, 3):
        base.vline(xx, y0 + 10, y0 + 14, (60, 62, 70))
    base.rect(x0 + 6, y0 - 6, 4, 18, (190, 180, 150))
    base.set(x0 + 7, y0 - 2, (120, 130, 100))
    base.set(x0 + 8, y0 + 4, (150, 150, 120))
    r = rng(seed)
    for k in range(7):
        top.ellipse(x0 + 8 + r.randrange(-10, 11), y0 - 14 + r.randrange(-8, 6), 8, 7, (96, 146, 78))
    for k in range(6):
        top.ellipse(x0 + 6 + r.randrange(-8, 9), y0 - 18 + r.randrange(-6, 4), 4, 3, (130, 180, 100))


def candelabre(base, top, x0, y0):
    """Candélabre parisien : fût de fonte vert sombre, deux lanternes."""
    base.rect(x0 + 5, y0 + 10, 6, 6, GREEN)
    base.rect(x0 + 7, y0 - 2, 2, 12, GREEN)
    top.rect(x0 + 7, y0 - 18, 2, 16, GREEN)
    top.hline(x0 + 1, x0 + 14, y0 - 16, GREEN)
    for lx in (x0 + 1, x0 + 12):
        top.rect(lx - 1, y0 - 22, 5, 6, GREEN)
        top.rect(lx, y0 - 21, 3, 4, (255, 226, 160))
        top.set(lx + 1, y0 - 24, GREEN)


def bench_davioud(base, x0, y0, w):
    """Banc vert à lattes, pieds en fonte."""
    for k in range(3):
        base.rect(x0, y0 + 4 + k * 3, w, 2, (46, 92, 66))
    base.rect(x0, y0 + 2, w, 2, (36, 72, 52))
    for lx in (x0 + 1, x0 + w - 4):
        base.rect(lx, y0 + 12, 3, 4, IRON)


def kiosque(base, top, x0, y0):
    """Kiosque à journaux vert, dôme et épi doré, journaux en vitrine."""
    base.rect(x0, y0, T, T, GREEN)
    base.rect(x0 + 2, y0 + 2, 12, 9, (230, 226, 210))
    for k in range(3):
        base.rect(x0 + 3 + k * 4, y0 + 3, 3, 7, [P["velvet3"], P["blue"], P["gold2"]][k])
    top.rect(x0 - 1, y0 - 10, T + 2, 10, GREEN)
    top.ellipse(x0 + 8, y0 - 11, 9, 5, GREEN)
    top.rect(x0 + 2, y0 - 8, 12, 4, (210, 190, 120))
    top.set(x0 + 8, y0 - 17, GOLD)


def terrace(base, top, x0, y0):
    """Guéridon de marbre et deux chaises bistrot en rotin."""
    for cx in (x0 + 1, x0 + 11):
        base.rect(cx, y0 + 5, 5, 8, (196, 160, 110))
        for yy in range(y0 + 5, y0 + 13, 2):
            base.hline(cx, cx + 4, yy, (170, 60, 60))
        base.rect(cx, y0 + 13, 1, 3, IRON)
        base.rect(cx + 4, y0 + 13, 1, 3, IRON)
    base.ellipse(x0 + 8, y0 + 8, 4, 3, (236, 236, 230))
    base.vline(x0 + 8, y0 + 10, y0 + 15, IRON)
    base.rect(x0 + 7, y0 + 6, 2, 2, (120, 70, 50))  # un café


def grand_fountain(base, top, x0, y0):
    """Fontaine des Lumières (4 × 3 cases) : vasque de pierre, groupe doré, jets d'eau."""
    w, h = 4 * T, 3 * T
    base.ellipse(x0 + w // 2, y0 + h - 14, w // 2, 14, STONE_D)
    base.ellipse(x0 + w // 2, y0 + h - 15, w // 2 - 3, 11, (110, 160, 196))
    base.ellipse(x0 + w // 2, y0 + h - 17, 12, 5, STONE)
    base.rect(x0 + w // 2 - 4, y0 + 10, 8, h - 26, STONE)
    top.ellipse(x0 + w // 2, y0 + 10, 10, 4, STONE)
    statue(top, x0 + w // 2, y0 - 12, 22, wings=True)
    for k in (-1, 1):  # jets
        for i in range(12):
            top.set(x0 + w // 2 + k * (6 + i), y0 + 8 + (i * i) // 6, (200, 230, 250))


def wallace(base, top, x0, y0):
    g = (36, 84, 64)
    base.rect(x0 + 3, y0 + 12, 10, 4, g)
    base.rect(x0 + 5, y0 + 2, 6, 10, g)
    for k in range(3):
        base.vline(x0 + 6 + k * 2, y0 + 3, y0 + 11, shade(g, 1.4))
    top.ellipse(x0 + 8, y0 + 1, 6, 3, g)
    top.rect(x0 + 7, y0 - 4, 2, 4, g)
    base.vline(x0 + 8, y0 + 8, y0 + 13, (170, 210, 240))


def peniche(base, x0, y0):
    """Péniche amarrée : coque noire, roof de bois, plantes."""
    base.rect(x0, y0 + 6, 120, 10, (30, 30, 36))
    base.hline(x0, x0 + 119, y0 + 6, (160, 40, 40))
    base.rect(x0 + 60, y0, 46, 8, (150, 110, 70))
    for k in range(4):
        base.rect(x0 + 64 + k * 10, y0 + 2, 6, 4, (250, 214, 150))
    for k in range(6):
        base.ellipse(x0 + 10 + k * 8, y0 + 5, 3, 2, (90, 150, 80))


def bateau_mouche(base, top, x0, y0):
    """Bateau-mouche : long toit vitré, touristes."""
    base.rect(x0, y0 + 8, 130, 10, (236, 236, 240))
    base.hline(x0, x0 + 129, y0 + 17, (40, 60, 120))
    top.rect(x0 + 10, y0, 110, 9, (170, 200, 220))
    for k in range(10):
        top.vline(x0 + 12 + k * 11, y0, y0 + 8, (110, 130, 150))
        top.ellipse(x0 + 17 + k * 11, y0 + 6, 2, 2, P["skin%d" % (k % 6)])


# --- Assemblage ----------------------------------------------------------------------

def render(world):
    m = world["maps"]["paris"]
    g, gr = m["grid"], m["ground"]
    Wt, Ht = len(g[0]), len(g)
    Wpx = Wt * T
    base = Canvas(Wpx, Ht * T, P["ink"])
    top = Canvas(Wpx, Ht * T)
    lights = []
    # 1. Sol
    for y in range(Ht):
        for x in range(Wt):
            k = gr[y][x]
            x0, y0 = x * T, y * T
            if k == "_":
                asphalt(base, x0, y0, x, y, light=True)
            elif k == "=":
                asphalt(base, x0, y0, x, y)
            elif k == "z":
                asphalt(base, x0, y0, x, y)
                for yy in range(y0 + 2, y0 + T, 5):
                    base.rect(x0 + 1, yy, T - 2, 3, (232, 232, 228))
            elif k == "+":
                pave_fan(base, x0, y0, x, y)
            elif k == "a":  # rue pavée entre deux immeubles
                pave_fan(base, x0, y0, x, y)
                if g[y][x - 1] in "Hd":
                    for kk, a in enumerate((110, 70, 35)):
                        base.vline(x0 + kk, y0, y0 + T - 1, P["ink"], a)
                if g[y][x + 1] in "Hd":
                    for kk, a in enumerate((80, 40)):
                        base.vline(x0 + T - 1 - kk, y0, y0 + T - 1, P["ink"], a)
            elif k == "~":
                seine(base, x0, y0, x, y)
            elif k == "P":
                base.rect(x0, y0, T, T, (200, 190, 168))
                for yy in range(y0, y0 + T, 4):
                    base.hline(x0, x0 + T - 1, yy, (184, 174, 152))
            else:
                base.rect(x0, y0, T, T, (126, 134, 152))
    # Marquage au sol des deux chaussées, bordures de granit
    for ymid in (22 * T, 41 * T):
        for x in range(T, Wpx - T, 24):
            if g[ymid // T][x // T] == "=":
                base.rect(x, ymid - 1, 12, 2, (226, 226, 220))
    for y in range(1, Ht):
        for x in range(Wt):
            if gr[y][x] == "_" and gr[y - 1][x] in "=z":
                base.rect(x * T, y * T, T, 2, (196, 196, 200))
            if gr[y][x] == "_" and y + 1 < Ht and gr[y + 1][x] in "=z":
                base.rect(x * T, y * T + T - 2, T, 2, (196, 196, 200))
    # Quais de pierre le long de la Seine, pont
    for x in range(1, Wt - 1):
        if g[17][x] != "P":
            base.rect(x * T, 16 * T + 12, T, 4, (214, 204, 180))
            base.set(x * T + 8, 16 * T + 13, IRON)
    for y in range(13, 18):
        base.rect(40 * T, y * T, 3, T, (226, 216, 194))
        base.rect(44 * T - 3, y * T, 3, T, (226, 216, 194))
    for y in (13, 16):
        for x in (40 * T + 1, 44 * T - 3):
            top.rect(x, y * T - 14, 2, 14, GREEN)
            top.rect(x - 1, y * T - 18, 4, 4, (255, 226, 160))
            lights.append(("lamp", x + 1, y * T - 16))
    # 2. Décors : l'autre rive, les toits du fond
    far_bank(base, Wpx)
    rooftops(base, 57 * T, (Ht - 1) * T + T, Wpx)
    for y in range(13, 57):  # bordures latérales : murs aveugles
        for x in (0, Wt - 1):
            if g[y][x] == "X":
                base.rect(x * T, y * T, T, T, shade(STONE, 0.75))
    # Étincelles de la tour Eiffel (visibles avec les lumières du soir)
    r = rng(12)
    for _ in range(40):
        yy = 196 - r.randrange(180)
        half = int(190 * 0.56 / 2 * (1 - (196 - yy) / 190) ** 2.1) + 1
        lights.append(("small", 47 * T + r.randrange(-half, half + 1), yy))
    # 3. Bâtiments
    win = []
    for b in m["buildings"]:
        x, y, w, h = b["rect"]
        X0, Y0, PW, PH = x * T, y * T, w * T, h * T
        xs = sorted(d[0] for d in b["doors"])
        doors_px = [(xs[0] * T, (xs[-1] - xs[0] + 1) * T)]
        if b["style"] == "paris_opera":
            opera(base, X0, Y0, PW, PH, doors_px, lights, win)
        elif b["style"] == "paris_gare":
            gare_est(base, X0, Y0, PW, PH, doors_px, lights, win)
        else:
            haussmann(base, X0, Y0, PW, PH, SHOPS.get(b["style"]), doors_px, lights, win, cell_seed(x, y))
    for x in range(1, Wt - 1):  # ombre au pied de la rangée
        for k, a in enumerate((90, 55, 25)):
            base.hline(x * T, x * T + T - 1, 37 * T + k, P["ink"], a)
    # 4. Mobilier
    done = set()
    for d in m.get("decor", []):
        cx, cy = d["cell"]
        if d["kind"] == "peniche":
            peniche(base, cx * T, cy * T)
        elif d["kind"] == "bateau_mouche":
            bateau_mouche(base, top, cx * T, cy * T)
    for y in range(Ht):
        for x in range(Wt):
            if (x, y) in done:
                continue
            k = g[y][x]
            x0, y0 = x * T, y * T
            if k == "T":
                plane_tree(base, top, x0, y0, cell_seed(x, y))
            elif k == "L":
                candelabre(base, top, x0, y0)
                lights.append(("lamp", x0 + 2, y0 - 19))
                lights.append(("lamp", x0 + 13, y0 - 19))
            elif k == "K":
                W0.draw_morris(base, top, x0, y0)
                lights.append(("small", x0 + 8, y0 - 4))
            elif k == "N":
                kiosque(base, top, x0, y0)
            elif k == "B":
                if x + 1 < Wt and g[y][x + 1] == "B":
                    bench_davioud(base, x0, y0, 32)
                    done.add((x + 1, y))
                else:
                    bench_davioud(base, x0, y0, 16)
            elif k == "t":
                terrace(base, top, x0, y0)
            elif k == "F":
                grand_fountain(base, top, x0, y0)
                done.update({(x + i, y + j) for i in range(4) for j in range(3)})
                lights.append(("marquee", x0 + 32, y0 + 10))
            elif k == "Y":
                wallace(base, top, x0, y0)
            elif k == "Q":
                draw_carousel(base, top, x0, y0)
                done.update({(x + i, y + j) for i in range(3) for j in range(3)})
                lights.append(("small", x0 + 24, y0 + 14))
            elif k == "m":
                draw_metro(base, top, x0, y0)
                done.add((x + 1, y))
                lights.append(("small", x0 + 2, y0 - 12))
                lights.append(("small", x0 + 30, y0 - 12))
            elif k == "M":
                if x + 1 < Wt and g[y][x + 1] == "M":
                    C.draw_stall(base, top, x0, y0, 7)
                    done.add((x + 1, y))
            elif k == "u":
                if x + 1 < Wt and g[y][x + 1] == "u":
                    draw_parapet(base, x0, y0)
                    draw_parapet(base, x0 + T, y0)
                    draw_bouquiniste(base, top, x0, y0)
                    done.add((x + 1, y))
            elif k == "W":
                draw_parapet(base, x0, y0)
            elif k == "y":
                draw_easel(base, top, x0, y0)
            elif k == "f":
                W0.draw_flowers(base, x0, y0, "ete")
            elif k == "x":
                W0.draw_crate(base, x0, y0)
            elif k == "R":
                W0.draw_rack(base, top, x0, y0, T)
            elif k == "V":
                C.draw_bikes(base, x0, y0, x)
    # Guirlandes au-dessus du boulevard : soir de première.
    cols = [P["velvet4"], P["gold3"], (120, 200, 120), (130, 180, 240)]
    for yy, xa, xb in [(39, 1, 62)]:  # un fil tendu entre les candélabres, des ampoules
        y_wire = yy * T - 30
        for xx in range(xa * T, xb * T):
            sag = int(6 * math.sin(math.pi * ((xx - xa * T) % 128) / 128))
            top.set(xx, y_wire + sag, (40, 36, 40), 200)
            if (xx - xa * T) % 10 == 5:
                col = cols[((xx - xa * T) // 10) % 4]
                top.rect(xx, y_wire + sag + 1, 2, 3, col)
                if (xx - xa * T) % 60 == 5:
                    lights.append(("small", xx, y_wire + sag + 2))
    for wr in win:
        lights.append(("window", wr))
    return base, top, lights


def draw_carousel(base, top, x0, y0):
    """Manège (3×3 cases) : chevaux de bois, toit rayé, mât doré."""
    cols = [P["velvet3"], P["cream"]]
    base.ellipse(x0 + 24, y0 + 36, 22, 9, P["wood1"])
    base.ellipse(x0 + 24, y0 + 35, 20, 7, P["wood3"])
    for k in range(5):
        hx = x0 + 6 + k * 9
        base.vline(hx + 3, y0 + 14, y0 + 34, GOLD)
        col = [P["white"], P["gold3"], (200, 120, 90), P["sky"], P["white"]][k]
        base.rect(hx, y0 + 26, 8, 5, col)
        base.rect(hx + 6, y0 + 23, 3, 4, col)
    for i in range(12):
        a0 = math.pi + i * math.pi / 12
        a1 = a0 + math.pi / 12
        top.poly([(x0 + 24, y0 - 2), (x0 + 24 + int(24 * math.cos(a0)), y0 + 14), (x0 + 24 + int(24 * math.cos(a1)), y0 + 14)], cols[i % 2])
    top.hline(x0, x0 + 47, y0 + 14, GOLD)
    for xx in range(x0 + 2, x0 + 46, 4):
        top.set(xx, y0 + 15, P["light"])
    top.rect(x0 + 23, y0 - 6, 2, 5, P["gold3"])


def draw_metro(base, top, x0, y0):
    """Entrée de métro Guimard (2 cases) : rampe verte, lampes ambrées, enseigne."""
    g = (52, 96, 74)
    base.rect(x0 + 2, y0 + 6, 28, 10, P["ink"])
    for k in range(4):
        base.rect(x0 + 4 + k * 6, y0 + 8 + k, 5, 2, P["grey1"])
    for px in (x0 + 1, x0 + 29):
        base.vline(px, y0 - 10, y0 + 15, g)
        base.vline(px + 1, y0 - 10, y0 + 15, shade(g, 1.2))
        top.ellipse(px + 1, y0 - 12, 3, 3, (250, 170, 60))
    top.rect(x0 + 4, y0 - 12, 24, 6, (230, 210, 150))
    top.frame(x0 + 4, y0 - 12, 24, 6, g)
    for xx in range(x0 + 6, x0 + 27, 2):
        top.set(xx, y0 - 9, g)


def draw_bouquiniste(base, top, x0, y0):
    """Boîte verte de bouquiniste ouverte sur le parapet (2 cases)."""
    g = (44, 92, 60)
    base.rect(x0, y0 + 4, 32, 10, g)
    base.rect(x0 + 1, y0 + 5, 30, 8, (60, 112, 76))
    top.rect(x0, y0 - 6, 32, 10, g)
    top.rect(x0 + 2, y0 - 4, 28, 6, P["paper2"])
    r = rng(x0)
    for xx in range(x0 + 2, x0 + 30, 3):
        top.rect(xx, y0 - 4 + r.randrange(2), 2, 5, [P["velvet3"], P["blue"], P["gold2"], P["green1"], P["cream"]][r.randrange(5)])


def draw_parapet(base, x0, y0):
    base.rect(x0, y0 + 4, T, 12, (206, 194, 168))
    base.rect(x0, y0 + 4, T, 3, (226, 216, 194))
    base.vline(x0, y0 + 4, y0 + 15, (180, 168, 144))


def draw_easel(base, top, x0, y0):
    base.line(x0 + 4, y0 + 15, x0 + 8, y0 + 2, P["wood1"])
    base.line(x0 + 12, y0 + 15, x0 + 8, y0 + 2, P["wood1"])
    top.rect(x0 + 3, y0 - 2, 11, 9, P["white"])
    top.rect(x0 + 4, y0 - 1, 9, 4, P["sky"])
    top.rect(x0 + 4, y0 + 3, 9, 3, P["green1"])
    top.vline(x0 + 9, y0, y0 + 3, (118, 92, 78))


def water_frames(world):
    m = world["maps"]["paris"]
    gr = m["ground"]
    frames = []
    for f in range(2):
        c = Canvas(len(gr[0]) * T, len(gr) * T)
        for y, row in enumerate(gr):
            for x, k in enumerate(row):
                if k == "~":
                    rr = rng(cell_seed(x, y, 70 + f))
                    for _ in range(2):
                        sx, sy = x * T + 3 + rr.randrange(10), y * T + 3 + rr.randrange(10)
                        c.hline(sx, sx + 3, sy, (240, 210, 170), 190)  # reflets dorés du soir
        frames.append(c)
    return frames


def generate(world, maps_dir):
    if "paris" not in world["maps"]:
        return []
    base, top, lights = render(world)
    base.save(os.path.join(maps_dir, "paris_base.png"))
    top.save(os.path.join(maps_dir, "paris_top.png"))
    m = world["maps"]["paris"]
    C.lights_layer((len(m["grid"][0]) * T, len(m["grid"]) * T), lights).save(os.path.join(maps_dir, "paris_lights.png"))
    a, b = water_frames(world)
    a.save(os.path.join(maps_dir, "paris_water_a.png"))
    b.save(os.path.join(maps_dir, "paris_water_b.png"))
    return ["paris"]

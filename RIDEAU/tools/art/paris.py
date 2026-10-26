"""Dessin du quartier parisien (carte « paris » de world.json, écrite par paris_layout.py) :
immeubles haussmanniens (pierre de taille, balcons filants, toits de zinc à lucarnes),
la gare, le Théâtre des Lumières, la place (manège, fontaine Wallace, métro Guimard,
kiosque, terrasse), les quais de Seine avec les bouquinistes et la tour Eiffel.

Sorties (assets/world/maps/) : paris_base.png, paris_top.png, paris_lights.png,
paris_water_a.png / paris_water_b.png.
"""
import math
import os

from pixel import P, Canvas, shade, rng
import world as W0
import city as C
from world import T, text, text_width, cell_seed

STONE = (236, 224, 198)
ZINC = (112, 124, 142)
IRON = (40, 40, 48)
SHOPS = {
    "paris_cafe": {"name": "CAFE DE LA COMEDIE", "front": (120, 30, 40), "awning": (176, 36, 48), "glass": (250, 220, 160)},
    "paris_boulangerie": {"name": "AU PAIN DORE", "front": (60, 90, 70), "awning": P["gold2"], "glass": P["light"]},
    "paris_librairie": {"name": "LIBRAIRIE", "front": (40, 60, 90), "awning": (60, 90, 130), "glass": (200, 220, 230)},
    "paris_brasserie": {"name": "BRASSERIE LE RIDEAU ROUGE", "front": (110, 24, 34), "awning": (150, 30, 40), "glass": (250, 210, 150)},
    "paris_galerie": {"name": "GALERIE DU PONT-NEUF", "front": (30, 30, 36), "awning": None, "glass": (230, 230, 225)},
    "paris_hotel": {"name": "HOTEL DES ARTISTES", "front": (40, 70, 60), "awning": (40, 90, 70), "glass": (250, 220, 160)},
    "paris_immeuble": {"name": "", "front": None, "awning": None, "glass": None},
}


def mansard(c, x0, y0, w, h, season):
    """Toit de zinc à la Mansard : brisis gris bleu, lucarnes à fronton, cheminées."""
    c.rect(x0, y0 + 4, w, h - 4, ZINC)
    for xx in range(x0, x0 + w, 5):
        c.vline(xx, y0 + 4, y0 + h - 1, shade(ZINC, 1.12))
    c.rect(x0 + 2, y0, w - 4, 5, shade(ZINC, 0.8))
    for cx in range(x0 + 10, x0 + w - 8, 26):  # cheminées
        c.rect(cx, y0 - 3, 7, 6, (178, 104, 80))
        c.rect(cx, y0 - 3, 7, 1, (140, 80, 64))
        for k in range(3):
            c.rect(cx + 1 + k * 2, y0 - 5, 1, 2, (150, 90, 70))
    for dx in range(x0 + 8, x0 + w - 12, 20):  # lucarnes
        c.poly([(dx - 1, y0 + 9), (dx + 5, y0 + 5), (dx + 11, y0 + 9)], STONE)
        c.rect(dx, y0 + 9, 10, 11, STONE)
        c.rect(dx + 2, y0 + 11, 6, 8, P["blue"])
        c.rect(dx + 2, y0 + 11, 6, 2, shade(P["blue"], 1.25))
        c.vline(dx + 5, y0 + 11, y0 + 18, STONE)
    c.hline(x0, x0 + w - 1, y0 + h - 1, P["ink"])
    c.rect(x0, y0 + h, w, 3, shade(STONE, 0.9))         # corniche
    c.hline(x0, x0 + w - 1, y0 + h + 3, shade(STONE, 0.7))


def stone_wall(c, x0, y0, w, h):
    c.rect(x0, y0, w, h, STONE)
    for yy in range(y0 + 5, y0 + h, 7):
        c.hline(x0, x0 + w - 1, yy, shade(STONE, 0.93))
    c.rect(x0, y0, 2, h, shade(STONE, 0.86))
    c.rect(x0 + w - 2, y0, 2, h, shade(STONE, 0.8))


def haussmann(c, b, lights, win):
    """Immeuble haussmannien : un balcon filant au 2e, fenêtres hautes, rez-de-chaussée
    commerçant (devanture, store, enseigne) ou porte cochère."""
    x, y, w, h = b["rect"]
    X0, Y0, PW, PH = x * T, y * T, w * T, h * T
    spec = SHOPS[b["style"]]
    roof_h = 24
    gf = 34  # hauteur du rez-de-chaussée
    stone_wall(c, X0, Y0 + roof_h, PW, PH - roof_h)
    mansard(c, X0, Y0, PW, roof_h, "ete")
    top = Y0 + roof_h + 6
    bottom = Y0 + PH - gf
    rows = max(1, (bottom - top) // 22)
    cols = max(2, (PW - 8) // 20)
    span = (PW - 8) / cols
    for r_ in range(rows):
        wy = top + r_ * 22
        for k in range(cols):
            wx = int(X0 + 4 + k * span + (span - 10) / 2)
            C.draw_window(c, wx, wy, 10, 15, (240, 236, 226), P["blue"], STONE)
            win.append((wx, wy, 10, 15))
        if r_ == 0:  # balcon filant en fer forgé
            c.rect(X0 + 3, wy + 15, PW - 6, 2, IRON)
            c.hline(X0 + 3, X0 + PW - 4, wy + 10, IRON)
            for xx in range(X0 + 3, X0 + PW - 3, 3):
                c.vline(xx, wy + 10, wy + 15, IRON)
            c.rect(X0 + 2, wy + 17, PW - 4, 2, shade(STONE, 0.75))
        elif r_ == rows - 1:  # petits balconnets
            for k in range(cols):
                wx = int(X0 + 4 + k * span + (span - 10) / 2)
                c.rect(wx - 1, wy + 11, 12, 1, IRON)
                for xx in range(wx - 1, wx + 11, 2):
                    c.vline(xx, wy + 11, wy + 15, IRON)
    # Rez-de-chaussée
    gy = Y0 + PH - gf
    c.rect(X0, gy, PW, gf, shade(STONE, 0.95))
    for yy in range(gy + 4, Y0 + PH, 6):  # bossages
        c.hline(X0, X0 + PW - 1, yy, shade(STONE, 0.82))
    dx, dw = C.door_px(b["doors"], Y0 + PH)
    door_h = 18
    if spec["front"] is not None:
        # Bandeau d'enseigne (haut), store (milieu), vitrines et porte (bas) : rien ne se chevauche.
        front = spec["front"]
        c.rect(X0 + 3, gy + 1, PW - 6, 10, front)
        c.hline(X0 + 3, X0 + PW - 4, gy + 1, shade(front, 1.3))
        if spec["name"]:
            label = spec["name"]
            while text_width(label) > PW - 12 and " " in label:
                label = label.rsplit(" ", 1)[0]
            text(c, X0 + PW // 2 - text_width(label) // 2, gy + 3, label, P["gold3"])
        c.rect(X0 + 3, gy + 15, PW - 6, gf - 15, shade(front, 0.85))
        door_zone = (dx - 3, Y0 + PH - door_h - 2, dw + 6, door_h + 2)
        for gx in range(X0 + 6, X0 + PW - 16, 18):
            if C._overlaps((gx, gy + 17, 14, 15), door_zone, 0):
                continue
            c.rect(gx, gy + 17, 14, 15, spec["glass"])
            c.rect(gx, gy + 17, 14, 4, shade(spec["glass"], 1.12))
            rr = rng(gx + gy)
            for _ in range(3):
                c.rect(gx + 2 + rr.randrange(9), gy + 26 + rr.randrange(4), 3, 3,
                       [P["velvet3"], P["gold2"], P["green1"], P["cream"], P["blue"]][rr.randrange(5)])
            win.append((gx, gy + 17, 14, 15))
        if spec["awning"] is not None:
            for i in range(0, PW - 6, 8):
                col = spec["awning"] if (i // 8) % 2 == 0 else P["cream"]
                c.rect(X0 + 3 + i, gy + 11, min(8, PW - 6 - i), 4, col)
                c.set(X0 + 3 + i + 3, gy + 15, col)
                c.set(X0 + 3 + i + 4, gy + 15, col)
            c.hline(X0 + 3, X0 + PW - 4, gy + 16, P["ink"], 80)
    else:  # immeuble : fenêtres à grilles en fer forgé au rez-de-chaussée
        for gx in range(X0 + 8, X0 + PW - 16, 22):
            if C._overlaps((gx - 2, gy, 16, gf), (dx - 6, gy, dw + 12, gf), 0):
                continue
            C.draw_window(c, gx, gy + 10, 12, 16, (240, 236, 226), P["blue"], STONE)
            for xx in range(gx, gx + 12, 3):
                c.vline(xx, gy + 10, gy + 25, IRON)
            win.append((gx, gy + 10, 12, 16))
    # Porte : vitrée pour les commerces, porte cochère en bois sculpté pour l'immeuble
    if spec["front"] is None:
        door_h = 24
    if spec["front"] is None or dw >= 2 * T:
        c.rect(dx - 3, Y0 + PH - door_h - 2, dw + 6, door_h + 2, shade(STONE, 0.7))
        if spec["front"] is None:
            c.ellipse(dx + dw // 2, Y0 + PH - door_h, dw // 2 + 2, 5, shade(STONE, 0.7))
        c.rect(dx, Y0 + PH - door_h, dw, door_h, (60, 76, 70))
        c.vline(dx + dw // 2, Y0 + PH - door_h, Y0 + PH - 1, P["ink"])
        for yy in range(Y0 + PH - door_h + 3, Y0 + PH - 2, 6):
            c.rect(dx + 2, yy, dw // 2 - 4, 4, (74, 92, 84))
            c.rect(dx + dw // 2 + 2, yy, dw // 2 - 4, 4, (74, 92, 84))
        c.set(dx + dw // 2 - 2, Y0 + PH - 9, P["gold3"])
        c.set(dx + dw // 2 + 1, Y0 + PH - 9, P["gold3"])
    else:
        c.rect(dx + 1, Y0 + PH - door_h, T - 2, door_h, P["ink"])
        c.rect(dx + 2, Y0 + PH - door_h + 1, T - 4, door_h - 1, shade(spec["front"], 1.2))
        c.rect(dx + 4, Y0 + PH - door_h + 3, T - 8, 8, spec["glass"])
        c.set(dx + T - 5, Y0 + PH - 7, P["gold3"])
    for lx in (dx - 6, dx + dw + 3):
        c.rect(lx, Y0 + PH - door_h, 3, 5, IRON)
        c.rect(lx + 1, Y0 + PH - door_h + 1, 1, 3, P["light"])
        lights.append(("sconce", lx + 1, Y0 + PH - door_h + 2))
    c.hline(X0, X0 + PW - 1, Y0 + PH - 1, shade(STONE, 0.55))


def theatre(c, b, lights, win):
    """Le Théâtre des Lumières : dôme de cuivre, lyre dorée, colonnes, marquise lumineuse."""
    x, y, w, h = b["rect"]
    X0, Y0, PW, PH = x * T, y * T, w * T, h * T
    patina = (96, 160, 140)
    stone_wall(c, X0, Y0 + 20, PW, PH - 20)
    c.rect(X0, Y0 + 6, PW, 16, patina)
    for xx in range(X0, X0 + PW, 6):
        c.vline(xx, Y0 + 6, Y0 + 21, shade(patina, 1.15))
    c.ellipse(X0 + PW // 2, Y0 + 10, 34, 12, patina)
    c.ellipse(X0 + PW // 2, Y0 + 10, 30, 9, shade(patina, 1.12))
    cx = X0 + PW // 2
    c.ellipse(cx, Y0 + 2, 5, 5, P["gold2"])  # lyre dorée
    c.ellipse(cx, Y0 + 2, 3, 3, patina)
    c.vline(cx, Y0 - 2, Y0 + 6, P["gold3"])
    c.rect(X0, Y0 + 21, PW, 3, P["gold1"])
    # Enseigne
    label = "THEATRE DES LUMIERES"
    c.rect(cx - text_width(label) // 2 - 6, Y0 + 27, text_width(label) + 12, 11, P["velvet1"])
    c.frame(cx - text_width(label) // 2 - 6, Y0 + 27, text_width(label) + 12, 11, P["gold2"])
    text(c, cx - text_width(label) // 2, Y0 + 29, label, P["gold3"])
    # Colonnes et fenêtres cintrées
    for i in range(7):
        px = X0 + 10 + i * (PW - 24) // 6
        c.rect(px, Y0 + 42, 6, PH - 74, shade(STONE, 1.03))
        c.vline(px + 5, Y0 + 42, Y0 + PH - 33, shade(STONE, 0.8))
        c.rect(px - 1, Y0 + 40, 8, 3, shade(STONE, 0.85))
    for i in range(6):
        wx = X0 + 20 + i * (PW - 24) // 6
        c.rect(wx, Y0 + 48, 12, 24, P["ink"])
        c.ellipse(wx + 6, Y0 + 48, 6, 5, P["ink"])
        c.rect(wx + 1, Y0 + 49, 10, 22, (250, 210, 140))
        c.ellipse(wx + 6, Y0 + 49, 5, 4, (250, 210, 140))
        c.vline(wx + 6, Y0 + 45, Y0 + 70, P["gold1"])
        win.append((wx + 1, Y0 + 49, 10, 22))
    # Marquise en verre et ampoules
    my = Y0 + PH - 34
    c.rect(X0 + 40, my, PW - 80, 6, P["ink"])
    c.rect(X0 + 41, my + 1, PW - 82, 3, (200, 220, 230))
    for bx in range(X0 + 42, X0 + PW - 40, 4):
        c.set(bx, my + 5, P["light"])
    lights.append(("marquee", cx, my + 6))
    # Affiches de chaque côté de la porte (le titre est écrit par le jeu)
    for px in (X0 + 30, X0 + PW - 50):
        c.rect(px, Y0 + PH - 26, 20, 22, P["gold1"])
        c.rect(px + 2, Y0 + PH - 24, 16, 18, P["velvet3"])
        c.rect(px + 4, Y0 + PH - 22, 12, 6, P["cream"])
        c.hline(px + 4, px + 15, Y0 + PH - 13, P["gold3"])
        c.hline(px + 4, px + 12, Y0 + PH - 10, P["cream"])
    # Portes rouges et marches
    dx, dw = C.door_px(b["doors"], Y0 + PH)
    c.rect(dx - 4, Y0 + PH - 26, dw + 8, 26, P["gold1"])
    c.ellipse(dx + dw // 2, Y0 + PH - 25, dw // 2 + 4, 6, P["gold1"])
    W0.double_door(c, dx, Y0 + PH - 22, P["velvet2"], h=22)
    c.rect(X0 + 24, Y0 + PH - 3, PW - 48, 3, P["grey3"])
    for lx in (dx - 10, dx + dw + 7):
        lights.append(("sconce", lx, Y0 + PH - 20))
        c.rect(lx - 1, Y0 + PH - 22, 3, 5, P["gold2"])


def gare(c, b, lights, win):
    """Gare de Paris-Est : grande verrière en demi-lune, horloge, ailes en pierre."""
    x, y, w, h = b["rect"]
    X0, Y0, PW, PH = x * T, y * T, w * T, h * T
    stone_wall(c, X0, Y0 + 14, PW, PH - 14)
    c.rect(X0, Y0 + 8, PW, 8, ZINC)
    for xx in range(X0, X0 + PW, 5):
        c.vline(xx, Y0 + 8, Y0 + 15, shade(ZINC, 1.12))
    cx = X0 + PW // 2
    c.ellipse(cx, Y0 + 66, 50, 46, shade(STONE, 0.85))
    c.ellipse(cx, Y0 + 66, 46, 42, (170, 200, 214))
    for a in range(0, 180, 15):  # rayons de la verrière
        r_ = math.radians(a)
        c.line(cx, Y0 + 66, int(cx - 46 * math.cos(r_)), int(Y0 + 66 - 42 * math.sin(r_)), shade(STONE, 0.7))
    for rr in (16, 30):
        for a in range(0, 181, 3):
            r_ = math.radians(a)
            c.set(int(cx - rr * math.cos(r_)), int(Y0 + 66 - rr * 0.9 * math.sin(r_)), shade(STONE, 0.7))
    c.rect(cx - 50, Y0 + 66, 100, PH - 66, STONE)
    c.ellipse(cx, Y0 + 20, 8, 8, P["gold1"])  # horloge
    c.ellipse(cx, Y0 + 20, 6, 6, P["white"])
    c.vline(cx, Y0 + 16, Y0 + 20, P["ink"])
    c.hline(cx, cx + 4, Y0 + 20, P["ink"])
    label = "GARE DE PARIS-EST"
    c.rect(cx - text_width(label) // 2 - 4, Y0 + 70, text_width(label) + 8, 10, P["navy"])
    text(c, cx - text_width(label) // 2, Y0 + 72, label, P["cream"])
    for side in (X0 + 6, X0 + PW - 34):
        for r_ in range(3):
            for k in range(2):
                wx, wy = side + k * 16, Y0 + 30 + r_ * 26
                C.draw_window(c, wx, wy, 10, 16, (240, 236, 226), P["blue"], STONE)
                win.append((wx, wy, 10, 16))
    dx, dw = C.door_px(b["doors"], Y0 + PH)
    for k in range(3):
        ax = cx - 42 + k * 30
        c.rect(ax, Y0 + PH - 30, 24, 30, shade(STONE, 0.72))
        c.ellipse(ax + 12, Y0 + PH - 30, 12, 7, shade(STONE, 0.72))
        c.rect(ax + 3, Y0 + PH - 28, 18, 28, (60, 70, 80))
        c.ellipse(ax + 12, Y0 + PH - 28, 9, 5, (60, 70, 80))
        c.rect(ax + 4, Y0 + PH - 26, 16, 10, (200, 220, 230))
    lights.append(("marquee", cx, Y0 + PH - 20))


def eiffel(c, x0, y0, h):
    """La tour Eiffel au loin, en dentelle de fer (silhouette)."""
    col = (92, 84, 96)
    base_w = int(h * 0.62)
    for yy in range(h):
        t = yy / h
        half = int(base_w / 2 * (1 - t) ** 1.9) + 1
        cy = y0 + h - 1 - yy
        c.set(x0 - half, cy, col)
        c.set(x0 + half, cy, col)
        if yy % 4 == 0:
            c.hline(x0 - half, x0 + half, cy, col)
        if yy % 8 == 2:
            for xx in range(x0 - half + 1, x0 + half, 2):
                c.set(xx, cy, col)
    for frac in (0.18, 0.42, 0.66):  # plateformes
        cy = y0 + h - int(h * frac)
        half = int(base_w / 2 * (1 - frac) ** 1.9) + 3
        c.rect(x0 - half, cy - 1, 2 * half + 1, 2, col)
    c.ellipse(x0, y0 + h - 2, base_w // 4, base_w // 6, P["ink"], 90)  # arche
    c.vline(x0, y0 - 6, y0, col)


def skyline(c, x0, y0, w, h, seed):
    """Toits de Paris au loin (autre rive) : zinc, cheminées, un dôme."""
    r = rng(seed)
    c.rect(x0, y0, w, h, (160, 176, 196))
    x = x0
    while x < x0 + w:
        bw = r.randrange(18, 40)
        bh = r.randrange(h // 3, h - 6)
        c.rect(x, y0 + h - bh, bw, bh, (128, 136, 156))
        c.rect(x, y0 + h - bh, bw, 4, (110, 118, 138))
        for wx in range(x + 3, x + bw - 3, 6):
            c.rect(wx, y0 + h - bh + 7, 2, 3, (220, 210, 170))
        c.rect(x + 4, y0 + h - bh - 3, 3, 3, (150, 100, 90))
        x += bw
    c.ellipse(x0 + w // 5, y0 + h - 36, 14, 12, (180, 170, 140))  # dôme
    c.vline(x0 + w // 5, y0 + h - 52, y0 + h - 46, (180, 170, 140))


def draw_wallace(base, top, x0, y0):
    """Fontaine Wallace (2×2 cases) : vasque, quatre cariatides, dôme vert sombre."""
    g = (36, 84, 64)
    base.rect(x0 + 6, y0 + 22, 20, 8, P["grey2"])
    base.ellipse(x0 + 16, y0 + 24, 12, 5, (120, 170, 210))
    base.rect(x0 + 10, y0 + 6, 12, 18, g)
    for k in range(4):
        base.vline(x0 + 11 + k * 3, y0 + 8, y0 + 22, shade(g, 1.35))
    top.ellipse(x0 + 16, y0 + 4, 9, 6, g)
    top.rect(x0 + 15, y0 - 3, 2, 4, g)
    base.vline(x0 + 16, y0 + 16, y0 + 23, (170, 210, 240))


def draw_carousel(base, top, x0, y0):
    """Manège (3×3 cases) : chevaux de bois, toit rayé, mât doré."""
    cols = [P["velvet3"], P["cream"]]
    base.ellipse(x0 + 24, y0 + 36, 22, 9, P["wood1"])
    base.ellipse(x0 + 24, y0 + 35, 20, 7, P["wood3"])
    for k in range(5):
        hx = x0 + 6 + k * 9
        base.vline(hx + 3, y0 + 14, y0 + 34, P["gold2"])
        base.rect(hx, y0 + 26, 8, 5, [P["white"], P["gold3"], (200, 120, 90), P["sky"], P["white"]][k])
        base.rect(hx + 6, y0 + 23, 3, 4, [P["white"], P["gold3"], (200, 120, 90), P["sky"], P["white"]][k])
    for i in range(12):
        a0 = math.pi + i * math.pi / 12
        a1 = a0 + math.pi / 12
        top.poly([(x0 + 24, y0 - 2), (x0 + 24 + int(24 * math.cos(a0)), y0 + 14), (x0 + 24 + int(24 * math.cos(a1)), y0 + 14)], cols[i % 2])
    top.hline(x0, x0 + 47, y0 + 14, P["gold2"])
    for xx in range(x0 + 2, x0 + 46, 4):
        top.set(xx, y0 + 15, P["light"])
    top.rect(x0 + 23, y0 - 6, 2, 5, P["gold3"])


def draw_metro(base, top, x0, y0):
    """Entrée de métro façon Guimard (2 cases) : rampe verte, lampes ambrées, enseigne."""
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
    base.rect(x0, y0 + 4, T, 12, (196, 184, 160))
    base.rect(x0, y0 + 4, T, 3, (214, 204, 182))
    base.vline(x0, y0 + 4, y0 + 15, (170, 158, 136))


def draw_easel(base, top, x0, y0):
    base.line(x0 + 4, y0 + 15, x0 + 8, y0 + 2, P["wood1"])
    base.line(x0 + 12, y0 + 15, x0 + 8, y0 + 2, P["wood1"])
    top.rect(x0 + 3, y0 - 2, 11, 9, P["white"])
    top.rect(x0 + 4, y0 - 1, 9, 4, P["sky"])
    top.rect(x0 + 4, y0 + 3, 9, 3, P["green1"])
    top.vline(x0 + 9, y0, y0 + 3, (92, 84, 96))


def render(world):
    m = world["maps"]["paris"]
    g, gr = m["grid"], m["ground"]
    Wt, Ht = len(g[0]), len(g)
    base = Canvas(Wt * T, Ht * T, P["ink"])
    top = Canvas(Wt * T, Ht * T)
    lights = []
    season = "ete"
    # 1. Sol
    for y in range(Ht):
        for x in range(Wt):
            k = gr[y][x]
            x0, y0 = x * T, y * T
            if k in "_=z":
                W0.ground(base, x0, y0, k, x, y, season)
            elif k == "+":
                C.paving(base, x0, y0, x, y, season)
            elif k == "a":
                C.alley_paving(base, x0, y0, x, y, season, g[y][x - 1] in "HXd", x + 1 < Wt and g[y][x + 1] in "HXd")
            elif k == "~":
                C.water(base, x0, y0, x, y, season)
            elif k == "H":
                base.rect(x0, y0, T, T, (110, 100, 110))
            else:
                base.rect(x0, y0, T, T, (126, 134, 152))
    # Toits de Paris derrière la rangée nord, autre rive et tour Eiffel au sud.
    skyline(base, T, T, (Wt - 2) * T, 3 * T, 11)
    for x0 in (16, 26, 43, 51):  # murs mitoyens en retrait entre les immeubles du nord
        base.rect(x0 * T, 4 * T, T, 8 * T, shade(STONE, 0.72))
        base.rect(x0 * T, 4 * T, T, 26, shade(ZINC, 0.8))
        for yy in range(4 * T + 30, 12 * T, 7):
            base.hline(x0 * T, x0 * T + T - 1, yy, shade(STONE, 0.64))
        base.vline(x0 * T, 4 * T, 12 * T - 1, P["ink"], 120)
        base.vline(x0 * T + T - 1, 4 * T, 12 * T - 1, P["ink"], 70)
    skyline(base, T, 47 * T, (Wt - 2) * T, 4 * T, 23)
    eiffel(base, 42 * T, 47 * T + 1, 4 * T - 2)
    for y in range(Ht):  # bordures de trottoir
        for x in range(Wt):
            if gr[y][x] == "_" and y + 1 < Ht and gr[y + 1][x] in "=z":
                base.hline(x * T, x * T + T - 1, y * T + T - 1, P["grey3"])
            if gr[y][x] == "_" and y > 0 and gr[y - 1][x] in "=z":
                base.hline(x * T, x * T + T - 1, y * T, P["grey3"])
    # 2. Bâtiments
    win = []
    for b in m["buildings"]:
        if b["style"] == "paris_theatre":
            theatre(base, b, lights, win)
        elif b["style"] == "paris_gare":
            gare(base, b, lights, win)
        else:
            haussmann(base, b, lights, win)
    for y in range(1, Ht):  # ombre au pied des façades
        for x in range(Wt):
            if g[y][x] not in "HXd~" and g[y - 1][x] in "HXd" and gr[y - 1][x] != "~":
                for k, a in enumerate((90, 55, 25)):
                    base.hline(x * T, x * T + T - 1, y * T + k, P["ink"], a)
    # 3. Objets
    done = set()
    for d in m.get("decor", []):
        if d["kind"] == "boat":
            C.draw_boat(base, d["cell"][0] * T - 6, d["cell"][1] * T, 3)
    for y in range(Ht):
        for x in range(Wt):
            if (x, y) in done:
                continue
            k = g[y][x]
            x0, y0 = x * T, y * T
            if k == "T":
                base.ellipse(x0 + 8, y0 + 13, 7, 3, IRON)  # grille d'arbre
                W0.draw_tree(base, top, x0, y0, season, cell_seed(x, y))
            elif k == "L":
                W0.draw_lamp(base, top, x0, y0)
                lights.append(("lamp", x0 + 8, y0 - 6))
            elif k == "K":
                W0.draw_morris(base, top, x0, y0)
                lights.append(("small", x0 + 8, y0 - 4))
            elif k == "B":
                if x + 1 < Wt and g[y][x + 1] == "B":
                    W0.draw_bench(base, x0, y0, 32)
                    done.add((x + 1, y))
                else:
                    W0.draw_bench(base, x0, y0, 16)
            elif k == "t":
                W0.draw_table(base, top, x0, y0, season)
            elif k == "F":
                draw_wallace(base, top, x0, y0)
                done.update({(x + 1, y), (x, y + 1), (x + 1, y + 1)})
            elif k == "Q":
                draw_carousel(base, top, x0, y0)
                done.update({(x + i, y + j) for i in range(3) for j in range(3)})
                lights.append(("small", x0 + 24, y0 + 14))
            elif k == "m":
                draw_metro(base, top, x0, y0)
                done.add((x + 1, y))
                lights.append(("small", x0 + 2, y0 - 12))
                lights.append(("small", x0 + 30, y0 - 12))
            elif k == "N":
                C.draw_kiosk(base, top, x0, y0, season)
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
                W0.draw_flowers(base, x0, y0, season)
            elif k == "x":
                W0.draw_crate(base, x0, y0)
            elif k == "R":
                W0.draw_rack(base, top, x0, y0, T)
            elif k == "V":
                C.draw_bikes(base, x0, y0, x)
            elif k == "o":
                C.draw_pot(base, top, x0, y0, season)
            elif k == "E":
                C.draw_bin(base, x0, y0)
    # Guirlandes de fête au-dessus du boulevard : c'est soir de première.
    cols = [P["velvet4"], P["gold3"], (120, 200, 120), (130, 180, 240)]
    for (yy, xa, xb) in [(12, 1, 58), (17, 17, 43)]:
        for i, xx in enumerate(range(xa * T, xb * T, 12)):
            sag = int(3 * math.sin(math.pi * ((xx - xa * T) % 96) / 96))
            top.set(xx, yy * T - 4 + sag, cols[i % 4])
            lights.append(("small", xx, yy * T - 4 + sag)) if i % 6 == 0 else None
    for wr in win:
        lights.append(("window", wr))
    return base, top, lights


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
                        c.hline(sx, sx + 2, sy, (240, 210, 170), 200)  # reflets dorés du soir
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

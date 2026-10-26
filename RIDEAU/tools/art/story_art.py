"""Images des scènes de fin de saison (320×180, affichées ×4) :

- le voyage en train vers Paris : ciels (jour, soir), couches de paysage qui défilent
  en parallaxe (campagne puis Paris), voie ferrée, et le train avec la troupe aux fenêtres ;
- la première au Théâtre des Lumières : la salle comble, la scène selon le décor et les
  costumes choisis avec le metteur en scène (3 × 3 variantes), les saluts.

Sorties : assets/story/train/*.png, assets/story/premiere/*.png
Appelé par generate_art.py.
"""
import math
import os

from pixel import P, Canvas, shade, rng


W, H = 320, 180


# --- Le train -------------------------------------------------------------------------

def sky(day):
    c = Canvas(W, H)
    top, bottom = ((96, 150, 214), (196, 222, 240)) if day else ((70, 60, 120), (246, 170, 110))
    for y in range(H):
        t = y / (H - 1)
        c.hline(0, W - 1, y, tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    r = rng(5 if day else 6)
    for _ in range(6):  # nuages
        cx, cy = r.randrange(W), r.randrange(10, 70)
        col = (250, 250, 252) if day else (250, 200, 170)
        for k in range(4):
            c.ellipse(cx + k * 9 - 14, cy + (k % 2) * 2, 9, 5, col, 200)
    if not day:
        c.ellipse(250, 118, 16, 16, (255, 220, 150), 220)
    return c


def hills(seed, base_col, w=640, h=80, village=True):
    """Collines lointaines (bouclent sur la largeur) avec villages et clochers."""
    c = Canvas(w, h)
    r = rng(seed)
    phase = [r.random() * 6.28 for _ in range(3)]
    for x in range(w):
        t = x / w * 2 * math.pi
        y = int(h * 0.45 + 8 * math.sin(t * 2 + phase[0]) + 5 * math.sin(t * 5 + phase[1]) + 3 * math.sin(t * 9 + phase[2]))
        c.vline(x, y, h - 1, base_col)
        c.set(x, y, shade(base_col, 1.15))
    if village:
        for vx in range(30, w, 160):
            gy = int(h * 0.45 + 8 * math.sin(vx / w * 2 * math.pi * 2 + phase[0]) + 5 * math.sin(vx / w * 2 * math.pi * 5 + phase[1]))
            for k in range(5):
                hx = vx + k * 7
                c.rect(hx, gy - 6, 6, 6, (220, 206, 186))
                c.poly([(hx - 1, gy - 6), (hx + 3, gy - 9), (hx + 7, gy - 6)], (170, 90, 70))
            c.rect(vx + 14, gy - 16, 4, 10, (210, 200, 186))  # clocher
            c.poly([(vx + 13, gy - 16), (vx + 16, gy - 22), (vx + 19, gy - 16)], (90, 90, 110))
    return c


def fields(seed, w=640, h=70):
    """Plan moyen : champs, haies, arbres, bottes de foin, vaches, poteaux caténaires."""
    c = Canvas(w, h)
    r = rng(seed)
    for x in range(0, w, 80):
        col = [(150, 186, 90), (196, 180, 90), (120, 170, 90), (170, 196, 110)][(x // 80) % 4]
        c.rect(x, 26, 80, h - 26, col)
        for yy in range(30, h, 6):
            c.hline(x, x + 79, yy, shade(col, 0.92))
    c.hline(0, w - 1, 26, (90, 130, 70))
    for x in range(10, w, 37):  # arbres et haies
        s = r.randrange(7, 12)
        c.rect(x + s - 1, 24 - s // 2, 2, s, (90, 66, 46))
        c.ellipse(x + s, 22 - s, s, s - 2, (64, 120, 62))
        c.ellipse(x + s - 3, 24 - s, s // 2, s // 2, (84, 146, 76))
    for x in range(40, w, 130):  # bottes de foin et vaches
        c.ellipse(x, 40, 5, 4, (220, 190, 110))
        c.rect(x + 40, 44, 10, 5, P["white"])
        c.rect(x + 42, 44, 3, 2, P["ink"])
        c.rect(x + 49, 42, 3, 3, P["white"])
        c.rect(x + 41, 49, 1, 3, P["ink"])
        c.rect(x + 48, 49, 1, 3, P["ink"])
    for x in range(0, w, 64):  # poteaux de caténaire
        c.rect(x, 4, 2, h - 4, (80, 80, 90))
        c.hline(x - 6, x + 8, 6, (80, 80, 90))
    c.hline(0, w - 1, 9, (60, 60, 70))
    return c


def paris_far(w=640, h=100):
    """Paris à l'horizon : toits, Sacré-Cœur, tour Eiffel, au soleil couchant."""
    c = Canvas(w, h)
    r = rng(31)
    col = (120, 104, 150)
    x = 0
    while x < w:
        bw = r.randrange(14, 34)
        bh = r.randrange(16, 40)
        c.rect(x, h - bh, bw, bh, col)
        for wx in range(x + 3, x + bw - 2, 5):
            for wy in range(h - bh + 5, h - 3, 7):
                if r.random() < 0.4:
                    c.rect(wx, wy, 2, 2, (255, 210, 140))
        x += bw
    for ex in (150, 470):  # tour Eiffel (deux fois : le décor boucle)
        th = 90
        for yy in range(th):
            t = yy / th
            half = int(26 * (1 - t) ** 1.9) + 1
            cy = h - 1 - yy
            c.set(ex - half, cy, (70, 60, 96))
            c.set(ex + half, cy, (70, 60, 96))
            if yy % 4 == 0:
                c.hline(ex - half, ex + half, cy, (70, 60, 96))
        for frac in (0.18, 0.42, 0.66):
            cy = h - int(th * frac)
            half = int(26 * (1 - frac) ** 1.9) + 3
            c.rect(ex - half, cy - 1, 2 * half + 1, 2, (70, 60, 96))
        c.set(ex, h - th - 3, (255, 230, 150))
    for sx in (330,):  # Sacré-Cœur
        c.ellipse(sx, h - 46, 12, 10, (232, 222, 214))
        c.rect(sx - 14, h - 40, 28, 40, (232, 222, 214))
        c.ellipse(sx - 16, h - 40, 5, 5, (232, 222, 214))
        c.ellipse(sx + 16, h - 40, 5, 5, (232, 222, 214))
        c.vline(sx, h - 62, h - 56, (232, 222, 214))
    return c


def suburbs(w=640, h=70):
    """Plan moyen parisien : immeubles, ponts métalliques, poteaux caténaires."""
    c = Canvas(w, h)
    r = rng(37)
    x = 0
    while x < w:
        bw = r.randrange(30, 60)
        bh = r.randrange(26, 54)
        wall = [(214, 200, 176), (200, 186, 170), (226, 214, 190)][r.randrange(3)]
        c.rect(x, h - bh, bw, bh, wall)
        c.rect(x, h - bh, bw, 6, (112, 124, 142))
        for wx in range(x + 4, x + bw - 4, 8):
            for wy in range(h - bh + 10, h - 6, 10):
                c.rect(wx, wy, 4, 6, (255, 200, 130) if r.random() < 0.5 else (90, 110, 140))
        x += bw + r.randrange(2, 10)
    for x in range(0, w, 64):
        c.rect(x, 4, 2, h - 4, (70, 70, 80))
        c.hline(x - 6, x + 8, 6, (70, 70, 80))
    c.hline(0, w - 1, 9, (50, 50, 60))
    return c


def rails(w=640, h=24):
    c = Canvas(w, h)
    c.rect(0, 4, w, h - 4, (120, 110, 100))
    r = rng(9)
    for _ in range(w * 2):
        c.set(r.randrange(w), 4 + r.randrange(h - 4), [(140, 130, 120), (100, 92, 84)][r.randrange(2)])
    for x in range(0, w, 8):
        c.rect(x, 6, 5, 4, (90, 70, 56))
    c.hline(0, w - 1, 6, (190, 190, 200))
    c.hline(0, w - 1, 9, (160, 160, 170))
    return c


def grass(w=640, h=30):
    """Premier plan : herbes hautes et fleurs qui filent très vite."""
    c = Canvas(w, h)
    r = rng(13)
    for x in range(w):
        hh = r.randrange(8, 18)
        c.vline(x, h - hh, h - 1, [(70, 130, 60), (90, 150, 70), (60, 116, 54)][r.randrange(3)])
    for _ in range(40):
        c.set(r.randrange(w), r.randrange(h - 16, h - 6), [P["gold3"], P["white"], (230, 120, 170)][r.randrange(3)])
    return c


def train():
    """Le train vu de côté : motrice et deux voitures ; la troupe aux fenêtres."""
    w, h = 300, 44
    c = Canvas(w, h)
    body = (226, 230, 236)
    stripe = (40, 90, 160)
    # Motrice (à droite, profilée)
    c.rect(200, 6, 92, 30, body)
    c.poly([(290, 6), (299, 26), (299, 36), (290, 36)], body)
    c.rect(270, 10, 22, 9, (60, 80, 110))
    c.rect(200, 26, 99, 4, stripe)
    c.rect(200, 30, 99, 2, P["gold2"])
    # Voitures
    faces = [("lazare", P["grey2"]), ("helene", P["grey3"]), ("bastien", P["ink"]), ("louison", P["purple2"]),
             ("ines", P["wood0"]), ("joueur", P["wood1"]), ("comedien", P["velvet1"]), ("comedienne", P["gold1"])]
    for k, x0 in enumerate((2, 101)):
        c.rect(x0, 6, 96, 30, body)
        c.rect(x0, 26, 96, 4, stripe)
        c.rect(x0, 30, 96, 2, P["gold2"])
        for i in range(4):
            wx = x0 + 6 + i * 23
            c.rect(wx, 11, 18, 11, (60, 80, 110))
            c.rect(wx, 11, 18, 3, (90, 116, 150))
            who, hair = faces[(k * 4 + i) % len(faces)]
            c.ellipse(wx + 9, 18, 3, 3, P["skin%d" % ((k * 4 + i) % 5)])
            c.rect(wx + 6, 14, 7, 3, hair)
            c.rect(wx + 6, 21, 7, 1, (60, 80, 110))
        c.rect(x0 + 94, 8, 4, 26, (180, 186, 196))  # soufflet
    c.rect(0, 4, w - 8, 2, (180, 186, 196))  # toit
    c.rect(200, 2, 4, 4, (60, 60, 70))
    c.line(202, 2, 230, -6, (60, 60, 70))  # pantographe
    for bx in (12, 70, 112, 170, 214, 270):  # bogies
        c.rect(bx, 36, 18, 4, (50, 50, 60))
        c.ellipse(bx + 4, 40, 3, 3, (40, 40, 48))
        c.ellipse(bx + 14, 40, 3, 3, (40, 40, 48))
    c.outline(P["ink"])
    return c


# --- La première ----------------------------------------------------------------------

def proscenium(c, curtain_open=True):
    """Cadre de scène doré et rideaux de velours."""
    c.rect(0, 0, W, 18, (110, 20, 34))
    for x in range(0, W, 12):  # lambrequin
        c.ellipse(x + 6, 18, 6, 4, (130, 26, 42))
    c.hline(0, W - 1, 22, P["gold2"])
    side = 40 if curtain_open else 160
    for x0, x1 in ((0, side), (W - side, W)):
        for x in range(x0, x1):
            col = [(130, 26, 42), (150, 34, 50), (110, 20, 34)][((x - x0) // 4) % 3]
            c.vline(x, 18, H - 30, col)
    c.rect(0, H - 30, W, 30, (60, 30, 24))
    c.hline(0, W - 1, H - 30, P["gold1"])


def stage_floor(c):
    for y in range(120, H - 30):
        c.hline(40, W - 41, y, shade((176, 130, 80), 0.75 + (y - 120) * 0.006))
    for y in range(124, H - 30, 6):
        c.hline(40, W - 41, y, (120, 84, 50))


def backdrop(c, decor):
    if decor == "monumental":
        c.rect(40, 22, W - 80, 98, (200, 180, 150))
        for x in range(60, W - 60, 40):
            c.rect(x, 30, 12, 90, (236, 226, 204))
            c.rect(x - 2, 28, 16, 4, (210, 196, 170))
        c.poly([(110, 120), (160, 70), (210, 120)], (220, 206, 180))  # escalier
        for k in range(8):
            c.hline(110 + k * 6, 210 - k * 6, 120 - k * 6, (190, 176, 150))
        c.ellipse(160, 36, 16, 6, P["gold2"])  # lustre
        for k in range(7):
            c.set(146 + k * 5, 42, P["light"])
    elif decor == "plateau_nu":
        c.rect(40, 22, W - 80, 98, (16, 14, 22))
        for cx in (110, 210):
            for y in range(22, 140):
                half = int((y - 22) * 0.35)
                for x in range(cx - half, cx + half):
                    c.set(x, y, (255, 240, 200), 40)
    else:  # récupération
        c.rect(40, 22, W - 80, 98, (90, 76, 70))
        r = rng(4)
        for x in range(56, W - 60, 34):
            col = [(170, 120, 80), (120, 150, 160), (190, 160, 110), (140, 90, 90)][r.randrange(4)]
            c.rect(x, 40 + r.randrange(20), 24, 60, col)  # vieilles portes et toiles peintes
            c.frame(x, 40 + r.randrange(2), 24, 60, shade(col, 0.7))
            c.ellipse(x + 20, 72, 1, 1, P["gold3"])
        for x in (90, 230):
            c.rect(x, 104, 12, 3, (130, 90, 60))  # chaises
            c.rect(x, 96, 2, 14, (130, 90, 60))
            c.rect(x + 10, 107, 2, 7, (130, 90, 60))
        c.hline(40, W - 41, 30, (60, 60, 60))
        for x in range(50, W - 50, 20):
            c.set(x, 31, P["light"])


COSTUMES = {
    "epoque": [(150, 40, 60), (60, 70, 140), (200, 170, 90), (90, 120, 80), (170, 120, 160)],
    "contemporains": [(60, 80, 120), (40, 40, 50), (180, 180, 190), (120, 90, 70), (200, 60, 60)],
    "atelier": [(230, 120, 60), (60, 160, 150), (220, 190, 60), (180, 80, 160), (90, 170, 90)],
}


def actor(c, x, y, cloth, style, k, bow=False):
    """Comédien en costume (silhouette 10×30, vue de face)."""
    skin = P["skin%d" % (k % 6)]
    hair = P["white"] if style == "epoque" else [P["ink"], P["wood1"], P["gold1"], P["velvet1"], P["grey2"]][k % 5]
    dy = 6 if bow else 0
    if style == "epoque" and k % 2 == 0:  # robe à panier
        c.poly([(x - 8, y + 30), (x + 5, y + 10 + dy), (x + 18, y + 30)], cloth)
    else:
        c.rect(x, y + 20, 3, 10, shade(cloth, 0.7))
        c.rect(x + 7, y + 20, 3, 10, shade(cloth, 0.7))
    c.rect(x, y + 8 + dy, 10, 13, cloth)
    if style == "atelier":  # patchwork
        c.rect(x + 2, y + 10 + dy, 3, 3, shade(cloth, 1.3))
        c.rect(x + 6, y + 15 + dy, 3, 3, shade(cloth, 0.75))
    if style == "contemporains" and k % 2:
        c.rect(x + 4, y + 9 + dy, 2, 8, P["white"])  # chemise et cravate
    c.ellipse(x + 5, y + 4 + dy, 4, 4, skin)
    c.rect(x + 1, y + dy, 8, 3, hair)
    if style == "epoque":
        c.rect(x, y + 1 + dy, 2, 6, hair)
        c.rect(x + 8, y + 1 + dy, 2, 6, hair)
    if bow:
        c.rect(x - 2, y + 12, 3, 2, skin)
        c.rect(x + 9, y + 12, 3, 2, skin)


def stage(decor, costumes, bows=False):
    c = Canvas(W, H)
    c.rect(0, 0, W, H, P["ink"])
    backdrop(c, decor)
    stage_floor(c)
    cols = COSTUMES[costumes]
    for k in range(5):
        actor(c, 92 + k * 30, 96 + (k % 2) * 6, cols[k], costumes, k, bow=bows)
    if bows:
        r = rng(8)
        for _ in range(18):  # fleurs lancées sur scène
            fx, fy = r.randrange(60, W - 60), r.randrange(128, 145)
            c.rect(fx, fy, 2, 2, [P["velvet4"], P["gold3"], P["white"], (240, 160, 200)][r.randrange(4)])
            c.set(fx + 2, fy + 1, (70, 130, 60))
    proscenium(c)
    # Têtes du public au premier rang
    for x in range(4, W, 14):
        c.ellipse(x, H - 6, 6, 7, (30, 22, 30))
    return c


def auditorium():
    """La salle à l'italienne du Théâtre des Lumières, comble, vue depuis la scène."""
    c = Canvas(W, H)
    c.rect(0, 0, W, H, (70, 16, 26))
    c.ellipse(W // 2, 6, 40, 14, (240, 214, 150))  # lustre
    for k in range(12):
        c.set(W // 2 - 33 + k * 6, 14, P["white"])
    r = rng(17)
    for row, y in enumerate((30, 62, 94)):  # balcons dorés
        c.rect(0, y + 16, W, 4, P["gold2"])
        c.hline(0, W - 1, y + 20, P["gold1"])
        for x in range(4, W, 10):
            c.ellipse(x, y + 10, 4, 5, P["skin%d" % r.randrange(6)])
            c.rect(x - 4, y + 13, 8, 4, [P["velvet3"], P["navy"], P["ink"], P["gold1"], P["teal"]][r.randrange(5)])
    for y in range(124, H, 9):  # orchestre
        for x in range(2 + (y // 9) % 2 * 5, W, 10):
            c.ellipse(x, y, 4, 5, P["skin%d" % r.randrange(6)])
            c.rect(x - 4, y + 3, 8, 4, [P["velvet3"], P["navy"], P["ink"], P["gold1"], P["teal"]][r.randrange(5)])
    for x in range(0, W, 2):
        c.set(x, 120, P["gold2"])
    return c


def generate(out_root):
    tdir = os.path.join(out_root, "train")
    pdir = os.path.join(out_root, "premiere")
    os.makedirs(tdir, exist_ok=True)
    os.makedirs(pdir, exist_ok=True)
    sky(True).save(os.path.join(tdir, "ciel_jour.png"))
    sky(False).save(os.path.join(tdir, "ciel_soir.png"))
    hills(3, (130, 160, 120)).save(os.path.join(tdir, "loin_campagne.png"))
    fields(4).save(os.path.join(tdir, "milieu_campagne.png"))
    paris_far().save(os.path.join(tdir, "loin_paris.png"))
    suburbs().save(os.path.join(tdir, "milieu_paris.png"))
    rails().save(os.path.join(tdir, "voie.png"))
    grass().save(os.path.join(tdir, "herbes.png"))
    train().save(os.path.join(tdir, "train.png"))
    auditorium().save(os.path.join(pdir, "salle.png"))
    for decor in ("monumental", "plateau_nu", "recup"):
        for costumes in COSTUMES:
            stage(decor, costumes).save(os.path.join(pdir, "scene_%s_%s.png" % (decor, costumes)))
            stage(decor, costumes, bows=True).save(os.path.join(pdir, "saluts_%s_%s.png" % (decor, costumes)))

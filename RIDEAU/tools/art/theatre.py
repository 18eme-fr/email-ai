"""Vues du Théâtre de la Lanterne : salle, rideaux, façade, public."""
import json
import math
from pixel import P, Canvas, mix, shade, rng

W, H = 320, 180
STAGE = (56, 26, 208, 86)  # x, y, w, h de l'ouverture de scène (pixels d'art)

FONT5 = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "I": ["111", "010", "010", "010", "010", "010", "111"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "!": ["1", "1", "1", "1", "1", "0", "1"],
    "'": ["1", "1", "0", "0", "0", "0", "0"],
    " ": ["000", "000", "000", "000", "000", "000", "000"],
    "É": ["00010", "11111", "10000", "11110", "10000", "10000", "11111"],
}


def text(c: Canvas, x: int, y: int, s: str, color, shadow=None):
    for ch in s:
        glyph = FONT5.get(ch, FONT5[" "])
        for gy, row in enumerate(glyph):
            for gx, bit in enumerate(row):
                if bit == "1":
                    if shadow:
                        c.set(x + gx + 1, y + gy + 1, shadow)
                    c.set(x + gx, y + gy, color)
        x += len(glyph[0]) + 1
    return x


def text_width(s: str) -> int:
    return sum(len(FONT5.get(ch, FONT5[" "])[0]) + 1 for ch in s) - 1


def velvet_drape(c: Canvas, x0, y0, w, h, seed=0, flip=False):
    """Rideau de velours à plis verticaux."""
    shades = [P["velvet1"], P["velvet2"], P["velvet3"], P["velvet4"], P["velvet3"], P["velvet2"]]
    period = 6
    for x in range(w):
        phase = (x + seed) % period
        col = shades[phase]
        for y in range(h):
            # légère ombre en bas
            cc = col
            if y > h - 6:
                cc = shade(col, 0.8)
            c.set(x0 + x, y0 + y, cc)
    # creux des plis
    for x in range(w):
        if (x + seed) % period == 0:
            c.vline(x0 + x, y0, y0 + h - 1, P["velvet0"])


def velvet_wide(c: Canvas, x0, y0, w, h, period=18, seed=0):
    """Grand rideau : plis larges ombrés (cosinus) avec trame entre les teintes."""
    tones = [P["velvet0"], P["velvet1"], P["velvet2"], P["velvet3"], P["velvet4"]]
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    for x in range(w):
        phase = ((x + seed) % period) / period
        light = 0.5 + 0.5 * math.cos(phase * 2 * math.pi)
        level = 0.4 + light * 3.4
        i = int(level)
        frac = level - i
        for y in range(h):
            j = min(i + (1 if bayer[(y0 + y) % 4][(x0 + x) % 4] / 16 < frac else 0), 4)
            c.set(x0 + x, y0 + y, tones[j] if y < h - 4 else shade(tones[j], 0.8))


def hall() -> tuple:
    c = Canvas(W, H, P["ink"])
    # mur du fond et côtés
    c.vgradient(0, 0, W, 130, P["night"], P["night2"], 5)
    # boiseries basses
    c.rect(0, 112, W, 18, P["wood1"])
    c.hline(0, W - 1, 112, P["wood2"])
    for x in range(0, W, 16):
        c.vline(x, 113, 129, P["wood0"])
    # loges latérales
    for side in (0, 1):
        bx = 6 if side == 0 else W - 46
        for row in range(2):
            by = 30 + row * 38
            c.rect(bx, by, 40, 28, P["velvet0"])
            c.rect(bx + 2, by + 2, 36, 18, P["ink"])
            # rideau de loge
            velvet_drape(c, bx + 2, by + 2, 6, 18, seed=side)
            velvet_drape(c, bx + 32, by + 2, 6, 18, seed=side + 3)
            # balustrade dorée
            c.rect(bx, by + 20, 40, 8, P["gold1"])
            c.hline(bx, bx + 39, by + 20, P["gold3"])
            for x in range(bx + 2, bx + 39, 4):
                c.vline(x, by + 22, by + 26, P["gold0"])
            c.hline(bx, bx + 39, by + 27, P["gold0"])
        # applique lumineuse
        lx = bx + 20
        c.ellipse(lx, 22, 6, 4, P["light"], 50)
        c.rect(lx - 1, 21, 3, 3, P["gold3"])
    # cadre de scène doré (arc)
    sx, sy, sw, sh = STAGE
    c.rect(sx - 10, sy - 14, sw + 20, sh + 28, P["gold1"])
    c.rect(sx - 8, sy - 12, sw + 16, sh + 24, P["gold2"])
    c.rect(sx - 6, sy - 10, sw + 12, sh + 20, P["gold1"])
    for x in range(sx - 8, sx + sw + 8, 6):
        c.set(x, sy - 12, P["gold3"])
        c.set(x + 1, sy - 11, P["gold3"])
    # cartouche du fronton
    cx = sx + sw // 2
    c.rect(cx - 22, sy - 20, 44, 10, P["gold2"])
    c.frame(cx - 22, sy - 20, 44, 10, P["gold0"])
    c.rect(cx - 20, sy - 18, 40, 6, P["velvet1"])
    text(c, cx - text_width("LANTERNE") // 2, sy - 18, "LANTERNE", P["gold3"])
    # intérieur de scène : fond de scène bleu et sol en planches
    c.vgradient(sx, sy, sw, sh, P["navy"], P["night2"], 4)
    floor_y = sy + sh - 18
    for y in range(floor_y, sy + sh):
        t = (y - floor_y) / 18
        col = mix(P["wood2"], P["wood3"], t)
        c.hline(sx, sx + sw - 1, y, col)
    for x in range(sx, sx + sw, 12):
        c.line(x, floor_y, x + (x - (sx + sw // 2)) // 8, sy + sh - 1, P["wood1"])
    c.hline(sx, sx + sw - 1, floor_y, P["wood1"])
    # rideaux latéraux et lambrequin
    velvet_drape(c, sx, sy, 26, sh, seed=0)
    velvet_drape(c, sx + sw - 26, sy, 26, sh, seed=3)
    for i, (x0, w) in enumerate([(sx, 26), (sx + sw - 26, 26)]):
        # embrasses dorées
        ty = sy + 50
        c.rect(x0 + (18 if i == 0 else 2), ty, 6, 3, P["gold2"])
        c.set(x0 + (20 if i == 0 else 4), ty + 3, P["gold3"])
    velvet_drape(c, sx, sy, sw, 10, seed=1)
    for x in range(sx, sx + sw):
        if (x // 8) % 2 == 0:
            c.set(x, sy + 10, P["velvet2"])
            c.set(x, sy + 11, P["velvet1"])
    c.hline(sx, sx + sw - 1, sy + 9, P["gold2"])
    # nez de scène et rampe
    c.rect(sx - 10, sy + sh, sw + 20, 6, P["wood1"])
    c.hline(sx - 10, sx + sw + 9, sy + sh, P["wood3"])
    for x in range(sx, sx + sw, 10):
        c.rect(x + 3, sy + sh + 1, 3, 2, P["gold3"])
        c.set(x + 4, sy + sh, P["light"])
    # sol de la salle
    c.vgradient(0, 130, W, H - 130, P["velvet0"], P["ink"], 4)
    # fauteuils
    seats = []
    rows = 5
    for r in range(rows):
        y = 132 + r * 9
        count = 22 + r * 2
        spacing = 12
        total = count * spacing
        x0 = (W - total) // 2 + 3
        for i in range(count):
            x = x0 + i * spacing
            if abs(x + 3 - W // 2) < 7:
                continue  # allée centrale
            c.rect(x, y + 2, 9, 6, P["velvet1"])
            c.rect(x + 1, y + 1, 7, 5, P["velvet2"])
            c.hline(x + 1, x + 7, y + 1, P["velvet3"])
            c.hline(x, x + 8, y + 7, P["velvet0"])
            seats.append({"x": x + 1, "y": y - 5, "row": r})
    return c, seats


def curtain_half(left=True) -> Canvas:
    sx, sy, sw, sh = STAGE
    w = sw // 2 + 2
    c = Canvas(w, sh)
    velvet_drape(c, 0, 0, w, sh, seed=0 if left else 2)
    # frange dorée en bas
    for x in range(w):
        c.set(x, sh - 3, P["gold2"])
        if x % 2 == 0:
            c.set(x, sh - 2, P["gold1"])
    edge = w - 1 if left else 0
    c.vline(edge, 0, sh - 1, P["velvet0"])
    return c


def spotlight() -> Canvas:
    """Cône de lumière (superposé en mode additif dans Godot)."""
    w, h = 80, 90
    c = Canvas(w, h)
    for y in range(h):
        half = 4 + y * 0.4
        for x in range(w):
            d = abs(x - w / 2)
            if d < half:
                a = int(70 * (1 - d / half) * (0.6 + 0.4 * y / h))
                c.set(x, y, P["light"], a)
    return c


def performer(kind: int) -> Canvas:
    """Silhouette de comédien, 12×24."""
    c = Canvas(12, 24)
    costumes = [P["gold2"], P["teal"], P["purple2"], P["orange"], P["green2"]]
    skin = [P["skin1"], P["skin3"], P["skin2"], P["skin4"]][kind % 4]
    hair = [P["ink"], P["wood2"], P["gold1"], P["grey2"]][kind % 4]
    body = costumes[kind % len(costumes)]
    c.ellipse(6, 4, 3, 3.5, skin)
    c.rect(3, 0, 6, 3, hair)
    c.rect(3, 8, 6, 9, body)
    c.rect(2, 9, 1, 6, body)
    c.rect(9, 9, 1, 6, body)
    c.rect(4, 17, 2, 6, P["night2"])
    c.rect(7, 17, 2, 6, P["night2"])
    c.outline(P["ink"])
    return c


def heads() -> list:
    """Têtes de spectateurs vues de dos (8×7)."""
    hairs = [P["ink"], P["wood1"], P["wood3"], P["gold1"], P["grey2"], P["grey3"], P["velvet2"], P["skin4"], P["orange"]]
    skins = [P["skin1"], P["skin2"], P["skin3"], P["skin4"], P["skin0"]]
    out = []
    r = rng(7)
    for i in range(12):
        c = Canvas(8, 7)
        hair = hairs[i % len(hairs)]
        skin = skins[(i * 3) % len(skins)]
        c.ellipse(4, 3.5, 3.2, 3.4, hair)
        if i % 3 == 0:
            c.set(1, 5, skin)
            c.set(6, 5, skin)
        if i % 4 == 1:
            c.rect(2, 0, 4, 1, shade(hair, 1.2))
        if i % 5 == 2:  # chignon
            c.rect(3, 0, 2, 1, hair)
        c.outline(P["ink"])
        out.append(c)
    return out


def facade() -> tuple:
    c = Canvas(W, H, P["night"])
    c.vgradient(0, 0, W, 120, P["ink"], P["navy"], 6)
    r = rng(3)
    for _ in range(60):
        x, y = r.randint(0, W - 1), r.randint(0, 70)
        c.set(x, y, P["cream"] if r.random() < 0.3 else P["steel"])
    c.ellipse(282, 22, 9, 9, P["paper"])
    c.ellipse(285, 20, 8, 8, P["ink"])
    # immeubles voisins
    for bx, bw, bh, col in [(0, 52, 95, P["night2"]), (268, 52, 105, P["night2"])]:
        c.rect(bx, H - 40 - bh + 40, bw, bh, col)
        for wy in range(H - bh + 6, H - 50, 14):
            for wx in range(bx + 6, bx + bw - 8, 12):
                lit = r.random() < 0.35
                c.rect(wx, wy, 6, 8, P["gold2"] if lit else P["ink"])
                if lit:
                    c.hline(wx, wx + 5, wy, P["gold3"])
    # bâtiment du théâtre
    tx, tw = 56, 208
    top = 30
    c.rect(tx, top + 14, tw, H - top - 14 - 22, P["paper2"])
    for y in range(top + 18, H - 22, 6):
        c.hline(tx, tx + tw - 1, y, P["paper3"])
        off = 0 if (y // 6) % 2 == 0 else 8
        for x in range(tx + off, tx + tw, 16):
            c.vline(x, y, min(y + 5, H - 23), P["paper3"])
    # fronton triangulaire
    c.poly([(tx - 6, top + 16), (tx + tw // 2, top - 8), (tx + tw + 6, top + 16)], P["paper"])
    c.poly([(tx + 10, top + 12), (tx + tw // 2, top - 1), (tx + tw - 10, top + 12)], P["paper2"])
    c.hline(tx - 6, tx + tw + 5, top + 16, P["paper3"])
    c.rect(tx - 6, top + 16, tw + 12, 3, P["paper"])
    # enseigne lumineuse
    sign = "THÉÂTRE DE LA LANTERNE"
    sign = "LA LANTERNE"
    sw_ = text_width(sign) + 12
    sxx = tx + (tw - sw_) // 2
    c.rect(sxx, top + 22, sw_, 13, P["velvet1"])
    c.frame(sxx, top + 22, sw_, 13, P["gold2"])
    for x in range(sxx + 1, sxx + sw_ - 1, 3):
        c.set(x, top + 22, P["light"])
        c.set(x, top + 34, P["light"])
    text(c, sxx + 6, top + 25, sign, P["gold3"], shadow=P["velvet0"])
    # colonnes
    for x in [tx + 8, tx + 52, tx + tw - 60, tx + tw - 16]:
        c.rect(x, top + 40, 8, H - top - 40 - 22, P["paper"])
        c.vline(x + 6, top + 40, H - 23, P["paper2"])
        c.rect(x - 1, top + 38, 10, 3, P["cream"])
        c.rect(x - 1, H - 25, 10, 3, P["paper3"])
    # portes vitrées éclairées
    poster_slots = []
    for i, dx in enumerate([tx + 70, tx + 92, tx + 114]):
        dy = top + 70
        c.rect(dx, dy, 18, H - 22 - dy, P["wood1"])
        c.rect(dx + 2, dy + 2, 14, H - 22 - dy - 2, P["gold2"])
        c.rect(dx + 3, dy + 3, 12, H - 22 - dy - 3, P["light"])
        c.ellipse(dx + 9, dy + 2, 9, 5, P["wood1"])
        c.ellipse(dx + 9, dy + 3, 7, 4, P["gold3"])
        c.vline(dx + 9, dy + 3, H - 23, P["wood2"])
    # cadres d'affiches (les affiches réelles sont posées par Godot)
    for px in [tx + 18, tx + tw - 50]:
        py = top + 58
        c.rect(px - 2, py - 2, 36, 48, P["wood1"])
        c.frame(px - 2, py - 2, 36, 48, P["gold1"])
        c.rect(px, py, 32, 44, P["ink"])
        poster_slots.append({"x": px, "y": py, "w": 32, "h": 44})
    # trottoir et pavés
    c.rect(0, H - 22, W, 22, P["grey0"])
    c.hline(0, W - 1, H - 22, P["grey2"])
    for y in range(H - 18, H, 5):
        off = 0 if (y // 5) % 2 else 5
        for x in range(off, W, 10):
            c.rect(x, y, 8, 3, P["grey1"])
    # halo de lumière devant les portes
    for y in range(H - 22, H):
        for x in range(tx + 50, tx + tw - 50):
            d = abs(x - (tx + tw // 2)) / 60 + (y - (H - 22)) / 40
            if d < 1:
                c.set(x, y, P["gold2"], int(60 * (1 - d)))
    # réverbères
    for lx in [30, W - 30]:
        c.rect(lx, H - 70, 2, 48, P["ink"])
        c.rect(lx - 3, H - 76, 8, 6, P["ink"])
        c.rect(lx - 2, H - 75, 6, 4, P["light"])
        c.ellipse(lx + 1, H - 73, 12, 10, P["gold2"], 22)
    return c, poster_slots


def export(out_dir: str, scale: int = 2) -> None:
    hall_c, seats = hall()
    hall_c.save(f"{out_dir}/hall.png", scale)
    curtain_half(True).save(f"{out_dir}/curtain_left.png", scale)
    curtain_half(False).save(f"{out_dir}/curtain_right.png", scale)
    spotlight().save(f"{out_dir}/spotlight.png", scale)
    for i in range(5):
        performer(i).save(f"{out_dir}/performer_{i}.png", scale)
    for i, h in enumerate(heads()):
        h.save(f"{out_dir}/head_{i}.png", scale)
    fac, slots = facade()
    fac.save(f"{out_dir}/facade.png", scale)
    sx, sy, sw, sh = STAGE
    meta = {
        "scale": scale,
        "size": [W, H],
        "stage": {"x": sx, "y": sy, "w": sw, "h": sh},
        "seats": seats,
        "poster_slots": slots,
        "heads": 12,
        "performers": 5,
    }
    with open(f"{out_dir}/theatre_layout.json", "w") as f:
        json.dump(meta, f, indent=1)

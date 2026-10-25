"""Affiches des spectacles (32×44), un motif graphique par spectacle."""
import json
from pixel import P, Canvas, shade, hex2rgb

PW, PH = 32, 44


def motif(c: Canvas, name: str, fg, ac):
    cx, cy = 16, 18
    if name == "door":
        c.rect(10, 8, 12, 20, fg)
        c.rect(12, 10, 8, 18, ac)
        c.set(18, 19, fg)
        c.poly([(20, 10), (25, 12), (25, 27), (20, 28)], shade(fg, 0.8))
    elif name == "mic":
        c.ellipse(cx, 11, 4, 5, fg)
        c.hline(13, 19, 11, ac)
        c.rect(15, 15, 3, 9, fg)
        c.rect(11, 26, 11, 2, fg)
        c.vline(cx, 23, 26, fg)
    elif name == "moon":
        c.ellipse(cx, cy, 9, 9, fg)
        c.ellipse(cx + 4, cy - 3, 8, 8, ac)
        for x, y in [(6, 6), (25, 9), (8, 27), (27, 24)]:
            c.set(x, y, fg)
    elif name == "suitcase":
        c.rect(8, 13, 17, 13, fg)
        c.rect(13, 9, 7, 2, fg)
        c.vline(13, 9, 13, fg)
        c.vline(19, 9, 13, fg)
        c.hline(8, 24, 18, ac)
        c.ellipse(11, 22, 2, 2, ac)
        c.ellipse(21, 15, 1.5, 1.5, ac)
    elif name == "bear":
        c.ellipse(cx, 20, 8, 8, fg)
        c.ellipse(10, 12, 3, 3, fg)
        c.ellipse(22, 12, 3, 3, fg)
        c.ellipse(cx, 23, 3, 2, ac)
        c.set(13, 18, ac)
        c.set(19, 18, ac)
        for x, y in [(5, 5), (26, 6), (24, 28), (6, 26), (16, 4)]:
            c.set(x, y, ac)
    elif name == "book":
        c.poly([(5, 12), (16, 15), (16, 28), (5, 25)], fg)
        c.poly([(16, 15), (27, 12), (27, 25), (16, 28)], shade(fg, 0.85))
        for y in (17, 20, 23):
            c.hline(7, 13, y, ac)
            c.hline(19, 25, y, ac)
    elif name == "speech":
        c.ellipse(13, 13, 8, 6, fg)
        c.poly([(9, 17), (8, 22), (13, 18)], fg)
        c.ellipse(20, 22, 7, 5, ac)
        c.poly([(23, 25), (25, 29), (20, 26)], ac)
    elif name == "hands":
        c.ellipse(11, 19, 5, 7, fg)
        c.ellipse(21, 19, 5, 7, ac)
        for i in range(4):
            c.rect(7 + i * 2, 9, 1, 6, fg)
            c.rect(19 + i * 2, 9, 1, 6, ac)
    elif name == "gear":
        c.ellipse(cx, cy, 9, 9, fg)
        for dx, dy in [(0, -10), (0, 10), (-10, 0), (10, 0), (-7, -7), (7, 7), (-7, 7), (7, -7)]:
            c.rect(cx + dx - 1, cy + dy - 1, 3, 3, fg)
        c.ellipse(cx, cy, 4, 4, ac)
        c.ellipse(cx, cy, 2, 2, fg)
    elif name == "note":
        c.rect(12, 8, 2, 16, fg)
        c.rect(21, 6, 2, 16, fg)
        c.poly([(12, 8), (23, 5), (23, 9), (12, 12)], fg)
        c.ellipse(10, 24, 3.5, 2.5, fg)
        c.ellipse(19, 22, 3.5, 2.5, fg)
        c.set(26, 26, ac)
        c.set(6, 10, ac)
    elif name == "mask":
        c.ellipse(13, 16, 8, 9, fg)
        c.rect(9, 14, 2, 2, ac)
        c.rect(15, 14, 2, 2, ac)
        c.hline(10, 16, 20, ac)
        c.set(9, 19, ac)
        c.set(17, 19, ac)
        c.ellipse(22, 21, 6, 7, ac)
        c.set(20, 20, fg)
        c.set(24, 20, fg)
        c.hline(20, 24, 25, fg)
    elif name == "lines":
        for i in range(5):
            c.line(4 + i * 5, 30, 12 + i * 4, 6, fg if i % 2 == 0 else ac)
        c.ellipse(22, 10, 2, 2, fg)
        c.rect(21, 12, 2, 6, fg)
    elif name == "seesaw":
        c.line(5, 22, 27, 14, fg)
        c.line(5, 23, 27, 15, fg)
        c.poly([(16, 18), (12, 26), (20, 26)], ac)
        c.ellipse(7, 17, 2, 2, fg)
        c.rect(6, 19, 3, 3, fg)
        c.ellipse(25, 6, 2, 2, ac)
        c.rect(24, 8, 3, 4, ac)
    elif name == "whistle":
        c.ellipse(13, 18, 6, 5, fg)
        c.rect(15, 13, 11, 5, fg)
        c.ellipse(13, 18, 2, 2, ac)
        c.line(8, 14, 5, 8, ac)
        c.line(11, 12, 10, 6, ac)
    elif name == "rock":
        c.poly([(6, 26), (9, 14), (15, 9), (23, 11), (27, 20), (24, 27)], fg)
        c.poly([(15, 9), (19, 16), (14, 22), (9, 14)], shade(fg, 1.25))
        c.set(20, 20, ac)
        c.set(12, 17, ac)
        c.set(22, 14, ac)
    elif name == "fire":
        c.poly([(16, 6), (23, 18), (21, 26), (11, 26), (9, 18)], fg)
        c.poly([(16, 13), (20, 21), (18, 26), (14, 26), (12, 21)], ac)
        c.rect(8, 26, 16, 2, shade(fg, 0.5))
    elif name == "thread":
        c.ellipse(cx, 12, 6, 4, fg)
        c.rect(10, 12, 12, 2, fg)
        for y in range(16, 30, 2):
            c.set(16 + (2 if (y // 2) % 2 else -2), y, ac)
            c.set(16, y + 1, ac)
        c.line(16, 16, 9, 29, fg)
    elif name == "star":
        pts = []
        import math
        for i in range(10):
            r = 10 if i % 2 == 0 else 4
            a = -math.pi / 2 + i * math.pi / 5
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        c.poly(pts, fg)
        c.ellipse(cx, cy, 2, 2, ac)
    elif name == "skull":
        c.ellipse(cx, 15, 8, 8, fg)
        c.rect(12, 20, 9, 6, fg)
        c.ellipse(13, 15, 2, 2.5, ac)
        c.ellipse(20, 15, 2, 2.5, ac)
        c.set(16, 19, ac)
        for x in (13, 15, 17, 19):
            c.vline(x, 23, 25, ac)
    elif name == "puppet":
        c.hline(8, 24, 5, fg)
        for x in (10, 16, 22):
            c.vline(x, 5, 14, ac)
        c.ellipse(16, 15, 4, 4, fg)
        c.rect(12, 19, 9, 7, fg)
        c.line(12, 20, 10, 14, fg)
        c.line(20, 20, 22, 14, fg)
        c.rect(13, 26, 2, 3, fg)
        c.rect(18, 26, 2, 3, fg)
    else:
        c.ellipse(cx, cy, 8, 8, fg)


def poster(show: dict) -> Canvas:
    p = show.get("poster", {})
    bg = hex2rgb(p.get("bg", "#888888"))
    fg = hex2rgb(p.get("fg", "#222222"))
    c = Canvas(PW, PH)
    c.rect(0, 0, PW, PH, bg)
    # dégradé tramé vers le bas
    c.dither_rect(0, 22, PW, 14, shade(bg, 0.85), 0.5)
    c.rect(0, 30, PW, 6, shade(bg, 0.85))
    # rayons décoratifs
    c.dither_rect(0, 0, PW, 4, shade(bg, 1.15), 0.5)
    accent = shade(bg, 1.35) if sum(fg) < 300 else shade(bg, 0.55)
    motif(c, p.get("motif", ""), fg, accent)
    # bandeau titre (le titre est écrit par le jeu)
    c.rect(0, 34, PW, 10, fg)
    c.hline(0, PW - 1, 34, shade(fg, 1.4) if sum(fg) < 300 else shade(fg, 0.7))
    for x in range(3, PW - 3, 3):
        c.set(x, 37, bg)
    for x in range(5, PW - 5, 2):
        c.set(x, 40, shade(bg, 0.9))
    c.frame(0, 0, PW, PH, P["ink"])
    return c


def export(out_dir: str, catalog_path: str, scale: int = 2) -> None:
    with open(catalog_path) as f:
        catalog = json.load(f)
    for show in catalog["shows"]:
        poster(show).save(f"{out_dir}/{show['id']}.png", scale)

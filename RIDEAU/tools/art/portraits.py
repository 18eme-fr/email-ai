"""Portraits 48×48 des personnages récurrents, avec plusieurs humeurs."""
from pixel import P, Canvas, shade, hex2rgb

S = 48
MOODS = ["neutral", "happy", "worried", "angry"]

CHARACTERS = {
    "helene": {
        "skin": P["skin1"], "hair": P["grey3"], "hair_style": "bob", "clothes": P["navy"],
        "accent": P["gold2"], "glasses": True, "bg": hex2rgb("#c9a24b"), "scarf": True,
    },
    "bastien": {
        "skin": P["skin4"], "hair": P["ink"], "hair_style": "beanie", "clothes": P["grey0"],
        "accent": P["velvet3"], "beard": True, "headset": True, "bg": hex2rgb("#5f8fb4"),
    },
    "ines": {
        "skin": P["skin3"], "hair": P["wood0"], "hair_style": "curly", "clothes": P["velvet3"],
        "accent": P["gold3"], "earrings": True, "bg": hex2rgb("#c46a7c"),
    },
    "pommier": {
        "skin": P["skin0"], "hair": P["grey2"], "hair_style": "bald", "clothes": P["night2"],
        "accent": P["blue"], "mustache": True, "tie": True, "bg": hex2rgb("#7d9a5b"),
    },
    "lazare": {
        "skin": P["skin2"], "hair": P["grey2"], "hair_style": "swoop", "clothes": P["ink"],
        "accent": P["velvet4"], "round_glasses": True, "scarf": True, "beard": True, "bg": hex2rgb("#3c6e8f"),
    },
    "louison": {
        "skin": P["skin2"], "hair": P["purple2"], "hair_style": "swoop", "clothes": P["ink"],
        "accent": P["purple1"], "round_glasses": True, "bg": hex2rgb("#9b6bc4"),
    },
}


def portrait(cid: str, mood: str = "neutral") -> Canvas:
    d = CHARACTERS[cid]
    c = Canvas(S, S)
    bg = d["bg"]
    # fond : médaillon
    c.rect(0, 0, S, S, shade(bg, 0.45))
    c.ellipse(24, 22, 22, 22, shade(bg, 0.65))
    c.ellipse(24, 22, 18, 18, shade(bg, 0.8))
    skin = d["skin"]
    skin_d = shade(skin, 0.82)
    hair = d["hair"]
    hair_d = shade(hair, 0.75)
    cx = 24
    # épaules et vêtements
    c.ellipse(cx, 50, 20, 13, d["clothes"])
    c.ellipse(cx, 50, 20, 13, d["clothes"])
    c.rect(cx - 4, 33, 8, 6, skin_d)  # cou
    if d.get("scarf"):
        c.ellipse(cx, 40, 9, 4, d["accent"])
        c.rect(cx + 2, 40, 4, 8, d["accent"])
        c.vline(cx + 3, 41, 47, shade(d["accent"], 0.8))
    if d.get("tie"):
        c.poly([(cx - 6, 38), (cx, 44), (cx + 6, 38)], P["cream"])
        c.rect(cx - 1, 39, 3, 9, d["accent"])
        c.set(cx, 39, shade(d["accent"], 1.3))
    if d.get("headset"):
        pass
    if cid == "louison":
        c.rect(cx - 6, 37, 12, 4, P["ink"])  # col roulé
        c.hline(cx - 6, cx + 5, 38, P["night2"])
    # cheveux arrière
    style = d["hair_style"]
    if style == "bob":
        c.ellipse(cx, 21, 13, 14, hair)
        c.rect(cx - 13, 20, 26, 12, hair)
    elif style == "curly":
        for ox, oy in [(-11, 14), (11, 14), (-13, 22), (13, 22), (-12, 30), (12, 30), (0, 8), (-7, 9), (7, 9)]:
            c.ellipse(cx + ox, oy, 6, 6, hair)
    elif style == "swoop":
        c.ellipse(cx, 20, 12, 13, hair_d)
    # tête
    c.ellipse(cx, 23, 10, 12, skin)
    c.ellipse(cx + 3, 25, 7, 10, skin, 0)
    for y in range(13, 36):
        c.set(cx + 9, y, skin_d) if c.get(cx + 9, y)[:3] == skin else None
    # oreilles
    c.ellipse(cx - 10, 24, 2, 3, skin_d)
    c.ellipse(cx + 10, 24, 2, 3, skin_d)
    if d.get("earrings"):
        c.ellipse(cx - 10, 29, 2, 2, d["accent"])
        c.ellipse(cx + 10, 29, 2, 2, d["accent"])
        c.set(cx - 10, 29, shade(bg, 0.8))
        c.set(cx + 10, 29, shade(bg, 0.8))
    # cheveux avant
    if style == "bob":
        c.ellipse(cx, 14, 11, 6, hair)
        c.rect(cx - 11, 13, 4, 15, hair)
        c.rect(cx + 7, 13, 4, 15, hair)
        c.hline(cx - 6, cx + 4, 12, shade(hair, 1.15))
    elif style == "curly":
        for ox, oy in [(-8, 13), (-3, 11), (3, 11), (8, 13), (-10, 18), (10, 18)]:
            c.ellipse(cx + ox, oy, 4, 4, hair)
        for ox, oy in [(-5, 10), (4, 10)]:
            c.set(cx + ox, oy, shade(hair, 1.6))
    elif style == "beanie":
        c.ellipse(cx, 13, 11, 6, d["accent"])
        c.rect(cx - 11, 13, 22, 4, d["accent"])
        c.hline(cx - 11, cx + 10, 16, shade(d["accent"], 0.7))
        for x in range(cx - 10, cx + 10, 2):
            c.vline(x, 11, 15, shade(d["accent"], 0.85))
    elif style == "bald":
        c.ellipse(cx, 15, 9, 5, skin)
        c.set(cx - 3, 13, shade(skin, 1.15))
        c.set(cx - 2, 13, shade(skin, 1.15))
        c.rect(cx - 11, 18, 3, 8, hair)
        c.rect(cx + 8, 18, 3, 8, hair)
    elif style == "swoop":
        c.poly([(cx - 11, 20), (cx - 8, 9), (cx + 4, 8), (cx + 11, 13), (cx + 10, 16), (cx - 2, 15), (cx - 8, 22)], hair)
        c.rect(cx + 7, 16, 4, 6, hair_d)
        c.hline(cx - 5, cx + 4, 10, shade(hair, 1.25))
    # sourcils
    brow = shade(hair, 0.6) if style not in ("bald",) else P["grey1"]
    if style == "beanie":
        brow = P["ink"]
    ey = 23
    if mood == "worried":
        c.line(cx - 7, ey - 3, cx - 3, ey - 4, brow)
        c.line(cx + 3, ey - 4, cx + 7, ey - 3, brow)
    elif mood == "angry":
        c.line(cx - 7, ey - 5, cx - 3, ey - 3, brow)
        c.line(cx + 3, ey - 3, cx + 7, ey - 5, brow)
    else:
        c.hline(cx - 7, cx - 3, ey - 4, brow)
        c.hline(cx + 3, cx + 7, ey - 4, brow)
    # yeux
    if mood == "happy":
        for ex in (cx - 5, cx + 5):
            c.hline(ex - 1, ex + 1, ey, P["ink"])
            c.set(ex - 2, ey + 1, P["ink"])
            c.set(ex + 2, ey + 1, P["ink"])
    else:
        for ex in (cx - 5, cx + 5):
            c.rect(ex - 1, ey - 1, 3, 3, P["white"])
            c.rect(ex, ey - 1, 2, 3, P["ink"])
            c.set(ex, ey - 1, P["white"])
    # lunettes
    if d.get("glasses"):
        for ex in (cx - 5, cx + 5):
            c.frame(ex - 3, ey - 2, 7, 5, P["gold1"])
        c.hline(cx - 1, cx + 1, ey - 1, P["gold1"])
    if d.get("round_glasses"):
        for ex in (cx - 5, cx + 5):
            c.frame(ex - 3, ey - 3, 7, 7, P["ink"])
            c.set(ex - 3, ey - 3, skin)
            c.set(ex + 3, ey - 3, skin)
            c.set(ex - 3, ey + 3, skin)
            c.set(ex + 3, ey + 3, skin)
        c.hline(cx - 1, cx + 1, ey - 1, P["ink"])
    # nez
    c.vline(cx, ey + 2, ey + 5, skin_d)
    c.set(cx - 1, ey + 5, skin_d)
    # moustache / barbe
    my = ey + 8
    if d.get("beard"):
        c.ellipse(cx, 31, 9, 6, hair)
        c.ellipse(cx, 29, 6, 3, skin)
    if d.get("mustache"):
        c.hline(cx - 4, cx + 4, my - 1, P["grey2"])
        c.hline(cx - 3, cx + 3, my - 2, P["grey3"])
    # bouche
    mouth = P["velvet1"] if not d.get("beard") else P["ink"]
    if mood == "happy":
        c.hline(cx - 3, cx + 3, my, mouth)
        c.hline(cx - 2, cx + 2, my + 1, mouth)
        c.hline(cx - 1, cx + 1, my + 1, P["white"])
    elif mood == "worried":
        c.hline(cx - 2, cx + 2, my + 1, mouth)
        c.set(cx - 3, my + 2, mouth)
        c.set(cx + 3, my + 2, mouth)
    elif mood == "angry":
        c.hline(cx - 3, cx + 3, my + 1, mouth)
        c.set(cx - 3, my + 2, mouth)
        c.set(cx + 3, my + 2, mouth)
    else:
        c.hline(cx - 2, cx + 2, my, mouth)
        c.set(cx + 3, my - 1, mouth)
    # joues
    if mood == "happy":
        c.set(cx - 7, ey + 4, shade(P["velvet4"], 1.1))
        c.set(cx + 7, ey + 4, shade(P["velvet4"], 1.1))
    # casque audio du régisseur
    if d.get("headset"):
        c.rect(cx - 12, 21, 3, 6, P["grey1"])
        c.rect(cx + 10, 21, 3, 6, P["grey1"])
        c.line(cx - 11, 27, cx - 6, 32, P["grey2"])
        c.set(cx - 6, 32, P["velvet4"])
    # cadre
    c.frame(0, 0, S, S, P["ink"])
    c.frame(1, 1, S - 2, S - 2, P["gold1"])
    return c


def export(out_dir: str, scale: int = 3) -> None:
    for cid in CHARACTERS:
        for mood in MOODS:
            portrait(cid, mood).save(f"{out_dir}/{cid}_{mood}.png", scale)

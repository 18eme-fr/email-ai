"""Illustrations du prologue (cinématique de la première partie), 320×180,
affichées ×4 en 1280×720. Composées à partir des images du jeu (ville, salle,
personnages, portraits) puis « développées » selon l'époque : nuit, sépia des
souvenirs, couleurs froides du déclin. Appelé par generate_art.py, après le
dessin du monde (il en réutilise les images)."""
import os

from PIL import Image, ImageEnhance, ImageFilter

W, H = 320, 180
T = 16


def _load(root, rel):
    return Image.open(os.path.join(root, "assets", rel)).convert("RGBA")


def _city(root, season="ete"):
    b = _load(root, "world/maps/rue_%s_base.png" % season)
    b.alpha_composite(_load(root, "world/maps/rue_%s_top.png" % season))
    return b


def _person(root, sprite, frame_row=0):
    return _load(root, "world/people/%s.png" % sprite).crop((0, frame_row * 24, 16, frame_row * 24 + 24))


def _crop_center(img, cx, cy):
    return img.crop((cx - W // 2, cy - H // 2, cx + W // 2, cy + H // 2))


def _tint(img, r, g, b):
    px = img.split()
    return Image.merge("RGBA", (px[0].point(lambda v: int(v * r)), px[1].point(lambda v: int(v * g)),
                                px[2].point(lambda v: int(v * b)), px[3]))


def _sepia(img, strength=1.0):
    gray = ImageEnhance.Color(img).enhance(0.0).convert("L")
    sep = Image.merge("RGB", (gray.point(lambda v: min(255, int(v * 1.07 + 18))), gray.point(lambda v: int(v * 0.92 + 8)),
                              gray.point(lambda v: int(v * 0.72)))).convert("RGBA")
    return Image.blend(img, sep, strength)


def _vignette(img, strength=0.55):
    mask = Image.new("L", (W, H), 0)
    px = mask.load()
    for y in range(H):
        for x in range(W):
            dx, dy = (x - W / 2) / (W / 2), (y - H / 2) / (H / 2)
            d = max(0.0, (dx * dx + dy * dy) - 0.35)
            px[x, y] = int(min(255, d * 255 * strength * 1.6))
    dark = Image.new("RGBA", (W, H), (12, 8, 18, 255))
    return Image.composite(dark, img, mask)


def _glow(img, cx, cy, r, color, strength=160):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = layer.load()
    for y in range(max(0, cy - r), min(H, cy + r)):
        for x in range(max(0, cx - r), min(W, cx + r)):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / r
            if d < 1:
                px[x, y] = (*color, int(strength * (1 - d) ** 2))
    out = img.copy()
    out.alpha_composite(layer)
    return out


def _people(root, img, spots, sprites):
    for i, (x, y) in enumerate(spots):
        img.alpha_composite(_person(root, sprites[i % len(sprites)], (i * 3) % 4 if i % 5 else 0), (x, y))


CROWD = ["passant_a", "passant_b", "passant_c", "passant_d", "passant_e", "spectateur_a", "spectateur_b", "spectateur_c",
         "maraichere", "musicien", "enfant_a", "enfant_b"]


def _salle(root, empty=False, lantern=True):
    s = _load(root, "world/maps/salle_base.png").crop((16, 0, 16 + W, H))
    if not empty:
        aud = _load(root, "world/people/audience.png")
        k = 0
        for row in (9, 11):
            for x in list(range(3, 10)) + list(range(12, 19)):
                s.alpha_composite(aud.crop(((k % 8) * 16, 0, (k % 8) * 16 + 16, 16)), (x * T - 16, row * T - 6))
                k += 1
        for i, sp in enumerate(["louison", "spectateur_c", "passant_b", "helene", "passant_c"]):
            s.alpha_composite(_person(root, sp), (88 + i * 34, 3 * T + 2))
    if lantern:
        lamp = _load(root, "collection/lantern.png").resize((32, 32), Image.NEAREST)
        s = _glow(s, 160, 30, 70, (255, 230, 150), 150)
        s.alpha_composite(lamp, (144, 12))
    return s


def generate(root, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    city = _city(root)
    lights = _load(root, "world/maps/rue_lights.png")
    th = (52 * T, 440)              # place de la Lanterne : toute la façade du théâtre visible
    scenes = {}

    # 1. Bréval la nuit
    img = _tint(_crop_center(city, *th), 0.42, 0.42, 0.68)
    lit = _crop_center(lights, *th)
    img = Image.alpha_composite(img, lit)
    scenes["01_ville"] = _vignette(img)

    # 2. 1902 : les habitants bâtissent le théâtre
    img = _crop_center(city, *th)
    _people(root, img, [(40 + i * 23, 112 + (i % 3) * 9) for i in range(11)], CROWD)
    cloth = Image.new("RGBA", (120, 14), (150, 34, 50, 255))
    for x in range(0, 120, 10):
        cloth.putpixel((x + 4, 6), (240, 212, 138, 255))
        cloth.putpixel((x + 5, 7), (240, 212, 138, 255))
    img.alpha_composite(cloth, (100, 96))
    scenes["02_1902"] = _vignette(_sepia(img))

    # 3. 12 mars 1924, la création
    scenes["03_1924"] = _vignette(_sepia(_salle(root), 0.85))

    # 4. La lanterne s'éteint
    img = _tint(_salle(root, lantern=False), 0.25, 0.22, 0.3)
    scenes["04_noir"] = _vignette(img, 0.8)

    # 5. L'âge d'or
    img = _crop_center(city, *th)
    _people(root, img, [(20 + (i * 37) % 280, 100 + (i * 13) % 60) for i in range(18)], CROWD)
    img = _tint(img, 1.05, 0.95, 0.8)
    scenes["05_age_or"] = _vignette(_sepia(img, 0.55))

    # 6. Le déclin : salle vide et poussiéreuse
    img = _salle(root, empty=True, lantern=False)
    img = ImageEnhance.Color(img).enhance(0.25)
    img = _tint(img, 0.6, 0.65, 0.8)
    dust = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    import random
    r = random.Random(4)
    for _ in range(400):
        dust.putpixel((r.randrange(W), r.randrange(H)), (200, 200, 210, r.randrange(30, 90)))
    img.alpha_composite(dust)
    for i in range(14):  # toiles d'araignée dans les coins
        img.putpixel((i, i // 2), (210, 210, 220, 255))
        img.putpixel((W - 1 - i, i // 2), (210, 210, 220, 255))
    scenes["06_declin"] = _vignette(img, 0.75)

    # 7. Aujourd'hui : la Ville vous confie le théâtre
    img = _crop_center(city, 37 * T, 440)
    img = _tint(img, 1.0, 0.96, 0.9)
    big = lambda s: _person(root, s).resize((32, 48), Image.NEAREST)
    img.alpha_composite(big("pommier"), (140, 112))
    img.alpha_composite(big("directeur").transpose(Image.FLIP_LEFT_RIGHT), (176, 112))
    paper = Image.new("RGBA", (12, 14), (243, 233, 210, 255))
    img.alpha_composite(paper, (166, 132))
    scenes["07_aujourdhui"] = _vignette(img)

    # 8. L'équipe
    bg = Image.new("RGBA", (W, H), (60, 14, 30, 255))
    for x in range(W):
        shade = 0.75 + 0.25 * ((x // 6) % 2)
        for y in range(H):
            bg.putpixel((x, y), (int(110 * shade), int(22 * shade), int(42 * shade), 255))
    for i, who in enumerate(["helene", "bastien", "ines", "louison"]):
        p = _load(root, "pixel_art/portraits/%s_happy.png" % who).resize((64, 64), Image.NEAREST)
        x = 18 + i * 74
        frame = Image.new("RGBA", (70, 70), (201, 162, 75, 255))
        bg.alpha_composite(frame, (x - 3, 50))
        bg.alpha_composite(p, (x, 53))
    scenes["08_equipe"] = _vignette(bg, 0.4)

    # 9. Rallumer la Lanterne
    img = Image.new("RGBA", (W, H), (14, 10, 22, 255))
    img = _glow(img, 160, 82, 110, (255, 214, 130), 190)
    lamp = _load(root, "collection/lantern.png").resize((64, 64), Image.NEAREST)
    img.alpha_composite(lamp, (128, 46))
    scenes["09_titre"] = _vignette(img, 0.4)

    for name, im in scenes.items():
        im.convert("RGB").save(os.path.join(out_dir, name + ".png"))
    return list(scenes)

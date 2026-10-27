"""Image de couverture de la page itch.io (630 × 500, format conseillé par itch.io).

Le pixel art du jeu (la façade du Théâtre de la Lanterne sur la place, en automne, et
ses personnages) est assemblé à l'échelle 1, encadré de rideaux de velours, puis agrandi
×2 sans lissage ; le titre est écrit avec la police du jeu (Jersey 10).

    python3 tools/art/cover.py   →   docs/itch/cover.png
"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
MAPS = os.path.join(ROOT, "assets", "world", "maps")
PEOPLE = os.path.join(ROOT, "assets", "world", "people")
W, H = 315, 250  # avant agrandissement ×2
GOLD, GOLD_LIGHT, INK = (201, 162, 75), (240, 212, 138), (22, 15, 30)
VELVET = [(74, 15, 31), (110, 22, 44), (150, 34, 56), (110, 22, 44)]


def person(sprite, direction="down", frame=0):
    sheet = Image.open(os.path.join(PEOPLE, sprite + ".png")).convert("RGBA")
    row = ["down", "up", "left", "right"].index(direction)
    return sheet.crop((frame * 16, row * 24, frame * 16 + 16, row * 24 + 24))


def curtain(img, x0, w, left):
    """Rideau de velours plissé, retenu par une embrasse dorée."""
    d = ImageDraw.Draw(img)
    for x in range(w):
        col = VELVET[(x // 3) % 4]
        # le rideau s'évase vers le bas, retenu à mi-hauteur
        for y in range(H):
            pinch = 0 if y < 120 else int((y - 120) * 0.10)
            edge = w - pinch if left else pinch
            if (left and x < edge) or (not left and x >= edge):
                d.point((x0 + x, y), col)
    tie_x = x0 + (w - 14 if left else 2)
    d.rectangle((tie_x, 118, tie_x + 11, 123), fill=GOLD)
    d.rectangle((tie_x + 4, 124, tie_x + 7, 131), fill=GOLD_LIGHT)


def build():
    base = Image.open(os.path.join(MAPS, "rue_automne_base.png")).convert("RGBA")
    top = Image.open(os.path.join(MAPS, "rue_automne_top.png")).convert("RGBA")
    base.alpha_composite(top)
    cx = 832  # milieu de la façade du théâtre
    img = base.crop((cx - W // 2, 274, cx - W // 2 + W, 274 + H))
    # Des spectateurs arrivent, la direction et l'équipe les accueillent
    cast = [
        ("helene", "down", 0, 128, 210), ("directeur_redingote", "down", 0, 150, 213), ("ines", "down", 0, 172, 210),
        ("lazare", "right", 0, 98, 216), ("spectateur_a", "up", 1, 114, 232), ("spectateur_b", "up", 2, 196, 230),
        ("passant_c", "up", 1, 228, 222), ("enfant_a", "up", 2, 214, 234), ("passant_a", "left", 1, 250, 232),
        ("spectateur_c", "up", 0, 74, 234),
    ]
    for sprite, direction, frame, x, y in sorted(cast, key=lambda c: c[4]):
        img.alpha_composite(person(sprite, direction, frame), (x, y))
    # Haut assombri : la nuit tombe sur la ville, place au titre
    shade = Image.new("RGBA", (W, H))
    sd = ImageDraw.Draw(shade)
    for y in range(100):
        sd.line((0, y, W, y), fill=(22, 15, 30, int(235 * (1 - y / 100) ** 0.8)))
    img.alpha_composite(shade)
    curtain(img, 0, 34, left=True)
    curtain(img, W - 34, 34, left=False)
    d = ImageDraw.Draw(img)
    for x in range(W):  # lambrequin festonné en haut
        col = VELVET[((x // 4) + 1) % 4]
        drop = 9 + (3 if (x // 15) % 2 == 0 else 0)
        d.line((x, 0, x, drop), fill=col)
        d.point((x, drop + 1), GOLD if x % 2 == 0 else (150, 110, 50))
    d.rectangle((0, H - 2, W, H), fill=GOLD)

    out = img.resize((W * 2, H * 2), Image.NEAREST)
    # Titre et sous-titre à la taille finale, sans lissage, contour sombre
    fonts = os.path.join(ROOT, "assets", "fonts")
    title_font = ImageFont.truetype(os.path.join(fonts, "Jersey10-Regular.ttf"), 120)
    sub_font = ImageFont.truetype(os.path.join(fonts, "PixelifySans.ttf"), 26)
    od = ImageDraw.Draw(out)
    od.fontmode = "1"

    def centered(text, font, y, fill, outline):
        w = od.textlength(text, font=font)
        x = (W * 2 - w) / 2
        for dx in range(-outline, outline + 1):
            for dy in range(-outline, outline + 1):
                if dx or dy:
                    od.text((x + dx, y + dy), text, font=font, fill=INK)
        od.text((x, y), text, font=font, fill=fill)

    centered("RIDEAU !", title_font, 22, GOLD_LIGHT, 5)
    centered("À vous de diriger le spectacle", sub_font, 152, (243, 233, 210), 3)
    path = os.path.join(ROOT, "docs", "itch", "cover.png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.convert("RGB").save(path)
    return path


if __name__ == "__main__":
    print(build())

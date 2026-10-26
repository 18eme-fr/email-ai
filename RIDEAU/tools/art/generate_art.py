"""Génère toutes les images de RIDEAU ! dans assets/.

Usage (depuis la racine du projet) :
    python3 tools/art/generate_art.py

Les images sont 100 % originales, produites par ce code (licence du projet).
Relancer le script régénère l'ensemble de façon identique (graines fixes).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

import icons  # noqa: E402
import portraits  # noqa: E402
import posters  # noqa: E402
import theatre  # noqa: E402
import ui  # noqa: E402
from pixel import P, Canvas, shade  # noqa: E402


def menu_background(path: str) -> None:
    w, h = 640, 360
    c = Canvas(w, h, P["ink"])
    theatre.velvet_wide(c, 0, 0, w, h, period=22)
    # assombrir les bords, halo central
    for y in range(h):
        for x in range(w):
            dx = (x - w / 2) / (w / 2)
            dy = (y - h * 0.45) / (h / 2)
            d = dx * dx + dy * dy
            if d > 0.55:
                c.set(x, y, P["ink"], int(min(170, (d - 0.55) * 220)))
            elif d < 0.25:
                c.set(x, y, P["light"], int((0.25 - d) * 90))
    # lambrequin doré
    theatre.velvet_wide(c, 0, 0, w, 26, period=11, seed=3)
    for x in range(w):
        c.set(x, 26, P["gold2"])
        c.set(x, 27, P["gold1"] if x % 2 else P["gold3"])
        if (x // 10) % 2 == 0:
            c.vline(x, 28, 30, P["gold1"])
    # plancher
    c.rect(0, h - 26, w, 26, P["wood1"])
    c.hline(0, w - 1, h - 26, P["wood3"])
    for x in range(0, w, 24):
        c.vline(x, h - 25, h - 1, P["wood0"])
    for x in range(10, w, 30):
        c.rect(x, h - 27, 4, 2, P["gold3"])
    c.save(path, 2)


def app_icon(path: str) -> None:
    c = Canvas(32, 32)
    c.rect(1, 1, 30, 30, P["velvet1"])
    theatre.velvet_drape(c, 2, 2, 28, 28, seed=1)
    c.frame(0, 0, 32, 32, P["ink"])
    c.frame(1, 1, 30, 30, P["gold2"])
    lantern = icons.build("lantern")
    c.paste(lantern, 8, 8)
    c.save(path, 4)


def main() -> None:
    a = os.path.join(ROOT, "assets")
    dirs = {
        "ui": os.path.join(a, "ui"),
        "icons": os.path.join(a, "pixel_art", "icons"),
        "portraits": os.path.join(a, "pixel_art", "portraits"),
        "posters": os.path.join(a, "pixel_art", "posters"),
        "theatre": os.path.join(a, "pixel_art", "theatre"),
    }
    for d in dirs.values():
        os.makedirs(d, exist_ok=True)
    ui.export(dirs["ui"])
    icons.export(dirs["icons"], 2)
    portraits.export(dirs["portraits"], 3)
    posters.export(dirs["posters"], os.path.join(ROOT, "data", "performances", "catalog.json"), 2)
    theatre.export(dirs["theatre"], 2)
    menu_background(os.path.join(dirs["ui"], "menu_background.png"))
    app_icon(os.path.join(dirs["ui"], "icon.png"))
    # Monde explorable (importé en dernier : il complète la petite police de theatre.py).
    import world  # noqa: E402
    world.generate(ROOT, os.path.join(a, "world"))
    print("Images générées dans", a)


if __name__ == "__main__":
    main()

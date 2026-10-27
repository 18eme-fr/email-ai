"""L'étage de la direction du Théâtre de la Lanterne.

Depuis le hall, une porte ouvre sur la cage d'escalier ; l'escalier monte vers un
couloir où donnent trois portes : le bureau de la direction, les toilettes et les
archives (avec le bureau de l'archiviste et une malle de costumes, où se cache un
objet de la collection).

write(world)          : écrit les cartes dans world.json (appelé par city_layout.py)
generate(world, dir)  : dessine leurs décors (appelé par world.py)

Les plans suivent les conventions des intérieurs (interiors_layout.py) ; « I » est un
meuble dessiné ici (cabines, lavabos, mannequin, malle), « S » une marche praticable.
"""
import os

from pixel import P, Canvas, shade
import interiors as IN
import world as W0
from world import T, outlined

LEGEND = {"I": ("meuble", False)}

# Papier peint de l'étage (dans la continuité du hall), carrelage des toilettes, archives.
WALLS = {
    "lanterne": {"paper": P["velvet1"], "pattern": P["velvet0"], "wainscot": P["wood1"], "trim": P["gold2"]},
    "carrelage": {"paper": (214, 226, 224), "pattern": (190, 206, 204), "wainscot": P["teal"], "trim": P["white"]},
    "archives": {"paper": (176, 150, 112), "pattern": (156, 130, 94), "wainscot": P["wood0"], "trim": P["gold1"]},
}

MAPS = {
    "escalier": {
        "name": "Cage d'escalier", "outdoor": False,
        "grid": [
            "############",
            "#####DD#####",
            "#o..SSSS..o#",
            "#...SSSS...#",
            "#...SSSS...#",
            "#..........#",
            "#B........x#",
            "#o.........#",
            "#####DD#####",
        ],
        "doors": [
            {"cell": [5, 1], "to": "couloir", "to_cell": [9, 4], "facing": "up"},
            {"cell": [6, 1], "to": "couloir", "to_cell": [10, 4], "facing": "up"},
            {"cell": [5, 8], "to": "hall", "to_cell": [20, 6], "facing": "left"},
            {"cell": [6, 8], "to": "hall", "to_cell": [20, 7], "facing": "left"},
        ],
        "spots": [
            {"id": "portraits", "cells": [[2, 1], [3, 1], [8, 1], [9, 1]], "label": "Portraits des anciens directeurs", "kind": "flavor"},
            {"id": "plan_etage", "cells": [[10, 6]], "label": "Plan de l'étage", "kind": "flavor"},
        ],
        "npcs": [],
        "style": {"floor": "marble", "walls": "lanterne", "wall": [["frame", 2], ["frame", 3], ["frame", 8], ["frame", 9]]},
        "sound": {"music": "foyer", "layers": {}, "steps": "tapis"},
    },
    "couloir": {
        "name": "Couloir de la direction", "outdoor": False,
        "grid": [
            "####################",
            "###D#####D######D###",
            "#o................o#",
            "#,,,,,,,,,,,,,,,,,,#",
            "#..................#",
            "#########DD#########",
        ],
        "doors": [
            {"cell": [3, 1], "to": "bureau", "to_cell": [6, 8], "facing": "up"},
            {"cell": [9, 1], "to": "toilettes", "to_cell": [4, 4], "facing": "up"},
            {"cell": [16, 1], "to": "archives", "to_cell": [6, 8], "facing": "up"},
            {"cell": [9, 5], "to": "escalier", "to_cell": [5, 2], "facing": "down"},
            {"cell": [10, 5], "to": "escalier", "to_cell": [6, 2], "facing": "down"},
        ],
        "spots": [
            {"id": "affiches_couloir", "cells": [[6, 1], [12, 1]], "label": "Affiches des saisons passées", "kind": "flavor"},
        ],
        "npcs": [],
        "style": {"floor": "parquet", "walls": "lanterne", "wall": [["poster", 6], ["poster", 12], ["clock", 14]]},
        "sound": {"music": "foyer", "layers": {"bureau": 0.3}, "steps": "bois"},
    },
    "toilettes": {
        "name": "Toilettes", "outdoor": False,
        "grid": [
            "##########",
            "##########",
            "#IIII..II#",
            "#........#",
            "#o.......#",
            "####D#####",
        ],
        "doors": [{"cell": [4, 5], "to": "couloir", "to_cell": [9, 2], "facing": "down"}],
        "spots": [
            {"id": "cabines", "cells": [[1, 2], [2, 2], [3, 2], [4, 2]], "label": "Cabines", "kind": "flavor"},
            {"id": "lavabos", "cells": [[7, 2], [8, 2]], "label": "Lavabos", "kind": "flavor"},
        ],
        "npcs": [],
        "style": {"floor": "checker", "walls": "carrelage", "wall": []},
        "sound": {"music": "foyer", "layers": {}, "steps": "pierre"},
    },
    "archives": {
        "name": "Archives du théâtre", "outdoor": False,
        "grid": [
            "##############",
            "##############",
            "#bbbb.kk.bbbb#",
            "#............#",
            "#.ddd....IIII#",
            "#............#",
            "#x...........#",
            "#xx....,,,...#",
            "#o.....,,,..o#",
            "######D#######",
        ],
        "doors": [{"cell": [6, 9], "to": "couloir", "to_cell": [16, 2], "facing": "down"}],
        "spots": [
            {"id": "bureau_archives", "cells": [[2, 4], [3, 4], [4, 4]], "label": "Bureau de l'archiviste", "kind": "flavor"},
            {"id": "registres", "cells": [[1, 2], [2, 2], [3, 2], [4, 2], [9, 2], [10, 2], [11, 2], [12, 2]], "label": "Registres des saisons", "kind": "flavor"},
            {"id": "fichier_archives", "cells": [[6, 2], [7, 2]], "label": "Fichier des spectacles", "kind": "flavor"},
            {"id": "malle_archives", "cells": [[9, 4], [10, 4], [11, 4], [12, 4]], "label": "Malle aux costumes", "kind": "flavor"},
        ],
        "npcs": [],
        "style": {"floor": "parquet", "walls": "archives", "wall": [["window", 6, 2], ["map", 2]]},
        "sound": {"music": "reserve", "layers": {"reserve": 0.4}, "steps": "bois"},
    },
}


def write(world):
    """Ajoute l'étage dans world.json et relie la porte du hall et celle du bureau."""
    for ch, (name, walk) in LEGEND.items():
        world["legend"][ch] = {"name": name, "walk": walk}
    for mid, m in MAPS.items():
        world["maps"][mid] = m
    hall = world["maps"]["hall"]
    for d in hall["doors"]:
        if d["to"] in ("bureau", "escalier"):
            d["to"] = "escalier"
            d["to_cell"] = [5, 7] if d["cell"][1] == 6 else [6, 7]
            d["facing"] = "up"
    bureau = world["maps"]["bureau"]
    for d in bureau["doors"]:
        d["to"], d["to_cell"], d["facing"] = "couloir", [3, 2], "down"
    return list(MAPS)


# --- Dessin -----------------------------------------------------------------------------

def back_door(base, lights, x, y, wood):
    """Porte dans le mur du fond (rangée 1), sans plaque : la couleur suffit à les distinguer."""
    x0, y0 = x * T, y * T
    base.rect(x0, y0 - 6, T, T + 6, P["ink"])
    base.rect(x0 + 2, y0 - 4, 12, 20, shade(wood, 0.8))
    base.rect(x0 + 3, y0 - 3, 10, 19, wood)
    base.frame(x0 + 4, y0 - 1, 8, 6, shade(wood, 0.8))
    base.frame(x0 + 4, y0 + 7, 8, 7, shade(wood, 0.8))
    base.set(x0 + 11, y0 + 6, P["gold3"])
    base.rect(x0 + 2, y0 + 15, 12, 1, P["light"])
    lights.rect(x0, y0 + 10, T, 10, P["light"], 50)


def stairs_up(base, top, x0, y0, w, h):
    """Escalier qui monte vers le fond : marches de chêne, tapis rouge, tringles et rampes."""
    n = h // 6
    for i in range(n):
        sy = y0 + i * 6
        wood = shade(P["wood3"], 0.72 + i * 0.045)
        base.rect(x0, sy, w, 6, wood)
        base.hline(x0, x0 + w - 1, sy, shade(wood, 1.2))           # nez de marche
        base.hline(x0, x0 + w - 1, sy + 5, shade(wood, 0.65))      # contremarche
        base.rect(x0 + 10, sy, w - 20, 6, shade(P["velvet2"], 0.8 + i * 0.025))
        base.hline(x0 + 10, x0 + w - 11, sy, shade(P["velvet3"], 1.05))
        base.hline(x0 + 10, x0 + w - 11, sy + 5, P["gold2"])        # tringle dorée
        base.set(x0 + 10, sy + 5, P["gold3"])
        base.set(x0 + w - 11, sy + 5, P["gold3"])
    for rx in (x0, x0 + w - 4):  # rampes : limon, balustres, main courante en laiton
        base.rect(rx, y0, 4, h, P["wood0"])
        for by in range(y0 + 3, y0 + h, 6):
            base.vline(rx + 1, by, by + 3, P["wood1"])
        top.vline(rx + 1, y0 - 6, y0 + h - 1, P["gold2"])
        top.vline(rx + 2, y0 - 6, y0 + h - 1, P["gold1"])
    for rx in (x0 - 2, x0 + w - 3):  # pilastres de départ et leur boule dorée
        top.rect(rx, y0 + h - 12, 5, 12, P["wood0"])
        top.rect(rx + 1, y0 + h - 11, 3, 10, P["wood1"])
        top.ellipse(rx + 2, y0 + h - 13, 2, 2, P["gold3"])


def landing(base, x0, y0, w):
    """Arrivée de l'escalier dans le couloir : dernières marches vues d'en haut."""
    for i in range(3):
        col = shade(P["wood3"], 1.1 - i * 0.14)
        base.rect(x0, y0 + 4 + i * 4, w, 4, col)
        base.hline(x0, x0 + w - 1, y0 + 4 + i * 4, shade(col, 1.2))
        base.rect(x0 + 6, y0 + 4 + i * 4, w - 12, 4, shade(P["velvet2"], 0.95 - i * 0.08))
    base.rect(x0 - 2, y0 + 2, 2, 14, P["gold2"])
    base.rect(x0 + w, y0 + 2, 2, 14, P["gold2"])


def stall(base, top, x0, y0, open_door):
    """Cabine de toilettes : cloisons, porte (entrouverte ou fermée), loquet vert/rouge."""
    base.rect(x0, y0 - 14, 2 * T, 30, (236, 238, 232))
    base.rect(x0, y0 - 14, 2, 30, (170, 180, 178))
    base.rect(x0 + 2 * T - 2, y0 - 14, 2, 30, (170, 180, 178))
    if open_door:
        base.rect(x0 + 2, y0 - 12, 2 * T - 4, 26, (200, 210, 208))
        base.rect(x0 + 10, y0, 12, 10, P["white"])          # cuvette
        base.ellipse(x0 + 16, y0 + 4, 5, 3, (180, 196, 200))
        base.rect(x0 + 11, y0 - 8, 10, 7, P["white"])       # réservoir
        base.rect(x0 + 2, y0 - 12, 5, 26, P["teal"])        # porte ouverte vue de côté
    else:
        base.rect(x0 + 3, y0 - 11, 2 * T - 6, 25, P["teal"])
        base.frame(x0 + 3, y0 - 11, 2 * T - 6, 25, shade(P["teal"], 0.7))
        base.rect(x0 + 2 * T - 8, y0, 3, 2, P["velvet3"])   # loquet « occupé »
    top.rect(x0, y0 - 16, 2 * T, 2, (150, 160, 158))


def sink(base, x0, y0):
    base.rect(x0 + 2, y0 - 14, 12, 10, (200, 220, 230))     # miroir
    base.frame(x0 + 2, y0 - 14, 12, 10, P["grey2"])
    base.line(x0 + 4, y0 - 12, x0 + 7, y0 - 9, P["white"])
    base.rect(x0 + 1, y0 + 1, 14, 6, P["white"])
    base.ellipse(x0 + 8, y0 + 3, 4, 2, (176, 196, 204))
    base.rect(x0 + 7, y0 - 2, 2, 3, P["grey2"])             # robinet
    base.rect(x0 + 6, y0 + 7, 4, 7, P["grey1"])


def mannequin(base, top, x0, y0):
    """Mannequin de couture portant la redingote de 1923 et son haut-de-forme."""
    def d(o):
        o.rect(7, 26, 2, 6, P["wood1"])                     # pied
        o.rect(4, 31, 8, 1, P["wood0"])
        o.rect(3, 8, 10, 15, P["velvet3"])                  # redingote
        o.rect(3, 20, 4, 8, P["velvet2"])                   # basques
        o.rect(9, 20, 4, 8, P["velvet2"])
        o.rect(6, 8, 4, 6, P["cream"])                      # plastron
        o.rect(7, 9, 2, 1, P["ink"])                        # nœud
        for by in (14, 17):
            o.set(6, by, P["gold3"])
            o.set(9, by, P["gold3"])
        o.hline(3, 12, 8, P["gold2"])
        o.rect(5, 3, 6, 5, P["wood3"])                      # tête de mannequin
        o.rect(4, 0, 8, 3, P["ink"])                        # haut-de-forme
        o.hline(3, 12, 3, P["ink"])
        o.hline(4, 11, 2, P["velvet3"])
    top.paste(outlined(16, 32, d), x0, y0 - 18)


def trunk(base, x0, y0, w):
    """Malle de costumes ouverte : bois cerclé, tissus qui débordent."""
    def d(o):
        o.rect(0, 6, w, 10, P["wood2"])
        o.hline(0, w - 1, 6, P["wood3"])
        for bx in (2, w - 4):
            o.rect(bx, 6, 2, 10, P["gold1"])
        o.rect(0, 0, w, 5, P["wood1"])                      # couvercle relevé
        o.hline(0, w - 1, 0, P["wood3"])
        o.rect(3, 4, 7, 4, P["teal"])                       # tissus
        o.rect(10, 3, 8, 5, P["gold2"])
        o.rect(18, 4, 6, 4, P["purple1"])
        o.set(14, 5, P["white"])
    base.paste(outlined(w, 16, d), x0, y0)


def paint(world, mid):
    m = world["maps"][mid]
    for k, v in WALLS.items():
        IN.WALLS[k] = v
    base, top, lights = IN.paint(m, IN.WALLS)
    if mid == "escalier":
        stairs_up(base, top, 4 * T, 2 * T, 4 * T, 3 * T)
        W0.double_door(base, 5 * T, T, P["wood2"])
        lights.rect(5 * T, 2 * T, 2 * T, 8, P["light"], 60)
        W0.draw_bench(base, 1 * T, 6 * T, T)
        # Panneau « plan de l'étage » sur pied
        base.rect(10 * T + 7, 6 * T + 4, 2, 12, P["wood0"])
        base.rect(10 * T + 1, 6 * T - 6, 14, 11, P["cream"])
        base.frame(10 * T + 1, 6 * T - 6, 14, 11, P["wood0"])
        for i, col in enumerate((P["velvet3"], P["teal"], P["gold2"])):
            base.rect(10 * T + 3 + i * 4, 6 * T - 3, 3, 4, col)
    elif mid == "couloir":
        back_door(base, lights, 3, 1, P["wood2"])
        back_door(base, lights, 9, 1, P["teal"])
        back_door(base, lights, 16, 1, P["wood1"])
        landing(base, 9 * T, 5 * T - 4, 2 * T)
        for lx in (6, 12):  # appliques murales
            top.rect(lx * T - 9, T + 2, 3, 4, P["gold2"])
            lights.rect(lx * T - 16, T, 16, 16, P["light"], 70)
    elif mid == "toilettes":
        stall(base, top, 1 * T, 2 * T, open_door=True)
        stall(base, top, 3 * T, 2 * T, open_door=False)
        sink(base, 7 * T, 2 * T)
        sink(base, 8 * T, 2 * T)
        base.rect(6 * T + 4, 3 * T + 2, 6, 10, P["grey1"])  # poubelle
        base.rect(6 * T + 3, 3 * T + 1, 8, 2, P["grey2"])
    elif mid == "archives":
        trunk(base, 9 * T, 4 * T, 3 * T)
        mannequin(base, top, 12 * T, 4 * T)
        # Le bureau de l'archiviste : lampe verte, boîtes, fiches
        W0.draw_desk(base, 2 * T, 4 * T, 3 * T, [("lamp", 4), ("paper", 18), ("book", 32)])
        base.rect(3 * T + 4, 5 * T + 2, 8, 6, P["wood1"])  # chaise
        # Cartons d'archives empilés, étiquetés
        for (x, y) in [(1, 6), (1, 7), (2, 7)]:
            base.rect(x * T + 1, y * T + 2, 14, 12, (196, 170, 120))
            base.frame(x * T + 1, y * T + 2, 14, 12, (140, 116, 78))
            base.rect(x * T + 5, y * T + 6, 6, 3, P["white"])
    return base, top, lights


def generate(world, maps_dir):
    for mid in MAPS:
        base, top, lights = paint(world, mid)
        base.save(os.path.join(maps_dir, f"{mid}_base.png"))
        top.save(os.path.join(maps_dir, f"{mid}_top.png"))
        lights.save(os.path.join(maps_dir, f"{mid}_lights.png"))
    return list(MAPS)

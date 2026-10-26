"""Plan du petit quartier parisien où la troupe joue sa création, en fin de saison :
la place des Lumières, son théâtre, la gare d'arrivée, un boulevard, des ruelles et
les quais de Seine avec les bouquinistes (la tour Eiffel sur l'autre rive).

Écrit la carte « paris » de data/world/world.json (grille, sol, bâtiments, objets,
habitants) et ses personnages. Appelé par city_layout.py ; dessiné par paris.py.
"""
from collections import deque

W, H = 60, 52
WALK = set("_=z+aP")

# Personnes du quartier : sprite, nom, réplique (clé de barks.json = identifiant).
PEOPLE = {
    "lazare_paris": ("lazare", "Victor Lazare, metteur en scène"),
    "helene_paris": ("helene", "Hélène, administratrice"),
    "bastien_paris": ("bastien", "Bastien, régisseur"),
    "ines_paris": ("ines", "Inès, médiation"),
    "louison_paris": ("louison", "Louison, costumière"),
    "serveur_paris": ("serveur", "Le serveur du Café de la Comédie"),
    "bouquiniste": ("bouquiniste", "Bouquiniste des quais"),
    "peintre": ("peintre", "Peintre de la place"),
    "critique": ("critique", "Mme Delorme, critique à la Gazette des Planches"),
    "accordeoniste": ("musicien", "Accordéoniste"),
    "touriste_paris": ("touriste", "Touriste"),
    "parisienne": ("passant_e", "Parisienne"),
    "enfant_paris": ("enfant_b", "Enfant sur le manège"),
}


class Quarter:
    def __init__(self):
        self.grid = [["X"] * W for _ in range(H)]
        self.ground = [["X"] * W for _ in range(H)]
        self.buildings = []
        self.spots = []
        self.npcs = []

    def fill(self, x0, y0, x1, y1, ch, ground=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.grid[y][x] = ch
                self.ground[y][x] = ground or (ch if ch in "_=z+a~XH" else self.ground[y][x])

    def put(self, x, y, ch):
        self.grid[y][x] = ch

    def building(self, bid, style, x, y, w, h, label, doors, spot):
        self.fill(x, y, x + w - 1, y + h - 1, "H")
        for (dx, dy) in doors:
            self.grid[dy][dx] = "d"
        self.buildings.append({"id": bid, "style": style, "rect": [x, y, w, h], "label": label, "doors": [list(d) for d in doors]})
        s = {"id": bid, "cells": [list(d) for d in doors], "label": label, "kind": "flavor"}
        s.update(spot)
        self.spots.append(s)

    def spot(self, sid, cells, label, kind="flavor", **extra):
        s = {"id": sid, "cells": [list(c) for c in cells], "label": label, "kind": kind}
        s.update(extra)
        self.spots.append(s)

    def npc(self, nid, x, y, radius):
        assert self.grid[y][x] in WALK, (nid, x, y, self.grid[y][x])
        self.npcs.append({"id": nid, "cell": [x, y], "radius": radius})


def build():
    q = Quarter()
    # Rangée nord (façades sur le boulevard) : gare, café, théâtre, boulangerie, librairie.
    q.building("gare_paris", "paris_gare", 2, 4, 14, 8, "Gare de Paris-Est", [(8, 11), (9, 11)], {})
    q.building("cafe", "paris_cafe", 17, 4, 9, 8, "Café de la Comédie", [(21, 11)], {"flavor": "cafe_comedie"})
    q.building("theatre_lumieres", "paris_theatre", 27, 4, 16, 8, "Théâtre des Lumières", [(34, 11), (35, 11)], {"kind": "premiere"})
    q.building("boulangerie_paris", "paris_boulangerie", 44, 4, 7, 8, "Boulangerie Au Pain Doré", [(47, 11)], {})
    q.building("librairie_paris", "paris_librairie", 52, 4, 7, 8, "Librairie des Planches", [(55, 11)], {})
    for x0, x1 in ((16, 16), (26, 26), (43, 43), (51, 51)):
        q.fill(x0, 4, x1, 11, "X")
    # Boulevard
    q.fill(1, 12, W - 2, 12, "_")
    q.fill(1, 13, W - 2, 15, "=")
    q.fill(1, 16, W - 2, 16, "_")
    for x in (9, 10, 34, 35):
        for y in (13, 14, 15):
            q.put(x, y, "z")
            q.ground[y][x] = "z"
    # Place des Lumières
    q.fill(1, 17, W - 2, 28, "+")
    q.fill(28, 21, 29, 22, "F")
    q.spot("fontaine", [(28, 21), (29, 21), (28, 22), (29, 22)], "Fontaine Wallace", flavor="fontaine_wallace")
    for (x, y) in [(27, 20), (30, 20), (27, 23), (30, 23), (26, 21), (31, 22)]:
        q.put(x, y, "f")
    q.fill(13, 20, 15, 22, "Q")
    q.spot("manege", [(13, 22), (14, 22), (15, 22)], "Manège de la place")
    q.put(46, 18, "N")
    q.spot("kiosque_paris", [(46, 18)], "Kiosque à journaux")
    q.put(38, 18, "m")
    q.put(39, 18, "m")
    q.spot("metro", [(38, 18), (39, 18)], "Entrée du métro")
    for (x, y) in [(7, 18), (52, 25)]:
        q.put(x, y, "K")
    q.spot("affiche_paris", [(7, 18), (52, 25)], "Colonne Morris", "affiche_creation")
    for x in (19, 22, 25):
        q.put(x, 17, "t")
    q.spot("terrasse", [(19, 17), (22, 17), (25, 17)], "Terrasse du Café de la Comédie", flavor="terrasse_paris")
    for (x, y) in [(3, 19), (3, 26), (21, 24), (36, 24), (56, 19), (56, 26), (44, 27), (10, 27)]:
        q.put(x, y, "T")
    for (x, y) in [(17, 26), (18, 26), (40, 26), (41, 26), (24, 21), (25, 21)]:
        q.put(x, y, "B")
    for (x, y) in [(12, 17), (31, 17), (49, 17), (1, 22), (58, 22), (31, 28), (12, 28), (49, 28)]:
        q.put(x, y, "L")
    q.put(50, 27, "M")
    q.put(51, 27, "M")
    q.spot("fleurs_paris", [(50, 27), (51, 27)], "Marchande de fleurs")
    q.put(53, 22, "y")
    q.spot("chevalet", [(53, 22)], "Chevalet du peintre")
    q.put(30, 17, "x")
    q.put(31, 18, "x")
    q.put(37, 17, "R")
    q.spot("decor_troupe", [(30, 17), (31, 18), (37, 17)], "Le décor et les costumes de la troupe")
    for (x, y) in [(5, 17), (6, 17)]:
        q.put(x, y, "V")
    q.spot("velos_paris", [(5, 17), (6, 17)], "Vélos en libre-service")
    # Rue sud et rangée de façades sur les quais (on y passe par des ruelles).
    q.fill(1, 29, W - 2, 29, "_")
    q.fill(1, 30, W - 2, 32, "=")
    q.fill(1, 33, W - 2, 33, "_")
    for x in (29, 30):
        for y in (30, 31, 32):
            q.put(x, y, "z")
            q.ground[y][x] = "z"
    q.building("brasserie", "paris_brasserie", 1, 34, 12, 8, "Brasserie Le Rideau Rouge", [(6, 41)], {})
    q.building("galerie_paris", "paris_galerie", 15, 34, 12, 8, "Galerie du Pont-Neuf", [(20, 41)], {})
    q.building("immeuble_paris", "paris_immeuble", 31, 34, 12, 8, "Immeuble haussmannien", [(36, 41)], {})
    q.building("hotel_paris", "paris_hotel", 45, 34, 14, 8, "Hôtel des Artistes", [(51, 41), (52, 41)], {})
    for x0, x1 in ((13, 14), (27, 30), (43, 44)):
        q.fill(x0, 34, x1, 41, "a")
    q.put(28, 36, "o")
    q.put(13, 39, "E")
    # Quai, parapet et bouquinistes, la Seine, l'autre rive (tour Eiffel).
    q.fill(1, 42, W - 2, 42, "+")
    q.fill(1, 43, W - 2, 43, "W")
    for x in range(4, W - 4, 7):
        q.put(x, 43, "u")
        q.put(x + 1, 43, "u")
    q.spot("bouquinistes", [(x, 43) for x in range(4, W - 4, 7)], "Boîtes des bouquinistes")
    q.spot("seine", [(x, 43) for x in range(2, W - 2) if q.grid[43][x] == "W"], "Parapet de la Seine", flavor="seine")
    q.fill(1, 44, W - 2, 46, "~")
    q.fill(1, 47, W - 2, 50, "X")
    # Bordures
    for x in range(W):
        q.grid[0][x] = q.grid[H - 1][x] = "X"
    for y in range(H):
        q.grid[y][0] = q.grid[y][W - 1] = "X"
    # Habitants : la troupe et des Parisiens.
    for nid, x, y, r in [("lazare_paris", 37, 12, 0), ("helene_paris", 23, 18, 1), ("bastien_paris", 32, 17, 1),
                         ("louison_paris", 36, 17, 0), ("ines_paris", 44, 19, 2), ("serveur_paris", 21, 18, 2),
                         ("critique", 41, 22, 1), ("accordeoniste", 31, 21, 0), ("touriste_paris", 26, 25, 4),
                         ("peintre", 54, 22, 0), ("bouquiniste", 19, 42, 2), ("parisienne", 8, 24, 5),
                         ("enfant_paris", 16, 23, 1)]:
        q.npc(nid, x, y, r)
    return q


def reachable(q, start):
    seen = {start}
    dq = deque([start])
    while dq:
        x, y = dq.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and q.grid[n[1]][n[0]] in WALK:
                seen.add(n)
                dq.append(n)
    return seen


def write(world):
    q = build()
    walk = {(x, y) for y in range(H) for x in range(W) if q.grid[y][x] in WALK}
    lost = walk - reachable(q, (9, 13))
    assert not lost, ("cases inaccessibles à Paris", sorted(lost)[:10])
    legend = world["legend"]
    for ch, name, ok in [("m", "entrée de métro", False), ("u", "boîte de bouquiniste", False)]:
        legend[ch] = {"name": name, "walk": ok}
    world["maps"]["paris"] = {
        "name": "Paris", "outdoor": True,
        "grid": ["".join(r) for r in q.grid], "ground": ["".join(r) for r in q.ground],
        "doors": [], "spots": q.spots, "npcs": q.npcs, "buildings": q.buildings, "decor": [{"kind": "boat", "cell": [40, 45]}],
        "districts": [{"id": "paris_place", "name": "Place des Lumières", "rect": [0, 0, W, 29]},
                      {"id": "paris_quais", "name": "Quais de Seine", "rect": [0, 29, W, H - 29]}],
        "arrival": {"cell": [9, 13], "facing": "down"},
        "sound": {"music": "paris", "layers": {}},
    }
    for pid, (sprite, name) in PEOPLE.items():
        world["people"][pid] = {"sprite": sprite, "name": name, "home": "paris"}
    return len(walk)

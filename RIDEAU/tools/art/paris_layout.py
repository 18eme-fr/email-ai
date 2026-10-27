"""Plan du quartier parisien où la troupe joue sa création, en fin de saison.

Du nord au sud : l'autre rive (toits de Paris, Sacré-Cœur, tour Eiffel), la Seine et son
pont, le quai des bouquinistes, le quai routier, la grande rangée haussmannienne avec la
gare de l'Est, le Café de la Comédie, le Théâtre des Lumières (façon Opéra) et des
boutiques, le boulevard, puis la place des Lumières et, au fond, les toits de Paris.

Écrit la carte « paris » de data/world/world.json (grille, sol, bâtiments, objets,
habitants) et ses personnages. Appelé par city_layout.py ; dessiné par paris.py.
"""
from collections import deque

W, H = 64, 62
WALK = set("_=z+aP")

# Personnes du quartier : sprite, nom (répliques : data/world/barks.json, clé = identifiant).
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

# Rangée nord : (identifiant, style, x, largeur, libellé, portes (x), objet).
NORTH_ROW = [
    ("gare_paris", "paris_gare", 1, 13, "Gare de l'Est", (7, 8), {}),
    ("cafe", "paris_cafe", 16, 11, "Café de la Comédie", (21,), {"flavor": "cafe_comedie"}),
    ("theatre_lumieres", "paris_opera", 27, 20, "Théâtre des Lumières", (36, 37), {"kind": "premiere"}),
    ("boulangerie_paris", "paris_boulangerie", 47, 8, "Boulangerie Au Pain Doré", (50,), {}),
    ("librairie_paris", "paris_librairie", 57, 6, "Librairie des Planches", (59,), {}),
]
STREETS = [(14, 15), (55, 56)]   ## rues pavées qui traversent la rangée vers les quais
ROW_Y, ROW_H = 26, 11


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
                self.ground[y][x] = ground or (ch if ch in "_=z+a~XHP" else self.ground[y][x])

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
        for (x, y) in cells:
            assert self.grid[y][x] not in WALK, (sid, x, y, self.grid[y][x])
        s = {"id": sid, "cells": [list(c) for c in cells], "label": label, "kind": kind}
        s.update(extra)
        self.spots.append(s)

    def npc(self, nid, x, y, radius):
        assert self.grid[y][x] in WALK, (nid, x, y, self.grid[y][x])
        self.npcs.append({"id": nid, "cell": [x, y], "radius": radius})


def build():
    q = Quarter()
    # L'autre rive (rangées 0 à 12) reste un décor ; la Seine et son pont.
    q.fill(1, 13, W - 2, 16, "~")
    q.fill(40, 13, 43, 17, "P")
    q.spot("belvedere", [(41, 12), (42, 12)], "Vue sur la tour Eiffel", flavor="tour_eiffel")
    # Parapet et boîtes des bouquinistes, quai haut planté de platanes.
    q.fill(1, 17, 39, 17, "W")
    q.fill(44, 17, W - 2, 17, "W")
    boxes = []
    for x in list(range(3, 37, 6)) + list(range(46, W - 3, 6)):
        q.put(x, 17, "u")
        q.put(x + 1, 17, "u")
        boxes.append((x, 17))
    q.spot("bouquinistes", boxes, "Boîtes des bouquinistes")
    q.spot("seine", [(x, 17) for x in range(1, W - 1) if q.grid[17][x] == "W"], "Parapet de la Seine", flavor="seine")
    q.fill(1, 18, W - 2, 19, "+")
    for x in range(4, W - 3, 8):
        if not 39 <= x <= 44:
            q.put(x, 18, "T")
    for x in (8, 24, 38, 45, 58):
        q.put(x, 19, "L")
    # Quai routier
    q.fill(1, 20, W - 2, 23, "=")
    for x in (10, 11, 41, 42):
        for y in range(20, 24):
            q.put(x, y, "z")
            q.ground[y][x] = "z"
    q.fill(1, 24, W - 2, 25, "_")
    # La grande rangée haussmannienne
    for bid, style, x, w, label, doors, spot in NORTH_ROW:
        q.building(bid, style, x, ROW_Y, w, ROW_H, label, [(d, ROW_Y + ROW_H - 1) for d in doors], spot)
    for x0, x1 in STREETS:
        q.fill(x0, ROW_Y, x1, ROW_Y + ROW_H - 1, "a")
    # Trottoir du boulevard : terrasse, platanes, candélabres, colonne Morris, kiosque, métro, vélos.
    q.fill(1, 37, W - 2, 38, "_")
    for x in (17, 19, 23, 25):
        q.put(x, 37, "t")
    q.spot("terrasse", [(17, 37), (19, 37), (23, 37), (25, 37)], "Terrasse du Café de la Comédie", flavor="terrasse_paris")
    for x in (5, 12, 29, 45, 53, 61):
        q.put(x, 38, "T")
    for x in (2, 9, 32, 41, 49, 57):
        q.put(x, 38, "L")
    q.put(13, 38, "K")
    q.put(44, 38, "N")
    q.spot("kiosque_paris", [(44, 38)], "Kiosque à journaux")
    q.put(26, 38, "m")
    q.put(27, 38, "m")
    q.spot("metro", [(26, 38), (27, 38)], "Entrée du métro")
    q.put(3, 37, "V")
    q.put(4, 37, "V")
    q.spot("velos_paris", [(3, 37), (4, 37)], "Vélos en libre-service")
    q.put(40, 37, "x")
    q.put(41, 37, "x")
    q.put(33, 37, "R")
    q.spot("decor_troupe", [(40, 37), (41, 37), (33, 37)], "Le décor et les costumes de la troupe")
    # Boulevard
    q.fill(1, 39, W - 2, 42, "=")
    for x in (8, 9, 36, 37, 55, 56):
        for y in range(39, 43):
            q.put(x, y, "z")
            q.ground[y][x] = "z"
    q.fill(1, 43, W - 2, 44, "_")
    for x in (4, 16, 28, 47, 59):
        q.put(x, 44, "L")
    # Place des Lumières
    q.fill(1, 45, W - 2, 55, "+")
    q.fill(30, 48, 33, 50, "F")
    q.spot("fontaine", [(x, 50) for x in range(30, 34)] + [(29 + 1, 48), (33, 48)], "Fontaine des Lumières", flavor="fontaine_lumieres")
    q.fill(10, 47, 12, 49, "Q")
    q.spot("manege", [(10, 49), (11, 49), (12, 49)], "Manège de la place")
    q.put(50, 51, "Y")
    q.spot("wallace", [(50, 51)], "Fontaine Wallace", flavor="fontaine_wallace")
    for (x, y) in [(5, 46), (21, 46), (43, 46), (58, 46), (5, 54), (21, 54), (43, 54), (58, 54)]:
        q.put(x, y, "T")
    for (x, y) in [(16, 52), (17, 52), (38, 47), (39, 47), (25, 47), (26, 47), (46, 53), (47, 53)]:
        q.put(x, y, "B")
    for (x, y) in [(28, 46), (35, 46), (28, 54), (35, 54), (12, 53), (52, 47)]:
        q.put(x, y, "L")
    for (x, y) in [(29, 49), (34, 49)]:
        q.put(x, y, "f")
    q.put(54, 47, "M")
    q.put(55, 47, "M")
    q.spot("fleurs_paris", [(54, 47), (55, 47)], "Marchande de fleurs")
    q.put(24, 52, "y")
    q.spot("chevalet", [(24, 52)], "Chevalet du peintre")
    q.put(40, 53, "K")
    q.spot("affiche_paris", [(13, 38), (40, 53)], "Colonne Morris", "affiche_creation")
    q.fill(1, 56, W - 2, 56, "_")
    # Les toits de Paris au fond (rangées 57 à 60), bordures.
    for x in range(W):
        q.grid[0][x] = q.grid[H - 1][x] = "X"
    for y in range(H):
        q.grid[y][0] = q.grid[y][W - 1] = "X"
    # La troupe et les Parisiens
    for nid, x, y, r in [("lazare_paris", 38, 37, 0), ("helene_paris", 21, 38, 1), ("bastien_paris", 42, 38, 1),
                         ("louison_paris", 34, 38, 0), ("ines_paris", 30, 44, 2), ("serveur_paris", 19, 38, 2),
                         ("critique", 34, 47, 1), ("accordeoniste", 36, 52, 0), ("touriste_paris", 47, 50, 4),
                         ("peintre", 25, 52, 0), ("bouquiniste", 22, 19, 2), ("parisienne", 15, 46, 5),
                         ("enfant_paris", 11, 50, 1)]:
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
    arrival = (7, 37)
    walk = {(x, y) for y in range(H) for x in range(W) if q.grid[y][x] in WALK}
    lost = walk - reachable(q, arrival)
    assert not lost, ("cases inaccessibles à Paris", sorted(lost)[:10])
    legend = world["legend"]
    for ch, name, ok in [("m", "entrée de métro", False), ("u", "boîte de bouquiniste", False)]:
        legend[ch] = {"name": name, "walk": ok}
    world["maps"]["paris"] = {
        "name": "Paris", "outdoor": True,
        "grid": ["".join(r) for r in q.grid], "ground": ["".join(r) for r in q.ground],
        "doors": [], "spots": q.spots, "npcs": q.npcs, "buildings": q.buildings,
        "decor": [{"kind": "peniche", "cell": [6, 14]}, {"kind": "bateau_mouche", "cell": [50, 15]}],
        "districts": [{"id": "paris_quais", "name": "Quais de Seine", "rect": [0, 0, W, 26]},
                      {"id": "paris_boulevard", "name": "Boulevard des Lumières", "rect": [0, 26, W, 19]},
                      {"id": "paris_place", "name": "Place des Lumières", "rect": [0, 45, W, H - 45]}],
        "arrival": {"cell": list(arrival), "facing": "down"},
        "sound": {"music": "paris", "layers": {}},
    }
    for pid, (sprite, name) in PEOPLE.items():
        world["people"][pid] = {"sprite": sprite, "name": name, "home": "paris"}
    return len(walk)

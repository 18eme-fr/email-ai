"""Plan de Bréval-sur-Ondine : la grande ville autour du Théâtre de la Lanterne.

Écrit la carte « rue » de data/world/world.json : grille de collision (`grid`),
sol sous les objets (`ground`), bâtiments, objets à utiliser (`spots`), habitants,
arrêts de bus, quartiers et décors (train, bateaux). Le dessin (city.py) et le jeu
lisent ces mêmes données.

Usage : python3 tools/art/city_layout.py
"""
import json
import os
import random
from collections import deque

import interiors_layout as IL

W, H = 112, 80
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

# Caractères praticables de la ville (les autres bloquent).
WALK = set("_=z+:PgDra")


class City:
    def __init__(self):
        self.ground = [["g"] * W for _ in range(H)]
        self.grid = [["g"] * W for _ in range(H)]
        self.buildings = []
        self.spots = []
        self.npcs = []
        self.decor = []
        self.districts = []
        self.doors = []

    # -- primitives
    def fill(self, x0, y0, x1, y1, ch, ground=None):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < W and 0 <= y < H:
                    self.grid[y][x] = ch
                    self.ground[y][x] = ground if ground else (ch if ch in "_=z+:~gPXra" else self.ground[y][x])

    def put(self, x, y, ch):
        self.grid[y][x] = ch

    def hroad(self, y_walk_top, x0, x1):
        """Trottoir, chaussée de 3 cases, trottoir."""
        self.fill(x0, y_walk_top, x1, y_walk_top, "_")
        self.fill(x0, y_walk_top + 1, x1, y_walk_top + 3, "=")
        self.fill(x0, y_walk_top + 4, x1, y_walk_top + 4, "_")

    def vroad(self, x_walk_left, y0, y1):
        self.fill(x_walk_left, y0, x_walk_left, y1, "_")
        self.fill(x_walk_left + 1, y0, x_walk_left + 3, y1, "=")
        self.fill(x_walk_left + 4, y0, x_walk_left + 4, y1, "_")

    def crosswalk(self, x0, y0, x1, y1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if self.grid[y][x] == "=":
                    self.grid[y][x] = "z"
                    self.ground[y][x] = "z"

    def building(self, bid, style, x, y, w, h, label, doors, door_ch="d", spot=None):
        self.fill(x, y, x + w - 1, y + h - 1, "H", ground="H")
        for (dx, dy) in doors:
            self.grid[dy][dx] = door_ch
        self.buildings.append({"id": bid, "style": style, "rect": [x, y, w, h], "label": label, "doors": [list(d) for d in doors]})
        if spot is not None:
            s = {"id": bid, "cells": [list(d) for d in doors], "label": label}
            s.update(spot)
            self.spots.append(s)

    def spot(self, sid, cells, label, kind="flavor", **extra):
        s = {"id": sid, "cells": [list(c) for c in cells], "label": label, "kind": kind}
        s.update(extra)
        self.spots.append(s)

    def alley(self, x0, y0, x1, y1):
        """Ruelle pavée entre deux bâtiments (ou cour arrière)."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                assert self.grid[y][x] == "X", ("ruelle sur", x, y, self.grid[y][x])
        self.fill(x0, y0, x1, y1, "a")

    def npc(self, nid, x, y, radius):
        assert self.grid[y][x] in WALK, (nid, x, y, self.grid[y][x])
        self.npcs.append({"id": nid, "cell": [x, y], "radius": radius})


def build():
    c = City()
    r = random.Random(1789)
    # Bordures de la carte : haies et arrière-plans.
    c.fill(0, 0, W - 1, H - 1, "g")
    c.fill(0, 0, W - 1, 0, "X")
    c.fill(0, H - 1, W - 1, H - 1, "X")
    c.fill(0, 0, 0, H - 1, "X")
    c.fill(W - 1, 0, W - 1, H - 1, "X")

    # --- Gare (y 1..13) ---------------------------------------------------------
    c.fill(1, 1, W - 2, 2, "|", ground="r")
    c.fill(1, 3, W - 2, 3, "+")
    c.decor.append({"kind": "train", "rect": [34, 1, 26, 2]})
    c.fill(1, 4, W - 2, 8, "X")
    c.building("gare", "gare", 40, 4, 18, 5, "Gare de Bréval", [(48, 8), (49, 8)], spot={"kind": "flavor"})
    c.fill(2, 4, 22, 8, "=")
    for x in range(3, 22, 3):
        for y in (5, 7):
            if r.random() < 0.75:
                c.put(x, y, "v")
                c.put(x + 1, y, "v")
    c.building("fabrique", "fabrique", 62, 4, 12, 5, "La Fabrique (friche culturelle)", [(67, 8), (68, 8)], spot={"kind": "flavor"})
    c.building("hotel", "hotel", 86, 4, 10, 5, "Hôtel du Commerce", [(90, 8)], spot={"kind": "flavor"})
    c.hroad(9, 1, W - 2)
    # --- L'Ondine (rivière) -------------------------------------------------------
    c.fill(1, 14, W - 2, 16, "~")
    c.hroad(17, 1, W - 2)
    c.decor.append({"kind": "boat", "cell": [94, 15]})
    c.decor.append({"kind": "boat", "cell": [100, 14]})
    c.decor.append({"kind": "boat", "cell": [8, 15]})
    # --- Avenues nord-sud (avec ponts sur l'Ondine) -------------------------------
    c.vroad(26, 4, 78)
    c.vroad(78, 4, 78)
    for x0 in (26, 78):
        c.fill(x0, 13, x0 + 4, 17, "P")
        c.fill(x0, 3, x0 + 4, 3, "+")
    c.crosswalk(26, 10, 30, 12)
    c.crosswalk(78, 10, 82, 12)

    # --- Centre-ville : bâtiments au nord de la place (y 22..29) ------------------
    c.fill(31, 22, 77, 29, "X")
    c.building("mairie", "mairie", 32, 22, 10, 8, "Mairie", [(36, 29), (37, 29)], spot={"kind": "place", "character": "pommier"})
    c.building("theatre", "theatre", 46, 22, 12, 8, "Théâtre de la Lanterne", [(51, 29), (52, 29)], door_ch="D")
    c.building("cafe", "cafe", 60, 24, 6, 6, "Café des Artistes", [(62, 29)], spot={"kind": "flavor"})
    c.building("imprimerie", "imprimerie", 67, 24, 5, 6, "Imprimerie Lebrun", [(69, 29)], spot={"kind": "action", "action": "communication"})
    c.building("boulangerie", "boulangerie", 73, 24, 5, 6, "Boulangerie", [(75, 29)], spot={"kind": "flavor"})
    c.spot("facade", [(50, 29), (53, 29)], "Façade du théâtre", "upgrade", upgrade="enseigne")
    c.grid[29][50] = "H"
    c.grid[29][53] = "H"
    # --- Quartier des arts (est, y 22..40) -----------------------------------------
    c.fill(83, 22, W - 2, 29, "X")
    c.building("cinema", "cinema", 84, 22, 10, 8, "Cinéma Le Rex", [(88, 29), (89, 29)], spot={"kind": "flavor"})
    c.building("conservatoire", "conservatoire", 96, 22, 12, 8, "Conservatoire", [(101, 29), (102, 29)], spot={"kind": "flavor"})
    c.hroad(30, 83, W - 2)
    c.fill(83, 35, W - 2, 40, "X")
    shops = [("librairie", "Librairie La Plume", 84, (86,)), ("fleuriste", "Fleuriste", 91, (93,)),
             ("disquaire", "Disquaire", 97, (99,)), ("galerie", "Galerie d'art", 103, (105,))]
    for sid, label, x, doors in shops:
        c.building(sid, sid, x, 35, 6 if sid != "fleuriste" else 5, 6, label, [(d, 40) for d in doors], spot={"kind": "flavor"})
    c.crosswalk(83, 31, 83, 33)

    # --- Place de la Lanterne (y 30..40) -------------------------------------------
    c.fill(31, 30, 77, 40, "+")
    c.fill(53, 34, 54, 35, "F")
    c.spot("fontaine", [(53, 34), (54, 34), (53, 35), (54, 35)], "Fontaine d'Ondine")
    for (x, y) in [(40, 32), (66, 32)]:
        c.put(x, y, "K")
    c.spot("colonne", [(40, 32)], "Colonne Morris", "posters")
    c.spot("colonne_est", [(66, 32)], "Colonne Morris", "posters")
    for (x, y) in [(33, 32), (33, 38), (75, 32), (75, 38), (45, 38), (63, 38), (45, 32)]:
        c.put(x, y, "T")
    for (x, y) in [(47, 37), (48, 37), (59, 37), (60, 37), (35, 35), (36, 35)]:
        c.put(x, y, "B")
    for (x, y) in [(38, 36), (70, 36), (44, 31), (59, 31), (31, 30), (77, 30)]:
        c.put(x, y, "L")
    for (x, y) in [(60, 31), (64, 31)]:
        c.put(x, y, "t")
    for x in range(34, 43, 2):
        c.put(x, 39, "M")
        c.put(x + 1, 39, "M")
    c.spot("marche", [(x, 39) for x in range(34, 44)], "Marché du samedi")
    for (x, y) in [(72, 39), (73, 39)]:
        c.put(x, y, "V")
    for (x, y) in [(50, 39), (68, 33), (42, 33)]:
        c.put(x, y, "E")
    c.put(77, 35, "N")
    c.spot("kiosque_presse", [(77, 35)], "Kiosque à journaux")
    c.put(57, 32, "Y")
    c.spot("statue_place", [(57, 32)], "Statue du poète Anselme Brévalois")
    for (x, y) in [(31, 34), (31, 36), (77, 37)]:
        c.put(x, y, "o")

    # --- Boulevard Louise-Michel et quartier de la médiathèque (y 41..58) --------------
    c.hroad(41, 26, W - 2)
    c.fill(31, 46, 77, 53, "X")
    c.building("mediatheque", "mediatheque", 31, 46, 12, 8, "Médiathèque Louise-Michel", [(36, 53), (37, 53)], spot={"kind": "flavor"})
    c.building("halle", "halle", 45, 47, 14, 7, "Halle du marché", [(51, 53), (52, 53)], spot={"kind": "flavor"})
    c.building("ecole", "ecole", 61, 47, 12, 7, "École des Tilleuls", [(66, 53), (67, 53)], spot={"kind": "flavor"})
    c.fill(73, 46, 77, 53, "g")
    for (x, y) in [(74, 47), (76, 49), (74, 52)]:
        c.put(x, y, "T")
    c.put(75, 50, "B")
    c.put(76, 50, "B")
    c.fill(83, 46, W - 2, 53, "X")
    c.building("ondine", "siege", 85, 46, 16, 8, "Ondine Énergie (siège)", [(92, 53), (93, 53)], spot={"kind": "flavor"})
    c.fill(102, 47, 109, 53, "=")
    for y in (48, 51):
        for x in range(103, 109, 3):
            c.put(x, y, "v")
            c.put(x + 1, y, "v")
    c.hroad(54, 1, W - 2)
    c.crosswalk(52, 42, 53, 44)
    c.crosswalk(40, 55, 41, 57)
    c.crosswalk(68, 55, 69, 57)
    c.crosswalk(51, 18, 52, 20)
    c.crosswalk(48, 10, 49, 12)
    c.crosswalk(31, 18, 31, 20)
    c.crosswalk(77, 42, 77, 44)

    # --- Parc de l'Ondine (ouest, y 22..53) ----------------------------------------
    c.fill(1, 22, 25, 53, "g")
    c.fill(1, 37, 25, 37, "+")
    c.fill(13, 22, 13, 53, "+")
    c.fill(3, 24, 10, 30, "~")
    c.decor.append({"kind": "ducks", "rect": [3, 24, 8, 7]})
    c.spot("etang", [(x, 31) for x in range(3, 11)], "Étang du parc")
    c.grid[31] = c.grid[31]
    c.fill(17, 26, 19, 28, "Q")
    c.spot("kiosque", [(17, 28), (18, 28), (19, 28)], "Kiosque à musique")
    c.fill(3, 43, 7, 46, "J")
    c.spot("jeux_parc", [(5, 46)], "Aire de jeux")
    c.put(19, 41, "Y")
    c.spot("statue_parc", [(19, 41)], "Statue d'Ondine")
    c.put(21, 47, "N")
    c.spot("buvette", [(21, 47)], "Buvette du parc")
    for (x, y) in [(12, 36), (14, 36), (12, 38), (14, 38)]:
        c.put(x, y, "L")
    for (x, y) in [(10, 36), (11, 36), (16, 38), (17, 38), (15, 24), (15, 25), (11, 50), (11, 51)]:
        c.put(x, y, "B")
    for (x, y) in [(16, 33), (17, 33), (6, 40), (20, 35), (9, 34)]:
        c.put(x, y, "f")
    c.fill(1, 22, 25, 22, "h")
    c.fill(13, 22, 13, 22, "+")
    for _ in range(70):
        x, y = r.randrange(1, 25), r.randrange(23, 53)
        if c.grid[y][x] == "g" and all(c.grid[y + dy][x + dx] in "gh" for dx in (-1, 0, 1) for dy in (-1, 0, 1) if 0 <= y + dy < H and 0 <= x + dx < W):
            c.put(x, y, "T")

    # --- Quartier des Coteaux (y 59..78) ---------------------------------------------
    c.fill(1, 59, W - 2, 78, "g")
    for (tid, x, y) in [("tour_a", 3, 60), ("tour_b", 14, 60), ("tour_e", 3, 70), ("tour_f", 14, 70),
                        ("tour_c", 86, 60), ("tour_d", 98, 60), ("tour_g", 86, 70), ("tour_h", 98, 70)]:
        c.building(tid, "tour", x, y, 8, 8, "Résidence des Coteaux", [(x + 3, y + 7)], spot={"kind": "flavor", "flavor": "tour"})
    c.building("college", "college", 32, 60, 16, 8, "Collège des Coteaux", [(39, 67), (40, 67)], spot={"kind": "flavor"})
    c.building("maison_quartier", "maison", 51, 61, 8, 7, "Maison de quartier des Coteaux", [(54, 67), (55, 67)], spot={"kind": "flavor"})
    c.fill(62, 59, 76, 67, "W")
    c.fill(63, 60, 75, 66, ":")
    c.fill(69, 67, 70, 67, ":")
    c.spot("stade", [(62, 63)], "City stade")
    c.fill(1, 68, W - 2, 68, "_")
    c.fill(1, 78, W - 2, 78, "_")
    c.fill(26, 59, 30, 78, "_")
    c.fill(78, 59, 82, 78, "_")
    c.fill(32, 71, 47, 72, "G")
    c.fill(32, 75, 47, 76, "G")
    c.spot("jardins", [(39, 73)], "Jardins partagés")
    c.grid[73][39] = "n"
    c.fill(51, 71, 56, 74, "J")
    c.spot("jeux_coteaux", [(53, 74)], "Aire de jeux des Coteaux")
    c.fill(60, 71, 76, 71, "W")
    c.spot("fresque", [(64, 71), (68, 71), (72, 71)], "Fresque des Coteaux")
    for _ in range(40):
        x, y = r.randrange(1, W - 1), r.randrange(59, 78)
        if c.grid[y][x] == "g" and all(c.grid[y + dy][x + dx] == "g" for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
            c.put(x, y, "T")
    for (x, y) in [(23, 66), (24, 66), (58, 76), (59, 76), (90, 69), (91, 69)]:
        if c.grid[y][x] == "g":
            c.put(x, y, "B")
    for (x, y) in [(12, 68), (45, 68), (84, 68), (96, 68), (12, 78), (60, 78), (96, 78)]:
        c.put(x, y, "L")
    for (x, y) in [(24, 64), (49, 77), (83, 77)]:
        c.put(x, y, "E")

    # --- Ruelles : on passe entre les bâtiments --------------------------------------------
    for rect in [(58, 4, 61, 8), (74, 4, 77, 8),                       # gare / Fabrique / avenue
                 (42, 22, 45, 29), (58, 22, 59, 29), (60, 22, 77, 23),  # derrière la place : cour des artisans
                 (66, 24, 66, 29), (72, 24, 72, 29),
                 (94, 22, 95, 29), (108, 22, 109, 29),                  # quartier des Arts
                 (90, 35, 90, 40), (96, 35, 96, 40), (109, 35, 110, 40),
                 (43, 46, 44, 53), (59, 46, 60, 53),                    # boulevard Louise-Michel
                 (83, 46, 84, 53), (101, 46, 101, 53)]:
        c.alley(*rect)
    # Un peu de vie dans les ruelles larges : pots de fleurs, poubelles, vélos (un côté seulement).
    for (x, y, ch) in [(42, 23, "o"), (42, 26, "E"), (45, 24, "V"), (45, 28, "o"), (58, 5, "o"), (61, 7, "E"),
                       (74, 6, "V"), (77, 5, "o"), (63, 22, "o"), (68, 22, "E"), (76, 22, "V"), (94, 24, "o"),
                       (109, 26, "E"), (43, 48, "o"), (60, 51, "E"), (83, 50, "V"), (110, 37, "o")]:
        c.put(x, y, ch)
    c.spot("cour_artisans", [(70, 22)], "Cour des artisans")
    c.put(70, 22, "n")

    # --- Mobilier urbain des rues ------------------------------------------------------
    for y in (9, 13, 17, 21, 41, 45, 54, 58):
        for x in range(4, W - 4, 9):
            if c.grid[y][x] == "_" and (x < 26 or x > 30) and (x < 78 or x > 82) and r.random() < 0.8:
                c.put(x, y, "L" if (x // 9) % 2 == 0 else "T")
    for (x, y) in [(20, 21), (60, 45), (95, 45), (10, 58), (70, 21)]:
        if c.grid[y][x] == "_":
            c.put(x, y, "E")
    for (x, y) in [(88, 41), (89, 41)]:
        c.put(x, y, "V")

    # --- Arrêts de bus (voyage rapide) ---------------------------------------------------
    stops = [("bus_gare", "Gare", (44, 9), (44, 10)), ("bus_place", "Place de la Lanterne", (30, 36), (29, 36)),
             ("bus_parc", "Parc de l'Ondine", (26, 32), (27, 32)), ("bus_arts", "Quartier des Arts", (100, 41), (100, 42)),
             ("bus_coteaux", "Les Coteaux", (60, 58), (60, 57))]
    for sid, name, cell, _road in stops:
        c.put(cell[0], cell[1], "A")
    for sid, name, cell, _road in stops:
        x, y = cell
        arrive = None
        for (dx, dy) in [(1, 0), (-1, 0), (0, -1), (0, 1)]:
            if c.grid[y + dy][x + dx] in "_+" and not arrive:
                arrive = [x + dx, y + dy]
        c.spot(sid, [cell], "Arrêt de bus — %s" % name, "bus", stop=name, arrive=arrive)

    # --- Quartiers ---------------------------------------------------------------------
    c.districts = [
        {"id": "gare", "name": "Quartier de la Gare", "rect": [0, 0, W, 14]},
        {"id": "quais", "name": "Bords de l'Ondine", "rect": [0, 14, W, 8]},
        {"id": "parc", "name": "Parc de l'Ondine", "rect": [0, 22, 26, 32]},
        {"id": "centre", "name": "Centre-ville — place de la Lanterne", "rect": [26, 22, 57, 24]},
        {"id": "arts", "name": "Quartier des Arts", "rect": [83, 22, 29, 24]},
        {"id": "ecoles", "name": "Boulevard Louise-Michel", "rect": [26, 46, W - 26, 12]},
        {"id": "coteaux", "name": "Quartier des Coteaux", "rect": [0, 58, W, 22]},
        {"id": "parc_sud", "name": "Parc de l'Ondine", "rect": [0, 54, 26, 5]},
    ]

    # --- Habitants -----------------------------------------------------------------------
    c.npc("pommier", 38, 31, 2)
    for nid, x, y, rad in [
        ("passant_1", 20, 38, 6), ("passant_2", 60, 35, 6), ("passant_3", 50, 18, 6), ("passant_4", 96, 32, 5),
        ("passant_5", 15, 30, 4), ("passant_6", 90, 42, 6), ("passant_7", 44, 55, 6), ("passant_8", 70, 74, 5),
        ("passant_9", 100, 69, 6), ("passant_10", 30, 10, 6), ("passant_11", 12, 64, 3), ("passant_12", 66, 10, 6),
        ("principale", 41, 68, 2), ("animateur", 56, 68, 2), ("directrice", 95, 54, 2), ("chef_gare", 50, 3, 5),
        ("maraichere", 39, 38, 1), ("musicien", 18, 30, 1), ("bibliothecaire", 38, 54, 2), ("pecheur", 96, 13, 0),
        ("footballeur_1", 66, 62, 3), ("footballeur_2", 72, 64, 3), ("jardiniere", 40, 74, 2), ("libraire", 87, 41, 1),
        ("projectionniste", 90, 30, 1), ("enfant_1", 6, 47, 2), ("enfant_2", 54, 75, 2), ("touriste", 54, 37, 3),
        ("fernand", 63, 31, 1), ("collectionneur", 92, 9, 1),
    ]:
        c.npc(nid, x, y, rad)
    # Rien (arbre, lampadaire, poubelle) devant une porte de bâtiment.
    for b in c.buildings:
        for dx_, dy_ in b["doors"]:
            for ox in (-1, 0, 1):
                fx, fy = dx_ + ox, dy_ + 1
                if 0 <= fx < W and fy < H and c.grid[fy][fx] in "TLE" and c.ground[fy][fx] == "_":
                    c.grid[fy][fx] = "_"
    # Aucun mobilier (arbre, lampadaire, poubelle) au débouché d'un passage piéton ou d'une ruelle.
    for y in range(H):
        for x in range(W):
            if c.ground[y][x] not in "za":
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and c.grid[ny][nx] in "TLE" and c.ground[ny][nx] == "_":
                    c.grid[ny][nx] = "_"
    return c


def reachable(c, start):
    seen = {start}
    q = deque([start])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and c.grid[ny][nx] in WALK:
                seen.add((nx, ny))
                q.append((nx, ny))
    return seen


def main():
    c = build()
    start = (51, 30)
    seen = reachable(c, start)
    walk = {(x, y) for y in range(H) for x in range(W) if c.grid[y][x] in WALK}
    lost = walk - seen
    print("cases praticables :", len(walk), "inaccessibles :", len(lost), sorted(lost)[:20])
    path = os.path.join(ROOT, "data", "world", "world.json")
    world = json.load(open(path, encoding="utf-8"))
    legend = world["legend"]
    for ch, name, walk_ok in [("+", "pavés", True), (":", "terrain de sport", True), ("P", "pont", True), ("~", "eau", False),
                              ("h", "haie", False), ("v", "voiture garée", False), ("M", "étal de marché", False),
                              ("A", "arrêt de bus", False), ("Y", "statue", False), ("Q", "kiosque à musique", False),
                              ("J", "jeux d'enfants", False), ("E", "poubelle", False), ("V", "vélos", False),
                              ("W", "clôture ou muret", False), ("G", "potager", False), ("|", "voie ferrée", False),
                              ("N", "kiosque", False), ("r", "ballast", True), ("a", "ruelle", True)]:
        legend[ch] = {"name": name, "walk": walk_ok}
    rue = world["maps"]["rue"]
    rue["name"] = "Bréval-sur-Ondine"
    rue["grid"] = ["".join(row) for row in c.grid]
    rue["ground"] = ["".join(row) for row in c.ground]
    rue["buildings"] = c.buildings
    rue["spots"] = c.spots
    rue["npcs"] = c.npcs
    rue["decor"] = c.decor
    rue["districts"] = c.districts
    rue["doors"] = [{"cell": [51, 29], "to": "hall", "to_cell": [10, 12], "facing": "up", "sound": "lourde"},
                    {"cell": [52, 29], "to": "hall", "to_cell": [11, 12], "facing": "up", "sound": "lourde"}]
    # Tous les autres bâtiments s'ouvrent sur un intérieur (interiors_layout.py).
    for mid in [k for k in world["maps"] if k.startswith("int_")]:
        del world["maps"][mid]
    for ch, (name, walk_ok) in IL.LEGEND.items():
        legend[ch] = {"name": name, "walk": walk_ok}
    inside_ids = set()
    for b in c.buildings:
        spec = IL.interior_for(b["id"], b["style"])
        if not spec:
            continue
        mid = "int_" + b["id"]
        outside = [tuple(d) for d in b["doors"]]
        sound = IL.door_sound(b["id"], b["style"])
        imap = IL.to_map(mid, spec, outside, sound)
        world["maps"][mid] = imap
        for d, idoor in zip(outside, imap["doors"]):
            x, y = d
            row = rue["grid"][y]
            rue["grid"][y] = row[:x] + "D" + row[x + 1:]
            rue["doors"].append({"cell": [x, y], "to": mid, "to_cell": [idoor["cell"][0], idoor["cell"][1] - 1], "facing": "up",
                                 "sound": sound})
        inside_ids.add(b["id"])
        for n in imap["npcs"]:
            sprite, name = IL.PEOPLE[n["id"]]
            world["people"][n["id"]] = {"sprite": sprite, "name": name, "home": mid}
    # Les objets « façade » des bâtiments sont désormais à l'intérieur.
    rue["spots"] = [sp for sp in rue["spots"] if sp["id"] not in inside_ids]
    for d in world["maps"]["hall"]["doors"]:
        if d["to"] == "rue":
            d["to_cell"] = [51, 30] if d["cell"][0] == 10 else [52, 30]
            d["sound"] = "lourde"
    people = world["people"]
    extra = {
        "passant_5": ("passant_a", "Promeneuse"), "passant_6": ("passant_b", "Passant"), "passant_7": ("passant_c", "Passante"),
        "passant_8": ("passant_d", "Habitant des Coteaux"), "passant_9": ("passant_e", "Habitante des Coteaux"),
        "passant_10": ("voyageur", "Voyageur"), "passant_11": ("passant_f", "Habitant des Coteaux"), "passant_12": ("passant_e", "Passante"),
        "principale": ("principale", "Mme Diallo, principale du collège"), "animateur": ("animateur", "Karim, animateur de la maison de quartier"),
        "directrice": ("directrice", "Mme Roux, directrice d'Ondine Énergie"), "chef_gare": ("chef_gare", "Le chef de gare"),
        "maraichere": ("maraichere", "Josiane, maraîchère"), "musicien": ("musicien", "Musicien de la fanfare"),
        "bibliothecaire": ("bibliothecaire", "Bibliothécaire"), "pecheur": ("pecheur", "Pêcheur"),
        "footballeur_1": ("sportif_a", "Joueuse de foot"), "footballeur_2": ("sportif_b", "Joueur de foot"),
        "jardiniere": ("jardiniere", "Jardinière"), "libraire": ("libraire", "Libraire"),
        "projectionniste": ("projectionniste", "Programmateur du cinéma"), "enfant_1": ("enfant_a", "Enfant"),
        "enfant_2": ("enfant_b", "Enfant"), "touriste": ("touriste", "Touriste"),
    }
    for pid, (sprite, name) in extra.items():
        people[pid] = {"sprite": sprite, "name": name, "home": "rue"}
        if pid[-2:] in ("_1", "_2") and not pid.startswith("passant"):
            people[pid]["bark"] = pid[:-2]  # répliques communes (enfant, footballeur)
    for pid in ("passant_1", "passant_2", "passant_3", "passant_4"):
        people[pid]["home"] = "rue"
    json.dump(world, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # Aperçu texte (contrôle visuel rapide)
    with open(os.path.join(HERE, "city_preview.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(rue["grid"]))
    print("ville écrite :", W, "x", H, "—", len(c.buildings), "bâtiments,", len(c.spots), "objets,", len(c.npcs), "habitants")


if __name__ == "__main__":
    main()

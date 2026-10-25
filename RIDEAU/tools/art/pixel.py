"""Petite bibliothèque de dessin pixel art pour RIDEAU !

Toutes les images du jeu sont dessinées par code (aucune ressource externe),
avec une palette unique. Les fonctions travaillent en « pixels d'art » ; les
images sont ensuite agrandies sans lissage (×2 ou ×3) à l'export.
"""
from __future__ import annotations

import math
import random
from PIL import Image

# --- Palette RIDEAU ! --------------------------------------------------------
P = {
    "ink": (22, 15, 30),
    "night": (31, 24, 48),
    "night2": (42, 33, 62),
    "navy": (36, 48, 79),
    "blue": (52, 80, 122),
    "steel": (95, 127, 166),
    "sky": (140, 170, 205),
    "velvet0": (52, 10, 24),
    "velvet1": (84, 16, 34),
    "velvet2": (122, 26, 46),
    "velvet3": (166, 40, 56),
    "velvet4": (210, 72, 78),
    "wood0": (40, 24, 18),
    "wood1": (62, 38, 26),
    "wood2": (94, 58, 36),
    "wood3": (138, 90, 54),
    "wood4": (176, 124, 76),
    "gold0": (110, 76, 28),
    "gold1": (160, 118, 44),
    "gold2": (201, 162, 75),
    "gold3": (240, 212, 138),
    "cream": (243, 233, 210),
    "paper": (227, 209, 170),
    "paper2": (196, 174, 130),
    "paper3": (150, 128, 92),
    "grey0": (58, 56, 66),
    "grey1": (90, 92, 104),
    "grey2": (138, 143, 152),
    "grey3": (190, 192, 198),
    "green0": (46, 74, 50),
    "green1": (79, 122, 74),
    "green2": (127, 168, 106),
    "teal": (95, 168, 163),
    "purple0": (60, 40, 84),
    "purple1": (98, 70, 140),
    "purple2": (155, 107, 196),
    "orange": (217, 130, 75),
    "light": (255, 244, 200),
    "white": (255, 252, 244),
    "skin0": (246, 214, 186),
    "skin1": (232, 180, 140),
    "skin2": (196, 132, 96),
    "skin3": (150, 96, 66),
    "skin4": (104, 64, 44),
    "skin5": (74, 46, 34),
}


def hex2rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def shade(c, f: float):
    """Assombrit (f<1) ou éclaircit (f>1) une couleur."""
    if f >= 1:
        return tuple(min(255, int(v + (255 - v) * (f - 1))) for v in c[:3])
    return tuple(int(v * f) for v in c[:3])


def mix(a, b, t: float):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


class Canvas:
    def __init__(self, w: int, h: int, bg=None):
        self.w, self.h = w, h
        self.img = Image.new("RGBA", (w, h), (0, 0, 0, 0) if bg is None else (*bg, 255))
        self.px = self.img.load()

    # -- primitives
    def set(self, x, y, c, a=255):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            if a >= 255:
                self.px[x, y] = (*c[:3], 255)
            else:
                r, g, b, oa = self.px[x, y]
                t = a / 255
                if oa == 0:
                    self.px[x, y] = (*c[:3], a)
                else:
                    self.px[x, y] = (int(r + (c[0] - r) * t), int(g + (c[1] - g) * t), int(b + (c[2] - b) * t), max(oa, a))

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[x, y]
        return (0, 0, 0, 0)

    def rect(self, x, y, w, h, c, a=255):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                self.set(xx, yy, c, a)

    def frame(self, x, y, w, h, c):
        for xx in range(x, x + w):
            self.set(xx, y, c)
            self.set(xx, y + h - 1, c)
        for yy in range(y, y + h):
            self.set(x, yy, c)
            self.set(x + w - 1, yy, c)

    def hline(self, x0, x1, y, c, a=255):
        for x in range(int(x0), int(x1) + 1):
            self.set(x, y, c, a)

    def vline(self, x, y0, y1, c, a=255):
        for y in range(int(y0), int(y1) + 1):
            self.set(x, y, c, a)

    def line(self, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def ellipse(self, cx, cy, rx, ry, c, a=255):
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                if rx <= 0 or ry <= 0:
                    continue
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.0:
                    self.set(x, y, c, a)

    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            n = len(pts)
            for i in range(n):
                x0, y0 = pts[i]
                x1, y1 = pts[(i + 1) % n]
                if (y0 <= y + 0.5 < y1) or (y1 <= y + 0.5 < y0):
                    xs.append(x0 + (y + 0.5 - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1]))):
                    self.set(x, y, c)

    def dither_rect(self, x, y, w, h, c, density=0.5, seed=0):
        """Trame ordonnée (Bayer 4×4) : dégradés sans flou, typiques du pixel art."""
        bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                if bayer[yy % 4][xx % 4] / 16 < density:
                    self.set(xx, yy, c)

    def vgradient(self, x, y, w, h, c0, c1, steps=6):
        """Dégradé vertical en bandes + trame entre les bandes."""
        for yy in range(h):
            t = yy / max(h - 1, 1)
            band = t * (steps - 1)
            i = int(band)
            frac = band - i
            ca = mix(c0, c1, i / (steps - 1))
            cb = mix(c0, c1, min(i + 1, steps - 1) / (steps - 1))
            for xx in range(w):
                bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
                use_b = bayer[(y + yy) % 4][(x + xx) % 4] / 16 < frac
                self.set(x + xx, y + yy, cb if use_b else ca)

    def outline(self, c=P["ink"], diagonal=False):
        """Ajoute un contour autour des pixels opaques."""
        src = self.img.copy()
        spx = src.load()
        for y in range(self.h):
            for x in range(self.w):
                if spx[x, y][3] > 0:
                    continue
                neigh = [(1, 0), (-1, 0), (0, 1), (0, -1)]
                if diagonal:
                    neigh += [(1, 1), (-1, -1), (1, -1), (-1, 1)]
                for dx, dy in neigh:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < self.w and 0 <= ny < self.h and spx[nx, ny][3] > 128:
                        self.px[x, y] = (*c, 255)
                        break

    def paste(self, other: "Canvas", ox: int, oy: int):
        for y in range(other.h):
            for x in range(other.w):
                c = other.px[x, y]
                if c[3] > 0:
                    self.set(ox + x, oy + y, c[:3], c[3])

    def save(self, path: str, scale: int = 1):
        img = self.img
        if scale != 1:
            img = img.resize((self.w * scale, self.h * scale), Image.NEAREST)
        img.save(path)


def rng(seed: int) -> random.Random:
    return random.Random(seed)

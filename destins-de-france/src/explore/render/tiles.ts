import type { FloorKind, WallKind } from './contract';
import { TILE_H, TILE_W, WALL_H } from './contract';
import { P, POSTER_COLORS, type Ramp } from './palette';
import { Pix, cached, hash, mix, shade, type RGBA, type Sprite } from './pixelKit';

/** Rangée y d'un losange 32×16 : [x début, x fin] inclus. */
function diamondRow(y: number): [number, number] {
  const r = y < TILE_H / 2 ? y : TILE_H - 1 - y;
  return [TILE_W / 2 - 2 - 2 * r, TILE_W / 2 + 1 + 2 * r];
}

/**
 * Coordonnées « monde » entières d'un pixel du losange : `a` court le long
 * de l'axe x de la carte (vers le bas-droite), `b` le long de l'axe y.
 * Chacune va de 0 à ~32.
 */
function isoCoords(x: number, y: number): [number, number] {
  const dx = x - TILE_W / 2;
  const dy = y - TILE_H / 2;
  return [Math.floor((dx + 2 * dy + 32) / 2), Math.floor((2 * dy - dx + 32) / 2)];
}

type FloorPainter = (x: number, y: number, a: number, b: number, v: number) => RGBA;

const FLOORS: Record<FloorKind, FloorPainter> = {
  lino: (x, y, a, b, v) => {
    const r = P.lino;
    // Lignes de terrain peintes selon la variante
    if (v === 1 && (a === 15 || a === 16)) return hex2(0xd9584a);
    if (v === 2 && (b === 15 || b === 16)) return hex2(0xe9b949);
    if (v === 3 && a === 3) return hex2(0xf1efe6);
    const n = hash(x, y, 11 + v);
    if (n < 0.04) return r.dark;
    if (n > 0.97) return r.light;
    // Reflet doux du revêtement ciré, côté haut-gauche
    return a + b < 18 && n > 0.5 ? mix(r.base, r.light, 0.35) : r.base;
  },
  parquet: (x, y, a, b, v) => {
    const r = P.parquet;
    const plank = Math.floor(a / 4);
    if (a % 4 === 0) return r.dark;
    const cut = Math.floor(hash(plank, v, 3) * 32);
    if (b === cut) return r.deep;
    const tone = hash(plank, b > cut ? 1 : 0, v);
    const base = tone < 0.33 ? r.light : tone < 0.75 ? r.base : mix(r.base, r.dark, 0.5);
    return hash(x, y, 7) < 0.05 ? mix(base, r.dark, 0.5) : base;
  },
  carrelage: (x, y, a, b, v) => {
    const r = P.carrelage;
    if (a % 16 === 0 || b % 16 === 0) return r.deep;
    const cell = (a < 16 ? 0 : 1) + (b < 16 ? 0 : 2);
    const t = hash(cell, v, 5);
    const base = t < 0.2 ? r.dark : r.base;
    if (a % 16 === 1 || b % 16 === 1) return mix(base, r.light, 0.6);
    return hash(x, y, 13) < 0.03 ? r.dark : base;
  },
  herbe: (x, y, _a, _b, v) => {
    const r = P.herbe;
    const n = hash(x, y, 21 + v);
    if (v === 3 && n > 0.985) return hash(x, y, 2) < 0.5 ? hex2(0xf6f1e0) : hex2(0xf0c75e);
    // Brins : un pixel clair surmonté d'un pixel sombre
    if (hash(x, y + 1, 21 + v) > 0.93) return r.dark;
    if (n > 0.93) return r.light;
    if (n < 0.12) return mix(r.base, r.dark, 0.5);
    return r.base;
  },
  trottoir: (x, y, a, b, v) => {
    const r = P.trottoir;
    if (a % 8 === 0 || b % 16 === 0) return r.deep;
    if (a % 8 === 1 || b % 16 === 1) return r.light;
    const n = hash(x, y, 31 + v);
    if (n < 0.06) return r.dark;
    if (n > 0.96) return r.light;
    return r.base;
  },
  tapis: (x, y, a, b, v) => {
    const r = P.tapis;
    const edge = Math.min(a, b, 32 - a, 32 - b);
    if (edge <= 1) return r.deep;
    if (edge === 3) return hex2(0xe2b862);
    if ((a + b) % 8 === 0 && (a - b + 32) % 8 === 0) return hex2(0xe2b862);
    const n = hash(x, y, 41 + v);
    return n < 0.08 ? r.dark : n > 0.95 ? r.light : r.base;
  },
};

function hex2(n: number): RGBA {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function floorSprite(kind: FloorKind, variant: number): Sprite {
  const v = ((variant % 4) + 4) % 4;
  return cached(`f:${kind}:${v}`, () => {
    const p = new Pix(TILE_W, TILE_H);
    const paint = FLOORS[kind];
    for (let y = 0; y < TILE_H; y++) {
      const [x0, x1] = diamondRow(y);
      for (let x = x0; x <= x1; x++) {
        const [a, b] = isoCoords(x, y);
        p.set(x, y, paint(x, y, a, b, v));
      }
    }
    return { pix: p, ax: TILE_W / 2, ay: TILE_H / 2 };
  });
}

// —— Murs ———————————————————————————————————————————————————————————

/** Couleur d'un pixel de face : `i` le long de la face (0-15), `j` depuis le haut (0-33). */
type FacePainter = (i: number, j: number, lit: boolean) => RGBA;

function wallBase(i: number, j: number, lit: boolean): RGBA {
  const f = lit ? 1 : 0.84;
  const pick = (r: Ramp): RGBA => shade(r.base, f);
  if (j >= WALL_H - 2) return shade(P.plinthe.base, f);
  if (j >= WALL_H - 13) {
    // Soubassement peint, filet clair en haut
    if (j === WALL_H - 13) return shade(P.soubassement.light, f);
    return pick(P.soubassement);
  }
  if (j === 0) return shade(P.mur.light, f);
  // Grain de peinture très discret
  return hash(i, j, lit ? 1 : 2) < 0.04 ? shade(P.mur.dark, f) : pick(P.mur);
}

function windowPainter(i: number, j: number, lit: boolean): RGBA {
  const f = lit ? 1 : 0.86;
  if (i >= 3 && i <= 13 && j >= 5 && j <= 18) {
    if (i === 3 || i === 13 || j === 5 || j === 18 || i === 8) return shade(WHITE_FRAME, f);
    // Vitre lumineuse et reflet diagonal
    const streak = (i + (18 - j)) % 9 === 0 || (i + (18 - j)) % 9 === 1;
    const g = j < 10 ? P.verre.light : P.verre.base;
    return streak ? mix(g, [255, 255, 255, 255], 0.7) : shade(g, f);
  }
  if (i >= 2 && i <= 14 && j === 19) return shade(P.mur.dark, f);
  return wallBase(i, j, lit);
}

const WHITE_FRAME: RGBA = [244, 241, 234, 255];

function posterPainter(variant: number): FacePainter {
  const sheets = [0, 1, 2].map((k) => ({
    i: 1 + k * 5 + Math.floor(hash(variant, k, 1) * 2),
    j: 5 + Math.floor(hash(variant, k, 2) * 7),
    w: 4,
    h: 5 + Math.floor(hash(variant, k, 3) * 2),
    c: POSTER_COLORS[Math.floor(hash(variant, k, 4) * POSTER_COLORS.length)] ?? WHITE_FRAME,
  }));
  return (i, j, lit) => {
    const f = lit ? 1 : 0.86;
    for (const s of sheets) {
      if (i >= s.i && i < s.i + s.w && j >= s.j && j < s.j + s.h) {
        if (j === s.j && i === s.i + 1) return [214, 64, 69, 255]; // punaise
        if (j > s.j + 1 && j < s.j + s.h - 1 && (j - s.j) % 2 === 0 && i > s.i && i < s.i + s.w - 1) return shade(s.c, 0.72 * f);
        return shade(s.c, f);
      }
      // Ombre portée de la feuille (lumière haut-gauche)
      if (i === s.i + s.w && j > s.j && j <= s.j + s.h) return shade(wallBase(i, j, lit), 0.88);
    }
    return wallBase(i, j, lit);
  };
}

function doorPainter(i: number, j: number, lit: boolean): RGBA {
  const f = lit ? 1 : 0.86;
  // Panneau « sortie » vert au-dessus de la porte
  if (j >= 1 && j <= 3 && i >= 6 && i <= 10) {
    if (j === 2 && (i === 7 || i === 9)) return WHITE_FRAME;
    return P.sortie.base;
  }
  if (i >= 2 && i <= 14 && j >= 6) {
    if (i === 2 || i === 14 || j === 6) return shade(P.metal.dark, f);
    if (i === 8) return shade(P.metal.base, f);
    if (j === 21 && (i === 6 || i === 7 || i === 9 || i === 10)) return shade(P.metal.light, f);
    const streak = (i + (33 - j)) % 11 < 2;
    const g = mix(P.verre.base, P.sortie.light, 0.15);
    return streak ? mix(g, [255, 255, 255, 255], 0.6) : shade(j < 14 ? P.verre.light : g, f);
  }
  return wallBase(i, j, lit);
}

function facePainter(kind: WallKind, variant: number): FacePainter {
  switch (kind) {
    case 'mur':
      return wallBase;
    case 'mur_fenetre':
      return windowPainter;
    case 'mur_affiches':
      return posterPainter(variant);
    case 'porte':
      return doorPainter;
  }
}

/**
 * Bloc de mur : sommet en losange, faces gauche (éclairée) et droite (dans
 * l'ombre). Ancre = centre du losange au sol.
 */
export function wallSprite(kind: WallKind, faces: { left: boolean; right: boolean }, variant: number): Sprite {
  const v = ((variant % 4) + 4) % 4;
  return cached(`w:${kind}:${faces.left ? 1 : 0}${faces.right ? 1 : 0}:${v}`, () => {
    const p = new Pix(TILE_W, TILE_H + WALL_H);
    const paint = facePainter(kind, v);
    if (faces.left) {
      for (let x = 0; x < TILE_W / 2; x++) {
        const top = TILE_H / 2 + Math.floor(x / 2);
        for (let j = 0; j < WALL_H; j++) {
          p.set(x, top + j, paint(x, j, true));
        }
      }
    }
    if (faces.right) {
      for (let x = TILE_W / 2; x < TILE_W; x++) {
        const top = TILE_H / 2 + Math.floor((TILE_W - 1 - x) / 2);
        for (let j = 0; j < WALL_H; j++) {
          p.set(x, top + j, paint(x - TILE_W / 2, j, false));
        }
      }
    }
    // Arête verticale centrale : lumière sur le coin
    if (faces.left && faces.right) {
      for (let j = 1; j < WALL_H - 2; j++) p.set(TILE_W / 2 - 1, TILE_H - 1 + j, mix(paint(15, j, true), [255, 255, 255, 255], 0.25));
    }
    // Sommet : chaperon foncé, bord éclairé
    for (let y = 0; y < TILE_H; y++) {
      const [x0, x1] = diamondRow(y);
      for (let x = x0; x <= x1; x++) {
        // Arêtes avant éclairées (haut-gauche), dessus uni et légèrement grenu
        const front = y >= TILE_H / 2 && (x === x0 || x === x0 + 1 || x === x1 || x === x1 - 1);
        let c: RGBA = P.mur.dark;
        if (front) c = x < TILE_W / 2 ? P.mur.light : P.mur.base;
        else if (hash(x, y, 9) < 0.05) c = mix(P.mur.dark, P.mur.deep, 0.5);
        p.set(x, y, c);
      }
    }
    return { pix: p, ax: TILE_W / 2, ay: TILE_H / 2 + WALL_H };
  });
}

import type { FloorKind, WallKind } from './contract';
import { TILE_H, TILE_W, WALL_H } from './contract';
import { P, POSTER_COLORS, WHITE, type Ramp } from './palette';
import { Pix, bayer, cached, dith, hash, mix, shade, type RGBA, type Sprite } from './pixelKit';

/** Rangée y d'un losange 32×16 : [x début, x fin] inclus. */
function diamondRow(y: number): [number, number] {
  const r = y < TILE_H / 2 ? y : TILE_H - 1 - y;
  return [TILE_W / 2 - 2 - 2 * r, TILE_W / 2 + 1 + 2 * r];
}

/**
 * Coordonnées « monde » entières d'un pixel du losange : `a` croît le long de
 * l'axe x de la carte (vers le bas-droite), `b` le long de l'axe y
 * (vers le bas-gauche). Chacune va de 0 à 32 ; 16 = milieu de la case.
 */
function isoCoords(x: number, y: number): [number, number] {
  const dx = x - TILE_W / 2;
  const dy = y - TILE_H / 2;
  return [Math.floor((dx + 2 * dy + 32) / 2), Math.floor((2 * dy - dx + 32) / 2)];
}

/** Grain fin à trois tons, très peu contrasté pour ne pas trahir la répétition. */
function grain(r: Ramp, x: number, y: number, salt: number): RGBA {
  const n = hash(x, y, salt);
  if (n < 0.14) return mix(r.base, r.dark, 0.45);
  if (n > 0.9) return mix(r.base, r.light, 0.6);
  return r.base;
}

/** Peinture de ligne de terrain légèrement usée. */
function paint(c: Ramp, x: number, y: number): RGBA {
  const n = hash(x, y, 77);
  return n < 0.12 ? c.light : n > 0.94 ? c.dark : c.base;
}

type FloorPainter = (x: number, y: number, a: number, b: number, v: number) => RGBA;

const FLOORS: Record<FloorKind, FloorPainter> = {
  lino: (x, y, a, b, v) => {
    const r = P.lino;
    // Lignes de terrain continues, de bord à bord de la case
    if (v === 1 && (b === 15 || b === 16)) return paint(P.rouge, x, y);
    if (v === 2 && (a === 15 || a === 16)) return paint(P.jaune, x, y);
    // Joint des lés de revêtement et léger reflet de cire à côté
    if (a === 0) return mix(r.base, r.dark, 0.6);
    if (a === 1) return mix(r.base, r.light, 0.5);
    const g = grain(r, x, y, 11);
    // Traces de semelles, rares et diffuses
    if (hash(Math.floor(a / 3), Math.floor(b / 2), 5) < 0.035 && hash(x, y, 6) < 0.6) return mix(g, r.deep, 0.35);
    // Brillance douce sur la moitié haute (lumière zénithale)
    return a + b < 20 ? dith(x, y, 0.22, g, mix(g, r.hi, 0.5)) : g;
  },
  parquet: (x, y, a, b, v) => {
    const r = P.parquet;
    const plank = Math.floor(a / 4);
    if (a % 4 === 0) return r.dark;
    const cut = Math.floor(hash(plank, v, 3) * 30) + 1;
    if (b === cut) return r.deep;
    const tone = hash(plank, b > cut ? 1 : 0, v);
    const base = tone < 0.3 ? r.light : tone < 0.72 ? r.base : mix(r.base, r.dark, 0.5);
    // Fil du bois : stries le long des lames
    if (hash(plank, Math.floor(b / 5), 9) < 0.3 && a % 4 === 2) return mix(base, r.dark, 0.35);
    if (a % 4 === 1) return mix(base, r.light, 0.35);
    return hash(x, y, 7) < 0.06 ? mix(base, r.dark, 0.4) : base;
  },
  carrelage: (x, y, a, b, v) => {
    const r = P.carrelage;
    if (a % 16 === 0 || b % 16 === 0) return r.deep;
    const cell = (a < 16 ? 0 : 1) + (b < 16 ? 0 : 2);
    const t = hash(cell, v, 5);
    const base = t < 0.18 ? mix(r.base, r.dark, 0.5) : r.base;
    if (a % 16 === 1 || b % 16 === 1) return mix(base, r.hi, 0.6);
    if (a % 16 === 15 || b % 16 === 15) return mix(base, r.dark, 0.4);
    return grain({ ...r, base }, x, y, 13);
  },
  herbe: (x, y, _a, _b, v) => {
    const r = P.herbe;
    const n = hash(x, y, 21 + v);
    if (v === 3 && n > 0.985) return hash(x, y, 2) < 0.5 ? hex2(0xf3eee0) : hex2(0xe9cd73);
    // Brins : un pixel clair surmonté d'un pixel sombre
    if (hash(x, y + 1, 21 + v) > 0.92) return r.dark;
    if (n > 0.92) return r.light;
    if (n > 0.86) return r.hi;
    if (n < 0.16) return mix(r.base, r.dark, 0.5);
    return dith(x, y, 0.15, r.base, mix(r.base, r.light, 0.5));
  },
  trottoir: (x, y, a, b, v) => {
    const r = P.trottoir;
    const row = Math.floor(b / 16);
    const aa = (a + (row % 2) * 4) % 8;
    if (aa === 0 || b % 16 === 0) return r.deep;
    if (aa === 1 || b % 16 === 1) return r.light;
    const stain = hash(Math.floor((a + row * 4) / 8), row, 31 + v) < 0.2;
    const g = grain(r, x, y, 31 + v);
    return stain ? mix(g, r.dark, 0.25) : g;
  },
  tapis: (x, y, a, b, v) => {
    const r = P.tapis;
    const edge = Math.min(a, b, 32 - a, 32 - b);
    if (edge <= 1) return r.deep;
    if (edge === 3) return mix(P.jaune.base, r.base, 0.25);
    if ((a + b) % 8 === 0 && (a - b + 32) % 8 === 0) return mix(P.jaune.light, r.base, 0.2);
    // Velours : tramage serré entre deux tons
    return dith(x, y, 0.35 + hash(x, y, 41 + v) * 0.2, r.base, mix(r.base, r.dark, 0.5));
  },
};

function hex2(n: number): RGBA {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function floorSprite(kind: FloorKind, variant: number): Sprite {
  const v = ((variant % 4) + 4) % 4;
  return cached(`f:${kind}:${v}`, () => {
    const p = new Pix(TILE_W, TILE_H);
    const painter = FLOORS[kind];
    for (let y = 0; y < TILE_H; y++) {
      const [x0, x1] = diamondRow(y);
      for (let x = x0; x <= x1; x++) {
        const [a, b] = isoCoords(x, y);
        p.set(x, y, painter(x, y, a, b, v));
      }
    }
    return { pix: p, ax: TILE_W / 2, ay: TILE_H / 2 };
  });
}

// —— Murs ———————————————————————————————————————————————————————————

/** Couleur d'un pixel de face : `i` le long de la face (0-15), `j` depuis le haut (0-33). */
type FacePainter = (i: number, j: number, lit: boolean, side: number) => RGBA;

const RAIL = 21; // cimaise entre peinture et soubassement
const PLINTH = WALL_H - 2;

function wallBase(i: number, j: number, lit: boolean, side: number): RGBA {
  const f = lit ? 1 : 0.86;
  const n = hash(i, j, 3 + side);
  if (j >= PLINTH) return shade(j === PLINTH ? P.plinthe.light : P.plinthe.base, f);
  if (j === RAIL) return shade(P.soubassement.deep, f);
  if (j === RAIL + 1) return shade(P.soubassement.light, f);
  if (j > RAIL) {
    const r = P.soubassement;
    // Éraflures au pied du mur (chaises, ballons)
    if (j > PLINTH - 5 && n < 0.07) return shade(r.dark, f);
    return shade(n < 0.12 ? mix(r.base, r.dark, 0.4) : n > 0.93 ? r.light : r.base, f);
  }
  const r = P.mur;
  // Peinture : plus claire en haut (tramage), grain et petites marques d'usure
  let c = n < 0.06 ? mix(r.base, r.dark, 0.5) : n > 0.95 ? r.light : r.base;
  if (j < 7) c = dith(i, j, (7 - j) / 9, c, r.light);
  if (j >= RAIL - 3 && n > 0.965) c = r.dark;
  return shade(c, f);
}

function decoratedWall(v: number): FacePainter {
  return (i, j, lit, side) => {
    const f = lit ? 1 : 0.86;
    if (v === 1) {
      // Prise électrique et son câble
      if (j >= 27 && j <= 29 && i >= 10 && i <= 12) return shade(j === 28 && i === 11 ? P.plinthe.deep : i === 12 || j === 29 ? P.metal.light : WHITE, f);
      if (i === 11 && j >= 30 && j < PLINTH) return P.plinthe.deep;
    }
    if (v === 2) {
      // Bloc de secours (BAES)
      if (j >= 2 && j <= 4 && i >= 5 && i <= 10) {
        if (j === 3 && (i === 7 || i === 8)) return P.sortie.base;
        return shade(j === 4 ? P.metal.light : WHITE, f);
      }
      if (j === 5 && i >= 6 && i <= 10) return shade(P.mur.dark, f);
    }
    if (v === 3) {
      // Extincteur sur son support, avec sa plaque
      if (j >= 9 && j <= 11 && i >= 6 && i <= 8) return j === 10 && i === 7 ? WHITE : shade(P.rouge.base, f);
      if (j === 14 && i >= 6 && i <= 8) return P.plinthe.deep;
      if (j >= 15 && j <= 26 && i >= 6 && i <= 8) {
        if (j >= 19 && j <= 20) return shade(i === 8 ? PAPER_SHADE : WHITE, f);
        const r = P.rouge;
        return shade(i === 6 ? r.light : i === 8 ? r.dark : r.base, f);
      }
      if (i === 9 && j >= 16 && j <= 23) return P.plinthe.deep;
      if (i === 9 && j > 15 && j <= 26) return shade(wallBase(i, j, lit, side), 0.85);
    }
    return wallBase(i, j, lit, side);
  };
}

const PAPER_SHADE: RGBA = [214, 207, 194, 255];

function windowPainter(i: number, j: number, lit: boolean, side: number): RGBA {
  const f = lit ? 1 : 0.88;
  if (i >= 2 && i <= 14 && j >= 3 && j <= 18) {
    const frame = i === 2 || i === 14 || j === 3 || j === 18 || i === 8;
    if (frame) return shade(i === 14 || j === 18 ? P.metal.light : WHITE, f);
    // Ciel à travers la vitre, reflet diagonal
    const sky = P.ciel;
    const g = j < 7 ? sky.hi : j < 11 ? sky.light : j < 15 ? sky.base : sky.dark;
    const k = (i + (18 - j)) % 10;
    if (k === 0 || k === 1) return mix(g, WHITE, 0.7);
    // Ombre du dormant sur la vitre (bas-droite)
    if (i === 13 || i === 7 || j === 17) return shade(g, 0.92);
    return g;
  }
  // Appui de fenêtre
  if (j === 19 && i >= 1 && i <= 15) return shade(WHITE, f);
  if (j === 20 && i >= 1 && i <= 15) return shade(P.mur.deep, f);
  // Radiateur sous la fenêtre
  if (j >= 23 && j <= 30 && i >= 3 && i <= 13) {
    const m = P.metal;
    if (j === 23) return shade(m.hi, f);
    if (j === 30) return shade(m.dark, f);
    return shade((i - 3) % 2 === 0 ? m.light : m.base, f);
  }
  if (i === 12 && j === 31) return P.plinthe.deep;
  return wallBase(i, j, lit, side);
}

function posterPainter(variant: number): FacePainter {
  const sheets = [0, 1, 2].map((k) => ({
    i: 1 + k * 5 + Math.floor(hash(variant, k, 1) * 2),
    j: 4 + Math.floor(hash(variant, k, 2) * 8),
    w: 4,
    h: 5 + Math.floor(hash(variant, k, 3) * 3),
    c: POSTER_COLORS[Math.floor(hash(variant, k, 4) * POSTER_COLORS.length)] ?? WHITE,
  }));
  return (i, j, lit, side) => {
    const f = lit ? 1 : 0.88;
    for (const s of sheets) {
      if (i >= s.i && i < s.i + s.w && j >= s.j && j < s.j + s.h) {
        if (j === s.j && i === s.i + 1) return [196, 74, 70, 255]; // punaise
        // Lignes de texte et coin corné
        if (j > s.j + 1 && j < s.j + s.h - 1 && (j - s.j) % 2 === 0 && i > s.i && i < s.i + s.w - 1) return shade(s.c, 0.7 * f);
        if (j === s.j + s.h - 1 && i === s.i + s.w - 1) return shade(s.c, 0.82 * f);
        return shade(s.c, f);
      }
      // Ombre portée de la feuille vers le bas-droite
      if ((i === s.i + s.w && j > s.j && j <= s.j + s.h) || (j === s.j + s.h && i > s.i && i <= s.i + s.w)) return shade(wallBase(i, j, lit, side), 0.86);
    }
    return wallBase(i, j, lit, side);
  };
}

function doorPainter(i: number, j: number, lit: boolean, side: number): RGBA {
  const f = lit ? 1 : 0.88;
  // Panneau d'issue de secours au-dessus de la porte
  if (j >= 0 && j <= 2 && i >= 5 && i <= 11) {
    if (j === 1 && (i === 6 || i === 8)) return WHITE;
    if (j === 1 && i === 7) return P.sortie.hi;
    return j === 2 ? P.sortie.dark : P.sortie.base;
  }
  if (i >= 1 && i <= 15 && j >= 4) {
    const m = P.metal;
    if (i === 1 || i === 15 || j === 4) return shade(i === 15 ? m.dark : m.base, f);
    if (i === 8) return shade(m.dark, f);
    // Plaques de propreté et barre anti-panique
    if (j >= 28) return shade(j === 28 ? m.hi : m.light, f);
    if (j === 18 && i >= 3 && i <= 13 && i !== 8) return shade(m.hi, f);
    if (j === 19 && i >= 3 && i <= 13 && i !== 8) return shade(m.dark, f);
    const g = mix(P.verre.base, P.ciel.dark, 0.2);
    const k = (i + (33 - j)) % 12;
    if (k < 2) return mix(g, WHITE, 0.6);
    return shade(j < 12 ? P.verre.light : g, f);
  }
  return wallBase(i, j, lit, side);
}

function facePainter(kind: WallKind, variant: number): FacePainter {
  switch (kind) {
    case 'mur':
      return decoratedWall(variant);
    case 'mur_fenetre':
      return windowPainter;
    case 'mur_affiches':
      return posterPainter(variant);
    case 'porte':
      return doorPainter;
  }
}

// Marges du sprite de mur : lumière des fenêtres et occlusion projetées au sol
const MX = 20;
const MB = 14;
const AO: RGBA = [44, 34, 48, 255];
const SUN: RGBA = [255, 238, 196, 255];

/**
 * Bloc de mur : sommet, faces gauche (éclairée) et droite (dans l'ombre),
 * plus, au sol devant la face, l'occlusion ambiante et la tache de lumière
 * des fenêtres. Ancre = centre du losange au sol.
 */
export function wallSprite(kind: WallKind, faces: { left: boolean; right: boolean }, variant: number): Sprite {
  const v = ((variant % 4) + 4) % 4;
  return cached(`w:${kind}:${faces.left ? 1 : 0}${faces.right ? 1 : 0}:${v}`, () => {
    const p = new Pix(TILE_W + 2 * MX, TILE_H + WALL_H + MB);
    const painter = facePainter(kind, v);
    const baseL = TILE_H / 2 + WALL_H; // bas de la face gauche en x = 0

    // Au sol : occlusion au pied du mur et lumière de la fenêtre
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        const lx = x + 0.5 - MX;
        const ly = y + 0.5 - baseL;
        let alpha = 0;
        let col = AO;
        const sides: Array<[boolean, number, number]> = [
          // [face visible, position le long de la face, profondeur devant elle]
          [faces.left, (lx + 2 * ly) / 2, (2 * ly - lx) / 2],
          [faces.right, (lx - 16 - 2 * (ly - 8)) / 2, (lx - 16 + 2 * (ly - 8)) / 2],
        ];
        for (const [on, i, d] of sides) {
          if (!on || i < 0 || i >= 16 || d < 0) continue;
          if (d < 4.5) {
            const a = d < 1.5 ? 0.3 : d < 3 ? 0.18 : 0.09;
            if (a > alpha && (d < 1.5 || a * 3 > bayer(x, y))) {
              alpha = a;
              col = AO;
            }
          }
          if (kind === 'mur_fenetre' && i >= 3.5 && i <= 13.5 && Math.abs(i - 8.5) > 0.8 && d >= 8 && d <= 17) {
            const edge = Math.min(i - 3.5, 13.5 - i, d - 8, 17 - d);
            const a = edge < 1 ? 0.1 : 0.2;
            if (edge >= 1 || bayer(x, y) < 0.5) {
              alpha = a;
              col = SUN;
            }
          }
        }
        if (alpha > 0) p.set(x, y, [col[0], col[1], col[2], Math.round(alpha * 255)]);
      }
    }

    if (faces.left) {
      for (let x = 0; x < TILE_W / 2; x++) {
        const top = TILE_H / 2 + Math.floor(x / 2);
        for (let j = 0; j < WALL_H; j++) p.set(MX + x, top + j, painter(x, j, true, 0));
      }
    }
    if (faces.right) {
      for (let x = TILE_W / 2; x < TILE_W; x++) {
        const top = TILE_H / 2 + Math.floor((TILE_W - 1 - x) / 2);
        for (let j = 0; j < WALL_H; j++) p.set(MX + x, top + j, painter(x - TILE_W / 2, j, false, 1));
      }
    }
    // Arête verticale d'angle : liseré de lumière
    if (faces.left && faces.right) {
      for (let j = 1; j < PLINTH; j++) p.set(MX + TILE_W / 2 - 1, TILE_H - 1 + j, mix(painter(15, j, true, 0), WHITE, 0.3));
    }
    // Sommet : dessus uni et grenu, arêtes avant éclairées
    for (let y = 0; y < TILE_H; y++) {
      const [x0, x1] = diamondRow(y);
      for (let x = x0; x <= x1; x++) {
        const front = y >= TILE_H / 2 && (x === x0 || x === x0 + 1 || x === x1 || x === x1 - 1);
        let c: RGBA = P.mur.dark;
        if (front) c = x < TILE_W / 2 ? P.mur.hi : P.mur.base;
        else if (hash(x, y, 9) < 0.08) c = mix(P.mur.dark, P.mur.deep, 0.5);
        else if (hash(x, y, 10) < 0.05) c = P.mur.base;
        p.set(MX + x, y, c);
      }
    }
    return { pix: p, ax: MX + TILE_W / 2, ay: baseL };
  });
}

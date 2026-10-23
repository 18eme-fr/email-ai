import type { PropKind } from './contract';
import { INK, P, POSTER_COLORS, WHITE, hueRamp, type Ramp } from './palette';
import { Pix, cached, hash, mix, shade, type Pt, type RGBA, type Sprite } from './pixelKit';

const SW = 64;
const SH = 88;
const CX = 32;
const CY = 80;

/** Sommets d'une boîte iso : demi-étendues hx (axe x carte) et hy (axe y carte). */
interface BoxPts {
  N: Pt;
  E: Pt;
  S: Pt;
  Wp: Pt;
  h: number;
}

function boxPts(cx: number, cy: number, hx: number, hy: number, h: number): BoxPts {
  return {
    N: [cx - hx + hy, cy - hx / 2 - hy / 2],
    E: [cx + hx + hy, cy + hx / 2 - hy / 2],
    S: [cx + hx - hy, cy + hx / 2 + hy / 2],
    Wp: [cx - hx - hy, cy - hx / 2 + hy / 2],
    h,
  };
}

const up = (p: Pt, h: number): Pt => [p[0], p[1] - h];

/**
 * Boîte pleine : dessus clair, face gauche (éclairée) en ton de base, face
 * droite à l'ombre ; arêtes avant soulignées d'un liseré clair.
 */
function box(p: Pix, cx: number, cy: number, hx: number, hy: number, h: number, r: Ramp, opts: { top?: RGBA; edge?: boolean } = {}): BoxPts {
  const b = boxPts(cx, cy, hx, hy, h);
  p.poly([b.Wp, b.S, up(b.S, h), up(b.Wp, h)], r.base);
  p.poly([b.S, b.E, up(b.E, h), up(b.S, h)], r.dark);
  p.poly([up(b.N, h), up(b.E, h), up(b.S, h), up(b.Wp, h)], opts.top ?? r.light);
  if (opts.edge !== false && h > 1) {
    const s = up(b.S, h);
    p.line(s[0], s[1], s[0], b.S[1] - 1, mix(r.base, r.light, 0.5));
  }
  return b;
}

/** Pixel sur une face gauche : `i` le long de W→S, `j` en hauteur depuis le bas. */
function onLeft(p: Pix, b: BoxPts, i: number, j: number, c: RGBA): void {
  const len = b.S[0] - b.Wp[0];
  const x = b.Wp[0] + i;
  const y = b.Wp[1] + ((b.S[1] - b.Wp[1]) * i) / len;
  p.set(x, Math.floor(y) - 1 - j, c);
}

function leg(p: Pix, x: number, y: number, h: number, c: RGBA): void {
  p.rect(x, y - h, 1, h, c);
}

type PropPainter = (p: Pix, accent: number, v: number) => void;

const PROPS: Record<PropKind, PropPainter> = {
  stand: (p, accent, v) => {
    const a = hueRamp(accent, 0.55, 0.5);
    const cloth = hueRamp(accent, 0.3, 0.72);
    // Panneau vertical derrière la table
    const pb = box(p, CX + 9, CY - 4.5, 13, 1, 38, a);
    for (let i = 3; i < 24; i++) {
      for (let j = 30; j < 35; j++) onLeft(p, pb, i, j, WHITE);
      if (i > 4 && i < 20) onLeft(p, pb, i, 32, a.deep);
      if (i % 3 !== 0 && i > 4 && i < 22) onLeft(p, pb, i, 20, a.light);
      if (i % 4 !== 0 && i > 4 && i < 17) onLeft(p, pb, i, 17, a.light);
    }
    // Pastille logo
    for (let i = 6; i < 11; i++) for (let j = 22; j < 27; j++) if ((i - 8.5) ** 2 + (j - 24.5) ** 2 < 6.5) onLeft(p, pb, i, j, WHITE);
    // Table nappée
    const tb = box(p, CX, CY, 12, 7, 12, cloth, { top: WHITE });
    for (let i = 2; i < 22; i += 1) onLeft(p, tb, i, 11, cloth.dark);
    for (let i = 4; i < 20; i += 5) for (let j = 0; j < 9; j++) onLeft(p, tb, i, j, mix(cloth.base, cloth.dark, 0.5));
    // Brochures et gobelet sur la nappe
    const top = CY - 12;
    p.rect(CX - 6, top - 3, 4, 2, POSTER_COLORS[Math.floor(hash(v, 1) * 8)] ?? WHITE);
    p.rect(CX - 2, top - 1, 4, 2, a.light);
    p.rect(CX + 4, top - 3, 2, 3, P.metal.light);
    p.set(CX + 4, top - 3, P.metal.dark);
  },
  table: (p) => {
    const r = P.bois;
    for (const [dx, dy] of [[-17, -1], [17, -1], [-3, 6], [3, -8]] as const) leg(p, CX + dx, CY + dy, 12, P.metal.dark);
    box(p, CX, CY - 12, 12, 7, 2, r);
    p.line(CX - 12, CY - 19, CX - 2, CY - 24, mix(r.light, WHITE, 0.4));
  },
  chaise: (p, _a, v) => {
    const colors = [P.orange, hueRamp(208, 0.5, 0.48), hueRamp(150, 0.4, 0.45), hueRamp(45, 0.7, 0.55)];
    const r = colors[v % colors.length] ?? P.orange;
    for (const [dx, dy] of [[-7, 0], [7, 0], [0, 4], [0, -4]] as const) leg(p, CX + dx, CY + dy, 8, P.metal.dark);
    box(p, CX + 3, CY - 9.5, 1, 6, 11, r);
    box(p, CX, CY - 8, 6, 6, 2, r);
  },
  plante: (p, _a, v) => {
    box(p, CX, CY, 5, 5, 8, P.terre);
    p.poly([[CX - 8, CY - 8], [CX, CY - 12], [CX + 8, CY - 8], [CX, CY - 4]], P.terre.deep);
    const g = P.feuille;
    const tall = 10 + (v % 2) * 6;
    const blobs: Array<[number, number, number]> = [
      [0, -tall - 8, 7],
      [-6, -tall - 3, 6],
      [6, -tall - 2, 6],
      [-3, -tall - 13, 5],
      [4, -tall - 11, 5],
    ];
    for (const [dx, dy, rr] of blobs) {
      p.ellipse(CX + dx, CY + dy, rr, rr * 0.85, (x, y) => {
        const lx = x - (CX + dx);
        const ly = y - (CY + dy);
        const t = lx + ly;
        const n = hash(x, y, 5 + v);
        if (t < -rr * 0.6) return n < 0.3 ? g.base : g.light;
        if (t > rr * 0.5) return n < 0.3 ? g.base : g.dark;
        return n < 0.15 ? g.dark : g.base;
      });
    }
    p.line(CX, CY - 9, CX, CY - tall - 2, g.deep);
  },
  etagere: (p, _a, v) => {
    const r = P.boisSombre;
    const b = box(p, CX, CY, 4, 11, 34, r);
    const len = b.S[0] - b.Wp[0];
    for (const j of [2, 11, 20, 29]) for (let i = 0; i < len; i++) onLeft(p, b, i, j, r.light);
    for (let shelf = 0; shelf < 3; shelf++) {
      const j0 = 3 + shelf * 9;
      for (let i = 2; i < len - 1; i += 3) {
        const c = POSTER_COLORS[Math.floor(hash(i, shelf, v) * POSTER_COLORS.length)] ?? WHITE;
        const hh = 5 + Math.floor(hash(i, shelf, v + 9) * 3);
        for (let j = 0; j < hh; j++) {
          onLeft(p, b, i, j0 + j, c);
          onLeft(p, b, i + 1, j0 + j, shade(c, 0.85));
        }
      }
    }
  },
  banc: (p) => {
    for (const [dx, dy] of [[-14, -3], [14, -3], [-10, 4], [10, 4]] as const) leg(p, CX + dx, CY + dy, 8, P.metal.dark);
    const b = box(p, CX, CY - 8, 15, 3, 2, P.bois);
    for (let i = 3; i < 32; i += 6) onLeft(p, b, i, 1, P.bois.dark);
    // Portemanteaux du vestiaire, à l'arrière
    box(p, CX + 3, CY - 4, 15, 1, 0, P.metal);
  },
  panier_basket: (p) => {
    box(p, CX, CY, 5, 5, 5, P.plinthe);
    p.rect(CX - 1, CY - 58, 3, 54, P.metal.dark);
    p.rect(CX - 1, CY - 58, 1, 54, P.metal.base);
    // Bras et panneau
    p.line(CX, CY - 52, CX - 8, CY - 52, P.metal.dark);
    const bb = box(p, CX - 9, CY - 47, 1, 10, 16, { light: WHITE, base: WHITE, dark: hexA(0xd8d4cc), deep: INK });
    for (let i = 5; i < 16; i++) {
      onLeft(p, bb, i, 3, hexA(0xd9584a));
      onLeft(p, bb, i, 9, hexA(0xd9584a));
    }
    for (let j = 3; j < 10; j++) {
      onLeft(p, bb, 5, j, hexA(0xd9584a));
      onLeft(p, bb, 15, j, hexA(0xd9584a));
    }
    // Cercle et filet
    const rx = CX - 13;
    const ry = CY - 47;
    for (let x = -4; x <= 4; x++) {
      p.set(rx + x, ry + (Math.abs(x) === 4 ? 0 : x < 0 ? -1 : 1) * (Math.abs(x) > 1 ? 1 : 1), P.orange.base);
      p.set(rx + x, ry - (Math.abs(x) === 4 ? 0 : 1), P.orange.dark);
    }
    for (let j = 1; j < 6; j++) {
      for (let x = -3 + Math.floor(j / 2); x <= 3 - Math.floor(j / 2); x += 2) p.set(rx + x + (j % 2), ry + 1 + j, WHITE);
    }
  },
  tableau_liaison: (p, _a, v) => {
    leg(p, CX - 9, CY + 4, 12, P.boisSombre.dark);
    leg(p, CX + 9, CY - 4, 12, P.boisSombre.dark);
    const b = box(p, CX, CY - 10, 13, 1, 22, P.boisSombre);
    const len = b.S[0] - b.Wp[0];
    for (let i = 1; i < len - 1; i++) {
      for (let j = 1; j < 21; j++) {
        const n = hash(i, j, 17);
        onLeft(p, b, i, j, n < 0.12 ? P.liege.dark : n > 0.93 ? P.liege.light : P.liege.base);
      }
    }
    // Mots et papillons punaisés
    for (let k = 0; k < 5; k++) {
      const i0 = 2 + Math.floor(hash(k, v, 1) * (len - 7));
      const j0 = 3 + Math.floor(hash(k, v, 2) * 11);
      const c = POSTER_COLORS[Math.floor(hash(k, v, 3) * POSTER_COLORS.length)] ?? WHITE;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) onLeft(p, b, i0 + i, j0 + j, j === 2 && i > 0 && i < 3 ? shade(c, 0.75) : c);
      onLeft(p, b, i0 + 1, j0 + 4, hexA(0xd64045));
    }
  },
  distributeur: (p, _a, v) => {
    const body = v % 2 === 0 ? hueRamp(4, 0.55, 0.5) : hueRamp(210, 0.5, 0.45);
    const b = box(p, CX, CY, 7, 7, 40, body);
    // Vitrine lumineuse et canettes
    for (let i = 2; i < 10; i++) {
      for (let j = 12; j < 36; j++) {
        const shelf = (j - 12) % 6;
        let c: RGBA = mix(P.verre.light, WHITE, 0.3);
        if (shelf === 0) c = P.metal.base;
        else if (shelf >= 2 && i % 2 === 0) c = POSTER_COLORS[Math.floor(hash(i, Math.floor((j - 12) / 6), v) * 8)] ?? WHITE;
        if (i === 2 || i === 9) c = shade(c, 0.8);
        onLeft(p, b, i, j, c);
      }
    }
    for (let j = 18; j < 30; j += 3) onLeft(p, b, 11, j, P.metal.light);
    for (let i = 3; i < 9; i++) for (let j = 4; j < 7; j++) onLeft(p, b, i, j, INK);
    for (let i = 1; i < 13; i++) onLeft(p, b, i, 38, body.light);
  },
  kakemono: (p, accent) => {
    const a = hueRamp(accent, 0.6, 0.52);
    box(p, CX, CY, 8, 2, 2, P.metal);
    const b = box(p, CX, CY - 2, 7, 0.5, 48, a);
    const len = b.S[0] - b.Wp[0];
    for (let i = 1; i < len - 1; i++) {
      for (let j = 38; j < 45; j++) onLeft(p, b, i, j, WHITE);
      if (i > 2 && i < len - 3) onLeft(p, b, i, 41, a.dark);
      if (i % 3 !== 0 && i < len - 4) {
        onLeft(p, b, i, 12, a.light);
        onLeft(p, b, i, 9, a.light);
      }
    }
    // Pastille logo : disque clair et quartier de couleur
    for (let i = 3; i < 12; i++) {
      for (let j = 18; j < 31; j++) {
        const d = (i - 7.5) ** 2 + ((j - 24.5) * 0.7) ** 2;
        if (d < 12) onLeft(p, b, i, j, i + (j - 24) < 6 ? a.light : WHITE);
      }
    }
    p.rect(Math.round(b.Wp[0]) - 1, Math.round(b.Wp[1]) - 52, len + 2, 2, P.metal.dark);
  },
};

function hexA(n: number): RGBA {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function propSprite(kind: PropKind, accent: number, variant: number): Sprite {
  const ac = ((Math.round(accent) % 360) + 360) % 360;
  const v = ((variant % 4) + 4) % 4;
  const usesAccent = kind === 'stand' || kind === 'kakemono';
  return cached(`p:${kind}:${usesAccent ? ac : 0}:${v}`, () => {
    const p = new Pix(SW, SH);
    PROPS[kind](p, ac, v);
    p.outline(0.45);
    return { pix: p, ax: CX, ay: CY };
  });
}

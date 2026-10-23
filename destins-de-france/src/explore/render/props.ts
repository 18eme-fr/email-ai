import type { PropKind } from './contract';
import { INK, P, PAPER, POSTER_COLORS, WHITE, hueRamp, type Ramp } from './palette';
import { Pix, bayer, cached, dith, hash, mix, shade, type Pt, type RGBA, type Sprite } from './pixelKit';

const SW = 72;
const SH = 96;
const CX = 36;
const CY = 86;

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

const AO: RGBA = [40, 30, 46, 255];

/**
 * Ombre de contact au sol : empreinte élargie, décalée vers le bas-droite
 * (lumière haut-gauche), dense au centre et tramée sur les bords.
 */
function contact(p: Pix, cx: number, cy: number, hx: number, hy: number, spread = 3): void {
  const b = boxPts(cx + 2, cy + 1, hx + spread, hy + spread, 0);
  const inner = boxPts(cx + 1, cy + 0.5, hx + 0.5, hy + 0.5, 0);
  const core = new Set<number>();
  const mark = new Pix(p.w, p.h);
  mark.poly([inner.N, inner.E, inner.S, inner.Wp], [0, 0, 0, 255]);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (mark.alpha(x, y) > 0) core.add(y * p.w + x);
  const outer = new Pix(p.w, p.h);
  outer.poly([b.N, b.E, b.S, b.Wp], [0, 0, 0, 255]);
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (outer.alpha(x, y) === 0) continue;
      if (core.has(y * p.w + x)) p.set(x, y, [AO[0], AO[1], AO[2], 92]);
      else if (bayer(x, y) < 0.55) p.set(x, y, [AO[0], AO[1], AO[2], 46]);
    }
  }
}

/**
 * Boîte pleine : dessus clair (reflet tramé vers le haut-gauche), face
 * gauche éclairée, face droite à l'ombre, arêtes avant soulignées.
 */
function box(p: Pix, cx: number, cy: number, hx: number, hy: number, h: number, r: Ramp, opts: { top?: Ramp; edge?: boolean } = {}): BoxPts {
  const b = boxPts(cx, cy, hx, hy, h);
  const t = opts.top ?? r;
  p.poly([b.Wp, b.S, up(b.S, h), up(b.Wp, h)], (x, y) => dith(x, y, (y - (b.S[1] - h)) / (h + 6) - 0.1, r.base, mix(r.base, r.dark, 0.35)));
  p.poly([b.S, b.E, up(b.E, h), up(b.S, h)], (x, y) => dith(x, y, (y - (b.E[1] - h)) / (h + 6) - 0.1, r.dark, mix(r.dark, r.deep, 0.4)));
  const topY = b.N[1] - h;
  p.poly([up(b.N, h), up(b.E, h), up(b.S, h), up(b.Wp, h)], (x, y) => dith(x, y, 0.55 - (y - topY) / (hx + hy + 1), t.light, t.hi));
  if (opts.edge !== false) {
    const s = up(b.S, h);
    const w = up(b.Wp, h);
    const e = up(b.E, h);
    p.line(w[0], w[1], s[0], s[1], t.hi);
    p.line(s[0], s[1], e[0], e[1], mix(t.light, r.dark, 0.3));
    if (h > 1) p.line(s[0], s[1] + 1, s[0], b.S[1] - 1, r.light);
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

function leg(p: Pix, x: number, y: number, h: number, r: Ramp = P.metal): void {
  p.rect(x, y - h, 1, h, r.dark);
  p.set(x, y - h, r.light);
}

/** Gobelet blanc vu de 3/4 : 3×4 px. */
function cup(p: Pix, x: number, y: number, tea = false): void {
  p.rect(x, y - 3, 3, 3, WHITE);
  p.set(x + 2, y - 2, PAPER);
  p.set(x + 2, y - 1, PAPER);
  p.rect(x, y - 4, 3, 1, tea ? [150, 104, 72, 255] : P.metal.light);
}

/** Pile de feuilles / brochures posée à plat. */
function papers(p: Pix, x: number, y: number, c: RGBA, n = 3): void {
  for (let k = 0; k < n; k++) {
    p.line(x + k, y - k * 0.5, x + 5 + k, y + 2.5 - k * 0.5, k === n - 1 ? c : PAPER);
    p.line(x + k - 1, y + 0.5 - k * 0.5, x + 4 + k, y + 3 - k * 0.5, k === n - 1 ? shade(c, 0.85) : PAPER);
  }
}

type PropPainter = (p: Pix, accent: number, v: number) => void;

const PROPS: Record<PropKind, PropPainter> = {
  stand: (p, accent, v) => {
    const a = hueRamp(accent, 0.4, 0.5);
    const cloth = hueRamp(accent, 0.18, 0.78);
    contact(p, CX + 2, CY - 2, 14, 9);
    // Panneau vertical derrière la table : bandeau titre, photo, texte
    const pb = box(p, CX + 9, CY - 4.5, 13, 1, 40, a, { top: a });
    for (let i = 2; i < 25; i++) {
      for (let j = 31; j < 37; j++) onLeft(p, pb, i, j, j === 31 ? PAPER : WHITE);
      if (i > 3 && i < 20) onLeft(p, pb, i, 34, a.deep);
      if (i > 3 && i < 13) onLeft(p, pb, i, 33, a.dark);
      if (i % 3 !== 0 && i > 13 && i < 24) {
        onLeft(p, pb, i, 21, a.hi);
        onLeft(p, pb, i, 18, a.hi);
        onLeft(p, pb, i, 15, a.light);
      }
    }
    for (let i = 3; i < 12; i++) {
      for (let j = 14; j < 27; j++) {
        const sky = j > 21;
        onLeft(p, pb, i, j, i === 3 || j === 14 ? a.deep : sky ? P.ciel.light : (i + j) % 5 === 0 ? P.feuille.dark : P.feuille.base);
      }
    }
    // Câble qui descend du panneau jusqu'au sol
    p.line(CX + 20, CY - 12, CX + 22, CY - 3, INK);
    p.rect(CX + 22, CY - 3, 2, 1, P.metal.dark);
    // Table nappée avec plis
    const tb = box(p, CX, CY, 12, 7, 12, cloth, { top: { ...cloth, light: WHITE, hi: [250, 248, 243, 255] } });
    const len = tb.S[0] - tb.Wp[0];
    for (let i = 3; i < len - 1; i += 4) for (let j = 0; j < 10; j++) onLeft(p, tb, i, j, mix(cloth.base, cloth.dark, 0.45));
    for (let i = 0; i < len; i++) onLeft(p, tb, i, 0, cloth.dark);
    // Micro-objets : brochures, gobelets, carnet
    const top = CY - 12;
    papers(p, CX - 10, top - 4, POSTER_COLORS[Math.floor(hash(v, 1) * 8)] ?? WHITE);
    papers(p, CX - 3, top - 1, a.light, 2);
    cup(p, CX + 5, top - 1, v % 2 === 0);
    cup(p, CX + 9, top - 3);
    p.rect(CX - 1, top - 5, 3, 2, P.plinthe.base);
  },
  table: (p, _a, v) => {
    const r = P.bois;
    contact(p, CX, CY, 12, 7, 2);
    for (const [dx, dy] of [[-17, -1], [17, -1], [-3, 6], [3, -8]] as const) leg(p, CX + dx, CY + dy, 13);
    const b = box(p, CX, CY - 13, 12, 7, 2, r);
    // Fil du bois sur le plateau
    for (let k = -2; k <= 2; k++) p.line(CX - 12 + k * 3, CY - 19 + k * 1.5 + 4, CX - 2 + k * 3, CY - 24 + k * 1.5 + 4, mix(r.light, r.base, 0.6));
    papers(p, CX - 6, CY - 22, POSTER_COLORS[(v * 3) % 8] ?? WHITE, 2);
    if (v % 2 === 0) cup(p, CX + 5, CY - 19, true);
    void b;
  },
  chaise: (p, _a, v) => {
    const colors = [P.orange, hueRamp(208, 0.35, 0.5), hueRamp(150, 0.3, 0.46), P.jaune];
    const r = colors[v % colors.length] ?? P.orange;
    contact(p, CX, CY, 6, 6, 2);
    for (const [dx, dy] of [[-7, 0], [7, 0], [0, 4], [0, -4]] as const) leg(p, CX + dx, CY + dy, 9);
    box(p, CX + 3, CY - 10.5, 1, 6, 12, r);
    box(p, CX, CY - 9, 6, 6, 2, r);
  },
  plante: (p, _a, v) => {
    contact(p, CX, CY, 5, 5, 2);
    box(p, CX, CY, 5, 5, 9, P.terre);
    // Bord du pot et terreau
    p.poly([[CX - 9, CY - 9], [CX, CY - 13.5], [CX + 9, CY - 9], [CX, CY - 4.5]], P.terre.light);
    p.poly([[CX - 7, CY - 9], [CX, CY - 12.5], [CX + 7, CY - 9], [CX, CY - 5.5]], [86, 64, 52, 255]);
    const g = P.feuille;
    const tall = 12 + (v % 2) * 6;
    const blobs: Array<[number, number, number]> = [
      [0, -tall - 9, 7],
      [-7, -tall - 3, 6],
      [7, -tall - 2, 6],
      [-4, -tall - 15, 5],
      [5, -tall - 13, 5],
      [-1, -tall - 20, 4],
    ];
    p.line(CX, CY - 10, CX - 1, CY - tall - 4, g.deep);
    p.line(CX, CY - 10, CX + 3, CY - tall - 2, g.deep);
    for (const [dx, dy, rr] of blobs) {
      p.ellipse(CX + dx, CY + dy, rr, rr * 0.85, (x, y) => {
        const lx = x - (CX + dx);
        const ly = y - (CY + dy);
        const t = (lx + ly) / rr;
        const n = hash(x, y, 5 + v);
        // Feuilles : tramage entre tons, lumière haut-gauche
        if (t < -0.7) return n < 0.35 ? g.light : g.hi;
        if (t < -0.1) return dith(x, y, 0.4, g.base, g.light);
        if (t > 0.6) return n < 0.3 ? g.dark : g.deep;
        return dith(x, y, 0.35, g.base, g.dark);
      });
    }
  },
  etagere: (p, _a, v) => {
    const r = P.boisSombre;
    contact(p, CX, CY, 4, 11, 2);
    const b = box(p, CX, CY, 4, 11, 36, r);
    const len = b.S[0] - b.Wp[0];
    for (let shelf = 0; shelf < 4; shelf++) {
      const j0 = 2 + shelf * 9;
      // Fond d'étagère dans l'ombre, tablette éclairée
      for (let i = 1; i < len - 1; i++) {
        for (let j = j0 + 1; j < j0 + 9 && j < 35; j++) onLeft(p, b, i, j, r.deep);
        onLeft(p, b, i, j0, r.hi);
      }
      if (shelf === 3) continue;
      for (let i = 2; i < len - 2; i += 3) {
        const c = POSTER_COLORS[Math.floor(hash(i, shelf, v) * POSTER_COLORS.length)] ?? WHITE;
        const hh = 5 + Math.floor(hash(i, shelf, v + 9) * 3);
        for (let j = 0; j < hh; j++) {
          onLeft(p, b, i, j0 + 1 + j, j === hh - 1 ? mix(c, WHITE, 0.4) : c);
          onLeft(p, b, i + 1, j0 + 1 + j, shade(c, 0.8));
        }
      }
    }
  },
  banc: (p, _a, v) => {
    contact(p, CX, CY, 15, 4, 2);
    for (const [dx, dy] of [[-14, -3], [14, -3], [-10, 4], [10, 4]] as const) leg(p, CX + dx, CY + dy, 9);
    p.line(CX - 12, CY - 2, CX + 12, CY - 2 + 0, P.metal.dark);
    const b = box(p, CX, CY - 9, 15, 3, 2, P.bois);
    // Lattes
    for (let k = 0; k < 2; k++) p.line(b.Wp[0] + 1 + k * 2, b.Wp[1] - 2 - k, b.N[0] - 1, b.N[1] - 2 + 2 - k, P.bois.dark);
    // Sac de sport oublié sur le banc
    if (v % 2 === 1) {
      const bag = hueRamp(220 + v * 30, 0.3, 0.42);
      box(p, CX + 4, CY - 12, 5, 3, 5, bag);
      p.line(CX + 1, CY - 18, CX + 6, CY - 20, bag.deep);
    } else {
      p.rect(CX - 6, CY - 15, 5, 2, WHITE);
      p.rect(CX - 6, CY - 13, 5, 1, PAPER);
    }
  },
  panier_basket: (p) => {
    contact(p, CX, CY, 6, 6, 3);
    box(p, CX, CY, 6, 6, 6, P.plinthe);
    // Mât avec protection en mousse
    p.rect(CX - 1, CY - 62, 3, 56, P.metal.dark);
    p.rect(CX - 1, CY - 62, 1, 56, P.metal.light);
    box(p, CX, CY - 6, 3, 3, 16, hueRamp(215, 0.35, 0.45));
    p.line(CX, CY - 56, CX - 8, CY - 56, P.metal.dark);
    p.line(CX, CY - 52, CX - 8, CY - 56, P.metal.base);
    const white: Ramp = { hi: WHITE, light: WHITE, base: [236, 232, 224, 255], dark: [206, 201, 192, 255], deep: [170, 164, 156, 255] };
    const bb = box(p, CX - 9, CY - 50, 1, 11, 18, white);
    const red = P.rouge.base;
    for (let i = 6; i < 17; i++) {
      onLeft(p, bb, i, 3, red);
      onLeft(p, bb, i, 10, red);
    }
    for (let j = 3; j <= 10; j++) {
      onLeft(p, bb, 6, j, red);
      onLeft(p, bb, 16, j, red);
    }
    // Cercle (ellipse rastérisée en contour) et filet tramé
    const rx = CX - 14;
    const ry = CY - 50;
    const ring = new Pix(p.w, p.h);
    ring.ellipse(rx, ry, 5, 2, P.orange.base);
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        if (ring.alpha(x, y) === 0) continue;
        const edge = ring.alpha(x - 1, y) === 0 || ring.alpha(x + 1, y) === 0 || ring.alpha(x, y - 1) === 0 || ring.alpha(x, y + 1) === 0;
        if (edge) p.set(x, y, y < ry ? P.orange.dark : P.orange.base);
      }
    }
    for (let j = 1; j < 7; j++) {
      const half = 4 - j * 0.35;
      for (let x = Math.ceil(-half); x <= Math.floor(half); x++) if ((x + j) % 2 === 0) p.set(rx + x, ry + 1 + j, j % 2 ? WHITE : PAPER);
    }
  },
  tableau_liaison: (p, _a, v) => {
    contact(p, CX, CY, 13, 3, 2);
    leg(p, CX - 9, CY + 4, 12, P.boisSombre);
    leg(p, CX + 9, CY - 4, 12, P.boisSombre);
    const b = box(p, CX, CY - 10, 13, 1, 24, P.boisSombre);
    const len = b.S[0] - b.Wp[0];
    for (let i = 1; i < len - 1; i++) {
      for (let j = 1; j < 23; j++) {
        const n = hash(i, j, 17);
        onLeft(p, b, i, j, n < 0.15 ? P.liege.dark : n > 0.9 ? P.liege.light : dith(i, j, 0.2, P.liege.base, P.liege.light));
      }
    }
    // Annonces punaisées, une légère ombre en bas-droite
    for (let k = 0; k < 6; k++) {
      const i0 = 2 + Math.floor(hash(k, v, 1) * (len - 7));
      const j0 = 3 + Math.floor(hash(k, v, 2) * 13);
      const c = POSTER_COLORS[Math.floor(hash(k, v, 3) * POSTER_COLORS.length)] ?? WHITE;
      for (let i = 0; i < 5; i++) onLeft(p, b, i0 + i + 1, j0 - 1, P.liege.deep);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) onLeft(p, b, i0 + i, j0 + j, (j === 1 || j === 3) && i > 0 && i < 3 ? shade(c, 0.72) : c);
      }
      onLeft(p, b, i0 + 1, j0 + 4, P.rouge.base);
    }
  },
  distributeur: (p, _a, v) => {
    const body = v % 2 === 0 ? P.rouge : hueRamp(210, 0.35, 0.45);
    contact(p, CX, CY, 7, 7, 3);
    const b = box(p, CX, CY, 7, 7, 42, body);
    // Vitrine éclairée : rangées de canettes et bouteilles
    for (let i = 2; i < 10; i++) {
      for (let j = 13; j < 38; j++) {
        const shelf = (j - 13) % 6;
        let c: RGBA = mix(P.verre.hi, [255, 246, 220, 255], 0.4);
        if (shelf === 0) c = P.metal.base;
        else if (shelf >= 2 && i % 2 === 0) {
          const k = POSTER_COLORS[Math.floor(hash(i, Math.floor((j - 13) / 6), v) * 8)] ?? WHITE;
          c = shelf === 5 ? mix(k, WHITE, 0.4) : k;
        }
        if (i === 2 || i === 9 || j === 37) c = shade(c, 0.82);
        onLeft(p, b, i, j, c);
      }
    }
    for (let j = 18; j < 32; j += 3) onLeft(p, b, 11, j, P.metal.hi);
    onLeft(p, b, 11, 33, INK);
    for (let i = 3; i < 9; i++) for (let j = 4; j < 8; j++) onLeft(p, b, i, j, j === 7 ? P.plinthe.base : INK);
    for (let i = 1; i < 13; i++) {
      onLeft(p, b, i, 40, body.hi);
      onLeft(p, b, i, 39, WHITE);
    }
    // Câble et prise
    p.line(b.E[0] - 1, b.E[1] - 3, b.E[0] + 3, b.E[1] - 1, INK);
  },
  kakemono: (p, accent) => {
    const a = hueRamp(accent, 0.45, 0.52);
    contact(p, CX, CY, 8, 2, 2);
    box(p, CX, CY, 8, 2, 2, P.metal);
    const b = box(p, CX, CY - 2, 7, 0.5, 50, a, { edge: false });
    const len = b.S[0] - b.Wp[0];
    for (let i = 1; i < len - 1; i++) {
      for (let j = 38; j < 47; j++) onLeft(p, b, i, j, j === 38 ? PAPER : WHITE);
      if (i > 2 && i < len - 3) {
        onLeft(p, b, i, 43, a.deep);
        onLeft(p, b, i, 41, a.dark);
      }
      if (i % 3 !== 0 && i < len - 4) {
        onLeft(p, b, i, 12, a.hi);
        onLeft(p, b, i, 9, a.hi);
        onLeft(p, b, i, 6, a.light);
      }
    }
    // Pastille logo : disque clair et quartier de couleur
    for (let i = 3; i < 12; i++) {
      for (let j = 18; j < 31; j++) {
        const d = (i - 7.5) ** 2 + ((j - 24.5) * 0.7) ** 2;
        if (d < 12) onLeft(p, b, i, j, i + (j - 24) < 6 ? a.hi : WHITE);
      }
    }
    p.rect(Math.round(b.Wp[0]) - 1, Math.round(b.Wp[1]) - 54, len + 2, 2, P.metal.dark);
    p.set(Math.round(b.Wp[0]) - 1, Math.round(b.Wp[1]) - 54, P.metal.hi);
  },
};

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

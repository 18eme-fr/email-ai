/**
 * Outils de dessin pixel par pixel : un tampon RGBA, des primitives à bords
 * nets (aucun anti-crénelage) et un cache de sprites hors écran.
 */

export type RGBA = readonly [number, number, number, number];

export function hex(h: string, a = 255): RGBA {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

/** Multiplie la luminosité (f < 1 assombrit, f > 1 éclaircit vers le blanc). */
export function shade(c: RGBA, f: number): RGBA {
  if (f <= 1) return [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f), c[3]];
  const k = f - 1;
  return [Math.round(c[0] + (255 - c[0]) * k), Math.round(c[1] + (255 - c[1]) * k), Math.round(c[2] + (255 - c[2]) * k), c[3]];
}

export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
  ];
}

export function withAlpha(c: RGBA, a: number): RGBA {
  return [c[0], c[1], c[2], a];
}

export function hsl(h: number, s: number, l: number): RGBA {
  const hh = (((h % 360) + 360) % 360) / 360;
  const f = (n: number): number => {
    const k = (n + hh * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4), 255];
}

/** Hash entier → [0, 1), pour des variations déterministes. */
export function hash(a: number, b = 0, c = 0): number {
  let x = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x27d4eb2f, 0x165667b1);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2c1b3c6d);
  x ^= x >>> 12;
  x = Math.imul(x, 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}

export type Pt = readonly [number, number];

/** Tampon de pixels avec primitives nettes. */
export class Pix {
  readonly data: Uint8ClampedArray;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  set(x: number, y: number, c: RGBA): void {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h || c[3] === 0) return;
    const i = (yi * this.w + xi) * 4;
    if (c[3] === 255) {
      this.data[i] = c[0];
      this.data[i + 1] = c[1];
      this.data[i + 2] = c[2];
      this.data[i + 3] = 255;
      return;
    }
    // Composition « par-dessus » pour les rares pixels semi-transparents
    const a = c[3] / 255;
    const da = (this.data[i + 3] ?? 0) / 255;
    const oa = a + da * (1 - a);
    for (let k = 0; k < 3; k++) {
      const dc = this.data[i + k] ?? 0;
      this.data[i + k] = oa === 0 ? 0 : (c[k]! * a + dc * da * (1 - a)) / oa;
    }
    this.data[i + 3] = oa * 255;
  }

  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3] ?? 0;
  }

  get(x: number, y: number): RGBA {
    const i = (y * this.w + x) * 4;
    return [this.data[i] ?? 0, this.data[i + 1] ?? 0, this.data[i + 2] ?? 0, this.data[i + 3] ?? 0];
  }

  rect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** Ligne de Bresenham. */
  line(x0: number, y0: number, x1: number, y1: number, c: RGBA): void {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const xe = Math.round(x1);
    const ye = Math.round(y1);
    const dx = Math.abs(xe - x);
    const dy = -Math.abs(ye - y);
    const sx = x < xe ? 1 : -1;
    const sy = y < ye ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x, y, c);
      if (x === xe && y === ye) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** Remplissage de polygone par balayage, au centre des pixels. */
  poly(points: ReadonlyArray<Pt>, c: RGBA | ((x: number, y: number) => RGBA)): void {
    if (points.length < 3) return;
    const ys = points.map((p) => p[1]);
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const y1 = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) {
      const cy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i]!;
        const b = points[(i + 1) % points.length]!;
        if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy)) {
          xs.push(a[0] + ((cy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.ceil(xs[k]! - 0.5);
        const xb = Math.floor(xs[k + 1]! - 0.5);
        for (let x = xa; x <= xb; x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    }
  }

  /** Ellipse pleine rastérisée (centre et rayons en pixels). */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA | ((x: number, y: number) => RGBA)): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    }
  }

  /**
   * Contour sélectif (« sel-out ») : chaque pixel vide qui touche la forme
   * prend une version sombre de la couleur voisine, ou `fixed` si fourni.
   */
  outline(factor = 0.42, fixed?: RGBA, onlyBelow = false): void {
    const src = new Uint8ClampedArray(this.data);
    const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : (src[(y * this.w + x) * 4 + 3] ?? 0));
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (at(x, y) > 0) continue;
        const ns: Pt[] = onlyBelow ? [[0, -1]] : [[0, -1], [-1, 0], [1, 0], [0, 1]];
        for (const [dx, dy] of ns) {
          if (at(x + dx, y + dy) > 128) {
            const i = ((y + dy) * this.w + (x + dx)) * 4;
            const base: RGBA = [src[i] ?? 0, src[i + 1] ?? 0, src[i + 2] ?? 0, 255];
            this.set(x, y, fixed ?? mix(shade(base, factor), [43, 34, 51, 255], 0.35));
            break;
          }
        }
      }
    }
  }

  mirrored(): Pix {
    const out = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const s = (y * this.w + x) * 4;
        const d = (y * this.w + (this.w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) out.data[d + k] = this.data[s + k] ?? 0;
      }
    }
    return out;
  }
}

// —— Surfaces hors écran et cache ————————————————————————————————————

export type Surface = HTMLCanvasElement | OffscreenCanvas;

function createSurface(w: number, h: number): Surface {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return new OffscreenCanvas(w, h);
}

export function toSurface(p: Pix): Surface {
  const s = createSurface(p.w, p.h);
  const ctx = s.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (ctx) {
    const img = ctx.createImageData(p.w, p.h);
    img.data.set(p.data);
    ctx.putImageData(img, 0, 0);
  }
  return s;
}

/** Sprite prêt à poser : image et point d'ancrage (pieds / centre du sol). */
export interface Sprite {
  img: Surface;
  ax: number;
  ay: number;
}

const cache = new Map<string, Sprite>();

/** Génère un sprite une seule fois par clé. */
export function cached(key: string, make: () => { pix: Pix; ax: number; ay: number }): Sprite {
  let s = cache.get(key);
  if (!s) {
    const { pix, ax, ay } = make();
    s = { img: toSurface(pix), ax, ay };
    cache.set(key, s);
  }
  return s;
}

export function blit(ctx: CanvasRenderingContext2D, s: Sprite, sx: number, sy: number): void {
  ctx.drawImage(s.img, Math.round(sx) - s.ax, Math.round(sy) - s.ay);
}

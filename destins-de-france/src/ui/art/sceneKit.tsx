import type { ReactNode } from 'react';
import { pts, r1, type Pt } from './artUtils';

/* Boîte à outils partagée par les décors génériques et les villes. */

export type Phase = 'aube' | 'matin' | 'jour' | 'dore' | 'crepuscule' | 'nuit';
export const PHASES: Phase[] = ['aube', 'matin', 'jour', 'dore', 'crepuscule', 'nuit'];

/** L'âge comme heure d'une journée de vie. */
export function phaseFor(age: number): Phase {
  if (age < 12) return 'aube';
  if (age < 30) return 'matin';
  if (age < 50) return 'jour';
  if (age < 70) return 'dore';
  if (age < 85) return 'crepuscule';
  return 'nuit';
}

export const PHASE_LABEL: Record<Phase, string> = {
  aube: "à l'aube",
  matin: 'au matin',
  jour: 'en plein jour',
  dore: "en fin d'après-midi",
  crepuscule: 'au crépuscule',
  nuit: 'sous une nuit étoilée',
};

export const W = 1200;
export const H = 320;
export const HZ = 232; // ligne d'horizon des terres
export const GY = 266; // pied des bâtiments du plan médian
export const SEA = 206; // horizon marin

// Opacités des plans successifs : perspective atmosphérique
export const O_FAR = 0.15;
export const O_BACK = 0.26;
export const O_MID = 0.48;
export const O_NEAR = 0.74;
export const O_FORE = 0.9;

export interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
  lit: boolean;
  delay: number;
  blink: boolean;
}

export type Rng = () => number;

export function addWindow(list: Win[], rnd: Rng, x: number, y: number, w: number, h: number, litRate = 0.62): void {
  list.push({ x, y, w, h, lit: rnd() < litRate, delay: r1(rnd() * 2.4), blink: rnd() < 0.06 });
}

/** Arbre feuillu : tronc et houppier en grappe de cercles. */
export function tree(key: string, x: number, base: number, size: number, rnd: Rng): ReactNode {
  const blobs = Array.from({ length: 5 }, (_, i) => {
    const ang = (i / 5) * Math.PI * 2 + rnd();
    return (
      <circle
        key={i}
        cx={r1(x + Math.cos(ang) * size * 0.42)}
        cy={r1(base - size * 1.25 + Math.sin(ang) * size * 0.3)}
        r={r1(size * (0.42 + rnd() * 0.18))}
      />
    );
  });
  return (
    <g key={key}>
      <rect x={r1(x - size * 0.07)} y={r1(base - size * 0.9)} width={r1(size * 0.14)} height={r1(size * 0.9)} />
      <circle cx={x} cy={r1(base - size * 1.3)} r={r1(size * 0.55)} />
      {blobs}
    </g>
  );
}

/** Peuplier / cyprès : silhouette fuselée. */
export function poplar(key: string, x: number, base: number, h: number): ReactNode {
  return <ellipse key={key} cx={x} cy={r1(base - h / 2)} rx={r1(h * 0.16)} ry={r1(h / 2)} />;
}

export function lamp(key: string, x: number, base: number, windows: Win[]): ReactNode {
  windows.push({ x: x + 1, y: base - 46, w: 5, h: 4, lit: true, delay: 0.2, blink: false });
  return (
    <g key={key}>
      <rect x={x} y={base - 44} width={2} height={44} />
      <path d={`M${x + 1} ${base - 44}q3-4 7-2`} fill="none" strokeWidth={2} className="art-scene__stroke" />
      <rect x={x + 3} y={base - 47} width={7} height={3} rx={1} />
    </g>
  );
}

/** Crête montagneuse : enveloppe de pics triangulaires légèrement bruitée. */
export function ridge(rnd: Rng, base: number, peaks: number, minH: number, maxH: number): Pt[] {
  const list = Array.from({ length: peaks }, (_, i) => ({
    c: -60 + ((W + 120) * (i + 0.2 + rnd() * 0.6)) / peaks,
    h: minH + rnd() * (maxH - minH),
    s: 0.45 + rnd() * 0.5,
  }));
  const out: Pt[] = [[-20, H]];
  for (let x = -20; x <= W + 20; x += 10) {
    let y = 0;
    for (const p of list) y = Math.max(y, p.h - Math.abs(x - p.c) * p.s);
    out.push([x, base - y + rnd() * 3.5]);
  }
  out.push([W + 20, H]);
  return out;
}

export function hills(base: number, amp: number, f: number, phase: number): Pt[] {
  const out: Pt[] = [[-20, H]];
  for (let x = -20; x <= W + 20; x += 20) {
    out.push([x, base - amp * (0.6 * Math.sin(x * f + phase) + 0.4 * Math.sin(x * f * 2.7 + phase * 1.7) + 1)]);
  }
  out.push([W + 20, H]);
  return out;
}

/** Palmier : stipe courbe et palmes en croissants. */
export function palm(key: string, x: number, base: number, h: number, lean: number): ReactNode {
  const tx = x + lean;
  const ty = base - h;
  const fronds = Array.from({ length: 7 }, (_, i) => {
    const ang = Math.PI * (1.05 + (i / 6) * 0.9);
    const len = h * (0.42 + (i % 2) * 0.1);
    const ex = tx + Math.cos(ang) * len;
    const ey = ty + Math.sin(ang) * len * 0.55 + len * 0.45;
    const mx = tx + Math.cos(ang) * len * 0.5;
    const my = ty + Math.sin(ang) * len * 0.6 - 6;
    return <path key={i} d={`M${r1(tx)} ${r1(ty)}Q${r1(mx)} ${r1(my - 11)} ${r1(ex)} ${r1(ey)}Q${r1(mx)} ${r1(my + 5)} ${r1(tx)} ${r1(ty)}Z`} />;
  });
  return (
    <g key={key}>
      <path
        d={`M${x - 3} ${base}Q${r1(x + lean * 0.1)} ${r1(base - h * 0.6)} ${r1(tx - 1.5)} ${r1(ty)}L${r1(tx + 1.5)} ${r1(ty)}Q${r1(x + lean * 0.1 + 4)} ${r1(base - h * 0.6)} ${x + 3} ${base}Z`}
      />
      {fronds}
    </g>
  );
}

// —— Ciel ————————————————————————————————————————————————————————

export function cloud(key: string, x: number, y: number, s: number, rnd: Rng, dur: number): ReactNode {
  const puffs = Array.from({ length: 5 }, (_, i) => (
    <ellipse key={i} cx={r1((i - 2) * 22 + rnd() * 8)} cy={r1(-Math.abs(i - 2) * -4 - rnd() * 10)} rx={r1(22 + rnd() * 14)} ry={r1(10 + rnd() * 8)} />
  ));
  return (
    <g key={key} transform={`translate(${r1(x)} ${r1(y)}) scale(${r1(s * 10) / 10})`}>
      <g className="art-scene__cloud" style={{ animationDuration: `${dur}s`, animationDelay: `${-r1(dur * rnd())}s` }}>
        {puffs}
        <rect x={-62} y={-2} width={124} height={10} rx={5} />
      </g>
    </g>
  );
}

/** Fenêtres : vitres pâles le jour, lumières chaudes qui s'allument au crépuscule. */
export function WindowsLayer(props: { windows: Win[] }): JSX.Element {
  const { windows } = props;
  return (
    <>
      <g className="art-scene__panes">
        {windows.map((w, i) => (
          <rect key={i} x={r1(w.x)} y={r1(w.y)} width={r1(w.w)} height={r1(w.h)} />
        ))}
      </g>
      <g>
        {windows
          .filter((w) => w.lit)
          .map((w, i) => (
            <rect
              key={i}
              x={r1(w.x)}
              y={r1(w.y)}
              width={r1(w.w)}
              height={r1(w.h)}
              className={w.blink ? 'art-scene__light art-scene__light--blink' : 'art-scene__light'}
              style={{ transitionDelay: `${w.delay}s`, animationDelay: `${-w.delay * 3}s` }}
            />
          ))}
      </g>
    </>
  );
}

export interface Wave {
  key: number;
  x: number;
  y: number;
  len: number;
  d: number;
  w: number;
}

/** Vaguelettes réparties en perspective entre y0 et y1 (plus serrées vers l'horizon). */
export function makeWaves(seed: number, y0: number, y1: number, count: number, x0 = 0, x1 = W): Wave[] {
  let i = 0;
  const next = (): number => {
    const v = Math.sin(seed * 12.9898 + i++ * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return Array.from({ length: count }, (_, k) => {
    const t = next();
    return {
      key: k,
      x: r1(x0 + next() * (x1 - x0)),
      y: r1(y0 + 3 + t * t * (y1 - y0 - 6)),
      len: r1(12 + t * 56),
      d: r1(next() * 6),
      w: r1(0.6 + t * 1.3),
    };
  });
}

export function WaveLines(props: { waves: Wave[] }): JSX.Element {
  return (
    <g className="art-scene__waves">
      {props.waves.map((w) => (
        <path
          key={w.key}
          d={`M${w.x} ${w.y}q${r1(w.len / 2)} -2 ${w.len} 0`}
          strokeWidth={w.w}
          className="art-scene__wave"
          style={{ animationDelay: `${-w.d}s` }}
        />
      ))}
    </g>
  );
}

export { pts };

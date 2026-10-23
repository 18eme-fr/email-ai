import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { makeRng, pts, r1, type Pt } from './artUtils';
import {
  GY,
  H,
  HZ,
  O_BACK,
  O_FAR,
  O_FORE,
  O_MID,
  O_NEAR,
  SEA,
  W,
  WaveLines,
  WindowsLayer,
  addWindow,
  cloud,
  hills,
  lamp,
  makeWaves,
  palm,
  ridge,
  tree,
  type Rng,
  type Win,
} from './sceneKit';

export type CityId =
  | 'paris'
  | 'marseille'
  | 'lyon'
  | 'toulouse'
  | 'nice'
  | 'nantes'
  | 'montpellier'
  | 'strasbourg'
  | 'bordeaux'
  | 'lille'
  | 'rennes'
  | 'saint-denis-reunion';

type Weather = 'clair' | 'brume' | 'changeant' | 'bruine' | 'averses' | 'sommets';

export interface CityInfo {
  name: string;
  /** Lieu évoqué, pour l'aria-label (« Marseille, le Vieux-Port »). */
  place: string;
  /** Centre horizontal du cadrage de la carte postale. */
  focus: number;
  /** Voile de couleur posé sur le ciel : l'ambiance de la ville. */
  tint: string;
  tintOpacity: number;
  weather: Weather;
}

export const CITIES: Record<CityId, CityInfo> = {
  paris: { name: 'Paris', place: 'Paris, les bords de Seine', focus: 300, tint: '#c8b8d8', tintOpacity: 0.08, weather: 'clair' },
  marseille: { name: 'Marseille', place: 'Marseille, le Vieux-Port', focus: 905, tint: '#1f6fd6', tintOpacity: 0.13, weather: 'clair' },
  lyon: { name: 'Lyon', place: 'Lyon, entre Rhône et Saône', focus: 330, tint: '#e9e3da', tintOpacity: 0.12, weather: 'brume' },
  toulouse: { name: 'Toulouse', place: 'Toulouse, les quais de la Garonne', focus: 330, tint: '#f0a060', tintOpacity: 0.12, weather: 'clair' },
  nice: { name: 'Nice', place: 'Nice, la baie des Anges', focus: 420, tint: '#2a86e0', tintOpacity: 0.1, weather: 'clair' },
  nantes: { name: 'Nantes', place: 'Nantes, les bords de Loire', focus: 330, tint: '#7d93a8', tintOpacity: 0.14, weather: 'changeant' },
  montpellier: { name: 'Montpellier', place: 'Montpellier, le Peyrou et la garrigue', focus: 330, tint: '#f2c26e', tintOpacity: 0.09, weather: 'clair' },
  strasbourg: { name: 'Strasbourg', place: 'Strasbourg, la Petite France', focus: 740, tint: '#9aa8b8', tintOpacity: 0.1, weather: 'clair' },
  bordeaux: { name: 'Bordeaux', place: 'Bordeaux, le port de la Lune', focus: 860, tint: '#e8c890', tintOpacity: 0.09, weather: 'clair' },
  lille: { name: 'Lille', place: 'Lille, la Grand-Place', focus: 760, tint: '#8f98a4', tintOpacity: 0.3, weather: 'averses' },
  rennes: { name: 'Rennes', place: 'Rennes, sous la bruine', focus: 420, tint: '#8f9ea6', tintOpacity: 0.26, weather: 'bruine' },
  'saint-denis-reunion': {
    name: 'Saint-Denis',
    place: "Saint-Denis de La Réunion, face à l'océan Indien",
    focus: 470,
    tint: '#3ca0c8',
    tintOpacity: 0.06,
    weather: 'sommets',
  },
};

export const CITY_IDS = Object.keys(CITIES) as CityId[];

/** Plans d'une ville, du plus lointain au premier plan. */
interface CityLayers {
  far: ReactNode[];
  snowRidge: Pt[] | null;
  /** Silhouettes du plan intermédiaire (collines, monuments). */
  back: ReactNode[];
  /** Éléments colorés (pierre, brique, grue…), assombris selon l'heure. */
  backColor: ReactNode[];
  seaTop: number | null;
  mid: ReactNode[];
  midColor: ReactNode[];
  windows: Win[];
  groundPath: string;
  riverTop: number | null;
  near: ReactNode[];
  nearColor: ReactNode[];
  /** Éléments animés ou à part (bateaux, avion, tram). */
  extra: ReactNode[];
  /** Nuages supplémentaires (ciel changeant, nuages accrochés). */
  sky: ReactNode[];
}

const DEFAULT_GROUND = `M-20 ${GY - 1}L1220 ${GY - 1}L1220 ${H}L-20 ${H}Z`;

function emptyLayers(): CityLayers {
  return {
    far: [],
    snowRidge: null,
    back: [],
    backColor: [],
    seaTop: null,
    mid: [],
    midColor: [],
    windows: [],
    groundPath: DEFAULT_GROUND,
    riverTop: null,
    near: [],
    nearColor: [],
    extra: [],
    sky: [],
  };
}

const paint = (fill: string): CSSProperties => ({ fill });

function pick<T>(list: readonly T[], t: number, fallback: T): T {
  return list[Math.floor(t * list.length) % list.length] ?? fallback;
}

// —— Rangées de façades ————————————————————————————————————————————

type Roof = 'mansard' | 'pitched' | 'low' | 'flat' | 'stepped' | 'timber' | 'creole';

interface RowOpts {
  x0: number;
  x1: number;
  base?: number;
  w: readonly [number, number];
  floors: readonly [number, number];
  fh: number;
  roof: Roof;
  palette?: readonly string[];
  roofColor?: string;
  roofPalette?: readonly string[];
  timber?: string;
  band?: string;
  gap?: number;
  lit?: number;
  skip?: ReadonlyArray<readonly [number, number]>;
}

/** Pignon à redents flamand : marches symétriques. */
function steppedGable(x: number, w: number, top: number, h: number): Pt[] {
  const n = 3;
  const sw = w / (2 * n + 1);
  const step = h / n;
  const left: Pt[] = [[x, top]];
  for (let s = 0; s < n; s++) {
    const yy = top - (s + 1) * step;
    left.push([x + s * sw, yy], [x + (s + 1) * sw, yy]);
  }
  const right = [...left].reverse().map(([px, py]) => [2 * x + w - px, py] as Pt);
  return [...left, ...right];
}

function row(L: CityLayers, rnd: Rng, o: RowOpts, key: string): void {
  const base = o.base ?? GY;
  let i = 0;
  for (let x = o.x0; x < o.x1; i++) {
    const sk = o.skip?.find(([a, b]) => x + 20 > a && x < b);
    if (sk) {
      x = sk[1];
      continue;
    }
    const w = o.w[0] + rnd() * (o.w[1] - o.w[0]);
    const floors = o.floors[0] + Math.floor(rnd() * (o.floors[1] - o.floors[0] + 1));
    const top = base - floors * o.fh;
    const k = `${key}${i}`;
    const wall = o.palette ? pick(o.palette, rnd(), '#ddd') : null;
    const roofFill = o.roofPalette ? pick(o.roofPalette, rnd(), '#888') : o.roofColor;
    const roofStyle = roofFill ? paint(roofFill) : undefined;
    const roofTarget = roofFill ? L.midColor : L.mid;
    const body = (
      <rect key={`${k}w`} x={r1(x)} y={r1(top)} width={r1(w)} height={r1(base - top + 1)} style={wall ? paint(wall) : undefined} />
    );
    (wall ? L.midColor : L.mid).push(body);

    let gableTop = top;
    switch (o.roof) {
      case 'mansard': {
        roofTarget.push(
          <polygon key={`${k}r`} points={pts([[x, top], [x + 8, top - 16], [x + w - 8, top - 16], [x + w, top]])} style={roofStyle} />,
        );
        L.mid.push(<rect key={`${k}c`} x={r1(x + 10 + rnd() * (w - 26))} y={r1(top - 25)} width={7} height={10} />);
        for (let c = 1; c < 4; c += 2) addWindow(L.windows, rnd, x + (w * c) / 4 - 3, top - 11, 6, 7, 0.4);
        break;
      }
      case 'pitched':
        roofTarget.push(<polygon key={`${k}r`} points={pts([[x - 2, top], [x + w / 2, top - 12 - rnd() * 10], [x + w + 2, top]])} style={roofStyle} />);
        break;
      case 'low':
        roofTarget.push(<polygon key={`${k}r`} points={pts([[x - 3, top + 1], [x + w * 0.5, top - 9], [x + w + 3, top + 1]])} style={roofStyle} />);
        break;
      case 'flat':
        roofTarget.push(<rect key={`${k}r`} x={r1(x - 1.5)} y={r1(top - 4)} width={r1(w + 3)} height={4} style={roofStyle} />);
        break;
      case 'stepped': {
        gableTop = top - w * 0.6;
        (wall ? L.midColor : L.mid).push(<polygon key={`${k}g`} points={pts(steppedGable(x, w, top + 0.5, w * 0.6))} style={wall ? paint(wall) : undefined} />);
        break;
      }
      case 'timber': {
        const gh = w * (0.7 + rnd() * 0.2);
        gableTop = top - gh;
        roofTarget.push(<polygon key={`${k}r`} points={pts([[x - 4, top + 1], [x + w / 2, top - gh], [x + w + 4, top + 1]])} style={roofStyle} />);
        // Pignon enduit sous le toit
        (wall ? L.midColor : L.mid).push(
          <polygon key={`${k}g`} points={pts([[x + 4, top], [x + w / 2, top - gh + 8], [x + w - 4, top]])} style={wall ? paint(wall) : undefined} />,
        );
        addWindow(L.windows, rnd, x + w / 2 - 3, top - gh * 0.45, 6, 7, 0.5);
        break;
      }
      case 'creole': {
        roofTarget.push(
          <polygon key={`${k}r`} points={pts([[x - 6, top + 1], [x + 9, top - 12], [x + w - 9, top - 12], [x + w + 6, top + 1]])} style={roofStyle} />,
        );
        // Lambrequins : frise découpée sous l'avant-toit
        const zig: string[] = [`M${r1(x - 5)} ${r1(top + 1)}`];
        for (let zx = x - 5; zx < x + w + 4; zx += 4) zig.push(`l2 3l2 -3`);
        L.midColor.push(<path key={`${k}l`} d={zig.join('')} fill="none" stroke="#f6f1e6" strokeWidth={1.2} />);
        L.midColor.push(<rect key={`${k}v`} x={r1(x)} y={r1(base - 4)} width={r1(w)} height={4} style={paint('#f6f1e6')} opacity={0.8} />);
        break;
      }
    }

    // Colombages : poteaux, sablières et croix de Saint-André
    if (o.roof === 'timber' && o.timber) {
      const lines: string[] = [];
      for (const px of [x + 1.5, x + w / 2, x + w - 1.5]) lines.push(`M${r1(px)} ${r1(top)}V${base}`);
      for (let f = 0; f <= floors; f++) lines.push(`M${r1(x)} ${r1(top + f * o.fh)}H${r1(x + w)}`);
      for (let f = 0; f < floors; f++) {
        if (rnd() < 0.5) {
          const y0 = top + f * o.fh;
          lines.push(`M${r1(x + 1.5)} ${r1(y0)}L${r1(x + w / 2)} ${r1(y0 + o.fh)}M${r1(x + w / 2)} ${r1(y0)}L${r1(x + 1.5)} ${r1(y0 + o.fh)}`);
        }
      }
      lines.push(`M${r1(x + w / 2)} ${r1(gableTop + 4)}V${r1(top)}`);
      L.midColor.push(<path key={`${k}t`} d={lines.join('')} fill="none" stroke={o.timber} strokeWidth={1.5} />);
    }
    // Bandeaux de pierre (Lille)
    if (o.band) {
      for (let f = 1; f < floors; f++) {
        L.midColor.push(<rect key={`${k}b${f}`} x={r1(x)} y={r1(top + f * o.fh - 1.5)} width={r1(w)} height={1.6} style={paint(o.band)} />);
      }
    }

    const cols = Math.max(2, Math.floor((w - 6) / 14));
    const sp = w / cols;
    for (let c = 0; c < cols; c++) {
      for (let f = 0; f < floors; f++) {
        if (o.roof === 'timber' && c === Math.floor(cols / 2) && cols % 2 === 1) continue;
        addWindow(L.windows, rnd, x + sp * (c + 0.5) - 3, top + f * o.fh + o.fh * 0.25, 6, o.fh * 0.55, o.lit ?? 0.55);
      }
    }
    x += w + (o.gap ?? 0) * rnd();
  }
}

/** Pont de pierre : tablier percé d'arches (et d'oculi si demandé). */
function archBridge(x0: number, x1: number, top: number, span: number, rise: number, oculi: boolean): string {
  const parts = [`M${x0} ${top}H${x1}V${H}H${x0}Z`];
  const n = Math.floor((x1 - x0) / span);
  const pier = span * 0.24;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * span + pier / 2 + 4;
    const b = a + span - pier;
    const rx = (b - a) / 2;
    parts.push(`M${r1(a)} ${H}V${r1(H - 6)}A${r1(rx)} ${rise} 0 0 1 ${r1(b)} ${r1(H - 6)}V${H}Z`);
    if (oculi && i > 0) {
      const cx = a - pier / 2;
      const cy = top + (H - top) * 0.38;
      const rr = pier * 0.28;
      parts.push(`M${r1(cx - rr)} ${r1(cy)}a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(rr * 2)} 0a${r1(rr)} ${r1(rr)} 0 1 0 ${r1(-rr * 2)} 0Z`);
    }
  }
  return parts.join('');
}

// —— Les villes —————————————————————————————————————————————————————

function buildParis(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Tour Eiffel, au loin
  const ex = 250;
  const eb = HZ + 6;
  const et = 44;
  L.back.push(
    <g key="eiffel">
      <path
        d={`M${ex - 40} ${eb}Q${ex - 16} ${eb - 70} ${ex - 7} ${eb - 118}L${ex - 2.5} ${et + 16}L${ex + 2.5} ${et + 16}L${ex + 7} ${eb - 118}Q${ex + 16} ${eb - 70} ${ex + 40} ${eb}L${ex + 27} ${eb}Q${ex} ${eb - 52} ${ex - 27} ${eb}Z`}
      />
      <rect x={ex - 25} y={eb - 66} width={50} height={5} />
      <rect x={ex - 12} y={eb - 122} width={24} height={4} />
      <rect x={ex - 4} y={et + 12} width={8} height={5} />
      <rect x={ex - 0.8} y={et - 2} width={1.6} height={16} />
    </g>,
  );
  // Butte Montmartre et Sacré-Cœur
  const sx = 900;
  const st = 108;
  L.back.push(
    <g key="butte">
      <path d={`M770 ${GY}Q820 ${GY - 96} ${sx - 40} ${st + 14}Q${sx} ${st + 4} ${sx + 40} ${st + 14}Q980 ${GY - 96} 1030 ${GY}Z`} />
      <rect x={sx - 24} y={st - 16} width={48} height={28} />
      <path d={`M${sx - 15} ${st - 16}A15 24 0 0 1 ${sx + 15} ${st - 16}Z`} />
      <rect x={sx - 2} y={st - 48} width={4} height={10} />
      <circle cx={sx} cy={st - 49} r={2.2} />
      <path d={`M${sx - 26} ${st - 8}A8 12 0 0 1 ${sx - 10} ${st - 8}Z`} />
      <path d={`M${sx + 10} ${st - 8}A8 12 0 0 1 ${sx + 26} ${st - 8}Z`} />
      <rect x={sx + 28} y={st - 40} width={10} height={52} />
      <path d={`M${sx + 28} ${st - 40}A5 8 0 0 1 ${sx + 38} ${st - 40}Z`} />
    </g>,
  );
  for (let x = 380, i = 0; x < 700; x += 26 + rnd() * 40, i++) {
    const h = 30 + rnd() * 50;
    L.far.push(<rect key={`f${i}`} x={r1(x)} y={r1(HZ + 4 - h)} width={r1(14 + rnd() * 18)} height={r1(h)} />);
  }
  row(L, rnd, { x0: -12, x1: 1220, w: [72, 108], floors: [4, 6], fh: 12.5, roof: 'mansard', roofColor: '#8e9bb0', gap: 0 }, 'h');
  L.riverTop = 286;
  L.groundPath = `M-20 ${GY - 1}H1220V${H}H-20Z`;
  // Pont de pierre sur la Seine
  L.near.push(<path key="pont" d={archBridge(380, 860, 276, 80, 24, false)} fillRule="evenodd" />);
  L.near.push(<rect key="parapet" x={376} y={271} width={488} height={5} />);
  for (const lx of [430, 590, 750]) L.near.push(lamp(`pl${lx}`, lx, 272, L.windows));
  for (let x = 30, i = 0; x < 360; x += 70, i++) L.near.push(tree(`qt${i}`, x, GY + 10, 18, rnd));
  for (let x = 900, i = 0; x < 1200; x += 70, i++) L.near.push(tree(`qd${i}`, x, GY + 10, 18, rnd));
  L.extra.push(
    <g key="peniche" className="art-scene__barge">
      <g className="art-scene__silhouette" opacity={O_FORE}>
        <path d="M70 300H200L192 310H80Z" />
        <rect x={120} y={292} width={56} height={9} rx={2} />
      </g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={126 + i * 16} y={294} width={9} height={4} className="art-scene__light art-scene__light--always" />
      ))}
    </g>,
  );
  return L;
}

function buildMarseille(rnd: Rng): CityLayers {
  const L = emptyLayers();
  L.seaTop = SEA;
  // Falaises calcaires blanches des calanques
  const cliff: Pt[] = [[-20, SEA + 12]];
  for (let x = -20; x <= 340; x += 20) {
    const t = (x + 20) / 360;
    cliff.push([x, SEA - 40 * Math.sin(t * Math.PI) - 18 * Math.sin(t * 9) * (1 - t) - rnd() * 6]);
  }
  cliff.push([360, SEA + 12]);
  L.backColor.push(<polygon key="calanques" points={pts(cliff)} style={paint('#f3eee2')} />);
  for (let x = 20, i = 0; x < 320; x += 34 + rnd() * 20, i++) {
    L.backColor.push(<path key={`cr${i}`} d={`M${r1(x)} ${SEA - 30 + rnd() * 10}l${r1(4 - rnd() * 8)} 30`} stroke="#a99c82" strokeWidth={2} fill="none" />);
  }
  L.far.push(<path key="frioul" d={`M1010 ${SEA + 1}Q1060 ${SEA - 12} 1110 ${SEA - 4}Q1150 ${SEA - 14} 1190 ${SEA + 1}Z`} />);
  // Colline et Notre-Dame-de-la-Garde
  const gx = 910;
  const gt = 116;
  L.back.push(
    <g key="garde">
      <path d={`M730 ${GY}L790 ${gt + 64}L828 ${gt + 40}L846 ${gt + 44}L874 ${gt + 10}H${gx + 36}L978 ${gt + 30}L1004 ${gt + 26}L1046 ${gt + 70}L1110 ${GY}Z`} />
      <rect x={gx - 30} y={gt - 22} width={56} height={24} />
      <path d={`M${gx - 26} ${gt - 22}A10 12 0 0 1 ${gx - 6} ${gt - 22}Z`} />
      <rect x={gx + 4} y={gt - 70} width={16} height={50} />
      <rect x={gx + 1} y={gt - 78} width={22} height={9} />
    </g>,
  );
  L.backColor.push(
    <g key="bonne-mere" style={paint('#d9a93a')}>
      <ellipse cx={gx + 12} cy={gt - 86} rx={2.8} ry={7.5} />
      <circle cx={gx + 12} cy={gt - 95} r={2.4} />
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 1220,
      w: [40, 72],
      floors: [3, 5],
      fh: 13,
      roof: 'low',
      palette: ['#ead6b4', '#e3c69e', '#dab68f', '#efdfc3', '#e6cfae'],
      roofColor: '#c4664a',
      gap: 4,
      skip: [[990, 1130]],
    },
    'm',
  );
  // Fort Saint-Jean à l'entrée du port
  L.mid.push(
    <g key="fort">
      <rect x={990} y={GY - 34} width={140} height={34} />
      <rect x={1090} y={GY - 68} width={28} height={68} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1089 + i * 8} y={GY - 74} width={5} height={6} />
      ))}
    </g>,
  );
  L.groundPath = `M-20 ${GY - 1}H1220V${H}H-20Z`;
  L.riverTop = 284;
  // Voiliers du Vieux-Port, qui tanguent doucement
  const boats: ReactNode[] = [];
  for (let x = 40, i = 0; x < 1180; x += 56 + rnd() * 40, i++) {
    const y = 298 + rnd() * 12;
    const mh = 52 + rnd() * 34;
    boats.push(
      <g key={i} className="art-scene__boat" style={{ animationDelay: `${-r1(rnd() * 5)}s` }}>
        <path d={`M${r1(x - 17)} ${r1(y)}H${r1(x + 17)}L${r1(x + 12)} ${r1(y + 6)}H${r1(x - 12)}Z`} />
        <rect x={r1(x - 0.6)} y={r1(y - mh)} width={1.3} height={r1(mh)} />
        <rect x={r1(x - 0.5)} y={r1(y - 8)} width={r1(14)} height={1} />
      </g>,
    );
  }
  L.extra.push(
    <g key="voiliers" className="art-scene__silhouette" opacity={O_FORE}>
      {boats}
    </g>,
  );
  return L;
}

function buildLyon(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Part-Dieu : la tour « crayon » et sa voisine
  L.back.push(
    <g key="partdieu">
      <rect x={950} y={96} width={22} height={150} />
      <rect x={992} y={84} width={26} height={160} />
      <path d={`M992 84Q1005 64 1018 84Z`} />
    </g>,
  );
  L.backColor.push(<polygon key="crayon" points={pts([[950, 96], [961, 70], [972, 96]])} style={paint('#c9877a')} opacity={0.8} />);
  // Colline de Fourvière, basilique et tour métallique
  const fx = 300;
  const ft = 118;
  L.back.push(
    <g key="fourviere">
      <path d={`M40 ${GY}Q150 ${ft + 24} ${fx} ${ft}Q470 ${ft + 18} 580 ${GY}Z`} />
      <rect x={fx - 32} y={ft - 22} width={64} height={24} />
      <polygon points={pts([[fx - 14, ft - 22], [fx, ft - 34], [fx + 14, ft - 22]])} />
      {[fx - 34, fx + 24].map((x) => (
        <g key={x}>
          <rect x={x} y={ft - 46} width={10} height={46} />
          <rect x={x - 1} y={ft - 50} width={12} height={5} />
        </g>
      ))}
      {[fx - 20, fx + 12].map((x) => (
        <rect key={x} x={x} y={ft - 42} width={8} height={20} />
      ))}
      <polygon points={pts([[fx + 96, ft + 6], [fx + 108, ft + 6], [fx + 102.6, ft - 64], [fx + 101.4, ft - 64]])} />
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 1220,
      w: [46, 80],
      floors: [4, 5],
      fh: 13,
      roof: 'low',
      palette: ['#e3b18b', '#e9c99c', '#d99b7e', '#ecd4a9', '#e0a98f'],
      roofColor: '#b8634a',
      gap: 3,
    },
    'l',
  );
  L.riverTop = 286;
  // Presqu'île entre les deux fleuves, passerelle sur la Saône
  L.near.push(<polygon key="confluent" points={pts([[520, 285], [730, 285], [632, H], [612, H]])} />);
  L.near.push(<path key="passerelle" d={`M90 289Q275 266 470 289`} fill="none" strokeWidth={3} className="art-scene__stroke" />);
  L.near.push(<rect key="tablier" x={90} y={286} width={380} height={3} />);
  for (let x = 30, i = 0; x < 1200; x += 120, i++) {
    if (x > 480 && x < 760) continue;
    L.near.push(tree(`lt${i}`, x, GY + 12, 16, rnd));
  }
  return L;
}

function buildToulouse(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Clocher octogonal de Saint-Sernin, en brique
  const sx = 300;
  const tiers = [46, 40, 34, 28, 22];
  L.backColor.push(
    <g key="sernin" style={paint('#c77a5e')}>
      {tiers.map((tw, i) => (
        <rect key={i} x={sx - tw / 2} y={GY - 60 - (i + 1) * 22} width={tw} height={23} />
      ))}
      <polygon points={pts([[sx - 10, GY - 170], [sx, GY - 206], [sx + 10, GY - 170]])} />
    </g>,
  );
  L.backColor.push(
    <g key="sernin-baies" style={paint('#7a3f30')}>
      {tiers.map((tw, i) =>
        [-1, 1].map((s) => <rect key={`${i}${s}`} x={sx + s * tw * 0.22 - 2} y={GY - 60 - (i + 1) * 22 + 7} width={4} height={10} rx={2} />),
      )}
    </g>,
  );
  // Dôme de la Grave, vert-de-gris
  const dx = 880;
  L.backColor.push(
    <g key="grave">
      <rect x={dx - 26} y={GY - 112} width={52} height={60} style={paint('#c98068')} />
      <path d={`M${dx - 30} ${GY - 110}A30 36 0 0 1 ${dx + 30} ${GY - 110}Z`} style={paint('#8fb0a4')} />
      <rect x={dx - 4} y={GY - 156} width={8} height={12} style={paint('#8fb0a4')} />
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 1220,
      w: [44, 76],
      floors: [3, 4],
      fh: 13,
      roof: 'low',
      palette: ['#c8735c', '#d58c6e', '#bd6650', '#da9c80', '#cf7f63'],
      roofColor: '#a9533c',
      gap: 3,
    },
    't',
  );
  L.riverTop = 284;
  L.nearColor.push(<path key="pont-neuf" d={archBridge(160, 1060, 274, 128, 26, true)} fillRule="evenodd" style={paint('#bb6a50')} />);
  L.nearColor.push(<rect key="parapet" x={156} y={270} width={908} height={5} style={paint('#a95c45')} />);
  // Un avion très haut, et sa traînée
  L.extra.push(
    <g key="avion" className="art-scene__plane">
      <rect x={-240} y={57} width={226} height={1.6} rx={0.8} className="art-scene__contrail" />
      <g className="art-scene__silhouette" opacity={0.55}>
        <ellipse cx={0} cy={58} rx={13} ry={2} />
        <polygon points="-3,58 -9,52 -5,52 4,58" />
        <polygon points="-3,58 -9,64 -5,64 4,58" />
        <polygon points="-12,58 -15,53 -12,53 -9,58" />
      </g>
    </g>,
  );
  return L;
}

function buildNice(rnd: Rng): CityLayers {
  const L = emptyLayers();
  L.seaTop = SEA;
  // Alpes enneigées au fond
  L.snowRidge = ridge(rnd, SEA + 2, 8, 50, 120);
  L.far.push(<polygon key="alpes" points={pts(L.snowRidge)} />);
  // Colline du Château et ses pins parasols
  L.back.push(
    <g key="chateau">
      <path d={`M880 ${GY}Q930 ${GY - 110} 1040 ${GY - 118}Q1140 ${GY - 110} 1220 ${GY - 60}V${GY}Z`} />
      {[960, 1010, 1070, 1120].map((x, i) => (
        <g key={x}>
          <rect x={x - 1} y={GY - 116 + (i % 2) * 4} width={2} height={14} />
          <ellipse cx={x} cy={GY - 118 + (i % 2) * 4} rx={13} ry={5} />
        </g>
      ))}
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 900,
      w: [48, 80],
      floors: [5, 6],
      fh: 12,
      roof: 'flat',
      palette: ['#f0c9a5', '#e9b79a', '#f4ddb5', '#e6a88e', '#f2d4b8'],
      roofColor: '#efe4d2',
      gap: 2,
      skip: [[390, 470]],
    },
    'n',
  );
  // Façade Belle Époque et sa coupole rose
  L.midColor.push(
    <g key="coupole">
      <rect x={392} y={GY - 78} width={76} height={78} style={paint('#f3e3cc')} />
      <rect x={444} y={GY - 96} width={28} height={96} style={paint('#f3e3cc')} />
      <path d={`M442 ${GY - 96}A16 22 0 0 1 474 ${GY - 96}Z`} style={paint('#d98c8c')} />
      <rect x={456} y={GY - 124} width={4} height={8} style={paint('#d98c8c')} />
    </g>,
  );
  for (let c = 0; c < 4; c++) for (let f = 0; f < 5; f++) addWindow(L.windows, rnd, 398 + c * 12, GY - 72 + f * 13, 6, 7);
  // Promenade en arc le long de la baie
  L.groundPath = `M-20 ${GY - 1}H1220V${GY + 6}Q600 ${GY + 30} -20 ${GY + 6}Z`;
  L.nearColor.push(<path key="galets" d={`M-20 ${GY + 6}Q600 ${GY + 30} 1220 ${GY + 6}V${GY + 10}Q600 ${GY + 36} -20 ${GY + 10}Z`} style={paint('#e2dccd')} opacity={0.85} />);
  for (let x = 30, i = 0; x < 1200; x += 92, i++) {
    const t = (x + 20) / 1240;
    const y = GY + 4 + 2 * t * (1 - t) * 24;
    L.near.push(palm(`np${i}`, x, y, 46 + rnd() * 14, (rnd() - 0.5) * 16));
  }
  return L;
}

function buildNantes(rnd: Rng): CityLayers {
  const L = emptyLayers();
  L.back.push(<rect key="bretagne" x={600} y={98} width={28} height={150} />);
  // Grue Titan jaune sur le quai
  const cx = 960;
  L.backColor.push(
    <g key="titan" style={paint('#e3b23c')}>
      <rect x={cx - 6} y={100} width={12} height={GY - 100} />
      <rect x={cx - 80} y={92} width={200} height={8} />
      <rect x={cx - 98} y={90} width={20} height={16} />
      <rect x={cx - 4} y={98} width={18} height={14} />
      <polygon points={pts([[cx - 6, 92], [cx, 70], [cx + 6, 92]])} />
      <rect x={cx + 106} y={100} width={1.4} height={46} />
    </g>,
  );
  L.backColor.push(
    <path
      key="titan-treillis"
      d={Array.from({ length: 8 }, (_, i) => `M${cx - 6} ${108 + i * 20}L${cx + 6} ${118 + i * 20}`).join('') + `M${cx} 70L${cx - 70} 92M${cx} 70L${cx + 100} 92`}
      stroke="#9c7a24"
      strokeWidth={1}
      fill="none"
    />,
  );
  // Château des ducs : courtine et tours rondes
  L.mid.push(
    <g key="chateau">
      <rect x={250} y={GY - 96} width={170} height={50} />
      <polygon points={pts([[246, GY - 96], [262, GY - 122], [408, GY - 122], [424, GY - 96]])} />
      {[280, 320, 360].map((x) => (
        <polygon key={x} points={pts([[x, GY - 116], [x + 7, GY - 132], [x + 14, GY - 116]])} />
      ))}
      <rect x={196} y={GY - 50} width={290} height={50} />
      {[200, 290, 390, 480].map((x) => (
        <g key={x}>
          <rect x={x - 18} y={GY - 70} width={36} height={70} rx={4} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={x - 18 + k * 10} y={GY - 76} width={6} height={7} />
          ))}
        </g>
      ))}
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: 510,
      x1: 1220,
      w: [46, 76],
      floors: [3, 5],
      fh: 13,
      roof: 'mansard',
      palette: ['#ece5d6', '#e4dcc8', '#f1ebdd', '#e8e0cf'],
      roofColor: '#5d6878',
      gap: 3,
    },
    'n',
  );
  row(L, rnd, { x0: -10, x1: 180, w: [44, 70], floors: [3, 4], fh: 13, roof: 'mansard', palette: ['#ece5d6', '#e4dcc8'], roofColor: '#5d6878' }, 'o');
  L.riverTop = 284;
  for (let x = 40, i = 0; x < 1200; x += 140, i++) L.near.push(lamp(`nl${i}`, x, GY + 14, L.windows));
  const r2 = makeRng(808);
  L.sky.push(cloud('nc1', 620, 120, 1.4, r2, 45), cloud('nc2', 900, 150, 1.1, r2, 40), cloud('nc3', 90, 130, 1.2, r2, 55));
  return L;
}

function buildMontpellier(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Garrigue : collines basses, buissons et pins
  L.far.push(<polygon key="g1" points={pts(hills(HZ - 18, 14, 0.007, 2.2))} />);
  const scrub: ReactNode[] = [];
  for (let x = 0, i = 0; x < W; x += 9 + rnd() * 16, i++) {
    scrub.push(<circle key={i} cx={r1(x)} cy={r1(HZ - 6 - rnd() * 14)} r={r1(2 + rnd() * 3)} />);
  }
  L.back.push(<polygon key="g2" points={pts(hills(HZ + 4, 8, 0.011, 0.6))} />, <g key="garrigue">{scrub}</g>);
  // Aqueduc Saint-Clément à deux étages d'arcades
  const ax0 = 560;
  const ax1 = 1220;
  const low: string[] = [`M${ax0} ${GY - 92}H${ax1}V${GY}H${ax0}Z`];
  for (let x = ax0 + 8; x + 34 < ax1; x += 46) {
    low.push(`M${x} ${GY}V${GY - 44}A17 17 0 0 1 ${x + 34} ${GY - 44}V${GY}Z`);
  }
  for (let x = ax0 + 6; x + 12 < ax1; x += 23) {
    low.push(`M${x} ${GY - 72}V${GY - 80}A6 6 0 0 1 ${x + 12} ${GY - 80}V${GY - 72}Z`);
  }
  L.mid.push(<path key="aqueduc" d={low.join('')} fillRule="evenodd" />);
  // Château d'eau du Peyrou
  L.mid.push(
    <g key="peyrou">
      <rect x={516} y={GY - 120} width={52} height={40} />
      <rect x={510} y={GY - 124} width={64} height={5} />
      <path d={`M520 ${GY - 124}A22 14 0 0 1 564 ${GY - 124}Z`} />
      <rect x={520} y={GY - 80} width={44} height={80} />
    </g>,
  );
  // Arc de triomphe
  const ax = 300;
  L.midColor.push(
    <g key="arc" style={paint('#e6d8b8')}>
      <path d={`M${ax - 52} ${GY - 112}H${ax + 52}V${GY}H${ax - 52}ZM${ax - 18} ${GY}V${GY - 52}A18 20 0 0 1 ${ax + 18} ${GY - 52}V${GY}Z`} fillRule="evenodd" />
      <rect x={ax - 58} y={GY - 118} width={116} height={7} />
      <rect x={ax - 44} y={GY - 134} width={88} height={16} />
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 500,
      w: [42, 66],
      floors: [3, 4],
      fh: 13,
      roof: 'low',
      palette: ['#efe2c8', '#e8d6b4', '#f2e8d4'],
      roofColor: '#c4664a',
      gap: 2,
      skip: [[236, 364]],
    },
    'p',
  );
  L.near.push(<rect key="rail" x={-20} y={GY + 26} width={1240} height={1.5} />);
  for (let x = 20, i = 0; x < 1200; x += 160, i++) L.near.push(lamp(`ml${i}`, x, GY + 22, L.windows));
  // Tramway coloré, orné d'hirondelles
  L.extra.push(
    <g key="tram" className="art-scene__tram">
      <g className="art-scene__tinted">
        <rect x={0} y={GY + 2} width={210} height={22} rx={8} style={paint('#2f6fbf')} />
        {[30, 70, 110, 150, 185].map((x) => (
          <path key={x} d={`M${x} ${GY + 18}q4 -4 8 0q4 -4 8 0`} fill="none" stroke="#f4f1ea" strokeWidth={1.4} />
        ))}
      </g>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={14 + i * 27} y={GY + 6} width={18} height={7} rx={1.5} className="art-scene__light art-scene__light--always" />
      ))}
    </g>,
  );
  return L;
}

function buildStrasbourg(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Cathédrale : une seule flèche, au nord
  const cx = 760;
  const ft = GY - 132;
  const spire: Pt[] = [[cx - 38, ft - 40]];
  const steps = 6;
  for (let s = 0; s < steps; s++) {
    const half = 13 - s * 2;
    spire.push([cx - 25 - half, ft - 40 - s * 14], [cx - 25 - half, ft - 52 - s * 14], [cx - 25 - half + 2, ft - 54 - s * 14]);
  }
  spire.push([cx - 25, ft - 40 - steps * 14 - 26]);
  for (let s = steps - 1; s >= 0; s--) {
    const half = 13 - s * 2;
    spire.push([cx - 25 + half - 2, ft - 54 - s * 14], [cx - 25 + half, ft - 52 - s * 14], [cx - 25 + half, ft - 40 - s * 14]);
  }
  spire.push([cx - 12, ft - 40]);
  L.backColor.push(
    <g key="cathedrale" style={paint('#b9796f')}>
      <polygon points={pts([[cx + 40, GY - 96], [cx + 60, GY - 118], [cx + 200, GY - 118], [cx + 220, GY - 96]])} opacity={0.85} />
      <rect x={cx - 42} y={ft} width={84} height={GY - ft} />
      <rect x={cx - 40} y={ft - 40} width={30} height={42} />
      <rect x={cx + 14} y={ft - 8} width={28} height={10} />
      <polygon points={pts(spire)} />
    </g>,
  );
  L.backColor.push(
    <g key="rosace" fill="none" stroke="#7d4a43" strokeWidth={1.4}>
      <circle cx={cx} cy={ft + 30} r={13} />
      <path d={`M${cx - 13} ${ft + 30}H${cx + 13}M${cx} ${ft + 17}V${ft + 43}`} />
      <path d={`M${cx - 30} ${GY}V${GY - 40}L${cx - 22} ${GY - 52}L${cx - 14} ${GY - 40}V${GY}M${cx + 14} ${GY}V${GY - 40}L${cx + 22} ${GY - 52}L${cx + 30} ${GY - 40}V${GY}`} />
    </g>,
  );
  // Maisons à colombages de la Petite France
  const opts = {
    w: [40, 64] as const,
    floors: [3, 4] as const,
    fh: 13,
    roof: 'timber' as const,
    palette: ['#f2e6cf', '#e9d3b0', '#f0dcc0', '#e7c9a6', '#efe0c4'],
    roofColor: '#8e4e3e',
    timber: '#6b4a3a',
    gap: 2,
  };
  row(L, rnd, { ...opts, x0: -10, x1: 690 }, 's');
  row(L, rnd, { ...opts, x0: 840, x1: 1220 }, 'u');
  L.riverTop = 288;
  for (let x = 60, i = 0; x < 1200; x += 210, i++) L.near.push(lamp(`sl${i}`, x, GY + 20, L.windows));
  return L;
}

function buildBordeaux(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Coteaux de vignes au loin
  const vine = hills(HZ - 22, 12, 0.006, 0.8);
  L.backColor.push(<polygon key="coteaux" points={pts(vine)} style={paint('#7f9a68')} opacity={0.85} />);
  const rows: string[] = [];
  for (let x = 0; x < W; x += 11) rows.push(`M${x} ${HZ - 14}l${r1(14 - x * 0.012)} 22`);
  L.backColor.push(<path key="rangs" d={rows.join('')} stroke="#566f45" strokeWidth={1.2} opacity={0.7} fill="none" />);
  // Façades classiques en pierre blonde
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 1220,
      w: [90, 130],
      floors: [3, 3],
      fh: 16,
      roof: 'mansard',
      palette: ['#e4cf9e', '#dcc490', '#e8d6ac', '#e0c998'],
      roofColor: '#6a7384',
      gap: 0,
      skip: [[330, 470]],
    },
    'b',
  );
  // Pavillon central à fronton
  L.midColor.push(
    <g key="bourse" style={paint('#ead9b0')}>
      <rect x={330} y={GY - 66} width={140} height={66} />
      <polygon points={pts([[340, GY - 66], [400, GY - 92], [460, GY - 66]])} />
      <rect x={326} y={GY - 70} width={148} height={5} />
    </g>,
  );
  for (let c = 0; c < 7; c++) for (let f = 0; f < 3; f++) addWindow(L.windows, rnd, 340 + c * 18, GY - 58 + f * 18, 7, 11);
  L.riverTop = 282;
  // Pont levant à quatre pylônes
  const pyl = [700, 730, 1090, 1120];
  L.near.push(
    <g key="pont">
      <rect x={560} y={276} width={680} height={6} />
      {pyl.map((x) => (
        <polygon key={x} points={pts([[x - 5, H], [x + 5, H], [x + 3, 136], [x - 3, 136]])} />
      ))}
      <rect x={698} y={136} width={34} height={4} />
      <rect x={1088} y={136} width={34} height={4} />
    </g>,
  );
  L.near.push(<path key="cables" d={`M715 140L790 276M715 140L640 276M1105 140L1030 276M1105 140L1180 276`} fill="none" strokeWidth={1} className="art-scene__stroke" />);
  for (const x of [715, 1105]) L.windows.push({ x: x - 2, y: 130, w: 4, h: 4, lit: true, delay: 0.5, blink: true });
  return L;
}

function buildLille(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Beffroi en brique
  const bx = 760;
  L.backColor.push(
    <g key="beffroi" style={paint('#a65a45')}>
      <rect x={bx - 16} y={GY - 196} width={32} height={196} />
      <rect x={bx - 20} y={GY - 210} width={40} height={14} />
      <rect x={bx - 10} y={GY - 236} width={20} height={26} />
      <polygon points={pts([[bx - 12, GY - 236], [bx, GY - 262], [bx + 12, GY - 236]])} />
      <rect x={bx - 0.8} y={GY - 276} width={1.6} height={16} />
    </g>,
  );
  L.backColor.push(
    <g key="beffroi-detail" fill="none" stroke="#efe4d6" strokeWidth={1.2} opacity={0.75}>
      <circle cx={bx} cy={GY - 172} r={7} />
      <path d={`M${bx - 8} ${GY - 150}V${GY - 40}M${bx + 8} ${GY - 150}V${GY - 40}`} />
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 1220,
      w: [34, 54],
      floors: [3, 4],
      fh: 13,
      roof: 'stepped',
      palette: ['#a9523f', '#b3624b', '#9a4837', '#b8705a', '#a25844'],
      band: '#efe4d6',
      gap: 1,
      skip: [[720, 800]],
    },
    'f',
  );
  for (let x = 40, i = 0; x < 1200; x += 130, i++) L.near.push(lamp(`ll${i}`, x, GY + 20, L.windows));
  return L;
}

function buildRennes(rnd: Rng): CityLayers {
  const L = emptyLayers();
  // Verdure du Thabor en arrière-plan
  const greens: ReactNode[] = [];
  for (let x = -10, i = 0; x < W + 20; x += 30 + rnd() * 30, i++) {
    greens.push(<circle key={i} cx={r1(x)} cy={r1(GY - 70 - rnd() * 24)} r={r1(20 + rnd() * 16)} />);
  }
  L.backColor.push(
    <g key="thabor" style={paint('#6f9a6a')} opacity={0.7}>
      {greens}
    </g>,
  );
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 1220,
      w: [38, 58],
      floors: [3, 3],
      fh: 13,
      roof: 'timber',
      palette: ['#c9614f', '#5f86b5', '#d7a548', '#6e9e7f', '#b278a0', '#e2c9a0'],
      roofColor: '#4e5868',
      timber: '#3e3a3a',
      gap: 1,
      skip: [[540, 690]],
    },
    'r',
  );
  for (let x = 560, i = 0; x < 690; x += 44, i++) L.nearColor.push(<g key={`rt${i}`} style={paint('#557f52')}>{tree(`rt${i}`, x, GY + 14, 26, rnd)}</g>);
  for (let x = 20, i = 0; x < 1200; x += 190, i++) {
    if (x > 520 && x < 700) continue;
    L.nearColor.push(<g key={`rv${i}`} style={paint('#4f774c')}>{tree(`rv${i}`, x, GY + 16, 20, rnd)}</g>);
  }
  return L;
}

function buildSaintDenis(rnd: Rng): CityLayers {
  const L = emptyLayers();
  L.seaTop = SEA;
  // Remparts des cirques : crêtes vertes très escarpées
  // Pentes raides qui retombent vers l'océan à l'est
  const steep = (base: number, peaks: number, minH: number, maxH: number): Pt[] => {
    const xEnd = 760;
    const list = Array.from({ length: peaks }, (_, i) => ({
      c: -40 + ((xEnd + 40) * (i + 0.15 + rnd() * 0.7)) / peaks,
      h: minH + rnd() * (maxH - minH),
      s: 1.1 + rnd() * 0.9,
    }));
    const out: Pt[] = [[-20, H]];
    for (let x = -20; x <= xEnd + 260; x += 8) {
      let y = 0;
      for (const p of list) y = Math.max(y, p.h - Math.abs(x - p.c) * p.s);
      const fall = x > xEnd ? Math.max(0, 1 - (x - xEnd) / 260) : 1;
      out.push([x, base - (y * fall + rnd() * 5 * fall)]);
    }
    out.push([xEnd + 260, H]);
    return out;
  };
  const far = steep(SEA + 4, 6, 110, 176);
  const near = steep(SEA + 8, 7, 50, 110);
  L.backColor.push(
    <polygon key="cirque1" points={pts(far)} style={paint('#86a98a')} opacity={0.8} />,
    <polygon key="cirque2" points={pts(near)} style={paint('#4f7e57')} opacity={0.9} />,
  );
  // Nuages accrochés aux sommets
  const tops = [...far].filter(([x]) => x > 0 && x < 850).sort((a, b) => a[1] - b[1]);
  const chosen: Pt[] = [];
  for (const p of tops) {
    if (chosen.every((c) => Math.abs(c[0] - p[0]) > 160)) chosen.push(p);
    if (chosen.length === 3) break;
  }
  const r2 = makeRng(4242);
  chosen.forEach(([x, y], i) => L.sky.push(cloud(`sc${i}`, x, y + 6, 0.9, r2, 120)));
  row(
    L,
    rnd,
    {
      x0: -10,
      x1: 780,
      w: [50, 74],
      floors: [1, 1],
      fh: 26,
      roof: 'creole',
      palette: ['#e9a5a0', '#8cc7b5', '#f2d06b', '#9db9e3', '#f4f1e8', '#c7a3d6'],
      roofPalette: ['#b5483a', '#4f7f8f', '#b5483a', '#7a5a8f'],
      gap: 18,
      lit: 0.7,
    },
    'c',
  );
  L.groundPath = `M-20 ${GY - 2}L780 ${GY - 2}Q860 ${GY + 4} 900 ${H}L-20 ${H}Z`;
  for (const [i, x] of [40, 230, 470, 700, 820].entries()) L.near.push(palm(`sp${i}`, x, GY + 14 + (i % 2) * 8, 80 + rnd() * 30, (rnd() - 0.4) * 30));
  L.near.push(palm('spr', 1150, H + 4, 120, -26));
  return L;
}

const BUILDERS: Record<CityId, (rnd: Rng) => CityLayers> = {
  paris: buildParis,
  marseille: buildMarseille,
  lyon: buildLyon,
  toulouse: buildToulouse,
  nice: buildNice,
  nantes: buildNantes,
  montpellier: buildMontpellier,
  strasbourg: buildStrasbourg,
  bordeaux: buildBordeaux,
  lille: buildLille,
  rennes: buildRennes,
  'saint-denis-reunion': buildSaintDenis,
};

/** Pluie fine : deux tuiles de gouttes qui défilent en boucle. */
function Rain(props: { seed: number; count: number; drizzle: boolean }): JSX.Element {
  const drops = useMemo(() => {
    const rnd = makeRng(props.seed);
    return Array.from({ length: props.count }, () => ({ x: r1(rnd() * (W + 60)), y: r1(rnd() * 160), l: r1(6 + rnd() * 8) }));
  }, [props.seed, props.count]);
  const d = drops.map((p) => `M${p.x} ${p.y}l-2 ${p.l}`).join('');
  return (
    <g className={props.drizzle ? 'art-scene__rain art-scene__rain--drizzle' : 'art-scene__rain'}>
      <g className="art-scene__rain-fall">
        {[-160, 0, 160].map((dy) => (
          <path key={dy} d={d} transform={`translate(0 ${dy})`} />
        ))}
      </g>
    </g>
  );
}

export interface CitySceneProps {
  city: CityId;
  age: number;
  uid: string;
  sunX: number;
  backing: CSSProperties;
}

/** Décor complet d'une ville, posé sur le ciel commun de la scène. */
export function CityScene(props: CitySceneProps): JSX.Element {
  const { city, age, uid, sunX, backing } = props;
  const info = CITIES[city];
  const layers = useMemo(() => BUILDERS[city](makeRng(city.length * 7919 + city.charCodeAt(0))), [city]);
  const seaWaves = useMemo(() => (layers.seaTop === null ? [] : makeWaves(31, layers.seaTop, H, 26)), [layers.seaTop]);
  const riverWaves = useMemo(() => (layers.riverTop === null ? [] : makeWaves(17, layers.riverTop, H, 18)), [layers.riverTop]);
  const raining = info.weather === 'bruine' || (info.weather === 'averses' && Math.floor(age / 6) % 2 === 1);

  return (
    <g>
      <defs>
        {layers.snowRidge ? (
          <clipPath id={`${uid}-csnow`}>
            <polygon points={pts(layers.snowRidge)} />
          </clipPath>
        ) : null}
      </defs>
      <rect width={W} height={H} className="art-scene__tint" style={paint(info.tint)} opacity={info.tintOpacity} />
      <g className="art-scene__clouds">{layers.sky}</g>

      <g className="art-scene__silhouette" opacity={O_FAR}>
        {layers.far}
      </g>
      {layers.snowRidge ? (
        <g clipPath={`url(#${uid}-csnow)`} className="art-scene__snow">
          <rect x={0} y={0} width={W} height={SEA - 70} />
        </g>
      ) : null}
      <g style={backing}>{layers.back}</g>
      <g className="art-scene__silhouette" opacity={O_BACK}>
        {layers.back}
      </g>
      <g className="art-scene__tinted art-scene__tinted--far">{layers.backColor}</g>

      {layers.seaTop !== null ? (
        <g>
          <rect x={0} y={layers.seaTop} width={W} height={H - layers.seaTop} className="art-scene__sea" />
          <rect x={0} y={layers.seaTop} width={W} height={1.4} className="art-scene__sea-line" />
          <g className="art-scene__glint-wrap" style={{ transform: `translateX(${sunX}px)` }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={-(30 - i * 3)} y={(layers.seaTop ?? SEA) + 4 + i * 9} width={60 - i * 6} height={1.6} rx={0.8} className="art-scene__glint" />
            ))}
          </g>
          <WaveLines waves={seaWaves} />
        </g>
      ) : null}

      <g style={backing}>{layers.mid}</g>
      <g className="art-scene__silhouette" opacity={O_MID}>
        {layers.mid}
      </g>
      <g className="art-scene__tinted">{layers.midColor}</g>
      <WindowsLayer windows={layers.windows} />

      <path d={layers.groundPath} style={backing} />
      <path d={layers.groundPath} className="art-scene__silhouette" opacity={O_NEAR} />
      {layers.riverTop !== null ? (
        <g>
          <rect x={-20} y={layers.riverTop} width={W + 40} height={H - layers.riverTop} className="art-scene__sea" />
          <rect x={-20} y={layers.riverTop} width={W + 40} height={1.2} className="art-scene__sea-line" />
          <WaveLines waves={riverWaves} />
        </g>
      ) : null}
      <g className="art-scene__silhouette" opacity={O_FORE}>
        {layers.near}
      </g>
      <g className="art-scene__tinted">{layers.nearColor}</g>
      {layers.extra}
      {info.weather === 'brume' ? (
        <g className="art-scene__mist">
          {[196, 226, 252].map((y, i) => (
            <ellipse key={y} cx={300 + i * 300} cy={y} rx={560} ry={12 + i * 3} className="art-scene__mist-band" style={{ animationDelay: `${-i * 9}s` }} />
          ))}
        </g>
      ) : null}
      {raining ? <Rain seed={city.length} count={info.weather === 'bruine' ? 110 : 150} drizzle={info.weather === 'bruine'} /> : null}
    </g>
  );
}

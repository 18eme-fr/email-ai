import { useMemo, type ReactNode } from 'react';
import './art.css';
import { makeRng, pts, r1, useSvgId, type Pt } from './artUtils';
import { CITIES, CityScene, type CityId } from './cities';
import {
  GY,
  H,
  HZ,
  O_BACK,
  O_FAR,
  O_FORE,
  O_MID,
  O_NEAR,
  PHASES,
  PHASE_LABEL,
  SEA,
  W,
  WaveLines,
  WindowsLayer,
  cloud,
  hills,
  lamp,
  makeWaves,
  palm,
  phaseFor,
  poplar,
  ridge,
  tree,
  type Phase,
  type Rng,
  type Win,
} from './sceneKit';

export type { CityId } from './cities';

export type SceneTerritory = 'metropole' | 'ville_moyenne' | 'petite_ville' | 'rural';
export type SceneLandscape = 'plaine' | 'montagne' | 'littoral' | 'tropical';

export interface SceneProps {
  territory: SceneTerritory;
  landscape: SceneLandscape;
  age: number;
  paused?: boolean;
  height?: number;
  /** Mode « Villes » : remplace le décor générique par la silhouette d'une grande ville. */
  city?: CityId;
}

/** Position du soleil (et de la lune la nuit) selon le moment. */
const SUN: Record<Phase, Pt> = {
  aube: [230, 214],
  matin: [330, 118],
  jour: [640, 60],
  dore: [905, 138],
  crepuscule: [1010, 226],
  nuit: [1060, 400],
};

const TERRITORY_LABEL: Record<SceneTerritory, string> = {
  metropole: 'Une grande ville',
  ville_moyenne: 'Une ville moyenne',
  petite_ville: 'Une petite ville',
  rural: 'Un village à la campagne',
};

const LANDSCAPE_LABEL: Record<SceneLandscape, string> = {
  plaine: 'dans la plaine',
  montagne: 'au pied des montagnes',
  littoral: 'au bord de la mer',
  tropical: "entre volcan et océan Indien",
};

interface Built {
  far: ReactNode[];
  mid: ReactNode[];
  details: ReactNode[];
  near: ReactNode[];
  windows: Win[];
  /** Sous le plan médian (route rurale). */
  under: ReactNode[];
  /** Au-dessus du premier plan (métro). */
  extra: ReactNode[];
}


function emptyBuilt(): Built {
  return { far: [], mid: [], details: [], near: [], windows: [], under: [], extra: [] };
}

function addWindow(b: Built, rnd: Rng, x: number, y: number, w: number, h: number, litRate = 0.62): void {
  b.windows.push({ x, y, w, h, lit: rnd() < litRate, delay: r1(rnd() * 2.4), blink: rnd() < 0.06 });
}

/** Silhouettes de décor (sans ciel) d'un paysage générique. */
interface Land {
  back: ReactNode[];
  front: ReactNode[];
  extra: ReactNode[];
  snowRidge: Pt[] | null;
}

// —— Territoires ———————————————————————————————————————————————

function buildMetropole(x0: number, x1: number, rnd: Rng): Built {
  const b = emptyBuilt();
  // Tours lointaines du quartier d'affaires
  for (let x = x0, i = 0; x < x1; i++) {
    const w = 16 + rnd() * 28;
    const h = 60 + rnd() * 115;
    if (rnd() < 0.55) {
      b.far.push(<rect key={`t${i}`} x={r1(x)} y={r1(HZ + 14 - h)} width={r1(w)} height={r1(h)} />);
      if (rnd() < 0.3) b.far.push(<rect key={`a${i}`} x={r1(x + w / 2 - 1)} y={r1(HZ + 14 - h - 18)} width={2} height={18} />);
    }
    x += w + 6 + rnd() * 46;
  }
  // Immeubles haussmanniens : façades, combles en mansarde, cheminées
  const fh = 14.5;
  for (let x = x0 - 12, i = 0; x < x1; i++) {
    const w = 74 + rnd() * 40;
    const floors = rnd() < 0.4 ? 6 : 5;
    const top = GY - floors * fh;
    const roofH = 17;
    b.mid.push(
      <g key={`h${i}`}>
        <rect x={r1(x)} y={r1(top)} width={r1(w)} height={r1(GY - top)} />
        <polygon points={pts([[x, top], [x + 9, top - roofH], [x + w - 9, top - roofH], [x + w, top]])} />
        {Array.from({ length: 2 + Math.floor(rnd() * 2) }, (_, c) => (
          <rect key={c} x={r1(x + 14 + c * (w - 34) / 2 + rnd() * 6)} y={r1(top - roofH - 9)} width={7} height={10} />
        ))}
      </g>,
    );
    const cols = Math.max(3, Math.floor((w - 8) / 15));
    const sp = w / cols;
    for (let c = 0; c < cols; c++) {
      const wx = x + sp * (c + 0.5) - 3;
      // Lucarnes
      if (c % 2 === 1) addWindow(b, rnd, wx, top - roofH + 6, 6, 7, 0.4);
      for (let f = 0; f < floors - 1; f++) addWindow(b, rnd, wx, top + f * fh + 3, 6, 9.5);
    }
    // Rez-de-chaussée commerçant
    b.windows.push({ x: x + 5, y: GY - 11, w: w - 10, h: 8, lit: rnd() < 0.7, delay: 0.1, blink: false });
    // Balcons filants aux 2e et dernier étages
    b.details.push(
      <rect key={`b${i}a`} x={r1(x + 1)} y={r1(top + fh * 2 - 1.5)} width={r1(w - 2)} height={1.4} />,
      <rect key={`b${i}b`} x={r1(x + 1)} y={r1(top + fh - 1.5)} width={r1(w - 2)} height={1.4} />,
      <rect key={`b${i}c`} x={r1(x + w - 0.6)} y={r1(top)} width={1.2} height={r1(GY - top)} />,
    );
    x += w + (rnd() < 0.25 ? 16 : 0);
  }
  // Métro aérien sur viaduc
  const deckY = GY - 22;
  b.near.push(<rect key="deck" x={x0} y={deckY} width={x1 - x0} height={6} />);
  for (let px = x0 + 10, i = 0; px < x1; px += 66, i++) {
    b.near.push(
      <g key={`p${i}`}>
        <rect x={px} y={deckY + 6} width={8} height={GY - deckY} />
        <path d={`M${px + 8} ${deckY + 6}L${px + 8} ${deckY + 16}Q${px + 9} ${deckY + 7} ${px + 22} ${deckY + 6}Z`} />
        <path d={`M${px} ${deckY + 6}L${px} ${deckY + 16}Q${px - 1} ${deckY + 7} ${px - 14} ${deckY + 6}Z`} />
      </g>,
    );
  }
  const cars = Array.from({ length: 4 }, (_, i) => i);
  b.extra.push(
    <g key="train" className="art-scene__train">
      <g className="art-scene__silhouette" opacity={O_NEAR}>
        {cars.map((i) => (
          <rect key={i} x={i * 60} y={deckY - 15} width={56} height={15} rx={3} />
        ))}
      </g>
      {cars.map((i) =>
        [0, 1, 2, 3].map((j) => (
          <rect key={`${i}-${j}`} x={i * 60 + 6 + j * 12} y={deckY - 12} width={8} height={5} className="art-scene__light art-scene__light--always" />
        )),
      )}
    </g>,
  );
  for (let x = x0 + 40, i = 0; x < x1 - 20; x += 120 + rnd() * 60, i++) {
    b.near.push(i % 2 === 0 ? tree(`tr${i}`, x, GY + 6, 22, rnd) : lamp(`l${i}`, x, GY + 6, b.windows));
  }
  return b;
}

function buildVilleMoyenne(x0: number, x1: number, rnd: Rng): Built {
  const b = emptyBuilt();
  const span = x1 - x0;
  const churchX = x0 + span * 0.3;
  const gareX = x0 + span * 0.64;
  const fh = 14;
  let churchDone = false;
  let gareDone = false;
  for (let x = x0 - 10, i = 0; x < x1; i++) {
    if (!churchDone && x > churchX - 60) {
      const c = x + 50;
      // Église : nef, clocher et flèche
      b.mid.push(
        <g key="eglise">
          <rect x={c - 50} y={GY - 52} width={100} height={52} />
          <polygon points={pts([[c - 54, GY - 52], [c, GY - 78], [c + 54, GY - 52]])} />
          <rect x={c - 15} y={GY - 120} width={30} height={120} />
          <polygon points={pts([[c - 18, GY - 120], [c, GY - 184], [c + 18, GY - 120]])} />
          <rect x={c - 0.8} y={GY - 196} width={1.6} height={14} />
        </g>,
      );
      b.details.push(<circle key="horloge" cx={c} cy={GY - 104} r={5} />);
      b.windows.push(
        { x: c - 7, y: GY - 92, w: 4, h: 12, lit: false, delay: 0, blink: false },
        { x: c + 3, y: GY - 92, w: 4, h: 12, lit: false, delay: 0, blink: false },
        { x: c - 3, y: GY - 36, w: 6, h: 18, lit: true, delay: 1.2, blink: false },
      );
      x += 104;
      churchDone = true;
      continue;
    }
    if (!gareDone && x > gareX - 40) {
      const g = x + 20;
      // Gare : bâtiment voyageurs, pavillon central et marquise
      b.mid.push(
        <g key="gare">
          <rect x={g} y={GY - 40} width={180} height={40} />
          <polygon points={pts([[g - 4, GY - 40], [g + 10, GY - 50], [g + 170, GY - 50], [g + 184, GY - 40]])} />
          <rect x={g + 64} y={GY - 64} width={52} height={64} />
          <polygon points={pts([[g + 60, GY - 64], [g + 74, GY - 80], [g + 106, GY - 80], [g + 120, GY - 64]])} />
        </g>,
      );
      b.details.push(<circle key="horloge-gare" cx={g + 90} cy={GY - 54} r={5} />);
      for (let k = 0; k < 9; k++) {
        if (k === 3 || k === 4 || k === 5) continue;
        addWindow(b, rnd, g + 10 + k * 19, GY - 32, 8, 16, 0.8);
      }
      addWindow(b, rnd, g + 72, GY - 40, 10, 26, 1);
      addWindow(b, rnd, g + 98, GY - 40, 10, 26, 1);
      b.near.push(<rect key="marquise" x={g - 16} y={GY - 20} width={212} height={4} />);
      x += 220;
      gareDone = true;
      continue;
    }
    const w = 44 + rnd() * 40;
    const floors = 3 + Math.floor(rnd() * 2);
    const top = GY - floors * fh;
    const pitched = rnd() < 0.65;
    b.mid.push(
      <g key={`m${i}`}>
        <rect x={r1(x)} y={top} width={r1(w)} height={GY - top} />
        {pitched ? (
          <polygon points={pts([[x - 2, top], [x + w / 2, top - 14 - rnd() * 6], [x + w + 2, top]])} />
        ) : (
          <rect x={r1(x - 1)} y={top - 3} width={r1(w + 2)} height={3} />
        )}
      </g>,
    );
    const cols = Math.max(2, Math.floor(w / 15));
    for (let c = 0; c < cols; c++) {
      for (let f = 0; f < floors; f++) addWindow(b, rnd, x + (w / cols) * (c + 0.5) - 3, top + f * fh + 3.5, 6, 8, 0.55);
    }
    x += w + 2 + rnd() * 10;
  }
  // Voie ferrée et poteaux caténaires
  b.details.push(
    <rect key="rail1" x={x0} y={GY + 9} width={x1 - x0} height={1.2} />,
    <rect key="rail2" x={x0} y={GY + 14} width={x1 - x0} height={1.4} />,
  );
  for (let x = x0 + 30, i = 0; x < x1; x += 96, i++) {
    b.near.push(
      <g key={`cat${i}`}>
        <rect x={x} y={GY - 36} width={2.4} height={52} />
        <rect x={x - 2} y={GY - 34} width={16} height={2} />
      </g>,
    );
  }
  b.near.push(<rect key="fil" x={x0} y={GY - 30} width={x1 - x0} height={0.8} />);
  for (let x = x0 + 70, i = 0; x < x1; x += 150 + rnd() * 90, i++) {
    b.near.push(i % 3 === 1 ? poplar(`pp${i}`, x, GY + 22, 52) : tree(`tr${i}`, x, GY + 22, 20 + rnd() * 6, rnd));
  }
  return b;
}

function buildPetiteVille(x0: number, x1: number, rnd: Rng): Built {
  const b = emptyBuilt();
  const span = x1 - x0;
  const hx = x0 + span * 0.52;
  // Clocher en arrière-plan
  const cx = x0 + span * 0.2;
  b.far.push(
    <g key="clocher">
      <rect x={cx - 13} y={GY - 112} width={26} height={112} />
      <polygon points={pts([[cx - 16, GY - 112], [cx, GY - 146], [cx + 16, GY - 112]])} />
    </g>,
  );
  const fh = 14;
  for (let x = x0 - 10, i = 0; x < x1; i++) {
    if (x > hx - 120 && x < hx + 100) {
      x = hx + 100;
      continue;
    }
    const w = 34 + rnd() * 30;
    const floors = 2 + Math.floor(rnd() * 2);
    const top = GY - floors * fh - 4;
    const roofH = 16 + rnd() * 12;
    b.mid.push(
      <g key={`m${i}`}>
        <rect x={r1(x)} y={r1(top)} width={r1(w)} height={r1(GY - top)} />
        <polygon points={pts([[x - 3, top], [x + w / 2, top - roofH], [x + w + 3, top]])} />
        {rnd() < 0.5 ? <rect x={r1(x + w * 0.68)} y={r1(top - roofH * 0.8)} width={5} height={r1(roofH * 0.6)} /> : null}
      </g>,
    );
    const cols = w > 48 ? 3 : 2;
    for (let c = 0; c < cols; c++) {
      for (let f = 0; f < floors; f++) addWindow(b, rnd, x + (w / cols) * (c + 0.5) - 3, top + f * fh + 5, 6, 8, 0.5);
    }
    x += w + 1 + rnd() * 6;
  }
  // Halle de marché sur piliers
  b.mid.push(
    <g key="halle">
      <polygon points={pts([[hx - 100, GY - 38], [hx - 70, GY - 74], [hx + 70, GY - 74], [hx + 100, GY - 38]])} />
      <rect x={hx - 102} y={GY - 40} width={204} height={4} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={hx - 92 + i * 26} y={GY - 38} width={5} height={38} />
      ))}
    </g>,
  );
  b.windows.push({ x: hx - 6, y: GY - 66, w: 12, h: 8, lit: false, delay: 0, blink: false });
  b.details.push(<rect key="halle-ombre" x={hx - 96} y={GY - 36} width={192} height={5} />);
  // Fontaine et platanes de la place
  b.near.push(
    <g key="fontaine">
      <ellipse cx={hx} cy={GY + 12} rx={22} ry={4} />
      <rect x={hx - 18} y={GY + 4} width={36} height={8} />
      <rect x={hx - 2} y={GY - 12} width={4} height={16} />
      <ellipse cx={hx} cy={GY - 12} rx={8} ry={2} />
    </g>,
  );
  for (let x = x0 + 50, i = 0; x < x1; x += 110 + rnd() * 50, i++) {
    if (Math.abs(x - hx) < 40) continue;
    b.near.push(tree(`pl${i}`, x, GY + 18, 26 + rnd() * 6, rnd));
  }
  for (let x = x0 + 20, i = 0; x < x1; x += 180, i++) b.near.push(lamp(`l${i}`, x + 70, GY + 18, b.windows));
  return b;
}

function buildRural(x0: number, x1: number, rnd: Rng): Built {
  const b = emptyBuilt();
  const vx = 640;
  const vy = HZ - 70;
  // Bandes de champs en perspective, découpées en parcelles convergentes
  const rows = [HZ - 2, HZ + 5, HZ + 14, HZ + 27, HZ + 45, HZ + 68, H + 4];
  const dividers: number[] = [];
  for (let x = -900; x < 2200; x += 160 + rnd() * 240) dividers.push(x);
  const atY = (xb: number, y: number): number => vx + (xb - vx) * ((y - vy) / (H + 4 - vy));
  for (let ri = 0; ri < rows.length - 1; ri++) {
    const y0 = rows[ri] ?? HZ;
    const y1 = rows[ri + 1] ?? H;
    for (let di = 0; di < dividers.length - 1; di++) {
      const a = dividers[di] ?? 0;
      const c = dividers[di + 1] ?? 0;
      const quad: Pt[] = [[atY(a, y0), y0], [atY(c, y0), y0], [atY(c, y1), y1], [atY(a, y1), y1]];
      const op = r1(0.12 + rnd() * 0.26);
      b.far.push(<polygon key={`f${ri}-${di}`} points={pts(quad)} opacity={op} />);
      // Sillons dans certaines parcelles
      if (rnd() < 0.45 && ri > 1) {
        for (let s = 1; s < 4; s++) {
          const t = s / 4;
          const xs = a + (c - a) * t;
          b.details.push(
            <line key={`s${ri}-${di}-${s}`} x1={r1(atY(xs, y0))} y1={y0} x2={r1(atY(xs, y1))} y2={y1} className="art-scene__furrow" />,
          );
        }
      }
    }
    // Haies le long des limites
    if (ri > 0 && ri < rows.length - 2) {
      const rr = 1.4 + ri * 0.9;
      for (let x = x0 + rnd() * 60, k = 0; x < x1; k++) {
        const len = 50 + rnd() * 150;
        const hh = rr * 1.5;
        b.mid.push(
          <g key={`hg${ri}-${k}`}>
            <rect x={r1(x)} y={r1(y0 - hh)} width={r1(len)} height={r1(hh + 0.6)} rx={r1(hh / 2)} />
            {Array.from({ length: Math.ceil(len / 40) }, (_, j) => (
              <circle key={j} cx={r1(x + 10 + j * 40 + rnd() * 20)} cy={r1(y0 - hh)} r={r1(rr * (0.9 + rnd() * 0.9))} />
            ))}
          </g>,
        );
        x += len + 30 + rnd() * 140;
      }
    }
  }
  // Route sinueuse jusqu'à la ferme
  b.under.push(
    <path
      key="route"
      d={`M560 ${H + 2}C590 ${H - 30} 690 ${HZ + 40} 716 ${HZ + 6}L722 ${HZ + 6}C712 ${HZ + 40} 650 ${H - 30} 660 ${H + 2}Z`}
      className="art-scene__road"
    />,
  );
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const x = 690 - t * t * 220 + 60 * t;
    const y = HZ + 8 + t * t * 96;
    const h = 8 + t * t * 38;
    b.near.push(<rect key={`po${i}`} x={r1(x)} y={r1(y - h)} width={r1(1 + t * 1.6)} height={r1(h)} />);
  }
  // Ferme : logis, grange, silo
  const fx = 740;
  const fy = HZ + 6;
  b.mid.push(
    <g key="ferme">
      <rect x={fx} y={fy - 18} width={34} height={18} />
      <polygon points={pts([[fx - 2, fy - 18], [fx + 17, fy - 29], [fx + 36, fy - 18]])} />
      <rect x={fx + 40} y={fy - 22} width={56} height={22} />
      <polygon points={pts([[fx + 37, fy - 22], [fx + 50, fy - 36], [fx + 86, fy - 36], [fx + 99, fy - 22]])} />
      <rect x={fx + 102} y={fy - 40} width={11} height={40} />
      <ellipse cx={fx + 107.5} cy={fy - 40} rx={5.5} ry={3.5} />
    </g>,
  );
  addWindow(b, rnd, fx + 7, fy - 13, 4, 5, 1);
  addWindow(b, rnd, fx + 22, fy - 13, 4, 5, 1);
  b.near.push(tree('tf1', fx - 14, fy + 2, 14, rnd), tree('tf2', fx + 126, fy + 2, 12, rnd), poplar('pf', fx + 140, fy + 2, 34));
  // Grands arbres du premier plan
  b.near.push(tree('tg1', x0 + 60, H - 6, 44, rnd), tree('tg2', x0 + 150, H - 2, 30, rnd));
  if (x1 > 1000) b.near.push(tree('tg3', x1 - 70, H - 4, 40, rnd));
  return b;
}

// —— Paysages ———————————————————————————————————————————————————

// —— Paysages génériques ————————————————————————————————————————————

function buildLand(landscape: SceneLandscape, uid: string): Land {
  const rnd = makeRng(landscape.length * 131 + 7);
  const back: ReactNode[] = [];
  const front: ReactNode[] = [];
  const extra: ReactNode[] = [];
  let snowRidge: Pt[] | null = null;
  if (landscape === 'montagne') {
    snowRidge = ridge(rnd, HZ + 10, 7, 70, 160);
    back.push(<polygon key="r1" points={pts(snowRidge)} opacity={O_FAR} />);
    front.push(<polygon key="r2" points={pts(ridge(rnd, HZ + 18, 9, 30, 82))} />);
  } else if (landscape === 'plaine') {
    back.push(<polygon key="h1" points={pts(hills(HZ - 4, 9, 0.006, 1.2))} opacity={O_FAR} />);
    front.push(<polygon key="h2" points={pts(hills(HZ + 6, 7, 0.009, 3.1))} />);
    for (let x = 20, i = 0; x < W; x += 34 + rnd() * 60, i++) {
      front.push(poplar(`pt${i}`, x, HZ + 8 - rnd() * 6, 12 + rnd() * 10));
    }
  } else if (landscape === 'littoral') {
    back.push(<polygon key="cote" points={pts(hills(SEA + 2, 8, 0.01, 0.4).map(([x, y]) => [x * 0.5, y] as Pt))} opacity={O_FAR} />);
    // Cap rocheux et phare
    const lx = 1092;
    const ly = 214;
    extra.push(
      <g key="cap" className="art-scene__silhouette">
        <path d={`M900 ${H}L940 252Q990 214 1050 ${ly}L1220 210L1220 ${H}Z`} opacity={O_NEAR} />
        <g opacity={O_NEAR}>
          <polygon points={pts([[lx - 11, ly], [lx + 11, ly], [lx + 7, ly - 72], [lx - 7, ly - 72]])} />
          <rect x={lx - 11} y={ly - 76} width={22} height={4} />
          <rect x={lx - 6} y={ly - 90} width={12} height={14} />
          <polygon points={pts([[lx - 8, ly - 90], [lx, ly - 99], [lx + 8, ly - 90]])} />
          <rect x={lx - 34} y={ly - 14} width={22} height={14} />
          <polygon points={pts([[lx - 36, ly - 14], [lx - 23, ly - 24], [lx - 10, ly - 14]])} />
        </g>
        <rect x={lx - 9} y={ly - 54} width={16} height={5} className="art-scene__band" />
        <rect x={lx - 8} y={ly - 30} width={17} height={5} className="art-scene__band" />
        <rect x={lx - 4} y={ly - 88} width={8} height={10} className="art-scene__light art-scene__light--always" />
        <polygon
          points={pts([[lx, ly - 83], [lx - 420, ly - 130], [lx - 420, ly - 40]])}
          className="art-scene__beam"
          style={{ fill: `url(#${uid}-beam)` }}
        />
      </g>,
    );
  } else {
    // Volcan au cratère fumant, massif plus lointain
    back.push(<polygon key="massif" points={pts(ridge(rnd, SEA + 4, 4, 60, 120).map(([x, y]) => [x * 0.6 + 520, y] as Pt))} opacity={O_FAR} />);
    const vc = 340;
    const top = 88;
    const half = 420;
    const cone: Pt[] = [[vc - half, SEA + 6]];
    for (let x = vc - half; x <= vc + half; x += 12) {
      const d = Math.abs(x - vc);
      const y = d < 26 ? top + 5 - (d / 26) * 5 : top + (SEA + 6 - top) * Math.pow((d - 26) / (half - 26), 0.62);
      cone.push([x, y]);
    }
    cone.push([vc + half, SEA + 6]);
    front.push(<polygon key="volcan" points={pts(cone)} />);
    extra.push(
      <g key="fumee" transform={`translate(${vc} ${top - 4})`}>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={i * 9 - 8} cy={-i * 14} r={8 + i * 5} className="art-scene__smoke" style={{ animationDelay: `${-i * 3}s` }} />
        ))}
      </g>,
    );
    // Rivage de sable et palmiers
    extra.push(
      <g key="rivage" className="art-scene__silhouette">
        <path d={`M930 ${H}Q1010 280 1220 274L1220 ${H}Z`} opacity={O_NEAR} />
        <g opacity={O_FORE}>
          {palm('pa1', 1030, 290, 92, 26)}
          {palm('pa2', 1112, 286, 118, -18)}
          {palm('pa3', 1176, 290, 76, 22)}
        </g>
      </g>,
    );
  }
  return { back, front, extra, snowRidge };
}

function buildTerritory(territory: SceneTerritory, landscape: SceneLandscape, coastal: boolean): Built {
  const x1 = coastal ? 830 : W + 20;
  const rnd = makeRng(territory.length * 977 + landscape.length * 31);
  switch (territory) {
    case 'metropole':
      return buildMetropole(-10, x1, rnd);
    case 'ville_moyenne':
      return buildVilleMoyenne(-10, x1, rnd);
    case 'petite_ville':
      return buildPetiteVille(-10, x1, rnd);
    case 'rural':
      return buildRural(-10, x1, rnd);
  }
}

/** Décor générique : territoire posé sur son paysage. */
function GenericLayers(props: { territory: SceneTerritory; landscape: SceneLandscape; uid: string; sunX: number; backing: { fill: string } }): JSX.Element {
  const { territory, landscape, uid, sunX, backing } = props;
  const coastal = landscape === 'littoral' || landscape === 'tropical';
  const rural = territory === 'rural';
  const land = useMemo(() => buildLand(landscape, uid), [landscape, uid]);
  const built = useMemo(() => buildTerritory(territory, landscape, coastal), [territory, landscape, coastal]);
  const waves = useMemo(() => (coastal ? makeWaves(55, SEA, H, 22) : []), [coastal]);
  const groundPath = coastal
    ? `M-20 ${GY - 2}L780 ${GY - 2}Q860 ${GY + 4} 900 ${H}L-20 ${H}Z`
    : `M-20 ${GY - 1}Q300 ${GY - 5} 600 ${GY - 1}T1220 ${GY - 2}L1220 ${H}L-20 ${H}Z`;

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-land`}>
          <path d={`M-20 ${HZ - 12}L800 ${HZ - 12}Q850 ${GY} 900 ${H}L-20 ${H}Z`} />
        </clipPath>
        {land.snowRidge ? (
          <clipPath id={`${uid}-snow`}>
            <polygon points={pts(land.snowRidge)} />
          </clipPath>
        ) : null}
      </defs>
      <g className="art-scene__silhouette">{land.back}</g>
      {land.snowRidge ? (
        <g clipPath={`url(#${uid}-snow)`} className="art-scene__snow">
          <rect x={0} y={0} width={W} height={HZ - 92} />
        </g>
      ) : null}

      {coastal ? (
        <g>
          <rect x={0} y={SEA} width={W} height={H - SEA} className="art-scene__sea" />
          <rect x={0} y={SEA} width={W} height={1.4} className="art-scene__sea-line" />
          <g className="art-scene__glint-wrap" style={{ transform: `translateX(${sunX}px)` }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={-(30 - i * 3)} y={SEA + 4 + i * 9} width={60 - i * 6} height={1.6} rx={0.8} className="art-scene__glint" />
            ))}
          </g>
          <WaveLines waves={waves} />
        </g>
      ) : null}

      {/* Chaque plan translucide repose sur un fond opaque couleur ciel : rien ne transparaît derrière */}
      <g style={backing}>{land.front}</g>
      <g className="art-scene__silhouette" opacity={O_BACK}>
        {land.front}
      </g>

      <g clipPath={rural && coastal ? `url(#${uid}-land)` : undefined}>
        <g className="art-scene__silhouette" opacity={rural ? 1 : O_FAR + 0.06}>
          {built.far}
        </g>
        {rural ? <g className="art-scene__furrows">{built.details}</g> : null}
        {built.under}
      </g>
      <g style={backing}>{built.mid}</g>
      <g className="art-scene__silhouette" opacity={O_MID}>
        {built.mid}
      </g>
      {rural ? null : <g className="art-scene__details">{built.details}</g>}
      <WindowsLayer windows={built.windows} />

      {land.extra}

      {rural ? null : <path d={groundPath} style={backing} />}
      {rural ? null : <path d={groundPath} className="art-scene__silhouette" opacity={O_NEAR} />}
      <g className="art-scene__silhouette" opacity={O_FORE}>
        {built.near}
      </g>
      {built.extra}
      {rural ? null : <rect x={-20} y={H - 14} width={W + 40} height={14} className="art-scene__silhouette" opacity={O_FORE} />}
    </g>
  );
}

// —— Ciel et composition ————————————————————————————————————————————

/** Position du soleil selon le moment. */
const SUN_POS: Record<Phase, Pt> = SUN;

export interface SceneCanvasProps extends SceneProps {
  /** Cadrage particulier (ex. carte postale). */
  viewBox?: string;
  /** Illustration purement décorative (l'élément parent porte le libellé). */
  decorative?: boolean;
  className?: string;
}

/** Scène complète ; `Scene` en est la version publique. */
export function SceneCanvas(props: SceneCanvasProps): JSX.Element {
  const { territory, landscape, age, paused = false, height = 240, city, viewBox, decorative = false, className } = props;
  const phase = phaseFor(age);
  const uid = useSvgId('sc');

  const sky = useMemo(() => {
    const rnd = makeRng(91);
    const stars = Array.from({ length: 70 }, (_, i) => ({
      x: r1(rnd() * W),
      y: r1(rnd() * rnd() * 190 + 4),
      r: r1(0.5 + rnd() * 1.2),
      tw: i % 4 === 0,
      d: r1(rnd() * 6),
    }));
    const clouds = [
      cloud('c0', 160, 70, 1.1, rnd, 70),
      cloud('c1', 470, 40, 0.75, rnd, 90),
      cloud('c2', 760, 96, 1.3, rnd, 80),
      cloud('c3', 1040, 52, 0.9, rnd, 100),
      cloud('c4', 330, 150, 0.6, rnd, 65),
    ];
    return { stars, clouds };
  }, []);

  const [sunX, sunY] = SUN_POS[phase];
  const backing = { fill: `url(#${uid}-sky-${phase})` };
  const classes = ['art-scene', `art-scene--${phase}`, city ? `art-scene--city-${city}` : '', paused ? 'art-scene--paused' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  const label = city
    ? `${CITIES[city].place}, ${PHASE_LABEL[phase]}`
    : `${TERRITORY_LABEL[territory]} ${LANDSCAPE_LABEL[landscape]}, ${PHASE_LABEL[phase]}`;
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };

  return (
    <svg
      className={classes}
      viewBox={viewBox ?? `0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height={height}
      {...a11y}
    >
      <defs>
        {PHASES.map((p) => (
          <linearGradient key={p} id={`${uid}-sky-${p}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
            <stop offset="0" style={{ stopColor: `var(--art-sky-${p}-0)` }} />
            <stop offset="0.55" style={{ stopColor: `var(--art-sky-${p}-1)` }} />
            <stop offset="0.8" style={{ stopColor: `var(--art-sky-${p}-2)` }} />
          </linearGradient>
        ))}
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" className="art-scene__glow-0" />
          <stop offset="1" className="art-scene__glow-1" />
        </radialGradient>
        <linearGradient id={`${uid}-beam`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" className="art-scene__beam-0" />
          <stop offset="1" className="art-scene__beam-1" />
        </linearGradient>
        <mask id={`${uid}-moon`}>
          <circle cx={0} cy={0} r={15} fill="#fff" />
          <circle cx={7} cy={-4} r={13} fill="#000" />
        </mask>
      </defs>

      {/* Ciels superposés : seul celui du moment est opaque, les autres s'effacent en douceur */}
      {PHASES.map((p) => (
        <rect key={p} width={W} height={H} fill={`url(#${uid}-sky-${p})`} className="art-scene__sky" style={{ opacity: p === phase ? 1 : 0 }} />
      ))}

      <g className="art-scene__stars">
        {sky.stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            className={s.tw ? 'art-scene__star art-scene__star--twinkle' : 'art-scene__star'}
            style={s.tw ? { animationDelay: `${-s.d}s` } : undefined}
          />
        ))}
      </g>

      <g className="art-scene__celestial" style={{ transform: `translate(${sunX}px, ${sunY}px)` }}>
        <circle r={150} fill={`url(#${uid}-glow)`} className="art-scene__glow" />
        <circle r={24} className="art-scene__sun" />
      </g>
      <g transform="translate(930 70)" className="art-scene__moon">
        <circle r={15} mask={`url(#${uid}-moon)`} />
      </g>

      <g className="art-scene__clouds">{sky.clouds}</g>

      {city ? (
        <CityScene city={city} age={age} uid={uid} sunX={sunX} backing={backing} />
      ) : (
        <GenericLayers territory={territory} landscape={landscape} uid={uid} sunX={sunX} backing={backing} />
      )}
    </svg>
  );
}

export function Scene(props: SceneProps): JSX.Element {
  return <SceneCanvas {...props} />;
}

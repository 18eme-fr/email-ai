import type { CSSProperties, ReactNode } from 'react';
import './art.css';
import { hash01, r1, useSvgId } from './artUtils';

export interface PortraitProps {
  age: number;
  sex: 'F' | 'M';
  hue: number;
  size?: number;
  alive?: boolean;
  title?: string;
}

type Stage = 'bebe' | 'enfant' | 'ado' | 'adulte' | 'mur' | 'aine';

function stageFor(age: number): Stage {
  if (age < 3) return 'bebe';
  if (age < 12) return 'enfant';
  if (age < 18) return 'ado';
  if (age < 40) return 'adulte';
  if (age < 65) return 'mur';
  return 'aine';
}

/** Morphologie du buste : centre et rayon de la tête, ligne d'épaules, voussure. */
interface Body {
  cx: number;
  cy: number;
  r: number;
  neckW: number;
  sy: number;
  hw: number;
  round: number;
  hump: number;
  bx: number;
}

const BODIES: Record<Stage, Body> = {
  bebe: { cx: 50, cy: 50, r: 18, neckW: 0, sy: 66, hw: 29, round: 20, hump: 3, bx: 50 },
  enfant: { cx: 50, cy: 46, r: 15.5, neckW: 8.5, sy: 68, hw: 24, round: 10, hump: 0, bx: 50 },
  ado: { cx: 50, cy: 42, r: 14.6, neckW: 9.5, sy: 64.5, hw: 29, round: 10, hump: 0, bx: 50 },
  adulte: { cx: 50, cy: 40, r: 14.6, neckW: 10.5, sy: 62.5, hw: 33, round: 10, hump: 0, bx: 50 },
  mur: { cx: 50, cy: 41, r: 14.9, neckW: 11, sy: 63.5, hw: 34.5, round: 12, hump: 1, bx: 50 },
  aine: { cx: 53, cy: 44, r: 14.2, neckW: 10.5, sy: 66, hw: 32, round: 17, hump: 5, bx: 49 },
};

type HairStyle = 'court' | 'raie' | 'boucles' | 'ondule' | 'long' | 'carre' | 'chignon' | 'degarni' | 'duvet';

const HAIR_F: HairStyle[] = ['long', 'carre', 'chignon', 'boucles', 'ondule'];
const HAIR_F_AINE: HairStyle[] = ['chignon', 'boucles', 'carre', 'ondule', 'court'];
const HAIR_M: HairStyle[] = ['court', 'raie', 'boucles', 'ondule'];
const HAIR_M_MUR: HairStyle[] = ['court', 'raie', 'boucles', 'degarni'];
const HAIR_M_AINE: HairStyle[] = ['degarni', 'court', 'raie', 'boucles'];

function pick<T>(list: readonly T[], t: number, fallback: T): T {
  return list[Math.floor(t * list.length) % list.length] ?? fallback;
}

function pickHair(sex: 'F' | 'M', stage: Stage, seed: number): HairStyle {
  if (stage === 'bebe') return 'duvet';
  const t = hash01(seed, 1);
  if (sex === 'F') return pick(stage === 'aine' ? HAIR_F_AINE : HAIR_F, t, 'carre');
  if (stage === 'aine') return pick(HAIR_M_AINE, t, 'court');
  if (stage === 'mur') return pick(HAIR_M_MUR, t, 'court');
  return pick(HAIR_M, t, 'court');
}

type Collar = 'v' | 'rond' | 'roule' | 'chemise';
const COLLARS: Collar[] = ['v', 'rond', 'roule', 'chemise'];

/** Calotte de cheveux : dôme au-dessus du crâne, frange redescendant vers les tempes. */
function domePath(cx: number, cy: number, a: number, b: number, fringeY: number, sideY: number, part: number): string {
  const L = cx - a * 1.1;
  const R = cx + a * 1.1;
  const top = cy - b * 1.5;
  const px = cx + part * a;
  return [
    `M${r1(L)} ${r1(sideY)}`,
    `C${r1(cx - a * 1.2)} ${r1(top)} ${r1(cx + a * 1.2)} ${r1(top)} ${r1(R)} ${r1(sideY)}`,
    `C${r1(cx + a * 0.95)} ${r1(fringeY + b * 0.3)} ${r1(px + a * 0.5)} ${r1(fringeY)} ${r1(px)} ${r1(fringeY)}`,
    `C${r1(px - a * 0.5)} ${r1(fringeY)} ${r1(cx - a * 0.95)} ${r1(fringeY + b * 0.3)} ${r1(L)} ${r1(sideY)}Z`,
  ].join('');
}

interface HairLayers {
  back: ReactNode;
  front: ReactNode;
}

function hairLayers(style: HairStyle, body: Body, seed: number, cls: string, sex: 'F' | 'M'): HairLayers {
  const { cx, cy, r, sy } = body;
  const a = r * 0.86;
  const b = r;
  // Volume arrière commun : un léger halo de cheveux autour du crâne
  const base = <ellipse cx={cx} cy={r1(cy - b * 0.12)} rx={r1(a * 1.09)} ry={r1(b * 1.02)} className={cls} />;
  const curls = (count: number, from: number, to: number, rr: number, dist: number, k: string): ReactNode[] =>
    Array.from({ length: count }, (_, i) => {
      const ang = ((from + ((to - from) * i) / (count - 1)) * Math.PI) / 180;
      return (
        <circle
          key={`${k}${i}`}
          cx={r1(cx + Math.cos(ang) * a * dist)}
          cy={r1(cy - b * 0.1 + Math.sin(ang) * b * dist)}
          r={r1(rr * (0.9 + hash01(seed, i + 7) * 0.25))}
          className={cls}
        />
      );
    });

  switch (style) {
    case 'duvet':
      return {
        back: null,
        front: (
          <g className={`${cls} art-portrait__stroke`} fill="none" strokeWidth={1.6} strokeLinecap="round">
            <path d={`M${r1(cx - 4)} ${r1(cy - b + 2.5)}q2-5 5.5-2.2`} />
            <path d={`M${r1(cx + 1)} ${r1(cy - b + 1.6)}q2.6-3.6 5-0.6`} />
          </g>
        ),
      };
    case 'court':
      return { back: base, front: <path d={domePath(cx, cy, a, b, cy - b * 0.62, cy - b * 0.05, 0.1)} className={cls} /> };
    case 'raie':
      return {
        back: base,
        front: (
          <>
            <path d={domePath(cx, cy, a, b, cy - b * 0.5, cy + b * 0.02, -0.45)} className={cls} />
            <path
              d={`M${r1(cx - a * 0.42)} ${r1(cy - b * 0.98)}q${r1(a * 0.5)} ${r1(b * 0.1)} ${r1(a * 1.1)} ${r1(b * 0.5)}`}
              className="art-portrait__sheen"
            />
          </>
        ),
      };
    case 'ondule':
      return {
        back:
          sex === 'F' ? (
            <path
              d={`M${r1(cx - a * 1.22)} ${r1(cy - b * 0.4)}C${r1(cx - a * 1.45)} ${r1(cy + b * 0.5)} ${r1(cx - a * 1.3)} ${r1(cy + b * 1.05)} ${r1(cx - a * 0.7)} ${r1(cy + b * 1.12)}L${r1(cx + a * 0.7)} ${r1(cy + b * 1.12)}C${r1(cx + a * 1.3)} ${r1(cy + b * 1.05)} ${r1(cx + a * 1.45)} ${r1(cy + b * 0.5)} ${r1(cx + a * 1.22)} ${r1(cy - b * 0.4)}Z`}
              className={cls}
            />
          ) : (
            base
          ),
        front: (
          <>
            {sex === 'F' ? null : base}
            <path d={domePath(cx, cy, a, b, cy - b * 0.48, cy + b * (sex === 'F' ? 0.45 : 0.12), 0.35)} className={cls} />
          </>
        ),
      };
    case 'boucles':
      return {
        back: (
          <>
            {base}
            {sex === 'F' ? curls(9, 150, 390, r * 0.42, 1.12, 'bb') : null}
          </>
        ),
        front: (
          <>
            <path d={domePath(cx, cy, a, b, cy - b * 0.56, cy - b * 0.02, 0)} className={cls} />
            {curls(8, 195, 345, r * 0.3, 0.98, 'bf')}
          </>
        ),
      };
    case 'long':
      return {
        back: (
          <path
            d={`M${r1(cx - a * 1.2)} ${r1(cy - b * 0.5)}C${r1(cx - a * 1.5)} ${r1(cy + b * 0.8)} ${r1(cx - a * 1.6)} ${r1(sy + 2)} ${r1(cx - a * 1.4)} ${r1(sy + 13)}L${r1(cx + a * 1.4)} ${r1(sy + 13)}C${r1(cx + a * 1.6)} ${r1(sy + 2)} ${r1(cx + a * 1.5)} ${r1(cy + b * 0.8)} ${r1(cx + a * 1.2)} ${r1(cy - b * 0.5)}Z`}
            className={cls}
          />
        ),
        front: <path d={domePath(cx, cy, a, b, cy - b * 0.78, cy + b * 0.55, 0.12)} className={cls} />,
      };
    case 'carre':
      return {
        back: (
          <path
            d={`M${r1(cx - a * 1.25)} ${r1(cy - b * 0.3)}Q${r1(cx - a * 1.38)} ${r1(cy + b * 0.9)} ${r1(cx - a * 1.02)} ${r1(cy + b * 0.98)}L${r1(cx + a * 1.02)} ${r1(cy + b * 0.98)}Q${r1(cx + a * 1.38)} ${r1(cy + b * 0.9)} ${r1(cx + a * 1.25)} ${r1(cy - b * 0.3)}Z`}
            className={cls}
          />
        ),
        front: <path d={domePath(cx, cy, a, b, cy - b * 0.34, cy + b * 0.5, 0)} className={cls} />,
      };
    case 'chignon':
      return {
        back: (
          <>
            {base}
            <circle cx={r1(cx + a * 0.25)} cy={r1(cy - b * 1.12)} r={r1(r * 0.44)} className={cls} />
          </>
        ),
        front: <path d={domePath(cx, cy, a, b, cy - b * 0.72, cy + b * 0.05, 0.3)} className={cls} />,
      };
    case 'degarni':
      return {
        back: (
          <ellipse cx={cx} cy={r1(cy - b * 0.02)} rx={r1(a * 1.08)} ry={r1(b * 0.62)} className={cls} />
        ),
        front: (
          <>
            <ellipse cx={r1(cx - a * 0.95)} cy={r1(cy - b * 0.1)} rx={r1(a * 0.24)} ry={r1(b * 0.36)} className={cls} />
            <ellipse cx={r1(cx + a * 0.95)} cy={r1(cy - b * 0.1)} rx={r1(a * 0.24)} ry={r1(b * 0.36)} className={cls} />
          </>
        ),
      };
  }
}

export function Portrait(props: PortraitProps): JSX.Element {
  const { age, sex, size = 96, alive = true, title } = props;
  const hue = ((Math.round(props.hue) % 360) + 360) % 360;
  const uid = useSvgId('pt');
  const stage = stageFor(age);
  const body = BODIES[stage];
  const { cx, cy, r, neckW, sy, hw, round, hump, bx } = body;
  const a = r * 0.86;
  const b = r;
  // Graine visuelle : la teinte et le sexe suffisent à différencier les personnages
  const seed = hue * 7 + (sex === 'F' ? 3 : 11);
  const hairStyle = pickHair(sex, stage, seed);
  const collar = pick(COLLARS, hash01(seed, 2), 'rond');
  const grown = stage === 'adulte' || stage === 'mur' || stage === 'aine';
  const glasses = grown && hash01(seed, 3) < (stage === 'aine' ? 0.55 : 0.22);
  const beard = sex === 'M' && grown && hash01(seed, 4) < 0.3;

  const hairCls =
    stage === 'aine'
      ? 'art-portrait__hair art-portrait__hair--white'
      : stage === 'mur'
        ? 'art-portrait__hair art-portrait__hair--salt'
        : 'art-portrait__hair';
  const hair = hairLayers(hairStyle, body, seed, hairCls, sex);
  // Les coiffures longues couvrent les oreilles
  const coversEars = hairStyle === 'long' || hairStyle === 'carre' || (sex === 'F' && (hairStyle === 'ondule' || hairStyle === 'boucles'));
  const showEars = stage !== 'bebe' && !coversEars;

  // Buste : épaules arrondies, voussure (hump) pour l'aîné
  const torso = [
    `M${bx - hw} 101`,
    `L${bx - hw} ${sy + round}`,
    `Q${bx - hw} ${sy} ${bx - hw + round} ${sy - hump * 0.3}`,
    `Q${bx} ${sy - hump} ${bx + hw - round} ${sy - hump * 0.3}`,
    `Q${bx + hw} ${sy} ${bx + hw} ${sy + round}`,
    `L${bx + hw} 101Z`,
  ].join('');

  const neckTop = cy + b * 0.55;
  const neck =
    neckW > 0
      ? `${r1(cx - neckW / 2)},${r1(neckTop)} ${r1(cx + neckW / 2)},${r1(neckTop)} ${r1(bx + neckW * 0.62)},${r1(sy + 3)} ${r1(bx - neckW * 0.62)},${r1(sy + 3)}`
      : '';

  const eyeY = cy + b * 0.12;
  const eyeDx = a * 0.38;
  const k = r / 14.6;

  let collarNode: ReactNode = null;
  if (stage === 'bebe') {
    collarNode = (
      <path
        d={`M${bx - hw + 8} ${sy + 12}Q${bx} ${sy + 22} ${bx + hw - 8} ${sy + 12}`}
        className="art-portrait__seam"
      />
    );
  } else if (collar === 'v') {
    collarNode = (
      <polygon
        points={`${r1(bx - neckW * 0.85)},${sy - 0.6} ${r1(bx + neckW * 0.85)},${sy - 0.6} ${bx},${sy + 9}`}
        className="art-portrait__skin"
      />
    );
  } else if (collar === 'rond') {
    collarNode = (
      <>
        <path d={`M${r1(bx - neckW)} ${sy - 0.6}Q${bx} ${sy + 7} ${r1(bx + neckW)} ${sy - 0.6}Z`} className="art-portrait__skin" />
        <path d={`M${r1(bx - neckW - 0.6)} ${sy - 0.4}Q${bx} ${sy + 8.2} ${r1(bx + neckW + 0.6)} ${sy - 0.4}`} className="art-portrait__seam" />
      </>
    );
  } else if (collar === 'roule') {
    collarNode = (
      <rect
        x={r1(bx - neckW * 0.72)}
        y={r1(sy - 5.5)}
        width={r1(neckW * 1.44)}
        height={9}
        rx={3}
        className="art-portrait__cloth-dark"
      />
    );
  } else {
    collarNode = (
      <>
        <polygon points={`${r1(bx - neckW * 0.8)},${sy - 0.6} ${r1(bx + neckW * 0.8)},${sy - 0.6} ${bx},${sy + 8}`} className="art-portrait__skin" />
        <polygon points={`${r1(bx - neckW * 0.95)},${sy - 1.5} ${bx - 0.4},${sy + 8.4} ${r1(bx - neckW * 1.6)},${sy + 5}`} className="art-portrait__collar" />
        <polygon points={`${r1(bx + neckW * 0.95)},${sy - 1.5} ${bx + 0.4},${sy + 8.4} ${r1(bx + neckW * 1.6)},${sy + 5}`} className="art-portrait__collar" />
        <circle cx={bx} cy={sy + 13} r={0.8} className="art-portrait__seam-dot" />
        <circle cx={bx} cy={sy + 19} r={0.8} className="art-portrait__seam-dot" />
      </>
    );
  }

  const style = { '--art-hue': String(hue) } as CSSProperties;
  const classes = ['art-portrait', alive ? '' : 'art-portrait--memory'].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="9 7 82 82"
      role="img"
      aria-label={title ?? 'Portrait'}
      style={style}
    >
      <defs>
        <clipPath id={`${uid}-halo`}>
          <circle cx={50} cy={48} r={41} />
        </clipPath>
        <clipPath id={`${uid}-head`}>
          <ellipse cx={cx} cy={cy} rx={r1(a)} ry={b} />
        </clipPath>
        <clipPath id={`${uid}-frame`}>
          <rect x={9} y={7} width={82} height={82} rx={7} />
        </clipPath>
        <filter id={`${uid}-cut`} x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx={0.9} dy={1.3} stdDeviation={0.7} className="art-portrait__shadow" />
        </filter>
        <radialGradient id={`${uid}-vignette`} cx="50%" cy="46%" r="62%">
          <stop offset="55%" className="art-portrait__vig-0" />
          <stop offset="100%" className="art-portrait__vig-1" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${uid}-frame)`}>
        <rect width={100} height={100} className="art-portrait__bg" />
        <circle cx={50} cy={48} r={41} className="art-portrait__halo" />
        {/* Hachures de gravure dans le halo */}
        <g clipPath={`url(#${uid}-halo)`} className="art-portrait__hatch">
          {Array.from({ length: 15 }, (_, i) => (
            <line key={i} x1={0} x2={100} y1={10 + i * 5.6} y2={4 + i * 5.6} />
          ))}
        </g>
        <circle cx={50} cy={48} r={44.5} className="art-portrait__ring" />

        <g filter={`url(#${uid}-cut)`}>
          {hair.back}
          <path d={torso} className="art-portrait__cloth" />
          {/* Pli d'épaule */}
          <path
            d={`M${bx - hw + round * 0.7} ${sy + 9}Q${bx - hw * 0.55} ${sy + 4} ${bx - hw * 0.35} ${sy + 14}`}
            className="art-portrait__seam"
          />
          {neck ? <polygon points={neck} className="art-portrait__skin" /> : null}
          {neck ? (
            <rect x={r1(cx - neckW / 2)} y={r1(neckTop)} width={neckW} height={r1(b * 0.5)} className="art-portrait__shade" />
          ) : null}
          {collarNode}
          {/* Oreilles */}
          {showEars ? (
            <>
              <ellipse cx={r1(cx - a * 0.98)} cy={r1(cy + b * 0.14)} rx={r1(r * 0.15)} ry={r1(r * 0.23)} className="art-portrait__skin" />
              <ellipse cx={r1(cx + a * 0.98)} cy={r1(cy + b * 0.14)} rx={r1(r * 0.15)} ry={r1(r * 0.23)} className="art-portrait__skin" />
            </>
          ) : null}
          <ellipse cx={cx} cy={cy} rx={r1(a)} ry={b} className="art-portrait__skin" />
          {/* Modelé : ombre portée sur un côté du visage */}
          <g clipPath={`url(#${uid}-head)`}>
            <ellipse cx={r1(cx + a * 1.02)} cy={r1(cy + b * 0.05)} rx={r1(a * 0.5)} ry={r1(b * 1.1)} className="art-portrait__shade" />
          </g>
          {beard ? (
            <path
              d={`M${r1(cx - a * 0.98)} ${r1(cy + b * 0.12)}Q${r1(cx - a * 0.92)} ${r1(cy + b * 1.12)} ${cx} ${r1(cy + b * 1.1)}Q${r1(cx + a * 0.92)} ${r1(cy + b * 1.12)} ${r1(cx + a * 0.98)} ${r1(cy + b * 0.12)}Q${r1(cx + a * 0.62)} ${r1(cy + b * 0.78)} ${cx} ${r1(cy + b * 0.74)}Q${r1(cx - a * 0.62)} ${r1(cy + b * 0.78)} ${r1(cx - a * 0.98)} ${r1(cy + b * 0.12)}Z`}
              className={hairCls}
            />
          ) : null}
          {hair.front}

          {/* Traits du visage : sobres, à l'encre */}
          <g className="art-portrait__features">
            {stage === 'bebe' ? (
              <>
                <path d={`M${r1(cx - eyeDx - 2)} ${r1(eyeY)}q2 1.8 4 0`} className="art-portrait__line" />
                <path d={`M${r1(cx + eyeDx - 2)} ${r1(eyeY)}q2 1.8 4 0`} className="art-portrait__line" />
              </>
            ) : (
              <>
                <ellipse cx={r1(cx - eyeDx)} cy={r1(eyeY)} rx={r1(0.95 * k)} ry={r1(1.25 * k)} className="art-portrait__eye" />
                <ellipse cx={r1(cx + eyeDx)} cy={r1(eyeY)} rx={r1(0.95 * k)} ry={r1(1.25 * k)} className="art-portrait__eye" />
              </>
            )}
            {stage !== 'bebe' && stage !== 'enfant' ? (
              <>
                <path d={`M${r1(cx - eyeDx - 2.2)} ${r1(eyeY - 3.4)}q2.2 -1.1 4.2 0`} className="art-portrait__line art-portrait__line--soft" />
                <path d={`M${r1(cx + eyeDx - 2)} ${r1(eyeY - 3.4)}q2.2 -1.1 4.2 0`} className="art-portrait__line art-portrait__line--soft" />
              </>
            ) : null}
            <path d={`M${r1(cx + 0.4)} ${r1(cy + b * 0.28)}q1.3 2.6 -0.7 3.1`} className="art-portrait__line art-portrait__line--soft" />
            <path d={`M${r1(cx - 2.3 * k)} ${r1(cy + b * 0.58)}q${r1(2.3 * k)} ${r1(1.5 * k)} ${r1(4.6 * k)} 0`} className="art-portrait__line" />
            {stage === 'aine' || stage === 'mur' ? (
              <>
                <path d={`M${r1(cx + eyeDx + 2.4)} ${r1(eyeY + 0.4)}l1.4 0.8`} className="art-portrait__line art-portrait__line--soft" />
                <path d={`M${r1(cx - eyeDx - 2.4)} ${r1(eyeY + 0.4)}l-1.4 0.8`} className="art-portrait__line art-portrait__line--soft" />
              </>
            ) : null}
            {stage === 'aine' ? (
              <>
                <path d={`M${r1(cx - a * 0.5)} ${r1(cy + b * 0.42)}q-0.6 1.8 0.4 3`} className="art-portrait__line art-portrait__line--soft" />
                <path d={`M${r1(cx + a * 0.5)} ${r1(cy + b * 0.42)}q0.6 1.8 -0.4 3`} className="art-portrait__line art-portrait__line--soft" />
              </>
            ) : null}
            {glasses ? (
              <g className="art-portrait__glasses">
                <circle cx={r1(cx - eyeDx)} cy={r1(eyeY)} r={r1(3.3 * k)} />
                <circle cx={r1(cx + eyeDx)} cy={r1(eyeY)} r={r1(3.3 * k)} />
                <path d={`M${r1(cx - eyeDx + 3.3 * k)} ${r1(eyeY)}q${r1(eyeDx - 3.3 * k)} -1.4 ${r1(2 * (eyeDx - 3.3 * k))} 0`} />
              </g>
            ) : null}
          </g>
        </g>

        {alive ? null : (
          <>
            <rect width={100} height={100} fill={`url(#${uid}-vignette)`} />
            <rect x={12} y={10} width={76} height={76} rx={4.5} className="art-portrait__photo-edge" />
          </>
        )}
      </g>
    </svg>
  );
}

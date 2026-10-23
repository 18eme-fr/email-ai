import { useMemo } from 'react';
import './art.css';
import { hash01, pts, r1, type Pt } from './artUtils';

export interface EmblemProps {
  size?: number;
}

/** Hexagone stylisé, volontairement irrégulier (pas de contour officiel). */
const HEX: Pt[] = [
  [100, 16],
  [168, 50],
  [172, 128],
  [120, 184],
  [44, 172],
  [22, 82],
];

const ORIGIN: Pt = [98, 132];

/**
 * Fils de vie : des trajectoires partent d'un même point puis divergent,
 * chacune vers un destin (un point) au bord du territoire.
 */
export function Emblem(props: EmblemProps): JSX.Element {
  const { size = 160 } = props;

  const threads = useMemo(() => {
    const count = 9;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const ang = (-160 + t * 140) * (Math.PI / 180);
      const len = 56 + hash01(i, 5) * 22;
      const ex = ORIGIN[0] + Math.cos(ang) * len * 1.12;
      const ey = ORIGIN[1] + Math.sin(ang) * len;
      // Les fils montent d'abord ensemble, puis s'écartent
      const c1x = ORIGIN[0] + (ex - ORIGIN[0]) * 0.08;
      const c1y = ORIGIN[1] - 30 - hash01(i, 6) * 10;
      const bend = (hash01(i, 7) - 0.5) * 34;
      const c2x = ex - (ex - ORIGIN[0]) * 0.25 + bend;
      const c2y = ey + 22;
      const tone = i % 4 === 1 ? 'memory' : i % 3 === 0 ? 'ink' : 'accent';
      return {
        d: `M${ORIGIN[0]} ${ORIGIN[1]}C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(ex)} ${r1(ey)}`,
        end: [r1(ex), r1(ey)] as const,
        tone,
        delay: r1(0.5 + Math.abs(t - 0.5) * 0.9 + hash01(i, 8) * 0.25),
        width: r1(1.4 + hash01(i, 9) * 1.1),
      };
    });
  }, []);

  return (
    <svg className="art-emblem" width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Destins de France">
      <polygon points={pts(HEX)} className="art-emblem__hex art-emblem__hex--shadow" />
      <polygon points={pts(HEX)} pathLength={1} className="art-emblem__hex art-emblem__draw" />
      {/* Racine commune : quelques fils sous le point d'origine */}
      <path
        d={`M${ORIGIN[0]} ${ORIGIN[1]}C${ORIGIN[0] - 2} ${ORIGIN[1] + 14} ${ORIGIN[0] + 4} ${ORIGIN[1] + 26} ${ORIGIN[0]} ${ORIGIN[1] + 38}`}
        pathLength={1}
        className="art-emblem__thread art-emblem__thread--ink art-emblem__draw"
        style={{ animationDelay: '0.25s', strokeWidth: 2.2 }}
      />
      {threads.map((th, i) => (
        <path
          key={i}
          d={th.d}
          pathLength={1}
          className={`art-emblem__thread art-emblem__thread--${th.tone} art-emblem__draw`}
          style={{ animationDelay: `${th.delay}s`, strokeWidth: th.width }}
        />
      ))}
      {threads.map((th, i) => (
        <circle
          key={`e${i}`}
          cx={th.end[0]}
          cy={th.end[1]}
          r={i % 4 === 1 ? 3.6 : 2.6}
          className={`art-emblem__dot art-emblem__dot--${th.tone}`}
          style={{ animationDelay: `${r1(th.delay + 1.3)}s` }}
        />
      ))}
      <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={4.6} className="art-emblem__origin" />
      <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r={9} className="art-emblem__origin-ring" />
    </svg>
  );
}

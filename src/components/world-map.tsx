"use client";
import { useState } from "react";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel: string;
  score: number;
};

const W = 720;
const H = 360;

function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

function color(score: number) {
  return score >= 75 ? "#34d399" : score >= 55 ? "#e9b949" : "#ef4444";
}

// Silhouettes de continents très simplifiées (repères visuels, non géodésiques).
const LANDMASSES: [number, number][][] = [
  // Europe / Afrique (bloc)
  [[-10, 60], [40, 62], [55, 35], [50, 10], [20, -35], [-18, 5], [-10, 35]],
  // Amériques
  [[-165, 60], [-60, 55], [-35, 5], [-70, -55], [-80, -20], [-125, 35]],
  // Asie / Océanie
  [[45, 65], [180, 60], [150, -10], [110, -40], [70, 8], [55, 35]],
];

export function WorldMap({ points }: { points: MapPoint[] }) {
  const [hover, setHover] = useState<MapPoint | null>(null);
  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px] rounded-lg" style={{ background: "linear-gradient(180deg,#0e1526,#0b0a0f)" }}>
        {/* graticule */}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(H / 6) * i} x2={W} y2={(H / 6) * i} stroke="rgba(255,255,255,0.05)" />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={(W / 12) * i} y1={0} x2={(W / 12) * i} y2={H} stroke="rgba(255,255,255,0.05)" />
        ))}
        {/* continents */}
        {LANDMASSES.map((poly, i) => (
          <polygon
            key={i}
            points={poly.map(([lng, lat]) => { const p = project(lat, lng); return `${p.x},${p.y}`; }).join(" ")}
            fill="rgba(233,185,73,0.06)"
            stroke="rgba(233,185,73,0.15)"
          />
        ))}
        {/* markers */}
        {points.map((p) => {
          const { x, y } = project(p.lat, p.lng);
          return (
            <g key={p.id} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={8} fill={color(p.score)} opacity={0.25} />
              <circle cx={x} cy={y} r={4} fill={color(p.score)} />
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="absolute top-2 left-2 panel rounded-lg p-2.5 shadow-card pointer-events-none">
          <div className="text-sm font-medium">{hover.label}</div>
          <div className="text-xs muted">{hover.sublabel}</div>
          <div className="text-xs mt-1">Compatibilité : <span style={{ color: color(hover.score) }}>{hover.score}%</span></div>
        </div>
      )}
      <div className="flex gap-4 mt-2 text-xs muted">
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full inline-block" style={{ background: "#34d399" }} /> ≥ 75</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full inline-block" style={{ background: "#e9b949" }} /> 55–74</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full inline-block" style={{ background: "#ef4444" }} /> &lt; 55</span>
      </div>
    </div>
  );
}

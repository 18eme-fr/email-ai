'use client';

import { levelForZoom } from '@/lib/atlas';
import { LEVEL_LABELS, LEVEL_ORDER, type AtlasLevel } from '@/lib/types';
import { useAtlas } from '@/state/store';

const SHORT: Record<AtlasLevel, string> = {
  country: 'Pays',
  region: 'Régions',
  subregion: 'Sous-régions',
  appellation: 'Appellations',
};

export default function LevelLegend() {
  const zoom = useAtlas((s) => s.zoom);
  const current = levelForZoom(zoom);

  return (
    <div className="pointer-events-none absolute bottom-9 left-2.5 z-10 hidden sm:block">
      <div className="pointer-events-auto rounded-xl border border-line bg-paper-card/90 px-3 py-2 shadow-float backdrop-blur">
        <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-muted">Niveau d’affichage</p>
        <div className="flex items-center gap-1">
          {LEVEL_ORDER.map((lvl, i) => (
            <div key={lvl} className="flex items-center gap-1">
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                  lvl === current ? 'bg-accent text-paper' : 'text-ink-muted'
                }`}
                title={LEVEL_LABELS[lvl]}
              >
                {SHORT[lvl]}
              </span>
              {i < LEVEL_ORDER.length - 1 && <span className="text-line">›</span>}
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-ink-muted/80">Zoomez pour révéler le niveau suivant</p>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { regionsForGrape, grapeLabel } from '@/lib/search';
import { getRegion } from '@/data/regions';
import { GRAPE_BY_ID } from '@/data/grapes';
import { useAtlas } from '@/state/store';

export default function GrapeExplorerBanner() {
  const grapeExplorer = useAtlas((s) => s.grapeExplorer);
  const setGrapeExplorer = useAtlas((s) => s.setGrapeExplorer);
  const selectAndFocus = useAtlas((s) => s.selectAndFocus);

  const regionIds = useMemo(
    () => (grapeExplorer ? regionsForGrape(grapeExplorer) : []),
    [grapeExplorer],
  );

  if (!grapeExplorer) return null;
  const meta = GRAPE_BY_ID.get(grapeExplorer);

  // On ne montre que les zones nommées les plus parlantes (régions et pays).
  const highlights = regionIds
    .map((id) => getRegion(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .filter((r) => r.level === 'region' || r.level === 'country' || r.level === 'subregion')
    .slice(0, 14);

  return (
    <div className="pointer-events-auto animate-fade-in rounded-xl border border-gold/40 bg-paper-card/95 px-4 py-3 shadow-float backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#8a6a24]">Exploration d’un cépage</p>
          <p className="font-serif text-lg font-medium text-ink">{grapeLabel(grapeExplorer)}</p>
          <p className="text-xs text-ink-muted">
            {meta?.color === 'rouge' ? 'Cépage rouge' : 'Cépage blanc'} · {regionIds.length} zone
            {regionIds.length > 1 ? 's' : ''} référencée{regionIds.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setGrapeExplorer(null)}
          className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          Quitter
        </button>
      </div>
      {highlights.length > 0 && (
        <div className="mt-2.5 flex max-w-[min(78vw,520px)] flex-wrap gap-1.5">
          {highlights.map((r) => (
            <button
              key={r.id}
              onClick={() => selectAndFocus(r.id)}
              className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 text-xs text-[#8a6a24] transition-colors hover:border-gold hover:bg-gold/15"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

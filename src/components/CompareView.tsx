'use client';

import { getRegion } from '@/data/regions';
import { GRAPE_BY_ID } from '@/data/grapes';
import { WINE_STYLE_LABELS, type WineRegionInfo } from '@/lib/types';
import { NR, formatHectares, orNR, scaleLabel } from '@/lib/format';
import { useAtlas } from '@/state/store';

export default function CompareView() {
  const compare = useAtlas((s) => s.compare);
  const compareOpen = useAtlas((s) => s.compareOpen);
  const setCompareOpen = useAtlas((s) => s.setCompareOpen);
  const clearCompare = useAtlas((s) => s.clearCompare);
  const toggleCompare = useAtlas((s) => s.toggleCompare);

  if (!compareOpen) return null;

  const a = compare[0] ? getRegion(compare[0]) : undefined;
  const b = compare[1] ? getRegion(compare[1]) : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="thin-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-paper-card shadow-float">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper-card/95 px-6 py-4 backdrop-blur">
          <h2 className="font-serif text-xl font-medium text-ink">Comparateur de régions</h2>
          <button
            onClick={() => setCompareOpen(false)}
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-paper-soft hover:text-ink"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {!a || !b ? (
          <div className="px-6 py-10 text-center text-sm text-ink-muted">
            Sélectionnez deux régions (bouton « Comparer » dans une fiche) pour les mettre en regard.
            {compare.length === 1 && a && (
              <p className="mt-3">
                Première région retenue : <span className="font-medium text-ink">{a.name}</span>.
              </p>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 sm:px-6">
            {/* En-têtes de colonnes */}
            <div className="grid grid-cols-[1fr_1fr] gap-3 sm:grid-cols-[160px_1fr_1fr]">
              <div className="hidden sm:block" />
              {[a, b].map((r) => (
                <div key={r.id} className="rounded-xl border border-line bg-paper p-3 text-center">
                  <p className="font-serif text-base font-medium text-ink">{r.name}</p>
                  <p className="text-[11px] text-ink-muted">{r.country}</p>
                  <button
                    onClick={() => toggleCompare(r.id)}
                    className="mt-1 text-[11px] text-ink-muted underline hover:text-accent"
                  >
                    retirer
                  </button>
                </div>
              ))}
            </div>

            <Row label="Climat" a={orNR(a.climate.type)} b={orNR(b.climate.type)} />
            <Row label="Températures" a={orNR(a.climate.temperatures)} b={orNR(b.climate.temperatures)} />
            <Row label="Pluviométrie" a={orNR(a.climate.rainfall)} b={orNR(b.climate.rainfall)} />
            <Row label="Altitude" a={orNR(a.keyFacts.altitude)} b={orNR(b.keyFacts.altitude)} />
            <Row
              label="Superficie"
              a={formatHectares(a.keyFacts.vineyardAreaHa)}
              b={formatHectares(b.keyFacts.vineyardAreaHa)}
            />
            <Row label="Sols" a={listOrNR(a.soils)} b={listOrNR(b.soils)} />
            <Row label="Cépages" a={grapesLine(a)} b={grapesLine(b)} />
            <Row label="Styles de vin" a={stylesLine(a)} b={stylesLine(b)} />

            <div className="mt-5 mb-2 font-serif text-[13px] font-medium uppercase tracking-widest text-accent">
              Profil gustatif (indicatif)
            </div>
            <CompareBar label="Acidité" a={a.tasting.acidity} b={b.tasting.acidity} />
            <CompareBar label="Tanins" a={a.tasting.tannins} b={b.tasting.tannins} />
            <CompareBar label="Corps" a={a.tasting.body} b={b.tasting.body} />
            <CompareBar label="Alcool" a={a.tasting.alcohol} b={b.tasting.alcohol} />
            <CompareBar label="Potentiel de garde" a={a.tasting.ageingPotential} b={b.tasting.ageingPotential} />

            <div className="mt-5 flex justify-end">
              <button
                onClick={clearCompare}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-accent hover:text-accent"
              >
                Vider le comparateur
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-3 border-b border-line/60 py-2 text-sm sm:grid-cols-[160px_1fr_1fr]">
      <div className="col-span-2 text-xs font-medium uppercase tracking-wide text-ink-muted sm:col-span-1 sm:self-center">
        {label}
      </div>
      <div className="text-ink">{a}</div>
      <div className="text-ink">{b}</div>
    </div>
  );
}

function CompareBar({ label, a, b }: { label: string; a: number | null; b: number | null }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] items-center gap-3 py-1.5 sm:grid-cols-[160px_1fr_1fr]">
      <div className="col-span-2 text-xs font-medium uppercase tracking-wide text-ink-muted sm:col-span-1">
        {label}
      </div>
      <Bar value={a} />
      <Bar value={b} />
    </div>
  );
}

function Bar({ value }: { value: number | null }) {
  const pct = value === null ? 0 : (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-soft">
        {value !== null && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <span className="text-[10px] text-ink-muted">{scaleLabel(value)}</span>
    </div>
  );
}

function listOrNR(arr: string[]): string {
  return arr.length ? arr.join(', ') : NR;
}

function grapesLine(r: WineRegionInfo): string {
  if (!r.grapes.length) return NR;
  return r.grapes
    .slice(0, 4)
    .map((g) => GRAPE_BY_ID.get(g.grapeId)?.name ?? g.grapeId)
    .join(', ');
}

function stylesLine(r: WineRegionInfo): string {
  if (!r.wineStyles.length) return NR;
  return r.wineStyles.map((s) => WINE_STYLE_LABELS[s]).join(', ');
}

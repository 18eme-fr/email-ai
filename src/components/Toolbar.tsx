'use client';

import { useEffect, useRef, useState } from 'react';
import SearchBar from './SearchBar';
import Filters from './Filters';
import GrapeExplorerBanner from './GrapeExplorerBanner';
import { getRegion } from '@/data/regions';
import { useAtlas } from '@/state/store';

export default function Toolbar() {
  const compare = useAtlas((s) => s.compare);
  const setCompareOpen = useAtlas((s) => s.setCompareOpen);
  const setLearnOpen = useAtlas((s) => s.setLearnOpen);

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-30 w-full p-3 sm:p-4">
      <div className="pointer-events-auto flex w-full max-w-2xl flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Brand />
          <div className="order-3 min-w-0 flex-1 basis-full sm:order-2 sm:basis-0">
            <SearchBar />
          </div>
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <Filters />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolButton
            onClick={() => setCompareOpen(true)}
            label={compare.length ? `Comparer (${compare.length})` : 'Comparer'}
            icon="⇄"
            active={compare.length > 0}
          />
          <ToolButton onClick={() => setLearnOpen(true)} label="Apprendre" icon="◆" />
          <FavoritesMenu />
        </div>

        <div className="pointer-events-none">
          <div className="pointer-events-auto inline-block">
            <GrapeExplorerBanner />
          </div>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex select-none items-center gap-2 rounded-xl border border-line bg-paper-card/95 px-3 py-2 shadow-float backdrop-blur">
      <span className="text-lg leading-none" aria-hidden>
        🌍
      </span>
      <div className="leading-tight">
        <p className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-ink">
          Atlas du vin
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Encyclopédie cartographique</p>
      </div>
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  icon,
  active,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm shadow-float backdrop-blur transition-colors ${
        active
          ? 'border-accent bg-accent-faint text-accent'
          : 'border-line bg-paper-card/95 text-ink-soft hover:border-ink-muted'
      }`}
    >
      <span aria-hidden className="text-xs">
        {icon}
      </span>
      {label}
    </button>
  );
}

function FavoritesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const favorites = useAtlas((s) => s.favorites);
  const selectAndFocus = useAtlas((s) => s.selectAndFocus);
  const toggleFavorite = useAtlas((s) => s.toggleFavorite);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm shadow-float backdrop-blur transition-colors ${
          favorites.length
            ? 'border-gold/50 bg-gold/10 text-[#8a6a24]'
            : 'border-line bg-paper-card/95 text-ink-soft hover:border-ink-muted'
        }`}
      >
        <span aria-hidden className="text-xs">
          ★
        </span>
        Favoris{favorites.length ? ` (${favorites.length})` : ''}
      </button>

      {open && (
        <div className="thin-scroll absolute left-0 z-30 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-xl border border-line bg-paper-card p-2 shadow-float">
          {favorites.length === 0 ? (
            <p className="px-2 py-3 text-xs text-ink-muted">
              Aucun favori. Ajoutez des régions via l’étoile dans une fiche.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {favorites.map((id) => {
                const r = getRegion(id);
                if (!r) return null;
                return (
                  <li key={id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-paper-soft">
                    <button
                      onClick={() => {
                        selectAndFocus(id);
                        setOpen(false);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm text-ink">{r.name}</span>
                      <span className="block truncate text-[11px] text-ink-muted">{r.country}</span>
                    </button>
                    <button
                      onClick={() => toggleFavorite(id)}
                      aria-label="Retirer"
                      className="shrink-0 text-ink-muted hover:text-accent"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

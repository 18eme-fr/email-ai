'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { search, type SearchResult } from '@/lib/search';
import { useAtlas } from '@/state/store';

const KIND_ICON: Record<SearchResult['kind'], string> = {
  region: '◍',
  grape: '❧',
  producer: '⌂',
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectAndFocus = useAtlas((s) => s.selectAndFocus);
  const setGrapeExplorer = useAtlas((s) => s.setGrapeExplorer);

  const results = useMemo(() => (query ? search(query) : []), [query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function choose(r: SearchResult) {
    if (r.kind === 'region') {
      selectAndFocus(r.id);
    } else if (r.kind === 'producer' && r.regionId) {
      selectAndFocus(r.regionId);
    } else if (r.kind === 'grape' && r.grapeId) {
      // Active le mode « explorer un cépage » : les zones concernées
      // s'entourent de doré à tous les niveaux de zoom.
      setGrapeExplorer(r.grapeId);
    }
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-paper-card/95 px-3 py-2 shadow-float backdrop-blur">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-ink-muted">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher une région, un cépage, un domaine…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none"
          aria-label="Recherche universelle"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            aria-label="Effacer"
            className="rounded-full p-0.5 text-ink-muted hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="thin-scroll absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-paper-card py-1 shadow-float">
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.id}`}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                  i === active ? 'bg-accent-faint' : 'hover:bg-paper-soft'
                }`}
              >
                <span
                  className={`text-sm ${r.kind === 'grape' ? 'text-gold' : 'text-accent'}`}
                  aria-hidden
                >
                  {KIND_ICON[r.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{r.label}</span>
                  <span className="block truncate text-[11px] text-ink-muted">{r.sublabel}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query && results.length === 0 && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-line bg-paper-card px-3 py-3 text-sm text-ink-muted shadow-float">
          Aucun résultat pour « {query} ».
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { WINE_STYLE_LABELS, type ClimateType, type SoilType } from '@/lib/types';
import {
  availableClimates,
  availableGrapeIds,
  availableSoils,
  availableStyles,
  isFilterActive,
} from '@/lib/filters';
import { grapeLabel } from '@/lib/search';
import { useAtlas } from '@/state/store';

export default function Filters() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filters = useAtlas((s) => s.filters);
  const toggleStyle = useAtlas((s) => s.toggleStyle);
  const setClimate = useAtlas((s) => s.setClimate);
  const setSoil = useAtlas((s) => s.setSoil);
  const setGrapeFilter = useAtlas((s) => s.setGrapeFilter);
  const resetFilters = useAtlas((s) => s.resetFilters);

  const styles = useMemo(() => availableStyles(), []);
  const climates = useMemo(() => availableClimates(), []);
  const soils = useMemo(() => availableSoils(), []);
  const grapeIds = useMemo(
    () => availableGrapeIds().sort((a, b) => grapeLabel(a).localeCompare(grapeLabel(b))),
    [],
  );

  const activeCount =
    filters.styles.length +
    (filters.grapeId ? 1 : 0) +
    (filters.climate ? 1 : 0) +
    (filters.soil ? 1 : 0);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm shadow-float backdrop-blur transition-colors ${
          isFilterActive(filters)
            ? 'border-accent bg-accent-faint text-accent'
            : 'border-line bg-paper-card/95 text-ink-soft hover:border-ink-muted'
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 4h12M4 8h8M6 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filtres
        {activeCount > 0 && (
          <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-medium text-paper">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="thin-scroll absolute left-0 z-30 mt-1.5 max-h-[70vh] w-[300px] overflow-y-auto rounded-xl border border-line bg-paper-card p-4 shadow-float">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-sm font-medium uppercase tracking-widest text-accent">Filtres</h3>
            {isFilterActive(filters) && (
              <button
                onClick={resetFilters}
                className="text-xs text-ink-muted underline transition-colors hover:text-accent"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Type de vin */}
          <div className="mb-4">
            <p className="mb-1.5 text-xs text-ink-muted">Type de vin</p>
            <div className="flex flex-wrap gap-1.5">
              {styles.map((s) => {
                const on = filters.styles.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStyle(s)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      on
                        ? 'border-accent bg-accent-faint text-accent'
                        : 'border-line text-ink-soft hover:border-ink-muted'
                    }`}
                  >
                    {WINE_STYLE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cépage */}
          <FilterSelect
            label="Cépage"
            value={filters.grapeId ?? ''}
            onChange={(v) => setGrapeFilter(v || null)}
            options={grapeIds.map((id) => ({ value: id, label: grapeLabel(id) }))}
          />

          {/* Climat */}
          <FilterSelect
            label="Climat"
            value={filters.climate ?? ''}
            onChange={(v) => setClimate((v || null) as ClimateType | null)}
            options={climates.map((c) => ({ value: c, label: c }))}
          />

          {/* Sol */}
          <FilterSelect
            label="Type de sol"
            value={filters.soil ?? ''}
            onChange={(v) => setSoil((v || null) as SoilType | null)}
            options={soils.map((s) => ({ value: s, label: s }))}
          />

          <p className="mt-3 text-[11px] italic leading-relaxed text-ink-muted/70">
            Les zones non concernées s’estompent sur la carte. Le filtre tient compte de l’héritage
            régional (une appellation hérite du terroir de sa région).
          </p>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-ink-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
      >
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

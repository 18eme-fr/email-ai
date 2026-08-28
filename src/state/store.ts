'use client';

import { create } from 'zustand';
import type { ClimateType, SoilType, WineStyle } from '@/lib/types';
import { EMPTY_FILTERS, type FilterState } from '@/lib/filters';

const FAV_KEY = 'atlas-vin-favorites';

function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    /* stockage indisponible : on ignore silencieusement */
  }
}

export interface AtlasState {
  selectedId: string | null;
  hoveredId: string | null;
  filters: FilterState;
  /** Mode « Explorer un cépage » : id du cépage mis en évidence, ou null. */
  grapeExplorer: string | null;
  /** Comparateur : jusqu'à deux régions. */
  compare: string[];
  compareOpen: boolean;
  learnOpen: boolean;
  favorites: string[];
  zoom: number;
  /** API impérative fournie par la carte pour centrer sur une zone. */
  mapFocus: ((id: string) => void) | null;

  select: (id: string | null) => void;
  selectAndFocus: (id: string) => void;
  hover: (id: string | null) => void;

  toggleStyle: (s: WineStyle) => void;
  setClimate: (c: ClimateType | null) => void;
  setSoil: (s: SoilType | null) => void;
  setGrapeFilter: (id: string | null) => void;
  resetFilters: () => void;

  setGrapeExplorer: (id: string | null) => void;

  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  setCompareOpen: (v: boolean) => void;
  setLearnOpen: (v: boolean) => void;

  toggleFavorite: (id: string) => void;
  hydrateFavorites: () => void;

  setZoom: (z: number) => void;
  setMapFocus: (fn: ((id: string) => void) | null) => void;
}

export const useAtlas = create<AtlasState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  filters: EMPTY_FILTERS,
  grapeExplorer: null,
  compare: [],
  compareOpen: false,
  learnOpen: false,
  favorites: [],
  zoom: 2,
  mapFocus: null,

  select: (id) => set({ selectedId: id }),
  selectAndFocus: (id) => {
    set({ selectedId: id });
    get().mapFocus?.(id);
  },
  hover: (id) => set({ hoveredId: id }),

  toggleStyle: (s) =>
    set((state) => {
      const has = state.filters.styles.includes(s);
      return {
        filters: {
          ...state.filters,
          styles: has ? state.filters.styles.filter((x) => x !== s) : [...state.filters.styles, s],
        },
      };
    }),
  setClimate: (c) => set((state) => ({ filters: { ...state.filters, climate: c } })),
  setSoil: (s) => set((state) => ({ filters: { ...state.filters, soil: s } })),
  setGrapeFilter: (id) => set((state) => ({ filters: { ...state.filters, grapeId: id } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),

  setGrapeExplorer: (id) => set({ grapeExplorer: id }),

  toggleCompare: (id) =>
    set((state) => {
      if (state.compare.includes(id)) {
        return { compare: state.compare.filter((x) => x !== id) };
      }
      const next = [...state.compare, id].slice(-2); // au plus deux
      return { compare: next, compareOpen: next.length === 2 ? true : state.compareOpen };
    }),
  clearCompare: () => set({ compare: [], compareOpen: false }),
  setCompareOpen: (v) => set({ compareOpen: v }),
  setLearnOpen: (v) => set({ learnOpen: v }),

  toggleFavorite: (id) =>
    set((state) => {
      const has = state.favorites.includes(id);
      const favorites = has ? state.favorites.filter((x) => x !== id) : [...state.favorites, id];
      saveFavorites(favorites);
      return { favorites };
    }),
  hydrateFavorites: () => set({ favorites: loadFavorites() }),

  setZoom: (z) => set({ zoom: z }),
  setMapFocus: (fn) => set({ mapFocus: fn }),
}));

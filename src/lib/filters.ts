import type { ClimateType, SoilType, WineRegionInfo, WineStyle } from './types';
import { REGIONS, getAncestry } from '@/data/regions';

/** État courant des filtres (exigence n°9). */
export interface FilterState {
  styles: WineStyle[];
  grapeId: string | null;
  climate: ClimateType | null;
  soil: SoilType | null;
}

export const EMPTY_FILTERS: FilterState = {
  styles: [],
  grapeId: null,
  climate: null,
  soil: null,
};

export function isFilterActive(f: FilterState): boolean {
  return f.styles.length > 0 || f.grapeId !== null || f.climate !== null || f.soil !== null;
}

/**
 * Une zone correspond-elle aux filtres ? On tient compte de l'héritage :
 * une appellation hérite du climat/sol/cépages de ses parents si les siens ne
 * sont pas renseignés (utile car les fiches filles sont plus légères).
 */
export function matchesFilters(region: WineRegionInfo, f: FilterState): boolean {
  if (!isFilterActive(f)) return true;
  const ancestry = getAncestry(region.id); // du pays à la zone

  const styles = new Set<WineStyle>();
  const grapeIds = new Set<string>();
  const climates = new Set<ClimateType>();
  const soils = new Set<SoilType>();
  for (const a of ancestry) {
    a.wineStyles.forEach((s) => styles.add(s));
    a.grapes.forEach((g) => grapeIds.add(g.grapeId));
    if (a.climate.type) climates.add(a.climate.type);
    a.soils.forEach((s) => soils.add(s));
  }

  if (f.styles.length > 0 && !f.styles.some((s) => styles.has(s))) return false;
  if (f.grapeId && !grapeIds.has(f.grapeId)) return false;
  if (f.climate && !climates.has(f.climate)) return false;
  if (f.soil && !soils.has(f.soil)) return false;
  return true;
}

/** Ids des zones correspondant aux filtres (pour piloter l'opacité sur la carte). */
export function matchingIds(f: FilterState): Set<string> {
  const ids = new Set<string>();
  if (!isFilterActive(f)) {
    for (const r of REGIONS) ids.add(r.id);
    return ids;
  }
  for (const r of REGIONS) if (matchesFilters(r, f)) ids.add(r.id);
  return ids;
}

/** Valeurs distinctes présentes dans le jeu de données (pour peupler les menus). */
export function availableClimates(): ClimateType[] {
  const set = new Set<ClimateType>();
  for (const r of REGIONS) if (r.climate.type) set.add(r.climate.type);
  return [...set].sort();
}

export function availableSoils(): SoilType[] {
  const set = new Set<SoilType>();
  for (const r of REGIONS) r.soils.forEach((s) => set.add(s));
  return [...set].sort();
}

export function availableStyles(): WineStyle[] {
  const set = new Set<WineStyle>();
  for (const r of REGIONS) r.wineStyles.forEach((s) => set.add(s));
  return [...set];
}

/** Cépages présents dans le jeu de données, triés par couleur puis nom. */
export function availableGrapeIds(): string[] {
  const set = new Set<string>();
  for (const r of REGIONS) r.grapes.forEach((g) => set.add(g.grapeId));
  return [...set];
}

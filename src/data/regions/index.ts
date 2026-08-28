import type { WineRegionInfo } from '@/lib/types';
import { COUNTRIES } from './countries';
import { FRANCE } from './france';
import { ITALY } from './italy';
import { IBERIA } from './iberia';
import { NEW_WORLD } from './newworld';

/** Couche encyclopédique complète (toutes les fiches, tous niveaux confondus). */
export const REGIONS: WineRegionInfo[] = [
  ...COUNTRIES,
  ...FRANCE,
  ...ITALY,
  ...IBERIA,
  ...NEW_WORLD,
];

export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

/** Enfants directs d'une zone (via parentId). */
export const CHILDREN_BY_PARENT = new Map<string | null, WineRegionInfo[]>();
for (const r of REGIONS) {
  const list = CHILDREN_BY_PARENT.get(r.parentId) ?? [];
  list.push(r);
  CHILDREN_BY_PARENT.set(r.parentId, list);
}

export function getRegion(id: string): WineRegionInfo | undefined {
  return REGION_BY_ID.get(id);
}

export function getChildren(id: string | null): WineRegionInfo[] {
  return CHILDREN_BY_PARENT.get(id) ?? [];
}

/** Chaîne d'ascendance (du pays jusqu'à la zone), incluse. */
export function getAncestry(id: string): WineRegionInfo[] {
  const chain: WineRegionInfo[] = [];
  let current = REGION_BY_ID.get(id);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    chain.unshift(current);
    current = current.parentId ? REGION_BY_ID.get(current.parentId) : undefined;
  }
  return chain;
}

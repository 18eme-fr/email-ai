import { REGIONS, getRegion } from '@/data/regions';
import { GRAPES, GRAPE_BY_ID } from '@/data/grapes';

/** Normalise (minuscules, sans accents) pour une recherche tolérante. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .trim();
}

export type SearchKind = 'region' | 'grape' | 'producer';

export interface SearchResult {
  kind: SearchKind;
  id: string;
  label: string;
  sublabel: string;
  /** Pour un cépage : régions concernées (pour le mode explorer). */
  grapeId?: string;
  /** Pour un domaine : région d'appartenance à sélectionner. */
  regionId?: string;
}

interface IndexEntry extends SearchResult {
  haystack: string;
}

const LEVEL_FR: Record<string, string> = {
  country: 'Pays',
  region: 'Région',
  subregion: 'Sous-région',
  appellation: 'Appellation',
};

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  // Régions / pays / appellations
  for (const r of REGIONS) {
    const sub =
      r.level === 'country'
        ? 'Pays'
        : `${LEVEL_FR[r.level]} · ${r.country}`;
    entries.push({
      kind: 'region',
      id: r.id,
      label: r.name,
      sublabel: sub,
      haystack: normalize(`${r.name} ${r.country} ${r.adminRegion ?? ''}`),
    });
  }

  // Cépages — on n'indexe que ceux effectivement présents dans une région,
  // pour que le mode « explorer un cépage » ne soit jamais vide.
  const referenced = new Set<string>();
  for (const r of REGIONS) for (const g of r.grapes) referenced.add(g.grapeId);
  for (const g of GRAPES) {
    if (!referenced.has(g.id)) continue;
    entries.push({
      kind: 'grape',
      id: g.id,
      grapeId: g.id,
      label: g.name,
      sublabel: `Cépage ${g.color} · explorer sur la carte`,
      haystack: normalize(`${g.name} ${g.aliases.join(' ')}`),
    });
  }

  // Producteurs emblématiques
  const seen = new Set<string>();
  for (const r of REGIONS) {
    for (const p of r.producers) {
      const key = normalize(p.name);
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        kind: 'producer',
        id: `${r.id}::${key}`,
        regionId: r.id,
        label: p.name,
        sublabel: `Domaine · ${r.name}`,
        haystack: normalize(p.name),
      });
    }
  }

  return entries;
}

const INDEX = buildIndex();

const KIND_RANK: Record<SearchKind, number> = { region: 0, grape: 1, producer: 2 };

export function search(query: string, limit = 12): SearchResult[] {
  const q = normalize(query);
  if (q.length < 1) return [];
  const scored: { entry: IndexEntry; score: number }[] = [];
  for (const entry of INDEX) {
    const idx = entry.haystack.indexOf(q);
    if (idx === -1) continue;
    // Score : préfixe > mot > sous-chaîne, puis par type puis alphabétique.
    const startsWord = idx === 0 || entry.haystack[idx - 1] === ' ';
    let score = idx === 0 ? 0 : startsWord ? 1 : 2;
    score = score * 10 + KIND_RANK[entry.kind];
    scored.push({ entry, score });
  }
  scored.sort((a, b) => a.score - b.score || a.entry.label.localeCompare(b.entry.label));
  return scored.slice(0, limit).map((s) => s.entry);
}

/** Régions (ids) où un cépage est cultivé — pour le mode « Explorer un cépage ». */
export function regionsForGrape(grapeId: string): string[] {
  return REGIONS.filter((r) => r.grapes.some((g) => g.grapeId === grapeId)).map((r) => r.id);
}

export function grapeLabel(grapeId: string): string {
  return GRAPE_BY_ID.get(grapeId)?.name ?? grapeId;
}

export { getRegion };

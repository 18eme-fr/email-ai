import type { FeatureCollection } from 'geojson';
import type { AtlasFeature, AtlasLevel } from './types';
import { getGeometry } from '@/data/geometries';
import { REGIONS, getRegion, getChildren } from '@/data/regions';

/**
 * Couche de service : joint la couche géographique (géométries) et la couche
 * encyclopédique (fiches) pour produire les données consommées par la carte.
 */

/** Bandes de zoom d'affichage par niveau (min inclus, max exclus côté carte). */
export const LEVEL_ZOOM: Record<AtlasLevel, [number, number]> = {
  country: [0, 4.8],
  region: [4.2, 7.4],
  subregion: [6.6, 9.2],
  appellation: [8.2, 22],
};

/** Niveau « logique » attendu pour un zoom donné (utilisé pour le fil d'Ariane / libellés). */
export function levelForZoom(zoom: number): AtlasLevel {
  if (zoom < LEVEL_ZOOM.region[0]) return 'country';
  if (zoom < LEVEL_ZOOM.subregion[0]) return 'region';
  if (zoom < LEVEL_ZOOM.appellation[0]) return 'subregion';
  return 'appellation';
}

/**
 * Palette pays cohérente (tons muets, style atlas). Une couleur par pays ;
 * la nuance d'affichage varie ensuite selon le niveau (opacité).
 */
export const COUNTRY_COLORS: Record<string, string> = {
  FR: '#6b4c7a', // prune
  IT: '#8a5a3b', // terre de sienne
  ES: '#a9762f', // ocre
  PT: '#4f7a6b', // vert-de-gris
  DE: '#4a6d94', // bleu ardoise
  AT: '#5b8fa8',
  GR: '#3f7fa6',
  GE: '#7d6f57',
  HU: '#956b8f',
  RO: '#7a7a45',
  US: '#3f6f8f', // bleu
  CA: '#5f7f9f',
  MX: '#b5773a',
  AR: '#9c6b8a', // vieux rose
  CL: '#8f5b52', // brique
  UY: '#6f8f7a',
  BR: '#5a8f6b',
  ZA: '#c08a3e', // or safrané
  MA: '#b07a4a',
  AU: '#8a6f3f', // ocre chaud
  NZ: '#4f8f8a', // turquoise sourd
  CN: '#8f5f6f',
  JP: '#7a6f9a',
  LB: '#7f8a4f',
  IL: '#6f8a9a',
};

export const DEFAULT_COLOR = '#8a8577';

export function colorFor(countryCode: string): string {
  return COUNTRY_COLORS[countryCode] ?? DEFAULT_COLOR;
}

/** Construit une entité géographique enrichie pour un id donné. */
function toFeature(id: string): AtlasFeature | null {
  const info = getRegion(id);
  const geometry = getGeometry(id);
  if (!info || !geometry) return null;
  return {
    type: 'Feature',
    id,
    geometry,
    properties: {
      id,
      name: info.name,
      level: info.level,
      country: info.country,
      countryCode: info.countryCode,
      parentId: info.parentId,
      hasInfo: true,
    },
  };
}

/** Toutes les entités disposant d'une géométrie, tous niveaux confondus. */
export const ALL_FEATURES: AtlasFeature[] = REGIONS.map((r) => toFeature(r.id)).filter(
  (f): f is AtlasFeature => f !== null,
);

export const FEATURES_BY_LEVEL: Record<AtlasLevel, AtlasFeature[]> = {
  country: [],
  region: [],
  subregion: [],
  appellation: [],
};
for (const f of ALL_FEATURES) FEATURES_BY_LEVEL[f.properties.level].push(f);

export function featureCollection(level: AtlasLevel): FeatureCollection {
  return { type: 'FeatureCollection', features: FEATURES_BY_LEVEL[level] };
}

export function allFeatureCollection(): FeatureCollection {
  return { type: 'FeatureCollection', features: ALL_FEATURES };
}

export type BBox = [number, number, number, number];

/** Bounding box [ouest, sud, est, nord] d'une entité. */
export function bboxOf(id: string): BBox | null {
  const geom = getGeometry(id);
  if (!geom) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const rings = geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat();
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (!isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

/** Les enfants d'une zone qui possèdent une géométrie (pour « explorer plus bas »). */
export function drawableChildren(id: string) {
  return getChildren(id).filter((c) => getGeometry(c.id));
}

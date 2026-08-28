import type { Polygon, MultiPolygon, Position } from 'geojson';
import countryGeometries from './geo/country-geometries.json';

/**
 * COUCHE GÉOGRAPHIQUE.
 *
 * - Les pays utilisent des tracés réels (Natural Earth, simplifiés 1:110m).
 * - Les régions / sous-régions / appellations utilisent, pour ce MVP, des
 *   tracés SCHÉMATIQUES générés autour de leur centroïde réel. Ils sont
 *   volontairement approximatifs et destinés à être remplacés par le
 *   parcellaire officiel (INAO, AVA/TTB, DOC…) — cf. `APPROXIMATE_GEOMETRY`.
 *
 * Cette couche ne contient que des géométries : le savoir œnologique vit dans
 * la couche encyclopédique (`src/data/regions`). Jointure par `id`.
 */

/** Vrai : les tracés régionaux sont approximatifs (affiché dans la fiche). */
export const APPROXIMATE_GEOMETRY = true;

// PRNG déterministe (mulberry32) pour des formes stables d'une exécution à l'autre.
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BlobSpec {
  /** centre [lng, lat] */
  c: [number, number];
  /** rayon est-ouest en degrés */
  rx: number;
  /** rayon nord-sud en degrés */
  ry: number;
  /** rotation en degrés (sens horaire) */
  rot?: number;
  /** nombre de sommets */
  n?: number;
  /** amplitude d'irrégularité (0 = ellipse lisse) */
  jitter?: number;
}

/** Génère un polygone organique et déterministe autour d'un centroïde. */
function blob(id: string, s: BlobSpec): Polygon {
  const { c, rx, ry, rot = 0, n = 11, jitter = 0.16 } = s;
  const rand = mulberry32(hashSeed(id));
  const rotRad = (rot * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);
  const ring: Position[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 1 + (rand() - 0.5) * 2 * jitter;
    // point sur l'ellipse (repère local)
    const lx = Math.cos(a) * rx * wobble;
    const ly = Math.sin(a) * ry * wobble;
    // rotation + latitude-correction pour garder des proportions plausibles
    const x = c[0] + (lx * cosR - ly * sinR) / Math.max(0.2, Math.cos((c[1] * Math.PI) / 180));
    const y = c[1] + (lx * sinR + ly * cosR);
    ring.push([Number(x.toFixed(4)), Number(y.toFixed(4))]);
  }
  ring.push(ring[0]);
  return { type: 'Polygon', coordinates: [ring] };
}

/**
 * Spécifications des tracés régionaux (centroïdes réels, extensions plausibles).
 * rx/ry en degrés ; rot pour orienter les vignobles en « bande ».
 */
const SPECS: Record<string, BlobSpec> = {
  // ——— FRANCE : Bordeaux ———
  'fr-bordeaux': { c: [-0.5, 44.9], rx: 0.62, ry: 0.62, jitter: 0.18 },
  'fr-bordeaux-medoc': { c: [-0.85, 45.28], rx: 0.11, ry: 0.34, rot: 22, jitter: 0.22 },
  'fr-bordeaux-haut-medoc': { c: [-0.77, 45.12], rx: 0.09, ry: 0.22, rot: 22, jitter: 0.2 },
  'fr-bordeaux-pauillac': { c: [-0.75, 45.2], rx: 0.045, ry: 0.05 },
  'fr-bordeaux-margaux': { c: [-0.67, 45.04], rx: 0.05, ry: 0.05 },
  'fr-bordeaux-saint-julien': { c: [-0.75, 45.15], rx: 0.035, ry: 0.04 },
  'fr-bordeaux-saint-estephe': { c: [-0.77, 45.27], rx: 0.045, ry: 0.05 },
  'fr-bordeaux-listrac-medoc': { c: [-0.83, 45.09], rx: 0.035, ry: 0.04 },
  'fr-bordeaux-moulis': { c: [-0.78, 45.05], rx: 0.035, ry: 0.035 },
  'fr-bordeaux-saint-emilion': { c: [-0.15, 44.9], rx: 0.08, ry: 0.06 },
  'fr-bordeaux-pomerol': { c: [-0.2, 44.93], rx: 0.04, ry: 0.04 },
  'fr-bordeaux-pessac-leognan': { c: [-0.6, 44.75], rx: 0.09, ry: 0.09 },
  'fr-bordeaux-sauternes': { c: [-0.33, 44.53], rx: 0.06, ry: 0.06 },
  // ——— FRANCE : Bourgogne ———
  'fr-bourgogne': { c: [4.5, 47.0], rx: 0.7, ry: 1.15, rot: 15, jitter: 0.2 },
  'fr-bourgogne-chablis': { c: [3.8, 47.82], rx: 0.12, ry: 0.1 },
  'fr-bourgogne-cote-de-nuits': { c: [4.95, 47.18], rx: 0.05, ry: 0.14, rot: 12 },
  'fr-bourgogne-cote-de-beaune': { c: [4.79, 47.0], rx: 0.06, ry: 0.14, rot: 12 },
  'fr-bourgogne-cote-chalonnaise': { c: [4.7, 46.65], rx: 0.07, ry: 0.15, rot: 10 },
  'fr-bourgogne-maconnais': { c: [4.75, 46.35], rx: 0.1, ry: 0.18, rot: 8 },
  'fr-bourgogne-gevrey-chambertin': { c: [4.97, 47.23], rx: 0.03, ry: 0.035 },
  'fr-bourgogne-morey-saint-denis': { c: [4.95, 47.2], rx: 0.02, ry: 0.025 },
  'fr-bourgogne-chambolle-musigny': { c: [4.95, 47.19], rx: 0.022, ry: 0.025 },
  'fr-bourgogne-vosne-romanee': { c: [4.94, 47.16], rx: 0.025, ry: 0.03 },
  'fr-bourgogne-nuits-saint-georges': { c: [4.94, 47.13], rx: 0.03, ry: 0.04 },
  'fr-bourgogne-meursault': { c: [4.77, 46.98], rx: 0.03, ry: 0.035 },
  'fr-bourgogne-puligny-montrachet': { c: [4.75, 46.95], rx: 0.025, ry: 0.03 },
  'fr-bourgogne-pommard': { c: [4.79, 47.02], rx: 0.025, ry: 0.03 },
  // ——— FRANCE : Champagne ———
  'fr-champagne': { c: [4.02, 49.1], rx: 0.4, ry: 0.34, jitter: 0.2 },
  'fr-champagne-montagne-de-reims': { c: [4.05, 49.15], rx: 0.12, ry: 0.09 },
  'fr-champagne-cote-des-blancs': { c: [4.0, 48.93], rx: 0.06, ry: 0.11, rot: 5 },
  'fr-champagne-vallee-de-la-marne': { c: [3.82, 49.05], rx: 0.16, ry: 0.06 },
  // ——— FRANCE : Rhône ———
  'fr-rhone': { c: [4.83, 44.6], rx: 0.32, ry: 0.95, jitter: 0.18 },
  'fr-rhone-septentrional': { c: [4.83, 45.15], rx: 0.14, ry: 0.34, rot: 4 },
  'fr-rhone-meridional': { c: [4.85, 44.15], rx: 0.34, ry: 0.32 },
  'fr-rhone-cote-rotie': { c: [4.86, 45.5], rx: 0.03, ry: 0.05 },
  'fr-rhone-condrieu': { c: [4.78, 45.46], rx: 0.03, ry: 0.05 },
  'fr-rhone-hermitage': { c: [4.83, 45.09], rx: 0.03, ry: 0.03 },
  'fr-rhone-chateauneuf-du-pape': { c: [4.83, 44.06], rx: 0.05, ry: 0.05 },
  'fr-rhone-gigondas': { c: [5.0, 44.19], rx: 0.035, ry: 0.04 },
  // ——— FRANCE : Loire ———
  'fr-loire': { c: [0.4, 47.35], rx: 1.55, ry: 0.36, jitter: 0.16 },
  'fr-loire-muscadet': { c: [-1.35, 47.15], rx: 0.16, ry: 0.12 },
  'fr-loire-savennieres': { c: [-0.63, 47.38], rx: 0.04, ry: 0.035 },
  'fr-loire-vouvray': { c: [0.8, 47.42], rx: 0.06, ry: 0.05 },
  'fr-loire-chinon': { c: [0.24, 47.17], rx: 0.07, ry: 0.05 },
  'fr-loire-sancerre': { c: [2.83, 47.33], rx: 0.07, ry: 0.06 },
  'fr-loire-pouilly-fume': { c: [2.95, 47.29], rx: 0.05, ry: 0.05 },
  // ——— ITALIE ———
  'it-piemonte': { c: [8.0, 44.7], rx: 0.5, ry: 0.42, jitter: 0.18 },
  'it-piemonte-langhe': { c: [8.03, 44.62], rx: 0.16, ry: 0.16 },
  'it-piemonte-barolo': { c: [7.94, 44.61], rx: 0.05, ry: 0.05 },
  'it-piemonte-barbaresco': { c: [8.09, 44.72], rx: 0.04, ry: 0.04 },
  'it-toscana': { c: [11.2, 43.4], rx: 0.7, ry: 0.66, jitter: 0.18 },
  'it-toscana-chianti-classico': { c: [11.35, 43.47], rx: 0.16, ry: 0.2 },
  'it-toscana-brunello-montalcino': { c: [11.49, 43.06], rx: 0.08, ry: 0.08 },
  'it-veneto': { c: [11.55, 45.5], rx: 0.75, ry: 0.42, jitter: 0.18 },
  'it-veneto-valpolicella': { c: [10.95, 45.53], rx: 0.1, ry: 0.09 },
  'it-veneto-soave': { c: [11.25, 45.42], rx: 0.08, ry: 0.06 },
  'it-veneto-prosecco': { c: [12.1, 45.9], rx: 0.16, ry: 0.07, rot: -15 },
  // ——— ESPAGNE ———
  'es-rioja': { c: [-2.5, 42.42], rx: 0.6, ry: 0.24, jitter: 0.18 },
  'es-ribera-del-duero': { c: [-3.7, 41.62], rx: 0.55, ry: 0.2, jitter: 0.18 },
  'es-priorat': { c: [0.8, 41.2], rx: 0.12, ry: 0.12 },
  // ——— PORTUGAL ———
  'pt-douro': { c: [-7.5, 41.18], rx: 0.5, ry: 0.22, jitter: 0.2 },
  // ——— ÉTATS-UNIS ———
  'us-napa': { c: [-122.35, 38.5], rx: 0.12, ry: 0.28, rot: 25, jitter: 0.18 },
  'us-napa-rutherford': { c: [-122.42, 38.46], rx: 0.03, ry: 0.045, rot: 25 },
  'us-napa-oakville': { c: [-122.4, 38.43], rx: 0.03, ry: 0.04, rot: 25 },
  'us-sonoma': { c: [-122.85, 38.45], rx: 0.28, ry: 0.32, jitter: 0.18 },
  // ——— ARGENTINE ———
  'ar-mendoza': { c: [-68.75, -33.35], rx: 0.42, ry: 0.55, jitter: 0.18 },
  'ar-mendoza-valle-de-uco': { c: [-69.15, -33.65], rx: 0.14, ry: 0.28, rot: 10 },
  // ——— CHILI ———
  'cl-maipo': { c: [-70.7, -33.7], rx: 0.3, ry: 0.18, jitter: 0.18 },
  'cl-colchagua': { c: [-71.2, -34.6], rx: 0.35, ry: 0.16, jitter: 0.18 },
  // ——— AFRIQUE DU SUD ———
  'za-stellenbosch': { c: [18.86, -33.94], rx: 0.14, ry: 0.14, jitter: 0.18 },
  // ——— AUSTRALIE ———
  'au-barossa': { c: [138.95, -34.55], rx: 0.14, ry: 0.16, jitter: 0.18 },
  'au-margaret-river': { c: [115.07, -33.95], rx: 0.12, ry: 0.24, jitter: 0.18 },
  // ——— NOUVELLE-ZÉLANDE ———
  'nz-marlborough': { c: [173.85, -41.52], rx: 0.24, ry: 0.14, jitter: 0.18 },
  'nz-central-otago': { c: [169.2, -45.0], rx: 0.32, ry: 0.28, jitter: 0.2 },
};

const GEOMETRY_BY_ID = new Map<string, Polygon | MultiPolygon>();

// Pays (tracés réels)
for (const [id, geom] of Object.entries(countryGeometries)) {
  GEOMETRY_BY_ID.set(id, geom as Polygon | MultiPolygon);
}
// Régions et zones (tracés schématiques générés)
for (const [id, spec] of Object.entries(SPECS)) {
  GEOMETRY_BY_ID.set(id, blob(id, spec));
}

export function getGeometry(id: string): Polygon | MultiPolygon | undefined {
  return GEOMETRY_BY_ID.get(id);
}

export { GEOMETRY_BY_ID };

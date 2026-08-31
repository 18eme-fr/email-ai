import fs from 'node:fs';
import { createRequire } from 'node:module';
import * as d3 from 'd3';
const require = createRequire(import.meta.url);
const polygonClipping = require('polygon-clipping');

/**
 * Tracés HIÉRARCHIQUES et JOINTIFS.
 *
 * Stratégie « bottom-up » : pour chaque grande région, on pave sa surface par un
 * diagramme de Voronoï des centroïdes réels de ses APPELLATIONS FEUILLES, découpé
 * sur le contour de la région. Chaque zone intermédiaire (sous-région) devient
 * alors l'UNION des cellules de ses feuilles. Résultat : le pavage est cohérent à
 * tous les niveaux (Bordeaux → Médoc → communes) et chaque zone contient bien ses
 * enfants. Tracés schématiques (centroïdes réels, contours approximatifs).
 */

const data = JSON.parse(fs.readFileSync('scratch/atlas-data.json', 'utf8'));
const regions = data.regions;
const featById = {};
data.features.forEach((f) => { featById[f.properties.id] = f; });

const META = {};
regions.forEach((r) => { META[r.id] = { level: r.level, parentId: r.parentId }; });
const KIDS = {};
regions.forEach((r) => { (KIDS[r.parentId] = KIDS[r.parentId] || []).push(r.id); });
const drawableKids = (id) => (KIDS[id] || []).filter((k) => featById[k]);

function leaves(id) {
  const kids = drawableKids(id);
  if (!kids.length) return [id];
  return kids.reduce((acc, k) => acc.concat(leaves(k)), []);
}

// ---- géométrie planaire en lng/lat (schématique) ----
function rings(geom) { return geom.type === 'Polygon' ? geom.coordinates : [].concat.apply([], geom.coordinates); }
function outerRing(geom) { let best = null, n = -1; for (const r of rings(geom)) if (r.length > n) { n = r.length; best = r; } return best || []; }
function meanPoint(ring) { let x = 0, y = 0; for (const p of ring) { x += p[0]; y += p[1]; } return [x / ring.length, y / ring.length]; }
function bboxOfRings(rs) { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const r of rs) for (const p of r) { if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; } return [a, b, c, d]; }
function toMP(geom) { return geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates; }
function fromMP(mp) { if (!mp || !mp.length) return null; return mp.length === 1 ? { type: 'Polygon', coordinates: mp[0] } : { type: 'MultiPolygon', coordinates: mp }; }
function pointInGeom(pt, geom) { for (const poly of toMP(geom)) if (d3.polygonContains(poly[0], pt)) return true; return false; }
function signedArea(ring) { let a = 0; for (let i = 0, n = ring.length, j = n - 1; i < n; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; return a / 2; }
// d3.geoPath rend correctement un contour extérieur en sens antihoraire (comme nos
// blobs d'origine) ; polygon-clipping peut renvoyer l'inverse → on ré-oriente.
function rewind(geom) {
  const polys = toMP(geom).map((poly) => poly.map((ring, ri) => {
    const ccw = signedArea(ring) > 0;
    const wantCCW = ri === 0; // extérieur antihoraire, trous horaires
    return ccw === wantCCW ? ring : ring.slice().reverse();
  }));
  return fromMP(polys);
}
function clampInside(seed, geom) {
  if (pointInGeom(seed, geom)) return seed;
  const center = meanPoint(outerRing(geom));
  for (let t = 0.15; t <= 1.0001; t += 0.12) {
    const p = [seed[0] + (center[0] - seed[0]) * t, seed[1] + (center[1] - seed[1]) * t];
    if (pointInGeom(p, geom)) return p;
  }
  return center;
}

const seedOf = {};
data.features.forEach((f) => { seedOf[f.properties.id] = meanPoint(outerRing(f.geometry)); });

const leafCell = {}; // leafId -> geometry (cellule découpée)

regions.filter((r) => r.level === 'region' && drawableKids(r.id).length).forEach((r) => {
  const regionGeom = featById[r.id].geometry;
  const leafIds = leaves(r.id);
  if (leafIds.length === 1) { leafCell[leafIds[0]] = regionGeom; return; }

  // Décalage minuscule si deux graines coïncident (Voronoï dégénère sinon).
  const used = {};
  const seeds = leafIds.map((id) => {
    let s = clampInside(seedOf[id], regionGeom);
    let key = s[0].toFixed(4) + ',' + s[1].toFixed(4);
    while (used[key]) { s = [s[0] + 0.0007, s[1] + 0.0005]; key = s[0].toFixed(4) + ',' + s[1].toFixed(4); }
    used[key] = 1;
    return s;
  });

  const [x0, y0, x1, y1] = bboxOfRings(rings(regionGeom));
  const pad = Math.max(x1 - x0, y1 - y0) * 0.5 + 0.05;
  const vor = d3.Delaunay.from(seeds).voronoi([x0 - pad, y0 - pad, x1 + pad, y1 + pad]);

  leafIds.forEach((id, i) => {
    const cell = vor.cellPolygon(i);
    let clipped = null;
    if (cell) { try { clipped = polygonClipping.intersection([cell], toMP(regionGeom)); } catch (e) { clipped = null; } }
    leafCell[id] = fromMP(clipped) || regionGeom;
  });
});

// Union des feuilles pour reconstruire chaque zone intermédiaire.
function unionOf(ids) {
  let mp = null;
  for (const id of ids) {
    const g = leafCell[id];
    if (!g) continue;
    mp = mp === null ? toMP(g) : polygonClipping.union(mp, toMP(g));
  }
  return mp ? fromMP(mp) : null;
}

let replaced = 0;
data.features.forEach((f) => {
  const id = f.properties.id, lv = META[id].level;
  if (lv !== 'subregion' && lv !== 'appellation') return;
  let g;
  if (drawableKids(id).length) g = unionOf(leaves(id)); // zone intermédiaire = union des feuilles
  else g = leafCell[id];                                 // feuille = sa cellule
  if (g) { f.geometry = rewind(g); replaced++; }
});

fs.writeFileSync('scratch/atlas-data.tiled.json', JSON.stringify(data));
console.log('leaves tiled:', Object.keys(leafCell).length, '| geometries replaced:', replaced, '| bytes:', fs.statSync('scratch/atlas-data.tiled.json').size);

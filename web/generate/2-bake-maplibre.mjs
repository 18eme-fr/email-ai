import fs from 'node:fs';

/**
 * Prépare la couche viticole pour MapLibre : un FeatureCollection dont chaque
 * entité porte des propriétés « cuites » — couleur de remplissage nuancée, et
 * les zooms MapLibre d'apparition (az) / de disparition (hz) calculés d'après la
 * taille géographique, pour un dévoilement progressif façon carte détaillée.
 */

const data = JSON.parse(fs.readFileSync('scratch/atlas-data.tiled.json', 'utf8'));

const COUNTRY_COLORS = {
  FR: '#6b4c7a', IT: '#8a5a3b', ES: '#a9762f', PT: '#4f7a6b', DE: '#4a6d94',
  AT: '#5b8fa8', GR: '#3f7fa6', GE: '#7d6f57', HU: '#956b8f', RO: '#7a7a45',
  US: '#3f6f8f', CA: '#5f7f9f', MX: '#b5773a', AR: '#9c6b8a', CL: '#8f5b52',
  UY: '#6f8f7a', BR: '#5a8f6b', ZA: '#c08a3e', MA: '#b07a4a', AU: '#8a6f3f',
  NZ: '#4f8f8a', CN: '#8f5f6f', JP: '#7a6f9a', LB: '#7f8a4f', IL: '#6f8a9a',
};
const color = (cc) => COUNTRY_COLORS[cc] || '#8a8577';
function hashF(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
function shade(hex, amt) {
  let n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  const h = (v) => Math.round(v).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
function cellFill(id, cc, level) { return level === 'country' ? color(cc) : shade(color(cc), (hashF(id) - 0.5) * 0.42); }

function rings(geom) { return geom.type === 'Polygon' ? geom.coordinates : [].concat.apply([], geom.coordinates); }
function outerRing(geom) { let best = null, n = -1; for (const r of rings(geom)) if (r.length > n) { n = r.length; best = r; } return best || []; }

const META = {};
data.regions.forEach((r) => { META[r.id] = { level: r.level, parentId: r.parentId, name: r.name, country: r.country, countryCode: r.countryCode }; });
const CHILDREN = {};
data.features.forEach((f) => { const p = META[f.properties.id].parentId; if (p) (CHILDREN[p] = CHILDREN[p] || []).push(f.properties.id); });

// az MapLibre : zoom auquel la plus grande dimension atteint ~APPEAR px.
// px/deg = 512 * 2^z / 360  →  z = log2(APPEAR * 360 / (Ddeg * 512))
const APPEAR = 55;
const azOf = {};
const features = data.features.map((f) => {
  const id = f.properties.id, m = META[id];
  const ring = outerRing(f.geometry);
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, sx = 0, sy = 0;
  ring.forEach((p) => { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; sx += p[0]; sy += p[1]; });
  const cx = sx / ring.length, cy = sy / ring.length;
  const latMid = (minY + maxY) / 2;
  const wDeg = (maxX - minX) * Math.cos((latMid * Math.PI) / 180);
  const hDeg = maxY - minY;
  const D = Math.max(wDeg, hDeg, 1e-4);
  const az = Math.log2((APPEAR * 360) / (D * 512));
  azOf[id] = az;
  return {
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      id, name: m.name, level: m.level, country: m.country, countryCode: m.countryCode,
      parentId: m.parentId || '', fill: cellFill(id, m.countryCode, m.level),
      cx: +cx.toFixed(4), cy: +cy.toFixed(4), az: +az.toFixed(3),
    },
  };
});
// hz = plus petit az des enfants (quand ils pavent la zone) ; sinon +inf.
features.forEach((f) => {
  const kids = CHILDREN[f.properties.id];
  let hz = 99;
  if (kids) kids.forEach((k) => { if (azOf[k] != null) hz = Math.min(hz, azOf[k]); });
  f.properties.hz = +hz.toFixed(3);
});

const fc = { type: 'FeatureCollection', features };
fs.writeFileSync('scratch/wine-fc.json', JSON.stringify(fc));
// Données encyclopédiques (fiches) + cépages pour l'UI
fs.writeFileSync('scratch/atlas-info.json', JSON.stringify({ regions: data.regions, grapes: data.grapes }));
console.log('features:', features.length, '| az range:', Math.min(...features.map(f=>f.properties.az)).toFixed(1), '→', Math.max(...features.map(f=>f.properties.az)).toFixed(1), '| bytes:', fs.statSync('scratch/wine-fc.json').size);

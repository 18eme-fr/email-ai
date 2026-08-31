import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Construit le site public autonome `docs/index.html` (servi par GitHub Pages)
 * à partir des sources de `web/` et de la bibliothèque MapLibre installée.
 *
 *   npm install        # récupère maplibre-gl
 *   node web/build.mjs # écrit docs/index.html
 *
 * Le fond de carte (tuiles CARTO Voyager) et les polices Google sont chargés au
 * runtime par le navigateur ; tout le reste (MapLibre, données, code, styles)
 * est intégré dans le fichier.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (p) => path.join(root, p);
const read = (p) => fs.readFileSync(R(p), 'utf8');

const mlCss = read('node_modules/maplibre-gl/dist/maplibre-gl.css');
const mlJs = read('node_modules/maplibre-gl/dist/maplibre-gl.js');
const appCss = read('web/styles.css');
const appJs = read('web/app.js');
const wine = read('web/wine-fc.json');
const info = read('web/atlas-info.json');

const glCss = `
[hidden] { display:none !important; }
#map { background:#e8edf0; }
.map-label { color:#20242c; text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 5px #fff,0 1px 2px rgba(255,255,255,.9); }
.map-label.lvl-country { color:#2b2e38; }
:root[data-theme='dark'] .map-label, :root:not([data-theme='light']) .map-label { color:#12151b; text-shadow:0 0 3px #fff,0 0 4px #fff; }
.ctlstack { position:absolute; top:14px; right:14px; z-index:30; display:flex; flex-direction:column; gap:6px; }
.ctlstack button { position:static; }
.legend { bottom:34px; }
.maplibregl-ctrl-attrib.maplibregl-compact { background:rgba(255,253,249,.9); }
`;

const skeleton = `
<div id="app">
  <div id="map"></div>
  <div id="labels" style="position:absolute;inset:0;pointer-events:none;z-index:15"></div>
  <div class="tip" id="tip"></div>
  <div class="ctlstack">
    <button class="themebtn" id="theme" title="Changer de thème" aria-label="Changer de thème">◐</button>
    <button class="themebtn" id="zreset" title="Vue monde" aria-label="Vue monde">⤢</button>
  </div>
  <div class="toolbar">
    <div class="row">
      <div class="brand card"><span aria-hidden="true">🌍</span><div><b>Atlas du vin</b><small>Encyclopédie cartographique</small></div></div>
      <div class="search card">
        <div class="box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input id="q" type="text" placeholder="Rechercher une région, un cépage, un domaine…" aria-label="Recherche universelle" autocomplete="off" />
        </div>
      </div>
      <div class="results card" id="res" hidden></div>
      <div style="position:relative">
        <button class="pill" id="fbtn"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Filtres <span class="badge" id="fcount" hidden></span></button>
        <div class="pop card" id="fpop" hidden></div>
      </div>
    </div>
    <div class="row">
      <button class="pill" id="cmpbtn">⇄ Comparer</button>
      <button class="pill" id="quizbtn">◆ Apprendre</button>
      <div style="position:relative">
        <button class="pill" id="favbtn">★ Favoris</button>
        <div class="pop card" id="favpop" hidden></div>
      </div>
    </div>
    <div class="banner card" id="banner" hidden></div>
  </div>
  <aside class="panel" id="panel" aria-live="polite"></aside>
  <div class="legend card" id="legend"></div>
</div>`;

const html = [
  '<!doctype html>',
  '<html lang="fr"><head>',
  '<meta charset="utf-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />',
  '<title>Atlas mondial du vin</title>',
  '<meta name="description" content="Carte interactive et encyclopédie des régions viticoles du monde." />',
  '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />',
  '<style>\n' + mlCss + '\n</style>',
  '<style>\n' + appCss + '\n' + glCss + '\n</style>',
  '</head><body>',
  skeleton,
  '<script>\n' + mlJs + '\n</script>',
  '<script id="wine" type="application/json">' + wine.replace(/</g, '\\u003c') + '</script>',
  '<script id="info" type="application/json">' + info.replace(/</g, '\\u003c') + '</script>',
  '<script>window.WINE_FC=JSON.parse(document.getElementById("wine").textContent);window.ATLAS_INFO=JSON.parse(document.getElementById("info").textContent);</script>',
  '<script>\n' + appJs + '\n</script>',
  '</body></html>',
].join('\n');

fs.mkdirSync(R('docs'), { recursive: true });
fs.writeFileSync(R('docs/index.html'), html);
if (!fs.existsSync(R('docs/.nojekyll'))) fs.writeFileSync(R('docs/.nojekyll'), '');
console.log('wrote docs/index.html', (html.length / 1024 | 0) + ' KB');

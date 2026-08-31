(function () {
  'use strict';
  var INFO = window.ATLAS_INFO, WINE = window.WINE_FC;
  var REGIONS = INFO.regions, GRAPES = INFO.grapes;

  var REGION = {}, GRAPE = {}, FEATURE = {}, KIDS = {};
  REGIONS.forEach(function (r) { REGION[r.id] = r; });
  GRAPES.forEach(function (g) { GRAPE[g.id] = g; });
  WINE.features.forEach(function (f) { FEATURE[f.properties.id] = f; });
  REGIONS.forEach(function (r) { if (FEATURE[r.id] && r.parentId) (KIDS[r.parentId] = KIDS[r.parentId] || []).push(r.id); });

  var LEVEL_LABEL = { country: 'Pays', region: 'Grande région viticole', subregion: 'Sous-région', appellation: 'Appellation / zone' };
  var STYLE_LABEL = { rouge: 'Rouge', blanc: 'Blanc', 'rosé': 'Rosé', effervescent: 'Effervescent', liquoreux: 'Liquoreux', 'vin doux naturel': 'Vin doux naturel', orange: 'Orange wine' };
  var LEVEL_DEPTH = { country: 0, region: 1, subregion: 2, appellation: 3 };
  var LEVEL_BY_DEPTH = ['country', 'region', 'subregion', 'appellation'];
  var NR = 'information non renseignée';
  var SCALE = ['—', 'très faible', 'faible', 'moyen', 'élevé', 'très élevé'];
  var VINT_COLOR = { exceptionnel: '#7a2338', excellent: '#9c4155', 'très bon': '#a8802f', bon: '#7a7a45', moyen: '#8a8577', difficile: '#a0968a' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function orNR(v) { return (v === null || v === undefined || v === '') ? null : String(v); }
  function fmtHa(v) { return v == null ? null : v.toLocaleString('fr-FR') + ' ha'; }
  function scaleLabel(v) { return v == null ? NR : SCALE[Math.max(0, Math.min(5, v))]; }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').trim(); }
  function children(id) { return (KIDS[id] || []).filter(function (c) { return FEATURE[c]; }); }
  function ancestry(id) { var chain = [], cur = REGION[id], g = {}; while (cur && !g[cur.id]) { g[cur.id] = 1; chain.unshift(cur); cur = cur.parentId ? REGION[cur.parentId] : null; } return chain; }
  function bboxOf(geom) {
    var rings = geom.type === 'Polygon' ? geom.coordinates : [].concat.apply([], geom.coordinates);
    var a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    rings.forEach(function (r) { r.forEach(function (p) { if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; }); });
    return [a, b, c, d];
  }

  // ---------- État ----------
  var selectedId = null, grapeId = null, compare = [], favorites = [];
  try { favorites = JSON.parse(localStorage.getItem('atlas-vin-favorites') || '[]'); } catch (e) {}
  var filters = { styles: [], grape: '', climate: '', soil: '' };
  var mapReady = false;

  // ---------- Carte MapLibre ----------
  var TILE = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  function tiles(sub) { return ['a', 'b', 'c'].map(function (s) { return TILE.replace('{s}', s).replace('{r}', ''); }); }
  var style = {
    version: 8,
    sources: {
      base: { type: 'raster', tiles: tiles(), tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a> · tracés viticoles indicatifs' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#e8edf0' } },
      { id: 'base', type: 'raster', source: 'base', paint: { 'raster-opacity': 1 } },
    ],
  };

  var map = new maplibregl.Map({
    container: 'map', style: style, center: [8, 34], zoom: 2.1, minZoom: 1.5, maxZoom: 15,
    attributionControl: false, dragRotate: false, pitchWithRotate: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }));
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  map.touchZoomRotate.disableRotation();

  function baseOpacityExpr() {
    return ['match', ['get', 'level'], 'country', 0.3, 'region', 0.5, 'subregion', 0.58, 'appellation', 0.64, 0.5];
  }
  function none() { return ['==', ['get', 'id'], '__none__']; }

  map.on('load', function () {
    map.addSource('wine', { type: 'geojson', data: WINE });
    map.addLayer({ id: 'wine-fill', type: 'fill', source: 'wine', filter: none(), paint: { 'fill-color': ['get', 'fill'], 'fill-opacity': baseOpacityExpr() } });
    map.addLayer({ id: 'wine-line', type: 'line', source: 'wine', filter: none(), paint: { 'line-color': 'rgba(35,37,44,0.42)', 'line-width': 0.8 } });
    map.addLayer({ id: 'grape-line', type: 'line', source: 'wine', filter: none(), paint: { 'line-color': '#b08a3e', 'line-width': 2.2 } });
    map.addLayer({ id: 'hover-line', type: 'line', source: 'wine', filter: none(), paint: { 'line-color': '#7a2338', 'line-width': 2 } });
    map.addLayer({ id: 'sel-fill', type: 'fill', source: 'wine', filter: none(), paint: { 'fill-color': '#7a2338', 'fill-opacity': 0.1 } });
    map.addLayer({ id: 'sel-line', type: 'line', source: 'wine', filter: none(), paint: { 'line-color': '#7a2338', 'line-width': 3 } });

    map.on('mousemove', 'wine-fill', function (e) {
      var f = deepest(e.features); if (!f) return;
      map.getCanvas().style.cursor = 'pointer';
      map.setFilter('hover-line', ['==', ['get', 'id'], f.properties.id]);
      showTip(e.point, f);
    });
    map.on('mouseleave', 'wine-fill', function () { map.getCanvas().style.cursor = ''; map.setFilter('hover-line', none()); hideTip(); });
    map.on('click', 'wine-fill', function (e) { var f = deepest(e.features); if (f) select(f.properties.id, true); });
    map.on('move', onView);
    map.on('zoom', onView);

    mapReady = true;
    applyReveal(); applyFilters(); renderFav(); updateLegendFromView(); positionLabels();
  });

  function deepest(feats) {
    if (!feats || !feats.length) return null;
    return feats.slice().sort(function (a, b) { return LEVEL_DEPTH[b.properties.level] - LEVEL_DEPTH[a.properties.level]; })[0];
  }

  // Dévoilement par taille : visible si az ≤ zoom < hz.
  function visibleIds() {
    var z = map.getZoom(), ids = [];
    WINE.features.forEach(function (f) { var p = f.properties; if (z >= p.az && z < p.hz) ids.push(p.id); });
    return ids;
  }
  function applyReveal() {
    if (!mapReady) return;
    var ids = visibleIds();
    var filt = ['in', ['get', 'id'], ['literal', ids]];
    map.setFilter('wine-fill', filt);
    map.setFilter('wine-line', filt);
  }
  var rafV = null;
  function onView() { if (rafV) return; rafV = requestAnimationFrame(function () { rafV = null; applyReveal(); positionLabels(); updateLegendFromView(); }); }

  function updateLegendFromView() {
    var z = map.getZoom(), deep = 0;
    WINE.features.forEach(function (f) { var p = f.properties; if (z >= p.az && z < p.hz) { var d = LEVEL_DEPTH[p.level]; if (d > deep) deep = d; } });
    updateLegend(LEVEL_BY_DEPTH[deep]);
  }

  // ---------- Filtres : opacité ----------
  function applyFilters() {
    if (!mapReady) return;
    var active = filterActive();
    var n = filters.styles.length + (filters.grape ? 1 : 0) + (filters.climate ? 1 : 0) + (filters.soil ? 1 : 0);
    var badge = document.getElementById('fcount'); badge.textContent = n; badge.hidden = !n;
    document.getElementById('fbtn').classList.toggle('active', !!n);
    if (!active) { map.setPaintProperty('wine-fill', 'fill-opacity', baseOpacityExpr()); return; }
    var ids = REGIONS.filter(matches).map(function (r) { return r.id; });
    map.setPaintProperty('wine-fill', 'fill-opacity', ['case', ['in', ['get', 'id'], ['literal', ids]], baseOpacityExpr(), 0.06]);
  }
  function filterActive() { return filters.styles.length || filters.grape || filters.climate || filters.soil; }
  function matches(r) {
    if (!filterActive()) return true;
    var anc = ancestry(r.id), st = {}, gr = {}, cl = {}, so = {};
    anc.forEach(function (a) { a.wineStyles.forEach(function (s) { st[s] = 1; }); a.grapes.forEach(function (g) { gr[g.grapeId] = 1; }); if (a.climate.type) cl[a.climate.type] = 1; a.soils.forEach(function (s) { so[s] = 1; }); });
    if (filters.styles.length && !filters.styles.some(function (s) { return st[s]; })) return false;
    if (filters.grape && !gr[filters.grape]) return false;
    if (filters.climate && !cl[filters.climate]) return false;
    if (filters.soil && !so[filters.soil]) return false;
    return true;
  }

  // ---------- Sélection / focus ----------
  function select(id, fly) {
    selectedId = id;
    if (mapReady) { map.setFilter('sel-fill', ['==', ['get', 'id'], id]); map.setFilter('sel-line', ['==', ['get', 'id'], id]); }
    if (fly) focus(id);
    renderPanel();
  }
  function clearSelect() { selectedId = null; if (mapReady) { map.setFilter('sel-fill', none()); map.setFilter('sel-line', none()); } document.getElementById('panel').classList.remove('open'); }
  function focus(id) {
    var f = FEATURE[id]; if (!f) return;
    var b = bboxOf(f.geometry), wide = window.innerWidth >= 1024;
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: { top: 90, bottom: 70, left: 60, right: wide ? 440 : 60 }, maxZoom: 12.5, duration: 850 });
  }
  function setGrape(id) {
    grapeId = id;
    if (mapReady) {
      if (id) { var ids = REGIONS.filter(function (r) { return r.grapes.some(function (g) { return g.grapeId === id; }); }).map(function (r) { return r.id; }); map.setFilter('grape-line', ['in', ['get', 'id'], ['literal', ids]]); }
      else map.setFilter('grape-line', none());
    }
    renderBanner();
  }

  // ---------- Tooltip / labels ----------
  var tip = document.getElementById('tip');
  function showTip(pt, f) { tip.innerHTML = esc(f.properties.name) + ' <small>· ' + esc(LEVEL_LABEL[f.properties.level]) + '</small>'; tip.style.left = pt.x + 'px'; tip.style.top = pt.y + 'px'; tip.style.opacity = '1'; }
  function hideTip() { tip.style.opacity = '0'; }

  var labelsBox = document.getElementById('labels'), rafL = null;
  function positionLabels() {
    if (rafL) return;
    rafL = requestAnimationFrame(function () {
      rafL = null;
      if (!mapReady) return;
      var z = map.getZoom(), W = labelsBox.clientWidth, H = labelsBox.clientHeight, html = '', shown = 0;
      WINE.features.forEach(function (f) {
        var p = f.properties; if (!(z >= p.az && z < p.hz)) return;
        var pt = map.project([p.cx, p.cy]);
        if (pt.x < -40 || pt.x > W + 40 || pt.y < -20 || pt.y > H + 20) return;
        if (shown++ > 70) return;
        html += '<div class="map-label lvl-' + p.level + '" style="left:' + pt.x.toFixed(1) + 'px;top:' + pt.y.toFixed(1) + 'px">' + esc(p.name) + '</div>';
      });
      labelsBox.innerHTML = html;
    });
  }

  // ---------- Recherche ----------
  var INDEX = buildIndex();
  function buildIndex() {
    var out = [], ref = {};
    REGIONS.forEach(function (r) { r.grapes.forEach(function (g) { ref[g.grapeId] = 1; }); });
    REGIONS.forEach(function (r) { var sub = r.level === 'country' ? 'Pays' : LEVEL_LABEL[r.level].split(' ')[0] + ' · ' + r.country; out.push({ kind: 'region', id: r.id, label: r.name, sub: sub, hay: norm(r.name + ' ' + r.country + ' ' + (r.adminRegion || '')) }); });
    GRAPES.forEach(function (g) { if (!ref[g.id]) return; out.push({ kind: 'grape', id: g.id, label: g.name, sub: 'Cépage ' + g.color + ' · explorer', hay: norm(g.name + ' ' + g.aliases.join(' ')) }); });
    var seen = {};
    REGIONS.forEach(function (r) { r.producers.forEach(function (pr) { var key = norm(pr.name); if (seen[key]) return; seen[key] = 1; out.push({ kind: 'producer', id: r.id, label: pr.name, sub: 'Domaine · ' + r.name, hay: key }); }); });
    return out;
  }
  var KRANK = { region: 0, grape: 1, producer: 2 };
  function search(q) {
    q = norm(q); if (!q) return [];
    var sc = [];
    INDEX.forEach(function (e) { var i = e.hay.indexOf(q); if (i < 0) return; var w = i === 0 || e.hay[i - 1] === ' '; sc.push({ e: e, s: (i === 0 ? 0 : w ? 1 : 2) * 10 + KRANK[e.kind] }); });
    sc.sort(function (a, b) { return a.s - b.s || a.e.label.localeCompare(b.e.label); });
    return sc.slice(0, 12).map(function (x) { return x.e; });
  }

  // ---------- Fiche ----------
  var ROLE = { principal: 'principal', secondaire: 'secondaire', autochtone: 'autochtone' };
  function field(k, v) { var e = v == null; return '<div class="field"><span class="k">' + esc(k) + '</span><span class="v' + (e ? ' nr' : '') + '">' + (e ? NR : esc(v)) + '</span></div>'; }
  function coords(geom) { var b = bboxOf(geom); var lng = (b[0] + b[2]) / 2, lat = (b[1] + b[3]) / 2; return Math.abs(lat).toFixed(2) + '° ' + (lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(lng).toFixed(2) + '° ' + (lng >= 0 ? 'E' : 'O'); }
  function bar(lab, v) { var pct = v == null ? 0 : (Math.max(0, Math.min(5, v)) / 5) * 100; return '<div class="item"><div class="top"><span>' + lab + '</span><small>' + scaleLabel(v) + '</small></div><div class="bar">' + (v != null ? '<i style="width:' + pct + '%"></i>' : '') + '</div></div>'; }
  function grapeCol(title, list) {
    if (!list.length) return '';
    var h = '<div class="subt">' + title + '</div>';
    list.forEach(function (g) { var m = GRAPE[g.grapeId]; h += '<div class="grape"><div class="top"><button data-grape="' + g.grapeId + '"' + (grapeId === g.grapeId ? ' style="color:var(--accent);font-weight:500"' : '') + '>' + esc(m ? m.name : g.grapeId) + '<span class="role">' + ROLE[g.role] + '</span></button>' + (g.share != null ? '<span class="muted" style="font-size:12px">≈ ' + g.share + ' %</span>' : '') + '</div>' + (g.share != null ? '<div class="bar"><i style="width:' + g.share + '%;background:' + (m && m.color === 'rouge' ? 'var(--accent)' : 'var(--gold)') + '"></i></div>' : '') + '</div>'; });
    return h;
  }
  function renderPanel() {
    var panel = document.getElementById('panel');
    var r = selectedId ? REGION[selectedId] : null;
    if (!r) { panel.classList.remove('open'); return; }
    var anc = ancestry(r.id), kids = children(r.id), t = r.tasting;
    var hasT = [t.acidity, t.tannins, t.body, t.alcohol, t.sweetness, t.aromaticIntensity, t.ageingPotential].some(function (v) { return v != null; }) || t.aromas.length;
    var reds = r.grapes.filter(function (g) { return GRAPE[g.grapeId] && GRAPE[g.grapeId].color === 'rouge'; });
    var whites = r.grapes.filter(function (g) { return GRAPE[g.grapeId] && GRAPE[g.grapeId].color === 'blanc'; });
    var fav = favorites.indexOf(r.id) >= 0, inCmp = compare.indexOf(r.id) >= 0, geom = FEATURE[r.id] ? FEATURE[r.id].geometry : null;
    var h = '<header><div class="crumbs">';
    anc.slice(0, -1).forEach(function (a) { h += '<button data-go="' + a.id + '">' + esc(a.name) + '</button><span class="sep">›</span>'; });
    h += '</div><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><h2 class="serif">' + esc(r.name) + '</h2><div style="margin-top:2px;font-size:12px;color:var(--muted)"><span class="tag">' + esc(LEVEL_LABEL[r.level]) + '</span> &nbsp;' + esc(r.country) + '</div></div><button class="x" id="closep" aria-label="Fermer"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div>';
    h += '<div class="head-actions"><button class="abtn fav' + (fav ? ' on' : '') + '" id="favtoggle">' + (fav ? '★ Favori' : '☆ Favoris') + '</button><button class="abtn' + (inCmp ? ' on' : '') + '" id="cmptoggle">⇄ ' + (inCmp ? 'Au comparateur' : 'Comparer') + '</button></div></header><div class="body">';
    if (r.description) h += '<p class="desc">' + esc(r.description) + '</p>';
    h += '<div class="sec"><h3>Informations générales</h3>' + field('Pays', r.country) + field('Région administrative', orNR(r.adminRegion)) + field('Type de zone', LEVEL_LABEL[r.level]) + field('Zone parente', anc.length > 1 ? anc[anc.length - 2].name : null) + field('Superficie viticole', fmtHa(r.keyFacts.vineyardAreaHa)) + field('Production annuelle', orNR(r.keyFacts.annualProduction)) + field('Domaines / producteurs', orNR(r.keyFacts.producerCount)) + field('Altitude', orNR(r.keyFacts.altitude)) + field('Localisation (centroïde)', geom ? coords(geom) : null) + '</div>';
    h += '<div class="sec"><h3>Terroir</h3>' + field('Climat', orNR(r.climate.type)) + field('Températures', orNR(r.climate.temperatures)) + field('Pluviométrie', orNR(r.climate.rainfall)) + field('Relief', orNR(r.relief)) + field('Géologie', orNR(r.geology));
    if (r.climate.influences.length) h += '<div class="subt">Influences</div><div class="chips">' + r.climate.influences.map(function (i) { return '<span class="chip">' + esc(i) + '</span>'; }).join('') + '</div>';
    h += '<div class="subt">Types de sols</div>' + (r.soils.length ? '<div class="chips">' + r.soils.map(function (s) { return '<span class="chip">' + esc(s) + '</span>'; }).join('') + '</div>' : '<div class="v nr">' + NR + '</div>') + '</div>';
    h += '<div class="sec"><h3>Cépages</h3>' + (r.grapes.length ? grapeCol('Cépages rouges', reds) + grapeCol('Cépages blancs', whites) + '<p class="muted" style="font-size:11px;font-style:italic;margin:8px 0 0">Cliquez un cépage pour le localiser.</p>' : '<div class="v nr">' + NR + '</div>') + '</div>';
    h += '<div class="sec"><h3>Types de vins</h3>' + (r.wineStyles.length ? '<div class="chips">' + r.wineStyles.map(function (s) { return '<span class="chip on">' + esc(STYLE_LABEL[s] || s) + '</span>'; }).join('') + '</div>' : '<div class="v nr">' + NR + '</div>') + '</div>';
    h += '<div class="sec"><h3>Profil gustatif (indicatif)</h3>';
    if (hasT) { h += '<div class="scale">' + bar('Acidité', t.acidity) + bar('Tanins', t.tannins) + bar('Corps', t.body) + bar('Alcool', t.alcohol) + bar('Sucrosité', t.sweetness) + bar('Intensité arom.', t.aromaticIntensity) + bar('Potentiel de garde', t.ageingPotential) + '</div>'; if (t.aromas.length) h += '<div class="subt">Arômes typiques</div><div class="chips">' + t.aromas.map(function (a) { return '<span class="chip gold">' + esc(a) + '</span>'; }).join('') + '</div>'; }
    else h += '<div class="v nr">' + NR + '</div>';
    h += '</div>';
    var vi = r.viticulture;
    if (vi.notes || vi.yield || vi.harvest || vi.irrigation || vi.plantingDensity || vi.organic) { h += '<div class="sec"><h3>Viticulture</h3>' + field('Densité de plantation', orNR(vi.plantingDensity)) + field('Rendement', orNR(vi.yield)) + field('Vendanges', orNR(vi.harvest)) + field('Irrigation', orNR(vi.irrigation)) + field('Bio / biodynamie', orNR(vi.organic)) + (vi.notes ? '<p class="desc" style="margin:8px 0 0">' + esc(vi.notes) + '</p>' : '') + '</div>'; }
    var vn = r.vinification;
    if (vn.ageing.length || vn.ageingDuration || vn.malolactic || vn.maceration || vn.notes) { h += '<div class="sec"><h3>Vinification &amp; élevage</h3>' + (vn.ageing.length ? '<div class="chips" style="margin-bottom:8px">' + vn.ageing.map(function (a) { return '<span class="chip">' + esc(a) + '</span>'; }).join('') + '</div>' : '') + field('Durée d’élevage', orNR(vn.ageingDuration)) + field('Malolactique', orNR(vn.malolactic)) + field('Macération', orNR(vn.maceration)) + (vn.notes ? '<p class="desc" style="margin:8px 0 0">' + esc(vn.notes) + '</p>' : '') + '</div>'; }
    if (kids.length) h += '<div class="sec"><h3>Zones &amp; appellations</h3><div class="kids">' + kids.map(function (c) { return '<button data-go="' + c + '">' + esc(REGION[c].name) + ' ↗</button>'; }).join('') + '</div></div>';
    h += '<div class="sec"><h3>Domaines emblématiques</h3>' + (r.producers.length ? r.producers.map(function (pr) { return '<div class="prod"><span>' + esc(pr.name) + '</span>' + (pr.note ? '<small>' + esc(pr.note) + '</small>' : '') + '</div>'; }).join('') : '<div class="v nr">Section encyclopédique — ' + NR + '.</div>') + '</div>';
    if (r.vintages.length) h += '<div class="sec"><h3>Millésimes récents</h3>' + r.vintages.map(function (v) { return '<span class="vint"><b class="serif">' + v.year + '</b><span style="font-size:11px;font-weight:500;color:' + (VINT_COLOR[v.rating] || '#888') + '">' + esc(v.rating) + '</span></span>'; }).join('') + '</div>';
    if (r.foodPairings.length) h += '<div class="sec"><h3>Accords mets &amp; vins</h3><div class="chips">' + r.foodPairings.map(function (f) { return '<span class="chip">' + esc(f) + '</span>'; }).join('') + '</div></div>';
    h += '<div class="foot"><div><b>Source :</b> ' + esc(r.source || NR) + (r.lastVerified ? ' · vérifié ' + esc(r.lastVerified) : '') + '</div><div style="font-style:italic;margin-top:3px">Tracé cartographique indicatif (MVP).</div></div></div>';
    panel.innerHTML = h; panel.classList.add('open');
    panel.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { select(b.getAttribute('data-go'), true); }; });
    document.getElementById('closep').onclick = clearSelect;
    document.getElementById('favtoggle').onclick = function () { toggleFav(r.id); renderPanel(); };
    document.getElementById('cmptoggle').onclick = function () { toggleCompare(r.id); renderPanel(); };
    panel.querySelectorAll('[data-grape]').forEach(function (g) { g.onclick = function () { var id = g.getAttribute('data-grape'); setGrape(grapeId === id ? null : id); }; });
  }

  // ---------- Favoris / comparateur ----------
  function toggleFav(id) { var i = favorites.indexOf(id); if (i >= 0) favorites.splice(i, 1); else favorites.push(id); try { localStorage.setItem('atlas-vin-favorites', JSON.stringify(favorites)); } catch (e) {} renderFav(); }
  function toggleCompare(id) { var i = compare.indexOf(id); if (i >= 0) compare.splice(i, 1); else { compare.push(id); if (compare.length > 2) compare.shift(); } if (compare.length === 2) openCompare(); }

  function renderBanner() {
    var el = document.getElementById('banner');
    if (!grapeId) { el.hidden = true; return; }
    var g = GRAPE[grapeId], ids = REGIONS.filter(function (r) { return r.grapes.some(function (x) { return x.grapeId === grapeId; }); });
    var hi = ids.filter(function (r) { return r.level !== 'appellation'; }).slice(0, 14);
    var h = '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="ey">Exploration d’un cépage</div><h3 class="serif">' + esc(g.name) + '</h3><div class="muted" style="font-size:12px">' + (g.color === 'rouge' ? 'Cépage rouge' : 'Cépage blanc') + ' · ' + ids.length + ' zone' + (ids.length > 1 ? 's' : '') + '</div></div><button class="abtn" id="grapequit">Quitter</button></div>';
    if (hi.length) h += '<div class="chips" style="margin-top:8px">' + hi.map(function (r) { return '<span class="chip gold act" data-go2="' + r.id + '">' + esc(r.name) + '</span>'; }).join('') + '</div>';
    el.innerHTML = h; el.hidden = false;
    document.getElementById('grapequit').onclick = function () { setGrape(null); };
    el.querySelectorAll('[data-go2]').forEach(function (b) { b.onclick = function () { select(b.getAttribute('data-go2'), true); }; });
  }

  function updateLegend(cur) {
    var order = [['country', 'Pays'], ['region', 'Régions'], ['subregion', 'Sous-régions'], ['appellation', 'Appellations']];
    var h = '<div class="ey">Niveau d’affichage</div><div class="steps">';
    order.forEach(function (o, i) { h += '<span class="' + (o[0] === cur ? 'on' : '') + '">' + o[1] + '</span>' + (i < 3 ? '<span class="sep">›</span>' : ''); });
    document.getElementById('legend').innerHTML = h + '</div>';
  }

  // ---------- Recherche UI ----------
  var q = document.getElementById('q'), res = document.getElementById('res'), active = 0, cur = [];
  function renderRes() {
    if (!cur.length) { res.hidden = true; return; }
    res.innerHTML = cur.map(function (e, i) { var ic = e.kind === 'grape' ? '❧' : e.kind === 'producer' ? '⌂' : '◍'; return '<button class="' + (i === active ? 'on' : '') + '" data-i="' + i + '"><span class="ic ' + (e.kind === 'grape' ? 'grape' : '') + '">' + ic + '</span><span class="lab"><span style="display:block">' + esc(e.label) + '</span><span class="sub">' + esc(e.sub) + '</span></span></button>'; }).join('');
    res.hidden = false;
    res.querySelectorAll('button').forEach(function (b) { b.onmouseenter = function () { active = +b.getAttribute('data-i'); }; b.onclick = function () { choose(cur[+b.getAttribute('data-i')]); }; });
  }
  function choose(e) { if (!e) return; if (e.kind === 'region' || e.kind === 'producer') select(e.id, true); else if (e.kind === 'grape') setGrape(e.id); q.value = ''; cur = []; res.hidden = true; }
  q.oninput = function () { cur = search(q.value); active = 0; renderRes(); };
  q.onfocus = function () { if (q.value) { cur = search(q.value); renderRes(); } };
  q.onkeydown = function (ev) { if (res.hidden || !cur.length) return; if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % cur.length; renderRes(); } else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + cur.length) % cur.length; renderRes(); } else if (ev.key === 'Enter') { ev.preventDefault(); choose(cur[active]); } else if (ev.key === 'Escape') res.hidden = true; };
  document.addEventListener('mousedown', function (e) {
    if (!res.contains(e.target) && e.target !== q) res.hidden = true;
    var fp = document.getElementById('fpop'); if (!fp.contains(e.target) && !document.getElementById('fbtn').contains(e.target)) fp.hidden = true;
    var vp = document.getElementById('favpop'); if (!vp.contains(e.target) && !document.getElementById('favbtn').contains(e.target)) vp.hidden = true;
  });

  // ---------- Filtres UI ----------
  function uniq(get) { var s = {}; REGIONS.forEach(function (r) { get(r).forEach(function (v) { if (v) s[v] = 1; }); }); return Object.keys(s); }
  var styleOpts = uniq(function (r) { return r.wineStyles; });
  var climOpts = uniq(function (r) { return r.climate.type ? [r.climate.type] : []; }).sort();
  var soilOpts = uniq(function (r) { return r.soils; }).sort();
  var grapeOpts = uniq(function (r) { return r.grapes.map(function (g) { return g.grapeId; }); }).sort(function (a, b) { return (GRAPE[a] ? GRAPE[a].name : a).localeCompare(GRAPE[b] ? GRAPE[b].name : b); });
  function renderFpop() {
    var h = '<h4>Filtres</h4><label>Type de vin</label><div class="chips">' + styleOpts.map(function (s) { return '<button class="chip tgl' + (filters.styles.indexOf(s) >= 0 ? ' on' : '') + '" data-style="' + s + '">' + esc(STYLE_LABEL[s] || s) + '</button>'; }).join('') + '</div>';
    h += '<label>Cépage</label><select data-f="grape"><option value="">Tous</option>' + grapeOpts.map(function (g) { return '<option value="' + g + '"' + (filters.grape === g ? ' selected' : '') + '>' + esc(GRAPE[g] ? GRAPE[g].name : g) + '</option>'; }).join('') + '</select>';
    h += '<label>Climat</label><select data-f="climate"><option value="">Tous</option>' + climOpts.map(function (c) { return '<option value="' + esc(c) + '"' + (filters.climate === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>';
    h += '<label>Type de sol</label><select data-f="soil"><option value="">Tous</option>' + soilOpts.map(function (c) { return '<option value="' + esc(c) + '"' + (filters.soil === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>';
    h += '<div style="margin-top:12px;display:flex;justify-content:flex-end">' + (filterActive() ? '<button class="abtn" id="freset">Réinitialiser</button>' : '') + '</div><p class="muted" style="font-size:11px;font-style:italic;margin-top:8px">Les zones non concernées s’estompent (héritage régional pris en compte).</p>';
    var pop = document.getElementById('fpop'); pop.innerHTML = h;
    pop.querySelectorAll('[data-style]').forEach(function (b) { b.onclick = function () { var s = b.getAttribute('data-style'), i = filters.styles.indexOf(s); if (i >= 0) filters.styles.splice(i, 1); else filters.styles.push(s); renderFpop(); applyFilters(); }; });
    pop.querySelectorAll('select').forEach(function (sel) { sel.onchange = function () { filters[sel.getAttribute('data-f')] = sel.value; renderFpop(); applyFilters(); }; });
    if (document.getElementById('freset')) document.getElementById('freset').onclick = function () { filters = { styles: [], grape: '', climate: '', soil: '' }; renderFpop(); applyFilters(); };
  }
  document.getElementById('fbtn').onclick = function () { var p = document.getElementById('fpop'); p.hidden = !p.hidden; if (!p.hidden) renderFpop(); };

  // ---------- Favoris UI ----------
  function renderFav() {
    var btn = document.getElementById('favbtn'); btn.classList.toggle('active', favorites.length > 0); btn.innerHTML = '★ Favoris' + (favorites.length ? ' (' + favorites.length + ')' : '');
    var pop = document.getElementById('favpop');
    pop.innerHTML = !favorites.length ? '<p class="muted" style="font-size:12px;margin:4px 6px">Aucun favori. Ajoutez des régions via l’étoile d’une fiche.</p>' : favorites.map(function (id) { var r = REGION[id]; return r ? '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:6px;border-radius:8px"><button class="grape" data-fav="' + id + '" style="flex:1;text-align:left"><b style="font-weight:500">' + esc(r.name) + '</b><br><span class="sub" style="font-size:11px;color:var(--muted)">' + esc(r.country) + '</span></button><button class="x" data-unfav="' + id + '">✕</button></div>' : ''; }).join('');
    pop.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { select(b.getAttribute('data-fav'), true); pop.hidden = true; }; });
    pop.querySelectorAll('[data-unfav]').forEach(function (b) { b.onclick = function () { toggleFav(b.getAttribute('data-unfav')); }; });
  }
  document.getElementById('favbtn').onclick = function () { var p = document.getElementById('favpop'); p.hidden = !p.hidden; };

  // ---------- Comparateur ----------
  function openCompare() {
    var a = compare[0] ? REGION[compare[0]] : null, b = compare[1] ? REGION[compare[1]] : null, body;
    if (!a || !b) body = '<div class="in muted" style="text-align:center;padding:40px 20px">Sélectionnez deux régions (bouton « Comparer » dans une fiche).' + (a ? '<p style="margin-top:12px">Première région : <b style="color:var(--ink)">' + esc(a.name) + '</b></p>' : '') + '</div>';
    else {
      function row(k, va, vb) { return '<div class="rk">' + esc(k) + '</div><div class="cell">' + (va == null ? '<span class="v nr">' + NR + '</span>' : esc(va)) + '</div><div class="cell">' + (vb == null ? '<span class="v nr">' + NR + '</span>' : esc(vb)) + '</div>'; }
      function cbar(v) { var pc = v == null ? 0 : (Math.max(0, Math.min(5, v)) / 5) * 100; return '<div class="bar">' + (v != null ? '<i style="width:' + pc + '%"></i>' : '') + '</div><small class="muted" style="font-size:10px">' + scaleLabel(v) + '</small>'; }
      function crow(k, va, vb) { return '<div class="rk">' + k + '</div><div class="cell">' + cbar(va) + '</div><div class="cell">' + cbar(vb) + '</div>'; }
      function gl(r) { return r.grapes.length ? r.grapes.slice(0, 4).map(function (g) { return GRAPE[g.grapeId] ? GRAPE[g.grapeId].name : g.grapeId; }).join(', ') : null; }
      function sl(r) { return r.wineStyles.length ? r.wineStyles.map(function (s) { return STYLE_LABEL[s] || s; }).join(', ') : null; }
      body = '<div class="in"><div class="cmp"><div></div><div class="hd"><b class="serif">' + esc(a.name) + '</b><br><small class="muted">' + esc(a.country) + '</small></div><div class="hd"><b class="serif">' + esc(b.name) + '</b><br><small class="muted">' + esc(b.country) + '</small></div>' + row('Climat', orNR(a.climate.type), orNR(b.climate.type)) + row('Températures', orNR(a.climate.temperatures), orNR(b.climate.temperatures)) + row('Pluviométrie', orNR(a.climate.rainfall), orNR(b.climate.rainfall)) + row('Altitude', orNR(a.keyFacts.altitude), orNR(b.keyFacts.altitude)) + row('Superficie', fmtHa(a.keyFacts.vineyardAreaHa), fmtHa(b.keyFacts.vineyardAreaHa)) + row('Sols', a.soils.length ? a.soils.join(', ') : null, b.soils.length ? b.soils.join(', ') : null) + row('Cépages', gl(a), gl(b)) + row('Styles', sl(a), sl(b)) + crow('Acidité', a.tasting.acidity, b.tasting.acidity) + crow('Tanins', a.tasting.tannins, b.tasting.tannins) + crow('Corps', a.tasting.body, b.tasting.body) + crow('Alcool', a.tasting.alcohol, b.tasting.alcohol) + crow('Garde', a.tasting.ageingPotential, b.tasting.ageingPotential) + '</div></div>';
    }
    showModal('Comparateur de régions', body);
  }

  // ---------- Quiz ----------
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function buildQuiz() {
    var qs = [], mono = REGIONS.filter(function (r) { return r.grapes.some(function (g) { return g.share === 100 && g.role === 'principal'; }); });
    shuffle(mono).slice(0, 4).forEach(function (r) { var g = r.grapes.filter(function (x) { return x.share === 100; })[0], correct = GRAPE[g.grapeId] ? GRAPE[g.grapeId].name : g.grapeId, d = shuffle(GRAPES.filter(function (x) { return x.id !== g.grapeId; }).map(function (x) { return x.name; })).slice(0, 3); qs.push({ q: 'Quel cépage domine à ' + r.name + ' ?', o: shuffle([correct].concat(d)), a: correct }); });
    var named = REGIONS.filter(function (r) { return r.level !== 'country'; }), countries = Object.keys(REGIONS.reduce(function (m, r) { m[r.country] = 1; return m; }, {}));
    shuffle(named).slice(0, 3).forEach(function (r) { var d = shuffle(countries.filter(function (c) { return c !== r.country; })).slice(0, 3); qs.push({ q: 'Dans quel pays se trouve « ' + r.name + ' » ?', o: shuffle([r.country].concat(d)), a: r.country }); });
    return shuffle(qs).slice(0, 6);
  }
  function openQuiz() {
    var quiz = buildQuiz(), idx = 0, score = 0, picked = null;
    function render() {
      var body;
      if (idx >= quiz.length) body = '<div class="in" style="text-align:center;padding:34px 20px"><div class="serif" style="font-size:34px;color:var(--accent)">' + score + ' / ' + quiz.length + '</div><p class="muted" style="margin-top:8px">' + (score === quiz.length ? 'Sans faute !' : score >= quiz.length / 2 ? 'Beau parcours.' : 'Continuez d’explorer.') + '</p><button class="btn" id="qrestart" style="margin-top:16px">Nouvelle série</button></div>';
      else { var Q = quiz[idx]; body = '<div class="in quiz"><div style="display:flex;justify-content:space-between;font-size:12px" class="muted"><span>Question ' + (idx + 1) + ' / ' + quiz.length + '</span><span>Score : ' + score + '</span></div><p class="serif" style="font-size:18px;margin:8px 0 14px">' + esc(Q.q) + '</p>'; Q.o.forEach(function (o) { var cls = ''; if (picked) { if (o === Q.a) cls = 'right'; else if (o === picked) cls = 'wrong'; } body += '<button class="opt ' + cls + '" data-o="' + esc(o) + '"' + (picked ? ' disabled' : '') + '>' + esc(o) + (picked && o === Q.a ? ' <span>✓</span>' : '') + '</button>'; }); if (picked) body += '<div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="btn" id="qnext">' + (idx + 1 >= quiz.length ? 'Voir le score' : 'Suivant') + '</button></div>'; body += '</div>'; }
      showModal('Mode apprentissage', body);
      var m = document.getElementById('modalRoot');
      if (idx >= quiz.length) { document.getElementById('qrestart').onclick = function () { quiz = buildQuiz(); idx = 0; score = 0; picked = null; render(); }; return; }
      m.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { if (picked) return; picked = b.getAttribute('data-o'); if (picked === quiz[idx].a) score++; render(); }; });
      if (document.getElementById('qnext')) document.getElementById('qnext').onclick = function () { idx++; picked = null; render(); };
    }
    render();
  }

  function showModal(title, bodyHtml) {
    closeModal();
    var root = document.createElement('div'); root.className = 'overlay'; root.id = 'modalRoot';
    root.innerHTML = '<div class="modal"><header><h2 class="serif">' + esc(title) + '</h2><button class="x" id="modalClose" aria-label="Fermer"><svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></header>' + bodyHtml + '</div>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) { if (e.target === root) closeModal(); });
    document.getElementById('modalClose').onclick = closeModal;
  }
  function closeModal() { var m = document.getElementById('modalRoot'); if (m) m.remove(); }
  document.getElementById('cmpbtn').onclick = openCompare;
  document.getElementById('quizbtn').onclick = openQuiz;

  // ---------- Thème ----------
  document.getElementById('theme').onclick = function () { var root = document.documentElement, cur = root.getAttribute('data-theme'); root.setAttribute('data-theme', cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark')); };
  document.getElementById('zreset').onclick = function () { clearSelect(); map.flyTo({ center: [8, 34], zoom: 2.1, duration: 700 }); };

  updateLegend('country');
})();

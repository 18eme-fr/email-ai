// =============================================================================
//  UI : barre d'outils, bibliothèque de projets, niveaux, panneaux (sélection,
//  filtre pôles, récapitulatif), import/export, options de vue, aide.
// =============================================================================
import {
  store, subscribe, commit, activeLevel, undo, redo, canUndo, canRedo,
  selectedObject, listProjects, switchProject, newProject, duplicateActive,
  deleteProject, importAsProject, exportActive, lastSaved,
} from './store.js';
import {
  POLES, TYPES, TYPES_BY_POLE, poleColor, typeColor, poleName, DEFAULTS,
} from './config.js';
import {
  setTool, getTool, onToolChange, setZoneType, getZoneType,
  deleteSelection, duplicateSelection, setFlash, zoneWouldOverlap,
} from './tools.js';
import { polygonArea, wallLength, rectOf, rectFromCorners } from './geometry.js';
import { frameScene } from './viewer.js';

const $ = (id) => document.getElementById(id);

function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

let flashTimer = null;
function flash(msg) {
  const el = $('hint');
  const prev = el.dataset.base || el.innerHTML;
  el.dataset.base = prev;
  el.innerHTML = `<span class="flash">⚠ ${escapeHtml(msg)}</span>`;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { renderHint(); }, 2600);
}

export function initUI() {
  buildToolbar();
  buildZoneTypePicker();
  wireTopbar();
  wireOptions();
  wireImportExport();
  wireKeyboardShortcuts();
  setFlash(flash);

  subscribe(renderAll);
  onToolChange(() => { renderToolbar(); renderHint(); });
  renderAll('init');
}

// --- Barre d'outils ----------------------------------------------------------
function buildToolbar() {
  for (const btn of document.querySelectorAll('.tool')) {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  }
}
function renderToolbar() {
  const t = getTool();
  for (const btn of document.querySelectorAll('.tool')) {
    btn.classList.toggle('active', btn.dataset.tool === t);
  }
  $('zone-type-wrap').classList.toggle('dim', t !== 'zone');
}
function buildZoneTypePicker() {
  const sel = $('zone-type');
  sel.innerHTML = '';
  for (const poleKey of Object.keys(POLES)) {
    const group = h('optgroup', { label: poleName(poleKey) });
    for (const t of TYPES_BY_POLE[poleKey]) group.appendChild(h('option', { value: t.key }, t.name));
    sel.appendChild(group);
  }
  sel.value = getZoneType();
  sel.addEventListener('change', () => setZoneType(sel.value));
}

// --- Barre supérieure : projets, niveaux -------------------------------------
function wireTopbar() {
  $('project-name').addEventListener('change', (e) => {
    store.project.name = e.target.value.trim() || 'Projet';
    commit('rename-project');
  });
  $('project-select').addEventListener('change', (e) => switchProject(e.target.value));
  $('project-new').addEventListener('click', () => {
    const name = prompt('Nom du nouveau projet :', 'Nouveau projet');
    if (name !== null) newProject(name.trim() || 'Nouveau projet');
  });
  $('project-dup').addEventListener('click', () => duplicateActive());
  $('project-del').addEventListener('click', () => {
    if (listProjects().length <= 1) { flash('Impossible de supprimer le dernier projet.'); return; }
    if (confirm(`Supprimer le projet « ${store.project.name} » ? Les autres variantes sont conservées.`)) {
      deleteProject(store.projectId);
    }
  });

  $('level-select').addEventListener('change', (e) => { store.project.activeLevelId = e.target.value; commit('active-level'); });
  $('level-name').addEventListener('change', (e) => { activeLevel().name = e.target.value.trim() || 'Niveau'; commit('level-name'); });
  $('level-elev').addEventListener('change', (e) => { activeLevel().elevation = num(e.target.value, 0); commit('level-elev'); });
  $('level-height').addEventListener('change', (e) => { activeLevel().height = Math.max(1, num(e.target.value, DEFAULTS.levelHeight)); commit('level-height'); });
  $('level-add').addEventListener('click', addLevel);
  $('level-del').addEventListener('click', removeLevel);

  $('undo').addEventListener('click', () => undo());
  $('redo').addEventListener('click', () => redo());
  $('view-frame').addEventListener('click', () => frameScene(false));
  $('view-top').addEventListener('click', () => frameScene(true));
}

function wireOptions() {
  $('grid-step').addEventListener('change', (e) => { store.project.gridStep = Math.max(0, num(e.target.value, DEFAULTS.gridStep)); commit('grid'); });
  $('snap-toggle').addEventListener('click', () => { store.snap = !store.snap; renderTopbar(); commit('snap'); });
  $('wall-display').addEventListener('click', () => {
    store.wallDisplay = { full: 'low', low: 'hidden', hidden: 'full' }[store.wallDisplay];
    renderTopbar();
    commit('wall-display');
  });
}

function addLevel() {
  const levels = store.project.levels;
  const top = levels.reduce((m, l) => Math.max(m, l.elevation + l.height), 0);
  const id = crypto.randomUUID ? 'lvl' + crypto.randomUUID().slice(0, 8) : 'lvl' + Date.now().toString(36);
  levels.push({ id, name: `Niveau ${levels.length + 1}`, elevation: top, height: DEFAULTS.levelHeight });
  store.project.activeLevelId = id;
  commit('level-add');
}
function removeLevel() {
  const p = store.project;
  if (p.levels.length <= 1) { flash('Impossible de supprimer le dernier niveau.'); return; }
  const id = p.activeLevelId;
  if (!confirm('Supprimer ce niveau et tout ce qu\'il contient ?')) return;
  const wallIds = new Set(p.walls.filter((w) => w.levelId === id).map((w) => w.id));
  p.walls = p.walls.filter((w) => w.levelId !== id);
  p.zones = p.zones.filter((z) => z.levelId !== id);
  p.doors = p.doors.filter((d) => !wallIds.has(d.wallId));
  p.windows = p.windows.filter((w) => !wallIds.has(w.wallId));
  p.levels = p.levels.filter((l) => l.id !== id);
  p.activeLevelId = p.levels[0].id;
  store.selection = null;
  commit('level-del');
}

// --- Import / export ---------------------------------------------------------
function wireImportExport() {
  $('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportActive(), null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `${(store.project.name || 'projet').replace(/[^\w-]+/g, '_')}.json` });
    document.body.appendChild(a); a.click(); a.remove();
  });
  $('import-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try { data = JSON.parse(reader.result); } catch { data = null; }
      if (importAsProject(data)) flash('Projet importé comme nouvelle variante.');
      else flash('Fichier invalide : le projet en cours est conservé.');
    };
    reader.readAsText(file);
    e.target.value = '';
  });
  $('seed').addEventListener('click', async () => {
    const { seedProject } = await import('./seed.js');
    importAsProject(seedProject());
    flash('Exemple ajouté comme nouvelle variante.');
  });
}

function wireKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
  });
}

// --- Rendu global ------------------------------------------------------------
function renderAll() {
  renderTopbar();
  renderToolbar();
  renderSelectionPanel();
  renderFilterPanel();
  renderRecapPanel();
  renderHint();
}

function renderTopbar() {
  const p = store.project;
  if (document.activeElement !== $('project-name')) $('project-name').value = p.name;

  const psel = $('project-select');
  psel.innerHTML = '';
  for (const pr of listProjects()) psel.appendChild(h('option', { value: pr.id }, pr.name));
  psel.value = store.projectId;

  const sel = $('level-select');
  sel.innerHTML = '';
  for (const l of p.levels) sel.appendChild(h('option', { value: l.id }, l.name));
  sel.value = p.activeLevelId;

  const lvl = activeLevel();
  if (document.activeElement !== $('level-name')) $('level-name').value = lvl.name;
  if (document.activeElement !== $('level-elev')) $('level-elev').value = lvl.elevation;
  if (document.activeElement !== $('level-height')) $('level-height').value = lvl.height;
  if (document.activeElement !== $('grid-step')) $('grid-step').value = p.gridStep;

  $('snap-toggle').classList.toggle('on', store.snap);
  $('wall-display').textContent = 'Murs : ' + { full: 'entiers', low: 'abaissés', hidden: 'masqués' }[store.wallDisplay];
  $('wall-display').classList.toggle('on', store.wallDisplay !== 'full');

  $('undo').disabled = !canUndo();
  $('redo').disabled = !canRedo();

  const ss = $('save-state');
  const t = lastSaved();
  if (t) { ss.textContent = '✓ auto ' + new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); ss.classList.add('saved'); }
}

// --- Panneau sélection -------------------------------------------------------
function renderSelectionPanel() {
  const panel = $('panel-selection');
  panel.innerHTML = '';
  panel.appendChild(h('h3', {}, 'Sélection'));
  const s = store.selection;
  const obj = selectedObject();
  if (!s || !obj) {
    panel.appendChild(h('p', { class: 'empty' }, 'Aucun objet sélectionné. Outil Sélection puis clique un objet du niveau actif.'));
    return;
  }
  const kindLabel = { zone: 'Zone', wall: 'Mur', door: 'Porte', window: 'Fenêtre' }[s.kind];
  panel.appendChild(h('div', { class: 'sel-head' }, [h('span', { class: 'sel-badge' }, kindLabel)]));

  if (s.kind === 'zone') renderZoneFields(panel, obj);
  else if (s.kind === 'wall') renderWallFields(panel, obj);
  else if (s.kind === 'door') renderDoorFields(panel, obj);
  else if (s.kind === 'window') renderWindowFields(panel, obj);

  panel.appendChild(h('div', { class: 'row-actions' }, [
    h('button', { class: 'btn', onclick: () => duplicateSelection(), title: 'Dupliquer (Ctrl+D)' }, 'Dupliquer'),
    h('button', { class: 'btn btn-danger', onclick: () => deleteSelection() }, 'Supprimer'),
  ]));
}

function fieldText(label, value, onchange) {
  const input = h('input', { type: 'text', value: value ?? '' });
  input.addEventListener('change', () => onchange(input.value));
  return h('div', { class: 'field' }, [h('label', {}, label), input]);
}
function fieldNumber(label, value, step, onchange, opts = {}) {
  const input = h('input', { type: 'number', step: String(step), value: String(value) });
  if (opts.min != null) input.min = String(opts.min);
  if (opts.disabled) input.disabled = true;
  input.addEventListener('change', () => onchange(num(input.value, value)));
  return h('div', { class: 'field' }, [h('label', {}, label), input]);
}
function fieldCheckbox(label, checked, onchange) {
  const input = h('input', { type: 'checkbox' });
  input.checked = !!checked;
  input.addEventListener('change', () => onchange(input.checked));
  return h('div', { class: 'field' }, [h('label', {}, label), input]);
}
function fieldStatic(label, value) {
  return h('div', { class: 'field' }, [h('label', {}, label), h('span', { class: 'val' }, value)]);
}

function renderZoneFields(panel, z) {
  panel.appendChild(fieldText('Nom', z.name, (v) => { z.name = v; commit('zone-name'); }));

  const sel = h('select');
  for (const poleKey of Object.keys(POLES)) {
    const group = h('optgroup', { label: poleName(poleKey) });
    for (const t of TYPES_BY_POLE[poleKey]) group.appendChild(h('option', { value: t.key }, t.name));
    sel.appendChild(group);
  }
  sel.value = z.type;
  sel.addEventListener('change', () => {
    const t = TYPES.find((x) => x.key === sel.value);
    z.type = t.key; z.pole = t.pole; commit('zone-type');
  });
  panel.appendChild(h('div', { class: 'field' }, [h('label', {}, 'Type'), sel]));
  panel.appendChild(h('div', { class: 'field' }, [
    h('label', {}, 'Pôle'),
    h('span', { class: 'val' }, [h('span', { class: 'swatch', style: `display:inline-block;background:${poleColor(z.pole)}` }), ' ' + poleName(z.pole)]),
  ]));

  // Dimensions précises (m) : X, Y (coin), L (largeur), P (profondeur).
  const r = rectOf(z.points);
  const mk = (lbl, val, apply) => {
    const inp = h('input', { type: 'number', step: '0.1', value: String(round2(val)) });
    inp.addEventListener('change', () => apply(num(inp.value, val)));
    return h('label', {}, [lbl, inp]);
  };
  panel.appendChild(h('div', { class: 'dims-grid' }, [
    mk('X', r.x, (v) => setZoneRect(z, { ...rectOf(z.points), x: v })),
    mk('Y', r.y, (v) => setZoneRect(z, { ...rectOf(z.points), y: v })),
    mk('L', r.w, (v) => setZoneRect(z, { ...rectOf(z.points), w: Math.max(0.2, v) })),
    mk('P', r.h, (v) => setZoneRect(z, { ...rectOf(z.points), h: Math.max(0.2, v) })),
  ]));
  panel.appendChild(fieldStatic('Surface', `${polygonArea(z.points).toFixed(2)} m²`));

  const note = h('textarea', { placeholder: 'Note libre sur l\'usage…' });
  note.value = z.note || '';
  note.addEventListener('change', () => { z.note = note.value; commit('zone-note'); });
  panel.appendChild(h('div', { class: 'field col' }, [h('label', {}, 'Note'), note]));
}

function setZoneRect(z, r) {
  const pts = rectFromCorners({ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y + r.h });
  if (zoneWouldOverlap(pts, z.levelId, z.id)) { flash('Dimensions refusées : recouvrement de zones.'); renderAll(); return; }
  z.points = pts;
  commit('zone-dims');
}

function renderWallFields(panel, w) {
  panel.appendChild(fieldNumber('Épaisseur (m)', w.thickness ?? DEFAULTS.wallThickness, 0.05, (v) => { w.thickness = Math.max(0.05, v); commit('wall-thick'); }, { min: 0.05 }));
  panel.appendChild(fieldNumber('Hauteur (m)', w.height ?? activeLevel().height, 0.1, (v) => { w.height = Math.max(0.5, v); commit('wall-height'); }, { min: 0.5 }));
  panel.appendChild(fieldStatic('Longueur', `${wallLength(w).toFixed(2)} m`));
  const nb = store.project.doors.filter((d) => d.wallId === w.id).length + store.project.windows.filter((x) => x.wallId === w.id).length;
  panel.appendChild(fieldStatic('Ouvertures', String(nb)));
  panel.appendChild(h('p', { class: 'muted' }, 'Glisse le mur dans la vue pour le déplacer (les ouvertures suivent).'));
}

function renderDoorFields(panel, d) {
  const wall = store.project.walls.find((w) => w.id === d.wallId);
  const len = wall ? wallLength(wall) : 0;
  panel.appendChild(fieldNumber('Largeur (m)', d.width, 0.05, (v) => { d.width = clampWidth(v, len); commit('door-w'); }, { min: 0.4 }));
  panel.appendChild(fieldNumber('Hauteur (m)', d.height, 0.05, (v) => { d.height = Math.max(1, v); commit('door-h'); }, { min: 1 }));
  panel.appendChild(fieldNumber('Position (m)', round2(d.offset), 0.05, (v) => { d.offset = clampOffset(v, d.width, len); commit('door-off'); }, { min: 0 }));
  panel.appendChild(fieldCheckbox('Donne sur l\'extérieur', d.exterior, (v) => { d.exterior = v; commit('door-ext'); }));
  if (d.exterior) panel.appendChild(h('p', { class: 'muted' }, '↳ Accès extérieur (marqueur orange). Indication de conception, pas une issue de secours validée.'));
}

function renderWindowFields(panel, wn) {
  const wall = store.project.walls.find((w) => w.id === wn.wallId);
  const len = wall ? wallLength(wall) : 0;
  panel.appendChild(fieldNumber('Largeur (m)', wn.width, 0.05, (v) => { wn.width = clampWidth(v, len); commit('win-w'); }, { min: 0.4 }));
  panel.appendChild(fieldNumber('Hauteur (m)', wn.height, 0.05, (v) => { wn.height = Math.max(0.3, v); commit('win-h'); }, { min: 0.3 }));
  panel.appendChild(fieldNumber('Allège (m)', wn.bay ? 0 : wn.sill, 0.05, (v) => { wn.sill = Math.max(0, v); wn.bay = false; commit('win-sill'); }, { min: 0, disabled: wn.bay }));
  panel.appendChild(fieldCheckbox('Baie vitrée (allège 0)', wn.bay, (v) => { wn.bay = v; if (v && wn.height < DEFAULTS.bayHeight) wn.height = DEFAULTS.bayHeight; commit('win-bay'); }));
  panel.appendChild(fieldNumber('Position (m)', round2(wn.offset), 0.05, (v) => { wn.offset = clampOffset(v, wn.width, len); commit('win-off'); }, { min: 0 }));
}

// --- Panneau filtre pôles ----------------------------------------------------
function renderFilterPanel() {
  const panel = $('panel-filter');
  panel.innerHTML = '';
  panel.appendChild(h('h3', {}, 'Filtre par pôle'));
  panel.appendChild(h('p', { class: 'muted' }, 'Coche un ou plusieurs pôles à mettre en avant. Le filtre agit sur la vue, pas sur les totaux.'));

  for (const poleKey of Object.keys(POLES)) {
    const row = h('label', { class: 'filter-row' }, [
      h('input', { type: 'checkbox' }),
      h('span', { class: 'swatch', style: `background:${poleColor(poleKey)}` }),
      h('span', {}, poleName(poleKey)),
    ]);
    const cb = row.querySelector('input');
    cb.checked = store.focusPoles.has(poleKey);
    cb.addEventListener('change', () => {
      if (cb.checked) store.focusPoles.add(poleKey); else store.focusPoles.delete(poleKey);
      commit('filter');
    });
    panel.appendChild(row);
  }

  // Mode appliqué aux pôles non ciblés.
  const mode = h('div', { class: 'filter-mode' }, [
    h('span', {}, 'Autres :'),
    modeRadio('estomper', 'Estomper'),
    modeRadio('masquer', 'Masquer'),
  ]);
  panel.appendChild(mode);
  panel.appendChild(h('div', { class: 'filter-actions' }, [
    h('button', { class: 'btn', onclick: () => { store.focusPoles.clear(); commit('filter'); } }, 'Tout afficher'),
  ]));
}
function modeRadio(value, label) {
  const input = h('input', { type: 'radio', name: 'focusmode' });
  input.checked = store.focusMode === value;
  input.addEventListener('change', () => { store.focusMode = value; commit('filter'); });
  return h('label', {}, [input, label]);
}

// --- Panneau récapitulatif ---------------------------------------------------
function computeRecap() {
  const p = store.project;
  const byPole = {}, byType = {}, byLevel = {};
  let total = 0;
  for (const z of p.zones) {
    const a = polygonArea(z.points);
    total += a;
    byPole[z.pole] = (byPole[z.pole] || 0) + a;
    byType[z.type] = (byType[z.type] || 0) + a;
    byLevel[z.levelId] = (byLevel[z.levelId] || 0) + a;
  }
  return { total, byPole, byType, byLevel, count: p.zones.length };
}

function renderRecapPanel() {
  const panel = $('panel-recap');
  panel.innerHTML = '';
  panel.appendChild(h('h3', {}, 'Récapitulatif'));
  const r = computeRecap();
  panel.appendChild(h('div', { class: 'recap-total' }, [
    'Surface zonée : ', h('b', {}, `${r.total.toFixed(1)} m²`),
    h('span', { class: 'muted' }, `  ·  ${r.count} zone${r.count > 1 ? 's' : ''}`),
  ]));
  if (r.total === 0) {
    panel.appendChild(h('p', { class: 'empty' }, 'Trace des zones au sol pour voir les surfaces se calculer ici.'));
    return;
  }

  panel.appendChild(h('div', { class: 'recap-sub' }, 'Par pôle'));
  const list = h('div', { class: 'recap-list' });
  for (const poleKey of Object.keys(POLES)) {
    const area = r.byPole[poleKey] || 0;
    if (area <= 0) continue;
    const pct = (area / r.total) * 100;
    list.appendChild(h('div', { class: 'bar-row' }, [
      h('div', { class: 'bar-head' }, [
        h('span', { class: 'nm' }, [h('span', { class: 'swatch', style: `background:${poleColor(poleKey)}` }), poleName(poleKey)]),
        h('span', { class: 'amt' }, `${area.toFixed(1)} m² · ${pct.toFixed(0)}%`),
      ]),
      h('div', { class: 'bar-track' }, [h('div', { class: 'bar-fill', style: `width:${pct}%;background:${poleColor(poleKey)}` })]),
    ]));
    for (const t of TYPES_BY_POLE[poleKey]) {
      const ta = r.byType[t.key] || 0;
      if (ta <= 0) continue;
      list.appendChild(h('div', { class: 'type-line' }, [
        h('span', {}, [h('span', { class: 'swatch', style: `background:${typeColor(t.key)};width:10px;height:10px;display:inline-block;margin-right:5px;vertical-align:middle` }), t.name]),
        h('span', { class: 'amt' }, `${ta.toFixed(1)} m²`),
      ]));
    }
  }
  panel.appendChild(list);

  panel.appendChild(h('div', { class: 'recap-sub' }, 'Par niveau'));
  const lvlList = h('div', { class: 'recap-list' });
  for (const l of store.project.levels) {
    const area = r.byLevel[l.id] || 0;
    const pct = r.total ? (area / r.total) * 100 : 0;
    lvlList.appendChild(h('div', { class: 'bar-row' }, [
      h('div', { class: 'bar-head' }, [
        h('span', { class: 'nm' }, l.name + (l.id === store.project.activeLevelId ? ' •' : '')),
        h('span', { class: 'amt' }, `${area.toFixed(1)} m² · ${pct.toFixed(0)}%`),
      ]),
      h('div', { class: 'bar-track' }, [h('div', { class: 'bar-fill', style: `width:${pct}%;background:var(--ink-soft)` })]),
    ]));
  }
  panel.appendChild(lvlList);
}

// --- Aide contextuelle -------------------------------------------------------
function renderHint() {
  const hints = {
    select: 'Sélection — Clique un objet. Glisse une porte/fenêtre le long du mur, une zone ou un mur pour les déplacer. Ctrl+D duplique.',
    wall: 'Mur — Presse et glisse au sol pour tracer un mur (aimanté à la grille et aux extrémités).',
    door: 'Porte — Clique sur un mur puis glisse pour positionner. Propriété « donne sur l\'extérieur » à droite.',
    window: 'Fenêtre — Clique sur un mur puis glisse. Largeur / hauteur / allège, ou coche « baie vitrée ».',
    zone: 'Zone — Presse et glisse au sol pour tracer un rectangle (recouvrements interdits). Type dans la barre d\'outils.',
  };
  const el = $('hint');
  el.dataset.base = '';
  el.innerHTML = `<b>${labelForTool(getTool())}</b> · ${hints[getTool()]} ` +
    `&nbsp; <span class="muted">Orbite : clic droit · Zoom : molette · Pan : clic milieu · Suppr : <kbd>Suppr</kbd></span>`;
}
function labelForTool(t) { return { select: 'Sélection', wall: 'Mur', door: 'Porte', window: 'Fenêtre', zone: 'Zone' }[t] || ''; }

// --- Utilitaires -------------------------------------------------------------
function num(v, fallback) { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; }
function round2(v) { return Math.round(v * 100) / 100; }
function clampWidth(v, len) { return Math.max(0.4, Math.min(v, Math.max(0.4, len - 0.1))); }
function clampOffset(v, width, len) { const half = width / 2; return Math.max(half, Math.min(len - half, v)); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

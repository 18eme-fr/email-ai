// =============================================================================
//  Outils d'édition dans la vue 3D (automate à la souris).
//  Outils : select | wall | door | window | zone.
//  Bouton gauche = édition. Bouton droit = orbite, molette = zoom, milieu = pan.
// =============================================================================
import * as THREE from 'three';
import { viewer, pointerToPlan, pickObject, planToWorld } from './viewer.js';
import {
  store, commit, emit, select, clearSelection, activeLevel,
  newId, findObject, wallById,
} from './store.js';
import { DEFAULTS, TYPES } from './config.js';
import {
  snapPoint, snap, projectOnWall, distToWall, wallLength, rectFromCorners, rectOf,
  rectsOverlap, dist,
} from './geometry.js';

let currentTool = 'select';
let currentZoneType = TYPES[0].key;
let drag = null;
const listeners = new Set();
let flashFn = null;

export function onToolChange(fn) { listeners.add(fn); }
export function setFlash(fn) { flashFn = fn; }
function flash(msg) { flashFn?.(msg); }

export function getTool() { return currentTool; }
export function setTool(name) { currentTool = name; cancelDraw(); for (const fn of listeners) fn(name); }
export function getZoneType() { return currentZoneType; }
export function setZoneType(key) { currentZoneType = key; }

export function initTools() {
  const el = viewer.renderer.domElement;
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointerleave', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
}

// --- Aides -------------------------------------------------------------------
function gridStep() { return store.snap ? (store.project.gridStep || 0) : 0; }

function snapDrawPoint(plan) {
  if (!store.snap) return { x: plan.x, y: plan.y };
  const p = snapPoint(plan, store.project.gridStep || 0);
  const lvl = activeLevel();
  let best = null, bestD = 0.4;
  for (const w of store.project.walls) {
    if (w.levelId !== lvl.id) continue;
    for (const end of [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }]) {
      const d = dist(plan, end);
      if (d < bestD) { bestD = d; best = end; }
    }
  }
  return best ? { x: best.x, y: best.y } : p;
}

function nearestWall(plan, maxDist = 0.6) {
  const lvl = activeLevel();
  let best = null, bestD = maxDist;
  for (const w of store.project.walls) {
    if (w.levelId !== lvl.id) continue;
    const d = distToWall(w, plan);
    if (d < bestD) { bestD = d; best = w; }
  }
  return best;
}

function clampOffset(offset, width, len) {
  const half = width / 2;
  const o = snap(offset, gridStep());
  return Math.max(half, Math.min(len - half, o));
}

// --- Détection de recouvrements ---------------------------------------------
export function zoneWouldOverlap(points, levelId, excludeId) {
  return store.project.zones.some(
    (z) => z.levelId === levelId && z.id !== excludeId && rectsOverlap(z.points, points)
  );
}
function openingsOnWall(wallId, excludeId) {
  return [...store.project.doors, ...store.project.windows]
    .filter((o) => o.wallId === wallId && o.id !== excludeId);
}
export function openingWouldOverlap(wallId, offset, width, excludeId) {
  const a0 = offset - width / 2, a1 = offset + width / 2;
  return openingsOnWall(wallId, excludeId).some((o) => {
    const b0 = o.offset - o.width / 2, b1 = o.offset + o.width / 2;
    return a0 < b1 - 0.02 && b0 < a1 - 0.02;
  });
}

// --- Prévisualisation --------------------------------------------------------
function clearHelpers() { viewer.groups.helpers.clear(); }
function previewSegment(a, b) {
  clearHelpers();
  const y = activeLevel().elevation + 0.05;
  const geo = new THREE.BufferGeometry().setFromPoints([planToWorld(a.x, a.y, y), planToWorld(b.x, b.y, y)]);
  viewer.groups.helpers.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a72d6 })));
  addDot(a); addDot(b);
}
function previewRect(a, b) {
  clearHelpers();
  const y = activeLevel().elevation + 0.05;
  const bad = zoneWouldOverlap(rectFromCorners(a, b), activeLevel().id, null);
  const pts = rectFromCorners(a, b).map((p) => planToWorld(p.x, p.y, y));
  pts.push(pts[0]);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  viewer.groups.helpers.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: bad ? 0xd6473c : 0x2a72d6 })));
}
function addDot(p) {
  const y = activeLevel().elevation + 0.05;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshBasicMaterial({ color: 0x2a72d6 }));
  dot.position.copy(planToWorld(p.x, p.y, y));
  viewer.groups.helpers.add(dot);
}

// --- Événements --------------------------------------------------------------
function onPointerDown(ev) {
  if (ev.button !== 0) return;
  const plan = pointerToPlan(ev);
  if (!plan) return;
  viewer.renderer.domElement.setPointerCapture?.(ev.pointerId);
  if (currentTool === 'select') return startSelect(ev, plan);
  if (currentTool === 'wall') return startDraw('wall', plan);
  if (currentTool === 'zone') return startDraw('zone', plan);
  if (currentTool === 'door') return startOpening('door', plan);
  if (currentTool === 'window') return startOpening('window', plan);
}

function onPointerMove(ev) {
  if (!drag) return;
  const plan = pointerToPlan(ev);
  if (!plan) return;
  if (drag.type === 'draw-wall') { drag.b = snapDrawPoint(plan); previewSegment(drag.a, drag.b); }
  else if (drag.type === 'draw-zone') { drag.b = snapDrawPoint(plan); previewRect(drag.a, drag.b); }
  else if (drag.type === 'slide-opening') slideOpening(plan);
  else if (drag.type === 'move-zone') moveZone(plan);
  else if (drag.type === 'move-wall') moveWall(plan);
}

function onPointerUp(ev) {
  if (!drag) return;
  const plan = pointerToPlan(ev);
  if (drag.type === 'draw-wall') {
    const b = plan ? snapDrawPoint(plan) : drag.b;
    if (b && dist(drag.a, b) > 0.15) {
      const lvl = activeLevel();
      store.project.walls.push({
        id: newId('wall'), levelId: lvl.id,
        x1: drag.a.x, y1: drag.a.y, x2: b.x, y2: b.y,
        thickness: DEFAULTS.wallThickness, height: lvl.height,
      });
      commit('wall-add');
    }
  } else if (drag.type === 'draw-zone') {
    finishZone(drag.a, plan ? snapDrawPoint(plan) : drag.b);
  } else if (drag.type === 'move-zone') {
    const z = findObject('zone', drag.id);
    if (z && zoneWouldOverlap(z.points, z.levelId, z.id)) {
      z.points = drag.orig; emit('drag'); flash('Déplacement annulé : recouvrement de zones interdit.');
    } else commit('move-zone');
  } else if (drag.type === 'slide-opening' || drag.type === 'move-wall') {
    commit(drag.type);
  }
  clearHelpers();
  drag = null;
}

function onKeyDown(ev) {
  if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
  if (ev.key === 'Escape') { cancelDraw(); clearSelection(); }
  else if (ev.key === 'Delete' || ev.key === 'Backspace') deleteSelection();
  else if (ev.key === 'd' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); duplicateSelection(); }
  else if (ev.key === 'v' || ev.key === 'V') setTool('select');
  else if (ev.key === 'm' || ev.key === 'M') setTool('wall');
  else if (ev.key === 'p' || ev.key === 'P') setTool('door');
  else if (ev.key === 'f' || ev.key === 'F') setTool('window');
  else if (ev.key === 'z' && !ev.ctrlKey && !ev.metaKey) setTool('zone');
}

// --- Actions -----------------------------------------------------------------
function startSelect(ev, plan) {
  const hit = pickObject(ev);
  if (!hit) { clearSelection(); return; }
  select(hit.kind, hit.id);
  if (hit.kind === 'door' || hit.kind === 'window') {
    const o = findObject(hit.kind, hit.id);
    drag = { type: 'slide-opening', kind: hit.kind, id: hit.id, wall: wallById(o.wallId), lastOffset: o.offset };
  } else if (hit.kind === 'zone') {
    const z = findObject('zone', hit.id);
    drag = { type: 'move-zone', id: hit.id, start: plan, orig: z.points.map((p) => ({ ...p })) };
  } else if (hit.kind === 'wall') {
    const w = findObject('wall', hit.id);
    drag = { type: 'move-wall', id: hit.id, start: plan, orig: { x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 } };
  }
}

function startDraw(kind, plan) {
  const a = snapDrawPoint(plan);
  drag = { type: kind === 'wall' ? 'draw-wall' : 'draw-zone', a, b: a };
  if (kind === 'wall') previewSegment(a, a); else previewRect(a, a);
}

function startOpening(kind, plan) {
  const wall = nearestWall(plan);
  if (!wall) { flash('Clique sur un mur pour y poser une ' + (kind === 'door' ? 'porte' : 'fenêtre') + '.'); return; }
  const len = wallLength(wall);
  const def = kind === 'door' ? DEFAULTS.door : DEFAULTS.window;
  const width = Math.min(def.width, Math.max(0.4, len - 0.2));
  const offset = clampOffset(projectOnWall(wall, plan).t, width, len);
  if (openingWouldOverlap(wall.id, offset, width, null)) {
    flash('Emplacement occupé par une autre ouverture.'); return;
  }
  const id = newId(kind);
  if (kind === 'door') store.project.doors.push({ id, wallId: wall.id, offset, width, height: def.height, exterior: def.exterior });
  else store.project.windows.push({ id, wallId: wall.id, offset, width, height: def.height, sill: def.sill, bay: def.bay });
  select(kind, id);
  emit('opening-add');
  drag = { type: 'slide-opening', kind, id, wall, lastOffset: offset };
}

function slideOpening(plan) {
  const o = findObject(drag.kind, drag.id);
  if (!o || !drag.wall) return;
  const len = wallLength(drag.wall);
  const candidate = clampOffset(projectOnWall(drag.wall, plan).t, o.width, len);
  if (!openingWouldOverlap(drag.wall.id, candidate, o.width, o.id)) {
    o.offset = candidate; drag.lastOffset = candidate;
  } else {
    o.offset = drag.lastOffset; // bloqué contre une autre ouverture
  }
  emit('drag');
}

function moveZone(plan) {
  const z = findObject('zone', drag.id);
  if (!z) return;
  const dx = snap(plan.x - drag.start.x, gridStep());
  const dy = snap(plan.y - drag.start.y, gridStep());
  z.points = drag.orig.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  emit('drag');
}

function moveWall(plan) {
  const w = findObject('wall', drag.id);
  if (!w) return;
  const dx = snap(plan.x - drag.start.x, gridStep());
  const dy = snap(plan.y - drag.start.y, gridStep());
  w.x1 = drag.orig.x1 + dx; w.y1 = drag.orig.y1 + dy;
  w.x2 = drag.orig.x2 + dx; w.y2 = drag.orig.y2 + dy;
  emit('drag'); // les portes/fenêtres suivent le mur (rendu relatif)
}

function finishZone(a, b) {
  if (!a || !b) return;
  const w = Math.abs(a.x - b.x), h = Math.abs(a.y - b.y);
  if (w < 0.2 || h < 0.2) return;
  const points = rectFromCorners(a, b);
  const lvl = activeLevel();
  if (zoneWouldOverlap(points, lvl.id, null)) {
    flash('Zone non créée : elle recouvre une zone existante.'); return;
  }
  const type = TYPES.find((t) => t.key === currentZoneType) || TYPES[0];
  const id = newId('zone');
  store.project.zones.push({ id, levelId: lvl.id, name: type.name, pole: type.pole, type: type.key, note: '', points });
  select('zone', id);
  commit('zone-add');
}

export function duplicateSelection() {
  const s = store.selection;
  if (!s) return;
  const p = store.project;
  if (s.kind === 'zone') {
    const z = findObject('zone', s.id); if (!z) return;
    const r = rectOf(z.points);
    const offs = [[r.w + 0.3, 0], [0, r.h + 0.3], [r.w + 0.3, r.h + 0.3], [-(r.w + 0.3), 0], [0, -(r.h + 0.3)]];
    for (const [dx, dy] of offs) {
      const pts = z.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
      if (!zoneWouldOverlap(pts, z.levelId, null)) {
        const id = newId('zone');
        p.zones.push({ ...z, id, points: pts });
        select('zone', id); commit('zone-dup'); return;
      }
    }
    flash('Pas de place libre pour dupliquer sans recouvrement.');
  } else if (s.kind === 'wall') {
    const w = findObject('wall', s.id); if (!w) return;
    const id = newId('wall');
    p.walls.push({ ...w, id, x1: w.x1 + 0.5, y1: w.y1 + 0.5, x2: w.x2 + 0.5, y2: w.y2 + 0.5 });
    select('wall', id); commit('wall-dup');
  } else if (s.kind === 'door' || s.kind === 'window') {
    const o = findObject(s.kind, s.id); if (!o) return;
    const wall = wallById(o.wallId); const len = wallLength(wall);
    let off = Math.min(o.offset + o.width + 0.1, len - o.width / 2);
    if (openingWouldOverlap(o.wallId, off, o.width, null)) { flash('Pas de place libre sur ce mur.'); return; }
    const id = newId(s.kind);
    (s.kind === 'door' ? p.doors : p.windows).push({ ...o, id, offset: off });
    select(s.kind, id); commit(s.kind + '-dup');
  }
}

export function deleteSelection() {
  const s = store.selection;
  if (!s) return;
  const p = store.project;
  if (s.kind === 'wall') {
    p.doors = p.doors.filter((d) => d.wallId !== s.id);
    p.windows = p.windows.filter((w) => w.wallId !== s.id);
    p.walls = p.walls.filter((w) => w.id !== s.id);
  } else if (s.kind === 'zone') p.zones = p.zones.filter((z) => z.id !== s.id);
  else if (s.kind === 'door') p.doors = p.doors.filter((d) => d.id !== s.id);
  else if (s.kind === 'window') p.windows = p.windows.filter((w) => w.id !== s.id);
  store.selection = null;
  commit('delete');
}

function cancelDraw() { drag = null; clearHelpers(); }

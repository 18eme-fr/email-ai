// =============================================================================
//  Store central : bibliothèque de projets (variantes), état actif + sélection,
//  abonnement/notification, persistance localStorage, historique (undo/redo).
//  - store.project : données du projet actif (niveaux, murs, portes, fenêtres,
//    zones). C'est ce que tout le reste de l'app manipule.
//  - store.library : liste des projets sauvegardés (pour comparer des variantes
//    sans perdre une version).
// =============================================================================
import { DEFAULTS } from './config.js';

export const SCHEMA_VERSION = 1;

const LIB_KEY = 'agencement3d.library.v1';
const OLD_KEY = 'agencement3d.project.v1'; // ancienne sauvegarde mono-projet

let uid = 1;
export function newId(prefix = 'o') {
  return `${prefix}${Date.now().toString(36)}${(uid++).toString(36)}`;
}

// --- Projet vierge -----------------------------------------------------------
export function emptyProject(name = 'Établissement culturel') {
  const levelId = newId('lvl');
  return {
    schemaVersion: SCHEMA_VERSION,
    name,
    activeLevelId: levelId,
    gridStep: DEFAULTS.gridStep,
    levels: [
      { id: levelId, name: 'Rez-de-chaussée', elevation: 0, height: DEFAULTS.levelHeight },
    ],
    walls: [], doors: [], windows: [], zones: [],
  };
}

// --- État interne ------------------------------------------------------------
const listeners = new Set();
let history = [];
let future = [];
let lastSavedAt = null;

export const store = {
  project: emptyProject(),
  projectId: null,
  library: { projects: [] }, // [{ id, updatedAt }] métadonnées, données dans localStorage
  selection: null,           // { kind, id } | null
  focusPoles: new Set(),     // pôles mis en avant (vide = tous)
  // Préférences de vue (hors projet, non exportées).
  snap: true,
  focusMode: 'estomper',     // 'estomper' | 'masquer' : sort des pôles non ciblés
  wallDisplay: 'full',       // 'full' | 'low' | 'hidden'
};

// --- Abonnement --------------------------------------------------------------
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit(reason = 'change') { for (const fn of listeners) fn(reason); }
export function lastSaved() { return lastSavedAt; }

// =============================================================================
//  Bibliothèque de projets
// =============================================================================
function libItems() {
  try { return JSON.parse(localStorage.getItem(LIB_KEY)) || null; } catch { return null; }
}
function writeLib(lib) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); lastSavedAt = Date.now(); }
  catch (e) { console.warn('Sauvegarde impossible :', e); }
}

// Charge la bibliothèque (migration depuis l'ancien format si besoin).
export function initLibrary() {
  let lib = libItems();
  if (!lib || !Array.isArray(lib.projects) || !lib.projects.length) {
    // Migration : ancienne sauvegarde mono-projet ?
    let migrated = null;
    try {
      const raw = localStorage.getItem(OLD_KEY);
      if (raw) migrated = normalizeProject(JSON.parse(raw));
    } catch { /* ignore */ }
    const data = migrated || null;
    lib = { activeId: null, projects: [] };
    if (data) {
      const id = newId('prj');
      lib.projects.push({ id, updatedAt: Date.now(), data });
      lib.activeId = id;
    }
    if (!lib.projects.length) {
      const id = newId('prj');
      lib.projects.push({ id, updatedAt: Date.now(), data: emptyProject() });
      lib.activeId = id;
    }
    writeLib(lib);
  }
  const active = lib.projects.find((p) => p.id === lib.activeId) || lib.projects[0];
  lib.activeId = active.id;
  store.projectId = active.id;
  store.project = normalizeProject(active.data);
  store.selection = null;
  history = []; future = [];
  writeLib(lib);
  refreshLibMeta(lib);
  return store.project;
}

function refreshLibMeta(lib) {
  store.library.projects = lib.projects.map((p) => ({
    id: p.id, name: p.data?.name || 'Projet', updatedAt: p.updatedAt,
  }));
  store.library.activeId = lib.activeId;
}

// Écrit le projet actif dans la bibliothèque.
export function saveActive() {
  const lib = libItems() || { activeId: store.projectId, projects: [] };
  let entry = lib.projects.find((p) => p.id === store.projectId);
  if (!entry) { entry = { id: store.projectId, data: null }; lib.projects.push(entry); }
  entry.data = store.project;
  entry.updatedAt = Date.now();
  lib.activeId = store.projectId;
  writeLib(lib);
  refreshLibMeta(lib);
}

export function listProjects() { return store.library.projects; }

export function switchProject(id) {
  if (id === store.projectId) return;
  saveActive();
  const lib = libItems();
  const entry = lib?.projects.find((p) => p.id === id);
  if (!entry) return;
  lib.activeId = id;
  writeLib(lib);
  store.projectId = id;
  store.project = normalizeProject(entry.data);
  store.selection = null;
  history = []; future = [];
  refreshLibMeta(lib);
  emit('project-switch');
}

export function newProject(name = 'Nouveau projet') {
  saveActive();
  const lib = libItems() || { activeId: null, projects: [] };
  const id = newId('prj');
  lib.projects.push({ id, updatedAt: Date.now(), data: emptyProject(name) });
  lib.activeId = id;
  writeLib(lib);
  store.projectId = id;
  store.project = normalizeProject(lib.projects.at(-1).data);
  store.selection = null;
  history = []; future = [];
  refreshLibMeta(lib);
  emit('project-new');
}

// Duplique le projet actif (nouvelle variante), sans perdre l'original.
export function duplicateActive() {
  saveActive();
  const lib = libItems();
  const copy = JSON.parse(JSON.stringify(store.project));
  copy.name = nextCopyName(store.project.name, lib);
  const id = newId('prj');
  lib.projects.push({ id, updatedAt: Date.now(), data: copy });
  lib.activeId = id;
  writeLib(lib);
  store.projectId = id;
  store.project = normalizeProject(copy);
  store.selection = null;
  history = []; future = [];
  refreshLibMeta(lib);
  emit('project-duplicate');
}

function nextCopyName(base, lib) {
  const clean = base.replace(/\s*\(copie(?:\s*\d+)?\)\s*$/i, '');
  const names = new Set(lib.projects.map((p) => p.data?.name));
  let candidate = `${clean} (copie)`;
  let n = 2;
  while (names.has(candidate)) candidate = `${clean} (copie ${n++})`;
  return candidate;
}

export function deleteProject(id) {
  const lib = libItems();
  if (!lib) return;
  lib.projects = lib.projects.filter((p) => p.id !== id);
  if (!lib.projects.length) {
    const nid = newId('prj');
    lib.projects.push({ id: nid, updatedAt: Date.now(), data: emptyProject() });
    lib.activeId = nid;
  } else if (lib.activeId === id) {
    lib.activeId = lib.projects[0].id;
  }
  writeLib(lib);
  const active = lib.projects.find((p) => p.id === lib.activeId);
  store.projectId = active.id;
  store.project = normalizeProject(active.data);
  store.selection = null;
  history = []; future = [];
  refreshLibMeta(lib);
  emit('project-delete');
}

// Importe des données comme NOUVEAU projet (ne remplace jamais l'actif).
export function importAsProject(data) {
  if (!validProjectData(data)) return false;
  saveActive();
  const lib = libItems() || { activeId: null, projects: [] };
  const clean = normalizeProject(JSON.parse(JSON.stringify(data)));
  const id = newId('prj');
  lib.projects.push({ id, updatedAt: Date.now(), data: clean });
  lib.activeId = id;
  writeLib(lib);
  store.projectId = id;
  store.project = clean;
  store.selection = null;
  history = []; future = [];
  refreshLibMeta(lib);
  emit('project-import');
  return true;
}

export function exportActive() {
  return { ...store.project, schemaVersion: SCHEMA_VERSION };
}

// --- Validation / normalisation ---------------------------------------------
export function validProjectData(p) {
  return !!(p && typeof p === 'object' && Array.isArray(p.levels) && p.levels.length &&
    Array.isArray(p.zones) && Array.isArray(p.walls) &&
    Array.isArray(p.doors) && Array.isArray(p.windows));
}

export function normalizeProject(p) {
  p = p || emptyProject();
  p.schemaVersion ??= SCHEMA_VERSION;
  p.name ||= 'Établissement culturel';
  p.gridStep ??= DEFAULTS.gridStep;
  p.levels ||= [];
  p.walls ||= [];
  p.doors ||= [];
  p.windows ||= [];
  p.zones ||= [];
  for (const z of p.zones) if (z.note == null) z.note = '';
  if (!p.activeLevelId || !p.levels.some((l) => l.id === p.activeLevelId)) {
    p.activeLevelId = p.levels[0]?.id;
  }
  return p;
}

// --- Historique --------------------------------------------------------------
export function commit(reason = 'change') {
  clampOpeningsToWalls();
  history.push(JSON.stringify(store.project));
  if (history.length > 100) history.shift();
  future = [];
  saveActive();
  emit(reason);
}
export function canUndo() { return history.length > 0; }
export function canRedo() { return future.length > 0; }
export function undo() {
  if (!history.length) return;
  future.push(JSON.stringify(store.project));
  store.project = normalizeProject(JSON.parse(history.pop()));
  clampSelection();
  saveActive();
  emit('undo');
}
export function redo() {
  if (!future.length) return;
  history.push(JSON.stringify(store.project));
  store.project = normalizeProject(JSON.parse(future.pop()));
  clampSelection();
  saveActive();
  emit('redo');
}

// Garde les ouvertures valides quand un mur est raccourci ou supprimé.
function clampOpeningsToWalls() {
  const p = store.project;
  const wallById = new Map(p.walls.map((w) => [w.id, w]));
  const len = (w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
  const fix = (arr) => arr.filter((o) => {
    const w = wallById.get(o.wallId);
    if (!w) return false; // mur disparu -> ouverture supprimée
    const L = len(w);
    o.width = Math.max(0.4, Math.min(o.width, Math.max(0.4, L - 0.1)));
    o.offset = Math.max(o.width / 2, Math.min(L - o.width / 2, o.offset));
    return true;
  });
  p.doors = fix(p.doors);
  p.windows = fix(p.windows);
}

// --- Sélection ---------------------------------------------------------------
export function select(kind, id) {
  store.selection = kind && id ? { kind, id } : null;
  emit('selection');
}
export function clearSelection() {
  if (store.selection) { store.selection = null; emit('selection'); }
}
function clampSelection() {
  const s = store.selection;
  if (!s) return;
  const list = collectionFor(s.kind);
  if (!list || !list.some((o) => o.id === s.id)) store.selection = null;
}

// --- Accès pratiques ---------------------------------------------------------
export function activeLevel() {
  return store.project.levels.find((l) => l.id === store.project.activeLevelId);
}
export function collectionFor(kind) {
  const p = store.project;
  return { zone: p.zones, wall: p.walls, door: p.doors, window: p.windows }[kind] || null;
}
export function findObject(kind, id) {
  return collectionFor(kind)?.find((o) => o.id === id) || null;
}
export function selectedObject() {
  const s = store.selection;
  return s ? findObject(s.kind, s.id) : null;
}
export function wallById(id) {
  return store.project.walls.find((w) => w.id === id) || null;
}

// Charge un projet complet comme actif (utilisé par l'exemple / le remplacement).
export function setProject(p) {
  store.project = normalizeProject(p);
  store.selection = null;
  history = []; future = [];
  saveActive();
  emit('reset');
}

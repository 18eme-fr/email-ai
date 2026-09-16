// =============================================================================
//  Builder : (re)construit toute la géométrie 3D à partir de l'état.
//  Reconstruction complète à chaque changement (le nombre d'objets reste
//  modeste pour un usage personnel). Les ressources sont libérées proprement.
// =============================================================================
import * as THREE from 'three';
import { viewer } from './viewer.js';
import { store } from './store.js';
import { typeColor, poleColor, DEFAULTS } from './config.js';
import { wallLength, wallAngleY, wallMid } from './geometry.js';

const HIGHLIGHT = new THREE.Color('#ffd23f');
const EXTERIOR_COLOR = '#e8842a'; // accès extérieur : orange vif
const WALL_COLOR = '#cfd6dd';
const WALL_TOP_COLOR = '#bfc7cf';
const DOOR_COLOR = '#9c6b3f';
const GLASS_COLOR = '#8fbfe0';

function disposeGroup(g) {
  const trash = [];
  g.traverse((o) => {
    if (o.geometry) trash.push(o.geometry);
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) trash.push(m);
    }
  });
  g.clear();
  for (const r of trash) r.dispose?.();
}

// Boîte en coordonnées locales du mur : u le long du mur, y vertical, w épaisseur.
function localBox(u0, u1, y0, y1, depth, material) {
  const w = Math.max(u1 - u0, 1e-4);
  const h = Math.max(y1 - y0, 1e-4);
  const geo = new THREE.BoxGeometry(w, h, depth);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0);
  return mesh;
}

function isSelected(kind, id) {
  const s = store.selection;
  return s && s.kind === kind && s.id === id;
}

// --- Point d'entrée ----------------------------------------------------------
export function rebuild() {
  for (const key of ['levels', 'walls', 'openings', 'zones', 'markers']) {
    disposeGroup(viewer.groups[key]);
  }
  const p = store.project;
  const activeId = p.activeLevelId;

  for (const level of p.levels) {
    const active = level.id === activeId;
    buildLevelSlab(level, active);
    for (const w of p.walls.filter((w) => w.levelId === level.id)) {
      buildWall(w, level, active);
    }
    for (const z of p.zones.filter((z) => z.levelId === level.id)) {
      buildZone(z, level, active);
    }
  }
  // Ouvertures : rattachées à un mur (donc à son niveau).
  for (const d of p.doors) buildOpening(d, 'door');
  for (const wnd of p.windows) buildOpening(wnd, 'window');
}

// --- Dalle de niveau (repère discret) ---------------------------------------
function buildLevelSlab(level, active) {
  if (!active) return; // on n'encombre pas la vue avec les dalles des autres niveaux
  const geo = new THREE.PlaneGeometry(60, 60);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(6, level.elevation + 0.0005, 6);
  viewer.groups.levels.add(mesh);
}

// --- Murs (segmentés autour des ouvertures) ---------------------------------
function buildWall(w, level, active) {
  const mode = store.wallDisplay;
  if (mode === 'hidden') return;
  const low = mode === 'low';
  const len = wallLength(w);
  if (len < 1e-3) return;
  const t = w.thickness ?? DEFAULTS.wallThickness;
  const Hraw = w.height ?? level.height ?? DEFAULTS.levelHeight;
  const H = low ? Math.min(Hraw, 1.0) : Hraw; // murs abaissés pour voir l'intérieur
  const half = len / 2;

  const selected = active && isSelected('wall', w.id);
  const solidMat = new THREE.MeshStandardMaterial({
    color: selected ? HIGHLIGHT : new THREE.Color(WALL_COLOR),
    roughness: 0.95, metalness: 0,
    transparent: !active, opacity: active ? 1 : 0.18,
    emissive: selected ? new THREE.Color('#4a3b00') : new THREE.Color('#000000'),
  });

  const group = new THREE.Group();
  group.position.set(wallMid(w).x, level.elevation, wallMid(w).y);
  group.rotation.y = wallAngleY(w);
  if (active) group.userData = { pickable: true, kind: 'wall', id: w.id };

  // Ouvertures de ce mur, converties en intervalles locaux u.
  const openings = [
    ...store.project.doors.filter((d) => d.wallId === w.id).map((d) => ({ kind: 'door', o: d })),
    ...store.project.windows.filter((x) => x.wallId === w.id).map((x) => ({ kind: 'window', o: x })),
  ].map(({ kind, o }) => {
    const width = o.width;
    const center = clamp(o.offset, width / 2, len - width / 2) - half;
    return { kind, o, uL: center - width / 2, uR: center + width / 2 };
  }).sort((a, b) => a.uL - b.uL);

  // Segments pleins pleine hauteur entre les ouvertures.
  let cursor = -half;
  for (const op of openings) {
    if (op.uL > cursor + 1e-4) group.add(localBox(cursor, op.uL, 0, H, t, solidMat));
    cursor = Math.max(cursor, op.uR);
  }
  if (cursor < half - 1e-4) group.add(localBox(cursor, half, 0, H, t, solidMat));

  // Linteaux (et allèges des fenêtres) : parties pleines au-dessus/dessous.
  // En mode « murs abaissés », on laisse simplement les trouées ouvertes.
  if (!low) {
    for (const op of openings) {
      if (op.kind === 'door') {
        const dh = op.o.height;
        if (dh < H) group.add(localBox(op.uL, op.uR, dh, H, t, solidMat));
      } else {
        const sill = op.o.bay ? 0 : op.o.sill;
        const top = sill + op.o.height;
        if (sill > 0.001) group.add(localBox(op.uL, op.uR, 0, sill, t, solidMat)); // allège
        if (top < H) group.add(localBox(op.uL, op.uR, top, H, t, solidMat));        // linteau
      }
    }
  }

  // Liseré de tête pour bien lire l'arête haute des murs.
  const topMat = new THREE.MeshBasicMaterial({
    color: WALL_TOP_COLOR, transparent: !active, opacity: active ? 1 : 0.2,
  });
  const cap = localBox(-half, half, H, H + 0.02, t + 0.005, topMat);
  group.add(cap);

  viewer.groups.walls.add(group);
}

// --- Ouvertures : portes et fenêtres ----------------------------------------
function buildOpening(o, kind) {
  const mode = store.wallDisplay;
  if (mode === 'hidden') return;
  const wall = store.project.walls.find((w) => w.id === o.wallId);
  if (!wall) return;
  const level = store.project.levels.find((l) => l.id === wall.levelId);
  if (!level) return;
  const active = level.id === store.project.activeLevelId;

  // Murs abaissés : on ne montre que les marqueurs d'accès extérieur au sol.
  if (mode === 'low') {
    if (kind === 'door' && o.exterior) buildLowExteriorMarker(o, wall, level, active);
    return;
  }

  const len = wallLength(wall);
  const t = wall.thickness ?? DEFAULTS.wallThickness;
  const H = wall.height ?? level.height ?? DEFAULTS.levelHeight;
  const half = len / 2;
  const width = o.width;
  const uCenter = clamp(o.offset, width / 2, len - width / 2) - half;

  const group = new THREE.Group();
  group.position.set(wallMid(wall).x, level.elevation, wallMid(wall).y);
  group.rotation.y = wallAngleY(wall);
  if (active) group.userData = { pickable: true, kind, id: o.id };

  const selected = active && isSelected(kind, o.id);
  const uL = uCenter - width / 2;
  const uR = uCenter + width / 2;

  if (kind === 'door') {
    const ext = !!o.exterior;
    const leafColor = selected ? HIGHLIGHT.getStyle() : (ext ? EXTERIOR_COLOR : DOOR_COLOR);
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ext ? EXTERIOR_COLOR : '#6d4c30'),
      roughness: 0.8, transparent: !active, opacity: active ? 1 : 0.25,
      emissive: selected ? new THREE.Color('#4a3b00') : new THREE.Color(0x000000),
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(leafColor),
      roughness: 0.7, transparent: !active, opacity: active ? 1 : 0.25,
      emissive: selected ? new THREE.Color('#4a3b00') : new THREE.Color(0x000000),
    });
    const dh = o.height;
    // Vantail (légèrement en retrait).
    group.add(localBox(uL + 0.03, uR - 0.03, 0.0, dh, t * 0.35, leafMat));
    // Jambages.
    group.add(localBox(uL - 0.03, uL + 0.03, 0, dh, t + 0.03, frameMat));
    group.add(localBox(uR - 0.03, uR + 0.03, 0, dh, t + 0.03, frameMat));
    // Seuil.
    group.add(localBox(uL, uR, 0, 0.03, t + 0.03, frameMat));

    if (ext) addExteriorMarker(group, uCenter, dh, t, active);
  } else {
    // Fenêtre : verre semi-transparent + cadre fin.
    const sill = o.bay ? 0 : o.sill;
    const gh = o.height;
    const glassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(GLASS_COLOR),
      transparent: true, opacity: active ? 0.32 : 0.12,
      roughness: 0.1, metalness: 0.0, depthWrite: false, side: THREE.DoubleSide,
      emissive: selected ? new THREE.Color('#2a3a44') : new THREE.Color(0x000000),
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selected ? HIGHLIGHT.getStyle() : '#516b7d'),
      roughness: 0.6, transparent: !active, opacity: active ? 1 : 0.25,
    });
    group.add(localBox(uL + 0.04, uR - 0.04, sill + 0.04, sill + gh - 0.04, t * 0.25, glassMat));
    // Cadre.
    group.add(localBox(uL, uL + 0.05, sill, sill + gh, t * 0.6, frameMat));
    group.add(localBox(uR - 0.05, uR, sill, sill + gh, t * 0.6, frameMat));
    group.add(localBox(uL, uR, sill, sill + 0.05, t * 0.6, frameMat));
    group.add(localBox(uL, uR, sill + gh - 0.05, sill + gh, t * 0.6, frameMat));
  }

  viewer.groups.openings.add(group);
}

// Marqueur d'accès extérieur au sol (utilisé quand les murs sont abaissés).
function buildLowExteriorMarker(o, wall, level, active) {
  const len = wallLength(wall);
  const uCenter = clamp(o.offset, o.width / 2, len - o.width / 2) - len / 2;
  const group = new THREE.Group();
  group.position.set(wallMid(wall).x, level.elevation, wallMid(wall).y);
  group.rotation.y = wallAngleY(wall);
  if (active) group.userData = { pickable: true, kind: 'door', id: o.id };
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(EXTERIOR_COLOR), roughness: 0.5,
    emissive: new THREE.Color('#5a2f00'), emissiveIntensity: 0.4,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), mat);
  cone.rotation.y = Math.PI / 4;
  cone.position.set(uCenter, 0.22, 0);
  group.add(cone);
  viewer.groups.openings.add(group);
}

// Marqueur "accès extérieur" : plot + flèche au-dessus de la porte.
function addExteriorMarker(group, uCenter, dh, t, active) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(EXTERIOR_COLOR), roughness: 0.5,
    emissive: new THREE.Color('#5a2f00'), emissiveIntensity: 0.4,
    transparent: !active, opacity: active ? 1 : 0.3,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 4), mat);
  cone.rotation.y = Math.PI / 4;
  cone.position.set(uCenter, dh + 0.42, 0);
  group.add(cone);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), mat);
  stem.position.set(uCenter, dh + 0.18, 0);
  group.add(stem);
}

// --- Zones (polygones au sol) -----------------------------------------------
function buildZone(z, level, active) {
  if (!z.points || z.points.length < 3) return;
  const selected = active && isSelected('zone', z.id);

  const shape = new THREE.Shape();
  shape.moveTo(z.points[0].x, z.points[0].y);
  for (let i = 1; i < z.points.length; i++) shape.lineTo(z.points[i].x, z.points[i].y);
  shape.closePath();

  const focus = store.focusPoles;
  const dimmed = active && focus.size > 0 && !focus.has(z.pole);
  // Filtre « masquer » : on ne dessine pas du tout les pôles non ciblés.
  if (dimmed && store.focusMode === 'masquer') return;

  const geo = new THREE.ShapeGeometry(shape);
  const baseOpacity = active ? (dimmed ? 0.1 : 0.72) : 0.14;

  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(typeColor(z.type)),
    transparent: true, opacity: baseOpacity, side: THREE.DoubleSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = level.elevation + 0.02;
  if (active) mesh.userData = { pickable: true, kind: 'zone', id: z.id };

  // Contour (couleur du pôle) pour lisibilité.
  const edges = new THREE.EdgesGeometry(geo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(selected ? HIGHLIGHT.getStyle() : poleColor(z.pole)),
    transparent: true, opacity: active ? (dimmed ? 0.3 : 0.95) : 0.25,
    linewidth: 1,
  });
  const line = new THREE.LineSegments(edges, edgeMat);
  line.rotation.x = Math.PI / 2;
  line.position.y = level.elevation + 0.025;

  viewer.groups.zones.add(mesh);
  viewer.groups.zones.add(line);
}

function clamp(v, lo, hi) {
  if (hi < lo) return (lo + hi) / 2;
  return Math.max(lo, Math.min(hi, v));
}

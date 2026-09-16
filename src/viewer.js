// =============================================================================
//  Viewer 3D : scène Three.js, caméra, contrôles orbitaux, lumières, grille,
//  raycasting sur le sol / les objets, projection écran pour les étiquettes.
// =============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { activeLevel } from './store.js';

export const viewer = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  // Groupes réattachés par builder.js
  groups: {},
  container: null,
  gridHelper: null,
};

// Plan de sol infini (au niveau actif) utilisé pour le picking à la souris.
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function initViewer(container) {
  viewer.container = container;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eef1f5');
  viewer.scene = scene;

  const camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 2000
  );
  camera.position.set(14, 16, 20);
  viewer.camera = camera;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);
  viewer.renderer = renderer;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495; // interdit de passer sous le sol
  controls.target.set(6, 0, 6);
  // Bouton droit = orbite, on garde le gauche pour l'édition.
  controls.mouseButtons = {
    LEFT: null, // réservé à l'édition
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.enablePan = true;
  viewer.controls = controls;

  // Lumières : rendu clair, non réaliste.
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(12, 25, 8);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.25);
  dir2.position.set(-10, 15, -12);
  scene.add(dir2);

  // Grille de repère au sol.
  const grid = new THREE.GridHelper(60, 120, 0xb9c2cc, 0xd7dde3);
  grid.position.y = 0.001;
  scene.add(grid);
  viewer.gridHelper = grid;

  // Groupes de rendu (remplis par builder.js).
  for (const key of ['levels', 'walls', 'openings', 'zones', 'markers', 'helpers']) {
    const g = new THREE.Group();
    g.name = key;
    scene.add(g);
    viewer.groups[key] = g;
  }

  window.addEventListener('resize', onResize);
  animate();
  return viewer;
}

function onResize() {
  const c = viewer.container;
  if (!c) return;
  viewer.camera.aspect = c.clientWidth / c.clientHeight;
  viewer.camera.updateProjectionMatrix();
  viewer.renderer.setSize(c.clientWidth, c.clientHeight);
}

const labelCallbacks = new Set();
export function onAfterRender(fn) { labelCallbacks.add(fn); }

function animate() {
  requestAnimationFrame(animate);
  viewer.controls.update();
  viewer.renderer.render(viewer.scene, viewer.camera);
  for (const fn of labelCallbacks) fn();
}

// --- Conversion coordonnées --------------------------------------------------
// plan (x, y) + altitude -> vecteur monde.
export function planToWorld(x, y, elevation = 0) {
  return new THREE.Vector3(x, elevation, y);
}

// Position normalisée de la souris (-1..1) à partir d'un événement.
function pointerNDC(ev) {
  const rect = viewer.renderer.domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1
  );
}

// Intersection du rayon souris avec le plan du niveau actif -> point plan {x,y}.
export function pointerToPlan(ev) {
  const lvl = activeLevel();
  groundPlane.constant = -(lvl?.elevation ?? 0);
  viewer.raycaster.setFromCamera(pointerNDC(ev), viewer.camera);
  const hit = new THREE.Vector3();
  const ok = viewer.raycaster.ray.intersectPlane(groundPlane, hit);
  if (!ok) return null;
  return { x: hit.x, y: hit.z };
}

// Picking d'objets : renvoie le premier mesh "sélectionnable" touché,
// avec ses userData { kind, id }. On teste openings, walls, zones.
export function pickObject(ev) {
  viewer.raycaster.setFromCamera(pointerNDC(ev), viewer.camera);
  const targets = [
    viewer.groups.openings,
    viewer.groups.walls,
    viewer.groups.zones,
  ];
  const hits = viewer.raycaster.intersectObjects(targets, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData?.pickable) o = o.parent;
    if (o && o.userData?.pickable) {
      return { kind: o.userData.kind, id: o.userData.id, point: h.point };
    }
  }
  return null;
}

// Projette un point monde vers des coordonnées écran en pixels (étiquettes).
export function worldToScreen(vec3) {
  const v = vec3.clone().project(viewer.camera);
  const rect = viewer.renderer.domElement.getBoundingClientRect();
  return {
    x: (v.x * 0.5 + 0.5) * rect.width,
    y: (-v.y * 0.5 + 0.5) * rect.height,
    visible: v.z < 1,
  };
}

// Recentre / réoriente la caméra.
export function frameScene(topView = false) {
  const lvl = activeLevel();
  const y = lvl?.elevation ?? 0;
  viewer.controls.target.set(6, y, 6);
  if (topView) {
    viewer.camera.position.set(6, 34, 6.001);
  } else {
    viewer.camera.position.set(6 + 14, y + 16, 6 + 20);
  }
  viewer.controls.update();
}

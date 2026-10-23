import type { SimulationRun } from '../engine/types';
import type { Direction, FloorKind, WallKind } from './render/contract';
import type { ExplorationScene, SceneNpc, SceneProp } from './types';

/**
 * Logique pure de l'exploration : grille, collisions, déplacement, proximité.
 * Aucune dépendance au rendu ni à React (testable).
 */

export interface Cell {
  floor?: FloorKind;
  wall?: WallKind;
  exit: boolean;
  blocked: boolean;
}

export interface World {
  width: number;
  height: number;
  cells: Cell[][];
  props: SceneProp[];
  npcs: SceneNpc[];
}

export interface Player {
  x: number;
  y: number;
  dir: Direction;
  moving: boolean;
  /** Distance parcourue, pour l'animation de marche. */
  walked: number;
}

export const PLAYER_RADIUS = 0.28;
export const SPEED = 3.2; // cases par seconde
export const TALK_RANGE = 1.45;

export function buildWorld(scene: ExplorationScene, run: SimulationRun): World {
  const height = scene.map.length;
  const width = Math.max(...scene.map.map((r) => r.length));
  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      const ch = scene.map[y]?.[x] ?? ' ';
      const def = scene.legend[ch];
      row.push(def ? { floor: def.floor, wall: def.wall, exit: !!def.exit, blocked: !!def.wall || !def.floor } : { exit: false, blocked: true });
    }
    cells.push(row);
  }
  const npcs = scene.npcs.filter((n) => !n.present || n.present(run));
  for (const p of scene.props) if (p.blocking !== false) markBlocked(cells, p.x, p.y);
  for (const n of npcs) markBlocked(cells, n.x, n.y);
  return { width, height, cells, props: scene.props, npcs };
}

function markBlocked(cells: Cell[][], x: number, y: number) {
  const c = cells[y]?.[x];
  if (c) c.blocked = true;
}

export function isBlocked(world: World, x: number, y: number): boolean {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= world.width || cy >= world.height) return true;
  return world.cells[cy]?.[cx]?.blocked ?? true;
}

/** Collision d'un disque contre les cases bloquées (test aux 4 points cardinaux et 4 diagonales). */
export function collides(world: World, x: number, y: number, r = PLAYER_RADIUS): boolean {
  const d = r * 0.707;
  const pts: [number, number][] = [
    [x + r, y], [x - r, y], [x, y + r], [x, y - r],
    [x + d, y + d], [x - d, y - d], [x + d, y - d], [x - d, y + d],
  ];
  return pts.some(([px, py]) => isBlocked(world, px, py));
}

/**
 * Direction de déplacement en coordonnées de grille à partir des touches
 * (écran). En vue isométrique, « haut » à l'écran = −x −y.
 */
export function inputToGrid(up: boolean, down: boolean, left: boolean, right: boolean): { dx: number; dy: number } {
  let sx = 0;
  let sy = 0;
  if (up) sy -= 1;
  if (down) sy += 1;
  if (left) sx -= 1;
  if (right) sx += 1;
  if (sx === 0 && sy === 0) return { dx: 0, dy: 0 };
  // écran → grille : x = sx + sy, y = sy − sx (puis normalisation)
  let dx = sx + sy;
  let dy = sy - sx;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  return { dx, dy };
}

export function dirFromVector(dx: number, dy: number): Direction {
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 's' : 'n';
  return dy > 0 ? 'w' : 'e';
}

/** Déplace le joueur avec glissement le long des obstacles (axes séparés). */
export function movePlayer(world: World, p: Player, dx: number, dy: number, dt: number): Player {
  if (dx === 0 && dy === 0) return { ...p, moving: false };
  const step = SPEED * Math.min(dt, 0.05);
  let { x, y } = p;
  const nx = x + dx * step;
  if (!collides(world, nx, y)) x = nx;
  const ny = y + dy * step;
  if (!collides(world, x, ny)) y = ny;
  const moved = Math.hypot(x - p.x, y - p.y);
  return { x, y, dir: dirFromVector(dx, dy), moving: moved > 0.0001, walked: p.walked + moved };
}

export function npcCenter(n: SceneNpc): { x: number; y: number } {
  return { x: n.x + 0.5, y: n.y + 0.5 };
}

/** Personne la plus proche à portée de conversation. */
export function nearestNpc(world: World, p: Player): SceneNpc | undefined {
  let best: SceneNpc | undefined;
  let bestD = TALK_RANGE;
  for (const n of world.npcs) {
    const c = npcCenter(n);
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

/** Vrai si le joueur se tient contre une sortie. */
export function nearExit(world: World, p: Player): boolean {
  for (let y = 0; y < world.height; y++)
    for (let x = 0; x < world.width; x++)
      if (world.cells[y]?.[x]?.exit && Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) < 1.25) return true;
  return false;
}

/** Panneau à portée de lecture. */
export function nearestLabel(world: World, p: Player): SceneProp | undefined {
  return world.props.find((pr) => pr.label && Math.hypot(pr.x + 0.5 - p.x, pr.y + 0.5 - p.y) < 1.3);
}

/** Vecteur de marche automatique vers une cible (clic ou bouton « aller parler »). */
export function steerTowards(p: Player, tx: number, ty: number): { dx: number; dy: number; arrived: boolean } {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.15) return { dx: 0, dy: 0, arrived: true };
  return { dx: dx / d, dy: dy / d, arrived: false };
}

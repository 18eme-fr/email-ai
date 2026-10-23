import { useId } from 'react';

/** Hash entier → [0, 1), déterministe (aucun Math.random dans les illustrations). */
export function hash01(n: number, salt = 0): number {
  let x = Math.imul((n | 0) + 0x9e3779b9, 0x27d4eb2d) ^ Math.imul((salt | 0) + 0x7f4a7c15, 0x165667b1);
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Petite suite pseudo-aléatoire déterministe dérivée d'une graine. */
export function makeRng(seed: number): () => number {
  let i = 0;
  return () => hash01(seed, i++);
}

/** Arrondi à 0,1 près pour des chemins SVG compacts. */
export function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type Pt = readonly [number, number];

/** Liste de points pour l'attribut `points` d'un polygone. */
export function pts(points: ReadonlyArray<Pt>): string {
  return points.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
}

/** Identifiant SVG unique et sûr (sans « : ») pour les dégradés et masques. */
export function useSvgId(prefix: string): string {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

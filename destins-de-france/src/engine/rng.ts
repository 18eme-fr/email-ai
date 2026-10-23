/**
 * Générateur pseudo-aléatoire à graine (mulberry32).
 *
 * L'état complet tient dans un entier 32 bits stocké dans la partie
 * (`SimulationRun.rngState`) : une même graine et les mêmes choix redonnent
 * exactement la même vie. Aucun appel à Math.random() n'est fait par le moteur.
 */
export class Rng {
  private state: number;

  constructor(state: number) {
    this.state = state >>> 0;
  }

  /** État courant, à réécrire dans la partie après usage. */
  get current(): number {
    return this.state;
  }

  /** Nombre uniforme dans [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick sur une liste vide');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Tirage pondéré. Les poids négatifs ou nuls sont ignorés. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    const weights = items.map((i) => Math.max(0, weight(i)));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) throw new Error('Rng.weighted : aucun poids positif');
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i] as number;
      if (r < 0) return items[i] as T;
    }
    return items[items.length - 1] as T;
  }

  /** Loi normale centrée réduite (Box-Muller). */
  normal(): number {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}

/** Graine à partir d'un texte ou d'une horloge (seul point d'entrée non déterministe, côté interface). */
export function seedFromString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

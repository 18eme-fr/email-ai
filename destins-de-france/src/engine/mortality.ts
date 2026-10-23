import type { Sex, StatisticalParameter } from './types';

/**
 * Modèle de mortalité (moteur probabiliste).
 *
 * On utilise un risque instantané de type Gompertz-Makeham :
 *   h(a) = M + A · exp(B · a)
 * et une probabilité annuelle de décès q(a) = 1 − exp(−∫ h) sur l'année.
 *
 * - B (pente de Gompertz) et M (terme constant) : HYPOTHÈSES DE MODÈLE, ordres
 *   de grandeur classiques en démographie, non estimés sur données françaises.
 * - q(0) (mortalité de la première année) : PARAMÈTRE DE DÉMONSTRATION.
 * - A : CALIBRÉ numériquement pour que l'espérance de vie à la naissance du
 *   modèle égale l'espérance de vie observée en 2025 (Insee) pour chaque sexe.
 *
 * Ce n'est pas une table de mortalité : la phase 3 remplacera ce modèle par les
 * quotients de mortalité par âge publiés par l'Insee (tables du moment) et, pour
 * le futur, par des projections clairement identifiées.
 */

export const LIFE_EXPECTANCY_2025: Record<Sex, number> = { F: 85.9, M: 80.3 };
const GOMPERTZ_B = 0.1;
const MAKEHAM_M = 0.0002;
const INFANT_Q = 0.0035;
export const MAX_AGE = 115;

function annualQ(a: number, A: number): number {
  if (a === 0) return INFANT_Q;
  // Intégrale exacte de h entre a et a+1.
  const integral = MAKEHAM_M + (A / GOMPERTZ_B) * (Math.exp(GOMPERTZ_B * (a + 1)) - Math.exp(GOMPERTZ_B * a));
  return Math.min(1, 1 - Math.exp(-integral));
}

/** Espérance de vie à la naissance implicite pour un paramètre A donné. */
function lifeExpectancy(A: number): number {
  let survivors = 1;
  let e = 0;
  for (let a = 0; a < MAX_AGE; a++) {
    const q = annualQ(a, A);
    const next = survivors * (1 - q);
    e += (survivors + next) / 2;
    survivors = next;
  }
  return e;
}

function calibrate(target: number): number {
  let lo = 1e-8;
  let hi = 1e-2;
  for (let i = 0; i < 80; i++) {
    const mid = Math.sqrt(lo * hi);
    if (lifeExpectancy(mid) > target) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

const CALIBRATED_A: Record<Sex, number> = {
  F: calibrate(LIFE_EXPECTANCY_2025.F),
  M: calibrate(LIFE_EXPECTANCY_2025.M),
};

export function modelLifeExpectancy(sex: Sex): number {
  return lifeExpectancy(CALIBRATED_A[sex]);
}

/**
 * Santé de jeu « attendue » à un âge donné, mesurée sur des vies simulées avec
 * les règles d'évolution de la santé (healthDrift). Sert à recentrer le multiplicateur : un personnage en
 * santé moyenne pour son âge garde le risque calibré.
 */
export function expectedHealth(age: number): number {
  // Ajusté sur la santé moyenne observée dans 300 vies simulées (voir tests).
  if (age < 50) return 85 - Math.max(0, age - 18) * 0.5;
  return Math.max(5, 69 - (age - 50));
}

/**
 * Multiplicateur de risque lié à l'indicateur de santé du jeu.
 * RÈGLE DE GAMEPLAY non calibrée : une santé inférieure à celle attendue pour
 * l'âge augmente le risque, une santé meilleure le réduit (borné de ×0,6 à ×2).
 * Ce n'est pas un effet médical estimé.
 */
export function healthMultiplier(physical: number, age = 40): number {
  const m = Math.exp((expectedHealth(age) - physical) / 30);
  return Math.min(2, Math.max(0.6, m));
}

/** Probabilité de décès dans l'année qui suit l'âge `age`. */
export function deathProbability(age: number, sex: Sex, physical: number): number {
  if (age >= MAX_AGE) return 1;
  const base = annualQ(age, CALIBRATED_A[sex]);
  return Math.min(1, base * healthMultiplier(physical, age));
}

export const MORTALITY_PARAMETERS: StatisticalParameter[] = [
  {
    id: 'param-mortalite',
    label: 'Modèle de mortalité calibré sur l\'espérance de vie 2025',
    value: LIFE_EXPECTANCY_2025.F,
    unit: 'ans (femmes ; 80,3 pour les hommes)',
    validity: "Mortalité du moment 2025 appliquée à toute la vie d'une personne née en 2026 (hypothèse forte)",
    status: 'modele',
    sourceIds: ['insee-esperance-vie-2025'],
    method: `Gompertz-Makeham, pente B = ${GOMPERTZ_B} et terme M = ${MAKEHAM_M} supposés, mortalité de la première année ${INFANT_Q} (démonstration), paramètre A calibré par dichotomie pour retrouver l'espérance de vie observée. La santé de jeu, comparée à la santé attendue pour l'âge, multiplie le risque (×0,6 à ×2, règle de gameplay).`,
    usedBy: ['mortalite', 'bilan'],
  },
];

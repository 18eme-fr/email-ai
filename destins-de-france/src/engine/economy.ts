import { getJob, SMIC_NET_2026 } from '../data/jobs';
import type { HousingTenure, SimulationRun, StatisticalParameter, TerritoryType } from './types';

/**
 * Moteur économique personnel.
 *
 * Tous les montants sont en EUROS 2026 CONSTANTS : le jeu ne prévoit pas
 * l'inflation future, il raisonne à pouvoir d'achat de 2026. Les loyers, coûts
 * de la vie, allocations et pensions sont des PARAMÈTRES DE DÉMONSTRATION : les
 * prestations réelles (allocations logement, RSA, assurance chômage, retraites)
 * ont des règles précises qui ne sont pas encore modélisées. Le jeu les affiche
 * donc comme « estimations de jeu ».
 */

const RENT: Record<TerritoryType, Record<HousingTenure, number>> = {
  metropole: { locataire_prive: 950, locataire_social: 460, proprietaire: 780, heberge: 0, precaire: 250 },
  ville_moyenne: { locataire_prive: 650, locataire_social: 390, proprietaire: 560, heberge: 0, precaire: 200 },
  petite_ville: { locataire_prive: 560, locataire_social: 360, proprietaire: 470, heberge: 0, precaire: 180 },
  rural: { locataire_prive: 520, locataire_social: 340, proprietaire: 420, heberge: 0, precaire: 160 },
};

/** Surcoût de mobilité : en zone peu dense, la voiture est souvent indispensable (démonstration). */
const TRANSPORT: Record<TerritoryType, number> = { metropole: 75, ville_moyenne: 140, petite_ville: 220, rural: 290 };

const BASE_LIVING = 720;
const PER_CHILD = 260;

/** Années dans l'emploi actuel. */
function yearsInJob(run: SimulationRun): number {
  return run.employment.since === undefined ? 0 : Math.max(0, run.age - run.employment.since);
}

/** Salaire net mensuel d'un emploi (démonstration), en euros 2026. */
export function jobIncome(jobId: string, years: number): number {
  const job = getJob(jobId);
  if (!job) return SMIC_NET_2026;
  const progress = Math.min(1, years / 25);
  return Math.round(SMIC_NET_2026 * (job.startMultiple + (job.peakMultiple - job.startMultiple) * progress));
}

export function childrenAtHome(run: SimulationRun): number {
  return run.people.filter((p) => p.kind === 'enfant' && p.alive && run.year - p.bornYear < 20).length;
}

/** Revenu mensuel du personnage selon sa situation. */
export function computeIncome(run: SimulationRun): number {
  const e = run.employment;
  switch (e.status) {
    case 'enfant':
      return 0;
    case 'etudiant': {
      // Aide familiale (démonstration) + éventuel job étudiant.
      const family = Math.round(150 + 650 * run.household.percentile);
      const job = run.flags.job_etudiant !== undefined ? 520 : 0;
      const grant = run.flags.bourse !== undefined ? 300 : 0;
      return family + job + grant;
    }
    case 'emploi':
    case 'independant': {
      // Le revenu d'un ou d'une partenaire n'est pas modélisé en v0.1.
      return e.jobId ? jobIncome(e.jobId, yearsInJob(run)) : SMIC_NET_2026;
    }
    case 'chomage': {
      const last = run.flags.chomage_long !== undefined ? 0.45 : 0.6;
      const ref = run.finances.monthlyIncome > 0 ? run.finances.monthlyIncome : SMIC_NET_2026;
      return Math.round(Math.max(SMIC_NET_2026 * 0.42, ref * last));
    }
    case 'inactif':
      return Math.round(SMIC_NET_2026 * 0.42);
    case 'retraite': {
      return run.finances.pension ?? Math.round(SMIC_NET_2026 * 0.9);
    }
  }
}

export function computeExpenses(run: SimulationRun): number {
  if (run.employment.status === 'enfant') return 0;
  if (run.housing.withParents) return 180 + (run.flags.etudes_loin !== undefined ? 0 : 60);
  const rent = RENT[run.housing.territory][run.housing.tenure];
  // Prêt immobilier supposé remboursé après 25 ans de propriété (démonstration).
  const ownedSince = run.flags.proprietaire;
  const housing = run.housing.tenure === 'proprietaire' && ownedSince !== undefined && run.age - ownedSince > 25 ? 140 : rent;
  const studentRent = run.employment.status === 'etudiant' && run.flags.residence_crous !== undefined ? Math.round(rent * 0.5) : housing;
  return BASE_LIVING + studentRent + TRANSPORT[run.housing.territory] + PER_CHILD * childrenAtHome(run);
}

export interface EconomyYear {
  income: number;
  expenses: number;
  /** Dépenses effectivement réalisées après restrictions. */
  spent: number;
  shortfall: number;
}

/**
 * Bilan annuel. Une seule écriture comptable par an :
 *   épargne(t+1) = épargne(t) + 12 × (revenu − dépenses réalisées)
 * Quand le revenu ne couvre pas les dépenses, le personnage se restreint :
 * seule une partie de l'écart devient de la dette, le reste est une privation
 * (qui pèse sur le bien-être). Règle de gameplay, non calibrée.
 */
export function economyYear(run: SimulationRun): EconomyYear {
  const income = computeIncome(run);
  const expenses = computeExpenses(run);
  if (expenses <= income) return { income, expenses, spent: expenses, shortfall: 0 };
  const gap = expenses - income;
  const cushion = run.finances.savings > 0 ? Math.min(gap, run.finances.savings / 12) : 0;
  const spent = income + cushion + (gap - cushion) * 0.25;
  return { income, expenses, spent: Math.round(spent), shortfall: Math.round(gap - cushion) };
}

export const ECONOMY_PARAMETERS: StatisticalParameter[] = [
  {
    id: 'param-salaires',
    label: 'Salaires par métier (multiples du Smic net)',
    value: SMIC_NET_2026,
    unit: '€ net/mois (Smic, estimation)',
    validity: 'Euros 2026 constants',
    status: 'demonstration',
    sourceIds: ['smic-2026'],
    method:
      "Le Smic net estimé sert d'étalon (source vérifiée). Les multiples par métier et la progression sur 25 ans sont des paramètres de démonstration. Les écarts de salaire entre femmes et hommes, documentés par l'Insee, ne sont pas encore modélisés.",
    usedBy: ['economie', 'emploi'],
  },
  {
    id: 'param-depenses',
    label: 'Loyers, coût de la vie et transports',
    value: BASE_LIVING,
    unit: '€/mois (base)',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method: "Montants provisoires selon le statut d'occupation et le type de territoire. Calibrage prévu avec les enquêtes Logement et Budget de famille de l'Insee.",
    usedBy: ['economie', 'logement'],
  },
  {
    id: 'param-revenus-remplacement',
    label: 'Allocations chômage, minima sociaux et pensions',
    value: 0.6,
    unit: 'taux de remplacement supposé',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method:
      "Le jeu n'applique PAS les règles réelles de l'assurance chômage, du RSA ou des retraites (conditions et montants non vérifiés dans cette version). Il utilise des taux de remplacement fictifs, signalés comme estimations.",
    usedBy: ['economie', 'emploi', 'retraite'],
  },
];

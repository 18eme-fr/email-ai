import { clamp } from '../../engine/narrative';
import type { EventConsequence } from '../../engine/narrative-types';
import { Rng, seedFromString } from '../../engine/rng';
import type { Relationship, SimulationRun } from '../../engine/types';
import { canHoldJob, educationRank, JOBS, type JobDefinition } from '../jobs';
import { standardOfLivingAt } from '../../engine/demography';

/** Utilitaires partagés par les fiches d'événements (lecture seule sur l'état). */

export const g = (run: SimulationRun, m: string, f: string) => (run.citizen.sex === 'F' ? f : m);

export function livingPerson(run: SimulationRun, kind: Relationship['kind']): Relationship | undefined {
  return run.people.find((p) => p.kind === kind && p.alive);
}

export function personAge(run: SimulationRun, p: Relationship): number {
  return run.year - p.bornYear;
}

/** Emplois accessibles avec le diplôme et les qualifications du personnage. */
export function accessibleJobs(run: SimulationRun, exclude: string[] = []): JobDefinition[] {
  return JOBS.filter((j) => canHoldJob(j, run.education.level, run.flags) && !exclude.includes(j.id));
}

/** Choisit un emploi accessible, en privilégiant ceux qui valorisent le diplôme (règle de jeu). */
export function pickJob(run: SimulationRun, rng: Rng, preferQualified = 1.5, exclude = ['createur_entreprise', 'agriculteur']): JobDefinition {
  const options = accessibleJobs(run, exclude);
  return rng.weighted(options, (j) => 1 + educationRank(j.minEducation) * preferQualified);
}

/** Probabilité bornée. */
export const p = (x: number, min = 0.05, max = 0.95) => Math.min(max, Math.max(min, x));

/** Chances de réussite d'une formation : RÈGLE DE DÉMONSTRATION non calibrée. */
export function studySuccess(run: SimulationRun, base: number): number {
  const c = run.education.conditions;
  return p(base + (c - 50) * 0.006 - (run.flags.job_etudiant !== undefined ? 0.07 : 0) + (run.health.wellbeing - 55) * 0.002);
}

/** Description lisible du niveau de vie du foyer par rapport aux repères Insee 2023. */
export function standardOfLivingText(run: SimulationRun): string {
  const monthly = Math.round(run.household.standardOfLiving / 12 / 10) * 10;
  const pos =
    monthly < 1288
      ? 'sous le seuil de pauvreté monétaire (1 288 € par mois en 2023)'
      : monthly < 2150
        ? 'entre le seuil de pauvreté et le niveau de vie médian (2 150 € par mois en 2023)'
        : monthly < 2150 * 1.6
          ? 'au-dessus du niveau de vie médian'
          : 'nettement au-dessus du niveau de vie médian';
  return `environ ${monthly.toLocaleString('fr-FR')} € par mois et par unité de consommation, ${pos}`;
}

export const medianMonthly = Math.round(standardOfLivingAt(0.5) / 12);

/** Listes municipales fictives déterministes pour une année et un lieu. */
export function municipalLists(run: SimulationRun): { name: string; priorities: string[] }[] {
  const rng = new Rng(seedFromString(`${run.housing.place}-${run.year}-${run.seed}`));
  const prios = [
    'rénover les écoles',
    'stabiliser les impôts locaux',
    'développer les transports en commun',
    'protéger les terres agricoles',
    'construire des logements abordables',
    'renforcer la sécurité de proximité',
    'soutenir les commerces du centre',
    'ouvrir une maison de santé',
    'maîtriser la dette de la commune',
    'végétaliser les rues contre la chaleur',
    'ouvrir des places en crèche',
    'créer des activités pour les jeunes',
  ];
  const names = ['Ensemble', 'Un nouvel élan', 'Agir ici', 'Demain en commun', 'Vivre notre commune', 'Cap citoyen'];
  const n = rng.int(2, 3);
  const out: { name: string; priorities: string[] }[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < n; i++) {
    let name = rng.pick(names);
    while (usedNames.has(name)) name = rng.pick(names);
    usedNames.add(name);
    const set = new Set<string>();
    while (set.size < 2) set.add(rng.pick(prios));
    out.push({ name: `« ${name} »`, priorities: [...set] });
  }
  return out;
}

/** Ajuste les indicateurs pour un effet de bien-être borné (lecture seule, renvoie une conséquence). */
export function mood(delta: number): EventConsequence {
  return { wellbeing: clamp(delta, -20, 20) };
}

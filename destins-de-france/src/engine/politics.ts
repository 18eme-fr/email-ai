import type { Rng } from './rng';

/**
 * Moteur politique (v0.1 : contexte institutionnel et élections hypothétiques).
 *
 * Principe : les institutions sont réelles (compétences et calendrier de 2026),
 * mais tout ce qui se passe après octobre 2026 est un SCÉNARIO PROSPECTIF.
 * Les listes et candidats sont fictifs ; aucun parti réel ne reçoit de résultat
 * ou de déclaration futurs. Aucune orientation n'est favorisée : les étiquettes
 * fictives sont tirées au hasard et décrites par des priorités, pas par une
 * place sur un axe gauche-droite.
 */

/** Niveau institutionnel et compétences (simplifiées) — sert à éviter les absurdités. */
export interface PoliticalContext {
  level: 'commune' | 'departement' | 'region' | 'etat' | 'union_europeenne';
  label: string;
  /** Ce que cet échelon peut décider (formulation prudente). */
  canDecide: string[];
  /** Ce qu'il ne peut PAS décider seul. */
  cannotDecide: string[];
}

export const INSTITUTIONS: PoliticalContext[] = [
  {
    level: 'commune',
    label: 'Conseil municipal',
    canDecide: ['écoles maternelles et élémentaires (bâtiments, cantine)', 'urbanisme local', 'équipements sportifs et culturels', 'voirie communale', 'budget communal'],
    cannotDecide: ['le montant du Smic', 'les programmes scolaires', 'les règles du Code du travail', 'les impôts nationaux'],
  },
  {
    level: 'etat',
    label: 'Parlement et Gouvernement',
    canDecide: ['les lois (vote du Parlement)', 'le budget de l\'État (loi de finances)', 'les règles de la protection sociale'],
    cannotDecide: ['seul, sans majorité parlementaire', 'contre la Constitution (contrôle du Conseil constitutionnel)'],
  },
];

/** Adhésion d'un personnage à une organisation (fictive ou générique). */
export interface PoliticalAffiliation {
  kind: 'association' | 'syndicat' | 'parti' | 'collectif';
  name: string;
  fromYear: number;
  toYear?: number;
  fictional: true;
}

/** Une liste ou un candidat fictif dans une élection simulée. */
export interface ElectionOffer {
  id: string;
  name: string;
  priorities: string[];
  fictional: true;
}

export interface Election {
  kind: 'municipale' | 'presidentielle';
  year: number;
  /** Toujours prospectif après 2026. */
  hypothetical: boolean;
  offers: ElectionOffer[];
}

/** Politique publique fictive simulée (jamais présentée comme une loi réelle). */
export interface PublicPolicy {
  id: string;
  label: string;
  level: PoliticalContext['level'];
  hypothetical: true;
  /** Effets décrits comme incertains. */
  possibleEffects: string[];
}

/** Calendrier de 2026 prolongé (hypothèse : règles inchangées). */
export function isMunicipalYear(year: number): boolean {
  return year > 2026 && (year - 2026) % 6 === 0;
}
export function isPresidentialYear(year: number): boolean {
  return year > 2027 && (year - 2027) % 5 === 0;
}

const PRIORITIES = [
  'rénover les écoles',
  'baisser la pression fiscale locale',
  'développer les transports en commun',
  'protéger les terres agricoles',
  'construire des logements abordables',
  'renforcer la sécurité de proximité',
  'soutenir les commerces du centre',
  'créer une maison de santé',
  'maîtriser la dette de la commune',
  'végétaliser les rues contre la chaleur',
  'ouvrir plus de places en crèche',
  'développer les activités pour les jeunes',
];
const LIST_NAMES = ['Ensemble pour {p}', '{p} Demain', 'Agir à {p}', 'Un nouvel élan pour {p}', '{p} en commun', 'Vivre {p}'];

/** Génère des listes municipales fictives (2 à 3), sans étiquette partisane réelle. */
export function fictionalMunicipalLists(rng: Rng, place: string): ElectionOffer[] {
  const n = rng.int(2, 3);
  const shortPlace = place.replace(/^un (village|hameau|écart) (du |de la |de l'|des |de |d')?/, '').trim() || place;
  const used = new Set<string>();
  const offers: ElectionOffer[] = [];
  for (let i = 0; i < n; i++) {
    let template = rng.pick(LIST_NAMES);
    while (used.has(template)) template = rng.pick(LIST_NAMES);
    used.add(template);
    const prios = new Set<string>();
    while (prios.size < 2) prios.add(rng.pick(PRIORITIES));
    offers.push({ id: `liste-${i}`, name: template.replace('{p}', shortPlace), priorities: [...prios], fictional: true });
  }
  return offers;
}

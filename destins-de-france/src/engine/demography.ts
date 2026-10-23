import { getCity } from '../data/cities';
import { FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES, SIDE_NAMES } from '../data/names';
import { getRegion, NEIGHBOURHOOD_WEIGHTS, REGIONS, TERRITORY_WEIGHTS } from '../data/regions';
import type { Rng } from './rng';
import type {
  Citizen,
  EducationLevel,
  FamilyStructure,
  Household,
  HousingTenure,
  NeighbourhoodType,
  OccupationGroup,
  ParentProfile,
  Sex,
  StatisticalParameter,
  TerritoryType,
} from './types';

/**
 * Moteur démographique : génère les conditions de naissance.
 *
 * Ordre du tirage (les attributs ne sont pas indépendants) :
 *   région → type de territoire → rang de niveau de vie du foyer → quartier
 *   → structure familiale → professions et diplômes des parents → logement.
 */

export const BIRTH_YEAR = 2026;

// --- Modèle de niveau de vie -------------------------------------------------

/** Niveau de vie médian 2023, euros par an et par UC (Insee Première n° 2063). */
export const MEDIAN_STANDARD_OF_LIVING = 25760;
/** Taux de pauvreté monétaire 2023 au seuil de 60 % (Insee Première n° 2063). */
export const POVERTY_RATE = 0.154;

/** Inverse de la fonction de répartition normale (approximation d'Acklam). */
export function inverseNormal(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const q = Math.min(Math.max(p, 1e-9), 1 - 1e-9);
  const pl = 0.02425;
  const [a0, a1, a2, a3, a4, a5] = a as [number, number, number, number, number, number];
  const [b0, b1, b2, b3, b4] = b as [number, number, number, number, number];
  const [c0, c1, c2, c3, c4, c5] = c as [number, number, number, number, number, number];
  const [d0, d1, d2, d3] = d as [number, number, number, number];
  if (q < pl) {
    const r = Math.sqrt(-2 * Math.log(q));
    return (((((c0 * r + c1) * r + c2) * r + c3) * r + c4) * r + c5) / ((((d0 * r + d1) * r + d2) * r + d3) * r + 1);
  }
  if (q > 1 - pl) {
    const r = Math.sqrt(-2 * Math.log(1 - q));
    return -(((((c0 * r + c1) * r + c2) * r + c3) * r + c4) * r + c5) / ((((d0 * r + d1) * r + d2) * r + d3) * r + 1);
  }
  const r = q - 0.5;
  const s = r * r;
  return ((((((a0 * s + a1) * s + a2) * s + a3) * s + a4) * s + a5) * r) / (((((b0 * s + b1) * s + b2) * s + b3) * s + b4) * s + 1);
}

/**
 * Écart-type log de la loi lognormale, déduit des deux indicateurs observés :
 * P(niveau de vie < 0,6 × médiane) = taux de pauvreté.
 * Hypothèse de modèle : la distribution est lognormale (approximation usuelle,
 * imparfaite surtout pour les plus hauts revenus).
 */
export const LOG_SIGMA = Math.log(0.6) / inverseNormal(POVERTY_RATE);

export function standardOfLivingAt(percentile: number): number {
  return MEDIAN_STANDARD_OF_LIVING * Math.exp(LOG_SIGMA * inverseNormal(percentile));
}

// --- Paramètres de démonstration --------------------------------------------

type Weights<K extends string> = Record<K, number>;

/** Professions des parents selon le rang de niveau de vie. DÉMONSTRATION NON VALIDÉE. */
const OCCUPATION_BY_BAND: { upTo: number; weights: Weights<OccupationGroup> }[] = [
  { upTo: 0.2, weights: { sans_emploi: 0.25, employe: 0.3, ouvrier: 0.28, artisan_commercant: 0.06, profession_intermediaire: 0.07, cadre: 0.01, agriculteur: 0.03, retraite: 0 } },
  { upTo: 0.6, weights: { sans_emploi: 0.04, employe: 0.28, ouvrier: 0.24, artisan_commercant: 0.08, profession_intermediaire: 0.25, cadre: 0.08, agriculteur: 0.03, retraite: 0 } },
  { upTo: 0.9, weights: { sans_emploi: 0.01, employe: 0.13, ouvrier: 0.07, artisan_commercant: 0.1, profession_intermediaire: 0.32, cadre: 0.34, agriculteur: 0.03, retraite: 0 } },
  { upTo: 1.01, weights: { sans_emploi: 0, employe: 0.03, ouvrier: 0.01, artisan_commercant: 0.15, profession_intermediaire: 0.14, cadre: 0.65, agriculteur: 0.02, retraite: 0 } },
];

/** Diplôme des parents selon la profession. DÉMONSTRATION NON VALIDÉE. */
const EDUCATION_BY_OCCUPATION: Record<OccupationGroup, Weights<EducationLevel>> = {
  sans_emploi: { aucun: 0.4, cap: 0.3, bac: 0.2, bac3: 0.07, bac5: 0.03, medecine: 0 },
  ouvrier: { aucun: 0.3, cap: 0.45, bac: 0.2, bac3: 0.04, bac5: 0.01, medecine: 0 },
  employe: { aucun: 0.15, cap: 0.35, bac: 0.33, bac3: 0.13, bac5: 0.04, medecine: 0 },
  agriculteur: { aucun: 0.15, cap: 0.35, bac: 0.33, bac3: 0.12, bac5: 0.05, medecine: 0 },
  artisan_commercant: { aucun: 0.12, cap: 0.4, bac: 0.28, bac3: 0.12, bac5: 0.08, medecine: 0 },
  profession_intermediaire: { aucun: 0.03, cap: 0.12, bac: 0.3, bac3: 0.4, bac5: 0.15, medecine: 0 },
  cadre: { aucun: 0.01, cap: 0.03, bac: 0.1, bac3: 0.22, bac5: 0.56, medecine: 0.08 },
  retraite: { aucun: 0.3, cap: 0.3, bac: 0.2, bac3: 0.1, bac5: 0.1, medecine: 0 },
};

const OCCUPATION_LABELS: Record<OccupationGroup, string[]> = {
  agriculteur: ['éleveur·se laitier·ère', 'maraîcher·ère', 'céréalier·ère', 'viticulteur·rice'],
  artisan_commercant: ['boulanger·ère', 'plombier·ère à son compte', 'gérant·e d\'un café', 'coiffeur·se indépendant·e', 'fleuriste'],
  cadre: ['ingénieur·e', 'médecin hospitalier·ère', 'cadre bancaire', 'professeur·e agrégé·e', 'avocat·e', 'cheffe ou chef de projet informatique'],
  profession_intermediaire: ['infirmier·ère', 'professeur·e des écoles', 'technicien·ne de maintenance', 'comptable', 'éducateur·rice', 'conseiller·ère clientèle'],
  employe: ['caissier·ère', 'aide-soignant·e', 'secrétaire médical·e', 'agent·e d\'accueil', 'vendeur·se', 'agent·e administratif·ve'],
  ouvrier: ['cariste', 'ouvrier·ère agroalimentaire', 'maçon·ne', 'conducteur·rice de bus', 'magasinier·ère', 'soudeur·se'],
  sans_emploi: ['en recherche d\'emploi', 'sans emploi, en congé maladie longue durée', 'en formation de reconversion'],
  retraite: ['retraité·e'],
};

const FAMILY_STRUCTURE: Weights<FamilyStructure> = { deux_parents: 0.75, monoparentale: 0.15, recomposee: 0.1 };

export const DEMO_PARAMETERS: StatisticalParameter[] = [
  {
    id: 'param-niveau-de-vie',
    label: 'Distribution des niveaux de vie à la naissance',
    value: MEDIAN_STANDARD_OF_LIVING,
    unit: '€/an/UC (médiane)',
    validity: 'France métropolitaine, revenus 2023, appliquée faute de mieux à toute la France en 2026',
    status: 'modele',
    sourceIds: ['insee-pauvrete-2023'],
    method: `Loi lognormale de médiane 25 760 € dont l'écart-type logarithmique (${LOG_SIGMA.toFixed(3)}) est choisi pour que 15,4 % des personnes soient sous le seuil de 60 % de la médiane. Le rang du foyer est tiré uniformément. Limite : la distribution des familles avec nouveau-né diffère de celle de l'ensemble de la population.`,
    usedBy: ['demographie', 'naissance'],
  },
  {
    id: 'param-regions',
    label: 'Poids de naissance des régions (hors Île-de-France et La Réunion)',
    value: 0,
    unit: 'naissances (ordres de grandeur)',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method: "Ordres de grandeur provisoires répartissant le total national. À remplacer par le fichier Insee des naissances 2025 par région.",
    usedBy: ['demographie'],
  },
  {
    id: 'param-territoires',
    label: 'Types de territoire et de quartier à la naissance',
    value: 0,
    unit: 'proportions',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method: "Proportions provisoires. Calibrage prévu avec la grille communale de densité de l'Insee.",
    usedBy: ['demographie'],
  },
  {
    id: 'param-professions-parents',
    label: 'Professions et diplômes des parents selon le niveau de vie',
    value: 0,
    unit: 'proportions',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method:
      "Le lien qualitatif entre catégorie socioprofessionnelle, diplôme et revenu est établi par la statistique publique, mais son intensité n'est PAS calibrée ici. Tables provisoires.",
    usedBy: ['demographie'],
  },
  {
    id: 'param-famille',
    label: 'Structure familiale et fratrie',
    value: 0,
    unit: 'proportions',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method: "Proportions provisoires (deux parents, monoparentale, recomposée). Calibrage prévu avec l'enquête Famille de l'Insee.",
    usedBy: ['demographie'],
  },
  {
    id: 'param-sexe',
    label: 'Sexe à la naissance',
    value: 0.5,
    unit: 'probabilité (fille)',
    validity: 'Prototype uniquement',
    status: 'demonstration',
    sourceIds: [],
    method: "Équiprobabilité simplificatrice. Le rapport de masculinité à la naissance observé (légèrement supérieur à 1) reste à intégrer depuis l'état civil.",
    usedBy: ['demographie', 'mortalite'],
  },
];

// --- Tirage -------------------------------------------------------------------

function pickWeighted<K extends string>(rng: Rng, weights: Weights<K>): K {
  const keys = Object.keys(weights) as K[];
  return rng.weighted(keys, (k) => weights[k]);
}

function neutralLabel(label: string, sex: Sex): string {
  // « infirmier·ère » → forme accordée.
  return label.replace(/(\p{L}+)·(\p{L}+)(·?\p{L}*)/gu, (_m, base: string, fem: string) => {
    if (sex === 'M') return base;
    if (base.endsWith('er') && fem.startsWith('ère')) return base.slice(0, -2) + fem;
    if (base.endsWith('eur') && (fem === 'se' || fem === 'euse')) return base.slice(0, -3) + 'euse';
    if (base.endsWith('teur') && fem === 'rice') return base.slice(0, -3) + 'rice';
    if (base.endsWith('if') && fem === 've') return base.slice(0, -1) + 've';
    if (fem === 'e') return base + 'e';
    return base + fem;
  });
}

export interface BirthDraw {
  citizen: Citizen;
  household: Household;
  parents: { key: string; name: string; sex: Sex; ageOffset: number }[];
  siblings: { key: string; name: string; ageOffset: number }[];
}

/**
 * @param cityId Mode « Villes » : le lieu est imposé (grande ville choisie) ;
 *   tout le reste du tirage est inchangé.
 */
export function drawBirth(rng: Rng, cityId?: string): BirthDraw {
  const city = cityId ? getCity(cityId) : undefined;
  const region = city ? getRegion(city.regionId) : rng.weighted(REGIONS, (r) => r.birthWeight);
  const territory: TerritoryType = city ? 'metropole' : pickWeighted<TerritoryType>(rng, TERRITORY_WEIGHTS);
  // Le rang est tiré uniformément : la distribution des niveaux de vie reste celle du modèle calibré.
  const percentile = Math.min(0.995, Math.max(0.005, rng.next()));
  // Quartier conditionnel au rang (règle de cohérence de DÉMONSTRATION, non calibrée).
  const nw = NEIGHBOURHOOD_WEIGHTS[territory];
  const neighbourhood = pickWeighted<NeighbourhoodType>(rng, {
    favorise: nw.favorise * (0.2 + 2.2 * percentile * percentile),
    mixte: nw.mixte,
    populaire: nw.populaire * (1.8 - 1.6 * percentile),
  });
  const place = city ? city.place : rng.pick(region.places[territory]);

  const sex: Sex = rng.chance(0.5) ? 'F' : 'M';
  const citizen: Citizen = {
    firstName: rng.pick(sex === 'F' ? FIRST_NAMES_F : FIRST_NAMES_M),
    lastName: rng.pick(LAST_NAMES),
    sex,
    birthYear: BIRTH_YEAR,
    birthPlace: place,
    regionId: region.id,
    territory,
    neighbourhood,
    nationality: 'francaise',
    ...(city ? { cityId: city.id } : {}),
    portraitHue: rng.int(0, 359),
  };

  const structure = pickWeighted(rng, FAMILY_STRUCTURE);
  const band = OCCUPATION_BY_BAND.find((b) => percentile < b.upTo) ?? OCCUPATION_BY_BAND[OCCUPATION_BY_BAND.length - 1]!;
  const parentCount = structure === 'monoparentale' ? 1 : 2;
  const parents: ParentProfile[] = [];
  const parentPeople: BirthDraw['parents'] = [];
  const usedNames = new Set<string>();
  const sideName = () => {
    let n = rng.pick(SIDE_NAMES);
    for (let i = 0; i < 5 && usedNames.has(n); i++) n = rng.pick(SIDE_NAMES);
    usedNames.add(n);
    return n;
  };
  for (let i = 0; i < parentCount; i++) {
    const weights = { ...band.weights };
    if (territory === 'rural') weights.agriculteur *= 4;
    // Un second parent sans emploi est moins fréquent dans les tables de démonstration.
    if (i === 1) weights.sans_emploi *= 0.5;
    const occupation = pickWeighted(rng, weights);
    const parentSex: Sex = rng.chance(0.5) ? 'F' : 'M';
    const education = pickWeighted(rng, EDUCATION_BY_OCCUPATION[occupation]);
    const label = neutralLabel(rng.pick(OCCUPATION_LABELS[occupation]), parentSex);
    const key = `parent${i + 1}`;
    parents.push({ personId: key, occupation, occupationLabel: label, education, employed: occupation !== 'sans_emploi' });
    parentPeople.push({ key, name: sideName(), sex: parentSex, ageOffset: rng.int(22, 42) });
  }

  const siblingsCount = rng.weighted([0, 1, 2, 3], (n) => [0.4, 0.37, 0.17, 0.06][n] ?? 0);
  const siblings: BirthDraw['siblings'] = [];
  for (let i = 0; i < siblingsCount; i++) {
    siblings.push({ key: `fratrie${i + 1}`, name: sideName(), ageOffset: rng.int(1, 9) });
  }

  let tenure: HousingTenure;
  const r = rng.next();
  if (percentile < 0.25) tenure = r < 0.45 ? 'locataire_social' : r < 0.85 ? 'locataire_prive' : r < 0.95 ? 'heberge' : 'precaire';
  else if (percentile < 0.6) tenure = r < 0.25 ? 'locataire_social' : r < 0.6 ? 'locataire_prive' : 'proprietaire';
  else tenure = r < 0.08 ? 'locataire_social' : r < 0.35 ? 'locataire_prive' : 'proprietaire';
  if (territory === 'rural' && tenure === 'locataire_social' && rng.chance(0.5)) tenure = 'locataire_prive';

  const supportNetwork = Math.round(Math.min(90, Math.max(15, 55 + rng.normal() * 15 + (parentCount === 2 ? 5 : -5))));

  const household: Household = {
    structure,
    parents,
    siblings: siblingsCount,
    standardOfLiving: Math.round(standardOfLivingAt(percentile) / 10) * 10,
    percentile,
    tenure,
    supportNetwork,
  };

  return { citizen, household, parents: parentPeople, siblings };
}

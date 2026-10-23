import type { Rng } from './rng';
import type {
  EducationLevel,
  EpistemicStatus,
  HousingTenure,
  JobStatus,
  LifeDomain,
  RelationKind,
  SimulationRun,
} from './types';

/**
 * Fiches d'événements narratifs.
 *
 * Ajouter un événement = ajouter un objet `NarrativeEvent` dans un fichier de
 * `src/data/events/` et l'enregistrer dans `src/data/events/index.ts`.
 * Le moteur (`narrative.ts`) se charge de l'éligibilité, du tirage, de
 * l'application des conséquences et de la journalisation.
 */

/** Conditions déclaratives d'apparition (toutes doivent être vraies). */
export interface EventConditions {
  minAge?: number;
  maxAge?: number;
  /** Tous ces drapeaux doivent être posés. */
  flags?: string[];
  /** Aucun de ces drapeaux ne doit être posé. */
  notFlags?: string[];
  /** Au moins un de ces drapeaux doit être posé. */
  anyFlags?: string[];
  jobStatus?: JobStatus[];
  minEducation?: EducationLevel;
  /** Condition supplémentaire arbitraire (lecture seule). */
  when?: (run: SimulationRun) => boolean;
}

/** Ajout d'un personnage secondaire persistant. */
export interface NewPerson {
  /** Clé de référence narrative, ex. « meilleur_ami ». Une seule personne par clé. */
  key: string;
  kind: RelationKind;
  closeness: number;
  /** Écart d'âge par rapport au personnage principal (négatif = plus jeune). */
  ageOffset?: number;
  note?: string;
}

/**
 * Conséquences d'un choix ou d'un événement. Les nombres sont des variations
 * (deltas). Les échelles 0-100 sont des indicateurs de jeu, bornés par le moteur.
 */
export interface EventConsequence {
  savings?: number;
  debt?: number;
  /** Ajustement ponctuel : revenus et dépenses sont recalculés chaque année par le moteur économique. */
  monthlyIncome?: number;
  monthlyExpenses?: number;
  /** Pension mensuelle fixée au départ en retraite (estimation de jeu). */
  pension?: number;
  physical?: number;
  wellbeing?: number;
  social?: number;
  engagement?: number;
  studyConditions?: number;
  setFlags?: string[];
  clearFlags?: string[];
  education?: Partial<{
    status: SimulationRun['education']['status'];
    level: EducationLevel;
    track: 'generale' | 'professionnelle' | 'apprentissage';
    field: string;
    expectedEndAge: number;
    milestone: string;
  }>;
  /** Changement d'emploi : `jobId` doit exister dans le catalogue (`data/jobs.ts`). */
  job?: { jobId: string } | { status: JobStatus };
  housing?: Partial<{ tenure: HousingTenure; place: string; withParents: boolean; moveToMetropole: boolean }>;
  addPerson?: NewPerson[];
  /** Variation de proximité d'une personne identifiée par sa clé. */
  closeness?: Record<string, number>;
  /** La personne de cette clé décède (événement sobre). */
  personDies?: string;
  membership?: string;
  leaveMembership?: string;
  mandate?: { label: string; years: number };
  vote?: 'vote' | 'blanc' | 'abstention';
  /** Événements à déclencher plus tard (conséquences différées). */
  schedule?: { eventId: string; inYears: number }[];
  /** Phrase ajoutée au journal après le choix. */
  outcome?: string;
}

/** Contexte passé aux fonctions de texte et de résolution. */
export interface NarrativeContext {
  run: SimulationRun;
  /** Prénom d'une personne secondaire par clé (ou clé générique « $parent », « $fratrie »...), ou repli. */
  name: (key: string, fallback?: string) => string;
  /** Accord simple : g('né', 'née'). */
  g: (masc: string, fem: string) => string;
  place: string;
}

export type TextFn = string | ((ctx: NarrativeContext) => string);

export interface EventChoice {
  id: string;
  label: TextFn;
  /** Indication facultative sur ce que le choix implique (sans révéler l'issue). */
  hint?: TextFn;
  /** Le choix n'est proposé que si cette condition est vraie. */
  available?: (run: SimulationRun) => boolean;
  /** Conséquences fixes. */
  effects?: EventConsequence;
  /**
   * Conséquences probabilistes ou conditionnelles. Le hasard passe
   * obligatoirement par `rng` (jamais Math.random) pour rester reproductible.
   */
  resolve?: (ctx: NarrativeContext, rng: Rng) => EventConsequence;
  /** Poids utilisé par le mode automatique (défaut 1). */
  autoWeight?: (run: SimulationRun) => number;
}

export interface NarrativeEvent {
  id: string;
  title: TextFn;
  domain: LifeDomain;
  /** Statut documentaire de la scène (souvent « fictif » ou « prospectif »). */
  status: EpistemicStatus;
  conditions: EventConditions;
  /**
   * « jalon » : déclenché dès que les conditions sont réunies (étapes de vie).
   * « aleatoire » : tiré au sort parmi les événements éligibles, selon `weight`.
   */
  kind: 'jalon' | 'aleatoire' | 'programme';
  /** Poids relatif pour les événements aléatoires. Paramètre de jeu, non statistique. */
  weight?: number | ((run: SimulationRun) => number);
  /** Nombre maximal d'occurrences (défaut 1). */
  maxOccurrences?: number;
  /** Écart minimal en années entre deux occurrences. */
  cooldown?: number;
  text: TextFn;
  /** Version atténuée du texte (mode atténué) pour les sujets difficiles. */
  softText?: TextFn;
  sensitive?: boolean;
  sourceIds?: string[];
  /** Sans choix : événement de récit, appliqué directement sans interrompre le temps. */
  choices?: EventChoice[];
  /** Effets appliqués à l'apparition (événements de récit ou contexte). */
  effects?: EventConsequence;
  resolve?: (ctx: NarrativeContext, rng: Rng) => EventConsequence;
  /** Moment marquant à retenir dans les souvenirs. */
  memorable?: boolean;
}

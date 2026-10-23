/**
 * Modèle de données de DESTINS DE FRANCE.
 *
 * Règle générale : tout ce qui est stocké dans une partie (SimulationRun) est
 * sérialisable en JSON. Les fonctions (conditions, résolutions) vivent dans les
 * fiches d'événements de `src/data`, jamais dans l'état sauvegardé.
 */

// ---------------------------------------------------------------------------
// Statuts documentaires
// ---------------------------------------------------------------------------

/**
 * Nature épistémique d'une information affichée au joueur.
 * - verifie      : fait historique, juridique ou institutionnel vérifié.
 * - statistique  : donnée statistique observée, publiée par un organisme identifié.
 * - modele       : résultat d'un modèle probabiliste (hypothèses documentées).
 * - prospectif   : scénario futur hypothétique (rien de cela n'a eu lieu).
 * - fictif       : situation individuelle inventée (personnages, dialogues).
 * - demonstration: paramètre provisoire NON VALIDÉ, nécessaire au prototype.
 */
export type EpistemicStatus =
  | 'verifie'
  | 'statistique'
  | 'modele'
  | 'prospectif'
  | 'fictif'
  | 'demonstration';

/** Fiche du registre documentaire (une donnée ou un fait sourcé). */
export interface ScientificSource {
  id: string;
  theme: SourceTheme;
  subject: string;
  indicator: string;
  /** Valeur telle que publiée (texte libre pour garder l'unité et la précision d'origine). */
  value?: string;
  unit?: string;
  geography: string;
  population: string;
  period: string;
  publicationDate: string;
  producer: string;
  documentTitle: string;
  url: string;
  section?: string;
  method: string;
  license: string;
  limits: string;
  /** Explication accessible destinée au joueur. */
  plainExplanation: string;
  controversy?: string;
  lastChecked: string;
  /** Comment la vérification a été faite dans cette version (transparence). */
  verificationNote: string;
  confidence: 'elevee' | 'moyenne' | 'a_confirmer';
  status: EpistemicStatus;
}

export type SourceTheme =
  | 'demographie'
  | 'revenus'
  | 'emploi'
  | 'education'
  | 'droit'
  | 'institutions'
  | 'sante'
  | 'territoires';

/** Paramètre numérique utilisé par le moteur, avec sa traçabilité. */
export interface StatisticalParameter {
  id: string;
  label: string;
  value: number;
  unit: string;
  /** Domaine de validité du paramètre. */
  validity: string;
  status: EpistemicStatus;
  /** Sources mobilisées ; vide pour un paramètre de démonstration. */
  sourceIds: string[];
  /** Méthode de calcul ou justification. */
  method: string;
  /** Événements ou modules qui l'utilisent. */
  usedBy: string[];
}

/** Cadre intellectuel (sociologie, philosophie...) qui guide l'écriture sans fournir de chiffres. */
export interface IntellectualFramework {
  id: string;
  author: string;
  concept: string;
  work: string;
  publication: string;
  year: number;
  useInGame: string;
  limits: string;
}

// ---------------------------------------------------------------------------
// Territoires et foyer
// ---------------------------------------------------------------------------

export type TerritoryType = 'metropole' | 'ville_moyenne' | 'petite_ville' | 'rural';
export type NeighbourhoodType = 'favorise' | 'mixte' | 'populaire';

export interface RegionProfile {
  id: string;
  name: string;
  /** Exemples de lieux (fictifs ou génériques) par type de territoire. */
  places: Record<TerritoryType, string[]>;
  overseas: boolean;
  /** Poids de tirage à la naissance et nature de ce poids. */
  birthWeight: number;
  birthWeightStatus: EpistemicStatus;
  birthWeightSourceId?: string;
  landscape: 'plaine' | 'montagne' | 'littoral' | 'tropical';
}

/** Groupes socioprofessionnels inspirés des PCS de l'Insee (niveau agrégé). */
export type OccupationGroup =
  | 'agriculteur'
  | 'artisan_commercant'
  | 'cadre'
  | 'profession_intermediaire'
  | 'employe'
  | 'ouvrier'
  | 'sans_emploi'
  | 'retraite';

export type EducationLevel = 'aucun' | 'cap' | 'bac' | 'bac3' | 'bac5' | 'medecine';

export interface ParentProfile {
  personId: string;
  occupation: OccupationGroup;
  occupationLabel: string;
  education: EducationLevel;
  employed: boolean;
}

export type FamilyStructure = 'deux_parents' | 'monoparentale' | 'recomposee';
export type HousingTenure = 'locataire_prive' | 'locataire_social' | 'proprietaire' | 'heberge' | 'precaire';

/** Foyer de naissance. */
export interface Household {
  structure: FamilyStructure;
  parents: ParentProfile[];
  siblings: number;
  /**
   * Niveau de vie annuel du foyer en euros 2026 par unité de consommation.
   * Tiré d'un modèle (voir demography.ts) : ce n'est pas une donnée observée individuelle.
   */
  standardOfLiving: number;
  /** Rang (0-1) dans la distribution modélisée des niveaux de vie. */
  percentile: number;
  tenure: HousingTenure;
  /** Ressources sociales du foyer (réseau, entraide) — échelle de jeu 0-100. */
  supportNetwork: number;
}

// ---------------------------------------------------------------------------
// Citoyen et états
// ---------------------------------------------------------------------------

export type Sex = 'F' | 'M';

export interface Citizen {
  firstName: string;
  lastName: string;
  /** Sexe à l'état civil, utilisé seulement pour la table de mortalité et l'accord grammatical. */
  sex: Sex;
  birthYear: number;
  birthPlace: string;
  regionId: string;
  territory: TerritoryType;
  neighbourhood: NeighbourhoodType;
  nationality: 'francaise';
  /** Ville choisie en mode « Villes » (absent en naissance au hasard intégral). */
  cityId?: string;
  /** Teinte de portrait (purement graphique, sans signification sociale). */
  portraitHue: number;
}

export interface FinancialState {
  /** Revenu mensuel net du foyer propre au personnage (euros 2026). */
  monthlyIncome: number;
  /** Dépenses mensuelles courantes (euros 2026). */
  monthlyExpenses: number;
  savings: number;
  debt: number;
  /** Pension mensuelle fixée au départ en retraite (estimation de jeu). */
  pension?: number;
  /** Indique si les montants sont des estimations de jeu (toujours vrai en v0.1). */
  estimated: true;
}

export interface HealthState {
  /** Indicateur de jeu 0-100 : n'est PAS une mesure médicale. */
  physical: number;
  /** Indicateur de jeu 0-100 de bien-être psychologique. */
  wellbeing: number;
  autonomy: 'complete' | 'aide_partielle' | 'dependance';
}

export type StudyStatus = 'non_scolarise' | 'maternelle' | 'elementaire' | 'college' | 'lycee' | 'apprentissage' | 'superieur' | 'termine';

export interface EducationHistory {
  status: StudyStatus;
  level: EducationLevel;
  track?: 'generale' | 'professionnelle' | 'apprentissage';
  field?: string;
  /** Année prévue de fin des études en cours. */
  expectedEndAge?: number;
  /** Conditions d'étude, échelle de jeu 0-100 (ressources, calme, soutien). */
  conditions: number;
  milestones: string[];
}

export type JobStatus = 'enfant' | 'etudiant' | 'emploi' | 'chomage' | 'independant' | 'inactif' | 'retraite';

export interface EmploymentHistory {
  status: JobStatus;
  jobId?: string;
  jobLabel?: string;
  sector?: 'public' | 'prive' | 'independant' | 'associatif';
  since?: number;
  jobs: { age: number; label: string }[];
  unemploymentSpells: number;
}

export interface HousingState {
  tenure: HousingTenure;
  place: string;
  territory: TerritoryType;
  withParents: boolean;
}

export interface CivicState {
  /** Intérêt pour la vie collective, échelle de jeu 0-100. */
  engagement: number;
  memberships: string[];
  votesCast: number;
  abstentions: number;
  mandates: { label: string; fromYear: number; toYear?: number }[];
}

export type RelationKind = 'parent' | 'fratrie' | 'ami' | 'partenaire' | 'enfant' | 'collegue' | 'militant' | 'voisin';

/** Personnage secondaire persistant. */
export interface Relationship {
  id: string;
  name: string;
  kind: RelationKind;
  /** Lien affectif, échelle de jeu 0-100. */
  closeness: number;
  bornYear: number;
  alive: boolean;
  /** Sexe, quand il est utile (mortalité des proches, accords). */
  sex?: Sex;
  note?: string;
}

// ---------------------------------------------------------------------------
// Narration
// ---------------------------------------------------------------------------

export type LifeDomain =
  | 'famille'
  | 'ecole'
  | 'travail'
  | 'logement'
  | 'sante'
  | 'relations'
  | 'citoyennete'
  | 'argent'
  | 'territoire'
  | 'vieillesse';

export interface LifeTimelineEntry {
  id: string;
  age: number;
  year: number;
  title: string;
  text: string;
  domain: LifeDomain;
  status: EpistemicStatus;
  eventId?: string;
  choiceLabel?: string;
  sourceIds: string[];
  /** Moment marquant, repris dans les souvenirs et le bilan. */
  memorable: boolean;
}

export interface ChoiceRecord {
  eventId: string;
  choiceId: string;
  label: string;
  age: number;
  year: number;
  /** Auto-sélectionné par le mode automatique. */
  automatic: boolean;
}

/** Événement en attente de décision (référence + texte déjà rendu pour la stabilité). */
export interface PendingEvent {
  eventId: string;
  title: string;
  text: string;
  status: EpistemicStatus;
  domain: LifeDomain;
  sourceIds: string[];
  choices: { id: string; label: string; hint?: string }[];
  sensitive: boolean;
}

export interface ScheduledEvent {
  eventId: string;
  atAge: number;
}

export interface Settings {
  format: 'rapide' | 'standard' | 'immersif';
  softMode: boolean;
  autoMode: boolean;
}

/** Une partie complète. Entièrement sérialisable. */
export interface SimulationRun {
  engineVersion: string;
  dataVersion: string;
  id: string;
  seed: number;
  rngState: number;
  startedAt: string;
  citizen: Citizen;
  household: Household;
  age: number;
  year: number;
  finances: FinancialState;
  health: HealthState;
  /** Soutien social et qualité des liens, échelle de jeu 0-100. */
  social: number;
  education: EducationHistory;
  employment: EmploymentHistory;
  housing: HousingState;
  civic: CivicState;
  people: Relationship[];
  /** Drapeaux narratifs : nom → âge auquel il a été posé. */
  flags: Record<string, number>;
  /** Nombre de déclenchements par événement. */
  fired: Record<string, number>;
  /** Dernier âge de déclenchement par événement. */
  lastFiredAge: Record<string, number>;
  scheduled: ScheduledEvent[];
  pending: PendingEvent | null;
  timeline: LifeTimelineEntry[];
  choices: ChoiceRecord[];
  residences: string[];
  alive: boolean;
  deathAge?: number;
  deathYear?: number;
  settings: Settings;
  /** Compteur pour des identifiants stables. */
  nextId: number;
}

/** Résumé conservé dans l'historique des vies. */
export interface LifeRecord {
  id: string;
  seed: number;
  name: string;
  sex: Sex;
  birthYear: number;
  deathYear: number;
  deathAge: number;
  birthPlace: string;
  regionName: string;
  territory: TerritoryType;
  originOccupation: string;
  originPercentile: number;
  education: EducationLevel;
  lastJob: string;
  finalSavings: number;
  engagements: string[];
  mandates: number;
  children: number;
  keyMoments: string[];
  dataVersion: string;
  endedAt: string;
}

export interface SaveGame {
  format: 'destins-de-france-save';
  saveVersion: 1;
  engineVersion: string;
  dataVersion: string;
  savedAt: string;
  run: SimulationRun | null;
  lives: LifeRecord[];
  /** Progression du mode « Villes » (facultative pour rester compatible). */
  unlockedCities?: string[];
}

import type { EducationLevel } from '../engine/types';

/**
 * Catalogue des emplois de la v0.1.
 *
 * Les salaires sont exprimés en multiples du Smic net mensuel estimé (≈ 1 443 €
 * au 1er janvier 2026, voir fiche « smic-2026 »). Les multiples eux-mêmes sont
 * des PARAMÈTRES DE DÉMONSTRATION NON VALIDÉS : ils donnent des ordres de
 * grandeur cohérents pour le jeu, pas des salaires moyens observés. Leur
 * remplacement par les données de l'Insee (base Tous salariés) ou de la DARES
 * est prévu en phase 3.
 */
export interface JobDefinition {
  id: string;
  label: { m: string; f: string };
  minEducation: EducationLevel;
  /** Profession réglementée : diplôme ou concours spécifique obligatoire. */
  regulated?: string;
  sector: 'public' | 'prive' | 'independant' | 'associatif';
  /** Multiple du Smic net en début de carrière (démonstration). */
  startMultiple: number;
  /** Progression maximale atteignable en fin de carrière (démonstration). */
  peakMultiple: number;
  /** Pénibilité physique, échelle de jeu 0-3. */
  strain: number;
  /** Drapeau requis (ex. parcours spécifique) en plus du diplôme. */
  requiresFlag?: string;
}

export const SMIC_NET_2026 = 1443;

export const JOBS: JobDefinition[] = [
  { id: 'employe_commerce', label: { m: 'employé de commerce', f: 'employée de commerce' }, minEducation: 'aucun', sector: 'prive', startMultiple: 1.0, peakMultiple: 1.3, strain: 1 },
  { id: 'agent_entretien', label: { m: "agent d'entretien", f: "agente d'entretien" }, minEducation: 'aucun', sector: 'prive', startMultiple: 1.0, peakMultiple: 1.15, strain: 2 },
  { id: 'livreur', label: { m: 'livreur', f: 'livreuse' }, minEducation: 'aucun', sector: 'independant', startMultiple: 0.9, peakMultiple: 1.2, strain: 2 },
  { id: 'aide_domicile', label: { m: 'aide à domicile', f: 'aide à domicile' }, minEducation: 'aucun', sector: 'associatif', startMultiple: 0.95, peakMultiple: 1.2, strain: 2 },
  { id: 'ouvrier_batiment', label: { m: 'ouvrier du bâtiment', f: 'ouvrière du bâtiment' }, minEducation: 'cap', sector: 'prive', startMultiple: 1.1, peakMultiple: 1.6, strain: 3 },
  { id: 'electricien', label: { m: 'électricien', f: 'électricienne' }, minEducation: 'cap', sector: 'prive', startMultiple: 1.15, peakMultiple: 1.8, strain: 2 },
  { id: 'cuisinier', label: { m: 'cuisinier', f: 'cuisinière' }, minEducation: 'cap', sector: 'prive', startMultiple: 1.1, peakMultiple: 1.6, strain: 2 },
  { id: 'aide_soignant', label: { m: 'aide-soignant', f: 'aide-soignante' }, minEducation: 'cap', regulated: "Diplôme d'État d'aide-soignant", requiresFlag: 'diplome_aide_soignant', sector: 'public', startMultiple: 1.15, peakMultiple: 1.5, strain: 3 },
  { id: 'agriculteur', label: { m: 'agriculteur', f: 'agricultrice' }, minEducation: 'cap', sector: 'independant', startMultiple: 0.9, peakMultiple: 1.8, strain: 3, requiresFlag: 'installation_agricole' },
  { id: 'technicien', label: { m: 'technicien', f: 'technicienne' }, minEducation: 'bac', sector: 'prive', startMultiple: 1.3, peakMultiple: 2.0, strain: 1 },
  { id: 'secretaire_admin', label: { m: 'secrétaire administratif', f: 'secrétaire administrative' }, minEducation: 'bac', sector: 'public', startMultiple: 1.2, peakMultiple: 1.7, strain: 0 },
  { id: 'commercial', label: { m: 'commercial', f: 'commerciale' }, minEducation: 'bac', sector: 'prive', startMultiple: 1.3, peakMultiple: 2.4, strain: 1 },
  { id: 'infirmier', label: { m: 'infirmier', f: 'infirmière' }, minEducation: 'bac3', regulated: "Diplôme d'État d'infirmier", requiresFlag: 'diplome_infirmier', sector: 'public', startMultiple: 1.45, peakMultiple: 2.1, strain: 2 },
  { id: 'educateur', label: { m: 'éducateur spécialisé', f: 'éducatrice spécialisée' }, minEducation: 'bac3', regulated: "Diplôme d'État d'éducateur spécialisé", sector: 'associatif', startMultiple: 1.35, peakMultiple: 1.9, strain: 1 },
  { id: 'enseignant', label: { m: 'professeur des écoles', f: 'professeure des écoles' }, minEducation: 'bac5', regulated: 'Concours de recrutement (CRPE) et master', requiresFlag: 'concours_enseignant', sector: 'public', startMultiple: 1.45, peakMultiple: 2.4, strain: 1 },
  { id: 'ingenieur', label: { m: 'ingénieur', f: 'ingénieure' }, minEducation: 'bac5', sector: 'prive', startMultiple: 2.2, peakMultiple: 3.8, strain: 0 },
  { id: 'cadre_public', label: { m: 'cadre de la fonction publique', f: 'cadre de la fonction publique' }, minEducation: 'bac5', regulated: 'Concours de la fonction publique', requiresFlag: 'concours_fonction_publique', sector: 'public', startMultiple: 1.9, peakMultiple: 3.2, strain: 0 },
  { id: 'chercheur', label: { m: 'chercheur', f: 'chercheuse' }, minEducation: 'bac5', requiresFlag: 'doctorat', sector: 'public', startMultiple: 1.8, peakMultiple: 3.0, strain: 0 },
  { id: 'medecin', label: { m: 'médecin', f: 'médecin' }, minEducation: 'medecine', regulated: 'Diplôme d\'État de docteur en médecine et inscription à l\'Ordre', requiresFlag: 'diplome_medecine', sector: 'independant', startMultiple: 2.8, peakMultiple: 5.0, strain: 1 },
  { id: 'createur_entreprise', label: { m: "créateur d'entreprise", f: "créatrice d'entreprise" }, minEducation: 'aucun', sector: 'independant', startMultiple: 0.7, peakMultiple: 3.0, strain: 1, requiresFlag: 'entreprise_creee' },
];

const EDU_RANK: Record<EducationLevel, number> = { aucun: 0, cap: 1, bac: 2, bac3: 3, bac5: 4, medecine: 5 };

export function educationRank(level: EducationLevel): number {
  return EDU_RANK[level];
}

export function getJob(id: string): JobDefinition | undefined {
  return JOBS.find((j) => j.id === id);
}

/** Vérifie les conditions d'accès (diplôme + qualification réglementée). */
export function canHoldJob(job: JobDefinition, level: EducationLevel, flags: Record<string, number>): boolean {
  if (EDU_RANK[level] < EDU_RANK[job.minEducation]) return false;
  if (job.requiresFlag && flags[job.requiresFlag] === undefined) return false;
  return true;
}

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  aucun: 'Sans diplôme du secondaire',
  cap: 'CAP ou équivalent',
  bac: 'Baccalauréat',
  bac3: 'Licence (bac+3)',
  bac5: 'Master (bac+5)',
  medecine: 'Doctorat de médecine',
};

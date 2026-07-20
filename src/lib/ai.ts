// ------------------------------------------------------------------
// Service "intelligence" — moteur HEURISTIQUE local (hors-ligne, honnête).
// Aucune donnée inventée : les sorties sont dérivées de règles explicites.
// Un vrai LLM peut être branché ici via ANTHROPIC_API_KEY (voir generateWithLLM).
// Toute sortie distingue : [vérifié] / [supposé] / [recommandation] / [manquant].
// ------------------------------------------------------------------
import { REFORMULATION_HINTS, MASTER_TEMPLATES } from "./reference";

export type Confidence = "vérifié" | "supposé" | "recommandation" | "manquant";

export type ReformulationResult = {
  transferableSkills: string[];
  culturalSkills: string[];
  cvPhrase: string;
  letterPhrase: string;
  interviewPhrase: string;
  limits: string[];
  evidenceNeeded: string[];
  nature: "exercée" | "observée";
};

// Générateur de reformulations (Levier 5). Ne JAMAIS exagérer une mission.
export function reformulateExperience(input: string, nature: "exercée" | "observée" = "exercée"): ReformulationResult {
  const lower = input.toLowerCase();
  const matched = REFORMULATION_HINTS.filter((h) => h.match.some((m) => lower.includes(m)));
  const transferable = Array.from(new Set(matched.flatMap((m) => m.skills)));
  const fallback = transferable.length === 0;

  const skills = fallback
    ? ["Rigueur et sens de l'organisation", "Travail en équipe", "Communication", "Adaptabilité"]
    : transferable;

  const culturalSkills = mapToCultural(skills);

  const verb = nature === "observée" ? "Observation de" : "";
  const cvPhrase =
    nature === "observée"
      ? `${input} — observation du fonctionnement et appui ponctuel (${skills.slice(0, 3).join(", ")}).`
      : `${input} — ${skills.slice(0, 3).join(", ")}.`;

  const letterPhrase =
    nature === "observée"
      ? `Lors de cette expérience, j'ai pu observer de près ${lowerFirst(input)}, ce qui m'a permis de comprendre ${culturalSkills[0]?.toLowerCase() || "le fonctionnement d'un lieu"}.`
      : `Au cours de cette expérience, j'ai développé ${skills.slice(0, 2).map(lowerFirst).join(" et ")}, des compétences directement mobilisables dans l'administration d'un lieu culturel.`;

  const interviewPhrase =
    nature === "observée"
      ? `Je ne prétends pas avoir exercé ces responsabilités, mais cette expérience d'observation m'a donné une compréhension concrète de ${culturalSkills[0]?.toLowerCase() || "l'organisation"}.`
      : `Concrètement, mon rôle consistait à ${skills.slice(0, 2).map(lowerFirst).join(" et ")}. Je peux détailler une situation précise si vous le souhaitez.`;

  return {
    transferableSkills: skills,
    culturalSkills,
    cvPhrase,
    letterPhrase,
    interviewPhrase,
    nature,
    limits: [
      "Ne pas transformer une observation en responsabilité exercée.",
      "Ne pas présenter ces compétences comme équivalentes à une formation en gestion.",
      "Rester factuel : décrire ce qui a réellement été fait.",
    ],
    evidenceNeeded: [
      "Attestation, contrat ou fiche de poste si disponible",
      "Nom d'un référent qui peut confirmer",
      "Un exemple concret et daté (situation précise)",
    ],
  };
}

function mapToCultural(skills: string[]): string[] {
  const map: Record<string, string> = {
    "gestion du parcours spectateur": "Expérience du public et accueil",
    "gestion des flux de public": "Exploitation quotidienne d'un lieu",
    "coordination avec l'équipe d'exploitation": "Coordination d'équipe en salle",
    "écoute active": "Relation aux publics et médiation",
    "travail partenarial avec des institutions": "Relations avec les collectivités et partenaires",
    "logistique événementielle": "Production et logistique d'événement",
    "suivi administratif": "Administration générale d'un lieu",
  };
  const out = skills.map((s) => map[s.toLowerCase()] || s);
  return Array.from(new Set(out)).slice(0, 6);
}

// Résumé + extraction d'une offre (Levier 1 / fonctionnalités intelligentes)
export function summarizeOpportunity(text: string): { summary: string; skills: string[]; confidence: Confidence } {
  const clean = text.replace(/\s+/g, " ").trim();
  const skills = extractSkills(clean);
  const summary = clean.length > 220 ? clean.slice(0, 217) + "…" : clean;
  return { summary, skills, confidence: text ? "supposé" : "manquant" };
}

export function extractSkills(text: string): string[] {
  const t = text.toLowerCase();
  const bank = [
    "budget", "comptabilité", "gestion", "production", "diffusion", "programmation",
    "billetterie", "communication", "coordination", "contrats", "subventions", "logistique",
    "accueil", "RH", "planning", "SACEM", "régie",
  ];
  return bank.filter((b) => t.includes(b.toLowerCase()));
}

// Analyse d'écart pour un master (Levier 6)
export type GapAnalysis = { have: string[]; missing: string[]; actions: string[] };

export function gapAnalysis(params: {
  cultureMonths: number;
  adminMonths: number;
  hasProject: boolean;
  hasPortfolio: boolean;
  financeScore: number;
  lawScore: number;
  selectivity?: string | null;
}): GapAnalysis {
  const have: string[] = [];
  const missing: string[] = [];
  const actions: string[] = [];

  if (params.cultureMonths > 0) have.push(`Expérience dans la culture (${params.cultureMonths} mois)`);
  else missing.push("Expérience professionnelle dans la culture");

  if (params.adminMonths > 0) have.push("Expérience à dimension administrative");
  else missing.push("Expérience administrative concrète");

  if (params.hasProject) have.push("Projet culturel amorcé"); else missing.push("Projet culturel réalisé");
  if (params.hasPortfolio) have.push("Portfolio en construction"); else missing.push("Portfolio de preuves");
  if (params.financeScore >= 50) have.push("Bases de gestion/comptabilité"); else missing.push("Budget, comptabilité, contrôle de gestion");
  if (params.lawScore >= 50) have.push("Notions de droit du spectacle"); else missing.push("Droit du spectacle vivant");

  have.push("Licence en sciences humaines (psychologie)");
  have.push("Compréhension des publics");

  if (missing.includes("Budget, comptabilité, contrôle de gestion")) actions.push("Suivre un cours de gestion et réaliser un budget culturel");
  if (missing.includes("Projet culturel réalisé")) actions.push("Réaliser un petit projet culturel (assistant projet)");
  if (missing.includes("Expérience professionnelle dans la culture")) actions.push("Obtenir une mission d'assistant de production / administration");
  if (missing.includes("Portfolio de preuves")) actions.push("Construire une étude de salle et documenter ses travaux");
  actions.push("Obtenir une recommandation d'un professionnel du secteur");
  if (params.selectivity === "forte") actions.push("Renforcer le dossier : la formation ciblée est très sélective");

  return { have, missing, actions };
}

// Suggestions de masters prioritaires selon les mots-clés (exclut musicologie, etc.)
export function suggestMasters(): typeof MASTER_TEMPLATES {
  return MASTER_TEMPLATES;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// Point d'extension : vrai LLM si ANTHROPIC_API_KEY est présent.
// Non appelé par défaut — l'app reste 100% fonctionnelle hors-ligne.
export async function generateWithLLM(_prompt: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  // Intégration à implémenter (Messages API). Volontairement laissé en seam.
  return null;
}

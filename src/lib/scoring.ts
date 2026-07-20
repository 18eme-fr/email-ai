// ------------------------------------------------------------------
// Moteur de scoring (pur, sans I/O). Deux systèmes :
//  1. Score de préparation à l'administration culturelle (9 sous-scores)
//  2. Score de compatibilité d'une opportunité (/100, 12 facteurs)
// Chaque score est EXPLIQUÉ et relié à des preuves concrètes.
// ------------------------------------------------------------------
import { bandFor, SUBSCORES } from "./reference";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ---------- 1. Score de préparation ----------
export type PreparationInput = {
  cultureMonths: number;
  adminMonths: number;
  experiences: { admin?: boolean; nature?: string; kind?: string }[];
  completedCourses: { blockKey: string }[];
  inProgressCourses: number;
  selfAssess: Record<string, number>; // finance, liveArts, law (0-100)
  projects: { stepsDone: number; stepsTotal: number; status: string }[];
  contactsCount: number;
  sourcesCount: number;
  portfolioItems: { status: string }[];
  applications: { status: string }[];
  appliedOpportunities: number;
};

export type Subscore = {
  key: string;
  label: string;
  value: number;
  weight: number;
  band: ReturnType<typeof bandFor>;
  evidence: string[];
  missing: string[];
};

const WEIGHTS: Record<string, number> = {
  cultureExp: 16, adminExp: 12, finance: 12, liveArts: 12, law: 10,
  project: 14, network: 8, portfolio: 8, applications: 8,
};

function coursesInBlock(input: PreparationInput, block: string): number {
  return input.completedCourses.filter((c) => c.blockKey === block).length;
}

const APP_PROGRESS: Record<string, number> = {
  to_study: 10, priority: 25, preparing: 45, sent: 70,
  interview: 85, waitlist: 80, accepted: 100, rejected: 55, followup: 60,
};

export function computePreparation(input: PreparationInput): {
  global: number;
  band: ReturnType<typeof bandFor>;
  subscores: Subscore[];
} {
  const raw: Record<string, { value: number; evidence: string[]; missing: string[] }> = {};

  // Expérience dans la culture
  {
    const months = input.cultureMonths;
    const value = clamp(Math.min(months, 18) * (70 / 18) + (input.appliedOpportunities > 0 ? 20 : 0));
    raw.cultureExp = {
      value,
      evidence: [
        months > 0 ? `${months} mois d'expérience dans la culture recensés` : "Aucune expérience culturelle enregistrée",
        input.appliedOpportunities > 0 ? `${input.appliedOpportunities} candidature(s) sur des offres culturelles` : "Aucune candidature en cours",
      ],
      missing: months < 6 ? ["Viser une première mission/stage de 3 à 6 mois en structure culturelle"] : [],
    };
  }
  // Expérience administrative
  {
    const months = input.adminMonths;
    const adminExpCount = input.experiences.filter((e) => e.admin).length;
    const value = clamp(Math.min(months, 12) * (60 / 12) + adminExpCount * 15);
    raw.adminExp = {
      value,
      evidence: [
        adminExpCount > 0 ? `${adminExpCount} expérience(s) à dimension administrative` : "Peu d'expérience administrative formalisée",
      ],
      missing: value < 50 ? ["Rechercher une mission avec tâches administratives réelles (suivi, budget, contrats)"] : [],
    };
  }
  // Gestion & compta (auto-éval + cours suivis)
  raw.finance = subFromKnowledge(input, "finance", "Gestion / comptabilité", ["budget prévisionnel", "compte de résultat"]);
  // Spectacle vivant
  raw.liveArts = subFromKnowledge(input, "liveArts", "Spectacle vivant", ["production", "diffusion", "exploitation"], input.cultureMonths > 0 ? 10 : 0);
  // Droit
  raw.law = subFromKnowledge(input, "law", "Droit du spectacle vivant", ["contrat de cession", "intermittence", "licences"]);

  // Projet culturel
  {
    const best = input.projects.reduce((acc, p) => {
      const pct = p.stepsTotal > 0 ? (p.stepsDone / p.stepsTotal) * 100 : 0;
      const bonus = p.status === "done" ? 15 : 0;
      return Math.max(acc, clamp(pct * 0.85 + bonus));
    }, 0);
    raw.project = {
      value: best,
      evidence: [
        input.projects.length > 0 ? `${input.projects.length} projet(s), meilleure avancée ${best}%` : "Aucun projet culturel démarré",
      ],
      missing: best < 40 ? ["Avancer l'assistant projet : concept, budget prévisionnel, plan de financement"] : [],
    };
  }
  // Réseau
  {
    const value = clamp(input.contactsCount * 12 + input.sourcesCount * 5);
    raw.network = {
      value,
      evidence: [`${input.contactsCount} contact(s) professionnel(s), ${input.sourcesCount} source(s) suivie(s)`],
      missing: input.contactsCount < 3 ? ["Enregistrer des contacts pros (rencontres, LinkedIn, structures)"] : [],
    };
  }
  // Portfolio
  {
    const acquired = input.portfolioItems.filter((p) => p.status === "acquis").length;
    const value = clamp(input.portfolioItems.length * 9 + acquired * 6);
    raw.portfolio = {
      value,
      evidence: [`${input.portfolioItems.length} élément(s) de portfolio, dont ${acquired} "acquis"`],
      missing: input.portfolioItems.length < 4 ? ["Ajouter au moins une étude de salle et un travail de gestion"] : [],
    };
  }
  // Candidatures
  {
    const value = input.applications.length
      ? clamp(input.applications.reduce((s, a) => s + (APP_PROGRESS[a.status] ?? 10), 0) / input.applications.length)
      : 0;
    raw.applications = {
      value,
      evidence: [input.applications.length ? `${input.applications.length} master(s) suivi(s)` : "Aucun master ciblé"],
      missing: input.applications.length < 3 ? ["Cibler 3 à 6 masters et lancer l'analyse d'écart"] : [],
    };
  }

  const subscores: Subscore[] = SUBSCORES.map((s) => {
    const r = raw[s.key];
    return {
      key: s.key,
      label: s.label,
      value: r.value,
      weight: WEIGHTS[s.key],
      band: bandFor(r.value),
      evidence: r.evidence,
      missing: r.missing,
    };
  });

  const totalWeight = subscores.reduce((s, x) => s + x.weight, 0);
  const global = clamp(subscores.reduce((s, x) => s + x.value * x.weight, 0) / totalWeight);

  return { global, band: bandFor(global), subscores };
}

function subFromKnowledge(
  input: PreparationInput,
  selfKey: string,
  label: string,
  topics: string[],
  bonus = 0
): { value: number; evidence: string[]; missing: string[] } {
  const self = input.selfAssess[selfKey] ?? 0;
  const blockCourses = coursesInBlock(input, selfKey);
  const value = clamp(self * 0.6 + Math.min(blockCourses, 4) * 12 + bonus);
  return {
    value,
    evidence: [
      `Auto-évaluation ${label.toLowerCase()} : ${self}/100`,
      blockCourses > 0 ? `${blockCourses} formation(s) validée(s) sur ce bloc` : "Aucune formation validée sur ce bloc",
    ],
    missing: value < 50 ? [`Étudier : ${topics.slice(0, 2).join(", ")}`] : [],
  };
}

// ---------- 2. Score de compatibilité d'une opportunité ----------
export type OppForScore = {
  structureType: string;
  missionTitle: string;
  adminTasks: string[];
  experienceLevel?: string | null;
  languagesRequired: string[];
  visaRequired?: boolean | null;
  eligibleFrench?: boolean | null;
  duration?: string | null;
  compensation?: string | null;
  housingProvided?: boolean | null;
  country: string;
};

export type ProfileForScore = {
  languages: { label?: string; code?: string; level?: string }[];
  preferredCountries: string[];
  excludedCountries: string[];
  acceptedContracts: string[];
  mobility?: string | null;
  wantsHousing?: boolean;
};

export type CompatResult = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  factors: { label: string; value: number; weight: number }[];
};

const ADMIN_KEYWORDS = ["administration", "admin", "gestion", "budget", "comptab", "finance", "contrat", "rh", "ressources humaines", "coordination", "production", "programmation", "subvention"];
const BUDGET_KEYWORDS = ["budget", "comptab", "finance", "trésorerie", "facturation", "raf"];
const PROD_KEYWORDS = ["production", "diffusion", "exploitation", "régie", "logistique", "tournée"];

function hasAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

function frenchLevelOk(profile: ProfileForScore, required: string[]): { ok: boolean; detail: string } {
  if (required.length === 0) return { ok: true, detail: "Aucune langue spécifique exigée" };
  const owned = profile.languages.map((l) => (l.label || l.code || "").toLowerCase());
  const missing = required.filter(
    (r) => !owned.some((o) => o.includes(r.toLowerCase().split(" ")[0]))
  );
  if (missing.length === 0) return { ok: true, detail: `Langues couvertes (${required.join(", ")})` };
  return { ok: false, detail: `Langue(s) à renforcer : ${missing.join(", ")}` };
}

export function computeCompatibility(opp: OppForScore, profile: ProfileForScore): CompatResult {
  const factors: { label: string; value: number; weight: number; note: string; positive: boolean }[] = [];
  const title = `${opp.missionTitle} ${opp.adminTasks.join(" ")}`;

  const liveArtsStructures = ["salle", "théâtre", "scène", "smac", "opéra", "festival", "compagnie", "diffusion", "production", "musiques"];
  const proximity = hasAny(opp.structureType.toLowerCase() + " " + title, liveArtsStructures) ? 90 : 55;
  factors.push({ label: "Proximité avec l'administration du spectacle vivant", value: proximity, weight: 16, note: proximity > 70 ? "Structure du spectacle vivant" : "Lien indirect avec le spectacle vivant", positive: proximity > 70 });

  const gestion = hasAny(title, ADMIN_KEYWORDS) ? 90 : 40;
  factors.push({ label: "Missions de gestion présentes", value: gestion, weight: 12, note: gestion > 70 ? "Missions administratives / gestion identifiées" : "Peu de missions de gestion visibles", positive: gestion > 70 });

  const budget = hasAny(title, BUDGET_KEYWORDS) ? 88 : 35;
  factors.push({ label: "Missions budgétaires présentes", value: budget, weight: 8, note: budget > 70 ? "Dimension budgétaire/comptable" : "Dimension budgétaire non explicite", positive: budget > 70 });

  const prod = hasAny(title, PROD_KEYWORDS) ? 85 : 45;
  factors.push({ label: "Missions de production présentes", value: prod, weight: 8, note: prod > 70 ? "Missions de production/exploitation" : "Production peu présente", positive: prod > 70 });

  const lvl = (opp.experienceLevel || "").toLowerCase();
  const expScore = /débutant|junior|beginner|aucune|sans exp|entry/.test(lvl) ? 92 : /confirmé|senior|expérimenté|5 ans|3 ans/.test(lvl) ? 40 : 70;
  factors.push({ label: "Niveau d'expérience demandé", value: expScore, weight: 10, note: expScore > 80 ? "Niveau débutant accepté" : expScore < 50 ? "Expérience confirmée demandée" : "Niveau intermédiaire", positive: expScore > 70 });

  const lang = frenchLevelOk(profile, opp.languagesRequired);
  const langScore = lang.ok ? 90 : 45;
  factors.push({ label: "Compatibilité linguistique", value: langScore, weight: 10, note: lang.detail, positive: lang.ok });

  const feasible = opp.visaRequired ? 45 : opp.eligibleFrench === false ? 30 : 90;
  factors.push({ label: "Faisabilité administrative (visa / éligibilité)", value: feasible, weight: 8, note: opp.visaRequired ? "Visa nécessaire" : opp.eligibleFrench === false ? "Éligibilité FR incertaine" : "Éligible sans visa (UE/France)", positive: feasible > 70 });

  const months = durationMonths(opp.duration);
  const durScore = months >= 6 ? 92 : months >= 3 ? 78 : months >= 1 ? 55 : 40;
  factors.push({ label: "Durée", value: durScore, weight: 6, note: months ? `≈ ${months} mois` : "Durée non précisée", positive: durScore > 70 });

  const comp = (opp.compensation || "").toLowerCase();
  const paid = /€|eur|salair|rémun|gratif|indemn|smic|\d/.test(comp) && !/non rémun|bénévole|aucune/.test(comp);
  const compScore = paid ? 85 : /gratification|indemn/.test(comp) ? 65 : 45;
  factors.push({ label: "Rémunération", value: compScore, weight: 6, note: opp.compensation || "Non précisée", positive: compScore > 60 });

  const houseScore = opp.housingProvided ? 90 : profile.wantsHousing ? 45 : 65;
  factors.push({ label: "Possibilité de logement", value: houseScore, weight: 4, note: opp.housingProvided ? "Logement proposé" : "Logement non fourni", positive: !!opp.housingProvided });

  const masterValue = clamp((proximity + gestion + durScore) / 3);
  factors.push({ label: "Valeur pour une candidature en master", value: masterValue, weight: 8, note: masterValue > 70 ? "Expérience valorisable en dossier master" : "Valeur master modérée", positive: masterValue > 70 });

  const excluded = profile.excludedCountries.map((c) => c.toLowerCase()).includes(opp.country.toLowerCase());
  const preferred = profile.preferredCountries.map((c) => c.toLowerCase()).includes(opp.country.toLowerCase());
  const profileMatch = excluded ? 10 : preferred ? 95 : 65;
  factors.push({ label: "Correspondance avec le profil", value: profileMatch, weight: 4, note: excluded ? "Pays exclu du profil" : preferred ? "Pays préféré" : "Pays neutre", positive: profileMatch > 70 });

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score = clamp(factors.reduce((s, f) => s + f.value * f.weight, 0) / totalWeight);

  const strengths = factors.filter((f) => f.positive).sort((a, b) => b.weight - a.weight).slice(0, 4).map((f) => f.note);
  const weaknesses = factors.filter((f) => !f.positive).sort((a, b) => b.weight - a.weight).slice(0, 4).map((f) => f.note);

  return {
    score,
    strengths,
    weaknesses,
    factors: factors.map((f) => ({ label: f.label, value: f.value, weight: f.weight })),
  };
}

export function durationMonths(duration?: string | null): number {
  if (!duration) return 0;
  const d = duration.toLowerCase();
  const num = parseFloat(d.replace(",", "."));
  if (isNaN(num)) return 0;
  if (d.includes("an")) return num * 12;
  if (d.includes("sem")) return Math.round((num / 4) * 10) / 10;
  if (d.includes("jour")) return Math.round((num / 30) * 10) / 10;
  return num; // mois par défaut
}

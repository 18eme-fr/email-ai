import "server-only";
import { prisma } from "./db";
import { parseJson } from "./json";
import { computePreparation, PreparationInput, Subscore } from "./scoring";
import { COURSES, PROJECT_STEPS } from "./reference";

type Experience = { title?: string; org?: string; kind?: string; nature?: string; months?: number; admin?: boolean };
type SkillItem = { name: string; level: string };

export type DashboardData = {
  global: number;
  band: ReturnType<typeof computePreparation>["band"];
  subscores: Subscore[];
  roadmap: { month: number; label: string; focus: string[] }[];
  priorities: { title: string; area: string }[];
  deadlines: { title: string; date: string; kind: string }[];
  recentOpportunities: { id: string; title: string; structure: string; country: string }[];
  inProgressCourses: { key: string; title: string }[];
  acquiredSkills: string[];
  missingSkills: string[];
  projectProgress: { title: string; pct: number } | null;
  portfolioCount: number;
  notificationsUnread: number;
};

const COURSE_BLOCK = new Map(COURSES.map((c) => [c.key, c.blockKey]));

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [profile, saved, projects, courseProgress, applications, portfolio, sources, notifications] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.savedOpportunity.findMany({ where: { userId }, include: { opportunity: true }, orderBy: { createdAt: "desc" } }),
      prisma.project.findMany({ where: { userId } }),
      prisma.courseProgress.findMany({ where: { userId } }),
      prisma.application.findMany({ where: { userId } }),
      prisma.portfolioItem.findMany({ where: { userId } }),
      prisma.source.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

  const experiences = parseJson<Experience[]>(profile?.experiences, []);
  const skills = parseJson<SkillItem[]>(profile?.skills, []);
  const selfAssess = parseJson<Record<string, number>>(profile?.selfAssess, {});

  const cultureMonths = experiences
    .filter((e) => (e.kind || "").toLowerCase().includes("cult") || (e.kind || "").toLowerCase().includes("spect"))
    .reduce((s, e) => s + (e.months || 0), 0);
  const adminMonths = experiences.filter((e) => e.admin).reduce((s, e) => s + (e.months || 0), 0);

  const completedCourses = courseProgress
    .filter((c) => c.status === "done")
    .map((c) => ({ blockKey: COURSE_BLOCK.get(c.courseKey) || "" }));
  const inProgress = courseProgress.filter((c) => c.status === "in_progress");

  const projectInputs = projects.map((p) => {
    const steps = parseJson<Record<string, { done?: boolean }>>(p.steps, {});
    const stepsDone = PROJECT_STEPS.filter((s) => steps[s.key]?.done).length;
    return { stepsDone, stepsTotal: PROJECT_STEPS.length, status: p.status };
  });

  const contactsCount =
    saved.filter((s) => s.contactName).length + applications.filter((a) => a.contactName).length;
  const appliedOpportunities = saved.filter((s) =>
    ["applied", "interview", "accepted", "waitlist"].includes(s.status)
  ).length;

  const input: PreparationInput = {
    cultureMonths,
    adminMonths,
    experiences,
    completedCourses,
    inProgressCourses: inProgress.length,
    selfAssess,
    projects: projectInputs,
    contactsCount,
    sourcesCount: sources,
    portfolioItems: portfolio.map((p) => ({ status: p.status })),
    applications: applications.map((a) => ({ status: a.status })),
    appliedOpportunities,
  };

  const { global, band, subscores } = computePreparation(input);

  // Feuille de route 12 mois — priorise les 3 sous-scores les plus faibles.
  const roadmap = buildRoadmap(subscores);

  // Actions prioritaires de la semaine (issues des "missing" les plus lourds).
  const priorities = subscores
    .filter((s) => s.missing.length > 0)
    .sort((a, b) => a.value * a.weight - b.value * b.weight)
    .slice(0, 4)
    .map((s) => ({ title: s.missing[0], area: s.label }));

  // Échéances à venir (offres, candidatures, relances, notifications datées).
  const deadlines: DashboardData["deadlines"] = [];
  for (const s of saved) {
    if (s.opportunity.deadline) deadlines.push({ title: `Deadline : ${s.opportunity.missionTitle}`, date: s.opportunity.deadline, kind: "opportunité" });
    if (s.followUpDate) deadlines.push({ title: `Relance : ${s.opportunity.structureName}`, date: s.followUpDate, kind: "relance" });
  }
  for (const a of applications) {
    if (a.keyDates) deadlines.push({ title: `${a.programName} (${a.university})`, date: a.keyDates, kind: "candidature" });
  }
  deadlines.sort((x, y) => x.date.localeCompare(y.date));

  const bestProject = projectInputs
    .map((p, i) => ({ pct: Math.round((p.stepsDone / p.stepsTotal) * 100), title: projects[i].title }))
    .sort((a, b) => b.pct - a.pct)[0];

  return {
    global,
    band,
    subscores,
    roadmap,
    priorities,
    deadlines: deadlines.slice(0, 6),
    recentOpportunities: saved.slice(0, 5).map((s) => ({
      id: s.opportunity.id,
      title: s.opportunity.missionTitle,
      structure: s.opportunity.structureName,
      country: s.opportunity.country,
    })),
    inProgressCourses: inProgress.map((c) => ({
      key: c.courseKey,
      title: COURSES.find((x) => x.key === c.courseKey)?.title || c.courseKey,
    })),
    acquiredSkills: skills.filter((s) => s.level === "acquis").map((s) => s.name),
    missingSkills: subscores.filter((s) => s.value < 45).map((s) => s.label),
    projectProgress: bestProject ? { title: bestProject.title, pct: bestProject.pct } : null,
    portfolioCount: portfolio.length,
    notificationsUnread: notifications,
  };
}

function buildRoadmap(subscores: Subscore[]): DashboardData["roadmap"] {
  const weak = [...subscores].sort((a, b) => a.value - b.value);
  const labelFor = (k: string) => subscores.find((s) => s.key === k)?.label || k;
  // Trame 12 mois construite autour des priorités, avec jalons fixes.
  return [
    { month: 1, label: "Fondations", focus: ["Vocabulaire du spectacle vivant", "Bases du budget prévisionnel", `Prioriser : ${weak[0]?.label}`] },
    { month: 2, label: "Découverte", focus: ["Étude d'une salle réelle", "Test de positionnement formations", "Cibler 3-6 masters"] },
    { month: 3, label: "Premier projet", focus: ["Lancer l'assistant projet culturel", "Rétroplanning + budget", `Renforcer : ${weak[1]?.label}`] },
    { month: 4, label: "Recherche active", focus: ["Créer des recherches d'opportunités", "Postuler à 2-3 missions", "Enregistrer des contacts"] },
    { month: 5, label: "Droit & gestion", focus: ["Contrats de cession / coréalisation", "Comptabilité associative", "Analyse d'écart des masters"] },
    { month: 6, label: "Bilan mi-parcours", focus: ["Mettre à jour le portfolio", "Recalculer le score", `Combler : ${labelFor(weak[2]?.key || "")}`] },
    { month: 7, label: "Réalisation projet", focus: ["Organiser l'événement culturel", "Documenter les preuves", "Communication"] },
    { month: 8, label: "Production", focus: ["Feuille de route jour J", "Bilan financier du projet", "Fiche portfolio du projet"] },
    { month: 9, label: "Réseau", focus: ["Rencontres professionnelles", "Demander des recommandations", "Sources & veille"] },
    { month: 10, label: "Dossiers master", focus: ["Rédiger lettres personnalisées", "Rassembler les pièces", "Préparer les entretiens"] },
    { month: 11, label: "Candidatures", focus: ["Envoyer les candidatures", "Programmer les relances", "Comparer les masters"] },
    { month: 12, label: "Consolidation", focus: ["Portfolio complet (PDF)", "Bilan annuel", "Plan B et emplois/stages"] },
  ];
}

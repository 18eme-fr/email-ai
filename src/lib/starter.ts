import "server-only";
import { prisma } from "./db";
import { toJson } from "./json";
import { MASTER_TEMPLATES, PROJECT_STEPS } from "./reference";
import { reformulateExperience, gapAnalysis } from "./ai";

// Initialise le compte d'un nouvel utilisateur avec un profil pré-rempli
// correspondant à la persona (étudiant 22 ans, licence psycho, accueil/billetterie)
// et des données de démonstration clairement identifiées.
export async function seedUserStarter(userId: string): Promise<void> {
  await prisma.profile.update({
    where: { userId },
    data: {
      fullName: "",
      nationality: "Française",
      age: 22,
      countryResidence: "France",
      languages: toJson([
        { code: "fr", label: "Français", level: "Langue maternelle" },
        { code: "en", label: "Anglais", level: "B1" },
        { code: "es", label: "Espagnol", level: "A2" },
      ]),
      degrees: toJson([{ title: "Licence de Psychologie", field: "Sciences humaines et sociales", year: 2025, level: "Bac+3" }]),
      experiences: toJson([
        { title: "Accueil et billetterie", org: "Salle de spectacle", kind: "culture", nature: "exercée", months: 6, admin: false, description: "Accueil du public, billetterie, gestion des flux." },
        { title: "Accompagnement social", org: "Structure institutionnelle", kind: "social", nature: "exercée", months: 8, admin: true, description: "Accompagnement, suivi administratif de dossiers." },
      ]),
      mobility: "Europe",
      durationWish: "3 à 6 mois",
      preferredCountries: toJson(["France", "Espagne", "Portugal", "Belgique"]),
      excludedCountries: toJson([]),
      acceptedContracts: toJson(["Stage", "Alternance", "Service civique", "CDD", "Volontariat"]),
      wantsHousing: true,
      drivingLicense: false,
      professionalProject:
        "Comprendre et maîtriser l'administration d'une salle de spectacle (gestion, budget, production, droit) pour, à terme, en diriger une.",
      skills: toJson([
        { name: "Compréhension des publics", level: "acquis" },
        { name: "Analyse qualitative", level: "acquis" },
        { name: "Accueil / billetterie", level: "acquis" },
        { name: "Budget prévisionnel", level: "objectif" },
        { name: "Droit du spectacle vivant", level: "objectif" },
        { name: "Production", level: "en cours" },
      ]),
      selfAssess: toJson({ finance: 20, liveArts: 35, law: 15, admin: 30 }),
      documents: toJson([
        { name: "CV", type: "cv", ready: true },
        { name: "Lettre de motivation type", type: "letter", ready: false },
      ]),
    },
  });

  // Un projet culturel démarré (assistant à ~14%)
  const steps: Record<string, { done: boolean; notes?: string }> = {};
  PROJECT_STEPS.forEach((s, i) => {
    steps[s.key] = { done: i < 3, notes: "" };
  });
  const project = await prisma.project.create({
    data: {
      userId,
      title: "Soirée musiques actuelles — café-culture",
      type: "concert",
      concept: "Deux groupes locaux, jauge ~120 places, dans un café-culture partenaire.",
      status: "active",
      steps: toJson(steps),
      data: toJson({ objectives: "Programmer, produire et documenter un vrai événement pour le dossier master." }),
    },
  });
  await prisma.budgetLine.createMany({
    data: [
      { projectId: project.id, kind: "expense", category: "Cachets artistiques", label: "2 groupes locaux", amount: 600 },
      { projectId: project.id, kind: "expense", category: "Sonorisation", label: "Location + technicien", amount: 350 },
      { projectId: project.id, kind: "expense", category: "SACEM", label: "Droits", amount: 90 },
      { projectId: project.id, kind: "expense", category: "Communication", label: "Affiches + réseaux", amount: 120 },
      { projectId: project.id, kind: "expense", category: "Imprévus", label: "Marge 10%", amount: 116 },
      { projectId: project.id, kind: "income", category: "Billetterie", label: "120 x 8€ (70% rempl.)", amount: 672 },
      { projectId: project.id, kind: "income", category: "Buvette / bar", label: "Partage recette bar", amount: 300 },
      { projectId: project.id, kind: "income", category: "Subvention publique", label: "Micro-aide locale", amount: 400 },
    ],
  });
  await prisma.task.createMany({
    data: [
      { projectId: project.id, title: "Confirmer le lieu partenaire", phase: "Préparation", done: true },
      { projectId: project.id, title: "Contacter les 2 groupes", phase: "Programmation", done: true },
      { projectId: project.id, title: "Boucler le budget prévisionnel", phase: "Gestion", done: false },
      { projectId: project.id, title: "Déclaration SACEM", phase: "Administratif", done: false },
      { projectId: project.id, title: "Plan de communication", phase: "Communication", done: false },
    ],
  });

  // Deux masters cibles (depuis les modèles) avec analyse d'écart
  const gap = gapAnalysis({ cultureMonths: 6, adminMonths: 8, hasProject: true, hasPortfolio: false, financeScore: 20, lawScore: 15, selectivity: "moyenne" });
  for (const m of MASTER_TEMPLATES.slice(0, 2)) {
    await prisma.application.create({
      data: {
        userId,
        university: m.university,
        city: m.city,
        programName: m.programName,
        selectivity: m.selectivity,
        hasAlternance: m.hasAlternance,
        hasInternship: m.hasInternship,
        officialLink: m.officialLink,
        skillsRequired: toJson(m.skillsRequired),
        requiredDocuments: toJson(m.requiredDocuments),
        keyDates: m.keyDates,
        status: "to_study",
        priority: 2,
        gap: toJson(gap),
      },
    });
  }

  // Portfolio de départ
  const reform = reformulateExperience("Accueil et billetterie dans une salle de spectacle", "exercée");
  await prisma.portfolioItem.createMany({
    data: [
      { userId, kind: "experience", section: "Expériences", title: "Accueil & billetterie en salle", content: reform.cvPhrase, status: "acquis", data: toJson(reform) },
      { userId, kind: "venue_study", section: "Analyses de structures", title: "Étude de salle (à compléter)", content: "Analyser une salle réelle de votre territoire.", status: "objectif", data: toJson({}) },
    ],
  });

  // Une entrée psychologie sauvegardée
  await prisma.psychEntry.create({
    data: {
      userId,
      inputExperience: "Accueil et billetterie dans une salle de spectacle",
      nature: "exercée",
      transferableSkills: toJson(reform.transferableSkills),
      culturalSkills: toJson(reform.culturalSkills),
      cvPhrase: reform.cvPhrase,
      letterPhrase: reform.letterPhrase,
      interviewPhrase: reform.interviewPhrase,
      limits: reform.limits.join(" • "),
      evidenceNeeded: reform.evidenceNeeded.join(" • "),
    },
  });

  // Sauvegarder 3 opportunités de démonstration
  const demoOpps = await prisma.opportunity.findMany({ where: { isDemo: true }, take: 3 });
  for (const o of demoOpps) {
    await prisma.savedOpportunity.create({
      data: { userId, opportunityId: o.id, status: "saved", category: "À explorer" },
    }).catch(() => {});
  }

  // Une recherche automatique + une source + notifications de bienvenue
  await prisma.searchQuery.create({
    data: {
      userId,
      name: "Assistant production/admin — France & Europe",
      keywords: "assistant production administration culture",
      countries: toJson(["France", "Belgique", "Espagne"]),
      structureTypes: toJson(["Salle de concert", "Festival", "SMAC (musiques actuelles)"]),
      contractTypes: toJson(["Stage", "Alternance", "Service civique"]),
      frequency: "weekly",
    },
  });
  await prisma.source.create({
    data: { userId, name: "Profil Culture (offres spectacle vivant)", url: "https://www.profilculture.com", type: "site", status: "pending", note: "Ajouter la connexion API/flux quand disponible." },
  });
  await prisma.notification.createMany({
    data: [
      { userId, type: "action", title: "Bienvenue sur Backstage Path", body: "Votre profil de départ est pré-rempli. Ajustez-le dans Paramètres pour recalculer votre score." },
      { userId, type: "action", title: "Action de la semaine", body: "Boucler le budget prévisionnel de votre projet culturel." },
    ],
  });
}

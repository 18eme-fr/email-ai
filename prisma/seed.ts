// Seed du catalogue d'opportunités de DÉMONSTRATION (isDemo = true).
// Données fictives/illustratives — clairement identifiées comme telles dans l'UI.
// Les liens pointent vers des domaines racines réels et sont "à vérifier".
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHECK = new Date().toISOString().slice(0, 10);

type Demo = {
  structureName: string; country: string; city: string; structureType: string; missionTitle: string;
  duration: string; startDate?: string; deadline?: string; contractType: string; compensation: string;
  housingProvided?: boolean; mealsOrTransport?: string; languagesRequired: string[]; experienceLevel: string;
  degreeRequired?: string; visaRequired?: boolean; eligibleFrench?: boolean; adminTasks: string[];
  officialLink: string; source: string; reliability: string; lat: number; lng: number; keywords: string;
};

const DEMO: Demo[] = [
  {
    structureName: "Scène nationale (exemple)", country: "France", city: "Lyon", structureType: "Scène nationale",
    missionTitle: "Assistant·e d'administration et de production", duration: "6 mois", startDate: "2026-09-01", deadline: "2026-06-15",
    contractType: "Stage", compensation: "Gratification légale", housingProvided: false, mealsOrTransport: "Tickets restaurant",
    languagesRequired: ["Français"], experienceLevel: "Débutant accepté", degreeRequired: "Licence", visaRequired: false, eligibleFrench: true,
    adminTasks: ["administration", "budget", "production", "contrats"], officialLink: "https://www.culture.gouv.fr", source: "Démo", reliability: "supposé",
    lat: 45.76, lng: 4.83, keywords: "assistant administration production scène nationale",
  },
  {
    structureName: "SMAC (exemple)", country: "France", city: "Nantes", structureType: "SMAC (musiques actuelles)",
    missionTitle: "Assistant·e de production musiques actuelles", duration: "4 mois", deadline: "2026-05-30",
    contractType: "Alternance", compensation: "Rémunération alternance", languagesRequired: ["Français"], experienceLevel: "Débutant accepté",
    degreeRequired: "Bac+3", visaRequired: false, eligibleFrench: true, adminTasks: ["production", "diffusion", "coordination", "budget"],
    officialLink: "https://cnm.fr", source: "Démo", reliability: "supposé", lat: 47.22, lng: -1.55, keywords: "assistant production smac musiques actuelles",
  },
  {
    structureName: "Festival d'été (exemple)", country: "France", city: "Avignon", structureType: "Festival",
    missionTitle: "Assistant·e coordination & billetterie", duration: "3 mois", deadline: "2026-04-20",
    contractType: "CDD", compensation: "SMIC", housingProvided: true, mealsOrTransport: "Repas fournis", languagesRequired: ["Français", "Anglais"],
    experienceLevel: "Débutant accepté", visaRequired: false, eligibleFrench: true, adminTasks: ["coordination", "billetterie", "accueil", "logistique"],
    officialLink: "https://www.culture.gouv.fr", source: "Démo", reliability: "supposé", lat: 43.95, lng: 4.81, keywords: "coordination billetterie festival",
  },
  {
    structureName: "Théâtre municipal (exemple)", country: "France", city: "Strasbourg", structureType: "Théâtre",
    missionTitle: "Assistant·e administratif·ve et financier·e", duration: "6 mois", deadline: "2026-06-01",
    contractType: "Stage", compensation: "Gratification légale", languagesRequired: ["Français", "Allemand"], experienceLevel: "Débutant accepté",
    degreeRequired: "Licence", visaRequired: false, eligibleFrench: true, adminTasks: ["administration", "comptabilité", "budget", "RH"],
    officialLink: "https://www.culture.gouv.fr", source: "Démo", reliability: "supposé", lat: 48.58, lng: 7.75, keywords: "assistant administratif financier théâtre",
  },
  {
    structureName: "Institut culturel français (exemple)", country: "Espagne", city: "Madrid", structureType: "Institut culturel français à l'étranger",
    missionTitle: "Assistant·e de programmation culturelle", duration: "12 mois", deadline: "2026-05-15",
    contractType: "Volontariat international (VIE/VIA)", compensation: "Indemnité VIA", housingProvided: false, mealsOrTransport: "Transport partiel",
    languagesRequired: ["Français", "Espagnol B2"], experienceLevel: "Débutant accepté", degreeRequired: "Bac+3", visaRequired: false, eligibleFrench: true,
    adminTasks: ["programmation", "coordination", "administration", "partenariats"], officialLink: "https://www.civiweb.com", source: "Démo", reliability: "à vérifier",
    lat: 40.42, lng: -3.70, keywords: "assistant programmation institut français madrid",
  },
  {
    structureName: "Réseau européen (exemple)", country: "Belgique", city: "Bruxelles", structureType: "Réseau européen du spectacle vivant",
    missionTitle: "Cultural project assistant", duration: "6 mois", deadline: "2026-05-10",
    contractType: "Corps européen de solidarité", compensation: "Indemnité + logement", housingProvided: true, mealsOrTransport: "Logement + repas",
    languagesRequired: ["Anglais B2", "Français"], experienceLevel: "Débutant accepté", visaRequired: false, eligibleFrench: true,
    adminTasks: ["administration", "coordination", "subventions", "production"], officialLink: "https://youth.europa.eu", source: "Démo", reliability: "à vérifier",
    lat: 50.85, lng: 4.35, keywords: "cultural project assistant european network",
  },
  {
    structureName: "Opéra (exemple)", country: "Italie", city: "Milan", structureType: "Opéra",
    missionTitle: "Arts administration assistant (stage Erasmus+)", duration: "5 mois", deadline: "2026-06-30",
    contractType: "Erasmus+", compensation: "Bourse Erasmus+", housingProvided: false, languagesRequired: ["Anglais B1", "Italien A2"],
    experienceLevel: "Débutant accepté", degreeRequired: "Licence", visaRequired: false, eligibleFrench: true, adminTasks: ["administration", "production", "coordination"],
    officialLink: "https://erasmus-plus.ec.europa.eu", source: "Démo", reliability: "à vérifier", lat: 45.46, lng: 9.19, keywords: "arts administration assistant opera erasmus",
  },
  {
    structureName: "Centre culturel (exemple)", country: "Portugal", city: "Lisbonne", structureType: "Centre culturel",
    missionTitle: "Assistant·e coordination de programmation", duration: "6 mois", deadline: "2026-07-01",
    contractType: "Stage", compensation: "Indemnité de stage", languagesRequired: ["Anglais B1", "Portugais A2"], experienceLevel: "Débutant accepté",
    visaRequired: false, eligibleFrench: true, adminTasks: ["programmation", "coordination", "communication"], officialLink: "https://www.culture.gouv.fr",
    source: "Démo", reliability: "à vérifier", lat: 38.72, lng: -9.14, keywords: "coordination programmation centre culturel lisbonne",
  },
  {
    structureName: "Salle de concert (exemple)", country: "Allemagne", city: "Berlin", structureType: "Salle de concert",
    missionTitle: "Venue operations assistant", duration: "6 mois", deadline: "2026-06-20",
    contractType: "CDD", compensation: "≈ 1 200 €/mois", housingProvided: false, languagesRequired: ["Anglais B2", "Allemand A2"],
    experienceLevel: "Débutant/junior", visaRequired: false, eligibleFrench: true, adminTasks: ["exploitation", "coordination", "logistique", "régie"],
    officialLink: "https://www.goethe.de", source: "Démo", reliability: "à vérifier", lat: 52.52, lng: 13.40, keywords: "venue operations assistant berlin",
  },
  {
    structureName: "Compagnie artistique (exemple)", country: "France", city: "Bordeaux", structureType: "Compagnie artistique",
    missionTitle: "Administrateur·rice de compagnie junior", duration: "8 mois", deadline: "2026-05-25",
    contractType: "Alternance", compensation: "Rémunération alternance", languagesRequired: ["Français"], experienceLevel: "Débutant accepté",
    degreeRequired: "Bac+3", visaRequired: false, eligibleFrench: true, adminTasks: ["administration", "budget", "contrats", "subventions", "paie"],
    officialLink: "https://www.opale.asso.fr", source: "Démo", reliability: "supposé", lat: 44.84, lng: -0.58, keywords: "administrateur compagnie junior",
  },
  {
    structureName: "Tiers-lieu culturel (exemple)", country: "France", city: "Marseille", structureType: "Lieu hybride / Tiers-lieu",
    missionTitle: "Assistant·e exploitation & événements", duration: "Service civique 8 mois", deadline: "2026-04-30",
    contractType: "Service civique", compensation: "Indemnité service civique", languagesRequired: ["Français"], experienceLevel: "Aucune exp. requise",
    visaRequired: false, eligibleFrench: true, adminTasks: ["exploitation", "coordination", "accueil", "communication"], officialLink: "https://www.service-civique.gouv.fr",
    source: "Démo", reliability: "supposé", lat: 43.30, lng: 5.37, keywords: "exploitation événements tiers-lieu service civique",
  },
  {
    structureName: "Fondation culturelle (exemple)", country: "Canada", city: "Montréal", structureType: "Fondation culturelle",
    missionTitle: "Festival operations assistant", duration: "4 mois", deadline: "2026-03-31",
    contractType: "Contrat saisonnier", compensation: "Salaire horaire", housingProvided: false, languagesRequired: ["Français", "Anglais"],
    experienceLevel: "Débutant accepté", visaRequired: true, eligibleFrench: true, adminTasks: ["production", "coordination", "logistique"],
    officialLink: "https://www.canada.ca", source: "Démo", reliability: "à vérifier", lat: 45.50, lng: -73.57, keywords: "festival operations assistant montreal",
  },
  {
    structureName: "Établissement public culturel (exemple)", country: "France", city: "Lille", structureType: "Établissement public culturel",
    missionTitle: "Assistant·e ressources humaines & planning", duration: "6 mois", deadline: "2026-06-10",
    contractType: "Stage", compensation: "Gratification légale", languagesRequired: ["Français"], experienceLevel: "Débutant accepté",
    degreeRequired: "Licence", visaRequired: false, eligibleFrench: true, adminTasks: ["RH", "planning", "administration", "intermittents"],
    officialLink: "https://www.culture.gouv.fr", source: "Démo", reliability: "supposé", lat: 50.63, lng: 3.06, keywords: "assistant rh planning établissement public",
  },
  {
    structureName: "Structure de diffusion (exemple)", country: "France", city: "Paris", structureType: "Structure de diffusion",
    missionTitle: "Assistant·e de diffusion / booking", duration: "6 mois", deadline: "2026-05-05",
    contractType: "Alternance", compensation: "Rémunération alternance", languagesRequired: ["Français", "Anglais B2"], experienceLevel: "Débutant accepté",
    degreeRequired: "Bac+3", visaRequired: false, eligibleFrench: true, adminTasks: ["diffusion", "contrats", "coordination", "budget"],
    officialLink: "https://cnm.fr", source: "Démo", reliability: "supposé", lat: 48.86, lng: 2.35, keywords: "assistant diffusion booking tournée",
  },
];

async function main() {
  const existing = await prisma.opportunity.count({ where: { isDemo: true } });
  if (existing > 0) {
    await prisma.opportunity.deleteMany({ where: { isDemo: true, savedBy: { none: {} } } });
  }
  for (const d of DEMO) {
    const already = await prisma.opportunity.findFirst({
      where: { isDemo: true, structureName: d.structureName, missionTitle: d.missionTitle },
    });
    if (already) continue;
    await prisma.opportunity.create({
      data: {
        isDemo: true,
        ownerId: null,
        structureName: d.structureName,
        country: d.country,
        city: d.city,
        structureType: d.structureType,
        missionTitle: d.missionTitle,
        duration: d.duration,
        startDate: d.startDate ?? null,
        deadline: d.deadline ?? null,
        contractType: d.contractType,
        compensation: d.compensation,
        housingProvided: d.housingProvided ?? false,
        mealsOrTransport: d.mealsOrTransport ?? null,
        languagesRequired: JSON.stringify(d.languagesRequired),
        experienceLevel: d.experienceLevel,
        degreeRequired: d.degreeRequired ?? null,
        visaRequired: d.visaRequired ?? false,
        eligibleFrench: d.eligibleFrench ?? true,
        adminTasks: JSON.stringify(d.adminTasks),
        officialLink: d.officialLink,
        lastChecked: CHECK,
        source: d.source,
        reliability: d.reliability,
        lat: d.lat,
        lng: d.lng,
        keywords: d.keywords,
      },
    });
  }
  const total = await prisma.opportunity.count({ where: { isDemo: true } });
  console.log(`✅ Seed terminé : ${total} opportunités de démonstration.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

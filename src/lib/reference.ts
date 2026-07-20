// ------------------------------------------------------------------
// Données de référence (domaine métier). Utilisées par le seed ET l'UI.
// Les ressources externes pointent vers des domaines racines réels et sont
// marquées "à vérifier" : un lien profond n'est jamais inventé.
// ------------------------------------------------------------------

export const SCORE_BANDS = [
  { min: 0, max: 20, label: "Projet encore théorique", tone: "danger" },
  { min: 21, max: 40, label: "Premières connaissances", tone: "warn" },
  { min: 41, max: 60, label: "Profil en transition", tone: "info" },
  { min: 61, max: 80, label: "Profil crédible pour plusieurs masters", tone: "good" },
  { min: 81, max: 100, label: "Profil fortement professionnalisé", tone: "great" },
] as const;

export function bandFor(score: number) {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[0];
}

// Sous-scores du "Score de préparation à l'administration culturelle"
export const SUBSCORES = [
  { key: "cultureExp", label: "Expérience professionnelle dans la culture" },
  { key: "adminExp", label: "Expérience administrative" },
  { key: "finance", label: "Gestion et comptabilité" },
  { key: "liveArts", label: "Connaissance du spectacle vivant" },
  { key: "law", label: "Droit et réglementation" },
  { key: "project", label: "Projet culturel réalisé" },
  { key: "network", label: "Réseau professionnel" },
  { key: "portfolio", label: "Portfolio" },
  { key: "applications", label: "Préparation des candidatures" },
] as const;

export type SubscoreKey = (typeof SUBSCORES)[number]["key"];

// ------------------------------------------------------------------
// Levier 1 — vocabulaire de recherche
// ------------------------------------------------------------------
export const STRUCTURE_TYPES = [
  "Salle de concert",
  "Théâtre",
  "Scène nationale",
  "Scène conventionnée",
  "SMAC (musiques actuelles)",
  "Opéra",
  "Centre culturel",
  "Festival",
  "Compagnie artistique",
  "Structure de production",
  "Structure de diffusion",
  "Tourneur",
  "Association culturelle",
  "Établissement public culturel",
  "Service culturel municipal",
  "Institut culturel français à l'étranger",
  "Alliance / Institut culturel",
  "Fondation culturelle",
  "Réseau européen du spectacle vivant",
  "ONG culturelle",
  "Centre artistique",
  "Lieu hybride / Tiers-lieu",
];

export const OPPORTUNITY_TYPES = [
  "Stage",
  "Alternance",
  "Apprentissage",
  "CDD",
  "CDI",
  "Contrat saisonnier",
  "Mission ponctuelle",
  "Volontariat",
  "Service civique",
  "Volontariat international (VIE/VIA)",
  "Corps européen de solidarité",
  "Erasmus+",
  "Résidence professionnelle",
  "Bénévolat responsabilisant",
  "Freelance débutant",
];

export const JOB_KEYWORDS = [
  { fr: "Assistant d'administration", en: "Arts administration assistant" },
  { fr: "Assistant administratif culturel", en: "Cultural admin assistant" },
  { fr: "Assistant de production", en: "Production assistant" },
  { fr: "Chargé de production junior", en: "Junior production coordinator" },
  { fr: "Assistant de diffusion", en: "Booking / touring assistant" },
  { fr: "Assistant de coordination", en: "Coordination assistant" },
  { fr: "Assistant de direction", en: "Management assistant" },
  { fr: "Assistant RAF", en: "Finance & admin assistant" },
  { fr: "Assistant de programmation", en: "Programming assistant" },
  { fr: "Administrateur de compagnie junior", en: "Junior company administrator" },
  { fr: "Assistant festival", en: "Festival operations assistant" },
  { fr: "Assistant exploitation", en: "Venue operations assistant" },
  { fr: "Coordinateur de salle", en: "Venue coordinator" },
  { fr: "Assistant billetterie", en: "Box office coordinator" },
  { fr: "Assistant projet culturel", en: "Cultural project assistant" },
];

export const SEARCH_LANGUAGES = ["Français", "Anglais", "Espagnol", "Portugais", "Allemand", "Italien"];

// ------------------------------------------------------------------
// Levier 2 — étapes du projet culturel (22)
// ------------------------------------------------------------------
export const PROJECT_STEPS = [
  { key: "concept", n: 1, title: "Définition du concept", hint: "Type d'événement, ambiance, format, singularité." },
  { key: "objectives", n: 2, title: "Objectifs", hint: "Artistiques, publics, budgétaires, personnels (preuves master)." },
  { key: "audience", n: 3, title: "Public visé", hint: "Qui vient ? Combien ? Comment les toucher ?" },
  { key: "venue", n: 4, title: "Choix du lieu", hint: "Capacité, ERP, jauge, contraintes techniques." },
  { key: "feasibility", n: 5, title: "Étude de faisabilité", hint: "Ce qui est réaliste avec vos moyens et délais." },
  { key: "budget", n: 6, title: "Budget prévisionnel", hint: "Recettes / dépenses (outil intégré ci-dessous)." },
  { key: "financing", n: 7, title: "Plan de financement", hint: "Autofinancement, aides, partenaires, billetterie." },
  { key: "artists", n: 8, title: "Recherche d'artistes", hint: "Programmation, contacts, disponibilités." },
  { key: "partners", n: 9, title: "Recherche de partenaires", hint: "Lieux, médias, associations, collectivités." },
  { key: "contracts", n: 10, title: "Contrats et conventions", hint: "Cession, coréalisation, partenariat. À faire valider." },
  { key: "insurance", n: 11, title: "Assurances", hint: "Responsabilité civile, annulation, matériel." },
  { key: "permits", n: 12, title: "Autorisations", hint: "Débit de boissons, occupation, déclarations." },
  { key: "safety", n: 13, title: "Sécurité", hint: "ERP, jauge, issues, agents, plan de sécurité." },
  { key: "technical", n: 14, title: "Technique", hint: "Fiche technique, son, lumière, plateau." },
  { key: "ticketing", n: 15, title: "Billetterie", hint: "Tarifs, quotas, plateforme, contrôle d'accès." },
  { key: "production", n: 16, title: "Planning de production", hint: "Rétroplanning, jalons, montage/démontage." },
  { key: "comm", n: 17, title: "Communication", hint: "Affiche, réseaux, presse, calendrier de diffusion." },
  { key: "hr", n: 18, title: "Ressources humaines", hint: "Équipe, bénévoles, prestataires, rôles." },
  { key: "runday", n: 19, title: "Déroulement de l'événement", hint: "Feuille de route heure par heure." },
  { key: "financialReport", n: 20, title: "Bilan financier", hint: "Réalisé vs prévisionnel, écarts." },
  { key: "qualitative", n: 21, title: "Évaluation qualitative", hint: "Retours publics, artistes, partenaires." },
  { key: "archive", n: 22, title: "Archivage des preuves", hint: "Photos, docs, contrats, chiffres → portfolio." },
];

export const BUDGET_CATEGORIES = [
  "Location du lieu",
  "Cachets artistiques",
  "Salaires",
  "Charges sociales",
  "Technique",
  "Sonorisation",
  "Éclairage",
  "Sécurité",
  "Assurance",
  "Communication",
  "Transport",
  "Hébergement",
  "Restauration",
  "Droits d'auteur",
  "SACEM",
  "Billetterie",
  "Frais administratifs",
  "Imprévus",
];

export const INCOME_CATEGORIES = [
  "Billetterie",
  "Subvention publique",
  "Mécénat / sponsoring",
  "Buvette / bar",
  "Autofinancement",
  "Vente de produits dérivés",
  "Partenariat",
];

export const PROJECT_EXAMPLE_LIBRARY = [
  { key: "budget-concert", title: "Budget prévisionnel d'un petit concert", note: "≈120 places, 2 groupes locaux, café-culture." },
  { key: "financing-plan", title: "Plan de financement type", note: "Billetterie + micro-subvention + partenariat lieu." },
  { key: "retroplanning", title: "Rétroplanning sur 10 semaines", note: "Du concept à la soirée." },
  { key: "tech-sheet", title: "Fiche technique simplifiée", note: "Son, lumière, plateau — modèle à adapter." },
  { key: "roadmap", title: "Feuille de route jour J", note: "Timing montage → démontage." },
  { key: "partnership", title: "Convention de partenariat (modèle)", note: "⚠ à faire valider par un professionnel." },
  { key: "risk-matrix", title: "Matrice des risques", note: "Probabilité × impact + mesures." },
  { key: "report", title: "Bilan financier + qualitatif", note: "Structure de restitution pour dossier master." },
];

// ------------------------------------------------------------------
// Levier 3 — académie (blocs + ressources)
// ------------------------------------------------------------------
export const ACADEMY_BLOCKS = [
  {
    key: "finance",
    title: "Gestion et comptabilité",
    accent: "#e9b949",
    topics: [
      "Bases de la comptabilité", "Compte de résultat", "Bilan", "Budget prévisionnel",
      "Plan de financement", "Suivi budgétaire", "Trésorerie", "Seuil de rentabilité",
      "Analyse des écarts", "Contrôle de gestion", "Excel gestion culturelle", "Comptabilité associative",
    ],
  },
  {
    key: "admin",
    title: "Administration culturelle",
    accent: "#3a7bd5",
    topics: [
      "Fonctionnement d'une association", "Gouvernance", "Établissements publics culturels", "EPCC",
      "Régies", "Délégations de service public", "Collectivités territoriales", "DRAC",
      "Centre national de la musique", "Financements publics", "Subventions", "Mécénat",
      "Partenariats", "Appels à projets", "Marchés publics", "Conventions",
    ],
  },
  {
    key: "law",
    title: "Droit du spectacle vivant",
    accent: "#8f1d2d",
    topics: [
      "Contrats de travail", "Contrat de cession", "Contrat de coréalisation", "Contrat de coproduction",
      "Droit d'auteur", "Droits voisins", "SACEM", "Intermittence", "Rémunération des artistes",
      "Licences d'entrepreneur de spectacles", "Assurances", "Responsabilité", "Droit social",
      "Fiscalité culturelle", "Réglementation ERP", "Sécurité du public",
    ],
  },
  {
    key: "production",
    title: "Production et exploitation",
    accent: "#2fae8f",
    topics: [
      "Production", "Diffusion", "Programmation", "Accueil des artistes", "Fiches techniques",
      "Feuilles de route", "Plannings", "Logistique", "Billetterie", "Régie",
      "Relations producteurs", "Montage / démontage", "Exploitation quotidienne", "Coordination technique",
    ],
  },
  {
    key: "hr",
    title: "Ressources humaines et management",
    accent: "#c56cf0",
    topics: [
      "Organisation d'une équipe", "Recrutement", "Contrats", "Plannings", "Management",
      "Coordination", "Conduite de réunion", "Prévention des risques", "Risques psychosociaux",
      "Gestion des conflits", "Bénévoles", "Intermittents", "Prestataires",
    ],
  },
  {
    key: "policy",
    title: "Politiques culturelles",
    accent: "#e8853a",
    topics: [
      "Histoire des politiques culturelles", "Décentralisation culturelle", "Rôle de l'État",
      "Rôle des collectivités", "Labels culturels", "Financement des salles", "Démocratisation culturelle",
      "Droits culturels", "Développement des publics", "Évaluation des politiques culturelles",
    ],
  },
] as const;

// Catalogue de ressources — organismes et domaines racines réels.
// reliability = "à vérifier" car les liens profonds évoluent (voir automatisation).
export const COURSES = [
  { key: "fun-compta-asso", title: "Comptabilité pour associations (MOOC)", org: "FUN / Le Mouvement associatif", url: "https://www.fun-mooc.fr", blockKey: "finance", language: "Français", level: "Débutant", duration: "6 semaines", price: "Gratuit", certification: "Attestation", format: "MOOC", skills: ["Comptabilité associative", "Budget prévisionnel"], relevance: 95 },
  { key: "cnam-gestion", title: "Gestion budgétaire et comptable", org: "CNAM", url: "https://www.cnam.fr", blockKey: "finance", language: "Français", level: "Intermédiaire", duration: "Semestre", price: "Payant", certification: "ECTS", format: "Cours à distance", skills: ["Compte de résultat", "Bilan", "Contrôle de gestion"], relevance: 88 },
  { key: "coursera-finance", title: "Finance for Non-Financial Managers", org: "Coursera", url: "https://www.coursera.org", blockKey: "finance", language: "Anglais", level: "Débutant", duration: "4 semaines", price: "Gratuit à l'audit", certification: "Certificat payant", format: "MOOC", skills: ["Seuil de rentabilité", "Trésorerie"], relevance: 72 },
  { key: "cnm-guides", title: "Guides & aides du spectacle vivant musical", org: "Centre national de la musique (CNM)", url: "https://cnm.fr", blockKey: "admin", language: "Français", level: "Tous niveaux", duration: "Lecture", price: "Gratuit", certification: "Aucune", format: "Guides institutionnels", skills: ["Subventions", "Financements publics"], relevance: 90 },
  { key: "culture-gouv", title: "Ressources DRAC & politiques culturelles", org: "Ministère de la Culture", url: "https://www.culture.gouv.fr", blockKey: "policy", language: "Français", level: "Tous niveaux", duration: "Lecture", price: "Gratuit", certification: "Aucune", format: "Guides institutionnels", skills: ["DRAC", "Décentralisation culturelle"], relevance: 85 },
  { key: "irma-droit", title: "Le droit du spectacle vivant (ressources)", org: "CNM / ex-IRMA", url: "https://cnm.fr", blockKey: "law", language: "Français", level: "Intermédiaire", duration: "Lecture", price: "Gratuit / Payant", certification: "Aucune", format: "Articles professionnels", skills: ["Contrat de cession", "Licences d'entrepreneur"], relevance: 92 },
  { key: "prodiss-secu", title: "Sécurité des ERP & accueil du public", org: "Ressources professionnelles (PRODISS)", url: "https://www.prodiss.org", blockKey: "law", language: "Français", level: "Intermédiaire", duration: "Lecture", price: "Gratuit", certification: "Aucune", format: "Guides", skills: ["Réglementation ERP", "Sécurité du public"], relevance: 80 },
  { key: "opale-asso", title: "Outils de gestion associative culturelle", org: "Opale / CRDLA Culture", url: "https://www.opale.asso.fr", blockKey: "admin", language: "Français", level: "Débutant", duration: "Lecture / Outils", price: "Gratuit", certification: "Aucune", format: "Modèles de documents", skills: ["Gouvernance", "Conventions"], relevance: 87 },
  { key: "prod-mooc", title: "Gestion de projet (MOOC)", org: "FUN / Centrale Lille", url: "https://www.fun-mooc.fr", blockKey: "production", language: "Français", level: "Débutant", duration: "5 semaines", price: "Gratuit", certification: "Attestation", format: "MOOC", skills: ["Planning", "Rétroplanning"], relevance: 78 },
  { key: "sacem-ressources", title: "Droits d'auteur & déclarations", org: "SACEM", url: "https://www.sacem.fr", blockKey: "law", language: "Français", level: "Débutant", duration: "Lecture", price: "Gratuit", certification: "Aucune", format: "Guides institutionnels", skills: ["SACEM", "Droit d'auteur"], relevance: 76 },
  { key: "hr-mooc", title: "Management d'équipe & conduite de réunion", org: "OpenClassrooms", url: "https://openclassrooms.com", blockKey: "hr", language: "Français", level: "Débutant", duration: "8h", price: "Gratuit à l'audit", certification: "Certificat payant", format: "Cours en ligne", skills: ["Management", "Conduite de réunion"], relevance: 70 },
  { key: "policy-book", title: "Politiques culturelles (repères)", org: "La Découverte (livre de référence)", url: "https://www.editionsladecouverte.fr", blockKey: "policy", language: "Français", level: "Intermédiaire", duration: "Livre", price: "Payant", certification: "Aucune", format: "Livre", skills: ["Histoire des politiques culturelles"], relevance: 68 },
];

// ------------------------------------------------------------------
// Levier 5 — matrice psychologie -> culture
// ------------------------------------------------------------------
export const PSYCH_MATRIX = [
  { psych: "Psychologie sociale", cultural: "Dynamique des équipes et des publics", note: "Comprendre les groupes, la cohésion, les rôles." },
  { psych: "Méthodes d'entretien", cultural: "Étude des publics et évaluation", note: "Recueillir des retours structurés, enquêtes." },
  { psych: "Analyse qualitative", cultural: "Analyse de retours et enquêtes", note: "Coder, synthétiser, restituer des données non chiffrées." },
  { psych: "Psychologie du travail", cultural: "Management et risques psychosociaux", note: "Prévention RPS, organisation du travail." },
  { psych: "Psychologie cognitive", cultural: "Expérience du public (parcours spectateur)", note: "Attention, perception, ergonomie de l'accueil." },
  { psych: "Méthodologie universitaire", cultural: "Recherche, synthèse et rédaction", note: "Dossiers, notes, veille, rigueur documentaire." },
  { psych: "Expériences sociales / institutionnelles", cultural: "Travail partenarial et compréhension des institutions", note: "Naviguer entre acteurs publics et associatifs." },
  { psych: "Accompagnement des publics", cultural: "Accessibilité et inclusion", note: "Publics empêchés, médiation, accueil adapté." },
];

// Banque de mots-clés pour le générateur de reformulations (heuristique locale).
export const REFORMULATION_HINTS: { match: string[]; skills: string[] }[] = [
  { match: ["billetterie", "accueil", "box office", "caisse"], skills: ["Gestion du parcours spectateur", "Utilisation d'un outil de billetterie", "Gestion des flux de public", "Résolution de problèmes en temps réel", "Coordination avec l'équipe d'exploitation", "Compréhension du fonctionnement quotidien d'un lieu"] },
  { match: ["accompagnement", "social", "insertion"], skills: ["Écoute active", "Travail partenarial avec des institutions", "Compréhension des publics fragiles", "Médiation et gestion de situations"] },
  { match: ["bénévol", "association", "assoc"], skills: ["Coordination de bénévoles", "Fonctionnement associatif", "Organisation d'événements", "Sens de l'engagement collectif"] },
  { match: ["stage", "administration", "bureau"], skills: ["Suivi administratif", "Rédaction de documents", "Classement et archivage", "Respect des procédures"] },
  { match: ["vente", "commerce", "caisse", "magasin"], skills: ["Relation client", "Encaissement et suivi de caisse", "Gestion des priorités", "Travail en équipe sous pression"] },
  { match: ["concert", "festival", "événement", "event"], skills: ["Logistique événementielle", "Coordination le jour J", "Relation avec les prestataires", "Gestion des imprévus"] },
];

// ------------------------------------------------------------------
// Levier 6 — masters (modèles). Liens = domaines racines réels, à vérifier.
// ------------------------------------------------------------------
export const MASTER_TEMPLATES = [
  { university: "Université Paris Dauphine – PSL", city: "Paris", programName: "Management des organisations culturelles", selectivity: "forte", hasAlternance: true, hasInternship: true, officialLink: "https://dauphine.psl.eu", skillsRequired: ["Gestion", "Analyse", "Économie de la culture"], requiredDocuments: ["CV", "Lettre de motivation", "Relevés de notes", "Projet professionnel"], keyDates: "Candidatures ~ mars-avril" },
  { university: "Université Lyon 2", city: "Lyon", programName: "Développement et administration des institutions culturelles", selectivity: "moyenne", hasAlternance: true, hasInternship: true, officialLink: "https://www.univ-lyon2.fr", skillsRequired: ["Administration", "Droit culturel", "Gestion de projet"], requiredDocuments: ["CV", "Lettre", "Note d'intention"], keyDates: "Candidatures ~ avril-mai" },
  { university: "Université Bordeaux Montaigne", city: "Bordeaux", programName: "Direction de projets ou établissements culturels", selectivity: "moyenne", hasAlternance: false, hasInternship: true, officialLink: "https://www.u-bordeaux-montaigne.fr", skillsRequired: ["Conduite de projet", "Politiques culturelles"], requiredDocuments: ["CV", "Lettre", "Portfolio"], keyDates: "Candidatures ~ printemps" },
  { university: "ICART / écoles spécialisées", city: "Paris / Bordeaux / Lyon", programName: "Management du spectacle vivant", selectivity: "moyenne", hasAlternance: true, hasInternship: true, officialLink: "https://www.icart.fr", skillsRequired: ["Production", "Diffusion", "Gestion"], requiredDocuments: ["CV", "Lettre", "Entretien"], keyDates: "Admissions sur dossier + entretien" },
  { university: "Université Grenoble Alpes", city: "Grenoble", programName: "Direction de projets culturels", selectivity: "moyenne", hasAlternance: false, hasInternship: true, officialLink: "https://www.univ-grenoble-alpes.fr", skillsRequired: ["Ingénierie culturelle", "Territoires"], requiredDocuments: ["CV", "Lettre", "Projet"], keyDates: "Candidatures ~ mai" },
];

export const APPLICATION_STATUSES = [
  { key: "to_study", label: "À étudier" },
  { key: "priority", label: "Prioritaire" },
  { key: "preparing", label: "Dossier en préparation" },
  { key: "sent", label: "Candidature envoyée" },
  { key: "interview", label: "Entretien" },
  { key: "waitlist", label: "Liste d'attente" },
  { key: "accepted", label: "Admis" },
  { key: "rejected", label: "Refusé" },
  { key: "followup", label: "Relance nécessaire" },
];

export const SAVED_STATUSES = [
  { key: "saved", label: "Sauvegardée" },
  { key: "to_apply", label: "À candidater" },
  { key: "applied", label: "Candidaté" },
  { key: "interview", label: "Entretien" },
  { key: "waitlist", label: "Liste d'attente" },
  { key: "accepted", label: "Accepté" },
  { key: "rejected", label: "Refusé" },
  { key: "followup", label: "Relance" },
];

export const PORTFOLIO_SECTIONS = [
  "Présentation", "Projet professionnel", "Parcours", "Expériences", "Compétences",
  "Projets réalisés", "Analyses de structures", "Travaux de gestion", "Budgets",
  "Documents administratifs", "Formations suivies", "Recommandations", "Contacts professionnels", "Bilan de progression",
];

export const VENUE_STUDY_FIELDS = [
  "Statut juridique", "Historique", "Gouvernance", "Tutelles", "Labels", "Budget",
  "Financements", "Recettes", "Équipe", "Organigramme", "Programmation", "Capacité",
  "Publics", "Partenaires", "Territoire", "Politique tarifaire", "Modèle économique",
  "Enjeux", "Points forts", "Fragilités",
];

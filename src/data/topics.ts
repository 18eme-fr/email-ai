import type { LearningTopic } from "@/types/topic";

/**
 * Base initiale de thèmes de « La Roulette du Savoir ».
 *
 * Chaque entrée est une fiche minimale exploitable : objectif, intérêt,
 * notions clés, questions de maîtrise, activité concrète et mots-clés pour
 * approfondir. Pour ajouter ou modifier des thèmes de façon durable, éditez
 * ce fichier (ou utilisez la page « Gérer » pour un ajout local persistant).
 *
 * Le champ `category` doit correspondre à un `id` défini dans
 * `categories.ts`.
 */
export const TOPICS: LearningTopic[] = [
  // ─────────────────────────────── Vie quotidienne ──────────────────────────
  {
    id: "daily-fiche-de-paie",
    title: "Comprendre une fiche de paie",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Savoir lire un bulletin de salaire et distinguer brut et net.",
    importance:
      "La fiche de paie conditionne son budget, ses droits sociaux et sa retraite : la comprendre évite les mauvaises surprises.",
    keyConcepts: [
      "Salaire brut et salaire net",
      "Cotisations salariales et patronales",
      "Net à payer et net imposable",
      "Prélèvement à la source",
      "Congés payés et heures supplémentaires",
    ],
    questions: [
      "Quelle est la différence entre le brut et le net ?",
      "À quoi servent les cotisations sociales ?",
      "Pourquoi le net imposable diffère-t-il du net à payer ?",
      "Comment repérer une erreur sur son bulletin ?",
    ],
    activity:
      "Prendre une fiche de paie (réelle ou modèle) et identifier brut, net à payer et net imposable.",
    keywords: ["bulletin de salaire", "cotisations", "URSSAF", "net imposable"],
    sourceSuggestions: ["service-public.fr", "Code du travail"],
  },
  {
    id: "daily-budget-personnel",
    title: "Gérer un budget personnel",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Construire un budget mensuel équilibré et suivre ses dépenses.",
    importance:
      "Maîtriser son budget, c'est éviter le découvert, épargner et financer ses projets sereinement.",
    keyConcepts: [
      "Revenus et charges fixes",
      "Dépenses variables et loisirs",
      "Règle 50/30/20",
      "Épargne de précaution",
      "Suivi et catégorisation",
    ],
    questions: [
      "Quelles sont mes charges fixes incompressibles ?",
      "Combien puis-je épargner chaque mois ?",
      "Que couvre une épargne de précaution ?",
      "Comment réagir en cas de dépense imprévue ?",
    ],
    activity:
      "Lister ses dépenses du dernier mois et les répartir selon la règle 50/30/20.",
    keywords: ["budget", "épargne", "50/30/20", "reste à vivre"],
  },
  {
    id: "daily-comprendre-impots",
    title: "Comprendre l'impôt sur le revenu",
    category: "daily-life",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre comment est calculé son impôt sur le revenu.",
    importance:
      "L'impôt finance les services publics ; comprendre son calcul aide à anticiper et à remplir sa déclaration.",
    keyConcepts: [
      "Revenu imposable",
      "Barème progressif et tranches",
      "Quotient familial",
      "Prélèvement à la source",
      "Crédits et réductions d'impôt",
    ],
    questions: [
      "Comment fonctionne un barème progressif ?",
      "Qu'est-ce que le quotient familial ?",
      "Quelle différence entre crédit et réduction d'impôt ?",
      "Pourquoi peut-on avoir un solde à payer ou à récupérer ?",
    ],
    activity:
      "Simuler son impôt sur le simulateur officiel des impôts et repérer sa tranche marginale.",
    keywords: ["impôt", "barème", "tranches", "quotient familial"],
    sourceSuggestions: ["impots.gouv.fr"],
  },
  {
    id: "daily-lire-un-contrat",
    title: "Savoir lire un contrat",
    category: "daily-life",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Repérer les clauses essentielles avant de signer un contrat.",
    importance:
      "Signer engage juridiquement : savoir lire un contrat protège de clauses abusives ou de mauvaises surprises.",
    keyConcepts: [
      "Objet et durée du contrat",
      "Obligations des parties",
      "Clauses de résiliation",
      "Pénalités et responsabilités",
      "Conditions générales",
    ],
    questions: [
      "Quelles sont les obligations de chaque partie ?",
      "Comment et quand puis-je résilier ?",
      "Quelles clauses peuvent être abusives ?",
      "Que faire en cas de litige ?",
    ],
    activity:
      "Relire un contrat récent (abonnement, bail) et surligner durée, résiliation et pénalités.",
    keywords: ["contrat", "clause", "résiliation", "consentement"],
  },
  {
    id: "daily-comprendre-assurance",
    title: "Comprendre une assurance",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Savoir ce que couvre un contrat d'assurance et ses limites.",
    importance:
      "Une assurance mal comprise, c'est une garantie illusoire le jour d'un sinistre.",
    keyConcepts: [
      "Garanties et exclusions",
      "Franchise et plafond",
      "Prime d'assurance",
      "Déclaration de sinistre",
      "Responsabilité civile",
    ],
    questions: [
      "Que couvre exactement mon contrat ?",
      "Qu'est-ce qu'une franchise ?",
      "Quelles sont les exclusions de garantie ?",
      "Comment déclarer un sinistre dans les délais ?",
    ],
    activity:
      "Lire les conditions de son assurance habitation et lister trois exclusions.",
    keywords: ["assurance", "franchise", "garantie", "sinistre"],
  },
  {
    id: "daily-organiser-un-voyage",
    title: "Organiser un voyage",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Planifier un voyage de A à Z sans rien oublier d'essentiel.",
    importance:
      "Une bonne préparation réduit le stress, les coûts et les imprévus en voyage.",
    keyConcepts: [
      "Budget et transport",
      "Hébergement",
      "Documents et formalités",
      "Assurance voyage",
      "Itinéraire et marge de temps",
    ],
    questions: [
      "Quels documents sont nécessaires selon la destination ?",
      "Comment répartir mon budget voyage ?",
      "Que prévoir en cas d'imprévu ?",
      "Comment éviter le surtourisme et voyager responsable ?",
    ],
    activity:
      "Préparer une checklist complète pour une destination de son choix.",
    keywords: ["voyage", "itinéraire", "budget", "formalités"],
  },
  {
    id: "daily-nutrition",
    title: "Les bases de la nutrition",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre les grands équilibres d'une alimentation saine.",
    importance:
      "Bien s'alimenter influe sur l'énergie, la concentration et la santé à long terme.",
    keyConcepts: [
      "Macronutriments (glucides, lipides, protéines)",
      "Micronutriments et fibres",
      "Équilibre énergétique",
      "Aliments ultra-transformés",
      "Hydratation",
    ],
    questions: [
      "À quoi servent les trois macronutriments ?",
      "Pourquoi limiter les aliments ultra-transformés ?",
      "Qu'est-ce qu'une assiette équilibrée ?",
      "Comment lire une étiquette nutritionnelle ?",
    ],
    activity:
      "Analyser la composition d'un repas type et l'améliorer sur un point.",
    keywords: ["nutrition", "macronutriments", "NutriScore", "équilibre"],
  },
  {
    id: "daily-sommeil",
    title: "Comprendre et améliorer son sommeil",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Connaître les mécanismes du sommeil pour mieux récupérer.",
    importance:
      "Le sommeil conditionne la mémoire, l'humeur et la santé : le soigner améliore tout le reste.",
    keyConcepts: [
      "Cycles et phases de sommeil",
      "Rythme circadien",
      "Dette de sommeil",
      "Hygiène de sommeil",
      "Écrans et lumière bleue",
    ],
    questions: [
      "Comment s'enchaînent les cycles de sommeil ?",
      "Qu'est-ce que le rythme circadien ?",
      "Quels comportements dégradent le sommeil ?",
      "Comment se rendormir après un réveil nocturne ?",
    ],
    activity:
      "Tenir un journal de sommeil pendant trois jours et repérer un facteur perturbant.",
    keywords: ["sommeil", "circadien", "mélatonine", "récupération"],
  },
  {
    id: "daily-comprendre-devis",
    title: "Comprendre un devis",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 10,
    objective: "Analyser un devis avant de commander des travaux ou un service.",
    importance:
      "Un devis clair évite les litiges et permet de comparer les prestataires.",
    keyConcepts: [
      "Mentions obligatoires",
      "Prix HT et TTC",
      "Détail des prestations",
      "Acompte et échéancier",
      "Validité du devis",
    ],
    questions: [
      "Quelles mentions doivent obligatoirement figurer ?",
      "Comment comparer deux devis équitablement ?",
      "Que signifie la durée de validité ?",
      "Un devis signé engage-t-il ?",
    ],
    activity:
      "Comparer deux devis (réels ou fictifs) et justifier son choix.",
    keywords: ["devis", "HT/TTC", "acompte", "prestation"],
  },
  {
    id: "daily-cuisiner-simple",
    title: "Cuisiner simple et économique",
    category: "daily-life",
    difficulty: "Débutant",
    duration: 20,
    objective: "Composer des repas sains, rapides et peu coûteux.",
    importance:
      "Cuisiner soi-même fait économiser, mange mieux et gagne en autonomie.",
    keyConcepts: [
      "Batch cooking",
      "Aliments de base peu chers",
      "Anti-gaspillage",
      "Assaisonnement",
      "Conservation des aliments",
    ],
    questions: [
      "Comment planifier ses repas de la semaine ?",
      "Quels aliments de base ont un bon rapport qualité-prix ?",
      "Comment limiter le gaspillage alimentaire ?",
      "Comment conserver correctement ses restes ?",
    ],
    activity:
      "Préparer un menu de la semaine avec une liste de courses budgétée.",
    keywords: ["batch cooking", "anti-gaspi", "menu", "conservation"],
  },

  // ───────────────────────────── Compétences pratiques ──────────────────────
  {
    id: "skills-premiers-secours",
    title: "Les gestes de premiers secours",
    category: "practical-skills",
    difficulty: "Débutant",
    duration: 30,
    objective: "Connaître les gestes qui sauvent en attendant les secours.",
    importance:
      "Savoir réagir face à un malaise ou un accident peut sauver une vie.",
    keyConcepts: [
      "Protéger, alerter, secourir",
      "Position latérale de sécurité",
      "Massage cardiaque et défibrillateur",
      "Étouffement (méthode de Heimlich)",
      "Numéros d'urgence (15, 18, 112)",
    ],
    questions: [
      "Que faire en premier face à une victime inconsciente ?",
      "Comment réaliser une PLS ?",
      "Quand et comment utiliser un défibrillateur ?",
      "Quel numéro appeler selon la situation ?",
    ],
    activity:
      "Repérer le défibrillateur le plus proche de chez soi et réviser la PLS.",
    keywords: ["premiers secours", "PLS", "PSC1", "défibrillateur"],
    sourceSuggestions: ["Croix-Rouge", "Protection civile"],
  },
  {
    id: "skills-verifier-information",
    title: "Vérifier une information",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Évaluer la fiabilité d'une information avant de la partager.",
    importance:
      "À l'ère de la désinformation, vérifier une information est une compétence citoyenne essentielle.",
    keyConcepts: [
      "Sources primaires et secondaires",
      "Recoupement des sources",
      "Recherche d'image inversée",
      "Biais de confirmation",
      "Fact-checking",
    ],
    questions: [
      "Comment identifier la source d'origine ?",
      "Qu'est-ce qu'une source fiable ?",
      "Comment vérifier une image ou une vidéo ?",
      "Quels signaux trahissent une fausse information ?",
    ],
    activity:
      "Prendre une information virale et la vérifier avec au moins deux sources.",
    keywords: ["fact-checking", "sources", "désinformation", "recoupement"],
  },
  {
    id: "skills-reconnaitre-arnaque",
    title: "Reconnaître une arnaque",
    category: "practical-skills",
    difficulty: "Débutant",
    duration: 20,
    objective: "Détecter les tentatives d'arnaque et savoir réagir.",
    importance:
      "Les arnaques (phishing, faux support, achats) coûtent cher : les reconnaître protège son argent et ses données.",
    keyConcepts: [
      "Hameçonnage (phishing)",
      "Sentiment d'urgence",
      "Vérification de l'expéditeur",
      "Paiements suspects",
      "Signalement (Pharos, Signal Conso)",
    ],
    questions: [
      "Quels signaux doivent alerter dans un message ?",
      "Comment vérifier l'authenticité d'un site ?",
      "Que faire si l'on a communiqué ses données ?",
      "Où signaler une arnaque ?",
    ],
    activity:
      "Analyser un e-mail suspect et repérer trois indices d'arnaque.",
    keywords: ["phishing", "arnaque", "escroquerie", "signalement"],
  },
  {
    id: "skills-proteger-donnees",
    title: "Protéger ses données personnelles",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Adopter les bons réflexes pour sécuriser ses données en ligne.",
    importance:
      "Ses données sont convoitées : les protéger, c'est préserver sa vie privée et sa sécurité.",
    keyConcepts: [
      "Mots de passe forts et uniques",
      "Double authentification",
      "Gestionnaire de mots de passe",
      "Paramètres de confidentialité",
      "RGPD et droits",
    ],
    questions: [
      "Qu'est-ce qu'un mot de passe robuste ?",
      "Pourquoi activer la double authentification ?",
      "Quels droits donne le RGPD ?",
      "Comment limiter le pistage publicitaire ?",
    ],
    activity:
      "Activer la double authentification sur un compte important.",
    keywords: ["RGPD", "mot de passe", "2FA", "vie privée"],
    sourceSuggestions: ["CNIL", "cybermalveillance.gouv.fr"],
  },
  {
    id: "skills-comprendre-banque",
    title: "Comment fonctionne une banque",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le rôle d'une banque et ses services de base.",
    importance:
      "La banque gère notre argent au quotidien : comprendre son fonctionnement évite frais et pièges.",
    keyConcepts: [
      "Compte courant et épargne",
      "Crédit et taux d'intérêt",
      "Création monétaire",
      "Frais bancaires",
      "Découvert et agios",
    ],
    questions: [
      "Comment une banque gagne-t-elle de l'argent ?",
      "Qu'est-ce que la création monétaire par le crédit ?",
      "Comment comparer les offres bancaires ?",
      "Comment éviter les frais inutiles ?",
    ],
    activity:
      "Relever les frais bancaires prélevés sur les trois derniers mois.",
    keywords: ["banque", "crédit", "taux", "création monétaire"],
  },
  {
    id: "skills-negociation",
    title: "Les bases de la négociation",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Préparer et mener une négociation gagnant-gagnant.",
    importance:
      "On négocie partout : salaire, achat, projet. La méthode change les résultats.",
    keyConcepts: [
      "BATNA (meilleure solution de repli)",
      "Intérêts vs positions",
      "Zone d'accord possible",
      "Écoute active",
      "Ancrage",
    ],
    questions: [
      "Qu'est-ce qu'un BATNA et pourquoi le connaître ?",
      "Comment distinguer position et intérêt ?",
      "Comment créer de la valeur pour les deux parties ?",
      "Comment gérer un blocage ?",
    ],
    activity:
      "Préparer une négociation réelle en écrivant son BATNA et ses intérêts.",
    keywords: ["négociation", "BATNA", "gagnant-gagnant", "ancrage"],
  },
  {
    id: "skills-organiser-projet-collectif",
    title: "Organiser un projet collectif",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Structurer un projet mené à plusieurs, du but à l'évaluation.",
    importance:
      "Associations, études, bénévolat : savoir organiser un collectif est une compétence recherchée.",
    keyConcepts: [
      "Objectif SMART",
      "Répartition des rôles",
      "Rétroplanning",
      "Prise de décision collective",
      "Bilan et évaluation",
    ],
    questions: [
      "Comment définir un objectif clair et mesurable ?",
      "Comment répartir les tâches équitablement ?",
      "Comment décider quand il y a désaccord ?",
      "Comment évaluer la réussite du projet ?",
    ],
    activity:
      "Écrire l'objectif SMART et le rétroplanning d'un projet imaginaire.",
    keywords: ["projet", "SMART", "rétroplanning", "collectif"],
  },
  {
    id: "skills-prise-de-parole",
    title: "Réussir une prise de parole en public",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Préparer et délivrer un discours clair et convaincant.",
    importance:
      "Savoir parler en public est décisif en entretien, en oral d'examen ou en réunion.",
    keyConcepts: [
      "Structure du message",
      "Accroche et chute",
      "Respiration et voix",
      "Langage corporel",
      "Gestion du trac",
    ],
    questions: [
      "Comment capter l'attention dès les premières secondes ?",
      "Comment structurer un propos clair ?",
      "Comment gérer le trac ?",
      "Quel rôle joue le langage non verbal ?",
    ],
    activity:
      "Préparer un pitch de 2 minutes et l'enregistrer pour s'auto-évaluer.",
    keywords: ["prise de parole", "rhétorique", "trac", "pitch"],
  },
  {
    id: "skills-communication-non-violente",
    title: "La communication non violente",
    category: "practical-skills",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Exprimer un désaccord sans agressivité et être mieux entendu.",
    importance:
      "La CNV désamorce les conflits et améliore les relations personnelles et professionnelles.",
    keyConcepts: [
      "Observation sans jugement",
      "Sentiments",
      "Besoins",
      "Demande claire",
      "Écoute empathique",
    ],
    questions: [
      "Quelles sont les quatre étapes de la CNV ?",
      "Comment distinguer observation et jugement ?",
      "Comment formuler une demande plutôt qu'une exigence ?",
      "Comment accueillir la colère de l'autre ?",
    ],
    activity:
      "Reformuler un reproche récent selon les quatre étapes de la CNV.",
    keywords: ["CNV", "Rosenberg", "empathie", "besoins"],
  },
  {
    id: "skills-lire-etiquettes",
    title: "Décrypter les étiquettes des produits",
    category: "practical-skills",
    difficulty: "Débutant",
    duration: 10,
    objective: "Lire les étiquettes pour consommer de façon éclairée.",
    importance:
      "Les étiquettes cachent des informations utiles sur la qualité, l'origine et l'impact.",
    keyConcepts: [
      "Liste des ingrédients",
      "Labels et certifications",
      "Additifs et allergènes",
      "Origine et traçabilité",
      "Date de péremption / DDM",
    ],
    questions: [
      "Comment est ordonnée la liste des ingrédients ?",
      "Quels labels sont fiables ?",
      "Quelle différence entre DLC et DDM ?",
      "Comment repérer le greenwashing ?",
    ],
    activity:
      "Comparer deux produits similaires à partir de leurs étiquettes.",
    keywords: ["étiquette", "labels", "additifs", "traçabilité"],
  },
  {
    id: "skills-demarches-administratives",
    title: "Réussir ses démarches administratives",
    category: "practical-skills",
    difficulty: "Débutant",
    duration: 20,
    objective: "Gérer efficacement papiers et démarches en ligne.",
    importance:
      "Bien gérer ses démarches évite pénalités, pertes de droits et stress.",
    keyConcepts: [
      "FranceConnect",
      "Pièces justificatives",
      "Délais et accusés de réception",
      "Classement des documents",
      "Recours et médiation",
    ],
    questions: [
      "Comment sécuriser ses identifiants administratifs ?",
      "Quels justificatifs conserver et combien de temps ?",
      "Que faire en cas de non-réponse de l'administration ?",
      "Comment saisir un médiateur ?",
    ],
    activity:
      "Créer un dossier numérique classé pour ses documents administratifs.",
    keywords: ["administration", "FranceConnect", "justificatifs", "recours"],
    sourceSuggestions: ["service-public.fr"],
  },

  // ─────────────────────────────── Culture générale ─────────────────────────
  {
    id: "culture-grands-mouvements-artistiques",
    title: "Les grands mouvements artistiques",
    category: "general-culture",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Situer les grands mouvements de l'art occidental.",
    importance:
      "Reconnaître les styles enrichit les visites, les débats culturels et la culture générale.",
    keyConcepts: [
      "Renaissance et perspective",
      "Baroque et classicisme",
      "Impressionnisme",
      "Cubisme et abstraction",
      "Art contemporain",
    ],
    questions: [
      "Qu'est-ce qui distingue Renaissance et Baroque ?",
      "Pourquoi l'impressionnisme a-t-il fait scandale ?",
      "En quoi le cubisme rompt-il avec la tradition ?",
      "Comment aborder une œuvre d'art contemporain ?",
    ],
    activity:
      "Choisir une œuvre par mouvement et noter ce qui la caractérise.",
    keywords: ["histoire de l'art", "impressionnisme", "cubisme", "style"],
  },
  {
    id: "culture-philosophie-courants",
    title: "Les grands courants de la philosophie",
    category: "general-culture",
    difficulty: "Avancé",
    duration: 30,
    objective: "Distinguer les principaux courants philosophiques.",
    importance:
      "La philosophie structure la pensée critique et éclaire les débats de société.",
    keyConcepts: [
      "Rationalisme et empirisme",
      "Idéalisme",
      "Existentialisme",
      "Utilitarisme et déontologie",
      "Philosophie politique",
    ],
    questions: [
      "Qu'oppose le rationalisme à l'empirisme ?",
      "Que signifie « l'existence précède l'essence » ?",
      "Quelle différence entre conséquentialisme et déontologie ?",
      "Comment la philosophie éclaire-t-elle l'éthique ?",
    ],
    activity:
      "Prendre un dilemme moral et l'analyser avec deux approches éthiques.",
    keywords: ["philosophie", "éthique", "existentialisme", "utilitarisme"],
  },
  {
    id: "culture-mythologie",
    title: "Les grandes mythologies",
    category: "general-culture",
    difficulty: "Débutant",
    duration: 20,
    objective: "Connaître les principaux mythes gréco-romains et leurs symboles.",
    importance:
      "Les mythes irriguent la langue, l'art et les références culturelles.",
    keyConcepts: [
      "Panthéon grec et romain",
      "Héros et quêtes",
      "Symboles et allégories",
      "Mythes fondateurs",
      "Réappropriations modernes",
    ],
    questions: [
      "Quels sont les dieux principaux et leurs attributs ?",
      "Que raconte le mythe d'Icare et sa morale ?",
      "Pourquoi les mythes traversent-ils les époques ?",
      "Où retrouve-t-on la mythologie aujourd'hui ?",
    ],
    activity:
      "Repérer trois expressions courantes issues de la mythologie.",
    keywords: ["mythologie", "Grèce antique", "héros", "symbole"],
  },
  {
    id: "culture-litterature-classiques",
    title: "Les incontournables de la littérature",
    category: "general-culture",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Repérer des œuvres et courants littéraires majeurs.",
    importance:
      "La littérature nourrit la culture, l'expression et la compréhension du monde.",
    keyConcepts: [
      "Genres littéraires",
      "Romantisme et réalisme",
      "Roman moderne",
      "Théâtre classique",
      "Prix littéraires",
    ],
    questions: [
      "Quelles différences entre roman, nouvelle et essai ?",
      "Qu'apporte le réalisme après le romantisme ?",
      "Pourquoi certains classiques restent-ils actuels ?",
      "Comment choisir sa prochaine lecture ?",
    ],
    activity:
      "Sélectionner un classique à lire et en résumer l'intérêt en trois phrases.",
    keywords: ["littérature", "roman", "réalisme", "classiques"],
  },
  {
    id: "culture-notions-scientifiques",
    title: "Notions scientifiques essentielles",
    category: "general-culture",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre quelques grandes idées scientifiques structurantes.",
    importance:
      "Comprendre la science aide à trier l'information et à décider en connaissance de cause.",
    keyConcepts: [
      "Méthode scientifique",
      "Évolution",
      "Atomes et énergie",
      "Système solaire",
      "Statistiques et probabilités",
    ],
    questions: [
      "En quoi consiste la démarche scientifique ?",
      "Qu'est-ce qu'une théorie scientifique ?",
      "Pourquoi corrélation n'est pas causalité ?",
      "Comment reconnaître une pseudo-science ?",
    ],
    activity:
      "Trouver un exemple de corrélation trompeuse dans l'actualité.",
    keywords: ["méthode scientifique", "évolution", "causalité", "esprit critique"],
  },
  {
    id: "culture-musique-histoire",
    title: "Une brève histoire de la musique",
    category: "general-culture",
    difficulty: "Débutant",
    duration: 20,
    objective: "Situer les grandes périodes musicales, du classique à l'actuel.",
    importance:
      "Comprendre l'évolution musicale enrichit l'écoute et la culture artistique.",
    keyConcepts: [
      "Musique baroque et classique",
      "Romantisme musical",
      "Jazz et blues",
      "Musiques populaires (rock, pop)",
      "Musiques électroniques",
    ],
    questions: [
      "Qu'est-ce qui caractérise la musique classique ?",
      "D'où viennent le jazz et le blues ?",
      "Comment la technologie a-t-elle changé la musique ?",
      "Qu'est-ce qu'un genre musical ?",
    ],
    activity:
      "Écouter un morceau par période et noter une différence marquante.",
    keywords: ["musique", "jazz", "genres", "histoire"],
  },
  {
    id: "culture-geographie-monde",
    title: "Repères de géographie mondiale",
    category: "general-culture",
    difficulty: "Débutant",
    duration: 20,
    objective: "Maîtriser les grands repères géographiques de la planète.",
    importance:
      "Des repères géographiques solides aident à comprendre l'actualité internationale.",
    keyConcepts: [
      "Continents et océans",
      "Grands fleuves et reliefs",
      "Capitales et États",
      "Climats",
      "Densités de population",
    ],
    questions: [
      "Quels sont les continents les plus peuplés ?",
      "Où se situent les grands ensembles montagneux ?",
      "Quels facteurs expliquent la répartition de la population ?",
      "Comment lire une carte thématique ?",
    ],
    activity:
      "Placer dix pays et leur capitale sur une carte muette.",
    keywords: ["géographie", "cartographie", "capitales", "climats"],
  },
  {
    id: "culture-corps-humain",
    title: "Le corps humain en bref",
    category: "general-culture",
    difficulty: "Débutant",
    duration: 20,
    objective: "Connaître les grands systèmes du corps humain.",
    importance:
      "Comprendre son corps aide à préserver sa santé et à dialoguer avec les soignants.",
    keyConcepts: [
      "Systèmes (nerveux, cardiovasculaire, digestif)",
      "Cellules et organes",
      "Immunité",
      "Homéostasie",
      "Hygiène de vie",
    ],
    questions: [
      "Quel rôle joue le système cardiovasculaire ?",
      "Comment fonctionne l'immunité ?",
      "Qu'est-ce que l'homéostasie ?",
      "Quels comportements protègent la santé ?",
    ],
    activity:
      "Schématiser le trajet du sang dans le corps.",
    keywords: ["anatomie", "physiologie", "immunité", "santé"],
  },
  {
    id: "culture-symboles-republique",
    title: "Les symboles de la République",
    category: "general-culture",
    difficulty: "Débutant",
    duration: 10,
    objective: "Connaître les symboles républicains et leur signification.",
    importance:
      "Les symboles disent les valeurs communes : les comprendre nourrit la citoyenneté.",
    keyConcepts: [
      "Marianne",
      "Drapeau tricolore",
      "Devise Liberté-Égalité-Fraternité",
      "La Marseillaise",
      "14 juillet et laïcité",
    ],
    questions: [
      "Que représente Marianne ?",
      "D'où vient la devise républicaine ?",
      "Quelle est l'origine de La Marseillaise ?",
      "Que signifie la laïcité ?",
    ],
    activity:
      "Associer chaque symbole à la valeur qu'il incarne.",
    keywords: ["République", "Marianne", "devise", "laïcité"],
  },
  {
    id: "culture-chiffres-romains-mesures",
    title: "Systèmes de mesure et repères utiles",
    category: "general-culture",
    difficulty: "Débutant",
    duration: 10,
    objective: "Maîtriser unités, conversions et ordres de grandeur.",
    importance:
      "Estimer des ordres de grandeur aide à juger la vraisemblance d'une information.",
    keyConcepts: [
      "Système international d'unités",
      "Conversions courantes",
      "Ordres de grandeur",
      "Pourcentages",
      "Échelles",
    ],
    questions: [
      "Comment convertir rapidement des unités courantes ?",
      "Qu'est-ce qu'un ordre de grandeur ?",
      "Comment calculer un pourcentage d'évolution ?",
      "Pourquoi les échelles peuvent-elles tromper ?",
    ],
    activity:
      "Estimer un ordre de grandeur (population d'une ville, distance) puis vérifier.",
    keywords: ["mesures", "conversions", "pourcentage", "ordre de grandeur"],
  },

  // ─────────────────────────────── Études & méthodo ─────────────────────────
  {
    id: "studies-prise-de-notes",
    title: "Prendre des notes efficacement",
    category: "studies",
    difficulty: "Débutant",
    duration: 20,
    objective: "Adopter une méthode de prise de notes claire et réutilisable.",
    importance:
      "De bonnes notes accélèrent les révisions et améliorent la compréhension.",
    keyConcepts: [
      "Méthode Cornell",
      "Cartes mentales",
      "Abréviations",
      "Hiérarchisation",
      "Reformulation",
    ],
    questions: [
      "Quelle méthode convient au type de cours ?",
      "Comment structurer une page de notes ?",
      "Pourquoi reformuler plutôt que recopier ?",
      "Comment relire utilement ses notes ?",
    ],
    activity:
      "Reprendre un cours récent avec la méthode Cornell.",
    keywords: ["prise de notes", "Cornell", "mind map", "méthode"],
  },
  {
    id: "studies-memorisation",
    title: "Mémoriser durablement",
    category: "studies",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Utiliser les techniques de mémorisation efficaces.",
    importance:
      "Bien mémoriser fait gagner du temps et réduit le stress avant les examens.",
    keyConcepts: [
      "Répétition espacée",
      "Rappel actif",
      "Effet de test",
      "Palais de mémoire",
      "Interférences et oubli",
    ],
    questions: [
      "Pourquoi la répétition espacée fonctionne-t-elle ?",
      "En quoi le rappel actif surpasse-t-il la relecture ?",
      "Comment construire des cartes de révision ?",
      "Comment lutter contre l'oubli ?",
    ],
    activity:
      "Créer un jeu de 10 cartes en rappel actif sur un chapitre.",
    keywords: ["mémorisation", "répétition espacée", "Anki", "rappel actif"],
  },
  {
    id: "studies-methodo-dissertation",
    title: "Méthodologie de la dissertation",
    category: "studies",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Construire une dissertation argumentée et structurée.",
    importance:
      "La dissertation est reine dans les études supérieures et de nombreux concours.",
    keyConcepts: [
      "Analyse du sujet",
      "Problématique",
      "Plan dialectique",
      "Argumentation et exemples",
      "Introduction et conclusion",
    ],
    questions: [
      "Comment problématiser un sujet ?",
      "Quelle différence entre plan thématique et dialectique ?",
      "Comment articuler argument et exemple ?",
      "Que doit contenir une bonne introduction ?",
    ],
    activity:
      "Rédiger l'introduction et le plan détaillé d'un sujet donné.",
    keywords: ["dissertation", "problématique", "plan", "argumentation"],
  },
  {
    id: "studies-lecture-active",
    title: "Lire efficacement un texte difficile",
    category: "studies",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre et retenir un texte dense grâce à la lecture active.",
    importance:
      "Savoir lire vite et bien est indispensable face à la masse de lectures universitaires.",
    keyConcepts: [
      "Survol et écrémage",
      "Repérage de la thèse",
      "Annotation",
      "Résumé et fiche",
      "Questionnement du texte",
    ],
    questions: [
      "Comment repérer rapidement l'idée principale ?",
      "Quels signes structurent un texte argumentatif ?",
      "Comment annoter sans surligner tout ?",
      "Comment vérifier sa compréhension ?",
    ],
    activity:
      "Résumer un article de 3 pages en 5 phrases.",
    keywords: ["lecture active", "écrémage", "synthèse", "annotation"],
  },
  {
    id: "studies-gestion-du-temps",
    title: "Gérer son temps et ses révisions",
    category: "studies",
    difficulty: "Débutant",
    duration: 20,
    objective: "Planifier son travail pour tenir dans la durée.",
    importance:
      "Une bonne planification évite le bachotage et l'épuisement.",
    keyConcepts: [
      "Matrice d'Eisenhower",
      "Technique Pomodoro",
      "Planning de révisions",
      "Procrastination",
      "Pauses et récupération",
    ],
    questions: [
      "Comment distinguer urgent et important ?",
      "Comment structurer une session de travail ?",
      "Pourquoi et comment fractionner les révisions ?",
      "Comment lutter contre la procrastination ?",
    ],
    activity:
      "Construire son planning de la semaine avec des créneaux Pomodoro.",
    keywords: ["gestion du temps", "Pomodoro", "Eisenhower", "planning"],
  },
  {
    id: "studies-methodo-universitaire",
    title: "S'adapter aux méthodes universitaires",
    category: "studies",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les codes du travail universitaire.",
    importance:
      "Le supérieur demande autonomie et rigueur : en connaître les codes facilite la réussite.",
    keyConcepts: [
      "Autonomie et travail personnel",
      "CM, TD et lectures",
      "Références et citations",
      "Plagiat",
      "Partiels et contrôle continu",
    ],
    questions: [
      "Qu'attend-on d'un étudiant à l'université ?",
      "Comment citer correctement ses sources ?",
      "Qu'est-ce que le plagiat et comment l'éviter ?",
      "Comment s'organiser sans cadre imposé ?",
    ],
    activity:
      "Rédiger une courte bibliographie correctement formatée.",
    keywords: ["université", "citations", "plagiat", "autonomie"],
  },
  {
    id: "studies-esprit-critique",
    title: "Développer son esprit critique",
    category: "studies",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Analyser une affirmation avec méthode et recul.",
    importance:
      "L'esprit critique protège des manipulations et améliore la qualité des décisions.",
    keyConcepts: [
      "Sophismes courants",
      "Charge de la preuve",
      "Biais cognitifs",
      "Évaluation des sources",
      "Nuance et incertitude",
    ],
    questions: [
      "Comment repérer un raisonnement fallacieux ?",
      "Sur qui pèse la charge de la preuve ?",
      "Comment évaluer la qualité d'une source ?",
      "Pourquoi accepter l'incertitude ?",
    ],
    activity:
      "Décortiquer un argument d'un débat récent et repérer un sophisme.",
    keywords: ["esprit critique", "sophisme", "preuve", "biais"],
  },
  {
    id: "studies-gerer-le-stress-examen",
    title: "Gérer le stress des examens",
    category: "studies",
    difficulty: "Débutant",
    duration: 10,
    objective: "Apprivoiser son stress avant et pendant une épreuve.",
    importance:
      "Un stress maîtrisé libère les capacités et améliore les performances.",
    keyConcepts: [
      "Respiration et cohérence cardiaque",
      "Préparation mentale",
      "Sommeil avant l'épreuve",
      "Gestion du temps le jour J",
      "Discours intérieur",
    ],
    questions: [
      "Comment se calmer en quelques minutes ?",
      "Comment préparer efficacement la veille ?",
      "Comment gérer un trou de mémoire ?",
      "Quel rôle joue le discours intérieur ?",
    ],
    activity:
      "Tester un exercice de respiration en cohérence cardiaque.",
    keywords: ["stress", "cohérence cardiaque", "examen", "préparation"],
  },
  {
    id: "studies-rediger-synthese",
    title: "Rédiger une synthèse de documents",
    category: "studies",
    difficulty: "Avancé",
    duration: 30,
    objective: "Confronter plusieurs documents en une synthèse ordonnée.",
    importance:
      "L'exercice de synthèse est central dans de nombreux concours et en entreprise.",
    keyConcepts: [
      "Lecture croisée",
      "Confrontation des idées",
      "Plan de synthèse",
      "Objectivité",
      "Reformulation",
    ],
    questions: [
      "Comment dégager les axes communs à plusieurs textes ?",
      "Comment rester objectif sans donner son avis ?",
      "Comment construire un plan équilibré ?",
      "Comment gérer le temps imparti ?",
    ],
    activity:
      "Synthétiser deux articles sur un même thème en une page.",
    keywords: ["synthèse", "concours", "confrontation", "objectivité"],
  },

  // ─────────────────────────── Orientation & carrière ───────────────────────
  {
    id: "career-projet-professionnel",
    title: "Construire son projet professionnel",
    category: "career",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Clarifier ses envies, ses compétences et un cap professionnel.",
    importance:
      "Un projet clair guide ses choix d'études, de stages et de candidatures.",
    keyConcepts: [
      "Bilan de compétences",
      "Valeurs et motivations",
      "Marché de l'emploi",
      "Objectifs à court et long terme",
      "Plan d'action",
    ],
    questions: [
      "Quelles sont mes compétences et mes appétences ?",
      "Quels métiers correspondent à mes valeurs ?",
      "Comment tester un projet avant de s'engager ?",
      "Quelles étapes concrètes fixer ?",
    ],
    activity:
      "Écrire son projet en une page : forces, cap, trois prochaines étapes.",
    keywords: ["projet professionnel", "compétences", "orientation", "plan d'action"],
  },
  {
    id: "career-cv-efficace",
    title: "Rédiger un CV efficace",
    category: "career",
    difficulty: "Débutant",
    duration: 20,
    objective: "Concevoir un CV clair, ciblé et convaincant.",
    importance:
      "Le CV est la première impression : bien construit, il ouvre des portes.",
    keyConcepts: [
      "Structure et lisibilité",
      "Verbes d'action et résultats",
      "Personnalisation au poste",
      "Mots-clés et ATS",
      "Cohérence avec le profil en ligne",
    ],
    questions: [
      "Quelles rubriques prioriser selon son profil ?",
      "Comment valoriser une expérience avec des résultats ?",
      "Comment adapter son CV à chaque offre ?",
      "Qu'est-ce qu'un ATS et comment le passer ?",
    ],
    activity:
      "Réécrire trois lignes d'expérience avec des verbes d'action et un résultat.",
    keywords: ["CV", "candidature", "ATS", "compétences"],
  },
  {
    id: "career-lettre-motivation",
    title: "Écrire une lettre de motivation",
    category: "career",
    difficulty: "Débutant",
    duration: 20,
    objective: "Rédiger une lettre personnalisée et percutante.",
    importance:
      "Une bonne lettre relie votre profil au besoin de l'employeur et fait la différence.",
    keyConcepts: [
      "Structure vous-moi-nous",
      "Accroche personnalisée",
      "Preuves concrètes",
      "Ton et concision",
      "Appel à l'action",
    ],
    questions: [
      "Comment éviter les formules toutes faites ?",
      "Comment montrer sa connaissance de l'organisation ?",
      "Comment relier ses expériences au poste ?",
      "Comment conclure efficacement ?",
    ],
    activity:
      "Écrire une accroche personnalisée pour une offre réelle.",
    keywords: ["lettre de motivation", "candidature", "personnalisation"],
  },
  {
    id: "career-entretien-embauche",
    title: "Réussir un entretien d'embauche",
    category: "career",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Se préparer à convaincre lors d'un entretien.",
    importance:
      "L'entretien est décisif : la préparation transforme le stress en atout.",
    keyConcepts: [
      "Méthode STAR",
      "Recherche sur l'employeur",
      "Questions types",
      "Questions à poser",
      "Langage non verbal",
    ],
    questions: [
      "Comment structurer une réponse avec la méthode STAR ?",
      "Comment répondre à « Parlez-moi de vous » ?",
      "Quelles questions poser au recruteur ?",
      "Comment gérer une question déstabilisante ?",
    ],
    activity:
      "Préparer trois anecdotes STAR issues de son parcours.",
    keywords: ["entretien", "STAR", "recrutement", "préparation"],
  },
  {
    id: "career-reseau-professionnel",
    title: "Développer son réseau professionnel",
    category: "career",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Construire et entretenir un réseau utile et sincère.",
    importance:
      "Une grande partie des opportunités passent par le réseau plutôt que les annonces.",
    keyConcepts: [
      "Réseau faible et fort",
      "Entretien réseau (informationnel)",
      "LinkedIn",
      "Réciprocité",
      "Suivi des contacts",
    ],
    questions: [
      "Pourquoi les « liens faibles » sont-ils précieux ?",
      "Comment demander un entretien réseau ?",
      "Comment soigner son profil LinkedIn ?",
      "Comment entretenir son réseau sans être intéressé ?",
    ],
    activity:
      "Contacter une personne pour un court entretien réseau.",
    keywords: ["réseau", "LinkedIn", "liens faibles", "opportunités"],
  },
  {
    id: "career-preparer-concours",
    title: "Préparer un concours",
    category: "career",
    difficulty: "Avancé",
    duration: 30,
    objective: "Organiser une préparation de concours dans la durée.",
    importance:
      "Les concours (fonction publique, écoles) exigent une stratégie et de l'endurance.",
    keyConcepts: [
      "Épreuves et coefficients",
      "Planning long terme",
      "Entraînement en conditions réelles",
      "Culture générale et actualité",
      "Gestion du moral",
    ],
    questions: [
      "Comment analyser les attendus d'un concours ?",
      "Comment répartir son effort selon les coefficients ?",
      "Pourquoi s'entraîner en temps limité ?",
      "Comment tenir sur la durée ?",
    ],
    activity:
      "Décomposer un concours visé en épreuves et bâtir un rétroplanning.",
    keywords: ["concours", "coefficients", "entraînement", "planning"],
  },
  {
    id: "career-stage-alternance",
    title: "Trouver un stage ou une alternance",
    category: "career",
    difficulty: "Débutant",
    duration: 20,
    objective: "Structurer une recherche de stage ou d'alternance.",
    importance:
      "Stage et alternance sont des tremplins vers l'emploi et l'expérience concrète.",
    keyConcepts: [
      "Candidature spontanée",
      "Convention de stage",
      "Contrat d'alternance",
      "Ciblage des entreprises",
      "Relance",
    ],
    questions: [
      "Comment cibler les bonnes entreprises ?",
      "Quelle différence entre stage et alternance ?",
      "Comment relancer sans être insistant ?",
      "Que vérifier dans une convention ?",
    ],
    activity:
      "Dresser une liste de dix structures à contacter et un message type.",
    keywords: ["stage", "alternance", "candidature", "relance"],
  },
  {
    id: "career-competences-transversales",
    title: "Identifier ses compétences transversales",
    category: "career",
    difficulty: "Débutant",
    duration: 20,
    objective: "Repérer et nommer ses soft skills et compétences transférables.",
    importance:
      "Les compétences transversales se valorisent dans tous les métiers.",
    keyConcepts: [
      "Soft skills",
      "Compétences transférables",
      "Preuves d'expérience",
      "Portfolio",
      "Auto-évaluation",
    ],
    questions: [
      "Qu'est-ce qu'une compétence transversale ?",
      "Comment prouver une soft skill ?",
      "Comment les mettre en avant en candidature ?",
      "Comment les développer ?",
    ],
    activity:
      "Lister cinq compétences transversales avec une preuve concrète pour chacune.",
    keywords: ["soft skills", "compétences", "portfolio", "transférable"],
  },
  {
    id: "career-mobilite-europeenne",
    title: "Étudier ou travailler en Europe",
    category: "career",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Connaître les dispositifs de mobilité en Europe.",
    importance:
      "La mobilité européenne enrichit un CV et ouvre des perspectives.",
    keyConcepts: [
      "Erasmus+",
      "Reconnaissance des diplômes",
      "Europass",
      "Volontariat (corps européen de solidarité)",
      "Langues",
    ],
    questions: [
      "Que permet le programme Erasmus+ ?",
      "Comment faire reconnaître un diplôme à l'étranger ?",
      "À quoi sert Europass ?",
      "Comment financer une mobilité ?",
    ],
    activity:
      "Explorer une offre Erasmus+ ou de volontariat et en noter les conditions.",
    keywords: ["Erasmus", "mobilité", "Europass", "volontariat"],
  },
  {
    id: "career-marque-personnelle",
    title: "Soigner son image professionnelle",
    category: "career",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Construire une présence professionnelle cohérente en ligne.",
    importance:
      "Recruteurs et partenaires vous cherchent en ligne : autant maîtriser l'image renvoyée.",
    keyConcepts: [
      "Identité numérique",
      "Cohérence des profils",
      "e-réputation",
      "Ligne éditoriale",
      "Preuve de compétences",
    ],
    questions: [
      "Que renvoie ma présence en ligne actuelle ?",
      "Comment aligner mes profils sur mon projet ?",
      "Comment nettoyer son e-réputation ?",
      "Comment démontrer ses compétences publiquement ?",
    ],
    activity:
      "Faire une recherche à son propre nom et corriger un élément à améliorer.",
    keywords: ["personal branding", "e-réputation", "identité numérique"],
  },

  // ────────────────────── Institutions & administration ─────────────────────
  {
    id: "inst-budget-commune",
    title: "Comment fonctionne le budget d'une commune ?",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 20,
    objective:
      "Comprendre comment une commune finance ses services et ses projets.",
    importance:
      "Comprendre comment les collectivités financent les services publics locaux et les projets culturels.",
    keyConcepts: [
      "Recettes et dépenses",
      "Fiscalité locale",
      "Dotations de l'État",
      "Budget de fonctionnement",
      "Budget d'investissement",
      "Vote du budget municipal",
    ],
    questions: [
      "Quelle est la différence entre fonctionnement et investissement ?",
      "D'où viennent les ressources financières d'une commune ?",
      "Qui prépare et qui vote le budget ?",
      "Comment une commune peut-elle financer une salle de spectacle ?",
    ],
    activity:
      "Rechercher le budget de sa commune et identifier trois postes de dépenses importants.",
    keywords: ["budget communal", "fiscalité locale", "dotations", "investissement"],
    sourceSuggestions: ["collectivites-locales.gouv.fr"],
  },
  {
    id: "inst-collectivites-territoriales",
    title: "Les collectivités territoriales",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Distinguer commune, département, région et leurs compétences.",
    importance:
      "Les collectivités portent des politiques publiques majeures, dont la culture.",
    keyConcepts: [
      "Commune, département, région",
      "Intercommunalités (EPCI)",
      "Clause de compétence",
      "Décentralisation",
      "Élus locaux",
    ],
    questions: [
      "Quelles compétences pour chaque niveau ?",
      "Qu'est-ce qu'une intercommunalité ?",
      "Qu'a changé la décentralisation ?",
      "Qui finance la culture localement ?",
    ],
    activity:
      "Identifier qui gère écoles, collèges, lycées et transports dans sa région.",
    keywords: ["collectivités", "décentralisation", "EPCI", "compétences"],
  },
  {
    id: "inst-institutions-france",
    title: "Les institutions de la Ve République",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre l'organisation des pouvoirs en France.",
    importance:
      "Connaître les institutions, c'est comprendre qui décide quoi et comment.",
    keyConcepts: [
      "Séparation des pouvoirs",
      "Président et gouvernement",
      "Parlement (Assemblée, Sénat)",
      "Conseil constitutionnel",
      "Cohabitation",
    ],
    questions: [
      "Qui détient le pouvoir exécutif ?",
      "Comment se répartit le pouvoir législatif ?",
      "Quel rôle joue le Conseil constitutionnel ?",
      "Qu'est-ce qu'une cohabitation ?",
    ],
    activity:
      "Schématiser les relations entre exécutif, législatif et judiciaire.",
    keywords: ["Ve République", "pouvoirs", "Parlement", "Constitution"],
  },
  {
    id: "inst-comment-se-cree-loi",
    title: "Comment se crée une loi",
    category: "institutions",
    difficulty: "Débutant",
    duration: 20,
    objective: "Suivre le parcours d'un texte, de l'idée à la promulgation.",
    importance:
      "Comprendre la fabrique de la loi, c'est mieux saisir le débat démocratique.",
    keyConcepts: [
      "Projet et proposition de loi",
      "Navette parlementaire",
      "Amendements",
      "Commission mixte paritaire",
      "Promulgation",
    ],
    questions: [
      "Quelle différence entre projet et proposition de loi ?",
      "Qu'est-ce que la navette parlementaire ?",
      "À quoi sert un amendement ?",
      "Que se passe-t-il en cas de désaccord entre les chambres ?",
    ],
    activity:
      "Suivre l'actualité d'un texte de loi en cours d'examen.",
    keywords: ["loi", "navette", "amendement", "Parlement"],
  },
  {
    id: "inst-comment-fonctionne-election",
    title: "Comment fonctionne une élection",
    category: "institutions",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre les modes de scrutin et leurs effets.",
    importance:
      "Le mode de scrutin façonne la représentation et les majorités.",
    keyConcepts: [
      "Suffrage universel",
      "Scrutin majoritaire",
      "Représentation proportionnelle",
      "Abstention",
      "Découpage électoral",
    ],
    questions: [
      "Quelle différence entre majoritaire et proportionnel ?",
      "Comment le mode de scrutin influence-t-il les résultats ?",
      "Pourquoi l'abstention pose-t-elle problème ?",
      "Qu'est-ce que le vote utile ?",
    ],
    activity:
      "Comparer les effets d'un scrutin majoritaire et proportionnel sur un exemple.",
    keywords: ["élection", "scrutin", "proportionnelle", "abstention"],
  },
  {
    id: "inst-service-public",
    title: "Le service public et ses principes",
    category: "institutions",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre ce qu'est un service public et ses grands principes.",
    importance:
      "Le service public structure la vie quotidienne : santé, école, culture, transports.",
    keyConcepts: [
      "Continuité",
      "Égalité",
      "Mutabilité (adaptabilité)",
      "Régie et délégation",
      "Usager",
    ],
    questions: [
      "Quels sont les grands principes du service public ?",
      "Qui peut gérer un service public ?",
      "Qu'est-ce qu'une délégation de service public ?",
      "En quoi la culture est-elle un service public ?",
    ],
    activity:
      "Identifier trois services publics utilisés dans la semaine et leur gestionnaire.",
    keywords: ["service public", "égalité", "continuité", "délégation"],
  },
  {
    id: "inst-fonction-publique",
    title: "La fonction publique",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Connaître l'organisation et les statuts de la fonction publique.",
    importance:
      "Comprendre la fonction publique aide à s'orienter vers les concours et carrières publiques.",
    keyConcepts: [
      "Trois versants (État, territoriale, hospitalière)",
      "Catégories A, B, C",
      "Statut et titularisation",
      "Concours",
      "Contractuels",
    ],
    questions: [
      "Quels sont les trois versants de la fonction publique ?",
      "Que signifient les catégories A, B et C ?",
      "Comment devient-on fonctionnaire ?",
      "Quel est le rôle des contractuels ?",
    ],
    activity:
      "Repérer un métier culturel dans la fonction publique territoriale et son concours.",
    keywords: ["fonction publique", "concours", "statut", "territoriale"],
  },
  {
    id: "inst-justice-organisation",
    title: "L'organisation de la justice",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Distinguer les grands ordres et juridictions.",
    importance:
      "Savoir vers quelle juridiction se tourner est utile dans la vie citoyenne.",
    keyConcepts: [
      "Justice civile et pénale",
      "Ordre judiciaire et administratif",
      "Degrés de juridiction",
      "Cassation",
      "Aide juridictionnelle",
    ],
    questions: [
      "Quelle différence entre civil et pénal ?",
      "Qu'est-ce que l'appel et la cassation ?",
      "Quand saisir le juge administratif ?",
      "Comment se faire aider si l'on a peu de moyens ?",
    ],
    activity:
      "Associer trois situations à la juridiction compétente.",
    keywords: ["justice", "juridiction", "appel", "cassation"],
  },
  {
    id: "inst-laicite",
    title: "La laïcité en France",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le principe de laïcité et son application.",
    importance:
      "La laïcité est un principe structurant et souvent débattu de la République.",
    keyConcepts: [
      "Loi de 1905",
      "Séparation des Églises et de l'État",
      "Liberté de conscience",
      "Neutralité de l'État",
      "Laïcité et espace public",
    ],
    questions: [
      "Que prévoit la loi de 1905 ?",
      "Quelle différence entre neutralité de l'État et liberté des citoyens ?",
      "Comment la laïcité s'applique-t-elle à l'école ?",
      "Quels débats la laïcité suscite-t-elle ?",
    ],
    activity:
      "Distinguer trois situations relevant ou non de la laïcité.",
    keywords: ["laïcité", "1905", "neutralité", "liberté de conscience"],
  },
  {
    id: "inst-analyse-politiques-publiques",
    title: "Analyser une politique publique",
    category: "institutions",
    difficulty: "Avancé",
    duration: 30,
    objective: "Décomposer une politique publique et évaluer ses effets.",
    importance:
      "Analyser les politiques publiques est central pour les métiers de l'administration et de la culture.",
    keyConcepts: [
      "Cycle des politiques publiques",
      "Mise à l'agenda",
      "Acteurs et parties prenantes",
      "Instruments d'action",
      "Évaluation",
    ],
    questions: [
      "Quelles sont les étapes d'une politique publique ?",
      "Comment un problème arrive-t-il à l'agenda ?",
      "Qui sont les acteurs d'une politique culturelle ?",
      "Comment évaluer l'efficacité d'une politique ?",
    ],
    activity:
      "Choisir une politique culturelle locale et repérer ses acteurs et objectifs.",
    keywords: ["politiques publiques", "agenda", "évaluation", "acteurs"],
  },
  {
    id: "inst-subventions-publiques",
    title: "Comprendre les subventions publiques",
    category: "institutions",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Savoir comment fonctionnent les subventions publiques.",
    importance:
      "Les subventions financent une large part du secteur associatif et culturel.",
    keyConcepts: [
      "Subvention de fonctionnement et d'investissement",
      "Dossier de demande",
      "Conventionnement",
      "Compte rendu financier",
      "Contrôle et transparence",
    ],
    questions: [
      "Qui peut attribuer une subvention et pour quoi ?",
      "Que doit contenir un dossier de demande ?",
      "Qu'est-ce qu'un conventionnement pluriannuel ?",
      "Quelles obligations pour le bénéficiaire ?",
    ],
    activity:
      "Lister les pièces d'un dossier de subvention pour une association culturelle.",
    keywords: ["subvention", "convention", "association", "financement public"],
  },

  // ────────────────────────── Europe & international ─────────────────────────
  {
    id: "eu-fonctionnement-ue",
    title: "Comment fonctionne l'Union européenne",
    category: "europe-international",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre les institutions et décisions de l'UE.",
    importance:
      "L'UE influence lois, financements et politiques, y compris culturelles.",
    keyConcepts: [
      "Commission européenne",
      "Parlement européen",
      "Conseil de l'UE",
      "Procédure législative ordinaire",
      "Subsidiarité",
    ],
    questions: [
      "Quel rôle joue chaque institution ?",
      "Qui propose et qui adopte les textes européens ?",
      "Qu'est-ce que le principe de subsidiarité ?",
      "Comment l'UE finance-t-elle des projets ?",
    ],
    activity:
      "Associer trois décisions à l'institution européenne qui les porte.",
    keywords: ["Union européenne", "Commission", "Parlement européen", "subsidiarité"],
  },
  {
    id: "eu-histoire-construction",
    title: "L'histoire de la construction européenne",
    category: "europe-international",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Retracer les grandes étapes de la construction européenne.",
    importance:
      "Comprendre l'histoire de l'UE éclaire ses tensions et ses réussites actuelles.",
    keyConcepts: [
      "CECA et traité de Rome",
      "Élargissements",
      "Marché unique",
      "Traité de Maastricht",
      "Euro et zone Schengen",
    ],
    questions: [
      "Pourquoi l'Europe s'est-elle construite après 1945 ?",
      "Qu'a apporté le marché unique ?",
      "Que crée le traité de Maastricht ?",
      "Quels défis posent les élargissements ?",
    ],
    activity:
      "Placer cinq grandes dates de la construction européenne sur une frise.",
    keywords: ["CECA", "Maastricht", "euro", "Schengen"],
  },
  {
    id: "eu-monnaie-euro",
    title: "L'euro et la Banque centrale européenne",
    category: "europe-international",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre la monnaie unique et sa gouvernance.",
    importance:
      "L'euro affecte prix, taux et pouvoir d'achat de millions d'Européens.",
    keyConcepts: [
      "Zone euro",
      "BCE et politique monétaire",
      "Taux directeurs",
      "Inflation cible",
      "Critères de convergence",
    ],
    questions: [
      "Quel est le rôle de la BCE ?",
      "Comment la BCE agit-elle sur l'inflation ?",
      "Quels sont les avantages et limites d'une monnaie unique ?",
      "Que sont les critères de convergence ?",
    ],
    activity:
      "Suivre une décision récente de la BCE et son objectif.",
    keywords: ["euro", "BCE", "taux directeurs", "inflation"],
  },
  {
    id: "eu-organisations-internationales",
    title: "Les grandes organisations internationales",
    category: "europe-international",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Distinguer ONU, OTAN, FMI, OMC et leurs rôles.",
    importance:
      "Ces organisations structurent la coopération et les tensions mondiales.",
    keyConcepts: [
      "ONU et Conseil de sécurité",
      "OTAN",
      "FMI et Banque mondiale",
      "OMC",
      "Droit international",
    ],
    questions: [
      "Quel est le rôle de l'ONU ?",
      "Quelle différence entre FMI et Banque mondiale ?",
      "À quoi sert l'OMC ?",
      "Quelles sont les limites de ces organisations ?",
    ],
    activity:
      "Associer une actualité récente à l'organisation concernée.",
    keywords: ["ONU", "OTAN", "FMI", "OMC"],
  },
  {
    id: "eu-droits-humains",
    title: "Les droits humains et leur protection",
    category: "europe-international",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Connaître les grands textes et mécanismes des droits humains.",
    importance:
      "Les droits humains sont un socle des démocraties et un enjeu international.",
    keyConcepts: [
      "Déclaration universelle de 1948",
      "Convention européenne des droits de l'homme",
      "CEDH (Cour)",
      "Droits civils et sociaux",
      "Défenseur des droits",
    ],
    questions: [
      "Quelle est la portée de la Déclaration de 1948 ?",
      "Quel rôle joue la Cour européenne des droits de l'homme ?",
      "Comment un citoyen peut-il faire valoir ses droits ?",
      "Quels débats entourent l'universalité des droits ?",
    ],
    activity:
      "Repérer un article de la Déclaration de 1948 et un exemple concret d'application.",
    keywords: ["droits humains", "CEDH", "1948", "libertés"],
  },
  {
    id: "eu-politique-culturelle-europe",
    title: "La culture dans l'Union européenne",
    category: "europe-international",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre l'action de l'UE en matière de culture.",
    importance:
      "L'UE soutient la culture par des programmes utiles aux acteurs du secteur.",
    keyConcepts: [
      "Programme Europe créative",
      "Capitales européennes de la culture",
      "Diversité culturelle",
      "Exception culturelle",
      "Coopération transfrontalière",
    ],
    questions: [
      "Que finance le programme Europe créative ?",
      "Qu'est-ce qu'une capitale européenne de la culture ?",
      "Que signifie l'exception culturelle ?",
      "Comment monter un projet culturel européen ?",
    ],
    activity:
      "Explorer un appel à projets Europe créative et ses critères.",
    keywords: ["Europe créative", "exception culturelle", "coopération", "diversité"],
  },
  {
    id: "eu-actualite-internationale",
    title: "Décrypter l'actualité internationale",
    category: "europe-international",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Analyser une actualité internationale avec méthode.",
    importance:
      "Suivre l'actualité mondiale avec recul est utile aux concours et à la citoyenneté.",
    keyConcepts: [
      "Acteurs et intérêts",
      "Contexte historique",
      "Sources et angles",
      "Enjeux géopolitiques",
      "Conséquences",
    ],
    questions: [
      "Qui sont les acteurs et quels sont leurs intérêts ?",
      "Quel contexte historique éclaire l'événement ?",
      "Comment croiser plusieurs sources ?",
      "Quelles conséquences possibles ?",
    ],
    activity:
      "Choisir une actualité et la résumer selon la grille QQOQCP.",
    keywords: ["actualité", "international", "analyse", "QQOQCP"],
  },
  {
    id: "eu-commerce-mondial",
    title: "Le commerce mondial et la mondialisation",
    category: "europe-international",
    difficulty: "Avancé",
    duration: 30,
    objective: "Comprendre les flux et débats de la mondialisation.",
    importance:
      "La mondialisation façonne prix, emplois et rapports de force.",
    keyConcepts: [
      "Chaînes de valeur mondiales",
      "Libre-échange et protectionnisme",
      "Balance commerciale",
      "Dépendances stratégiques",
      "Relocalisation",
    ],
    questions: [
      "Qu'est-ce qu'une chaîne de valeur mondiale ?",
      "Quels arguments opposent libre-échange et protectionnisme ?",
      "Pourquoi certaines dépendances posent-elles problème ?",
      "Qu'apporte ou coûte une relocalisation ?",
    ],
    activity:
      "Retracer le parcours mondial d'un objet du quotidien.",
    keywords: ["mondialisation", "libre-échange", "chaînes de valeur", "protectionnisme"],
  },
  {
    id: "eu-citoyennete-europeenne",
    title: "La citoyenneté européenne",
    category: "europe-international",
    difficulty: "Débutant",
    duration: 10,
    objective: "Connaître ses droits en tant que citoyen européen.",
    importance:
      "La citoyenneté européenne confère des droits concrets, souvent méconnus.",
    keyConcepts: [
      "Libre circulation",
      "Droit de vote local et européen",
      "Protection consulaire",
      "Initiative citoyenne européenne",
      "Pétition au Parlement",
    ],
    questions: [
      "Quels droits donne la citoyenneté européenne ?",
      "Où un citoyen européen peut-il voter ?",
      "Qu'est-ce qu'une initiative citoyenne européenne ?",
      "Comment saisir le Parlement européen ?",
    ],
    activity:
      "Lister trois droits liés à la citoyenneté européenne utiles au quotidien.",
    keywords: ["citoyenneté européenne", "libre circulation", "droit de vote"],
  },

  // ─────────────────────────────── Économie ─────────────────────────────────
  {
    id: "eco-offre-demande",
    title: "L'offre, la demande et les prix",
    category: "economy",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre comment se forment les prix sur un marché.",
    importance:
      "Le mécanisme des prix est la base pour comprendre l'économie du quotidien.",
    keyConcepts: [
      "Loi de l'offre et de la demande",
      "Équilibre de marché",
      "Élasticité",
      "Pénurie et surplus",
      "Prix et signaux",
    ],
    questions: [
      "Comment se fixe un prix d'équilibre ?",
      "Que se passe-t-il en cas de pénurie ?",
      "Qu'est-ce que l'élasticité de la demande ?",
      "Pourquoi les prix varient-ils dans le temps ?",
    ],
    activity:
      "Expliquer la hausse d'un prix récent par l'offre et la demande.",
    keywords: ["marché", "offre", "demande", "prix"],
  },
  {
    id: "eco-pourquoi-prix-augmentent",
    title: "Pourquoi les prix augmentent (inflation)",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre l'inflation, ses causes et ses effets.",
    importance:
      "L'inflation affecte le pouvoir d'achat, l'épargne et les décisions politiques.",
    keyConcepts: [
      "Indice des prix",
      "Inflation par la demande / les coûts",
      "Pouvoir d'achat",
      "Spirale prix-salaires",
      "Politique monétaire",
    ],
    questions: [
      "Comment mesure-t-on l'inflation ?",
      "Quelles sont les principales causes de l'inflation ?",
      "Comment l'inflation érode-t-elle l'épargne ?",
      "Comment la combat-on ?",
    ],
    activity:
      "Comparer le prix d'un produit sur plusieurs années et calculer l'évolution.",
    keywords: ["inflation", "pouvoir d'achat", "indice des prix", "IPC"],
  },
  {
    id: "eco-pib-croissance",
    title: "Le PIB et la croissance",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre ce que mesure — et ne mesure pas — le PIB.",
    importance:
      "Le PIB oriente les politiques économiques ; en connaître les limites est essentiel.",
    keyConcepts: [
      "Produit intérieur brut",
      "Croissance et récession",
      "PIB par habitant",
      "Limites du PIB",
      "Indicateurs alternatifs",
    ],
    questions: [
      "Que mesure exactement le PIB ?",
      "Quelle différence entre croissance et développement ?",
      "Quelles activités le PIB ignore-t-il ?",
      "Quels indicateurs complètent le PIB ?",
    ],
    activity:
      "Lister trois choses utiles que le PIB ne mesure pas.",
    keywords: ["PIB", "croissance", "récession", "IDH"],
  },
  {
    id: "eco-chomage-emploi",
    title: "Comprendre le chômage",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les types de chômage et leur mesure.",
    importance:
      "Le chômage est un enjeu social et politique majeur, souvent mal compris.",
    keyConcepts: [
      "Chômage structurel et conjoncturel",
      "Taux de chômage (BIT)",
      "Population active",
      "Chômage frictionnel",
      "Politiques de l'emploi",
    ],
    questions: [
      "Comment mesure-t-on le taux de chômage ?",
      "Quelle différence entre chômage structurel et conjoncturel ?",
      "Qui fait partie de la population active ?",
      "Quels leviers pour réduire le chômage ?",
    ],
    activity:
      "Retrouver le dernier taux de chômage et son évolution récente.",
    keywords: ["chômage", "emploi", "population active", "BIT"],
  },
  {
    id: "eco-budget-etat",
    title: "Le budget de l'État",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre recettes, dépenses, déficit et dette publics.",
    importance:
      "Le budget de l'État conditionne les services publics et les grands arbitrages.",
    keyConcepts: [
      "Loi de finances",
      "Recettes fiscales",
      "Déficit public",
      "Dette publique",
      "Équilibre budgétaire",
    ],
    questions: [
      "Comment l'État se finance-t-il ?",
      "Quelle différence entre déficit et dette ?",
      "Qui vote le budget de l'État ?",
      "Pourquoi la dette publique fait-elle débat ?",
    ],
    activity:
      "Repérer les trois plus gros postes de dépense de l'État.",
    keywords: ["budget de l'État", "loi de finances", "déficit", "dette"],
  },
  {
    id: "eco-marches-financiers",
    title: "Les marchés financiers en bref",
    category: "economy",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre le rôle et le fonctionnement des marchés financiers.",
    importance:
      "Les marchés financent l'économie mais peuvent aussi l'ébranler.",
    keyConcepts: [
      "Actions et obligations",
      "Bourse",
      "Risque et rendement",
      "Spéculation",
      "Régulation",
    ],
    questions: [
      "Quelle différence entre action et obligation ?",
      "À quoi sert la Bourse pour les entreprises ?",
      "Pourquoi risque et rendement sont-ils liés ?",
      "Comment sont régulés les marchés ?",
    ],
    activity:
      "Suivre l'évolution d'un indice boursier sur une semaine.",
    keywords: ["Bourse", "actions", "obligations", "risque"],
  },
  {
    id: "eco-entreprise-fonctionnement",
    title: "Comment fonctionne une entreprise",
    category: "economy",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre l'organisation économique d'une entreprise.",
    importance:
      "Comprendre l'entreprise aide à s'y insérer et à créer son activité.",
    keyConcepts: [
      "Chiffre d'affaires et marge",
      "Charges fixes et variables",
      "Statuts juridiques",
      "Business model",
      "Parties prenantes",
    ],
    questions: [
      "Comment une entreprise crée-t-elle de la valeur ?",
      "Quelle différence entre chiffre d'affaires et bénéfice ?",
      "Comment choisir un statut juridique ?",
      "Qui sont les parties prenantes ?",
    ],
    activity:
      "Décrire le business model d'une entreprise que vous appréciez.",
    keywords: ["entreprise", "business model", "marge", "statut juridique"],
  },
  {
    id: "eco-consommation-responsable",
    title: "Consommer de façon éclairée",
    category: "economy",
    difficulty: "Débutant",
    duration: 20,
    objective: "Faire des choix de consommation informés et durables.",
    importance:
      "Nos choix de consommation ont un poids économique, social et écologique.",
    keyConcepts: [
      "Rapport qualité-prix",
      "Coût total de possession",
      "Obsolescence",
      "Économie circulaire",
      "Impact social",
    ],
    questions: [
      "Comment évaluer le vrai coût d'un achat ?",
      "Qu'est-ce que l'obsolescence programmée ?",
      "Comment consommer plus durablement ?",
      "Comment résister au marketing ?",
    ],
    activity:
      "Calculer le coût total de possession d'un objet sur sa durée de vie.",
    keywords: ["consommation", "économie circulaire", "obsolescence", "durabilité"],
  },
  {
    id: "eco-monnaie-histoire",
    title: "Qu'est-ce que la monnaie",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les fonctions et l'évolution de la monnaie.",
    importance:
      "La monnaie est un objet de confiance qui structure toute l'économie.",
    keyConcepts: [
      "Fonctions de la monnaie",
      "Monnaie fiduciaire et scripturale",
      "Confiance et cours légal",
      "Création monétaire",
      "Monnaies numériques",
    ],
    questions: [
      "Quelles sont les trois fonctions de la monnaie ?",
      "Qui crée la monnaie ?",
      "Pourquoi la monnaie repose-t-elle sur la confiance ?",
      "Qu'est-ce qu'une monnaie numérique de banque centrale ?",
    ],
    activity:
      "Expliquer pourquoi un billet a de la valeur.",
    keywords: ["monnaie", "confiance", "création monétaire", "cryptomonnaie"],
  },
  {
    id: "eco-impots-fiscalite",
    title: "À quoi servent les impôts",
    category: "economy",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre les grands types d'impôts et leur rôle.",
    importance:
      "L'impôt finance l'action publique et redistribue les richesses.",
    keyConcepts: [
      "Impôts directs et indirects",
      "TVA",
      "Progressivité",
      "Redistribution",
      "Consentement à l'impôt",
    ],
    questions: [
      "Quelle différence entre impôt direct et indirect ?",
      "Comment fonctionne la TVA ?",
      "Qu'est-ce qu'un impôt progressif ?",
      "Comment l'impôt redistribue-t-il ?",
    ],
    activity:
      "Repérer la part de TVA sur un ticket de caisse.",
    keywords: ["impôts", "TVA", "redistribution", "progressivité"],
  },
  {
    id: "eco-economie-culture",
    title: "L'économie de la culture",
    category: "economy",
    difficulty: "Avancé",
    duration: 30,
    objective: "Comprendre les spécificités économiques du secteur culturel.",
    importance:
      "La culture obéit à des logiques économiques particulières, essentielles au secteur.",
    keyConcepts: [
      "Biens culturels et externalités",
      "Maladie de Baumol",
      "Financement mixte",
      "Prototype et reproduction",
      "Valeur symbolique",
    ],
    questions: [
      "Pourquoi la culture peine-t-elle à s'autofinancer ?",
      "Qu'est-ce que la maladie de Baumol ?",
      "Comment se combinent financements public et privé ?",
      "Qu'est-ce qu'une externalité positive culturelle ?",
    ],
    activity:
      "Analyser le modèle économique d'une salle de spectacle.",
    keywords: ["économie de la culture", "Baumol", "financement", "externalités"],
  },
  {
    id: "eco-epargne-investissement",
    title: "Épargner et investir",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les bases de l'épargne et de l'investissement.",
    importance:
      "Bien épargner permet de sécuriser son avenir et de financer ses projets.",
    keyConcepts: [
      "Épargne de précaution",
      "Intérêts composés",
      "Diversification",
      "Risque et horizon",
      "Produits d'épargne",
    ],
    questions: [
      "Pourquoi les intérêts composés sont-ils puissants ?",
      "Comment diversifier pour limiter le risque ?",
      "Comment choisir selon son horizon de placement ?",
      "Quels produits pour débuter ?",
    ],
    activity:
      "Simuler la croissance d'une épargne mensuelle avec intérêts composés.",
    keywords: ["épargne", "investissement", "intérêts composés", "diversification"],
  },

  // ─────────────────────────── Société & sujets de société ──────────────────
  {
    id: "society-inegalites",
    title: "Comprendre les inégalités",
    category: "society",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Distinguer les formes d'inégalités et leurs mesures.",
    importance:
      "Les inégalités structurent la société et nourrissent les débats politiques.",
    keyConcepts: [
      "Inégalités de revenus et de patrimoine",
      "Mobilité sociale",
      "Coefficient de Gini",
      "Égalité des chances",
      "Discriminations",
    ],
    questions: [
      "Comment mesure-t-on les inégalités ?",
      "Quelle différence entre revenu et patrimoine ?",
      "Qu'est-ce que la mobilité sociale ?",
      "Égalité des chances ou des résultats ?",
    ],
    activity:
      "Comparer inégalités de revenus et de patrimoine à partir de données publiques.",
    keywords: ["inégalités", "Gini", "mobilité sociale", "redistribution"],
  },
  {
    id: "society-democratie",
    title: "Qu'est-ce que la démocratie",
    category: "society",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les principes et formes de la démocratie.",
    importance:
      "Comprendre la démocratie aide à en repérer les forces et les fragilités.",
    keyConcepts: [
      "Démocratie représentative et directe",
      "État de droit",
      "Séparation des pouvoirs",
      "Contre-pouvoirs",
      "Participation citoyenne",
    ],
    questions: [
      "Quels sont les principes d'une démocratie ?",
      "Pourquoi les contre-pouvoirs sont-ils essentiels ?",
      "Quelles formes de participation existent ?",
      "Qu'est-ce qui menace une démocratie ?",
    ],
    activity:
      "Identifier trois contre-pouvoirs à l'œuvre dans l'actualité.",
    keywords: ["démocratie", "État de droit", "contre-pouvoirs", "participation"],
  },
  {
    id: "society-egalite-femmes-hommes",
    title: "L'égalité entre les femmes et les hommes",
    category: "society",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les enjeux de l'égalité de genre.",
    importance:
      "L'égalité femmes-hommes est un enjeu de justice et d'efficacité sociale.",
    keyConcepts: [
      "Écart salarial",
      "Plafond de verre",
      "Charge mentale",
      "Stéréotypes de genre",
      "Parité",
    ],
    questions: [
      "Qu'est-ce que l'écart salarial et ses causes ?",
      "Qu'est-ce que le plafond de verre ?",
      "Comment agissent les stéréotypes ?",
      "Quels leviers pour plus d'égalité ?",
    ],
    activity:
      "Repérer un stéréotype de genre dans une publicité et le déconstruire.",
    keywords: ["égalité", "genre", "parité", "stéréotypes"],
  },
  {
    id: "society-immigration",
    title: "Comprendre les migrations",
    category: "society",
    difficulty: "Avancé",
    duration: 30,
    objective: "Distinguer les notions clés des migrations avec recul.",
    importance:
      "Les migrations sont un sujet complexe souvent réduit à des idées reçues.",
    keyConcepts: [
      "Migrant, réfugié, demandeur d'asile",
      "Immigration et émigration",
      "Intégration",
      "Solde migratoire",
      "Politiques migratoires",
    ],
    questions: [
      "Quelle différence entre réfugié et migrant économique ?",
      "Comment mesure-t-on les flux migratoires ?",
      "Qu'est-ce que l'intégration ?",
      "Quelles idées reçues déconstruire ?",
    ],
    activity:
      "Vérifier une statistique courante sur l'immigration à partir de sources fiables.",
    keywords: ["migrations", "asile", "intégration", "solde migratoire"],
  },
  {
    id: "society-travail-transformations",
    title: "Les transformations du travail",
    category: "society",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre comment le travail évolue aujourd'hui.",
    importance:
      "Le travail change vite : télétravail, plateformes, automatisation.",
    keyConcepts: [
      "Télétravail",
      "Ubérisation",
      "Automatisation",
      "Sens au travail",
      "Nouvelles formes d'emploi",
    ],
    questions: [
      "Quels effets du télétravail sur l'organisation ?",
      "Qu'est-ce que l'ubérisation ?",
      "Quels métiers l'automatisation transforme-t-elle ?",
      "Pourquoi la quête de sens progresse-t-elle ?",
    ],
    activity:
      "Décrire comment un métier a évolué en dix ans.",
    keywords: ["travail", "télétravail", "ubérisation", "automatisation"],
  },
  {
    id: "society-service-public-solidarite",
    title: "La protection sociale",
    category: "society",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le système de protection sociale français.",
    importance:
      "La protection sociale amortit les risques de la vie : maladie, chômage, retraite.",
    keyConcepts: [
      "Sécurité sociale",
      "Assurance et assistance",
      "Cotisations et prestations",
      "Retraite par répartition",
      "Solidarité",
    ],
    questions: [
      "Quelle différence entre assurance et assistance ?",
      "Comment fonctionne la retraite par répartition ?",
      "Que couvre la Sécurité sociale ?",
      "Comment est-elle financée ?",
    ],
    activity:
      "Repérer sur une fiche de paie les cotisations liées à la protection sociale.",
    keywords: ["Sécurité sociale", "protection sociale", "répartition", "solidarité"],
  },
  {
    id: "society-opinion-publique",
    title: "L'opinion publique et les sondages",
    category: "society",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Lire un sondage avec esprit critique.",
    importance:
      "Les sondages influencent le débat public ; savoir les lire évite les erreurs.",
    keyConcepts: [
      "Échantillon représentatif",
      "Marge d'erreur",
      "Formulation des questions",
      "Redressement",
      "Effet de contexte",
    ],
    questions: [
      "Qu'est-ce qu'un échantillon représentatif ?",
      "Que signifie une marge d'erreur ?",
      "Comment la question influence-t-elle la réponse ?",
      "Pourquoi se méfier d'un seul sondage ?",
    ],
    activity:
      "Analyser un sondage récent : échantillon, marge d'erreur, commanditaire.",
    keywords: ["sondage", "échantillon", "marge d'erreur", "opinion"],
  },
  {
    id: "society-engagement-citoyen",
    title: "S'engager dans la vie citoyenne",
    category: "society",
    difficulty: "Débutant",
    duration: 20,
    objective: "Découvrir les formes concrètes d'engagement citoyen.",
    importance:
      "L'engagement renforce le lien social et développe des compétences précieuses.",
    keyConcepts: [
      "Bénévolat et associations",
      "Service civique",
      "Participation locale",
      "Pétitions et débats",
      "Économie sociale et solidaire",
    ],
    questions: [
      "Quelles formes d'engagement s'offrent à moi ?",
      "Qu'est-ce que le service civique ?",
      "Comment participer aux décisions locales ?",
      "Qu'apporte l'engagement au parcours personnel ?",
    ],
    activity:
      "Repérer une association locale et une façon d'y contribuer.",
    keywords: ["engagement", "bénévolat", "service civique", "ESS"],
  },
  {
    id: "society-consommation-numerique-usages",
    title: "Les usages numériques dans la société",
    category: "society",
    difficulty: "Débutant",
    duration: 20,
    objective: "Analyser l'impact du numérique sur nos vies sociales.",
    importance:
      "Le numérique transforme relations, travail et démocratie : le questionner est utile.",
    keyConcepts: [
      "Fracture numérique",
      "Temps d'écran",
      "Réseaux et sociabilité",
      "Dépendance attentionnelle",
      "Inclusion numérique",
    ],
    questions: [
      "Qu'est-ce que la fracture numérique ?",
      "Comment les réseaux modifient-ils la sociabilité ?",
      "Quels effets du temps d'écran ?",
      "Comment favoriser l'inclusion numérique ?",
    ],
    activity:
      "Mesurer son temps d'écran sur une semaine et en tirer un constat.",
    keywords: ["numérique", "fracture numérique", "écrans", "sociabilité"],
  },
  {
    id: "society-generations",
    title: "Les rapports entre générations",
    category: "society",
    difficulty: "Débutant",
    duration: 10,
    objective: "Comprendre les enjeux intergénérationnels.",
    importance:
      "Vieillissement et solidarité entre générations sont des défis de société.",
    keyConcepts: [
      "Vieillissement démographique",
      "Solidarité intergénérationnelle",
      "Financement des retraites",
      "Transmission",
      "Clichés générationnels",
    ],
    questions: [
      "Quels effets du vieillissement démographique ?",
      "Comment se joue la solidarité entre générations ?",
      "Pourquoi les retraites font-elles débat ?",
      "Que valent les étiquettes générationnelles ?",
    ],
    activity:
      "Interroger une personne d'une autre génération sur son rapport au travail.",
    keywords: ["générations", "vieillissement", "retraites", "solidarité"],
  },

  // ────────────────────── Psychologie & développement personnel ─────────────
  {
    id: "psy-biais-cognitifs",
    title: "Les biais cognitifs",
    category: "psychology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Reconnaître les principaux biais qui faussent nos jugements.",
    importance:
      "Connaître ses biais améliore décisions, débats et esprit critique.",
    keyConcepts: [
      "Biais de confirmation",
      "Ancrage",
      "Effet de halo",
      "Biais de disponibilité",
      "Dissonance cognitive",
    ],
    questions: [
      "Qu'est-ce que le biais de confirmation ?",
      "Comment l'ancrage influence-t-il un prix ?",
      "Qu'est-ce que la dissonance cognitive ?",
      "Comment limiter ses biais ?",
    ],
    activity:
      "Repérer un biais dans une décision récente et le nommer.",
    keywords: ["biais cognitifs", "confirmation", "ancrage", "heuristiques"],
  },
  {
    id: "psy-emotions",
    title: "Comprendre et réguler ses émotions",
    category: "psychology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Identifier ses émotions et apprendre à les réguler.",
    importance:
      "Réguler ses émotions améliore relations, décisions et bien-être.",
    keyConcepts: [
      "Émotions primaires",
      "Fonction des émotions",
      "Régulation émotionnelle",
      "Intelligence émotionnelle",
      "Rumination",
    ],
    questions: [
      "À quoi servent les émotions ?",
      "Comment nommer précisément une émotion ?",
      "Quelles stratégies de régulation existent ?",
      "Comment sortir de la rumination ?",
    ],
    activity:
      "Tenir un court journal émotionnel pendant deux jours.",
    keywords: ["émotions", "régulation", "intelligence émotionnelle"],
  },
  {
    id: "psy-motivation",
    title: "Les ressorts de la motivation",
    category: "psychology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre ce qui déclenche et maintient la motivation.",
    importance:
      "Comprendre sa motivation aide à tenir ses objectifs dans la durée.",
    keyConcepts: [
      "Motivation intrinsèque et extrinsèque",
      "Théorie de l'autodétermination",
      "Objectifs et feedback",
      "Habitudes",
      "Procrastination",
    ],
    questions: [
      "Quelle différence entre motivation intrinsèque et extrinsèque ?",
      "Quels besoins nourrissent la motivation ?",
      "Comment transformer un objectif en habitude ?",
      "Comment relancer sa motivation ?",
    ],
    activity:
      "Reformuler un objectif pour le rendre plus motivant (autonomie, sens, progrès).",
    keywords: ["motivation", "autodétermination", "habitudes", "objectifs"],
  },
  {
    id: "psy-habitudes",
    title: "Créer de bonnes habitudes",
    category: "psychology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Mettre en place des habitudes durables.",
    importance:
      "Les habitudes façonnent le quotidien plus que la volonté ponctuelle.",
    keyConcepts: [
      "Boucle de l'habitude",
      "Déclencheur, routine, récompense",
      "Micro-habitudes",
      "Empilement d'habitudes",
      "Environnement",
    ],
    questions: [
      "Comment se forme une habitude ?",
      "Pourquoi commencer petit ?",
      "Comment associer une nouvelle habitude à une existante ?",
      "Comment rendre l'environnement favorable ?",
    ],
    activity:
      "Choisir une micro-habitude et l'ancrer après une routine existante.",
    keywords: ["habitudes", "routine", "déclencheur", "micro-habitude"],
  },
  {
    id: "psy-confiance-en-soi",
    title: "Développer la confiance en soi",
    category: "psychology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Renforcer sa confiance par des leviers concrets.",
    importance:
      "La confiance en soi soutient l'action, l'oral et les prises d'initiative.",
    keyConcepts: [
      "Estime de soi",
      "Sentiment d'efficacité personnelle",
      "Zone de confort",
      "Discours intérieur",
      "Petits succès",
    ],
    questions: [
      "Quelle différence entre estime et confiance en soi ?",
      "Comment le sentiment d'efficacité se construit-il ?",
      "Pourquoi sortir progressivement de sa zone de confort ?",
      "Comment transformer son discours intérieur ?",
    ],
    activity:
      "Noter trois réussites récentes et la compétence qu'elles révèlent.",
    keywords: ["confiance", "estime de soi", "efficacité", "zone de confort"],
  },
  {
    id: "psy-gestion-stress",
    title: "Gérer le stress au quotidien",
    category: "psychology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre le stress et disposer d'outils pour le réguler.",
    importance:
      "Un stress chronique nuit à la santé ; savoir le gérer est protecteur.",
    keyConcepts: [
      "Stress aigu et chronique",
      "Réponse combat-fuite",
      "Cohérence cardiaque",
      "Restructuration cognitive",
      "Récupération",
    ],
    questions: [
      "Quelle différence entre bon et mauvais stress ?",
      "Que se passe-t-il dans le corps sous stress ?",
      "Quelles techniques rapides pour se calmer ?",
      "Comment prévenir le stress chronique ?",
    ],
    activity:
      "Pratiquer 5 minutes de respiration et noter l'effet ressenti.",
    keywords: ["stress", "cohérence cardiaque", "récupération", "cognitif"],
  },
  {
    id: "psy-communication-relations",
    title: "Mieux communiquer avec les autres",
    category: "psychology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Améliorer ses relations par une meilleure communication.",
    importance:
      "La qualité des relations dépend largement de la façon de communiquer.",
    keyConcepts: [
      "Écoute active",
      "Reformulation",
      "Assertivité",
      "Feedback",
      "Empathie",
    ],
    questions: [
      "Qu'est-ce que l'écoute active ?",
      "Comment être assertif sans agressivité ?",
      "Comment donner un feedback utile ?",
      "Comment reformuler pour vérifier sa compréhension ?",
    ],
    activity:
      "Pratiquer la reformulation dans une conversation de la journée.",
    keywords: ["communication", "écoute active", "assertivité", "empathie"],
  },
  {
    id: "psy-procrastination",
    title: "Vaincre la procrastination",
    category: "psychology",
    difficulty: "Débutant",
    duration: 10,
    objective: "Comprendre pourquoi on procrastine et comment agir.",
    importance:
      "La procrastination coûte du temps et génère du stress évitable.",
    keyConcepts: [
      "Aversion à la tâche",
      "Gratification immédiate",
      "Découpage des tâches",
      "Règle des deux minutes",
      "Auto-compassion",
    ],
    questions: [
      "Pourquoi procrastine-t-on vraiment ?",
      "Comment démarrer une tâche difficile ?",
      "Qu'est-ce que la règle des deux minutes ?",
      "Pourquoi la culpabilité aggrave-t-elle le problème ?",
    ],
    activity:
      "Découper une tâche que vous repoussez en une première action de 2 minutes.",
    keywords: ["procrastination", "gratification", "découpage", "action"],
  },
  {
    id: "psy-apprendre-a-apprendre",
    title: "Apprendre à apprendre",
    category: "psychology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Adopter des stratégies d'apprentissage validées.",
    importance:
      "Savoir apprendre est la méta-compétence qui accélère toutes les autres.",
    keyConcepts: [
      "Métacognition",
      "Apprentissage actif",
      "Interleaving (alternance)",
      "Feedback",
      "État d'esprit de croissance",
    ],
    questions: [
      "Qu'est-ce que la métacognition ?",
      "Pourquoi l'apprentissage actif surpasse-t-il le passif ?",
      "Qu'apporte l'alternance des sujets ?",
      "Qu'est-ce qu'un état d'esprit de croissance ?",
    ],
    activity:
      "Après une session d'étude, s'auto-interroger sans regarder ses notes.",
    keywords: ["apprentissage", "métacognition", "growth mindset", "feedback"],
  },
  {
    id: "psy-prise-de-decision",
    title: "Mieux prendre ses décisions",
    category: "psychology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Structurer ses décisions importantes avec méthode.",
    importance:
      "De bonnes décisions se construisent avec méthode, pas seulement à l'intuition.",
    keyConcepts: [
      "Critères de décision",
      "Coûts d'opportunité",
      "Biais décisionnels",
      "Décision réversible ou non",
      "Pré-mortem",
    ],
    questions: [
      "Comment clarifier ses critères de choix ?",
      "Qu'est-ce qu'un coût d'opportunité ?",
      "Comment gérer l'incertitude ?",
      "Qu'est-ce qu'un pré-mortem ?",
    ],
    activity:
      "Faire un tableau de critères pondérés pour une décision en cours.",
    keywords: ["décision", "coût d'opportunité", "critères", "pré-mortem"],
  },
  {
    id: "psy-bien-etre",
    title: "Prendre soin de sa santé mentale",
    category: "psychology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Connaître les piliers d'un bon équilibre psychologique.",
    importance:
      "La santé mentale est aussi importante que la santé physique.",
    keyConcepts: [
      "Sommeil et activité physique",
      "Lien social",
      "Sens et valeurs",
      "Signaux d'alerte",
      "Demander de l'aide",
    ],
    questions: [
      "Quels sont les piliers du bien-être mental ?",
      "Quels signes doivent alerter ?",
      "Pourquoi le lien social est-il protecteur ?",
      "Vers qui se tourner en cas de mal-être ?",
    ],
    activity:
      "Identifier un pilier du bien-être à renforcer cette semaine.",
    keywords: ["santé mentale", "bien-être", "lien social", "prévention"],
  },

  // ─────────────────────────── Histoire & géopolitique ──────────────────────
  {
    id: "hist-revolution-francaise",
    title: "La Révolution française",
    category: "history-geopolitics",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre les causes et l'héritage de 1789.",
    importance:
      "La Révolution façonne encore nos institutions et nos valeurs.",
    keyConcepts: [
      "Ancien Régime",
      "Déclaration des droits de 1789",
      "Souveraineté nationale",
      "Terreur",
      "Héritage républicain",
    ],
    questions: [
      "Quelles sont les causes de la Révolution ?",
      "Que proclame la Déclaration de 1789 ?",
      "Comment la Révolution transforme-t-elle l'État ?",
      "Quel héritage en reste-t-il aujourd'hui ?",
    ],
    activity:
      "Relever trois principes de 1789 encore présents dans nos lois.",
    keywords: ["Révolution française", "1789", "droits de l'homme", "République"],
  },
  {
    id: "hist-guerres-mondiales",
    title: "Les deux guerres mondiales",
    category: "history-geopolitics",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Situer les causes et conséquences des guerres mondiales.",
    importance:
      "Ces conflits ont refaçonné le monde, ses frontières et ses institutions.",
    keyConcepts: [
      "Alliances et nationalismes",
      "Guerre totale",
      "Génocide et crimes contre l'humanité",
      "Bilan humain",
      "Nouvel ordre mondial",
    ],
    questions: [
      "Quelles causes mènent à la Première Guerre mondiale ?",
      "Qu'est-ce qu'une guerre totale ?",
      "Quelles conséquences après 1945 ?",
      "Comment naît l'ONU ?",
    ],
    activity:
      "Construire une frise des grandes dates de 1914 à 1945.",
    keywords: ["guerres mondiales", "1914", "1945", "ONU"],
  },
  {
    id: "hist-guerre-froide",
    title: "La Guerre froide",
    category: "history-geopolitics",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre la bipolarisation du monde après 1945.",
    importance:
      "La Guerre froide explique de nombreux équilibres géopolitiques actuels.",
    keyConcepts: [
      "Bloc de l'Est et de l'Ouest",
      "Dissuasion nucléaire",
      "Rideau de fer",
      "Décolonisation",
      "Chute du mur",
    ],
    questions: [
      "Qu'oppose les deux blocs ?",
      "Qu'est-ce que la dissuasion nucléaire ?",
      "Comment la Guerre froide touche-t-elle le reste du monde ?",
      "Que change la chute du mur en 1989 ?",
    ],
    activity:
      "Repérer un conflit périphérique de la Guerre froide et ses acteurs.",
    keywords: ["Guerre froide", "blocs", "dissuasion", "1989"],
  },
  {
    id: "hist-decolonisation",
    title: "La décolonisation",
    category: "history-geopolitics",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le processus et l'héritage de la décolonisation.",
    importance:
      "La décolonisation éclaire les relations Nord-Sud et de nombreux enjeux actuels.",
    keyConcepts: [
      "Empires coloniaux",
      "Mouvements d'indépendance",
      "Tiers-monde",
      "Néocolonialisme",
      "Mémoire coloniale",
    ],
    questions: [
      "Pourquoi les empires coloniaux s'effondrent-ils ?",
      "Quelles formes prend l'indépendance ?",
      "Qu'est-ce que le néocolonialisme ?",
      "Pourquoi la mémoire coloniale fait-elle débat ?",
    ],
    activity:
      "Choisir un pays et retracer les grandes étapes de son indépendance.",
    keywords: ["décolonisation", "indépendance", "tiers-monde", "mémoire"],
  },
  {
    id: "geo-notions-geopolitique",
    title: "Les notions clés de géopolitique",
    category: "history-geopolitics",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Maîtriser le vocabulaire de base de la géopolitique.",
    importance:
      "Un vocabulaire précis permet de mieux analyser les tensions mondiales.",
    keyConcepts: [
      "Puissance et soft power",
      "Souveraineté",
      "Sphère d'influence",
      "Ressources stratégiques",
      "Frontières et territoires",
    ],
    questions: [
      "Qu'est-ce que la puissance d'un État ?",
      "Quelle différence entre hard et soft power ?",
      "Qu'est-ce qu'une sphère d'influence ?",
      "Pourquoi les ressources sont-elles stratégiques ?",
    ],
    activity:
      "Analyser une actualité en identifiant puissances et intérêts en jeu.",
    keywords: ["géopolitique", "puissance", "soft power", "souveraineté"],
  },
  {
    id: "geo-energie-ressources",
    title: "Géopolitique de l'énergie",
    category: "history-geopolitics",
    difficulty: "Avancé",
    duration: 30,
    objective: "Comprendre le rôle de l'énergie dans les rapports de force.",
    importance:
      "L'énergie est au cœur des conflits, des alliances et de la transition.",
    keyConcepts: [
      "Pétrole et gaz",
      "Dépendances énergétiques",
      "Routes d'approvisionnement",
      "Transition et métaux critiques",
      "Souveraineté énergétique",
    ],
    questions: [
      "Pourquoi l'énergie est-elle un levier de pouvoir ?",
      "Quels risques posent les dépendances énergétiques ?",
      "En quoi la transition redistribue-t-elle les cartes ?",
      "Que sont les métaux critiques ?",
    ],
    activity:
      "Retracer l'origine de l'électricité que vous consommez.",
    keywords: ["énergie", "pétrole", "dépendance", "transition"],
  },
  {
    id: "geo-conflits-actuels",
    title: "Comprendre un conflit contemporain",
    category: "history-geopolitics",
    difficulty: "Avancé",
    duration: 30,
    objective: "Analyser un conflit avec une grille de lecture rigoureuse.",
    importance:
      "Décrypter un conflit évite les simplifications et la désinformation.",
    keyConcepts: [
      "Acteurs et alliances",
      "Causes profondes et déclencheurs",
      "Enjeux territoriaux et économiques",
      "Rôle des puissances extérieures",
      "Droit international",
    ],
    questions: [
      "Qui sont les acteurs et leurs objectifs ?",
      "Quelles sont les causes profondes ?",
      "Quel rôle jouent les grandes puissances ?",
      "Comment vérifier l'information en zone de conflit ?",
    ],
    activity:
      "Analyser un conflit actuel avec la grille acteurs / causes / enjeux.",
    keywords: ["conflit", "géopolitique", "acteurs", "droit international"],
  },
  {
    id: "hist-france-contemporaine",
    title: "La France depuis 1945",
    category: "history-geopolitics",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Retracer les grandes évolutions de la France contemporaine.",
    importance:
      "Comprendre la France d'aujourd'hui suppose d'en connaître l'histoire récente.",
    keyConcepts: [
      "Trente Glorieuses",
      "Ve République",
      "Construction européenne",
      "Mutations sociales",
      "Mondialisation",
    ],
    questions: [
      "Que sont les Trente Glorieuses ?",
      "Comment naît la Ve République ?",
      "Quelles grandes mutations sociales depuis 1945 ?",
      "Comment la France s'insère-t-elle dans la mondialisation ?",
    ],
    activity:
      "Interroger un proche sur un changement majeur vécu depuis 1945.",
    keywords: ["France", "Trente Glorieuses", "Ve République", "mutations"],
  },
  {
    id: "geo-puissances-emergentes",
    title: "Les puissances émergentes",
    category: "history-geopolitics",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre la montée des nouvelles puissances mondiales.",
    importance:
      "L'émergence de nouvelles puissances redessine l'ordre mondial.",
    keyConcepts: [
      "BRICS",
      "Multipolarité",
      "Puissances régionales",
      "Développement et rattrapage",
      "Nouvelles routes commerciales",
    ],
    questions: [
      "Qu'est-ce qu'une puissance émergente ?",
      "Que représentent les BRICS ?",
      "Qu'est-ce qu'un monde multipolaire ?",
      "Quels défis pour ces puissances ?",
    ],
    activity:
      "Comparer deux puissances émergentes sur leurs atouts et fragilités.",
    keywords: ["émergents", "BRICS", "multipolarité", "puissance"],
  },
  {
    id: "hist-patrimoine",
    title: "Le patrimoine et sa protection",
    category: "history-geopolitics",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre ce qu'est le patrimoine et comment il est protégé.",
    importance:
      "Le patrimoine relie mémoire, territoire et attractivité culturelle.",
    keyConcepts: [
      "Patrimoine matériel et immatériel",
      "Monuments historiques",
      "UNESCO",
      "Restauration",
      "Valorisation",
    ],
    questions: [
      "Quelle différence entre patrimoine matériel et immatériel ?",
      "Comment un bien devient-il monument historique ?",
      "Quel rôle joue l'UNESCO ?",
      "Comment valoriser un patrimoine local ?",
    ],
    activity:
      "Identifier un élément de patrimoine près de chez soi et son statut.",
    keywords: ["patrimoine", "UNESCO", "monuments", "valorisation"],
  },

  // ─────────────────────────── Écologie & environnement ─────────────────────
  {
    id: "eco2-changement-climatique",
    title: "Comprendre le changement climatique",
    category: "ecology",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre les mécanismes et enjeux du réchauffement.",
    importance:
      "Le climat est le défi du siècle : le comprendre est indispensable pour agir.",
    keyConcepts: [
      "Effet de serre",
      "Gaz à effet de serre",
      "GIEC",
      "Scénarios de réchauffement",
      "Atténuation et adaptation",
    ],
    questions: [
      "Comment fonctionne l'effet de serre ?",
      "Quels sont les principaux gaz à effet de serre ?",
      "Que dit le GIEC ?",
      "Quelle différence entre atténuation et adaptation ?",
    ],
    activity:
      "Estimer son empreinte carbone avec un simulateur en ligne.",
    keywords: ["climat", "effet de serre", "GIEC", "carbone"],
    sourceSuggestions: ["Rapports du GIEC", "ADEME"],
  },
  {
    id: "eco2-biodiversite",
    title: "La biodiversité et son érosion",
    category: "ecology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre la biodiversité et les causes de son déclin.",
    importance:
      "La biodiversité soutient nos écosystèmes, notre alimentation et notre santé.",
    keyConcepts: [
      "Écosystèmes et services écosystémiques",
      "Chaîne alimentaire",
      "Causes d'érosion",
      "Espèces menacées",
      "Aires protégées",
    ],
    questions: [
      "Qu'est-ce qu'un service écosystémique ?",
      "Quelles sont les causes de l'érosion de la biodiversité ?",
      "Pourquoi la biodiversité est-elle vitale pour l'humain ?",
      "Comment la protéger ?",
    ],
    activity:
      "Repérer une espèce locale menacée et la cause de sa fragilité.",
    keywords: ["biodiversité", "écosystèmes", "extinction", "protection"],
  },
  {
    id: "eco2-energies-renouvelables",
    title: "Les énergies renouvelables",
    category: "ecology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les sources d'énergie renouvelable et leurs enjeux.",
    importance:
      "La transition énergétique passe par un bon usage des renouvelables.",
    keyConcepts: [
      "Solaire et éolien",
      "Hydraulique et biomasse",
      "Intermittence",
      "Stockage",
      "Mix énergétique",
    ],
    questions: [
      "Quelles sont les principales énergies renouvelables ?",
      "Qu'est-ce que l'intermittence et comment la gérer ?",
      "Pourquoi le stockage est-il crucial ?",
      "Qu'est-ce qu'un mix énergétique équilibré ?",
    ],
    activity:
      "Comparer deux sources renouvelables sur leurs avantages et limites.",
    keywords: ["renouvelables", "solaire", "éolien", "mix énergétique"],
  },
  {
    id: "eco2-empreinte-carbone",
    title: "Réduire son empreinte carbone",
    category: "ecology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Identifier les leviers efficaces pour réduire son impact.",
    importance:
      "Agir efficacement suppose de connaître les gestes qui comptent vraiment.",
    keyConcepts: [
      "Empreinte carbone",
      "Transport et alimentation",
      "Logement et énergie",
      "Consommation",
      "Gestes à fort impact",
    ],
    questions: [
      "Quels postes pèsent le plus dans l'empreinte ?",
      "Quels gestes ont le plus d'impact ?",
      "Comment éviter le greenwashing personnel ?",
      "Individuel ou collectif : où agir ?",
    ],
    activity:
      "Choisir un geste à fort impact à adopter ce mois-ci.",
    keywords: ["empreinte carbone", "transport", "alimentation", "sobriété"],
  },
  {
    id: "eco2-economie-circulaire",
    title: "L'économie circulaire",
    category: "ecology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le passage du linéaire au circulaire.",
    importance:
      "L'économie circulaire réduit déchets et pression sur les ressources.",
    keyConcepts: [
      "Réduire, réutiliser, recycler",
      "Écoconception",
      "Réparation",
      "Réemploi",
      "Cycle de vie",
    ],
    questions: [
      "Quelle différence entre économie linéaire et circulaire ?",
      "Qu'est-ce que l'écoconception ?",
      "Pourquoi la réparation est-elle centrale ?",
      "Comment analyser le cycle de vie d'un produit ?",
    ],
    activity:
      "Trouver un objet à réparer ou réemployer plutôt qu'à jeter.",
    keywords: ["économie circulaire", "recyclage", "réemploi", "écoconception"],
  },
  {
    id: "eco2-eau-ressource",
    title: "L'eau, une ressource sous tension",
    category: "ecology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les enjeux de la ressource en eau.",
    importance:
      "L'eau devient un enjeu majeur de santé, d'agriculture et de conflits.",
    keyConcepts: [
      "Cycle de l'eau",
      "Stress hydrique",
      "Usages (agricole, industriel, domestique)",
      "Pollution",
      "Gestion partagée",
    ],
    questions: [
      "Comment fonctionne le cycle de l'eau ?",
      "Qu'est-ce que le stress hydrique ?",
      "Quels sont les principaux usages de l'eau ?",
      "Comment mieux partager la ressource ?",
    ],
    activity:
      "Estimer sa consommation d'eau quotidienne et un poste à réduire.",
    keywords: ["eau", "stress hydrique", "cycle de l'eau", "ressource"],
  },
  {
    id: "eco2-alimentation-durable",
    title: "Vers une alimentation durable",
    category: "ecology",
    difficulty: "Débutant",
    duration: 20,
    objective: "Comprendre l'impact de l'alimentation sur l'environnement.",
    importance:
      "L'alimentation pèse lourd sur le climat, l'eau et la biodiversité.",
    keyConcepts: [
      "Empreinte alimentaire",
      "Circuits courts",
      "Saisonnalité",
      "Gaspillage alimentaire",
      "Protéines végétales",
    ],
    questions: [
      "Quels aliments ont le plus fort impact ?",
      "Qu'apportent les circuits courts ?",
      "Comment réduire le gaspillage alimentaire ?",
      "Comment diversifier ses sources de protéines ?",
    ],
    activity:
      "Composer un repas à faible empreinte avec des produits de saison.",
    keywords: ["alimentation durable", "circuits courts", "saison", "gaspillage"],
  },
  {
    id: "eco2-transition-ecologique",
    title: "La transition écologique",
    category: "ecology",
    difficulty: "Avancé",
    duration: 30,
    objective: "Comprendre les leviers et débats de la transition écologique.",
    importance:
      "La transition transforme économie, emplois et territoires.",
    keyConcepts: [
      "Sobriété et efficacité",
      "Découplage",
      "Transition juste",
      "Financement",
      "Résistances au changement",
    ],
    questions: [
      "Quelle différence entre sobriété et efficacité ?",
      "Qu'est-ce que le découplage ?",
      "Pourquoi parler de transition juste ?",
      "Comment financer la transition ?",
    ],
    activity:
      "Identifier un métier créé ou transformé par la transition.",
    keywords: ["transition", "sobriété", "transition juste", "découplage"],
  },
  {
    id: "eco2-culture-ecoresponsable",
    title: "Événements culturels écoresponsables",
    category: "ecology",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Réduire l'empreinte d'un événement ou lieu culturel.",
    importance:
      "Le secteur culturel s'engage dans l'écoresponsabilité, un atout professionnel.",
    keyConcepts: [
      "Bilan carbone d'un événement",
      "Mobilité du public",
      "Énergie et matériel",
      "Restauration et déchets",
      "Éco-communication",
    ],
    questions: [
      "Quels postes pèsent dans l'empreinte d'un festival ?",
      "Comment réduire l'impact de la mobilité du public ?",
      "Comment gérer déchets et restauration ?",
      "Qu'est-ce qu'une éco-communication ?",
    ],
    activity:
      "Proposer trois mesures écoresponsables pour un événement culturel.",
    keywords: ["événement", "écoresponsable", "bilan carbone", "culture"],
  },

  // ─────────────────────────── Médias & numérique ───────────────────────────
  {
    id: "media-desinformation",
    title: "Médias et désinformation",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les mécanismes de la désinformation.",
    importance:
      "La désinformation menace le débat démocratique : la comprendre, c'est s'en prémunir.",
    keyConcepts: [
      "Fake news et infox",
      "Désinformation vs mésinformation",
      "Bulles de filtres",
      "Deepfakes",
      "Éducation aux médias",
    ],
    questions: [
      "Quelle différence entre désinformation et mésinformation ?",
      "Comment se propagent les fausses informations ?",
      "Qu'est-ce qu'un deepfake ?",
      "Comment développer son éducation aux médias ?",
    ],
    activity:
      "Analyser la propagation d'une infox récente et ses ressorts.",
    keywords: ["désinformation", "fake news", "deepfake", "EMI"],
  },
  {
    id: "media-comment-fonctionne-internet",
    title: "Comment fonctionne Internet",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre l'architecture de base d'Internet.",
    importance:
      "Comprendre Internet aide à mieux l'utiliser et à en saisir les enjeux.",
    keyConcepts: [
      "Réseaux et protocoles (IP)",
      "Serveurs et clients",
      "DNS",
      "Web vs Internet",
      "Neutralité du net",
    ],
    questions: [
      "Quelle différence entre le Web et Internet ?",
      "Que se passe-t-il quand on tape une adresse ?",
      "À quoi sert le DNS ?",
      "Qu'est-ce que la neutralité du net ?",
    ],
    activity:
      "Décrire les étapes du chargement d'une page web.",
    keywords: ["Internet", "IP", "DNS", "neutralité du net"],
  },
  {
    id: "media-intelligence-artificielle",
    title: "Comprendre l'intelligence artificielle",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre ce qu'est l'IA et ce qu'elle n'est pas.",
    importance:
      "L'IA transforme le travail, la culture et l'information : la comprendre est crucial.",
    keyConcepts: [
      "Apprentissage automatique",
      "Données d'entraînement",
      "IA générative",
      "Limites et biais",
      "Usages responsables",
    ],
    questions: [
      "Comment un modèle d'IA apprend-il ?",
      "Qu'est-ce que l'IA générative ?",
      "Quelles sont les limites de l'IA ?",
      "Comment utiliser l'IA de façon responsable ?",
    ],
    activity:
      "Tester un outil d'IA et repérer une erreur ou un biais.",
    keywords: ["intelligence artificielle", "machine learning", "IA générative", "biais"],
  },
  {
    id: "media-algorithmes-recommandation",
    title: "Les algorithmes de recommandation",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre comment les plateformes orientent nos contenus.",
    importance:
      "Les algorithmes façonnent notre information, notre culture et notre attention.",
    keyConcepts: [
      "Personnalisation",
      "Économie de l'attention",
      "Bulles de filtres",
      "Engagement",
      "Modération",
    ],
    questions: [
      "Comment un algorithme choisit-il ce que je vois ?",
      "Qu'est-ce que l'économie de l'attention ?",
      "Comment se forment les bulles de filtres ?",
      "Comment reprendre la main sur son fil ?",
    ],
    activity:
      "Observer son fil d'actualité et deviner les critères de l'algorithme.",
    keywords: ["algorithmes", "recommandation", "attention", "plateformes"],
  },
  {
    id: "media-donnees-personnelles",
    title: "Les données personnelles et leur valeur",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre l'économie des données personnelles.",
    importance:
      "Nos données alimentent un marché puissant qu'il faut comprendre pour se protéger.",
    keyConcepts: [
      "Traceurs et cookies",
      "Profilage",
      "Modèle publicitaire",
      "RGPD",
      "Anonymisation",
    ],
    questions: [
      "Pourquoi les données ont-elles de la valeur ?",
      "Comment fonctionne le profilage publicitaire ?",
      "Que protège le RGPD ?",
      "Comment limiter la collecte de ses données ?",
    ],
    activity:
      "Consulter les paramètres de confidentialité d'une application utilisée.",
    keywords: ["données personnelles", "cookies", "profilage", "RGPD"],
  },
  {
    id: "media-liberte-presse",
    title: "La liberté de la presse",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le rôle et les enjeux d'une presse libre.",
    importance:
      "Une presse libre est un pilier de la démocratie et un contre-pouvoir.",
    keyConcepts: [
      "Contre-pouvoir",
      "Indépendance éditoriale",
      "Concentration des médias",
      "Déontologie journalistique",
      "Protection des sources",
    ],
    questions: [
      "Pourquoi la presse est-elle un contre-pouvoir ?",
      "Quels risques pose la concentration des médias ?",
      "Qu'est-ce que la déontologie journalistique ?",
      "Pourquoi protéger les sources ?",
    ],
    activity:
      "Comparer le traitement d'une même actualité par deux médias.",
    keywords: ["liberté de la presse", "contre-pouvoir", "déontologie", "indépendance"],
  },
  {
    id: "media-reseaux-sociaux",
    title: "Bien utiliser les réseaux sociaux",
    category: "media-digital",
    difficulty: "Débutant",
    duration: 20,
    objective: "Adopter un usage lucide et sain des réseaux sociaux.",
    importance:
      "Les réseaux influencent humeur, information et image : mieux vaut les maîtriser.",
    keyConcepts: [
      "Fonctionnement des plateformes",
      "Comparaison sociale",
      "Empreinte numérique",
      "Cyberharcèlement",
      "Hygiène numérique",
    ],
    questions: [
      "Comment les réseaux captent-ils l'attention ?",
      "Qu'est-ce que la comparaison sociale ?",
      "Comment gérer son empreinte numérique ?",
      "Que faire face au cyberharcèlement ?",
    ],
    activity:
      "Fixer une règle d'usage (temps, notifications) et l'essayer une semaine.",
    keywords: ["réseaux sociaux", "attention", "empreinte numérique", "cyberharcèlement"],
  },
  {
    id: "media-cybersecurite",
    title: "Les bases de la cybersécurité",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Adopter les bons réflexes de sécurité numérique.",
    importance:
      "La cybersécurité protège nos comptes, notre argent et nos données.",
    keyConcepts: [
      "Menaces courantes",
      "Mises à jour",
      "Sauvegardes",
      "Réseaux Wi-Fi publics",
      "Ingénierie sociale",
    ],
    questions: [
      "Quelles sont les principales menaces ?",
      "Pourquoi les mises à jour sont-elles importantes ?",
      "Comment sécuriser ses sauvegardes ?",
      "Qu'est-ce que l'ingénierie sociale ?",
    ],
    activity:
      "Vérifier que ses appareils sont à jour et sauvegarder un dossier important.",
    keywords: ["cybersécurité", "sauvegarde", "mises à jour", "ingénierie sociale"],
  },
  {
    id: "media-numerique-responsable",
    title: "Le numérique responsable",
    category: "media-digital",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre l'impact environnemental du numérique.",
    importance:
      "Le numérique a une empreinte écologique croissante, souvent invisible.",
    keyConcepts: [
      "Empreinte du numérique",
      "Data centers",
      "Fabrication des appareils",
      "Sobriété numérique",
      "Durée de vie",
    ],
    questions: [
      "D'où vient l'empreinte écologique du numérique ?",
      "Pourquoi la fabrication pèse-t-elle autant ?",
      "Qu'est-ce que la sobriété numérique ?",
      "Comment prolonger la vie de ses appareils ?",
    ],
    activity:
      "Faire le tri dans ses fichiers et prolonger l'usage d'un appareil.",
    keywords: ["numérique responsable", "data center", "sobriété", "empreinte"],
  },
  {
    id: "media-education-image",
    title: "Lire et décrypter une image",
    category: "media-digital",
    difficulty: "Débutant",
    duration: 20,
    objective: "Analyser une image et repérer ses intentions.",
    importance:
      "Les images orientent l'opinion : savoir les lire est une compétence clé.",
    keyConcepts: [
      "Cadrage et angle",
      "Contexte et légende",
      "Retouche et montage",
      "Symbolique",
      "Source",
    ],
    questions: [
      "Comment le cadrage oriente-t-il le message ?",
      "Pourquoi le contexte est-il essentiel ?",
      "Comment repérer une image retouchée ?",
      "Comment retrouver la source d'une image ?",
    ],
    activity:
      "Analyser une image d'actualité : cadrage, contexte, source.",
    keywords: ["image", "cadrage", "montage", "décryptage"],
  },
  {
    id: "media-ia-et-culture",
    title: "IA et création culturelle",
    category: "media-digital",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre les enjeux de l'IA pour la création.",
    importance:
      "L'IA générative bouscule les métiers créatifs et le droit d'auteur.",
    keyConcepts: [
      "IA générative (texte, image, son)",
      "Droit d'auteur et données",
      "Métiers créatifs",
      "Authenticité",
      "Cadre éthique",
    ],
    questions: [
      "Comment l'IA générative crée-t-elle des contenus ?",
      "Quels enjeux de droit d'auteur pose-t-elle ?",
      "Comment évoluent les métiers créatifs ?",
      "Comment garantir transparence et éthique ?",
    ],
    activity:
      "Comparer une création humaine et une génération IA sur un même thème.",
    keywords: ["IA générative", "création", "droit d'auteur", "éthique"],
  },

  // ─────────────────────────── Culture & spectacle ──────────────────────────
  {
    id: "cult-politiques-culturelles",
    title: "Les politiques culturelles en France",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre l'organisation des politiques culturelles publiques.",
    importance:
      "Les politiques culturelles structurent le secteur et ses financements.",
    keyConcepts: [
      "Ministère de la Culture",
      "DRAC",
      "Compétences des collectivités",
      "Démocratisation culturelle",
      "Droits culturels",
    ],
    questions: [
      "Qui décide des politiques culturelles ?",
      "Quel rôle jouent les DRAC ?",
      "Qu'est-ce que la démocratisation culturelle ?",
      "Que sont les droits culturels ?",
    ],
    activity:
      "Identifier un dispositif culturel public dans sa région et son financeur.",
    keywords: ["politique culturelle", "DRAC", "démocratisation", "droits culturels"],
    sourceSuggestions: ["culture.gouv.fr"],
  },
  {
    id: "cult-financement-culture",
    title: "Le financement de la culture",
    category: "cultural-sector",
    difficulty: "Avancé",
    duration: 30,
    objective: "Cartographier les sources de financement d'un projet culturel.",
    importance:
      "Savoir financer un projet est une compétence centrale des métiers culturels.",
    keyConcepts: [
      "Subventions publiques",
      "Billetterie et recettes propres",
      "Mécénat et partenariats",
      "Coproductions",
      "Modèle économique mixte",
    ],
    questions: [
      "Quelles sont les grandes sources de financement ?",
      "Comment équilibrer recettes propres et subventions ?",
      "Qu'apporte une coproduction ?",
      "Comment bâtir un budget prévisionnel ?",
    ],
    activity:
      "Esquisser le plan de financement d'un petit projet culturel.",
    keywords: ["financement", "subvention", "mécénat", "budget prévisionnel"],
  },
  {
    id: "cult-gestion-salle-spectacle",
    title: "Gérer une salle de spectacle",
    category: "cultural-sector",
    difficulty: "Avancé",
    duration: 30,
    objective: "Comprendre le fonctionnement d'un lieu de spectacle.",
    importance:
      "Administrer une salle mobilise juridique, technique, humain et financier.",
    keyConcepts: [
      "Exploitation et programmation",
      "Sécurité (ERP)",
      "Équipe technique et administrative",
      "Jauge et billetterie",
      "Licences d'entrepreneur de spectacle",
    ],
    questions: [
      "Quels métiers font vivre une salle ?",
      "Qu'est-ce qu'un ERP et ses obligations ?",
      "Comment fonctionne la billetterie et la jauge ?",
      "À quoi servent les licences d'entrepreneur de spectacle ?",
    ],
    activity:
      "Lister les fonctions clés nécessaires pour faire tourner une salle.",
    keywords: ["salle de spectacle", "ERP", "programmation", "licences"],
  },
  {
    id: "cult-production-evenement",
    title: "Produire un événement culturel",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Suivre les étapes de production d'un événement.",
    importance:
      "La production d'événement est au cœur des métiers de la culture.",
    keyConcepts: [
      "Faisabilité et budget",
      "Planning et logistique",
      "Contrats et cachets",
      "Communication",
      "Bilan",
    ],
    questions: [
      "Quelles sont les grandes étapes de production ?",
      "Comment évaluer la faisabilité d'un projet ?",
      "Quels contrats prévoir avec les artistes ?",
      "Comment faire un bilan utile ?",
    ],
    activity:
      "Établir le rétroplanning d'un petit événement à trois mois.",
    keywords: ["production", "événement", "logistique", "rétroplanning"],
  },
  {
    id: "cult-budget-culturel",
    title: "Construire un budget culturel",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Élaborer un budget prévisionnel équilibré.",
    importance:
      "Un budget maîtrisé conditionne la viabilité d'un projet culturel.",
    keyConcepts: [
      "Charges et produits",
      "Budget prévisionnel",
      "Point mort",
      "Trésorerie",
      "Bilan financier",
    ],
    questions: [
      "Comment structurer un budget prévisionnel ?",
      "Qu'est-ce que le point mort d'un spectacle ?",
      "Pourquoi surveiller la trésorerie ?",
      "Comment ajuster un budget en cours de projet ?",
    ],
    activity:
      "Construire un budget simple avec charges, produits et point mort.",
    keywords: ["budget", "prévisionnel", "point mort", "trésorerie"],
  },
  {
    id: "cult-mecenat",
    title: "Le mécénat culturel",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le mécénat et ses mécanismes.",
    importance:
      "Le mécénat est un levier de financement de plus en plus important.",
    keyConcepts: [
      "Mécénat vs parrainage",
      "Réduction fiscale",
      "Contreparties",
      "Fondations",
      "Mécénat de compétences",
    ],
    questions: [
      "Quelle différence entre mécénat et sponsoring ?",
      "Quel avantage fiscal pour le mécène ?",
      "Que sont les contreparties autorisées ?",
      "Qu'est-ce que le mécénat de compétences ?",
    ],
    activity:
      "Imaginer une offre de mécénat pour un projet culturel local.",
    keywords: ["mécénat", "parrainage", "fiscalité", "fondation"],
  },
  {
    id: "cult-droits-auteur",
    title: "Le droit d'auteur",
    category: "cultural-sector",
    difficulty: "Avancé",
    duration: 30,
    objective: "Comprendre les bases du droit d'auteur.",
    importance:
      "Le droit d'auteur protège les créateurs et encadre l'usage des œuvres.",
    keyConcepts: [
      "Droit moral et patrimonial",
      "Œuvre de l'esprit",
      "Cession de droits",
      "Domaine public",
      "SACEM et sociétés de gestion",
    ],
    questions: [
      "Quelle différence entre droit moral et patrimonial ?",
      "Qu'est-ce qui est protégeable ?",
      "Comment fonctionne une cession de droits ?",
      "Quel rôle jouent la SACEM et la SACD ?",
    ],
    activity:
      "Vérifier si une œuvre est dans le domaine public et pourquoi.",
    keywords: ["droit d'auteur", "droit moral", "SACEM", "domaine public"],
  },
  {
    id: "cult-contrats-spectacle",
    title: "Les contrats du spectacle",
    category: "cultural-sector",
    difficulty: "Avancé",
    duration: 20,
    objective: "Distinguer les principaux contrats du spectacle vivant.",
    importance:
      "Les contrats sécurisent les relations entre lieux, producteurs et artistes.",
    keyConcepts: [
      "Contrat de cession",
      "Contrat de coréalisation",
      "Contrat de coproduction",
      "Contrat d'engagement",
      "Obligations réciproques",
    ],
    questions: [
      "Qu'est-ce qu'un contrat de cession ?",
      "Quelle différence avec une coréalisation ?",
      "Quand recourir à une coproduction ?",
      "Quelles clauses vérifier avant de signer ?",
    ],
    activity:
      "Associer trois situations au type de contrat adapté.",
    keywords: ["contrats", "cession", "coréalisation", "spectacle vivant"],
  },
  {
    id: "cult-intermittence",
    title: "Le régime de l'intermittence",
    category: "cultural-sector",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre le régime des intermittents du spectacle.",
    importance:
      "L'intermittence structure l'emploi artistique et technique en France.",
    keyConcepts: [
      "Annexes 8 et 10",
      "Heures et seuils",
      "Cachets",
      "Indemnisation",
      "Employeurs multiples",
    ],
    questions: [
      "Qui relève de l'intermittence ?",
      "Quelles conditions pour être indemnisé ?",
      "Qu'est-ce qu'un cachet ?",
      "Pourquoi ce régime fait-il débat ?",
    ],
    activity:
      "Expliquer avec ses mots le principe des annexes 8 et 10.",
    keywords: ["intermittence", "annexes 8 et 10", "cachets", "indemnisation"],
  },
  {
    id: "cult-mediation-culturelle",
    title: "La médiation culturelle",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le rôle et les outils de la médiation culturelle.",
    importance:
      "La médiation relie œuvres et publics : un métier clé de la culture.",
    keyConcepts: [
      "Accès et appropriation",
      "Publics empêchés / éloignés",
      "Dispositifs de médiation",
      "Éducation artistique",
      "Évaluation de l'impact",
    ],
    questions: [
      "À quoi sert la médiation culturelle ?",
      "Qui sont les publics éloignés de la culture ?",
      "Quels outils de médiation existent ?",
      "Comment évaluer une action de médiation ?",
    ],
    activity:
      "Imaginer une action de médiation pour rendre une œuvre accessible.",
    keywords: ["médiation", "publics", "éducation artistique", "accès"],
  },
  {
    id: "cult-gestion-des-publics",
    title: "Connaître et développer ses publics",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre et élargir les publics d'un lieu culturel.",
    importance:
      "Développer les publics est vital pour la viabilité et la mission d'un lieu.",
    keyConcepts: [
      "Segmentation des publics",
      "Fidélisation",
      "Non-publics",
      "Données de billetterie",
      "Accessibilité",
    ],
    questions: [
      "Comment segmenter ses publics ?",
      "Qu'est-ce qu'un non-public ?",
      "Comment fidéliser un spectateur ?",
      "Comment utiliser les données de billetterie ?",
    ],
    activity:
      "Proposer une action pour attirer un public absent d'un lieu culturel.",
    keywords: ["publics", "fidélisation", "non-public", "billetterie"],
  },
  {
    id: "cult-communication-culturelle",
    title: "La communication culturelle",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Concevoir une communication efficace pour un projet culturel.",
    importance:
      "Une bonne communication remplit les salles et fait vivre les projets.",
    keyConcepts: [
      "Plan de communication",
      "Cibles et messages",
      "Relations presse",
      "Réseaux sociaux",
      "Identité visuelle",
    ],
    questions: [
      "Comment définir ses cibles et messages ?",
      "Quels canaux privilégier selon le public ?",
      "Comment travailler avec la presse ?",
      "Comment mesurer l'efficacité d'une campagne ?",
    ],
    activity:
      "Rédiger un plan de communication simple pour un événement.",
    keywords: ["communication", "relations presse", "cibles", "identité visuelle"],
  },
  {
    id: "cult-democratisation-culturelle",
    title: "La démocratisation culturelle",
    category: "cultural-sector",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre l'enjeu de l'accès de tous à la culture.",
    importance:
      "La démocratisation culturelle est un objectif historique des politiques publiques.",
    keyConcepts: [
      "Accès à la culture",
      "Démocratisation vs démocratie culturelle",
      "Inégalités d'accès",
      "Pratiques culturelles",
      "Droits culturels",
    ],
    questions: [
      "Quelle différence entre démocratisation et démocratie culturelle ?",
      "Pourquoi l'accès reste-t-il inégal ?",
      "Quels dispositifs favorisent l'accès ?",
      "Que changent les droits culturels ?",
    ],
    activity:
      "Identifier un frein d'accès à la culture et une solution possible.",
    keywords: ["démocratisation", "accès", "droits culturels", "inégalités"],
  },
  {
    id: "cult-industries-creatives",
    title: "Les industries culturelles et créatives",
    category: "cultural-sector",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre le poids et la diversité des ICC.",
    importance:
      "Les industries créatives pèsent lourd dans l'économie et l'emploi.",
    keyConcepts: [
      "Musique, cinéma, édition, jeu vidéo",
      "Chaîne de valeur",
      "Numérisation",
      "Modèles économiques",
      "Emploi culturel",
    ],
    questions: [
      "Que recouvrent les industries culturelles et créatives ?",
      "Comment le numérique a-t-il transformé ces secteurs ?",
      "Quels modèles économiques dominent ?",
      "Quel poids économique représentent-elles ?",
    ],
    activity:
      "Retracer la chaîne de valeur d'un bien culturel (album, film, livre).",
    keywords: ["industries créatives", "ICC", "chaîne de valeur", "numérisation"],
  },

  // ─────────────────────────── Management & travail ─────────────────────────
  {
    id: "mgmt-gestion-de-projet",
    title: "Les bases de la gestion de projet",
    category: "management-work",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Structurer un projet du cadrage à la clôture.",
    importance:
      "La gestion de projet est une compétence transversale très recherchée.",
    keyConcepts: [
      "Cadrage et objectifs",
      "Périmètre et livrables",
      "Planning (Gantt)",
      "Gestion des risques",
      "Suivi et clôture",
    ],
    questions: [
      "Comment cadrer un projet ?",
      "Qu'est-ce que le triangle qualité-coût-délai ?",
      "Comment anticiper les risques ?",
      "Que contient un bilan de clôture ?",
    ],
    activity:
      "Rédiger la note de cadrage d'un projet en une page.",
    keywords: ["gestion de projet", "Gantt", "risques", "cadrage"],
  },
  {
    id: "mgmt-management-equipe",
    title: "Manager une équipe",
    category: "management-work",
    difficulty: "Intermédiaire",
    duration: 30,
    objective: "Comprendre les fondamentaux du management d'équipe.",
    importance:
      "Bien manager améliore performance, engagement et bien-être.",
    keyConcepts: [
      "Styles de management",
      "Délégation",
      "Feedback",
      "Motivation",
      "Gestion des conflits",
    ],
    questions: [
      "Quels sont les principaux styles de management ?",
      "Comment déléguer efficacement ?",
      "Comment donner un feedback constructif ?",
      "Comment désamorcer un conflit d'équipe ?",
    ],
    activity:
      "Préparer un feedback positif et un axe d'amélioration pour un collègue.",
    keywords: ["management", "délégation", "feedback", "conflits"],
  },
  {
    id: "mgmt-ressources-humaines",
    title: "Les bases des ressources humaines",
    category: "management-work",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Comprendre les grandes missions RH.",
    importance:
      "Comprendre les RH aide à s'insérer et à gérer une équipe.",
    keyConcepts: [
      "Recrutement",
      "Contrats de travail",
      "Formation",
      "Rémunération",
      "Dialogue social",
    ],
    questions: [
      "Quelles sont les grandes missions RH ?",
      "Quels sont les principaux types de contrats ?",
      "Pourquoi la formation est-elle stratégique ?",
      "Qu'est-ce que le dialogue social ?",
    ],
    activity:
      "Comparer CDI, CDD et contrat de projet sur leurs usages.",
    keywords: ["RH", "recrutement", "contrats", "dialogue social"],
  },
  {
    id: "mgmt-gestion-planning",
    title: "Gérer les plannings et le temps de travail",
    category: "management-work",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Organiser des plannings efficaces et conformes.",
    importance:
      "Un bon planning garantit continuité de service et respect du droit.",
    keyConcepts: [
      "Temps de travail et repos",
      "Annualisation",
      "Roulements",
      "Absences et remplacements",
      "Outils de planification",
    ],
    questions: [
      "Quelles règles encadrent le temps de travail ?",
      "Comment organiser des roulements équitables ?",
      "Comment gérer les absences imprévues ?",
      "Quels outils facilitent la planification ?",
    ],
    activity:
      "Construire un planning hebdomadaire fictif d'une petite équipe.",
    keywords: ["planning", "temps de travail", "roulement", "organisation"],
  },
  {
    id: "mgmt-reunion-efficace",
    title: "Animer une réunion efficace",
    category: "management-work",
    difficulty: "Débutant",
    duration: 10,
    objective: "Préparer et conduire des réunions utiles.",
    importance:
      "Des réunions bien menées font gagner du temps et de l'engagement.",
    keyConcepts: [
      "Ordre du jour",
      "Objectif et durée",
      "Répartition de la parole",
      "Décisions et relevé",
      "Suivi",
    ],
    questions: [
      "Quand une réunion est-elle vraiment nécessaire ?",
      "Comment structurer un ordre du jour ?",
      "Comment favoriser la participation ?",
      "Comment assurer le suivi des décisions ?",
    ],
    activity:
      "Rédiger l'ordre du jour et l'objectif d'une réunion à venir.",
    keywords: ["réunion", "ordre du jour", "décisions", "animation"],
  },
  {
    id: "mgmt-droit-du-travail",
    title: "Notions essentielles de droit du travail",
    category: "management-work",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Connaître ses droits et devoirs au travail.",
    importance:
      "Connaître le droit du travail protège salarié comme employeur.",
    keyConcepts: [
      "Contrat de travail",
      "Durée du travail et congés",
      "Rupture du contrat",
      "Représentation du personnel",
      "Convention collective",
    ],
    questions: [
      "Que contient un contrat de travail ?",
      "Quelles sont les règles de congés ?",
      "Quels sont les modes de rupture d'un contrat ?",
      "À quoi sert une convention collective ?",
    ],
    activity:
      "Retrouver la convention collective d'un secteur qui vous intéresse.",
    keywords: ["droit du travail", "contrat", "congés", "convention collective"],
  },
  {
    id: "mgmt-organisation-personnelle",
    title: "Organiser efficacement son travail",
    category: "management-work",
    difficulty: "Débutant",
    duration: 20,
    objective: "Gagner en efficacité personnelle au quotidien.",
    importance:
      "Une bonne organisation réduit le stress et améliore les résultats.",
    keyConcepts: [
      "Priorisation",
      "To-do list et GTD",
      "Traitement des e-mails",
      "Concentration",
      "Revue hebdomadaire",
    ],
    questions: [
      "Comment prioriser ses tâches ?",
      "Qu'est-ce que la méthode GTD ?",
      "Comment gérer sa boîte mail sans se noyer ?",
      "Pourquoi faire une revue hebdomadaire ?",
    ],
    activity:
      "Faire une revue de la semaine et planifier trois priorités.",
    keywords: ["organisation", "GTD", "priorisation", "productivité"],
  },
  {
    id: "mgmt-leadership",
    title: "Développer son leadership",
    category: "management-work",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre ce qui fait un leadership efficace.",
    importance:
      "Le leadership mobilise et fédère au-delà de l'autorité hiérarchique.",
    keyConcepts: [
      "Vision et exemplarité",
      "Leadership vs autorité",
      "Confiance",
      "Prise de décision",
      "Intelligence collective",
    ],
    questions: [
      "Quelle différence entre leadership et autorité ?",
      "Comment inspirer confiance ?",
      "Comment décider en incertitude ?",
      "Comment mobiliser l'intelligence collective ?",
    ],
    activity:
      "Identifier un leader qui vous inspire et trois qualités à cultiver.",
    keywords: ["leadership", "vision", "confiance", "intelligence collective"],
  },
  {
    id: "mgmt-conduite-changement",
    title: "Accompagner le changement",
    category: "management-work",
    difficulty: "Avancé",
    duration: 20,
    objective: "Comprendre comment mener une transformation.",
    importance:
      "Les organisations changent en permanence : accompagner le changement est clé.",
    keyConcepts: [
      "Résistances au changement",
      "Communication",
      "Parties prenantes",
      "Étapes du changement",
      "Ancrage",
    ],
    questions: [
      "Pourquoi résiste-t-on au changement ?",
      "Comment impliquer les parties prenantes ?",
      "Quelles étapes pour réussir un changement ?",
      "Comment ancrer durablement une transformation ?",
    ],
    activity:
      "Analyser un changement vécu et ce qui a facilité ou freiné l'adhésion.",
    keywords: ["changement", "transformation", "résistances", "adhésion"],
  },
  {
    id: "mgmt-monde-du-travail",
    title: "Comprendre le monde du travail",
    category: "management-work",
    difficulty: "Débutant",
    duration: 20,
    objective: "Se repérer dans les codes et acteurs du travail.",
    importance:
      "Connaître les codes du travail facilite l'intégration professionnelle.",
    keyConcepts: [
      "Organigramme et rôles",
      "Culture d'entreprise",
      "Codes implicites",
      "Représentants du personnel",
      "Évolution professionnelle",
    ],
    questions: [
      "Comment lire un organigramme ?",
      "Qu'est-ce qu'une culture d'entreprise ?",
      "Quels sont les codes implicites au travail ?",
      "Comment faire évoluer sa carrière ?",
    ],
    activity:
      "Décrire la culture d'une organisation que vous connaissez.",
    keywords: ["monde du travail", "culture d'entreprise", "codes", "carrière"],
  },

  // ─────────────────────────────── Langues ──────────────────────────────────
  {
    id: "lang-methode-apprendre-langue",
    title: "Méthode pour apprendre une langue",
    category: "languages",
    difficulty: "Débutant",
    duration: 20,
    objective: "Adopter une méthode efficace d'apprentissage des langues.",
    importance:
      "Une bonne méthode accélère nettement les progrès en langue.",
    keyConcepts: [
      "Immersion et exposition",
      "Vocabulaire fréquent",
      "Répétition espacée",
      "Production orale",
      "Régularité",
    ],
    questions: [
      "Pourquoi privilégier le vocabulaire fréquent ?",
      "Comment s'exposer à la langue au quotidien ?",
      "Pourquoi produire tôt à l'oral ?",
      "Comment rester régulier ?",
    ],
    activity:
      "Mettre en place 15 minutes quotidiennes d'exposition à une langue.",
    keywords: ["langues", "immersion", "vocabulaire", "régularité"],
  },
  {
    id: "lang-anglais-pro",
    title: "L'anglais professionnel",
    category: "languages",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Maîtriser l'anglais utile en contexte professionnel.",
    importance:
      "L'anglais professionnel ouvre des opportunités et facilite les échanges.",
    keyConcepts: [
      "E-mails formels",
      "Réunions et small talk",
      "Vocabulaire métier",
      "Présentations",
      "Faux amis",
    ],
    questions: [
      "Comment rédiger un e-mail professionnel en anglais ?",
      "Quelles formules pour animer une réunion ?",
      "Comment se présenter efficacement ?",
      "Quels faux amis éviter ?",
    ],
    activity:
      "Rédiger un court e-mail professionnel en anglais.",
    keywords: ["anglais", "professionnel", "e-mail", "présentation"],
  },
  {
    id: "lang-espagnol-bases",
    title: "Les bases de l'espagnol",
    category: "languages",
    difficulty: "Débutant",
    duration: 20,
    objective: "Acquérir les fondamentaux pour communiquer en espagnol.",
    importance:
      "L'espagnol est parlé par des centaines de millions de personnes.",
    keyConcepts: [
      "Salutations et présentations",
      "Présent de l'indicatif",
      "Ser et estar",
      "Vocabulaire de base",
      "Prononciation",
    ],
    questions: [
      "Comment se présenter en espagnol ?",
      "Quelle différence entre ser et estar ?",
      "Comment conjuguer au présent ?",
      "Quelles règles de prononciation retenir ?",
    ],
    activity:
      "Apprendre dix phrases utiles pour un voyage en Espagne.",
    keywords: ["espagnol", "ser/estar", "présent", "vocabulaire"],
  },
  {
    id: "lang-comprehension-orale",
    title: "Progresser en compréhension orale",
    category: "languages",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Améliorer sa compréhension d'une langue à l'oral.",
    importance:
      "La compréhension orale est souvent le point faible des apprenants.",
    keyConcepts: [
      "Écoute active",
      "Podcasts et vidéos",
      "Sous-titres",
      "Écoute répétée",
      "Repérage des mots clés",
    ],
    questions: [
      "Comment choisir un support adapté à son niveau ?",
      "Faut-il utiliser les sous-titres ?",
      "Comment travailler l'écoute répétée ?",
      "Comment gérer le débit rapide ?",
    ],
    activity:
      "Écouter un court extrait deux fois et noter les mots compris.",
    keywords: ["compréhension orale", "écoute", "podcasts", "sous-titres"],
  },
  {
    id: "lang-expression-ecrite",
    title: "Améliorer son expression écrite en langue",
    category: "languages",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Écrire plus clairement dans une langue étrangère.",
    importance:
      "L'écrit est essentiel pour candidatures, examens et vie professionnelle.",
    keyConcepts: [
      "Connecteurs logiques",
      "Structures de phrase",
      "Registres de langue",
      "Relecture",
      "Erreurs fréquentes",
    ],
    questions: [
      "Quels connecteurs pour structurer un texte ?",
      "Comment adapter le registre au contexte ?",
      "Comment se relire efficacement ?",
      "Quelles erreurs fréquentes corriger ?",
    ],
    activity:
      "Écrire un court paragraphe et le relire à l'aide d'une grille.",
    keywords: ["expression écrite", "connecteurs", "registre", "relecture"],
  },
  {
    id: "lang-vocabulaire-strategies",
    title: "Enrichir son vocabulaire",
    category: "languages",
    difficulty: "Débutant",
    duration: 10,
    objective: "Mémoriser durablement du vocabulaire nouveau.",
    importance:
      "Le vocabulaire est le carburant de la compréhension et de l'expression.",
    keyConcepts: [
      "Familles de mots",
      "Contexte et exemples",
      "Cartes mémoire",
      "Répétition espacée",
      "Réemploi",
    ],
    questions: [
      "Pourquoi apprendre les mots en contexte ?",
      "Comment utiliser des cartes mémoire ?",
      "Comment réemployer un mot nouveau ?",
      "Combien de mots viser par jour ?",
    ],
    activity:
      "Apprendre cinq mots nouveaux et les réutiliser dans des phrases.",
    keywords: ["vocabulaire", "cartes mémoire", "contexte", "réemploi"],
  },
  {
    id: "lang-prononciation",
    title: "Travailler sa prononciation",
    category: "languages",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "Améliorer sa prononciation et son intonation.",
    importance:
      "Une bonne prononciation facilite la compréhension mutuelle.",
    keyConcepts: [
      "Phonèmes spécifiques",
      "Accent tonique",
      "Intonation",
      "Shadowing",
      "Enregistrement de soi",
    ],
    questions: [
      "Quels sons sont difficiles pour un francophone ?",
      "Qu'est-ce que le shadowing ?",
      "Pourquoi s'enregistrer ?",
      "Comment travailler l'accent tonique ?",
    ],
    activity:
      "Pratiquer le shadowing sur un extrait de 30 secondes.",
    keywords: ["prononciation", "shadowing", "intonation", "accent"],
  },
  {
    id: "lang-preparer-certification",
    title: "Préparer une certification de langue",
    category: "languages",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "S'organiser pour réussir un test de langue (TOEIC, DELE...).",
    importance:
      "Une certification valorise le CV et objective le niveau.",
    keyConcepts: [
      "Cadre européen (CECRL)",
      "Format des épreuves",
      "Entraînement chronométré",
      "Points faibles",
      "Stratégies de test",
    ],
    questions: [
      "Que signifient les niveaux du CECRL (A1 à C2) ?",
      "Comment analyser le format d'un test ?",
      "Pourquoi s'entraîner en temps limité ?",
      "Comment cibler ses points faibles ?",
    ],
    activity:
      "Faire un test blanc partiel et repérer une compétence à renforcer.",
    keywords: ["certification", "CECRL", "TOEIC", "stratégies"],
  },
];

/** Index par id pour un accès O(1). */
export const TOPIC_BY_ID: Record<string, LearningTopic> = Object.fromEntries(
  TOPICS.map((topic) => [topic.id, topic]),
);

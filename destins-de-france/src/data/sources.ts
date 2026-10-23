import type { ScientificSource } from '../engine/types';

/**
 * Registre documentaire, version des données 2026-10-23.
 *
 * Transparence sur la vérification : dans l'environnement de développement de la
 * v0.1, la recherche web était disponible mais la lecture directe de insee.fr et
 * legifrance.gouv.fr était bloquée par le réseau. Les valeurs ci-dessous ont été
 * relevées dans les extraits de pages officielles renvoyés par le moteur de
 * recherche, et recoupées quand c'était possible. Chaque fiche le précise dans
 * `verificationNote`. Une relecture humaine sur les documents originaux est
 * prévue (voir docs/METHODOLOGIE.md).
 */
export const DATA_VERSION = '2026-10-23.v0.1';

const CHECKED = '2026-10-23';
const SEARCH_NOTE =
  "Valeur relevée dans l'extrait de la page officielle fourni par un moteur de recherche le 23/10/2026 ; page originale non consultée directement (accès réseau bloqué). À relire sur le document source.";
const MEMORY_NOTE =
  "Règle juridique connue et stable, non revérifiée en ligne dans cette session. À confirmer sur Légifrance avant toute publication.";

export const SOURCES: ScientificSource[] = [
  {
    id: 'insee-naissances-2025',
    theme: 'demographie',
    subject: 'Naissances',
    indicator: 'Nombre de naissances vivantes en 2025',
    value: '645 000 (estimation provisoire) ; 643 773 (donnée définitive publiée ensuite)',
    unit: 'naissances',
    geography: 'France',
    population: 'Naissances vivantes',
    period: 'Année 2025',
    publicationDate: '2026 (bilan démographique, janvier ; données définitives ensuite)',
    producer: 'Insee',
    documentTitle: 'Bilan démographique 2025 (Insee Première n° 2087) ; Les naissances en 2025 (Insee Focus n° 383)',
    url: 'https://www.insee.fr/fr/statistiques/8719824',
    method: "Statistiques d'état civil et estimations. Les chiffres provisoires du bilan sont révisés lors de la publication définitive.",
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "Total national : ne dit rien de la répartition entre territoires ni des conditions de vie des familles. Les naissances baissent depuis plusieurs années ; 2026 peut différer.",
    plainExplanation:
      "Environ 645 000 bébés sont nés en France en 2025. C'est le point de départ du jeu : chaque partie tire un de ces destins possibles, au sens où le lieu de naissance suit (en partie) la répartition réelle des naissances.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'elevee',
    status: 'statistique',
  },
  {
    id: 'insee-esperance-vie-2025',
    theme: 'demographie',
    subject: 'Mortalité',
    indicator: 'Espérance de vie à la naissance en 2025',
    value: 'Femmes : 85,9 ans ; hommes : 80,3 ans',
    unit: 'années',
    geography: 'France',
    population: 'Ensemble de la population',
    period: 'Année 2025',
    publicationDate: 'Janvier 2026',
    producer: 'Insee',
    documentTitle: 'Bilan démographique 2025 (Insee Première n° 2087)',
    url: 'https://www.insee.fr/fr/statistiques/8719824',
    method:
      "Espérance de vie « du moment » : durée de vie moyenne d'une génération fictive qui connaîtrait toute sa vie les taux de mortalité par âge observés en 2025.",
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "Ce n'est pas une prévision pour les enfants nés en 2026 : leur durée de vie dépendra de l'évolution future de la mortalité. Ce n'est pas non plus l'âge auquel une personne précise mourra.",
    plainExplanation:
      "Le jeu règle son modèle de mortalité pour que, en moyenne sur beaucoup de vies, la durée de vie corresponde à ces espérances de vie de 2025. Une vie particulière peut être bien plus courte ou plus longue.",
    controversy:
      "Les écarts d'espérance de vie selon le niveau de vie ou la catégorie sociale sont documentés par l'Insee, mais ils ne sont pas encore intégrés au modèle de la v0.1.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'elevee',
    status: 'statistique',
  },
  {
    id: 'insee-fecondite-2025',
    theme: 'demographie',
    subject: 'Fécondité',
    indicator: 'Indicateur conjoncturel de fécondité 2025',
    value: '1,56 enfant par femme',
    unit: 'enfants par femme',
    geography: 'France',
    population: 'Femmes de 15 à 50 ans',
    period: 'Année 2025',
    publicationDate: 'Janvier 2026',
    producer: 'Insee',
    documentTitle: 'Bilan démographique 2025 (Insee Première n° 2087)',
    url: 'https://www.insee.fr/fr/statistiques/8719824',
    method: "Somme des taux de fécondité par âge observés l'année considérée.",
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "Indicateur du moment, pas le nombre d'enfants qu'aura chaque femme. Le jeu ne l'utilise pas pour décider des naissances : la parentalité y reste un choix narratif.",
    plainExplanation:
      "En 2025, la fécondité a atteint son niveau le plus bas depuis la fin de la Première Guerre mondiale selon l'Insee. Dans le jeu, avoir ou non des enfants n'est jamais une pénalité.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'elevee',
    status: 'statistique',
  },
  {
    id: 'insee-idf-naissances-2025',
    theme: 'territoires',
    subject: 'Naissances par région',
    indicator: 'Naissances en Île-de-France en 2025',
    value: '148 300',
    unit: 'naissances',
    geography: 'Île-de-France',
    population: 'Naissances vivantes',
    period: 'Année 2025 (provisoire)',
    publicationDate: '2026',
    producer: 'Insee Île-de-France',
    documentTitle: 'Bilan démographique 2025 en Île-de-France (Insee Flash Île-de-France)',
    url: 'https://www.insee.fr/fr/statistiques/8970303',
    method: "État civil, données provisoires. Rapporté au total national (645 000), cela donne environ 23 % des naissances.",
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "Le rapport 148 300 / 645 000 est un calcul du jeu à partir de deux chiffres provisoires. Les autres régions n'ont pas pu être renseignées dans cette version.",
    plainExplanation:
      "Près d'un bébé sur quatre naît en Île-de-France. Le jeu respecte cette proportion. Pour les autres régions, les poids sont encore provisoires (voir la fiche « Paramètres de démonstration »).",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'moyenne',
    status: 'statistique',
  },
  {
    id: 'insee-reunion-naissances-2025',
    theme: 'territoires',
    subject: 'Naissances par région',
    indicator: 'Naissances à La Réunion',
    value: '11 790 ; fécondité 2,14 enfants par femme',
    unit: 'naissances',
    geography: 'La Réunion',
    population: 'Naissances vivantes',
    period: 'Année 2025 (selon l\'extrait consulté)',
    publicationDate: '2026',
    producer: 'Insee La Réunion-Mayotte',
    documentTitle: 'Bilan démographique de La Réunion (Insee Flash Réunion)',
    url: 'https://www.insee.fr/fr/statistiques/8745404',
    method: 'État civil.',
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "L'année exacte couverte par l'extrait reste à confirmer sur la page originale. Les autres territoires ultramarins ne sont pas encore représentés dans le jeu, faute de données rassemblées.",
    plainExplanation:
      "La Réunion est le seul territoire ultramarin de la v0.1. Les autres (Guadeloupe, Martinique, Guyane, Mayotte...) seront ajoutés quand leur documentation sera prête, plutôt que d'être représentés approximativement.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'a_confirmer',
    status: 'statistique',
  },
  {
    id: 'insee-pauvrete-2023',
    theme: 'revenus',
    subject: 'Niveau de vie et pauvreté',
    indicator: 'Niveau de vie médian et taux de pauvreté monétaire 2023',
    value: 'Médiane : 25 760 € par an et par unité de consommation (≈ 2 150 €/mois) ; seuil de pauvreté à 60 % : 1 288 €/mois ; taux de pauvreté : 15,4 %',
    unit: 'euros, %',
    geography: 'France métropolitaine',
    population: 'Personnes vivant dans un logement ordinaire',
    period: 'Revenus 2023',
    publicationDate: 'Juillet 2025',
    producer: 'Insee',
    documentTitle: 'Insee Première n° 2063 — niveaux de vie et pauvreté en 2023',
    url: 'https://www.insee.fr/fr/statistiques/8600989',
    method:
      "Enquête Revenus fiscaux et sociaux (ERFS). Le niveau de vie est le revenu disponible du ménage divisé par le nombre d'unités de consommation.",
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "Champ métropolitain, logements ordinaires (hors sans-abri, maisons de retraite...). Euros 2023, non actualisés en euros 2026 dans le jeu. Le revenu ne mesure ni le patrimoine ni le bien-être.",
    plainExplanation:
      "La moitié des personnes vivent avec moins de 2 150 € par mois (pour une personne seule). En dessous de 1 288 €, on parle de pauvreté monétaire : c'était le cas de 15,4 % des personnes en 2023, un record depuis 1996 selon l'Insee.",
    controversy:
      "Le seuil à 60 % de la médiane est une convention européenne ; d'autres mesures (pauvreté en conditions de vie, seuil à 50 %) donnent des résultats différents.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'elevee',
    status: 'statistique',
  },
  {
    id: 'smic-2026',
    theme: 'revenus',
    subject: 'Salaire minimum',
    indicator: 'Smic au 1er janvier 2026',
    value: '12,02 € brut de l\'heure ; 1 823,03 € brut par mois (35 h) ; environ 1 443 € net (estimation)',
    unit: 'euros',
    geography: 'France (hors Mayotte, régime spécifique)',
    population: 'Salariés',
    period: 'Depuis le 1er janvier 2026',
    publicationDate: 'Décembre 2025',
    producer: 'Gouvernement (décret de revalorisation)',
    documentTitle: 'Le Smic revalorisé au 1er janvier 2026',
    url: 'https://www.info.gouv.fr/actualite/le-smic-revalorise-au-1er-janvier-2026',
    method: 'Revalorisation réglementaire annuelle (+1,18 % au 1er janvier 2026).',
    license: 'Information publique.',
    limits:
      "Le montant net dépend de la situation de chaque salarié. Le jeu exprime les salaires futurs en « euros 2026 » : il ne prévoit ni l'inflation ni les revalorisations futures.",
    plainExplanation:
      "Le Smic sert d'étalon pour les salaires du jeu. Les autres salaires sont exprimés en multiples du Smic : ces multiples sont des paramètres de démonstration, pas des données observées.",
    lastChecked: CHECKED,
    verificationNote:
      "Relevé dans les extraits de info.gouv.fr et de deux sources secondaires concordantes le 23/10/2026 ; page de service-public.fr non consultée.",
    confidence: 'elevee',
    status: 'verifie',
  },
  {
    id: 'insee-chomage-t2-2026',
    theme: 'emploi',
    subject: 'Chômage',
    indicator: 'Taux de chômage au sens du BIT, 2e trimestre 2026',
    value: '8,3 % de la population active (2,7 millions de personnes)',
    unit: '%',
    geography: 'France (Mayotte incluse)',
    population: 'Population active de 15 ans ou plus',
    period: '2e trimestre 2026',
    publicationDate: '7 août 2026',
    producer: 'Insee',
    documentTitle: 'Informations Rapides n° 192 — Chômage au 2e trimestre 2026',
    url: 'https://www.insee.fr/fr/statistiques/9032359',
    method: 'Enquête Emploi en continu, définition du Bureau international du travail.',
    license: 'Réutilisation libre des données Insee avec mention de la source.',
    limits:
      "Moyenne nationale : le chômage varie fortement selon l'âge, le diplôme et le territoire. Le jeu l'affiche comme repère de contexte mais ne l'utilise PAS comme probabilité individuelle.",
    plainExplanation:
      "Au printemps 2026, 8,3 % des personnes actives cherchaient un emploi sans en avoir, le niveau le plus élevé depuis 2019 selon l'Insee. Le personnage vit dans le futur : ce chiffre décrit seulement la France de sa naissance.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'elevee',
    status: 'statistique',
  },
  {
    id: 'depp-bac-2025',
    theme: 'education',
    subject: 'Baccalauréat',
    indicator: "Proportion de bacheliers dans une génération, session 2025",
    value: '80,1 % (générale 43,3 % ; technologique 15,9 % ; professionnelle 21,0 %)',
    unit: '%',
    geography: 'France',
    population: 'Génération (âge de référence)',
    period: 'Session 2025',
    publicationDate: '2026',
    producer: 'Ministère de l\'Éducation nationale — DEPP',
    documentTitle: 'Note d\'information n° 26-05 — Résultats définitifs du baccalauréat 2025',
    url: 'https://www.education.gouv.fr/depp/resultats-definitifs-du-baccalaureat-2025-moins-de-bacheliers-dans-les-voies-generale-et-469403',
    method: 'Rapport entre le nombre de bacheliers et la population de la génération correspondante.',
    license: 'Licence ouverte (données publiques).',
    limits:
      "Proportion moyenne : les écarts selon l'origine sociale sont importants et documentés par la DEPP, mais ces données conditionnelles n'ont pas encore été intégrées. Le jeu ancre sa probabilité moyenne sur ce chiffre et module ensuite avec des règles non calibrées.",
    plainExplanation:
      "Huit jeunes sur dix obtiennent aujourd'hui le bac. Dans le jeu, l'obtention du bac est un tirage dont la moyenne s'approche de ce chiffre, modulé par la voie choisie et les conditions d'étude.",
    lastChecked: CHECKED,
    verificationNote: SEARCH_NOTE,
    confidence: 'elevee',
    status: 'statistique',
  },
  {
    id: 'code-education-instruction-obligatoire',
    theme: 'droit',
    subject: 'Instruction obligatoire',
    indicator: 'Âges de l\'instruction obligatoire',
    value: 'De 3 à 16 ans',
    geography: 'France',
    population: 'Enfants',
    period: 'Depuis la rentrée 2019',
    publicationDate: 'Loi n° 2019-791 du 26 juillet 2019 pour une école de la confiance',
    producer: 'Parlement',
    documentTitle: 'Code de l\'éducation, article L. 131-1',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006071191',
    section: 'Article L. 131-1',
    method: 'Texte législatif en vigueur.',
    license: 'Information publique.',
    limits:
      "L'obligation porte sur l'instruction, pas sur la scolarisation : l'instruction en famille reste possible sous conditions. Une obligation de formation existe aussi entre 16 et 18 ans (non modélisée en détail).",
    plainExplanation:
      "En France, l'instruction est obligatoire dès 3 ans depuis 2019 (auparavant 6 ans). C'est pourquoi l'école maternelle commence dans le jeu à cet âge.",
    lastChecked: CHECKED,
    verificationNote:
      "Confirmé par des documents secondaires (avis du Conseil d'État sur le projet de loi, règlement départemental) relevés par recherche ; Légifrance non consulté directement. Le lien pointe vers le Code de l'éducation.",
    confidence: 'elevee',
    status: 'verifie',
  },
  {
    id: 'code-electoral-eligibilite-municipale',
    theme: 'institutions',
    subject: 'Éligibilité',
    indicator: 'Âge minimal pour être élu conseiller municipal',
    value: '18 ans révolus, apprécié au jour du scrutin',
    geography: 'France',
    population: 'Électeurs',
    period: 'Droit en vigueur en 2026',
    publicationDate: 'Code électoral',
    producer: 'Parlement',
    documentTitle: 'Code électoral, articles L. 44 et L. 228',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070239',
    section: 'Articles L. 44 et L. 228',
    method: 'Texte législatif en vigueur.',
    license: 'Information publique.',
    limits:
      "D'autres conditions existent (inéligibilités liées à certaines fonctions, attache avec la commune, condamnations). Le jeu ne vérifie que l'âge et la qualité d'électeur.",
    plainExplanation:
      "Il faut avoir 18 ans le jour du vote pour être élu au conseil municipal. Le jeu bloque toute candidature avant cet âge.",
    lastChecked: CHECKED,
    verificationNote:
      "Formulation relevée dans un article juridique (eurojuris.fr) citant l'article L. 228 ; Légifrance non consulté directement.",
    confidence: 'elevee',
    status: 'verifie',
  },
  {
    id: 'constitution-droit-de-vote',
    theme: 'institutions',
    subject: 'Droit de vote',
    indicator: 'Électeurs',
    value: 'Nationaux français majeurs (18 ans), jouissant de leurs droits civils et politiques',
    geography: 'France',
    population: 'Citoyens',
    period: 'Droit en vigueur en 2026',
    publicationDate: 'Constitution du 4 octobre 1958, article 3',
    producer: 'Constitution',
    documentTitle: 'Constitution du 4 octobre 1958, article 3 ; Code civil, article 414 (majorité à 18 ans)',
    url: 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006071194',
    section: 'Article 3',
    method: 'Texte constitutionnel.',
    license: 'Information publique.',
    limits: "Les citoyens de l'Union européenne résidant en France peuvent voter aux municipales et européennes (non modélisé, le personnage est français).",
    plainExplanation: "Le personnage peut voter à partir de 18 ans. Voter, voter blanc ou s'abstenir sont tous possibles et aucun n'est sanctionné par le jeu.",
    lastChecked: CHECKED,
    verificationNote: MEMORY_NOTE,
    confidence: 'elevee',
    status: 'verifie',
  },
  {
    id: 'calendrier-electoral',
    theme: 'institutions',
    subject: 'Durée des mandats',
    indicator: 'Durée des mandats municipal et présidentiel',
    value: 'Conseillers municipaux : 6 ans (dernier renouvellement général : mars 2026) ; Président de la République : 5 ans',
    geography: 'France',
    population: '—',
    period: 'Droit en vigueur en 2026',
    publicationDate: 'Code électoral (L. 227) ; Constitution, article 6 (révision de 2000)',
    producer: 'Parlement',
    documentTitle: 'Code électoral, article L. 227 ; Constitution, article 6',
    url: 'https://www.vie-publique.fr',
    method: 'Textes en vigueur.',
    license: 'Information publique.',
    limits:
      "Le jeu prolonge ce calendrier dans le futur (municipales 2032, 2038... ; présidentielles 2032, 2037...). C'est une hypothèse : les règles et les dates peuvent changer.",
    plainExplanation:
      "Les élections que vit le personnage sont placées selon le calendrier actuel. Elles sont toutes hypothétiques, avec des candidats et des listes fictifs.",
    lastChecked: CHECKED,
    verificationNote: MEMORY_NOTE,
    confidence: 'moyenne',
    status: 'verifie',
  },
];

export const SOURCE_THEMES: Record<ScientificSource['theme'], string> = {
  demographie: 'Démographie',
  revenus: 'Revenus et pauvreté',
  emploi: 'Emploi',
  education: 'Éducation',
  droit: 'Droit',
  institutions: 'Institutions et vie démocratique',
  sante: 'Santé',
  territoires: 'Territoires',
};

export function getSource(id: string): ScientificSource | undefined {
  return SOURCES.find((s) => s.id === id);
}

/** Ressources d'aide affichées avec les événements sensibles. */
export const HELP_RESOURCES = [
  {
    label: 'Numéro national de prévention du suicide',
    contact: '3114 (gratuit, 24 h/24, 7 j/7)',
    note: 'Pour les personnes en détresse et leur entourage.',
  },
  {
    label: "En cas d'urgence",
    contact: '15 (SAMU) ou 112',
    note: '',
  },
];

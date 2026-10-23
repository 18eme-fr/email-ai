import type { IntellectualFramework } from '../engine/types';

/**
 * Cadres intellectuels qui guident l'écriture narrative.
 *
 * Aucun de ces travaux n'est converti en probabilité : ils orientent le choix
 * des situations et des questions posées au joueur. Les références (titre,
 * éditeur, année) proviennent de la connaissance bibliographique de l'équipe et
 * n'ont pas été revérifiées en ligne dans cette version ; aucune citation n'est
 * reproduite.
 */
export const FRAMEWORKS: IntellectualFramework[] = [
  {
    id: 'bourdieu',
    author: 'Pierre Bourdieu et Jean-Claude Passeron',
    concept: 'Reproduction sociale, capitaux (économique, culturel, social), habitus',
    work: 'Les Héritiers. Les étudiants et la culture (1964) ; La Reproduction. Éléments pour une théorie du système d\'enseignement',
    publication: 'Éditions de Minuit',
    year: 1970,
    useInGame:
      "Le foyer de naissance dote le personnage de ressources distinctes : argent, familiarité avec l'école, réseau. Ces ressources pèsent sur les conditions d'étude et l'accès aux opportunités, sans jamais fixer l'issue.",
    limits:
      "Le jeu ne mesure pas un « capital culturel » individuel : ce serait une fausse précision. Il ne reprend pas non plus l'idée d'un destin déterminé ; la théorie sert à poser des questions, pas à calculer.",
  },
  {
    id: 'boudon',
    author: 'Raymond Boudon',
    concept: 'Choix scolaires rationnels sous contrainte, effets secondaires de la position sociale',
    work: "L'Inégalité des chances. La mobilité sociale dans les sociétés industrielles",
    publication: 'Armand Colin',
    year: 1973,
    useInGame:
      "Les décisions d'orientation sont présentées comme des arbitrages : coût, distance, risque d'échec, attentes. Deux personnages aux résultats égaux peuvent raisonnablement choisir différemment selon leurs contraintes.",
    limits:
      "Le jeu n'estime pas les « coûts » et « bénéfices » perçus de façon calibrée ; il les rend visibles dans les textes et les effets.",
  },
  {
    id: 'sen',
    author: 'Amartya Sen',
    concept: 'Capabilités : libertés réelles de faire et d\'être',
    work: 'Commodities and Capabilities (1985) ; Development as Freedom',
    publication: 'North-Holland ; Alfred A. Knopf',
    year: 1999,
    useInGame:
      "Le bilan de vie ne classe pas les existences par revenu. Il montre les options réellement ouvertes ou fermées à chaque moment, et les choix qui ont été possibles.",
    limits: "Les capabilités ne se résument pas à un score : le jeu ne calcule donc aucun « indice de liberté ».",
  },
  {
    id: 'rawls',
    author: 'John Rawls',
    concept: 'Justice comme équité, voile d\'ignorance',
    work: 'A Theory of Justice',
    publication: 'Harvard University Press',
    year: 1971,
    useInGame:
      "Le principe même du jeu (naître sans choisir sa place) rappelle l'expérience de pensée du voile d'ignorance. Le jeu laisse au joueur la réflexion normative, sans conclure à sa place.",
    limits: "Il s'agit d'une théorie normative : elle ne dit rien de la fréquence des situations et ne fournit aucun paramètre.",
  },
  {
    id: 'tocqueville',
    author: 'Alexis de Tocqueville',
    concept: 'Associations, participation et vie démocratique locale',
    work: 'De la démocratie en Amérique (2 tomes, 1835 et 1840)',
    publication: 'Charles Gosselin',
    year: 1835,
    useInGame:
      "L'engagement associatif et local est représenté comme une forme de vie démocratique à part entière, pas comme une étape vers le pouvoir.",
    limits: "Analyse d'une autre société et d'une autre époque : elle inspire des situations, pas des mécanismes quantitatifs.",
  },
  {
    id: 'arendt',
    author: 'Hannah Arendt',
    concept: 'Action politique, pluralité, espace public',
    work: 'The Human Condition (trad. française : Condition de l\'homme moderne, 1961)',
    publication: 'University of Chicago Press',
    year: 1958,
    useInGame: "Les scènes d'engagement insistent sur la parole et l'action collective, et sur leur part d'imprévisible.",
    limits: 'Philosophie politique : aucune traduction numérique possible.',
  },
  {
    id: 'fraser',
    author: 'Nancy Fraser',
    concept: 'Justice à trois dimensions : redistribution, reconnaissance, représentation',
    work: 'Scales of Justice. Reimagining Political Space in a Globalizing World',
    publication: 'Columbia University Press',
    year: 2008,
    useInGame:
      "Les difficultés rencontrées ne sont pas seulement matérielles : manque de reconnaissance ou de voix dans les décisions collectives apparaissent aussi.",
    limits: "Cadre normatif ; les discriminations ne sont pas encore modélisées faute de données intégrées.",
  },
  {
    id: 'castel',
    author: 'Robert Castel',
    concept: 'Vulnérabilité, désaffiliation, protections du salariat',
    work: 'Les Métamorphoses de la question sociale. Une chronique du salariat',
    publication: 'Fayard',
    year: 1995,
    useInGame:
      "Le soutien social et la stabilité de l'emploi sont représentés comme deux protections distinctes : perdre les deux à la fois fragilise davantage.",
    limits: "La notion de « zones » (intégration, vulnérabilité, désaffiliation) n'est pas transformée en seuils chiffrés.",
  },
  {
    id: 'piketty',
    author: 'Thomas Piketty',
    concept: 'Patrimoine, héritage et inégalités de long terme',
    work: 'Le Capital au XXIe siècle',
    publication: 'Éditions du Seuil',
    year: 2013,
    useInGame:
      "Le jeu distingue revenu et patrimoine, et l'aide familiale ou l'héritage peuvent modifier une trajectoire (logement, études).",
    limits: "Les dynamiques macroéconomiques décrites ne s'appliquent pas mécaniquement à une vie individuelle. La v0.1 ne modélise pas encore l'héritage de façon réaliste.",
  },
  {
    id: 'palier',
    author: 'Bruno Palier',
    concept: 'Trajectoire et réformes du système français de protection sociale',
    work: 'Gouverner la sécurité sociale. Les réformes du système français de protection sociale depuis 1945',
    publication: 'Presses universitaires de France',
    year: 2002,
    useInGame:
      "La protection sociale est représentée comme un ensemble d'institutions qui changent par réformes successives et négociées, jamais instantanément.",
    limits: 'Les prestations ne sont pas encore calculées dans la v0.1 : seules des règles qualitatives sont utilisées.',
  },
  {
    id: 'meda',
    author: 'Dominique Méda',
    concept: 'Place et sens du travail dans la vie',
    work: 'Le Travail. Une valeur en voie de disparition',
    publication: 'Aubier',
    year: 1995,
    useInGame:
      "Le travail n'est pas la seule source de réalisation : le bilan valorise aussi relations, engagement, temps libre et soin des autres.",
    limits: 'Réflexion philosophique et sociologique : pas de paramètre numérique.',
  },
];

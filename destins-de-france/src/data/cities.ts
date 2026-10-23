import type { RegionProfile } from '../engine/types';

/**
 * Mode « Villes » : le joueur choisit sa ville de naissance parmi les grandes
 * villes débloquées ; une nouvelle ville se débloque toutes les 10 vies.
 *
 * Seul le lieu est choisi : le foyer, le quartier, le niveau de vie et tout le
 * reste sont tirés au hasard comme dans le mode intégral. Le jeu le rappelle au
 * joueur, puisqu'une naissance réelle ne se choisit pas.
 *
 * Les textes d'ambiance sont des repères géographiques et historiques généraux,
 * sans chiffre ; ils n'ont pas encore de fiche source dédiée (prévu en phase 3)
 * et ne sont donc pas étiquetés « fait vérifié ».
 */
export type CityId =
  | 'paris'
  | 'marseille'
  | 'lyon'
  | 'toulouse'
  | 'nice'
  | 'nantes'
  | 'montpellier'
  | 'strasbourg'
  | 'bordeaux'
  | 'lille'
  | 'rennes'
  | 'saint-denis-reunion';

export interface CityProfile {
  id: CityId;
  name: string;
  /** Nom de lieu utilisé dans la partie (doit exister dans la région). */
  place: string;
  regionId: string;
  landscape: RegionProfile['landscape'];
  tagline: string;
  ambiance: string;
}

export const CITIES: CityProfile[] = [
  {
    id: 'paris',
    name: 'Paris',
    place: 'Paris',
    regionId: 'idf',
    landscape: 'plaine',
    tagline: 'La capitale, de part et d\'autre de la Seine',
    ambiance: 'Des toits de zinc à perte de vue, le métro qui gronde sous les pieds, des appartements souvent petits et chers, et l\'impression que tout se décide ici.',
  },
  {
    id: 'marseille',
    name: 'Marseille',
    place: 'Marseille',
    regionId: 'pac',
    landscape: 'littoral',
    tagline: 'Le grand port de la Méditerranée',
    ambiance: 'Fondée par des marins grecs il y a plus de deux millénaires et demi, la ville regarde la mer depuis ses collines. Lumière crue, mistral, quartiers très contrastés.',
  },
  {
    id: 'lyon',
    name: 'Lyon',
    place: 'Lyon',
    regionId: 'ara',
    landscape: 'montagne',
    tagline: 'Au confluent du Rhône et de la Saône',
    ambiance: 'Deux fleuves, deux collines, des traboules et des tours de bureaux : une ville de soie devenue métropole de services.',
  },
  {
    id: 'toulouse',
    name: 'Toulouse',
    place: 'Toulouse',
    regionId: 'occ',
    landscape: 'plaine',
    tagline: 'La ville rose, sur la Garonne',
    ambiance: 'La brique donne sa couleur aux façades ; l\'industrie aéronautique et spatiale, ses avions dans le ciel. Les étés y sont chauds.',
  },
  {
    id: 'nice',
    name: 'Nice',
    place: 'Nice',
    regionId: 'pac',
    landscape: 'littoral',
    tagline: 'Entre la baie des Anges et les Alpes',
    ambiance: 'Une promenade bordée de palmiers, les montagnes à une heure de route, l\'Italie toute proche, et une ville où l\'on vieillit nombreux au soleil.',
  },
  {
    id: 'nantes',
    name: 'Nantes',
    place: 'Nantes',
    regionId: 'pdl',
    landscape: 'littoral',
    tagline: 'Sur la Loire, vers l\'Atlantique',
    ambiance: 'Le château des ducs de Bretagne, les anciens chantiers navals reconvertis, un ciel qui change trois fois par jour.',
  },
  {
    id: 'montpellier',
    name: 'Montpellier',
    place: 'Montpellier',
    regionId: 'occ',
    landscape: 'littoral',
    tagline: 'Une ville étudiante près de la Méditerranée',
    ambiance: 'Une faculté de médecine parmi les plus anciennes d\'Europe, des tramways colorés, la garrigue aux portes de la ville.',
  },
  {
    id: 'strasbourg',
    name: 'Strasbourg',
    place: 'Strasbourg',
    regionId: 'ges',
    landscape: 'plaine',
    tagline: 'Au bord du Rhin, siège du Parlement européen',
    ambiance: 'La cathédrale à la flèche unique domine les maisons à colombages ; l\'Allemagne est de l\'autre côté du pont. Hivers froids, marchés de Noël.',
  },
  {
    id: 'bordeaux',
    name: 'Bordeaux',
    place: 'Bordeaux',
    regionId: 'naq',
    landscape: 'littoral',
    tagline: 'Le port de la Lune, sur la Garonne',
    ambiance: 'Des façades de pierre blonde le long du fleuve, un centre historique classé au patrimoine mondial, et les vignes à l\'horizon.',
  },
  {
    id: 'lille',
    name: 'Lille',
    place: 'Lille',
    regionId: 'hdf',
    landscape: 'plaine',
    tagline: 'Au cœur des Flandres, près de la Belgique',
    ambiance: 'Briques rouges, beffrois, pignons flamands. Une métropole marquée par son passé industriel, chaleureuse sous un ciel souvent gris.',
  },
  {
    id: 'rennes',
    name: 'Rennes',
    place: 'Rennes',
    regionId: 'bre',
    landscape: 'littoral',
    tagline: 'La capitale de la Bretagne',
    ambiance: 'Des maisons à pans de bois rescapées du grand incendie du XVIIIe siècle, beaucoup d\'étudiants, et une bruine qui ne mouille, paraît-il, que les touristes.',
  },
  {
    id: 'saint-denis-reunion',
    name: 'Saint-Denis de La Réunion',
    place: 'Saint-Denis de La Réunion',
    regionId: 'reu',
    landscape: 'tropical',
    tagline: 'Face à l\'océan Indien',
    ambiance: 'Chef-lieu d\'une île volcanique aux montagnes vertigineuses, à des milliers de kilomètres de Paris. Cases créoles, créole réunionnais, cyclones l\'été austral.',
  },
];

export const LIVES_PER_UNLOCK = 10;

/** Nombre de villes que le joueur a le droit de posséder après `livesCompleted` vies. */
export function allowedCities(livesCompleted: number): number {
  return Math.min(CITIES.length, 1 + Math.floor(livesCompleted / LIVES_PER_UNLOCK));
}

export function getCity(id: string): CityProfile | undefined {
  return CITIES.find((c) => c.id === id);
}

import type { NeighbourhoodType, RegionProfile, TerritoryType } from '../engine/types';

/**
 * Régions représentées dans la v0.1.
 *
 * Poids de naissance :
 * - Île-de-France : 148 300 naissances en 2025 (Insee, provisoire) → statistique.
 * - La Réunion : 11 790 naissances (Insee) → statistique, année à confirmer.
 * - Autres régions : PARAMÈTRES DE DÉMONSTRATION NON VALIDÉS. Ils se répartissent
 *   le reste du total national (645 000) selon des ordres de grandeur provisoires.
 *   Les effectifs exacts sont publiés par l'Insee (fichier « Naissances vivantes
 *   par département et région, 2025 ») mais n'ont pas pu être lus dans cette
 *   version : leur intégration est la première tâche de la phase 3.
 * - Guadeloupe, Martinique, Guyane et Mayotte ne sont pas encore représentées.
 *
 * Les noms de lieux sont réels ; aucune statistique locale ne leur est attribuée.
 */
const demo = (id: string, name: string, weight: number, landscape: RegionProfile['landscape'], places: Record<TerritoryType, string[]>): RegionProfile => ({
  id,
  name,
  places,
  overseas: false,
  birthWeight: weight,
  birthWeightStatus: 'demonstration',
  landscape,
});

export const REGIONS: RegionProfile[] = [
  {
    id: 'idf',
    name: 'Île-de-France',
    overseas: false,
    birthWeight: 148300,
    birthWeightStatus: 'statistique',
    birthWeightSourceId: 'insee-idf-naissances-2025',
    landscape: 'plaine',
    places: {
      metropole: ['Paris', 'Saint-Denis', 'Montreuil', 'Boulogne-Billancourt', 'Créteil', 'Nanterre'],
      ville_moyenne: ['Évry-Courcouronnes', 'Cergy', 'Meaux', 'Mantes-la-Jolie'],
      petite_ville: ['Étampes', 'Provins', 'Rambouillet', 'Nemours'],
      rural: ['un village du Vexin', 'un village de la Brie', 'un hameau du Gâtinais'],
    },
  },
  demo('ara', 'Auvergne-Rhône-Alpes', 80000, 'montagne', {
    metropole: ['Lyon', 'Grenoble', 'Villeurbanne', 'Saint-Étienne'],
    ville_moyenne: ['Clermont-Ferrand', 'Annecy', 'Valence', 'Chambéry'],
    petite_ville: ['Aurillac', 'Thiers', 'Privas', 'Oyonnax'],
    rural: ['un village du Cantal', 'un village de la Drôme', 'un hameau du Haut-Livradois'],
  }),
  demo('hdf', 'Hauts-de-France', 60000, 'plaine', {
    metropole: ['Lille', 'Roubaix', 'Tourcoing'],
    ville_moyenne: ['Amiens', 'Dunkerque', 'Valenciennes', 'Lens'],
    petite_ville: ['Maubeuge', 'Saint-Omer', 'Abbeville', 'Hirson'],
    rural: ['un village de la Thiérache', 'un village du Santerre', 'un village de l\'Avesnois'],
  }),
  demo('naq', 'Nouvelle-Aquitaine', 50000, 'littoral', {
    metropole: ['Bordeaux', 'Mérignac'],
    ville_moyenne: ['Limoges', 'Poitiers', 'Pau', 'La Rochelle'],
    petite_ville: ['Guéret', 'Bergerac', 'Mont-de-Marsan', 'Saintes'],
    rural: ['un village de la Creuse', 'un village du Périgord', 'un village des Landes'],
  }),
  demo('occ', 'Occitanie', 52000, 'montagne', {
    metropole: ['Toulouse', 'Montpellier'],
    ville_moyenne: ['Nîmes', 'Perpignan', 'Béziers', 'Albi'],
    petite_ville: ['Rodez', 'Foix', 'Mende', 'Lodève'],
    rural: ['un village de Lozère', 'un village du Gers', 'un village des Cévennes'],
  }),
  demo('ges', 'Grand Est', 48000, 'montagne', {
    metropole: ['Strasbourg'],
    ville_moyenne: ['Metz', 'Nancy', 'Reims', 'Mulhouse', 'Troyes'],
    petite_ville: ['Épinal', 'Saint-Dié-des-Vosges', 'Verdun', 'Chaumont'],
    rural: ['un village des Ardennes', 'un village de la Meuse', 'un village d\'Alsace bossue'],
  }),
  demo('pac', "Provence-Alpes-Côte d'Azur", 50000, 'littoral', {
    metropole: ['Marseille', 'Nice'],
    ville_moyenne: ['Toulon', 'Avignon', 'Aix-en-Provence'],
    petite_ville: ['Digne-les-Bains', 'Gap', 'Brignoles', 'Apt'],
    rural: ['un village du Haut-Var', 'un village des Alpes-de-Haute-Provence', 'un hameau du Queyras'],
  }),
  demo('pdl', 'Pays de la Loire', 38000, 'littoral', {
    metropole: ['Nantes'],
    ville_moyenne: ['Angers', 'Le Mans', 'Saint-Nazaire'],
    petite_ville: ['Laval', 'La Roche-sur-Yon', 'Cholet', 'Saumur'],
    rural: ['un village de Mayenne', 'un village du bocage vendéen', 'un village de la Sarthe'],
  }),
  demo('bre', 'Bretagne', 29000, 'littoral', {
    metropole: ['Rennes'],
    ville_moyenne: ['Brest', 'Lorient', 'Vannes', 'Saint-Brieuc'],
    petite_ville: ['Morlaix', 'Pontivy', 'Lannion', 'Fougères'],
    rural: ['un village du Centre-Bretagne', 'un village des monts d\'Arrée', 'un village du Trégor'],
  }),
  demo('nor', 'Normandie', 29000, 'littoral', {
    metropole: ['Rouen'],
    ville_moyenne: ['Caen', 'Le Havre', 'Cherbourg-en-Cotentin', 'Évreux'],
    petite_ville: ['Alençon', 'Lisieux', 'Dieppe', 'Saint-Lô'],
    rural: ['un village du pays d\'Auge', 'un village du Perche', 'un village du Cotentin'],
  }),
  demo('bfc', 'Bourgogne-Franche-Comté', 24000, 'montagne', {
    metropole: ['Dijon'],
    ville_moyenne: ['Besançon', 'Belfort', 'Chalon-sur-Saône', 'Auxerre'],
    petite_ville: ['Nevers', 'Lons-le-Saunier', 'Vesoul', 'Autun'],
    rural: ['un village du Morvan', 'un village du Haut-Doubs', 'un village de la Nièvre'],
  }),
  demo('cvl', 'Centre-Val de Loire', 23000, 'plaine', {
    metropole: ['Tours', 'Orléans'],
    ville_moyenne: ['Bourges', 'Blois', 'Chartres', 'Châteauroux'],
    petite_ville: ['Vierzon', 'Romorantin-Lanthenay', 'Montargis', 'Issoudun'],
    rural: ['un village de Sologne', 'un village du Berry', 'un village de Beauce'],
  }),
  demo('cor', 'Corse', 2500, 'littoral', {
    metropole: ['Ajaccio'],
    ville_moyenne: ['Bastia'],
    petite_ville: ['Corte', 'Porto-Vecchio', 'Calvi'],
    rural: ['un village de Castagniccia', 'un village du Niolu'],
  }),
  {
    id: 'reu',
    name: 'La Réunion',
    overseas: true,
    birthWeight: 11790,
    birthWeightStatus: 'statistique',
    birthWeightSourceId: 'insee-reunion-naissances-2025',
    landscape: 'tropical',
    places: {
      metropole: ['Saint-Denis de La Réunion'],
      ville_moyenne: ['Saint-Paul', 'Saint-Pierre', 'Le Tampon'],
      petite_ville: ['Saint-Benoît', 'Saint-Joseph', 'Saint-Louis'],
      rural: ['un écart des Hauts de l\'île', 'un village de Cilaos', 'un village de Salazie'],
    },
  },
];

/**
 * Répartition des types de territoire à la naissance : PARAMÈTRE DE DÉMONSTRATION.
 * L'Insee publie une grille communale de densité qui permettrait de la calibrer
 * (phase 3). La Corse et La Réunion n'ont pas de « métropole » au sens du jeu :
 * leur premier type désigne la plus grande ville.
 */
export const TERRITORY_WEIGHTS: Record<TerritoryType, number> = {
  metropole: 0.4,
  ville_moyenne: 0.25,
  petite_ville: 0.17,
  rural: 0.18,
};

/** Répartition des types de quartier selon le territoire : PARAMÈTRE DE DÉMONSTRATION. */
export const NEIGHBOURHOOD_WEIGHTS: Record<TerritoryType, Record<NeighbourhoodType, number>> = {
  metropole: { favorise: 0.25, mixte: 0.45, populaire: 0.3 },
  ville_moyenne: { favorise: 0.2, mixte: 0.5, populaire: 0.3 },
  petite_ville: { favorise: 0.15, mixte: 0.6, populaire: 0.25 },
  rural: { favorise: 0.15, mixte: 0.75, populaire: 0.1 },
};

export const TERRITORY_LABELS: Record<TerritoryType, string> = {
  metropole: 'grande ville',
  ville_moyenne: 'ville moyenne',
  petite_ville: 'petite ville',
  rural: 'commune rurale',
};

export const NEIGHBOURHOOD_LABELS: Record<NeighbourhoodType, string> = {
  favorise: 'quartier plutôt aisé',
  mixte: 'quartier mixte',
  populaire: 'quartier populaire',
};

export function getRegion(id: string): RegionProfile {
  const r = REGIONS.find((x) => x.id === id);
  if (!r) throw new Error(`Région inconnue : ${id}`);
  return r;
}

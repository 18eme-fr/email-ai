/**
 * Modèle de données de l'Atlas mondial du vin.
 *
 * Principe directeur : la géographie (géométries) et l'encyclopédie (savoir
 * œnologique) sont séparées et jointes par `id`. Cela permet d'enrichir la base
 * documentaire sans toucher aux tracés, et inversement.
 *
 * Fiabilité : toute valeur scalaire inconnue vaut `null`, toute liste inconnue
 * vaut `[]`. L'interface affiche alors « information non renseignée » plutôt
 * qu'une donnée inventée (cf. exigence n°19 du cahier des charges).
 */

import type { Feature, Geometry, MultiPolygon, Polygon } from 'geojson';

/** Niveau dans la hiérarchie géographique. */
export type AtlasLevel = 'country' | 'region' | 'subregion' | 'appellation';

export const LEVEL_ORDER: AtlasLevel[] = [
  'country',
  'region',
  'subregion',
  'appellation',
];

export const LEVEL_LABELS: Record<AtlasLevel, string> = {
  country: 'Pays',
  region: 'Grande région viticole',
  subregion: 'Sous-région',
  appellation: 'Appellation / zone',
};

/** Styles de vin (exigence n°4 « Types de vins » et filtres n°9). */
export type WineStyle =
  | 'rouge'
  | 'blanc'
  | 'rosé'
  | 'effervescent'
  | 'liquoreux'
  | 'vin doux naturel'
  | 'orange';

export const WINE_STYLE_LABELS: Record<WineStyle, string> = {
  rouge: 'Rouge',
  blanc: 'Blanc',
  rosé: 'Rosé',
  effervescent: 'Effervescent',
  liquoreux: 'Liquoreux',
  'vin doux naturel': 'Vin doux naturel',
  orange: 'Orange wine',
};

/** Grands types climatiques (filtres n°9). */
export type ClimateType =
  | 'océanique'
  | 'continental'
  | 'méditerranéen'
  | 'montagne'
  | 'désertique'
  | 'tropical d’altitude'
  | 'semi-aride';

/** Types de sols dominants (exigence n°4 et filtres n°9). */
export type SoilType =
  | 'calcaire'
  | 'argile'
  | 'graves'
  | 'schiste'
  | 'granite'
  | 'craie'
  | 'volcanique'
  | 'sable'
  | 'limon'
  | 'marne'
  | 'galets roulés'
  | 'gneiss'
  | 'ardoise';

export type GrapeColor = 'rouge' | 'blanc';

/** Une variété de cépage (table `grape_varieties`). */
export interface GrapeVariety {
  id: string;
  name: string;
  color: GrapeColor;
  aliases: string[];
  /** Courte description encyclopédique et sourcée. */
  description: string | null;
}

/** Association région ↔ cépage (table `region_grapes`). */
export interface RegionGrape {
  grapeId: string;
  /** Part approximative dans l'encépagement (0–100), ou `null` si non fiable. */
  share: number | null;
  /** Cépage principal / secondaire / autochtone. */
  role: 'principal' | 'secondaire' | 'autochtone';
}

/** Terroir climatique (valeurs `null` = non renseigné). */
export interface ClimateProfile {
  type: ClimateType | null;
  /** Amplitude de températures, texte court. */
  temperatures: string | null;
  /** Pluviométrie annuelle, texte court (ex. « 900 mm/an »). */
  rainfall: string | null;
  /** Influences : maritime, continentale, méditerranéenne… */
  influences: string[];
  notes: string | null;
}

/** Profil gustatif indicatif (exigence n°4). Échelle 0–5, `null` = inconnu. */
export interface TastingProfile {
  acidity: number | null;
  tannins: number | null;
  body: number | null;
  alcohol: number | null;
  sweetness: number | null;
  aromaticIntensity: number | null;
  ageingPotential: number | null;
  /** Arômes typiques (fruits rouges, épices, minéralité…). */
  aromas: string[];
}

/** Pratiques viticoles (exigence n°4). */
export interface Viticulture {
  plantingDensity: string | null;
  yield: string | null;
  harvest: string | null;
  irrigation: string | null;
  organic: string | null;
  notes: string | null;
}

/** Techniques de vinification / élevage (exigence n°4). */
export interface Vinification {
  ageing: string[];
  ageingDuration: string | null;
  maceration: string | null;
  malolactic: string | null;
  notes: string | null;
}

/** Producteur emblématique (table `producers`, exigence n°5). */
export interface Producer {
  name: string;
  note: string | null;
}

/** Millésime (table `vintages`, exigence n°6). */
export interface Vintage {
  year: number;
  rating: 'exceptionnel' | 'excellent' | 'très bon' | 'bon' | 'moyen' | 'difficile';
  note: string | null;
}

/** Chiffres-clés (valeurs `null` = non renseigné). */
export interface KeyFacts {
  /** Superficie viticole en hectares. */
  vineyardAreaHa: number | null;
  /** Production annuelle, texte (ex. « 5,7 M hL »). */
  annualProduction: string | null;
  /** Nombre de domaines / producteurs. */
  producerCount: string | null;
  /** Altitude, texte (ex. « 250–500 m »). */
  altitude: string | null;
}

/**
 * Fiche encyclopédique d'une zone viticole (table `wine_regions`).
 * Ne contient PAS la géométrie : celle-ci vit dans la couche géographique.
 */
export interface WineRegionInfo {
  id: string;
  name: string;
  /** Pays d'appartenance. */
  country: string;
  /** Code ISO pays (pour regroupement/couleur). */
  countryCode: string;
  /** Région administrative éventuelle. */
  adminRegion: string | null;
  level: AtlasLevel;
  /** id de la zone parente (hiérarchie flexible : `parent_region_id`). */
  parentId: string | null;
  /** Continent (pour le niveau monde). */
  continent: string;

  keyFacts: KeyFacts;
  climate: ClimateProfile;
  soils: SoilType[];
  relief: string | null;
  geology: string | null;

  grapes: RegionGrape[];
  wineStyles: WineStyle[];
  tasting: TastingProfile;
  viticulture: Viticulture;
  vinification: Vinification;

  producers: Producer[];
  vintages: Vintage[];
  foodPairings: string[];

  description: string | null;

  /** Traçabilité (exigence n°19). */
  source: string | null;
  lastVerified: string | null;
}

/** Propriétés minimales portées par chaque entité géographique (couche geo). */
export interface AtlasFeatureProps {
  id: string;
  name: string;
  level: AtlasLevel;
  country: string;
  countryCode: string;
  parentId: string | null;
  /** Vrai si une fiche encyclopédique existe pour cette zone. */
  hasInfo: boolean;
}

export type AtlasFeature = Feature<Polygon | MultiPolygon, AtlasFeatureProps>;

/** Entrée de la couche géographique : id ↔ géométrie (fichiers GeoJSON). */
export interface RegionGeometry {
  id: string;
  geometry: Polygon | MultiPolygon;
}

export type { Geometry };

import type {
  ClimateProfile,
  KeyFacts,
  TastingProfile,
  Viticulture,
  Vinification,
  WineRegionInfo,
} from '@/lib/types';

const emptyKeyFacts: KeyFacts = {
  vineyardAreaHa: null,
  annualProduction: null,
  producerCount: null,
  altitude: null,
};

const emptyClimate: ClimateProfile = {
  type: null,
  temperatures: null,
  rainfall: null,
  influences: [],
  notes: null,
};

const emptyTasting: TastingProfile = {
  acidity: null,
  tannins: null,
  body: null,
  alcohol: null,
  sweetness: null,
  aromaticIntensity: null,
  ageingPotential: null,
  aromas: [],
};

const emptyViticulture: Viticulture = {
  plantingDensity: null,
  yield: null,
  harvest: null,
  irrigation: null,
  organic: null,
  notes: null,
};

const emptyVinification: Vinification = {
  ageing: [],
  ageingDuration: null,
  maceration: null,
  malolactic: null,
  notes: null,
};

/** Champs identitaires obligatoires ; tout le reste est optionnel et vaut « non renseigné ». */
type RegionInput = Pick<
  WineRegionInfo,
  'id' | 'name' | 'country' | 'countryCode' | 'continent' | 'level'
> &
  Partial<Omit<WineRegionInfo, 'keyFacts' | 'climate' | 'tasting' | 'viticulture' | 'vinification'>> & {
    keyFacts?: Partial<KeyFacts>;
    climate?: Partial<ClimateProfile>;
    tasting?: Partial<TastingProfile>;
    viticulture?: Partial<Viticulture>;
    vinification?: Partial<Vinification>;
  };

/**
 * Construit une fiche complète en comblant tout champ absent par la valeur
 * « non renseigné » (null / []). Un enregistrement ne déclare donc que ce que
 * l'on sait de source fiable.
 */
export function region(input: RegionInput): WineRegionInfo {
  return {
    adminRegion: null,
    parentId: null,
    relief: null,
    geology: null,
    soils: [],
    grapes: [],
    wineStyles: [],
    producers: [],
    vintages: [],
    foodPairings: [],
    description: null,
    source: null,
    lastVerified: null,
    ...input,
    keyFacts: { ...emptyKeyFacts, ...input.keyFacts },
    climate: { ...emptyClimate, ...input.climate },
    tasting: { ...emptyTasting, ...input.tasting },
    viticulture: { ...emptyViticulture, ...input.viticulture },
    vinification: { ...emptyVinification, ...input.vinification },
  };
}

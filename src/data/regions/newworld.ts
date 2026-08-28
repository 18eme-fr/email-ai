import type { WineRegionInfo } from '@/lib/types';
import { region } from './_helpers';

/**
 * NOUVEAU MONDE — États-Unis, Argentine, Chili, Afrique du Sud, Australie,
 * Nouvelle-Zélande. Sources : TTB (AVA), Wines of Argentina, Wines of Chile,
 * Wines of South Africa, Wine Australia, New Zealand Winegrowers.
 */
export const NEW_WORLD: WineRegionInfo[] = [
  // ═══════════════════════ ÉTATS-UNIS ═══════════════════════
  region({
    id: 'us-napa', name: 'Napa Valley', country: 'États-Unis', countryCode: 'US', continent: 'Amérique du Nord',
    level: 'region', parentId: 'us', adminRegion: 'Californie',
    keyFacts: { vineyardAreaHa: 18000, altitude: '0–800 m' },
    climate: { type: 'méditerranéen', influences: ['maritime (brouillards de la baie de San Pablo)', 'diurne marquée'], notes: 'Brouillards matinaux rafraîchissant le sud de la vallée.' },
    soils: ['volcanique', 'argile', 'graves', 'limon'],
    grapes: [
      { grapeId: 'cabernet-sauvignon', share: null, role: 'principal' },
      { grapeId: 'merlot', share: null, role: 'secondaire' },
      { grapeId: 'chardonnay', share: null, role: 'principal' },
    ],
    wineStyles: ['rouge', 'blanc'],
    tasting: { tannins: 4, body: 5, alcohol: 4, ageingPotential: 4, aromaticIntensity: 5, aromas: ['cassis', 'moka', 'vanille', 'fruits noirs mûrs'] },
    vinification: { ageing: ['élevage en barrique de chêne'], malolactic: 'oui' },
    producers: [],
    foodPairings: ['viandes rouges grillées', 'côte de bœuf', 'fromages affinés'],
    description:
      'AVA la plus célèbre des États-Unis, au nord de San Francisco. Référence mondiale du Cabernet Sauvignon (style riche et mûr). Contient de nombreuses AVA imbriquées (Rutherford, Oakville, Stags Leap…).',
    source: 'Napa Valley Vintners ; TTB', lastVerified: '2024',
  }),
  region({
    id: 'us-napa-rutherford', name: 'Rutherford', country: 'États-Unis', countryCode: 'US', continent: 'Amérique du Nord',
    level: 'appellation', parentId: 'us-napa', adminRegion: 'Californie',
    soils: ['graves', 'limon', 'argile'],
    grapes: [{ grapeId: 'cabernet-sauvignon', share: null, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, body: 5, ageingPotential: 5, aromaticIntensity: 5, aromas: ['cassis', 'cacao', 'poussière (Rutherford dust)', 'herbes séchées'] },
    description:
      'AVA au cœur de la Napa Valley, réputée pour ses Cabernets Sauvignons structurés à la texture caractéristique dite « Rutherford dust ».',
    source: 'TTB', lastVerified: '2024',
  }),
  region({
    id: 'us-napa-oakville', name: 'Oakville', country: 'États-Unis', countryCode: 'US', continent: 'Amérique du Nord',
    level: 'appellation', parentId: 'us-napa', adminRegion: 'Californie',
    soils: ['graves', 'argile', 'limon'],
    grapes: [{ grapeId: 'cabernet-sauvignon', share: null, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 5, body: 5, ageingPotential: 5, aromaticIntensity: 5, aromas: ['cassis', 'chocolat', 'fruits noirs'] },
    description:
      'AVA voisine de Rutherford, terre de Cabernets Sauvignons opulents et de très grande garde (berceau des « cult wines » de la Napa).',
    source: 'TTB', lastVerified: '2024',
  }),
  region({
    id: 'us-sonoma', name: 'Sonoma County', country: 'États-Unis', countryCode: 'US', continent: 'Amérique du Nord',
    level: 'region', parentId: 'us', adminRegion: 'Californie',
    climate: { type: 'méditerranéen', influences: ['maritime (Pacifique)', 'brouillards de la Russian River'], notes: 'Plus fraîche et diverse que Napa, surtout près de la côte.' },
    soils: ['volcanique', 'argile', 'limon', 'graves'],
    grapes: [
      { grapeId: 'pinot-noir', share: null, role: 'principal' },
      { grapeId: 'chardonnay', share: null, role: 'principal' },
      { grapeId: 'zinfandel', share: null, role: 'secondaire' },
      { grapeId: 'cabernet-sauvignon', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'blanc'],
    tasting: { body: 4, acidity: 3, ageingPotential: 4, aromas: ['fruits rouges', 'fruits blancs', 'épices'] },
    description:
      'Vaste comté côtier voisin de Napa, à la mosaïque d’AVA. Réputé pour le Pinot Noir et le Chardonnay des zones fraîches (Russian River Valley, Sonoma Coast) et le Zinfandel.',
    source: 'Sonoma County Vintners ; TTB', lastVerified: '2024',
  }),

  // ═══════════════════════ ARGENTINE ═══════════════════════
  region({
    id: 'ar-mendoza', name: 'Mendoza', country: 'Argentine', countryCode: 'AR', continent: 'Amérique du Sud',
    level: 'region', parentId: 'ar', adminRegion: 'Mendoza',
    keyFacts: { altitude: '600–1500 m' },
    climate: { type: 'désertique', influences: ['continentale aride', 'altitude andine', 'forte amplitude thermique'], rainfall: '≈ 200 mm/an', notes: 'Climat semi-désertique ; irrigation par eaux de fonte des Andes.' },
    soils: ['sable', 'argile', 'limon', 'calcaire'],
    grapes: [
      { grapeId: 'malbec', share: null, role: 'principal' },
      { grapeId: 'cabernet-sauvignon', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'blanc', 'rosé'],
    tasting: { tannins: 4, body: 4, alcohol: 4, ageingPotential: 4, aromaticIntensity: 4, aromas: ['prune', 'mûre', 'violette', 'chocolat'] },
    viticulture: { irrigation: 'irrigation nécessaire (eaux andines)', notes: 'Viticulture d’altitude au pied de la cordillère des Andes.' },
    foodPairings: ['bœuf grillé (asado)', 'empanadas', 'viandes rouges'],
    description:
      'Cœur du vignoble argentin, au pied des Andes. Patrie du Malbec, cultivé en altitude, donnant des rouges colorés, fruités et souples. Comprend des sous-zones réputées comme Luján de Cuyo et le Valle de Uco.',
    source: 'Wines of Argentina ; INV', lastVerified: '2024',
  }),
  region({
    id: 'ar-mendoza-valle-de-uco', name: 'Valle de Uco', country: 'Argentine', countryCode: 'AR', continent: 'Amérique du Sud',
    level: 'subregion', parentId: 'ar-mendoza', adminRegion: 'Mendoza',
    keyFacts: { altitude: '900–1500 m' },
    climate: { type: 'montagne', influences: ['altitude élevée', 'nuits fraîches'] },
    soils: ['calcaire', 'sable', 'galets roulés'],
    grapes: [{ grapeId: 'malbec', share: null, role: 'principal' }],
    wineStyles: ['rouge', 'blanc'],
    tasting: { tannins: 4, body: 4, acidity: 4, ageingPotential: 5, aromaticIntensity: 5, aromas: ['fruits noirs', 'violette', 'herbes', 'minéralité'] },
    description:
      'Sous-région d’altitude de Mendoza (jusqu’à ~1500 m), très en vogue pour des Malbecs frais, tendus et aromatiques, sur sols parfois calcaires (Gualtallary).',
    source: 'Wines of Argentina', lastVerified: '2024',
  }),

  // ═══════════════════════ CHILI ═══════════════════════
  region({
    id: 'cl-maipo', name: 'Valle del Maipo', country: 'Chili', countryCode: 'CL', continent: 'Amérique du Sud',
    level: 'region', parentId: 'cl', adminRegion: 'Región Metropolitana',
    climate: { type: 'méditerranéen', influences: ['méditerranéenne', 'influence andine (piedmont)'] },
    soils: ['argile', 'graves', 'limon'],
    grapes: [
      { grapeId: 'cabernet-sauvignon', share: null, role: 'principal' },
      { grapeId: 'carmenere', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, body: 4, ageingPotential: 4, aromas: ['cassis', 'menthe', 'eucalyptus', 'poivron mûr'] },
    foodPairings: ['viandes rouges', 'agneau', 'plats mijotés'],
    description:
      'Vallée proche de Santiago, berceau des grands Cabernets Sauvignons chiliens, notamment sur le piémont andin (Alto Maipo).',
    source: 'Wines of Chile', lastVerified: '2024',
  }),
  region({
    id: 'cl-colchagua', name: 'Valle de Colchagua', country: 'Chili', countryCode: 'CL', continent: 'Amérique du Sud',
    level: 'region', parentId: 'cl', adminRegion: "O'Higgins",
    climate: { type: 'méditerranéen', influences: ['méditerranéenne', 'brises du Pacifique'] },
    soils: ['argile', 'granite', 'limon'],
    grapes: [
      { grapeId: 'carmenere', share: null, role: 'principal' },
      { grapeId: 'cabernet-sauvignon', share: null, role: 'principal' },
      { grapeId: 'syrah', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, body: 5, alcohol: 4, ageingPotential: 4, aromas: ['fruits noirs', 'poivron', 'épices', 'chocolat'] },
    description:
      'Vallée chaude au sud de Santiago, réputée pour des rouges généreux, en particulier le Carménère, cépage signature du Chili.',
    source: 'Wines of Chile', lastVerified: '2024',
  }),

  // ═══════════════════════ AFRIQUE DU SUD ═══════════════════════
  region({
    id: 'za-stellenbosch', name: 'Stellenbosch', country: 'Afrique du Sud', countryCode: 'ZA', continent: 'Afrique',
    level: 'region', parentId: 'za', adminRegion: 'Western Cape',
    climate: { type: 'méditerranéen', influences: ['maritime (False Bay)', 'montagne'], notes: 'Étés chauds tempérés par les brises océaniques.' },
    soils: ['granite', 'schiste', 'sable', 'graves'],
    grapes: [
      { grapeId: 'cabernet-sauvignon', share: null, role: 'principal' },
      { grapeId: 'chenin-blanc', share: null, role: 'principal' },
      { grapeId: 'pinotage', share: null, role: 'secondaire' },
      { grapeId: 'syrah', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'blanc'],
    tasting: { tannins: 4, body: 4, ageingPotential: 4, aromas: ['cassis', 'fruits noirs', 'fumé', 'herbes'] },
    foodPairings: ['viandes grillées (braai)', 'agneau', 'gibier'],
    description:
      'Cœur historique et qualitatif du vignoble du Cap, entre montagnes et océan. Réputé pour ses assemblages bordelais, sa Syrah et le Pinotage, cépage sud-africain.',
    source: 'Wines of South Africa ; Stellenbosch Wine Routes', lastVerified: '2024',
  }),

  // ═══════════════════════ AUSTRALIE ═══════════════════════
  region({
    id: 'au-barossa', name: 'Barossa Valley', country: 'Australie', countryCode: 'AU', continent: 'Océanie',
    level: 'region', parentId: 'au', adminRegion: 'Australie-Méridionale',
    climate: { type: 'méditerranéen', influences: ['continentale chaude'], notes: 'Climat chaud et sec, propice aux rouges puissants.' },
    soils: ['argile', 'sable', 'limon'],
    grapes: [
      { grapeId: 'syrah', share: null, role: 'principal' },
      { grapeId: 'grenache', share: null, role: 'secondaire' },
      { grapeId: 'mourvedre', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'blanc', 'liquoreux'],
    tasting: { tannins: 4, body: 5, alcohol: 5, ageingPotential: 5, aromaticIntensity: 5, aromas: ['mûre', 'prune', 'réglisse', 'épices', 'chocolat'] },
    viticulture: { notes: 'Certaines des plus vieilles vignes de Shiraz au monde (plants pré-phylloxériques).' },
    foodPairings: ['viandes grillées', 'ragoûts', 'fromages relevés'],
    description:
      'Région emblématique de la Shiraz australienne, au climat chaud. Rouges opulents et de longue garde, issus notamment de très vieilles vignes.',
    source: 'Wine Australia ; Barossa Grape & Wine Association', lastVerified: '2024',
  }),
  region({
    id: 'au-margaret-river', name: 'Margaret River', country: 'Australie', countryCode: 'AU', continent: 'Océanie',
    level: 'region', parentId: 'au', adminRegion: 'Australie-Occidentale',
    climate: { type: 'méditerranéen', influences: ['maritime (océan Indien de trois côtés)'], notes: 'Climat maritime tempéré, très régulier.' },
    soils: ['graves', 'granite', 'sable'],
    grapes: [
      { grapeId: 'cabernet-sauvignon', share: null, role: 'principal' },
      { grapeId: 'chardonnay', share: null, role: 'principal' },
      { grapeId: 'sauvignon-blanc', share: null, role: 'secondaire' },
      { grapeId: 'semillon', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'blanc'],
    tasting: { tannins: 3, body: 4, acidity: 4, ageingPotential: 4, aromaticIntensity: 4, aromas: ['cassis', 'agrumes', 'fruits blancs', 'fumé'] },
    description:
      'Péninsule maritime de l’ouest australien, réputée pour ses Cabernets Sauvignons élégants (style bordelais) et ses Chardonnays de premier plan.',
    source: 'Wine Australia ; Margaret River Wine Association', lastVerified: '2024',
  }),

  // ═══════════════════════ NOUVELLE-ZÉLANDE ═══════════════════════
  region({
    id: 'nz-marlborough', name: 'Marlborough', country: 'Nouvelle-Zélande', countryCode: 'NZ', continent: 'Océanie',
    level: 'region', parentId: 'nz', adminRegion: 'Île du Sud',
    climate: { type: 'océanique', influences: ['maritime frais', 'fort ensoleillement'], notes: 'Journées ensoleillées et nuits fraîches préservant l’acidité.' },
    soils: ['graves', 'limon', 'argile'],
    grapes: [
      { grapeId: 'sauvignon-blanc', share: null, role: 'principal' },
      { grapeId: 'pinot-noir', share: null, role: 'secondaire' },
      { grapeId: 'chardonnay', share: null, role: 'secondaire' },
    ],
    wineStyles: ['blanc', 'rouge', 'effervescent'],
    tasting: { acidity: 5, body: 2, aromaticIntensity: 5, aromas: ['fruit de la passion', 'agrumes', 'poivron vert', 'groseille à maquereau'] },
    foodPairings: ['fruits de mer', 'poissons', 'salades', 'fromage de chèvre'],
    description:
      'Région la plus productive de Nouvelle-Zélande, à la pointe nord-est de l’Île du Sud. Sa signature mondiale est un Sauvignon Blanc très aromatique et vif ; le Pinot Noir y progresse.',
    source: 'New Zealand Winegrowers ; Wine Marlborough', lastVerified: '2024',
  }),
  region({
    id: 'nz-central-otago', name: 'Central Otago', country: 'Nouvelle-Zélande', countryCode: 'NZ', continent: 'Océanie',
    level: 'region', parentId: 'nz', adminRegion: 'Île du Sud',
    keyFacts: { altitude: '200–450 m' },
    climate: { type: 'continental', influences: ['continentale (rare en NZ)', 'altitude', 'forte amplitude thermique'], notes: 'Vignoble le plus méridional du monde ; seul climat semi-continental de NZ.' },
    soils: ['schiste', 'limon', 'sable'],
    grapes: [{ grapeId: 'pinot-noir', share: null, role: 'principal' }],
    wineStyles: ['rouge', 'blanc'],
    tasting: { tannins: 3, acidity: 4, body: 3, ageingPotential: 4, aromaticIntensity: 5, aromas: ['cerise', 'prune', 'thym', 'épices'] },
    description:
      'Vignoble d’altitude spectaculaire au sud de l’Île du Sud, réputé pour des Pinots Noirs concentrés et parfumés issus d’un climat continental unique en Nouvelle-Zélande.',
    source: 'New Zealand Winegrowers ; Central Otago Winegrowers Association', lastVerified: '2024',
  }),
];

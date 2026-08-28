import type { WineRegionInfo } from '@/lib/types';
import { region } from './_helpers';

/** ESPAGNE & PORTUGAL. Sources : Consejos Reguladores (DOCa/DO), IVDP, OIV. */
export const IBERIA: WineRegionInfo[] = [
  // ═══════════════════════ ESPAGNE ═══════════════════════
  region({
    id: 'es-rioja', name: 'Rioja', country: 'Espagne', countryCode: 'ES', continent: 'Europe',
    level: 'region', parentId: 'es', adminRegion: 'La Rioja / Pays basque / Navarre',
    keyFacts: { vineyardAreaHa: 66000, altitude: '300–700 m' },
    climate: { type: 'continental', influences: ['continentale', 'atlantique (Rioja Alta)', 'méditerranéenne (Rioja Oriental)'], notes: 'Protégée des vents par la Sierra de Cantabria.' },
    soils: ['argile', 'calcaire', 'limon'],
    grapes: [
      { grapeId: 'tempranillo', share: null, role: 'principal' },
      { grapeId: 'garnacha-tinta', share: null, role: 'secondaire' },
      { grapeId: 'viura', share: null, role: 'principal' },
    ],
    wineStyles: ['rouge', 'blanc', 'rosé'],
    tasting: { tannins: 3, acidity: 3, body: 4, ageingPotential: 4, aromas: ['fruits rouges', 'vanille', 'cuir', 'tabac', 'noix de coco'] },
    vinification: { ageing: ['élevage en barrique (souvent chêne américain)'], notes: 'Hiérarchie d’élevage : Joven, Crianza, Reserva, Gran Reserva.' },
    foodPairings: ['agneau rôti', 'charcuterie ibérique', 'viandes grillées', 'fromages'],
    description:
      'Première appellation d’Espagne (DOCa), au nord du pays. Rouges de garde à base de Tempranillo, traditionnellement marqués par un long élevage en fût. Trois sous-zones : Alta, Alavesa et Oriental.',
    source: 'Consejo Regulador DOCa Rioja', lastVerified: '2024',
  }),
  region({
    id: 'es-ribera-del-duero', name: 'Ribera del Duero', country: 'Espagne', countryCode: 'ES', continent: 'Europe',
    level: 'region', parentId: 'es', adminRegion: 'Castille-et-León',
    keyFacts: { altitude: '700–900 m' },
    climate: { type: 'continental', influences: ['continentale extrême', 'forte amplitude thermique jour/nuit'], notes: 'Étés chauds et nuits fraîches, hivers rigoureux, altitude élevée.' },
    soils: ['calcaire', 'argile', 'limon'],
    grapes: [{ grapeId: 'tempranillo', share: null, role: 'principal' }],
    wineStyles: ['rouge', 'rosé'],
    tasting: { tannins: 4, acidity: 3, body: 5, ageingPotential: 5, aromas: ['fruits noirs', 'réglisse', 'épices', 'cacao'] },
    description:
      'Appellation de haute altitude sur le plateau castillan, le long du Duero. Rouges puissants et concentrés à base de Tempranillo (localement « Tinto Fino »). Vega Sicilia y est un domaine historique.',
    source: 'Consejo Regulador DO Ribera del Duero', lastVerified: '2024',
  }),
  region({
    id: 'es-priorat', name: 'Priorat', country: 'Espagne', countryCode: 'ES', continent: 'Europe',
    level: 'region', parentId: 'es', adminRegion: 'Catalogne (Tarragone)',
    keyFacts: { altitude: '100–700 m' },
    climate: { type: 'méditerranéen', influences: ['méditerranéenne', 'montagne'], notes: 'Climat sec et chaud, faibles rendements.' },
    soils: ['ardoise', 'schiste'],
    geology: 'Sol emblématique de « llicorella » : schistes ardoisiers noirs.',
    grapes: [
      { grapeId: 'garnacha-tinta', share: null, role: 'principal' },
      { grapeId: 'carignan', share: null, role: 'principal' },
    ],
    wineStyles: ['rouge'],
    tasting: { tannins: 5, acidity: 3, body: 5, alcohol: 5, ageingPotential: 5, aromaticIntensity: 5, aromas: ['fruits noirs', 'minéralité', 'réglisse', 'garrigue'] },
    description:
      'DOCa catalane (l’une des deux d’Espagne avec Rioja), sur coteaux escarpés de llicorella. Rouges rares, minéraux et concentrés à base de Garnacha et Cariñena de vieilles vignes.',
    source: 'Consejo Regulador DOQ Priorat', lastVerified: '2024',
  }),

  // ═══════════════════════ PORTUGAL ═══════════════════════
  region({
    id: 'pt-douro', name: 'Douro', country: 'Portugal', countryCode: 'PT', continent: 'Europe',
    level: 'region', parentId: 'pt', adminRegion: 'Norte (Douro)',
    keyFacts: { altitude: '100–700 m' },
    climate: { type: 'continental', influences: ['continentale', 'abritée des pluies atlantiques par la Serra do Marão'], notes: 'Étés très chauds et secs dans les vallées encaissées.' },
    soils: ['schiste', 'granite'],
    geology: 'Terrasses de schiste sur les pentes abruptes du fleuve Douro.',
    grapes: [
      { grapeId: 'touriga-nacional', share: null, role: 'principal' },
      { grapeId: 'touriga-franca', share: null, role: 'principal' },
      { grapeId: 'tinta-barroca', share: null, role: 'secondaire' },
      { grapeId: 'tempranillo', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'vin doux naturel', 'blanc'],
    tasting: { tannins: 4, body: 5, ageingPotential: 5, aromaticIntensity: 4, aromas: ['fruits noirs', 'fleurs', 'cacao', 'épices'] },
    vinification: { ageing: ['élevage en fût (tonel/pipe)'], notes: 'Le Porto est muté à l’eau-de-vie ; les rouges secs (Douro DOC) partagent les mêmes cépages.' },
    foodPairings: ['gibier', 'viandes braisées', 'chocolat (Porto)', 'fromages bleus (Porto)'],
    description:
      'Plus ancienne région délimitée du monde (1756) et berceau du vin de Porto. Vignobles en terrasses de schiste le long du Douro, classés à l’UNESCO ; produit aussi d’excellents rouges secs.',
    source: 'IVDP (Instituto dos Vinhos do Douro e do Porto) ; UNESCO', lastVerified: '2024',
  }),
];

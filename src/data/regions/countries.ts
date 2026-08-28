import type { WineRegionInfo } from '@/lib/types';
import { region } from './_helpers';

/**
 * Fiches au niveau « pays » (vue mondiale). Volontairement synthétiques :
 * le détail vit dans les régions. Sources : OIV, organismes nationaux.
 */
export const COUNTRIES: WineRegionInfo[] = [
  region({
    id: 'fr', name: 'France', country: 'France', countryCode: 'FR', continent: 'Europe', level: 'country',
    wineStyles: ['rouge', 'blanc', 'rosé', 'effervescent', 'liquoreux'],
    description:
      'Référence historique du vin, la France structure sa production autour du système des AOC/AOP. Principaux vignobles : Bordeaux, Bourgogne, Champagne, Rhône, Loire, Alsace, Languedoc, Provence.',
    source: 'OIV ; INAO', lastVerified: '2024',
  }),
  region({
    id: 'it', name: 'Italie', country: 'Italie', countryCode: 'IT', continent: 'Europe', level: 'country',
    wineStyles: ['rouge', 'blanc', 'rosé', 'effervescent'],
    description:
      'Premier pays producteur mondial en volume, doté d’une exceptionnelle diversité de cépages autochtones. Régions majeures : Piémont, Toscane, Vénétie.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'es', name: 'Espagne', country: 'Espagne', countryCode: 'ES', continent: 'Europe', level: 'country',
    wineStyles: ['rouge', 'blanc', 'rosé', 'effervescent'],
    description:
      'Premier vignoble du monde en superficie. Appellations phares : Rioja, Ribera del Duero, Priorat, Penedès (Cava).',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'pt', name: 'Portugal', country: 'Portugal', countryCode: 'PT', continent: 'Europe', level: 'country',
    wineStyles: ['rouge', 'blanc', 'vin doux naturel'],
    description:
      'Berceau du Porto et de très nombreux cépages autochtones. Région emblématique : la vallée du Douro.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'de', name: 'Allemagne', country: 'Allemagne', countryCode: 'DE', continent: 'Europe', level: 'country',
    wineStyles: ['blanc', 'effervescent', 'rouge'],
    description: 'Patrie du Riesling, spécialiste des vins blancs de climat frais (Mosel, Rheingau, Pfalz).',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'at', name: 'Autriche', country: 'Autriche', countryCode: 'AT', continent: 'Europe', level: 'country',
    wineStyles: ['blanc', 'rouge'],
    description: 'Réputée pour le Grüner Veltliner et les Rieslings de la Wachau.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'gr', name: 'Grèce', country: 'Grèce', countryCode: 'GR', continent: 'Europe', level: 'country',
    wineStyles: ['blanc', 'rouge', 'liquoreux'],
    description: 'Vignoble antique aux cépages autochtones (Assyrtiko de Santorin, Xinomavro, Agiorgitiko).',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'ge', name: 'Géorgie', country: 'Géorgie', countryCode: 'GE', continent: 'Asie', level: 'country',
    wineStyles: ['orange', 'rouge', 'blanc'],
    description:
      'Considérée comme un berceau de la viticulture ; tradition des vins en amphores (qvevri), inscrite à l’UNESCO.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'hu', name: 'Hongrie', country: 'Hongrie', countryCode: 'HU', continent: 'Europe', level: 'country',
    wineStyles: ['liquoreux', 'blanc', 'rouge'],
    description: 'Célèbre pour le Tokaji, vin liquoreux historique.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'ro', name: 'Roumanie', country: 'Roumanie', countryCode: 'RO', continent: 'Europe', level: 'country',
    wineStyles: ['rouge', 'blanc'],
    description: 'Important vignoble d’Europe de l’Est, mêlant cépages internationaux et autochtones.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'us', name: 'États-Unis', country: 'États-Unis', countryCode: 'US', continent: 'Amérique du Nord', level: 'country',
    wineStyles: ['rouge', 'blanc', 'rosé', 'effervescent'],
    description:
      'Quatrième producteur mondial, dominé par la Californie (Napa, Sonoma), l’Oregon et l’État de Washington. Zones délimitées : AVA.',
    source: 'OIV ; TTB (AVA)', lastVerified: '2024',
  }),
  region({
    id: 'ca', name: 'Canada', country: 'Canada', countryCode: 'CA', continent: 'Amérique du Nord', level: 'country',
    wineStyles: ['blanc', 'rouge', 'liquoreux'],
    description: 'Réputé pour ses vins de glace (icewine) ; principales zones en Ontario et Colombie-Britannique.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'mx', name: 'Mexique', country: 'Mexique', countryCode: 'MX', continent: 'Amérique du Nord', level: 'country',
    wineStyles: ['rouge', 'blanc'],
    description: 'Plus ancien vignoble des Amériques ; renaissance qualitative en Basse-Californie (Valle de Guadalupe).',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'ar', name: 'Argentine', country: 'Argentine', countryCode: 'AR', continent: 'Amérique du Sud', level: 'country',
    wineStyles: ['rouge', 'blanc', 'rosé'],
    description: 'Premier producteur d’Amérique du Sud, patrie du Malbec ; vignobles d’altitude à Mendoza.',
    source: 'OIV ; Wines of Argentina', lastVerified: '2024',
  }),
  region({
    id: 'cl', name: 'Chili', country: 'Chili', countryCode: 'CL', continent: 'Amérique du Sud', level: 'country',
    wineStyles: ['rouge', 'blanc'],
    description: 'Exportateur majeur, aux vallées longitudinales protégées par les Andes et le Pacifique ; signature Carménère.',
    source: 'OIV ; Wines of Chile', lastVerified: '2024',
  }),
  region({
    id: 'uy', name: 'Uruguay', country: 'Uruguay', countryCode: 'UY', continent: 'Amérique du Sud', level: 'country',
    wineStyles: ['rouge', 'blanc'],
    description: 'Spécialiste du Tannat, cépage emblématique du pays.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'br', name: 'Brésil', country: 'Brésil', countryCode: 'BR', continent: 'Amérique du Sud', level: 'country',
    wineStyles: ['effervescent', 'rouge', 'blanc'],
    description: 'Production notable d’effervescents dans la Serra Gaúcha (Vale dos Vinhedos).',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'za', name: 'Afrique du Sud', country: 'Afrique du Sud', countryCode: 'ZA', continent: 'Afrique', level: 'country',
    wineStyles: ['rouge', 'blanc', 'effervescent'],
    description: 'Vignoble du Cap, entre Atlantique et montagnes ; Chenin Blanc et Pinotage emblématiques.',
    source: 'OIV ; Wines of South Africa', lastVerified: '2024',
  }),
  region({
    id: 'ma', name: 'Maroc', country: 'Maroc', countryCode: 'MA', continent: 'Afrique', level: 'country',
    wineStyles: ['rouge', 'rosé', 'blanc'],
    description: 'Principal vignoble du Maghreb, de climat méditerranéen à influence atlantique.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'au', name: 'Australie', country: 'Australie', countryCode: 'AU', continent: 'Océanie', level: 'country',
    wineStyles: ['rouge', 'blanc', 'effervescent', 'liquoreux'],
    description: 'Grand exportateur, réputé pour la Shiraz (Barossa) et les blancs (Margaret River, Clare/Eden Valley).',
    source: 'OIV ; Wine Australia', lastVerified: '2024',
  }),
  region({
    id: 'nz', name: 'Nouvelle-Zélande', country: 'Nouvelle-Zélande', countryCode: 'NZ', continent: 'Océanie', level: 'country',
    wineStyles: ['blanc', 'rouge', 'effervescent'],
    description: 'Climat frais et maritime ; renommée mondiale pour le Sauvignon Blanc de Marlborough et le Pinot Noir.',
    source: 'OIV ; New Zealand Winegrowers', lastVerified: '2024',
  }),
  region({
    id: 'cn', name: 'Chine', country: 'Chine', countryCode: 'CN', continent: 'Asie', level: 'country',
    wineStyles: ['rouge', 'blanc'],
    description: 'Vignoble en forte croissance ; le Ningxia s’impose pour les rouges de style bordelais.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'jp', name: 'Japon', country: 'Japon', countryCode: 'JP', continent: 'Asie', level: 'country',
    wineStyles: ['blanc', 'rouge'],
    description: 'Cépage autochtone Koshu ; principal foyer viticole dans la préfecture de Yamanashi.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'lb', name: 'Liban', country: 'Liban', countryCode: 'LB', continent: 'Asie', level: 'country',
    wineStyles: ['rouge', 'blanc', 'rosé'],
    description: 'Vignoble historique de la plaine de la Bekaa, de climat méditerranéen d’altitude.',
    source: 'OIV', lastVerified: '2024',
  }),
  region({
    id: 'il', name: 'Israël', country: 'Israël', countryCode: 'IL', continent: 'Asie', level: 'country',
    wineStyles: ['rouge', 'blanc'],
    description: 'Vignoble en essor qualitatif, notamment sur le plateau du Golan et les collines de Judée.',
    source: 'OIV', lastVerified: '2024',
  }),
];

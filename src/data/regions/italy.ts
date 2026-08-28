import type { WineRegionInfo } from '@/lib/types';
import { region } from './_helpers';

/**
 * ITALIE — Piémont, Toscane, Vénétie. Sources : Consorzi de tutela (DOCG/DOC),
 * OIV. Profils gustatifs indicatifs.
 */
export const ITALY: WineRegionInfo[] = [
  // ═══════════════════════ PIÉMONT ═══════════════════════
  region({
    id: 'it-piemonte', name: 'Piémont', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'region', parentId: 'it', adminRegion: 'Piemonte',
    keyFacts: { altitude: '150–450 m' },
    climate: { type: 'continental', influences: ['continentale', 'brouillards automnaux'], notes: 'Étés chauds, automnes brumeux (d’où le nom « Nebbiolo », de nebbia, brouillard).' },
    soils: ['calcaire', 'marne', 'argile'],
    grapes: [
      { grapeId: 'nebbiolo', share: null, role: 'principal' },
      { grapeId: 'barbera', share: null, role: 'principal' },
      { grapeId: 'dolcetto', share: null, role: 'secondaire' },
    ],
    wineStyles: ['rouge', 'blanc', 'effervescent'],
    tasting: { tannins: 4, acidity: 4, body: 4, ageingPotential: 5, aromas: ['cerise', 'rose', 'goudron', 'truffe'] },
    description:
      'Région du nord-ouest de l’Italie, au pied des Alpes, célèbre pour le Nebbiolo (Barolo, Barbaresco) et les cépages Barbera et Dolcetto. Les paysages viticoles du Piémont sont classés à l’UNESCO.',
    source: 'Consorzi Piemonte ; UNESCO', lastVerified: '2024',
  }),
  region({
    id: 'it-piemonte-langhe', name: 'Langhe', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'subregion', parentId: 'it-piemonte', adminRegion: 'Cuneo',
    soils: ['marne', 'calcaire', 'argile'],
    grapes: [{ grapeId: 'nebbiolo', share: null, role: 'principal' }, { grapeId: 'barbera', share: null, role: 'principal' }, { grapeId: 'dolcetto', share: null, role: 'secondaire' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, acidity: 4, body: 4, ageingPotential: 5, aromas: ['cerise', 'rose', 'épices'] },
    description: 'Collines au sud d’Alba, cœur du Nebbiolo, abritant les zones de Barolo et de Barbaresco.',
    source: 'Consorzio Langhe', lastVerified: '2024',
  }),
  region({
    id: 'it-piemonte-barolo', name: 'Barolo', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'appellation', parentId: 'it-piemonte-langhe', adminRegion: 'Cuneo',
    soils: ['marne', 'calcaire', 'argile'],
    geology: 'Marnes de Sant’Agata (styles plus souples) et grès d’Helvétien (styles plus austères).',
    grapes: [{ grapeId: 'nebbiolo', share: 100, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 5, acidity: 5, body: 4, alcohol: 4, ageingPotential: 5, aromaticIntensity: 5, aromas: ['cerise', 'rose fanée', 'goudron', 'truffe', 'cuir', 'réglisse'] },
    viticulture: { notes: 'Cru unique : 100 % Nebbiolo. Élevage minimum réglementé en bois.' },
    vinification: { ageing: ['élevage en bois'], ageingDuration: '≥ 38 mois (dont ≥ 18 en bois) ; Riserva ≥ 62 mois' },
    foodPairings: ['bœuf braisé', 'gibier', 'risotto aux champignons', 'truffe', 'fromages affinés'],
    description:
      'DOCG surnommée « le roi des vins et le vin des rois ». Rouge de très longue garde, exclusivement issu du Nebbiolo, aux tanins fermes et à l’aromatique complexe.',
    source: 'Consorzio Barolo Barbaresco Alba Langhe e Dogliani', lastVerified: '2024',
  }),
  region({
    id: 'it-piemonte-barbaresco', name: 'Barbaresco', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'appellation', parentId: 'it-piemonte-langhe', adminRegion: 'Cuneo',
    soils: ['marne', 'calcaire'],
    grapes: [{ grapeId: 'nebbiolo', share: 100, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, acidity: 5, body: 4, ageingPotential: 5, aromaticIntensity: 5, aromas: ['cerise', 'rose', 'goudron', 'épices'] },
    vinification: { ageing: ['élevage en bois'], ageingDuration: '≥ 26 mois ; Riserva ≥ 50 mois' },
    description:
      'DOCG voisine de Barolo, également 100 % Nebbiolo, aux vins généralement un peu plus souples et précoces, sur des sols un peu plus fertiles.',
    source: 'Consorzio Barolo Barbaresco Alba Langhe e Dogliani', lastVerified: '2024',
  }),

  // ═══════════════════════ TOSCANE ═══════════════════════
  region({
    id: 'it-toscana', name: 'Toscane', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'region', parentId: 'it', adminRegion: 'Toscana',
    climate: { type: 'méditerranéen', influences: ['méditerranéenne', 'altitude des collines'] },
    soils: ['calcaire', 'argile', 'schiste', 'galets roulés'],
    geology: 'Sols de galestro (schiste marneux) et d’alberese (calcaire).',
    grapes: [{ grapeId: 'sangiovese', share: null, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, acidity: 4, body: 4, ageingPotential: 4, aromas: ['cerise', 'prune', 'herbes séchées', 'tabac'] },
    description:
      'Région centrale emblématique du Sangiovese (Chianti, Brunello di Montalcino, Vino Nobile), et berceau des « Super Toscans » sur la côte (Bolgheri).',
    source: 'Consorzi Toscana', lastVerified: '2024',
  }),
  region({
    id: 'it-toscana-chianti-classico', name: 'Chianti Classico', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'subregion', parentId: 'it-toscana', adminRegion: 'Firenze / Siena',
    soils: ['schiste', 'calcaire', 'argile'],
    grapes: [{ grapeId: 'sangiovese', share: 90, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, acidity: 5, body: 3, ageingPotential: 4, aromas: ['cerise', 'violette', 'herbes', 'terre'] },
    foodPairings: ['pâtes à la sauce tomate', 'viandes grillées', 'charcuterie', 'pecorino'],
    description:
      'Zone historique du Chianti entre Florence et Sienne, identifiée par son coq noir (Gallo Nero). Majoritairement Sangiovese, minimum 80 % réglementaire.',
    source: 'Consorzio Vino Chianti Classico', lastVerified: '2024',
  }),
  region({
    id: 'it-toscana-brunello-montalcino', name: 'Brunello di Montalcino', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'appellation', parentId: 'it-toscana', adminRegion: 'Siena',
    soils: ['calcaire', 'argile', 'schiste'],
    grapes: [{ grapeId: 'sangiovese', share: 100, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 4, acidity: 4, body: 5, ageingPotential: 5, aromaticIntensity: 5, aromas: ['cerise noire', 'cuir', 'tabac', 'épices'] },
    vinification: { ageing: ['élevage en bois'], ageingDuration: '≥ 2 ans en bois, mise en marché la 5e année' },
    description:
      'DOCG de la colline de Montalcino, 100 % Sangiovese (clone « Brunello »). Rouge concentré et de très longue garde, parmi les plus prestigieux d’Italie.',
    source: 'Consorzio del Vino Brunello di Montalcino', lastVerified: '2024',
  }),

  // ═══════════════════════ VÉNÉTIE ═══════════════════════
  region({
    id: 'it-veneto', name: 'Vénétie', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'region', parentId: 'it', adminRegion: 'Veneto',
    climate: { type: 'continental', influences: ['continentale', 'influence alpine', 'lac de Garde'] },
    soils: ['calcaire', 'volcanique', 'argile'],
    grapes: [
      { grapeId: 'corvina', share: null, role: 'principal' },
      { grapeId: 'garganega', share: null, role: 'principal' },
      { grapeId: 'glera', share: null, role: 'principal' },
    ],
    wineStyles: ['rouge', 'blanc', 'effervescent'],
    description:
      'Première région italienne en volume, à la production très diverse : rouges de Valpolicella (dont l’Amarone), blancs de Soave et effervescents Prosecco.',
    source: 'Consorzi Veneto', lastVerified: '2024',
  }),
  region({
    id: 'it-veneto-valpolicella', name: 'Valpolicella', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'subregion', parentId: 'it-veneto', adminRegion: 'Verona',
    soils: ['calcaire', 'volcanique'],
    grapes: [{ grapeId: 'corvina', share: null, role: 'principal' }],
    wineStyles: ['rouge'],
    tasting: { tannins: 3, acidity: 4, body: 4, ageingPotential: 4, aromas: ['cerise', 'fruits confits', 'épices', 'chocolat'] },
    vinification: { ageing: ['passerillage (appassimento) pour l’Amarone'], notes: 'L’Amarone et le Recioto sont issus de raisins passerillés (séchés).' },
    foodPairings: ['viandes braisées', 'gibier', 'fromages affinés'],
    description:
      'Zone de collines au nord de Vérone. Assemblages à base de Corvina, du Valpolicella léger jusqu’à l’Amarone concentré issu de raisins séchés.',
    source: 'Consorzio Valpolicella', lastVerified: '2024',
  }),
  region({
    id: 'it-veneto-soave', name: 'Soave', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'appellation', parentId: 'it-veneto', adminRegion: 'Verona',
    soils: ['volcanique', 'calcaire'],
    grapes: [{ grapeId: 'garganega', share: null, role: 'principal' }],
    wineStyles: ['blanc'],
    tasting: { acidity: 4, body: 2, aromas: ['fleurs blanches', 'amande', 'agrumes', 'fruits jaunes'] },
    description: 'Appellation de blancs secs à base de Garganega, sur sols volcaniques et calcaires à l’est de Vérone.',
    source: 'Consorzio Soave', lastVerified: '2024',
  }),
  region({
    id: 'it-veneto-prosecco', name: 'Prosecco (Conegliano Valdobbiadene)', country: 'Italie', countryCode: 'IT', continent: 'Europe',
    level: 'appellation', parentId: 'it-veneto', adminRegion: 'Treviso',
    soils: ['argile', 'calcaire'],
    grapes: [{ grapeId: 'glera', share: null, role: 'principal' }],
    wineStyles: ['effervescent'],
    tasting: { acidity: 4, body: 2, sweetness: 2, aromas: ['pomme verte', 'poire', 'fleurs', 'agrumes'] },
    vinification: { ageing: ['méthode Charmat (cuve close)'], notes: 'Prise de mousse en cuve close, préservant le fruité du Glera.' },
    foodPairings: ['apéritif', 'antipasti', 'fritures de légumes'],
    description:
      'Berceau du Prosecco de qualité (DOCG des collines de Conegliano-Valdobbiadene, classées UNESCO). Effervescent frais et fruité, élaboré en cuve close.',
    source: 'Consorzio Conegliano Valdobbiadene ; UNESCO', lastVerified: '2024',
  }),
];

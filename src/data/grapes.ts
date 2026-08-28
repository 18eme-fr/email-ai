import type { GrapeVariety } from '@/lib/types';

/**
 * Table `grape_varieties`. Cépages référencés par les fiches régionales.
 * Descriptions volontairement factuelles ; enrichissables ultérieurement.
 */
export const GRAPES: GrapeVariety[] = [
  // — Rouges internationaux —
  { id: 'cabernet-sauvignon', name: 'Cabernet Sauvignon', color: 'rouge', aliases: [], description: 'Cépage rouge tardif et tannique, structurant des grands vins de garde, né à Bordeaux.' },
  { id: 'merlot', name: 'Merlot', color: 'rouge', aliases: [], description: 'Cépage rouge souple et fruité, dominant sur la rive droite bordelaise.' },
  { id: 'cabernet-franc', name: 'Cabernet Franc', color: 'rouge', aliases: ['Bouchet', 'Breton'], description: 'Cépage rouge aromatique, pilier de la Loire et complément bordelais.' },
  { id: 'petit-verdot', name: 'Petit Verdot', color: 'rouge', aliases: [], description: 'Cépage rouge tardif d’appoint dans le Médoc, apportant couleur et tanins.' },
  { id: 'malbec', name: 'Malbec', color: 'rouge', aliases: ['Côt', 'Auxerrois'], description: 'Cépage rouge originaire du Sud-Ouest, emblème de Cahors et de Mendoza.' },
  { id: 'pinot-noir', name: 'Pinot Noir', color: 'rouge', aliases: ['Spätburgunder'], description: 'Cépage rouge fin et précoce des climats frais, star de la Bourgogne.' },
  { id: 'syrah', name: 'Syrah', color: 'rouge', aliases: ['Shiraz'], description: 'Cépage rouge épicé de la vallée du Rhône septentrionale, dit Shiraz en Australie.' },
  { id: 'grenache', name: 'Grenache', color: 'rouge', aliases: ['Garnacha'], description: 'Cépage rouge chaleureux et généreux, pilier du Rhône méridional et de l’Espagne.' },
  { id: 'mourvedre', name: 'Mourvèdre', color: 'rouge', aliases: ['Monastrell'], description: 'Cépage rouge tardif et tannique, apprécié en Provence et dans le Sud.' },
  { id: 'carignan', name: 'Carignan', color: 'rouge', aliases: ['Cariñena', 'Mazuelo'], description: 'Cépage rouge méridional de forte production, réhabilité en vieilles vignes.' },
  { id: 'cinsault', name: 'Cinsault', color: 'rouge', aliases: [], description: 'Cépage rouge du Sud, souvent utilisé en assemblage et pour le rosé.' },

  // — Rouges italiens & ibériques —
  { id: 'nebbiolo', name: 'Nebbiolo', color: 'rouge', aliases: ['Spanna'], description: 'Cépage rouge piémontais, tannique et aromatique, unique cépage du Barolo et du Barbaresco.' },
  { id: 'barbera', name: 'Barbera', color: 'rouge', aliases: [], description: 'Cépage rouge piémontais fruité à l’acidité marquée et aux tanins modérés.' },
  { id: 'dolcetto', name: 'Dolcetto', color: 'rouge', aliases: [], description: 'Cépage rouge piémontais précoce, souple et de consommation jeune.' },
  { id: 'sangiovese', name: 'Sangiovese', color: 'rouge', aliases: ['Brunello', 'Prugnolo Gentile'], description: 'Cépage rouge le plus planté d’Italie, âme du Chianti et de Brunello di Montalcino.' },
  { id: 'corvina', name: 'Corvina', color: 'rouge', aliases: [], description: 'Cépage rouge vénète, base des assemblages de Valpolicella et d’Amarone.' },
  { id: 'tempranillo', name: 'Tempranillo', color: 'rouge', aliases: ['Tinta Roriz', 'Tinto Fino', 'Aragonez'], description: 'Cépage rouge phare de l’Espagne, cœur de la Rioja et de la Ribera del Duero.' },
  { id: 'garnacha-tinta', name: 'Garnacha (Espagne)', color: 'rouge', aliases: ['Grenache'], description: 'Grenache noir, essentiel au Priorat et à de nombreuses appellations espagnoles.' },
  { id: 'touriga-nacional', name: 'Touriga Nacional', color: 'rouge', aliases: [], description: 'Cépage rouge portugais noble, pilier du Porto et des rouges secs du Douro.' },
  { id: 'touriga-franca', name: 'Touriga Franca', color: 'rouge', aliases: [], description: 'Cépage rouge portugais aromatique, très planté dans le Douro.' },
  { id: 'tinta-barroca', name: 'Tinta Barroca', color: 'rouge', aliases: [], description: 'Cépage rouge du Douro apportant sucre et couleur aux assemblages.' },

  // — Rouges du Nouveau Monde / autres —
  { id: 'pinotage', name: 'Pinotage', color: 'rouge', aliases: [], description: 'Croisement sud-africain de Pinot Noir et Cinsault, créé en 1925.' },
  { id: 'zinfandel', name: 'Zinfandel', color: 'rouge', aliases: ['Primitivo'], description: 'Cépage rouge généreux emblématique de Californie, identique au Primitivo.' },
  { id: 'carmenere', name: 'Carménère', color: 'rouge', aliases: [], description: 'Cépage rouge bordelais devenu signature du Chili.' },

  // — Blancs internationaux —
  { id: 'chardonnay', name: 'Chardonnay', color: 'blanc', aliases: [], description: 'Cépage blanc caméléon, roi de la Bourgogne et composant de la Champagne.' },
  { id: 'sauvignon-blanc', name: 'Sauvignon Blanc', color: 'blanc', aliases: [], description: 'Cépage blanc vif et aromatique, emblème de la Loire, de Bordeaux et de Marlborough.' },
  { id: 'semillon', name: 'Sémillon', color: 'blanc', aliases: [], description: 'Cépage blanc bordelais, base des liquoreux de Sauternes et des blancs secs.' },
  { id: 'chenin-blanc', name: 'Chenin Blanc', color: 'blanc', aliases: ['Steen'], description: 'Cépage blanc polyvalent de la Loire, également très planté en Afrique du Sud.' },
  { id: 'riesling', name: 'Riesling', color: 'blanc', aliases: [], description: 'Cépage blanc aromatique et racé des climats frais, noble en Alsace et en Allemagne.' },
  { id: 'viognier', name: 'Viognier', color: 'blanc', aliases: [], description: 'Cépage blanc parfumé du Rhône nord, signature de Condrieu.' },
  { id: 'marsanne', name: 'Marsanne', color: 'blanc', aliases: [], description: 'Cépage blanc rhodanien ample, souvent assemblé à la Roussanne.' },
  { id: 'roussanne', name: 'Roussanne', color: 'blanc', aliases: [], description: 'Cépage blanc rhodanien fin et aromatique.' },

  // — Blancs italiens, ibériques & autres —
  { id: 'garganega', name: 'Garganega', color: 'blanc', aliases: [], description: 'Cépage blanc vénète, base du Soave.' },
  { id: 'glera', name: 'Glera', color: 'blanc', aliases: ['Prosecco'], description: 'Cépage blanc de Vénétie, base du Prosecco effervescent.' },
  { id: 'albarino', name: 'Albariño', color: 'blanc', aliases: ['Alvarinho'], description: 'Cépage blanc parfumé du nord-ouest ibérique.' },
  { id: 'viura', name: 'Viura', color: 'blanc', aliases: ['Macabeo'], description: 'Cépage blanc principal des blancs de la Rioja et des cavas.' },
  { id: 'pinot-gris', name: 'Pinot Gris', color: 'blanc', aliases: ['Grauburgunder'], description: 'Cépage blanc riche, noble en Alsace.' },
  { id: 'gewurztraminer', name: 'Gewurztraminer', color: 'blanc', aliases: [], description: 'Cépage blanc très aromatique et épicé, emblème alsacien.' },
];

export const GRAPE_BY_ID = new Map(GRAPES.map((g) => [g.id, g]));

export function grapeName(id: string): string {
  return GRAPE_BY_ID.get(id)?.name ?? id;
}

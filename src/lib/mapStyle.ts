import type { StyleSpecification } from 'maplibre-gl';

/**
 * Fond de carte « atlas contemporain » : base claire CARTO Positron désaturée,
 * sur un aplat parchemin. Les couches viticoles (remplissages, contours,
 * libellés) sont ajoutées dynamiquement par le composant carte.
 *
 * Aucune clé d'API n'est requise (MapLibre + tuiles publiques).
 */
export const BASE_STYLE: StyleSpecification = {
  version: 8,
  name: 'Atlas du vin — base',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a> · tracés viticoles indicatifs',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#e7e1d3' },
    },
    {
      id: 'carto-base',
      type: 'raster',
      source: 'carto',
      paint: {
        'raster-opacity': 0.9,
        'raster-saturation': -0.35,
        'raster-contrast': -0.05,
      },
    },
  ],
};

/** Nom de la police pour les libellés (présente sur le serveur de glyphes public). */
export const LABEL_FONT = ['Open Sans Semibold'];
export const LABEL_FONT_REGULAR = ['Open Sans Regular'];

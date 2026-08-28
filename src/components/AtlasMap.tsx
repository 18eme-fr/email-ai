'use client';

import { useEffect, useRef } from 'react';
import maplibregl, {
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { BASE_STYLE, LABEL_FONT } from '@/lib/mapStyle';
import {
  ALL_FEATURES,
  COUNTRY_COLORS,
  DEFAULT_COLOR,
  LEVEL_ZOOM,
  bboxOf,
} from '@/lib/atlas';
import type { AtlasLevel } from '@/lib/types';
import { LEVEL_ORDER } from '@/lib/types';
import { matchingIds } from '@/lib/filters';
import { regionsForGrape } from '@/lib/search';
import { useAtlas } from '@/state/store';

const SOURCE = 'atlas';

/** Opacité de remplissage par niveau (zone active). Calibrée pour rester
 *  lisible au-dessus du fond clair CARTO comme sur l'aplat parchemin. */
const FILL_OPACITY: Record<AtlasLevel, number> = {
  country: 0.34,
  region: 0.48,
  subregion: 0.56,
  appellation: 0.62,
};
const DIM_OPACITY = 0.08;

/** Expression MapLibre : couleur de remplissage selon le pays. */
function colorExpression(): ExpressionSpecification {
  const match: (string | ExpressionSpecification)[] = ['match', ['get', 'countryCode']];
  for (const [code, color] of Object.entries(COUNTRY_COLORS)) {
    match.push(code, color);
  }
  match.push(DEFAULT_COLOR);
  return match as unknown as ExpressionSpecification;
}

/** Rang de profondeur d'un niveau (pour choisir l'entité la plus fine au clic). */
const LEVEL_DEPTH: Record<AtlasLevel, number> = {
  country: 0,
  region: 1,
  subregion: 2,
  appellation: 3,
};

export default function AtlasMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);

  // Sélecteurs de l'état global
  const selectedId = useAtlas((s) => s.selectedId);
  const hoveredId = useAtlas((s) => s.hoveredId);
  const filters = useAtlas((s) => s.filters);
  const grapeExplorer = useAtlas((s) => s.grapeExplorer);
  const select = useAtlas((s) => s.select);
  const hover = useAtlas((s) => s.hover);
  const setZoom = useAtlas((s) => s.setZoom);
  const setMapFocus = useAtlas((s) => s.setMapFocus);

  const fillLayerIds = LEVEL_ORDER.map((l) => `fill-${l}`);

  // ————— Initialisation de la carte —————
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: [9, 32],
      zoom: 1.7,
      minZoom: 1,
      maxZoom: 13,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      map.addSource(SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: ALL_FEATURES },
      });

      const color = colorExpression();

      // Une paire remplissage/contour par niveau, bornée par sa bande de zoom.
      for (const level of LEVEL_ORDER) {
        const [minz, maxz] = LEVEL_ZOOM[level];
        map.addLayer({
          id: `fill-${level}`,
          type: 'fill',
          source: SOURCE,
          minzoom: minz,
          maxzoom: maxz,
          filter: ['==', ['get', 'level'], level],
          paint: {
            'fill-color': color,
            'fill-opacity': FILL_OPACITY[level],
          },
        });
        map.addLayer({
          id: `line-${level}`,
          type: 'line',
          source: SOURCE,
          minzoom: minz,
          maxzoom: maxz,
          filter: ['==', ['get', 'level'], level],
          paint: {
            'line-color': color,
            'line-width': level === 'country' ? 0.8 : 1.2,
            'line-opacity': 0.7,
          },
        });
      }

      // Mise en évidence « explorer un cépage » (contour doré).
      map.addLayer({
        id: 'grape-highlight',
        type: 'line',
        source: SOURCE,
        filter: ['==', ['get', 'id'], '__none__'],
        paint: { 'line-color': '#b08a3e', 'line-width': 2.4, 'line-opacity': 0.9 },
      });

      // Survol.
      map.addLayer({
        id: 'hover-line',
        type: 'line',
        source: SOURCE,
        filter: ['==', ['get', 'id'], '__none__'],
        paint: { 'line-color': '#7a2338', 'line-width': 2, 'line-opacity': 0.9 },
      });

      // Sélection (persistante à tous les niveaux de zoom).
      map.addLayer({
        id: 'selected-fill',
        type: 'fill',
        source: SOURCE,
        filter: ['==', ['get', 'id'], '__none__'],
        paint: { 'fill-color': '#7a2338', 'fill-opacity': 0.22 },
      });
      map.addLayer({
        id: 'selected-line',
        type: 'line',
        source: SOURCE,
        filter: ['==', ['get', 'id'], '__none__'],
        paint: { 'line-color': '#7a2338', 'line-width': 2.6, 'line-opacity': 1 },
      });

      // Libellés par niveau.
      for (const level of LEVEL_ORDER) {
        const [minz, maxz] = LEVEL_ZOOM[level];
        map.addLayer({
          id: `label-${level}`,
          type: 'symbol',
          source: SOURCE,
          minzoom: Math.max(minz, level === 'country' ? 2.2 : minz),
          maxzoom: maxz,
          filter: ['==', ['get', 'level'], level],
          layout: {
            'text-field': ['get', 'name'],
            'text-font': LABEL_FONT,
            'text-size': level === 'country' ? 12 : level === 'region' ? 12.5 : 11.5,
            'text-transform': level === 'country' ? 'uppercase' : 'none',
            'text-letter-spacing': level === 'country' ? 0.12 : 0.02,
            'text-max-width': 8,
            'text-padding': 6,
            'symbol-sort-key': 4 - LEVEL_DEPTH[level],
          },
          paint: {
            'text-color': '#2b2e38',
            'text-halo-color': 'rgba(247,244,238,0.92)',
            'text-halo-width': 1.6,
          },
        });
      }

      readyRef.current = true;
      applyDynamicState();

      // API de centrage exposée aux autres composants.
      setMapFocus((id: string) => focusFeature(id));
    });

    // ————— Interactions —————
    const onMove = (e: MapLayerMouseEvent) => {
      const f = topFeature(e.features);
      const id = f?.properties?.id as string | undefined;
      map.getCanvas().style.cursor = id ? 'pointer' : '';
      hover(id ?? null);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
      hover(null);
    };
    const onClick = (e: MapLayerMouseEvent) => {
      const f = topFeature(e.features);
      const id = f?.properties?.id as string | undefined;
      if (!id) return;
      select(id);
      focusFeature(id);
    };

    map.on('mousemove', fillLayerIds, onMove);
    map.on('mouseleave', fillLayerIds, onLeave);
    map.on('click', fillLayerIds, onClick);
    map.on('zoomend', () => setZoom(map.getZoom()));
    map.on('moveend', () => setZoom(map.getZoom()));

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
      setMapFocus(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Choisit l'entité la plus fine (appellation > … > pays) parmi les résultats. */
  function topFeature(features?: MapGeoJSONFeature[]): MapGeoJSONFeature | undefined {
    if (!features || features.length === 0) return undefined;
    return [...features].sort(
      (a, b) =>
        LEVEL_DEPTH[(b.properties?.level as AtlasLevel) ?? 'country'] -
        LEVEL_DEPTH[(a.properties?.level as AtlasLevel) ?? 'country'],
    )[0];
  }

  /** Centre et ajuste la carte sur une zone (en tenant compte du panneau). */
  function focusFeature(id: string) {
    const map = mapRef.current;
    if (!map) return;
    const bbox = bboxOf(id);
    if (!bbox) return;
    const isWide = window.innerWidth >= 1024;
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      {
        padding: {
          top: 90,
          bottom: 60,
          left: 60,
          right: isWide ? 460 : 60,
        },
        maxZoom: 11,
        duration: 900,
      },
    );
  }

  /** Applique opacités (filtres), contour cépage et sélection/survol. */
  function applyDynamicState() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // Ensemble actif = filtres ∩ (cépage exploré le cas échéant).
    const filterSet = matchingIds(filters);
    const grapeSet = grapeExplorer ? new Set(regionsForGrape(grapeExplorer)) : null;
    const activeIds: string[] = [];
    for (const id of filterSet) {
      if (!grapeSet || grapeSet.has(id)) activeIds.push(id);
    }
    for (const level of LEVEL_ORDER) {
      const base = FILL_OPACITY[level];
      const opacityExpr: ExpressionSpecification = [
        'case',
        ['in', ['get', 'id'], ['literal', activeIds]],
        base,
        DIM_OPACITY,
      ];
      map.setPaintProperty(`fill-${level}`, 'fill-opacity', opacityExpr);
    }

    // Contour doré sur les zones du cépage exploré.
    map.setFilter(
      'grape-highlight',
      grapeSet
        ? ['in', ['get', 'id'], ['literal', [...grapeSet]]]
        : ['==', ['get', 'id'], '__none__'],
    );
  }

  // ————— Réactions à l'état —————
  useEffect(() => {
    applyDynamicState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, grapeExplorer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const f: maplibregl.FilterSpecification = selectedId
      ? ['==', ['get', 'id'], selectedId]
      : ['==', ['get', 'id'], '__none__'];
    map.setFilter('selected-fill', f);
    map.setFilter('selected-line', f);
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setFilter(
      'hover-line',
      hoveredId ? ['==', ['get', 'id'], hoveredId] : ['==', ['get', 'id'], '__none__'],
    );
  }, [hoveredId]);

  // Recentre lorsqu'une source externe met à jour les données (non utilisé ici,
  // mais prêt pour un futur backend qui rafraîchirait la couche géographique).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(SOURCE) as GeoJSONSource | undefined;
    src?.setData({ type: 'FeatureCollection', features: ALL_FEATURES });
  }, []);

  // NB : positionnement en style inline — la feuille de style de MapLibre force
  // `.maplibregl-map { position: relative }` et écraserait une classe `absolute`,
  // ce qui réduirait la hauteur du conteneur à 0.
  return (
    <div
      ref={containerRef}
      aria-label="Carte des régions viticoles"
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}

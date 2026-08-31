# Site public — Atlas mondial du vin

Version **carte réelle (style Google Maps)** de l'atlas, servie en statique par
GitHub Pages : fond de carte MapLibre + tuiles **CARTO Voyager** (rues, eau,
espaces verts, labels), avec les **zones viticoles jointives** par-dessus qui se
dévoilent progressivement au zoom (pays → région → sous-région → appellation).

- **En ligne :** https://18eme-fr.github.io/email-ai/ (après activation de Pages)
- **Sortie déployée :** [`../docs/index.html`](../docs/index.html) — fichier
  autonome (MapLibre, données, code et styles intégrés ; seules les tuiles et les
  polices sont chargées au runtime). Aucune clé d'API.

## Reconstruire

```bash
npm install          # récupère maplibre-gl
node web/build.mjs   # régénère docs/index.html à partir de web/*
```

## Sources

| Fichier | Rôle |
| --- | --- |
| `app.js` | Logique de l'application (carte MapLibre, recherche, filtres, fiche, comparateur, quiz…). |
| `styles.css` | Thème « atlas contemporain » (clair + sombre). |
| `wine-fc.json` | Couche viticole (GeoJSON) : géométries pavées + propriétés cuites (couleur, zooms d'apparition `az` / disparition `hz`). |
| `atlas-info.json` | Couche encyclopédique (fiches) + cépages. |
| `build.mjs` | Assemble le tout dans `docs/index.html`. |

## Régénérer les données (`wine-fc.json`)

Les données proviennent de la couche encyclopédique du projet Next.js
(`src/data/`). Le pavage géographique et la « cuisson » des propriétés se font en
deux étapes (voir `generate/`) :

1. `generate/1-tile-geometries.mjs` — pave chaque grande région par un diagramme
   de Voronoï des centroïdes réels de ses appellations, découpé sur le contour de
   la région (→ zones jointives, cohérentes à tous les niveaux).
2. `generate/2-bake-maplibre.mjs` — calcule couleur nuancée + zooms
   d'apparition/disparition et écrit le FeatureCollection MapLibre.

> Les tracés régionaux restent **schématiques** (centroïdes réels, contours
> approximatifs) et sont destinés à être remplacés par le parcellaire officiel
> (INAO, AVA, DOC…). Le fond de carte, lui, est réel.

## Activer GitHub Pages (une fois)

Dépôt **public** requis. Puis : *Settings → Pages → Build and deployment →
Source : « Deploy from a branch » → Branch : `claude/atlas-mondial-vin-owut63`,
dossier `/docs` → Save*. La page apparaît sous quelques minutes à l'URL ci-dessus.

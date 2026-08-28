# Atlas mondial du vin

Carte interactive et encyclopédie des régions viticoles du monde. On explore du
**globe** jusqu’à l’**appellation**, les zones sont **réellement dessinées** sur la
carte (polygones, pas de simples marqueurs), et chaque zone ouvre une **fiche
encyclopédique** détaillée. Pensé comme un croisement entre *Google Maps*, un
*atlas cartographique* et une *encyclopédie du vin*.

> **Priorités du projet** : qualité de la cartographie · hiérarchie géographique
> · fiabilité des données · expérience d’exploration.

---

## Démarrage

```bash
npm install
npm run dev      # http://localhost:3000
```

Autres scripts : `npm run build` (production), `npm run start`, `npm run lint`,
`npm run typecheck`.

- **Aucune clé d’API n’est nécessaire.** La carte s’appuie sur **MapLibre GL JS**
  (open-source) et un fond clair **CARTO Positron** (tuiles publiques). Une
  connexion internet est requise pour afficher le fond de carte ; les tracés
  viticoles, eux, sont embarqués dans l’application et s’affichent sans réseau.

---

## Décisions techniques

| Besoin | Choix | Pourquoi |
| --- | --- | --- |
| Framework | **Next.js 14 (App Router) + React + TypeScript** | Architecture sérieuse et évolutive, chemin naturel vers une API / un backend. |
| Carte | **MapLibre GL JS** (et non Mapbox) | Open-source, **sans jeton**, gère des milliers de polygones en WebGL, affichage par bandes de zoom. |
| Style | **Tailwind CSS** + palette « atlas contemporain » | Esthétique sobre et premium, sans clichés (bouteilles, grappes…). |
| Données | Couche **statique typée** derrière une couche de service | Fonctionne hors-ligne pour le MVP, remplaçable par Supabase/PostGIS sans toucher à l’UI. |
| Géométries | **GeoJSON** (pays réels + tracés régionaux schématiques) | Séparées de l’encyclopédie, faciles à enrichir. |
| État | **Zustand** | Léger, coordonne carte ↔ recherche ↔ fiche ↔ filtres. |

### Séparation géographie / encyclopédie

Exigence structurante du cahier des charges : **les tracés et le savoir œnologique
sont deux couches distinctes, jointes par `id`.**

```
src/data/geometries.ts      ← COUCHE GÉOGRAPHIQUE (id → Polygon/MultiPolygon)
src/data/regions/*.ts       ← COUCHE ENCYCLOPÉDIQUE (fiches, sans géométrie)
src/lib/atlas.ts            ← JOINTURE + FeatureCollections consommées par la carte
```

On peut enrichir la documentation d’une région sans toucher à son tracé, et
inversement.

---

## Modèle de données

Types dans [`src/lib/types.ts`](src/lib/types.ts). Ils correspondent aux tables
cibles d’un futur schéma relationnel (`countries`, `wine_regions`, `appellations`,
`grape_varieties`, `region_grapes`, `soils`, `climates`, `producers`, `vintages`,
`food_pairings`).

- **Hiérarchie flexible** : chaque zone porte `parentId` (`parent_region_id`),
  permettant une profondeur arbitraire — *Pays → Région → Sous-région →
  Appellation* et au-delà (ex. Médoc → Haut-Médoc → Pauillac).
- **`level`** (`country | region | subregion | appellation`) pilote l’affichage
  par bande de zoom.

### Fiabilité (point crucial)

> **On n’invente pas les informations œnologiques.**

- Toute valeur inconnue vaut `null` (ou `[]`) et s’affiche
  **« information non renseignée »** — jamais une donnée fabriquée.
- Chaque fiche porte `source` et `lastVerified` (INAO, OIV, CIVB, IVDP, TTB/AVA,
  Wine Australia, Wines of South Africa, Wines of Argentina, consorzi DOC/DOCG…).
- Les parts de cépages ne sont renseignées que lorsqu’elles sont fiables
  (définies par le décret, ex. Barolo 100 % Nebbiolo) ou clairement indiquées
  comme approximatives.
- Les **profils gustatifs** sont explicitement présentés comme *indicatifs*.

### ⚠️ Tracés cartographiques

Les **pays** utilisent des frontières réelles (Natural Earth 1:110m). Les
**régions / sous-régions / appellations** utilisent, pour ce MVP, des tracés
**schématiques** générés autour de leur centroïde réel
([`src/data/geometries.ts`](src/data/geometries.ts)). Ils sont **approximatifs**
et destinés à être remplacés par le **parcellaire officiel** (voir *Feuille de
route*). La fiche l’indique clairement.

---

## Fonctionnalités

- 🗺️ **Carte interactive** : déplacement libre, zoom molette/tactile, survol, clic.
- 🪆 **Affichage hiérarchique** : les pays au niveau mondial, puis régions,
  sous-régions et appellations révélées au fil du zoom (bandes de zoom par niveau).
- 🧾 **Fiche détaillée** : informations générales, terroir (climat, sols, géologie),
  cépages (rôle + part), types de vins, profil gustatif (curseurs + arômes),
  viticulture, vinification/élevage, zones & appellations enfants (cliquables),
  domaines emblématiques, millésimes, accords mets & vins, sources.
- 🔎 **Recherche universelle** : pays, région, appellation, **cépage**, **domaine**.
- 🎛️ **Filtres** : type de vin, cépage, climat, sol (les zones non concernées
  s’estompent ; le filtre tient compte de l’héritage régional).
- 🍇 **Mode « Explorer un cépage »** : met en évidence (contour doré) toutes les
  zones où un cépage est cultivé.
- ⇄ **Comparateur** de deux régions (climat, sols, cépages, superficie, profil…).
- ★ **Favoris** (persistés dans le navigateur) et **mode apprentissage** (quiz
  généré à partir des données, donc vérifiable).

---

## Couverture du MVP

**Europe** — France (Bordeaux **> Médoc > Haut-Médoc > Pauillac / Margaux /
Saint-Julien / Saint-Estèphe / Listrac / Moulis**, + Saint-Émilion, Pomerol,
Pessac-Léognan, Sauternes ; Bourgogne **> Chablis / Côte de Nuits > Gevrey,
Morey, Chambolle, Vosne-Romanée, Nuits-St-Georges / Côte de Beaune > Meursault,
Puligny, Pommard / Côte Chalonnaise / Mâconnais** ; Champagne ; Rhône ; Loire),
Italie (Piémont **> Langhe > Barolo / Barbaresco**, Toscane, Vénétie), Espagne
(Rioja, Ribera del Duero, Priorat), Portugal (Douro).
**Nouveau Monde** — États-Unis (Napa **> Rutherford / Oakville**, Sonoma),
Argentine (Mendoza **> Valle de Uco**), Chili (Maipo, Colchagua), Afrique du Sud
(Stellenbosch), Australie (Barossa, Margaret River), Nouvelle-Zélande
(Marlborough, Central Otago). **25 pays producteurs** au niveau mondial.

### Ajouter une zone

1. Ajouter la géométrie dans `src/data/geometries.ts` (spéc. `blob` ou GeoJSON réel).
2. Ajouter la fiche dans le fichier pays de `src/data/regions/` (via l’aide
   `region()` qui remplit les champs inconnus par « non renseigné »).
3. C’est tout : recherche, filtres, hiérarchie et carte se mettent à jour.

---

## Structure du projet

```
src/
  app/            layout, page, styles globaux
  components/     AtlasMap, RegionPanel, SearchBar, Filters, CompareView,
                  LearnQuiz, GrapeExplorerBanner, Toolbar, LevelLegend, primitives
  lib/            types, atlas (jointure), search, filters, format, mapStyle
  data/
    grapes.ts
    geometries.ts            + geo/country-geometries.json (Natural Earth)
    regions/                 countries, france, italy, iberia, newworld
  state/          store Zustand
```

---

## Feuille de route (améliorations)

1. **Tracés officiels** : remplacer les polygones schématiques par le parcellaire
   INAO (France), AVA/TTB (USA), DOC/DOCG (Italie), DO (Espagne)… en GeoJSON réel.
2. **Backend** : passer la couche de données à **Supabase / PostgreSQL + PostGIS**,
   servir les zones en tuiles vectorielles pour absorber des milliers d’appellations.
3. **Enrichissement** : traçabilité par champ (`source` + `last_verified` au niveau
   de la donnée), plus de régions et de pays, millésimes étendus.
4. **Exploration** : regroupement (clustering), niveaux « continent », mini-carte,
   partage d’une vue par URL.
5. **Pédagogie** : quiz thématiques, progression, badges.
6. **Qualité** : i18n (FR/EN), accessibilité clavier complète, tests
   (unitaires données + e2e Playwright), fond de carte hors-ligne optionnel.

---

## Sources & fiabilité

Données encyclopédiques issues d’organismes officiels : OIV, INAO, CIVB, BIVB,
Comité Champagne, Inter Rhône, InterLoire, consorzi italiens (Barolo, Chianti
Classico, Brunello…), Consejos Reguladores espagnols, IVDP (Douro), TTB (AVA),
Wine Australia, New Zealand Winegrowers, Wines of South Africa, Wines of
Argentina, Wines of Chile. Frontières des pays : Natural Earth. Fond de carte :
© OpenStreetMap, © CARTO.

# Agencement 3D — Établissement culturel

Outil web **personnel** pour imaginer et tester les agencements d'un futur lieu
culturel hybride (concert · restaurant & vin · ateliers). L'édition se fait
directement dans une vue **3D claire, lisible et fonctionnelle** — pas de
photoréalisme. Tout tourne dans le navigateur, en local, sans serveur.

## Lancer

Comme l'app utilise des modules ES, il faut la servir en HTTP (pas `file://`) :

```bash
# depuis la racine du dépôt
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```

(N'importe quel serveur statique convient.) Aucune dépendance à installer :
Three.js est déjà présent dans `vendor/`, l'app fonctionne hors-ligne.

## Les trois pôles

- **Concert** : salle, scène, régie, loges, stockage matériel, espace merch.
- **Restaurant & vin** : salle, cuisine, cave / stockage vin, bar / comptoir.
- **Ateliers** : atelier modulable, rangement matériel, espace d'exposition.
- **Commun** : accueil, sanitaires, circulation, vestiaires, locaux techniques,
  livraisons, sas.

## Fonctionnalités (V1)

**Zones typées.** Trace des rectangles au sol sur le niveau actif. Chaque zone a
un nom, un pôle, un type, des dimensions modifiables (X/Y/L/P), une surface
calculée en m² et une note libre. Couleur de base par pôle, nuance par type.
Les recouvrements de zones sont **interdits** sur un même niveau.

**Récapitulatif.** Surfaces par pôle, par type et par niveau, surface totale
zonée, et **part de chaque pôle en %** (« Commun » compris).

**Filtre par pôle.** Mettre un ou plusieurs pôles en avant ; les autres sont
**estompés** ou **masqués**. Le filtre agit sur la vue, pas sur les totaux.

**Murs.** Tracés au sol (aimantés à la grille et aux extrémités), épaisseur et
hauteur réglables, déplaçables. Les ouvertures suivent le mur et sont recadrées
si le mur est raccourci ; supprimer un mur supprime ses ouvertures.

**Portes.** Posées sur un mur, glissement le long du mur, aimantation,
dimensions réglables, propriété **« donne sur l'extérieur »** avec un marqueur
orange distinct pour repérer les accès indépendants.

**Fenêtres.** Même logique d'accrochage aux murs. Largeur, hauteur, **hauteur
d'allège** (1 m par défaut), option **baie vitrée** (allège 0). Rendu
semi-transparent, ouverture visible dans le mur.

**Vue & édition.** Orbite (clic droit), zoom (molette), pan (clic milieu), vue
3D / vue de dessus, murs **entiers / abaissés / masqués** pour voir l'intérieur.
Sélection, déplacement, redimensionnement (panneau), **duplication** (Ctrl+D),
suppression, **annuler / rétablir**, grille et **aimantation désactivable**.

**Niveaux.** Plusieurs niveaux ; l'édition est limitée au niveau actif, les
autres sont estompés et non sélectionnables.

**Sauvegarde & variantes.** Sauvegarde automatique locale (indicateur dans la
barre). **Bibliothèque de projets** : créer, **dupliquer** (pour comparer des
hypothèses sans perdre une version), supprimer, et **export / import** JSON
versionné. Un import invalide ne remplace jamais le travail en cours.

## Personnaliser les pôles et les types

Tout se règle dans **`src/config.js`** (fichier de configuration unique) :
`POLES` (nom + couleur), `TYPES` (clé + libellé + pôle) et `DEFAULTS`
(hauteur de niveau, épaisseur de mur, pas de grille, valeurs des portes et
fenêtres). Ajouter un type = une ligne dans `TYPES`.

## Portée

La maquette sert à **examiner** des choix d'agencement (circulations, accès,
service, coexistence des activités). Elle ne fait **ni** simulation acoustique,
**ni** certification réglementaire ; les surfaces ne sont pas des surfaces
réglementaires et un accès « extérieur » n'est pas une issue de secours validée.

## Structure du code

```
index.html          — page + import map vers vendor/three
styles.css          — mise en page
src/config.js       — pôles, types, couleurs, valeurs par défaut (À ÉDITER)
src/geometry.js     — maths 2D (aimantation, aires, projections, recouvrements)
src/store.js        — état, bibliothèque de projets, undo/redo, persistance
src/viewer.js       — scène Three.js, caméra, contrôles, picking
src/builder.js      — reconstruction de la 3D à partir de l'état
src/labels.js       — étiquettes (nom + m²) en overlay
src/tools.js        — outils d'édition à la souris
src/ui.js           — barres, panneaux, récapitulatif, filtres
src/seed.js         — exemple de départ (modifiable)
src/main.js         — amorçage
vendor/             — Three.js (local, hors-ligne)
```

# Journal des versions

## 0.2.0 — 23 octobre 2026

### Exploration pixel art (module secondaire)
- Nouveau module `src/explore/` indépendant du moteur de vie, branché sur les mêmes données, le même journal et le même système de conséquences.
- Scène prototype : le forum des métiers au gymnase du collège (15 ans), rattachée à l'événement d'orientation. Déplacement clavier (flèches, ZQSD), clic ou pavé tactile, collisions, personnes interactives (stands, psychologue de l'Éducation nationale, ami, parent), décisions prises sur place.
- La scène est facultative (« Passer la scène », Échap, réglage pour la désactiver) et ignorée en mode automatique. Le temps de la vie est suspendu pendant la scène : l'âge n'avance jamais en marchant.
- Rendu pixel art isométrique original (tuiles, murs, objets, personnages animés qui évoluent avec l'âge ; teinte de peau neutre unique).
- Tests : collisions, accessibilité de chaque personne, conséquences appliquées une seule fois, cohérence des décisions avec l'événement.

## 0.1.0 — 23 octobre 2026

### Fonctionnalités
- Naissance aléatoire (région, territoire, quartier, foyer, niveau de vie) et révélation sous forme d'acte de naissance stylisé.
- Mode Villes : 12 grandes villes avec décor et ambiance propres ; une ville débloquée toutes les 10 vies.
- Simulation annuelle de la naissance au décès, pause, trois vitesses, mode automatique reproductible.
- 76 événements narratifs (jalons de vie, événements aléatoires, arcs différés), dont 55 avec au moins deux décisions.
- Économie personnelle (euros 2026), études et diplômes, professions réglementées, chômage, logement, couple, parentalité, engagement associatif, syndical et politique, élections municipales et présidentielles hypothétiques, mandat municipal, retraite, aidance, grand âge.
- Journal de vie filtrable, souvenirs, bilan narratif, historique et comparaison des vies.
- Bibliothèque documentaire : 12 fiches sourcées, paramètres du moteur, 11 cadres intellectuels, méthode et limites.
- Sauvegarde automatique locale, export et import, réinitialisation ; mode atténué.

### Données
- Sources : Insee (naissances, espérance de vie, fécondité, pauvreté, chômage), DEPP (baccalauréat), Smic 2026, Code de l'éducation, Code électoral, Constitution.

### Limites connues
- Voir `METHODOLOGIE.md`, sections 5 et 7.

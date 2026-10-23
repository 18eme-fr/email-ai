# Destins de France — prototype 0.1

Simulateur de vie narratif : on naît au hasard en France en 2026, on traverse une existence entière, année après année, jusqu'à la fin de vie et un bilan. Le jeu s'appuie sur des données publiques sourcées et distingue toujours ce qui est observé, modélisé, supposé ou inventé.

## Jouer

```bash
cd destins-de-france
npm install
npm run dev        # puis ouvrir l'adresse affichée (http://localhost:5173)
```

- **Naître** : lieu, famille et ressources tirés au hasard.
- **Mode Villes** : choisir une grande ville de naissance ; une nouvelle ville se débloque toutes les 10 vies terminées. Seul le lieu est choisi, le reste reste aléatoire.
- Pendant la vie : pause (barre d'espace), trois vitesses, mode automatique, journal filtrable, fiches « Comprendre et vérifier ».

## Tester

```bash
npm test             # tests unitaires, vies complètes, cohérence, sauvegardes, validation statistique
npm run typecheck    # TypeScript strict
npm run build        # site statique dans dist/
npm run build:artifact  # fichier HTML unique autonome (dist-artifact/destins-de-france.html)
```

## Architecture

```
src/
  engine/              moteur, sans aucune dépendance à l'interface
    types.ts           modèle de données documenté (Citizen, Household, SimulationRun, SaveGame…)
    narrative-types.ts format des fiches d'événements (NarrativeEvent, EventChoice, EventConsequence)
    rng.ts             générateur pseudo-aléatoire à graine (reproductibilité)
    demography.ts      tirage des conditions de naissance
    mortality.ts       modèle de mortalité calibré sur l'espérance de vie 2025
    economy.ts         revenus, dépenses, épargne, dette (euros 2026 constants)
    narrative.ts       éligibilité des événements, application des conséquences
    politics.ts        institutions, calendrier électoral, élections fictives
    simulation.ts      boucle annuelle : createRun, step, choose, autoChoose
    coherence.ts       contrôles automatiques d'invariants
    summary.ts         bilan de vie écrit à partir de l'historique
    save.ts            sauvegarde locale, export, import
  data/
    sources.ts         registre documentaire (fiches sourcées)
    frameworks.ts      cadres intellectuels (Bourdieu, Boudon, Sen…)
    regions.ts, cities.ts, jobs.ts, names.ts
    events/            bibliothèque d'événements (une fiche = un objet)
  ui/                  React : écrans, composants, illustrations SVG (ui/art)
tests/                 Vitest
docs/                  méthodologie, journal des versions
```

### Ajouter un événement

Créer un objet `NarrativeEvent` dans un fichier de `src/data/events/` (voir `narrative-types.ts`) puis l'ajouter à `src/data/events/index.ts`. Aucune modification du moteur n'est nécessaire. Les tests vérifient l'unicité des identifiants, l'existence des sources citées et la cohérence de 300 vies complètes.

Voir `docs/METHODOLOGIE.md` pour la méthode scientifique et ses limites.

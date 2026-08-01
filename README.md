# 🎯 La Roulette du Savoir

Une application web qui vous propose, **au hasard**, un thème à apprendre chaque
jour — et pas seulement un mot : une véritable **fiche d'apprentissage** prête à
l'emploi (objectif, notions clés, questions à maîtriser, activité concrète,
mots-clés).

Culture générale, institutions françaises et européennes, économie, sociologie,
psychologie, histoire, géopolitique, écologie, médias, numérique & IA, culture &
spectacle, management, langues, compétences de la vie adulte… **plus de 160
thèmes** répartis en **16 catégories**.

L'application fonctionne **sans compte et sans serveur** : toute la progression
est enregistrée localement (localStorage) et reste disponible après
actualisation.

---

## 🚀 Lancer l'application

Prérequis : **Node.js 18+** (testé avec Node 22) et **npm**.

```bash
npm install        # installer les dépendances
npm run dev        # démarrer en développement  → http://localhost:3000
```

Autres commandes utiles :

```bash
npm run build      # build de production
npm run start      # servir le build de production
npm run lint       # ESLint
npm run typecheck  # vérification TypeScript (tsc --noEmit)
npm run test       # tests unitaires de l'algorithme de tirage (Vitest)
```

---

## 🧭 Fonctionnalités

### Roulette (`/`)
- Grande roue visuelle : un segment par catégorie, animation fluide.
- **La roue s'arrête réellement sur la catégorie du thème sélectionné** (la
  sélection est calculée d'abord, puis la roue s'aligne dessus).
- Options de tirage : **mode** (Découverte / Révision / Surprise totale),
  choix d'une ou plusieurs **catégories**, **difficulté**, **durée disponible**
  (5, 10, 20, 30, 60 min), et option pour réviser les thèmes déjà terminés.
- Résumé de progression : thèmes terminés, favoris, série de jours.

### Fiche d'apprentissage
Après le tirage (ou au clic sur une carte), une fiche structurée s'ouvre :
titre, catégorie, difficulté, durée, objectif, intérêt du sujet, notions à
comprendre, questions à maîtriser, activité concrète, mots-clés, **zone de notes
personnelles**. Actions : *J'ai appris ce thème*, *À revoir*, *Ajouter aux
favoris*, *Nouveau tirage*, *Sujet trop facile / trop difficile*.

### Bibliothèque (`/library`)
Tous les thèmes sous forme de cartes, avec **recherche** et filtres par
catégorie, difficulté, durée et statut (à apprendre, terminés, à revoir,
favoris).

### Progression (`/progress`)
Tableau de bord : total, terminés, restants, pourcentage, **série de jours
consécutifs**, **heatmap d'activité**, progression **par catégorie**, dernières
fiches consultées, catégories les plus / moins travaillées.

### Historique (`/history`)
Tous les tirages : date, thème, catégorie, statut, durée prévue et notes.

### Gérer (`/settings`)
Ajouter / modifier / supprimer un thème, ajouter une catégorie, **importer** des
thèmes depuis un fichier JSON, **exporter** thèmes + progression, réinitialiser
la progression. Thème **clair / sombre** (bouton en haut à droite).

---

## 🎲 Algorithme de sélection

Le tirage n'est pas un simple `Math.random()`. Chaque thème reçoit un **poids**
(`src/lib/topic-selection.ts`) qui :

- **réduit fortement** la probabilité d'un thème vu récemment (pénalité de
  récence + de répétition) ;
- **favorise les catégories peu travaillées** ;
- respecte la **difficulté** et la **durée** choisies ;
- s'adapte au **mode** :
  1. **Découverte** — priorité aux thèmes jamais vus ;
  2. **Révision** — priorité aux thèmes « à revoir » ou terminés depuis
     longtemps ;
  3. **Surprise totale** — tout thème compatible.
- tient compte du retour « trop facile / trop difficile ».

Une **chaîne de replis** garantit qu'un tirage reste toujours possible dès qu'un
thème compatible existe. L'algorithme est couvert par **21 tests** (`npm run
test`).

---

## 🗂️ Où modifier / ajouter des thèmes

- **Base de thèmes** : `src/data/topics.ts` — un tableau typé `LearningTopic[]`.
  Ajoutez-y un objet en respectant le type (voir ci-dessous).
- **Catégories** : `src/data/categories.ts`.
- **Sans toucher au code** : page **Gérer** (`/settings`) → *Ajouter un thème* /
  *Ajouter une catégorie* / *Importer (JSON)*. Ces ajouts sont enregistrés
  localement et fusionnés avec la base initiale.

```ts
type LearningTopic = {
  id: string;
  title: string;
  category: string; // id d'une catégorie
  difficulty: "Débutant" | "Intermédiaire" | "Avancé";
  duration: 5 | 10 | 20 | 30 | 60;
  objective: string;
  importance: string;
  keyConcepts: string[];
  questions: string[];
  activity: string;
  keywords: string[];
  sourceSuggestions?: string[];
};
```

---

## 🏗️ Architecture

```
src/
  app/                    # pages (App Router)
    page.tsx              #   roulette + résumé de progression
    library/  progress/  history/  settings/
    layout.tsx  globals.css  icon.svg
  components/
    layout/               # coquille + navigation
    roulette/             # roue, filtres, panneau
    topics/               # cartes, badges, fiche, modale
    progress/             # tuiles, heatmap, progression par catégorie
    settings/             # gestion des thèmes / catégories
    ui/                   # primitives (button, card, badge)
  data/                   # topics.ts, categories.ts
  hooks/                  # use-app-state.tsx (état + persistance)
  lib/                    # topic-selection, storage, statistics, utils
  types/                  # topic.ts
```

**Stack** : Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS ·
Framer Motion (animations) · Lucide (icônes) · Vitest (tests). Persistance via
**localStorage**, isolée dans `src/lib/storage.ts` pour faciliter une future
migration vers Supabase ou une autre base.

---

## 🔮 Pistes pour une version 2

- Synchronisation multi-appareils (Supabase / compte utilisateur).
- Rappels quotidiens et objectifs (notifications, mode « défi du jour »).
- Répétition espacée automatique pour les thèmes « à revoir ».
- Quiz interactifs et auto-évaluation des réponses.
- Partage de fiches et de collections de thèmes.
- Statistiques avancées et export PDF d'une fiche.
- Contenus enrichis (liens, images, sources vérifiées) et suggestions par IA.

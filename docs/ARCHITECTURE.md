# Architecture — Backstage Path

## 1. Architecture fonctionnelle

```
┌───────────────────────────────────────────────────────────────┐
│                        Navigateur (UI)                         │
│   Server Components (lecture)  +  Client Components (interaction)│
└───────────────┬───────────────────────────────┬───────────────┘
                │ Server Actions (mutations)     │ /api/cron (planifié)
                ▼                                 ▼
        ┌───────────────────────────────────────────────┐
        │              Couche métier (src/lib)           │
        │  auth · scoring · metrics · ai · automations   │
        └───────────────┬───────────────────────────────┘
                        │ Prisma ORM
                        ▼
        ┌───────────────────────────────────────────────┐
        │   Base de données (SQLite par défaut / Postgres)│
        └───────────────────────────────────────────────┘
```

- **Rendu** : App Router. Les pages sont des *Server Components* qui lisent la base ;
  l'interactivité (formulaires, filtres, bascules) est portée par des *Client Components*.
- **Mutations** : exclusivement via **Server Actions** (`src/app/actions/*`), typées,
  avec vérification de session à chaque appel.
- **Aucune clé externe requise** pour fonctionner : l'« IA » est un moteur heuristique
  local (`src/lib/ai.ts`), remplaçable par un vrai LLM (seam `generateWithLLM`).

## 2. Arborescence des pages

```
/                       → redirige vers /dashboard ou /login
/login, /register       → authentification (bcrypt + session)
(app)/                   → layout protégé (sidebar + garde d'auth)
  /dashboard            → score de préparation, feuille de route 12 mois, notifications
  /opportunities        → moteur d'offres, carte, compatibilité, suivi, sources, CSV
  /project              → assistant 22 étapes, budget, seuil de rentabilité, tâches
  /skills               → 6 blocs, catalogue, test de positionnement, parcours
  /portfolio            → 14 rubriques, étude de salle, génération PDF
  /psychology           → matrice + générateur de reformulations
  /applications         → masters, analyse d'écart, suivi de candidatures
  /settings             → profil détaillé, connecteurs, RGPD
/portfolio/print        → rendu éditorial imprimable (PDF navigateur)
/api/cron               → tâches planifiées (protégé par CRON_SECRET)
```

## 3. Schéma de base de données (Prisma)

Modèles (voir `prisma/schema.prisma`) :

| Modèle | Rôle |
|---|---|
| `User` / `Session` | Authentification, sessions `httpOnly` |
| `Profile` | Profil complet (langues, diplômes, expériences, mobilité, auto-évaluation…) |
| `Opportunity` | Offres — `ownerId=null` = catalogue démo partagé ; sinon import utilisateur |
| `SavedOpportunity` | Sauvegarde + suivi (statut, note, relance, contact, réponse) |
| `SearchQuery` | Recherches automatiques (alertes quotidiennes/hebdo) |
| `Source` | Sources / connecteurs à brancher |
| `Project` + `BudgetLine` + `Task` | Projet culturel (étapes JSON, budget, rétroplanning) |
| `CourseProgress` | Suivi des formations (statut, temps, badge) |
| `PortfolioItem` | Éléments de portfolio (dont études de salle) |
| `PsychEntry` | Reformulations psychologie → culture |
| `Application` | Masters ciblés + analyse d'écart + suivi |
| `Notification` | Centre de notifications / automatisations |

> Les listes structurées sont stockées en JSON (String) pour rester compatibles
> SQLite. Un helper `src/lib/json.ts` encapsule parse/stringify. En PostgreSQL, ces
> champs peuvent devenir `Json` natifs.

## 4. Composants (src/components)

- **UI** : `ui.tsx` (Card, SectionTitle, Badge, ProgressBar, ScoreRing, Stat, LinkButton…).
- **Navigation** : `sidebar.tsx` (responsive), `topbar.tsx` (thème, notifications, déconnexion).
- **Levier 1** : `opportunities-explorer.tsx` (filtres), `opportunity-card.tsx` (fiche + suivi), `world-map.tsx` (SVG).
- **Levier 2** : `project-tools.tsx` (étape + calcul du seuil de rentabilité).
- **Levier 3** : `course-card.tsx`.
- **Transverse** : `collapsible.tsx`, `print-button.tsx`, `notifications-panel.tsx`, `auth-form.tsx`.

## 5. Systèmes de recherche

- **Filtrage instantané côté client** (texte, pays, type de structure, type de contrat,
  compatibilité minimale, sauvegardées) sur le catalogue chargé.
- **Recherches automatiques** (`SearchQuery`) : critères + fréquence, destinées à être
  exécutées par le cron une fois les sources/API branchées.
- **Entrées de données** disponibles immédiatement : ajout manuel, **import CSV**,
  ajout de **sources**. Les connecteurs API sont prévus par l'architecture (voir SOURCES.md).
- **Référentiel** intégré (`src/lib/reference.ts`) : types de structures, types
  d'opportunités, 15 intitulés de postes (FR/EN), 6 langues de recherche.

## 6. Règles de scoring (`src/lib/scoring.ts`)

### Score de préparation (dashboard) — 9 sous-scores pondérés
`cultureExp 16 · project 14 · adminExp 12 · finance 12 · liveArts 12 · law 10 · network 8 · portfolio 8 · applications 8` (somme = 100).

Chaque sous-score est calculé à partir de **données réelles** (mois d'expérience,
formations validées, étapes de projet, contacts, éléments de portfolio, statuts de
candidature) + **auto-évaluation** pour les blocs de connaissances. Chaque sous-score
renvoie ses **preuves** et ses **manques** (affichés). Bandes : 0-20 théorique →
81-100 fortement professionnalisé.

### Score de compatibilité d'une offre — 12 facteurs /100
Proximité spectacle vivant (16) · gestion (12) · budget (8) · production (8) · niveau
demandé (10) · langue (10) · faisabilité admin/visa (8) · durée (6) · rémunération (6) ·
logement (4) · valeur master (8) · correspondance profil (4). Le score renvoie
**points forts / points faibles** explicités.

## 7. Automatisations (`src/lib/automations.ts` + `/api/cron`)

- Rétrograder les offres sauvegardées **expirées** (deadline passée).
- Signaler les **relances** proches (< 21 jours).
- Recommander l'**action prioritaire de la semaine** (issue des sous-scores faibles).
- **Bilan mensuel** (score courant) — paramètre `?monthly=1`.
- **Vérification des liens** (offres) — paramètre `?links=1` (HEAD + timeout court).

Déclenchement : bouton « Lancer les automatisations » (par utilisateur) **ou** cron
(tous les utilisateurs, protégé par `CRON_SECRET`).

## 8. Extensibilité prévue

Extension navigateur, application mobile, Google Drive / Calendar / Gmail / Sheets,
Notion : l'UI (page Paramètres) et la couche Server Actions sont prêtes à recevoir ces
connecteurs via OAuth. Le moteur « IA » heuristique expose un point d'entrée
(`generateWithLLM`) pour brancher un LLM réel.

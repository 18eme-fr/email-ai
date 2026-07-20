# 🎭 Backstage Path

**Construire son parcours vers l'administration du spectacle vivant.**

Application web full-stack qui accompagne un·e étudiant·e en reconversion (profil
sciences humaines / psychologie) vers un master spécialisé et un métier
d'administration / gestion d'une salle de spectacle. Ce n'est pas une page vitrine :
c'est un **système personnel de reconversion** — recherche d'opportunités, scoring
expliqué, projet culturel, académie de formation, portfolio de preuves, valorisation
du parcours et suivi des candidatures, le tout persistant en base de données.

---

## ✨ Ce que fait l'application

| Levier | Page | Fonctions clés |
|---|---|---|
| Pilotage | **Tableau de bord** | Score de préparation (9 sous-scores expliqués), feuille de route 12 mois, actions prioritaires, échéances, centre de notifications |
| Levier 1 | **Opportunités** | Moteur de recherche + filtres, carte du monde, score de compatibilité /100 expliqué, sauvegarde & suivi, recherches automatiques, sources, ajout manuel, import CSV |
| Levier 2 | **Projet culturel** | Assistant 22 étapes, budget prévisionnel (recettes/dépenses), seuil de rentabilité, tâches/rétroplanning, bibliothèque d'exemples, mode portfolio |
| Levier 3 | **Formations** | 6 blocs (gestion, admin, droit, production, RH, politiques), catalogue de ressources avec suivi, test de positionnement, parcours 3/6/12 mois, badges, temps d'apprentissage |
| Levier 4 | **Portfolio** | 14 rubriques, étude de salle (20 champs), génération PDF (web imprimable) courte/complète |
| Levier 5 | **Psychologie → atout** | Matrice de correspondance, générateur de reformulations (CV/lettre/entretien) avec limites et preuves nécessaires |
| Levier 6 | **Candidatures** | Base de masters, fiches, analyse d'écart (acquis / à renforcer / actions), suivi par statut |
| Réglages | **Profil & paramètres** | Profil détaillé (recalcul auto des scores), thème clair/sombre, connecteurs à venir, suppression RGPD |

---

## 🧱 Stack technique

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (thème « coulisses de salle » clair/sombre)
- **Prisma ORM** + **SQLite** par défaut (zéro installation externe) — bascule PostgreSQL/Supabase documentée
- **Auth par session** : mots de passe hachés avec **bcrypt**, sessions en base + cookie `httpOnly` (aucun mot de passe externe stocké)
- **Server Actions** pour toutes les mutations (pas d'API REST à maintenir côté client)
- **Tâches planifiées** via `/api/cron` (protégé par secret)
- Carte du monde **sans dépendance** (SVG, projection équirectangulaire)

---

## 🚀 Installation (5 minutes)

Prérequis : **Node.js 18+** (testé sur Node 22).

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
#   (le .env par défaut fonctionne tel quel en SQLite local)

# 3. Créer la base + le client Prisma + les données de démo
npm run setup        # = prisma generate + db push + seed

# 4. Lancer en développement
npm run dev
```

Ouvrez **http://localhost:3000**, cliquez sur **Créer un compte**.

> À l'inscription, votre compte est **pré-rempli** avec un profil correspondant à la
> persona (22 ans, licence de psychologie, expérience accueil/billetterie), un projet
> culturel démarré, deux masters ciblés et des opportunités de démonstration. Ces
> données de démonstration sont clairement identifiées (badge « démo ») et modifiables.

### Scripts utiles

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (génère aussi le client Prisma) |
| `npm start` | Serveur de production |
| `npm run setup` | Init complète de la base + seed |
| `npm run db:seed` | (Re)charger les opportunités de démo |
| `npm run db:studio` | Explorer la base (Prisma Studio) |

---

## 🌍 Déploiement

### Option A — Vercel (recommandé)

1. Poussez le repo sur GitHub.
2. Importez le projet dans Vercel.
3. **Base de données** : SQLite ne convient pas en serverless. Utilisez PostgreSQL
   (Supabase, Neon, Vercel Postgres) :
   - Dans `prisma/schema.prisma`, mettez `provider = "postgresql"`.
   - Définissez `DATABASE_URL` dans les variables d'environnement Vercel.
   - `npx prisma db push` puis `npm run db:seed` (une fois).
4. Ajoutez `SESSION_SECRET` et (optionnel) `CRON_SECRET`.
5. **Cron** (`vercel.json`) :
   ```json
   { "crons": [{ "path": "/api/cron?monthly=0", "schedule": "0 7 * * *" }] }
   ```

### Option B — Serveur / conteneur

`npm run build && npm start` derrière un reverse-proxy (Nginx/Caddy) en HTTPS.
Planifiez le cron avec crontab :
```
0 7 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine/api/cron
```

Détails et schéma complet : **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## 📚 Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — architecture fonctionnelle, arborescence, schéma de base, composants, systèmes de recherche, règles de scoring, automatisations.
- **[docs/SOURCES.md](docs/SOURCES.md)** — APIs et sources à connecter (offres, formations, salles).
- **[docs/LIMITES.md](docs/LIMITES.md)** — limites techniques et juridiques (RGPD, scraping, droits d'auteur).
- **[docs/GUIDE-UTILISATEUR.md](docs/GUIDE-UTILISATEUR.md)** — comment utiliser l'application, mois par mois.

---

## 🔐 Sécurité & conformité (résumé)

- Mots de passe **hachés (bcrypt)**, jamais en clair ; sessions `httpOnly`.
- **Aucun mot de passe externe** stocké ; connecteurs prévus via OAuth (à venir).
- **RGPD** : suppression du compte et des données en un clic (cascade).
- **Scraping** : l'app **n'inclut aucun scraper**. Elle privilégie APIs / flux RSS /
  pages publiques autorisées, respecte `robots.txt` et les CGU. Voir `docs/LIMITES.md`.
- **Honnêteté des données** : chaque score est expliqué ; l'IA (heuristique par défaut)
  distingue *vérifié / supposé / recommandation / manquant* ; le portfolio n'invente
  jamais une expérience.

---

## 🧪 Vérifié

`npm run build` passe (16 routes) ; parcours end-to-end validé (inscription → tableau
de bord → sauvegarde d'offre → navigation des 8 pages) via un pilotage navigateur.

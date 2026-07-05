# Salin Radio

> Des vidéos perdues. Une IA qui trie. Une radio qui découvre.

Salin Radio est une radio web 24h/24 construite autour de la découverte de
vidéos YouTube rares, oubliées ou peu vues. L'application n'utilise que le
lecteur YouTube officiel (IFrame Player API) et l'API YouTube Data — elle ne
télécharge, n'extrait ni ne restreame jamais aucun contenu.

## Stack

- **Frontend** : Next.js 16 (App Router) + TypeScript
- **UI** : Tailwind CSS v4
- **Backend** : Next.js Route Handlers (`src/app/api/**`)
- **Base de données** : Supabase / PostgreSQL (optionnel — voir mode démo ci-dessous)
- **IA** : OpenAI (optionnel — un scorer heuristique tourne sans clé)
- **Vidéo** : YouTube IFrame Player API + YouTube Data API v3

## Mode démo (sans clés API)

L'application fonctionne intégralement sans aucune variable d'environnement :

- `src/lib/mock-videos.ts` fournit un catalogue de départ (vidéos réelles
  embarquables + découvertes fictives pour couvrir tous les filtres et tous
  les statuts de modération).
- `src/lib/db.ts` utilise un store en mémoire tant que `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` ne sont pas définis.
- `src/lib/ai.ts` utilise un scorer basé sur des règles tant que
  `OPENAI_API_KEY` n'est pas défini.
- `src/lib/youtube.ts` renvoie des candidats simulés tant que
  `YOUTUBE_API_KEY` n'est pas défini.

Dès qu'une clé est ajoutée à `.env.local`, le module correspondant bascule
automatiquement sur le service réel — aucun changement de code n'est requis.

## Démarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Pages

| Route            | Description                                                   |
| ----------------- | -------------------------------------------------------------- |
| `/`               | Landing page (marque, slogan, principe en 3 étapes)            |
| `/radio`          | Radio en direct : lecteur YouTube, file d'attente, historique  |
| `/explore`        | Recherche et filtres (genre, pays, décennie, ambiance, rareté) |
| `/video/[id]`     | Fiche détaillée d'une vidéo (scores, résumé IA, similaires)    |
| `/admin/login`    | Connexion admin                                                |
| `/admin`          | Recherche YouTube + IA, modération, ajout manuel, programmation |

## Base de données

Le schéma complet (`videos`, `radio_queue`, `playlists`, `user_feedback`,
`admin_users`) est dans [`supabase/schema.sql`](./supabase/schema.sql). Pour
brancher un vrai projet Supabase :

1. Créer un projet Supabase (ou une base PostgreSQL).
2. Exécuter `supabase/schema.sql`.
3. Renseigner `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`.

## Admin

Un seul compte admin est géré via variables d'environnement
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`), avec une session par cookie signé
(`ADMIN_SESSION_SECRET`). Voir `src/lib/admin-auth.ts` et `src/proxy.ts`.

## Contraintes respectées

- Aucune vidéo n'est téléchargée, extraite ou restreamée : uniquement le
  lecteur YouTube officiel intégré.
- Le nom de la chaîne et un lien vers la vidéo originale sont toujours
  affichés.
- Une vidéo qui échoue à se charger (ou est signalée) est automatiquement
  marquée indisponible et ignorée par la radio.

## Roadmap (hors MVP)

Comptes utilisateurs, favoris, soumission communautaire, chaînes
thématiques, mode « moins de 1 000 vues », statistiques publiques,
application mobile, notifications « pépite du jour ».

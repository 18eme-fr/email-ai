# Limites techniques et juridiques

## Limites techniques

- **Base par défaut SQLite** : idéale en local/mono-serveur, **inadaptée au serverless**
  (Vercel). Pour la production, basculer sur PostgreSQL/Supabase (voir README §Déploiement).
- **Génération PDF** : réalisée via l'**impression navigateur** (page `/portfolio/print`).
  Pour un PDF serveur pixel-perfect, brancher une lib (Puppeteer, `@react-pdf/renderer`).
- **« IA » heuristique par défaut** : les fonctions intelligentes (reformulation, résumé,
  analyse d'écart) reposent sur des **règles explicites**, pas sur un LLM. Elles sont
  volontairement prudentes. Pour des sorties plus riches, brancher un vrai modèle via
  `generateWithLLM` (`src/lib/ai.ts`) et `ANTHROPIC_API_KEY`.
- **Recherche d'offres** : le moteur filtre un catalogue local. L'agrégation automatique
  multi-sources nécessite d'implémenter les connecteurs (voir `SOURCES.md`) — l'UI,
  l'import CSV et l'ajout manuel sont déjà opérationnels.
- **Carte du monde** : silhouettes de continents **simplifiées** (repères visuels),
  positionnement réel par lat/lng. Pour une carte géodésique, intégrer un fond
  cartographique respectant la CSP.
- **Vérification de liens** : `HEAD` avec timeout ; certains sites bloquent `HEAD`
  (faux négatifs possibles) — le statut passe alors à « à vérifier », jamais supprimé.

## Limites & obligations juridiques

- **RGPD** : données personnelles hébergées sous la responsabilité de l'exploitant.
  L'app fournit la **suppression du compte et des données** (cascade). En production :
  ajouter registre des traitements, politique de confidentialité, base légale, et
  export des données si nécessaire.
- **Mots de passe** : hachés (bcrypt), jamais en clair. **Aucun mot de passe externe**
  n'est stocké ; les futurs connecteurs (Google, Notion…) doivent passer par **OAuth**.
- **Scraping** : l'application **n'embarque aucun scraper**. Toute future ingestion doit :
  respecter `robots.txt`, les **CGU** des plateformes, ne **jamais contourner** une
  protection anti-scraping, privilégier **API / RSS / open data**. LinkedIn : pas de
  scraping — partage manuel de liens publics uniquement.
- **Droits d'auteur** : ne pas recopier de contenus protégés (descriptions d'offres,
  supports de cours). Stocker des **liens** et de courts résumés ; citer la source.
- **Modèles juridiques** (contrats de cession, conventions…) : fournis à titre
  **pédagogique**. L'app rappelle qu'ils doivent être **vérifiés et adaptés par un
  professionnel** avant tout usage réel.
- **Fiabilité de l'information** : chaque offre/ressource porte un niveau de fiabilité
  (*vérifié / supposé / à vérifier*) et une date de dernière vérification. Les données
  de démonstration sont **explicitement** marquées « démo ».
- **Honnêteté du profil** : le générateur de reformulations et le portfolio interdisent
  d'inventer une expérience ou une compétence, et distinguent *acquis / en cours /
  objectif / observé / exercé*.

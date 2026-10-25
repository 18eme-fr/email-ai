# Charla : apprendre l'espagnol en parlant

Application web vocale : tu parles en espagnol, Claude te répond à voix haute, et tes erreurs sont corrigées en français sous ta phrase.

## Fonctionnalités

- **Conversation vocale** : reconnaissance vocale du navigateur (Web Speech API) et réponses lues par une voix espagnole.
- **Mode mains libres** : le micro se relance tout seul après chaque réponse, pour enchaîner sans toucher l'écran.
- **Niveaux A1 à C1** : vocabulaire et longueur des phrases adaptés.
- **Situations** : discussion libre, bar à tapas, demander son chemin, hôtel, médecin, entretien d'embauche, soirée, débat.
- **Accents** : Espagne, Mexique, Argentine, Colombie.
- **Lecture surlignée** : la réplique de Charla s'affiche en grand et chaque mot s'allume pendant qu'il est prononcé.
- **Corrections au stylo rouge** : la faute est barrée et la bonne forme écrite au-dessus, avec l'explication en français (au choix : importantes, toutes ou aucune), traduction de chaque réponse sur demande, bouton « plus lentement ».
- **Carnet de vocabulaire** : les mots nouveaux et les corrections sont enregistrés ; touche un mot pour l'écouter.

## Utilisation

1. Ouvre la page (GitHub Pages, voir plus bas, ou `npx serve espanol-voz` puis http://localhost:3000).
2. **Réglages** → colle ta clé API Anthropic (créée sur https://console.anthropic.com). Elle reste dans ton navigateur.
3. Choisis niveau et situation, appuie sur le bouton jaune et parle.

Navigateurs : Chrome (ordinateur, Android) ou Safari (iPhone, Mac). Firefox n'a pas la reconnaissance vocale : on peut alors écrire ses phrases.
La page doit être servie en HTTPS (ou `localhost`) pour que le micro fonctionne.

## Déploiement

Le workflow `.github/workflows/deploy-espanol-voz.yml` publie le dossier sur GitHub Pages à chaque push sur `main`.
À activer une fois : *Settings → Pages → Source : GitHub Actions*.

## Technique

- `artifact.html` est la source : c'est la version artefact claude.ai (Claude via le compte de l'utilisateur).
- `index.html` (GitHub Pages, micro direct, clé API) est généré à partir d'elle : `python3 espanol-voz/tools/build.py`. Modifier `artifact.html`, puis relancer le script.
- Modèle : `claude-opus-5-5`, effort `low` pour des réponses rapides, sortie JSON structurée (réponse, traduction, corrections, vocabulaire).
- Repli automatique côté serveur (`fallbacks: "default"`) si une requête est refusée.
- La clé API est appelée directement depuis le navigateur : à garder pour un usage personnel. Pour partager l'appli, il faudrait passer par un petit serveur qui garde la clé.

# Charla : apprendre l'espagnol en parlant

Application web vocale : tu parles en espagnol, Claude te répond à voix haute, et tes erreurs sont corrigées en français sous ta phrase.

## Fonctionnalités

Inspirée de Darij AI : on apprend en parlant, avec un prof IA.

- **Leçons** : un parcours de 18 leçons (A1 à B1) en 6 unités. Chaque leçon a trois étapes : découvrir 4 expressions (avec audio), les utiliser dans une conversation jouée avec Charla (elles se cochent quand tu les dis), puis un bilan noté de 1 à 3 étoiles avec tes corrections. Le niveau choisi au départ ouvre les leçons correspondantes.
- **Discuter** : conversation libre ou en situation (bar, hôtel, médecin, entretien…) avec Charla, la prof bienveillante, ou Paco, le Madrilène provocateur qui te taquine et te lance des défis.
- **Traduire** : français → espagnol ou espagnol → français, à la voix ou au clavier, avec une variante, une remarque et l'écoute.
- **Carnet** : les expressions des leçons, les mots nouveaux et tes corrections s'y ajoutent. Révision en cartes avec répétition espacée (les mots reviennent après 1, 3, 7, 16, 35 jours).
- **Série de jours** : le compteur augmente chaque jour où tu pratiques.
- **Voix** : réponses lues à voix haute avec surlignage mot à mot, mode mains libres, bouton « plus lentement », 4 accents (Espagne, Mexique, Argentine, Colombie).
- **Corrections au stylo rouge** au-dessus de ta phrase, avec l'explication en français.

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

- `artifact.html` est la source : c'est la version artefact claude.ai (Claude via le compte de l'utilisateur, progression enregistrée sur le compte).
- La version GitHub Pages garde la progression dans le navigateur (localStorage).
- `index.html` (GitHub Pages, micro direct, clé API) est généré à partir d'elle : `python3 espanol-voz/tools/build.py`. Modifier `artifact.html`, puis relancer le script.
- Modèle : `claude-opus-5-5`, effort `low` pour des réponses rapides, sortie JSON structurée (réponse, traduction, corrections, vocabulaire).
- Repli automatique côté serveur (`fallbacks: "default"`) si une requête est refusée.
- La clé API est appelée directement depuis le navigateur : à garder pour un usage personnel. Pour partager l'appli, il faudrait passer par un petit serveur qui garde la clé.

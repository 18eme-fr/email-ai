# Méthodologie — Destins de France v0.1

## 1. Principe

Le moteur avance d'une année par pas. À chaque pas : âge, transitions scolaires, marché du travail, bilan financier annuel (une écriture comptable), santé et bien-être de jeu, vieillissement des proches, tirage du décès, puis événements (conséquences différées → jalons → éventuel événement aléatoire). Une décision suspend le temps.

Tout le hasard passe par un générateur à graine (`rng.ts`) dont l'état est stocké dans la partie : même graine + mêmes choix = même vie (testé).

## 2. Statuts documentaires

| Statut | Sens |
|---|---|
| Fait vérifié | Règle juridique ou fait institutionnel vérifié à une date |
| Donnée observée | Statistique publiée, avec période et champ |
| Résultat du modèle | Produit par un modèle aux hypothèses documentées |
| Scénario hypothétique | Futur ; rien de cela n'a eu lieu |
| Situation fictive | Scène individuelle inventée |
| Paramètre de démonstration | Valeur provisoire non validée |

Contrôle automatique : aucune entrée du journal datée après 2026 ne peut porter le statut « Fait vérifié » ou « Donnée observée ». Les règles de 2026 appliquées au futur sont marquées « Scénario hypothétique » avec la mention « supposée inchangée ».

## 3. Données utilisées et leur traduction

| Donnée (source) | Usage dans le moteur | Nature |
|---|---|---|
| 645 000 naissances en 2025 ; 148 300 en Île-de-France ; 11 790 à La Réunion (Insee) | Poids de tirage de la région de naissance | Observé (IDF, Réunion) ; autres régions : démonstration |
| Niveau de vie médian 25 760 €/an/UC ; taux de pauvreté 15,4 % (Insee, revenus 2023) | Loi lognormale calibrée sur ces deux points ; rang du foyer tiré uniformément | Modèle |
| Espérance de vie 2025 : 85,9 ans (F), 80,3 ans (H) (Insee) | Calibrage du paramètre A d'un modèle Gompertz-Makeham | Modèle |
| Smic 2026 : 1 823,03 € brut/mois, ≈ 1 443 € net estimé | Étalon des salaires (multiples par métier : démonstration) | Vérifié + démonstration |
| 80,1 % de bacheliers dans une génération (DEPP, session 2025) | Repère de calibrage des probabilités de réussite | Repère |
| Chômage 8,3 % au T2 2026 (Insee) | Affiché comme contexte, **pas** utilisé comme probabilité individuelle | Observé |
| Instruction obligatoire 3-16 ans, vote à 18 ans, éligibilité municipale à 18 ans, mandats de 6 et 5 ans | Règles appliquées par le moteur | Vérifié (droit 2026) |

### Vérification des sources

Les valeurs ont été relevées le 23/10/2026 dans les extraits de pages officielles fournis par un moteur de recherche ; la lecture directe de insee.fr et legifrance.gouv.fr était bloquée par le réseau de l'environnement de développement. Chaque fiche le précise (`verificationNote`). **Prochaine étape : relecture humaine sur les documents originaux.**

## 4. Validation statistique (1 500 vies, mode automatique)

| Indicateur | Simulé | Repère |
|---|---|---|
| Naissances en Île-de-France | 23,9 % | ≈ 23 % (calcul 148 300 / 645 000) |
| Foyers sous le seuil de pauvreté | 16,4 % | 15,4 % (champ différent : population générale) |
| Bacheliers | ≈ 78 % | 80,1 % d'une génération |
| Durée de vie moyenne, femmes | 85,5 ans | 85,9 (espérance de vie du moment 2025) |
| Durée de vie moyenne, hommes | 80,0 ans | 80,3 |

Rejouer : `npx vitest run tests/validation.report.test.ts`. Ces correspondances portent uniquement sur les indicateurs calibrés : elles ne valident pas le modèle global. Le taux de bacheliers dépend en partie des choix du joueur (mode automatique ici).

Écart documenté et corrigé : dans une première version, la règle de santé de jeu raccourcissait la vie moyenne de 3 à 4 ans. Le multiplicateur de risque est désormais centré sur la santé attendue à chaque âge.

## 5. Paramètres de démonstration (non validés)

Poids des régions autres que l'Île-de-France et La Réunion ; types de territoire et de quartier ; professions et diplômes des parents selon le niveau de vie ; structure familiale et fratrie ; sexe à la naissance (0,5) ; salaires par métier ; loyers et coût de la vie ; risques de perte et de retour à l'emploi ; probabilités de réussite scolaire et de sélection ; allocations, minima et pensions (aucune règle réelle appliquée) ; probabilité d'élection municipale.

## 6. Garde-fous éthiques implémentés

- Prénoms tirés indépendamment du milieu social et du territoire.
- Aucune opinion politique déduite du milieu, du sexe ou du lieu ; listes et candidats futurs fictifs, sans parti réel.
- Aucun choix « gagnant » ; vivre sans couple, sans enfant ou sans engagement n'est jamais pénalisé.
- Portraits sans couleur de peau ; la teinte ne colore que le fond et les vêtements.
- Sujets sensibles : texte sobre, mode atténué, ressources d'aide (3114, 15, 112).

## 7. Non encore modélisé

Calcul réglementaire des prestations et impôts ; écarts de salaire femmes-hommes ; discriminations ; inégalités sociales d'espérance de vie ; tables de mortalité par âge ; Guadeloupe, Martinique, Guyane, Mayotte ; partis réels, Parlement, carrières politiques au-delà du conseil municipal ; mode historique (naissances avant 2026) ; éditeur de contenu.

# Modèle économique de RIDEAU !

Tous les paramètres sont dans `data/balancing/balance.json` et `data/performances/catalog.json`.
Les montants sont des **conventions de jeu** (voir `SOURCES.md`, section 2).

## 1. Principe comptable : engagement ≠ règlement

Chaque mouvement d'argent est une **écriture** du grand livre (`scripts/economy/ledger.gd`) avec :

- `turn_engaged` : la période où elle compte dans le **résultat** ;
- `due_turn` : la période où elle fait bouger la **trésorerie** ;
- `neutral` : touche la trésorerie mais pas le résultat (TVA collectée/reversée, avance remboursable) ;
- `conditional` : ni comptée ni réglée tant qu'elle n'est pas confirmée (solde de subvention).

`Ledger.settle_due()` est **la seule fonction qui modifie la trésorerie** à partir du grand livre :
c'est ce qui garantit qu'aucune somme n'est comptée deux fois (vérifié par les tests).

| Notion du jeu | Calcul |
|---|---|
| Recettes **attendues** | Estimation (`ShowEconomics.estimate`) : fourchette basse / attendue / haute |
| Recettes **encaissées** | Écritures de recette réglées pendant la période |
| Dépenses **engagées** | Écritures de dépense dont `turn_engaged` = période |
| Dépenses **payées** | Écritures de dépense réglées pendant la période |
| **Résultat** de la période | produits engagés − charges engagées (hors neutres) |
| **Variation de trésorerie** | encaissements − décaissements de la période |

## 2. Charges fixes (par période, mode Standard)

| Poste | Montant |
|---|---|
| Salaires de l'équipe permanente | 4 000 € |
| Bâtiment (énergie, assurance, entretien courant) | 1 000 € |

## 3. Recettes de fonctionnement

Subvention de la Ville : **34 000 €**, versée en trois tranches (période 1 : 40 %, période 4 : 40 %,
période 8 : 20 % **sous condition** du bilan de fin de saison). Les tranches sont comptées dans le
résultat de la période où elles sont versées ; le solde est annulé si le bilan est insuffisant.

## 4. Un spectacle

Pour chaque représentation : places vendues = jauge × taux de remplissage tiré au hasard autour
de l'estimation (bruit log-normal, plus fort pour les propositions risquées), **plafonné à la jauge**.

```
Recette TTC        = Σ places × prix
TVA                = TTC × taux / (1 + taux)      (5,5 % ; 2,1 % création ; 0 % atelier)
Recette nette      = TTC − TVA
Cession            : coût = prix de cession (fixe)
Coréalisation      : coût = part de la compagnie × recette nette
Coproduction       : coût = apport (fixe)
+ technique        = coût technique × nombre de représentations
+ défraiements     (voyages, repas, hébergement)
+ droits d'auteur  = 10,5 % × recette nette (sauf domaine public)
Marge              = recette nette − coûts
```

Calendrier de trésorerie : billetterie, cachets, technique et défraiements dans la période ;
**TVA et droits d'auteur à la période suivante**.

### Remplissage attendu (tout public)

```
popularité
× (0,75 + 0,5 × communication/100)
× (0,85 + 0,4 × fidélité/100)
× (1 + 0,8 × intérêt artistique × (réputation − 50)/100)
× (1 + 0,35 × [publics larges] × (diversité − 30)/100)
× (1 / multiplicateur de prix)          (élasticité 1)
× demande de la période × bonus saisonnier
× 0,85 ^ (nombre de fois où le genre a été programmé lors des deux périodes précédentes)
× modificateurs (difficulté, événements, billetterie en ligne +5 %)
```

Séance scolaire : remplissage 0,45 (+0,30 avec un partenariat scolaire), modulé par les relations
et la diversité, à 6 € la place.

### Qualité de la soirée

`0,55 + 0,25 × (équipe − 50)/50 + 0,15 × (équipements − 50)/50 + bonus` + bruit. Un incident
technique (risque si équipements < 45, proportionnel au niveau technique) retire 0,15 de qualité
et coûte 900 € de réparation. La qualité module les gains de réputation et de fidélité.

## 5. Indicateurs

Visibles : **Trésorerie**, **Publics** (fidélité, et total des entrées), **Rayonnement**
(= 50 % réputation + 25 % relations + 25 % diversité).

Internes (0–100) : réputation, fidélité, diversité, relations (avec rendements décroissants :
plus ils sont hauts, plus ils progressent lentement), équipe, équipements, communication.

Évolution naturelle par période : la communication retombe de 30 % vers 15 ; l'équipe récupère
de 4 points (jusqu'à 60) ; les équipements s'usent de 2 points ; la fidélité s'érode de 1 point
(3 points sans aucun spectacle).

## 6. Fin de saison

Objectifs de la convention : trésorerie ≥ 0 (obligatoire), 3 600 entrées, 5 actions d'éducation
artistique et culturelle, 4 œuvres exigeantes (intérêt artistique ≥ 0,7).
**Renouvellement** = trésorerie ≥ 0 **et** au moins 2 des 3 autres objectifs **et** relations ≥ 40.
**Faillite** immédiate si la trésorerie passe sous −6 000 €.

## 7. Garde-fous

- Montants négatifs ou nuls refusés par le grand livre.
- Une programmation ou une action refusée si, **dans le pire des cas**, elle ferait passer la
  trésorerie sous la limite **et** l'aggraverait par rapport à ne rien faire : ne rien faire reste
  toujours possible, le joueur n'est jamais bloqué.
- Toute la part aléatoire dépend de (graine, période, canal) : une partie est reproductible.

## 8. Résultats de la simulation

Voir `docs/BALANCE_REPORT.md` (Standard), `docs/BALANCE_REPORT_EXIGEANT.md` et
`docs/BALANCE_REPORT_DECOUVERTE.md`, produits par `tools/simulate.gd`.

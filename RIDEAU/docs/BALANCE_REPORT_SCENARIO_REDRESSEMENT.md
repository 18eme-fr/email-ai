# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, scénario « Sauver la Lanterne », difficulté « standard », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. | Missions réussies moy. |
|---|---|---|---|---|---|---|---|---|---|---|
| prudente | 1 514 € | 2 727 € | −5 002 € | 9 886 € | 5 % | 0 % | 47.5 | 1459 | 44.4 | 4.9 |
| artistique | −2 294 € | 4 747 € | −14 529 € | 6 899 € | 34 % | 17 % | 57.5 | 3307 | 61.0 | 5.8 |
| publics | −1 977 € | 2 581 € | −12 555 € | 3 725 € | 23 % | 1 % | 69.2 | 3067 | 62.6 | 5.5 |
| equilibre | 860 € | 2 555 € | −6 431 € | 9 013 € | 62 % | 0 % | 75.7 | 3214 | 63.5 | 5.5 |
| batisseur | 568 € | 2 307 € | −5 589 € | 6 793 € | 62 % | 0 % | 78.3 | 3358 | 64.4 | 5.6 |
| aleatoire | −6 111 € | 3 846 € | −13 886 € | 7 662 € | 6 % | 33 % | 28.6 | 1442 | 47.1 | 3.1 |
| passive | −1 079 € | 1 764 € | −5 750 € | 5 320 € | 0 % | 0 % | 18.8 | 0 | 36.3 | 0.0 |

## Fins obtenues

- **prudente** — dans_le_rouge : 54, caisse_pleine : 136, equilibre : 3, maison_publics : 7
- **artistique** — dans_le_rouge : 100, laboratoire : 24, faillite : 33, equilibre : 10, maison_publics : 33
- **publics** — dans_le_rouge : 153, reference : 13, maison_publics : 32, faillite : 2
- **equilibre** — dans_le_rouge : 76, reference : 19, maison_publics : 105
- **batisseur** — dans_le_rouge : 76, reference : 41, maison_publics : 83
- **aleatoire** — faillite : 65, dans_le_rouge : 122, equilibre : 10, demi_teinte : 2, maison_publics : 1
- **passive** — dans_le_rouge : 152, caisse_pleine : 47, demi_teinte : 1

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 35, fidelite 48, diversite 57, equipe 54, equipement 54, communication 74, relations 51
- **artistique** — reputation 64, fidelite 45, diversite 59, equipe 66, equipement 55, communication 74, relations 57
- **publics** — reputation 52, fidelite 60, diversite 82, equipe 46, equipement 51, communication 19, relations 65
- **equilibre** — reputation 55, fidelite 55, diversite 79, equipe 47, equipement 53, communication 41, relations 65
- **batisseur** — reputation 53, fidelite 62, diversite 82, equipe 46, equipement 47, communication 54, relations 69
- **aleatoire** — reputation 47, fidelite 37, diversite 50, equipe 47, equipement 41, communication 27, relations 44
- **passive** — reputation 36, fidelite 8, diversite 37, equipe 61, equipement 37, communication 19, relations 36

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 146, publics 0, eac 47, confiance 27
- **artistique** — equilibre 67, publics 156, eac 198, confiance 101
- **publics** — equilibre 45, publics 127, eac 200, confiance 197
- **equilibre** — equilibre 124, publics 143, eac 200, confiance 200
- **batisseur** — equilibre 124, publics 167, eac 200, confiance 200
- **aleatoire** — equilibre 13, publics 0, eac 153, confiance 36
- **passive** — equilibre 48, publics 0, eac 0, confiance 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1131 | 1 402 € | 79 % |
| Réveillon chez les Morel | 1077 | 1 306 € | 81 % |
| Match d'impro : Bretelles contre Chaussettes | 1043 | 514 € | 64 % |
| Le Grand Voyage de Pipo | 1013 | 362 € | 89 % |
| Mon banquier, ma bataille | 937 | 269 € | 87 % |
| Veillée de contes | 1089 | −326 € | 68 % |
| Atelier du samedi | 1045 | −336 € | 79 % |
| Écrire le théâtre aujourd'hui | 943 | −400 € | 62 % |
| Petite Ourse ne dort pas | 872 | −405 € | 69 % |
| Les Fils invisibles | 827 | −513 € | 48 % |
| Voix d'elles | 942 | −521 € | 52 % |
| Le Malade (presque) imaginaire | 818 | −648 € | 72 % |
| Terres rares | 731 | −713 € | 43 % |
| Les Heures blanches | 782 | −739 € | 46 % |
| Lignes de fuite | 507 | −747 € | 47 % |
| Chansons d'en face | 534 | −761 € | 77 % |
| Hamlet en 45 minutes | 731 | −807 € | 67 % |
| Résidence : la Compagnie du Fil | 941 | −900 € | 52 % |
| Bascule | 809 | −1 140 € | 88 % |
| Machine Ø | 102 | −4 364 € | 31 % |

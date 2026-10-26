# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, difficulté « standard », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 5 836 € | 2 523 € | −678 € | 13 142 € | 0 % | 0 % | 47.0 | 1784 | 50.2 |
| artistique | 1 726 € | 3 822 € | −10 399 € | 9 422 € | 71 % | 4 % | 74.7 | 3715 | 67.0 |
| publics | 679 € | 2 623 € | −9 503 € | 6 833 € | 74 % | 4 % | 74.8 | 3391 | 66.9 |
| equilibre | 5 340 € | 2 801 € | −564 € | 12 181 € | 99 % | 0 % | 84.2 | 3770 | 67.4 |
| batisseur | 2 447 € | 2 180 € | −6 631 € | 8 311 € | 90 % | 1 % | 83.3 | 3809 | 68.3 |
| aleatoire | −41 € | 3 849 € | −11 296 € | 10 208 € | 33 % | 7 % | 49.8 | 1597 | 56.7 |
| passive | 6 131 € | 1 556 € | 2 800 € | 13 100 € | 0 % | 0 % | 27.4 | 0 | 42.6 |

## Fins obtenues

- **prudente** — caisse_pleine : 197, demi_teinte : 1, dans_le_rouge : 2
- **artistique** — dans_le_rouge : 50, reference : 19, laboratoire : 114, maison_publics : 9, faillite : 8
- **publics** — dans_le_rouge : 45, reference : 111, maison_publics : 37, faillite : 7
- **equilibre** — maison_publics : 62, reference : 136, dans_le_rouge : 2
- **batisseur** — reference : 154, maison_publics : 26, dans_le_rouge : 19, faillite : 1
- **aleatoire** — faillite : 14, laboratoire : 11, dans_le_rouge : 87, maison_publics : 13, caisse_pleine : 3, demi_teinte : 31, equilibre : 39, populaire : 2
- **passive** — caisse_pleine : 160, demi_teinte : 40

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 38, fidelite 61, diversite 62, equipe 57, equipement 48, communication 74, relations 62
- **artistique** — reputation 72, fidelite 56, diversite 61, equipe 73, equipement 56, communication 75, relations 63
- **publics** — reputation 57, fidelite 69, diversite 84, equipe 47, equipement 51, communication 20, relations 70
- **equilibre** — reputation 59, fidelite 63, diversite 81, equipe 48, equipement 50, communication 52, relations 71
- **batisseur** — reputation 59, fidelite 67, diversite 83, equipe 49, equipement 56, communication 59, relations 72
- **aleatoire** — reputation 57, fidelite 47, diversite 53, equipe 57, equipement 50, communication 31, relations 59
- **passive** — reputation 41, fidelite 12, diversite 38, equipe 62, equipement 46, communication 20, relations 50

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 198, publics 0, eac 28, exigence 0
- **artistique** — equilibre 142, publics 128, eac 189, exigence 200
- **publics** — equilibre 148, publics 50, eac 200, exigence 190
- **equilibre** — equilibre 198, publics 157, eac 200, exigence 200
- **batisseur** — equilibre 180, publics 149, eac 200, exigence 199
- **aleatoire** — equilibre 99, publics 0, eac 132, exigence 98
- **passive** — equilibre 200, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1116 | 1 800 € | 84 % |
| Réveillon chez les Morel | 1090 | 1 583 € | 84 % |
| Match d'impro : Bretelles contre Chaussettes | 1092 | 594 € | 72 % |
| Le Grand Voyage de Pipo | 1030 | 526 € | 93 % |
| Mon banquier, ma bataille | 1007 | 406 € | 90 % |
| Petite Ourse ne dort pas | 943 | −246 € | 75 % |
| Veillée de contes | 1140 | −290 € | 75 % |
| Atelier du samedi | 1125 | −293 € | 85 % |
| Le Malade (presque) imaginaire | 905 | −351 € | 78 % |
| Écrire le théâtre aujourd'hui | 960 | −400 € | 69 % |
| Les Fils invisibles | 863 | −474 € | 53 % |
| Voix d'elles | 956 | −487 € | 59 % |
| Chansons d'en face | 746 | −542 € | 85 % |
| Terres rares | 782 | −658 € | 48 % |
| Les Heures blanches | 864 | −659 € | 53 % |
| Lignes de fuite | 601 | −720 € | 50 % |
| Hamlet en 45 minutes | 804 | −743 € | 72 % |
| Résidence : la Compagnie du Fil | 944 | −900 € | 59 % |
| Bascule | 869 | −1 057 € | 90 % |
| Machine Ø | 201 | −4 262 € | 35 % |

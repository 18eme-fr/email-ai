# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, difficulté « decouverte », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 13 674 € | 2 356 € | 7 332 € | 20 414 € | 0 % | 0 % | 49.5 | 2218 | 50.7 |
| artistique | 10 359 € | 2 822 € | 3 768 € | 17 804 € | 100 % | 0 % | 85.3 | 4103 | 68.2 |
| publics | 8 233 € | 2 656 € | 1 250 € | 15 784 € | 100 % | 0 % | 86.1 | 3701 | 69.0 |
| equilibre | 14 359 € | 2 718 € | 6 734 € | 21 068 € | 100 % | 0 % | 86.1 | 4009 | 68.1 |
| batisseur | 10 679 € | 2 671 € | 2 170 € | 17 132 € | 100 % | 0 % | 87.8 | 4200 | 69.6 |
| aleatoire | 7 964 € | 4 036 € | −3 499 € | 18 448 € | 42 % | 0 % | 61.1 | 1700 | 57.1 |
| passive | 13 491 € | 1 556 € | 10 160 € | 20 460 € | 0 % | 0 % | 27.4 | 0 | 42.6 |

## Fins obtenues

- **prudente** — caisse_pleine : 192, demi_teinte : 8
- **artistique** — laboratoire : 153, reference : 43, maison_publics : 4
- **publics** — reference : 192, maison_publics : 8
- **equilibre** — reference : 172, maison_publics : 28
- **batisseur** — reference : 197, maison_publics : 3
- **aleatoire** — demi_teinte : 108, laboratoire : 20, maison_publics : 15, caisse_pleine : 4, equilibre : 46, dans_le_rouge : 5, populaire : 1, reference : 1
- **passive** — caisse_pleine : 160, demi_teinte : 40

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 39, fidelite 63, diversite 63, equipe 54, equipement 50, communication 74, relations 62
- **artistique** — reputation 73, fidelite 58, diversite 63, equipe 67, equipement 58, communication 75, relations 64
- **publics** — reputation 60, fidelite 72, diversite 85, equipe 47, equipement 49, communication 22, relations 71
- **equilibre** — reputation 60, fidelite 63, diversite 81, equipe 46, equipement 48, communication 53, relations 71
- **batisseur** — reputation 61, fidelite 69, diversite 84, equipe 47, equipement 56, communication 63, relations 73
- **aleatoire** — reputation 58, fidelite 48, diversite 54, equipe 57, equipement 50, communication 32, relations 60
- **passive** — reputation 41, fidelite 12, diversite 38, equipe 62, equipement 46, communication 20, relations 50

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 200, publics 0, eac 36, exigence 0
- **artistique** — equilibre 200, publics 199, eac 200, exigence 200
- **publics** — equilibre 200, publics 145, eac 200, exigence 200
- **equilibre** — equilibre 200, publics 197, eac 200, exigence 200
- **batisseur** — equilibre 200, publics 200, eac 200, exigence 200
- **aleatoire** — equilibre 195, publics 0, eac 138, exigence 105
- **passive** — equilibre 200, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1120 | 2 056 € | 88 % |
| Réveillon chez les Morel | 1102 | 1 815 € | 87 % |
| Match d'impro : Bretelles contre Chaussettes | 1117 | 637 € | 76 % |
| Le Grand Voyage de Pipo | 1041 | 624 € | 95 % |
| Mon banquier, ma bataille | 1090 | 558 € | 94 % |
| Petite Ourse ne dort pas | 976 | −185 € | 77 % |
| Le Malade (presque) imaginaire | 950 | −228 € | 80 % |
| Atelier du samedi | 1138 | −268 € | 89 % |
| Veillée de contes | 1150 | −271 € | 78 % |
| Chansons d'en face | 1038 | −378 € | 91 % |
| Écrire le théâtre aujourd'hui | 960 | −400 € | 72 % |
| Les Fils invisibles | 902 | −460 € | 55 % |
| Voix d'elles | 958 | −475 € | 61 % |
| Terres rares | 913 | −616 € | 52 % |
| Les Heures blanches | 922 | −633 € | 55 % |
| Lignes de fuite | 815 | −713 € | 51 % |
| Hamlet en 45 minutes | 867 | −746 € | 72 % |
| Bascule | 948 | −886 € | 93 % |
| Résidence : la Compagnie du Fil | 950 | −900 € | 62 % |
| Machine Ø | 250 | −4 176 € | 38 % |

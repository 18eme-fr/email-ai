# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, scénario « La première saison », difficulté « standard », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. | Missions réussies moy. |
|---|---|---|---|---|---|---|---|---|---|---|
| prudente | 9 005 € | 2 378 € | 2 721 € | 16 685 € | 0 % | 0 % | 46.7 | 1789 | 50.0 | 4.5 |
| artistique | 5 515 € | 3 305 € | −5 891 € | 16 854 € | 95 % | 0 % | 82.9 | 3899 | 70.3 | 6.6 |
| publics | 3 679 € | 2 757 € | −1 335 € | 13 512 € | 91 % | 0 % | 82.0 | 3544 | 69.1 | 6.0 |
| equilibre | 9 207 € | 3 197 € | 1 279 € | 15 864 € | 100 % | 0 % | 84.9 | 3871 | 68.5 | 6.0 |
| batisseur | 6 115 € | 2 859 € | −820 € | 13 257 € | 99 % | 0 % | 87.5 | 4037 | 70.8 | 6.8 |
| aleatoire | 1 120 € | 4 472 € | −6 914 € | 13 147 € | 35 % | 0 % | 55.3 | 1659 | 57.7 | 3.4 |
| passive | 6 131 € | 1 556 € | 2 800 € | 13 100 € | 0 % | 0 % | 27.4 | 0 | 42.6 | 0.0 |

## Fins obtenues

- **prudente** — caisse_pleine : 197, demi_teinte : 3
- **artistique** — laboratoire : 154, dans_le_rouge : 11, maison_publics : 11, reference : 22, equilibre : 2
- **publics** — reference : 170, maison_publics : 12, dans_le_rouge : 18
- **equilibre** — maison_publics : 62, reference : 138
- **batisseur** — reference : 195, dans_le_rouge : 3, maison_publics : 2
- **aleatoire** — dans_le_rouge : 77, maison_publics : 13, demi_teinte : 48, equilibre : 27, laboratoire : 29, caisse_pleine : 5, populaire : 1
- **passive** — caisse_pleine : 160, demi_teinte : 40

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 39, fidelite 59, diversite 63, equipe 56, equipement 48, communication 74, relations 60
- **artistique** — reputation 74, fidelite 56, diversite 64, equipe 72, equipement 58, communication 75, relations 68
- **publics** — reputation 58, fidelite 70, diversite 86, equipe 47, equipement 50, communication 22, relations 74
- **equilibre** — reputation 59, fidelite 61, diversite 82, equipe 47, equipement 49, communication 53, relations 75
- **batisseur** — reputation 59, fidelite 69, diversite 85, equipe 49, equipement 57, communication 63, relations 81
- **aleatoire** — reputation 59, fidelite 47, diversite 55, equipe 58, equipement 52, communication 29, relations 58
- **passive** — reputation 41, fidelite 12, diversite 38, equipe 62, equipement 46, communication 20, relations 50

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 200, publics 0, eac 25, exigence 0
- **artistique** — equilibre 189, publics 167, eac 196, exigence 200
- **publics** — equilibre 182, publics 85, eac 200, exigence 200
- **equilibre** — equilibre 200, publics 175, eac 200, exigence 200
- **batisseur** — equilibre 197, publics 193, eac 200, exigence 200
- **aleatoire** — equilibre 123, publics 0, eac 130, exigence 106
- **passive** — equilibre 200, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1122 | 1 797 € | 84 % |
| Réveillon chez les Morel | 1115 | 1 599 € | 84 % |
| Match d'impro : Bretelles contre Chaussettes | 1114 | 598 € | 72 % |
| Le Grand Voyage de Pipo | 1025 | 524 € | 93 % |
| Mon banquier, ma bataille | 1048 | 432 € | 91 % |
| Petite Ourse ne dort pas | 947 | −213 € | 76 % |
| Veillée de contes | 1144 | −290 € | 75 % |
| Atelier du samedi | 1116 | −292 € | 85 % |
| Le Malade (presque) imaginaire | 931 | −320 € | 79 % |
| Écrire le théâtre aujourd'hui | 959 | −400 € | 69 % |
| Les Fils invisibles | 916 | −472 € | 53 % |
| Voix d'elles | 947 | −487 € | 59 % |
| Chansons d'en face | 889 | −534 € | 85 % |
| Terres rares | 859 | −640 € | 50 % |
| Les Heures blanches | 895 | −643 € | 54 % |
| Lignes de fuite | 746 | −726 € | 49 % |
| Hamlet en 45 minutes | 849 | −727 € | 74 % |
| Résidence : la Compagnie du Fil | 936 | −900 € | 60 % |
| Bascule | 888 | −1 030 € | 90 % |
| Machine Ø | 257 | −4 263 € | 35 % |

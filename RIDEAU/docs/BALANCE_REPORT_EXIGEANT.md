# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 60 saisons par stratégie, difficulté « exigeant », graines 1000 à 1059.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | −3 060 € | 2 736 € | −7 642 € | 2 256 € | 0 % | 18 % | 35.9 | 2787 | 51.9 |
| artistique | −1 629 € | 2 995 € | −9 598 € | 6 317 € | 25 % | 5 % | 66.8 | 3707 | 63.9 |
| publics | −5 465 € | 3 915 € | −12 101 € | 2 070 € | 17 % | 58 % | 29.3 | 3137 | 63.9 |
| equilibre | −643 € | 3 924 € | −9 580 € | 7 409 € | 57 % | 15 % | 62.9 | 3410 | 64.2 |
| aleatoire | −4 230 € | 3 543 € | −11 373 € | 6 394 € | 13 % | 35 % | 31.0 | 1442 | 55.1 |
| passive | 1 739 € | 1 409 € | −1 060 € | 5 360 € | 0 % | 0 % | 26.1 | 0 | 42.8 |

## Fins obtenues

- **prudente** — dans_le_rouge : 37, faillite : 11, caisse_pleine : 8, demi_teinte : 4
- **artistique** — dans_le_rouge : 42, reference : 4, faillite : 3, laboratoire : 7, maison_publics : 3, equilibre : 1
- **publics** — faillite : 35, reference : 5, dans_le_rouge : 15, maison_publics : 5
- **equilibre** — faillite : 9, reference : 8, maison_publics : 26, dans_le_rouge : 17
- **aleatoire** — faillite : 21, dans_le_rouge : 31, equilibre : 7, maison_publics : 1
- **passive** — caisse_pleine : 46, dans_le_rouge : 6, demi_teinte : 8

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 41, fidelite 61, diversite 65, equipe 51, equipement 54, communication 72, relations 61
- **artistique** — reputation 66, fidelite 56, diversite 62, equipe 74, equipement 55, communication 75, relations 62
- **publics** — reputation 52, fidelite 67, diversite 83, equipe 46, equipement 52, communication 19, relations 69
- **equilibre** — reputation 54, fidelite 59, diversite 79, equipe 46, equipement 51, communication 42, relations 70
- **aleatoire** — reputation 56, fidelite 45, diversite 51, equipe 58, equipement 52, communication 29, relations 58
- **passive** — reputation 41, fidelite 12, diversite 39, equipe 62, equipement 45, communication 20, relations 51

## Objectifs atteints (sur 60 saisons)

- **prudente** — equilibre 12, publics 0, eac 26, exigence 0
- **artistique** — equilibre 15, publics 38, eac 58, exigence 60
- **publics** — equilibre 10, publics 3, eac 60, exigence 31
- **equilibre** — equilibre 34, publics 17, eac 60, exigence 49
- **aleatoire** — equilibre 8, publics 0, eac 34, exigence 25
- **passive** — equilibre 54, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 279 | 1 339 € | 78 % |
| Réveillon chez les Morel | 271 | 1 079 € | 78 % |
| Match d'impro : Bretelles contre Chaussettes | 259 | 543 € | 67 % |
| Le Grand Voyage de Pipo | 257 | 318 € | 88 % |
| Mon banquier, ma bataille | 280 | 276 € | 87 % |
| Veillée de contes | 275 | −309 € | 72 % |
| Atelier du samedi | 281 | −315 € | 83 % |
| Petite Ourse ne dort pas | 247 | −328 € | 73 % |
| Écrire le théâtre aujourd'hui | 223 | −400 € | 64 % |
| Voix d'elles | 279 | −495 € | 57 % |
| Les Fils invisibles | 170 | −500 € | 50 % |
| Le Malade (presque) imaginaire | 251 | −547 € | 75 % |
| Les Heures blanches | 162 | −696 € | 49 % |
| Terres rares | 157 | −703 € | 44 % |
| Hamlet en 45 minutes | 250 | −745 € | 72 % |
| Lignes de fuite | 87 | −774 € | 42 % |
| Chansons d'en face | 275 | −784 € | 77 % |
| Résidence : la Compagnie du Fil | 206 | −900 € | 56 % |
| Bascule | 257 | −1 309 € | 85 % |
| Machine Ø | 22 | −4 490 € | 27 % |

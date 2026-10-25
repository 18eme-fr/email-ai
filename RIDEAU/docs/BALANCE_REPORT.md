# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 100 saisons par stratégie, difficulté « standard », graines 1000 à 1099.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 2 125 € | 2 636 € | −2 723 € | 8 249 € | 0 % | 0 % | 53.6 | 2913 | 52.7 |
| artistique | 3 691 € | 2 727 € | −3 543 € | 10 045 € | 93 % | 0 % | 82.7 | 3893 | 65.2 |
| publics | 361 € | 3 154 € | −11 039 € | 8 142 € | 70 % | 8 % | 71.2 | 3377 | 66.2 |
| equilibre | 4 401 € | 2 817 € | −251 € | 11 656 € | 98 % | 0 % | 83.0 | 3735 | 66.7 |
| aleatoire | −282 € | 4 235 € | −11 296 € | 10 042 € | 34 % | 8 % | 49.2 | 1601 | 57.0 |
| passive | 6 041 € | 1 319 € | 3 300 € | 9 720 € | 0 % | 0 % | 27.5 | 0 | 42.6 |

## Fins obtenues

- **prudente** — dans_le_rouge : 23, demi_teinte : 12, caisse_pleine : 65
- **artistique** — dans_le_rouge : 7, reference : 13, laboratoire : 57, maison_publics : 19, equilibre : 4
- **publics** — faillite : 8, reference : 46, dans_le_rouge : 22, maison_publics : 24
- **equilibre** — reference : 52, maison_publics : 46, dans_le_rouge : 2
- **aleatoire** — dans_le_rouge : 45, laboratoire : 8, maison_publics : 5, caisse_pleine : 1, faillite : 8, demi_teinte : 12, equilibre : 20, populaire : 1
- **passive** — caisse_pleine : 82, demi_teinte : 18

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 42, fidelite 62, diversite 66, equipe 51, equipement 56, communication 72, relations 61
- **artistique** — reputation 67, fidelite 58, diversite 63, equipe 75, equipement 57, communication 75, relations 63
- **publics** — reputation 56, fidelite 69, diversite 84, equipe 46, equipement 51, communication 21, relations 70
- **equilibre** — reputation 58, fidelite 62, diversite 80, equipe 47, equipement 50, communication 52, relations 71
- **aleatoire** — reputation 58, fidelite 48, diversite 53, equipe 57, equipement 53, communication 30, relations 60
- **passive** — reputation 41, fidelite 12, diversite 39, equipe 62, equipement 46, communication 20, relations 51

## Objectifs atteints (sur 100 saisons)

- **prudente** — equilibre 77, publics 0, eac 61, exigence 0
- **artistique** — equilibre 93, publics 90, eac 100, exigence 100
- **publics** — equilibre 70, publics 24, eac 100, exigence 91
- **equilibre** — equilibre 98, publics 70, eac 100, exigence 100
- **aleatoire** — equilibre 47, publics 0, eac 67, exigence 49
- **passive** — equilibre 100, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 462 | 1 560 € | 81 % |
| Réveillon chez les Morel | 450 | 1 298 € | 80 % |
| Match d'impro : Bretelles contre Chaussettes | 451 | 575 € | 71 % |
| Le Grand Voyage de Pipo | 431 | 437 € | 91 % |
| Mon banquier, ma bataille | 473 | 305 € | 88 % |
| Petite Ourse ne dort pas | 431 | −273 € | 74 % |
| Veillée de contes | 473 | −302 € | 73 % |
| Atelier du samedi | 474 | −307 € | 84 % |
| Écrire le théâtre aujourd'hui | 380 | −400 € | 65 % |
| Voix d'elles | 473 | −482 € | 59 % |
| Les Fils invisibles | 332 | −490 € | 51 % |
| Le Malade (presque) imaginaire | 422 | −490 € | 76 % |
| Chansons d'en face | 459 | −653 € | 81 % |
| Terres rares | 326 | −674 € | 47 % |
| Les Heures blanches | 338 | −680 € | 51 % |
| Hamlet en 45 minutes | 428 | −736 € | 73 % |
| Lignes de fuite | 199 | −745 € | 46 % |
| Résidence : la Compagnie du Fil | 365 | −900 € | 59 % |
| Bascule | 432 | −1 137 € | 88 % |
| Machine Ø | 38 | −4 445 € | 28 % |

# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 100 saisons par stratégie, difficulté « standard », graines 1000 à 1099.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 5 672 € | 2 422 € | −678 € | 13 142 € | 0 % | 0 % | 46.8 | 1771 | 50.3 |
| artistique | 2 210 € | 3 439 € | −6 089 € | 8 913 € | 75 % | 1 % | 77.2 | 3730 | 66.8 |
| publics | 982 € | 2 406 € | −7 058 € | 6 833 € | 78 % | 3 % | 75.4 | 3391 | 66.7 |
| equilibre | 5 449 € | 2 759 € | 220 € | 11 171 € | 100 % | 0 % | 84.0 | 3755 | 66.9 |
| aleatoire | −206 € | 4 184 € | −11 296 € | 10 042 € | 33 % | 8 % | 49.1 | 1575 | 57.0 |
| passive | 6 041 € | 1 319 € | 3 300 € | 9 720 € | 0 % | 0 % | 27.5 | 0 | 42.6 |

## Fins obtenues

- **prudente** — caisse_pleine : 97, demi_teinte : 1, dans_le_rouge : 2
- **artistique** — dans_le_rouge : 24, reference : 10, laboratoire : 59, maison_publics : 6, faillite : 1
- **publics** — dans_le_rouge : 19, reference : 58, maison_publics : 20, faillite : 3
- **equilibre** — maison_publics : 42, reference : 58
- **aleatoire** — faillite : 8, laboratoire : 7, dans_le_rouge : 46, maison_publics : 5, caisse_pleine : 1, demi_teinte : 12, equilibre : 20, populaire : 1
- **passive** — caisse_pleine : 82, demi_teinte : 18

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 38, fidelite 61, diversite 62, equipe 57, equipement 49, communication 74, relations 62
- **artistique** — reputation 71, fidelite 56, diversite 62, equipe 72, equipement 56, communication 75, relations 63
- **publics** — reputation 56, fidelite 69, diversite 84, equipe 47, equipement 51, communication 20, relations 70
- **equilibre** — reputation 58, fidelite 62, diversite 81, equipe 48, equipement 50, communication 53, relations 71
- **aleatoire** — reputation 58, fidelite 47, diversite 53, equipe 57, equipement 53, communication 30, relations 60
- **passive** — reputation 41, fidelite 12, diversite 39, equipe 62, equipement 46, communication 20, relations 51

## Objectifs atteints (sur 100 saisons)

- **prudente** — equilibre 98, publics 0, eac 13, exigence 0
- **artistique** — equilibre 75, publics 65, eac 98, exigence 100
- **publics** — equilibre 78, publics 22, eac 100, exigence 96
- **equilibre** — equilibre 100, publics 76, eac 100, exigence 100
- **aleatoire** — equilibre 46, publics 0, eac 67, exigence 49
- **passive** — equilibre 100, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 461 | 1 693 € | 83 % |
| Réveillon chez les Morel | 444 | 1 452 € | 82 % |
| Match d'impro : Bretelles contre Chaussettes | 449 | 571 € | 70 % |
| Le Grand Voyage de Pipo | 413 | 455 € | 92 % |
| Mon banquier, ma bataille | 409 | 318 € | 88 % |
| Petite Ourse ne dort pas | 375 | −273 € | 75 % |
| Veillée de contes | 464 | −294 € | 75 % |
| Atelier du samedi | 466 | −300 € | 85 % |
| Écrire le théâtre aujourd'hui | 380 | −400 € | 66 % |
| Le Malade (presque) imaginaire | 354 | −420 € | 78 % |
| Les Fils invisibles | 333 | −486 € | 52 % |
| Voix d'elles | 376 | −502 € | 56 % |
| Chansons d'en face | 314 | −598 € | 84 % |
| Terres rares | 333 | −685 € | 46 % |
| Les Heures blanches | 349 | −693 € | 50 % |
| Lignes de fuite | 229 | −741 € | 47 % |
| Hamlet en 45 minutes | 308 | −746 € | 72 % |
| Résidence : la Compagnie du Fil | 373 | −900 € | 58 % |
| Bascule | 332 | −1 227 € | 88 % |
| Machine Ø | 106 | −4 331 € | 32 % |

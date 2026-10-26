# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, scénario « Le pari de la création », difficulté « standard », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. | Missions réussies moy. |
|---|---|---|---|---|---|---|---|---|---|---|
| prudente | 6 043 € | 2 576 € | −80 € | 13 333 € | 0 % | 0 % | 46.3 | 1884 | 51.5 | 3.8 |
| artistique | 2 493 € | 3 608 € | −8 533 € | 13 261 € | 75 % | 1 % | 79.3 | 3838 | 70.6 | 6.9 |
| publics | −2 441 € | 4 624 € | −10 752 € | 7 941 € | 39 % | 10 % | 60.2 | 3507 | 70.1 | 5.8 |
| equilibre | 3 898 € | 4 836 € | −6 740 € | 13 921 € | 70 % | 0 % | 71.5 | 3873 | 69.8 | 5.9 |
| batisseur | 24 € | 4 403 € | −8 177 € | 10 307 € | 48 % | 1 % | 66.9 | 4010 | 71.0 | 5.9 |
| aleatoire | −4 920 € | 3 380 € | −13 419 € | 5 902 € | 2 % | 24 % | 29.2 | 1624 | 59.2 | 3.6 |
| passive | 2 131 € | 1 556 € | −1 200 € | 9 100 € | 0 % | 0 % | 29.3 | 0 | 42.6 | 0.0 |

## Fins obtenues

- **prudente** — caisse_pleine : 198, dans_le_rouge : 1, demi_teinte : 1
- **artistique** — laboratoire : 91, reference : 52, maison_publics : 7, dans_le_rouge : 49, faillite : 1
- **publics** — reference : 78, dans_le_rouge : 103, faillite : 19
- **equilibre** — reference : 128, maison_publics : 11, dans_le_rouge : 49, demi_teinte : 12
- **batisseur** — reference : 96, dans_le_rouge : 98, faillite : 2, demi_teinte : 4
- **aleatoire** — dans_le_rouge : 138, faillite : 48, laboratoire : 3, demi_teinte : 11
- **passive** — caisse_pleine : 151, demi_teinte : 38, dans_le_rouge : 11

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 38, fidelite 62, diversite 63, equipe 56, equipement 48, communication 75, relations 67
- **artistique** — reputation 74, fidelite 58, diversite 64, equipe 74, equipement 57, communication 75, relations 69
- **publics** — reputation 59, fidelite 71, diversite 86, equipe 47, equipement 49, communication 20, relations 76
- **equilibre** — reputation 60, fidelite 63, diversite 82, equipe 49, equipement 49, communication 54, relations 76
- **batisseur** — reputation 61, fidelite 69, diversite 85, equipe 49, equipement 57, communication 63, relations 78
- **aleatoire** — reputation 61, fidelite 47, diversite 55, equipe 57, equipement 50, communication 30, relations 61
- **passive** — reputation 41, fidelite 12, diversite 38, equipe 62, equipement 46, communication 20, relations 50

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 199, exigence 0, reconnaissance 0, publics 0
- **artistique** — equilibre 150, exigence 200, reconnaissance 142, publics 200
- **publics** — equilibre 78, exigence 90, reconnaissance 0, publics 195
- **equilibre** — equilibre 151, exigence 139, reconnaissance 0, publics 200
- **batisseur** — equilibre 100, exigence 100, reconnaissance 0, publics 200
- **aleatoire** — equilibre 14, exigence 9, reconnaissance 15, publics 1
- **passive** — equilibre 189, exigence 0, reconnaissance 0, publics 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1123 | 1 865 € | 85 % |
| Réveillon chez les Morel | 1099 | 1 639 € | 85 % |
| Match d'impro : Bretelles contre Chaussettes | 1109 | 608 € | 74 % |
| Le Grand Voyage de Pipo | 1048 | 550 € | 93 % |
| Mon banquier, ma bataille | 1003 | 454 € | 91 % |
| Petite Ourse ne dort pas | 953 | −193 € | 77 % |
| Le Malade (presque) imaginaire | 948 | −270 € | 80 % |
| Veillée de contes | 1152 | −285 € | 76 % |
| Atelier du samedi | 1129 | −290 € | 86 % |
| Écrire le théâtre aujourd'hui | 948 | −400 € | 71 % |
| Les Fils invisibles | 907 | −466 € | 54 % |
| Voix d'elles | 951 | −480 € | 60 % |
| Chansons d'en face | 825 | −495 € | 86 % |
| Terres rares | 819 | −627 € | 51 % |
| Les Heures blanches | 876 | −647 € | 54 % |
| Hamlet en 45 minutes | 803 | −704 € | 76 % |
| Lignes de fuite | 678 | −717 € | 50 % |
| Résidence : la Compagnie du Fil | 975 | −900 € | 54 % |
| Bascule | 883 | −1 032 € | 90 % |
| Machine Ø | 229 | −4 305 € | 34 % |

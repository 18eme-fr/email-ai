# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, difficulté « exigeant », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 832 € | 2 661 € | −5 483 € | 8 035 € | 0 % | 0 % | 40.3 | 1661 | 50.0 |
| artistique | −3 421 € | 3 889 € | −13 198 € | 5 868 € | 21 % | 31 % | 47.2 | 3246 | 65.4 |
| publics | −3 828 € | 3 437 € | −11 376 € | 2 743 € | 15 % | 34 % | 44.1 | 3089 | 64.9 |
| equilibre | 987 € | 2 099 € | −5 532 € | 7 624 € | 71 % | 0 % | 75.6 | 3470 | 66.0 |
| batisseur | −365 € | 2 487 € | −10 221 € | 6 964 € | 54 % | 5 % | 71.1 | 3489 | 67.0 |
| aleatoire | −4 004 € | 3 537 € | −11 373 € | 6 394 € | 15 % | 30 % | 32.8 | 1429 | 55.3 |
| passive | 1 771 € | 1 556 € | −1 560 € | 8 740 € | 0 % | 0 % | 25.7 | 0 | 42.6 |

## Fins obtenues

- **prudente** — dans_le_rouge : 83, caisse_pleine : 117
- **artistique** — dans_le_rouge : 96, laboratoire : 35, faillite : 62, reference : 2, equilibre : 1, maison_publics : 4
- **publics** — dans_le_rouge : 104, faillite : 67, maison_publics : 15, reference : 14
- **equilibre** — dans_le_rouge : 58, reference : 59, maison_publics : 83
- **batisseur** — dans_le_rouge : 82, reference : 81, maison_publics : 27, faillite : 10
- **aleatoire** — faillite : 59, dans_le_rouge : 111, equilibre : 22, maison_publics : 6, laboratoire : 2
- **passive** — caisse_pleine : 145, dans_le_rouge : 22, demi_teinte : 33

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 38, fidelite 61, diversite 62, equipe 57, equipement 48, communication 75, relations 62
- **artistique** — reputation 70, fidelite 53, diversite 59, equipe 72, equipement 53, communication 75, relations 62
- **publics** — reputation 54, fidelite 66, diversite 82, equipe 47, equipement 51, communication 19, relations 69
- **equilibre** — reputation 57, fidelite 60, diversite 79, equipe 48, equipement 51, communication 44, relations 70
- **batisseur** — reputation 57, fidelite 65, diversite 82, equipe 47, equipement 53, communication 51, relations 72
- **aleatoire** — reputation 56, fidelite 45, diversite 52, equipe 58, equipement 50, communication 29, relations 58
- **passive** — reputation 41, fidelite 12, diversite 38, equipe 62, equipement 46, communication 20, relations 50

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 117, publics 0, eac 28, exigence 0
- **artistique** — equilibre 42, publics 51, eac 179, exigence 200
- **publics** — equilibre 29, publics 8, eac 200, exigence 152
- **equilibre** — equilibre 142, publics 75, eac 200, exigence 199
- **batisseur** — equilibre 108, publics 67, eac 200, exigence 194
- **aleatoire** — equilibre 30, publics 0, eac 112, exigence 80
- **passive** — equilibre 178, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1107 | 1 660 € | 82 % |
| Réveillon chez les Morel | 1031 | 1 420 € | 82 % |
| Match d'impro : Bretelles contre Chaussettes | 1006 | 558 € | 69 % |
| Le Grand Voyage de Pipo | 1014 | 449 € | 91 % |
| Mon banquier, ma bataille | 944 | 315 € | 87 % |
| Petite Ourse ne dort pas | 902 | −288 € | 74 % |
| Veillée de contes | 1122 | −300 € | 73 % |
| Atelier du samedi | 1089 | −309 € | 83 % |
| Écrire le théâtre aujourd'hui | 948 | −400 € | 68 % |
| Le Malade (presque) imaginaire | 836 | −429 € | 77 % |
| Les Fils invisibles | 767 | −484 € | 52 % |
| Voix d'elles | 948 | −494 € | 58 % |
| Terres rares | 657 | −673 € | 47 % |
| Chansons d'en face | 447 | −680 € | 81 % |
| Les Heures blanches | 775 | −681 € | 51 % |
| Lignes de fuite | 485 | −734 € | 48 % |
| Hamlet en 45 minutes | 725 | −743 € | 72 % |
| Résidence : la Compagnie du Fil | 929 | −900 € | 58 % |
| Bascule | 844 | −1 175 € | 88 % |
| Machine Ø | 159 | −4 360 € | 32 % |

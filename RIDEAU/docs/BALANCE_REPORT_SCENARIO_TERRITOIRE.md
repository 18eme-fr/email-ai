# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 200 saisons par stratégie, scénario « Un théâtre pour tout le quartier », difficulté « standard », graines 1000 à 1199.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. | Missions réussies moy. |
|---|---|---|---|---|---|---|---|---|---|---|
| prudente | 8 952 € | 2 507 € | 3 519 € | 17 743 € | 0 % | 0 % | 52.4 | 1770 | 50.2 | 2.4 |
| artistique | 3 105 € | 5 377 € | −11 601 € | 14 802 € | 60 % | 5 % | 67.8 | 3913 | 68.9 | 5.4 |
| publics | 4 694 € | 2 943 € | −1 463 € | 14 503 € | 95 % | 0 % | 86.8 | 3582 | 69.8 | 6.0 |
| equilibre | 10 175 € | 3 157 € | 803 € | 16 748 € | 100 % | 0 % | 85.9 | 3897 | 69.1 | 6.1 |
| batisseur | 6 791 € | 2 828 € | −616 € | 15 619 € | 99 % | 0 % | 87.4 | 4052 | 70.5 | 6.2 |
| aleatoire | −1 119 € | 3 929 € | −9 832 € | 8 724 € | 2 % | 8 % | 39.3 | 1584 | 56.4 | 2.9 |
| passive | 6 085 € | 1 552 € | 2 800 € | 11 600 € | 0 % | 0 % | 29.6 | 0 | 39.9 | 0.0 |

## Fins obtenues

- **prudente** — caisse_pleine : 192, demi_teinte : 8
- **artistique** — dans_le_rouge : 54, laboratoire : 98, demi_teinte : 17, reference : 19, maison_publics : 3, faillite : 9
- **publics** — reference : 181, maison_publics : 8, dans_le_rouge : 11
- **equilibre** — reference : 118, maison_publics : 75, laboratoire : 7
- **batisseur** — reference : 194, maison_publics : 4, dans_le_rouge : 2
- **aleatoire** — dans_le_rouge : 117, demi_teinte : 63, maison_publics : 3, caisse_pleine : 2, faillite : 15
- **passive** — caisse_pleine : 157, demi_teinte : 43

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 40, fidelite 60, diversite 59, equipe 56, equipement 47, communication 74, relations 62
- **artistique** — reputation 74, fidelite 55, diversite 62, equipe 70, equipement 59, communication 75, relations 65
- **publics** — reputation 62, fidelite 70, diversite 85, equipe 48, equipement 49, communication 21, relations 70
- **equilibre** — reputation 63, fidelite 61, diversite 80, equipe 48, equipement 49, communication 53, relations 71
- **batisseur** — reputation 63, fidelite 67, diversite 83, equipe 49, equipement 56, communication 62, relations 72
- **aleatoire** — reputation 59, fidelite 45, diversite 50, equipe 59, equipement 51, communication 29, relations 57
- **passive** — reputation 41, fidelite 9, diversite 32, equipe 62, equipement 46, communication 20, relations 47

## Objectifs atteints (sur 200 saisons)

- **prudente** — equilibre 200, publics 0, eac 0, diversite 18
- **artistique** — equilibre 137, publics 198, eac 123, diversite 38
- **publics** — equilibre 189, publics 190, eac 200, diversite 200
- **equilibre** — equilibre 200, publics 199, eac 200, diversite 200
- **batisseur** — equilibre 198, publics 200, eac 200, diversite 200
- **aleatoire** — equilibre 68, publics 1, eac 40, diversite 3
- **passive** — equilibre 200, publics 0, eac 0, diversite 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 1117 | 1 822 € | 84 % |
| Réveillon chez les Morel | 1098 | 1 616 € | 84 % |
| Match d'impro : Bretelles contre Chaussettes | 1114 | 595 € | 72 % |
| Le Grand Voyage de Pipo | 1037 | 530 € | 93 % |
| Mon banquier, ma bataille | 1070 | 456 € | 91 % |
| Petite Ourse ne dort pas | 956 | −226 € | 76 % |
| Veillée de contes | 1143 | −290 € | 75 % |
| Atelier du samedi | 1121 | −302 € | 84 % |
| Le Malade (presque) imaginaire | 934 | −333 € | 78 % |
| Écrire le théâtre aujourd'hui | 961 | −400 € | 69 % |
| Les Fils invisibles | 910 | −471 € | 53 % |
| Voix d'elles | 951 | −486 € | 58 % |
| Chansons d'en face | 877 | −509 € | 86 % |
| Terres rares | 871 | −634 € | 50 % |
| Les Heures blanches | 904 | −643 € | 54 % |
| Lignes de fuite | 776 | −723 € | 50 % |
| Hamlet en 45 minutes | 845 | −736 € | 73 % |
| Résidence : la Compagnie du Fil | 977 | −900 € | 53 % |
| Bascule | 875 | −1 027 € | 91 % |
| Machine Ø | 229 | −4 214 € | 37 % |

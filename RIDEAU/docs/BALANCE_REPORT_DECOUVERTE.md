# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 60 saisons par stratégie, difficulté « decouverte », graines 1000 à 1059.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 13 672 € | 2 394 € | 8 845 € | 20 414 € | 0 % | 0 % | 48.7 | 2158 | 50.3 |
| artistique | 10 949 € | 2 605 € | 4 859 € | 15 757 € | 100 % | 0 % | 85.1 | 4073 | 67.9 |
| publics | 8 279 € | 2 817 € | 1 250 € | 14 966 € | 100 % | 0 % | 86.2 | 3687 | 68.8 |
| equilibre | 14 764 € | 2 719 € | 8 740 € | 19 603 € | 100 % | 0 % | 86.0 | 3982 | 67.7 |
| aleatoire | 8 310 € | 4 411 € | −1 630 € | 18 448 € | 50 % | 0 % | 62.0 | 1719 | 57.3 |
| passive | 13 459 € | 1 409 € | 10 660 € | 17 080 € | 0 % | 0 % | 27.6 | 0 | 42.8 |

## Fins obtenues

- **prudente** — caisse_pleine : 59, demi_teinte : 1
- **artistique** — laboratoire : 46, reference : 11, maison_publics : 3
- **publics** — reference : 56, maison_publics : 4
- **equilibre** — reference : 48, maison_publics : 12
- **aleatoire** — demi_teinte : 26, laboratoire : 5, maison_publics : 7, caisse_pleine : 1, equilibre : 18, dans_le_rouge : 3
- **passive** — caisse_pleine : 49, demi_teinte : 11

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 39, fidelite 63, diversite 62, equipe 55, equipement 50, communication 74, relations 62
- **artistique** — reputation 72, fidelite 58, diversite 63, equipe 67, equipement 57, communication 75, relations 64
- **publics** — reputation 60, fidelite 72, diversite 85, equipe 46, equipement 49, communication 22, relations 71
- **equilibre** — reputation 60, fidelite 62, diversite 81, equipe 45, equipement 48, communication 56, relations 71
- **aleatoire** — reputation 58, fidelite 48, diversite 53, equipe 56, equipement 51, communication 32, relations 60
- **passive** — reputation 41, fidelite 12, diversite 39, equipe 62, equipement 45, communication 20, relations 51

## Objectifs atteints (sur 60 saisons)

- **prudente** — equilibre 60, publics 0, eac 9, exigence 0
- **artistique** — equilibre 60, publics 59, eac 60, exigence 60
- **publics** — equilibre 60, publics 45, eac 60, exigence 60
- **equilibre** — equilibre 60, publics 60, eac 60, exigence 60
- **aleatoire** — equilibre 57, publics 0, eac 42, exigence 37
- **passive** — equilibre 60, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 281 | 1 887 € | 85 % |
| Réveillon chez les Morel | 272 | 1 634 € | 85 % |
| Match d'impro : Bretelles contre Chaussettes | 277 | 611 € | 74 % |
| Le Grand Voyage de Pipo | 252 | 536 € | 94 % |
| Mon banquier, ma bataille | 263 | 488 € | 92 % |
| Petite Ourse ne dort pas | 233 | −213 € | 77 % |
| Atelier du samedi | 280 | −270 € | 89 % |
| Le Malade (presque) imaginaire | 226 | −276 € | 81 % |
| Veillée de contes | 277 | −276 € | 79 % |
| Écrire le théâtre aujourd'hui | 227 | −400 € | 69 % |
| Chansons d'en face | 249 | −442 € | 89 % |
| Les Fils invisibles | 214 | −477 € | 52 % |
| Voix d'elles | 225 | −489 € | 58 % |
| Terres rares | 223 | −662 € | 48 % |
| Les Heures blanches | 215 | −682 € | 51 % |
| Hamlet en 45 minutes | 203 | −736 € | 73 % |
| Lignes de fuite | 200 | −738 € | 48 % |
| Résidence : la Compagnie du Fil | 226 | −900 € | 61 % |
| Bascule | 218 | −1 091 € | 91 % |
| Machine Ø | 76 | −4 247 € | 36 % |

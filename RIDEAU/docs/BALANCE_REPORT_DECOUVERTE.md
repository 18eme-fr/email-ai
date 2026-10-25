# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 60 saisons par stratégie, difficulté « decouverte », graines 1000 à 1059.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 11 277 € | 2 709 € | 6 223 € | 16 472 € | 0 % | 0 % | 56.0 | 3007 | 52.4 |
| artistique | 12 110 € | 2 873 € | 4 960 € | 18 997 € | 100 % | 0 % | 84.5 | 4026 | 65.9 |
| publics | 7 732 € | 3 156 € | 2 669 € | 16 383 € | 100 % | 0 % | 85.4 | 3658 | 68.5 |
| equilibre | 13 518 € | 2 796 € | 8 510 € | 20 490 € | 100 % | 0 % | 86.0 | 3945 | 67.6 |
| aleatoire | 8 310 € | 4 411 € | −1 630 € | 18 448 € | 50 % | 0 % | 62.0 | 1719 | 57.3 |
| passive | 13 459 € | 1 409 € | 10 660 € | 17 080 € | 0 % | 0 % | 27.6 | 0 | 42.8 |

## Fins obtenues

- **prudente** — caisse_pleine : 54, demi_teinte : 6
- **artistique** — laboratoire : 44, reference : 8, maison_publics : 7, equilibre : 1
- **publics** — reference : 55, maison_publics : 5
- **equilibre** — reference : 44, maison_publics : 16
- **aleatoire** — demi_teinte : 26, laboratoire : 5, maison_publics : 7, caisse_pleine : 1, equilibre : 18, dans_le_rouge : 3
- **passive** — caisse_pleine : 49, demi_teinte : 11

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 41, fidelite 61, diversite 65, equipe 52, equipement 56, communication 73, relations 61
- **artistique** — reputation 69, fidelite 58, diversite 63, equipe 74, equipement 57, communication 75, relations 64
- **publics** — reputation 59, fidelite 72, diversite 85, equipe 46, equipement 49, communication 22, relations 71
- **equilibre** — reputation 59, fidelite 62, diversite 81, equipe 45, equipement 48, communication 54, relations 71
- **aleatoire** — reputation 58, fidelite 48, diversite 53, equipe 56, equipement 51, communication 32, relations 60
- **passive** — reputation 41, fidelite 12, diversite 39, equipe 62, equipement 45, communication 20, relations 51

## Objectifs atteints (sur 60 saisons)

- **prudente** — equilibre 60, publics 0, eac 30, exigence 0
- **artistique** — equilibre 60, publics 58, eac 60, exigence 60
- **publics** — equilibre 60, publics 40, eac 60, exigence 60
- **equilibre** — equilibre 60, publics 60, eac 60, exigence 60
- **aleatoire** — equilibre 57, publics 0, eac 42, exigence 37
- **passive** — equilibre 60, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 281 | 1 771 € | 84 % |
| Réveillon chez les Morel | 272 | 1 497 € | 83 % |
| Match d'impro : Bretelles contre Chaussettes | 271 | 602 € | 73 % |
| Le Grand Voyage de Pipo | 259 | 538 € | 94 % |
| Mon banquier, ma bataille | 281 | 499 € | 92 % |
| Petite Ourse ne dort pas | 255 | −221 € | 77 % |
| Atelier du samedi | 283 | −279 € | 88 % |
| Veillée de contes | 280 | −283 € | 77 % |
| Le Malade (presque) imaginaire | 253 | −344 € | 79 % |
| Écrire le théâtre aujourd'hui | 227 | −400 € | 68 % |
| Les Fils invisibles | 214 | −471 € | 53 % |
| Voix d'elles | 284 | −480 € | 60 % |
| Chansons d'en face | 277 | −601 € | 83 % |
| Terres rares | 223 | −658 € | 48 % |
| Les Heures blanches | 215 | −663 € | 52 % |
| Hamlet en 45 minutes | 257 | −742 € | 73 % |
| Lignes de fuite | 193 | −742 € | 47 % |
| Résidence : la Compagnie du Fil | 226 | −900 € | 62 % |
| Bascule | 262 | −1 004 € | 91 % |
| Machine Ø | 32 | −4 316 € | 33 % |

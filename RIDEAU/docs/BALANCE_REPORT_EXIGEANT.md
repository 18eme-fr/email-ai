# Rapport d'équilibrage automatique

Généré par `tools/simulate.gd` — 60 saisons par stratégie, difficulté « exigeant », graines 1000 à 1059.

| Stratégie | Trésorerie finale moy. | Écart-type | Min | Max | Convention renouvelée | Faillite | Score moy. | Spectateurs moy. | Rayonnement moy. |
|---|---|---|---|---|---|---|---|---|---|
| prudente | 363 € | 2 724 € | −5 483 € | 8 035 € | 0 % | 0 % | 39.2 | 1642 | 50.0 |
| artistique | −2 842 € | 3 978 € | −11 919 € | 5 868 € | 27 % | 25 % | 51.0 | 3276 | 65.1 |
| publics | −4 173 € | 3 418 € | −10 783 € | 2 743 € | 15 % | 42 % | 38.6 | 3052 | 64.7 |
| equilibre | 1 191 € | 2 192 € | −3 122 € | 7 069 € | 72 % | 0 % | 75.0 | 3410 | 65.4 |
| aleatoire | −4 254 € | 3 589 € | −11 373 € | 6 394 € | 15 % | 37 % | 30.0 | 1396 | 55.0 |
| passive | 1 739 € | 1 409 € | −1 060 € | 5 360 € | 0 % | 0 % | 26.1 | 0 | 42.8 |

## Fins obtenues

- **prudente** — dans_le_rouge : 28, caisse_pleine : 32
- **artistique** — dans_le_rouge : 29, laboratoire : 14, faillite : 15, reference : 1, equilibre : 1
- **publics** — dans_le_rouge : 26, faillite : 25, reference : 4, maison_publics : 5
- **equilibre** — dans_le_rouge : 17, reference : 12, maison_publics : 31
- **aleatoire** — faillite : 22, dans_le_rouge : 29, equilibre : 7, maison_publics : 2
- **passive** — caisse_pleine : 46, dans_le_rouge : 6, demi_teinte : 8

## Indicateurs internes moyens en fin de saison

- **prudente** — reputation 38, fidelite 61, diversite 62, equipe 57, equipement 48, communication 75, relations 62
- **artistique** — reputation 69, fidelite 53, diversite 60, equipe 71, equipement 54, communication 75, relations 62
- **publics** — reputation 53, fidelite 66, diversite 82, equipe 47, equipement 52, communication 19, relations 70
- **equilibre** — reputation 56, fidelite 59, diversite 79, equipe 48, equipement 51, communication 48, relations 70
- **aleatoire** — reputation 56, fidelite 45, diversite 51, equipe 59, equipement 52, communication 29, relations 57
- **passive** — reputation 41, fidelite 12, diversite 39, equipe 62, equipement 45, communication 20, relations 51

## Objectifs atteints (sur 60 saisons)

- **prudente** — equilibre 32, publics 0, eac 6, exigence 0
- **artistique** — equilibre 16, publics 12, eac 56, exigence 60
- **publics** — equilibre 9, publics 0, eac 60, exigence 44
- **equilibre** — equilibre 43, publics 19, eac 60, exigence 60
- **aleatoire** — equilibre 9, publics 0, eac 32, exigence 25
- **passive** — equilibre 54, publics 0, eac 0, exigence 0

## Marge moyenne par spectacle (toutes stratégies)

| Spectacle | Programmations | Marge moyenne | Remplissage moyen |
|---|---|---|---|
| Le Dîner des quiproquos | 278 | 1 456 € | 79 % |
| Réveillon chez les Morel | 255 | 1 217 € | 80 % |
| Match d'impro : Bretelles contre Chaussettes | 242 | 520 € | 65 % |
| Le Grand Voyage de Pipo | 245 | 360 € | 90 % |
| Mon banquier, ma bataille | 223 | 203 € | 85 % |
| Veillée de contes | 266 | −305 € | 73 % |
| Atelier du samedi | 266 | −307 € | 84 % |
| Petite Ourse ne dort pas | 211 | −336 € | 73 % |
| Écrire le théâtre aujourd'hui | 220 | −400 € | 64 % |
| Le Malade (presque) imaginaire | 195 | −491 € | 77 % |
| Les Fils invisibles | 172 | −499 € | 50 % |
| Voix d'elles | 221 | −511 € | 54 % |
| Terres rares | 176 | −698 € | 44 % |
| Les Heures blanches | 186 | −726 € | 47 % |
| Hamlet en 45 minutes | 168 | −746 € | 72 % |
| Lignes de fuite | 108 | −752 € | 45 % |
| Chansons d'en face | 127 | −773 € | 78 % |
| Résidence : la Compagnie du Fil | 216 | −900 € | 56 % |
| Bascule | 194 | −1 443 € | 84 % |
| Machine Ø | 52 | −4 435 € | 29 % |

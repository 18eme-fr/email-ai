# Registre de la collection de la Lanterne

*Généré par `python3 tools/collection_registry.py` à partir de `data/progression/collection.json` : ne pas modifier à la main.*

50 objets, conservés d'une partie à l'autre (`user://collection.json`). Aucun objet ne donne d'avantage de gestion ; les récompenses sont décoratives (tenues, guirlande du hall, distinctions).

## Répartition (vérifiée par le script et par `tests/progression/test_collection.gd`)

| | Commun | Peu commun | Rare | Légendaire | Mythique | Total |
|---|---|---|---|---|---|---|
| Les archives du théâtre | 5 | 3 | 2 | 0 | 0 | 10 |
| Costumes et accessoires | 4 | 3 | 2 | 1 | 0 | 10 |
| Décors et scénographie | 4 | 3 | 2 | 1 | 0 | 10 |
| Les trésors techniques | 4 | 4 | 2 | 0 | 0 | 10 |
| Les légendes du spectacle vivant | 3 | 2 | 2 | 2 | 1 | 10 |
| **Total** | **20** | **15** | **10** | **4** | **1** | **50** |

| Mode d'obtention principal | Objets |
|---|---|
| Exploration | 14 |
| Mission | 12 |
| Rencontre | 8 |
| Énigme ou secret | 6 |
| Développement du théâtre | 5 |
| Événement | 5 |

## Les archives du théâtre

| # | Identifiant | Nom | Rareté | Mode | Source et déclencheur | Prérequis | Alternative | Exposition |
|---|---|---|---|---|---|---|---|---|
| 1 | `programme_1987` | Programme de la saison 1987 | Commun | Exploration | Ramasser (Entrée face à l'objet) dans le bureau, case (3, 7) | aucune | — | vitrines du hall |
| 2 | `coupure_presse` | Coupure de presse jaunie | Commun | Rencontre | Parler à « Le chef de gare » | aucune | — | vitrines du hall |
| 3 | `billet_avignon` | Billet d'Avignon, 1947 | Commun | Exploration | Ramasser (Entrée face à l'objet) dans la ville, case (8, 20) | aucune | — | vitrines du hall |
| 4 | `livre_or` | Livre d'or de la Lanterne | Commun | Exploration | Examiner : Billetterie (le hall) | aucune | — | vitrines du hall |
| 5 | `plaque_1902` | Plaque inaugurale de 1902 | Peu commun | Développement du théâtre | Vérifié après chaque étape : rénovation « accessibilite » | aucune | — | vitrines du hall |
| 6 | `programme_tnp` | Programme du TNP, 1951 | Peu commun | Rencontre | Parler à « Bibliothécaire » | période ≥ 2 | — | vitrines du hall |
| 7 | `contrat_1962` | Contrat de tournée de 1962 | Peu commun | Mission | Vérifié après chaque étape : mission « contrat_negociation » réussie OU dossier « contrat » ≥ 80 % | aucune | Le dossier « Cession ou coréalisation ? » réussi à 80 % (même en entraînement) le donne aussi. | vitrines du hall |
| 8 | `registre_1959` | Registre comptable de 1959 | Commun | Mission | Vérifié après chaque étape : mission « budget_saison » réussie OU dossier « budget » ≥ 80 % | aucune | Le dossier « Budget prévisionnel » réussi à 80 % le donne aussi. | vitrines du hall |
| 9 | `affiche_1924` | Affiche de la création de 1924 | Rare | Mission | Terminer l'enquête « archives_oubliees » | aucune | — | vitrines du hall |
| 10 | `photo_vasseur` | Photographie de la troupe Vasseur | Rare | Énigme ou secret | Fouiller (Entrée) dans la réserve, case (12, 7) | indice(s) malle_vasseur | — | vitrines du hall |

- **Programme de la saison 1987** — Couverture jaunie, agrafes rouillées. En dernière page : « Merci à M. Pic, notre souffleur, pour sa dernière saison. » *Indices : Dans le théâtre, côté administration. / Par terre, près de la bibliothèque du bureau de la direction.*
- **Coupure de presse jaunie** — « La Lanterne rallume ses feux » : un article de 1952 sur la réouverture du théâtre après la guerre. *Indices : Quelqu'un qui voit passer tous les voyageurs. / Parlez au chef de gare, sur le quai.*
- **Billet d'Avignon, 1947** — En 1947, Jean Vilar crée à Avignon une « Semaine d'art ». Ce billet en vient : le début d'un festival. *Indices : Dans la ville, au bord de l'eau. / Sur les quais de l'Ondine, tout à l'ouest.*
- **Livre d'or de la Lanterne** — Cent ans de mots de spectateurs. Le premier date de 1902 : « Enfin un théâtre chez nous ! » *Indices : Dans le hall du théâtre. / Rangé sous le comptoir de la billetterie.*
- **Plaque inaugurale de 1902** — Retrouvée derrière l'ancien guichet pendant les travaux : « Ce théâtre est la maison de tous. » *Indices : Elle se cache dans un mur du hall. / Réalisez les travaux d'accessibilité du hall.*
- **Programme du TNP, 1951** — Jean Vilar dirige le Théâtre national populaire de 1951 à 1963 : le théâtre comme service public. *Indices : Quelqu'un qui reçoit beaucoup de dons de livres. / Parlez à la bibliothécaire de la médiathèque, à partir de la 2ᵉ période.*
- **Contrat de tournée de 1962** — Signé à la plume : cachet, transport, repas des artistes… Les contrats de cession n'ont pas tant changé. *Indices : Une mission sur les contrats de spectacle. / Réussissez la mission « Cession ou coréalisation ? » de Louison (ou le dossier « Cession ou coréalisation ? » à 80 % dans le journal).*
- **Registre comptable de 1959** — Recettes à l'encre bleue, dépenses à l'encre rouge. Le budget de la Lanterne, tenu à la main. *Indices : Une mission sur le budget. / Réussissez « Le budget prévisionnel » d'Hélène (ou le dossier « Budget » à 80 %).*
- **Affiche de la création de 1924** — « 12 mars 1924 — La troupe Vasseur présente LA LANTERNE D'ONDINE ». Le soir où la lanterne de scène a disparu. *Indices : Un ancien du théâtre a une histoire à raconter. / Parlez à Fernand, l'ancien régisseur, près du Café des Artistes.*
- **Photographie de la troupe Vasseur** — Douze comédiens posent sur le plateau en 1924. Au centre, bien visible : la trappe de scène. *Indices : Une malle bien cachée… / Dans la réserve, la malle à double fond. Louison en sait plus.*

## Costumes et accessoires

| # | Identifiant | Nom | Rareté | Mode | Source et déclencheur | Prérequis | Alternative | Exposition |
|---|---|---|---|---|---|---|---|---|
| 1 | `masque_arlequin` | Masque d'Arlequin | Commun | Exploration | Ramasser (Entrée face à l'objet) dans la ville, case (108, 64) | aucune | — | vitrines du hall |
| 2 | `gants_habilleuse` | Gants de l'habilleuse | Commun | Exploration | Examiner : Portant de costumes (les coulisses) | aucune | — | vitrines du hall |
| 3 | `eventail_diva` | Éventail de la diva | Commun | Exploration | Ramasser (Entrée face à l'objet) dans les coulisses, case (6, 4) | aucune | — | vitrines du hall |
| 4 | `nez_clown` | Nez rouge de clown | Commun | Rencontre | Parler à « Enfant » | aucune | — | vitrines du hall |
| 5 | `chapeau_mes` | Chapeau de metteur en scène | Peu commun | Rencontre | Parler à « Louison » | 1 spectacle(s) joué(s) | — | vitrines du hall |
| 6 | `costume_eleves` | Costume cousu par les élèves | Peu commun | Mission | Vérifié après chaque étape : mission « parcours_eac » réussie OU eac_count ≥ 6 | aucune | Six actions d'éducation artistique dans la saison le donnent aussi. | vitrines du hall |
| 7 | `couronne_doublure` | Couronne de la doublure | Peu commun | Événement | Vérifié après chaque étape : événement « annulation_maladie » (choix doublure/lecture) OU shows_count ≥ 8 | aucune | Huit représentations dans la saison la donnent aussi. | vitrines du hall |
| 8 | `escarpins_lys` | Escarpins de Mlle Lys | Rare | Énigme ou secret | Fouiller (Entrée) dans les coulisses, case (4, 2) | indice(s) escarpins | — | vitrines du hall |
| 9 | `cape_cid` | Cape de velours du Cid | Rare | Développement du théâtre | Vérifié après chaque étape : rénovation « loges » | aucune | — | vitrines du hall |
| 10 | `masque_bauta` | Masque vénitien de la Bauta | Légendaire | Mission | Terminer l'enquête « collectionneur » | aucune | — | vitrines du hall |

- **Masque d'Arlequin** — Commedia dell'arte, Italie, XVIᵉ siècle : des personnages types, et beaucoup d'improvisation. *Indices : Dans la ville, loin du centre. / Au bout du quartier des Coteaux, côté est.*
- **Gants de l'habilleuse** — Brodés « L. » au poignet. Dans un gant, un billet : « Il manque les escarpins de Mlle Lys. » *Indices : Dans les coulisses. / Fouillez le portant de costumes des coulisses.*
- **Éventail de la diva** — Plumes d'autruche et nacre. Il aurait servi à une diva de l'opérette, pour cacher son trac. *Indices : Dans les coulisses. / Par terre, près des loges.*
- **Nez rouge de clown** — « C'est pour toi, comme ça tu feras rire les gens. » Le plus petit masque du monde. *Indices : Le public de demain a un cadeau pour vous. / Parlez aux enfants, au parc ou aux Coteaux.*
- **Chapeau de metteur en scène** — Un feutre cabossé, porté pendant trente ans de répétitions. Il sent le café froid et la poussière de plateau. *Indices : Un artiste du théâtre veut fêter votre première soirée. / Parlez à Louison dans les coulisses, après votre première représentation.*
- **Costume cousu par les élèves** — Patchwork de tissus récupérés par une classe de 4ᵉ pour leur premier atelier théâtre. *Indices : Une mission d'éducation artistique. / Réussissez « Le parcours d'éducation artistique » d'Inès (ou menez 6 actions d'éducation artistique).*
- **Couronne de la doublure** — Carton doré et verroterie. Portée par une comédienne qui a appris le rôle en une nuit. *Indices : Un soir où le spectacle a failli ne pas avoir lieu. / Quand un comédien tombe malade, sauvez la soirée (doublure ou lecture) — ou jouez 8 représentations dans la saison.*
- **Escarpins de Mlle Lys** — Satin rose usé jusqu'à la trame. Mlle Lys, danseuse de la Lanterne, les cachait pour qu'on ne les lui vole pas. *Indices : Quelqu'un les a cachés il y a longtemps. / La coiffeuse du milieu, dans les coulisses. Rémi, à l'accueil, connaît l'histoire.*
- **Cape de velours du Cid** — Velours grenat, doublure dorée. Portée pour « Le Cid » en 1931, oubliée dans un placard des loges. *Indices : Elle dort dans un vieux placard. / Rénovez les loges et l'atelier des coulisses.*
- **Masque vénitien de la Bauta** — Un masque de carnaval vénitien du XVIIIᵉ siècle, cédé par un collectionneur qui ne le confiait qu'aux connaisseurs. *Indices : Un mystérieux amateur d'objets rares. / Le collectionneur loge à l'Hôtel du Commerce à partir de la 3ᵉ période.*

## Décors et scénographie

| # | Identifiant | Nom | Rareté | Mode | Source et déclencheur | Prérequis | Alternative | Exposition |
|---|---|---|---|---|---|---|---|---|
| 1 | `maquette_carton` | Maquette de décor en carton | Commun | Exploration | Examiner : Établi de l'atelier (les coulisses) | aucune | — | vitrines du hall |
| 2 | `pinceau_decorateur` | Pinceau de peintre-décorateur | Commun | Exploration | Ramasser (Entrée face à l'objet) dans la ville, case (71, 9) | aucune | — | vitrines du hall |
| 3 | `fleur_tissu` | Fleur en tissu de décor | Commun | Exploration | Examiner : Fleuriste (la ville) | aucune | — | vitrines du hall |
| 4 | `miniature_lanterne` | Miniature de la Lanterne | Commun | Rencontre | Parler à « Touriste » | aucune | — | vitrines du hall |
| 5 | `toile_etoilee` | Toile peinte du ciel étoilé | Peu commun | Exploration | Ramasser (Entrée face à l'objet) dans la réserve, case (3, 7) | aucune | — | vitrines du hall |
| 6 | `miniature_orange` | Maquette du théâtre antique d'Orange | Peu commun | Mission | Vérifié après chaque étape : mission « mecenat » réussie OU dossier « mecenat » ≥ 80 % | aucune | Le dossier « Une proposition de mécénat » réussi à 80 % la donne aussi. | vitrines du hall |
| 7 | `panneau_complet` | Panneau « COMPLET » peint à la main | Peu commun | Mission | Vérifié après chaque étape : mission « frequentation_mi_saison » réussie OU attendance_total ≥ 1500 | aucune | 1 500 spectateurs dans la saison le donnent aussi. | vitrines du hall |
| 8 | `trompe_loeil` | Trompe-l'œil de la forêt | Rare | Énigme ou secret | Fouiller (Entrée) dans la ville, case (64, 8) | indice(s) porte_muree | — | vitrines du hall |
| 9 | `lettres_enseigne` | Lettres de l'ancienne enseigne | Rare | Développement du théâtre | Vérifié après chaque étape : rénovation « enseigne » | aucune | — | vitrines du hall |
| 10 | `esquisse_rideau` | Esquisse du rideau d'Ondine | Légendaire | Mission | Terminer l'enquête « rideau_origine » | aucune | — | vitrines du hall |

- **Maquette de décor en carton** — Un salon bourgeois au 1/25ᵉ : chaque meuble est découpé à la main. Avant de construire, on maquette. *Indices : Dans l'atelier. / Sur l'établi des coulisses.*
- **Pinceau de peintre-décorateur** — Un pinceau de 12 cm, raide de peinture. Les décors se peignaient au sol, à grands gestes. *Indices : Près d'un lieu de fabrication. / Devant La Fabrique, la friche culturelle, au nord.*
- **Fleur en tissu de décor** — Une rose en tissu amidonné : elle ne fanera jamais, même sous les projecteurs. *Indices : Chez un commerçant du quartier des Arts. / Chez le fleuriste.*
- **Miniature de la Lanterne** — Une petite Lanterne en résine, achetée à l'office de tourisme. Le théâtre devient un souvenir de voyage. *Indices : Quelqu'un qui découvre la ville. / Parlez à la touriste, sur la place.*
- **Toile peinte du ciel étoilé** — Une toile de fond de 6 mètres, roulée depuis des décennies. Le ciel de Bréval, en 1950. *Indices : Dans un endroit fermé à clé. / Dans la réserve, sous les coulisses.*
- **Maquette du théâtre antique d'Orange** — Un mur de scène romain miniature. Le cadeau d'un mécène qui aime les théâtres qui durent. *Indices : Une mission de partenariat. / Réussissez « Convaincre un mécène » (ou le dossier « Mécénat » à 80 %).*
- **Panneau « COMPLET » peint à la main** — Lettres dorées sur fond rouge : on l'accrochait au guichet les grands soirs. *Indices : Une mission sur la fréquentation. / Réussissez « Les chiffres de mi-saison » (ou atteignez 1 500 spectateurs).*
- **Trompe-l'œil de la forêt** — Une forêt profonde peinte sur toile en 1950 : de loin, on jurerait entendre le vent. *Indices : Derrière une porte que plus personne n'ouvre. / À la Fabrique, la porte murée à gauche de l'entrée. Le programmateur du cinéma en a entendu parler.*
- **Lettres de l'ancienne enseigne** — Le « L » et le « A » de la première enseigne lumineuse, en tôle émaillée. Le reste s'est perdu. *Indices : En haut de la façade. / Installez la nouvelle enseigne lumineuse.*
- **Esquisse du rideau d'Ondine** — Le dessin original du rideau de 1902, peint par des habitantes du quartier : vagues, étoiles et une lanterne. *Indices : Un motif ancien se cache dans un quartier. / Parlez à Karim, à la maison de quartier des Coteaux, à partir de la 3ᵉ période.*

## Les trésors techniques

| # | Identifiant | Nom | Rareté | Mode | Source et déclencheur | Prérequis | Alternative | Exposition |
|---|---|---|---|---|---|---|---|---|
| 1 | `gelatine_ambre` | Gélatine de couleur ambre | Commun | Exploration | Ramasser (Entrée face à l'objet) dans la salle, case (4, 8) | aucune | — | vitrines du hall |
| 2 | `cle_molette` | Clé à molette du régisseur | Commun | Rencontre | Parler à « Bastien » | aucune | — | vitrines du hall |
| 3 | `caisse_1930` | Caisse enregistreuse de 1930 | Commun | Mission | Vérifié après chaque étape : mission « seuil_rentabilite » réussie OU dossier « seuil » ≥ 80 % | aucune | Le dossier « Seuil de rentabilité » réussi à 80 % la donne aussi. | vitrines du hall |
| 4 | `talkie` | Talkie-walkie de plateau | Commun | Exploration | Ramasser (Entrée face à l'objet) dans le hall, case (2, 11) | aucune | — | vitrines du hall |
| 5 | `micro_ruban` | Micro à ruban des années 50 | Peu commun | Rencontre | Parler à « Musicien de la fanfare » | période ≥ 4 | — | vitrines du hall |
| 6 | `projecteur_par` | Projecteur PAR de 1980 | Peu commun | Développement du théâtre | Vérifié après chaque étape : rénovation « projecteurs_led » | aucune | — | vitrines du hall |
| 7 | `registre_securite` | Registre de sécurité de 1964 | Peu commun | Mission | Vérifié après chaque étape : mission « commission_securite » réussie OU equipements ≥ 70 | aucune | Un équipement à 70 ou plus le donne aussi. | vitrines du hall |
| 8 | `moufle` | Moufle de machinerie | Peu commun | Exploration | Ramasser (Entrée face à l'objet) dans la réserve, case (10, 4) | aucune | — | vitrines du hall |
| 9 | `projecteur_1950` | Projecteur restauré de 1950 | Rare | Mission | Terminer l'enquête « restauration » | aucune | — | vitrines du hall |
| 10 | `console_1975` | Console d'éclairage de 1975 | Rare | Événement | Vérifié après chaque étape : événement « panne_console » (choix reparer/louer/bricoler) OU equipements ≥ 75 | aucune | Un équipement à 75 ou plus la donne aussi. | vitrines du hall |

- **Gélatine de couleur ambre** — Un filtre de couleur pour projecteur : avec lui, toute scène devient un soir d'été. *Indices : Dans la salle de spectacle. / Au pied de la scène, côté gauche.*
- **Clé à molette du régisseur** — La clé de Bastien, gravée « B.K. ». Elle a serré chaque projecteur du théâtre. *Indices : Quelqu'un qui règle tout dans la salle. / Parlez à Bastien, le régisseur, dans la salle.*
- **Caisse enregistreuse de 1930** — Clavier en laiton, sonnette à chaque vente. Elle a encaissé quarante ans de billets. *Indices : Une mission sur la rentabilité. / Réussissez « Le seuil de rentabilité » d'Hélène (ou le dossier « Seuil » à 80 %).*
- **Talkie-walkie de plateau** — « Régie à plateau, top lumière ! » Grésillant mais fidèle. *Indices : Dans le hall. / Oublié dans un coin du hall, près de l'entrée.*
- **Micro à ruban des années 50** — Chromé, lourd, élégant. Il a capté les voix de la fanfare pendant des décennies. *Indices : Un musicien a du vieux matériel. / Parlez au musicien de la fanfare, au kiosque du parc, à partir de la 4ᵉ période.*
- **Projecteur PAR de 1980** — Un des anciens projecteurs halogènes, démonté pour laisser place aux LED. Il chauffe, mais quelle lumière ! *Indices : Il attend d'être remplacé. / Installez les projecteurs LED dans la salle.*
- **Registre de sécurité de 1964** — Chaque visite des pompiers y est notée. La sécurité du public, première règle d'un théâtre. *Indices : Une mission sur la sécurité. / Réussissez « La commission de sécurité » de Bastien (ou amenez l'équipement à 70).*
- **Moufle de machinerie** — Une poulie à trois réas pour lever les décors. Avant les moteurs, tout se faisait à la force des bras. *Indices : Dans un endroit fermé à clé. / Dans la réserve, entre les étagères.*
- **Projecteur restauré de 1950** — Remis en état avec une lentille de Fresnel et une lampe d'époque. Il éclaire comme au premier jour. *Indices : Un vieil appareil abîmé attend un peu de soin. / Dans la réserve, examinez le vieux projecteur, puis parlez à Bastien.*
- **Console d'éclairage de 1975** — Vingt-quatre potentiomètres en bakélite. Les éclairagistes y jouaient comme d'un orgue. *Indices : Le jour où la technique a lâché. / Quand la console tombe en panne, décidez quoi faire — ou amenez l'équipement à 75.*

## Les légendes du spectacle vivant

| # | Identifiant | Nom | Rareté | Mode | Source et déclencheur | Prérequis | Alternative | Exposition |
|---|---|---|---|---|---|---|---|---|
| 1 | `piece_dedicacee` | Pièce dédicacée | Commun | Rencontre | Parler à « Libraire » | aucune | — | vitrines du hall |
| 2 | `bouquet_seche` | Bouquet séché de la première | Commun | Exploration | Examiner : Loges (les coulisses) | aucune | — | vitrines du hall |
| 3 | `verre_entracte` | Verre gravé de l'entracte | Commun | Développement du théâtre | Vérifié après chaque étape : rénovation « foyer_bar » | aucune | — | vitrines du hall |
| 4 | `rose_rappel` | Rose lancée au rappel | Peu commun | Événement | Vérifié après chaque étape : trophée « salle_comble » | aucune | — | vitrines du hall |
| 5 | `une_courrier` | Une du Courrier de l'Ondine | Peu commun | Événement | Vérifié après chaque étape : événement « journaliste » (choix interview/creation) OU reputation ≥ 70 | aucune | Une réputation de 70 la donne aussi. | vitrines du hall |
| 6 | `medaille_ville` | Médaille de la Ville | Rare | Événement | Vérifié après chaque étape : trophée « convention » | aucune | — | vitrines du hall |
| 7 | `carnet_souffleur` | Carnet du souffleur | Rare | Énigme ou secret | Fouiller (Entrée) dans la salle, case (9, 7) | indice(s) souffleur | — | vitrines du hall |
| 8 | `lettre_breval` | Lettre d'Anselme Brévalois | Légendaire | Énigme ou secret | Examiner : Statue d'Ondine (la ville) | indice(s) lettre_2 | — | vitrines du hall |
| 9 | `brigadier` | Le brigadier de la première | Légendaire | Énigme ou secret | Fouiller (Entrée) dans les coulisses, case (17, 4) | indice(s) brigadier | — | vitrines du hall |
| 10 | `lanterne_ondine` | La Lanterne d'Ondine | Mythique | Mission | Terminer l'enquête « representation_perdue » | aucune | — | vitrines du hall |

- **Pièce dédicacée** — « À la Lanterne, qui m'a donné ma première chance. » Signé : une autrice devenue célèbre. *Indices : Une commerçante du quartier des Arts. / Parlez à la libraire de La Plume.*
- **Bouquet séché de la première** — Des roses séchées, attachées par un ruban : « Soir de première, 1987 ». *Indices : Dans les coulisses. / Dans les loges, sur une coiffeuse.*
- **Verre gravé de l'entracte** — Un verre de cristal gravé d'une lanterne. On trinquait au foyer depuis 1902. *Indices : Au bar, en rénovant. / Rénovez le bar du foyer.*
- **Rose lancée au rappel** — Lancée depuis le balcon un soir de salle comble. Le public était debout. *Indices : Un soir où la salle est pleine à craquer. / Remplissez la salle à au moins 95 %.*
- **Une du Courrier de l'Ondine** — « LA LANTERNE FAIT SALLE COMBLE » — la une encadrée par la rédaction. *Indices : La presse s'intéresse à vous. / Accordez un entretien au journaliste — ou portez la réputation à 70.*
- **Médaille de la Ville** — Remise par le maire à la direction quand la convention est renouvelée. Rare et méritée. *Indices : Le terme d'une saison réussie. / Faites renouveler la convention en fin de saison.*
- **Carnet du souffleur** — Le carnet de M. Pic, dernier souffleur (1987). En marge : « Le brigadier ? Derrière la porte du plateau, côté coulisses. » *Indices : Un métier disparu a laissé une trace. / Le trou du souffleur, au milieu de l'avant-scène. Hélène s'en souvient.*
- **Lettre d'Anselme Brévalois** — La dernière lettre du poète, écrite pour l'ouverture de la Lanterne : « Que ce théâtre soit la place publique des âmes. » *Indices : Une énigme en trois lieux, gravée dans la pierre. / Lisez le socle de la statue du poète, puis suivez l'eau.*
- **Le brigadier de la première** — Le bâton qui a frappé les trois coups du 12 mars 1924. Son bois est poli par cent ans de mains. *Indices : Il a frappé les trois coups de la toute première. / Le carnet du souffleur le dit : derrière la porte du plateau, dans les coulisses.*
- **La Lanterne d'Ondine** — La lanterne de scène de 1924, qui a donné son nom au théâtre. On la croyait perdue : elle attendait sous la scène. *Indices : Une représentation dont on parle encore à voix basse. / Une histoire de 1924 : elle commence avec une affiche, et se termine un soir de spectacle.*

## Enquêtes (missions de collection)

### Les archives oubliées — récompense : Affiche de la création de 1924 (Rare)
Commence avec Fernand.

1. Écouter Fernand, l'ancien régisseur. *(Parler à « Fernand » — donne l'indice « cle_reserve »)*
2. Entrer dans la réserve, au fond des coulisses. *(Entrer dans la réserve)*
3. Fouiller l'armoire des archives. *(Examiner : Armoire des archives (la réserve))*
4. Montrer la trouvaille à Fernand. *(Parler à « Fernand »)*

### La restauration — récompense : Projecteur restauré de 1950 (Rare)
Commence avec Bastien.

1. Examiner le vieux projecteur de la réserve. *(Examiner : Vieux projecteur (la réserve))*
2. En parler à Bastien. *(Parler à « Bastien »)*
3. Trouver une lentille de Fresnel (disquaire). *(Examiner : Disquaire (la ville))*
4. Trouver une lampe d'époque (La Fabrique). *(Examiner : La Fabrique (friche culturelle) (la ville))*
5. Rapporter les pièces à Bastien. *(Parler à « Bastien »)*

### Le collectionneur mystérieux — récompense : Masque vénitien de la Bauta (Légendaire)
Commence avec Le collectionneur.

1. Rencontrer le collectionneur (8 objets dans votre collection). *(Parler à « Le collectionneur » — condition : 8 objets dans la collection)*
2. Lui montrer le masque d'Arlequin et l'éventail de la diva. *(Parler à « Le collectionneur » — condition : posséder masque_arlequin, eventail_diva)*
3. Revenir quand le théâtre aura une belle réputation (60). *(Parler à « Le collectionneur » — condition : reputation ≥ 60)*

### Le rideau d'origine — récompense : Esquisse du rideau d'Ondine (Légendaire)
Commence avec Karim, condition : période ≥ 3.

1. Écouter Karim, à la maison de quartier. *(Parler à « Karim » — condition : période ≥ 3)*
2. Examiner la fresque des Coteaux. *(Examiner : Fresque des Coteaux (la ville))*
3. Convaincre le galeriste (3 objets exposés dans le hall). *(Examiner : Galerie d'art (la ville) — condition : 3 objets exposés)*
4. Rapporter l'esquisse à Karim. *(Parler à « Karim »)*

### La représentation perdue — récompense : La Lanterne d'Ondine (Mythique)
Commence avec Louison, condition : posséder affiche_1924.

1. Montrer l'affiche de 1924 à Louison. *(Parler à « Louison » — condition : posséder affiche_1924 — donne l'indice « malle_vasseur »)*
2. Interroger le pêcheur, au bord de l'Ondine. *(Parler à « Pêcheur »)*
3. Chercher le journal de l'époque (médiathèque). *(Parler à « Bibliothécaire » — donne l'indice « trappe »)*
4. Retrouver la photographie de la troupe, puis revoir Louison. *(Parler à « Louison » — condition : posséder photo_vasseur)*
5. Ouvrir la trappe du plateau, un soir de spectacle. *(Fouiller (Entrée) dans la salle, case (10, 5) — condition : un soir de spectacle)*

## Indices et secrets

| Indice | Texte | Comment l'obtenir |
|---|---|---|
| `cle_reserve` — La clé de la réserve | Fernand vous a confié la clé de la réserve, au fond des coulisses (porte du bas). | Enquête « Les archives oubliées » |
| `troupe_vasseur` — La troupe Vasseur | L'affiche de 1924 nomme la troupe Vasseur. Louison porte le même nom… | En trouvant « Affiche de la création de 1924 » |
| `malle_vasseur` — La malle à double fond | Louison : la troupe Vasseur cachait ses photos dans une malle à double fond, dans la réserve. | Enquête « La représentation perdue » |
| `trappe` — La trappe | En 1924, la lanterne a été descendue par la trappe, sous la scène, pendant les saluts. | Enquête « La représentation perdue » |
| `escarpins` — Les escarpins de Mlle Lys | Rémi : Mlle Lys cachait ses escarpins dans la coiffeuse du milieu, dans les coulisses. | Parler à « Rémi » (posséder gants_habilleuse) |
| `porte_muree` — La porte murée | Le programmateur du Rex : un trompe-l'œil dort derrière la porte murée de la Fabrique, à gauche de l'entrée. | Parler à « Programmateur du cinéma » (période ≥ 2) |
| `souffleur` — Le trou du souffleur | Hélène : le trou du souffleur, au milieu de l'avant-scène, a été recouvert en 1987… avec tout dedans. | Parler à « Helene » (posséder programme_1987) |
| `brigadier` — Le brigadier | Carnet du souffleur : le brigadier est accroché derrière la porte du plateau, côté coulisses. | En trouvant « Carnet du souffleur » |
| `lettre_1` — L'énigme du poète (1) | Socle de la statue du poète : « Ma dernière lettre dort où chante l'eau de la place. » | Examiner : Statue du poète Anselme Brévalois (la ville) |
| `lettre_2` — L'énigme du poète (2) | Margelle de la fontaine : « …puis va saluer Ondine, au cœur du parc. » | Examiner : Fontaine d'Ondine (la ville) (indice(s) lettre_1) |

## Indices progressifs

1. Toujours visible : le mode d'obtention (exploration, rencontre, secret…).
2. La région ou le type de lieu : dès 2 objets de la même famille, ou 10 objets en tout.
3. L'indication précise : Fernand, l'ancien régisseur (près du Café des Artistes), en donne une par période de jeu, en commençant par l'objet le moins rare de la famille choisie ; à partir de 40 objets, tous les indices précis sont visibles, pour ne jamais rester bloqué en fin de collection.

## Récompenses

| Palier | Récompense | Type |
|---|---|---|
| 5 objets | Écharpe rouge | tenue |
| 10 objets | Guirlande de lanternes dans le hall | décor du hall |
| 20 objets | Tenue de festival | tenue |
| 25 objets | Collectionneur·se de la Lanterne | distinction |
| famille « archives » complète | Gilet d'archiviste | tenue |
| famille « costumes » complète | Costume de gala | tenue |
| famille « decors » complète | Béret d'artiste | tenue |
| famille « technique » complète | Tenue de régie | tenue |
| famille « legendes » complète | Habit de la Lanterne | tenue |
| 50 objets | Gardien·ne de la Lanterne | distinction |

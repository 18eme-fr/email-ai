# RIDEAU ! — Document de game design

*À vous de diriger le spectacle.* — Jeu de gestion et de stratégie légère, en pixel art 2D.

## 1. Intention

Faire comprendre, **par l'expérience et les conséquences**, comment fonctionne un petit lieu de
spectacle vivant subventionné en France : budget, billetterie, programmation, médiation, relations
avec la collectivité. Le joueur doit pouvoir réussir, échouer, recommencer et comparer des
stratégies. L'apprentissage passe par les décisions, les bilans expliqués et un glossaire
facultatif (« Carnet du directeur »), jamais par un questionnaire.

## 2. Le cadre (fictif)

Le **Théâtre de la Lanterne**, 220 places (et un foyer de 80 places), à **Bréval-sur-Ondine**.
Trésorerie fragile (20 000 €), public peu diversifié, matériel vieillissant, équipe réduite.
Une **convention** lie le théâtre à la Ville : elle verse une subvention de fonctionnement en trois
tranches, la dernière dépendant du bilan de fin de saison.

## 3. Boucle de jeu

Une saison = **8 périodes** (rentrée, novembre, décembre, janvier, février, mars, avril, mai-juin),
soit environ cinq semaines chacune. Chaque période :

1. **Situation** — trésorerie, échéancier (à recevoir / à payer), bilan précédent, remarques de
   l'équipe, objectifs de la convention.
2. **Programmation** — cinq propositions reçues (au moins une populaire, une exigeante, une petite
   forme). Jusqu'à **3 créneaux, dont 2 en grande salle**. Pour chaque proposition, une fiche :
   contrat, jauge, public ciblé, intérêt artistique, risque, technique, tarif (solidaire / normal /
   élevé) et **estimation en fourchette** de la fréquentation et de la marge.
3. **Gestion** — **2 actions** (3 si l'équipe est en grande forme) parmi : communication, médiation,
   accueil, formation, entretien, partenariats.
4. **Événement** — un personnage vient avec un imprévu ou une opportunité (19 événements, dont des
   paris dont la probabilité dépend de l'état du théâtre). Chaque choix a des effets réels et
   différents.
5. **Résolution** — rideau, public, applaudissements : le moteur calcule billetterie, coûts,
   qualité, incidents, règlements et évolution des indicateurs.
6. **Bilan** — résultat vs variation de trésorerie, détail des produits/charges et des
   encaissements/décaissements, fréquentation par spectacle comparée à l'estimation,
   indicateurs avec leurs causes, et une liste « Pourquoi ces résultats ? ».

## 3 bis. Le monde explorable (depuis la version 0.10)

Le joueur incarne la direction du théâtre et **se déplace à pied**, en vue de dessus, dans cinq
lieux : la **place de la Lanterne** (mairie, café des artistes, imprimerie, colonne Morris,
fontaine), le **hall** (billetterie, bar du foyer), la **grande salle**, les **coulisses** et le
**bureau de la direction**. Le temps reste **au tour par tour** : se promener ne coûte rien, la
période avance seulement quand on signe au bureau. Les règles de gestion sont exactement celles du
tableau de bord ; le monde change seulement la façon d'y accéder.

| Étape | Dans le monde |
|---|---|
| Situation, programmation | Au **bureau** : le cahier de la période s'ouvre dans une fenêtre. |
| Gestion | On décide chaque action **auprès de la personne ou du lieu concerné** : Inès (médiation), Bastien (entretien), Hélène (formation), M. Pommier devant la mairie (partenariats), l'imprimerie (communication), la billetterie (accueil). Puis on signe la feuille de route au bureau. |
| Événement | Le personnage concerné **vient trouver le joueur**, un « ! » au-dessus de la tête. |
| Soirée | Le joueur assiste à la représentation **dans la salle** : public assis selon le remplissage réel, comédiens, projecteurs. |
| Bilan | Dans la fenêtre, à la nuit tombée ; le lendemain matin, retour au bureau. |

**Repères** : une **flèche dorée** montre toujours la prochaine étape (ou la porte qui y mène),
« ! » signale une décision possible, une coche une action déjà prévue, un marteau une rénovation
possible. Un bandeau résume l'objectif.

**Environnements qui changent** : quatre saisons (feuilles mortes, neige, fleurs, été), guirlandes
des fêtes en décembre, nuit les soirs de spectacle, affiches de la programmation sur la façade, la
colonne Morris et les murs du hall, spectateurs plus nombreux dans le hall quand la fidélité monte.

**Personnages vivants** : ils se promènent, et leurs répliques (`data/world/barks.json`) dépendent
de l'état du théâtre (matériel usé, trésorerie basse, publics fidèles, rénovations faites…).

**La ville de Bréval-sur-Ondine (depuis la version 0.12)** : en sortant du théâtre, on découvre
toute la ville, découpée en quartiers qui racontent un territoire culturel : gare et friche
culturelle au nord, rivière et parc à l'ouest, centre-ville et place de la Lanterne, quartier des
Arts (cinéma Art et Essai, conservatoire, commerces culturels), boulevard Louise-Michel
(médiathèque, école, siège du mécène Ondine Énergie) et quartier populaire des Coteaux au sud
(collège, maison de quartier, résidences). Les habitants et les lieux parlent des **publics
éloignés, de l'éducation artistique, du mécénat, des droits culturels, de la mobilité** : la
ville sert de « terrain » au cours. Un bus relie les quartiers ; le plan (touche M) aide à s'y
retrouver. Explorer reste facultatif : aucune décision de gestion n'y est cachée hors des lieux
déjà connus (place, théâtre).

**La collection de la Lanterne (depuis la version 0.14)** : 50 objets d'histoire du spectacle,
en cinq familles de dix (archives, costumes et accessoires, décors et scénographie, trésors
techniques, légendes du spectacle vivant), gardés d'une partie à l'autre. C'est une mécanique
secondaire : elle récompense l'exploration et la curiosité sans jamais toucher à la gestion.

- **Raretés** : 20 communs (trouvés tôt en se promenant), 15 peu communs, 10 rares (secrets,
  enquêtes, grands moments de la saison), 4 légendaires et 1 mythique, la Lanterne d'Ondine.
- **Modes d'obtention** : exploration (objets posés au sol, lieux à examiner, dont une réserve
  fermée à clé sous les coulisses), missions (7 missions de gestion existantes, chacune avec une
  alternative, et 5 enquêtes sans échéance), rencontres, énigmes et secrets (indices à recouper),
  rénovations du théâtre, événements et décisions.
- **Mystère** : les cachettes ne livrent rien sans l'indice qui y mène (une description d'objet,
  une confidence, une inscription). La quête mythique part d'une affiche de 1924, passe par trois
  témoignages et une photographie, et se termine en ouvrant la trappe du plateau… un soir de spectacle.
- **Indices progressifs** dans la fenêtre de collection ; Fernand, l'ancien régisseur, donne une
  indication précise par période.
- **Exposition** : six places dans les vitrines du hall ; l'esquisse du rideau d'origine demande
  d'exposer au moins trois objets.
- **Récompenses décoratives** : tenues (5 objets, 20 objets, chaque famille complète), guirlande
  de lanternes dans le hall (10), distinctions (25 et 50).
- Rien ne se perd : la collection est permanente, les enquêtes n'ont pas d'échéance, et les objets
  liés à une mission ou à un événement ont une seconde voie (dossier d'entraînement, indicateur).

Registre complet : `docs/COLLECTION.md`.

**Prologue et ambiance (depuis la version 0.15)** : la première partie s'ouvre sur l'histoire de
la Lanterne (neuf tableaux), qui pose l'enjeu de la saison et sème le mystère de la lanterne
disparue que la collection permet d'élucider. Dans le monde, le son et la lumière suivent l'étape
du tour (matin, journée, fin de journée, nuit), la saison et une météo tirée par période ; chaque
lieu a son ambiance. Rien de tout cela ne change la gestion.

### Rénovations (investissements)

Cinq travaux, une fois chacun, à décider sur place avant l'événement de la période : projecteurs
LED (salle), foyer-bar (hall), accessibilité (hall), enseigne lumineuse (place), loges et atelier
(coulisses). **Le prix sort de la trésorerie** à l'achat (ou à 30 jours) ; **le résultat ne
supporte que l'amortissement** (prix ÷ durée d'utilisation, une saison comptant pour une année).
Chaque rénovation a un effet immédiat, un effet à chaque période et parfois une petite recette
(marge du bar, économies d'électricité). Elle change aussi le décor. C'est un arbitrage : la
simulation montre qu'une stratégie qui rénove tout gagne un peu en indicateurs mais garde moins
de trésorerie (convention renouvelée 90 % du temps contre 99 % sans rénovation).

## 3 ter. Une saison de jeu : scénarios, missions, dossiers, progression (depuis la version 0.11)

Le jeu vise un public de formation (master en management de la culture) : il doit rester un vrai
jeu (buts, défis, imprévus, progression) tout en faisant travailler des compétences
professionnelles. Cinq briques s'enchaînent :

1. **Scénario (étude de cas)** choisi au lancement : situation de départ, problématique,
   engagements propres de la convention, missions disponibles, questions de débriefing.
   Quatre scénarios : première saison (découverte), redressement, territoire (intermédiaires),
   création (expert).
2. **Missions** confiées par les personnages (bulle « ? ») : objectif chiffré, échéance,
   récompense (indicateurs, argent, expérience), pénalité en cas d'échec, « à retenir ». Trois
   missions au plus en même temps. Seize missions, dont des missions « dossier ».
3. **Dossiers** : défis courts générés à partir de la partie et corrigés avec explications
   (budget prévisionnel, seuil de rentabilité, cession ou coréalisation, résultat ou trésorerie,
   mécénat). Réussir un dossier fait progresser une compétence ; entraînement libre possible.
4. **Compétences** de la direction (cinq, trois niveaux) : chaque niveau débloque un avantage
   (découvert autorisé, propositions supplémentaires, actions moins chères, incidents plus rares,
   indicateurs qui progressent seuls).
5. **Trophées** (douze) et **rapport de saison** téléchargeable, pensé pour être remis à
   l'enseignant·e (voir `docs/GUIDE_ENSEIGNANT.md`).

Boucle : chaque période apporte des propositions de missions ; on les accepte en parlant aux
personnes ; les décisions de gestion (programmation, actions, événement) font avancer les
objectifs ; en fin de période les missions réussissent ou échouent ; au début de la suivante, la
personne concernée commente le résultat et rappelle ce qu'il faut retenir.

## 4. Indicateurs

Visibles en permanence : **Trésorerie**, **Publics** (fidélité, total des entrées), **Rayonnement**.
État du théâtre : réputation artistique, fidélité, diversité des publics, relations partenaires,
équipe, équipements, communication. Détails : `docs/ECONOMIC_MODEL.md`.

## 5. Tensions et arbitrages voulus

- **Salle pleine ≠ rentable** : le cirque contemporain remplit mais coûte cher ; le tarif solidaire
  remplit et rapporte moins.
- **Exigence artistique vs caisse** : la création de l'artiste associé·e fait rayonner mais coûte
  plusieurs milliers d'euros ; la comédie de boulevard paie les factures mais ne compte pas pour la
  convention.
- **Missions de service public** : la Ville attend des actions d'éducation artistique et des œuvres
  exigeantes, qui ne rapportent pas de billetterie.
- **Temps de l'argent** : aides et mécénat arrivent plus tard ; TVA, droits d'auteur et certaines
  factures partent plus tard. Le budget prévisionnel et l'échéancier deviennent indispensables.
- **Petite équipe** : chaque spectacle fatigue l'équipe ; une équipe épuisée dégrade la qualité.
- **Entretien** : le reporter économise, mais augmente le risque d'incident et interdit les
  spectacles très techniques.
- **Lassitude du public** : programmer trois fois le même genre fait baisser la demande.

## 6. Stratégies viables (vérifiées par simulation, voir `docs/BALANCE_REPORT.md`)

| Stratégie | Idée | Résultat typique (Standard) |
|---|---|---|
| Équilibrée | Un spectacle populaire, une œuvre exigeante, une petite forme, médiation + communication | Convention renouvelée ~100 % ; fins « Une scène qui compte » / « La maison de tous les publics » |
| Artistique | Œuvres exigeantes, communication, formation | ~75 % ; fin « Le laboratoire » |
| Publics | Familles, jeune public, tarif solidaire, médiation, accueil | ~78 % ; plus risquée financièrement |
| Prudente | Seulement ce qui rapporte | 0 % : comptes sains mais missions non tenues (« Caisse pleine, convention vide ») |
| Passive / aléatoire | — | Échec (passive) ou résultats très dispersés |

## 7. Fins

Rideau baissé (faillite) · Une scène qui compte · Le laboratoire · La maison de tous les publics ·
Le théâtre populaire · Le juste équilibre · Caisse pleine, convention vide · Une saison en
demi-teinte · Belle saison, comptes dans le rouge. L'écran de fin présente objectifs, chiffres,
courbes, décisions marquantes et enseignements, et propose de **rejouer la même graine**.

## 8. Personnages

| Personnage | Rôle | Domaine |
|---|---|---|
| Hélène Marchal | Administratrice | Trésorerie, contrats, aides, mécénat — pince-sans-rire |
| Bastien Koné | Régisseur général | Technique, équipe, sécurité — pragmatique |
| Inès Belkacem | Relations avec les publics | Médiation, partenariats, diversité — enthousiaste |
| Gérard Pommier | Adjoint à la culture | Bilans, convention, conformité — diplomate |
| Louison Vasseur | Artiste associé·e | Création, résidence, exigence — exalté·e |

## 9. Difficultés

Découverte (+20 % de trésorerie, publics plus prévisibles) · Standard · Exigeant (trésorerie et
subvention réduites, publics plus capricieux). Graine facultative pour rejouer une saison.

## 10. Accessibilité et confort

Monde explorable : flèches ou ZQSD (touches physiques W A S D, donc aussi en QWERTY) pour
marcher, Entrée / Espace / E pour parler ou utiliser, clic pour aller quelque part ou parler à
quelqu'un, Échap pour le menu. Option « vue tableau de bord » pour jouer sans se déplacer.
Tableau de bord : souris et clavier (Entrée = étape suivante, Échap = pause / fermer, F1 = carnet, Tab = navigation),
infobulles, volumes séparés, option « réduire les animations » (pas de fondus, de rideau animé ni de
machine à écrire), police très lisible (Atkinson Hyperlegible), plein écran.

## 11. Hors périmètre de cette version

Pas de monde ouvert au-delà de la place, pas de temps réel, pas de saisons multiples enchaînées,
pas de recrutement. Voir `ROADMAP.md`.

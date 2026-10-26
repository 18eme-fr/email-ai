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

### Rénovations (investissements)

Cinq travaux, une fois chacun, à décider sur place avant l'événement de la période : projecteurs
LED (salle), foyer-bar (hall), accessibilité (hall), enseigne lumineuse (place), loges et atelier
(coulisses). **Le prix sort de la trésorerie** à l'achat (ou à 30 jours) ; **le résultat ne
supporte que l'amortissement** (prix ÷ durée d'utilisation, une saison comptant pour une année).
Chaque rénovation a un effet immédiat, un effet à chaque période et parfois une petite recette
(marge du bar, économies d'électricité). Elle change aussi le décor. C'est un arbitrage : la
simulation montre qu'une stratégie qui rénove tout gagne un peu en indicateurs mais garde moins
de trésorerie (convention renouvelée 90 % du temps contre 99 % sans rénovation).

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

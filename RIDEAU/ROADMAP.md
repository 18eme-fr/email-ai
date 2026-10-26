# Feuille de route

## Réalisé (v0.9.0)

- [x] Phase 0 — Audit de l'environnement (Godot compilé depuis les sources, outils vérifiés)
- [x] Phase 1 — Audit de l'écosystème (`PLUGINS_AUDIT.md`)
- [x] Phase 2 — Projet Godot, menus, structure, documentation et tests initialisés
- [x] Phase 3 — Boucle jouable minimale
- [x] Phase 4 — Tranche verticale : direction artistique, dialogues, sons, pédagogie, sauvegarde
- [x] Phase 5 — Version complète 8 périodes, 20 spectacles, 19 événements, 9 fins, 3 difficultés
- [x] Phase 6 — Tests (87), simulation d'équilibrage, correctifs, deux revues de code
- [x] Phase 7 — Livraison : projet exécutable ; exports Linux (vérifié), Web (vérifié dans Chromium),
  Windows (produit, non lancé) ; export macOS à faire depuis un Mac

## Réalisé (v0.10.0)

- [x] Monde explorable (place + 4 lieux), déplacements clavier/souris, dialogues sur place
- [x] Saisons, fêtes, nuit, affiches, foule ; personnages qui se promènent et réagissent
- [x] Rénovations du théâtre (investissement / amortissement)
- [x] Soirées de représentation dans la salle ; interface façon jeu de rôle

## Prochaines étapes proposées

1. **Tests de jeu humains** : faire jouer 5 à 10 personnes (dont des non-initiés) et noter où elles
   bloquent ; ajuster les textes d'aide et l'équilibre (`data/balancing/balance.json`).
2. **Export macOS signé** depuis le Mac (modèles officiels 4.7.2), et vérification sur Windows réel.
3. **Mise en page responsive** : vérifier en jeu les rapports 16:10 et 4:3 (la mise à l'échelle est
   prévue, mais seule la résolution de référence est testée automatiquement).
4. **Lecteur d'écran** : Godot 4.7 propose une API d'accessibilité ; nommer tous les contrôles
   dessinés (vue du théâtre, graphiques).
5. **Contenu** : 10 spectacles et 10 événements de plus, conséquences sur plusieurs périodes
   (ex. une création qui part en tournée), relations individuelles avec les compagnies.

## Reporté (hors périmètre de la première version)

- Saisons enchaînées et progression pluriannuelle (convention de 3 ans, labels).
- Recrutement et gestion fine du personnel (intermittents, plannings).
- Plusieurs lieux, tournées, coproductions entre théâtres.
- Mécénat calculé avec l'avantage fiscal du mécène ; TVA déductible.
- Traduction (Dialogue Manager sait exporter les textes pour la traduction).
- Serveur MCP Godot dans le flux de travail (retenu : shin2344234/godot-mcp, à installer sur le Mac).

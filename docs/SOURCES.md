# Sources & API à connecter

L'application fonctionne dès l'installation avec un **catalogue de démonstration** et
des **entrées manuelles** (formulaire, import CSV, ajout de sources). Pour l'alimenter
automatiquement, voici les sources à brancher. **Toujours** privilégier une API
officielle ou un flux RSS ; à défaut, une page publique autorisant l'indexation ;
respecter `robots.txt` et les CGU (voir `LIMITES.md`).

## Offres d'emploi / stages / volontariats (spectacle vivant)

| Source | Type | Notes |
|---|---|---|
| Profil Culture | Site (partenariat/API à demander) | Offres emploi/stage culture FR |
| France Travail (ex-Pôle emploi) | **API officielle** (Offres d'emploi v2) | OAuth ; filtrer par ROME du spectacle |
| Service Civique | Site public / flux | Missions culture |
| CIVIWEB (VIE/VIA) | Site public | Volontariat international |
| Corps européen de solidarité | Portail européen (youth.europa.eu) | Volontariats UE |
| Erasmus+ | Portail officiel | Mobilités/stages |
| Réseaux pro (Pearle*, IETM, Live DMA…) | Newsletters / sites | Réseaux européens du spectacle vivant |
| Sites des structures (SMAC, scènes nationales, opéras…) | Pages « recrutement » / RSS | Au cas par cas |

> **LinkedIn** : ne pas scraper. Utiliser uniquement le partage manuel de liens publics.

## Formations / MOOC

| Source | Type | Notes |
|---|---|---|
| FUN-MOOC | Catalogue / flux | MOOC gratuits (gestion, projet, compta asso) |
| CNAM | Site officiel | Modules gestion / droit |
| Coursera / OpenClassrooms | API partenaire | Finance, management |
| CNM (ex-IRMA) | Guides / ressources | Droit et aides du spectacle vivant musical |
| Ministère de la Culture / DRAC | Guides institutionnels | Politiques culturelles |
| Opale / CRDLA Culture | Outils / modèles | Gestion associative culturelle |

L'automatisation **vérification des liens** (`/api/cron?links=1`) marque « à vérifier »
les liens injoignables afin de ne pas proposer de liens morts.

## Salles de spectacle (étude de portfolio)

| Source | Type | Notes |
|---|---|---|
| Sites officiels des salles | Pages publiques | Statut, gouvernance, programmation |
| data.gouv.fr / open data culturel | **Données ouvertes** | Labels, équipements |
| Registres associatifs / JO Associations | Public | Statut juridique |
| Rapports d'activité publiés | PDF publics | Budget, financements |

> L'étude de salle indique **toujours la source** de chaque information.

## Comment brancher une source

1. **Paramètres → Sources** : déclarer la source (site/RSS/API).
2. Implémenter un *connecteur* côté serveur qui normalise vers le modèle `Opportunity`
   (mêmes champs que l'import CSV / le formulaire manuel).
3. Le rattacher au cron (`runUserAutomations` / une file d'ingestion) avec dé-duplication
   (clé : `structureName` + `missionTitle` + `officialLink`) et suppression des offres expirées.

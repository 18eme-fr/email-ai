import { isMunicipalYear, isPresidentialYear } from '../../engine/politics';
import type { NarrativeEvent } from '../../engine/narrative-types';
import { getJob } from '../jobs';
import { municipalLists, p, pickJob, studySuccess } from './helpers';

/** Jalons et événements de la vie adulte : engagement, vie affective, travail, argent. */

const working = ['emploi', 'independant'] as const;

export const ADULT_EVENTS: NarrativeEvent[] = [
  {
    id: 'apres_master',
    kind: 'jalon',
    domain: 'ecole',
    status: 'fictif',
    conditions: { minEducation: 'bac5', notFlags: ['doctorat', 'choix_doctorat', 'prepa'], jobStatus: ['inactif'], when: (run) => run.employment.jobs.length === 0 && run.flags.diplome_medecine === undefined },
    title: 'Une proposition de thèse',
    text: 'Une enseignante vous propose un sujet de thèse, financé trois ans. Le salaire est modeste, la question passionnante.',
    effects: { setFlags: ['choix_doctorat'] },
    choices: [
      { id: 'these', label: 'Se lancer dans un doctorat', effects: { education: { status: 'superieur', field: 'doctorat' }, job: { status: 'etudiant' }, setFlags: ['doctorant'] }, resolve: ({ run }) => ({ education: { expectedEndAge: run.age + 3 } }) },
      { id: 'non', label: 'Décliner et chercher un emploi', effects: { wellbeing: 0 } },
    ],
  },
  {
    id: 'engagement_citoyen',
    kind: 'jalon',
    domain: 'citoyennete',
    status: 'fictif',
    conditions: { minAge: 22, maxAge: 40, notFlags: ['association'], when: (run) => run.age >= 22 + ((run.seed >>> 3) % 9) },
    memorable: true,
    title: 'Une affiche à la boulangerie',
    text: ({ place }) => `À ${place}, une association cherche des bénévoles : aide aux devoirs, épicerie solidaire, entretien d'un jardin partagé. La réunion d'information a lieu jeudi, 19 h.`,
    choices: [
      { id: 'association', label: 'Y aller et s\'engager dans l\'association', effects: { setFlags: ['association', 'benevole'], membership: 'Association de quartier', engagement: 15, social: 8, wellbeing: 4, addPerson: [{ key: 'militant', kind: 'militant', closeness: 55, ageOffset: 12, note: 'responsable associatif' }] } },
      { id: 'syndicat', label: 'S\'engager plutôt dans un syndicat au travail', available: (run) => run.employment.status === 'emploi', effects: { setFlags: ['syndicat'], membership: 'Syndicat (fictif) de votre entreprise', engagement: 14, social: 5 } },
      { id: 'parti', label: 'Rejoindre la section locale d\'un parti', hint: 'Le jeu ne vous fait pas choisir un parti réel : l\'organisation est fictive.', effects: { setFlags: ['parti_local'], membership: 'Section locale d\'un parti (fictif)', engagement: 18, social: 3, wellbeing: -1 } },
      { id: 'non', label: 'Pas le temps, ou pas l\'envie', effects: { wellbeing: 1, outcome: 'D\'autres engagements remplissent la vie : la famille, le travail, les amis.' } },
    ],
  },
  {
    id: 'election_municipale',
    kind: 'jalon',
    domain: 'citoyennete',
    status: 'prospectif',
    conditions: { minAge: 18, when: (run) => isMunicipalYear(run.year) },
    maxOccurrences: 20,
    cooldown: 5,
    sourceIds: ['calendrier-electoral', 'code-electoral-eligibilite-municipale', 'constitution-droit-de-vote'],
    title: ({ run }) => `Élections municipales de ${run.year} (scénario hypothétique)`,
    text: ({ run, place }) => {
      const lists = municipalLists(run);
      const desc = lists.map((l) => `${l.name} veut ${l.priorities.join(' et ')}`).join(' ; ');
      return `À ${place}, ${lists.length} listes fictives se présentent. ${desc}. Le conseil municipal décide de l'école, de la voirie, des équipements, pas du Smic ni des impôts nationaux.`;
    },
    choices: [
      { id: 'vote', label: 'Aller voter pour la liste qui convainc le plus', effects: { vote: 'vote', engagement: 2 } },
      { id: 'blanc', label: 'Voter blanc', effects: { vote: 'blanc', engagement: 1, outcome: 'Aucune liste ne vous ressemble assez. Le bulletin blanc est compté, mais pas comme un suffrage exprimé.' } },
      { id: 'abstention', label: 'Ne pas aller voter', effects: { vote: 'abstention' } },
      {
        id: 'candidat',
        label: ({ g }) => `Être ${g('candidat', 'candidate')} sur une liste`,
        hint: 'Il faut avoir 18 ans au jour du scrutin. Les chances d\'élection dépendent de la liste et du mode de scrutin.',
        available: (run) => run.age >= 18 && (run.flags.association !== undefined || run.flags.parti_local !== undefined || run.civic.engagement >= 55) && run.flags.elu_en_cours === undefined,
        resolve: ({ run }, rng) =>
          // Probabilité RÈGLE DE DÉMONSTRATION : ni un effet de campagne mesuré, ni lié à une orientation politique.
          rng.chance(p(0.3 + run.civic.engagement * 0.004 + run.social * 0.002))
            ? { vote: 'vote', setFlags: ['elu_municipal', 'elu_en_cours'], mandate: { label: run.citizen.sex === 'F' ? 'Conseillère municipale' : 'Conseiller municipal', years: 6 }, engagement: 10, wellbeing: 6, schedule: [{ eventId: 'mandat_budget', inYears: 2 }, { eventId: 'fin_mandat', inYears: 6 }], outcome: 'La liste l\'emporte et vous entrez au conseil municipal.' }
            : { vote: 'vote', engagement: 6, wellbeing: -3, outcome: 'La liste perd. Il reste les soirées de tractage, et des liens solides avec les colistiers.' },
      },
    ],
  },
  {
    id: 'mandat_budget',
    kind: 'programme',
    domain: 'citoyennete',
    status: 'prospectif',
    conditions: { flags: ['elu_en_cours'] },
    memorable: true,
    title: 'Le budget de la commune',
    text: 'En commission des finances, il faut trancher : l\'enveloppe ne suffit pas pour tout. Rénover l\'école, réparer la voirie, ou ne pas augmenter la taxe foncière. Chaque option a ses défenseurs, et de bons arguments.',
    choices: [
      { id: 'ecole', label: 'Défendre la rénovation de l\'école', effects: { engagement: 4, social: 3, wellbeing: 2, outcome: 'Le projet passe, avec un emprunt. Une partie du conseil vote contre.' } },
      { id: 'voirie', label: 'Prioriser la voirie et les déplacements', effects: { engagement: 4, social: 2, outcome: 'Les travaux commencent. Les parents d\'élèves, eux, sont déçus.' } },
      { id: 'impots', label: 'Plaider pour stabiliser les impôts locaux', effects: { engagement: 3, social: 1, outcome: 'Les dépenses sont reportées. Certains habitants vous remercient, d\'autres vous interpellent.' } },
    ],
  },
  {
    id: 'fin_mandat',
    kind: 'programme',
    domain: 'citoyennete',
    status: 'prospectif',
    conditions: { flags: ['elu_en_cours'] },
    title: 'Fin de mandat',
    text: 'Six ans de conseils, de permanences, de soirées prises sur la famille. Le mandat s\'achève.',
    effects: { clearFlags: ['elu_en_cours'] },
    choices: [
      { id: 'continuer', label: 'Se représenter aux prochaines élections', effects: { engagement: 5 } },
      { id: 'arreter', label: 'Passer le relais', effects: { engagement: -10, wellbeing: 5, outcome: 'Le soir, enfin, le téléphone sonne moins.' } },
    ],
  },
  {
    id: 'election_presidentielle',
    kind: 'jalon',
    domain: 'citoyennete',
    status: 'prospectif',
    conditions: { minAge: 18, when: (run) => isPresidentialYear(run.year) },
    maxOccurrences: 20,
    cooldown: 4,
    sourceIds: ['calendrier-electoral', 'constitution-droit-de-vote'],
    title: ({ run }) => `Élection présidentielle de ${run.year} (scénario hypothétique)`,
    text: 'Les débats envahissent les écrans. Les candidats de ce futur sont fictifs ; leurs priorités opposent pouvoir d\'achat, climat, sécurité, services publics, Europe. Au second tour, il ne reste que deux noms.',
    choices: [
      { id: 'vote', label: 'Voter', effects: { vote: 'vote', engagement: 2 } },
      { id: 'blanc', label: 'Voter blanc', effects: { vote: 'blanc' } },
      { id: 'abstention', label: 'S\'abstenir', effects: { vote: 'abstention' } },
    ],
  },
  {
    id: 'consultation_locale',
    kind: 'jalon',
    domain: 'territoire',
    status: 'prospectif',
    conditions: { minAge: 24, maxAge: 45, when: (run) => run.age >= 24 + ((run.seed >>> 5) % 12) },
    memorable: true,
    title: ({ run }) => (run.housing.territory === 'rural' || run.housing.territory === 'petite_ville' ? 'Le projet de fermeture' : 'Le projet de nouvelle ligne'),
    text: ({ run, place }) =>
      run.housing.territory === 'rural' || run.housing.territory === 'petite_ville'
        ? `Scénario hypothétique : l'agence régionale de santé envisage de regrouper la maternité de ${place} avec celle d'une ville plus grande. Les uns parlent de sécurité des soins et de manque de soignants, les autres de distance et de routes l'hiver. Une réunion publique est prévue.`
        : `Scénario hypothétique : la métropole projette une ligne de tramway qui passerait dans votre rue. Plus de transports, mais deux ans de travaux et des commerces inquiets. Une concertation est ouverte.`,
    choices: [
      { id: 'participer', label: 'Aller à la réunion et prendre la parole', effects: { engagement: 8, social: 3, setFlags: ['concertation'], outcome: 'Votre intervention est notée au compte rendu. La décision, elle, appartient à d\'autres échelons, et prendra du temps.' } },
      { id: 'petition', label: 'Signer la pétition en ligne', effects: { engagement: 3 } },
      { id: 'ignorer', label: 'Laisser faire : il y a d\'autres urgences', effects: { wellbeing: 0, outcome: 'La vie continue. Le projet aussi, sans vous.' } },
    ],
  },
  {
    id: 'vie_affective',
    kind: 'jalon',
    domain: 'relations',
    status: 'fictif',
    conditions: { minAge: 23, maxAge: 40, notFlags: ['couple', 'choix_affectif'], when: (run) => run.age >= 23 + ((run.seed >>> 7) % 10) },
    memorable: true,
    title: 'Une rencontre',
    text: 'Un mariage d\'amis, une table mal placée, une conversation qui dure jusqu\'à la fermeture. Quelqu\'un vous plaît vraiment.',
    effects: { setFlags: ['choix_affectif'] },
    choices: [
      { id: 'ensemble', label: 'Construire une vie commune', effects: { setFlags: ['couple'], addPerson: [{ key: 'partenaire', kind: 'partenaire', closeness: 82, ageOffset: 1 }], wellbeing: 8, social: 4 } },
      { id: 'independance', label: 'Se voir, mais chacun chez soi', effects: { addPerson: [{ key: 'partenaire', kind: 'partenaire', closeness: 65, ageOffset: -1 }], wellbeing: 5, setFlags: ['couple'], outcome: 'Deux appartements, deux brosses à dents, une histoire.' } },
      { id: 'seul', label: ({ g }) => `Rester ${g('seul, et heureux', 'seule, et heureuse')} de l'être`, effects: { wellbeing: 2, social: 2, outcome: 'Une vie sans couple n\'est pas une vie en attente. Les amis, le travail, les passions occupent la place.' } },
    ],
  },
  {
    id: 'parentalite',
    kind: 'jalon',
    domain: 'famille',
    status: 'fictif',
    sourceIds: ['insee-fecondite-2025'],
    conditions: { minAge: 26, maxAge: 44, flags: ['couple'], notFlags: ['choix_parentalite'] },
    memorable: true,
    title: 'Un enfant ?',
    text: ({ name }) => `Un dimanche soir, ${name('partenaire', 'votre partenaire')} pose la question à voix haute. Le logement, l'argent, le travail, l'envie : tout se mélange.`,
    maxOccurrences: 3,
    cooldown: 3,
    effects: { setFlags: ['choix_parentalite'] },
    choices: [
      {
        id: 'oui',
        label: 'Avoir un enfant',
        resolve: ({ run }) => ({
          setFlags: ['parent'],
          addPerson: [{ key: 'enfant1', kind: 'enfant', closeness: 90, ageOffset: -run.age }],
          wellbeing: 6,
          savings: -2000,
          physical: -2,
          schedule: [{ eventId: 'deuxieme_enfant', inYears: 3 }],
          outcome: 'Une naissance, des nuits trop courtes, un amour très simple.',
        }),
      },
      { id: 'plus_tard', label: 'Attendre encore', effects: { clearFlags: ['choix_parentalite'] } },
      { id: 'non', label: 'Choisir de ne pas avoir d\'enfant', effects: { wellbeing: 2, outcome: 'La décision est mûrie, et assumée à deux.' } },
    ],
  },
  {
    id: 'deuxieme_enfant',
    kind: 'programme',
    domain: 'famille',
    status: 'fictif',
    conditions: { flags: ['couple', 'parent'], maxAge: 46 },
    title: 'Agrandir la famille ?',
    text: ({ name }) => `${name('enfant1', 'Votre enfant')} réclame un petit frère ou une petite sœur, avec la diplomatie de son âge.`,
    choices: [
      { id: 'oui', label: 'Un deuxième enfant', resolve: ({ run }) => ({ addPerson: [{ key: 'enfant2', kind: 'enfant', closeness: 88, ageOffset: -run.age }], wellbeing: 4, savings: -2000, outcome: 'La famille compte une personne de plus, et beaucoup plus de bruit.' }) },
      { id: 'non', label: 'Rester ainsi', effects: { wellbeing: 2 } },
    ],
  },
  {
    id: 'achat_logement',
    kind: 'jalon',
    domain: 'logement',
    status: 'fictif',
    conditions: { minAge: 28, maxAge: 55, notFlags: ['proprietaire', 'choix_achat'], jobStatus: [...working], when: (run) => run.finances.savings >= 12000 && !run.housing.withParents },
    title: 'Acheter ?',
    text: ({ run }) =>
      `Avec ${Math.round(run.finances.savings / 1000)} 000 € d'économies (estimation de jeu), la banque accepte d'étudier un prêt sur vingt-cinq ans. ${run.housing.territory === 'metropole' ? 'En ville, cela signifie un petit appartement, ou partir en périphérie.' : 'Une maison avec un bout de jardin devient envisageable.'}`,
    effects: { setFlags: ['choix_achat'] },
    choices: [
      { id: 'acheter', label: 'Acheter', resolve: ({ run }) => ({ housing: { tenure: 'proprietaire', withParents: false }, setFlags: ['proprietaire'], savings: -Math.min(run.finances.savings, 25000), wellbeing: 5, outcome: 'Les clés pèsent leur poids de crédit. Mais c\'est chez soi.' }) },
      { id: 'louer', label: 'Rester locataire et garder sa liberté', effects: { wellbeing: 1, outcome: 'Pouvoir partir facilement a aussi de la valeur.' } },
    ],
  },
  {
    id: 'difficultes_budget',
    kind: 'aleatoire',
    domain: 'argent',
    status: 'fictif',
    weight: (run) => (run.flags.fins_de_mois_difficiles !== undefined ? 6 : 0),
    cooldown: 6,
    maxOccurrences: 4,
    conditions: { minAge: 18, flags: ['fins_de_mois_difficiles'] },
    title: 'Les fins de mois',
    text: 'Le compte passe dans le rouge le 20 du mois. Les factures s\'empilent sur la table de la cuisine, on les ouvre sans les ouvrir.',
    choices: [
      { id: 'social', label: 'Prendre rendez-vous avec un travailleur social', hint: 'Les droits éventuels dépendent de conditions non simulées dans cette version.', effects: { wellbeing: 3, debt: -800, outcome: 'Un dossier, des justificatifs, et quelques droits qui n\'étaient pas demandés. Le montant indiqué est une estimation de jeu.' } },
      { id: 'famille', label: 'Demander de l\'aide à la famille', available: (run) => run.people.some((x) => x.kind === 'parent' && x.alive), resolve: ({ run }) => ({ debt: -Math.round(400 + 2500 * run.household.percentile), closeness: { parent1: -3 }, wellbeing: -1, outcome: 'L\'aide arrive, avec un peu de gêne des deux côtés.' }) },
      { id: 'heures', label: 'Accepter des heures en plus ou un second emploi', available: (run) => run.employment.status === 'emploi', effects: { debt: -1200, physical: -4, wellbeing: -3, social: -3 } },
      { id: 'reduire', label: 'Couper dans tout ce qui peut l\'être', effects: { debt: -500, wellbeing: -4, social: -3, outcome: 'Plus de sorties, plus de cinéma. On tient, mais la vie rétrécit.' } },
    ],
  },
  {
    id: 'milieu_carriere',
    kind: 'jalon',
    domain: 'travail',
    status: 'fictif',
    conditions: { minAge: 40, maxAge: 52, jobStatus: [...working], notFlags: ['bilan_carriere'], when: (run) => run.age >= 40 + ((run.seed >>> 9) % 10) },
    memorable: true,
    title: 'Mi-parcours',
    text: ({ run }) => `${run.employment.since !== undefined ? run.age - run.employment.since : 'Plusieurs'} ans comme ${run.employment.jobLabel ?? 'salarié'}. Certains matins, la question revient : est-ce que ce sera ça, jusqu'au bout ?`,
    effects: { setFlags: ['bilan_carriere'] },
    choices: [
      {
        id: 'reconversion',
        label: 'Se reconvertir (formation de deux ans)',
        hint: 'Moins de revenus pendant la formation ; un nouveau métier ensuite, peut-être.',
        resolve: ({ run }, rng) => {
          if (rng.chance(studySuccess(run, 0.7))) {
            const options: string[] = ['infirmier', 'educateur', 'technicien', 'enseignant'];
            const target = rng.pick(options);
            const flag = target === 'infirmier' ? 'diplome_infirmier' : target === 'enseignant' ? 'concours_enseignant' : undefined;
            const level = target === 'technicien' ? 'bac' : target === 'enseignant' ? 'bac5' : 'bac3';
            const job = getJob(target);
            return {
              savings: -4000,
              setFlags: ['reconversion', ...(flag ? [flag] : [])],
              education: { level, milestone: `Reconversion : ${job ? (run.citizen.sex === 'F' ? job.label.f : job.label.m) : target}` },
              job: { jobId: target },
              wellbeing: 10,
              outcome: `Deux années intenses, puis un nouveau métier : ${job ? (run.citizen.sex === 'F' ? job.label.f : job.label.m) : target}.`,
            };
          }
          return { savings: -4000, wellbeing: -6, setFlags: ['reconversion_echouee'], outcome: 'La formation n\'aboutit pas. Retour au métier d\'avant, avec un goût amer et des compétences nouvelles.' };
        },
      },
      { id: 'promotion', label: 'Viser une promotion, prendre des responsabilités', resolve: ({ run }, rng) => (rng.chance(0.5) ? { setFlags: ['promotion'], wellbeing: 2, social: -2, physical: -2, outcome: 'Promotion obtenue. Les réunions remplacent une partie du métier.' } : { wellbeing: -4, outcome: `Le poste revient à quelqu'un d'autre. ${run.citizen.firstName} encaisse.` }) },
      { id: 'temps_partiel', label: 'Réduire son temps de travail pour vivre autrement', effects: { savings: -1500, wellbeing: 8, social: 5, engagement: 3, outcome: 'Moins d\'argent, plus de temps. Le mercredi redevient un jour à soi.' } },
      { id: 'continuer', label: 'Continuer ainsi : ce travail a du sens', effects: { wellbeing: 3 } },
    ],
  },
  {
    id: 'canicule',
    kind: 'aleatoire',
    domain: 'sante',
    status: 'prospectif',
    weight: (run) => (run.age > 70 ? 2.5 : 1),
    cooldown: 12,
    maxOccurrences: 3,
    conditions: { minAge: 20, when: (run) => run.year >= 2030 },
    title: 'L\'été brûlant',
    text: ({ run, place }) =>
      `Scénario hypothétique : en ${run.year}, une longue vague de chaleur s'installe sur ${place}. Les nuits ne rafraîchissent plus. ${run.age > 70 ? 'La mairie appelle les personnes âgées inscrites sur son registre.' : 'Au travail, on décale les horaires.'}`,
    choices: [
      { id: 'voisins', label: 'Prendre des nouvelles des voisins isolés', effects: { social: 5, engagement: 3, physical: -1 } },
      { id: 'climatiser', label: 'Acheter un climatiseur', effects: { savings: -600, physical: 1 } },
      { id: 'fraicheur', label: 'Passer les après-midi dans un lieu frais (médiathèque, église, parc)', effects: { physical: 0, wellbeing: 1 } },
    ],
  },
  {
    id: 'syndicat_negociation',
    kind: 'aleatoire',
    domain: 'travail',
    status: 'fictif',
    weight: 3,
    maxOccurrences: 1,
    conditions: { flags: ['syndicat'], jobStatus: ['emploi'] },
    title: 'La négociation annuelle',
    text: 'La direction propose une augmentation jugée trop faible par les élus du personnel. Une partie des collègues veut une grève d\'une journée, d\'autres craignent pour leur prime.',
    choices: [
      { id: 'greve', label: 'Appeler à la grève', resolve: (_c, rng) => (rng.chance(0.5) ? { engagement: 6, social: 4, savings: -90, outcome: 'Le mouvement est suivi, la direction revoit sa copie en partie.' } : { engagement: 4, savings: -90, wellbeing: -3, outcome: 'Peu de grévistes : rien ne bouge cette fois.' }) },
      { id: 'negocier', label: 'Négocier encore, autour de la table', effects: { engagement: 3, outcome: 'Un compromis : une prime ponctuelle plutôt qu\'une hausse durable.' } },
      { id: 'retrait', label: 'Prendre du recul avec le syndicat', effects: { engagement: -8, leaveMembership: 'Syndicat (fictif) de votre entreprise', clearFlags: ['syndicat'] } },
    ],
  },
  {
    id: 'changement_emploi',
    kind: 'aleatoire',
    domain: 'travail',
    status: 'fictif',
    weight: 1.2,
    cooldown: 8,
    maxOccurrences: 3,
    conditions: { minAge: 25, maxAge: 58, jobStatus: ['emploi'] },
    title: 'Une offre ailleurs',
    text: 'Un ancien collègue vous parle d\'un poste dans une autre structure. Mieux payé, peut-être. Plus loin, sûrement.',
    choices: [
      { id: 'accepter', label: 'Tenter le changement', resolve: ({ run }, rng) => { const j = pickJob(run, rng, 2); return { job: { jobId: j.id }, wellbeing: 3, social: -2, outcome: `Nouveau poste : ${run.citizen.sex === 'F' ? j.label.f : j.label.m}.` }; } },
      { id: 'rester', label: 'Rester : on sait ce qu\'on a', effects: { wellbeing: 1 } },
    ],
  },
];

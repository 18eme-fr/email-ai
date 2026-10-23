import type { NarrativeEvent } from '../../engine/narrative-types';
import { SMIC_NET_2026 } from '../jobs';
import { livingPerson, personAge } from './helpers';

/**
 * Deuxième partie de vie : aidance, retraite, vieillissement, transmission.
 * Les règles de retraite futures sont inconnues : l'âge et le montant de la
 * pension sont des HYPOTHÈSES DE JEU signalées comme telles.
 */

export const AGING_EVENTS: NarrativeEvent[] = [
  {
    id: 'aidant_parent',
    kind: 'jalon',
    domain: 'famille',
    status: 'fictif',
    sensitive: true,
    conditions: {
      minAge: 40,
      maxAge: 70,
      notFlags: ['choix_aidance'],
      when: (run) => run.people.some((x) => x.kind === 'parent' && x.alive && personAge(run, x) >= 80),
    },
    memorable: true,
    title: 'Un parent qui vieillit',
    text: ({ run }) => {
      const parent = run.people.find((x) => x.kind === 'parent' && x.alive && personAge(run, x) >= 80);
      return `${parent?.name ?? 'Votre parent'} a ${parent ? personAge(run, parent) : 80} ans. Une chute dans la cuisine, sans gravité cette fois. Mais il faut maintenant quelqu'un pour les courses, les rendez-vous, les médicaments.`;
    },
    effects: { setFlags: ['choix_aidance'] },
    choices: [
      { id: 'aider', label: 'S\'en occuper soi-même, plusieurs fois par semaine', effects: { setFlags: ['aidant'], wellbeing: -6, physical: -3, social: -3, closeness: { parent1: 10, parent2: 10 }, outcome: 'Des allers-retours, des soirées au téléphone, une tendresse nouvelle. Et une fatigue que peu de gens voient.' } },
      { id: 'aide_domicile', label: 'Organiser le passage d\'une aide à domicile', hint: 'Une partie du coût peut être prise en charge selon des conditions non simulées.', effects: { savings: -2500, wellbeing: -1, closeness: { parent1: 3, parent2: 3 } } },
      { id: 'etablissement', label: 'Chercher une place en établissement', effects: { savings: -4000, wellbeing: -4, closeness: { parent1: -4, parent2: -4 }, outcome: 'Les visites du dimanche remplacent le quotidien. La culpabilité aussi, parfois, sans raison.' } },
      { id: 'fratrie', label: 'Partager la charge avec la fratrie', available: (run) => !!livingPerson(run, 'fratrie'), effects: { setFlags: ['aidant'], wellbeing: -2, closeness: { fratrie1: 5 }, outcome: 'Un tableau partagé, des tours de garde, quelques tensions et beaucoup de solidarité.' } },
    ],
  },
  {
    id: 'retraite',
    kind: 'jalon',
    domain: 'travail',
    status: 'prospectif',
    conditions: { minAge: 62, notFlags: ['retraite'], jobStatus: ['emploi', 'independant', 'chomage', 'inactif'] },
    maxOccurrences: 6,
    cooldown: 1,
    memorable: true,
    title: 'L\'âge de la retraite',
    text: ({ run }) =>
      `Nous sommes en ${run.year}. Les règles de retraite de cette époque sont inconnues : le jeu suppose qu'un départ est possible entre 62 et 67 ans, ce qui est une hypothèse. ${run.employment.status === 'chomage' ? 'Après des mois de recherche, la question se pose autrement.' : 'Les collègues commencent à demander « c\'est pour quand ? ».'}`,
    choices: [
      {
        id: 'partir',
        label: 'Partir maintenant',
        resolve: ({ run }) => {
          // Taux de remplacement HYPOTHÉTIQUE (démonstration), plancher fictif : ce n'est pas un calcul de pension.
          const ratio = run.employment.status === 'independant' ? 0.5 : 0.62;
          const base = Math.max(run.finances.monthlyIncome, SMIC_NET_2026 * 0.8);
          const pension = Math.round(Math.max(SMIC_NET_2026 * 0.75, base * ratio * (run.age >= 65 ? 1.05 : 1)));
          return { setFlags: ['retraite'], job: { status: 'retraite' }, wellbeing: 6, social: -2, outcome: `Le pot de départ a lieu un vendredi. Pension estimée par le jeu : ${pension.toLocaleString('fr-FR')} € par mois (hypothèse, pas un calcul réglementaire).`, pension };
        },
      },
      { id: 'continuer', label: 'Continuer encore un peu', available: (run) => run.age < 67 && run.employment.status !== 'chomage', effects: { wellbeing: -1, savings: 2000, outcome: 'Encore une année. Pour l\'argent, pour les collègues, ou parce qu\'on ne sait pas encore quoi faire d\'autre.' } },
    ],
  },
  {
    id: 'debut_retraite',
    kind: 'jalon',
    domain: 'vieillesse',
    status: 'fictif',
    conditions: { flags: ['retraite'], notFlags: ['projet_retraite'] },
    title: 'Le premier lundi',
    text: 'Pas de réveil. Le café refroidit tranquillement. Il va falloir inventer une nouvelle forme aux journées.',
    effects: { setFlags: ['projet_retraite'] },
    choices: [
      { id: 'benevolat', label: 'S\'engager comme bénévole', effects: { setFlags: ['benevole'], engagement: 10, social: 8, wellbeing: 5 } },
      { id: 'famille', label: 'Se rendre disponible pour la famille', effects: { social: 6, wellbeing: 4 } },
      { id: 'local', label: 'S\'impliquer dans la vie de la commune', effects: { engagement: 12, social: 5, setFlags: ['engagement_local_senior'] } },
      { id: 'soi', label: 'Prendre enfin du temps pour soi : marcher, lire, jardiner', effects: { wellbeing: 8, physical: 3 } },
    ],
  },
  {
    id: 'logement_grand_age',
    kind: 'jalon',
    domain: 'logement',
    status: 'fictif',
    conditions: { minAge: 75, notFlags: ['choix_logement_age'], when: (run) => run.health.autonomy !== 'complete' || run.age >= 82 },
    memorable: true,
    title: 'La maison devient grande',
    text: ({ run }) => `${run.housing.tenure === 'proprietaire' ? 'La maison' : 'L\'appartement'} a des escaliers que l'on ne remarquait pas avant. Les enfants, les amis ou le médecin abordent le sujet avec précaution.`,
    effects: { setFlags: ['choix_logement_age'] },
    choices: [
      { id: 'rester', label: 'Rester chez soi, avec de l\'aide', effects: { savings: -3000, wellbeing: 3, social: -2 } },
      { id: 'adapter', label: 'Adapter le logement (douche, barres d\'appui)', effects: { savings: -5000, physical: 3, wellbeing: 2 } },
      { id: 'rapprocher', label: 'Déménager près d\'un proche', available: (run) => run.people.some((x) => (x.kind === 'enfant' || x.kind === 'fratrie') && x.alive), effects: { social: 6, wellbeing: -2, outcome: 'Un déménagement à cet âge, c\'est trier une vie entière. Mais les visites deviennent quotidiennes.' } },
      { id: 'residence', label: 'Entrer en résidence pour personnes âgées', effects: { savings: -6000, social: 4, wellbeing: -3, outcome: 'Une chambre avec vue sur le parc. Des voisins de table, certains attachants.' } },
    ],
  },
  {
    id: 'transmission_souvenirs',
    kind: 'jalon',
    domain: 'vieillesse',
    status: 'fictif',
    conditions: { minAge: 78, notFlags: ['transmission_faite'], when: (run) => run.age >= 78 + ((run.seed >>> 11) % 6) },
    memorable: true,
    title: 'Ce qu\'on laisse',
    text: ({ run }) => `Une boîte de photos ressort d'un placard. ${run.residences.length > 1 ? `${run.residences.join(', ')} : tant de lieux dans une seule vie.` : `${run.residences[0]} : une vie entière au même endroit, ou presque.`}`,
    effects: { setFlags: ['transmission_faite'] },
    choices: [
      { id: 'raconter', label: 'Raconter son histoire aux plus jeunes', effects: { social: 6, wellbeing: 6 } },
      { id: 'donner', label: 'Donner une partie de ses économies de son vivant', available: (run) => run.finances.savings > 5000, resolve: ({ run }) => ({ savings: -Math.round(run.finances.savings * 0.4), wellbeing: 5, social: 3, outcome: 'Un coup de pouce pour un premier logement, des études, un projet.' }) },
      { id: 'garder', label: 'Garder ses souvenirs pour soi', effects: { wellbeing: 1 } },
    ],
  },
];

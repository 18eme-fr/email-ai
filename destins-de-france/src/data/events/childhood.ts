import type { NarrativeEvent } from '../../engine/narrative-types';
import { NEIGHBOURHOOD_LABELS, TERRITORY_LABELS, getRegion } from '../regions';
import { livingPerson, standardOfLivingText } from './helpers';

/** Jalons de la petite enfance à la fin du collège. */

const TENURE_TEXT: Record<string, string> = {
  locataire_prive: 'un appartement loué dans le parc privé',
  locataire_social: 'un logement social',
  proprietaire: 'un logement dont la famille est propriétaire (ou en train de le payer)',
  heberge: 'chez des proches qui hébergent la famille',
  precaire: 'un logement précaire, provisoire',
};

export const CHILDHOOD_EVENTS: NarrativeEvent[] = [
  {
    id: 'foyer_decouverte',
    kind: 'jalon',
    domain: 'famille',
    status: 'fictif',
    conditions: { minAge: 0, maxAge: 0 },
    sourceIds: ['insee-pauvrete-2023'],
    memorable: true,
    title: 'Le foyer',
    text: ({ run, name }) => {
      const h = run.household;
      const region = getRegion(run.citizen.regionId);
      const adults = h.parents
        .map((p) => `${name(p.personId)}, ${p.occupationLabel}`)
        .join(h.parents.length > 1 ? ' et ' : '');
      const structure =
        h.structure === 'monoparentale'
          ? `Il n'y a qu'un adulte à la maison : ${adults}.`
          : h.structure === 'recomposee'
            ? `La famille est recomposée : ${adults}.`
            : `À la maison : ${adults}.`;
      const sib = h.siblings === 0 ? 'Pas de frère ni de sœur pour l\'instant.' : h.siblings === 1 ? 'Un aîné attend déjà le bébé.' : `${h.siblings} aînés attendent déjà le bébé.`;
      return `${structure} ${sib} La famille vit à ${run.citizen.birthPlace} (${region.name}), une ${TERRITORY_LABELS[run.citizen.territory]}, dans un ${NEIGHBOURHOOD_LABELS[run.citizen.neighbourhood]}, dans ${TENURE_TEXT[h.tenure]}. Le niveau de vie du foyer est estimé à ${standardOfLivingText(run)}.`;
    },
  },
  {
    id: 'petite_enfance_garde',
    kind: 'jalon',
    domain: 'famille',
    status: 'fictif',
    conditions: { minAge: 1, maxAge: 1 },
    title: 'Qui garde le bébé ?',
    text: 'Les journées s\'organisent autour d\'une question très concrète.',
    resolve: ({ run }, rng) => {
      const h = run.household;
      const working = h.parents.filter((x) => x.employed).length;
      const r = rng.next();
      if (working === 0 || (h.parents.length === 1 && !h.parents[0]?.employed)) {
        return { outcome: 'Un parent reste à la maison. Les journées sont longues, les sorties au parc nombreuses.', social: -2 };
      }
      if (run.citizen.territory === 'rural' && r < 0.5) {
        return { outcome: 'Une assistante maternelle du village garde l\'enfant avec trois autres petits. Il y a des poules dans le jardin.', social: 3 };
      }
      if (r < 0.35) return { outcome: 'Une place en crèche s\'est libérée, après des mois d\'attente.', social: 4, studyConditions: 2 };
      if (r < 0.7) return { outcome: 'Une assistante maternelle prend le relais, quatre jours par semaine.', social: 3 };
      return { outcome: 'Les grands-parents se relaient. Ils racontent des histoires que personne d\'autre ne connaît.', social: 5 };
    },
  },
  {
    id: 'ami_enfance',
    kind: 'jalon',
    domain: 'relations',
    status: 'fictif',
    conditions: { minAge: 7, maxAge: 7 },
    memorable: true,
    title: 'Le meilleur ami',
    effects: { addPerson: [{ key: 'meilleur_ami', kind: 'ami', closeness: 80, ageOffset: 0, note: 'rencontré à l\'école' }], social: 6 },
    text: 'Un échange de cartes, une dispute pour une balle, puis une amitié qui semble évidente.',
    resolve: ({ run }) => ({
      outcome: `À la récréation, ${run.people.find((p) => p.id === 'meilleur_ami')?.name ?? 'un enfant de la classe'} devient inséparable.`,
    }),
  },
  {
    id: 'activite_extrascolaire',
    kind: 'jalon',
    domain: 'argent',
    status: 'fictif',
    conditions: { minAge: 8, maxAge: 8 },
    title: 'Le mercredi après-midi',
    text: ({ run, g }) => {
      const tight = run.household.percentile < 0.35;
      return tight
        ? `${run.citizen.firstName} voudrait faire comme les autres : un club, un instrument. Mais entre la licence, l'équipement et les trajets, chaque dépense se discute à la maison. Certaines communes et associations proposent des tarifs réduits ; encore faut-il le savoir.`
        : `${run.citizen.firstName} hésite entre plusieurs activités. ${g('Il', 'Elle')} a des envies, mais aussi besoin de temps libre.`;
    },
    choices: [
      {
        id: 'club',
        label: 'S\'inscrire dans un club de sport',
        hint: 'Coûte de l\'argent et du temps de trajet aux parents.',
        resolve: ({ run }) => ({
          savings: 0,
          social: 7,
          physical: 4,
          setFlags: ['club_sport'],
          outcome:
            run.household.percentile < 0.35
              ? 'La famille se serre un peu la ceinture. Les samedis de match deviennent sacrés.'
              : 'Les samedis de match deviennent sacrés.',
          studyConditions: run.household.percentile < 0.35 ? -2 : 0,
        }),
      },
      {
        id: 'musique',
        label: 'Apprendre un instrument',
        hint: 'Les cours collectifs sont moins chers, mais il faut un instrument.',
        effects: { studyConditions: 4, wellbeing: 4, setFlags: ['musique'], outcome: 'Les premières gammes font grincer des dents. Puis, un jour, une vraie mélodie.' },
      },
      {
        id: 'bibliotheque',
        label: 'Passer les mercredis à la médiathèque',
        hint: 'Gratuit, calme, et plein d\'histoires.',
        effects: { studyConditions: 6, setFlags: ['lecteur'], outcome: 'La bibliothécaire finit par mettre de côté les nouveautés « pour toi ».' },
      },
      {
        id: 'quartier',
        label: 'Rester jouer avec les enfants du quartier',
        effects: { social: 6, wellbeing: 3, outcome: 'Des cabanes, des vélos, des bêtises. Le quartier devient un territoire.' },
      },
    ],
  },
  {
    id: 'premier_jour_college',
    kind: 'jalon',
    domain: 'ecole',
    status: 'fictif',
    conditions: { minAge: 11, maxAge: 11 },
    title: 'La cour du collège',
    text: ({ name }) => `Le premier jour, la cour paraît immense. ${name('meilleur_ami', 'Votre ami d\'école')} n'est pas dans la même classe.`,
    choices: [
      {
        id: 'fidele',
        label: ({ name }) => `Retrouver ${name('meilleur_ami', 'son ami')} à chaque récréation`,
        effects: { closeness: { meilleur_ami: 10 }, social: 2 },
      },
      {
        id: 'nouveaux',
        label: 'Aller vers de nouveaux visages',
        effects: { social: 6, closeness: { meilleur_ami: -6 }, outcome: 'Une nouvelle bande se forme autour d\'un banc.' },
      },
      {
        id: 'discret',
        label: 'Observer, rester discret quelque temps',
        effects: { studyConditions: 3, wellbeing: -2, outcome: 'On apprend beaucoup en regardant. Mais les premières semaines sont un peu solitaires.' },
      },
    ],
  },
  {
    id: 'ressources_familiales',
    kind: 'jalon',
    domain: 'famille',
    status: 'fictif',
    conditions: { minAge: 13, maxAge: 13 },
    memorable: true,
    title: 'L\'année où tout a bougé',
    text: 'Certaines années, ce sont les adultes qui changent la trajectoire de tout le monde.',
    sourceIds: ['insee-chomage-t2-2026'],
    // Probabilités RÈGLE DE DÉMONSTRATION : un foyer modeste est plus exposé aux chocs, sans que ce soit systématique.
    resolve: ({ run, name }, rng) => {
      const tight = run.household.percentile;
      const r = rng.next();
      const parent = livingPerson(run, 'parent');
      const pn = parent ? name(parent.id) : 'Un parent';
      if (r < 0.32 - tight * 0.2) {
        return {
          outcome: `${pn} perd son emploi. Les courses se font au centime près, les vacances sont annulées, et les disputes à voix basse s'entendent à travers les murs.`,
          studyConditions: -8,
          wellbeing: -6,
          setFlags: ['choc_familial'],
        };
      }
      if (r < 0.5) {
        return {
          outcome: 'Les parents se séparent. Deux maisons, deux brosses à dents, un sac qui fait le trajet chaque semaine.',
          wellbeing: -7,
          social: -3,
          studyConditions: -4,
          setFlags: ['parents_separes'],
        };
      }
      if (r < 0.7) {
        return {
          outcome: `${pn} obtient un poste ailleurs : il faut déménager. Nouvelle chambre, nouveaux camarades, et ce pincement de laisser derrière soi un monde.`,
          social: -5,
          housing: {},
          setFlags: ['demenagement_ado'],
        };
      }
      return {
        outcome: tight > 0.5 ? 'Un héritage inattendu permet de rénover la maison et de partir en voyage pour la première fois.' : 'Une promotion à la maison desserre un peu l\'étau : premières vraies vacances depuis longtemps.',
        wellbeing: 5,
        studyConditions: 4,
      };
    },
  },
];

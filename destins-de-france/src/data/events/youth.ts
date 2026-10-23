import type { EventConsequence, NarrativeEvent } from '../../engine/narrative-types';
import type { SimulationRun } from '../../engine/types';
import { EDUCATION_LABELS } from '../jobs';
import { getRegion } from '../regions';
import { p, pickJob, studySuccess } from './helpers';

/**
 * Jalons de l'orientation, des études et de l'entrée dans la vie adulte.
 * Les probabilités de réussite sont des RÈGLES DE DÉMONSTRATION : seule la
 * proportion moyenne de bacheliers (80,1 %, DEPP) sert de repère de calibrage.
 */

const inStudy = (run: SimulationRun, status: SimulationRun['education']['status']) =>
  run.education.status === status && run.education.expectedEndAge !== undefined && run.age >= run.education.expectedEndAge;

const finishStudies = (): EventConsequence => ({ education: { status: 'termine' }, job: { status: 'inactif' } });

export const YOUTH_EVENTS: NarrativeEvent[] = [
  {
    id: 'orientation_3e',
    kind: 'jalon',
    domain: 'ecole',
    status: 'fictif',
    conditions: { minAge: 15, maxAge: 15 },
    sourceIds: ['depp-bac-2025'],
    memorable: true,
    title: 'Fin de troisième : choisir une voie',
    text: ({ run, g }) => {
      const c = run.education.conditions;
      const school =
        c > 65 ? 'Les résultats sont solides et les professeurs encouragent la seconde générale.' : c > 45 ? 'Les résultats sont corrects, avec des hauts et des bas.' : 'L\'année a été difficile : les notes ne disent pas tout, mais elles pèsent dans le conseil de classe.';
      return `${school} ${run.citizen.firstName} doit formuler ses vœux. ${g('Il', 'Elle')} sait surtout ce qu'${g('il', 'elle')} n'aime pas, ce qui est déjà une information.`;
    },
    choices: [
      {
        id: 'generale',
        label: 'Seconde générale et technologique',
        hint: 'Trois ans de lycée avant le bac, puis des études plus longues en général.',
        autoWeight: (run) => 0.6 + run.education.conditions / 60,
        effects: { education: { status: 'lycee', track: 'generale', expectedEndAge: 18 }, setFlags: ['voie_generale'] },
      },
      {
        id: 'pro',
        label: 'Seconde professionnelle (bac pro)',
        hint: 'Un métier concret, des stages en entreprise, et des poursuites d\'études possibles.',
        effects: { education: { status: 'lycee', track: 'professionnelle', expectedEndAge: 18 }, setFlags: ['voie_pro'] },
      },
      {
        id: 'apprentissage',
        label: 'CAP en apprentissage',
        hint: 'Alterner centre de formation et employeur, avec un petit salaire dès 15-16 ans.',
        autoWeight: () => 0.4,
        effects: { education: { status: 'apprentissage', track: 'apprentissage', expectedEndAge: 17 }, setFlags: ['apprentissage'], savings: 1500, social: 2 },
      },
    ],
  },
  {
    id: 'lycee_engagement',
    kind: 'jalon',
    domain: 'citoyennete',
    status: 'fictif',
    conditions: { minAge: 16, maxAge: 16 },
    title: 'Les premières causes',
    text: ({ run }) =>
      run.education.status === 'apprentissage'
        ? 'Au centre de formation, quelqu\'un fait circuler une pétition pour améliorer la cantine et les horaires de bus. On vous demande de signer, et plus si affinités.'
        : 'Au lycée, il faut élire des délégués, et une association propose d\'organiser une collecte pour les sinistrés d\'une inondation dans la région.',
    choices: [
      { id: 'delegue', label: 'Se porter volontaire, prendre la parole', effects: { engagement: 12, social: 4, setFlags: ['premiere_prise_de_parole'], outcome: 'La voix tremble à la première réunion. Pas à la troisième.' } },
      { id: 'signer', label: 'Signer, aider ponctuellement', effects: { engagement: 5, social: 2 } },
      { id: 'pas_pour_moi', label: 'Ce n\'est pas pour moi, pas maintenant', effects: { wellbeing: 1, outcome: 'D\'autres choses occupent la tête, et c\'est très bien ainsi.' } },
    ],
  },
  {
    id: 'fin_apprentissage',
    kind: 'jalon',
    domain: 'ecole',
    status: 'modele',
    conditions: { when: (run) => inStudy(run, 'apprentissage') },
    memorable: true,
    title: 'L\'examen du CAP',
    text: 'Épreuves pratiques, oral, et un maître d\'apprentissage qui fait semblant de ne pas être inquiet.',
    resolve: ({ run }, rng) =>
      rng.chance(studySuccess(run, 0.8))
        ? { education: { level: 'cap', status: 'termine', milestone: 'CAP obtenu' }, wellbeing: 8, setFlags: ['cap_obtenu'], job: { status: 'inactif' }, outcome: 'Le CAP est obtenu.' }
        : { education: { status: 'termine', milestone: 'CAP non obtenu' }, wellbeing: -6, job: { status: 'inactif' }, outcome: 'Le CAP n\'est pas validé cette fois-ci. Le métier, lui, commence à rentrer dans les mains.' },
  },
  {
    id: 'majorite',
    kind: 'jalon',
    domain: 'citoyennete',
    status: 'prospectif',
    conditions: { minAge: 18, maxAge: 18 },
    sourceIds: ['constitution-droit-de-vote'],
    title: 'Dix-huit ans',
    text: 'Majorité civile, droit de vote, permis de conduire possible : selon les règles de 2026, supposées inchangées, une partie de la vie devient officiellement la vôtre.',
    effects: { engagement: 2 },
  },
  {
    id: 'resultat_bac',
    kind: 'jalon',
    domain: 'ecole',
    status: 'modele',
    conditions: { when: (run) => inStudy(run, 'lycee') },
    sourceIds: ['depp-bac-2025'],
    memorable: true,
    title: 'Les résultats du bac',
    text: 'Le site affiche la liste. Il faut faire défiler les noms en retenant son souffle.',
    resolve: ({ run }, rng) => {
      const base = run.education.track === 'generale' ? 0.9 : 0.8;
      return rng.chance(studySuccess(run, base))
        ? { education: { level: 'bac', milestone: run.education.track === 'generale' ? 'Bac général ou technologique' : 'Bac professionnel' }, setFlags: ['bac_obtenu'], wellbeing: 8, outcome: 'Le bac est obtenu.' }
        : { setFlags: ['bac_rate'], wellbeing: -10, outcome: 'Le bac n\'est pas obtenu cette année.' };
    },
  },
  {
    id: 'apres_bac_rate',
    kind: 'jalon',
    domain: 'ecole',
    status: 'fictif',
    conditions: { flags: ['bac_rate'], notFlags: ['bac_obtenu', 'choix_apres_echec'] },
    title: 'Et maintenant ?',
    text: 'Les amis partent en vacances ou à la fac. La maison semble soudain très calme.',
    effects: { setFlags: ['choix_apres_echec'] },
    choices: [
      {
        id: 'redoubler',
        label: 'Redoubler la terminale',
        effects: { education: { expectedEndAge: 19 }, studyConditions: 4, clearFlags: ['bac_rate'], outcome: 'Une deuxième chance, une autre classe.' },
      },
      {
        id: 'travailler',
        label: 'Chercher du travail tout de suite',
        effects: { ...finishStudies(), wellbeing: 2 },
      },
      {
        id: 'formation_courte',
        label: ({ g }) => `Une formation courte d'${g('aide-soignant', 'aide-soignante')}`,
        hint: 'Environ un an de formation pour obtenir un diplôme d\'État.',
        effects: { education: { status: 'superieur', field: 'aide_soignant', expectedEndAge: 19 } },
      },
    ],
  },
  {
    id: 'orientation_sup',
    kind: 'jalon',
    domain: 'ecole',
    status: 'fictif',
    conditions: { flags: ['bac_obtenu'], notFlags: ['orientation_sup_faite'], maxAge: 21 },
    memorable: true,
    title: 'Après le bac',
    text: ({ run }) =>
      run.education.track === 'professionnelle'
        ? 'Avec un bac pro en poche, beaucoup commencent à travailler. D\'autres tentent un BTS ou un BUT. Les places sont limitées et les dossiers comptent.'
        : 'La plateforme des vœux ouvre ses portes. Les filières défilent : certaines sélectives, d\'autres non, certaines loin, d\'autres à deux arrêts de bus.',
    effects: { setFlags: ['orientation_sup_faite'] },
    choices: [
      {
        id: 'licence',
        label: 'Une licence à l\'université',
        available: (run) => run.education.track === 'generale',
        effects: { education: { status: 'superieur', field: 'licence', expectedEndAge: 21 }, setFlags: ['etudes_sup'], job: { status: 'etudiant' } },
      },
      {
        id: 'but',
        label: 'Un BUT ou un BTS (filière technologique courte)',
        resolve: ({ run }, rng) =>
          rng.chance(run.education.track === 'generale' ? 0.75 : 0.5)
            ? { education: { status: 'superieur', field: 'but', expectedEndAge: 21 }, setFlags: ['etudes_sup'], job: { status: 'etudiant' }, outcome: 'Le dossier est accepté.' }
            : { education: { status: 'superieur', field: 'licence', expectedEndAge: 21 }, setFlags: ['etudes_sup'], job: { status: 'etudiant' }, outcome: 'Pas de place cette année : ce sera une licence à l\'université.' },
      },
      {
        id: 'infirmier',
        label: 'Un institut de formation en soins infirmiers',
        resolve: ({ run }, rng) =>
          rng.chance(run.education.track === 'generale' ? 0.6 : 0.4)
            ? { education: { status: 'superieur', field: 'infirmier', expectedEndAge: 21 }, setFlags: ['etudes_sup'], job: { status: 'etudiant' }, outcome: 'Admission en institut de soins infirmiers.' }
            : { education: { status: 'superieur', field: 'licence', expectedEndAge: 21 }, setFlags: ['etudes_sup'], job: { status: 'etudiant' }, outcome: 'Refusé cette fois : ce sera une licence, en attendant.' },
      },
      {
        id: 'medecine',
        label: 'Tenter les études de santé (médecine)',
        hint: 'Très sélectif dès la première année, et long : neuf ans au minimum.',
        available: (run) => run.education.track === 'generale',
        effects: { education: { status: 'superieur', field: 'sante_selection', expectedEndAge: 19 }, setFlags: ['etudes_sup'], job: { status: 'etudiant' } },
      },
      {
        id: 'ingenieur',
        label: 'Une classe préparatoire puis une école d\'ingénieurs',
        available: (run) => run.education.track === 'generale' && run.education.conditions > 45,
        effects: { education: { status: 'superieur', field: 'ingenieur', expectedEndAge: 23 }, setFlags: ['etudes_sup', 'prepa'], job: { status: 'etudiant' }, studyConditions: -3 },
      },
      {
        id: 'travailler',
        label: 'Entrer dans la vie active',
        effects: finishStudies(),
      },
    ],
  },
  {
    id: 'distance_etudes',
    kind: 'jalon',
    domain: 'logement',
    status: 'fictif',
    conditions: { flags: ['etudes_sup'], notFlags: ['distance_choisie'], when: (run) => run.housing.territory !== 'metropole' || run.household.percentile < 0.5 },
    memorable: true,
    title: 'Une admission loin de chez soi',
    text: ({ run }) => {
      const region = getRegion(run.citizen.regionId);
      const far = region.places.metropole[0] ?? 'la grande ville';
      const tight = run.household.percentile < 0.4;
      return `La formation qui vous tente le plus vous accepte, à ${far}. ${tight ? 'À la maison, les ressources sont limitées : un loyer en plus, c\'est un vrai calcul.' : 'Il faudra trouver un logement, ce qui n\'est jamais simple.'} Une formation proche existe aussi, moins attirante.`;
    },
    effects: { setFlags: ['distance_choisie'] },
    choices: [
      {
        id: 'partir',
        label: 'Accepter et chercher un logement sur place',
        hint: 'Plus de dépenses ; une résidence universitaire est possible mais pas garantie.',
        resolve: ({ run }, rng) => {
          const bourse = run.household.percentile < 0.35;
          const crous = rng.chance(bourse ? 0.55 : 0.2);
          const c: EventConsequence = {
            housing: { withParents: false, tenure: 'locataire_prive', moveToMetropole: true },
            setFlags: ['etudes_loin', ...(bourse ? ['bourse'] : []), ...(crous ? ['residence_crous'] : [])],
            social: -3,
            wellbeing: 3,
            studyConditions: 4,
          };
          c.outcome = `${bourse ? 'Une bourse sur critères sociaux est accordée (montant réel selon le barème du Crous, non simulé : estimation de jeu). ' : ''}${crous ? 'Une chambre en résidence universitaire se libère.' : 'Ce sera un petit studio, cher pour sa taille.'}`;
          return c;
        },
      },
      {
        id: 'proche',
        label: 'Choisir une formation plus proche, rester chez ses parents',
        effects: { setFlags: ['etudes_proches'], studyConditions: -2, social: 3, outcome: 'Les trajets sont longs, mais le frigo est plein.' },
      },
      {
        id: 'job',
        label: 'Partir quand même, avec un job étudiant à côté',
        resolve: () => ({
          housing: { withParents: false, tenure: 'locataire_prive', moveToMetropole: true },
          setFlags: ['etudes_loin', 'job_etudiant'],
          wellbeing: -2,
          social: 2,
          outcome: 'Des soirées en caisse ou en livraison. L\'autonomie a un prix, payé en fatigue.',
        }),
      },
    ],
  },
  {
    id: 'selection_sante',
    kind: 'jalon',
    domain: 'ecole',
    status: 'modele',
    conditions: { when: (run) => inStudy(run, 'superieur') && run.education.field === 'sante_selection' },
    memorable: true,
    title: 'Le classement de première année',
    text: 'Une année de fiches, de concours blancs et de cafés. Le classement tombe un soir.',
    resolve: ({ run }, rng) =>
      rng.chance(studySuccess(run, 0.28))
        ? { education: { field: 'medecine', expectedEndAge: 28 }, wellbeing: 10, outcome: 'Admission en deuxième année de médecine. Le chemin sera encore long.' }
        : { education: { field: 'licence', expectedEndAge: 22 }, wellbeing: -8, outcome: 'Pas de place en médecine. Les crédits obtenus permettent de poursuivre en licence.' },
  },
  {
    id: 'fin_etudes_sup',
    kind: 'jalon',
    domain: 'ecole',
    status: 'modele',
    conditions: { when: (run) => inStudy(run, 'superieur') && run.education.field !== 'sante_selection' },
    maxOccurrences: 4,
    memorable: true,
    title: 'Fin de formation',
    text: ({ run }) => (run.education.field === 'medecine' ? 'La thèse est soutenue devant un jury et quelques proches émus.' : 'Les derniers examens, le dernier mémoire, la dernière nuit blanche.'),
    resolve: ({ run }, rng) => {
      const f = run.education.field;
      const ok = rng.chance(studySuccess(run, f === 'medecine' ? 0.92 : f === 'aide_soignant' ? 0.85 : f === 'master' ? 0.8 : 0.72));
      const base: EventConsequence = { education: { status: 'termine' }, job: { status: 'inactif' } };
      if (!ok) {
        return { ...base, wellbeing: -8, setFlags: ['etudes_interrompues'], outcome: 'Le diplôme n\'est pas validé. Il faudra faire avec ce qui a été appris, et ce n\'est pas rien.' };
      }
      switch (f) {
        case 'medecine':
          return { ...base, education: { status: 'termine', level: 'medecine', milestone: 'Doctorat de médecine' }, setFlags: ['diplome_medecine'], wellbeing: 10, outcome: 'Docteur en médecine.' };
        case 'aide_soignant':
          return { ...base, education: { status: 'termine', level: 'cap', milestone: "Diplôme d'État d'aide-soignant" }, setFlags: ['diplome_aide_soignant'], wellbeing: 8, outcome: "Le diplôme d'État d'aide-soignant est obtenu." };
        case 'infirmier':
          return { ...base, education: { status: 'termine', level: 'bac3', milestone: "Diplôme d'État d'infirmier" }, setFlags: ['diplome_infirmier'], wellbeing: 8, outcome: "Le diplôme d'État d'infirmier est obtenu." };
        case 'ingenieur':
          return { ...base, education: { status: 'termine', level: 'bac5', milestone: "Diplôme d'ingénieur" }, wellbeing: 8, outcome: "Diplôme d'ingénieur en poche." };
        case 'master':
          return { ...base, education: { status: 'termine', level: 'bac5', milestone: 'Master' }, wellbeing: 8, outcome: 'Le master est validé.' };
        case 'doctorat':
          return { ...base, education: { status: 'termine', level: 'bac5', milestone: 'Doctorat' }, setFlags: ['doctorat'], wellbeing: 8, outcome: 'Docteur, après trois ans de recherche.' };
        default:
          return { ...base, education: { status: 'termine', level: 'bac3', milestone: f === 'but' ? 'BUT (bac+3)' : 'Licence' }, setFlags: ['licence_obtenue'], wellbeing: 6, outcome: f === 'but' ? 'Le BUT est obtenu.' : 'La licence est obtenue.' };
      }
    },
  },
  {
    id: 'poursuite_master',
    kind: 'jalon',
    domain: 'ecole',
    status: 'fictif',
    conditions: { flags: ['licence_obtenue'], notFlags: ['poursuite_decidee'] },
    title: 'Continuer ?',
    text: 'Avec une licence, on peut travailler, ou poursuivre deux ans de plus. Certains masters sont sélectifs et souvent ailleurs.',
    effects: { setFlags: ['poursuite_decidee'] },
    choices: [
      {
        id: 'master',
        label: 'Postuler en master',
        resolve: ({ run }, rng) =>
          rng.chance(p(0.55 + (run.education.conditions - 50) * 0.008))
            ? { education: { status: 'superieur', field: 'master', expectedEndAge: run.age + 2 }, job: { status: 'etudiant' }, outcome: 'Une admission en master arrive, après quelques refus.' }
            : { ...finishStudies(), outcome: 'Pas d\'admission cette année. Direction la vie active.' },
      },
      {
        id: 'master_enseignement',
        label: 'Un master pour devenir professeur des écoles',
        hint: 'Il faudra aussi réussir le concours de recrutement.',
        effects: { setFlags: ['vise_enseignement'] },
        resolve: ({ run }) => ({ education: { status: 'superieur', field: 'master', expectedEndAge: run.age + 2 }, job: { status: 'etudiant' } }),
      },
      { id: 'travailler', label: 'Commencer à travailler', effects: finishStudies() },
    ],
  },
  {
    id: 'premier_emploi',
    kind: 'jalon',
    domain: 'travail',
    status: 'fictif',
    conditions: { minAge: 16, jobStatus: ['inactif'], when: (run) => run.education.status === 'termine' && run.employment.jobs.length === 0 },
    sourceIds: ['insee-chomage-t2-2026', 'smic-2026'],
    memorable: true,
    title: 'Chercher sa place',
    text: ({ run }) => {
      const lvl = EDUCATION_LABELS[run.education.level];
      const where = run.housing.territory === 'metropole' ? 'Les offres sont nombreuses, la concurrence aussi.' : 'Dans le coin, les offres se comptent ; en ville, il y en aurait davantage, mais il faudrait partir.';
      return `Diplôme : ${lvl.toLowerCase()}. ${where} Les candidatures partent, les réponses tardent.`;
    },
    choices: [
      {
        id: 'local',
        label: 'Accepter un poste près de chez soi',
        resolve: ({ run }, rng) => {
          const job = pickJob(run, rng, 0.8);
          return { job: { jobId: job.id }, social: 2, outcome: `Premier poste : ${run.citizen.sex === 'F' ? job.label.f : job.label.m}.` };
        },
      },
      {
        id: 'metropole',
        label: 'Partir en grande ville pour plus d\'opportunités',
        available: (run) => run.housing.territory !== 'metropole',
        resolve: ({ run }, rng) => {
          const job = pickJob(run, rng, 2.5);
          return {
            job: { jobId: job.id },
            housing: { withParents: false, tenure: 'locataire_prive', moveToMetropole: true },
            setFlags: ['demenage_metropole'],
            social: -6,
            outcome: `Départ pour la grande ville, et un poste de ${run.citizen.sex === 'F' ? job.label.f : job.label.m}. Les amis d'avant deviennent des messages du dimanche.`,
          };
        },
      },
      {
        id: 'concours',
        label: 'Préparer un concours de la fonction publique',
        available: (run) => run.education.level === 'bac5',
        hint: 'Une année de préparation, sans garantie.',
        resolve: ({ run }, rng) => {
          const teacher = run.flags.vise_enseignement !== undefined;
          if (rng.chance(studySuccess(run, 0.45))) {
            return teacher
              ? { setFlags: ['concours_enseignant'], job: { jobId: 'enseignant' }, wellbeing: 8, outcome: 'Concours réussi : une classe de CE1 attend à la rentrée.' }
              : { setFlags: ['concours_fonction_publique'], job: { jobId: 'cadre_public' }, wellbeing: 8, outcome: 'Concours réussi : un poste dans une administration.' };
          }
          const job = pickJob(run, rng, 1, ['createur_entreprise', 'agriculteur', 'enseignant', 'cadre_public']);
          return { job: { jobId: job.id }, wellbeing: -5, outcome: `Le concours échoue de peu. En attendant, un poste de ${run.citizen.sex === 'F' ? job.label.f : job.label.m}.` };
        },
      },
      {
        id: 'medecin_rural',
        label: 'S\'installer comme médecin dans un territoire qui en manque',
        available: (run) => run.flags.diplome_medecine !== undefined,
        effects: { job: { jobId: 'medecin' }, housing: { withParents: false, tenure: 'locataire_prive' }, engagement: 6, social: 4, setFlags: ['medecin_installe_rural'], outcome: 'Un cabinet dans une petite ville. La salle d\'attente est pleine dès la première semaine.' },
      },
      {
        id: 'chercher',
        label: 'Continuer à chercher, sans accepter n\'importe quoi',
        effects: { job: { status: 'chomage' }, wellbeing: -3, outcome: 'Quelques mois d\'incertitude, avec l\'espoir de trouver mieux.' },
      },
      {
        id: 'creer',
        label: 'Se lancer à son compte',
        hint: 'Risqué : les revenus seront irréguliers au début.',
        resolve: (_ctx, rng) => {
          const ok = rng.chance(0.55);
          return ok
            ? { setFlags: ['entreprise_creee'], job: { jobId: 'createur_entreprise' }, wellbeing: 6, debt: 5000, outcome: 'Une petite activité démarre, financée par un prêt.' }
            : { job: { status: 'chomage' }, debt: 3000, wellbeing: -6, outcome: 'Le projet ne trouve pas ses clients. Il reste une dette et une expérience.' };
        },
      },
    ],
  },
  {
    id: 'quitter_parents',
    kind: 'jalon',
    domain: 'logement',
    status: 'fictif',
    conditions: { minAge: 19, maxAge: 32, when: (run) => run.housing.withParents && run.employment.status !== 'enfant' },
    weight: 1,
    title: 'Partir de chez ses parents',
    text: ({ run }) =>
      run.employment.status === 'emploi' || run.employment.status === 'independant'
        ? 'Avec un salaire, l\'idée d\'avoir sa propre porte d\'entrée devient concrète. Les agences demandent des garants et trois fiches de paie.'
        : 'Sans revenu stable, partir est compliqué. Mais rester a aussi un coût.',
    choices: [
      {
        id: 'studio',
        label: ({ g }) => `Louer un petit logement ${g('seul', 'seule')}`,
        available: (run) => run.employment.status === 'emploi' || run.employment.status === 'independant',
        effects: { housing: { withParents: false, tenure: 'locataire_prive' }, wellbeing: 6, social: -2 },
      },
      {
        id: 'social',
        label: 'Déposer une demande de logement social',
        hint: 'Les délais d\'attribution sont très variables.',
        resolve: (_c, rng) =>
          rng.chance(0.45)
            ? { housing: { withParents: false, tenure: 'locataire_social' }, wellbeing: 5, outcome: 'Un appartement est attribué après une longue attente.' }
            : { wellbeing: -3, outcome: 'La demande reste en attente. Encore un peu chez les parents.' },
      },
      {
        id: 'coloc',
        label: 'Partager une colocation',
        effects: { housing: { withParents: false, tenure: 'locataire_prive' }, social: 6, outcome: 'Des plannings de ménage jamais respectés, et des soirées mémorables.' },
      },
      {
        id: 'rester',
        label: 'Rester encore et économiser',
        effects: { savings: 2500, wellbeing: -3, closeness: { parent1: 3 } },
      },
    ],
  },
];

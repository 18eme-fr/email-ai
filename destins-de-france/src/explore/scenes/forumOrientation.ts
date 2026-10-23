import type { SimulationRun } from '../../engine/types';
import type { CharacterLook } from '../render/contract';
import type { ExplorationScene } from '../types';

/**
 * Scène prototype : le forum des métiers, dans le gymnase du collège, l'année
 * de troisième. Rattachée à l'événement « orientation_3e ».
 *
 * Toutes les décisions possibles sur la carte de l'événement sont accessibles
 * ici, auprès des stands ; on peut aussi passer la scène. Les rencontres
 * facultatives (conseillère, ami, parent) ont de petites conséquences réelles,
 * appliquées une seule fois. Personnages et noms fictifs.
 */

const choiceOpen = (id: string) => (run: SimulationRun) => !!run.pending?.choices.some((c) => c.id === id);
const self = (run: SimulationRun): CharacterLook => ({ age: run.age, sex: run.citizen.sex, hue: run.citizen.portraitHue, seed: run.seed, role: 'eleve' });
const person = (run: SimulationRun, key: string) => run.people.find((p) => p.id === key && p.alive);
const livingParent = (run: SimulationRun) => run.people.find((p) => p.kind === 'parent' && p.alive);

export { self as playerLook };

export const FORUM_ORIENTATION: ExplorationScene = {
  id: 'forum_orientation',
  eventId: 'orientation_3e',
  title: 'Le forum des métiers',
  intro: ({ run }) => `Un samedi matin, au gymnase du collège de ${run.housing.place}. Des stands, des brochures, beaucoup de bruit. Il faut formuler ses vœux avant la fin du mois.`,
  duration: '1 à 3 minutes',
  map: [
    '#WAWWDWWAWWAW',
    'W............',
    '#............',
    'A............',
    'W............',
    '#............',
    'A............',
    'W............',
    '#............',
    'W............',
  ],
  legend: {
    '#': { wall: 'mur' },
    W: { wall: 'mur_fenetre' },
    A: { wall: 'mur_affiches' },
    D: { wall: 'porte', exit: true },
    '.': { floor: 'lino' },
  },
  props: [
    { kind: 'stand', x: 3, y: 1, accent: 215, label: 'Lycée général et technologique' },
    { kind: 'kakemono', x: 4, y: 1, accent: 215 },
    { kind: 'tableau_liaison', x: 6, y: 1, label: 'Forum des métiers, 9 h – 12 h. Venez avec vos questions !' },
    { kind: 'stand', x: 8, y: 1, accent: 28, label: 'Lycée professionnel : métiers du bâtiment, de la vente, du soin, de l\'industrie' },
    { kind: 'kakemono', x: 9, y: 1, accent: 28 },
    { kind: 'stand', x: 11, y: 1, accent: 140, label: 'Apprentissage : CAP avec un centre de formation d\'apprentis' },
    { kind: 'kakemono', x: 12, y: 1, accent: 140 },
    { kind: 'table', x: 1, y: 6 },
    { kind: 'chaise', x: 1, y: 7 },
    { kind: 'plante', x: 1, y: 9 },
    { kind: 'etagere', x: 1, y: 3, label: 'Brochures : « Après la 3e », « Les métiers du soin », « L\'apprentissage »' },
    { kind: 'distributeur', x: 12, y: 5 },
    { kind: 'panier_basket', x: 12, y: 8 },
    { kind: 'banc', x: 8, y: 9 },
    { kind: 'banc', x: 9, y: 9 },
  ],
  spawn: { x: 6.5, y: 7.5, dir: 'e' },
  npcs: [
    {
      id: 'prof_lycee',
      name: 'Mme Lefort',
      title: 'Professeure de lettres en lycée général',
      x: 3,
      y: 2,
      dir: 'w',
      prompt: 'parler',
      look: (run) => ({ age: 46, sex: 'F', hue: 215, seed: run.seed + 11, role: 'enseignant' }),
      dialogue: [
        {
          id: 'start',
          text: ({ run }) =>
            `« Bonjour ! Tu t'intéresses à la seconde générale et technologique ? Trois ans de lycée, le bac, puis le plus souvent des études après. ${run.education.conditions > 60 ? 'Tes professeurs m\'ont parlé de toi en bien.' : 'Ce n\'est pas réservé à ceux qui ont les meilleures notes : on y progresse aussi.'} »`,
          options: [
            { label: 'Et ensuite, on fait quoi ?', next: 'apres' },
            { label: 'Je veux aller en seconde générale.', available: choiceOpen('generale'), action: { type: 'choose', choiceId: 'generale' } },
            { label: 'Merci, je fais le tour des stands.' },
          ],
        },
        {
          id: 'apres',
          text: '« Université, BUT, BTS, écoles… Il y a beaucoup de chemins, certains longs. Ce qui compte, c\'est de garder des portes ouvertes, sans se forcer à tout prix. »',
          options: [
            { label: 'Je veux aller en seconde générale.', available: choiceOpen('generale'), action: { type: 'choose', choiceId: 'generale' } },
            { label: 'Je vais réfléchir.' },
          ],
        },
      ],
    },
    {
      id: 'prof_pro',
      name: 'M. Haddad',
      title: 'Professeur d\'atelier en lycée professionnel',
      x: 8,
      y: 2,
      dir: 'w',
      prompt: 'parler',
      look: (run) => ({ age: 52, sex: 'M', hue: 28, seed: run.seed + 23, role: 'artisan' }),
      dialogue: [
        {
          id: 'start',
          text: '« Le bac pro, c\'est trois ans, avec des semaines de stage en entreprise. On apprend un métier avec les mains et la tête. Et on peut continuer après, en BTS par exemple. »',
          options: [
            { label: 'Les stages, ça se passe comment ?', next: 'stages' },
            { label: 'La voie professionnelle, c\'est pour moi.', available: choiceOpen('pro'), action: { type: 'choose', choiceId: 'pro' } },
            { label: 'Merci beaucoup.' },
          ],
        },
        {
          id: 'stages',
          text: '« Il faut trouver une entreprise d\'accueil, on aide à chercher. Certains élèves y découvrent ce qu\'ils aiment, d\'autres ce qu\'ils ne veulent surtout pas faire. Les deux servent. »',
          options: [
            { label: 'La voie professionnelle, c\'est pour moi.', available: choiceOpen('pro'), action: { type: 'choose', choiceId: 'pro' } },
            { label: 'Je regarde encore.' },
          ],
        },
      ],
    },
    {
      id: 'maitre_apprentissage',
      name: 'Sonia',
      title: 'Maîtresse d\'apprentissage, boulangerie',
      x: 11,
      y: 2,
      dir: 'w',
      prompt: 'parler',
      look: (run) => ({ age: 38, sex: 'F', hue: 140, seed: run.seed + 37, role: 'artisan' }),
      dialogue: [
        {
          id: 'start',
          text: '« En apprentissage, tu signes un contrat avec un employeur : une partie du temps au centre de formation, le reste chez nous. Et tu es payé dès le début. Mais il faut se lever tôt, et trouver un patron qui te prend. »',
          options: [
            { label: 'Vous prenez des apprentis, vous ?', next: 'patron' },
            { label: 'Je veux faire un CAP en apprentissage.', available: choiceOpen('apprentissage'), action: { type: 'choose', choiceId: 'apprentissage' } },
            { label: 'Je vais y penser.' },
          ],
        },
        {
          id: 'patron',
          text: '« Cette année, oui, une place. Viens faire un essai pendant les vacances si tu veux. Tu verras si l\'odeur du four à quatre heures du matin te plaît encore à la fin de la semaine. »',
          options: [
            { label: 'Je veux faire un CAP en apprentissage.', available: choiceOpen('apprentissage'), action: { type: 'choose', choiceId: 'apprentissage' } },
            { label: 'Merci, je réfléchis.' },
          ],
        },
      ],
    },
    {
      id: 'conseillere',
      name: 'Mme Bertin',
      title: 'Psychologue de l\'Éducation nationale (orientation)',
      x: 2,
      y: 6,
      dir: 's',
      prompt: 'info',
      look: (run) => ({ age: 41, sex: 'F', hue: 265, seed: run.seed + 41, role: 'conseiller' }),
      dialogue: [
        {
          id: 'start',
          text: ({ run, g }) =>
            `« Assieds-toi. On ne choisit pas un métier pour la vie à quinze ans : on choisit une prochaine étape. Qu'est-ce qui te plaît, vraiment ? »${run.flags.choc_familial !== undefined ? ` Elle note que l'année a été compliquée à la maison, et que ça compte aussi.` : ''} ${g('Il', 'Elle')} sent qu'on l'écoute.`,
          options: [
            {
              label: 'Parler de ses envies, même floues',
              action: {
                type: 'consequence',
                key: 'forum_conseillere',
                consequence: { studyConditions: 4, wellbeing: 3, setFlags: ['informe_orientation'] },
                journal: { title: 'Rendez-vous d\'orientation', text: 'Au forum, une longue discussion avec la psychologue de l\'Éducation nationale. Rien n\'est décidé, mais les idées sont plus claires.' },
              },
              next: 'fin',
            },
            { label: 'Prendre juste une brochure' },
          ],
        },
        {
          id: 'fin',
          text: '« Reviens me voir quand tu veux. Et n\'oublie pas : on peut changer de voie plus tard. Beaucoup le font. »',
          options: [{ label: 'Merci.' }],
        },
      ],
    },
    {
      id: 'ami',
      name: ({ run }) => person(run, 'meilleur_ami')?.name ?? 'Un ami',
      title: 'Ami d\'enfance',
      x: 10,
      y: 7,
      dir: 'n',
      prompt: 'parler',
      present: (run) => !!person(run, 'meilleur_ami'),
      look: (run) => ({ age: run.age, sex: (run.seed >>> 4) % 2 === 0 ? 'F' : 'M', hue: (run.citizen.portraitHue + 150) % 360, seed: run.seed + 53, role: 'eleve' }),
      dialogue: [
        {
          id: 'start',
          text: ({ run }) =>
            (run.seed >>> 6) % 3 === 0
              ? '« Moi je vais en pro, électricité. Mon oncle dit qu\'on trouve du travail. Et toi ? On sera plus dans le même lycée, hein… »'
              : (run.seed >>> 6) % 3 === 1
                ? '« Je pars en général, mais franchement j\'en sais rien. Mes parents veulent. Et toi, tu fais quoi ? »'
                : '« J\'ai trouvé une boulangère qui me prend en apprentissage ! Payé à seize ans, tu te rends compte ? Et toi ? »',
          options: [
            {
              label: 'Promettre de rester en contact, quoi qu\'il arrive',
              action: {
                type: 'consequence',
                key: 'forum_ami',
                consequence: { closeness: { meilleur_ami: 8 }, social: 2 },
                journal: { title: 'Une promesse au gymnase', text: 'Au forum des métiers, entre deux stands, une promesse de rester amis, même dans des lycées différents.' },
              },
            },
            { label: 'Hausser les épaules : « On verra bien. »' },
          ],
        },
      ],
    },
    {
      id: 'parent',
      name: ({ run }) => livingParent(run)?.name ?? 'Votre parent',
      title: 'Parent',
      x: 7,
      y: 4,
      dir: 'w',
      prompt: 'parler',
      present: (run) => !!livingParent(run),
      look: (run) => {
        const p = livingParent(run);
        return { age: p ? run.year - p.bornYear : 45, sex: p?.sex ?? 'F', hue: (run.citizen.portraitHue + 60) % 360, seed: run.seed + 67, role: 'parent' };
      },
      dialogue: [
        {
          id: 'start',
          text: ({ run }) =>
            run.household.percentile < 0.35
              ? '« Prends ton temps. Fais ce qui te plaît… mais pense aussi à ce qui te fera vivre. On ne pourra pas t\'aider beaucoup, tu sais. »'
              : '« Prends ton temps. Ce qui compte, c\'est que tu choisisses toi-même. »',
          options: [
            {
              label: 'Demander son avis, vraiment',
              action: {
                type: 'consequence',
                key: 'forum_parent',
                consequence: { closeness: { $parent: 5 } },
                journal: { title: 'Une conversation dans les gradins', text: 'Assis sur les gradins du gymnase, une vraie conversation sur l\'avenir, sans dispute.' },
              },
            },
            { label: '« C\'est bon, je gère. »' },
          ],
        },
      ],
    },
  ],
};

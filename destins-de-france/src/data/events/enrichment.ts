import type { EventConsequence, NarrativeContext, NarrativeEvent } from '../../engine/narrative-types';
import type { RelationKind, SimulationRun } from '../../engine/types';

/**
 * Événements d'ENRICHISSEMENT : scènes du quotidien qui donnent de la texture
 * aux vies, en complément des jalons (scolarité, emploi, élections...).
 *
 * Règles d'écriture :
 * - Le joueur est vouvoyé ; les personnages peuvent se tutoyer entre eux.
 * - Toutes les scènes individuelles sont « fictif » ; les contextes collectifs
 *   futurs (après 2026) sont « prospectif » et restent hypothétiques.
 * - Les poids (`weight`) sont des paramètres de jeu, jamais des statistiques.
 * - Les montants dans `effects` sont des valeurs de jeu, non des moyennes réelles.
 * - Les conditions ne dépendent que de la situation matérielle ou narrative,
 *   jamais d'un jugement sur le milieu, le sexe ou le territoire.
 * - Aucun choix n'est « le bon » : chacun a ses coûts et ses bénéfices.
 * - Clés génériques du moteur : « $parent » (premier parent vivant),
 *   « $fratrie » (premier membre vivant de la fratrie).
 *
 * Arcs différés (via `schedule` vers des événements `programme`) :
 * - enr_voisin_age        → enr_prog_voisin_boite        (voisin âgé, deuil sobre)
 * - enr_cabane            → enr_prog_retrouvailles_ami   (pacte d'enfance, 40 ans après)
 * - enr_premier_amour     → enr_prog_amour_ado           (premier amour recroisé)
 * - enr_coloc             → enr_prog_coloc_mariage       (ancienne colocation)
 * - enr_conflit_travail   → enr_prog_burnout             (épuisement professionnel)
 * - enr_benevolat         → enr_prog_benevolat_bilan     (bilan d'engagement)
 */

// ---------------------------------------------------------------------------
// Utilitaires (lecture seule de l'état)
// ---------------------------------------------------------------------------

const hasFlag = (run: SimulationRun, flag: string): boolean => run.flags[flag] !== undefined;

const hasLiving = (run: SimulationRun, kind: RelationKind): boolean =>
  run.people.some((p) => p.kind === kind && p.alive);

const isCarDependent = (run: SimulationRun): boolean =>
  run.housing.territory === 'rural' || run.housing.territory === 'petite_ville';

const isWorking = (run: SimulationRun): boolean =>
  run.employment.status === 'emploi' || run.employment.status === 'independant';

/** Ajoute le collègue s'il n'existe pas encore, sinon renforce le lien. */
const colleagueBond = (run: SimulationRun, delta: number): EventConsequence =>
  hasLiving(run, 'collegue')
    ? { closeness: { collegue: delta } }
    : { addPerson: [{ key: 'collegue', kind: 'collegue', closeness: 40 + delta, ageOffset: 0, note: 'Collègue de travail' }] };

const ami = (ctx: NarrativeContext): string => ctx.name('meilleur_ami', 'Sam');

// ---------------------------------------------------------------------------
// Petite enfance (0-5) : récits sans choix
// ---------------------------------------------------------------------------

const PETITE_ENFANCE: NarrativeEvent[] = [
  {
    id: 'enr_premiers_mots',
    title: 'Le premier mot',
    domain: 'famille',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 1, maxAge: 2 },
    weight: 2,
    text: (ctx) =>
      `Tout le monde attendait « maman » ou « papa ». Votre premier mot, prononcé avec une conviction totale devant toute la famille réunie, c'est « encore ». ${ctx.name('$parent', 'Votre parent')} le raconte depuis à chaque repas de fête, et ça fait rire à chaque fois.`,
    effects: { wellbeing: 3, social: 2, closeness: { $parent: 3 } },
  },
  {
    id: 'enr_doudou_perdu',
    title: 'Le doudou du supermarché',
    domain: 'famille',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 2, maxAge: 5 },
    weight: 1.5,
    text: (ctx) =>
      `Votre doudou est resté quelque part entre le rayon des yaourts et les caisses. Toute la soirée, vous pleurez comme si le monde s'arrêtait. Le lendemain, une caissière le rend, lavé, avec un petit mot : « Il a dormi au chaud. » Vous ne le lâchez plus pendant des semaines, et vous êtes ${ctx.g('très fier', 'très fière')} de raconter qu'il a « travaillé au magasin ».`,
    effects: { wellbeing: 2, social: 1 },
  },
  {
    id: 'enr_demenagement_petit',
    title: 'Les cartons',
    domain: 'logement',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 3, maxAge: 5 },
    weight: 1,
    text: (ctx) =>
      `La famille déménage, pas très loin, toujours du côté de ${ctx.place}. Pour vous, c'est surtout une forêt de cartons dans laquelle on peut se cacher. La première nuit dans la nouvelle chambre, les bruits ne sont pas les mêmes et vous venez dormir au pied du lit des grands. Au bout d'un mois, vous ne vous souvenez plus vraiment de l'ancien appartement.`,
    effects: { wellbeing: -2, social: -1, closeness: { $parent: 2 } },
  },
];

// ---------------------------------------------------------------------------
// Enfance (6-11)
// ---------------------------------------------------------------------------

const ENFANCE: NarrativeEvent[] = [
  {
    id: 'enr_voisin_age',
    title: 'Au rez-de-chaussée',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 7, maxAge: 11, notFlags: ['lien_voisin_age'] },
    weight: 1.5,
    text: `Au rez-de-chaussée vit une personne très âgée que tout le monde salue sans vraiment lui parler. Un après-midi, son cabas se déchire devant la porte et les oranges roulent dans l'escalier. Pendant que vous les ramassez, elle vous dit : « Tu sais jouer aux dames ? Personne ne veut plus jouer avec moi. »`,
    choices: [
      {
        id: 'jouer',
        label: 'Accepter une partie de dames',
        hint: 'Ça prend des mercredis, mais on apprend des choses.',
        effects: {
          social: 5,
          wellbeing: 4,
          studyConditions: 2,
          setFlags: ['lien_voisin_age'],
          addPerson: [{ key: 'voisin_age', kind: 'voisin', closeness: 55, ageOffset: 72, note: 'Voisin du rez-de-chaussée, partenaire de dames' }],
          schedule: [{ eventId: 'enr_prog_voisin_boite', inYears: 7 }],
          outcome: 'Les parties de dames deviennent un rituel du mercredi. Vous perdez beaucoup, puis un peu moins.',
        },
        autoWeight: () => 2,
      },
      {
        id: 'remonter',
        label: 'Rapporter les oranges et filer',
        hint: 'Les copains attendent en bas.',
        effects: {
          social: 2,
          outcome: "Vous dites bonjour un peu plus fort chaque fois que vous passez devant sa porte. C'est déjà ça.",
        },
      },
    ],
    memorable: true,
  },
  {
    id: 'enr_cabane',
    title: 'La cabane',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 8, maxAge: 11, notFlags: ['pacte_cabane'] },
    weight: 1.5,
    text: (ctx) =>
      `Avec ${ami(ctx)}, vous avez construit une cabane avec trois palettes et une bâche, dans le terrain vague derrière chez vous. ${ami(ctx)} sort un vieux cahier : « On écrit un pacte. On se retrouve ici quand on aura cinquante ans, quoi qu'il arrive. » C'est très sérieux. Il faut signer.`,
    choices: [
      {
        id: 'signer',
        label: 'Signer le pacte (avec une goutte de sirop de grenadine)',
        effects: {
          social: 4,
          wellbeing: 4,
          closeness: { meilleur_ami: 10 },
          setFlags: ['pacte_cabane'],
          schedule: [{ eventId: 'enr_prog_retrouvailles_ami', inYears: 40 }],
          outcome: "Le cahier est caché dans une boîte en fer, sous une pierre. Vous jurez de ne jamais l'oublier.",
        },
        autoWeight: () => 2,
      },
      {
        id: 'rire',
        label: '« Cinquante ans ? On sera trop vieux ! »',
        hint: 'Le présent suffit largement.',
        effects: {
          wellbeing: 3,
          closeness: { meilleur_ami: 4 },
          outcome: "Vous finissez l'après-midi à imaginer à quoi ressemblent des gens de cinquante ans. Vous riez beaucoup.",
        },
      },
    ],
    memorable: true,
  },
  {
    id: 'enr_vacances_ete',
    title: "L'été",
    domain: 'famille',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 7, maxAge: 11 },
    weight: 2,
    maxOccurrences: 2,
    cooldown: 3,
    text: (ctx) =>
      ctx.run.household.percentile < 0.35
        ? `Cette année, il n'y aura pas de départ en vacances : le budget ne le permet pas. À ${ctx.place}, l'été s'étire. Une animatrice du centre de loisirs parle d'une colonie avec des places aidées, et votre grand-mère propose de vous accueillir deux semaines.`
        : `Juillet arrive. Il est question d'une colonie à la montagne, du centre de loisirs du quartier, ou de quelques semaines chez votre grand-mère. On vous demande votre avis, pour une fois.`,
    choices: [
      {
        id: 'colo',
        label: 'Partir en colonie',
        hint: 'Une semaine sans les parents, des inconnus, peut-être des amis.',
        resolve: (ctx, rng) =>
          rng.chance(0.7)
            ? { social: 6, wellbeing: 5, physical: 2, outcome: 'Vous revenez avec une chanson idiote dans la tête, un coup de soleil et deux adresses à qui écrire.' }
            : {
                social: 2,
                wellbeing: -2,
                outcome: `Le mal du pays vous prend le deuxième soir. Vous tenez bon, et vous êtes ${ctx.g('assez fier', 'assez fière')} de vous au retour, même si vous ne le dites pas.`,
              },
      },
      {
        id: 'centre',
        label: 'Le centre de loisirs du quartier',
        hint: 'Les copains habituels, la piscine du jeudi.',
        effects: { social: 4, wellbeing: 2, closeness: { meilleur_ami: 4 }, outcome: 'Un été de sorties à la piscine et de tournois de ballon au pied des immeubles. Pas exotique, mais plein.' },
      },
      {
        id: 'mamie',
        label: 'Chez la grand-mère',
        hint: "Calme, confitures, un peu d'ennui.",
        effects: { wellbeing: 4, studyConditions: 2, social: -1, outcome: "Vous apprenez à faire des confitures, à jouer à la belote et à vous ennuyer, ce qui n'est pas rien." },
      },
    ],
  },
  {
    id: 'enr_activite',
    title: 'Le mercredi après-midi',
    domain: 'ecole',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 6, maxAge: 10, notFlags: ['club_sport', 'musique'] },
    weight: 2,
    text: `Au forum des associations, sous le préau, il y a des stands partout : judo, foot, musique, théâtre. Vous tenez un prospectus dans chaque main. À la maison, on vous a prévenu : une seule activité, il faut choisir.`,
    choices: [
      {
        id: 'sport',
        label: 'Le club de sport',
        hint: 'Des entraînements, des matchs le samedi.',
        effects: { physical: 6, social: 4, setFlags: ['club_sport'], outcome: "Au premier match, vous marquez contre votre camp. Toute l'équipe vous applaudit quand même. Vous revenez la semaine suivante." },
      },
      {
        id: 'musique',
        label: "L'école de musique",
        hint: 'Du solfège avant de jouer vraiment.',
        effects: { studyConditions: 3, wellbeing: 4, social: 2, setFlags: ['musique'], outcome: "Les premiers mois, l'instrument grince et les voisins sont patients. Puis un jour, une mélodie entière sort." },
      },
      {
        id: 'libre',
        label: 'Rien du tout : garder le mercredi libre',
        hint: 'Le temps de traîner, de lire, de ne rien faire.',
        effects: { wellbeing: 3, social: 1, outcome: 'Vos mercredis sont faits de BD, de vélo dans la rue et de longues discussions sur des sujets sans importance.' },
      },
    ],
  },
  {
    id: 'enr_vide_grenier',
    title: 'Le vide-grenier',
    domain: 'territoire',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 6, maxAge: 11 },
    weight: 1.5,
    text: (ctx) =>
      `Au vide-grenier de ${ctx.place}, vous tenez un stand avec ${ami(ctx)} : vieux jouets, BD cornées, un puzzle auquel il manque trois pièces (c'est écrit dessus, honnêtement). Vous gagnez de quoi acheter deux crêpes, que vous mangez en comptant la monnaie quatre fois.`,
    effects: { social: 3, wellbeing: 3, closeness: { meilleur_ami: 3 } },
  },
];

// ---------------------------------------------------------------------------
// Adolescence (12-17)
// ---------------------------------------------------------------------------

const ADOLESCENCE: NarrativeEvent[] = [
  {
    id: 'enr_premier_amour',
    title: 'Le premier amour',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 13, maxAge: 17, notFlags: ['amour_ado'] },
    weight: 2,
    text: `Il y a quelqu'un dans votre classe dont vous connaissez l'emploi du temps mieux que le vôtre. Vous vous êtes parlé trois fois, dont une pour emprunter une gomme. Ce soir, devant votre téléphone, vous avez écrit et effacé le même message une dizaine de fois.`,
    choices: [
      {
        id: 'envoyer',
        label: 'Envoyer le message',
        hint: 'Le cœur qui bat, et aucun moyen de revenir en arrière.',
        resolve: (_ctx, rng) =>
          rng.chance(0.5)
            ? {
                wellbeing: 8,
                social: 4,
                setFlags: ['amour_ado'],
                addPerson: [{ key: 'amour_ado', kind: 'ami', closeness: 70, ageOffset: 0, note: 'Premier amour' }],
                schedule: [{ eventId: 'enr_prog_amour_ado', inYears: 22 }],
                outcome: "La réponse arrive au bout de onze minutes interminables : « moi aussi ». Vous passez l'année à vous tenir la main dans les couloirs. Ça ne dure pas toujours, mais ça compte.",
              }
            : {
                wellbeing: -5,
                social: 1,
                setFlags: ['amour_ado'],
                addPerson: [{ key: 'amour_ado', kind: 'ami', closeness: 40, ageOffset: 0, note: 'Premier amour, non réciproque' }],
                schedule: [{ eventId: 'enr_prog_amour_ado', inYears: 22 }],
                outcome: "La réponse est gentille, et c'est presque pire : « Je t'aime bien, mais pas comme ça. » Vous survivez. Ça prend un trimestre.",
              },
      },
      {
        id: 'garder',
        label: 'Tout effacer et garder ça pour vous',
        hint: 'Rien de perdu. Rien de gagné non plus.',
        effects: {
          wellbeing: -1,
          setFlags: ['amour_ado'],
          addPerson: [{ key: 'amour_ado', kind: 'ami', closeness: 30, ageOffset: 0, note: 'Amour secret de jeunesse' }],
          schedule: [{ eventId: 'enr_prog_amour_ado', inYears: 22 }],
          outcome: 'Vous remplissez un carnet de phrases que personne ne lira. Plus tard, vous trouverez ça touchant.',
        },
      },
    ],
    memorable: true,
  },
  {
    id: 'enr_groupe_classe',
    title: 'Le groupe de la classe',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 12, maxAge: 16 },
    weight: 2,
    text: `Sur le groupe de discussion de la classe, une photo d'un camarade circule, retouchée pour le rendre ridicule. Les émojis qui pleurent de rire s'enchaînent. Personne n'écrit rien d'autre. Votre pouce hésite au-dessus de l'écran.`,
    choices: [
      {
        id: 'defendre',
        label: "« C'est pas drôle, arrêtez. »",
        hint: 'Le dire devant tout le monde.',
        resolve: (_ctx, rng) =>
          rng.chance(0.5)
            ? { engagement: 5, social: 2, wellbeing: 3, outcome: "Deux autres personnes écrivent « c'est vrai ». La photo disparaît. Le lendemain, le camarade vous fait un petit signe de tête." }
            : { engagement: 5, social: -4, wellbeing: -2, outcome: 'On vous traite de rabat-joie pendant une semaine. Vous le vivez mal, mais vous ne regrettez pas.' },
      },
      {
        id: 'adulte',
        label: 'En parler discrètement à un adulte du collège',
        hint: 'Sans se mettre en avant.',
        effects: { engagement: 3, wellbeing: 1, outcome: "La CPE passe dans la classe sans citer de nom. Le groupe se calme. Personne ne sait que c'est vous." },
      },
      {
        id: 'quitter',
        label: 'Quitter le groupe',
        hint: 'Se protéger de tout ça.',
        effects: { wellbeing: 3, social: -3, outcome: 'Votre téléphone devient beaucoup plus calme. Vous ratez aussi quelques infos sur les devoirs.' },
      },
    ],
  },
  {
    id: 'enr_mobilite_ado',
    title: 'Les kilomètres',
    domain: 'territoire',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 14, maxAge: 17, when: isCarDependent },
    weight: 2.5,
    text: (ctx) =>
      `Autour de ${ctx.place}, tout est loin : le lycée, le cinéma, les copains. Le dernier car passe tôt. ${ami(ctx)} vient de récupérer un vieux deux-roues d'occasion : « Fais pareil, on sera libres ! » À la maison, on n'est pas rassuré.`,
    choices: [
      {
        id: 'deux_roues',
        label: "Économiser pour un deux-roues d'occasion",
        hint: "La liberté, l'entretien, le froid en hiver.",
        resolve: (_ctx, rng) => ({
          savings: -rng.int(300, 700),
          social: 6,
          wellbeing: 4,
          setFlags: ['deux_roues'],
          outcome: rng.chance(0.3)
            ? "La liberté a un prix : la chaîne casse deux fois le premier mois. Mais rentrer à l'heure que vous voulez, ça n'a pas de prix."
            : 'Les samedis changent : vous pouvez enfin rejoindre les autres sans demander à personne.',
        }),
      },
      {
        id: 'car_velo',
        label: 'Car scolaire et vélo',
        hint: 'Gratuit, sportif, et contraignant.',
        effects: { physical: 5, social: -2, outcome: 'Vos mollets deviennent impressionnants. Vos horaires, beaucoup moins.' },
      },
      {
        id: 'parents',
        label: 'Négocier des trajets avec les parents',
        hint: 'Leur temps et leur essence.',
        effects: { closeness: { $parent: 4 }, wellbeing: -1, social: 2, outcome: "Les trajets en voiture deviennent des moments où l'on parle, parce qu'on ne peut pas s'échapper. Parfois, c'est bien." },
      },
    ],
  },
  {
    id: 'enr_fou_rire',
    title: 'Le fou rire',
    domain: 'ecole',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 12, maxAge: 17 },
    weight: 1.5,
    text: (ctx) =>
      `En plein contrôle, la chaise de ${ami(ctx)} émet un bruit tout à fait regrettable. Vous vous regardez. C'est fini. Le fou rire dure dix minutes, vous êtes ${ctx.g('envoyés', 'envoyées')} dans le couloir, et vous continuez à rire dans le couloir. Des années plus tard, il suffira d'un regard pour recommencer.`,
    effects: { wellbeing: 4, social: 3, studyConditions: -1, closeness: { meilleur_ami: 5 } },
    memorable: true,
  },
];

// ---------------------------------------------------------------------------
// Jeune adulte (18-30)
// ---------------------------------------------------------------------------

const JEUNE_ADULTE: NarrativeEvent[] = [
  {
    id: 'enr_coloc',
    title: 'Les visites',
    domain: 'logement',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 18, maxAge: 27, notFlags: ['coloc'] },
    weight: (run) => (run.housing.withParents ? 3 : 1),
    text: `Douzième visite. Un studio sous les toits où l'on se cogne la tête, une file d'attente dans l'escalier, des dossiers épais comme des annuaires. On vous demande des fiches de paie, un garant, une lettre de motivation « pour se démarquer ». Ce soir, on vous propose aussi une chambre dans une colocation à trois.`,
    choices: [
      {
        id: 'coloc',
        label: 'La colocation',
        hint: 'Moins cher, plus vivant, moins tranquille.',
        effects: {
          monthlyExpenses: 420,
          social: 6,
          wellbeing: 2,
          setFlags: ['coloc'],
          housing: { tenure: 'locataire_prive', withParents: false },
          addPerson: [{ key: 'coloc', kind: 'ami', closeness: 50, ageOffset: 1, note: 'Ancienne colocation' }],
          schedule: [{ eventId: 'enr_prog_coloc_mariage', inYears: 7 }],
          outcome: 'Premier soir : une pizza sur des cartons, un débat interminable sur le planning de la vaisselle. Vous vous sentez chez vous.',
        },
      },
      {
        id: 'studio',
        label: "Continuer à chercher un studio rien qu'à vous",
        hint: "Son espace à soi, un loyer plus lourd.",
        effects: {
          monthlyExpenses: 600,
          wellbeing: 2,
          social: -2,
          housing: { tenure: 'locataire_prive', withParents: false },
          outcome: 'Vous finissez par signer pour un petit studio. Le silence du premier soir est délicieux, puis un peu vaste.',
        },
      },
      {
        id: 'attendre',
        label: 'Rester encore un peu chez vos parents',
        hint: "Mettre de côté, au prix d'un peu d'autonomie.",
        available: (run) => run.housing.withParents,
        effects: { savings: 1500, wellbeing: -3, closeness: { $parent: 2 }, outcome: "Vous mettez de côté. Vous supportez aussi les questions sur votre heure de retour." },
      },
    ],
  },
  {
    id: 'enr_rencontre',
    title: 'Une rencontre',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 19, maxAge: 45, notFlags: ['couple'] },
    weight: (run) => (run.age < 35 ? 3 : 1.5),
    maxOccurrences: 2,
    cooldown: 4,
    text: (ctx) =>
      `À une fête d'anniversaire où vous ne connaissez presque personne, vous passez la soirée à parler avec quelqu'un dans la cuisine, entre l'évier et les bouteilles vides. À deux heures du matin, vous êtes ${ctx.g('les derniers', 'les dernières')} debout et vous n'avez pas vu le temps passer.`,
    choices: [
      {
        id: 'revoir',
        label: 'Proposer de se revoir',
        hint: 'Prendre le risque.',
        resolve: (ctx, rng) =>
          rng.chance(0.6)
            ? {
                wellbeing: 8,
                social: 4,
                setFlags: ['couple'],
                clearFlags: ['separe'],
                addPerson: [{ key: 'partenaire', kind: 'partenaire', closeness: 70, ageOffset: rng.int(-4, 4), note: `Rencontre faite à ${ctx.place}` }],
                outcome: 'Le premier rendez-vous dure six heures. Le deuxième, le week-end entier. Quelque chose commence.',
              }
            : { wellbeing: -2, social: 2, outcome: "Vous vous revoyez deux fois. C'était bien, mais ce n'était pas ça. Vous restez en bons termes." },
      },
      {
        id: 'laisser',
        label: 'Garder ça comme une belle soirée',
        hint: 'Pas le bon moment.',
        effects: { wellbeing: 2, outcome: 'Une belle conversation, sans suite. Il en faut aussi.' },
      },
    ],
    memorable: true,
  },
  {
    id: 'enr_petition_locale',
    title: 'La ligne de bus',
    domain: 'citoyennete',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 18, maxAge: 70 },
    weight: 1.5,
    text: (ctx) =>
      `Une affichette scotchée à l'arrêt annonce que la ligne de bus qui dessert votre quartier de ${ctx.place} pourrait être supprimée. Des habitants lancent une pétition et organisent une réunion à la salle des fêtes. Une voisine vous tend le stylo : « On a besoin de monde jeudi. »`,
    choices: [
      {
        id: 'impliquer',
        label: 'Signer et venir à la réunion',
        hint: 'Des soirées, des tracts, des rencontres.',
        resolve: (_ctx, rng) =>
          rng.chance(0.4)
            ? { engagement: 8, social: 6, wellbeing: 4, setFlags: ['mobilisation_locale'], outcome: 'Après des semaines de réunions, la ligne est maintenue avec des horaires réduits. Une demi-victoire, et beaucoup de voisins que vous connaissez désormais par leur prénom.' }
            : { engagement: 6, social: 5, wellbeing: -2, setFlags: ['mobilisation_locale'], outcome: "La ligne ferme quand même. Mais le groupe d'habitants continue de se voir, et monte un covoiturage pour les plus âgés." },
      },
      {
        id: 'signer',
        label: 'Signer, sans plus',
        hint: 'Un geste, sans y passer ses soirées.',
        effects: { engagement: 2, outcome: "Vous signez. Vous suivez l'affaire de loin, sur le panneau de l'arrêt." },
      },
      {
        id: 'passer',
        label: 'Passer votre chemin',
        hint: 'Vous avez déjà assez à gérer.',
        effects: { wellbeing: 1, engagement: -2, outcome: "Vous avez d'autres priorités cette année. La pétition circule sans vous." },
      },
    ],
  },
  {
    id: 'enr_anniversaire_surprise',
    title: 'La surprise ratée',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 20, maxAge: 32 },
    weight: 1.5,
    text: (ctx) =>
      `Vos amis vous ont préparé un anniversaire surprise. Malheureusement, ${ami(ctx)} vous a envoyé par erreur le message destiné au groupe : « Ne dis RIEN, on arrive à 20 h avec le gâteau. » Vous passez donc la soirée à jouer la surprise avec un talent ${ctx.g("d'acteur", "d'actrice")} que vous ne vous connaissiez pas. Personne n'est dupe. Tout le monde s'en fiche. C'est une très bonne soirée.`,
    effects: { wellbeing: 5, social: 5, closeness: { meilleur_ami: 4 } },
  },
];

// ---------------------------------------------------------------------------
// Adulte (30-50)
// ---------------------------------------------------------------------------

const ADULTE: NarrativeEvent[] = [
  {
    id: 'enr_conflit_travail',
    title: 'Le nouveau responsable',
    domain: 'travail',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 26, maxAge: 58, notFlags: ['burnout'], when: isWorking },
    weight: 2,
    text: (ctx) =>
      `Depuis l'arrivée du nouveau responsable, les objectifs changent chaque lundi et les courriels arrivent à 22 heures. ${ctx.name('collegue', 'Nadia, une collègue,')} vous glisse à la machine à café : « Moi, je ne réponds plus après 19 h. Il fera ce qu'il voudra. » Ce soir, une nouvelle demande urgente vous attend.`,
    choices: [
      {
        id: 'tenir',
        label: 'Tenir le rythme',
        hint: "Montrer que vous êtes fiable. Mais jusqu'où ?",
        effects: {
          monthlyIncome: 60,
          wellbeing: -6,
          physical: -2,
          schedule: [{ eventId: 'enr_prog_burnout', inYears: 2 }],
          outcome: 'Vous répondez, encore et encore. On vous félicite en réunion. Vous dormez moins bien.',
        },
      },
      {
        id: 'limites',
        label: 'Poser des limites',
        hint: 'Ne plus répondre le soir, le dire clairement.',
        resolve: (_ctx, rng) =>
          rng.chance(0.6)
            ? { wellbeing: 4, outcome: "Le responsable fronce les sourcils, puis s'adapte. Vos soirées vous reviennent." }
            : { wellbeing: 1, social: -2, outcome: "L'ambiance se tend. Votre entretien annuel est plus froid que d'habitude. Mais vous dormez." },
      },
      {
        id: 'collectif',
        label: 'En parler collectivement avec les collègues',
        hint: 'Plus fort à plusieurs, plus exposé aussi.',
        resolve: (ctx) => ({
          engagement: 4,
          social: 3,
          wellbeing: 1,
          ...colleagueBond(ctx.run, 6),
          outcome: "Vous rédigez à plusieurs un message calme et précis. Rien ne change du jour au lendemain, mais vous n'êtes plus seuls à porter ça.",
        }),
      },
    ],
  },
  {
    id: 'enr_collegue',
    title: 'Le covoiturage',
    domain: 'travail',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 22, maxAge: 62, when: isWorking },
    weight: 1.5,
    text: (ctx) =>
      `${ctx.name('collegue', 'Nadia')}, qui habite à deux rues de chez vous, propose de faire le trajet ensemble. Les règles s'installent vite : celui ou celle qui conduit choisit la musique, l'autre a le droit de se plaindre. En quelques mois, vous avez parlé de tout, des enfants des autres au sens de la vie, en passant par la meilleure boulangerie du coin.`,
    resolve: (ctx) => ({
      monthlyExpenses: -40,
      social: 4,
      wellbeing: 2,
      ...colleagueBond(ctx.run, 8),
    }),
  },
  {
    id: 'enr_facture_energie',
    title: "L'hiver des factures",
    domain: 'argent',
    status: 'prospectif',
    kind: 'aleatoire',
    conditions: { minAge: 25, maxAge: 85, when: (run) => run.year >= 2027 && run.housing.tenure !== 'heberge' && !run.housing.withParents },
    weight: (run) => (run.household.percentile < 0.4 || run.finances.savings < 1000 ? 2 : 1),
    maxOccurrences: 2,
    cooldown: 8,
    text: (ctx) =>
      `Dans ce scénario hypothétique, cet hiver-là, les prix de l'énergie repartent à la hausse. Le courrier du fournisseur annonce une mensualité plus élevée. Dans votre logement de ${ctx.place}, il faut décider : le pull ou le radiateur.`,
    choices: [
      {
        id: 'baisser',
        label: 'Baisser le chauffage et mettre un pull',
        hint: 'Économiser, au prix du confort.',
        effects: { savings: 200, wellbeing: -3, physical: -2, outcome: 'La maison est fraîche, les plaids sont de sortie. La facture reste supportable.' },
      },
      {
        id: 'payer',
        label: 'Garder le chauffage et payer',
        hint: "Le confort, au prix de l'épargne.",
        effects: { savings: -450, monthlyExpenses: 30, outcome: 'Vous avez chaud. Votre compte en banque, un peu moins.' },
      },
      {
        id: 'isoler',
        label: 'Faire isoler les combles',
        hint: 'Une grosse dépense maintenant, moins de factures ensuite.',
        available: (run) => run.housing.tenure === 'proprietaire',
        effects: { savings: -3000, monthlyExpenses: -45, wellbeing: 2, outcome: "Une semaine de poussière et de bruit. L'hiver suivant, la différence se sent." },
      },
      {
        id: 'proprio',
        label: 'Écrire au propriétaire pour demander des travaux',
        hint: 'Ça peut marcher, ou pas.',
        available: (run) => run.housing.tenure === 'locataire_prive' || run.housing.tenure === 'locataire_social',
        resolve: (_ctx, rng) =>
          rng.chance(0.4)
            ? { monthlyExpenses: -25, wellbeing: 3, engagement: 2, outcome: 'Contre toute attente, des artisans passent changer les fenêtres au printemps.' }
            : { wellbeing: -2, engagement: 2, outcome: 'Une réponse polie et vague. Vous relancez. Vous calfeutrez en attendant.' },
      },
    ],
  },
  {
    id: 'enr_panne_voiture',
    title: 'La panne',
    domain: 'territoire',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 20, maxAge: 78, when: isCarDependent },
    weight: 2,
    maxOccurrences: 2,
    cooldown: 10,
    text: (ctx) =>
      `Un matin de novembre, la voiture refuse de démarrer. Autour de ${ctx.place}, sans voiture, il n'y a ni travail, ni courses, ni médecin. Le garagiste fait une moue qui ne dit rien de bon. En attendant la réparation, un voisin vous prête la sienne deux jours, et vous découvrez à quel point votre vie tient à quatre roues.`,
    resolve: (ctx, rng) => {
      const cost = rng.int(300, 1600);
      const fromSavings = Math.min(cost, Math.max(0, ctx.run.finances.savings));
      const missing = cost - fromSavings;
      return {
        savings: -fromSavings,
        debt: missing,
        wellbeing: -4,
        social: 2,
        outcome:
          missing > 0
            ? `La réparation coûte ${cost} €. Votre épargne ne suffit pas : il faut étaler le paiement.`
            : `La réparation coûte ${cost} €, prélevés sur votre épargne. Ça pique, mais la voiture repart.`,
      };
    },
  },
  {
    id: 'enr_separation',
    title: 'La fin de quelque chose',
    domain: 'famille',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 25, maxAge: 65, flags: ['couple'], notFlags: ['amour_tardif'] },
    weight: 1,
    sensitive: true,
    text: (ctx) =>
      `Avec ${ctx.name('partenaire', 'la personne qui partage votre vie')}, les conversations se sont raréfiées. On se croise dans la cuisine, on parle des courses${hasFlag(ctx.run, 'parent') ? ' et des enfants' : ''}, on ne se dit plus grand-chose d'autre. Un soir, l'un de vous deux finit par poser la question à voix haute : « Est-ce qu'on est encore heureux ensemble ? »`,
    softText: (ctx) =>
      `Votre couple avec ${ctx.name('partenaire', 'la personne qui partage votre vie')} traverse une période difficile. Une question se pose : continuer ensemble, ou non.`,
    choices: [
      {
        id: 'separer',
        label: 'Se séparer, calmement',
        hint: 'Une page qui se tourne, avec ce que ça coûte.',
        effects: {
          wellbeing: -6,
          social: -3,
          savings: -1200,
          monthlyExpenses: 250,
          clearFlags: ['couple'],
          setFlags: ['separe'],
          closeness: { partenaire: -25 },
          outcome: 'Il y a des cartons, des papiers, des week-ends étranges. Puis, petit à petit, une respiration nouvelle.',
        },
      },
      {
        id: 'therapie',
        label: 'Essayer une thérapie de couple',
        hint: "Du temps, de l'argent, et aucune garantie.",
        resolve: (_ctx, rng) =>
          rng.chance(0.5)
            ? { savings: -700, wellbeing: 4, closeness: { partenaire: 10 }, outcome: 'Les séances sont parfois rudes. Mais vous réapprenez à vous parler, et à rire ensemble.' }
            : {
                savings: -700,
                wellbeing: -4,
                clearFlags: ['couple'],
                setFlags: ['separe'],
                closeness: { partenaire: -15 },
                outcome: "Les séances vous aident surtout à vous quitter sans vous blesser. C'est déjà beaucoup.",
              },
      },
      {
        id: 'continuer',
        label: 'Laisser passer, voir venir',
        hint: 'Ne rien brusquer.',
        effects: { wellbeing: -3, closeness: { partenaire: -4 }, outcome: 'Vous laissez la question en suspens. La vie quotidienne reprend sa place, avec ce silence en plus.' },
      },
    ],
  },
  {
    id: 'enr_benevolat',
    title: 'Un coup de main',
    domain: 'citoyennete',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 25, maxAge: 72, notFlags: ['benevole'] },
    weight: (run) => (hasFlag(run, 'retraite') ? 2.5 : 1.5),
    text: (ctx) =>
      `À la sortie de la boulangerie de ${ctx.place}, une affiche cherche des bénévoles : l'épicerie solidaire du quartier manque de bras le samedi matin, et le club de foot des petits cherche quelqu'un pour accompagner les déplacements. Vous avez l'affiche en photo dans votre téléphone depuis une semaine.`,
    choices: [
      {
        id: 'epicerie',
        label: "L'épicerie solidaire",
        hint: 'Porter des cagettes, écouter les gens.',
        effects: {
          engagement: 7,
          social: 5,
          wellbeing: 3,
          physical: -1,
          setFlags: ['benevole', 'association'],
          membership: 'Épicerie solidaire du quartier',
          schedule: [{ eventId: 'enr_prog_benevolat_bilan', inYears: 4 }],
          outcome: "Le premier samedi, vous rangez les conserves à l'envers. Le troisième, des habitués vous appellent par votre prénom.",
        },
      },
      {
        id: 'foot',
        label: 'Le club de foot des petits',
        hint: 'Les week-ends au bord du terrain.',
        effects: {
          engagement: 5,
          social: 6,
          wellbeing: 4,
          setFlags: ['benevole', 'association'],
          membership: 'Club de foot de quartier',
          schedule: [{ eventId: 'enr_prog_benevolat_bilan', inYears: 4 }],
          outcome: 'Des goûters à préparer, des lacets à refaire, une équipe qui perd avec enthousiasme. Vous adorez.',
        },
      },
      {
        id: 'pas_maintenant',
        label: 'Pas maintenant',
        hint: 'Votre temps est déjà compté.',
        effects: { wellbeing: 1, outcome: "Vous supprimez la photo. Ce n'est pas le moment, et ce n'est pas grave." },
      },
    ],
  },
  {
    id: 'enr_greve',
    title: 'Le préavis',
    domain: 'travail',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 20, maxAge: 63, jobStatus: ['emploi'] },
    weight: (run) => (hasFlag(run, 'syndicat') ? 2.5 : 1.2),
    maxOccurrences: 2,
    cooldown: 8,
    text: (ctx) =>
      `Dans votre entreprise, un mouvement de grève est annoncé pour jeudi, à propos des horaires et des salaires. ${ctx.name('collegue', 'Une collègue')} distribue des tracts devant l'entrée. Votre responsable fait savoir qu'elle « compte sur tout le monde ». Vous avez un loyer à payer et des convictions, pas forcément dans cet ordre.`,
    choices: [
      {
        id: 'greve',
        label: 'Faire grève jeudi',
        hint: 'Une journée de salaire en moins, de la solidarité en plus.',
        resolve: (ctx) => ({
          savings: -80,
          engagement: 6,
          social: 4,
          ...colleagueBond(ctx.run, 5),
          outcome: "Devant les grilles, il fait froid et quelqu'un a apporté du café dans un thermos. Vous découvrez des collègues que vous ne connaissiez que de vue.",
        }),
      },
      {
        id: 'travailler',
        label: 'Aller travailler',
        hint: 'Garder votre journée, au prix de quelques regards.',
        effects: { wellbeing: -1, social: -2, outcome: "Les bureaux sont à moitié vides. Vous avancez sur vos dossiers. Le lendemain, à la machine à café, l'ambiance est un peu particulière." },
      },
      {
        id: 'caisse',
        label: 'Travailler, mais donner à la caisse de grève',
        hint: 'Un entre-deux qui ne satisfait personne complètement.',
        effects: { savings: -40, engagement: 2, outcome: "Vous glissez un billet dans l'enveloppe qui circule. On vous remercie d'un signe de tête." },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 50-70 ans
// ---------------------------------------------------------------------------

const MATURITE: NarrativeEvent[] = [
  {
    id: 'enr_maladie_proche',
    title: 'Le coup de téléphone',
    domain: 'sante',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 45, maxAge: 70, notFlags: ['aidant'], when: (run) => hasLiving(run, 'parent') },
    weight: (run) => (run.age >= 55 ? 2 : 1),
    sensitive: true,
    text: (ctx) =>
      `Un mardi soir, le téléphone sonne. ${ctx.name('$parent', 'Votre parent')} a fait une chute à la maison et va rester quelque temps à l'hôpital. Les médecins parlent d'un retour possible à domicile, mais pas sans aide, pas comme avant. Il va falloir s'organiser.`,
    softText: (ctx) =>
      `${ctx.name('$parent', 'Votre parent')} a des problèmes de santé et aura besoin d'aide au quotidien. Il faut s'organiser.`,
    choices: [
      {
        id: 'aidant',
        label: "Vous en occuper vous-même",
        hint: 'Être présent, au prix de votre temps et de votre fatigue.',
        effects: {
          setFlags: ['aidant'],
          closeness: { $parent: 10 },
          wellbeing: -5,
          physical: -3,
          social: -3,
          monthlyIncome: -150,
          outcome: 'Les week-ends deviennent des allers-retours, les soirées des listes de médicaments. Il y a aussi des moments très doux, des souvenirs racontés pour la première fois.',
        },
      },
      {
        id: 'aide',
        label: 'Organiser une aide à domicile',
        hint: "Un coût, un relais, et une culpabilité que vous n'avez pas à porter.",
        effects: {
          savings: -2500,
          closeness: { $parent: 3 },
          wellbeing: -1,
          outcome: 'Une auxiliaire passe chaque matin. Vous venez le dimanche, pour parler plutôt que pour faire.',
        },
      },
      {
        id: 'fratrie',
        label: 'Partager avec la fratrie',
        hint: "Se répartir les tâches. Ou découvrir qu'on ne voit pas les choses pareil.",
        available: (run) => hasLiving(run, 'fratrie'),
        resolve: (_ctx, rng) =>
          rng.chance(0.6)
            ? { setFlags: ['aidant'], closeness: { $parent: 6, $fratrie: 8 }, wellbeing: -2, outcome: 'Un tableau partagé, des appels le dimanche soir. Cette épreuve vous rapproche.' }
            : { setFlags: ['aidant'], closeness: { $parent: 6, $fratrie: -8 }, wellbeing: -4, outcome: 'Les vieilles rancunes refont surface autour du planning. Vous y arrivez quand même, tant bien que mal.' },
      },
    ],
  },
  {
    id: 'enr_deuil',
    title: 'Le dernier hiver',
    domain: 'famille',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 50, maxAge: 80, when: (run) => hasLiving(run, 'parent') },
    weight: (run) => (hasFlag(run, 'aidant') ? 3 : 1),
    sensitive: true,
    memorable: true,
    text: (ctx) =>
      `La vie de ${ctx.name('$parent', 'votre parent')} s'est achevée cet hiver, paisiblement, après de longues années. Il y a eu la cérémonie, les cousins qu'on ne voit qu'aux enterrements, les papiers à remplir. Et puis, des semaines plus tard, ce moment absurde au supermarché, devant un paquet de biscuits que ${ctx.name('$parent', 'votre parent')} aimait, où tout remonte d'un coup. Personne ne vous en veut de pleurer devant le rayon.`,
    softText: (ctx) =>
      `${ctx.name('$parent', 'Votre parent')} est décédé cet hiver. Le deuil prend du temps, et c'est normal.`,
    effects: { personDies: '$parent', wellbeing: -8, social: 2, clearFlags: ['aidant'] },
  },
  {
    id: 'enr_petits_enfants',
    title: 'Le mercredi des petits',
    domain: 'famille',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 50, maxAge: 80, flags: ['parent'], notFlags: ['grand_parent'] },
    weight: 2,
    text: (ctx) =>
      `${ctx.name('enfant1', 'Votre enfant')} vous appelle : « Tu pourrais garder les petits le mercredi ? La garde nous coûte une fortune et ils t'adorent. » Vous regardez votre agenda, votre dos, et la photo des petits sur le frigo.`,
    choices: [
      {
        id: 'chaque_mercredi',
        label: 'Tous les mercredis',
        hint: 'Des journées pleines, des genoux fatigués.',
        effects: {
          setFlags: ['grand_parent'],
          closeness: { enfant1: 8 },
          wellbeing: 6,
          social: 4,
          physical: -3,
          outcome: "Crêpes, devoirs, square, dessins animés. Vous rentrez avec la fatigue et le bonheur des grandes journées. Vous découvrez qu'on peut perdre à cache-cache contre quelqu'un de quatre ans.",
        },
      },
      {
        id: 'depanner',
        label: 'Dépanner de temps en temps',
        hint: 'Être là sans y passer toute la semaine.',
        effects: { setFlags: ['grand_parent'], closeness: { enfant1: 3 }, wellbeing: 3, outcome: "Vous devenez la personne qu'on appelle quand tout s'écroule. Ça vous va bien." },
      },
      {
        id: 'non',
        label: 'Dire non, gentiment',
        hint: 'Garder votre temps, assumer de décevoir.',
        effects: { setFlags: ['grand_parent'], closeness: { enfant1: -4 }, wellbeing: 2, outcome: 'Il y a un petit silence au téléphone. Puis ça passe. Vous les voyez le dimanche, et ces dimanches sont précieux.' },
      },
    ],
  },
  {
    id: 'enr_rencontre_tardive',
    title: 'La chorale',
    domain: 'relations',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 50, maxAge: 85, notFlags: ['couple', 'amour_tardif'] },
    weight: (run) => (hasFlag(run, 'separe') ? 2 : 1),
    text: (ctx) =>
      `À la chorale de ${ctx.place}, vous chantez à côté de quelqu'un qui chante aussi faux que vous, avec le même aplomb. Après la répétition, vous prenez un café, puis un autre la semaine suivante. Un jour, on vous propose une balade au bord de l'eau, « juste comme ça ». Vous vous surprenez à choisir votre tenue avec soin.`,
    choices: [
      {
        id: 'oui',
        label: 'Accepter la balade',
        hint: "À votre âge, on sait ce qu'on veut. Ou pas.",
        resolve: (_ctx, rng) =>
          rng.chance(0.6)
            ? {
                wellbeing: 8,
                social: 5,
                setFlags: ['couple', 'amour_tardif'],
                addPerson: [{ key: 'amour_tardif', kind: 'partenaire', closeness: 65, ageOffset: rng.int(-6, 6), note: 'Rencontre faite à la chorale' }],
                outcome: "Vous ne vivez pas ensemble, vous ne le souhaitez pas. Mais il y a désormais quelqu'un à qui raconter votre journée, et ça change tout.",
              }
            : { wellbeing: 2, social: 3, outcome: 'Une belle amitié, finalement. Vous continuez à chanter faux côte à côte, avec un enthousiasme intact.' },
      },
      {
        id: 'amitie',
        label: 'Garder ça amical',
        hint: 'Votre vie vous plaît comme elle est.',
        effects: { social: 3, wellbeing: 2, outcome: 'Le café du jeudi devient un rendez-vous fixe. Sans promesses, sans attentes.' },
      },
    ],
    memorable: true,
  },
];

// ---------------------------------------------------------------------------
// Grand âge (70+)
// ---------------------------------------------------------------------------

const GRAND_AGE: NarrativeEvent[] = [
  {
    id: 'enr_dimanche_silencieux',
    title: 'Le dimanche',
    domain: 'vieillesse',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 70 },
    weight: (run) => (run.social < 45 ? 3 : 1),
    maxOccurrences: 2,
    cooldown: 6,
    text: `Dimanche après-midi. Le téléphone n'a pas sonné depuis jeudi. La radio parle toute seule dans la cuisine. Par la fenêtre, vous regardez les gens passer et vous vous demandez à quel moment les journées sont devenues si longues.`,
    choices: [
      {
        id: 'appeler',
        label: (ctx) => `Appeler ${ami(ctx)}`,
        hint: "Peut-être que l'autre attend aussi un coup de fil.",
        resolve: (_ctx, rng) =>
          rng.chance(0.7)
            ? { social: 6, wellbeing: 5, closeness: { meilleur_ami: 6 }, outcome: "« J'allais justement t'appeler ! » Vous parlez une heure et demie, de tout et de rien, surtout de rien." }
            : { social: 1, wellbeing: -1, outcome: 'Ça sonne dans le vide. Vous laissez un message. Le rappel arrive le mardi, et il fait du bien.' },
      },
      {
        id: 'club',
        label: 'Aller voir le club du troisième âge',
        hint: 'Des inconnus, des cartes, des gâteaux secs.',
        effects: { social: 6, wellbeing: 3, physical: 1, outcome: "Vous y allez en traînant les pieds. Vous en revenez avec un partenaire de belote et une invitation au loto de Pâques." },
      },
      {
        id: 'calme',
        label: 'Profiter du calme',
        hint: "La solitude n'est pas toujours un manque.",
        effects: { wellbeing: 1, social: -3, outcome: "Vous faites des mots croisés au soleil. Certains jours, le silence est une compagnie. D'autres, moins." },
      },
    ],
  },
  {
    id: 'enr_transmission',
    title: 'Ce qui reste',
    domain: 'vieillesse',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 70 },
    weight: 1.5,
    text: `En rangeant un placard, vous tombez sur des choses qui ont traversé votre vie : des photos sans légende, un carnet de recettes taché, de vieux outils, des lettres. Ce serait dommage que tout ça parte un jour dans une benne, sans que personne sache ce que c'était.`,
    choices: [
      {
        id: 'ecrire',
        label: 'Écrire vos souvenirs dans un cahier',
        hint: 'Des heures en tête-à-tête avec votre mémoire.',
        effects: { wellbeing: 5, social: -1, setFlags: ['memoires_ecrites'], outcome: 'Les pages se remplissent : les maisons, les visages, les années. Certaines anecdotes vous font rire aux éclats.' },
      },
      {
        id: 'petits',
        label: 'Apprendre une recette ou un savoir-faire aux petits-enfants',
        hint: 'Il faudra de la patience, de part et d\'autre.',
        available: (run) => hasFlag(run, 'grand_parent') || hasFlag(run, 'parent'),
        effects: { wellbeing: 6, social: 5, closeness: { enfant1: 4 }, outcome: 'La cuisine finit couverte de farine. Le résultat est discutable. Le souvenir, lui, est parfait.' },
      },
      {
        id: 'donner',
        label: 'Donner les objets à une association',
        hint: "Qu'ils servent encore à quelqu'un.",
        effects: { engagement: 3, wellbeing: 3, social: 2, outcome: "Les outils partent à la ressourcerie du coin. Vous imaginez quelqu'un, quelque part, réparer une étagère avec votre vieux rabot." },
      },
    ],
    memorable: true,
  },
  {
    id: 'enr_tablette',
    title: 'La visio',
    domain: 'vieillesse',
    status: 'fictif',
    kind: 'aleatoire',
    conditions: { minAge: 70 },
    weight: 1.5,
    text: (ctx) =>
      `On vous a offert une tablette pour « faire des visios ». Le premier appel dure vingt minutes, dont quinze où la famille ne voit que votre plafond, puis votre oreille, puis votre front en très gros plan. « Tu nous entends ? » « Je vous entends, mais je ne vous vois pas, vous êtes tout petits ! » À la fin, tout le monde rit, et vous êtes ${ctx.g('assez fier', 'assez fière')} d'avoir réussi à raccrocher sans aide.`,
    effects: { social: 4, wellbeing: 4 },
  },
];

// ---------------------------------------------------------------------------
// Événements programmés (déclenchés UNIQUEMENT par `schedule`)
// ---------------------------------------------------------------------------

const PROGRAMMES: NarrativeEvent[] = [
  {
    id: 'enr_prog_voisin_boite',
    title: 'La boîte de dames',
    domain: 'relations',
    status: 'fictif',
    kind: 'programme',
    conditions: { flags: ['lien_voisin_age'] },
    sensitive: true,
    memorable: true,
    text: (ctx) =>
      `Cet hiver, la vie de ${ctx.name('voisin_age', 'votre voisin du rez-de-chaussée')} s'est achevée, à un âge très avancé. Quelques jours plus tard, une nièce que vous n'aviez jamais vue sonne chez vous avec une boîte en bois : le jeu de dames. Dedans, un papier plié en quatre : « Pour mon adversaire ${ctx.g('préféré', 'préférée')}. Tu trichais un peu, mais je faisais semblant de ne pas voir. »`,
    softText: (ctx) =>
      `${ctx.name('voisin_age', 'Votre voisin du rez-de-chaussée')}, votre partenaire de dames, nous a quittés. Sa famille vous remet en souvenir le jeu de vos mercredis.`,
    effects: { personDies: 'voisin_age', wellbeing: -4, social: 2, engagement: 2, outcome: 'La boîte de dames ne quittera plus jamais votre étagère.' },
  },
  {
    id: 'enr_prog_retrouvailles_ami',
    title: 'Le pacte',
    domain: 'relations',
    status: 'fictif',
    kind: 'programme',
    conditions: { flags: ['pacte_cabane'] },
    memorable: true,
    text: (ctx) =>
      `Un message arrive, d'un numéro inconnu : « Le terrain vague. La boîte en fer. Samedi, 15 h. Tu te souviens ? » C'est ${ami(ctx)}. Quarante ans ont passé. Le terrain vague est devenu un parking, mais la grosse pierre est toujours au coin.`,
    choices: [
      {
        id: 'y_aller',
        label: 'Y aller',
        hint: "Retrouver quelqu'un qu'on a connu enfant.",
        resolve: (_ctx, rng) => ({
          social: 7,
          wellbeing: 7,
          closeness: { meilleur_ami: 15 },
          outcome: rng.chance(0.5)
            ? "La boîte est là, rouillée. Le cahier est illisible, sauf vos deux signatures. Vous restez jusqu'à la nuit, assis sur le capot d'une voiture, à rire comme en classe."
            : "La boîte a disparu depuis longtemps. Ça n'a aucune importance. Vous parlez trois heures, et vous vous promettez de ne plus attendre quarante ans.",
        }),
      },
      {
        id: 'repondre',
        label: 'Répondre, mais ne pas y aller',
        hint: 'Le souvenir est peut-être plus beau que la réalité.',
        effects: { wellbeing: 1, closeness: { meilleur_ami: 2 }, outcome: 'Vous échangez quelques messages pleins de tendresse. Le pacte reste un souvenir, intact.' },
      },
    ],
  },
  {
    id: 'enr_prog_amour_ado',
    title: 'Au rayon surgelés',
    domain: 'relations',
    status: 'fictif',
    kind: 'programme',
    conditions: { flags: ['amour_ado'] },
    text: (ctx) =>
      `Au supermarché, devant les surgelés, quelqu'un vous regarde avec insistance. Il vous faut quelques secondes. ${ctx.name('amour_ado', 'Votre premier amour')}. Les cheveux ont changé, le rire non. « Ça alors… Tu te souviens du collège ? »`,
    choices: [
      {
        id: 'cafe',
        label: 'Proposer un café',
        hint: 'Rouvrir une vieille page.',
        resolve: (ctx, rng) =>
          rng.chance(0.65)
            ? { wellbeing: 5, social: 4, closeness: { amour_ado: 15 }, outcome: "Vous parlez de vos vies respectives, des profs, de ce que vous étiez. Vous riez de l'histoire de la gomme. C'est doux, et ça suffit." }
            : {
                wellbeing: hasFlag(ctx.run, 'couple') ? -2 : 1,
                closeness: { amour_ado: 3 },
                outcome: "La conversation est polie, un peu maladroite. Vous avez beaucoup changé. Le souvenir était plus grand que la personne, et c'est très bien comme ça.",
              },
      },
      {
        id: 'sourire',
        label: 'Échanger trois mots et un sourire',
        hint: 'Laisser le passé où il est.',
        effects: { wellbeing: 2, outcome: 'Vous vous souhaitez une bonne journée. Sur le parking, vous souriez en rangeant les courses.' },
      },
    ],
  },
  {
    id: 'enr_prog_coloc_mariage',
    title: 'Le faire-part',
    domain: 'relations',
    status: 'fictif',
    kind: 'programme',
    conditions: { flags: ['coloc'] },
    text: (ctx) =>
      `Un faire-part arrive par la poste : ${ctx.name('coloc', 'votre ancienne colocation')} fête son mariage, et vous a ${ctx.g('placé', 'placée')} à la table d'honneur, « parce que tu es la seule personne à avoir supporté mes chaussettes pendant deux ans ». Le soir de la fête, vous racontez l'histoire de la vaisselle à tout le monde. Personne ne trouve ça aussi drôle que vous deux.`,
    effects: { social: 5, wellbeing: 5, savings: -150, closeness: { coloc: 10 } },
  },
  {
    id: 'enr_prog_burnout',
    title: 'Le matin où ça lâche',
    domain: 'sante',
    status: 'fictif',
    kind: 'programme',
    conditions: { notFlags: ['burnout'] },
    sensitive: true,
    memorable: true,
    text: (ctx) =>
      `Un lundi matin, devant la porte du bureau, vous n'arrivez plus à entrer. Ça ne fait pas mal, c'est juste impossible. Vous restez une heure dans votre voiture. ${ctx.g('Épuisé', 'Épuisée')}, vous finissez par consulter. Le médecin parle d'épuisement professionnel, et vous dit une phrase que vous n'attendiez pas : « Ce n'est pas un manque de volonté. C'est que vous en avez porté trop, trop longtemps. »`,
    softText: `Une grande fatigue liée au travail vous empêche de continuer comme avant. Le médecin vous conseille de vous arrêter.`,
    choices: [
      {
        id: 'arret',
        label: "Accepter l'arrêt et prendre le temps",
        hint: "S'arrêter, sans savoir combien de temps.",
        effects: {
          setFlags: ['burnout'],
          wellbeing: 4,
          physical: 3,
          monthlyIncome: -100,
          social: -2,
          outcome: 'Les premières semaines, vous dormez. Puis vous marchez. Petit à petit, des envies reviennent. Le retour au travail se fera, plus tard, autrement.',
        },
      },
      {
        id: 'temps_partiel',
        label: 'Demander à réduire votre temps de travail',
        hint: "Moins de revenus, plus d'air.",
        effects: { setFlags: ['burnout'], monthlyIncome: -250, wellbeing: 3, outcome: 'Vos vendredis vous appartiennent. Votre salaire baisse ; votre tension aussi.' },
      },
      {
        id: 'entourage',
        label: 'En parler à vos proches avant de décider',
        hint: 'Ne pas porter ça en silence.',
        effects: { setFlags: ['burnout'], social: 5, wellbeing: 2, closeness: { meilleur_ami: 6 }, outcome: "Vos proches vous écoutent sans juger. Ça ne règle rien tout de suite, mais vous ne portez plus ça en silence." },
      },
    ],
  },
  {
    id: 'enr_prog_benevolat_bilan',
    title: 'Quatre ans plus tard',
    domain: 'citoyennete',
    status: 'fictif',
    kind: 'programme',
    conditions: { flags: ['benevole'] },
    text: `Le samedi matin, ça fait maintenant quatre ans. On vous propose de rejoindre le bureau de l'association : la trésorerie, les réunions, les dossiers de subvention. Il faut quelqu'un, et tout le monde pense à vous.`,
    choices: [
      {
        id: 'bureau',
        label: 'Accepter de prendre des responsabilités',
        hint: "Plus d'influence, plus de soirées.",
        effects: { engagement: 8, social: 4, wellbeing: -2, mandate: { label: "Membre du bureau d'une association", years: 4 }, outcome: 'Vous découvrez le monde merveilleux des tableurs et des assemblées générales. Et aussi le plaisir de faire avancer les choses.' },
      },
      {
        id: 'rester',
        label: 'Rester bénévole « de terrain »',
        hint: 'Garder ce qui vous plaît.',
        effects: { wellbeing: 3, social: 2, outcome: "Vous continuez les samedis, les cagettes, les cafés. C'est là que vous vous sentez utile." },
      },
      {
        id: 'pause',
        label: 'Faire une pause',
        hint: 'Vous avez beaucoup donné.',
        effects: { wellbeing: 2, engagement: -3, clearFlags: ['benevole'], outcome: 'On vous remercie chaleureusement. Vous savez que la porte reste ouverte.' },
      },
    ],
  },
];

export const ENRICHMENT_EVENTS: NarrativeEvent[] = [
  ...PETITE_ENFANCE,
  ...ENFANCE,
  ...ADOLESCENCE,
  ...JEUNE_ADULTE,
  ...ADULTE,
  ...MATURITE,
  ...GRAND_AGE,
  ...PROGRAMMES,
];

import { ALL_EVENTS, getEvent } from '../data/events';
import { canHoldJob, educationRank, getJob, JOBS } from '../data/jobs';
import { DATA_VERSION } from '../data/sources';
import { drawBirth } from './demography';
import { economyYear } from './economy';
import { deathProbability } from './mortality';
import { addTimeline, applyConsequence, buildPending, clamp, eventWeight, isEligible, makeContext, mergeConsequences, renderText } from './narrative';
import type { EventConsequence, NarrativeEvent } from './narrative-types';
import { Rng } from './rng';
import type { Settings, SimulationRun } from './types';

/**
 * Moteur temporel et boucle de simulation.
 *
 * API pure : chaque fonction reçoit une partie et renvoie une NOUVELLE partie.
 * L'interface n'a donc aucun moyen de modifier l'état deux fois en se
 * réaffichant, et tout le hasard passe par l'état `rngState`.
 */

export const ENGINE_VERSION = '0.2.0';
export const DEFAULT_SETTINGS: Settings = { format: 'standard', softMode: false, autoMode: false, explore: true };

/** Probabilité qu'une année « ordinaire » contienne un événement aléatoire (rythme de jeu). */
const RANDOM_EVENT_RATE: Record<Settings['format'], number> = { rapide: 0.3, standard: 0.48, immersif: 0.68 };

const clone = (run: SimulationRun): SimulationRun => JSON.parse(JSON.stringify(run)) as SimulationRun;

export function createRun(seed: number, settings: Settings = DEFAULT_SETTINGS, options: { cityId?: string } = {}): SimulationRun {
  const rng = new Rng(seed);
  const birth = drawBirth(rng, options.cityId);
  const h = birth.household;
  const parentEducation = Math.max(...h.parents.map((p) => educationRank(p.education)));
  const run: SimulationRun = {
    engineVersion: ENGINE_VERSION,
    dataVersion: DATA_VERSION,
    id: `vie-${seed.toString(36)}`,
    seed,
    rngState: 0,
    startedAt: new Date().toISOString(),
    citizen: birth.citizen,
    household: h,
    age: 0,
    year: birth.citizen.birthYear,
    finances: { monthlyIncome: 0, monthlyExpenses: 0, savings: 0, debt: 0, estimated: true },
    health: { physical: clamp(Math.round(82 + rng.normal() * 6)), wellbeing: 70, autonomy: 'complete' },
    social: h.supportNetwork,
    // Conditions d'étude : règle de démonstration combinant ressources et soutien, avec une large part de hasard.
    education: {
      status: 'non_scolarise',
      level: 'aucun',
      conditions: clamp(Math.round(40 + h.percentile * 20 + parentEducation * 3 + (h.supportNetwork - 50) * 0.2 + rng.normal() * 12)),
      milestones: [],
    },
    employment: { status: 'enfant', jobs: [], unemploymentSpells: 0 },
    housing: { tenure: h.tenure, place: birth.citizen.birthPlace, territory: birth.citizen.territory, withParents: true },
    civic: { engagement: clamp(Math.round(20 + rng.normal() * 8)), memberships: [], votesCast: 0, abstentions: 0, mandates: [] },
    people: [
      ...birth.parents.map((p) => ({
        id: p.key,
        name: p.name,
        kind: 'parent' as const,
        closeness: clamp(Math.round(78 + rng.normal() * 8)),
        bornYear: birth.citizen.birthYear - p.ageOffset,
        alive: true,
        sex: p.sex,
      })),
      ...birth.siblings.map((s) => ({
        id: s.key,
        name: s.name,
        kind: 'fratrie' as const,
        closeness: clamp(Math.round(65 + rng.normal() * 12)),
        bornYear: birth.citizen.birthYear - s.ageOffset,
        alive: true,
      })),
    ],
    flags: {},
    fired: {},
    lastFiredAge: {},
    scheduled: [],
    pending: null,
    timeline: [],
    choices: [],
    residences: [birth.citizen.birthPlace],
    alive: true,
    settings: { ...settings },
    nextId: 0,
  };
  const c = run.citizen;
  addTimeline(run, {
    title: 'Naissance',
    text: `${c.firstName} ${c.lastName} ${c.sex === 'F' ? 'est née' : 'est né'} en ${c.birthYear} à ${c.birthPlace}. Cette année-là, environ 645 000 enfants sont nés en France.`,
    domain: 'famille',
    status: 'statistique',
    sourceIds: ['insee-naissances-2025'],
    memorable: true,
  });
  processEvents(run, rng, false);
  run.rngState = rng.current;
  return run;
}

// ---------------------------------------------------------------------------
// Avancer d'une année
// ---------------------------------------------------------------------------

export function step(input: SimulationRun): SimulationRun {
  if (!input.alive || input.pending) return input;
  const run = clone(input);
  const rng = new Rng(run.rngState);
  run.age += 1;
  run.year += 1;

  schoolTransitions(run);
  laborMarket(run, rng);
  updateEconomy(run);
  healthDrift(run, rng);
  sideCharacters(run, rng);

  if (rng.chance(deathProbability(run.age, run.citizen.sex, run.health.physical))) {
    die(run);
  } else {
    processEvents(run, rng, true);
  }
  run.rngState = rng.current;
  return run;
}

/** Avance jusqu'à la prochaine décision ou la fin de vie (utilisé par les tests et l'accélération). */
export function stepUntilPause(run: SimulationRun, maxYears = 200): SimulationRun {
  let r = run;
  for (let i = 0; i < maxYears && r.alive && !r.pending; i++) r = step(r);
  return r;
}

function schoolTransitions(run: SimulationRun) {
  const e = run.education;
  const lawNote = run.year > 2026 ? ' (règle de 2026, supposée inchangée)' : '';
  if (run.age === 3) {
    e.status = 'maternelle';
    addTimeline(run, {
      title: "Première rentrée à l'école maternelle",
      text: `L'instruction est obligatoire dès 3 ans en France${lawNote}. Un cartable trop grand, un doudou caché dans la poche.`,
      domain: 'ecole',
      status: run.year > 2026 ? 'prospectif' : 'verifie',
      sourceIds: ['code-education-instruction-obligatoire'],
      memorable: false,
    });
  } else if (run.age === 6) {
    e.status = 'elementaire';
    addTimeline(run, { title: 'Entrée au CP', text: 'Les lettres deviennent des mots. Les mots, des histoires.', domain: 'ecole', status: 'fictif', sourceIds: [], memorable: false });
  } else if (run.age === 11) {
    e.status = 'college';
    addTimeline(run, { title: 'Entrée au collège', text: 'Un emploi du temps, des professeurs différents à chaque heure, et le sentiment de grandir.', domain: 'ecole', status: 'fictif', sourceIds: [], memorable: false });
  }
}

/**
 * Transitions sur le marché du travail. PARAMÈTRES DE DÉMONSTRATION :
 * risque annuel de perte d'emploi et chance annuelle de retrouver un poste.
 * Le taux de chômage observé (Insee) est affiché comme repère mais n'est pas
 * utilisé comme probabilité individuelle.
 */
function laborMarket(run: SimulationRun, rng: Rng) {
  const emp = run.employment;
  if (emp.status === 'emploi') {
    const job = emp.jobId ? getJob(emp.jobId) : undefined;
    const risk = 0.025 + (job?.sector === 'public' ? -0.015 : 0.01) + (educationRank(run.education.level) <= 1 ? 0.015 : 0);
    if (run.age < 62 && rng.chance(risk)) {
      emp.status = 'chomage';
      emp.unemploymentSpells += 1;
      emp.since = run.age;
      addTimeline(run, {
        title: 'Perte d\'emploi',
        text: `Le poste de ${emp.jobLabel ?? 'travail'} s'arrête : fin de contrat, réorganisation. Les semaines changent de forme.`,
        domain: 'travail',
        status: 'modele',
        sourceIds: ['insee-chomage-t2-2026'],
        memorable: true,
      });
      run.health.wellbeing = clamp(run.health.wellbeing - 8);
    }
  } else if (emp.status === 'chomage') {
    const duration = emp.since !== undefined ? run.age - emp.since : 0;
    if (duration >= 2) run.flags.chomage_long ??= run.age;
    const chance = 0.42 + educationRank(run.education.level) * 0.07 + (run.social - 50) * 0.003 - (run.age > 55 ? 0.15 : 0);
    if (rng.chance(clamp(chance, 0.05, 0.95))) {
      const options = JOBS.filter((j) => canHoldJob(j, run.education.level, run.flags) && j.id !== 'createur_entreprise' && j.id !== 'agriculteur');
      // Préférence pour les emplois les plus qualifiés accessibles, sans exclure les autres.
      const job = rng.weighted(options, (j) => 1 + educationRank(j.minEducation) * 1.5);
      applyConsequence(run, { job: { jobId: job.id } }, rng);
      delete run.flags.chomage_long;
      addTimeline(run, {
        title: 'Retour à l\'emploi',
        text: `Un nouveau poste : ${run.employment.jobLabel}. Il faut réapprendre un trajet, des visages, des habitudes.`,
        domain: 'travail',
        status: 'modele',
        sourceIds: [],
        memorable: false,
      });
      run.health.wellbeing = clamp(run.health.wellbeing + 6);
    }
  }
}

function updateEconomy(run: SimulationRun) {
  if (run.employment.status === 'enfant') return;
  const y = economyYear(run);
  const f = run.finances;
  f.monthlyIncome = y.income;
  f.monthlyExpenses = y.expenses;
  const balance = 12 * (y.income - y.spent);
  f.savings += balance;
  // Intérêts de la dette (3 %/an, démonstration) puis remboursement depuis l'épargne.
  f.debt = Math.round(f.debt * 1.03);
  if (f.savings < 0) {
    f.debt += -f.savings;
    f.savings = 0;
  }
  if (f.debt > 0 && f.savings > 0) {
    const pay = Math.min(f.debt, f.savings);
    f.debt -= pay;
    f.savings -= pay;
  }
  f.savings = Math.round(f.savings);
  if (y.shortfall > 0) {
    run.flags.fins_de_mois_difficiles ??= run.age;
    run.health.wellbeing = clamp(run.health.wellbeing - Math.min(8, 2 + y.shortfall / 120));
  } else {
    delete run.flags.fins_de_mois_difficiles;
  }
}

/** Évolution de la santé et du bien-être de jeu. RÈGLES DE GAMEPLAY non calibrées. */
function healthDrift(run: SimulationRun, rng: Rng) {
  const h = run.health;
  const job = run.employment.jobId ? getJob(run.employment.jobId) : undefined;
  const strain = run.employment.status === 'emploi' || run.employment.status === 'independant' ? (job?.strain ?? 1) : 0;
  let drift: number;
  if (run.age < 18) drift = (85 - h.physical) * 0.15;
  else if (run.age < 50) drift = -0.15 - strain * 0.2;
  else drift = -(0.35 + (run.age - 50) * 0.035) - strain * 0.3;
  h.physical = clamp(h.physical + drift + rng.normal() * 1.4);

  const baseline = 58 + (run.social - 50) * 0.3 + (run.flags.fins_de_mois_difficiles !== undefined ? -8 : 0) + (run.employment.status === 'chomage' ? -6 : 0);
  h.wellbeing = clamp(h.wellbeing + (baseline - h.wellbeing) * 0.15 + rng.normal() * 2.5);

  if (run.age > 75) run.social = clamp(run.social - 0.6);
  run.social = clamp(run.social + (55 - run.social) * 0.03);

  const before = h.autonomy;
  h.autonomy = run.age >= 70 && h.physical < 20 ? 'dependance' : run.age >= 65 && h.physical < 38 ? 'aide_partielle' : 'complete';
  if (before !== h.autonomy && h.autonomy !== 'complete') {
    addTimeline(run, {
      title: h.autonomy === 'dependance' ? 'Besoin d\'aide au quotidien' : 'Les gestes deviennent plus lents',
      text:
        h.autonomy === 'dependance'
          ? 'Se lever, se laver, sortir : les journées demandent désormais l\'aide de quelqu\'un.'
          : 'Les escaliers, les courses lourdes : certaines choses demandent maintenant un coup de main.',
      domain: 'vieillesse',
      status: 'modele',
      sourceIds: [],
      memorable: true,
    });
  }
}

/** Vieillissement et décès des proches (même modèle de mortalité, santé moyenne supposée). */
function sideCharacters(run: SimulationRun, rng: Rng) {
  for (const p of run.people) {
    if (!p.alive) continue;
    const age = run.year - p.bornYear;
    if (age < 45) continue;
    if (rng.chance(deathProbability(age, p.sex ?? (rng.chance(0.5) ? 'F' : 'M'), 62))) {
      p.alive = false;
      const soft = run.settings.softMode;
      const rel = p.kind === 'parent' ? 'Votre parent' : p.kind === 'partenaire' ? 'La personne qui partageait votre vie,' : p.kind === 'fratrie' ? 'De votre fratrie,' : 'Un proche,';
      addTimeline(run, {
        title: `Décès de ${p.name}`,
        text: soft
          ? `${rel} ${p.name}, nous a quittés. Le temps du deuil commence.`
          : `${rel} ${p.name}, est mort${p.sex === 'F' ? 'e' : ''} à ${age} ans. Les jours qui suivent ont une texture étrange, faite de papiers à remplir et de souvenirs qui reviennent.`,
        domain: 'famille',
        status: 'modele',
        sourceIds: ['insee-esperance-vie-2025'],
        memorable: p.closeness > 45,
      });
      const weight = p.closeness / 100;
      run.health.wellbeing = clamp(run.health.wellbeing - 14 * weight);
      run.social = clamp(run.social - 4 * weight);
      run.flags[`deuil_${p.kind}`] ??= run.age;
      if (p.kind === 'partenaire') {
        delete run.flags.couple;
        run.flags.veuvage ??= run.age;
      }
    }
  }
}

function die(run: SimulationRun) {
  run.alive = false;
  run.deathAge = run.age;
  run.deathYear = run.year;
  run.pending = null;
  run.scheduled = [];
  const near = run.people.filter((p) => p.alive && p.closeness > 50).map((p) => p.name);
  addTimeline(run, {
    title: 'Fin de vie',
    text:
      `${run.citizen.firstName} s'est éteint${run.citizen.sex === 'F' ? 'e' : ''} en ${run.year}, à ${run.age} ans.` +
      (near.length > 0 ? ` ${near.slice(0, 3).join(', ')} ${near.length > 1 ? 'étaient là' : 'était là'}.` : ''),
    domain: 'vieillesse',
    status: 'modele',
    sourceIds: ['insee-esperance-vie-2025'],
    memorable: true,
  });
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------

/**
 * Déclenche les événements dus : programmés, puis jalons, puis éventuellement
 * un événement aléatoire. S'arrête dès qu'une décision est en attente.
 */
function processEvents(run: SimulationRun, rng: Rng, allowRandom: boolean) {
  if (!run.alive) return;
  // 1. Conséquences différées.
  const due = run.scheduled.filter((s) => s.atAge <= run.age);
  run.scheduled = run.scheduled.filter((s) => s.atAge > run.age);
  for (const s of due) {
    const ev = getEvent(s.eventId);
    if (ev && isEligible(ev, run)) fire(ev, run, rng);
    if (run.pending) {
      // Les autres échéances attendront l'année suivante.
      const rest = due.slice(due.indexOf(s) + 1).map((x) => ({ ...x, atAge: run.age + 1 }));
      run.scheduled.push(...rest);
      return;
    }
  }
  // 2. Jalons de vie.
  for (const ev of ALL_EVENTS) {
    if (ev.kind !== 'jalon' || !isEligible(ev, run)) continue;
    fire(ev, run, rng);
    if (run.pending) return;
  }
  // 3. Événement aléatoire.
  if (!allowRandom) return;
  if (!rng.chance(RANDOM_EVENT_RATE[run.settings.format])) return;
  const pool = ALL_EVENTS.filter((ev) => ev.kind === 'aleatoire' && isEligible(ev, run) && eventWeight(ev, run) > 0);
  if (pool.length === 0) return;
  fire(rng.weighted(pool, (ev) => eventWeight(ev, run)), run, rng);
}

function fire(ev: NarrativeEvent, run: SimulationRun, rng: Rng) {
  run.fired[ev.id] = (run.fired[ev.id] ?? 0) + 1;
  run.lastFiredAge[ev.id] = run.age;
  const ctx = makeContext(run);
  const pending = buildPending(ev, run);
  if (ev.effects || ev.resolve) {
    const outcome = applyConsequence(run, mergeConsequences(ev.effects, ev.resolve?.(ctx, rng)), rng);
    if (pending.choices.length === 0 && outcome) pending.text = `${pending.text} ${outcome}`;
  }
  if (pending.choices.length > 0) {
    run.pending = pending;
    return;
  }
  addTimeline(run, {
    title: pending.title,
    text: pending.text,
    domain: ev.domain,
    status: ev.status,
    eventId: ev.id,
    sourceIds: ev.sourceIds ?? [],
    memorable: ev.memorable ?? false,
  });
}

/** Applique une décision du joueur. */
export function choose(input: SimulationRun, choiceId: string, automatic = false): SimulationRun {
  const pending = input.pending;
  if (!pending) return input;
  const ev = getEvent(pending.eventId);
  const choice = ev?.choices?.find((c) => c.id === choiceId);
  if (!ev || !choice || !pending.choices.some((c) => c.id === choiceId)) return input;
  const run = clone(input);
  const rng = new Rng(run.rngState);
  const ctx = makeContext(run);
  const outcome = applyConsequence(run, mergeConsequences(choice.effects, choice.resolve?.(ctx, rng)), rng);
  const label = renderText(choice.label, ctx);
  run.choices.push({ eventId: ev.id, choiceId, label, age: run.age, year: run.year, automatic });
  run.pending = null;
  addTimeline(run, {
    title: pending.title,
    text: pending.text,
    domain: ev.domain,
    status: ev.status,
    eventId: ev.id,
    choiceLabel: outcome ? `${label} — ${outcome}` : label,
    sourceIds: pending.sourceIds,
    memorable: ev.memorable ?? true,
  });
  processEvents(run, rng, false);
  run.rngState = rng.current;
  return run;
}

/** Mode automatique : choix pondéré, tiré par le moteur (reproductible). */
export function autoChoose(run: SimulationRun): SimulationRun {
  if (!run.pending) return run;
  const ev = getEvent(run.pending.eventId);
  if (!ev?.choices) return run;
  const available = ev.choices.filter((c) => run.pending?.choices.some((p) => p.id === c.id));
  if (available.length === 0) return run;
  const rng = new Rng(run.rngState);
  const pick = rng.weighted(available, (c) => (c.autoWeight ? c.autoWeight(run) : 1));
  return choose({ ...run, rngState: rng.current }, pick.id, true);
}

export function updateSettings(run: SimulationRun, settings: Partial<Settings>): SimulationRun {
  return { ...run, settings: { ...run.settings, ...settings } };
}

/**
 * Conséquence d'une interaction dans une scène d'exploration. Passe par le
 * même système de conséquences et le même journal que les événements ; chaque
 * clé ne s'applique qu'une fois par partie, et le temps n'avance pas.
 */
export function applyInteraction(
  input: SimulationRun,
  key: string,
  consequence: EventConsequence,
  journal: { title: string; text: string },
): SimulationRun {
  const flag = `scene:${key}`;
  if (!input.alive || input.flags[flag] !== undefined) return input;
  const run = clone(input);
  const rng = new Rng(run.rngState);
  const outcome = applyConsequence(run, { ...consequence, setFlags: [...(consequence.setFlags ?? []), flag] }, rng);
  addTimeline(run, {
    title: journal.title,
    text: outcome ? `${journal.text} ${outcome}` : journal.text,
    domain: run.pending?.domain ?? 'relations',
    status: 'fictif',
    sourceIds: [],
    memorable: false,
  });
  run.rngState = rng.current;
  return run;
}

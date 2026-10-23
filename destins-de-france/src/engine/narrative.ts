import { SIDE_NAMES } from '../data/names';
import { canHoldJob, educationRank, getJob } from '../data/jobs';
import { getRegion } from '../data/regions';
import type { EventConsequence, NarrativeContext, NarrativeEvent, TextFn } from './narrative-types';
import type { Rng } from './rng';
import type { LifeTimelineEntry, PendingEvent, SimulationRun } from './types';

/**
 * Moteur narratif : éligibilité, rendu des textes, application des conséquences.
 * Toutes les fonctions qui modifient l'état travaillent sur un brouillon (draft)
 * déjà copié par le moteur de simulation.
 */

export const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/**
 * Clés génériques : « $parent » désigne le premier parent encore en vie,
 * « $fratrie » le premier membre vivant de la fratrie, etc.
 */
export function resolveKey(run: SimulationRun, key: string): string {
  if (!key.startsWith('$')) return key;
  const kind = key.slice(1);
  return run.people.find((p) => p.kind === kind && p.alive)?.id ?? key;
}

export function makeContext(run: SimulationRun): NarrativeContext {
  return {
    run,
    name: (key, fallback = 'quelqu\'un') => run.people.find((p) => p.id === resolveKey(run, key))?.name ?? fallback,
    g: (m, f) => (run.citizen.sex === 'F' ? f : m),
    place: run.housing.place,
  };
}

export function renderText(t: TextFn, ctx: NarrativeContext): string {
  return typeof t === 'function' ? t(ctx) : t;
}

export function isEligible(event: NarrativeEvent, run: SimulationRun): boolean {
  const c = event.conditions;
  if (c.minAge !== undefined && run.age < c.minAge) return false;
  if (c.maxAge !== undefined && run.age > c.maxAge) return false;
  if (c.flags && !c.flags.every((f) => run.flags[f] !== undefined)) return false;
  if (c.notFlags && c.notFlags.some((f) => run.flags[f] !== undefined)) return false;
  if (c.anyFlags && !c.anyFlags.some((f) => run.flags[f] !== undefined)) return false;
  if (c.jobStatus && !c.jobStatus.includes(run.employment.status)) return false;
  if (c.minEducation && educationRank(run.education.level) < educationRank(c.minEducation)) return false;
  const count = run.fired[event.id] ?? 0;
  if (count >= (event.maxOccurrences ?? 1)) return false;
  const last = run.lastFiredAge[event.id];
  if (event.cooldown !== undefined && last !== undefined && run.age - last < event.cooldown) return false;
  if (c.when && !c.when(run)) return false;
  return true;
}

export function eventWeight(event: NarrativeEvent, run: SimulationRun): number {
  const w = event.weight ?? 1;
  return typeof w === 'function' ? w(run) : w;
}

function newId(run: SimulationRun, prefix: string): string {
  run.nextId += 1;
  return `${prefix}-${run.nextId}`;
}

export function addTimeline(run: SimulationRun, entry: Omit<LifeTimelineEntry, 'id' | 'age' | 'year'>): LifeTimelineEntry {
  const full: LifeTimelineEntry = { id: newId(run, 't'), age: run.age, year: run.year, ...entry };
  run.timeline.push(full);
  return full;
}

/** Applique une conséquence à un brouillon d'état. Retourne la phrase de résultat éventuelle. */
export function applyConsequence(run: SimulationRun, c: EventConsequence, rng: Rng): string | undefined {
  const f = run.finances;
  if (c.savings) f.savings += c.savings;
  if (c.debt) f.debt = Math.max(0, f.debt + c.debt);
  if (f.savings < 0) {
    f.debt += -f.savings;
    f.savings = 0;
  }
  if (c.monthlyIncome) f.monthlyIncome = Math.max(0, f.monthlyIncome + c.monthlyIncome);
  if (c.monthlyExpenses) f.monthlyExpenses = Math.max(0, f.monthlyExpenses + c.monthlyExpenses);
  if (c.pension !== undefined) f.pension = c.pension;
  if (c.physical) run.health.physical = clamp(run.health.physical + c.physical);
  if (c.wellbeing) run.health.wellbeing = clamp(run.health.wellbeing + c.wellbeing);
  if (c.social) run.social = clamp(run.social + c.social);
  if (c.engagement) run.civic.engagement = clamp(run.civic.engagement + c.engagement);
  if (c.studyConditions) run.education.conditions = clamp(run.education.conditions + c.studyConditions);

  for (const flag of c.setFlags ?? []) if (run.flags[flag] === undefined) run.flags[flag] = run.age;
  for (const flag of c.clearFlags ?? []) delete run.flags[flag];

  if (c.education) {
    const e = c.education;
    if (e.status) run.education.status = e.status;
    // Le niveau de diplôme ne peut que progresser (cohérence).
    if (e.level && educationRank(e.level) > educationRank(run.education.level)) run.education.level = e.level;
    if (e.track) run.education.track = e.track;
    if (e.field) run.education.field = e.field;
    if (e.expectedEndAge !== undefined) run.education.expectedEndAge = e.expectedEndAge;
    if (e.milestone) run.education.milestones.push(e.milestone);
  }

  if (c.job) {
    if ('jobId' in c.job) {
      const job = getJob(c.job.jobId);
      // Contrôle de cohérence : diplôme et qualification réglementée requis.
      if (job && canHoldJob(job, run.education.level, run.flags) && run.age >= 16) {
        run.employment.status = job.sector === 'independant' ? 'independant' : 'emploi';
        run.employment.jobId = job.id;
        run.employment.jobLabel = run.citizen.sex === 'F' ? job.label.f : job.label.m;
        run.employment.sector = job.sector;
        run.employment.since = run.age;
        run.employment.jobs.push({ age: run.age, label: run.employment.jobLabel });
        if (run.education.status !== 'termine' && run.education.status !== 'apprentissage') run.education.status = 'termine';
      }
    } else {
      if (c.job.status === 'chomage' && run.employment.status !== 'chomage') run.employment.unemploymentSpells += 1;
      run.employment.status = c.job.status;
      if (c.job.status !== 'emploi' && c.job.status !== 'independant') {
        run.employment.since = undefined;
      }
    }
  }

  if (c.housing) {
    const h = c.housing;
    if (h.tenure) run.housing.tenure = h.tenure;
    if (h.withParents !== undefined) run.housing.withParents = h.withParents;
    if (h.moveToMetropole) {
      const region = getRegion(run.citizen.regionId);
      const target = rng.pick(region.places.metropole);
      if (target !== run.housing.place) {
        run.housing.place = target;
        run.housing.territory = 'metropole';
      }
    }
    if (h.place) run.housing.place = h.place;
    if (run.residences[run.residences.length - 1] !== run.housing.place) run.residences.push(run.housing.place);
  }

  for (const p of c.addPerson ?? []) {
    if (run.people.some((x) => x.id === p.key)) continue;
    const used = new Set(run.people.map((x) => x.name));
    let name = rng.pick(SIDE_NAMES);
    for (let i = 0; i < 6 && (used.has(name) || name === run.citizen.firstName); i++) name = rng.pick(SIDE_NAMES);
    run.people.push({
      id: p.key,
      name,
      kind: p.kind,
      closeness: clamp(p.closeness),
      bornYear: run.citizen.birthYear - (p.ageOffset ?? 0),
      alive: true,
      note: p.note,
    });
  }
  for (const [key, delta] of Object.entries(c.closeness ?? {})) {
    const person = run.people.find((x) => x.id === resolveKey(run, key));
    if (person) person.closeness = clamp(person.closeness + delta);
  }
  if (c.personDies) {
    const id = resolveKey(run, c.personDies);
    const person = run.people.find((x) => x.id === id);
    if (person) person.alive = false;
  }
  if (c.membership && !run.civic.memberships.includes(c.membership)) run.civic.memberships.push(c.membership);
  if (c.leaveMembership) run.civic.memberships = run.civic.memberships.filter((m) => m !== c.leaveMembership);
  if (c.mandate) run.civic.mandates.push({ label: c.mandate.label, fromYear: run.year, toYear: run.year + c.mandate.years });
  if (c.vote === 'vote' || c.vote === 'blanc') run.civic.votesCast += 1;
  if (c.vote === 'abstention') run.civic.abstentions += 1;
  for (const s of c.schedule ?? []) run.scheduled.push({ eventId: s.eventId, atAge: run.age + s.inYears });

  return c.outcome;
}

/** Fusionne des conséquences fixes et résolues. */
export function mergeConsequences(...list: (EventConsequence | undefined)[]): EventConsequence {
  const out: EventConsequence = {};
  const num = ['savings', 'debt', 'monthlyIncome', 'monthlyExpenses', 'physical', 'wellbeing', 'social', 'engagement', 'studyConditions'] as const;
  for (const c of list) {
    if (!c) continue;
    for (const k of num) if (c[k]) out[k] = (out[k] ?? 0) + (c[k] as number);
    if (c.setFlags) out.setFlags = [...(out.setFlags ?? []), ...c.setFlags];
    if (c.clearFlags) out.clearFlags = [...(out.clearFlags ?? []), ...c.clearFlags];
    if (c.addPerson) out.addPerson = [...(out.addPerson ?? []), ...c.addPerson];
    if (c.schedule) out.schedule = [...(out.schedule ?? []), ...c.schedule];
    if (c.closeness) out.closeness = { ...(out.closeness ?? {}), ...c.closeness };
    if (c.education) out.education = { ...(out.education ?? {}), ...c.education };
    if (c.housing) out.housing = { ...(out.housing ?? {}), ...c.housing };
    for (const k of ['job', 'pension', 'personDies', 'membership', 'leaveMembership', 'mandate', 'vote'] as const) {
      if (c[k] !== undefined) (out as Record<string, unknown>)[k] = c[k];
    }
    if (c.outcome) out.outcome = out.outcome ? `${out.outcome} ${c.outcome}` : c.outcome;
  }
  return out;
}

export function buildPending(event: NarrativeEvent, run: SimulationRun): PendingEvent {
  const ctx = makeContext(run);
  const soft = run.settings.softMode && event.softText;
  return {
    eventId: event.id,
    title: renderText(event.title, ctx),
    text: renderText(soft ? (event.softText as TextFn) : event.text, ctx),
    status: event.status,
    domain: event.domain,
    sourceIds: event.sourceIds ?? [],
    sensitive: event.sensitive ?? false,
    choices: (event.choices ?? [])
      .filter((ch) => !ch.available || ch.available(run))
      .map((ch) => ({ id: ch.id, label: renderText(ch.label, ctx), hint: ch.hint ? renderText(ch.hint, ctx) : undefined })),
  };
}

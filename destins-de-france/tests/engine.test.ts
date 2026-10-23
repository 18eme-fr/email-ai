import { describe, expect, it } from 'vitest';
import { ALL_EVENTS } from '../src/data/events';
import { getSource, SOURCES } from '../src/data/sources';
import { checkCoherence } from '../src/engine/coherence';
import { inverseNormal, standardOfLivingAt } from '../src/engine/demography';
import { modelLifeExpectancy } from '../src/engine/mortality';
import { exportSave, importSave } from '../src/engine/save';
import { autoChoose, choose, createRun, step, stepUntilPause } from '../src/engine/simulation';
import { summarize } from '../src/engine/summary';
import type { SimulationRun } from '../src/engine/types';

/** Joue une vie entière en mode automatique, en vérifiant la cohérence à chaque pas. */
function playLife(seed: number, check = true): SimulationRun {
  let run = createRun(seed);
  for (let i = 0; i < 2000 && run.alive; i++) {
    run = run.pending ? autoChoose(run) : step(run);
    if (check) {
      const v = checkCoherence(run);
      if (v.length > 0) throw new Error(`Graine ${seed}, âge ${run.age} : ${v.join(' | ')}`);
    }
  }
  return run;
}

describe('démarrage et génération', () => {
  it('crée une partie avec un personnage', () => {
    const run = createRun(42);
    expect(run.citizen.firstName.length).toBeGreaterThan(0);
    expect(run.age).toBe(0);
    expect(run.year).toBe(2026);
    expect(run.timeline[0]?.title).toBe('Naissance');
  });

  it('deux graines différentes produisent des personnages différents', () => {
    const names = new Set(Array.from({ length: 20 }, (_, i) => {
      const r = createRun(1000 + i);
      return `${r.citizen.firstName}-${r.citizen.birthPlace}-${r.household.percentile.toFixed(3)}`;
    }));
    expect(names.size).toBeGreaterThan(15);
  });

  it('une même graine et les mêmes choix reproduisent la même vie', () => {
    const a = playLife(7, false);
    const b = playLife(7, false);
    expect(JSON.stringify({ ...a, startedAt: '' })).toBe(JSON.stringify({ ...b, startedAt: '' }));
  });
});

describe('temps, pause et décisions', () => {
  it('le temps progresse d\'une année par pas', () => {
    let run = createRun(3);
    run = run.pending ? autoChoose(run) : run;
    const next = step(run);
    expect(next.age).toBe(run.age + 1);
  });

  it('une décision en attente met le temps en pause', () => {
    const run = stepUntilPause(createRun(11));
    expect(run.pending).not.toBeNull();
    expect(step(run)).toBe(run);
  });

  it('les choix sont enregistrés et appliqués', () => {
    const run = stepUntilPause(createRun(12));
    const pending = run.pending!;
    const after = choose(run, pending.choices[0]!.id);
    expect(after.choices).toHaveLength(run.choices.length + 1);
    expect(after.choices.at(-1)?.eventId).toBe(pending.eventId);
    expect(after.pending?.eventId ?? null).not.toBe(pending.eventId);
  });

  it('un choix inconnu ne modifie pas l\'état', () => {
    const run = stepUntilPause(createRun(13));
    expect(choose(run, 'inexistant')).toBe(run);
  });

  it('une décision antérieure influe sur la suite (orientation → bac ou CAP)', () => {
    const reach15 = (seed: number) => {
      let r = createRun(seed);
      while (r.alive && !(r.pending?.eventId === 'orientation_3e')) r = r.pending ? autoChoose(r) : step(r);
      return r;
    };
    const base = reach15(21);
    expect(base.pending?.eventId).toBe('orientation_3e');
    const general = stepUntilPause(choose(base, 'generale'), 1);
    const cap = stepUntilPause(choose(base, 'apprentissage'), 1);
    expect(general.flags.voie_generale).toBeDefined();
    expect(cap.flags.apprentissage).toBeDefined();
    expect(general.education.track).not.toBe(cap.education.track);
    expect(cap.finances.savings).toBeGreaterThan(general.finances.savings);
  });
});

describe('vies complètes', () => {
  const lives = Array.from({ length: 300 }, (_, i) => playLife(5000 + i * 7919));

  it('aucune incohérence ni erreur fatale sur 300 vies', () => {
    expect(lives.every((r) => !r.alive)).toBe(true);
  });

  it('le décès termine la simulation', () => {
    const dead = lives[0]!;
    expect(step(dead)).toBe(dead);
    expect(dead.timeline.at(-1)?.title).toBe('Fin de vie');
  });

  it('les vies sont variées', () => {
    const jobs = new Set(lives.flatMap((r) => r.employment.jobs.map((j) => j.label)));
    const regions = new Set(lives.map((r) => r.citizen.regionId));
    const levels = new Set(lives.map((r) => r.education.level));
    expect(jobs.size).toBeGreaterThan(12);
    expect(regions.size).toBeGreaterThan(8);
    expect(levels.size).toBeGreaterThanOrEqual(5);
    expect(lives.some((r) => r.civic.mandates.length > 0)).toBe(true);
    expect(lives.some((r) => r.civic.memberships.length === 0)).toBe(true);
  });

  it('au moins 15 événements différents sont rencontrés, dont des décisions', () => {
    const seen = new Set(lives.flatMap((r) => r.timeline.map((t) => t.eventId).filter(Boolean)));
    expect(seen.size).toBeGreaterThan(40);
    expect(ALL_EVENTS.filter((e) => (e.choices?.length ?? 0) >= 2).length).toBeGreaterThan(15);
  });

  it('le bilan correspond à l\'historique', () => {
    const r = lives[3]!;
    const s = summarize(r);
    expect(s.headline).toContain(r.citizen.firstName);
    expect(s.paragraphs.join(' ')).toContain(String(r.deathAge));
    expect(s.memories.length).toBe(r.timeline.filter((t) => t.memorable).length);
  });

  it('validation statistique : espérance de vie simulée proche du calibrage', () => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const f = lives.filter((r) => r.citizen.sex === 'F').map((r) => (r.deathAge ?? 0) + 0.5);
    const m = lives.filter((r) => r.citizen.sex === 'M').map((r) => (r.deathAge ?? 0) + 0.5);
    // Tolérance : 300 vies seulement (erreur d’échantillonnage d’environ 1 an).
    expect(Math.abs(mean(f) - 85.9)).toBeLessThan(2.5);
    expect(Math.abs(mean(m) - 80.3)).toBeLessThan(2.5);
  });
});

describe('modèles', () => {
  it('le modèle de mortalité retrouve l\'espérance de vie 2025', () => {
    expect(modelLifeExpectancy('F')).toBeCloseTo(85.9, 1);
    expect(modelLifeExpectancy('M')).toBeCloseTo(80.3, 1);
  });

  it('la distribution des niveaux de vie respecte médiane et taux de pauvreté', () => {
    expect(standardOfLivingAt(0.5)).toBeCloseTo(25760, -1);
    expect(standardOfLivingAt(0.154)).toBeCloseTo(0.6 * 25760, -2);
    expect(inverseNormal(0.975)).toBeCloseTo(1.96, 2);
  });

  it('l\'Île-de-France représente environ 23 % des naissances simulées', () => {
    const n = 4000;
    let idf = 0;
    for (let i = 0; i < n; i++) if (createRun(90000 + i).citizen.regionId === 'idf') idf++;
    expect(idf / n).toBeGreaterThan(0.2);
    expect(idf / n).toBeLessThan(0.26);
  });
});

describe('documentation et sauvegarde', () => {
  it('toutes les sources citées par les événements existent et ont une URL https', () => {
    for (const ev of ALL_EVENTS) for (const id of ev.sourceIds ?? []) expect(getSource(id), `${ev.id} → ${id}`).toBeDefined();
    for (const s of SOURCES) expect(s.url.startsWith('https://')).toBe(true);
  });

  it('aucune fiche datée du futur n\'est présentée comme vérifiée', () => {
    for (const s of SOURCES) expect(s.period).not.toMatch(/20(2[7-9]|[3-9]\d)/);
  });

  it('identifiants d\'événements uniques', () => {
    const ids = ALL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('une sauvegarde exportée se restaure à l\'identique', () => {
    const run = stepUntilPause(createRun(77));
    const restored = importSave(exportSave(run, []));
    expect(restored?.run).toEqual(run);
    expect(importSave('{"pas":"une sauvegarde"}')).toBeNull();
  });
});

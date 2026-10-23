import { describe, expect, it } from 'vitest';
import { getEvent } from '../src/data/events';
import { FORUM_ORIENTATION } from '../src/explore/scenes/forumOrientation';
import { SCENES } from '../src/explore/scenes';
import { buildWorld, collides, inputToGrid, movePlayer, nearestNpc, npcCenter, type Player } from '../src/explore/world';
import { applyInteraction, autoChoose, choose, createRun, step } from '../src/engine/simulation';
import type { SimulationRun } from '../src/engine/types';

function reachOrientation(seed: number): SimulationRun {
  let r = createRun(seed);
  while (r.alive && r.pending?.eventId !== 'orientation_3e') r = r.pending ? autoChoose(r) : step(r);
  return r;
}

describe('scènes d\'exploration', () => {
  const run = reachOrientation(4242);
  const world = buildWorld(FORUM_ORIENTATION, run);

  it('la scène est rattachée à un événement existant et ses décisions correspondent à ses choix', () => {
    for (const scene of SCENES) {
      const ev = getEvent(scene.eventId);
      expect(ev).toBeDefined();
      const ids = new Set(ev!.choices!.map((c) => c.id));
      for (const n of scene.npcs)
        for (const node of n.dialogue)
          for (const o of node.options) {
            if (o.action?.type === 'choose') expect(ids.has(o.action.choiceId), `${n.id} → ${o.action.choiceId}`).toBe(true);
            if (o.next) expect(n.dialogue.some((d) => d.id === o.next)).toBe(true);
          }
    }
  });

  it('le point d\'apparition est libre et les murs bloquent', () => {
    expect(collides(world, FORUM_ORIENTATION.spawn.x, FORUM_ORIENTATION.spawn.y)).toBe(false);
    let p: Player = { x: 6.5, y: 1.6, dir: 'n', moving: false, walked: 0 };
    for (let i = 0; i < 60; i++) p = movePlayer(world, p, 0, -1, 0.05);
    expect(p.y).toBeGreaterThan(1); // le mur nord (y = 0) arrête le personnage
  });

  it('les flèches correspondent aux directions de l\'écran isométrique', () => {
    const upVec = inputToGrid(true, false, false, false);
    expect(upVec.dx).toBeLessThan(0);
    expect(upVec.dy).toBeLessThan(0);
    const right = inputToGrid(false, false, false, true);
    expect(right.dx).toBeGreaterThan(0);
    expect(right.dy).toBeLessThan(0);
  });

  it('chaque personne présente est abordable depuis une case libre', () => {
    for (const n of world.npcs) {
      const c = npcCenter(n);
      const spots = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: c.x + dx!, y: c.y + dy! }));
      const ok = spots.some((s) => !collides(world, s.x, s.y) && nearestNpc(world, { ...s, dir: 's', moving: false, walked: 0 })?.id === n.id);
      expect(ok, n.id).toBe(true);
    }
  });

  it('une interaction applique une conséquence réelle une seule fois, sans faire avancer le temps', () => {
    const before = run.education.conditions;
    const a = applyInteraction(run, 'forum_conseillere', { studyConditions: 4, setFlags: ['informe_orientation'] }, { title: 'Test', text: 'Texte.' });
    expect(a.education.conditions).toBe(Math.min(100, before + 4));
    expect(a.flags.informe_orientation).toBeDefined();
    expect(a.age).toBe(run.age);
    expect(a.timeline.at(-1)?.title).toBe('Test');
    const b = applyInteraction(a, 'forum_conseillere', { studyConditions: 4 }, { title: 'Test', text: 'Texte.' });
    expect(b).toBe(a);
  });

  it('décider dans la scène équivaut à décider sur la carte', () => {
    const viaCard = choose(run, 'pro');
    expect(viaCard.flags.voie_pro).toBeDefined();
    expect(viaCard.pending?.eventId).not.toBe('orientation_3e');
  });
});

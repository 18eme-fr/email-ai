import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { makeContext, renderText } from '../engine/narrative';
import type { EventConsequence } from '../engine/narrative-types';
import type { SimulationRun } from '../engine/types';
import { TILE_H, TILE_W, type CharacterLook, type Direction } from './render/contract';
import { pixelRenderer as R } from './render/pixelRenderer';
import type { DialogueNode, ExplorationScene, SceneNpc } from './types';
import { buildWorld, inputToGrid, movePlayer, nearExit, nearestLabel, nearestNpc, npcCenter, steerTowards, TALK_RANGE, type Player } from './world';
import './explore.css';

interface Props {
  run: SimulationRun;
  scene: ExplorationScene;
  onInteraction: (key: string, consequence: EventConsequence, journal: { title: string; text: string }) => void;
  onChoose: (choiceId: string) => void;
  onLeave: () => void;
}

const VIEW_W = 400;
const VIEW_H = 240;
const KEYS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up', KeyW: 'up', KeyZ: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

type Target = { x: number; y: number; npcId?: string; stuck: number } | null;

const project = (x: number, y: number) => ({ sx: ((x - y) * TILE_W) / 2, sy: ((x + y) * TILE_H) / 2 });

/** Scène d'exploration pixel art. Le temps de la vie est suspendu tant qu'elle est ouverte. */
export function ExploreView({ run, scene, onInteraction, onChoose, onLeave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useMemo(() => buildWorld(scene, run), [scene, run.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const ctx = makeContext(run);
  const looks = useMemo(() => new Map(world.npcs.map((n) => [n.id, n.look(run)])), [world, run.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const playerLook: CharacterLook = { age: run.age, sex: run.citizen.sex, hue: run.citizen.portraitHue, seed: run.seed, role: run.age < 18 ? 'eleve' : undefined };

  const player = useRef<Player>({ x: scene.spawn.x, y: scene.spawn.y, dir: scene.spawn.dir, moving: false, walked: 0 });
  const held = useRef({ up: false, down: false, left: false, right: false });
  const target = useRef<Target>(null);
  const [talking, setTalking] = useState<{ npc: SceneNpc; node: DialogueNode } | null>(null);
  const [near, setNear] = useState<{ npc?: string; exit: boolean; label?: string }>({ exit: false });
  const talkingRef = useRef(talking);
  talkingRef.current = talking;

  const openDialogue = useCallback((npc: SceneNpc) => {
    target.current = null;
    held.current = { up: false, down: false, left: false, right: false };
    // Le personnage se tourne vers son interlocuteur.
    const c = npcCenter(npc);
    const dx = c.x - player.current.x;
    const dy = c.y - player.current.y;
    player.current = { ...player.current, moving: false, dir: Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 's' : 'n') : dy > 0 ? 'w' : 'e' };
    setTalking({ npc, node: npc.dialogue[0]! });
  }, []);

  const interact = useCallback(() => {
    const p = player.current;
    const npc = nearestNpc(world, p);
    if (npc) return openDialogue(npc);
    if (nearExit(world, p)) onLeave();
  }, [world, openDialogue, onLeave]);

  // Clavier
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea')) return;
      if (talkingRef.current) {
        if (e.code === 'Escape') setTalking(null);
        return;
      }
      const k = KEYS[e.code];
      if (k) {
        held.current[k] = true;
        target.current = null;
        e.preventDefault();
      } else if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
        if ((e.target as HTMLElement)?.closest('button')) return;
        e.preventDefault();
        interact();
      } else if (e.code === 'Escape') {
        onLeave();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (k) held.current[k] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [interact, onLeave]);

  // Boucle d'animation : déplacement + rendu. Ne touche jamais l'état de la vie.
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return;
    g.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    let lastNear = '';
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      if (!talkingRef.current) {
        const h = held.current;
        let { dx, dy } = inputToGrid(h.up, h.down, h.left, h.right);
        const tg = target.current;
        if (tg && dx === 0 && dy === 0) {
          const npc = tg.npcId ? world.npcs.find((n) => n.id === tg.npcId) : undefined;
          if (npc && Math.hypot(npcCenter(npc).x - player.current.x, npcCenter(npc).y - player.current.y) < TALK_RANGE - 0.15) {
            openDialogue(npc);
          } else {
            const s = steerTowards(player.current, tg.x, tg.y);
            if (s.arrived) target.current = null;
            else ({ dx, dy } = s);
          }
        }
        const before = player.current;
        player.current = movePlayer(world, player.current, dx, dy, dt);
        if (target.current && (dx !== 0 || dy !== 0)) {
          const moved = Math.hypot(player.current.x - before.x, player.current.y - before.y);
          target.current.stuck = moved < 0.002 ? target.current.stuck + dt : 0;
          if (target.current.stuck > 0.35) target.current = null;
        }
      }
      const p = player.current;
      const npcNear = nearestNpc(world, p);
      const lbl = nearestLabel(world, p);
      const ex = nearExit(world, p);
      const key = `${npcNear?.id ?? ''}|${ex}|${lbl?.label ?? ''}`;
      if (key !== lastNear) {
        lastNear = key;
        setNear({ npc: npcNear?.id, exit: ex, label: lbl?.label });
      }
      draw(g, t, npcNear?.id);
      raf = requestAnimationFrame(loop);
    };

    const draw = (c: CanvasRenderingContext2D, t: number, highlight?: string) => {
      const p = player.current;
      const cam = project(p.x, p.y);
      const ox = Math.round(VIEW_W / 2 - cam.sx);
      const oy = Math.round(VIEW_H / 2 + 10 - cam.sy);
      c.fillStyle = R.background;
      c.fillRect(0, 0, VIEW_W, VIEW_H);
      // Sols
      for (let y = 0; y < world.height; y++)
        for (let x = 0; x < world.width; x++) {
          const cell = world.cells[y]![x]!;
          if (!cell.floor) continue;
          const s = project(x + 0.5, y + 0.5);
          // Lignes de terrain continues : une rangée rouge et une colonne jaune (variantes 1 et 2 du lino).
          R.drawFloor(c, cell.floor, ox + s.sx, oy + s.sy, cell.floor === 'lino' ? (y === 5 ? 1 : x === 6 ? 2 : 0) : (x * 7 + y * 13) % 4);
        }
      // Murs (fond de la pièce)
      for (let d = 0; d < world.width + world.height; d++)
        for (let x = 0; x <= d; x++) {
          const y = d - x;
          const cell = world.cells[y]?.[x];
          if (!cell?.wall) continue;
          const s = project(x + 0.5, y + 0.5);
          const left = !world.cells[y + 1]?.[x]?.wall;
          const right = !world.cells[y]?.[x + 1]?.wall;
          R.drawWall(c, cell.wall, ox + s.sx, oy + s.sy, { left, right }, (x + y) % 4);
        }
      // Objets et personnages, triés par profondeur
      type D = { depth: number; draw: () => void };
      const list: D[] = [];
      for (const pr of world.props) {
        const s = project(pr.x + 0.5, pr.y + 0.5);
        list.push({ depth: pr.x + pr.y + 1, draw: () => R.drawProp(c, pr.kind, ox + s.sx, oy + s.sy, pr.accent ?? 200, (pr.x + pr.y) % 4) });
      }
      for (const n of world.npcs) {
        const s = project(n.x + 0.5, n.y + 0.5);
        list.push({
          depth: n.x + n.y + 1,
          draw: () => {
            R.drawShadow(c, ox + s.sx, oy + s.sy, 10);
            R.drawCharacter(c, looks.get(n.id)!, n.dir as Direction, 0, false, ox + s.sx, oy + s.sy, t + n.x);
          },
        });
      }
      const ps = project(p.x, p.y);
      list.push({
        depth: p.x + p.y,
        draw: () => {
          R.drawShadow(c, ox + ps.sx, oy + ps.sy, 10);
          R.drawCharacter(c, playerLook, p.dir, Math.floor(p.walked * 5) % 4, p.moving, Math.round(ox + ps.sx), Math.round(oy + ps.sy), t);
        },
      });
      list.sort((a, b) => a.depth - b.depth).forEach((d) => d.draw());
      // Bulles d'interaction
      for (const n of world.npcs) {
        if (talkingRef.current) break;
        const s = project(n.x + 0.5, n.y + 0.5);
        if (n.id === highlight || Math.hypot(n.x + 0.5 - p.x, n.y + 0.5 - p.y) < 4) R.drawPrompt(c, ox + s.sx, oy + s.sy - 30, n.prompt, t);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [world, looks, openDialogue]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Clic ou toucher sur la carte : marcher vers le point, ou vers la personne visée. */
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (talking) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const py = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    const cam = project(player.current.x, player.current.y);
    const lx = px - (VIEW_W / 2 - cam.sx);
    const ly = py - (VIEW_H / 2 + 10 - cam.sy);
    const a = lx / (TILE_W / 2);
    const b = ly / (TILE_H / 2);
    const gx = (a + b) / 2;
    const gy = (b - a) / 2;
    // Une personne sous le clic (on vise un peu au-dessus des pieds).
    const npc = world.npcs.find((n) => Math.hypot(n.x + 0.5 - (gx + 0.6), n.y + 0.5 - (gy + 0.6)) < 1.1);
    if (npc) walkTo(npc);
    else target.current = { x: gx, y: gy, stuck: 0 };
  };

  const walkTo = (npc: SceneNpc) => {
    const c = npcCenter(npc);
    if (Math.hypot(c.x - player.current.x, c.y - player.current.y) < TALK_RANGE) return openDialogue(npc);
    // Case libre devant la personne (vers l'intérieur de la pièce).
    target.current = { x: c.x + (npc.dir === 's' ? 1 : npc.dir === 'n' ? -1 : 0), y: c.y + (npc.dir === 'w' ? 1 : npc.dir === 'e' ? -1 : 0), npcId: npc.id, stuck: 0 };
  };

  const pick = (opt: DialogueNode['options'][number]) => {
    const current = talking;
    if (!current) return;
    const a = opt.action;
    if (a?.type === 'choose') return onChoose(a.choiceId);
    if (a?.type === 'leave') return onLeave();
    if (a?.type === 'consequence') onInteraction(a.key, a.consequence, { title: a.journal.title, text: renderText(a.journal.text, ctx) });
    const next = opt.next ? current.npc.dialogue.find((d) => d.id === opt.next) : undefined;
    setTalking(next ? { npc: current.npc, node: next } : null);
  };

  const hold = (k: 'up' | 'down' | 'left' | 'right', v: boolean) => {
    held.current[k] = v;
    if (v) target.current = null;
  };
  const nearNpc = world.npcs.find((n) => n.id === near.npc);
  const options = talking?.node.options.filter((o) => !o.available || o.available(run)) ?? [];

  return (
    <section className="explore card" aria-label={`Scène : ${renderText(scene.title, ctx)}`}>
      <header className="explore-head">
        <div>
          <span className="eyebrow">Scène à vivre · {scene.duration} · le temps de la vie est suspendu</span>
          <h2>{renderText(scene.title, ctx)}</h2>
          <p className="muted">{renderText(scene.intro, ctx)}</p>
        </div>
        <button className="btn btn-small" onClick={onLeave}>
          Passer la scène
        </button>
      </header>

      <div className="explore-stage">
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="explore-canvas" onClick={onCanvasClick} role="img" aria-label="Vue du lieu en pixel art. Utilisez les flèches pour marcher et E pour parler, ou la liste des personnes présentes." />
        {!talking && (near.npc || near.exit || near.label) && (
          <div className="explore-hint" aria-live="polite">
            {nearNpc ? (
              <>
                <kbd>E</kbd> Parler à {renderText(nearNpc.name, ctx)}
              </>
            ) : near.exit ? (
              <>
                <kbd>E</kbd> Sortir du gymnase
              </>
            ) : (
              <span>{near.label}</span>
            )}
          </div>
        )}
        {talking && (
          <div className="explore-dialogue" role="dialog" aria-labelledby="dlg-name">
            <div className="dlg-head">
              <b id="dlg-name">{renderText(talking.npc.name, ctx)}</b>
              <span className="fine">{renderText(talking.npc.title, ctx)}</span>
            </div>
            <p>{renderText(talking.node.text, ctx)}</p>
            <div className="dlg-options">
              {options.map((o, i) => (
                <button key={i} className={`choice${o.action?.type === 'choose' ? ' is-decision' : ''}`} onClick={() => pick(o)} autoFocus={i === 0}>
                  <b>
                    {i + 1}. {renderText(o.label, ctx)}
                  </b>
                  {o.action?.type === 'choose' && <small>Décision : met fin à la scène</small>}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="explore-pad" aria-hidden="true">
          {(['up', 'left', 'right', 'down'] as const).map((k) => (
            <button
              key={k}
              className={`pad-${k}`}
              tabIndex={-1}
              onPointerDown={() => hold(k, true)}
              onPointerUp={() => hold(k, false)}
              onPointerLeave={() => hold(k, false)}
            >
              {k === 'up' ? '▲' : k === 'down' ? '▼' : k === 'left' ? '◀' : '▶'}
            </button>
          ))}
        </div>
      </div>

      <footer className="explore-foot">
        <p className="fine">
          <kbd>↑ ↓ ← →</kbd> ou <kbd>Z Q S D</kbd> pour marcher · <kbd>E</kbd> pour parler · clic pour se déplacer · <kbd>Échap</kbd> pour passer
        </p>
        <div className="explore-people" role="group" aria-label="Personnes présentes">
          {world.npcs.map((n) => (
            <button key={n.id} className="chip" onClick={() => walkTo(n)} disabled={!!talking}>
              Aller parler à {renderText(n.name, ctx)}
            </button>
          ))}
        </div>
      </footer>
    </section>
  );
}

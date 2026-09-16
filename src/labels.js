// =============================================================================
//  Étiquettes de zones (nom + surface m²) : overlay HTML repositionné à chaque
//  frame par projection écran. Léger, sans dépendance supplémentaire.
// =============================================================================
import { viewer, worldToScreen, planToWorld, onAfterRender } from './viewer.js';
import { store } from './store.js';
import { polygonCentroid, polygonArea } from './geometry.js';
import { poleColor } from './config.js';

let layer = null;
const pool = []; // divs réutilisables

export function initLabels(container) {
  layer = document.createElement('div');
  layer.className = 'label-layer';
  container.appendChild(layer);
  onAfterRender(updateLabels);
}

function getDiv(i) {
  if (pool[i]) return pool[i];
  const el = document.createElement('div');
  el.className = 'zone-label';
  layer.appendChild(el);
  pool[i] = el;
  return el;
}

function updateLabels() {
  if (!layer) return;
  const p = store.project;
  const active = p.activeLevelId;
  const focus = store.focusPoles;

  let i = 0;
  for (const z of p.zones) {
    if (z.levelId !== active) continue;
    if (!z.points || z.points.length < 3) continue;
    const c = polygonCentroid(z.points);
    const lvl = p.levels.find((l) => l.id === z.levelId);
    const world = planToWorld(c.x, c.y, (lvl?.elevation ?? 0) + 0.05);
    const s = worldToScreen(world);
    const dimmed = focus.size > 0 && !focus.has(z.pole);
    if (dimmed && store.focusMode === 'masquer') continue; // zone masquée : pas d'étiquette
    const el = getDiv(i++);
    if (!s.visible) { el.style.display = 'none'; continue; }
    const area = polygonArea(z.points);
    el.style.display = 'block';
    el.style.left = `${s.x}px`;
    el.style.top = `${s.y}px`;
    el.style.opacity = dimmed ? '0.25' : '1';
    el.style.borderColor = poleColor(z.pole);
    el.innerHTML = `<span class="zl-name">${escapeHtml(z.name || '—')}</span>` +
      `<span class="zl-area">${area.toFixed(1)} m²</span>`;
  }
  // Masque les divs excédentaires.
  for (; i < pool.length; i++) pool[i].style.display = 'none';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

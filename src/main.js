// =============================================================================
//  Bootstrap : initialise le viewer, les outils, l'UI, branche la
//  reconstruction 3D sur les changements d'état, charge la bibliothèque de
//  projets (ou l'exemple au tout premier lancement).
// =============================================================================
import { initViewer, frameScene } from './viewer.js';
import { initLabels } from './labels.js';
import { initTools } from './tools.js';
import { initUI } from './ui.js';
import { rebuild } from './builder.js';
import { subscribe, initLibrary, setProject, store } from './store.js';
import { seedProject } from './seed.js';

const SEED_FLAG = 'agencement3d.seeded';

function boot() {
  const viewport = document.getElementById('viewport');
  initViewer(viewport);
  initLabels(viewport);
  initTools();
  initUI();

  // Toute modification d'état -> on reconstruit la 3D.
  subscribe(() => rebuild());

  // Charge la bibliothèque locale.
  initLibrary();

  // Au tout premier lancement (aucune sauvegarde antérieure), charge l'exemple.
  let seeded = false;
  try { seeded = !!localStorage.getItem(SEED_FLAG); } catch { /* ignore */ }
  const emptyStart = store.project.zones.length === 0 && store.project.walls.length === 0;
  if (!seeded && emptyStart) {
    setProject(seedProject());
    try { localStorage.setItem(SEED_FLAG, '1'); } catch { /* ignore */ }
  } else {
    rebuild();
  }
  frameScene(false);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

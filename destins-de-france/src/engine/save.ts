import { DATA_VERSION } from '../data/sources';
import { ENGINE_VERSION } from './simulation';
import type { LifeRecord, SaveGame, SimulationRun } from './types';

/**
 * Persistance. Stockage local du navigateur (localStorage) quand il est
 * disponible ; sinon, repli en mémoire pour la session (navigation privée,
 * aperçu, stockage bloqué) — l'interface l'indique. Aucune donnée n'est
 * envoyée sur un serveur.
 */

const KEY = 'destins-de-france.save.v1';
let memory: SaveGame | null = null;
let storageOk: boolean | null = null;

export function storageAvailable(): boolean {
  if (storageOk !== null) return storageOk;
  try {
    const k = '__ddf_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    storageOk = true;
  } catch {
    storageOk = false;
  }
  return storageOk;
}

export function emptySave(): SaveGame {
  return { format: 'destins-de-france-save', saveVersion: 1, engineVersion: ENGINE_VERSION, dataVersion: DATA_VERSION, savedAt: new Date().toISOString(), run: null, lives: [] };
}

export function validateSave(data: unknown): SaveGame | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Partial<SaveGame>;
  if (d.format !== 'destins-de-france-save' || d.saveVersion !== 1 || !Array.isArray(d.lives)) return null;
  if (d.unlockedCities !== undefined && !(Array.isArray(d.unlockedCities) && d.unlockedCities.every((c) => typeof c === 'string'))) return null;
  if (d.run !== null && (typeof d.run !== 'object' || typeof d.run?.seed !== 'number' || typeof d.run?.citizen !== 'object')) return null;
  return d as SaveGame;
}

export function loadSave(): SaveGame {
  if (storageAvailable()) {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) return validateSave(JSON.parse(raw)) ?? emptySave();
    } catch {
      /* sauvegarde illisible : on repart d'une sauvegarde vide */
    }
    return emptySave();
  }
  return memory ?? emptySave();
}

export function writeSave(run: SimulationRun | null, lives: LifeRecord[], unlockedCities: string[] = []): void {
  const save: SaveGame = { ...emptySave(), run, lives, unlockedCities };
  memory = save;
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    storageOk = false;
  }
}

export function exportSave(run: SimulationRun | null, lives: LifeRecord[], unlockedCities: string[] = []): string {
  return JSON.stringify({ ...emptySave(), run, lives, unlockedCities });
}

export function importSave(text: string): SaveGame | null {
  try {
    return validateSave(JSON.parse(text));
  } catch {
    return null;
  }
}

export function resetSave(): void {
  memory = null;
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignoré */
  }
}

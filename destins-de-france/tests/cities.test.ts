import { describe, expect, it } from 'vitest';
import { allowedCities, CITIES } from '../src/data/cities';
import { getRegion } from '../src/data/regions';
import { checkCoherence } from '../src/engine/coherence';
import { autoChoose, createRun, step } from '../src/engine/simulation';
import { importSave, exportSave } from '../src/engine/save';

describe('mode Villes', () => {
  it('chaque ville existe dans sa région', () => {
    for (const c of CITIES) expect(getRegion(c.regionId).places.metropole).toContain(c.place);
  });

  it('la naissance a lieu dans la ville choisie, le reste reste aléatoire', () => {
    const runs = Array.from({ length: 30 }, (_, i) => createRun(300 + i, undefined, { cityId: 'lille' }));
    expect(runs.every((r) => r.citizen.birthPlace === 'Lille' && r.citizen.regionId === 'hdf' && r.citizen.territory === 'metropole')).toBe(true);
    expect(runs.every((r) => r.citizen.cityId === 'lille')).toBe(true);
    expect(new Set(runs.map((r) => r.household.percentile.toFixed(2))).size).toBeGreaterThan(20);
  });

  it('une vie en mode Villes se joue jusqu\'au bout sans incohérence', () => {
    for (const c of CITIES) {
      let r = createRun(42, undefined, { cityId: c.id });
      for (let i = 0; i < 2000 && r.alive; i++) {
        r = r.pending ? autoChoose(r) : step(r);
        expect(checkCoherence(r)).toEqual([]);
      }
      expect(r.alive).toBe(false);
    }
  });

  it('une ville se débloque toutes les 10 vies', () => {
    expect(allowedCities(0)).toBe(1);
    expect(allowedCities(9)).toBe(1);
    expect(allowedCities(10)).toBe(2);
    expect(allowedCities(25)).toBe(3);
    expect(allowedCities(10_000)).toBe(CITIES.length);
  });

  it('la progression des villes est sauvegardée et restaurée', () => {
    const save = importSave(exportSave(null, [], ['paris', 'nice']));
    expect(save?.unlockedCities).toEqual(['paris', 'nice']);
  });
});

import { it } from 'vitest';
import { autoChoose, createRun, step } from '../src/engine/simulation';

// Rapport de validation (affiché, non bloquant) : compare quelques distributions simulées aux repères observés.
it('rapport de validation statistique', () => {
  const N = 1500;
  let idf = 0, bac = 0, poor = 0;
  const deathF: number[] = [], deathM: number[] = [];
  for (let i = 0; i < N; i++) {
    let r = createRun(123457 + i * 31);
    if (r.citizen.regionId === 'idf') idf++;
    if (r.household.standardOfLiving < 0.6 * 25760) poor++;
    for (let k = 0; k < 2000 && r.alive; k++) r = r.pending ? autoChoose(r) : step(r);
    if (r.flags.bac_obtenu !== undefined) bac++;
    (r.citizen.sex === 'F' ? deathF : deathM).push((r.deathAge ?? 0) + 0.5);
  }
  const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
  const pct = (x: number) => `${((100 * x) / N).toFixed(1)} %`;
  console.log(
    [
      `Vies simulées : ${N} (mode automatique)`,
      `Naissances en Île-de-France : ${pct(idf)} (repère Insee 2025 : ≈ 23 %)`,
      `Foyers sous le seuil de pauvreté (modèle) : ${pct(poor)} (repère Insee 2023 : 15,4 %, champ différent)`,
      `Bacheliers : ${pct(bac)} (repère DEPP 2025 : 80,1 % d'une génération)`,
      `Durée de vie moyenne simulée, femmes : ${mean(deathF).toFixed(1)} ans (calibrage : 85,9)`,
      `Durée de vie moyenne simulée, hommes : ${mean(deathM).toFixed(1)} ans (calibrage : 80,3)`,
    ].join('\n'),
  );
}, 120000);

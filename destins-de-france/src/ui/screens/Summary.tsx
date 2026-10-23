import { summarize } from '../../engine/summary';
import type { SimulationRun } from '../../engine/types';
import { Portrait } from '../art/Portrait';
import { StatusBadge } from '../components/common';

export function Summary({ run, onNewLife, onHistory, onHome, newCityAvailable }: { run: SimulationRun; onNewLife: () => void; onHistory: () => void; onHome: () => void; newCityAvailable: boolean }) {
  const s = summarize(run);
  return (
    <main className="summary">
      <section className="summary-hero">
        <Portrait age={run.deathAge ?? run.age} sex={run.citizen.sex} hue={run.citizen.portraitHue} size={150} alive={false} title={`Portrait souvenir de ${run.citizen.firstName}`} />
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">Une vie</span>
          <h1>{s.headline}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status="fictif" />
            <span className="fine">Une vie simulée, unique, qui ne représente statistiquement personne.</span>
          </div>
        </div>
      </section>
      <section className="summary-body">
        <div className="summary-text">
          {s.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card panel">
            <h3>Repères</h3>
            <dl className="kv">
              {s.facts.map((f) => (
                <div key={f.label} style={{ display: 'contents' }}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {s.keyChoices.length > 0 && (
            <div className="card panel">
              <h3>Choix déterminants</h3>
              <ul className="memories">
                {s.keyChoices.map((c, i) => (
                  <li key={i}>
                    <span>{c.split(' — ')[0]}</span>
                    <span>{c.split(' — ').slice(1).join(' — ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card panel">
            <h3>Souvenirs</h3>
            <ul className="memories">
              {s.memories.map((m, i) => (
                <li key={i}>
                  <span>
                    {m.year} · {m.age} ans
                  </span>
                  <span>{m.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      {newCityAvailable && (
        <p className="notice" role="status">
          <b>Une nouvelle ville est débloquée.</b> Vous pourrez la choisir dans le mode Villes.
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onNewLife} autoFocus>
          {run.citizen.cityId ? 'Naître à nouveau (choisir la ville)' : 'Naître à nouveau, ailleurs'}
        </button>
        <button className="btn" onClick={onHistory}>
          Comparer les vies
        </button>
        <button className="btn btn-ghost" onClick={onHome}>
          Accueil
        </button>
      </div>
    </main>
  );
}

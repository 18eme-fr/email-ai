import { EDUCATION_LABELS } from '../../data/jobs';
import { TERRITORY_LABELS } from '../../data/regions';
import type { LifeRecord } from '../../engine/types';
import { euros } from '../components/common';

export function History({ lives, onBack }: { lives: LifeRecord[]; onBack: () => void }) {
  const sorted = [...lives].reverse();
  return (
    <main className="page">
      <div className="page-head">
        <h1>Vies passées</h1>
        <button className="btn" onClick={onBack}>
          Retour
        </button>
      </div>
      <p className="notice">
        Comparer quelques vies aide à voir des contrastes, pas à établir des faits : {lives.length} vie{lives.length > 1 ? 's' : ''} ne{' '}
        {lives.length > 1 ? 'forment' : 'forme'} pas un échantillon statistique. Chaque vie est indépendante des autres.
      </p>
      {lives.length === 0 ? (
        <p className="muted">Aucune vie terminée pour l'instant.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Personne</th>
                <th>Naissance</th>
                <th>Milieu d'origine</th>
                <th>Diplôme</th>
                <th>Dernier métier</th>
                <th>Patrimoine final*</th>
                <th>Engagement</th>
                <th>Âge au décès</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((l) => (
                <tr key={l.id + l.endedAt}>
                  <td>
                    <b>{l.name}</b>
                    <div className="fine">{l.keyMoments.slice(0, 3).join(' · ')}</div>
                  </td>
                  <td>
                    {l.birthPlace}
                    <div className="fine">
                      {l.regionName}, {TERRITORY_LABELS[l.territory]}
                    </div>
                  </td>
                  <td>
                    {l.originOccupation}
                    <div className="fine">rang de niveau de vie : {Math.round(l.originPercentile * 100)}e centile (modèle)</div>
                  </td>
                  <td>{EDUCATION_LABELS[l.education]}</td>
                  <td>{l.lastJob}</td>
                  <td className="num">{euros(l.finalSavings)}</td>
                  <td>
                    {l.engagements.length > 0 ? l.engagements.join(', ') : '—'}
                    {l.mandates > 0 && <div className="fine">{l.mandates} mandat(s)</div>}
                  </td>
                  <td className="num">{l.deathAge} ans</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="fine">* Épargne moins dettes, estimation de jeu en euros 2026.</p>
    </main>
  );
}

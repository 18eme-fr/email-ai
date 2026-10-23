import { getRegion, NEIGHBOURHOOD_LABELS, TERRITORY_LABELS } from '../../data/regions';
import type { SimulationRun } from '../../engine/types';
import { Portrait } from '../art/Portrait';
import { SourceLinks, StatusBadge } from '../components/common';
import { standardOfLivingText } from '../../data/events/helpers';

const TENURE: Record<string, string> = {
  locataire_prive: 'Locataire (parc privé)',
  locataire_social: 'Locataire (logement social)',
  proprietaire: 'Propriétaire',
  heberge: 'Hébergée par des proches',
  precaire: 'Logement précaire',
};

const STRUCTURE: Record<string, string> = {
  deux_parents: 'Deux parents',
  monoparentale: 'Famille monoparentale',
  recomposee: 'Famille recomposée',
};

/** Révélation progressive de l'existence attribuée, sous la forme d'un acte de naissance stylisé (non officiel). */
export function Birth({ run, onStart, onReroll, onSource }: { run: SimulationRun; onStart: () => void; onReroll: () => void; onSource: (id: string) => void }) {
  const c = run.citizen;
  const region = getRegion(c.regionId);
  const parents = run.household.parents.map((p) => `${run.people.find((x) => x.id === p.personId)?.name ?? ''}, ${p.occupationLabel}`);
  const rows: [string, string][] = [
    ['Année', String(c.birthYear)],
    ['Prénom et nom', `${c.firstName} ${c.lastName}`],
    ['Lieu', `${c.birthPlace} — ${region.name}`],
    ['Territoire', `${TERRITORY_LABELS[c.territory]}, ${NEIGHBOURHOOD_LABELS[c.neighbourhood]}`],
    ['Famille', `${STRUCTURE[run.household.structure]}${run.household.siblings > 0 ? `, ${run.household.siblings} aîné${run.household.siblings > 1 ? 's' : ''}` : ''}`],
    ['Parents', parents.join(' · ')],
    ['Logement', TENURE[run.household.tenure] ?? ''],
    ['Niveau de vie estimé', standardOfLivingText(run)],
  ];
  return (
    <main className="birth">
      <article className="acte" aria-labelledby="acte-title">
        <div className="acte-head">
          <span className="eyebrow">Une existence parmi d'autres</span>
          <h1 id="acte-title">Vous êtes {c.sex === 'F' ? 'née' : 'né'}.</h1>
        </div>
        <div className="acte-portrait">
          <Portrait age={0} sex={c.sex} hue={c.portraitHue} size={110} title={`Portrait de ${c.firstName}, nouveau-né`} />
        </div>
        <dl style={{ margin: 0 }}>
          {rows.map(([k, v], i) => (
            <div className="acte-row" key={k} style={{ animationDelay: `${0.35 + i * 0.45}s` }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="fine" style={{ marginTop: 14 }}>
          Ce document est fictif. Le lieu de naissance suit en partie la répartition réelle des naissances ; le niveau de vie est tiré d'un
          modèle calibré sur deux indicateurs de l'Insee. Ces conditions ne disent rien de la valeur de la personne ni de sa famille.{' '}
          <SourceLinks ids={['insee-naissances-2025', 'insee-pauvrete-2023']} onOpen={onSource} />
        </p>
        <div className="acte-foot">
          <StatusBadge status="modele" />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={onReroll} title="Le jeu est pensé pour accepter le hasard, mais vous pouvez retirer.">
              Naître ailleurs
            </button>
            <button className="btn btn-primary" onClick={onStart} autoFocus>
              Commencer cette vie
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}

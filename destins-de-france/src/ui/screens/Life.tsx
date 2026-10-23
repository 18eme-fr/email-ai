import { useMemo, useState } from 'react';
import { EDUCATION_LABELS } from '../../data/jobs';
import { getCity, type CityId } from '../../data/cities';
import { getRegion, TERRITORY_LABELS } from '../../data/regions';
import { childrenAtHome } from '../../engine/economy';
import type { LifeDomain, LifeTimelineEntry, SimulationRun } from '../../engine/types';
import { Portrait } from '../art/Portrait';
import { Scene } from '../art/Scene';
import { euros, HelpBox, Meter, qualitative, SourceLinks, StatusBadge } from '../components/common';

export type Speed = 0 | 1 | 2 | 3;

interface Props {
  run: SimulationRun;
  speed: Speed;
  storageOk: boolean;
  onSpeed: (s: Speed) => void;
  onChoose: (choiceId: string) => void;
  onSource: (id: string) => void;
  onHome: () => void;
  onToggleAuto: () => void;
}

export function lifeStage(age: number): string {
  if (age < 6) return 'I. La petite enfance';
  if (age < 12) return 'II. L\'enfance';
  if (age < 18) return 'III. L\'adolescence';
  if (age < 30) return 'IV. L\'entrée dans la vie adulte';
  if (age < 50) return 'V. La vie adulte';
  if (age < 70) return 'VI. La deuxième moitié de la vie';
  return 'VII. Le grand âge';
}

const STATUS_JOB: Record<string, string> = {
  enfant: 'Enfant',
  etudiant: 'En études',
  emploi: 'En emploi',
  chomage: 'Au chômage',
  independant: 'À son compte',
  inactif: 'Sans emploi',
  retraite: 'À la retraite',
};
const STUDY: Record<string, string> = {
  non_scolarise: 'Pas encore à l\'école',
  maternelle: 'École maternelle',
  elementaire: 'École élémentaire',
  college: 'Collège',
  lycee: 'Lycée',
  apprentissage: 'Apprentissage',
  superieur: 'Études supérieures',
  termine: 'Études terminées',
};
const TENURE: Record<string, string> = {
  locataire_prive: 'locataire',
  locataire_social: 'logement social',
  proprietaire: 'propriétaire',
  heberge: 'hébergement chez des proches',
  precaire: 'logement précaire',
};
const DOMAINS: { id: LifeDomain | 'tout' | 'souvenirs'; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'souvenirs', label: 'Souvenirs' },
  { id: 'famille', label: 'Famille' },
  { id: 'ecole', label: 'École' },
  { id: 'travail', label: 'Travail' },
  { id: 'citoyennete', label: 'Citoyenneté' },
];

function Sidebar({ run }: { run: SimulationRun }) {
  const f = run.finances;
  const close = run.people.filter((p) => p.alive && p.closeness >= 50 && p.kind !== 'enfant').length;
  const kids = childrenAtHome(run);
  const isChild = run.employment.status === 'enfant';
  return (
    <aside className="sidebar" aria-label="Situation du personnage">
      <section className="card panel">
        <h3>
          Argent <span className="fine">estimation de jeu, € 2026</span>
        </h3>
        {isChild ? (
          <p className="fine">
            Le foyer : niveau de vie de {euros(run.household.standardOfLiving / 12)} par mois et par unité de consommation (modèle).
          </p>
        ) : (
          <dl className="kv">
            <dt>Revenu mensuel</dt>
            <dd>{euros(f.monthlyIncome)}</dd>
            <dt>Dépenses mensuelles</dt>
            <dd>{euros(f.monthlyExpenses)}</dd>
            <dt>Épargne</dt>
            <dd>{euros(f.savings)}</dd>
            {f.debt > 0 && (
              <>
                <dt>Dette</dt>
                <dd style={{ color: 'var(--warn)' }}>{euros(f.debt)}</dd>
              </>
            )}
          </dl>
        )}
        {run.flags.fins_de_mois_difficiles !== undefined && <p className="fine" style={{ color: 'var(--warn)' }}>Fins de mois difficiles : le revenu ne couvre pas les dépenses.</p>}
      </section>
      <section className="card panel">
        <h3>
          Santé et liens <span className="fine">indicateurs de jeu</span>
        </h3>
        <Meter label="Santé physique" value={run.health.physical} word={qualitative(run.health.physical)} />
        <Meter label="Bien-être" value={run.health.wellbeing} word={qualitative(run.health.wellbeing)} />
        <Meter label="Soutien social" value={run.social} word={qualitative(run.social)} />
        <Meter label="Engagement collectif" value={run.civic.engagement} word={run.civic.engagement > 55 ? 'engagé' : run.civic.engagement > 30 ? 'curieux' : 'à distance'} />
        <p className="fine">Ces jauges ne sont pas des mesures scientifiques : elles résument l'état du personnage pour le jeu.</p>
      </section>
      <section className="card panel">
        <h3>Vie</h3>
        <dl className="kv">
          <dt>Activité</dt>
          <dd>{run.employment.status === 'emploi' || run.employment.status === 'independant' ? run.employment.jobLabel : STATUS_JOB[run.employment.status]}</dd>
          <dt>Scolarité</dt>
          <dd>{STUDY[run.education.status]}</dd>
          <dt>Diplôme</dt>
          <dd>{EDUCATION_LABELS[run.education.level]}</dd>
          <dt>Logement</dt>
          <dd>{run.housing.withParents ? 'chez les parents' : TENURE[run.housing.tenure]}</dd>
          <dt>Proches</dt>
          <dd>
            {close} lien{close > 1 ? 's' : ''} fort{close > 1 ? 's' : ''}
            {kids > 0 ? `, ${kids} enfant${kids > 1 ? 's' : ''} à charge` : ''}
          </dd>
          {run.civic.memberships.length > 0 && (
            <>
              <dt>Engagements</dt>
              <dd>{run.civic.memberships.length}</dd>
            </>
          )}
          {run.health.autonomy !== 'complete' && (
            <>
              <dt>Autonomie</dt>
              <dd>{run.health.autonomy === 'dependance' ? 'aide quotidienne' : 'aide partielle'}</dd>
            </>
          )}
        </dl>
      </section>
      <section className="card panel">
        <h3>Entourage</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4, fontSize: '0.88rem' }}>
          {run.people.slice(0, 9).map((p) => (
            <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, opacity: p.alive ? 1 : 0.55 }}>
              <span>
                {p.name} <span className="fine">· {p.kind === 'fratrie' ? 'fratrie' : p.kind}</span>
              </span>
              <span className="fine">{p.alive ? qualitative(p.closeness) : (p.sex === 'F' ? 'disparue' : 'disparu')}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function EventCard({ run, onChoose, onSource }: { run: SimulationRun; onChoose: (id: string) => void; onSource: (id: string) => void }) {
  const ev = run.pending!;
  return (
    <section className="card event-card" aria-live="polite" aria-labelledby="ev-title">
      <div className="event-meta">
        <span className="eyebrow">
          {run.age} ans · {run.year}
        </span>
        <StatusBadge status={ev.status} />
      </div>
      <h2 id="ev-title">{ev.title}</h2>
      <p className="event-text">{ev.text}</p>
      {ev.sensitive && <HelpBox />}
      <div className="choices" role="group" aria-label="Décisions possibles">
        {ev.choices.map((c, i) => (
          <button key={c.id} className="choice" onClick={() => onChoose(c.id)} autoFocus={i === 0}>
            <b>{c.label}</b>
            {c.hint && <small>{c.hint}</small>}
          </button>
        ))}
      </div>
      <SourceLinks ids={ev.sourceIds} onOpen={onSource} />
    </section>
  );
}

function FeedItem({ e, latest, onSource }: { e: LifeTimelineEntry; latest: boolean; onSource: (id: string) => void }) {
  return (
    <article className={`card feed-item${latest ? ' latest' : ''}`}>
      <div className="feed-head">
        <h3>{e.title}</h3>
        <span className="feed-age">
          {e.age} ans · {e.year}
        </span>
      </div>
      <p>{e.text}</p>
      {e.choiceLabel && <p className="decision-line">Décision : {e.choiceLabel}</p>}
      <div className="event-meta">
        <StatusBadge status={e.status} />
        <SourceLinks ids={e.sourceIds} onOpen={onSource} />
      </div>
    </article>
  );
}

function Journal({ run, onPick }: { run: SimulationRun; onPick: (e: LifeTimelineEntry) => void }) {
  const [filter, setFilter] = useState<(typeof DOMAINS)[number]['id']>('tout');
  const entries = useMemo(
    () => run.timeline.filter((t) => filter === 'tout' || (filter === 'souvenirs' ? t.memorable : t.domain === filter)).slice().reverse(),
    [run.timeline, filter],
  );
  return (
    <aside className="card journal" aria-label="Journal de vie">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Journal de vie</h3>
      <div className="journal-filter" role="group" aria-label="Filtrer le journal">
        {DOMAINS.map((d) => (
          <button key={d.id} className="chip" style={{ minHeight: 30, padding: '3px 10px', fontSize: '0.8rem' }} aria-pressed={filter === d.id} onClick={() => setFilter(d.id)}>
            {d.label}
          </button>
        ))}
      </div>
      <ol>
        {entries.map((t) => (
          <li key={t.id}>
            <button onClick={() => onPick(t)}>
              <span className="j-age">{t.age} ans</span>
              <span className={t.memorable ? 'j-mem' : ''}>{t.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function Life({ run, speed, storageOk, onSpeed, onChoose, onSource, onHome, onToggleAuto }: Props) {
  const [picked, setPicked] = useState<LifeTimelineEntry | null>(null);
  const region = getRegion(run.citizen.regionId);
  const recent = run.timeline.slice(-5).reverse();
  const paused = speed === 0 || !!run.pending;
  // Décor propre à la ville tant que le personnage y habite.
  const city = run.citizen.cityId ? getCity(run.citizen.cityId) : undefined;
  const cityScene: CityId | undefined = city && run.housing.place === city.place ? city.id : undefined;
  return (
    <main className="life">
      <header className="topbar">
        <div className="topbar-id">
          <Portrait age={run.age} sex={run.citizen.sex} hue={run.citizen.portraitHue} size={52} title={`Portrait de ${run.citizen.firstName}, ${run.age} ans`} />
          <div style={{ minWidth: 0 }}>
            <h2>
              {run.citizen.firstName} {run.citizen.lastName}
            </h2>
            <span className="fine">
              {run.housing.place} · {region.name}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }} aria-live="off">
          <span className="age-big">{run.age}</span>
          <span className="age-unit">
            ans · {run.year}
          </span>
        </div>
        <div className="speed" role="group" aria-label="Vitesse du temps">
          <button aria-pressed={speed === 0} onClick={() => onSpeed(0)} title="Pause (barre d'espace)">
            ❚❚
          </button>
          <button aria-pressed={speed === 1} onClick={() => onSpeed(1)} title="Lent">
            ▶
          </button>
          <button aria-pressed={speed === 2} onClick={() => onSpeed(2)} title="Normal">
            ▶▶
          </button>
          <button aria-pressed={speed === 3} onClick={() => onSpeed(3)} title="Rapide">
            ▶▶▶
          </button>
        </div>
        <button className="btn btn-small" aria-pressed={run.settings.autoMode} onClick={onToggleAuto} title="Le moteur choisit à votre place (tirage reproductible)">
          {run.settings.autoMode ? 'Auto : activé' : 'Auto : désactivé'}
        </button>
        <button className="btn btn-small btn-ghost" onClick={onHome}>
          Accueil
        </button>
      </header>

      <div className="scene-wrap">
        <Scene territory={run.housing.territory} landscape={city && cityScene ? city.landscape : region.landscape} city={cityScene} age={run.age} paused={paused} height={200} />
        <div className="scene-caption">
          <span>{cityScene && city ? city.name : TERRITORY_LABELS[run.housing.territory]}</span>
          <span>{lifeStage(run.age)}</span>
          {!storageOk && <span title="Le stockage du navigateur est indisponible : la partie est gardée en mémoire jusqu'à la fermeture de la page.">Sauvegarde : mémoire seulement</span>}
        </div>
      </div>

      <div className="life-grid">
        <Sidebar run={run} />
        <div className="story">
          <p className="chapter">{lifeStage(run.age)}</p>
          {run.pending ? (
            <EventCard run={run} onChoose={onChoose} onSource={onSource} />
          ) : speed === 0 ? (
            <div className="card panel" style={{ textAlign: 'center' }}>
              <p>Le temps est suspendu. Relisez, consultez le journal, puis reprenez quand vous voulez.</p>
              <div>
                <button className="btn btn-primary" onClick={() => onSpeed(2)}>
                  Reprendre le cours de la vie
                </button>
              </div>
            </div>
          ) : null}
          {picked && (
            <div className="card panel" style={{ borderLeft: '3px solid var(--memory)' }}>
              <div className="feed-head">
                <span className="eyebrow">Relu dans le journal</span>
                <button className="link-btn" onClick={() => setPicked(null)}>
                  Fermer
                </button>
              </div>
              <FeedItem e={picked} latest={false} onSource={onSource} />
            </div>
          )}
          <div className="feed" aria-live="polite">
            {recent.map((e, i) => (
              <FeedItem key={e.id} e={e} latest={i === 0 && !run.pending} onSource={onSource} />
            ))}
          </div>
        </div>
        <Journal run={run} onPick={setPicked} />
      </div>
    </main>
  );
}

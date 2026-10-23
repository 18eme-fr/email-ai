import { useState } from 'react';
import { FRAMEWORKS } from '../../data/frameworks';
import { DATA_VERSION, SOURCE_THEMES, SOURCES } from '../../data/sources';
import { DEMO_PARAMETERS } from '../../engine/demography';
import { ECONOMY_PARAMETERS } from '../../engine/economy';
import { MORTALITY_PARAMETERS, modelLifeExpectancy } from '../../engine/mortality';
import type { EpistemicStatus } from '../../engine/types';
import { STATUS_HELP, STATUS_LABELS, StatusBadge } from '../components/common';

export type LibraryTab = 'sources' | 'parametres' | 'cadres' | 'methode';

const PARAMETERS = [...MORTALITY_PARAMETERS, ...DEMO_PARAMETERS, ...ECONOMY_PARAMETERS];

export function Library({ initialTab, onSource, onBack }: { initialTab: LibraryTab; onSource: (id: string) => void; onBack: () => void }) {
  const [tab, setTab] = useState<LibraryTab>(initialTab);
  const themes = [...new Set(SOURCES.map((s) => s.theme))];
  return (
    <main className="page">
      <div className="page-head">
        <h1>Bibliothèque documentaire</h1>
        <button className="btn" onClick={onBack}>
          Retour
        </button>
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['sources', 'Sources et données'],
            ['parametres', 'Paramètres du moteur'],
            ['cadres', 'Cadres intellectuels'],
            ['methode', 'Méthode et limites'],
          ] as [LibraryTab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className="chip" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'sources' &&
        themes.map((theme) => (
          <section key={theme} style={{ display: 'grid', gap: 10 }}>
            <h2 style={{ fontSize: '1.6rem' }}>{SOURCE_THEMES[theme]}</h2>
            <div className="source-list">
              {SOURCES.filter((s) => s.theme === theme).map((s) => (
                <article key={s.id} className="card source-card">
                  <div className="event-meta">
                    <span className="eyebrow">{s.producer}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <h3>{s.indicator}</h3>
                  {s.value && <div className="source-value">{s.value}</div>}
                  <p className="fine">
                    {s.period} · {s.geography}
                  </p>
                  <div>
                    <button className="link-btn" onClick={() => onSource(s.id)}>
                      Comprendre et vérifier
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

      {tab === 'parametres' && (
        <section style={{ display: 'grid', gap: 12 }}>
          <p className="prose">
            Chaque paramètre utilisé par le moteur est listé ici avec sa nature. Les paramètres « de démonstration » font fonctionner le
            prototype mais n'ont aucune prétention de réalisme statistique ; ils seront remplacés à mesure que les données seront intégrées.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Paramètre</th>
                  <th>Nature</th>
                  <th>Méthode</th>
                  <th>Sources</th>
                </tr>
              </thead>
              <tbody>
                {PARAMETERS.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.label}</b>
                      <div className="fine">{p.validity}</div>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ minWidth: 260 }}>{p.method}</td>
                    <td>
                      {p.sourceIds.length === 0
                        ? 'Aucune (donnée manquante)'
                        : p.sourceIds.map((id) => (
                            <button key={id} className="link-btn" onClick={() => onSource(id)}>
                              {id}
                            </button>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine">
            Contrôle : espérance de vie implicite du modèle de mortalité = {modelLifeExpectancy('F').toFixed(1)} ans (femmes) et{' '}
            {modelLifeExpectancy('M').toFixed(1)} ans (hommes), avant l'effet de la santé de jeu.
          </p>
        </section>
      )}

      {tab === 'cadres' && (
        <section style={{ display: 'grid', gap: 12 }}>
          <p className="prose">
            Ces travaux orientent l'écriture : ils aident à choisir quelles situations montrer et quelles questions poser. Aucun n'est
            converti en probabilité. Aucune citation n'est reproduite. Les références bibliographiques n'ont pas encore été revérifiées en
            ligne pour cette version.
          </p>
          <div className="source-list">
            {FRAMEWORKS.map((f) => (
              <article key={f.id} className="card source-card">
                <span className="eyebrow">
                  {f.author} · {f.year}
                </span>
                <h3>{f.concept}</h3>
                <p className="fine">
                  <i>{f.work}</i>, {f.publication}
                </p>
                <p>
                  <b>Dans le jeu.</b> {f.useInGame}
                </p>
                <p className="muted">
                  <b>Limites.</b> {f.limits}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'methode' && <Method />}
    </main>
  );
}

function Method() {
  return (
    <section className="prose">
      <h2>Ce que chaque étiquette veut dire</h2>
      <ul>
        {(Object.keys(STATUS_LABELS) as EpistemicStatus[]).map((s) => (
          <li key={s}>
            <StatusBadge status={s} /> {STATUS_HELP[s]}
          </li>
        ))}
      </ul>
      <h2>Comment une vie est simulée</h2>
      <p>
        Le moteur avance d'une année à la fois. À chaque année : mise à jour de l'âge, transitions scolaires et professionnelles, bilan
        financier (une seule écriture comptable par an), évolution de la santé et du bien-être de jeu, vieillissement des proches, tirage
        du décès selon le modèle de mortalité, puis événements : conséquences différées, jalons de vie, et parfois un événement aléatoire.
        Une décision arrête le temps jusqu'à votre choix.
      </p>
      <p>
        Le hasard est produit par un générateur à graine enregistrée dans la partie : une même graine et les mêmes choix redonnent
        exactement la même vie (c'est vérifié par les tests automatiques).
      </p>
      <h2>Ce qui est solide, et ce qui ne l'est pas encore</h2>
      <ul>
        <li>
          <b>Calibré sur des données observées :</b> la part des naissances en Île-de-France et à La Réunion, la distribution des niveaux
          de vie (médiane et taux de pauvreté), l'espérance de vie moyenne, la proportion moyenne de bacheliers (repère).
        </li>
        <li>
          <b>Règles juridiques appliquées :</b> instruction obligatoire dès 3 ans, majorité et vote à 18 ans, éligibilité municipale à 18
          ans, diplômes requis pour les professions réglementées (médecin, infirmier, enseignant...).
        </li>
        <li>
          <b>Paramètres de démonstration :</b> autres régions, professions des parents, salaires par métier, loyers, risques de chômage,
          chances de réussite scolaire, prestations et pensions. Ils sont plausibles mais non validés.
        </li>
        <li>
          <b>Pas encore modélisé :</b> calcul réel des aides et impôts, écarts de salaire femmes-hommes, discriminations, inégalités sociales
          d'espérance de vie, autres territoires ultramarins, vraies tables de mortalité par âge, partis réels et vie parlementaire.
        </li>
      </ul>
      <h2>Ce que le jeu ne prétend pas</h2>
      <p>
        Le jeu ne prédit pas de destin. Une corrélation n'y est jamais présentée comme une cause. Quelques vies jouées ne constituent pas un
        échantillon représentatif. Les opinions politiques du personnage ne sont jamais déduites de son milieu, de son sexe ou de son
        territoire, et aucune formation politique ne bénéficie d'un avantage narratif. Les élections futures sont hypothétiques, avec des
        listes et des candidats fictifs.
      </p>
      <h2>Vérification des sources</h2>
      <p>
        Dans cette version, les données ont été relevées dans les extraits de pages officielles fournis par un moteur de recherche le 23
        octobre 2026 : la lecture directe des sites de l'Insee et de Légifrance n'était pas possible depuis l'environnement de
        développement. Chaque fiche le précise. Une relecture sur les documents originaux est la prochaine étape. Version des données :{' '}
        {DATA_VERSION}.
      </p>
    </section>
  );
}

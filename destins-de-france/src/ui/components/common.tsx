import { useEffect, useRef } from 'react';
import { getSource, HELP_RESOURCES } from '../../data/sources';
import type { EpistemicStatus } from '../../engine/types';

export const STATUS_LABELS: Record<EpistemicStatus, string> = {
  verifie: 'Fait vérifié',
  statistique: 'Donnée observée',
  modele: 'Résultat du modèle',
  prospectif: 'Scénario hypothétique',
  fictif: 'Situation fictive',
  demonstration: 'Paramètre de démonstration',
};

export const STATUS_HELP: Record<EpistemicStatus, string> = {
  verifie: 'Fait juridique, institutionnel ou historique vérifié à la date indiquée.',
  statistique: 'Donnée publiée par un organisme statistique, avec sa période et son champ.',
  modele: 'Produit par un modèle probabiliste du jeu, dont les hypothèses sont documentées.',
  prospectif: 'Le futur n\'a pas eu lieu : cette situation est une hypothèse plausible, pas une prévision.',
  fictif: 'Situation individuelle inventée pour le récit.',
  demonstration: 'Valeur provisoire nécessaire au prototype, non validée scientifiquement.',
};

export function StatusBadge({ status }: { status: EpistemicStatus }) {
  return (
    <span className={`status status-${status}`} title={STATUS_HELP[status]}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Meter({ label, value, word }: { label: string; value: number; word?: string }) {
  const v = Math.round(value);
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{label}</span>
        <b>{word ?? v}</b>
      </div>
      <div className="meter-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={`${label} : ${v} sur 100 (indicateur de jeu)`}>
        <span className={v < 30 ? 'low' : ''} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function qualitative(v: number): string {
  if (v >= 80) return 'très bon';
  if (v >= 62) return 'bon';
  if (v >= 45) return 'moyen';
  if (v >= 28) return 'fragile';
  return 'très fragile';
}

export const euros = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;

/** Fenêtre modale « Comprendre et vérifier ». */
export function SourceSheet({ sourceId, onClose }: { sourceId: string; onClose: () => void }) {
  const s = getSource(sourceId);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!s) return null;
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="sheet card" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="event-meta">
          <span className="eyebrow">Comprendre et vérifier</span>
          <StatusBadge status={s.status} />
        </div>
        <h2 id="sheet-title">{s.indicator}</h2>
        <p>{s.plainExplanation}</p>
        {s.value && <div className="source-value">{s.value}</div>}
        <dl>
          <dt>Période</dt>
          <dd>{s.period}</dd>
          <dt>Champ</dt>
          <dd>
            {s.geography} — {s.population}
          </dd>
          <dt>Source</dt>
          <dd>
            {s.producer}, <i>{s.documentTitle}</i>
            {s.section ? `, ${s.section}` : ''} ({s.publicationDate})
          </dd>
          <dt>Lien</dt>
          <dd>
            <a href={s.url} target="_blank" rel="noreferrer noopener">
              {s.url}
            </a>
          </dd>
          <dt>Méthode</dt>
          <dd>{s.method}</dd>
          <dt>Limites</dt>
          <dd>{s.limits}</dd>
          {s.controversy && (
            <>
              <dt>Débats</dt>
              <dd>{s.controversy}</dd>
            </>
          )}
          <dt>Vérification</dt>
          <dd>
            {s.verificationNote} Dernière vérification : {s.lastChecked}. Confiance :{' '}
            {s.confidence === 'elevee' ? 'élevée' : s.confidence === 'moyenne' ? 'moyenne' : 'à confirmer'}.
          </dd>
          <dt>Licence</dt>
          <dd>{s.license}</dd>
        </dl>
        <div>
          <button ref={closeRef} className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export function SourceLinks({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  if (ids.length === 0) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap' }}>
      {ids.map((id) => (
        <button key={id} className="link-btn" onClick={() => onOpen(id)}>
          Comprendre et vérifier{ids.length > 1 ? ` (${getSource(id)?.subject ?? id})` : ''}
        </button>
      ))}
    </span>
  );
}

export function HelpBox() {
  return (
    <div className="help-box" role="note">
      <b>Si ces sujets vous touchent personnellement :</b>
      <ul style={{ margin: '6px 0 0', paddingLeft: '1.1rem' }}>
        {HELP_RESOURCES.map((h) => (
          <li key={h.label}>
            {h.label} : <b>{h.contact}</b>
            {h.note ? ` — ${h.note}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

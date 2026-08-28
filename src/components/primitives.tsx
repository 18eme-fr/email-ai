'use client';

import { NR, isNR, scaleLabel } from '@/lib/format';

/** Titre de section de fiche. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 mt-1 font-serif text-[13px] font-medium uppercase tracking-[0.14em] text-accent">
      {children}
    </h3>
  );
}

/** Ligne « libellé : valeur » avec repli « information non renseignée ». */
export function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const empty = isNR(value);
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-1.5 text-sm last:border-b-0">
      <span className="shrink-0 text-ink-muted">{label}</span>
      <span className={empty ? 'text-right text-xs italic text-ink-muted/70' : 'text-right font-medium text-ink'}>
        {empty ? NR : String(value)}
      </span>
    </div>
  );
}

/** Barre 0–5 pour le profil gustatif. */
export function ScaleBar({ label, value }: { label: string; value: number | null }) {
  const pct = value === null ? 0 : (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <div className="py-1">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[13px] text-ink-soft">{label}</span>
        <span className="text-[11px] text-ink-muted">{scaleLabel(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-soft">
        {value !== null && (
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

/** Petite pastille / étiquette. */
export function Chip({
  children,
  tone = 'neutral',
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'gold';
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line bg-paper-card text-ink-soft hover:border-ink-muted',
    accent: 'border-accent/30 bg-accent-faint text-accent hover:border-accent',
    gold: 'border-gold/40 bg-gold/10 text-[#8a6a24] hover:border-gold',
  };
  const activeCls = active ? 'ring-1 ring-accent border-accent bg-accent-faint text-accent' : '';
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${tones[tone]} ${activeCls} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </Comp>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs italic text-ink-muted/70">{children}</p>;
}

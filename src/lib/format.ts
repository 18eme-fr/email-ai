/** Libellé unique pour toute donnée manquante (exigence n°19). */
export const NR = 'information non renseignée';

export function orNR(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return NR;
  return String(value);
}

export function isNR(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

export function formatHectares(ha: number | null): string {
  if (ha === null) return NR;
  return `${ha.toLocaleString('fr-FR')} ha`;
}

/** Échelle qualitative 0–5 pour les curseurs du profil gustatif. */
export const SCALE_LABELS = ['—', 'très faible', 'faible', 'moyen', 'élevé', 'très élevé'];

export function scaleLabel(v: number | null): string {
  if (v === null) return NR;
  return SCALE_LABELS[Math.max(0, Math.min(5, v))] ?? NR;
}

export const VINTAGE_COLORS: Record<string, string> = {
  exceptionnel: '#7a2338',
  excellent: '#9c4155',
  'très bon': '#b08a3e',
  bon: '#7a7a45',
  moyen: '#8a8577',
  difficile: '#a0968a',
};

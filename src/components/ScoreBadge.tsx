const LABELS: Record<string, string> = {
  rarity: "Rareté",
  quality: "Qualité",
  discovery: "Découverte",
  sample: "Sample",
};

export default function ScoreBadge({
  type,
  value,
}: {
  type: "rarity" | "quality" | "discovery" | "sample";
  value: number;
}) {
  return (
    <div className="flex min-w-[92px] flex-col gap-1 rounded-lg border border-salin-line bg-salin-bg-card px-3 py-2">
      <span className="text-[10px] uppercase tracking-widest text-salin-fg-muted">
        {LABELS[type]}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-display text-lg leading-none">{value}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-salin-line">
          <div
            className="h-full rounded-full bg-salin-red-bright"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

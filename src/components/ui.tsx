import Link from "next/link";
import { bandFor } from "@/lib/reference";

export function Card({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`panel rounded-xl shadow-card ${className}`}
      style={accent ? { borderTopColor: accent, borderTopWidth: 3 } : undefined}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  sub,
  right,
}: {
  children: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-semibold font-display tracking-tight">{children}</h2>
        {sub && <p className="text-sm muted mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const TONES: Record<string, string> = {
  danger: "bg-red-500/15 text-red-300 border-red-500/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  good: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  great: "bg-spot/20 text-spot-light border-spot/40",
  neutral: "bg-white/5 text-[var(--muted)] border-[var(--border)]",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES | string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone] || TONES.neutral}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, accent = "#e9b949" }: { value: number; accent?: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: accent }} />
    </div>
  );
}

export function ScoreRing({ value, size = 120 }: { value: number; size?: number }) {
  const band = bandFor(value);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const color =
    band.tone === "great" ? "#e9b949" : band.tone === "good" ? "#34d399" : band.tone === "info" ? "#3a7bd5" : band.tone === "warn" ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={10} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        <span className="text-[10px] muted">/ 100</span>
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="panel-2 rounded-lg p-3">
      <div className="text-xs muted">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs muted mt-0.5">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="panel-2 rounded-lg p-6 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm muted mt-1">{hint}</p>}
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-spot text-stage-950 hover:bg-spot-light"
      : "panel-2 hover:border-spot/40";
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${cls}`}>
      {children}
    </Link>
  );
}

export function DemoTag() {
  return <Badge tone="warn">démo · à vérifier</Badge>;
}

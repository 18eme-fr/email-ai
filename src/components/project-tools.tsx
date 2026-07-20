"use client";
import { useMemo, useState } from "react";
import { toggleStep, saveStepNotes } from "@/app/actions/project";

export function ProjectStep({
  projectId,
  stepKey,
  n,
  title,
  hint,
  done,
  notes,
}: {
  projectId: string;
  stepKey: string;
  n: number;
  title: string;
  hint: string;
  done: boolean;
  notes: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`panel-2 rounded-lg p-3 ${done ? "border-emerald-500/40" : ""}`}>
      <div className="flex items-start gap-3">
        <form action={toggleStep.bind(null, projectId, stepKey)}>
          <button
            className={`mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
              done ? "bg-emerald-500 border-emerald-500 text-stage-950" : "border-[var(--border)]"
            }`}
            title={done ? "Marquer non fait" : "Marquer fait"}
          >
            {done ? "✓" : n}
          </button>
        </form>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium ${done ? "line-through opacity-70" : ""}`}>{title}</span>
            <button onClick={() => setOpen((o) => !o)} className="text-xs text-spot shrink-0">
              {open ? "fermer" : notes ? "note ✎" : "＋ note"}
            </button>
          </div>
          <p className="text-xs muted">{hint}</p>
          {notes && !open && <p className="text-xs mt-1 panel rounded p-2">{notes}</p>}
          {open && (
            <form action={saveStepNotes.bind(null, projectId, stepKey)} className="mt-2 space-y-2">
              <textarea name="notes" rows={3} defaultValue={notes} placeholder="Vos décisions, contacts, chiffres pour cette étape…" />
              <button className="bg-spot text-stage-950 rounded-lg px-3 py-1.5 text-xs font-medium">Enregistrer</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function BreakEvenCalc({ suggestedFixed }: { suggestedFixed: number }) {
  const [fixed, setFixed] = useState(suggestedFixed || 1000);
  const [price, setPrice] = useState(8);
  const [variable, setVariable] = useState(1);

  const result = useMemo(() => {
    const margin = price - variable;
    if (margin <= 0) return { tickets: Infinity, revenue: 0 };
    const tickets = Math.ceil(fixed / margin);
    return { tickets, revenue: tickets * price };
  }, [fixed, price, variable]);

  return (
    <div className="panel-2 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label>Coûts fixes (€)</label>
          <input type="number" value={fixed} onChange={(e) => setFixed(Number(e.target.value))} />
        </div>
        <div>
          <label>Prix du billet (€)</label>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <label>Coût variable / billet (€)</label>
          <input type="number" value={variable} onChange={(e) => setVariable(Number(e.target.value))} />
        </div>
      </div>
      <div className="mt-3 text-sm">
        {result.tickets === Infinity ? (
          <span className="text-red-400">Marge par billet nulle ou négative : ajustez le prix.</span>
        ) : (
          <>
            Seuil de rentabilité :{" "}
            <span className="font-semibold text-spot">{result.tickets} billets</span> vendus
            <span className="muted"> (≈ {result.revenue.toFixed(0)} € de recettes billetterie)</span>
          </>
        )}
      </div>
    </div>
  );
}

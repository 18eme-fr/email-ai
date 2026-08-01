"use client";

import { useMemo } from "react";
import type { HistoryEntry } from "@/types/topic";
import { buildHeatmap } from "@/lib/statistics";
import { cn } from "@/lib/utils";

function levelClass(count: number): string {
  if (count <= 0) return "bg-muted";
  if (count === 1) return "bg-primary/30";
  if (count === 2) return "bg-primary/50";
  if (count === 3) return "bg-primary/75";
  return "bg-primary";
}

export function Heatmap({ history }: { history: HistoryEntry[] }) {
  const cells = useMemo(() => buildHeatmap(history, 18), [history]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {cells.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date} — ${cell.count} tirage${cell.count > 1 ? "s" : ""}`}
              className={cn("h-3.5 w-3.5 rounded-sm", levelClass(cell.count))}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Moins</span>
        <span className="h-3 w-3 rounded-sm bg-muted" />
        <span className="h-3 w-3 rounded-sm bg-primary/30" />
        <span className="h-3 w-3 rounded-sm bg-primary/50" />
        <span className="h-3 w-3 rounded-sm bg-primary/75" />
        <span className="h-3 w-3 rounded-sm bg-primary" />
        <span>Plus</span>
      </div>
    </div>
  );
}

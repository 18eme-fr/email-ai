"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Category, Difficulty, Duration } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { cn, formatDuration, MODE_LABELS } from "@/lib/utils";
import type { SelectionMode } from "@/types/topic";

const MODES: { value: SelectionMode; hint: string }[] = [
  { value: "discovery", hint: "Priorité aux thèmes jamais vus" },
  { value: "review", hint: "Priorité aux thèmes à revoir ou anciens" },
  { value: "surprise", hint: "Tout thème compatible, au hasard" },
];

const DIFFICULTIES: Difficulty[] = ["Débutant", "Intermédiaire", "Avancé"];
const DURATIONS: Duration[] = [5, 10, 20, 30, 60];

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active && color ? { backgroundColor: `hsl(${color})` } : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? color
            ? "border-transparent text-white"
            : "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function RouletteFilters({ categories }: { categories: Category[] }) {
  const { filters, updateFilters } = useAppState();
  const [expanded, setExpanded] = useState(false);

  const toggleCategory = (id: string) => {
    const next = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id];
    updateFilters({ categories: next });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* Mode : toujours visible */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Mode de tirage</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => updateFilters({ mode: mode.value })}
              className={cn(
                "rounded-xl border px-2 py-2 text-center text-sm font-medium transition-colors",
                filters.mode === mode.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {MODE_LABELS[mode.value]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {MODES.find((mode) => mode.value === filters.mode)?.hint}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres avancés
          {(filters.categories.length > 0 ||
            filters.difficulty ||
            filters.maxDuration ||
            filters.includeLearned) && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
              actifs
            </span>
          )}
        </span>
        <span className="text-xs">{expanded ? "Masquer" : "Afficher"}</span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border pt-4">
          {/* Catégories */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Catégories</p>
            <div className="flex flex-wrap gap-2">
              <Chip
                active={filters.categories.length === 0}
                onClick={() => updateFilters({ categories: [] })}
              >
                Toutes
              </Chip>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  active={filters.categories.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                  color={category.color}
                >
                  <span aria-hidden>{category.emoji}</span>
                  {category.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Difficulté */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Difficulté</p>
            <div className="flex flex-wrap gap-2">
              <Chip
                active={filters.difficulty === null}
                onClick={() => updateFilters({ difficulty: null })}
              >
                Toutes
              </Chip>
              {DIFFICULTIES.map((difficulty) => (
                <Chip
                  key={difficulty}
                  active={filters.difficulty === difficulty}
                  onClick={() => updateFilters({ difficulty })}
                >
                  {difficulty}
                </Chip>
              ))}
            </div>
          </div>

          {/* Durée disponible */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Durée disponible</p>
            <div className="flex flex-wrap gap-2">
              <Chip
                active={filters.maxDuration === null}
                onClick={() => updateFilters({ maxDuration: null })}
              >
                Peu importe
              </Chip>
              {DURATIONS.map((duration) => (
                <Chip
                  key={duration}
                  active={filters.maxDuration === duration}
                  onClick={() => updateFilters({ maxDuration: duration })}
                >
                  ≤ {formatDuration(duration)}
                </Chip>
              ))}
            </div>
          </div>

          {/* Inclure les thèmes terminés */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                filters.includeLearned
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card",
              )}
            >
              {filters.includeLearned && <Check className="h-3.5 w-3.5" />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={filters.includeLearned}
              onChange={(event) =>
                updateFilters({ includeLearned: event.target.checked })
              }
            />
            Autoriser les thèmes déjà terminés (révision)
          </label>
        </div>
      )}
    </div>
  );
}

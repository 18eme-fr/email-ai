"use client";

import { CheckCircle2, Heart, RotateCcw } from "lucide-react";
import type { LearningTopic } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { getCategory } from "@/data/categories";
import {
  CategoryBadge,
  DifficultyBadge,
  DurationBadge,
} from "@/components/topics/topic-badges";
import { cn } from "@/lib/utils";

export function TopicCard({
  topic,
  onOpen,
}: {
  topic: LearningTopic;
  onOpen: (topic: LearningTopic) => void;
}) {
  const { getProgress, toggleFavorite, customCategories } = useAppState();
  const progress = getProgress(topic.id);
  const category = getCategory(topic.category, customCategories);

  return (
    <article
      onClick={() => onOpen(topic)}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-within:ring-2 focus-within:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={category} />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(topic.id);
          }}
          aria-label={
            progress.favorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          className="rounded-full p-1 text-muted-foreground transition-colors hover:text-accent"
        >
          <Heart
            className={cn(
              "h-5 w-5",
              progress.favorite && "fill-accent text-accent",
            )}
          />
        </button>
      </div>

      <h3 className="text-base font-semibold leading-snug group-hover:text-primary">
        {topic.title}
      </h3>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {topic.importance}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <DifficultyBadge difficulty={topic.difficulty} />
        <DurationBadge duration={topic.duration} />
        {progress.status === "learned" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Terminé
          </span>
        )}
        {progress.status === "review" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
            <RotateCcw className="h-3.5 w-3.5" /> À revoir
          </span>
        )}
      </div>
    </article>
  );
}

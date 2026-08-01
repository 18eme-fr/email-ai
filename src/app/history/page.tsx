"use client";

import { History as HistoryIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { LearningTopic } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { getCategory } from "@/data/categories";
import { formatDate, formatDuration, MODE_LABELS, STATUS_LABELS } from "@/lib/utils";
import { CategoryBadge } from "@/components/topics/topic-badges";
import { TopicDialog } from "@/components/topics/topic-dialog";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  todo: "text-muted-foreground",
  learned: "text-success",
  review: "text-warning",
};

export default function HistoryPage() {
  const { topics, history, getProgress, customCategories } = useAppState();

  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  const [dialogTopic, setDialogTopic] = useState<LearningTopic | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openTopic = (topicId: string) => {
    const topic = topicById.get(topicId);
    if (topic) {
      setDialogTopic(topic);
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Historique des tirages</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez chaque thème obtenu, sa catégorie, son statut et vos notes.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <HistoryIcon className="h-8 w-8" />
          <p>Aucun tirage enregistré. Lancez la roulette pour commencer !</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <ul className="divide-y divide-border">
            {history.map((entry) => {
              const topic = topicById.get(entry.topicId);
              const category = getCategory(entry.category, customCategories);
              const status = topic
                ? getProgress(topic.id).status
                : entry.status;
              const notes = topic ? getProgress(topic.id).notes : "";
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-2 bg-card p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => openTopic(entry.topicId)}
                    disabled={!topic}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-medium hover:text-primary">
                      {topic?.title ?? "Thème supprimé"}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <CategoryBadge category={category} />
                      <span>{formatDuration(entry.plannedDuration)}</span>
                      <span>· {MODE_LABELS[entry.mode] ?? entry.mode}</span>
                    </span>
                    {notes && (
                      <span className="mt-1 block truncate text-xs italic text-muted-foreground">
                        “{notes}”
                      </span>
                    )}
                  </button>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        STATUS_COLORS[status],
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.drawnAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <TopicDialog
        topic={dialogTopic}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

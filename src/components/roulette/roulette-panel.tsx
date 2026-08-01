"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Category, LearningTopic } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { passesFilters, selectTopic } from "@/lib/topic-selection";
import { Button } from "@/components/ui/button";
import { Wheel } from "@/components/roulette/wheel";
import { RouletteFilters } from "@/components/roulette/roulette-filters";
import { TopicDialog } from "@/components/topics/topic-dialog";

export function RoulettePanel() {
  const { topics, categories, filters, progress, recordDraw } = useAppState();

  const [spinToken, setSpinToken] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [dialogTopic, setDialogTopic] = useState<LearningTopic | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingTopic = useRef<LearningTopic | null>(null);

  // Catégories affichées sur la roue : celles ayant au moins un thème
  // compatible avec les filtres de catégorie / difficulté / durée.
  const wheelCategories = useMemo<Category[]>(() => {
    return categories.filter((category) =>
      topics.some(
        (topic) => topic.category === category.id && passesFilters(topic, filters),
      ),
    );
  }, [categories, topics, filters]);

  const canSpin = wheelCategories.length > 0;

  const handleSpin = useCallback(() => {
    if (spinning || wheelCategories.length === 0) return;
    const result = selectTopic({ topics, progressMap: progress, filters });
    if (!result) return;
    const index = wheelCategories.findIndex(
      (category) => category.id === result.topic.category,
    );
    pendingTopic.current = result.topic;
    setTargetIndex(index >= 0 ? index : 0);
    setDialogOpen(false);
    setSpinning(true);
    setSpinToken((token) => token + 1);
  }, [spinning, wheelCategories, topics, progress, filters]);

  const handleSpinEnd = useCallback(() => {
    const topic = pendingTopic.current;
    if (topic) {
      recordDraw(topic);
      setDialogTopic(topic);
      setDialogOpen(true);
    }
    setSpinning(false);
  }, [recordDraw]);

  const handleRespin = useCallback(() => {
    setDialogOpen(false);
    window.setTimeout(() => handleSpin(), 280);
  }, [handleSpin]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)] lg:items-start">
      <div className="order-2 space-y-4 lg:order-1">
        <RouletteFilters categories={categories} />
      </div>

      <div className="order-1 flex flex-col items-center gap-5 lg:order-2">
        <Wheel
          categories={wheelCategories}
          targetIndex={targetIndex}
          spinToken={spinToken}
          onSpinEnd={handleSpinEnd}
          disabled={!canSpin}
        />
        <Button
          size="lg"
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className="w-full max-w-[340px] text-base sm:max-w-[400px]"
        >
          <Sparkles className="h-5 w-5" />
          {spinning ? "La roue tourne…" : "Lancer la roulette"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {wheelCategories.length} catégorie
          {wheelCategories.length > 1 ? "s" : ""} en jeu ·{" "}
          {topics.filter((topic) => passesFilters(topic, filters)).length} thèmes
          possibles
        </p>
      </div>

      <TopicDialog
        topic={dialogTopic}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onRespin={handleRespin}
      />
    </div>
  );
}

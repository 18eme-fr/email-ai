"use client";

import {
  BookMarked,
  CalendarDays,
  Flame,
  Layers,
  ListTodo,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LearningTopic } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { computeStats, recentTopics } from "@/lib/statistics";
import { getCategory } from "@/data/categories";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/progress/stat-tile";
import { Heatmap } from "@/components/progress/heatmap";
import { CategoryProgress } from "@/components/progress/category-progress";
import { TopicDialog } from "@/components/topics/topic-dialog";

export default function ProgressPage() {
  const { topics, categories, customCategories, progress, activeDays, history } =
    useAppState();

  const stats = useMemo(
    () => computeStats(topics, progress, categories, activeDays),
    [topics, progress, categories, activeDays],
  );
  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );
  const recent = useMemo(() => recentTopics(history, 6), [history]);

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
        <h1 className="text-2xl font-bold">Ma progression</h1>
        <p className="text-sm text-muted-foreground">
          Suivez votre avancée, votre régularité et vos catégories préférées.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Layers}
          label="Thèmes au total"
          value={stats.total}
        />
        <StatTile
          icon={Trophy}
          label="Terminés"
          value={stats.learned}
          accent="success"
        />
        <StatTile
          icon={ListTodo}
          label="À apprendre"
          value={stats.todo}
          hint={`${stats.review} à revoir`}
        />
        <StatTile
          icon={Flame}
          label="Progression"
          value={`${stats.percentage}%`}
          accent="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Régularité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {stats.streak}
                </p>
                <p className="text-xs text-muted-foreground">
                  jours consécutifs
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.longestStreak}</p>
                <p className="text-xs text-muted-foreground">record de série</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{activeDays.length}</p>
                <p className="text-xs text-muted-foreground">
                  jours d&apos;activité
                </p>
              </div>
            </div>
            <Heatmap history={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-primary" />
              Dernières fiches consultées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun tirage pour l&apos;instant. Lancez la roulette !
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((entry) => {
                  const topic = topicById.get(entry.topicId);
                  const category = getCategory(entry.category, customCategories);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => openTopic(entry.topicId)}
                        className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-primary"
                        disabled={!topic}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {topic?.title ?? "Thème supprimé"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {category.emoji} {category.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(entry.drawnAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryProgress
            stats={stats.byCategory}
            customCategories={customCategories}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Catégories les plus travaillées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5 text-sm">
              {stats.mostWorked.map((stat) => {
                const category = getCategory(stat.categoryId, customCategories);
                return (
                  <li
                    key={stat.categoryId}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {category.emoji} {category.label}
                    </span>
                    <span className="text-muted-foreground">
                      {stat.learned} terminé{stat.learned > 1 ? "s" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Catégories à explorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5 text-sm">
              {stats.leastWorked.map((stat) => {
                const category = getCategory(stat.categoryId, customCategories);
                return (
                  <li
                    key={stat.categoryId}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {category.emoji} {category.label}
                    </span>
                    <span className="text-muted-foreground">
                      {stat.learned}/{stat.total}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <TopicDialog
        topic={dialogTopic}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

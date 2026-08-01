"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  Heart,
  Lightbulb,
  ListChecks,
  RotateCcw,
  Shuffle,
  Target,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { LearningTopic } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { getCategory } from "@/data/categories";
import { Button } from "@/components/ui/button";
import {
  CategoryBadge,
  DifficultyBadge,
  DurationBadge,
} from "@/components/topics/topic-badges";
import { cn } from "@/lib/utils";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function TopicFiche({
  topic,
  onRespin,
}: {
  topic: LearningTopic;
  onRespin?: () => void;
}) {
  const {
    getProgress,
    setStatus,
    toggleFavorite,
    setNotes,
    setFeedback,
    customCategories,
  } = useAppState();
  const progress = getProgress(topic.id);
  const category = getCategory(topic.category, customCategories);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={category} />
          <DifficultyBadge difficulty={topic.difficulty} />
          <DurationBadge duration={topic.duration} />
          {progress.status === "learned" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Terminé
            </span>
          )}
          {progress.status === "review" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
              <RotateCcw className="h-4 w-4" /> À revoir
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold leading-tight">{topic.title}</h2>
      </header>

      <Section icon={Target} title="Pourquoi apprendre ce sujet">
        <p className="text-sm leading-relaxed text-foreground/90">
          {topic.importance}
        </p>
        {topic.objective && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Objectif : </span>
            {topic.objective}
          </p>
        )}
      </Section>

      <Section icon={Lightbulb} title="Notions à comprendre">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {topic.keyConcepts.map((concept) => (
            <li
              key={concept}
              className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {concept}
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={ListChecks} title="Questions à maîtriser">
        <ol className="space-y-2">
          {topic.questions.map((question, index) => (
            <li key={question} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="pt-0.5">{question}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={BookOpenCheck} title="Activité concrète">
        <p className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm">
          {topic.activity}
        </p>
      </Section>

      {topic.keywords.length > 0 && (
        <Section icon={Shuffle} title="Mots-clés pour approfondir">
          <div className="flex flex-wrap gap-2">
            {topic.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {keyword}
              </span>
            ))}
          </div>
          {topic.sourceSuggestions && topic.sourceSuggestions.length > 0 && (
            <p className="pt-1 text-xs text-muted-foreground">
              Sources suggérées : {topic.sourceSuggestions.join(" · ")}
            </p>
          )}
        </Section>
      )}

      <Section icon={ListChecks} title="Mes notes personnelles">
        <textarea
          value={progress.notes}
          onChange={(event) => setNotes(topic.id, event.target.value)}
          placeholder="Notez ici vos idées, réponses ou ce que vous avez retenu…"
          rows={4}
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
      </Section>

      {/* Actions principales */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={progress.status === "learned" ? "success" : "primary"}
          onClick={() =>
            setStatus(topic.id, progress.status === "learned" ? "todo" : "learned")
          }
        >
          <CheckCircle2 className="h-4 w-4" />
          {progress.status === "learned" ? "Thème appris ✓" : "J'ai appris ce thème"}
        </Button>
        <Button
          variant={progress.status === "review" ? "warning" : "outline"}
          onClick={() =>
            setStatus(topic.id, progress.status === "review" ? "todo" : "review")
          }
        >
          <RotateCcw className="h-4 w-4" />À revoir
        </Button>
        <Button
          variant="outline"
          onClick={() => toggleFavorite(topic.id)}
          className={cn(progress.favorite && "border-accent text-accent")}
        >
          <Heart
            className={cn("h-4 w-4", progress.favorite && "fill-accent")}
          />
          {progress.favorite ? "En favori" : "Ajouter aux favoris"}
        </Button>
        {onRespin && (
          <Button variant="secondary" onClick={onRespin}>
            <Shuffle className="h-4 w-4" />
            Nouveau tirage
          </Button>
        )}
      </div>

      {/* Retour de difficulté */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Ce sujet était :</span>
        <Button
          size="sm"
          variant={progress.difficultyFeedback === -1 ? "primary" : "ghost"}
          onClick={() =>
            setFeedback(topic.id, progress.difficultyFeedback === -1 ? 0 : -1)
          }
        >
          <ThumbsDown className="h-4 w-4" />
          Trop facile
        </Button>
        <Button
          size="sm"
          variant={progress.difficultyFeedback === 1 ? "primary" : "ghost"}
          onClick={() =>
            setFeedback(topic.id, progress.difficultyFeedback === 1 ? 0 : 1)
          }
        >
          <ThumbsUp className="h-4 w-4" />
          Trop difficile
        </Button>
      </div>
    </div>
  );
}

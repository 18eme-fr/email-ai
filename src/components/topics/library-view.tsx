"use client";

import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Difficulty, Duration, LearningTopic } from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import { cn, formatDuration } from "@/lib/utils";
import { TopicCard } from "@/components/topics/topic-card";
import { TopicDialog } from "@/components/topics/topic-dialog";

type StatusFilter = "all" | "todo" | "learned" | "review" | "favorites";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "todo", label: "À apprendre" },
  { value: "learned", label: "Terminés" },
  { value: "review", label: "À revoir" },
  { value: "favorites", label: "Favoris" },
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

export function LibraryView() {
  const searchParams = useSearchParams();
  const { topics, categories, getProgress } = useAppState();

  const initialCategory = searchParams.get("category");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(
    initialCategory && categories.some((c) => c.id === initialCategory)
      ? [initialCategory]
      : [],
  );
  const [dialogTopic, setDialogTopic] = useState<LearningTopic | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleCategory = (id: string) => {
    setCategoryFilters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return topics.filter((topic) => {
      if (
        categoryFilters.length > 0 &&
        !categoryFilters.includes(topic.category)
      ) {
        return false;
      }
      if (difficulty && topic.difficulty !== difficulty) return false;
      if (duration && topic.duration !== duration) return false;

      const progress = getProgress(topic.id);
      if (status === "todo" && progress.status !== "todo") return false;
      if (status === "learned" && progress.status !== "learned") return false;
      if (status === "review" && progress.status !== "review") return false;
      if (status === "favorites" && !progress.favorite) return false;

      if (query) {
        const haystack = `${topic.title} ${topic.keywords.join(" ")} ${topic.keyConcepts.join(" ")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [topics, categoryFilters, difficulty, duration, status, search, getProgress]);

  const hasActiveFilters =
    categoryFilters.length > 0 ||
    difficulty !== null ||
    duration !== null ||
    status !== "all" ||
    search.trim() !== "";

  const resetFilters = () => {
    setCategoryFilters([]);
    setDifficulty(null);
    setDuration(null);
    setStatus("all");
    setSearch("");
  };

  const openTopic = (topic: LearningTopic) => {
    setDialogTopic(topic);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Bibliothèque de thèmes</h1>
        <p className="text-sm text-muted-foreground">
          {topics.length} thèmes disponibles — filtrez, cherchez et ouvrez une
          fiche.
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un thème, un mot-clé…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
      </div>

      {/* Filtres de statut */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <Chip
            key={item.value}
            active={status === item.value}
            onClick={() => setStatus(item.value)}
          >
            {item.label}
          </Chip>
        ))}
      </div>

      {/* Difficulté + durée */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Difficulté
        </span>
        <Chip active={difficulty === null} onClick={() => setDifficulty(null)}>
          Toutes
        </Chip>
        {DIFFICULTIES.map((item) => (
          <Chip
            key={item}
            active={difficulty === item}
            onClick={() => setDifficulty(difficulty === item ? null : item)}
          >
            {item}
          </Chip>
        ))}
        <span className="ml-2 text-xs font-semibold uppercase text-muted-foreground">
          Durée
        </span>
        <Chip active={duration === null} onClick={() => setDuration(null)}>
          Toutes
        </Chip>
        {DURATIONS.map((item) => (
          <Chip
            key={item}
            active={duration === item}
            onClick={() => setDuration(duration === item ? null : item)}
          >
            {formatDuration(item)}
          </Chip>
        ))}
      </div>

      {/* Catégories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Chip
            key={category.id}
            active={categoryFilters.includes(category.id)}
            onClick={() => toggleCategory(category.id)}
            color={category.color}
          >
            <span aria-hidden>{category.emoji}</span>
            {category.label}
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} thème{filtered.length > 1 ? "s" : ""} trouvé
          {filtered.length > 1 ? "s" : ""}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Aucun thème ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((topic) => (
            <TopicCard key={topic.id} topic={topic} onOpen={openTopic} />
          ))}
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

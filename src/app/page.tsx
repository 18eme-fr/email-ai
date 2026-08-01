"use client";

import Link from "next/link";
import { Flame, Heart, LibraryBig, Sparkles, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { computeStats } from "@/lib/statistics";
import { RoulettePanel } from "@/components/roulette/roulette-panel";
import { StatTile } from "@/components/progress/stat-tile";

export default function HomePage() {
  const { topics, categories, progress, activeDays } = useAppState();

  const stats = useMemo(
    () => computeStats(topics, progress, categories, activeDays),
    [topics, progress, categories, activeDays],
  );

  return (
    <div className="space-y-8">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Un thème à apprendre, choisi au hasard
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          La Roulette du Savoir
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Lancez la roue et découvrez une fiche d&apos;apprentissage prête à
          l&apos;emploi : notions clés, questions à maîtriser et activité
          concrète. Apprenez un peu chaque jour, sur les sujets qui comptent
          pour vous.
        </p>
      </section>

      <RoulettePanel />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ma progression</h2>
          <Link
            href="/progress"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir le détail
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={Trophy}
            label="Thèmes terminés"
            value={stats.learned}
            hint={`sur ${stats.total} thèmes`}
            accent="success"
          />
          <StatTile
            icon={Sparkles}
            label="Progression"
            value={`${stats.percentage}%`}
            hint={`${stats.todo} à découvrir`}
          />
          <StatTile
            icon={Heart}
            label="Favoris"
            value={stats.favorites}
            hint="thèmes enregistrés"
            accent="accent"
          />
          <StatTile
            icon={Flame}
            label="Série"
            value={`${stats.streak} j`}
            hint={`record : ${stats.longestStreak} j`}
            accent="warning"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Explorer par catégorie</h2>
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <LibraryBig className="h-4 w-4" />
            Bibliothèque
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/library?category=${category.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-white transition-transform hover:scale-105"
              style={{ backgroundColor: `hsl(${category.color})` }}
            >
              <span aria-hidden>{category.emoji}</span>
              {category.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

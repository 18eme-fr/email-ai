"use client";

import type { CategoryStat } from "@/lib/statistics";
import { getCategory } from "@/data/categories";
import type { Category } from "@/types/topic";

export function CategoryProgress({
  stats,
  customCategories,
}: {
  stats: CategoryStat[];
  customCategories: Category[];
}) {
  return (
    <ul className="space-y-3">
      {stats.map((stat) => {
        const category = getCategory(stat.categoryId, customCategories);
        const percent = Math.round(stat.ratio * 100);
        return (
          <li key={stat.categoryId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span aria-hidden>{category.emoji}</span>
                {category.label}
              </span>
              <span className="text-muted-foreground">
                {stat.learned}/{stat.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percent}%`,
                  backgroundColor: `hsl(${category.color})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

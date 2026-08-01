import { Clock } from "lucide-react";
import type { Category, Difficulty, Duration } from "@/types/topic";
import { Badge } from "@/components/ui/badge";
import { cn, difficultyClasses, formatDuration } from "@/lib/utils";

export function CategoryBadge({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <Badge
      className={cn("border-transparent text-white", className)}
      style={{ backgroundColor: `hsl(${category.color})` }}
    >
      <span aria-hidden>{category.emoji}</span>
      {category.label}
    </Badge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge className={difficultyClasses(difficulty)}>{difficulty}</Badge>;
}

export function DurationBadge({ duration }: { duration: Duration }) {
  return (
    <Badge className="border-border bg-muted text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatDuration(duration)}
    </Badge>
  );
}

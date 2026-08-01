import type { Difficulty, Duration } from "@/types/topic";

/**
 * Concatène des classes conditionnelles (mini équivalent de `clsx`),
 * pour éviter une dépendance supplémentaire.
 */
export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

/** Libellé lisible d'une durée. */
export function formatDuration(minutes: Duration | number): string {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours} h` : `${minutes} min`;
  }
  return `${minutes} min`;
}

/** Classes de couleur associées à un niveau de difficulté. */
export function difficultyClasses(difficulty: Difficulty): string {
  switch (difficulty) {
    case "Débutant":
      return "bg-success/15 text-success border-success/30";
    case "Intermédiaire":
      return "bg-warning/15 text-warning border-warning/30";
    case "Avancé":
      return "bg-danger/15 text-danger border-danger/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/** Date lisible en français à partir d'un timestamp. */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** Génère un identifiant simple et suffisamment unique côté client. */
export function generateId(prefix = "topic"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export const MODE_LABELS: Record<string, string> = {
  discovery: "Découverte",
  review: "Révision",
  surprise: "Surprise totale",
};

export const STATUS_LABELS: Record<string, string> = {
  todo: "À apprendre",
  learned: "Terminé",
  review: "À revoir",
};

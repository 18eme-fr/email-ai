import type {
  Category,
  HistoryEntry,
  LearningTopic,
  TopicProgress,
} from "@/types/topic";
import { toDayKey } from "@/lib/storage";

/**
 * Fonctions de calcul de statistiques et de progression.
 * Toutes pures : elles prennent l'état en entrée et renvoient des agrégats.
 */

export type CategoryStat = {
  categoryId: string;
  total: number;
  learned: number;
  ratio: number;
};

export type GlobalStats = {
  total: number;
  learned: number;
  todo: number;
  review: number;
  favorites: number;
  percentage: number;
  byCategory: CategoryStat[];
  streak: number;
  longestStreak: number;
  mostWorked: CategoryStat[];
  leastWorked: CategoryStat[];
};

function statusOf(
  progressMap: Record<string, TopicProgress>,
  id: string,
): TopicProgress["status"] {
  return progressMap[id]?.status ?? "todo";
}

/**
 * Calcule la série de jours consécutifs d'apprentissage se terminant
 * aujourd'hui (ou hier — la série n'est pas encore rompue le lendemain).
 */
export function computeStreak(activeDays: string[], now = Date.now()): number {
  if (activeDays.length === 0) return 0;
  const daySet = new Set(activeDays);
  const oneDay = 24 * 60 * 60 * 1000;

  // La série est valable si l'on a été actif aujourd'hui ou hier.
  const todayKey = toDayKey(now);
  const yesterdayKey = toDayKey(now - oneDay);
  let cursor: number;
  if (daySet.has(todayKey)) {
    cursor = now;
  } else if (daySet.has(yesterdayKey)) {
    cursor = now - oneDay;
  } else {
    return 0;
  }

  let streak = 0;
  while (daySet.has(toDayKey(cursor))) {
    streak += 1;
    cursor -= oneDay;
  }
  return streak;
}

/** Plus longue série jamais atteinte (utile comme record motivant). */
export function computeLongestStreak(activeDays: string[]): number {
  if (activeDays.length === 0) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  const timestamps = Array.from(new Set(activeDays))
    .map((day) => new Date(`${day}T00:00:00`).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);

  let longest = 1;
  let current = 1;
  for (let i = 1; i < timestamps.length; i += 1) {
    const diff = Math.round((timestamps[i] - timestamps[i - 1]) / oneDay);
    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

export function computeStats(
  topics: LearningTopic[],
  progressMap: Record<string, TopicProgress>,
  categories: Category[],
  activeDays: string[],
  now = Date.now(),
): GlobalStats {
  const total = topics.length;
  let learned = 0;
  let review = 0;
  let favorites = 0;

  const perCategory: Record<string, { total: number; learned: number }> = {};
  for (const category of categories) {
    perCategory[category.id] = { total: 0, learned: 0 };
  }

  for (const topic of topics) {
    const progress = progressMap[topic.id];
    const bucket =
      perCategory[topic.category] ??
      (perCategory[topic.category] = { total: 0, learned: 0 });
    bucket.total += 1;
    if (progress?.status === "learned") {
      learned += 1;
      bucket.learned += 1;
    } else if (progress?.status === "review") {
      review += 1;
    }
    if (progress?.favorite) favorites += 1;
  }

  const byCategory: CategoryStat[] = Object.entries(perCategory)
    .filter(([, value]) => value.total > 0)
    .map(([categoryId, value]) => ({
      categoryId,
      total: value.total,
      learned: value.learned,
      ratio: value.total === 0 ? 0 : value.learned / value.total,
    }));

  const worked = [...byCategory].sort((a, b) => b.learned - a.learned);
  const mostWorked = worked.slice(0, 3);
  const leastWorked = [...byCategory]
    .sort((a, b) => a.learned - b.learned)
    .slice(0, 3);

  return {
    total,
    learned,
    todo: total - learned - review,
    review,
    favorites,
    percentage: total === 0 ? 0 : Math.round((learned / total) * 100),
    byCategory: byCategory.sort((a, b) => b.total - a.total),
    streak: computeStreak(activeDays, now),
    longestStreak: computeLongestStreak(activeDays),
    mostWorked,
    leastWorked,
  };
}

/** Les N dernières fiches consultées (via l'historique de tirages). */
export function recentTopics(
  history: HistoryEntry[],
  limit = 5,
): HistoryEntry[] {
  return [...history].sort((a, b) => b.drawnAt - a.drawnAt).slice(0, limit);
}

export type HeatmapCell = {
  date: string;
  count: number;
  timestamp: number;
};

/**
 * Construit les cellules d'une heatmap sur les `weeks` dernières semaines,
 * comptant le nombre de tirages par jour.
 */
export function buildHeatmap(
  history: HistoryEntry[],
  weeks = 18,
  now = Date.now(),
): HeatmapCell[] {
  const oneDay = 24 * 60 * 60 * 1000;
  const counts: Record<string, number> = {};
  for (const entry of history) {
    const key = toDayKey(entry.drawnAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const cells: HeatmapCell[] = [];
  const totalDays = weeks * 7;
  // On termine à la fin de la semaine courante pour un affichage aligné.
  const today = new Date(now);
  const endOffset = 6 - today.getDay(); // dimanche = 0 ; on aligne au samedi.
  const end = now + endOffset * oneDay;
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const timestamp = end - i * oneDay;
    const key = toDayKey(timestamp);
    cells.push({ date: key, count: counts[key] ?? 0, timestamp });
  }
  return cells;
}

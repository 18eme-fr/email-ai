import type {
  LearningTopic,
  SelectionFilters,
  TopicProgress,
  TopicStatus,
} from "@/types/topic";

/**
 * Algorithme de sélection pondérée de « La Roulette du Savoir ».
 *
 * L'objectif n'est pas un simple `Math.random()` : on cherche un tirage
 * intelligent qui
 *  - réduit fortement la probabilité de ressortir un thème récent ;
 *  - favorise les catégories peu travaillées ;
 *  - respecte les filtres (catégories, difficulté, durée) ;
 *  - s'adapte au mode (découverte / révision / surprise).
 *
 * Toutes les fonctions sont pures et acceptent une source d'aléa injectable
 * (`rng`) et une horloge (`now`), afin d'être testables de façon déterministe.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Fenêtre (en jours) au-delà de laquelle un thème redevient « frais ». */
const RECENCY_WINDOW_DAYS = 14;

const DEFAULT_PROGRESS: TopicProgress = {
  status: "todo",
  favorite: false,
  notes: "",
  drawCount: 0,
  lastDrawnAt: null,
  learnedAt: null,
  difficultyFeedback: 0,
};

export type SelectionResult = {
  topic: LearningTopic;
  /** Poids final calculé pour le thème choisi (utile au debug/tests). */
  weight: number;
  /** Taille du bassin de candidats effectivement utilisé. */
  poolSize: number;
  /** `true` si un repli a été nécessaire (bassin principal vide). */
  usedFallback: boolean;
};

function getProgress(
  progressMap: Record<string, TopicProgress>,
  id: string,
): TopicProgress {
  return progressMap[id] ?? DEFAULT_PROGRESS;
}

function statusOf(
  progressMap: Record<string, TopicProgress>,
  id: string,
): TopicStatus {
  return progressMap[id]?.status ?? "todo";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Un thème respecte-t-il les filtres de catégorie / difficulté / durée ? */
export function passesFilters(
  topic: LearningTopic,
  filters: SelectionFilters,
): boolean {
  if (
    filters.categories.length > 0 &&
    !filters.categories.includes(topic.category)
  ) {
    return false;
  }
  if (filters.difficulty && topic.difficulty !== filters.difficulty) {
    return false;
  }
  if (filters.maxDuration && topic.duration > filters.maxDuration) {
    return false;
  }
  return true;
}

/**
 * Charge de travail normalisée par catégorie, entre 0 et 1.
 * Un thème terminé pèse davantage qu'un simple tirage.
 */
export function computeCategoryWorkload(
  topics: LearningTopic[],
  progressMap: Record<string, TopicProgress>,
): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const topic of topics) {
    const progress = getProgress(progressMap, topic.id);
    const learnedWeight = progress.status === "learned" ? 2 : 0;
    raw[topic.category] =
      (raw[topic.category] ?? 0) + progress.drawCount + learnedWeight;
  }
  const max = Math.max(1, ...Object.values(raw));
  const normalized: Record<string, number> = {};
  for (const [category, value] of Object.entries(raw)) {
    normalized[category] = value / max;
  }
  return normalized;
}

type WeightContext = {
  now: number;
  filters: SelectionFilters;
  categoryWorkload: Record<string, number>;
};

/**
 * Calcule le poids d'un thème. Plus le poids est élevé, plus le thème a de
 * chances de sortir. Le poids est toujours strictement positif afin qu'un
 * bassin non vide produise toujours un résultat.
 */
export function computeWeight(
  topic: LearningTopic,
  progress: TopicProgress,
  ctx: WeightContext,
): number {
  let weight = 1;

  // 1. Pénalité de récence : un thème vu récemment ressort rarement.
  if (progress.lastDrawnAt != null) {
    const daysSince = (ctx.now - progress.lastDrawnAt) / DAY_MS;
    const recencyFactor = clamp(daysSince / RECENCY_WINDOW_DAYS, 0.03, 1);
    weight *= recencyFactor;
  }

  // 2. Pénalité de répétition : moins de chances à mesure des tirages.
  weight *= 1 / (1 + progress.drawCount * 0.5);

  // 3. Bonus « catégorie peu travaillée » : 1.5 (jamais vue) → 0.5 (saturée).
  const workload = ctx.categoryWorkload[topic.category] ?? 0;
  weight *= 0.5 + (1 - workload) * 1;

  // 4. Ajustements selon le mode de tirage.
  const neverSeen = progress.drawCount === 0 && progress.status === "todo";
  switch (ctx.filters.mode) {
    case "discovery":
      weight *= neverSeen ? 3 : 0.6;
      break;
    case "review":
      if (progress.status === "review") {
        weight *= 4;
      } else if (progress.status === "learned") {
        const daysSinceLearned =
          progress.learnedAt != null
            ? (ctx.now - progress.learnedAt) / DAY_MS
            : RECENCY_WINDOW_DAYS;
        // Plus un thème a été appris il y a longtemps, plus il mérite révision.
        weight *= 1 + clamp(daysSinceLearned / 7, 0, 4);
      } else {
        weight *= 0.15;
      }
      break;
    case "surprise":
    default:
      break;
  }

  // 5. Retour de difficulté ressenti : on espace les thèmes jugés inadaptés.
  if (progress.difficultyFeedback === -1) {
    weight *= 0.3; // trop facile
  } else if (progress.difficultyFeedback === 1) {
    weight *= 0.5; // trop difficile
  }

  return Math.max(weight, 0.0001);
}

/** Tirage aléatoire pondéré. `rng` doit renvoyer une valeur dans [0, 1). */
export function weightedPick<T>(
  items: T[],
  weights: number[],
  rng: () => number,
): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    return items[Math.floor(rng() * items.length)] ?? items[0];
  }
  let threshold = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    threshold -= weights[i];
    if (threshold < 0) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

/** Construit le bassin de candidats correspondant au mode demandé. */
function modePool(
  topics: LearningTopic[],
  progressMap: Record<string, TopicProgress>,
  filters: SelectionFilters,
): LearningTopic[] {
  const base = topics.filter((topic) => passesFilters(topic, filters));
  switch (filters.mode) {
    case "review":
      return base.filter((topic) => {
        const status = statusOf(progressMap, topic.id);
        return status === "review" || status === "learned";
      });
    case "discovery":
    case "surprise":
    default:
      return base.filter((topic) => {
        const status = statusOf(progressMap, topic.id);
        if (status === "learned" && !filters.includeLearned) return false;
        return true;
      });
  }
}

/**
 * Construit le bassin de candidats, avec une chaîne de replis pour garantir
 * qu'un tirage est toujours possible dès qu'un thème compatible existe.
 */
export function buildCandidatePool(
  topics: LearningTopic[],
  progressMap: Record<string, TopicProgress>,
  filters: SelectionFilters,
): { pool: LearningTopic[]; usedFallback: boolean } {
  const primary = modePool(topics, progressMap, filters);
  if (primary.length > 0) {
    return { pool: primary, usedFallback: false };
  }

  // Repli 1 : tous les thèmes filtrés, hors terminés (sauf si autorisés).
  const relaxed = topics.filter((topic) => {
    if (!passesFilters(topic, filters)) return false;
    const status = statusOf(progressMap, topic.id);
    if (status === "learned" && !filters.includeLearned) return false;
    return true;
  });
  if (relaxed.length > 0) {
    return { pool: relaxed, usedFallback: true };
  }

  // Repli 2 : tous les thèmes qui respectent les filtres, terminés inclus.
  const all = topics.filter((topic) => passesFilters(topic, filters));
  return { pool: all, usedFallback: true };
}

export type SelectTopicParams = {
  topics: LearningTopic[];
  progressMap: Record<string, TopicProgress>;
  filters: SelectionFilters;
  now?: number;
  rng?: () => number;
};

/**
 * Sélectionne un thème selon les filtres, le mode et l'historique de
 * progression. Renvoie `null` si aucun thème compatible n'existe.
 */
export function selectTopic({
  topics,
  progressMap,
  filters,
  now = Date.now(),
  rng = Math.random,
}: SelectTopicParams): SelectionResult | null {
  const { pool, usedFallback } = buildCandidatePool(
    topics,
    progressMap,
    filters,
  );
  if (pool.length === 0) {
    return null;
  }

  const categoryWorkload = computeCategoryWorkload(topics, progressMap);
  const ctx: WeightContext = { now, filters, categoryWorkload };
  const weights = pool.map((topic) =>
    computeWeight(topic, getProgress(progressMap, topic.id), ctx),
  );

  const topic = weightedPick(pool, weights, rng);
  const chosenIndex = pool.indexOf(topic);
  return {
    topic,
    weight: weights[chosenIndex] ?? 0,
    poolSize: pool.length,
    usedFallback,
  };
}

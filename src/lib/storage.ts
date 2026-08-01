import type {
  Category,
  HistoryEntry,
  LearningTopic,
  PersistedState,
  SelectionFilters,
  TopicProgress,
} from "@/types/topic";

/**
 * Couche de persistance locale.
 *
 * Tout l'état de l'utilisateur est stocké dans `localStorage` sous une seule
 * clé versionnée. Les fonctions sont volontairement isolées ici pour qu'une
 * migration future vers Supabase (ou une autre base) ne touche que ce fichier :
 * il suffirait de réimplémenter `loadState` / `saveState` en asynchrone.
 */

export const STORAGE_KEY = "roulette-du-savoir/state";
export const STORAGE_VERSION = 1;

export const DEFAULT_PROGRESS: TopicProgress = {
  status: "todo",
  favorite: false,
  notes: "",
  drawCount: 0,
  lastDrawnAt: null,
  learnedAt: null,
  difficultyFeedback: 0,
};

export const DEFAULT_FILTERS: SelectionFilters = {
  categories: [],
  difficulty: null,
  maxDuration: null,
  mode: "discovery",
  includeLearned: false,
};

export function createDefaultState(): PersistedState {
  return {
    version: STORAGE_VERSION,
    progress: {},
    history: [],
    customTopics: [],
    customCategories: [],
    activeDays: [],
    lastFilters: { ...DEFAULT_FILTERS },
    theme: "light",
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Fusionne un état chargé (potentiellement partiel ou d'une ancienne version)
 * avec les valeurs par défaut, pour éviter les `undefined` en aval.
 */
function normalizeState(raw: Partial<PersistedState> | null): PersistedState {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;
  return {
    version: STORAGE_VERSION,
    progress: { ...base.progress, ...(raw.progress ?? {}) },
    history: Array.isArray(raw.history) ? raw.history : base.history,
    customTopics: Array.isArray(raw.customTopics)
      ? raw.customTopics
      : base.customTopics,
    customCategories: Array.isArray(raw.customCategories)
      ? raw.customCategories
      : base.customCategories,
    activeDays: Array.isArray(raw.activeDays) ? raw.activeDays : base.activeDays,
    lastFilters: { ...base.lastFilters, ...(raw.lastFilters ?? {}) },
    theme: raw.theme === "dark" ? "dark" : "light",
  };
}

export function loadState(): PersistedState {
  if (!isBrowser()) return createDefaultState();
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return createDefaultState();
    const parsed = JSON.parse(rawValue) as Partial<PersistedState>;
    return normalizeState(parsed);
  } catch (error) {
    console.warn("Impossible de charger l'état sauvegardé :", error);
    return createDefaultState();
  }
}

export function saveState(state: PersistedState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Impossible d'enregistrer l'état :", error);
  }
}

/** Date locale au format `YYYY-MM-DD`, utilisée pour la série de jours. */
export function toDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Payload d'export/import (thèmes + progression). */
export type ExportPayload = {
  exportedAt: string;
  version: number;
  state: PersistedState;
};

export function buildExportPayload(state: PersistedState): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    version: STORAGE_VERSION,
    state,
  };
}

/** Résultat d'un import de thèmes depuis un fichier JSON. */
export type ImportTopicsResult = {
  topics: LearningTopic[];
  errors: string[];
};

const DIFFICULTIES = ["Débutant", "Intermédiaire", "Avancé"];
const DURATIONS = [5, 10, 20, 30, 60];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Valide et normalise un tableau de thèmes importés depuis du JSON.
 * Les thèmes invalides sont ignorés et signalés dans `errors`.
 */
export function parseImportedTopics(input: unknown): ImportTopicsResult {
  const errors: string[] = [];
  const topics: LearningTopic[] = [];

  // Accepte soit un tableau de thèmes, soit un objet { topics: [...] },
  // soit un export complet { state: { customTopics: [...] } }.
  let list: unknown[] = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.topics)) {
      list = obj.topics;
    } else if (
      obj.state &&
      typeof obj.state === "object" &&
      Array.isArray((obj.state as Record<string, unknown>).customTopics)
    ) {
      list = (obj.state as Record<string, unknown>).customTopics as unknown[];
    } else {
      errors.push("Format non reconnu : aucun tableau de thèmes trouvé.");
      return { topics, errors };
    }
  } else {
    errors.push("Format non reconnu : JSON invalide.");
    return { topics, errors };
  }

  list.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`Thème #${index + 1} ignoré : ce n'est pas un objet.`);
      return;
    }
    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const category =
      typeof record.category === "string" ? record.category.trim() : "";
    if (!title || !category) {
      errors.push(`Thème #${index + 1} ignoré : titre ou catégorie manquant.`);
      return;
    }
    const difficulty =
      typeof record.difficulty === "string" &&
      DIFFICULTIES.includes(record.difficulty)
        ? (record.difficulty as LearningTopic["difficulty"])
        : "Intermédiaire";
    const duration =
      typeof record.duration === "number" && DURATIONS.includes(record.duration)
        ? (record.duration as LearningTopic["duration"])
        : 20;

    topics.push({
      id:
        typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : `import-${Date.now()}-${index}`,
      title,
      category,
      difficulty,
      duration,
      objective: typeof record.objective === "string" ? record.objective : "",
      importance: typeof record.importance === "string" ? record.importance : "",
      keyConcepts: isStringArray(record.keyConcepts) ? record.keyConcepts : [],
      questions: isStringArray(record.questions) ? record.questions : [],
      activity: typeof record.activity === "string" ? record.activity : "",
      keywords: isStringArray(record.keywords) ? record.keywords : [],
      sourceSuggestions: isStringArray(record.sourceSuggestions)
        ? record.sourceSuggestions
        : undefined,
    });
  });

  return { topics, errors };
}

export type { Category, HistoryEntry };

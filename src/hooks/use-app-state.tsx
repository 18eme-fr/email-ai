"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Category,
  HistoryEntry,
  LearningTopic,
  PersistedState,
  SelectionFilters,
  TopicProgress,
  TopicStatus,
} from "@/types/topic";
import { CATEGORIES } from "@/data/categories";
import { TOPICS } from "@/data/topics";
import {
  DEFAULT_PROGRESS,
  createDefaultState,
  loadState,
  saveState,
  toDayKey,
} from "@/lib/storage";

/**
 * Fusionne la base de thèmes livrée avec l'application et les thèmes ajoutés
 * par l'utilisateur. Un thème personnalisé partageant un id avec un thème de
 * base le remplace (édition), sinon il s'ajoute.
 */
function mergeTopics(
  base: LearningTopic[],
  custom: LearningTopic[],
): LearningTopic[] {
  if (custom.length === 0) return base;
  const overrides = new Map(custom.map((topic) => [topic.id, topic]));
  const merged = base.map((topic) => overrides.get(topic.id) ?? topic);
  const baseIds = new Set(base.map((topic) => topic.id));
  for (const topic of custom) {
    if (!baseIds.has(topic.id)) merged.push(topic);
  }
  return merged;
}

export type AppState = {
  hydrated: boolean;
  topics: LearningTopic[];
  categories: Category[];
  progress: Record<string, TopicProgress>;
  history: HistoryEntry[];
  filters: SelectionFilters;
  theme: "light" | "dark";
  activeDays: string[];
  customTopics: LearningTopic[];
  customCategories: Category[];
  persisted: PersistedState;
  getProgress: (id: string) => TopicProgress;
  updateFilters: (partial: Partial<SelectionFilters>) => void;
  recordDraw: (topic: LearningTopic) => void;
  setStatus: (id: string, status: TopicStatus) => void;
  toggleFavorite: (id: string) => void;
  setNotes: (id: string, notes: string) => void;
  setFeedback: (id: string, feedback: -1 | 0 | 1) => void;
  addTopic: (topic: LearningTopic) => void;
  updateTopic: (topic: LearningTopic) => void;
  deleteTopic: (id: string) => void;
  addCategory: (category: Category) => void;
  importTopics: (topics: LearningTopic[]) => void;
  importFullState: (state: PersistedState) => void;
  resetProgress: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => createDefaultState());
  const [hydrated, setHydrated] = useState(false);

  // Chargement depuis localStorage après le montage (évite les décalages SSR).
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Persistance : on enregistre à chaque changement, une fois hydraté.
  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  // Application du thème sur <html> (classe `dark`).
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", state.theme === "dark");
  }, [state.theme, hydrated]);

  const topics = useMemo(
    () => mergeTopics(TOPICS, state.customTopics),
    [state.customTopics],
  );
  const categories = useMemo(
    () => [...CATEGORIES, ...state.customCategories],
    [state.customCategories],
  );

  const getProgress = useCallback(
    (id: string): TopicProgress => state.progress[id] ?? DEFAULT_PROGRESS,
    [state.progress],
  );

  const updateProgress = useCallback(
    (id: string, updater: (current: TopicProgress) => TopicProgress) => {
      setState((prev) => {
        const current = prev.progress[id] ?? DEFAULT_PROGRESS;
        return {
          ...prev,
          progress: { ...prev.progress, [id]: updater(current) },
        };
      });
    },
    [],
  );

  const markActiveDay = useCallback((prev: PersistedState, timestamp: number) => {
    const dayKey = toDayKey(timestamp);
    if (prev.activeDays.includes(dayKey)) return prev.activeDays;
    return [...prev.activeDays, dayKey];
  }, []);

  const updateFilters = useCallback((partial: Partial<SelectionFilters>) => {
    setState((prev) => ({
      ...prev,
      lastFilters: { ...prev.lastFilters, ...partial },
    }));
  }, []);

  const recordDraw = useCallback(
    (topic: LearningTopic) => {
      const drawnAt = Date.now();
      setState((prev) => {
        const current = prev.progress[topic.id] ?? DEFAULT_PROGRESS;
        const entry: HistoryEntry = {
          id: `h-${drawnAt}-${topic.id}`,
          topicId: topic.id,
          drawnAt,
          category: topic.category,
          status: current.status,
          plannedDuration: topic.duration,
          mode: prev.lastFilters.mode,
        };
        return {
          ...prev,
          progress: {
            ...prev.progress,
            [topic.id]: {
              ...current,
              drawCount: current.drawCount + 1,
              lastDrawnAt: drawnAt,
            },
          },
          history: [entry, ...prev.history].slice(0, 500),
          activeDays: markActiveDay(prev, drawnAt),
        };
      });
    },
    [markActiveDay],
  );

  const setStatus = useCallback(
    (id: string, status: TopicStatus) => {
      const now = Date.now();
      setState((prev) => {
        const current = prev.progress[id] ?? DEFAULT_PROGRESS;
        return {
          ...prev,
          progress: {
            ...prev.progress,
            [id]: {
              ...current,
              status,
              learnedAt: status === "learned" ? now : current.learnedAt,
            },
          },
          activeDays:
            status === "learned" ? markActiveDay(prev, now) : prev.activeDays,
        };
      });
    },
    [markActiveDay],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      updateProgress(id, (current) => ({
        ...current,
        favorite: !current.favorite,
      }));
    },
    [updateProgress],
  );

  const setNotes = useCallback(
    (id: string, notes: string) => {
      updateProgress(id, (current) => ({ ...current, notes }));
    },
    [updateProgress],
  );

  const setFeedback = useCallback(
    (id: string, feedback: -1 | 0 | 1) => {
      updateProgress(id, (current) => ({
        ...current,
        difficultyFeedback: feedback,
      }));
    },
    [updateProgress],
  );

  const addTopic = useCallback((topic: LearningTopic) => {
    setState((prev) => ({
      ...prev,
      customTopics: [...prev.customTopics, topic],
    }));
  }, []);

  const updateTopic = useCallback((topic: LearningTopic) => {
    setState((prev) => {
      const exists = prev.customTopics.some((item) => item.id === topic.id);
      return {
        ...prev,
        customTopics: exists
          ? prev.customTopics.map((item) =>
              item.id === topic.id ? topic : item,
            )
          : [...prev.customTopics, topic],
      };
    });
  }, []);

  const deleteTopic = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customTopics: prev.customTopics.filter((topic) => topic.id !== id),
    }));
  }, []);

  const addCategory = useCallback((category: Category) => {
    setState((prev) => {
      if (
        CATEGORIES.some((item) => item.id === category.id) ||
        prev.customCategories.some((item) => item.id === category.id)
      ) {
        return prev;
      }
      return {
        ...prev,
        customCategories: [...prev.customCategories, category],
      };
    });
  }, []);

  const importTopics = useCallback((imported: LearningTopic[]) => {
    setState((prev) => {
      const byId = new Map(prev.customTopics.map((t) => [t.id, t]));
      for (const topic of imported) {
        byId.set(topic.id, topic);
      }
      return { ...prev, customTopics: Array.from(byId.values()) };
    });
  }, []);

  const importFullState = useCallback((incoming: PersistedState) => {
    setState(() => ({ ...createDefaultState(), ...incoming }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...createDefaultState(),
      customTopics: prev.customTopics,
      customCategories: prev.customCategories,
      theme: prev.theme,
    }));
  }, []);

  const setTheme = useCallback((theme: "light" | "dark") => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  }, []);

  // Réutilise la même référence de valeur tant que rien ne change.
  const valueRef = useRef<AppState | null>(null);
  const value = useMemo<AppState>(() => {
    return {
      hydrated,
      topics,
      categories,
      progress: state.progress,
      history: state.history,
      filters: state.lastFilters,
      theme: state.theme,
      activeDays: state.activeDays,
      customTopics: state.customTopics,
      customCategories: state.customCategories,
      persisted: state,
      getProgress,
      updateFilters,
      recordDraw,
      setStatus,
      toggleFavorite,
      setNotes,
      setFeedback,
      addTopic,
      updateTopic,
      deleteTopic,
      addCategory,
      importTopics,
      importFullState,
      resetProgress,
      setTheme,
      toggleTheme,
    };
  }, [
    hydrated,
    topics,
    categories,
    state,
    getProgress,
    updateFilters,
    recordDraw,
    setStatus,
    toggleFavorite,
    setNotes,
    setFeedback,
    addTopic,
    updateTopic,
    deleteTopic,
    addCategory,
    importTopics,
    importFullState,
    resetProgress,
    setTheme,
    toggleTheme,
  ]);
  valueRef.current = value;

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState doit être utilisé dans <AppStateProvider>.");
  }
  return context;
}

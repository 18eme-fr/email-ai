/**
 * Types partagés de « La Roulette du Savoir ».
 *
 * Ce fichier centralise le modèle de données de l'application. Il est conçu
 * pour rester valable si l'on migre plus tard la persistance de localStorage
 * vers une base distante (Supabase, etc.) : les entités « métier »
 * (thèmes, catégories) sont séparées de l'état de l'utilisateur
 * (progression, favoris, historique).
 */

export type Difficulty = "Débutant" | "Intermédiaire" | "Avancé";

/** Durées disponibles, exprimées en minutes. */
export type Duration = 5 | 10 | 20 | 30 | 60;

/** Statut d'un thème du point de vue de l'utilisateur. */
export type TopicStatus = "todo" | "learned" | "review";

/**
 * Fiche d'apprentissage. C'est l'unité de contenu centrale de l'application.
 * Le champ `category` référence l'`id` d'une {@link Category}.
 */
export type LearningTopic = {
  id: string;
  title: string;
  /** Identifiant de la catégorie (voir `categories.ts`). */
  category: string;
  difficulty: Difficulty;
  duration: Duration;
  /** Objectif d'apprentissage : ce que l'on saura faire après la fiche. */
  objective: string;
  /** Pourquoi ce sujet est important / utile. */
  importance: string;
  keyConcepts: string[];
  questions: string[];
  activity: string;
  keywords: string[];
  sourceSuggestions?: string[];
};

/** Métadonnées d'une catégorie (affichage, roulette, filtres). */
export type Category = {
  id: string;
  label: string;
  /** Description courte affichée dans la bibliothèque. */
  description: string;
  /** Emoji utilisé comme icône légère et cohérente. */
  emoji: string;
  /** Couleur d'accent (HSL) utilisée par la roulette et les badges. */
  color: string;
};

/** Les trois modes de tirage demandés. */
export type SelectionMode = "discovery" | "review" | "surprise";

/**
 * Filtres appliqués au tirage. Toutes les valeurs sont optionnelles :
 * un filtre vide (ou `null`) signifie « pas de restriction ».
 */
export type SelectionFilters = {
  /** Catégories retenues. Liste vide = toutes les catégories. */
  categories: string[];
  difficulty: Difficulty | null;
  /** Durée maximale disponible, en minutes. */
  maxDuration: Duration | null;
  mode: SelectionMode;
  /** Autoriser le retirage de thèmes déjà terminés. */
  includeLearned: boolean;
};

/** Progression d'un thème donné, stockée côté utilisateur. */
export type TopicProgress = {
  status: TopicStatus;
  favorite: boolean;
  notes: string;
  /** Nombre de fois où le thème est sorti à la roulette. */
  drawCount: number;
  /** Timestamp (ms) de la dernière apparition à la roulette. */
  lastDrawnAt: number | null;
  /** Timestamp (ms) du passage au statut « terminé ». */
  learnedAt: number | null;
  /** Retour de difficulté ressenti : -1 trop facile, +1 trop difficile. */
  difficultyFeedback: -1 | 0 | 1;
};

/** Une entrée de l'historique des tirages. */
export type HistoryEntry = {
  id: string;
  topicId: string;
  /** Timestamp (ms) du tirage. */
  drawnAt: number;
  category: string;
  status: TopicStatus;
  plannedDuration: Duration;
  mode: SelectionMode;
};

/**
 * État complet persisté dans le stockage local.
 * `customTopics` contient les thèmes ajoutés manuellement par l'utilisateur ;
 * ils sont fusionnés avec la base initiale au chargement.
 */
export type PersistedState = {
  version: number;
  progress: Record<string, TopicProgress>;
  history: HistoryEntry[];
  customTopics: LearningTopic[];
  customCategories: Category[];
  /** Jours (au format `YYYY-MM-DD`) où au moins un thème a été étudié. */
  activeDays: string[];
  lastFilters: SelectionFilters;
  theme: "light" | "dark";
};

import { TOPICS } from "@/data/topics";
import { CATEGORIES } from "@/data/categories";
import { selectTopic, passesFilters } from "@/lib/topic-selection";
// Expose les données et l'algorithme testés au runtime de l'artifact.
(globalThis as unknown as { RDS: unknown }).RDS = {
  TOPICS,
  CATEGORIES,
  selectTopic,
  passesFilters,
};

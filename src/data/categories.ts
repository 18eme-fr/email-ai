import type { Category } from "@/types/topic";

/**
 * Catégories initiales de l'application.
 *
 * Chaque thème (`LearningTopic.category`) référence l'`id` de l'une de ces
 * catégories. Les couleurs sont exprimées en HSL (`H S% L%`) afin d'être
 * injectées directement dans des variables CSS et de fonctionner en thème
 * clair comme en thème sombre.
 */
export const CATEGORIES: Category[] = [
  {
    id: "daily-life",
    label: "Vie quotidienne",
    description:
      "Les savoirs concrets qui facilitent la vie de tous les jours et l'autonomie.",
    emoji: "🏠",
    color: "20 90% 55%",
  },
  {
    id: "practical-skills",
    label: "Compétences pratiques",
    description:
      "Des méthodes et gestes utiles : contrats, démarches, sécurité, organisation.",
    emoji: "🛠️",
    color: "38 92% 50%",
  },
  {
    id: "general-culture",
    label: "Culture générale",
    description: "Des repères transversaux pour comprendre le monde et briller.",
    emoji: "🧠",
    color: "265 70% 60%",
  },
  {
    id: "studies",
    label: "Études & méthodo",
    description:
      "Réussir ses études : méthodologie, prise de notes, mémorisation, examens.",
    emoji: "🎓",
    color: "210 90% 56%",
  },
  {
    id: "career",
    label: "Orientation & carrière",
    description:
      "Construire son projet professionnel, ses candidatures et ses entretiens.",
    emoji: "🧭",
    color: "175 65% 42%",
  },
  {
    id: "institutions",
    label: "Institutions & administration",
    description:
      "Le fonctionnement de l'État, des collectivités et des services publics.",
    emoji: "🏛️",
    color: "222 47% 45%",
  },
  {
    id: "europe-international",
    label: "Europe & international",
    description:
      "L'Union européenne, les organisations internationales et leurs mécanismes.",
    emoji: "🌍",
    color: "215 80% 50%",
  },
  {
    id: "economy",
    label: "Économie & finances",
    description:
      "Comprendre l'économie, la monnaie, les marchés et ses finances personnelles.",
    emoji: "💶",
    color: "142 60% 40%",
  },
  {
    id: "society",
    label: "Société & sujets de société",
    description:
      "Sociologie, inégalités, démocratie et grands débats contemporains.",
    emoji: "👥",
    color: "330 70% 55%",
  },
  {
    id: "psychology",
    label: "Psychologie & dév. personnel",
    description:
      "Mieux se connaître, réguler ses émotions et développer ses compétences.",
    emoji: "🧩",
    color: "280 60% 58%",
  },
  {
    id: "history-geopolitics",
    label: "Histoire & géopolitique",
    description:
      "Les grandes dynamiques historiques et les rapports de force mondiaux.",
    emoji: "🗺️",
    color: "24 60% 45%",
  },
  {
    id: "ecology",
    label: "Écologie & environnement",
    description:
      "Climat, biodiversité, énergie et transition écologique.",
    emoji: "🌱",
    color: "130 55% 42%",
  },
  {
    id: "media-digital",
    label: "Médias & numérique",
    description:
      "Information, désinformation, plateformes, données et intelligence artificielle.",
    emoji: "📱",
    color: "199 80% 48%",
  },
  {
    id: "cultural-sector",
    label: "Culture & spectacle",
    description:
      "Politiques culturelles, production, spectacle vivant et médiation.",
    emoji: "🎭",
    color: "300 65% 55%",
  },
  {
    id: "management-work",
    label: "Management & travail",
    description:
      "Encadrer une équipe, gérer un projet et comprendre le monde du travail.",
    emoji: "💼",
    color: "255 60% 60%",
  },
  {
    id: "languages",
    label: "Langues",
    description:
      "Apprendre et progresser en langues étrangères, méthodes et pratique.",
    emoji: "🗣️",
    color: "0 70% 58%",
  },
];

/** Index par id, pour un accès O(1). */
export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
);

/** Récupère une catégorie, avec un repli robuste si l'id est inconnu. */
export function getCategory(
  id: string,
  extraCategories: Category[] = [],
): Category {
  const extra = extraCategories.find((category) => category.id === id);
  if (extra) return extra;
  return (
    CATEGORY_BY_ID[id] ?? {
      id,
      label: id,
      description: "",
      emoji: "❓",
      color: "220 10% 50%",
    }
  );
}

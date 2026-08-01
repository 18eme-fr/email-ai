import { describe, expect, it } from "vitest";
import type {
  LearningTopic,
  SelectionFilters,
  TopicProgress,
} from "@/types/topic";
import { DEFAULT_FILTERS, DEFAULT_PROGRESS } from "@/lib/storage";
import {
  buildCandidatePool,
  computeCategoryWorkload,
  computeWeight,
  passesFilters,
  selectTopic,
  weightedPick,
  DAY_MS,
} from "@/lib/topic-selection";

/** Fabrique un thème minimal pour les tests. */
function makeTopic(overrides: Partial<LearningTopic>): LearningTopic {
  return {
    id: "t",
    title: "Titre",
    category: "economy",
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "",
    importance: "",
    keyConcepts: [],
    questions: [],
    activity: "",
    keywords: [],
    ...overrides,
  };
}

function makeProgress(overrides: Partial<TopicProgress>): TopicProgress {
  return { ...DEFAULT_PROGRESS, ...overrides };
}

function makeFilters(overrides: Partial<SelectionFilters>): SelectionFilters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

/** Générateur déterministe : renvoie successivement les valeurs fournies. */
function seededRng(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("passesFilters", () => {
  const topic = makeTopic({ category: "economy", difficulty: "Avancé", duration: 30 });

  it("respecte le filtre de catégorie", () => {
    expect(passesFilters(topic, makeFilters({ categories: ["economy"] }))).toBe(true);
    expect(passesFilters(topic, makeFilters({ categories: ["history-geopolitics"] }))).toBe(false);
  });

  it("respecte le filtre de difficulté", () => {
    expect(passesFilters(topic, makeFilters({ difficulty: "Avancé" }))).toBe(true);
    expect(passesFilters(topic, makeFilters({ difficulty: "Débutant" }))).toBe(false);
  });

  it("respecte la durée maximale disponible", () => {
    expect(passesFilters(topic, makeFilters({ maxDuration: 30 }))).toBe(true);
    expect(passesFilters(topic, makeFilters({ maxDuration: 20 }))).toBe(false);
  });

  it("accepte tout quand aucun filtre n'est posé", () => {
    expect(passesFilters(topic, makeFilters({}))).toBe(true);
  });
});

describe("weightedPick", () => {
  it("choisit l'élément dont le poids couvre le seuil", () => {
    const items = ["a", "b", "c"];
    const weights = [1, 1, 8]; // total = 10
    // rng renvoie 0.05 -> seuil 0.5 -> tombe sur "a"
    expect(weightedPick(items, weights, seededRng([0.05]))).toBe("a");
    // rng 0.15 -> seuil 1.5 -> tombe sur "b"
    expect(weightedPick(items, weights, seededRng([0.15]))).toBe("b");
    // rng 0.9 -> seuil 9 -> tombe sur "c"
    expect(weightedPick(items, weights, seededRng([0.9]))).toBe("c");
  });

  it("répartit selon le poids sur un grand nombre de tirages", () => {
    const items = ["rare", "commun"];
    const weights = [1, 9];
    let commun = 0;
    // rng cyclique déterministe pour couvrir uniformément [0,1)
    let seed = 0.001;
    const rng = () => {
      seed = (seed + 0.01) % 1;
      return seed;
    };
    for (let i = 0; i < 1000; i += 1) {
      if (weightedPick(items, weights, rng) === "commun") commun += 1;
    }
    // ~90 % attendu ; on laisse une marge.
    expect(commun).toBeGreaterThan(820);
  });

  it("reste robuste si tous les poids sont nuls", () => {
    const items = ["a", "b"];
    const picked = weightedPick(items, [0, 0], seededRng([0.4]));
    expect(items).toContain(picked);
  });
});

describe("computeCategoryWorkload", () => {
  it("normalise la charge des catégories entre 0 et 1", () => {
    const topics = [
      makeTopic({ id: "a", category: "economy" }),
      makeTopic({ id: "b", category: "economy" }),
      makeTopic({ id: "c", category: "history-geopolitics" }),
    ];
    const progress = {
      a: makeProgress({ status: "learned", drawCount: 3 }),
      b: makeProgress({ drawCount: 1 }),
      // economy total = 3 + 2 (learned) + 1 = 6 ; history = 0
    };
    const workload = computeCategoryWorkload(topics, progress);
    expect(workload.economy).toBe(1);
    expect(workload["history-geopolitics"]).toBe(0);
  });
});

describe("computeWeight", () => {
  const ctx = {
    now: 10 * DAY_MS,
    filters: makeFilters({ mode: "surprise" }),
    categoryWorkload: { economy: 0 },
  };

  it("attribue un poids plus faible à un thème tiré récemment", () => {
    const topic = makeTopic({ category: "economy" });
    const fresh = computeWeight(topic, makeProgress({}), ctx);
    const recent = computeWeight(
      topic,
      makeProgress({ lastDrawnAt: ctx.now - 0.1 * DAY_MS, drawCount: 1 }),
      ctx,
    );
    expect(recent).toBeLessThan(fresh);
  });

  it("favorise les catégories peu travaillées", () => {
    const topic = makeTopic({ category: "economy" });
    const idle = computeWeight(topic, makeProgress({}), {
      ...ctx,
      categoryWorkload: { economy: 0 },
    });
    const saturated = computeWeight(topic, makeProgress({}), {
      ...ctx,
      categoryWorkload: { economy: 1 },
    });
    expect(idle).toBeGreaterThan(saturated);
  });

  it("mode découverte : privilégie les thèmes jamais vus", () => {
    const topic = makeTopic({ category: "economy" });
    const discovery = makeFilters({ mode: "discovery" });
    const neverSeen = computeWeight(topic, makeProgress({}), {
      ...ctx,
      filters: discovery,
    });
    const alreadySeen = computeWeight(
      topic,
      makeProgress({ drawCount: 1, lastDrawnAt: null }),
      { ...ctx, filters: discovery },
    );
    expect(neverSeen).toBeGreaterThan(alreadySeen);
  });

  it("mode révision : privilégie les thèmes marqués « à revoir »", () => {
    const topic = makeTopic({ category: "economy" });
    const review = makeFilters({ mode: "review" });
    const toReview = computeWeight(topic, makeProgress({ status: "review" }), {
      ...ctx,
      filters: review,
    });
    const todo = computeWeight(topic, makeProgress({ status: "todo" }), {
      ...ctx,
      filters: review,
    });
    expect(toReview).toBeGreaterThan(todo);
  });

  it("réduit le poids d'un thème jugé trop facile", () => {
    const topic = makeTopic({ category: "economy" });
    const normal = computeWeight(topic, makeProgress({}), ctx);
    const tooEasy = computeWeight(
      topic,
      makeProgress({ difficultyFeedback: -1 }),
      ctx,
    );
    expect(tooEasy).toBeLessThan(normal);
  });

  it("renvoie toujours un poids strictement positif", () => {
    const topic = makeTopic({ category: "economy" });
    const weight = computeWeight(
      topic,
      makeProgress({
        lastDrawnAt: ctx.now,
        drawCount: 50,
        difficultyFeedback: -1,
      }),
      { ...ctx, categoryWorkload: { economy: 1 } },
    );
    expect(weight).toBeGreaterThan(0);
  });
});

describe("buildCandidatePool", () => {
  const topics = [
    makeTopic({ id: "a", category: "economy", difficulty: "Débutant", duration: 10 }),
    makeTopic({ id: "b", category: "economy", difficulty: "Avancé", duration: 60 }),
    makeTopic({ id: "c", category: "history-geopolitics", difficulty: "Intermédiaire", duration: 20 }),
  ];

  it("exclut les thèmes terminés par défaut", () => {
    const progress = { a: makeProgress({ status: "learned" }) };
    const { pool } = buildCandidatePool(topics, progress, makeFilters({}));
    expect(pool.map((t) => t.id)).not.toContain("a");
    expect(pool.map((t) => t.id)).toEqual(expect.arrayContaining(["b", "c"]));
  });

  it("inclut les thèmes terminés si l'option est activée", () => {
    const progress = { a: makeProgress({ status: "learned" }) };
    const { pool } = buildCandidatePool(
      topics,
      progress,
      makeFilters({ includeLearned: true }),
    );
    expect(pool.map((t) => t.id)).toContain("a");
  });

  it("mode révision : ne garde que « à revoir » ou « terminé »", () => {
    const progress = {
      a: makeProgress({ status: "review" }),
      b: makeProgress({ status: "learned" }),
    };
    const { pool } = buildCandidatePool(
      topics,
      progress,
      makeFilters({ mode: "review" }),
    );
    expect(pool.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  it("bascule sur un repli quand le bassin principal est vide", () => {
    // Mode révision mais aucun thème « à revoir » / « terminé ».
    const { pool, usedFallback } = buildCandidatePool(
      topics,
      {},
      makeFilters({ mode: "review" }),
    );
    expect(usedFallback).toBe(true);
    expect(pool.length).toBeGreaterThan(0);
  });
});

describe("selectTopic", () => {
  const topics = [
    makeTopic({ id: "a", category: "economy" }),
    makeTopic({ id: "b", category: "economy" }),
    makeTopic({ id: "c", category: "history-geopolitics" }),
  ];

  it("renvoie null quand aucun thème ne correspond aux filtres", () => {
    const result = selectTopic({
      topics,
      progressMap: {},
      filters: makeFilters({ categories: ["languages"] }),
    });
    expect(result).toBeNull();
  });

  it("sélectionne un thème compatible avec les filtres", () => {
    const result = selectTopic({
      topics,
      progressMap: {},
      filters: makeFilters({ categories: ["history-geopolitics"] }),
      rng: seededRng([0.5]),
    });
    expect(result).not.toBeNull();
    expect(result?.topic.id).toBe("c");
  });

  it("évite de ressortir en priorité un thème tiré à l'instant", () => {
    const now = 100 * DAY_MS;
    // 'a' vient d'être tiré 200 fois : 'b' devrait quasi toujours sortir.
    const progress = {
      a: makeProgress({ lastDrawnAt: now, drawCount: 200 }),
    };
    let bCount = 0;
    let seed = 0.0;
    const rng = () => {
      seed = (seed + 0.017) % 1;
      return seed;
    };
    for (let i = 0; i < 200; i += 1) {
      const result = selectTopic({
        topics: [topics[0], topics[1]],
        progressMap: progress,
        filters: makeFilters({ mode: "surprise", categories: ["economy"] }),
        now,
        rng,
      });
      if (result?.topic.id === "b") bCount += 1;
    }
    expect(bCount).toBeGreaterThan(180);
  });
});

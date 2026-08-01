"use client";

import {
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import type {
  Category,
  Difficulty,
  Duration,
  LearningTopic,
} from "@/types/topic";
import { useAppState } from "@/hooks/use-app-state";
import {
  buildExportPayload,
  parseImportedTopics,
  createDefaultState,
} from "@/lib/storage";
import { getCategory } from "@/data/categories";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DIFFICULTIES: Difficulty[] = ["Débutant", "Intermédiaire", "Avancé"];
const DURATIONS: Duration[] = [5, 10, 20, 30, 60];
const COLOR_PRESETS = [
  "258 82% 60%",
  "199 80% 48%",
  "142 60% 40%",
  "35 92% 50%",
  "356 72% 54%",
  "300 65% 55%",
  "175 65% 42%",
  "24 60% 45%",
];

type TopicForm = {
  id: string | null;
  title: string;
  category: string;
  difficulty: Difficulty;
  duration: Duration;
  objective: string;
  importance: string;
  keyConcepts: string;
  questions: string;
  activity: string;
  keywords: string;
  sourceSuggestions: string;
};

function emptyForm(defaultCategory: string): TopicForm {
  return {
    id: null,
    title: "",
    category: defaultCategory,
    difficulty: "Intermédiaire",
    duration: 20,
    objective: "",
    importance: "",
    keyConcepts: "",
    questions: "",
    activity: "",
    keywords: "",
    sourceSuggestions: "",
  };
}

function toForm(topic: LearningTopic): TopicForm {
  return {
    id: topic.id,
    title: topic.title,
    category: topic.category,
    difficulty: topic.difficulty,
    duration: topic.duration,
    objective: topic.objective,
    importance: topic.importance,
    keyConcepts: topic.keyConcepts.join("\n"),
    questions: topic.questions.join("\n"),
    activity: topic.activity,
    keywords: topic.keywords.join(", "),
    sourceSuggestions: (topic.sourceSuggestions ?? []).join(", "),
  };
}

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function commaToArray(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40";
const labelClass = "space-y-1 text-sm font-medium";

export function ManageView() {
  const {
    categories,
    customTopics,
    customCategories,
    persisted,
    addTopic,
    updateTopic,
    deleteTopic,
    addCategory,
    importTopics,
    importFullState,
    resetProgress,
  } = useAppState();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<TopicForm>(() =>
    emptyForm(categories[0]?.id ?? "general-culture"),
  );
  const [showForm, setShowForm] = useState(false);

  // Nouvelle catégorie
  const [catLabel, setCatLabel] = useState("");
  const [catEmoji, setCatEmoji] = useState("✨");
  const [catColor, setCatColor] = useState(COLOR_PRESETS[0]);
  const [catDescription, setCatDescription] = useState("");

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 4000);
  };

  const startNew = () => {
    setForm(emptyForm(categories[0]?.id ?? "general-culture"));
    setShowForm(true);
  };

  const startEdit = (topic: LearningTopic) => {
    setForm(toForm(topic));
    setShowForm(true);
  };

  const submitTopic = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      flash("Le titre est obligatoire.");
      return;
    }
    const topic: LearningTopic = {
      id: form.id ?? generateId("custom"),
      title: form.title.trim(),
      category: form.category,
      difficulty: form.difficulty,
      duration: form.duration,
      objective: form.objective.trim(),
      importance: form.importance.trim(),
      keyConcepts: linesToArray(form.keyConcepts),
      questions: linesToArray(form.questions),
      activity: form.activity.trim(),
      keywords: commaToArray(form.keywords),
      sourceSuggestions: commaToArray(form.sourceSuggestions),
    };
    if (form.id) {
      updateTopic(topic);
      flash("Thème mis à jour.");
    } else {
      addTopic(topic);
      flash("Thème ajouté.");
    }
    setShowForm(false);
  };

  const submitCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!catLabel.trim()) {
      flash("Le nom de la catégorie est obligatoire.");
      return;
    }
    const id = catLabel
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const category: Category = {
      id: id || generateId("cat"),
      label: catLabel.trim(),
      description: catDescription.trim(),
      emoji: catEmoji.trim() || "✨",
      color: catColor,
    };
    addCategory(category);
    flash("Catégorie ajoutée.");
    setCatLabel("");
    setCatDescription("");
  };

  const handleExport = () => {
    downloadJson("roulette-du-savoir-sauvegarde.json", buildExportPayload(persisted));
    flash("Sauvegarde exportée.");
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      // Sauvegarde complète (export de l'app) : restauration totale.
      if (
        parsed &&
        typeof parsed === "object" &&
        "state" in parsed &&
        (parsed as { state?: unknown }).state &&
        typeof (parsed as { state: object }).state === "object"
      ) {
        importFullState({
          ...createDefaultState(),
          ...((parsed as { state: object }).state as object),
        } as never);
        flash("Sauvegarde complète restaurée.");
      } else {
        const { topics, errors } = parseImportedTopics(parsed);
        if (topics.length > 0) importTopics(topics);
        flash(
          `${topics.length} thème(s) importé(s).` +
            (errors.length ? ` ${errors.length} ignoré(s).` : ""),
        );
      }
    } catch {
      flash("Fichier JSON invalide.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Réinitialiser toute votre progression (statuts, favoris, historique, notes) ? Vos thèmes personnalisés seront conservés.",
      )
    ) {
      resetProgress();
      flash("Progression réinitialisée.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Gérer les thèmes</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez vos propres thèmes et catégories, importez ou exportez vos
          données.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
          {message}
        </div>
      )}

      {/* Import / Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Données</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exporter (JSON)
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Importer (JSON)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Réinitialiser la progression
          </Button>
        </CardContent>
      </Card>

      {/* Formulaire de thème */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {showForm
              ? form.id
                ? "Modifier un thème"
                : "Nouveau thème"
              : "Ajouter un thème"}
          </CardTitle>
          {!showForm && (
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        {showForm && (
          <CardContent>
            <form onSubmit={submitTopic} className="space-y-4">
              <label className={labelClass}>
                <span>Titre</span>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex. Comment fonctionne le budget d'une commune ?"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className={labelClass}>
                  <span>Catégorie</span>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  <span>Difficulté</span>
                  <select
                    className={inputClass}
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        difficulty: e.target.value as Difficulty,
                      })
                    }
                  >
                    {DIFFICULTIES.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  <span>Durée (min)</span>
                  <select
                    className={inputClass}
                    value={form.duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration: Number(e.target.value) as Duration,
                      })
                    }
                  >
                    {DURATIONS.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={labelClass}>
                <span>Pourquoi apprendre ce sujet</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.importance}
                  onChange={(e) =>
                    setForm({ ...form, importance: e.target.value })
                  }
                />
              </label>
              <label className={labelClass}>
                <span>Objectif</span>
                <input
                  className={inputClass}
                  value={form.objective}
                  onChange={(e) =>
                    setForm({ ...form, objective: e.target.value })
                  }
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span>Notions clés (une par ligne)</span>
                  <textarea
                    className={inputClass}
                    rows={5}
                    value={form.keyConcepts}
                    onChange={(e) =>
                      setForm({ ...form, keyConcepts: e.target.value })
                    }
                  />
                </label>
                <label className={labelClass}>
                  <span>Questions à maîtriser (une par ligne)</span>
                  <textarea
                    className={inputClass}
                    rows={5}
                    value={form.questions}
                    onChange={(e) =>
                      setForm({ ...form, questions: e.target.value })
                    }
                  />
                </label>
              </div>

              <label className={labelClass}>
                <span>Activité concrète</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.activity}
                  onChange={(e) =>
                    setForm({ ...form, activity: e.target.value })
                  }
                />
              </label>
              <label className={labelClass}>
                <span>Mots-clés (séparés par des virgules)</span>
                <input
                  className={inputClass}
                  value={form.keywords}
                  onChange={(e) =>
                    setForm({ ...form, keywords: e.target.value })
                  }
                />
              </label>
              <label className={labelClass}>
                <span>Sources suggérées (séparées par des virgules)</span>
                <input
                  className={inputClass}
                  value={form.sourceSuggestions}
                  onChange={(e) =>
                    setForm({ ...form, sourceSuggestions: e.target.value })
                  }
                />
              </label>

              <div className="flex gap-2">
                <Button type="submit">
                  {form.id ? "Enregistrer" : "Ajouter le thème"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Thèmes personnalisés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Mes thèmes personnalisés ({customTopics.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customTopics.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucun thème personnalisé pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {customTopics.map((topic) => {
                const category = getCategory(topic.category, customCategories);
                return (
                  <li
                    key={topic.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {topic.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {category.emoji} {category.label}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Modifier"
                        onClick={() => startEdit(topic)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Supprimer"
                        onClick={() => deleteTopic(topic.id)}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Nouvelle catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter une catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCategory} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className={labelClass}>
                <span>Nom</span>
                <input
                  className={inputClass}
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  placeholder="Ex. Arts numériques"
                />
              </label>
              <label className={labelClass}>
                <span>Emoji</span>
                <input
                  className={`${inputClass} w-20 text-center`}
                  value={catEmoji}
                  onChange={(e) => setCatEmoji(e.target.value)}
                  maxLength={4}
                />
              </label>
            </div>
            <label className={labelClass}>
              <span>Description</span>
              <input
                className={inputClass}
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
              />
            </label>
            <div className="space-y-1">
              <span className="text-sm font-medium">Couleur</span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Couleur ${color}`}
                    onClick={() => setCatColor(color)}
                    style={{ backgroundColor: `hsl(${color})` }}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      catColor === color
                        ? "scale-110 border-foreground"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Ajouter la catégorie
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

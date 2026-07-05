"use client";

import { useState } from "react";
import type { AiAnalysis, YoutubeCandidate } from "@/types";

interface SearchResult {
  candidate: YoutubeCandidate;
  analysis: AiAnalysis;
}

const DECISION_LABEL: Record<AiAnalysis["decision"], string> = {
  accept: "Acceptée",
  hold: "En attente",
  reject: "Refusée",
};

const DECISION_STYLE: Record<AiAnalysis["decision"], string> = {
  accept: "text-emerald-400 border-emerald-700",
  hold: "text-amber-400 border-amber-700",
  reject: "text-salin-red-bright border-salin-red",
};

export default function AdminSearchPanel({
  onVideoCreated,
}: {
  onVideoCreated: () => void;
}) {
  const [query, setQuery] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          max_views: maxViews ? Number(maxViews) : undefined,
          min_duration_seconds: minDuration ? Number(minDuration) : undefined,
          max_duration_seconds: maxDuration ? Number(maxDuration) : undefined,
        }),
      });
      if (!res.ok) throw new Error("La recherche a échoué");
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function saveVideo(
    result: SearchResult,
    statusOverride?: "approved" | "pending" | "rejected"
  ) {
    setSavingId(result.candidate.youtube_video_id);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "from_analysis",
          candidate: result.candidate,
          analysis: result.analysis,
          status_override: statusOverride,
        }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement");
      setResults((prev) =>
        prev.filter(
          (r) => r.candidate.youtube_video_id !== result.candidate.youtube_video_id
        )
      );
      onVideoCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-salin-line bg-salin-bg-card p-6">
      <h2 className="font-display text-xl">Recherche YouTube + analyse IA</h2>
      <p className="mt-1 text-sm text-salin-fg-muted">
        Lance une recherche par mots-clés, l&apos;IA analyse chaque résultat et propose
        une décision.
      </p>

      <form onSubmit={runSearch} className="mt-4 grid gap-3 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Mots-clés (ex: field recording rare)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          type="number"
          placeholder="Vues max"
          value={maxViews}
          onChange={(e) => setMaxViews(e.target.value)}
          className="rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Durée min (s)"
            value={minDuration}
            onChange={(e) => setMinDuration(e.target.value)}
            className="w-1/2 rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Durée max (s)"
            value={maxDuration}
            onChange={(e) => setMaxDuration(e.target.value)}
            className="w-1/2 rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-salin-red px-6 py-2 text-sm font-semibold uppercase tracking-wide transition hover:bg-salin-red-bright disabled:opacity-60 sm:col-span-4 sm:w-fit"
        >
          {loading ? "Recherche en cours..." : "Lancer la recherche"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-salin-red-bright">{error}</p>}

      <div className="mt-6 flex flex-col gap-4">
        {results.map((result) => (
          <div
            key={result.candidate.youtube_video_id}
            className="rounded-xl border border-salin-line bg-salin-bg-elevated p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{result.candidate.title}</h3>
                <p className="text-xs text-salin-fg-muted">
                  {result.candidate.channel_name} ·{" "}
                  {result.candidate.view_count.toLocaleString("fr-FR")} vues ·{" "}
                  {result.candidate.duration_seconds}s
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${DECISION_STYLE[result.analysis.decision]}`}
              >
                IA : {DECISION_LABEL[result.analysis.decision]}
              </span>
            </div>

            <p className="mt-2 text-sm">{result.analysis.summary}</p>
            <p className="mt-1 text-xs text-salin-fg-muted">{result.analysis.reason}</p>

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-salin-fg-muted">
              <span>Rareté {result.analysis.rarity_score}</span>
              <span>Qualité {result.analysis.quality_score}</span>
              <span>Découverte {result.analysis.discovery_score}</span>
              <span>Sample {result.analysis.sample_score}</span>
              <span>Ambiance : {result.analysis.mood}</span>
              <span>Genre : {result.analysis.genre}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => saveVideo(result, "approved")}
                disabled={savingId === result.candidate.youtube_video_id}
                className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-emerald-600 disabled:opacity-60"
              >
                Valider
              </button>
              <button
                onClick={() => saveVideo(result, "pending")}
                disabled={savingId === result.candidate.youtube_video_id}
                className="rounded-full border border-amber-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400 hover:bg-amber-950 disabled:opacity-60"
              >
                Mettre en attente
              </button>
              <button
                onClick={() => saveVideo(result, "rejected")}
                disabled={savingId === result.candidate.youtube_video_id}
                className="rounded-full border border-salin-red px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-salin-red-bright hover:bg-salin-red/20 disabled:opacity-60"
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <p className="text-xs text-salin-fg-muted">
            Aucun résultat pour l&apos;instant. Lance une recherche ci-dessus.
          </p>
        )}
      </div>
    </section>
  );
}

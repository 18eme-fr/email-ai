"use client";

import { useState } from "react";

export default function AdminManualAdd({
  onVideoCreated,
}: {
  onVideoCreated: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "manual", youtube_url: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'ajout");
      setMessage(`Ajoutée : "${data.video.title}"`);
      setUrl("");
      onVideoCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-salin-line bg-salin-bg-card p-6">
      <h2 className="font-display text-xl">Ajouter une vidéo manuellement</h2>
      <p className="mt-1 text-sm text-salin-fg-muted">
        Colle une URL YouTube — l&apos;IA l&apos;analyse et l&apos;ajoute directement
        à la rotation.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-[280px] flex-1 rounded-lg border border-salin-line bg-salin-bg-elevated px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-salin-red px-6 py-2 text-sm font-semibold uppercase tracking-wide transition hover:bg-salin-red-bright disabled:opacity-60"
        >
          {loading ? "Ajout..." : "Ajouter"}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-3 text-sm text-salin-red-bright">{error}</p>}
    </section>
  );
}

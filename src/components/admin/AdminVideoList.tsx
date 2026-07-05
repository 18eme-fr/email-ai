"use client";

import { useEffect, useState } from "react";
import Thumbnail from "@/components/Thumbnail";
import type { Video, VideoStatus } from "@/types";

interface AdminVideoListProps {
  title: string;
  description?: string;
  statuses: VideoStatus[];
  refreshKey: number;
  emptyLabel: string;
}

const STATUS_ACTIONS: { status: VideoStatus; label: string; style: string }[] = [
  {
    status: "approved",
    label: "Approuver",
    style: "border-emerald-600 text-emerald-400 hover:bg-emerald-950",
  },
  {
    status: "pending",
    label: "Mettre en attente",
    style: "border-amber-600 text-amber-400 hover:bg-amber-950",
  },
  {
    status: "rejected",
    label: "Refuser",
    style: "border-salin-red text-salin-red-bright hover:bg-salin-red/20",
  },
];

export default function AdminVideoList({
  title,
  description,
  statuses,
  refreshKey,
  emptyLabel,
}: AdminVideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((res) => res.json())
      .then((data: { videos: Video[] }) => {
        setVideos(data.videos.filter((v) => statuses.includes(v.status)));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, statuses.join(",")]);

  async function updateVideo(id: string, patch: Partial<Video>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos((prev) =>
        statuses.includes(data.video.status)
          ? prev.map((v) => (v.id === id ? data.video : v))
          : prev.filter((v) => v.id !== id)
      );
    } catch {
      // best-effort UI, errors surfaced via unchanged state
    } finally {
      setSavingId(null);
    }
  }

  function saveTags(video: Video) {
    const raw = drafts[video.id];
    if (raw === undefined) return;
    const tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateVideo(video.id, { tags });
  }

  if (loading) {
    return <p className="text-xs text-salin-fg-muted">Chargement...</p>;
  }

  return (
    <section className="rounded-2xl border border-salin-line bg-salin-bg-card p-6">
      <h2 className="font-display text-xl">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-salin-fg-muted">{description}</p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex flex-col gap-3 rounded-xl border border-salin-line bg-salin-bg-elevated p-4 sm:flex-row"
          >
            <Thumbnail
              src={video.thumbnail_url}
              alt={video.title}
              className="h-[72px] w-32 flex-shrink-0 rounded object-cover"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{video.title}</h3>
                <span className="text-xs text-salin-fg-muted">{video.channel_name}</span>
              </div>
              <p className="mt-1 text-xs text-salin-fg-muted">{video.ai_reason}</p>

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-salin-fg-muted">
                <span>Rareté {video.rarity_score}</span>
                <span>Qualité {video.quality_score}</span>
                <span>Découverte {video.discovery_score}</span>
                <span>Sample {video.sample_score}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  defaultValue={video.tags.join(", ")}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [video.id]: e.target.value }))
                  }
                  placeholder="tags séparés par des virgules"
                  className="min-w-[220px] flex-1 rounded-lg border border-salin-line bg-salin-bg-card px-2 py-1 text-xs"
                />
                <button
                  onClick={() => saveTags(video)}
                  disabled={savingId === video.id}
                  className="rounded-full border border-salin-line px-3 py-1 text-xs hover:border-salin-red-bright"
                >
                  Enregistrer les tags
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_ACTIONS.filter((a) => a.status !== video.status).map(
                  (action) => (
                    <button
                      key={action.status}
                      onClick={() => updateVideo(video.id, { status: action.status })}
                      disabled={savingId === video.id}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide disabled:opacity-60 ${action.style}`}
                    >
                      {action.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <p className="text-xs text-salin-fg-muted">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

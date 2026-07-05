"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RadioPlayer from "@/components/RadioPlayer";
import ScoreBadge from "@/components/ScoreBadge";
import TagList from "@/components/TagList";
import Thumbnail from "@/components/Thumbnail";
import { formatDuration, formatViews } from "@/lib/format";
import type { Video } from "@/types";

const QUEUE_TARGET = 6;
const HISTORY_LIMIT = 8;

async function fetchNextBatch(
  history: Video[],
  count: number
): Promise<{ videos: Video[]; slot: { name: string; description: string } }> {
  const historyIds = history.map((v) => v.id).join(",");
  const historyChannels = history.map((v) => v.channel_id).join(",");
  const params = new URLSearchParams({
    count: String(count),
    history: historyIds,
    history_channels: historyChannels,
  });
  const res = await fetch(`/api/queue?${params.toString()}`);
  if (!res.ok) throw new Error("Impossible de charger la file d'attente");
  return res.json();
}

export default function RadioPage() {
  const [current, setCurrent] = useState<Video | null>(null);
  const [queue, setQueue] = useState<Video[]>([]);
  const [history, setHistory] = useState<Video[]>([]);
  const [slot, setSlot] = useState<{ name: string; description: string } | null>(
    null
  );
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef({ current, queue, history });
  useEffect(() => {
    stateRef.current = { current, queue, history };
  });

  const refill = useCallback(async () => {
    const { current, queue, history } = stateRef.current;
    const recent = [...history, ...(current ? [current] : []), ...queue].slice(
      -HISTORY_LIMIT
    );
    try {
      const data = await fetchNextBatch(recent, QUEUE_TARGET);
      setSlot(data.slot);
      setQueue((prev) => {
        const existingIds = new Set([
          ...(current ? [current.id] : []),
          ...prev.map((v) => v.id),
        ]);
        const fresh = data.videos.filter((v) => !existingIds.has(v.id));
        return [...prev, ...fresh];
      });
    } catch {
      setError("Impossible de charger la suite du flux. Nouvel essai...");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchNextBatch([], QUEUE_TARGET);
        setSlot(data.slot);
        if (data.videos.length === 0) {
          setError("Aucune vidéo disponible pour le moment.");
        } else {
          setCurrent(data.videos[0]);
          setQueue(data.videos.slice(1));
        }
      } catch {
        setError("Impossible de démarrer la radio pour le moment.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (queue.length < 3) {
      refill();
    }
  }, [queue.length, refill]);

  const advance = useCallback(() => {
    setHistory((prevHistory) => {
      const { current } = stateRef.current;
      if (!current) return prevHistory;
      return [current, ...prevHistory].slice(0, HISTORY_LIMIT);
    });
    setQueue((prevQueue) => {
      const [next, ...rest] = prevQueue;
      setCurrent(next ?? null);
      return rest;
    });
  }, []);

  const handleEnded = useCallback(() => {
    advance();
  }, [advance]);

  const handleError = useCallback(() => {
    const { current } = stateRef.current;
    if (current) {
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: current.id, action: "report" }),
      }).catch(() => {});
    }
    advance();
  }, [advance]);

  const handleSkip = useCallback(() => {
    const { current } = stateRef.current;
    if (current) {
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: current.id, action: "skip" }),
      }).catch(() => {});
    }
    advance();
  }, [advance]);

  const handleLike = useCallback(() => {
    const { current } = stateRef.current;
    if (!current) return;
    setLiked((prev) => ({ ...prev, [current.id]: true }));
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_id: current.id, action: "like" }),
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-32 text-center text-salin-fg-muted">
        <div className="mb-4 h-3 w-3 animate-ping rounded-full bg-salin-red-bright" />
        Connexion au flux Salin Radio...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center text-salin-fg-muted">
        {error ?? "Aucune vidéo disponible pour le moment."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {slot && (
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-salin-fg-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-salin-red-bright" />
          En direct — {slot.name}
        </div>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-salin-red/60 bg-salin-red/10 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <RadioPlayer
            key={current.id}
            videoId={current.youtube_video_id}
            onEnded={handleEnded}
            onError={handleError}
          />

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <h1 className="font-display text-2xl leading-tight sm:text-3xl">
                {current.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-salin-fg-muted">
                <span>{current.channel_name}</span>
                <span>{formatViews(current.view_count)} vues</span>
                <span>{formatDuration(current.duration_seconds)}</span>
                <a
                  href={current.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-salin-red-bright hover:underline"
                >
                  Voir sur YouTube
                </a>
              </div>
            </div>

            <TagList tags={current.tags} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreBadge type="rarity" value={current.rarity_score} />
              <ScoreBadge type="quality" value={current.quality_score} />
              <ScoreBadge type="discovery" value={current.discovery_score} />
              <ScoreBadge type="sample" value={current.sample_score} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleLike}
                disabled={!!liked[current.id]}
                className="rounded-full bg-salin-red px-6 py-3 text-sm font-semibold uppercase tracking-wide transition hover:bg-salin-red-bright disabled:opacity-60"
              >
                {liked[current.id] ? "Aimé ✓" : "J'aime cette découverte"}
              </button>
              <button
                onClick={advance}
                className="rounded-full border border-salin-line px-6 py-3 text-sm font-semibold uppercase tracking-wide transition hover:border-salin-red-bright"
              >
                Vidéo suivante
              </button>
              <button
                onClick={handleSkip}
                className="rounded-full border border-salin-line px-6 py-3 text-sm font-semibold uppercase tracking-wide text-salin-fg-muted transition hover:border-salin-red-bright hover:text-salin-fg"
              >
                Passer
              </button>
            </div>

            <Link
              href={`/video/${current.id}`}
              className="text-xs text-salin-fg-muted hover:text-salin-fg"
            >
              Voir la fiche complète de cette découverte →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-salin-fg-muted">
              À suivre
            </h2>
            <ul className="flex flex-col gap-3">
              {queue.slice(0, 5).map((video) => (
                <li key={video.id}>
                  <Link
                    href={`/video/${video.id}`}
                    className="flex items-center gap-3 rounded-lg border border-salin-line bg-salin-bg-card p-2 transition hover:border-salin-red-bright/60"
                  >
                    <Thumbnail
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-11 w-20 flex-shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{video.title}</p>
                      <p className="truncate text-xs text-salin-fg-muted">
                        {video.channel_name}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {queue.length === 0 && (
                <li className="text-xs text-salin-fg-muted">
                  Chargement des prochaines découvertes...
                </li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-salin-fg-muted">
              Historique
            </h2>
            <ul className="flex flex-col gap-3">
              {history.slice(0, 6).map((video, i) => (
                <li key={`${video.id}-${i}`}>
                  <Link
                    href={`/video/${video.id}`}
                    className="flex items-center gap-3 rounded-lg border border-salin-line/60 bg-salin-bg-elevated p-2 opacity-80 transition hover:opacity-100"
                  >
                    <Thumbnail
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-11 w-20 flex-shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm">{video.title}</p>
                      <p className="truncate text-xs text-salin-fg-muted">
                        {video.channel_name}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {history.length === 0 && (
                <li className="text-xs text-salin-fg-muted">
                  Rien d&apos;écouté pour l&apos;instant.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

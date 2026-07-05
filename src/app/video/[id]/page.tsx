import { notFound } from "next/navigation";
import Link from "next/link";
import ScoreBadge from "@/components/ScoreBadge";
import TagList from "@/components/TagList";
import VideoCard from "@/components/VideoCard";
import { getVideoById, listVideos } from "@/lib/db";
import { formatDate, formatDuration, formatViews } from "@/lib/format";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getVideoById(id);
  if (!video) notFound();

  const all = await listVideos();
  const similar = all
    .filter(
      (v) =>
        v.id !== video.id &&
        v.status === "approved" &&
        (v.genre === video.genre || v.mood === video.mood)
    )
    .sort((a, b) => b.discovery_score - a.discovery_score)
    .slice(0, 4);

  const statusLabel: Record<string, string> = {
    approved: "En rotation",
    pending: "En attente de validation",
    rejected: "Refusée",
    unavailable: "Indisponible",
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          {video.embed_allowed ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-salin-line bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-salin-line bg-salin-bg-card text-center text-salin-fg-muted">
              <p>Cette vidéo n&apos;est plus disponible à l&apos;intégration.</p>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="text-salin-red-bright hover:underline"
              >
                La voir directement sur YouTube
              </a>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="font-display text-2xl leading-tight sm:text-3xl">
                {video.title}
              </h1>
              <span className="rounded-full border border-salin-line px-3 py-1 text-xs uppercase tracking-wide text-salin-fg-muted">
                {statusLabel[video.status] ?? video.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-salin-fg-muted">
              <span>{video.channel_name}</span>
              <span>{formatViews(video.view_count)} vues</span>
              <span>{formatViews(video.like_count)} likes</span>
              <span>{formatDuration(video.duration_seconds)}</span>
              <span>Publiée le {formatDate(video.published_at)}</span>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="text-salin-red-bright hover:underline"
              >
                Voir sur YouTube
              </a>
            </div>

            <p className="text-sm text-salin-fg-muted">{video.description}</p>

            <TagList tags={video.tags} />

            <div className="rounded-xl border border-salin-line bg-salin-bg-card p-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-salin-fg-muted">
                Résumé IA
              </h2>
              <p className="text-sm">{video.ai_summary}</p>
            </div>

            <div className="rounded-xl border border-salin-red/40 bg-salin-red/5 p-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-salin-fg-muted">
                Pourquoi cette vidéo a été sélectionnée
              </h2>
              <p className="text-sm">{video.ai_reason}</p>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-salin-fg-muted">
                Score détaillé
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ScoreBadge type="rarity" value={video.rarity_score} />
                <ScoreBadge type="quality" value={video.quality_score} />
                <ScoreBadge type="discovery" value={video.discovery_score} />
                <ScoreBadge type="sample" value={video.sample_score} />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-salin-line bg-salin-bg-card p-5 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-salin-fg-muted">Ambiance</dt>
                <dd>{video.mood}</dd>
              </div>
              <div>
                <dt className="text-xs text-salin-fg-muted">Genre</dt>
                <dd>{video.genre}</dd>
              </div>
              <div>
                <dt className="text-xs text-salin-fg-muted">Pays / zone</dt>
                <dd>{video.country}</dd>
              </div>
              <div>
                <dt className="text-xs text-salin-fg-muted">Décennie</dt>
                <dd>{video.decade}</dd>
              </div>
            </dl>

            <Link
              href="/radio"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-salin-red px-6 py-3 text-sm font-semibold uppercase tracking-wide transition hover:bg-salin-red-bright"
            >
              Retour à la radio en direct
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-salin-fg-muted">
            Vidéos similaires
          </h2>
          <div className="grid gap-4">
            {similar.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
            {similar.length === 0 && (
              <p className="text-xs text-salin-fg-muted">
                Aucune vidéo similaire pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

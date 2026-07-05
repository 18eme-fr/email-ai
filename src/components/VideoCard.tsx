import Link from "next/link";
import type { Video } from "@/types";
import { formatDuration, formatViews } from "@/lib/format";
import Thumbnail from "@/components/Thumbnail";

export default function VideoCard({ video }: { video: Video }) {
  return (
    <Link
      href={`/video/${video.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-salin-line bg-salin-bg-card transition hover:border-salin-red-bright/60"
    >
      <div className="relative aspect-video overflow-hidden bg-salin-bg-elevated">
        <Thumbnail
          src={video.thumbnail_url}
          alt={video.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs">
          {formatDuration(video.duration_seconds)}
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-salin-red/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
          Rareté {video.rarity_score}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-base leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-salin-fg-muted">{video.channel_name}</p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-salin-fg-muted">
          <span>{formatViews(video.view_count)} vues</span>
          <span>{video.mood}</span>
        </div>
      </div>
    </Link>
  );
}

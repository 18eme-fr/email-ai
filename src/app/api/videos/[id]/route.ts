import { NextResponse } from "next/server";
import { getVideoById, listVideos } from "@/lib/db";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideoById(id);
  if (!video) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  const all = await listVideos();
  const similar = all
    .filter(
      (v) =>
        v.id !== video.id &&
        v.status === "approved" &&
        (v.genre === video.genre || v.mood === video.mood)
    )
    .sort((a, b) => b.discovery_score - a.discovery_score)
    .slice(0, 6);

  return NextResponse.json({ video, similar });
}

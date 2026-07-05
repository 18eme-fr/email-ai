import { NextRequest, NextResponse } from "next/server";
import { listVideos } from "@/lib/db";
import type { VideoFilters } from "@/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const filters: VideoFilters = {
    q: params.get("q") ?? undefined,
    genre: params.get("genre") ?? undefined,
    country: params.get("country") ?? undefined,
    decade: params.get("decade") ?? undefined,
    mood: params.get("mood") ?? undefined,
    max_views: params.has("max_views")
      ? Number(params.get("max_views"))
      : undefined,
    min_rarity: params.has("min_rarity")
      ? Number(params.get("min_rarity"))
      : undefined,
    sort: (params.get("sort") as VideoFilters["sort"]) ?? undefined,
  };

  const videos = await listVideos(filters);
  const approvedOnly = videos.filter((v) => v.status === "approved");

  return NextResponse.json({ videos: approvedOnly });
}

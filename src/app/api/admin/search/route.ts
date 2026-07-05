import { NextRequest, NextResponse } from "next/server";
import { searchYoutube } from "@/lib/youtube";
import { analyzeVideo } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = body?.query as string | undefined;

  if (!query) {
    return NextResponse.json({ error: "query est requis" }, { status: 400 });
  }

  const candidates = await searchYoutube({
    query,
    maxViews: body?.max_views,
    minDurationSeconds: body?.min_duration_seconds,
    maxDurationSeconds: body?.max_duration_seconds,
    publishedAfter: body?.published_after,
    publishedBefore: body?.published_before,
    language: body?.language,
    regionCode: body?.region_code,
    categoryId: body?.category_id,
  });

  const results = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      analysis: await analyzeVideo(candidate),
    }))
  );

  return NextResponse.json({ results });
}

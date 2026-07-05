import { NextRequest, NextResponse } from "next/server";
import { getVideoById, updateVideo } from "@/lib/db";
import type { Video } from "@/types";

const EDITABLE_FIELDS: (keyof Video)[] = [
  "status",
  "tags",
  "mood",
  "genre",
  "country",
  "decade",
  "rarity_score",
  "quality_score",
  "discovery_score",
  "sample_score",
  "ai_summary",
  "ai_reason",
];

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const video = await getVideoById(id);
  if (!video) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }
  return NextResponse.json({ video });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const patch: Partial<Video> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (patch as any)[field] = body[field];
    }
  }

  const video = await updateVideo(id, patch);
  if (!video) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }
  return NextResponse.json({ video });
}

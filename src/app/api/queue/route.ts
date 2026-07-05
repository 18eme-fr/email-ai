import { NextRequest, NextResponse } from "next/server";
import { getVideosByStatus } from "@/lib/db";
import { pickNextVideos, getCurrentSlot } from "@/lib/scheduler";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const historyIds = (params.get("history") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const historyChannels = (params.get("history_channels") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const count = Math.min(20, Math.max(1, Number(params.get("count") ?? 5)));

  const approved = await getVideosByStatus("approved");
  const next = pickNextVideos(approved, historyIds, historyChannels, count);
  const slot = getCurrentSlot();

  return NextResponse.json({
    videos: next,
    slot: { name: slot.name, description: slot.description },
  });
}

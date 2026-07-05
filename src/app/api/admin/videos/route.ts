import { NextRequest, NextResponse } from "next/server";
import { createVideo, listVideos } from "@/lib/db";
import { analyzeVideo } from "@/lib/ai";
import { extractYoutubeId, fetchVideoMetadata } from "@/lib/youtube";
import type { AiAnalysis, AiDecision, VideoStatus, YoutubeCandidate } from "@/types";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") as
    | VideoStatus
    | null;
  const videos = await listVideos();
  const filtered = status ? videos.filter((v) => v.status === status) : videos;
  return NextResponse.json({ videos: filtered });
}

function decisionToStatus(decision: AiDecision): VideoStatus {
  if (decision === "accept") return "approved";
  if (decision === "reject") return "rejected";
  return "pending";
}

function buildVideoFromCandidate(
  candidate: YoutubeCandidate,
  analysis: AiAnalysis,
  statusOverride?: VideoStatus
) {
  return {
    youtube_video_id: candidate.youtube_video_id,
    title: candidate.title,
    channel_name: candidate.channel_name,
    channel_id: candidate.channel_id,
    description: candidate.description,
    thumbnail_url: candidate.thumbnail_url,
    duration_seconds: candidate.duration_seconds,
    view_count: candidate.view_count,
    like_count: candidate.like_count,
    published_at: candidate.published_at,
    youtube_url: `https://www.youtube.com/watch?v=${candidate.youtube_video_id}`,
    embed_allowed: candidate.embed_allowed,
    status: statusOverride ?? decisionToStatus(analysis.decision),
    rarity_score: analysis.rarity_score,
    quality_score: analysis.quality_score,
    discovery_score: analysis.discovery_score,
    sample_score: analysis.sample_score,
    ai_summary: analysis.summary,
    ai_reason: analysis.reason,
    mood: analysis.mood,
    genre: analysis.genre,
    country: analysis.country,
    decade: analysis.decade,
    tags: analysis.tags,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.mode) {
    return NextResponse.json({ error: "mode est requis" }, { status: 400 });
  }

  if (body.mode === "from_analysis") {
    const candidate = body.candidate as YoutubeCandidate;
    const analysis = body.analysis as AiAnalysis;
    if (!candidate || !analysis) {
      return NextResponse.json(
        { error: "candidate et analysis sont requis" },
        { status: 400 }
      );
    }
    const video = await createVideo(
      buildVideoFromCandidate(candidate, analysis, body.status_override)
    );
    return NextResponse.json({ video });
  }

  if (body.mode === "manual") {
    const rawUrl = body.youtube_url as string | undefined;
    if (!rawUrl) {
      return NextResponse.json(
        { error: "youtube_url est requis" },
        { status: 400 }
      );
    }
    const youtubeId = extractYoutubeId(rawUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "URL YouTube invalide" },
        { status: 400 }
      );
    }
    const candidate = await fetchVideoMetadata(youtubeId);
    if (!candidate) {
      return NextResponse.json(
        { error: "Impossible de récupérer les métadonnées de cette vidéo" },
        { status: 404 }
      );
    }
    const analysis = await analyzeVideo(candidate);
    const video = await createVideo(
      buildVideoFromCandidate(candidate, analysis, "approved")
    );
    return NextResponse.json({ video });
  }

  return NextResponse.json({ error: "mode inconnu" }, { status: 400 });
}

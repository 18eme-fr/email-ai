import { NextRequest, NextResponse } from "next/server";
import { addFeedback } from "@/lib/db";
import type { FeedbackAction } from "@/types";

const VALID_ACTIONS: FeedbackAction[] = ["like", "skip", "report"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const videoId = body?.video_id;
  const action = body?.action as FeedbackAction | undefined;

  if (!videoId || !action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "video_id et action ('like' | 'skip' | 'report') sont requis" },
      { status: 400 }
    );
  }

  const entry = await addFeedback(videoId, action);
  return NextResponse.json({ feedback: entry });
}

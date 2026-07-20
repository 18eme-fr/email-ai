import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runUserAutomations, checkLinks } from "@/lib/automations";

// Endpoint de tâches planifiées.
// À appeler par un planificateur (Vercel Cron, GitHub Actions, cron système…)
// avec l'en-tête : Authorization: Bearer <CRON_SECRET>
// Exemple : 0 7 * * *  curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron?monthly=1
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const monthly = req.nextUrl.searchParams.get("monthly") === "1";
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await runUserAutomations(u.id, { monthlyReport: monthly });
  }

  let links = { checked: 0, broken: 0 };
  if (req.nextUrl.searchParams.get("links") === "1") {
    links = await checkLinks();
  }

  return NextResponse.json({ ok: true, users: users.length, links, monthly });
}

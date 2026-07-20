"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJson, toJson } from "@/lib/json";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function setCourseStatus(courseKey: string, status: string): Promise<void> {
  const user = await requireUser();
  await prisma.courseProgress.upsert({
    where: { userId_courseKey: { userId: user.id, courseKey } },
    create: { userId: user.id, courseKey, status, badgeEarned: status === "done" },
    update: { status, badgeEarned: status === "done" },
  });
  revalidatePath("/skills");
  revalidatePath("/dashboard");
}

export async function addCourseTime(courseKey: string, minutes: number): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.courseProgress.findUnique({ where: { userId_courseKey: { userId: user.id, courseKey } } });
  await prisma.courseProgress.upsert({
    where: { userId_courseKey: { userId: user.id, courseKey } },
    create: { userId: user.id, courseKey, status: "in_progress", timeSpentMin: minutes },
    update: { timeSpentMin: (existing?.timeSpentMin || 0) + minutes, status: existing?.status === "done" ? "done" : "in_progress" },
  });
  revalidatePath("/skills");
}

// Test de positionnement -> met à jour l'auto-évaluation (alimente les sous-scores).
export async function savePositioning(formData: FormData): Promise<void> {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const current = parseJson<Record<string, number>>(profile?.selfAssess, {});
  for (const key of ["finance", "admin", "law", "liveArts", "production", "hr", "policy"]) {
    const v = formData.get(key);
    if (v !== null) current[key] = Math.max(0, Math.min(100, Number(v)));
  }
  await prisma.profile.update({ where: { userId: user.id }, data: { selfAssess: toJson(current) } });
  revalidatePath("/skills");
  revalidatePath("/dashboard");
}

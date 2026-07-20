"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJson, toJson } from "@/lib/json";
import { gapAnalysis } from "@/lib/ai";
import { MASTER_TEMPLATES } from "@/lib/reference";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

async function buildGapForUser(userId: string, selectivity?: string | null) {
  const [profile, projects, portfolio] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.project.count({ where: { userId } }),
    prisma.portfolioItem.count({ where: { userId } }),
  ]);
  const experiences = parseJson<{ kind?: string; months?: number; admin?: boolean }[]>(profile?.experiences, []);
  const selfAssess = parseJson<Record<string, number>>(profile?.selfAssess, {});
  const cultureMonths = experiences.filter((e) => (e.kind || "").includes("cult") || (e.kind || "").includes("spect")).reduce((s, e) => s + (e.months || 0), 0);
  const adminMonths = experiences.filter((e) => e.admin).reduce((s, e) => s + (e.months || 0), 0);
  return gapAnalysis({
    cultureMonths,
    adminMonths,
    hasProject: projects > 0,
    hasPortfolio: portfolio > 0,
    financeScore: selfAssess.finance ?? 0,
    lawScore: selfAssess.law ?? 0,
    selectivity,
  });
}

export async function addMasterFromTemplate(index: number): Promise<void> {
  const user = await requireUser();
  const m = MASTER_TEMPLATES[index];
  if (!m) return;
  const gap = await buildGapForUser(user.id, m.selectivity);
  await prisma.application.create({
    data: {
      userId: user.id,
      university: m.university,
      city: m.city,
      programName: m.programName,
      selectivity: m.selectivity,
      hasAlternance: m.hasAlternance,
      hasInternship: m.hasInternship,
      officialLink: m.officialLink,
      skillsRequired: toJson(m.skillsRequired),
      requiredDocuments: toJson(m.requiredDocuments),
      keyDates: m.keyDates,
      status: "to_study",
      gap: toJson(gap),
    },
  });
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}

export async function addCustomMaster(formData: FormData): Promise<void> {
  const user = await requireUser();
  const selectivity = (formData.get("selectivity") as string) || "moyenne";
  const gap = await buildGapForUser(user.id, selectivity);
  await prisma.application.create({
    data: {
      userId: user.id,
      university: (formData.get("university") as string) || "Université",
      city: (formData.get("city") as string) || null,
      programName: (formData.get("programName") as string) || "Master",
      selectivity,
      hasAlternance: formData.get("hasAlternance") === "on",
      hasInternship: formData.get("hasInternship") === "on",
      officialLink: (formData.get("officialLink") as string) || null,
      keyDates: (formData.get("keyDates") as string) || null,
      status: "to_study",
      gap: toJson(gap),
    },
  });
  revalidatePath("/applications");
}

export async function updateApplication(id: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const data: Record<string, string | number | null> = {};
  const status = formData.get("status");
  if (status) data.status = status as string;
  const priority = formData.get("priority");
  if (priority) data.priority = Number(priority);
  for (const k of ["note", "contactName", "keyDates"]) {
    const v = formData.get(k);
    if (v !== null) data[k] = (v as string) || null;
  }
  await prisma.application.updateMany({ where: { id, userId: user.id }, data });
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}

export async function regenerateGap(id: string): Promise<void> {
  const user = await requireUser();
  const app = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!app) return;
  const gap = await buildGapForUser(user.id, app.selectivity);
  await prisma.application.update({ where: { id }, data: { gap: toJson(gap) } });
  revalidatePath("/applications");
}

export async function deleteApplication(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.application.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/applications");
}

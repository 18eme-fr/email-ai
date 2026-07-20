"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toJson } from "@/lib/json";
import { VENUE_STUDY_FIELDS } from "@/lib/reference";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function addPortfolioItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  await prisma.portfolioItem.create({
    data: {
      userId: user.id,
      kind: (formData.get("kind") as string) || "experience",
      section: (formData.get("section") as string) || "Expériences",
      title: (formData.get("title") as string) || "Élément",
      content: (formData.get("content") as string) || null,
      status: (formData.get("status") as string) || "en cours",
      evidence: (formData.get("evidence") as string) || null,
    },
  });
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.portfolioItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/portfolio");
}

export async function updatePortfolioItem(id: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  await prisma.portfolioItem.updateMany({
    where: { id, userId: user.id },
    data: {
      title: (formData.get("title") as string) || undefined,
      content: (formData.get("content") as string) ?? undefined,
      status: (formData.get("status") as string) || undefined,
      evidence: (formData.get("evidence") as string) ?? undefined,
    },
  });
  revalidatePath("/portfolio");
}

// Étude d'une salle réelle — enregistre les champs structurés.
export async function saveVenueStudy(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = (formData.get("venueName") as string) || "Salle";
  const data: Record<string, string> = {};
  for (const f of VENUE_STUDY_FIELDS) {
    const v = formData.get(f);
    if (v) data[f] = v as string;
  }
  const source = (formData.get("source") as string) || "";
  await prisma.portfolioItem.create({
    data: {
      userId: user.id,
      kind: "venue_study",
      section: "Analyses de structures",
      title: `Étude de salle : ${name}`,
      content: source ? `Sources : ${source}` : "Analyse d'une salle réelle.",
      status: "acquis",
      data: toJson(data),
    },
  });
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
}

"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toJson } from "@/lib/json";
import { reformulateExperience } from "@/lib/ai";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function generateReformulation(formData: FormData): Promise<void> {
  const user = await requireUser();
  const input = ((formData.get("experience") as string) || "").trim();
  if (!input) return;
  const nature = ((formData.get("nature") as string) || "exercée") as "exercée" | "observée";
  const r = reformulateExperience(input, nature);
  await prisma.psychEntry.create({
    data: {
      userId: user.id,
      inputExperience: input,
      nature,
      transferableSkills: toJson(r.transferableSkills),
      culturalSkills: toJson(r.culturalSkills),
      cvPhrase: r.cvPhrase,
      letterPhrase: r.letterPhrase,
      interviewPhrase: r.interviewPhrase,
      limits: r.limits.join(" • "),
      evidenceNeeded: r.evidenceNeeded.join(" • "),
    },
  });
  revalidatePath("/psychology");
}

export async function deletePsychEntry(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.psychEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/psychology");
}

// Ajoute une compétence culturelle reformulée au portfolio (comme preuve/objectif).
export async function pushReformulationToPortfolio(id: string): Promise<void> {
  const user = await requireUser();
  const e = await prisma.psychEntry.findFirst({ where: { id, userId: user.id } });
  if (!e) return;
  await prisma.portfolioItem.create({
    data: {
      userId: user.id,
      kind: "skill",
      section: "Compétences",
      title: `Compétences issues de : ${e.inputExperience}`,
      content: e.cvPhrase,
      status: e.nature === "exercée" ? "acquis" : "en cours",
      data: toJson({ from: "psychology", nature: e.nature }),
    },
  });
  revalidatePath("/portfolio");
}

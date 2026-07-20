"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseJson, toJson } from "@/lib/json";
import { PROJECT_STEPS } from "@/lib/reference";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}
async function ownProject(id: string, userId: string) {
  const p = await prisma.project.findFirst({ where: { id, userId } });
  if (!p) throw new Error("Projet introuvable");
  return p;
}

export async function createProject(formData: FormData): Promise<void> {
  const user = await requireUser();
  const steps: Record<string, { done: boolean }> = {};
  PROJECT_STEPS.forEach((s) => (steps[s.key] = { done: false }));
  await prisma.project.create({
    data: {
      userId: user.id,
      title: (formData.get("title") as string) || "Nouveau projet",
      type: (formData.get("type") as string) || "concert",
      concept: (formData.get("concept") as string) || "",
      steps: toJson(steps),
      status: "active",
    },
  });
  revalidatePath("/project");
}

export async function toggleStep(projectId: string, stepKey: string): Promise<void> {
  const user = await requireUser();
  const p = await ownProject(projectId, user.id);
  const steps = parseJson<Record<string, { done?: boolean; notes?: string }>>(p.steps, {});
  steps[stepKey] = { ...(steps[stepKey] || {}), done: !steps[stepKey]?.done };
  await prisma.project.update({ where: { id: projectId }, data: { steps: toJson(steps) } });
  revalidatePath("/project");
  revalidatePath("/dashboard");
}

export async function saveStepNotes(projectId: string, stepKey: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const p = await ownProject(projectId, user.id);
  const steps = parseJson<Record<string, { done?: boolean; notes?: string }>>(p.steps, {});
  steps[stepKey] = { ...(steps[stepKey] || {}), notes: (formData.get("notes") as string) || "" };
  await prisma.project.update({ where: { id: projectId }, data: { steps: toJson(steps) } });
  revalidatePath("/project");
}

export async function updateProjectMeta(projectId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  await ownProject(projectId, user.id);
  await prisma.project.update({
    where: { id: projectId },
    data: {
      title: (formData.get("title") as string) || undefined,
      concept: (formData.get("concept") as string) ?? undefined,
      status: (formData.get("status") as string) || undefined,
    },
  });
  revalidatePath("/project");
}

export async function addBudgetLine(projectId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  await ownProject(projectId, user.id);
  await prisma.budgetLine.create({
    data: {
      projectId,
      kind: (formData.get("kind") as string) || "expense",
      category: (formData.get("category") as string) || "Divers",
      label: (formData.get("label") as string) || null,
      amount: parseFloat((formData.get("amount") as string) || "0") || 0,
    },
  });
  revalidatePath("/project");
  revalidatePath("/dashboard");
}

export async function deleteBudgetLine(projectId: string, id: string): Promise<void> {
  const user = await requireUser();
  await ownProject(projectId, user.id);
  await prisma.budgetLine.deleteMany({ where: { id, projectId } });
  revalidatePath("/project");
}

export async function addTask(projectId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  await ownProject(projectId, user.id);
  await prisma.task.create({
    data: {
      projectId,
      title: (formData.get("title") as string) || "Tâche",
      phase: (formData.get("phase") as string) || "Préparation",
      owner: (formData.get("owner") as string) || null,
      dueDate: (formData.get("dueDate") as string) || null,
    },
  });
  revalidatePath("/project");
}

export async function toggleTask(projectId: string, id: string): Promise<void> {
  const user = await requireUser();
  await ownProject(projectId, user.id);
  const t = await prisma.task.findUnique({ where: { id } });
  if (t) await prisma.task.update({ where: { id }, data: { done: !t.done } });
  revalidatePath("/project");
}

export async function deleteTask(projectId: string, id: string): Promise<void> {
  const user = await requireUser();
  await ownProject(projectId, user.id);
  await prisma.task.deleteMany({ where: { id, projectId } });
  revalidatePath("/project");
}

// Mode portfolio : génère une fiche projet dans le portfolio.
export async function generateProjectPortfolio(projectId: string): Promise<void> {
  const user = await requireUser();
  const p = await ownProject(projectId, user.id);
  const lines = await prisma.budgetLine.findMany({ where: { projectId } });
  const income = lines.filter((l) => l.kind === "income").reduce((s, l) => s + l.amount, 0);
  const expense = lines.filter((l) => l.kind === "expense").reduce((s, l) => s + l.amount, 0);
  const steps = parseJson<Record<string, { done?: boolean }>>(p.steps, {});
  const done = PROJECT_STEPS.filter((s) => steps[s.key]?.done).length;

  const content = [
    `Contexte : ${p.concept || "—"}`,
    `Type : ${p.type}`,
    `Budget prévisionnel : ${expense.toFixed(0)} € de dépenses / ${income.toFixed(0)} € de recettes (résultat ${(income - expense).toFixed(0)} €).`,
    `Avancement : ${done}/${PROJECT_STEPS.length} étapes réalisées.`,
    `Compétences acquises : gestion budgétaire, production, coordination, communication.`,
  ].join("\n");

  await prisma.portfolioItem.create({
    data: {
      userId: user.id,
      kind: "project",
      section: "Projets réalisés",
      title: `Projet : ${p.title}`,
      content,
      status: p.status === "done" ? "acquis" : "en cours",
      data: toJson({ projectId, income, expense, done, total: PROJECT_STEPS.length }),
    },
  });
  revalidatePath("/portfolio");
  revalidatePath("/project");
}

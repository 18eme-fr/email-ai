"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { runUserAutomations } from "@/lib/automations";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function markRead(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  revalidatePath("/dashboard");
}

export async function markAllRead(): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/dashboard");
}

// Centre d'automatisations — exécution manuelle (bouton) ou planifiée (cron API).
export async function runAutomations(): Promise<void> {
  const user = await requireUser();
  await runUserAutomations(user.id, { monthlyReport: true });
  revalidatePath("/dashboard");
}

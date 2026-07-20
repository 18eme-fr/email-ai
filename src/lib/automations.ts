import "server-only";
import { prisma } from "./db";
import { getDashboardData } from "./metrics";

// Logique d'automatisation réutilisable (appelée par l'action manuelle ET le cron).
export async function runUserAutomations(userId: string, opts: { monthlyReport?: boolean } = {}): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Offres sauvegardées expirées -> rétrogradées.
  const saved = await prisma.savedOpportunity.findMany({ where: { userId }, include: { opportunity: true } });
  for (const s of saved) {
    if (s.opportunity.deadline && s.opportunity.deadline < today && s.status === "saved") {
      await prisma.savedOpportunity.update({
        where: { id: s.id },
        data: { status: "rejected", note: (s.note || "") + " [expirée — auto]" },
      });
    }
  }

  // 2. Relances proches (< 21 jours).
  const soon = new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  for (const u of saved) {
    if (u.followUpDate && u.followUpDate >= today && u.followUpDate <= soon) {
      await prisma.notification.create({
        data: { userId, type: "followup", title: `Relance à prévoir : ${u.opportunity.structureName}`, body: `Prévue le ${u.followUpDate}`, link: "/opportunities" },
      });
    }
  }

  // 3. Action hebdomadaire + éventuel bilan mensuel.
  const dash = await getDashboardData(userId);
  if (dash.priorities[0]) {
    await prisma.notification.create({
      data: { userId, type: "action", title: "Action prioritaire de la semaine", body: dash.priorities[0].title, link: "/dashboard" },
    });
  }
  if (opts.monthlyReport) {
    await prisma.notification.create({
      data: { userId, type: "report", title: "Bilan mensuel", body: `Score de préparation : ${dash.global}/100 — ${dash.band.label}.`, link: "/dashboard" },
    });
  }
}

// Vérification des liens (formations & offres). Marque les liens injoignables.
// Respecte un timeout court ; n'échoue jamais globalement.
export async function checkLinks(): Promise<{ checked: number; broken: number }> {
  const opps = await prisma.opportunity.findMany({ where: { officialLink: { not: null } }, take: 50 });
  let broken = 0;
  for (const o of opps) {
    if (!o.officialLink) continue;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(o.officialLink, { method: "HEAD", signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok && res.status >= 400) {
        broken++;
        await prisma.opportunity.update({ where: { id: o.id }, data: { reliability: "à vérifier" } });
      }
    } catch {
      broken++;
    }
  }
  return { checked: opps.length, broken };
}

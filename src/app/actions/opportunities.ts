"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toJson } from "@/lib/json";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function saveOpportunity(opportunityId: string): Promise<void> {
  const user = await requireUser();
  await prisma.savedOpportunity.upsert({
    where: { userId_opportunityId: { userId: user.id, opportunityId } },
    create: { userId: user.id, opportunityId, status: "saved" },
    update: {},
  });
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
}

export async function unsaveOpportunity(opportunityId: string): Promise<void> {
  const user = await requireUser();
  await prisma.savedOpportunity.deleteMany({ where: { userId: user.id, opportunityId } });
  revalidatePath("/opportunities");
}

export async function updateSaved(id: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const data: Record<string, string | null> = {};
  for (const key of ["status", "category", "note", "appliedAt", "responseStatus", "followUpDate", "contactName", "contactEmail"]) {
    const v = formData.get(key);
    if (v !== null) data[key] = (v as string) || null;
  }
  await prisma.savedOpportunity.updateMany({ where: { id, userId: user.id }, data });
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
}

export async function addManualOpportunity(formData: FormData): Promise<void> {
  const user = await requireUser();
  const get = (k: string) => (formData.get(k) as string) || "";
  const opp = await prisma.opportunity.create({
    data: {
      ownerId: user.id,
      isDemo: false,
      structureName: get("structureName") || "Structure",
      country: get("country") || "France",
      city: get("city"),
      structureType: get("structureType") || "Association culturelle",
      missionTitle: get("missionTitle") || "Mission",
      duration: get("duration"),
      startDate: get("startDate"),
      deadline: get("deadline"),
      contractType: get("contractType"),
      compensation: get("compensation"),
      experienceLevel: get("experienceLevel") || "Débutant accepté",
      languagesRequired: toJson(get("languagesRequired").split(",").map((s) => s.trim()).filter(Boolean)),
      adminTasks: toJson(get("adminTasks").split(",").map((s) => s.trim()).filter(Boolean)),
      officialLink: get("officialLink"),
      source: "Ajout manuel",
      reliability: "à vérifier",
      eligibleFrench: true,
      lastChecked: new Date().toISOString().slice(0, 10),
    },
  });
  await prisma.savedOpportunity.create({ data: { userId: user.id, opportunityId: opp.id, status: "saved" } });
  revalidatePath("/opportunities");
}

// Import CSV : structureName,country,city,structureType,missionTitle,duration,deadline,contractType,compensation,officialLink
export async function importOpportunitiesCsv(formData: FormData): Promise<void> {
  const user = await requireUser();
  const raw = (formData.get("csv") as string) || "";
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return;
  const header = lines[0].toLowerCase().includes("structurename");
  const rows = header ? lines.slice(1) : lines;
  for (const row of rows) {
    const c = splitCsv(row);
    if (c.length < 2) continue;
    const opp = await prisma.opportunity.create({
      data: {
        ownerId: user.id,
        isDemo: false,
        structureName: c[0] || "Structure",
        country: c[1] || "France",
        city: c[2] || null,
        structureType: c[3] || "Association culturelle",
        missionTitle: c[4] || "Mission",
        duration: c[5] || null,
        deadline: c[6] || null,
        contractType: c[7] || null,
        compensation: c[8] || null,
        officialLink: c[9] || null,
        source: "Import CSV",
        reliability: "à vérifier",
        eligibleFrench: true,
        lastChecked: new Date().toISOString().slice(0, 10),
      },
    });
    await prisma.savedOpportunity.create({ data: { userId: user.id, opportunityId: opp.id, status: "saved" } }).catch(() => {});
  }
  revalidatePath("/opportunities");
}

export async function createSearchQuery(formData: FormData): Promise<void> {
  const user = await requireUser();
  await prisma.searchQuery.create({
    data: {
      userId: user.id,
      name: (formData.get("name") as string) || "Nouvelle recherche",
      keywords: (formData.get("keywords") as string) || "",
      frequency: ((formData.get("frequency") as string) || "weekly") as string,
      countries: toJson(((formData.get("countries") as string) || "").split(",").map((s) => s.trim()).filter(Boolean)),
      structureTypes: toJson([]),
      contractTypes: toJson([]),
    },
  });
  revalidatePath("/opportunities");
}

export async function deleteSearchQuery(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.searchQuery.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/opportunities");
}

export async function addSource(formData: FormData): Promise<void> {
  const user = await requireUser();
  await prisma.source.create({
    data: {
      userId: user.id,
      name: (formData.get("name") as string) || "Source",
      url: (formData.get("url") as string) || null,
      type: ((formData.get("type") as string) || "site") as string,
      status: "pending",
      note: (formData.get("note") as string) || null,
    },
  });
  revalidatePath("/opportunities");
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

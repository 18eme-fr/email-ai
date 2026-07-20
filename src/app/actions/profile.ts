"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { parseJson, toJson } from "@/lib/json";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

function linesToPairs(raw: string, sep = " - "): { name: string; level: string }[] {
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name, level] = l.split(sep);
    return { name: (name || l).trim(), level: (level || "").trim() };
  });
}
function csv(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const str = (k: string) => (formData.get(k) as string) ?? "";
  const num = (k: string) => {
    const v = formData.get(k);
    return v ? Number(v) : null;
  };

  const languages = str("languages").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label, level] = l.split(" - ");
    return { label: (label || l).trim(), level: (level || "").trim() };
  });
  const degrees = str("degrees").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*?)(?:\s*\((\d{4})\))?$/);
    return { title: (m?.[1] || l).trim(), year: m?.[2] ? Number(m[2]) : undefined };
  });

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      fullName: str("fullName") || null,
      nationality: str("nationality") || null,
      age: num("age"),
      countryResidence: str("countryResidence") || null,
      mobility: str("mobility") || null,
      durationWish: str("durationWish") || null,
      availability: str("availability") || null,
      minSalary: num("minSalary"),
      budget: num("budget"),
      drivingLicense: formData.get("drivingLicense") === "on",
      wantsHousing: formData.get("wantsHousing") === "on",
      professionalProject: str("professionalProject") || null,
      languages: toJson(languages),
      degrees: toJson(degrees),
      skills: toJson(linesToPairs(str("skills"))),
      preferredCountries: toJson(csv(str("preferredCountries"))),
      excludedCountries: toJson(csv(str("excludedCountries"))),
      acceptedContracts: toJson(csv(str("acceptedContracts"))),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/opportunities");
}

export async function addExperience(formData: FormData): Promise<void> {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const experiences = parseJson<any[]>(profile?.experiences, []);
  experiences.push({
    title: (formData.get("title") as string) || "Expérience",
    org: (formData.get("org") as string) || "",
    kind: (formData.get("kind") as string) || "autre",
    nature: (formData.get("nature") as string) || "exercée",
    months: Number(formData.get("months") || 0),
    admin: formData.get("admin") === "on",
    description: (formData.get("description") as string) || "",
  });
  await prisma.profile.update({ where: { userId: user.id }, data: { experiences: toJson(experiences) } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function removeExperience(index: number): Promise<void> {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const experiences = parseJson<any[]>(profile?.experiences, []);
  experiences.splice(index, 1);
  await prisma.profile.update({ where: { userId: user.id }, data: { experiences: toJson(experiences) } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

// RGPD — suppression complète du compte et des données (cascade).
export async function deleteAccount(): Promise<void> {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/register");
}

"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleTheme(): Promise<void> {
  const current = cookies().get("bp_theme")?.value === "light" ? "light" : "dark";
  const next = current === "light" ? "dark" : "light";
  cookies().set("bp_theme", next, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

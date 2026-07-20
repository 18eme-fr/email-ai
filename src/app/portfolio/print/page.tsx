import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";
import { getDashboardData } from "@/lib/metrics";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Portfolio — Backstage Path" };

export default async function PortfolioPrint({ searchParams }: { searchParams: { mode?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const short = searchParams.mode === "short";

  const [profile, items, dash] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.portfolioItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    getDashboardData(user.id),
  ]);

  const degrees = parseJson<{ title?: string; year?: number }[]>(profile?.degrees, []);
  const experiences = parseJson<{ title?: string; org?: string; months?: number; nature?: string }[]>(profile?.experiences, []);
  const skills = parseJson<{ name: string; level: string }[]>(profile?.skills, []);
  const shown = short ? items.filter((i) => i.status === "acquis").slice(0, 8) : items;

  return (
    <main className="mx-auto max-w-3xl p-8 bg-white text-black min-h-screen" style={{ color: "#111", background: "#fff" }}>
      <div className="no-print flex justify-between items-center mb-6">
        <a href="/portfolio" className="text-sm text-blue-700">← Retour</a>
        <PrintButton />
      </div>

      <header className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          {profile?.fullName || "Portfolio professionnel"}
        </h1>
        <p className="text-gray-600 mt-1">Vers l'administration du spectacle vivant · {short ? "Version courte" : "Version complète"}</p>
        <p className="text-sm text-gray-500 mt-1">{user.email} · {profile?.countryResidence || "France"}</p>
      </header>

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>Projet professionnel</h2>
        <p className="text-sm">{profile?.professionalProject || "—"}</p>
        <p className="text-sm text-gray-600 mt-2">
          Score de préparation : <strong>{dash.global}/100</strong> — {dash.band.label}.
        </p>
      </section>

      {degrees.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>Parcours</h2>
          <ul className="text-sm space-y-1">
            {degrees.map((d, i) => <li key={i}>• {d.title}{d.year ? ` (${d.year})` : ""}</li>)}
          </ul>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>Expériences</h2>
          <ul className="text-sm space-y-1">
            {experiences.map((e, i) => (
              <li key={i}>• {e.title}{e.org ? ` — ${e.org}` : ""}{e.months ? ` (${e.months} mois)` : ""} {e.nature === "observée" ? "[observée]" : ""}</li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>Compétences</h2>
          <p className="text-sm">
            {skills.map((s) => `${s.name} (${s.level})`).join(" · ")}
          </p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-lg font-bold border-b border-gray-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>Preuves & réalisations</h2>
        {shown.length === 0 && <p className="text-sm text-gray-500">Aucun élément.</p>}
        <div className="space-y-3">
          {shown.map((it) => {
            const venue = it.kind === "venue_study" ? parseJson<Record<string, string>>(it.data, {}) : {};
            return (
              <div key={it.id} className="break-inside-avoid">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-sm">{it.title}</h3>
                  <span className="text-xs text-gray-500">[{it.status}]</span>
                </div>
                {it.content && <p className="text-sm text-gray-700 whitespace-pre-line">{it.content}</p>}
                {Object.keys(venue).length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {Object.entries(venue).slice(0, short ? 4 : 20).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="text-xs text-gray-400 border-t border-gray-200 pt-3 mt-8">
        Généré par Backstage Path. Les affirmations sont reliées à des preuves ou marquées « objectif ». Aucune expérience inventée.
      </footer>
    </main>
  );
}

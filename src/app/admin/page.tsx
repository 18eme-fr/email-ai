"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSearchPanel from "@/components/admin/AdminSearchPanel";
import AdminManualAdd from "@/components/admin/AdminManualAdd";
import AdminVideoList from "@/components/admin/AdminVideoList";
import { PROGRAMMING_GRID } from "@/lib/scheduler";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Administration</h1>
          <p className="mt-1 text-sm text-salin-fg-muted">
            Recherche, curation IA, modération et programmation de Salin Radio.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-salin-line px-4 py-2 text-xs uppercase tracking-wide text-salin-fg-muted hover:border-salin-red-bright hover:text-salin-fg"
        >
          Se déconnecter
        </button>
      </div>

      <div className="flex flex-col gap-8">
        <AdminSearchPanel onVideoCreated={bump} />
        <AdminManualAdd onVideoCreated={bump} />

        <AdminVideoList
          title="En attente de validation"
          description="Vidéos analysées par l'IA mais pas encore approuvées pour la rotation."
          statuses={["pending"]}
          refreshKey={refreshKey}
          emptyLabel="Aucune vidéo en attente."
        />

        <AdminVideoList
          title="Signalées ou indisponibles"
          description="Vidéos refusées, signalées par des auditeurs ou devenues impossibles à intégrer."
          statuses={["rejected", "unavailable"]}
          refreshKey={refreshKey}
          emptyLabel="Aucune vidéo signalée pour le moment."
        />

        <AdminVideoList
          title="En rotation"
          description="Vidéos actuellement approuvées et diffusées sur la radio."
          statuses={["approved"]}
          refreshKey={refreshKey}
          emptyLabel="Aucune vidéo approuvée pour le moment."
        />

        <section className="rounded-2xl border border-salin-line bg-salin-bg-card p-6">
          <h2 className="font-display text-xl">Programmation</h2>
          <p className="mt-1 text-sm text-salin-fg-muted">
            Grille automatique utilisée par le sélecteur de la radio en direct.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMMING_GRID.map((slot) => (
              <div
                key={slot.name}
                className="rounded-xl border border-salin-line bg-salin-bg-elevated p-4"
              >
                <p className="text-xs uppercase tracking-widest text-salin-fg-muted">
                  {String(slot.startHour).padStart(2, "0")}h–
                  {String(slot.endHour).padStart(2, "0")}h
                </p>
                <p className="mt-1 font-medium">{slot.name}</p>
                <p className="mt-1 text-xs text-salin-fg-muted">{slot.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

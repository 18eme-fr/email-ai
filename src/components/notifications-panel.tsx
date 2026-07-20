"use client";
import { useTransition } from "react";
import { markRead, markAllRead, runAutomations } from "@/app/actions/notifications";

type Notif = { id: string; type: string; title: string; body: string | null; read: boolean; createdAt: string };

export function NotificationsPanel({ notifications }: { notifications: Notif[] }) {
  const [pending, start] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div id="notifications">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm muted">{unread} non lue(s)</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => start(() => runAutomations())}
            disabled={pending}
            className="panel-2 rounded-lg px-3 py-1.5 text-xs hover:border-spot/40 disabled:opacity-60"
            title="Lancer les tâches automatiques (offres expirées, relances, action de la semaine, bilan)"
          >
            {pending ? "…" : "⚙️ Lancer les automatisations"}
          </button>
          <button onClick={() => start(() => markAllRead())} disabled={pending} className="panel-2 rounded-lg px-3 py-1.5 text-xs">
            Tout marquer lu
          </button>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {notifications.length === 0 && <p className="text-sm muted">Aucune notification.</p>}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`panel-2 rounded-lg p-3 flex items-start justify-between gap-2 ${n.read ? "opacity-60" : ""}`}
          >
            <div>
              <div className="text-sm font-medium">{n.title}</div>
              {n.body && <div className="text-xs muted mt-0.5">{n.body}</div>}
            </div>
            {!n.read && (
              <button onClick={() => start(() => markRead(n.id))} className="text-xs text-spot shrink-0">
                marquer lu
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

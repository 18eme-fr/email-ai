import Link from "next/link";
import { toggleTheme } from "@/app/actions/theme";
import { logoutAction } from "@/app/actions/auth";

export function TopBar({
  title,
  subtitle,
  notifications,
  accent = "#e9b949",
}: {
  title: string;
  subtitle?: string;
  notifications?: number;
  accent?: string;
}) {
  return (
    <div className="no-print flex items-center justify-between gap-3 mb-6 flex-wrap">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: accent }}>
          {title}
        </h1>
        {subtitle && <p className="muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard#notifications" className="relative panel-2 rounded-lg px-3 py-2 text-sm">
          🔔
          {notifications ? (
            <span className="absolute -top-1 -right-1 bg-curtain text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {notifications}
            </span>
          ) : null}
        </Link>
        <form action={toggleTheme}>
          <button className="panel-2 rounded-lg px-3 py-2 text-sm" title="Basculer thème clair/sombre">
            🌓
          </button>
        </form>
        <form action={logoutAction}>
          <button className="panel-2 rounded-lg px-3 py-2 text-sm hover:border-curtain/50">Déconnexion</button>
        </form>
      </div>
    </div>
  );
}

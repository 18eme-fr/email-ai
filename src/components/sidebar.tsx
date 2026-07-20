"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord", icon: "🎛️", accent: "#e9b949" },
  { href: "/opportunities", label: "Opportunités", icon: "🌍", accent: "#3a7bd5" },
  { href: "/project", label: "Projet culturel", icon: "🎪", accent: "#2fae8f" },
  { href: "/skills", label: "Formations", icon: "🎓", accent: "#c56cf0" },
  { href: "/portfolio", label: "Portfolio", icon: "📁", accent: "#e8853a" },
  { href: "/psychology", label: "Psychologie → atout", icon: "🧠", accent: "#5b95e0" },
  { href: "/applications", label: "Candidatures", icon: "📮", accent: "#8f1d2d" },
  { href: "/settings", label: "Profil & paramètres", icon: "⚙️", accent: "#9c96b3" },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barre mobile */}
      <div className="lg:hidden flex items-center justify-between panel border-b px-4 py-3 no-print">
        <Link href="/dashboard" className="flex items-center gap-2 font-display font-bold">
          <span>🎭</span> Backstage Path
        </Link>
        <button onClick={() => setOpen((o) => !o)} className="panel-2 rounded-lg px-3 py-1.5 text-sm" aria-label="Menu">
          ☰
        </button>
      </div>

      <aside
        className={`no-print ${open ? "block" : "hidden"} lg:block lg:sticky lg:top-0 lg:h-screen w-full lg:w-64 shrink-0 panel border-r overflow-y-auto`}
      >
        <div className="p-4 hidden lg:block">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <div>
              <div className="font-display font-bold leading-tight">Backstage Path</div>
              <div className="text-[10px] muted leading-tight">Administration du spectacle vivant</div>
            </div>
          </Link>
        </div>
        <nav className="px-2 pb-4 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "panel-2 font-medium" : "hover:panel-2 muted"
                }`}
                style={active ? { borderLeft: `3px solid ${item.accent}` } : { borderLeft: "3px solid transparent" }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t text-xs muted truncate">{email}</div>
      </aside>
    </>
  );
}

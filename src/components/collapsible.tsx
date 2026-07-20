"use client";
import { useState } from "react";

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  sub,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sub?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel rounded-xl">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 p-4 text-left">
        <div>
          <div className="font-semibold">{title}</div>
          {sub && <div className="text-xs muted mt-0.5">{sub}</div>}
        </div>
        <span className="muted">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

import Link from "next/link";

const NAV_LINKS = [
  { href: "/radio", label: "Radio" },
  { href: "/explore", label: "Explorer" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-salin-line/80 bg-salin-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Salin<span className="text-salin-red-bright">Radio</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-salin-fg-muted transition hover:text-salin-fg"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/radio"
            className="rounded-full bg-salin-red px-4 py-2 text-xs font-semibold uppercase tracking-wider text-salin-fg transition hover:bg-salin-red-bright"
          >
            Écouter
          </Link>
        </nav>
      </div>
    </header>
  );
}

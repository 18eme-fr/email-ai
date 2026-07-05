import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-salin-line/80 bg-salin-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-salin-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Salin Radio diffuse exclusivement via le lecteur YouTube officiel. Aucune vidéo
          n&apos;est téléchargée, extraite ou restreamée.
        </p>
        <div className="flex gap-4">
          <Link href="/explore" className="hover:text-salin-fg">
            Explorer
          </Link>
          <Link href="/admin/login" className="hover:text-salin-fg">
            Admin
          </Link>
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-salin-fg"
          >
            YouTube
          </a>
        </div>
      </div>
    </footer>
  );
}

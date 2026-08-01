import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/hooks/use-app-state";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "La Roulette du Savoir",
  description:
    "Apprenez un nouveau thème chaque jour, choisi au hasard : culture générale, institutions, économie, culture, langues et bien plus.",
};

export const viewport: Viewport = {
  themeColor: "#7c4dff",
  width: "device-width",
  initialScale: 1,
};

// Applique le thème avant l'hydratation pour éviter tout clignotement.
const themeScript = `
(function() {
  try {
    var raw = localStorage.getItem('roulette-du-savoir/state');
    var theme = raw ? (JSON.parse(raw).theme || 'light') : 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}

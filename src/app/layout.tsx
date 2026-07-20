import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backstage Path — Administration du spectacle vivant",
  description:
    "Construire son parcours vers l'administration du spectacle vivant : opportunités, projet culturel, formations, portfolio, candidatures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = cookies().get("bp_theme")?.value === "light" ? "light" : "dark";
  return (
    <html lang="fr" data-theme={theme} className={theme === "dark" ? "dark" : ""} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <div className="curtain-top no-print" />
        {children}
      </body>
    </html>
  );
}

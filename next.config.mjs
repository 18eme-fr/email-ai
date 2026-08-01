// Déploiement GitHub Pages : activé uniquement quand PAGES=true (dans le
// workflow). En local, `npm run dev` / `npm run build` gardent leur
// comportement normal (served à la racine, rendu Next classique).
const isPages = process.env.PAGES === "true";
const repo = "email-ai";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        // Export 100 % statique (l'app n'a aucune dépendance serveur).
        output: "export",
        // Le site est servi depuis https://<user>.github.io/email-ai/
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;

// Regénère le bundle autonome (données + algorithme de tirage) utilisé pour la
// version « page unique » de l'application (artifact / export hors-ligne).
//
// Usage :
//   node scripts/build-artifact-bundle.mjs [chemin-de-sortie]
// Sans argument, le bundle est écrit dans scripts/rds-bundle.js.
//
// Le bundle expose `window.RDS = { TOPICS, CATEGORIES, selectTopic, passesFilters }`.
import * as esbuild from "esbuild";
import path from "node:path";

const outfile = path.resolve(process.argv[2] ?? "scripts/rds-bundle.js");

const result = await esbuild.build({
  entryPoints: [path.resolve("scripts/artifact-entry.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2019",
  minify: true,
  legalComments: "none",
  alias: { "@": path.resolve("src") },
  outfile,
});

console.log("bundle written:", outfile, "| errors:", result.errors.length);

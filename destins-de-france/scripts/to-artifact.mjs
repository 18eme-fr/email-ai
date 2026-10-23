// Convertit le build « artifact » (un seul fichier HTML autonome) au format attendu
// par les Artifacts Claude : sans <!doctype>, <html>, <head> ni <body>, avec le
// <title>, les métadonnées et la feuille de style en tête de fichier.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
const keep = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
// Le script module est déplacé après la racine pour s'exécuter une fois le DOM prêt.
const scripts = [...keep.matchAll(/<script[\s\S]*?<\/script>/g)].map((m) => m[0]);
const headWithoutScripts = scripts.reduce((acc, s) => acc.replace(s, ''), keep);
const out = `${headWithoutScripts.trim()}\n${body.trim()}\n${scripts.join('\n')}\n`;
writeFileSync('dist-artifact/destins-de-france.html', out);
console.log(`dist-artifact/destins-de-france.html : ${(out.length / 1024).toFixed(0)} Ko`);

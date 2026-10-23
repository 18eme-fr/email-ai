import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Le mode « artifact » produit un unique fichier HTML autonome (JS et CSS inclus),
// publiable tel quel ; le mode normal produit un site statique classique.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'artifact' ? [react(), viteSingleFile()] : [react()],
  base: './',
  build: { outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
  test: { globals: true, environment: 'node' },
}));

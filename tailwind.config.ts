import type { Config } from 'tailwindcss';

/**
 * Palette « atlas contemporain » : encre profonde, papier, parchemin.
 * L'accent vineux (bordeaux) est volontairement discret — utilisé pour la
 * sélection et les points d'attention, jamais en aplat dominant.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1a1c23',
          soft: '#2b2e38',
          muted: '#5b616e',
        },
        paper: {
          DEFAULT: '#f7f4ee',
          soft: '#efeae0',
          card: '#fffdf9',
        },
        line: '#dcd6c8',
        accent: {
          // Rouge « lie de vin » désaturé, pour la sélection et les accents.
          DEFAULT: '#7a2338',
          soft: '#9c4155',
          faint: '#e9d7db',
        },
        gold: '#b08a3e',
        sea: '#c9d6da',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(26,28,35,0.04), -8px 0 24px -12px rgba(26,28,35,0.18)',
        float: '0 1px 2px rgba(26,28,35,0.06), 0 8px 24px -12px rgba(26,28,35,0.24)',
      },
      transitionTimingFunction: {
        atlas: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

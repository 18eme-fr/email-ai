import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theatre-inspired palette: deep stage black, curtain crimson,
        // brass/spotlight amber, and a cool "backstage" slate.
        stage: {
          950: "#0b0a0f",
          900: "#12111a",
          800: "#1a1826",
          700: "#252235",
          600: "#332f47",
        },
        curtain: {
          DEFAULT: "#8f1d2d",
          light: "#b8283c",
          dark: "#6a1420",
        },
        spot: {
          DEFAULT: "#e9b949",
          light: "#f6d27a",
          dark: "#b8902f",
        },
        sceneblue: {
          DEFAULT: "#3a7bd5",
          light: "#5b95e0",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        spotlight: "0 0 40px -10px rgba(233, 185, 73, 0.35)",
        card: "0 4px 24px -8px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "stage-gradient":
          "radial-gradient(circle at 50% -10%, rgba(233,185,73,0.10), transparent 55%), linear-gradient(180deg, #12111a 0%, #0b0a0f 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

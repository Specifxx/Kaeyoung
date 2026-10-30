import type { Config } from "tailwindcss";

// Colours are CSS variables (src/app/globals.css) so the night theme swaps
// them in one place.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="night"]'],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        card: v("card"),
        ink: v("ink"),
        soft: v("soft"),
        line: v("line"),
        accent: { DEFAULT: v("accent"), deep: v("accent-deep"), pale: v("accent-pale") },
        subtle: v("subtle"),
        save: { DEFAULT: v("save"), pale: v("save-pale") },
        ad: v("ad"),
        buy: v("buy"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "system-ui", "Segoe UI", "Arial", "sans-serif"],
        display: ['"Fraunces Variable"', "Georgia", "Times New Roman", "serif"],
      },
      borderRadius: { blob: "14px" },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.03)",
      },
    },
  },
  plugins: [],
} satisfies Config;

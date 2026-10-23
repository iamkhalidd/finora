import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Values live in globals.css as RGB triplets so light/dark themes swap in one place
      colors: {
        "bg": "rgb(var(--bg) / <alpha-value>)",
        "surface": "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        "line": "rgb(var(--line) / <alpha-value>)",
        "ink": "rgb(var(--ink) / <alpha-value>)",
        "muted": "rgb(var(--muted) / <alpha-value>)",
        "faint": "rgb(var(--faint) / <alpha-value>)",
        "primary": "rgb(var(--primary) / <alpha-value>)",
        "on-primary": "rgb(var(--on-primary) / <alpha-value>)",
        "hero": "rgb(var(--hero) / <alpha-value>)",
        "on-hero": "rgb(var(--on-hero) / <alpha-value>)",
        "hero-muted": "rgb(var(--hero-muted) / <alpha-value>)",
        "sun": "rgb(var(--sun) / <alpha-value>)",
        "on-sun": "rgb(var(--on-sun) / <alpha-value>)",
        "income": "rgb(var(--income) / <alpha-value>)",
        "expense": "rgb(var(--expense) / <alpha-value>)",
        "warn": "rgb(var(--warn) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        "fade-in": "fade-in 0.2s ease both",
        "slide-up": "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;

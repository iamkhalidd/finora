import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a1220",
        surface: "#111b2d",
        "surface-2": "#18253b",
        line: "rgba(255,255,255,0.07)",
        ink: "#e8eef8",
        muted: "#8d99ad",
        faint: "#5d6a80",
        primary: "#7fb6ff",
        "on-primary": "#06213f",
        income: "#3ddc97",
        expense: "#ff7b72",
        warn: "#f5b942",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
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

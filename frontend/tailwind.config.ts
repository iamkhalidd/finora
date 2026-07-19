import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed": "#6bfcb6",
        "surface-container-highest": "#2a3548",
        "surface-tint": "#9bcaff",
        "secondary-fixed-dim": "#adc8f5",
        "tertiary-fixed-dim": "#49df9b",
        "on-tertiary-fixed": "#002112",
        "on-primary": "#003256",
        "on-tertiary": "#003822",
        "error": "#ffb4ab",
        "secondary": "#adc8f5",
        "surface-container": "#142032",
        "on-primary-fixed": "#001d35",
        "inverse-surface": "#d7e3fc",
        "primary-container": "#5ba3e8",
        "inverse-on-surface": "#253144",
        "on-secondary": "#133155",
        "on-primary-fixed-variant": "#004a7a",
        "primary": "#9bcaff",
        "on-surface-variant": "#c0c7d2",
        "surface-dim": "#071325",
        "outline": "#8a919b",
        "outline-variant": "#414750",
        "on-tertiary-container": "#003e26",
        "tertiary-container": "#00b577",
        "secondary-container": "#2f4a70",
        "on-primary-container": "#00385e",
        "inverse-primary": "#0062a0",
        "primary-fixed-dim": "#9bcaff",
        "secondary-fixed": "#d5e3ff",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        "on-surface": "#d7e3fc",
        "error-container": "#93000a",
        "surface-container-high": "#1f2a3d",
        "surface-container-low": "#101c2e",
        "surface-container-lowest": "#030e20",
        "surface-variant": "#2a3548",
        "on-tertiary-fixed-variant": "#005233",
        "background": "#071325",
        "on-background": "#d7e3fc",
        "on-secondary-fixed": "#001c3b",
        "primary-fixed": "#d0e4ff",
        "on-secondary-container": "#9fbae6",
        "on-secondary-fixed-variant": "#2d486d",
        "tertiary": "#49df9b",
        "surface-bright": "#2e394d",
        "surface": "#071325"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "stack-sm": "8px",
        "stack-lg": "24px",
        "gutter": "16px",
        "container-padding": "20px",
        "unit": "4px",
        "stack-md": "16px"
      },
      fontFamily: {
        "data-lg": ["JetBrains Mono"],
        "label-xs": ["Manrope"],
        "body-sm": ["Manrope"],
        "headline-sm": ["Manrope"],
        "body-md": ["Manrope"],
        "display-lg": ["Manrope"],
        "headline-lg": ["Manrope"]
      },
      fontSize: {
        "data-lg": ["18px", { "lineHeight": "24px", "fontWeight": "500" }],
        "label-xs": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "display-lg": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }]
      }
    },
  },
  plugins: [],
};
export default config;

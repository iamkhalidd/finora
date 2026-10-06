import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finora",
    short_name: "Finora",
    description: "Track your naira, stick to your budgets and keep an honest trading journal.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a1220",
    theme_color: "#0a1220",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

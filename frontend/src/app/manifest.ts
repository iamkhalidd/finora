import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finora",
    short_name: "Finora",
    description: "Track your naira, stick to your budgets and keep an honest trading journal.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#eef2ee",
    theme_color: "#0b5d3b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

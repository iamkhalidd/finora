import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finora",
    short_name: "Finora",
    description: "Track your naira, stick to your budgets and keep an honest trading journal.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f5f2",
    theme_color: "#1f3a68",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Manager",
    short_name: "Pocket",
    description: "Your manager brain in your pocket. Release planning, royalty tracking, playlist pitching, vault storage, and outreach — built for independent artists doing team-sized work alone.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0d0d0b",
    theme_color: "#0d0d0b",
    orientation: "portrait",
    categories: ["music", "productivity", "business"],
    lang: "en",
    dir: "ltr",
    id: "com.pocketmanager.app",
    scope: "/",
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

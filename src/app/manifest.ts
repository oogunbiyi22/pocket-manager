import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Manager",
    short_name: "Pocket",
    description: "Creator revenue intelligence for independent artists",
    start_url: "/home",
    display: "standalone",
    background_color: "#0d0d0b",
    theme_color: "#0d0d0b",
    orientation: "portrait",
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

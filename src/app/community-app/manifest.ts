import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/community-app/",
    name: "Civil At Hand Community",
    short_name: "CAH Community",
    description: "Civil At Hand professional community rooms and conversations.",
    start_url: "/community-app/",
    scope: "/community-app/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait-primary",
    background_color: "#07111f",
    theme_color: "#07111f",
    lang: "en-IN",
    categories: ["social", "business", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

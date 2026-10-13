import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StoreKeeper",
    short_name: "StoreKeeper",
    description: "Know what your store has, who has it, and what went missing.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#E4E8EA",
    theme_color: "#7B1E2E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Outstanding", url: "/outstanding" },
      { name: "Transactions", url: "/transactions" },
    ],
  };
}

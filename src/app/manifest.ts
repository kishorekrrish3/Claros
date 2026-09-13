import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Claros — Personal Finance",
    short_name: "Claros",
    description: "Know what you can safely spend today. Self-hosted personal finance tracker.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["finance", "productivity", "utilities"],
    shortcuts: [
      {
        name: "Quick Log",
        short_name: "Log",
        description: "Quickly record a transaction",
        url: "/?action=quick-add",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "View daily spending schedule",
        url: "/calendar",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Financial Insights",
        short_name: "Insights",
        description: "Spending breakdowns and analytics",
        url: "/insights",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Goals",
        short_name: "Goals",
        description: "View and manage financial goals",
        url: "/goals",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}

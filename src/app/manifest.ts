import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HoteloS — India's Smartest Hotel Management Software",
    short_name: "HoteloS",
    description:
      "Manage your hotel with AI revenue intelligence, WhatsApp automation, channel manager & GST filing.",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFCFB",
    theme_color: "#F97316",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
    lang: "en-IN",
    dir: "ltr",
    orientation: "any",
  };
}

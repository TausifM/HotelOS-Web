import { MetadataRoute } from "next";
import { landingSlugs, landingPages } from "@/lib/landing-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hotelos.online";

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Landing pages
  landingSlugs.forEach((slug) => {
    const config = landingPages[slug];
    routes.push({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  });

  // Static pages (add more as you create them)
  const staticPages = [
    { path: "/pricing", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/blog", priority: 0.8 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  staticPages.forEach((page) => {
    routes.push({
      url: `${baseUrl}${page.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: page.priority,
    });
  });

  return routes;
}
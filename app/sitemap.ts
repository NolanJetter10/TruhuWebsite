import type { MetadataRoute } from "next";
import { RESOURCES_LIBRARY } from "@/lib/resources";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-13");

  const page = (
    path: string,
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE.url}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  });

  return [
    { url: SITE.url, lastModified, changeFrequency: "weekly", priority: 1 },
    page("/advisor", 0.9),
    page("/workforce", 0.9),
    page("/how-it-works", 0.7),
    page("/for-brokerages", 0.7),
    page("/security", 0.6),
    page("/pricing", 0.7),
    page("/demo", 0.8),
    // `/resources` itself only redirects, so it is deliberately absent.
    page("/resources/blog", 0.7),
    page("/resources/case-studies", 0.7),
    // Each article carries its own publication date rather than the site-wide one.
    ...RESOURCES_LIBRARY.map((resource) => ({
      url: `${SITE.url}/resources/${resource.slug}`,
      lastModified: new Date(`${resource.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}

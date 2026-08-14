import type { MetadataRoute } from "next";
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
  ];
}

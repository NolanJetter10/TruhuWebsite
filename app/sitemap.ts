import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { CASE_STUDIES, RESOURCES } from "@/lib/content";
import { workflowsWithPages } from "@/lib/workflows";

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/advisor", priority: 0.9 },
  { path: "/advisor/workflows", priority: 0.9 },
  { path: "/workforce", priority: 0.9 },
  { path: "/workforce/compliance", priority: 0.8 },
  { path: "/workforce/frontline", priority: 0.8 },
  { path: "/platform", priority: 0.7 },
  { path: "/security", priority: 0.8 },
  { path: "/implementation", priority: 0.7 },
  { path: "/integrations", priority: 0.7 },
  { path: "/customers", priority: 0.7 },
  { path: "/resources", priority: 0.7 },
  { path: "/fit-test", priority: 0.8 },
  { path: "/about", priority: 0.5 },
  { path: "/contact", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-10");

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE.url}${route.path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...workflowsWithPages().map((workflow) => ({
      url: `${SITE.url}/advisor/${workflow.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...CASE_STUDIES.map((study) => ({
      url: `${SITE.url}/customers/${study.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...RESOURCES.map((resource) => ({
      url: `${SITE.url}/resources/${resource.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

import { tools } from "@/data/tools";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

const BASE = SITE_URL;
const NOW = new Date().toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
  const hubPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/tools/finance-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/tools/health-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/tools/daily-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/tools/developer-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/tools/education-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/tools/writing-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/tools/legal-calculators`, lastModified: NOW, changeFrequency: "weekly", priority: 0.85 },
  ];

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: NOW, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/sitemap`, lastModified: NOW, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: NOW, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: NOW, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
  ];

  const toolRoutes: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${BASE}/tools/${t.slug}`,
    lastModified: NOW,
    changeFrequency: "weekly" as const,
    priority: t.popular ? 0.9 : 0.8,
  }));

  return [...staticPages, ...hubPages, ...toolRoutes];
}

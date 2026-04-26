import { getAllBlogPosts } from "@/lib/contentful-blog";
import { getAllContentfulToolUrlSlugs } from "@/lib/contentful-tool";
import { tools } from "@/data/tools";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

const BASE = SITE_URL;
const NOW = new Date().toISOString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    { url: `${BASE}/blog`, lastModified: NOW, changeFrequency: "daily", priority: 0.86 },
    { url: `${BASE}/sitemap`, lastModified: NOW, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: NOW, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: NOW, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, lastModified: NOW, changeFrequency: "yearly", priority: 0.3 },
  ];

  let toolSlugs = tools.map((t) => t.slug);
  try {
    const cf = await getAllContentfulToolUrlSlugs();
    if (cf.length) toolSlugs = [...new Set([...toolSlugs, ...cf])];
  } catch {
    // keep code-only
  }
  const popularSet = new Set(tools.filter((t) => t.popular).map((t) => t.slug));
  const toolRoutes: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${BASE}/tools/${slug}`,
    lastModified: NOW,
    changeFrequency: "weekly" as const,
    priority: popularSet.has(slug) ? 0.9 : 0.8,
  }));

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllBlogPosts();
    blogRoutes = posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || NOW,
      changeFrequency: "weekly" as const,
      priority: 0.74,
    }));
  } catch {
    blogRoutes = [];
  }

  return [...staticPages, ...hubPages, ...toolRoutes, ...blogRoutes];
}

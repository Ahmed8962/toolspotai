import type { Tool } from "@/data/tool-model";
import type { Metadata } from "next";
import { AUTHOR_LINKEDIN_URL, SITE_URL } from "@/lib/site";

/** Default share image (SVG); keep file under `public/` */
export const DEFAULT_OG_IMAGE_PATH = "/toolspotai-logo.svg" as const;

export function defaultOgImageObjects(alt: string) {
  const url = new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).toString();
  return [{ url, alt, type: "image/svg+xml" }];
}
import {
  buildFiveMetaKeywords,
  buildToolMetaDescription,
  buildToolMetaTitle,
  buildToolOgTitle,
  getPrimaryKeywordPhrase,
  getSeoSecondaryList,
  toolCanonicalUrl,
} from "@/lib/tool-page-seo";

const APP_CATEGORY_MAP: Record<string, string> = {
  finance: "FinanceApplication",
  health: "HealthApplication",
  education: "EducationalApplication",
  developer: "DeveloperApplication",
  writing: "UtilitiesApplication",
  daily: "UtilitiesApplication",
  legal: "BusinessApplication",
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  finance: "Finance Tools",
  health: "Health Tools",
  education: "Education Tools",
  developer: "Developer Tools",
  writing: "Writing Tools",
  daily: "Daily Tools",
  legal: "Legal Tools",
};

/** Hub listing URL path per tool category (for breadcrumbs & internal links) */
const CATEGORY_HUB_PATH: Record<string, string> = {
  finance: "/tools/finance-calculators",
  health: "/tools/health-calculators",
  education: "/tools/education-calculators",
  developer: "/tools/developer-calculators",
  writing: "/tools/writing-calculators",
  daily: "/tools/daily-calculators",
  legal: "/tools/legal-calculators",
};

export function getCategoryHubPath(category: string): string {
  return CATEGORY_HUB_PATH[category] ?? "/tools";
}

export function generateToolMetadata(tool: Tool): Metadata {
  const primary = getPrimaryKeywordPhrase(tool);
  const secondary = getSeoSecondaryList(tool).slice(0, 8);
  const metaTitle = buildToolMetaTitle(primary, tool.title);
  const description = buildToolMetaDescription(tool, primary, secondary);
  const five = buildFiveMetaKeywords(tool, primary, secondary);
  const url = toolCanonicalUrl(tool.slug);
  const ogTitle = buildToolOgTitle(primary);
  return {
    title: { absolute: metaTitle },
    description,
    keywords: five,
    authors: [{ name: "ToolSpotAI", url: SITE_URL }],
    creator: "ToolSpotAI",
    publisher: "ToolSpotAI",
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: "ToolSpotAI",
      locale: "en_US",
      type: "website",
      images: defaultOgImageObjects(tool.title),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      creator: "@toolspotai",
      images: [new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).toString()],
    },
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateFAQSchema(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function generateWebAppSchema(tool: {
  title: string;
  slug: string;
  seoDescription: string;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    url: `${SITE_URL}/tools/${tool.slug}`,
    description: tool.seoDescription,
    applicationCategory: APP_CATEGORY_MAP[tool.category] ?? "UtilitiesApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en-US",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "ToolSpotAI",
      url: SITE_URL,
    },
  };
}

export function generateOrganizationSchema() {
  const logoUrl = new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ToolSpotAI",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
    description:
      "Free online calculators and tools for finance, health, education, developer utilities, and daily use. No signup required.",
    sameAs: [AUTHOR_LINKEDIN_URL],
  };
}

/** Sitewide WebSite node — use on the homepage with Organization for rich results context */
export function generateWebSiteSchema() {
  const logoUrl = new URL(DEFAULT_OG_IMAGE_PATH, SITE_URL).toString();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ToolSpotAI",
    url: SITE_URL,
    description:
      "Free online calculators and tools for finance, health, education, developer utilities, and daily life. No signup required.",
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: "ToolSpotAI",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: logoUrl },
    },
  };
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABEL_MAP[category] ?? "Tools";
}

import type { Metadata } from "next";
import { AUTHOR_LINKEDIN_URL, SITE_URL } from "@/lib/site";

const APP_CATEGORY_MAP: Record<string, string> = {
  finance: "FinanceApplication",
  health: "HealthApplication",
  education: "EducationalApplication",
  developer: "DeveloperApplication",
  writing: "UtilitiesApplication",
  daily: "UtilitiesApplication",
  legal: "LifestyleApplication",
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

export function generateToolMetadata(tool: {
  seoTitle: string;
  seoDescription: string;
  ogDescription: string;
  slug: string;
  keywords: string[];
}): Metadata {
  const url = `${SITE_URL}/tools/${tool.slug}`;
  return {
    title: { absolute: tool.seoTitle },
    description: tool.seoDescription,
    keywords: tool.keywords.join(", "),
    authors: [{ name: "ToolSpotAI", url: SITE_URL }],
    creator: "ToolSpotAI",
    publisher: "ToolSpotAI",
    openGraph: {
      title: tool.seoTitle,
      description: tool.ogDescription,
      url,
      siteName: "ToolSpotAI",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.seoTitle,
      description: tool.ogDescription,
      creator: "@toolspotai",
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
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript",
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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ToolSpotAI",
    url: SITE_URL,
    description:
      "Free online calculators and tools for finance, health, education, developer utilities, and daily use. No signup required.",
    sameAs: [AUTHOR_LINKEDIN_URL],
  };
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABEL_MAP[category] ?? "Tools";
}

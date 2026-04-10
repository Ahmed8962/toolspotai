import { categories, getToolsByCategory, tools } from "@/data/tools";
import type { Tool } from "@/data/tools";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap — All Tools & Pages | ToolSpotAI",
  description:
    "Complete sitemap of ToolSpotAI — browse all free online tools organized by category: finance, writing, daily, developer, education, and health.",
  alternates: { canonical: `${SITE_URL}/sitemap` },
};

export default function SitemapPage() {
  const toolCount = tools.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary">Sitemap</h1>
      <p className="mt-2 text-text-secondary">
        All {toolCount} free tools and pages on ToolSpotAI, organized by
        category.
      </p>

      {/* Static pages */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">Pages</h2>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/disclaimer", label: "Disclaimer" },
          ].map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-brand-50 hover:text-brand-700"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Tools by category */}
      {categories.map((cat) => {
        const catTools = getToolsByCategory(cat.id as Tool["category"]);
        return (
          <section key={cat.id} className="mt-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="text-lg font-semibold text-text-primary">
                {cat.label}
              </h2>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
                {catTools.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">{cat.description}</p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {catTools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <span className="w-5 text-center text-sm shrink-0">
                      {t.icon}
                    </span>
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* Summary */}
      <div className="mt-14 rounded-xl border border-border bg-surface-muted/40 p-5 text-sm text-text-secondary">
        <p>
          <strong className="text-text-primary">
            {toolCount} tools across {categories.length} categories
          </strong>{" "}
          — all free, no signup required. New tools are added regularly. The XML
          sitemap is available at{" "}
          <a
            href={`${SITE_URL}/sitemap.xml`}
            className="text-brand-600 underline"
          >
            /sitemap.xml
          </a>
          .
        </p>
      </div>
    </div>
  );
}

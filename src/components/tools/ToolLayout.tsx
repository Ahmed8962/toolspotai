import type { Tool } from "@/data/tools";
import { getCategoryHubPath, getCategoryLabel } from "@/lib/seo";
import AdSlot from "@/components/tools/AdSlot";
import FAQAccordion from "@/components/shared/FAQAccordion";
import RelatedTools from "@/components/tools/RelatedTools";
import SEOContentBlock from "@/components/shared/SEOContentBlock";
import Breadcrumb from "@/components/shared/Breadcrumb";
import CategoryBadge from "@/components/shared/CategoryBadge";
import type { ReactNode } from "react";

export default function ToolLayout({
  tool,
  related,
  children,
  pageSeo,
}: {
  tool: Tool;
  related: Tool[];
  children: ReactNode;
  /** On-page SEO: H1 from primary keyword, intro, and how-to steps */
  pageSeo?: {
    h1Text: string;
    intro: string;
    howToUseSteps: string[];
  };
}) {
  const h1 = pageSeo?.h1Text ?? tool.title;
  const intro = pageSeo?.intro ?? tool.description;
  const steps = pageSeo?.howToUseSteps ?? [];

  return (
    <div className="mx-auto max-w-[860px] px-4 py-10">
      <div>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            {
              label: getCategoryLabel(tool.category),
              href: getCategoryHubPath(tool.category),
            },
            { label: tool.title },
          ]}
        />
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">{h1}</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{intro}</p>
        <div className="mt-3">
          <CategoryBadge category={tool.category} />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-surface-card p-6 shadow-[var(--shadow-card)]">
        {children}
      </div>

      {steps.length > 0 ? (
        <section className="mt-10" aria-labelledby="how-to-use-heading">
          <h2 id="how-to-use-heading" className="text-lg font-semibold text-text-primary">
            How to Use This {tool.title}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-muted">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mt-10">
        <AdSlot size="leaderboard" />
      </div>

      <SEOContentBlock tool={tool} />

      <h2 className="mb-2 mt-14 text-xl font-semibold text-text-primary">
        Frequently Asked Questions
      </h2>
      <FAQAccordion items={tool.faqs} />

      <RelatedTools tools={related} />
    </div>
  );
}

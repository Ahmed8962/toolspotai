import type { Tool } from "@/data/tools";
import { getCategoryLabel } from "@/lib/seo";
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
}: {
  tool: Tool;
  related: Tool[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[860px] px-4 py-10">
      <div>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: getCategoryLabel(tool.category) },
            { label: tool.title },
          ]}
        />
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">{tool.title}</h1>
        <p className="mt-2 text-sm text-text-muted">{tool.description}</p>
        <div className="mt-3">
          <CategoryBadge category={tool.category} />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-surface-card p-6 shadow-[var(--shadow-card)]">
        {children}
      </div>

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

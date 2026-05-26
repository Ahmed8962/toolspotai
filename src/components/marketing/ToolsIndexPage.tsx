import ToolCard from "@/components/tools/ToolCard";
import { CATEGORY_HUBS } from "@/data/category-hubs";
import {
  categories,
  getPopularTools,
  getToolsByCategory,
  tools,
} from "@/data/tools";
import type { Tool } from "@/data/tools";
import Link from "next/link";

const CAT_COLORS: Record<string, { gradient: string; iconBg: string; border: string }> = {
  finance: { gradient: "from-blue-50 to-indigo-50", iconBg: "bg-blue-100", border: "hover:border-blue-200" },
  writing: { gradient: "from-violet-50 to-purple-50", iconBg: "bg-violet-100", border: "hover:border-violet-200" },
  daily: { gradient: "from-emerald-50 to-teal-50", iconBg: "bg-emerald-100", border: "hover:border-emerald-200" },
  developer: { gradient: "from-sky-50 to-cyan-50", iconBg: "bg-sky-100", border: "hover:border-cyan-200" },
  education: { gradient: "from-amber-50 to-yellow-50", iconBg: "bg-amber-100", border: "hover:border-amber-200" },
  health: { gradient: "from-rose-50 to-pink-50", iconBg: "bg-rose-100", border: "hover:border-rose-200" },
  legal: { gradient: "from-slate-50 to-zinc-50", iconBg: "bg-slate-100", border: "hover:border-slate-200" },
};

export default function ToolsIndexPage() {
  const popular = getPopularTools().slice(0, 8);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:max-w-5xl">
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-600">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-text-secondary">All tools</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
        Free online calculators &amp; tools
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-text-secondary">
        Browse {tools.length}+ free tools by category—finance, health, developer utilities, writing
        helpers, and more. No signup; everything runs in your browser.
      </p>

      <section className="mt-12" aria-labelledby="tools-categories-heading">
        <h2 id="tools-categories-heading" className="text-xl font-semibold text-text-primary">
          Browse by category
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Each category has a dedicated hub with guides and every tool in that cluster.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {categories.map((c) => {
            const colors = CAT_COLORS[c.id] ?? CAT_COLORS.finance;
            const catTools = getToolsByCategory(c.id as Tool["category"]);
            const hub = CATEGORY_HUBS[c.id as keyof typeof CATEGORY_HUBS];
            return (
              <Link
                key={c.id}
                href={hub.path}
                className={`group rounded-2xl border border-slate-100/80 bg-gradient-to-br ${colors.gradient} p-6 transition ${colors.border} hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.iconBg} text-xl`}
                  >
                    {c.icon}
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                    {catTools.length} tools
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary group-hover:text-brand-700">
                  {c.label}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{c.description}</p>
                <p className="mt-3 text-sm font-semibold text-brand-700 group-hover:underline">
                  View category hub →
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {popular.length > 0 ? (
        <section className="mt-14" aria-labelledby="popular-tools-heading">
          <h2 id="popular-tools-heading" className="text-xl font-semibold text-text-primary">
            Popular tools
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {popular.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-12 text-sm text-text-muted">
        Need a full alphabetical list?{" "}
        <Link href="/sitemap" className="font-medium text-brand-600 hover:underline">
          View the sitemap
        </Link>
        .
      </p>
    </div>
  );
}

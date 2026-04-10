import Link from "next/link";
import type { Tool } from "@/data/tools";
import CategoryBadge from "@/components/shared/CategoryBadge";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative block rounded-2xl border border-slate-100/80 bg-white p-6 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-brand-200/60 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-50/40 via-transparent to-violet-50/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none" />
      <div className="relative flex items-start gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 text-2xl shadow-sm ring-1 ring-brand-100/50 transition-transform duration-300 group-hover:scale-110"
          aria-hidden
        >
          {tool.icon}
        </span>
        <div className="min-w-0 flex-1">
          <CategoryBadge category={tool.category} />
          <h3 className="mt-2 font-semibold text-text-primary transition-colors group-hover:text-brand-700">
            {tool.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-muted">
            {tool.description}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-all group-hover:gap-2">
            Use tool
            <svg
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

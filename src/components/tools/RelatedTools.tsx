import Link from "next/link";
import type { Tool } from "@/data/tools";

export default function RelatedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-lg font-semibold text-text-primary">Related tools</h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {tools.map((t) => (
          <li key={t.slug}>
            <Link
              className="inline-flex items-center rounded-full border border-border bg-surface-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-brand-200 hover:text-brand-700"
              href={`/tools/${t.slug}`}
            >
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

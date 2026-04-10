import type { Tool } from "@/data/tools";

export default function SEOContentBlock({ tool }: { tool: Tool }) {
  const c = tool.content;
  return (
    <article className="max-w-none text-text-secondary">
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">
          What is {tool.title}?
        </h2>
        <div className="whitespace-pre-line leading-7">{c.whatIs}</div>
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">How It Works</h2>
        <p className="leading-7">{c.howItWorks}</p>
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">Formula</h2>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-6 text-sm text-green-400">
          {c.formula}
        </pre>
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">Formula Explained</h2>
        <p className="leading-7">{c.formulaExplanation}</p>
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">Example</h2>
        <blockquote className="border-l-4 border-brand-200 bg-surface-muted py-3 pl-4 pr-4 text-text-primary">
          <div className="whitespace-pre-line text-sm leading-7">{c.example}</div>
        </blockquote>
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">Tips & Best Practices</h2>
        <ul className="list-none space-y-2">
          {c.tips.map((t) => (
            <li key={t} className="flex gap-2 text-sm leading-7">
              <span className="text-emerald-600">✓</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-text-primary">Common Use Cases</h2>
        <ul className="list-none space-y-2">
          {c.useCases.map((u) => (
            <li key={u} className="flex gap-2 text-sm leading-7">
              <span className="text-brand-600">•</span>
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

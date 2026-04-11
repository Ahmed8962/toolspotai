import ToolCard from "@/components/tools/ToolCard";
import { CATEGORY_HUBS } from "@/data/category-hubs";
import { categories, getPopularTools, getToolsByCategory, tools } from "@/data/tools";
import Link from "next/link";

const homeFaqs = [
  {
    q: "What is ToolSpotAI?",
    a: "ToolSpotAI is a free online platform for AI-powered and classic utility tools—calculators, writing helpers, finance tools, and more. Everything lives in one place. No account is required.",
  },
  {
    q: 'What does "Every AI Tool, One Spot" mean?',
    a: "We are building a single destination where you can find helpful online tools without jumping between sites. Our library grows over time as we add new categories and utilities.",
  },
  {
    q: "Do I need to sign up?",
    a: "No. All tools are free to use in your browser without registration.",
  },
  {
    q: "Are the tools accurate?",
    a: "Calculator and finance tools use standard formulas. Text metrics follow common counting rules. Results are for informational purposes—see our disclaimer for financial or health-related use.",
  },
  {
    q: "Will you add more than calculators?",
    a: "Yes. We plan to expand into more AI and productivity tools—file utilities, converters, developer helpers, and others—while keeping the same fast, simple experience.",
  },
  {
    q: "Can I use this on mobile?",
    a: "Yes. The site is responsive and works on phones and tablets.",
  },
];

const TRUST_ITEMS = [
  { icon: "⚡", label: "Instant results", desc: "No loading, no waiting" },
  { icon: "🔒", label: "100% private", desc: "Everything runs locally" },
  { icon: "🌍", label: "Works everywhere", desc: "Desktop, tablet, mobile" },
  { icon: "🎯", label: "Precise formulas", desc: "Industry-standard math" },
];

const CAT_COLORS: Record<string, { gradient: string; iconBg: string; border: string }> = {
  finance: { gradient: "from-blue-50 to-indigo-50", iconBg: "bg-blue-100", border: "hover:border-blue-200" },
  writing: { gradient: "from-violet-50 to-purple-50", iconBg: "bg-violet-100", border: "hover:border-violet-200" },
  daily: { gradient: "from-emerald-50 to-teal-50", iconBg: "bg-emerald-100", border: "hover:border-emerald-200" },
  developer: { gradient: "from-sky-50 to-cyan-50", iconBg: "bg-sky-100", border: "hover:border-sky-200" },
  education: { gradient: "from-amber-50 to-yellow-50", iconBg: "bg-amber-100", border: "hover:border-amber-200" },
  health: { gradient: "from-rose-50 to-pink-50", iconBg: "bg-rose-100", border: "hover:border-rose-200" },
  legal: { gradient: "from-slate-50 to-zinc-50", iconBg: "bg-slate-100", border: "hover:border-slate-200" },
};

export default function Home() {
  const popular = getPopularTools();

  return (
    <div className="bg-surface-page">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="hero-glow -top-40 -left-40 bg-blue-400/15" aria-hidden="true" />
        <div className="hero-glow -bottom-40 -right-40 bg-violet-400/15" aria-hidden="true" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 text-center md:pb-24 md:pt-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white/90 px-4 py-1.5 text-sm shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-brand-700">
              {tools.length} free tools
            </span>
            <span className="text-text-muted">· No signup needed</span>
          </div>

          {/* Headline */}
          <h1 className="mt-8 text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl">
            Every tool you need,{" "}
            <span className="bg-gradient-to-r from-brand-600 via-blue-500 to-violet-600 bg-clip-text text-transparent">
              one spot
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            Free calculators, developer tools, writing helpers, and finance
            utilities. Fast, private, and beautifully designed.
          </p>

          {/* CTA row */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#popular"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 px-8 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore tools
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            <Link
              href="#categories"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-8 text-sm font-semibold text-text-primary shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Browse categories
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-14 grid grid-cols-2 gap-3 sm:flex sm:justify-center sm:gap-6">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.label}
                className="stat-card flex items-center gap-2.5 rounded-xl px-4 py-3 sm:px-5"
              >
                <span className="text-xl">{item.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">
                    {item.label}
                  </p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ POPULAR TOOLS ═══════════════════ */}
      <section id="popular" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Most popular
          </span>
          <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
            Tools people love
          </h2>
          <p className="mt-3 text-text-secondary">
            Hand-picked utilities our visitors use every day
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.slice(0, 12).map((t) => (
            <ToolCard key={t.slug} tool={t} compact />
          ))}
        </div>
        {popular.length > 12 && (
          <div className="mt-8 text-center">
            <Link
              href="#all-tools"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text-primary shadow-sm transition hover:shadow-md"
            >
              View all {tools.length} tools
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* ═══════════════════ CATEGORIES ═══════════════════ */}
      <section id="categories" className="border-t border-border/60 bg-gradient-to-b from-white to-slate-50/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {categories.length} categories
            </span>
            <h2 className="mt-4 text-3xl font-bold text-text-primary sm:text-4xl">
              Browse by category
            </h2>
            <p className="mt-3 text-text-secondary">
              Find the right tool for your task
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const colors = CAT_COLORS[c.id] ?? CAT_COLORS.finance;
              const catTools = getToolsByCategory(c.id as Parameters<typeof getToolsByCategory>[0]);
              return (
                <div
                  key={c.id}
                  className={`category-card group rounded-2xl border border-slate-100/80 bg-gradient-to-br ${colors.gradient} p-6 ${colors.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg} text-2xl shadow-sm`}
                    >
                      {c.icon}
                    </div>
                    <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-text-muted shadow-sm">
                      {catTools.length} tools
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">
                    {c.label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {c.description}
                  </p>
                  <Link
                    href={CATEGORY_HUBS[c.id as keyof typeof CATEGORY_HUBS].path}
                    className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline"
                  >
                    {`${c.label.replace(/ Tools$/, "")} hub`} →
                  </Link>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {catTools.slice(0, 3).map((t) => (
                      <Link
                        key={t.slug}
                        href={`/tools/${t.slug}`}
                        className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-medium text-text-secondary shadow-sm transition hover:bg-white hover:text-brand-700 hover:shadow"
                      >
                        {t.shortTitle}
                      </Link>
                    ))}
                    {catTools.length > 3 && (
                      <span className="rounded-lg bg-white/50 px-2.5 py-1 text-xs text-text-muted">
                        +{catTools.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ ALL TOOLS ═══════════════════ */}
      <section id="all-tools" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
            All tools
          </h2>
          <p className="mt-3 text-text-secondary">
            {tools.length} free tools and growing
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      {/* ═══════════════════ CTA BANNER ═══════════════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-blue-600 to-violet-600 px-8 py-14 text-center text-white shadow-xl sm:px-16">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize:"30px 30px"}} />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to get things done?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Pick any tool above and start instantly. No account, no downloads,
              no tracking. Just results.
            </p>
            <Link
              href="#popular"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Start using tools
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="border-t border-border/60 bg-white py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-text-secondary">
              Everything you need to know about ToolSpotAI
            </p>
          </div>
          <dl className="mt-12 space-y-0 divide-y divide-border/60">
            {homeFaqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="text-base font-semibold text-text-primary">
                  {f.q}
                </dt>
                <dd className="mt-2 leading-relaxed text-text-secondary">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

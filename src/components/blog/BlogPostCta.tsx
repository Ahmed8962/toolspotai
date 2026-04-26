import Link from "next/link";

export default function BlogPostCta() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0b2a5a] p-6 text-center shadow-lg">
      <p className="text-xs font-bold uppercase tracking-widest text-white/80">ToolSpotAI</p>
      <h3 className="mt-2 text-lg font-bold leading-snug text-white sm:text-xl">
        Free online calculators and tools
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-200/95">
        No sign-up. Instant results. Finance, health, and daily tasks—all in your browser.
      </p>
      <Link
        className="mt-5 inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-900 shadow transition hover:bg-amber-400"
        href="/tools"
      >
        Browse all tools
      </Link>
    </div>
  );
}

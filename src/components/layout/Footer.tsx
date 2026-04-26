import Logo from "@/components/Logo";
import { AUTHOR_LINKEDIN_URL, AUTHOR_NAME } from "@/lib/site";
import Link from "next/link";
import { CATEGORY_HUBS } from "@/data/category-hubs";
import { categories, getToolsByCategory } from "@/data/tools";
import type { Tool } from "@/data/tools";

export default function Footer() {
  const toolsByCategory = categories.map((c) => ({
    ...c,
    tools: getToolsByCategory(c.id as Tool["category"]),
  }));

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Top: brand + links */}
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-10">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* Brand column */}
          <div>
            <Logo footer />
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Every AI Tool, One Spot. Free online calculators, developer tools,
              and utilities — fast, accurate, no signup.
            </p>
            <div className="mt-6 flex gap-4">
              <Link
                href="/about"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Contact
              </Link>
              <Link
                href="/blog"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Blog
              </Link>
              <Link
                href="/disclaimer"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Disclaimer
              </Link>
            </div>
          </div>

          {/* Tools grid — grouped by category */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {toolsByCategory.map((cat) => (
              <div key={cat.id}>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <span className="text-base">{cat.icon}</span>
                  {cat.label}
                </p>
                <Link
                  href={CATEGORY_HUBS[cat.id as keyof typeof CATEGORY_HUBS].path}
                  className="mt-1 inline-block text-xs font-medium text-brand-300 hover:text-white"
                >
                  {`${cat.label.replace(/ Tools$/, "")} hub →`}
                </Link>
                <ul className="mt-2.5 space-y-1.5 text-sm">
                  {cat.tools.map((t) => (
                    <li key={t.slug}>
                      <Link
                        className="text-slate-400 transition hover:text-white"
                        href={`/tools/${t.slug}`}
                      >
                        {t.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            © {new Date().getFullYear()} ToolSpotAI. All rights reserved.
            <span className="mx-1.5 text-slate-600">·</span>
            <span className="text-slate-400">
              Built by{" "}
              <a
                href={AUTHOR_LINKEDIN_URL}
                className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition hover:text-slate-200"
                rel="noopener noreferrer"
                target="_blank"
              >
                {AUTHOR_NAME}
              </a>
            </span>
          </p>
          <div className="flex gap-5 text-xs text-slate-500">
            <Link href="/privacy" className="transition hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-300">
              Terms of Service
            </Link>
            <Link href="/sitemap" className="transition hover:text-slate-300">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Logo from "@/components/Logo";
import HeaderSearch from "@/components/layout/HeaderSearch";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { CATEGORY_HUBS } from "@/data/category-hubs";
import { categories, tools, getToolsByCategory } from "@/data/tools";
import type { Tool } from "@/data/tools";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMega = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMegaOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    timeoutRef.current = setTimeout(() => setMegaOpen(false), 200);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const toolCount = tools.length;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:h-[60px] md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <Logo />
          <HeaderSearch className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg" />
        </div>

        {/* ── Desktop nav ── */}
        <nav className="hidden shrink-0 items-center gap-6 md:flex">
          <Link
            className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            href="/"
          >
            Home
          </Link>

          {/* Tools mega-dropdown — opens on hover */}
          <div
            ref={megaRef}
            className="relative"
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition",
                megaOpen
                  ? "text-brand-700"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              Tools
              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-brand-600">
                {toolCount}
              </span>
              <svg
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  megaOpen && "rotate-180",
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mega menu panel */}
            <div
              className={cn(
                "fixed left-0 right-0 top-[60px] z-50 border-b border-border/60 bg-white shadow-xl transition-all duration-200",
                megaOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-2 opacity-0",
              )}
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
            >
              <div className="relative mx-auto max-w-6xl px-6 py-6">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setMegaOpen(false)}
                  className="absolute right-6 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-slate-100 hover:text-text-primary"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Category columns — horizontal layout */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                  {categories.map((cat) => {
                    const catTools = getToolsByCategory(
                      cat.id as Tool["category"],
                    );
                    const hubPath = CATEGORY_HUBS[cat.id as keyof typeof CATEGORY_HUBS].path;
                    return (
                      <div key={cat.id}>
                        <Link
                          href={hubPath}
                          onClick={() => setMegaOpen(false)}
                          className="flex items-center gap-1.5 border-b border-border/60 pb-2 transition hover:border-brand-200"
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                            {cat.label.replace(" Tools", "")}
                          </span>
                          <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                            {catTools.length}
                          </span>
                        </Link>
                        <ul className="mt-2 space-y-0.5">
                          {catTools.map((t) => (
                            <li key={t.slug}>
                              <Link
                                href={`/tools/${t.slug}`}
                                onClick={() => setMegaOpen(false)}
                                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-text-secondary transition-colors hover:bg-brand-50/60 hover:text-brand-700"
                              >
                                <span className="w-4 text-center text-sm transition-transform duration-150 group-hover:scale-110">
                                  {t.icon}
                                </span>
                                <span className="truncate">{t.shortTitle}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom bar */}
                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                  <p className="text-xs text-text-muted">
                    {toolCount} tools across {categories.length} categories — all
                    free, no signup
                  </p>
                  <Link
                    href="/#all-tools"
                    onClick={() => setMegaOpen(false)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    View all tools
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link
            className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            href="/about"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
            href="/contact"
          >
            Contact
          </Link>
        </nav>

        {/* ── Mobile toggle ── */}
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={cn(
          "border-t border-border bg-white md:hidden overflow-y-auto max-h-[80vh]",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto max-w-5xl px-4 py-3">
          <HeaderSearch
            variant="mobile"
            className="mb-4"
            onNavigate={() => setMobileOpen(false)}
          />
          <Link
            className="block py-2 text-sm font-semibold text-text-primary"
            href="/"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>

          {categories.map((cat) => {
            const catTools = getToolsByCategory(
              cat.id as Tool["category"],
            );
            return (
              <div key={cat.id} className="mt-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <span>{cat.icon}</span>
                  {cat.label}
                  <span className="ml-1 text-[10px] font-semibold text-text-muted">
                    ({catTools.length})
                  </span>
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-0.5 pl-1">
                  {catTools.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tools/${t.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                    >
                      <span className="w-4 text-center text-sm">{t.icon}</span>
                      {t.shortTitle}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-4 flex gap-4 border-t border-border pt-3">
            <Link
              className="text-sm text-text-secondary hover:text-text-primary"
              href="/about"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>
            <Link
              className="text-sm text-text-secondary hover:text-text-primary"
              href="/contact"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

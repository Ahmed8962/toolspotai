"use client";

import Logo from "@/components/Logo";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type NavCategory = {
  id: string;
  label: string;
  icon: string;
  hubPath: string;
  tools: Array<{
    slug: string;
    shortTitle: string;
    icon: string;
  }>;
};

export default function NavbarClient({
  navCategories,
  toolCount,
}: {
  navCategories: NavCategory[];
  toolCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);

  const closeMegaNow = useCallback(() => {
    setMegaOpen(false);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const onDocPointer = (e: PointerEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        closeMegaNow();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMegaNow();
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [megaOpen, closeMegaNow]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm">
      {megaOpen ? (
        <div
          className="fixed bottom-0 left-0 right-0 top-14 z-40 hidden bg-slate-900/20 md:top-[60px] md:block"
          aria-hidden
          onClick={closeMegaNow}
        />
      ) : null}
      <div className="relative z-50 mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:h-[60px] md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <Logo />
          <HeaderSearch className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg" />
        </div>

        <nav className="hidden shrink-0 items-center gap-6 md:flex">
          <Link className="text-sm font-medium text-text-secondary transition hover:text-text-primary" href="/">
            Home
          </Link>
          <div ref={megaRef} className="relative">
            <button
              type="button"
              onClick={() => setMegaOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition",
                megaOpen ? "text-brand-700" : "text-text-secondary hover:text-text-primary",
              )}
            >
              Tools
              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-brand-600">
                {toolCount}
              </span>
              <svg
                className={cn("h-3.5 w-3.5 transition-transform duration-200", megaOpen && "rotate-180")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={cn(
                "fixed left-0 right-0 top-14 z-50 flex justify-center px-4 transition-[visibility,opacity] duration-200 md:top-[60px]",
                megaOpen
                  ? "pointer-events-auto visible opacity-100"
                  : "pointer-events-none invisible opacity-0",
              )}
              onClick={(e) => {
                if (e.target === e.currentTarget) closeMegaNow();
              }}
            >
              <div
                className={cn(
                  "w-full max-w-6xl max-h-[min(80dvh,42rem)] overflow-x-hidden overflow-y-auto rounded-b-2xl border border-t-0 border-border/60 bg-white shadow-xl",
                  "transition-transform duration-200",
                  megaOpen ? "translate-y-0" : "-translate-y-2",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6 sm:pr-16">
                <button
                  type="button"
                  onClick={closeMegaNow}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-slate-100 hover:text-text-primary"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                  {navCategories.map((cat) => (
                    <div key={cat.id}>
                      <Link
                        href={cat.hubPath}
                        onClick={closeMegaNow}
                        className="flex items-center gap-1.5 border-b border-border/60 pb-2 transition hover:border-brand-200"
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          {cat.label.replace(" Tools", "")}
                        </span>
                        <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                          {cat.tools.length}
                        </span>
                      </Link>
                      <ul className="mt-2 space-y-0.5">
                        {cat.tools.map((t) => (
                          <li key={t.slug}>
                            <Link
                              href={`/tools/${t.slug}`}
                              onClick={closeMegaNow}
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
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                  <p className="text-xs text-text-muted">
                    {toolCount} tools across {navCategories.length} categories - all free, no signup
                  </p>
                  <Link
                    href="/#all-tools"
                    onClick={closeMegaNow}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    View all tools
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
                </div>
              </div>
            </div>
          </div>
          <Link className="text-sm font-medium text-text-secondary transition hover:text-text-primary" href="/about">
            About
          </Link>
          <Link className="text-sm font-medium text-text-secondary transition hover:text-text-primary" href="/blog">
            Blog
          </Link>
          <Link className="text-sm font-medium text-text-secondary transition hover:text-text-primary" href="/contact">
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? "X" : "☰"}
        </button>
      </div>

      <div
        className={cn(
          "max-h-[80vh] overflow-y-auto border-t border-border bg-white md:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto max-w-5xl px-4 py-3">
          <HeaderSearch variant="mobile" className="mb-4" onNavigate={() => setMobileOpen(false)} />
          <Link className="block py-2 text-sm font-semibold text-text-primary" href="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          {navCategories.map((cat) => (
            <div key={cat.id} className="mt-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                <span>{cat.icon}</span>
                {cat.label}
                <span className="ml-1 text-[10px] font-semibold text-text-muted">({cat.tools.length})</span>
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-0.5 pl-1">
                {cat.tools.map((t) => (
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
          ))}
          <div className="mt-4 flex gap-4 border-t border-border pt-3">
            <Link className="text-sm text-text-secondary hover:text-text-primary" href="/about" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <Link className="text-sm text-text-secondary hover:text-text-primary" href="/blog" onClick={() => setMobileOpen(false)}>
              Blog
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

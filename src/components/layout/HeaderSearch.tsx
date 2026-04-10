"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tools } from "@/data/tools";
import type { Tool } from "@/data/tools";
import { cn } from "@/lib/utils";

const CATEGORY_LABEL: Record<Tool["category"], string> = {
  finance: "Finance",
  writing: "Writing",
  daily: "Daily",
  developer: "Developer",
  education: "Education",
  health: "Health",
  legal: "Legal",
};

const MAX_RESULTS = 10;

function getPopularTools(): Tool[] {
  const popular = tools.filter((t) => t.popular);
  if (popular.length >= MAX_RESULTS) return popular.slice(0, MAX_RESULTS);
  const seen = new Set(popular.map((t) => t.slug));
  const rest = tools.filter((t) => !seen.has(t.slug));
  return [...popular, ...rest].slice(0, MAX_RESULTS);
}

/** Single character: prefix & word-start only — avoids noisy mid-string matches */
function searchToolsSingleChar(q: string): Tool[] {
  return tools
    .map((t) => {
      let score = 0;
      const title = t.title.toLowerCase();
      const short = t.shortTitle.toLowerCase();
      const slugParts = t.slug.toLowerCase().split("-");

      if (title.startsWith(q)) score += 130;
      if (short.startsWith(q)) score += 110;
      if (slugParts[0]?.startsWith(q)) score += 95;
      for (const w of title.split(/\s+/)) {
        if (w.startsWith(q)) score += 75;
      }
      for (const p of slugParts) {
        if (p.startsWith(q)) score += 55;
      }
      for (const kw of t.keywords) {
        const k = kw.toLowerCase();
        if (k.startsWith(q)) score += 45;
        else if (k.split(/\s+/).some((w) => w.startsWith(q))) score += 35;
      }
      const desc = t.description.toLowerCase();
      if (desc.startsWith(q)) score += 25;
      if (t.popular) score += 12;
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.t);
}

/** Two or more characters: full substring + keyword match */
function searchToolsMulti(q: string): Tool[] {
  return tools
    .map((t) => {
      let score = 0;
      const title = t.title.toLowerCase();
      const short = t.shortTitle.toLowerCase();
      const desc = t.description.toLowerCase();
      const slug = t.slug.toLowerCase().replace(/-/g, " ");

      if (title.startsWith(q)) score += 100;
      else if (title.includes(q)) score += 60;
      if (short.startsWith(q)) score += 85;
      else if (short.includes(q)) score += 50;
      if (slug.startsWith(q)) score += 55;
      else if (slug.includes(q)) score += 40;
      if (desc.includes(q)) score += 22;
      for (const kw of t.keywords) {
        const k = kw.toLowerCase();
        if (k.startsWith(q)) score += 35;
        else if (k.includes(q)) score += 25;
      }
      const words = title.split(/\s+/);
      for (const w of words) {
        if (w.startsWith(q)) score += 45;
      }
      if (t.popular) score += 8;
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.t);
}

function searchTools(query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  if (q.length === 1) return searchToolsSingleChar(q);
  return searchToolsMulti(q);
}

type HeaderSearchProps = {
  className?: string;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export default function HeaderSearch({
  className,
  variant = "desktop",
  onNavigate,
}: HeaderSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();

  const { rows, mode } = useMemo(() => {
    if (trimmed.length >= 1) {
      const r = searchTools(query);
      return { rows: r, mode: "search" as const };
    }
    return { rows: getPopularTools(), mode: "popular" as const };
  }, [query, trimmed.length]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        inputRef.current?.blur();
      }
      if (
        variant === "desktop" &&
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, variant]);

  const handlePick = () => {
    setQuery("");
    close();
    onNavigate?.();
  };

  const showPanel = open;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label
        className="sr-only"
        htmlFor={variant === "desktop" ? "header-search" : "header-search-mobile"}
      >
        Search tools
      </label>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-full border bg-slate-50/80 px-3 py-1.5 transition-[box-shadow,border-color,background-color] duration-200",
          "border-slate-200/90 hover:border-slate-300/90 hover:bg-white",
          open && "border-brand-200/80 bg-white shadow-sm ring-2 ring-brand-500/15",
        )}
      >
        <svg
          className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-brand-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          id={variant === "desktop" ? "header-search" : "header-search-mobile"}
          type="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search tools…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-slate-400 focus:outline-none"
        />
        {variant === "desktop" && (
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 lg:inline">
            /
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          className={cn(
            "absolute z-[60] mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/5 ring-1 ring-black/[0.03]",
            "left-0 right-0 transition-opacity duration-150",
          )}
          role="listbox"
          aria-label={mode === "popular" ? "Popular tools" : "Search results"}
        >
          <div className="border-b border-slate-100 bg-slate-50/90 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {mode === "popular"
                ? "Popular tools"
                : trimmed.length === 1
                  ? "Suggestions"
                  : `Results for “${trimmed}”`}
            </p>
            {mode === "search" && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                Updates as you type
              </p>
            )}
          </div>

          {mode === "search" && rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              No tools match “{trimmed}”. Try another keyword.
            </p>
          ) : (
            <ul className="max-h-[min(70vh,22rem)] overflow-y-auto py-1.5">
              {rows.map((t) => (
                <li key={t.slug} role="option">
                  <Link
                    href={`/tools/${t.slug}`}
                    onClick={handlePick}
                    className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-brand-50/80"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                      {t.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-text-primary">
                        {t.title}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                        {t.description}
                      </span>
                      <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {CATEGORY_LABEL[t.category]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2">
            <Link
              href="/#all-tools"
              onClick={handlePick}
              className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              Browse all tools →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

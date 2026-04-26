"use client";

import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { TocItem } from "@/lib/blog-toc";
import { cn } from "@/lib/utils";

const SCROLL_OFFSET_PX = 120;

/** Flex children need minHeight:0 or max-height + overflow-y won't create a scrollport. */
const tocListScrollStyle: CSSProperties = {
  minHeight: 0,
  maxHeight: "min(320px, 50vh)",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehaviorY: "contain",
  WebkitOverflowScrolling: "touch",
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  try {
    history.replaceState(null, "", `#${id}`);
  } catch {
    /* ignore */
  }
}

function pickActiveId(ids: string[]): string | null {
  if (ids.length === 0) return null;
  let current = ids[0];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top <= SCROLL_OFFSET_PX) {
      current = id;
    }
  }
  return current;
}

export default function BlogTableOfContents({ items }: { items: TocItem[] }) {
  const idsKey = items.map((i) => i.id).join("\0");

  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  const onItemClick = useCallback((e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToId(id);
    setActive(id);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const idList = items.map((i) => i.id);

    const onScroll = () => {
      setActive(pickActiveId(idList));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [idsKey, items]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const raw = window.location.hash.slice(1);
    if (raw && items.some((i) => i.id === raw)) {
      requestAnimationFrame(() => scrollToId(raw));
    }
  }, [idsKey, items]);

  if (items.length === 0) return null;

  return (
    <nav
      className="flex min-h-0 max-w-full flex-col rounded-xl border border-slate-200/90 border-r-[4px] border-r-brand-600 bg-white p-0 shadow-md"
      style={{ minHeight: 0 }}
      aria-label="Table of content"
    >
      <h2 className="shrink-0 px-4 pb-0 pt-4 text-sm font-bold text-slate-900 sm:px-5 sm:pt-5">
        Table of Content
      </h2>
      <div
        className={cn("blog-post-toc__scroll", "mt-2 w-full min-w-0 px-2 pb-4 sm:px-3 sm:pb-5")}
        style={tocListScrollStyle}
      >
        <ol className="m-0 list-none space-y-1.5 p-0 text-sm">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => onItemClick(e, item.id)}
                  title={item.text}
                  className={cn(
                    "block w-full truncate border-l-2 py-2 pl-3 pr-2 text-left font-medium transition",
                    item.level === 3 && "pl-5 text-[13px]",
                    isActive
                      ? "border-brand-600 bg-brand-50 text-brand-600"
                      : "border-transparent text-slate-600 hover:bg-slate-50/80 hover:text-brand-600",
                  )}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

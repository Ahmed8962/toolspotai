"use client";

import type { BlogFaqItem } from "@/lib/contentful-blog";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

/**
 * Renders structured FAQs from the Contentful `faqs` object field
 * (`{ "items": [ { "question", "answer" } ] }`) as a single-open accordion.
 */
export default function BlogFaqJson({ faqs }: { faqs: BlogFaqItem[] }) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section
      className="scroll-mt-28 rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-[var(--shadow-soft)] sm:px-8 sm:py-8"
      id="faqs"
      aria-labelledby="blog-faqs-heading"
    >
      <h2
        id="blog-faqs-heading"
        className="text-xl font-bold text-brand-600 sm:text-2xl"
      >
        Frequently asked questions
      </h2>
      <div className="mt-6 space-y-4">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          const qId = `${baseId}-q-${i}`;
          const aId = `${baseId}-a-${i}`;
          return (
            <div
              key={`${item.question.slice(0, 48)}-${i}`}
              className={cn(
                "overflow-hidden rounded-xl border bg-white transition-shadow",
                isOpen
                  ? "border-brand-600 shadow-sm"
                  : "border-slate-200 shadow-sm",
              )}
            >
              <h3 className="m-0 text-base">
                <button
                  type="button"
                  id={qId}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-4 text-left transition sm:px-5",
                    isOpen
                      ? "font-bold text-slate-900"
                      : "font-medium text-slate-900 hover:bg-slate-50/80",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50",
                  )}
                  aria-expanded={isOpen}
                  aria-controls={aId}
                  onClick={() => setOpen((prev) => (prev === i ? null : i))}
                >
                  <span className="min-w-0 flex-1 pr-2">{item.question}</span>
                  <svg
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-brand-600 transition-transform",
                      isOpen && "rotate-180",
                    )}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M4 6L8 10L12 6" />
                  </svg>
                </button>
              </h3>
              <div
                id={aId}
                role="region"
                aria-labelledby={qId}
                hidden={!isOpen}
                className="border-t border-slate-100 bg-slate-50/90 px-4 py-4 text-[0.98rem] leading-7 text-slate-800 sm:px-5"
              >
                <p className="m-0 whitespace-pre-line">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

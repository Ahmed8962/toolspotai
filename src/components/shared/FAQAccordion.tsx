"use client";

import type { FAQItem } from "@/data/tools";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <div className="divide-y divide-slate-100 border-t border-border">
      {items.map((item, i) => {
        const isOpen = open[i];
        return (
          <div key={item.question}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
              onClick={() => setOpen((s) => ({ ...s, [i]: !isOpen }))}
            >
              <span className="font-medium text-text-primary">{item.question}</span>
              <span className="shrink-0 text-lg text-text-muted" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              className={cn(
                "overflow-hidden transition-[max-height] duration-300 ease-in-out",
                isOpen ? "max-h-[800px]" : "max-h-0",
              )}
            >
              <p className="pb-4 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

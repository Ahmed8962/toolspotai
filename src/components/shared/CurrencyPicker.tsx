"use client";

import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default function CurrencyPicker({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {CURRENCIES.map((c) => (
        <button
          key={c.code}
          type="button"
          onClick={() => onChange(c.code)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
            value === c.code
              ? "bg-brand-600 text-white"
              : "border border-border text-text-secondary hover:bg-surface-muted",
          )}
          title={c.label}
        >
          {c.flag} {c.code}
        </button>
      ))}
    </div>
  );
}

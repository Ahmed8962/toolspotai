"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = 0 | 1 | 2;

export default function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>(0);
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const result = useMemo(() => {
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    if (mode === 0) return (x / 100) * y;
    if (mode === 1) {
      if (y === 0) return null;
      return (x / y) * 100;
    }
    if (x === 0) return null;
    return ((y - x) / Math.abs(x)) * 100;
  }, [a, b, mode]);

  const reset = () => {
    setA("");
    setB("");
  };

  const has = a !== "" || b !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["What is % of number?", 0],
            ["Part is what % of whole?", 1],
            ["% Change", 2],
          ] as const
        ).map(([label, m]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              reset();
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === m
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Percentage
            <input
              type="number"
              inputMode="decimal"
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Number
            <input
              type="number"
              inputMode="decimal"
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
        </div>
      )}

      {mode === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Part
            <input
              type="number"
              inputMode="decimal"
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Whole
            <input
              type="number"
              inputMode="decimal"
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
        </div>
      )}

      {mode === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Old value
            <input
              type="number"
              inputMode="decimal"
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            New value
            <input
              type="number"
              inputMode="decimal"
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
        </div>
      )}

      {result !== null && (
        <div className="animate-[fadeUp_0.35s_ease_both] rounded-xl border border-brand-100 bg-brand-50 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Result
          </p>
          <p className="font-result mt-3 text-3xl font-semibold text-brand-600">
            {mode === 0 && result.toLocaleString("en-US", { maximumFractionDigits: 6 })}
            {mode === 1 && `${result.toLocaleString("en-US", { maximumFractionDigits: 6 })}%`}
            {mode === 2 &&
              `${result >= 0 ? "+" : ""}${result.toLocaleString("en-US", { maximumFractionDigits: 4 })}%`}
          </p>
        </div>
      )}

      {has && (
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
        >
          Reset
        </button>
      )}
    </div>
  );
}

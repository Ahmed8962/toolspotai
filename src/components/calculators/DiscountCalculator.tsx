"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";

type Mode = 0 | 1 | 2;

const quick = [5, 10, 15, 20, 25, 30, 40, 50, 70];

export default function DiscountCalculator() {
  const [mode, setMode] = useState<Mode>(0);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [orig, setOrig] = useState("");
  const [disc, setDisc] = useState("");
  const [sale, setSale] = useState("");
  const fmt = (n: number) => formatMoney(n, currency);

  const out = useMemo(() => {
    const o = parseFloat(orig);
    const d = parseFloat(disc);
    const s = parseFloat(sale);
    if (mode === 0) {
      if (Number.isNaN(o) || Number.isNaN(d)) return null;
      const salePrice = o * (1 - d / 100);
      return { salePrice, save: o - salePrice, discountPct: d };
    }
    if (mode === 1) {
      if (Number.isNaN(o) || Number.isNaN(s) || o === 0) return null;
      const save = o - s;
      return { salePrice: s, save, discountPct: (save / o) * 100 };
    }
    if (mode === 2) {
      if (Number.isNaN(s) || Number.isNaN(d) || d >= 100) return null;
      const original = s / (1 - d / 100);
      return { original, save: original - s, salePrice: s, discountPct: d };
    }
    return null;
  }, [mode, orig, disc, sale]);

  const reset = () => {
    setOrig("");
    setDisc("");
    setSale("");
  };

  return (
    <div className="space-y-6">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Find sale price", 0],
            ["Find discount %", 1],
            ["Find original price", 2],
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
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              Original price
              <input
                type="number"
                inputMode="decimal"
                value={orig}
                onChange={(e) => setOrig(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            <label className="block text-sm text-text-secondary">
              Discount (%)
              <input
                type="number"
                inputMode="decimal"
                value={disc}
                onChange={(e) => setDisc(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {quick.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDisc(String(p))}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium",
                  String(disc) === String(p)
                    ? "bg-brand-600 text-white"
                    : "bg-surface-muted text-text-secondary hover:bg-slate-200",
                )}
              >
                {p}%
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Original price
            <input
              type="number"
              inputMode="decimal"
              value={orig}
              onChange={(e) => setOrig(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Sale price
            <input
              type="number"
              inputMode="decimal"
              value={sale}
              onChange={(e) => setSale(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
        </div>
      )}

      {mode === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Sale price
            <input
              type="number"
              inputMode="decimal"
              value={sale}
              onChange={(e) => setSale(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Discount (%)
            <input
              type="number"
              inputMode="decimal"
              value={disc}
              onChange={(e) => setDisc(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
        </div>
      )}

      {out && (
        <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center font-result text-xl font-semibold text-emerald-800">
            You save {fmt(out.save)}
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {mode === 0 && "Sale price"}
              {mode === 1 && "Discount %"}
              {mode === 2 && "Original price"}
            </p>
            <p className="font-result mt-3 text-4xl font-semibold text-brand-700">
              {mode === 0 && fmt(out.salePrice)}
              {mode === 1 && `${out.discountPct.toFixed(2)}%`}
              {mode === 2 && fmt((out as { original: number }).original)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

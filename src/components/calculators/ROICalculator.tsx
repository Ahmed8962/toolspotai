"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Result = {
  invested: number;
  returned: number;
  gain: number;
  roi: number;
  annualizedRoi: number;
  years: number;
};

function calculate(
  invested: number,
  returned: number,
  years: number,
): Result | null {
  if (invested <= 0 || returned < 0 || years <= 0) return null;
  const gain = returned - invested;
  const roi = (gain / invested) * 100;
  // Annualized ROI = ((returned / invested) ^ (1/years) - 1) * 100
  const annualizedRoi = (Math.pow(returned / invested, 1 / years) - 1) * 100;
  return { invested, returned, gain, roi, annualizedRoi, years };
}

function DonutChart({
  slices,
  fmt,
}: {
  slices: { label: string; value: number; color: string }[];
  fmt: (n: number) => string;
}) {
  const total = slices.reduce((s, c) => s + Math.abs(c.value), 0);
  if (total <= 0) return null;
  let acc = 0;
  const stops: string[] = [];
  for (const s of slices) {
    const pct = (Math.abs(s.value) / total) * 100;
    stops.push(`${s.color} ${acc}% ${acc + pct}%`);
    acc += pct;
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div
        className="relative h-[160px] w-[160px] shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <div className="grid gap-1.5 text-sm text-text-secondary">
        {slices.map((s) => (
          <p key={s.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}: <span className="font-result font-semibold">{fmt(Math.abs(s.value))}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [invested, setInvested] = useState("1000");
  const [returned, setReturned] = useState("1200");
  const [years, setYears] = useState("1");

  const fmt = (n: number) => formatMoney(n, currency);

  const inv = parseFloat(invested) || 0;
  const ret = parseFloat(returned) || 0;
  const yr = parseFloat(years) || 0;

  const result = useMemo(() => calculate(inv, ret, yr), [inv, ret, yr]);

  const donutSlices = result
    ? [
        { label: "Investment", value: result.invested, color: "#2563eb" },
        {
          label: result.gain >= 0 ? "Gain" : "Loss",
          value: result.gain,
          color: result.gain >= 0 ? "#10b981" : "#ef4444",
        },
      ]
    : [];

  const inputCls =
    "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Enter your investment details
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm text-text-secondary">
            Amount invested
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              className={inputCls}
              placeholder="e.g. 1000"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Amount returned
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={returned}
              onChange={(e) => setReturned(e.target.value)}
              className={inputCls}
              placeholder="e.g. 1200"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Investment time (years)
            <input
              type="number"
              inputMode="decimal"
              min={0.1}
              step={0.1}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className={inputCls}
              placeholder="e.g. 1"
            />
          </label>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              Return on Investment
            </p>
            <p
              className={cn(
                "font-result text-4xl font-semibold",
                result.roi >= 0 ? "text-emerald-700" : "text-red-600",
              )}
            >
              {result.roi >= 0 ? "+" : ""}
              {result.roi.toFixed(2)}%
            </p>
          </div>

          {/* Donut chart */}
          <DonutChart slices={donutSlices} fmt={fmt} />

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Amount invested</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmt(result.invested)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Amount returned</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmt(result.returned)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">
                Investment {result.gain >= 0 ? "gain" : "loss"}
              </p>
              <p
                className={cn(
                  "font-result mt-0.5 text-lg font-semibold",
                  result.gain >= 0 ? "text-emerald-700" : "text-red-600",
                )}
              >
                {result.gain >= 0 ? "+" : ""}
                {fmt(result.gain)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">ROI</p>
              <p
                className={cn(
                  "font-result mt-0.5 text-lg font-semibold",
                  result.roi >= 0 ? "text-emerald-700" : "text-red-600",
                )}
              >
                {result.roi >= 0 ? "+" : ""}
                {result.roi.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Annualized ROI</p>
              <p
                className={cn(
                  "font-result mt-0.5 text-lg font-semibold",
                  result.annualizedRoi >= 0 ? "text-emerald-700" : "text-red-600",
                )}
              >
                {result.annualizedRoi >= 0 ? "+" : ""}
                {result.annualizedRoi.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Investment length</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {result.years} {result.years === 1 ? "year" : "years"}
              </p>
            </div>
          </div>

          {/* Formula breakdown */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Calculation breakdown</p>
            <div className="space-y-1 text-text-muted">
              <p>
                Gain = Amount Returned &minus; Amount Invested = {fmt(result.returned)} &minus;{" "}
                {fmt(result.invested)} ={" "}
                <span className={result.gain >= 0 ? "text-emerald-700" : "text-red-600"}>
                  {fmt(result.gain)}
                </span>
              </p>
              <p>
                ROI = (Gain &divide; Cost) &times; 100 = ({fmt(result.gain)} &divide;{" "}
                {fmt(result.invested)}) &times; 100 ={" "}
                <span className="font-semibold">{result.roi.toFixed(2)}%</span>
              </p>
              <p>
                Annualized ROI = ((Returned &divide; Invested)^(1/{result.years}) &minus; 1)
                &times; 100 ={" "}
                <span className="font-semibold">{result.annualizedRoi.toFixed(2)}%</span>
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            ROI = (Gain from Investment &minus; Cost of Investment) &divide; Cost of
            Investment. Annualized ROI adjusts for the investment time period using
            the CAGR formula. Past performance does not guarantee future results.
          </p>
        </div>
      )}
    </div>
  );
}

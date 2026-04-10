"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "costRevenue" | "costMargin" | "costMarkup";

const MODES: { value: Mode; label: string; desc: string }[] = [
  { value: "costRevenue", label: "Cost & Revenue", desc: "Enter cost and revenue to find margin, markup, and profit" },
  { value: "costMargin", label: "Cost & Margin", desc: "Enter cost and desired profit margin % to find revenue" },
  { value: "costMarkup", label: "Cost & Markup", desc: "Enter cost and markup % to find revenue and margin" },
];

type Result = {
  cost: number;
  revenue: number;
  profit: number;
  margin: number;
  markup: number;
};

function calculate(mode: Mode, a: number, b: number): Result | null {
  if (a < 0) return null;
  if (mode === "costRevenue") {
    const cost = a;
    const revenue = b;
    if (revenue <= 0) return null;
    const profit = revenue - cost;
    const margin = (profit / revenue) * 100;
    const markup = cost > 0 ? (profit / cost) * 100 : Infinity;
    return { cost, revenue, profit, margin, markup: isFinite(markup) ? markup : 0 };
  }
  if (mode === "costMargin") {
    const cost = a;
    const margin = b;
    if (margin >= 100) return null;
    const revenue = cost / (1 - margin / 100);
    const profit = revenue - cost;
    const markup = cost > 0 ? (profit / cost) * 100 : 0;
    return { cost, revenue, profit, margin, markup };
  }
  // costMarkup
  const cost = a;
  const markupPct = b;
  const revenue = cost * (1 + markupPct / 100);
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return { cost, revenue, profit, margin, markup: markupPct };
}

function DonutChart({
  slices,
  fmt,
}: {
  slices: { label: string; value: number; color: string }[];
  fmt: (n: number) => string;
}) {
  const total = slices.reduce((s, c) => s + c.value, 0);
  if (total <= 0) return null;
  let acc = 0;
  const stops: string[] = [];
  for (const s of slices) {
    const pct = (s.value / total) * 100;
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
        {slices
          .filter((s) => s.value > 0)
          .map((s) => (
            <p key={s.label} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}: <span className="font-result font-semibold">{fmt(s.value)}</span>
            </p>
          ))}
      </div>
    </div>
  );
}

export default function ProfitMarginCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [mode, setMode] = useState<Mode>("costRevenue");
  const [fieldA, setFieldA] = useState("20");
  const [fieldB, setFieldB] = useState("25");

  const fmt = (n: number) => formatMoney(n, currency);

  const a = parseFloat(fieldA) || 0;
  const b = parseFloat(fieldB) || 0;

  const result = useMemo(() => calculate(mode, a, b), [mode, a, b]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setFieldA("20");
    if (m === "costRevenue") setFieldB("25");
    else if (m === "costMargin") setFieldB("15");
    else setFieldB("25");
  };

  const donutSlices = result && result.revenue > 0
    ? [
        { label: "Cost", value: result.cost, color: "#ef4444" },
        { label: "Profit", value: Math.max(0, result.profit), color: "#10b981" },
      ]
    : [];

  const inputCls =
    "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  const labelA = "Cost";
  const labelB =
    mode === "costRevenue" ? "Revenue" : mode === "costMargin" ? "Profit Margin (%)" : "Markup (%)";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => switchMode(m.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === m.value
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          {MODES.find((m) => m.value === mode)?.desc}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            {labelA}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={fieldA}
              onChange={(e) => setFieldA(e.target.value)}
              className={inputCls}
              placeholder="e.g. 20"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            {labelB}
            <input
              type="number"
              inputMode="decimal"
              value={fieldB}
              onChange={(e) => setFieldB(e.target.value)}
              className={inputCls}
              placeholder={mode === "costRevenue" ? "e.g. 25" : "e.g. 15"}
            />
          </label>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <DonutChart slices={donutSlices} fmt={fmt} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Cost</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.cost)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Revenue (selling price)</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.revenue)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Profit</p>
              <p className={cn("font-result mt-0.5 text-lg font-semibold", result.profit >= 0 ? "text-emerald-700" : "text-red-600")}>
                {fmt(result.profit)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Profit margin</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {result.margin.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Markup</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {result.markup.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Formulas */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Formulas used</p>
            <div className="space-y-1 text-text-muted">
              <p>Profit = Revenue &minus; Cost = {fmt(result.revenue)} &minus; {fmt(result.cost)} = {fmt(result.profit)}</p>
              <p>Margin = (Profit &divide; Revenue) &times; 100 = ({fmt(result.profit)} &divide; {fmt(result.revenue)}) &times; 100 = {result.margin.toFixed(2)}%</p>
              <p>Markup = (Profit &divide; Cost) &times; 100 = ({fmt(result.profit)} &divide; {fmt(result.cost)}) &times; 100 = {result.markup.toFixed(2)}%</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Profit margin is the percentage of revenue that is profit.
            Markup is the percentage added to cost to get the selling price.
            A 50% markup is a 33.3% margin. A 100% markup is a 50% margin.
          </p>
        </div>
      )}
    </div>
  );
}

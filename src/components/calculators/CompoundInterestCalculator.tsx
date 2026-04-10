"use client";

import {
  COMPOUND_OPTIONS,
  type CompoundFrequency,
  computeCompoundInterest,
} from "@/lib/compound-interest";
import { type CurrencyCode, formatMoney, formatNum } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const presets = {
  beginner: {
    principal: 1_000,
    monthly: 100,
    rate: 7,
    years: 10,
    compounding: "monthly" as CompoundFrequency,
    variance: 2,
  },
  moderate: {
    principal: 10_000,
    monthly: 500,
    rate: 8,
    years: 20,
    compounding: "monthly" as CompoundFrequency,
    variance: 2,
  },
  aggressive: {
    principal: 50_000,
    monthly: 1_000,
    rate: 10,
    years: 30,
    compounding: "monthly" as CompoundFrequency,
    variance: 3,
  },
} as const;

/* ─── Growth bar chart (pure CSS) ─── */
function GrowthChart({
  yearly,
  fmt,
}: {
  yearly: { year: number; totalContributions: number; totalInterest: number }[];
  fmt: (n: number) => string;
}) {
  if (yearly.length === 0) return null;
  const maxVal = Math.max(
    ...yearly.map((r) => r.totalContributions + r.totalInterest),
    1,
  );
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-text-primary">
        Growth over time
      </p>
      <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
        {yearly.map((row) => {
          const cPct = (row.totalContributions / maxVal) * 100;
          const iPct = (row.totalInterest / maxVal) * 100;
          return (
            <div
              key={row.year}
              className="group relative flex flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              title={`Year ${row.year}: contributions ${fmt(row.totalContributions)}, interest ${fmt(row.totalInterest)}, total ${fmt(row.totalContributions + row.totalInterest)}`}
            >
              <div
                className="w-full bg-blue-600"
                style={{ height: `${cPct}%` }}
              />
              <div
                className="w-full rounded-t-[1px] bg-emerald-500"
                style={{ height: `${iPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
        <span>Year 1</span>
        <span>Year {yearly.length}</span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-text-secondary">
        <p>
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600 align-middle" />{" "}
          Contributions
        </p>
        <p>
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500 align-middle" />{" "}
          Interest earned
        </p>
      </div>
    </div>
  );
}

/* ─── Donut chart ─── */
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
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.label}: <span className="font-result font-semibold">{fmt(s.value)}</span>
            </p>
          ))}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function CompoundInterestCalculator() {
  const [preset, setPreset] = useState<keyof typeof presets>("beginner");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [principal, setPrincipal] = useState(String(presets.beginner.principal));
  const [monthly, setMonthly] = useState(String(presets.beginner.monthly));
  const [rate, setRate] = useState(String(presets.beginner.rate));
  const [years, setYears] = useState(String(presets.beginner.years));
  const [compounding, setCompounding] = useState<CompoundFrequency>(
    presets.beginner.compounding,
  );
  const [variance, setVariance] = useState(String(presets.beginner.variance));
  const [showTable, setShowTable] = useState(false);

  const fmt = (n: number) => formatMoney(n, currency);
  const fmtN = (n: number, d = 2) => formatNum(n, currency, d);

  const applyPreset = (k: keyof typeof presets) => {
    setPreset(k);
    const p = presets[k];
    setPrincipal(String(p.principal));
    setMonthly(String(p.monthly));
    setRate(String(p.rate));
    setYears(String(p.years));
    setCompounding(p.compounding);
    setVariance(String(p.variance));
  };

  const p = parseFloat(principal) || 0;
  const m = parseFloat(monthly) || 0;
  const r = parseFloat(rate) || 0;
  const y = parseInt(years, 10) || 0;
  const v = parseFloat(variance) || 0;

  const result = useMemo(() => {
    return computeCompoundInterest({
      principal: p,
      monthlyContribution: m,
      annualRatePercent: r,
      years: y,
      compounding,
      rateVariance: v,
    });
  }, [p, m, r, y, compounding, v]);

  const donutSlices = result
    ? [
        {
          label: "Initial investment",
          value: p,
          color: "#2563eb",
        },
        {
          label: "Total contributions",
          value: result.totalContributions - p,
          color: "#8b5cf6",
        },
        {
          label: "Total interest",
          value: result.totalInterest,
          color: "#10b981",
        },
      ]
    : [];

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Beginner", "beginner"],
            ["Moderate", "moderate"],
            ["Aggressive", "aggressive"],
          ] as const
        ).map(([label, k]) => (
          <button
            key={k}
            type="button"
            onClick={() => applyPreset(k)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              preset === k
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Step 1: Initial Investment ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Step 1: Initial Investment
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Amount of money that you have available to invest initially.
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Initial investment</span>
            <span className="font-result text-brand-700">{fmt(p)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1_000_000}
            step={1000}
            value={Math.min(1_000_000, Math.max(0, p))}
            onChange={(e) => setPrincipal(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 10000"
          />
        </div>
      </div>

      {/* ── Step 2: Contribute ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Step 2: Monthly Contribution
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Amount that you plan to add to the principal every month. A negative
          number for withdrawals.
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Monthly contribution</span>
            <span className="font-result text-brand-700">{fmt(m)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10_000}
            step={50}
            value={Math.min(10_000, Math.max(0, m))}
            onChange={(e) => setMonthly(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 500"
          />
        </div>
      </div>

      {/* ── Step 3: Interest Rate ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Step 3: Interest Rate
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Length of time (years)</span>
              <span className="font-result text-brand-700">{y}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={Math.min(50, Math.max(1, y))}
              onChange={(e) => setYears(e.target.value)}
              className="mt-2 w-full accent-brand-600"
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className={cn(inputCls, "mt-2 h-12")}
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Estimated annual rate (%)</span>
              <span className="font-result text-brand-700">{rate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={0.1}
              value={Math.min(30, Math.max(0, r))}
              onChange={(e) => setRate(e.target.value)}
              className="mt-2 w-full accent-brand-600"
            />
            <input
              type="number"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={cn(inputCls, "mt-2 h-12")}
              placeholder="e.g. 7"
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>
              Interest rate variance range (
              <span className="font-result">&plusmn;{variance}%</span>)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Range of interest rates (above and below the rate set above) that you
            desire to see results for.
          </p>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={Math.min(10, Math.max(0, v))}
            onChange={(e) => setVariance(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={variance}
            onChange={(e) => setVariance(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 2"
          />
        </div>
      </div>

      {/* ── Step 4: Compound It ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Step 4: Compound Frequency
        </p>
        <p className="mt-1 text-xs text-text-muted">
          How often your investment will be compounded.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMPOUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCompounding(opt.value)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                compounding === opt.value
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Results ─── */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              Future value in {y} years
            </p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {fmt(result.futureValue)}
            </p>
          </div>

          {/* Variance range */}
          {v > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-xs text-text-muted">
                  Low estimate ({fmtN(r - v, 1)}%)
                </p>
                <p className="font-result mt-0.5 text-lg font-semibold text-red-700">
                  {fmt(result.futureValueLow)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <p className="text-xs text-text-muted">
                  Base estimate ({fmtN(r, 1)}%)
                </p>
                <p className="font-result mt-0.5 text-lg font-semibold text-blue-700">
                  {fmt(result.futureValue)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-xs text-text-muted">
                  High estimate ({fmtN(r + v, 1)}%)
                </p>
                <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                  {fmt(result.futureValueHigh)}
                </p>
              </div>
            </div>
          )}

          {/* Donut chart */}
          <DonutChart slices={donutSlices} fmt={fmt} />

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Initial investment</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(p)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total contributions</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmt(result.totalContributions)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total interest earned</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                {fmt(result.totalInterest)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Future value</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-brand-700">
                {fmt(result.futureValue)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Interest as % of total</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmtN(
                  result.futureValue > 0
                    ? (result.totalInterest / result.futureValue) * 100
                    : 0,
                  1,
                )}
                %
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Compounding</p>
              <p className="mt-0.5 text-lg font-semibold capitalize">
                {compounding === "semiannually" ? "Semi-annually" : compounding}
              </p>
            </div>
          </div>

          {/* Growth chart */}
          <GrowthChart yearly={result.yearly} fmt={fmt} />

          {/* Yearly breakdown table */}
          <div>
            <button
              type="button"
              onClick={() => setShowTable((s) => !s)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              {showTable ? "Hide" : "Show"} year-by-year breakdown
            </button>
            {showTable && (
              <div className="mt-4 max-h-[400px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface-muted">
                    <tr>
                      <th className="p-2">Year</th>
                      <th className="p-2">Contributions</th>
                      <th className="p-2">Interest (year)</th>
                      <th className="p-2">Total interest</th>
                      <th className="p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly.map((row, i) => (
                      <tr
                        key={row.year}
                        className={i % 2 === 1 ? "bg-surface-muted/60" : ""}
                      >
                        <td className="p-2">{row.year}</td>
                        <td className="p-2 font-result">
                          {fmt(row.totalContributions)}
                        </td>
                        <td className="p-2 font-result">
                          {fmt(row.yearInterest)}
                        </td>
                        <td className="p-2 font-result">
                          {fmt(row.totalInterest)}
                        </td>
                        <td className="p-2 font-result">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Uses the standard compound interest formula with periodic
            contributions. FV = P&times;(1+r/n)<sup>nt</sup> +
            PMT&times;[((1+r/n)<sup>nt</sup>&minus;1)/(r/n)]. Actual returns
            depend on market conditions, fees, and taxes. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

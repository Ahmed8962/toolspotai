"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { type CurrencyCode, formatMoney, formatNum } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";

type Mode = "sip" | "lumpsum";

const AMOUNT_PRESETS = [1_000, 5_000, 10_000, 25_000, 50_000];

const RETURN_PRESETS = [
  { label: "Conservative", rate: 8 },
  { label: "Moderate", rate: 12 },
  { label: "Aggressive", rate: 15 },
  { label: "High Risk", rate: 18 },
] as const;

/* ─── Donut chart (conic-gradient) ─── */
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
              {s.label}:{" "}
              <span className="font-result font-semibold">{fmt(s.value)}</span>
            </p>
          ))}
      </div>
    </div>
  );
}

/* ─── Growth bar chart (pure CSS) ─── */
function GrowthChart({
  yearly,
  fmt,
}: {
  yearly: { year: number; invested: number; returns: number; total: number }[];
  fmt: (n: number) => string;
}) {
  if (yearly.length === 0) return null;
  const maxVal = Math.max(...yearly.map((r) => r.total), 1);
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-text-primary">
        Growth over time
      </p>
      <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
        {yearly.map((row) => {
          const iPct = (row.invested / maxVal) * 100;
          const rPct = (row.returns / maxVal) * 100;
          return (
            <div
              key={row.year}
              className="group relative flex flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              title={`Year ${row.year}: invested ${fmt(row.invested)}, returns ${fmt(row.returns)}, total ${fmt(row.total)}`}
            >
              <div
                className="w-full bg-blue-600"
                style={{ height: `${iPct}%` }}
              />
              <div
                className="w-full rounded-t-[1px] bg-emerald-500"
                style={{ height: `${rPct}%` }}
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
          Invested
        </p>
        <p>
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500 align-middle" />{" "}
          Returns
        </p>
      </div>
    </div>
  );
}

/* ─── Computation helpers ─── */
function computeSIP(
  monthlyAmount: number,
  annualRate: number,
  years: number,
  stepUpPct: number,
) {
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  let totalInvested = 0;
  let balance = 0;
  let currentMonthly = monthlyAmount;
  const yearly: { year: number; invested: number; returns: number; total: number }[] = [];

  for (let m = 1; m <= months; m++) {
    if (stepUpPct > 0 && m > 1 && (m - 1) % 12 === 0) {
      currentMonthly *= 1 + stepUpPct / 100;
    }
    totalInvested += currentMonthly;
    balance = (balance + currentMonthly) * (1 + monthlyRate);

    if (m % 12 === 0) {
      yearly.push({
        year: m / 12,
        invested: totalInvested,
        returns: balance - totalInvested,
        total: balance,
      });
    }
  }

  return { futureValue: balance, totalInvested, returns: balance - totalInvested, yearly };
}

function computeLumpsum(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100;
  const yearly: { year: number; invested: number; returns: number; total: number }[] = [];

  for (let y = 1; y <= years; y++) {
    const total = principal * Math.pow(1 + r, y);
    yearly.push({
      year: y,
      invested: principal,
      returns: total - principal,
      total,
    });
  }

  const futureValue = principal * Math.pow(1 + r, years);
  return { futureValue, totalInvested: principal, returns: futureValue - principal, yearly };
}

/* ─── Main component ─── */
export default function SIPCalculator() {
  const [mode, setMode] = useState<Mode>("sip");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [amount, setAmount] = useState("5000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");
  const [stepUp, setStepUp] = useState("0");
  const [showTable, setShowTable] = useState(false);

  const fmt = (n: number) => formatMoney(n, currency, 0);
  const fmtD = (n: number) => formatMoney(n, currency);
  const fmtN = (n: number, d = 2) => formatNum(n, currency, d);

  const amt = parseFloat(amount) || 0;
  const r = parseFloat(rate) || 0;
  const y = parseInt(years, 10) || 0;
  const su = parseFloat(stepUp) || 0;

  const result = useMemo(() => {
    if (amt <= 0 || r <= 0 || y <= 0) return null;
    return mode === "sip"
      ? computeSIP(amt, r, y, su)
      : computeLumpsum(amt, r, y);
  }, [mode, amt, r, y, su]);

  const wealthRatio =
    result && result.totalInvested > 0
      ? result.futureValue / result.totalInvested
      : 0;

  const donutSlices = result
    ? [
        { label: "Amount invested", value: result.totalInvested, color: "#2563eb" },
        { label: "Estimated returns", value: result.returns, color: "#10b981" },
      ]
    : [];

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-border bg-surface-muted p-1">
        {(
          [
            ["SIP Calculator", "sip"],
            ["Lumpsum Calculator", "lumpsum"],
          ] as const
        ).map(([label, key]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
              mode === key
                ? "bg-brand-600 text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Investment amount */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          {mode === "sip" ? "Monthly Investment Amount" : "One-Time Investment Amount"}
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>{mode === "sip" ? "Monthly amount" : "Investment amount"}</span>
            <span className="font-result text-brand-700">{fmt(amt)}</span>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 5000"
          />
          {mode === "sip" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    amt === p
                      ? "bg-brand-600 text-white"
                      : "border border-border text-text-secondary hover:bg-surface-muted",
                  )}
                >
                  {p.toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expected return rate */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Expected Annual Return Rate
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Annual return</span>
            <span className="font-result text-brand-700">{rate}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={0.5}
            value={Math.min(30, Math.max(1, r))}
            onChange={(e) => setRate(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 12"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {RETURN_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setRate(String(p.rate))}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  r === p.rate
                    ? "bg-brand-600 text-white"
                    : "border border-border text-text-secondary hover:bg-surface-muted",
                )}
              >
                {p.label} ({p.rate}%)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Investment period */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Investment Period
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Duration (years)</span>
            <span className="font-result text-brand-700">
              {y} {y === 1 ? "year" : "years"}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            step={1}
            value={Math.min(40, Math.max(1, y))}
            onChange={(e) => setYears(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={40}
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 10"
          />
        </div>
      </div>

      {/* Step-up SIP (only in SIP mode) */}
      {mode === "sip" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-sm font-medium text-text-primary">
            Step-Up SIP (Annual Increase)
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Increase your monthly investment by this percentage every year to
            accelerate wealth creation.
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Annual step-up</span>
              <span className="font-result text-brand-700">{stepUp}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={Math.min(25, Math.max(0, su))}
              onChange={(e) => setStepUp(e.target.value)}
              className="mt-2 w-full accent-brand-600"
            />
            <input
              type="number"
              inputMode="decimal"
              value={stepUp}
              onChange={(e) => setStepUp(e.target.value)}
              className={cn(inputCls, "mt-2 h-12")}
              placeholder="e.g. 10"
            />
          </div>
        </div>
      )}

      {/* ─── Results ─── */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              {mode === "sip" ? "Future value" : "Maturity value"} in {y}{" "}
              {y === 1 ? "year" : "years"}
            </p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {fmtD(result.futureValue)}
            </p>
          </div>

          {/* Donut chart */}
          <DonutChart slices={donutSlices} fmt={fmt} />

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total invested</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmt(result.totalInvested)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Estimated returns</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                {fmt(result.returns)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total future value</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-brand-700">
                {fmtD(result.futureValue)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Wealth ratio</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-violet-700">
                {fmtN(wealthRatio, 2)}x
              </p>
            </div>
          </div>

          {/* Growth chart */}
          {result.yearly.length > 0 && (
            <GrowthChart yearly={result.yearly} fmt={fmt} />
          )}

          {/* Year-by-year breakdown */}
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
                      <th className="p-2">Invested</th>
                      <th className="p-2">Returns</th>
                      <th className="p-2">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly.map((row, i) => (
                      <tr
                        key={row.year}
                        className={i % 2 === 1 ? "bg-surface-muted/60" : ""}
                      >
                        <td className="p-2">{row.year}</td>
                        <td className="p-2 font-result">{fmt(row.invested)}</td>
                        <td className="p-2 font-result">{fmt(row.returns)}</td>
                        <td className="p-2 font-result">{fmt(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            {mode === "sip"
              ? "SIP calculation uses FV = P \u00d7 [((1 + r)\u207f \u2212 1) / r] \u00d7 (1 + r), where P = monthly amount, r = monthly rate, n = total months."
              : "Lumpsum calculation uses FV = P \u00d7 (1 + r)\u207f, where P = principal, r = annual rate, n = years."}{" "}
            {su > 0 && mode === "sip"
              ? `With a ${su}% annual step-up applied to the monthly investment. `
              : ""}
            Actual returns depend on market conditions, fees, and taxes. Not
            financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

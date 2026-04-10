"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/* ─── Constants ─── */

type FilingStatus = "single" | "married" | "hoh";
type Mode = "hourlyToSalary" | "salaryToHourly";

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married Filing Jointly" },
  { value: "hoh", label: "Head of Household" },
];

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_000,
  married: 30_000,
  hoh: 22_500,
};

const FEDERAL_BRACKETS: Record<FilingStatus, { limit: number; rate: number }[]> = {
  single: [
    { limit: 11_925, rate: 0.10 },
    { limit: 48_475, rate: 0.12 },
    { limit: 103_350, rate: 0.22 },
    { limit: 197_300, rate: 0.24 },
    { limit: 250_525, rate: 0.32 },
    { limit: 626_350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  married: [
    { limit: 23_850, rate: 0.10 },
    { limit: 96_950, rate: 0.12 },
    { limit: 206_700, rate: 0.22 },
    { limit: 394_600, rate: 0.24 },
    { limit: 501_050, rate: 0.32 },
    { limit: 752_800, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  hoh: [
    { limit: 17_000, rate: 0.10 },
    { limit: 64_850, rate: 0.12 },
    { limit: 103_350, rate: 0.22 },
    { limit: 197_300, rate: 0.24 },
    { limit: 250_500, rate: 0.32 },
    { limit: 626_350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
};

const SS_WAGE_CAP = 176_100;
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;

const STATE_TAX_RATES: { label: string; rate: number }[] = [
  { label: "No State Tax (TX, FL, WA…)", rate: 0 },
  { label: "California – 9.3%", rate: 9.3 },
  { label: "New York – 6.85%", rate: 6.85 },
  { label: "New Jersey – 6.37%", rate: 6.37 },
  { label: "Illinois – 4.95%", rate: 4.95 },
  { label: "Pennsylvania – 3.07%", rate: 3.07 },
  { label: "Ohio – 3.5%", rate: 3.5 },
  { label: "Georgia – 5.49%", rate: 5.49 },
  { label: "North Carolina – 4.5%", rate: 4.5 },
  { label: "Virginia – 5.75%", rate: 5.75 },
  { label: "Massachusetts – 5.0%", rate: 5.0 },
  { label: "Michigan – 4.25%", rate: 4.25 },
  { label: "Colorado – 4.4%", rate: 4.4 },
  { label: "Arizona – 2.5%", rate: 2.5 },
  { label: "Minnesota – 7.85%", rate: 7.85 },
  { label: "Oregon – 8.75%", rate: 8.75 },
  { label: "Maryland – 5.0%", rate: 5.0 },
  { label: "Wisconsin – 5.3%", rate: 5.3 },
];

/* ─── Helpers ─── */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(n: number) {
  return usd.format(n);
}

function calcFederalTax(taxableIncome: number, filing: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = FEDERAL_BRACKETS[filing];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome, b.limit) - prev;
    tax += chunk * b.rate;
    prev = b.limit;
  }
  return tax;
}

function getMarginalRate(taxableIncome: number, filing: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = FEDERAL_BRACKETS[filing];
  for (const b of brackets) {
    if (taxableIncome <= b.limit) return b.rate * 100;
  }
  return 37;
}

function calcSS(gross: number): number {
  return Math.min(gross, SS_WAGE_CAP) * SS_RATE;
}

function calcMedicare(gross: number): number {
  return gross * MEDICARE_RATE;
}

/* ─── Component ─── */

export default function PaycheckCalculator() {
  const [mode, setMode] = useState<Mode>("hourlyToSalary");

  // Mode 1: Hourly → Salary
  const [hourlyRate, setHourlyRate] = useState("25");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [weeksPerYear, setWeeksPerYear] = useState("52");

  // Mode 2: Salary → Hourly
  const [annualSalary, setAnnualSalary] = useState("60000");

  // Tax section
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [stateIdx, setStateIdx] = useState(0);

  // Overtime
  const [overtimeHours, setOvertimeHours] = useState("0");

  const hr = parseFloat(hourlyRate) || 0;
  const hpw = parseFloat(hoursPerWeek) || 0;
  const wpy = parseFloat(weeksPerYear) || 0;
  const sal = parseFloat(annualSalary) || 0;
  const ot = parseFloat(overtimeHours) || 0;

  const results = useMemo(() => {
    let grossAnnual: number;
    let effectiveHourly: number;
    let regularWeeklyHours: number;

    if (mode === "hourlyToSalary") {
      regularWeeklyHours = Math.min(hpw, 40);
      const otHours = Math.max(0, hpw - 40) + ot;
      const regularAnnual = hr * regularWeeklyHours * wpy;
      const otAnnual = hr * 1.5 * otHours * wpy;
      grossAnnual = regularAnnual + otAnnual;
      effectiveHourly = hr;
    } else {
      grossAnnual = sal;
      regularWeeklyHours = 40;
      const totalWeeklyHours = 40 + ot;
      const regularPortion = sal;
      const impliedHourly = sal / (40 * 52);
      const otAnnual = impliedHourly * 1.5 * ot * 52;
      grossAnnual = regularPortion + otAnnual;
      effectiveHourly = impliedHourly;
    }

    if (grossAnnual <= 0) return null;

    const deduction = STANDARD_DEDUCTION[filing];
    const taxableIncome = Math.max(0, grossAnnual - deduction);
    const federalTax = calcFederalTax(taxableIncome, filing);
    const stateRate = STATE_TAX_RATES[stateIdx].rate;
    const stateTax = taxableIncome * (stateRate / 100);
    const ss = calcSS(grossAnnual);
    const medicare = calcMedicare(grossAnnual);
    const totalDeductions = federalTax + stateTax + ss + medicare;
    const netAnnual = grossAnnual - totalDeductions;
    const effectiveRate = grossAnnual > 0 ? (totalDeductions / grossAnnual) * 100 : 0;
    const marginalRate = getMarginalRate(taxableIncome, filing);

    const otHours =
      mode === "hourlyToSalary" ? Math.max(0, hpw - 40) + ot : ot;
    const otAnnual =
      mode === "hourlyToSalary"
        ? effectiveHourly * 1.5 * otHours * wpy
        : effectiveHourly * 1.5 * ot * 52;

    return {
      grossAnnual,
      grossMonthly: grossAnnual / 12,
      grossBiweekly: grossAnnual / 26,
      grossWeekly: grossAnnual / 52,
      effectiveHourly,
      netAnnual,
      netMonthly: netAnnual / 12,
      netBiweekly: netAnnual / 26,
      netWeekly: netAnnual / 52,
      federalTax,
      stateTax,
      ss,
      medicare,
      totalDeductions,
      effectiveRate,
      marginalRate,
      taxableIncome,
      deduction,
      overtimeAnnual: otAnnual,
      overtimeHoursPerWeek: otHours,
    };
  }, [mode, hr, hpw, wpy, sal, filing, stateIdx, ot]);

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* ── Mode tabs ── */}
      <div className="flex gap-2">
        {(
          [
            { value: "hourlyToSalary", label: "Hourly → Salary" },
            { value: "salaryToHourly", label: "Salary → Hourly" },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setMode(t.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === t.value
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Input section ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          {mode === "hourlyToSalary" ? "Hourly Pay Details" : "Annual Salary"}
        </p>

        {mode === "hourlyToSalary" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm text-text-secondary">
              Hourly rate ($)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.25}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className={inputCls}
                placeholder="e.g. 25"
              />
            </label>
            <label className="block text-sm text-text-secondary">
              Hours per week
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={168}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                className={inputCls}
                placeholder="40"
              />
            </label>
            <label className="block text-sm text-text-secondary">
              Weeks per year
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={52}
                value={weeksPerYear}
                onChange={(e) => setWeeksPerYear(e.target.value)}
                className={inputCls}
                placeholder="52"
              />
            </label>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm text-text-secondary">
              Annual salary ($)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={annualSalary}
                onChange={(e) => setAnnualSalary(e.target.value)}
                className={inputCls}
                placeholder="e.g. 60000"
              />
            </label>
          </div>
        )}
      </div>

      {/* ── Overtime ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Overtime (optional)
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Extra hours beyond 40/week paid at 1.5× your regular rate.
        </p>
        <div className="mt-3 max-w-xs">
          <label className="block text-sm text-text-secondary">
            Overtime hours per week
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={80}
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              className={inputCls}
              placeholder="0"
            />
          </label>
        </div>
      </div>

      {/* ── Tax estimation ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Tax Estimation (2025)
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Federal brackets with standard deduction, Social Security, and
          Medicare.
        </p>

        {/* Filing status */}
        <div className="mt-4">
          <p className="mb-2 text-sm text-text-secondary">Filing status</p>
          <div className="flex flex-wrap gap-2">
            {FILING_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFiling(f.value)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  filing === f.value
                    ? "bg-brand-600 text-white"
                    : "border border-border text-text-secondary hover:bg-surface-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* State selector */}
        <div className="mt-4 max-w-sm">
          <label className="block text-sm text-text-secondary">
            State income tax
            <select
              value={stateIdx}
              onChange={(e) => setStateIdx(Number(e.target.value))}
              className={inputCls}
            >
              {STATE_TAX_RATES.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ─── Results ─── */}
      {results && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              {mode === "hourlyToSalary"
                ? "Estimated Annual Salary"
                : "Equivalent Hourly Rate"}
            </p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {mode === "hourlyToSalary"
                ? fmt(results.grossAnnual)
                : fmt(results.effectiveHourly)}
              {mode === "salaryToHourly" && (
                <span className="text-lg font-normal text-text-secondary">
                  {" "}
                  / hr
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Take-home:{" "}
              <span className="font-result font-semibold text-emerald-700">
                {fmt(results.netAnnual)}
              </span>{" "}
              / year
            </p>
          </div>

          {/* Gross pay breakdown cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Annual", results.grossAnnual],
                ["Monthly", results.grossMonthly],
                ["Bi-weekly", results.grossBiweekly],
                ["Weekly", results.grossWeekly],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="rounded-xl bg-surface-muted p-4">
                <p className="text-xs text-text-muted">Gross {label}</p>
                <p className="font-result mt-0.5 text-lg font-semibold">
                  {fmt(val)}
                </p>
              </div>
            ))}
          </div>

          {/* Net pay breakdown cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Annual", results.netAnnual],
                ["Monthly", results.netMonthly],
                ["Bi-weekly", results.netBiweekly],
                ["Weekly", results.netWeekly],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="rounded-xl bg-surface-muted p-4">
                <p className="text-xs text-text-muted">Net {label}</p>
                <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                  {fmt(val)}
                </p>
              </div>
            ))}
          </div>

          {/* Tax breakdown stacked bar */}
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-medium text-text-primary">
              Tax Breakdown
            </p>
            <TaxBar
              slices={[
                {
                  label: "Take-home",
                  value: results.netAnnual,
                  color: "#10b981",
                },
                {
                  label: "Federal Tax",
                  value: results.federalTax,
                  color: "#2563eb",
                },
                ...(results.stateTax > 0
                  ? [
                      {
                        label: `State Tax (${STATE_TAX_RATES[stateIdx].rate}%)`,
                        value: results.stateTax,
                        color: "#7c3aed",
                      },
                    ]
                  : []),
                {
                  label: "Social Security",
                  value: results.ss,
                  color: "#f59e0b",
                },
                { label: "Medicare", value: results.medicare, color: "#ef4444" },
              ]}
              total={results.grossAnnual}
            />
          </div>

          {/* Rate cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Effective Tax Rate</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {results.effectiveRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Marginal Tax Rate</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {results.marginalRate.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Standard Deduction</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmt(results.deduction)}
              </p>
            </div>
          </div>

          {/* Deduction line items */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">
              Annual Deduction Breakdown
            </p>
            {(
              [
                ["Federal income tax", results.federalTax],
                ...(results.stateTax > 0
                  ? [
                      [
                        `State income tax (${STATE_TAX_RATES[stateIdx].rate}%)`,
                        results.stateTax,
                      ] as const,
                    ]
                  : []),
                [`Social Security (6.2% up to ${fmt(SS_WAGE_CAP)})`, results.ss],
                ["Medicare (1.45%)", results.medicare],
              ] as [string, number][]
            ).map(([label, val], i, arr) => (
              <div
                key={label}
                className={cn(
                  "flex justify-between py-2",
                  i < arr.length - 1 && "border-b border-border/80",
                )}
              >
                <span className="text-text-muted">{label}</span>
                <span className="font-result text-red-600">-{fmt(val)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-border py-2 font-medium">
              <span className="text-text-primary">Total deductions</span>
              <span className="font-result text-red-600">
                -{fmt(results.totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between py-2 font-medium">
              <span className="text-text-primary">Net take-home</span>
              <span className="font-result text-emerald-700">
                {fmt(results.netAnnual)}
              </span>
            </div>
          </div>

          {/* Overtime summary */}
          {results.overtimeHoursPerWeek > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                Overtime Summary
              </p>
              <p className="mt-1 text-sm text-amber-800">
                {results.overtimeHoursPerWeek} overtime hrs/week at 1.5×
                rate ({fmt(results.effectiveHourly * 1.5)}/hr) adds{" "}
                <span className="font-result font-semibold">
                  {fmt(results.overtimeAnnual)}
                </span>{" "}
                to your annual gross.
              </p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-text-muted">
            Uses 2025 IRS federal tax brackets, standard deduction ($
            {STANDARD_DEDUCTION[filing].toLocaleString()} for{" "}
            {FILING_OPTIONS.find((f) => f.value === filing)?.label}), and FICA
            rates (SS 6.2% on first $176,100, Medicare 1.45%). State tax is a
            flat-rate estimate. Does not account for tax credits, itemized
            deductions, AMT, or additional Medicare tax. For reference only —
            consult a tax professional.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Stacked bar chart ─── */

function TaxBar({
  slices,
  total,
}: {
  slices: { label: string; value: number; color: string }[];
  total: number;
}) {
  if (total <= 0) return null;
  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="flex h-8 overflow-hidden rounded-lg">
        {slices.map((s) => {
          const pct = (s.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.label}
              className="transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              title={`${s.label}: ${fmt(s.value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-text-secondary">
        {slices
          .filter((s) => s.value > 0)
          .map((s) => (
            <p key={s.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.label}:{" "}
              <span className="font-result font-semibold">{fmt(s.value)}</span>
              <span className="text-text-muted">
                ({((s.value / total) * 100).toFixed(1)}%)
              </span>
            </p>
          ))}
      </div>
    </div>
  );
}

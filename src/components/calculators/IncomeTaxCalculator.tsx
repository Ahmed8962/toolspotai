"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════ US 2025 Federal Tax ═══════════════════ */

type FilingStatus = "single" | "marriedJoint" | "marriedSeparate" | "headOfHousehold";

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married Filing Jointly" },
  { value: "marriedSeparate", label: "Married Filing Separately" },
  { value: "headOfHousehold", label: "Head of Household" },
];

type Bracket = { upTo: number; rate: number };

const US_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { upTo: 11_925, rate: 0.10 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  marriedJoint: [
    { upTo: 23_850, rate: 0.10 },
    { upTo: 96_950, rate: 0.12 },
    { upTo: 206_700, rate: 0.22 },
    { upTo: 394_600, rate: 0.24 },
    { upTo: 501_050, rate: 0.32 },
    { upTo: 751_600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  marriedSeparate: [
    { upTo: 11_925, rate: 0.10 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 375_800, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  headOfHousehold: [
    { upTo: 17_000, rate: 0.10 },
    { upTo: 64_850, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_500, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

const US_STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_000,
  marriedJoint: 30_000,
  marriedSeparate: 15_000,
  headOfHousehold: 22_500,
};

const SS_WAGE_CAP = 176_100;
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const MEDICARE_ADDITIONAL_THRESHOLD: Record<FilingStatus, number> = {
  single: 200_000,
  marriedJoint: 250_000,
  marriedSeparate: 125_000,
  headOfHousehold: 200_000,
};
const MEDICARE_ADDITIONAL_RATE = 0.009;

/* ═══════════════════ UK 2025/26 Tax ═══════════════════ */

const UK_PERSONAL_ALLOWANCE = 12_570;
const UK_ALLOWANCE_TAPER_START = 100_000;

const UK_BRACKETS: Bracket[] = [
  { upTo: 37_700, rate: 0.20 },
  { upTo: 125_140, rate: 0.40 },
  { upTo: Infinity, rate: 0.45 },
];

const UK_NI_THRESHOLD = 12_570;
const UK_NI_UPPER = 50_270;
const UK_NI_RATE = 0.08;
const UK_NI_UPPER_RATE = 0.02;

/* ═══════════════════ Calculation ═══════════════════ */

type TaxCountry = "US" | "UK";

function calcProgressiveTax(taxable: number, brackets: Bracket[]): { total: number; perBracket: { rate: number; amount: number; taxable: number }[] } {
  let remaining = Math.max(0, taxable);
  let total = 0;
  let prev = 0;
  const perBracket: { rate: number; amount: number; taxable: number }[] = [];
  for (const b of brackets) {
    const width = b.upTo - prev;
    const inBracket = Math.min(remaining, width);
    const tax = inBracket * b.rate;
    total += tax;
    remaining -= inBracket;
    if (inBracket > 0) perBracket.push({ rate: b.rate, amount: tax, taxable: inBracket });
    prev = b.upTo;
    if (remaining <= 0) break;
  }
  return { total, perBracket };
}

function calcUS(income: number, filing: FilingStatus, stateRate: number, deductionOverride: string) {
  const standardDed = US_STANDARD_DEDUCTION[filing];
  const deduction = deductionOverride ? parseFloat(deductionOverride) || 0 : standardDed;
  const taxableIncome = Math.max(0, income - deduction);
  const { total: federalTax, perBracket } = calcProgressiveTax(taxableIncome, US_BRACKETS[filing]);

  const ss = Math.min(income, SS_WAGE_CAP) * SS_RATE;
  const mediThreshold = MEDICARE_ADDITIONAL_THRESHOLD[filing];
  const mediBase = income * MEDICARE_RATE;
  const mediAdditional = income > mediThreshold ? (income - mediThreshold) * MEDICARE_ADDITIONAL_RATE : 0;
  const medicare = mediBase + mediAdditional;
  const fica = ss + medicare;

  const stateTax = income * (stateRate / 100);
  const totalTax = federalTax + fica + stateTax;
  const takeHome = income - totalTax;
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;
  const marginalRate = perBracket.length > 0 ? perBracket[perBracket.length - 1].rate * 100 : 0;

  return {
    income, deduction, taxableIncome, federalTax, perBracket,
    ss, medicare, fica, stateTax, totalTax, takeHome, effectiveRate, marginalRate,
  };
}

function calcUK(income: number) {
  let personalAllowance = UK_PERSONAL_ALLOWANCE;
  if (income > UK_ALLOWANCE_TAPER_START) {
    const reduction = Math.floor((income - UK_ALLOWANCE_TAPER_START) / 2);
    personalAllowance = Math.max(0, personalAllowance - reduction);
  }
  const taxableIncome = Math.max(0, income - personalAllowance);
  const { total: incomeTax, perBracket } = calcProgressiveTax(taxableIncome, UK_BRACKETS);

  let ni = 0;
  if (income > UK_NI_THRESHOLD) {
    const lower = Math.min(income, UK_NI_UPPER) - UK_NI_THRESHOLD;
    ni += lower * UK_NI_RATE;
    if (income > UK_NI_UPPER) {
      ni += (income - UK_NI_UPPER) * UK_NI_UPPER_RATE;
    }
  }

  const totalTax = incomeTax + ni;
  const takeHome = income - totalTax;
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;
  const marginalRate = perBracket.length > 0 ? perBracket[perBracket.length - 1].rate * 100 : 0;

  return {
    income, personalAllowance, taxableIncome, incomeTax, perBracket,
    ni, totalTax, takeHome, effectiveRate, marginalRate,
  };
}

/* ═══════════════════ Component ═══════════════════ */

function DonutChart({ slices, fmt }: { slices: { label: string; value: number; color: string }[]; fmt: (n: number) => string }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  let cumPct = 0;
  const stops = slices.map((sl) => {
    const start = cumPct;
    const pct = (sl.value / total) * 100;
    cumPct += pct;
    return `${sl.color} ${start}% ${cumPct}%`;
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-44 w-44" style={{ borderRadius: "50%", background: `conic-gradient(${stops.join(", ")})` }}>
        <div className="absolute inset-5 rounded-full bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="font-result text-lg font-bold text-brand-700">{fmt(total)}</p>
            <p className="text-[10px] text-text-muted">Total tax</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        {slices.filter((s) => s.value > 0).map((s) => (
          <span key={s.label} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}: {fmt(s.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function IncomeTaxCalculator() {
  const [country, setCountry] = useState<TaxCountry>("US");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [income, setIncome] = useState("85000");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [stateRate, setStateRate] = useState("5");
  const [useCustomDeduction, setUseCustomDeduction] = useState(false);
  const [customDeduction, setCustomDeduction] = useState("");

  const fmt = (n: number) => formatMoney(n, currency);

  const usResult = useMemo(() => {
    if (country !== "US") return null;
    return calcUS(
      parseFloat(income) || 0,
      filing,
      parseFloat(stateRate) || 0,
      useCustomDeduction ? customDeduction : "",
    );
  }, [country, income, filing, stateRate, useCustomDeduction, customDeduction]);

  const ukResult = useMemo(() => {
    if (country !== "UK") return null;
    return calcUK(parseFloat(income) || 0);
  }, [country, income]);

  const inputCls = "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950 leading-relaxed">
        <p className="font-medium text-amber-950">Tax year &amp; scope</p>
        <p className="mt-2">
          <strong>US:</strong> 2025 federal brackets, standard deductions, and FICA parameters as commonly published.
          <strong className="ml-1">UK:</strong> 2025/26-style bands and NI thresholds (illustrative).
          Excludes many credits, AMT, local taxes, and individual circumstances. Not tax advice—confirm with a qualified professional.
        </p>
      </div>

      {/* Country + currency */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex gap-2">
          {(["US", "UK"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCountry(c);
                setCurrency(c === "US" ? "USD" : "GBP");
              }}
              className={cn(
                "rounded-lg px-5 py-2.5 text-sm font-medium transition",
                country === c ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {c === "US" ? "🇺🇸 United States" : "🇬🇧 United Kingdom"}
            </button>
          ))}
        </div>
        <CurrencyPicker value={currency} onChange={setCurrency} />
      </div>

      {/* Income */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Annual gross income</p>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className={cn(inputCls, "mt-2 max-w-sm")}
          placeholder="e.g. 85000"
        />
      </div>

      {/* US-specific inputs */}
      {country === "US" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-text-primary mb-2">Filing status</p>
            <div className="flex flex-wrap gap-2">
              {FILING_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFiling(f.value)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    filing === f.value ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              State income tax rate (%)
              <input type="number" inputMode="decimal" min={0} max={15} step={0.1} value={stateRate} onChange={(e) => setStateRate(e.target.value)} className={inputCls} placeholder="e.g. 5" />
              <span className="text-xs text-text-muted mt-1 block">0% for TX, FL, WA, NV, etc.</span>
            </label>
            <div>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={useCustomDeduction} onChange={(e) => setUseCustomDeduction(e.target.checked)} className="accent-brand-600" />
                Itemize deductions
              </label>
              {useCustomDeduction ? (
                <input type="number" inputMode="decimal" min={0} value={customDeduction} onChange={(e) => setCustomDeduction(e.target.value)} className={cn(inputCls, "mt-2")} placeholder={`Standard: ${fmt(US_STANDARD_DEDUCTION[filing])}`} />
              ) : (
                <p className="text-xs text-text-muted mt-2">Standard deduction: {fmt(US_STANDARD_DEDUCTION[filing])}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* US Results */}
      {country === "US" && usResult && usResult.income > 0 && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Take-home pay</p>
              <p className="font-result mt-1 text-3xl font-semibold text-emerald-700">{fmt(usResult.takeHome)}</p>
              <p className="font-result text-sm text-text-muted">{fmt(usResult.takeHome / 12)}/mo</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Total tax</p>
              <p className="font-result mt-1 text-3xl font-semibold text-red-600">{fmt(usResult.totalTax)}</p>
              <p className="font-result text-sm text-text-muted">{fmt(usResult.totalTax / 12)}/mo</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Effective rate</p>
              <p className="font-result mt-1 text-3xl font-semibold text-brand-700">{usResult.effectiveRate.toFixed(1)}%</p>
              <p className="text-xs text-text-muted">Marginal: {usResult.marginalRate.toFixed(0)}%</p>
            </div>
          </div>

          <DonutChart
            slices={[
              { label: "Federal", value: usResult.federalTax, color: "#3b82f6" },
              { label: "FICA", value: usResult.fica, color: "#f59e0b" },
              { label: "State", value: usResult.stateTax, color: "#8b5cf6" },
            ]}
            fmt={fmt}
          />

          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Breakdown</p>
            {[
              ["Gross income", usResult.income],
              [`Deduction (${useCustomDeduction ? "itemized" : "standard"})`, -usResult.deduction],
              ["Taxable income", usResult.taxableIncome],
              ["Federal income tax", usResult.federalTax],
              ["Social Security (6.2%)", usResult.ss],
              ["Medicare (1.45%+)", usResult.medicare],
              [`State tax (${stateRate}%)`, usResult.stateTax],
              ["Total tax", usResult.totalTax],
              ["Take-home pay", usResult.takeHome],
            ].map(([label, val], i) => (
              <div key={label as string} className={cn("flex justify-between py-1.5", i === 7 ? "border-t-2 border-border font-medium" : i === 8 ? "font-semibold text-emerald-700" : "border-b border-border/60")}>
                <span className="text-text-muted">{label as string}</span>
                <span className="font-result">{(val as number) < 0 ? `(${fmt(-(val as number))})` : fmt(val as number)}</span>
              </div>
            ))}
          </div>

          {/* Bracket breakdown */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Tax bracket</th>
                  <th className="p-2 text-right">Taxable amount</th>
                  <th className="p-2 text-right">Tax</th>
                </tr>
              </thead>
              <tbody>
                {usResult.perBracket.map((b, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="p-2 text-right font-result">{fmt(b.taxable)}</td>
                    <td className="p-2 text-right font-result">{fmt(b.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-medium">
                  <td className="p-2">Total federal</td>
                  <td className="p-2 text-right font-result">{fmt(usResult.taxableIncome)}</td>
                  <td className="p-2 text-right font-result">{fmt(usResult.federalTax)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pay frequency table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Period</th>
                  <th className="p-2 text-right">Gross</th>
                  <th className="p-2 text-right">Tax</th>
                  <th className="p-2 text-right">Take-home</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Annual", div: 1 },
                  { label: "Monthly", div: 12 },
                  { label: "Bi-weekly", div: 26 },
                  { label: "Weekly", div: 52 },
                  { label: "Daily", div: 260 },
                  { label: "Hourly (40h/wk)", div: 2080 },
                ].map((p, i) => (
                  <tr key={p.label} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{p.label}</td>
                    <td className="p-2 text-right font-result">{fmt(usResult.income / p.div)}</td>
                    <td className="p-2 text-right font-result">{fmt(usResult.totalTax / p.div)}</td>
                    <td className="p-2 text-right font-result text-emerald-700">{fmt(usResult.takeHome / p.div)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UK Results */}
      {country === "UK" && ukResult && ukResult.income > 0 && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Take-home pay</p>
              <p className="font-result mt-1 text-3xl font-semibold text-emerald-700">{fmt(ukResult.takeHome)}</p>
              <p className="font-result text-sm text-text-muted">{fmt(ukResult.takeHome / 12)}/mo</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Total tax + NI</p>
              <p className="font-result mt-1 text-3xl font-semibold text-red-600">{fmt(ukResult.totalTax)}</p>
              <p className="font-result text-sm text-text-muted">{fmt(ukResult.totalTax / 12)}/mo</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Effective rate</p>
              <p className="font-result mt-1 text-3xl font-semibold text-brand-700">{ukResult.effectiveRate.toFixed(1)}%</p>
              <p className="text-xs text-text-muted">Marginal: {ukResult.marginalRate.toFixed(0)}%</p>
            </div>
          </div>

          <DonutChart
            slices={[
              { label: "Income Tax", value: ukResult.incomeTax, color: "#3b82f6" },
              { label: "National Insurance", value: ukResult.ni, color: "#f59e0b" },
            ]}
            fmt={fmt}
          />

          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Breakdown</p>
            {[
              ["Gross income", ukResult.income],
              ["Personal allowance", -ukResult.personalAllowance],
              ["Taxable income", ukResult.taxableIncome],
              ["Income tax", ukResult.incomeTax],
              ["National Insurance", ukResult.ni],
              ["Total deductions", ukResult.totalTax],
              ["Take-home pay", ukResult.takeHome],
            ].map(([label, val], i) => (
              <div key={label as string} className={cn("flex justify-between py-1.5", i === 5 ? "border-t-2 border-border font-medium" : i === 6 ? "font-semibold text-emerald-700" : "border-b border-border/60")}>
                <span className="text-text-muted">{label as string}</span>
                <span className="font-result">{(val as number) < 0 ? `(${fmt(-(val as number))})` : fmt(val as number)}</span>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Tax band</th>
                  <th className="p-2 text-right">Taxable amount</th>
                  <th className="p-2 text-right">Tax</th>
                </tr>
              </thead>
              <tbody>
                {ukResult.perBracket.map((b, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="p-2 text-right font-result">{fmt(b.taxable)}</td>
                    <td className="p-2 text-right font-result">{fmt(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Period</th>
                  <th className="p-2 text-right">Gross</th>
                  <th className="p-2 text-right">Tax + NI</th>
                  <th className="p-2 text-right">Take-home</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Annual", div: 1 },
                  { label: "Monthly", div: 12 },
                  { label: "Weekly", div: 52 },
                  { label: "Daily", div: 260 },
                ].map((p, i) => (
                  <tr key={p.label} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{p.label}</td>
                    <td className="p-2 text-right font-result">{fmt(ukResult.income / p.div)}</td>
                    <td className="p-2 text-right font-result">{fmt(ukResult.totalTax / p.div)}</td>
                    <td className="p-2 text-right font-result text-emerald-700">{fmt(ukResult.takeHome / p.div)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed text-text-muted">
        US calculations use 2025 federal tax brackets, standard deductions, and
        FICA rates. UK calculations use 2025/26 income tax bands, personal
        allowance (with taper above £100k), and Class 1 employee NI. This is an
        estimate — consult a tax professional for your specific situation.
      </p>
    </div>
  );
}

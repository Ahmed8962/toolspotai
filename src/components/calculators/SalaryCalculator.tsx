"use client";

import {
  type Country,
  type PayFrequency,
  type USFilingStatus,
  type UKStudentLoan,
  type SalaryBreakdown,
  PAY_FREQUENCIES,
  US_FILING_OPTIONS,
  UK_STUDENT_LOAN_OPTIONS,
  calcUS,
  calcUK,
  calcCustom,
  getPayPeriods,
} from "@/lib/salary";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const COUNTRY_OPTIONS: { value: Country; label: string; flag: string }[] = [
  { value: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { value: "UK", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { value: "custom", label: "Custom / Other", flag: "\u{1F310}" },
];

function fmt(n: number, country: Country): string {
  const opts: Intl.NumberFormatOptions = {
    style: "currency",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  if (country === "US" || country === "custom") {
    return new Intl.NumberFormat("en-US", { ...opts, currency: "USD" }).format(n);
  }
  return new Intl.NumberFormat("en-GB", { ...opts, currency: "GBP" }).format(n);
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

/* ─── Donut chart ─── */
function DonutChart({
  slices,
  fmtFn,
}: {
  slices: { label: string; value: number; color: string }[];
  fmtFn: (n: number) => string;
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
              <span className="font-result font-semibold">{fmtFn(s.value)}</span>
            </p>
          ))}
      </div>
    </div>
  );
}

/* ─── Pay frequency breakdown table ─── */
function FrequencyTable({
  result,
  fmtFn,
}: {
  result: SalaryBreakdown;
  fmtFn: (n: number) => string;
}) {
  const freqs: { label: string; periods: number }[] = [
    { label: "Annual", periods: 1 },
    { label: "Monthly", periods: 12 },
    { label: "Bi-weekly", periods: 26 },
    { label: "Weekly", periods: 52 },
    { label: "Daily", periods: 260 },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted">
          <tr>
            <th className="p-2" />
            {freqs.map((f) => (
              <th key={f.label} className="p-2 text-center">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 font-medium text-text-secondary">Gross pay</td>
            {freqs.map((f) => (
              <td key={f.label} className="p-2 text-center font-result">
                {fmtFn(result.gross / f.periods)}
              </td>
            ))}
          </tr>
          <tr className="bg-surface-muted/60">
            <td className="p-2 font-medium text-text-secondary">Total taxes</td>
            {freqs.map((f) => (
              <td key={f.label} className="p-2 text-center font-result text-red-600">
                -{fmtFn((result.totalDeductions - result.preTaxDeductions - result.pension) / f.periods)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-medium text-text-primary">Take-home</td>
            {freqs.map((f) => (
              <td key={f.label} className="p-2 text-center font-result font-semibold text-emerald-700">
                {fmtFn(result.netTakeHome / f.periods)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main component ─── */
export default function SalaryCalculator() {
  const [country, setCountry] = useState<Country>("US");
  const [salary, setSalary] = useState("80000");
  const [payFreq, setPayFreq] = useState<PayFrequency>("biWeekly");

  // US-specific
  const [filing, setFiling] = useState<USFilingStatus>("single");
  const [preTax, setPreTax] = useState("6000");
  const [stateRate, setStateRate] = useState("5");
  const [cityRate, setCityRate] = useState("0");

  // UK-specific
  const [pensionPct, setPensionPct] = useState("5");
  const [studentLoan, setStudentLoan] = useState<UKStudentLoan>("none");

  // Custom
  const [customTax, setCustomTax] = useState("25");
  const [customSocial, setCustomSocial] = useState("8");

  const [showFreqTable, setShowFreqTable] = useState(false);

  const s = parseFloat(salary) || 0;

  const switchCountry = (c: Country) => {
    setCountry(c);
    if (c === "UK") {
      setSalary("45000");
      setPayFreq("monthly");
    } else if (c === "US") {
      setSalary("80000");
      setPayFreq("biWeekly");
    }
  };

  const result: SalaryBreakdown | null = useMemo(() => {
    if (country === "US") {
      return calcUS({
        annualSalary: s,
        payFrequency: payFreq,
        filingStatus: filing,
        preTaxDeductions: parseFloat(preTax) || 0,
        stateTaxRate: parseFloat(stateRate) || 0,
        cityTaxRate: parseFloat(cityRate) || 0,
      });
    }
    if (country === "UK") {
      return calcUK({
        annualSalary: s,
        payFrequency: payFreq,
        pensionPercent: parseFloat(pensionPct) || 0,
        studentLoan,
      });
    }
    return calcCustom({
      annualSalary: s,
      payFrequency: payFreq,
      incomeTaxRate: parseFloat(customTax) || 0,
      socialContribRate: parseFloat(customSocial) || 0,
    });
  }, [country, s, payFreq, filing, preTax, stateRate, cityRate, pensionPct, studentLoan, customTax, customSocial]);

  const fmtC = (n: number) => fmt(n, country);
  const periods = getPayPeriods(payFreq);
  const freqLabel = PAY_FREQUENCIES.find((f) => f.value === payFreq)?.label ?? "";

  const donutSlices: { label: string; value: number; color: string }[] = result
    ? [
        { label: "Take-home pay", value: result.netTakeHome, color: "#10b981" },
        { label: result.labels.taxLabel, value: result.federalTax, color: "#2563eb" },
        ...(result.stateTax > 0 ? [{ label: "State tax", value: result.stateTax, color: "#7c3aed" }] : []),
        ...(result.cityTax > 0 ? [{ label: "City tax", value: result.cityTax, color: "#a855f7" }] : []),
        ...(result.socialSecurity > 0 ? [{ label: "Social Security", value: result.socialSecurity, color: "#f59e0b" }] : []),
        ...(result.medicare > 0 ? [{ label: "Medicare", value: result.medicare, color: "#ef4444" }] : []),
        ...(result.nationalInsurance > 0 ? [{ label: "National Insurance", value: result.nationalInsurance, color: "#f59e0b" }] : []),
        ...(result.studentLoan > 0 ? [{ label: "Student loan", value: result.studentLoan, color: "#ec4899" }] : []),
        ...(result.pension > 0 ? [{ label: "Pension", value: result.pension, color: "#8b5cf6" }] : []),
        ...(result.preTaxDeductions > 0 ? [{ label: "Pre-tax deductions", value: result.preTaxDeductions, color: "#64748b" }] : []),
      ]
    : [];

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Country picker */}
      <div className="flex flex-wrap gap-2">
        {COUNTRY_OPTIONS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => switchCountry(c.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              country === c.value
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {c.flag} {c.label}
          </button>
        ))}
      </div>

      {/* ── Annual Salary ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Your annual income (salary)
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Annual gross salary</span>
            <span className="font-result text-brand-700">{fmtC(s)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={country === "UK" ? 250_000 : 500_000}
            step={1000}
            value={Math.min(country === "UK" ? 250_000 : 500_000, Math.max(0, s))}
            onChange={(e) => setSalary(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className={cn(inputCls, "mt-2 h-12")}
            placeholder="e.g. 80000"
          />
        </div>
      </div>

      {/* ── Pay Frequency ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Pay frequency</p>
        <p className="mt-1 text-xs text-text-muted">
          How often you receive your paycheck.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PAY_FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setPayFreq(f.value)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                payFreq === f.value
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── US-specific fields ── */}
      {country === "US" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <p className="text-sm font-medium text-text-primary">Filing status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {US_FILING_OPTIONS.map((f) => (
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

          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <p className="text-sm font-medium text-text-primary">
              Deductions &amp; state taxes
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Pre-tax deductions include 401(k), HSA, and health insurance premiums.
              Standard deduction is applied automatically.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-text-secondary">
                Pre-tax deductions (annual)
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={preTax}
                  onChange={(e) => setPreTax(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 6000"
                />
              </label>
              <label className="block text-sm text-text-secondary">
                State income tax rate (%)
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={15}
                  step={0.1}
                  value={stateRate}
                  onChange={(e) => setStateRate(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 5"
                />
              </label>
              <label className="block text-sm text-text-secondary">
                City / local tax rate (%)
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={5}
                  step={0.1}
                  value={cityRate}
                  onChange={(e) => setCityRate(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 0"
                />
              </label>
            </div>
          </div>
        </>
      )}

      {/* ── UK-specific fields ── */}
      {country === "UK" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <p className="text-sm font-medium text-text-primary">
              Pension &amp; student loan
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Pension is modeled as salary sacrifice (reduces taxable income and NI).
              Student loan is repaid at 9% (or 6% for postgraduate) above the plan threshold.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-text-secondary">
                Pension contribution (%)
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={40}
                  step={0.5}
                  value={pensionPct}
                  onChange={(e) => setPensionPct(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 5"
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Student loan plan
                <select
                  value={studentLoan}
                  onChange={(e) => setStudentLoan(e.target.value as UKStudentLoan)}
                  className={inputCls}
                >
                  {UK_STUDENT_LOAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </>
      )}

      {/* ── Custom fields ── */}
      {country === "custom" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-sm font-medium text-text-primary">
            Tax &amp; social contribution rates
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Enter your effective flat tax rate and social contribution rate.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              Income tax rate (%)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={60}
                step={0.5}
                value={customTax}
                onChange={(e) => setCustomTax(e.target.value)}
                className={inputCls}
                placeholder="e.g. 25"
              />
            </label>
            <label className="block text-sm text-text-secondary">
              Social contributions (%)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={30}
                step={0.5}
                value={customSocial}
                onChange={(e) => setCustomSocial(e.target.value)}
                className={inputCls}
                placeholder="e.g. 8"
              />
            </label>
          </div>
        </div>
      )}

      {/* ─── Results ─── */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero take-home */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              {freqLabel} take-home pay
            </p>
            <p className="font-result text-4xl font-semibold text-emerald-700">
              {fmtC(result.perPeriod.net)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              <span className="font-result font-semibold text-brand-700">
                {fmtC(result.netTakeHome)}
              </span>{" "}
              per year
            </p>
          </div>

          {/* Donut chart */}
          <DonutChart slices={donutSlices} fmtFn={fmtC} />

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Gross annual salary</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmtC(result.gross)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Annual take-home</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                {fmtC(result.netTakeHome)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total deductions</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-red-600">
                {fmtC(result.totalDeductions)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Effective tax rate</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmtPct(result.effectiveRate)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Marginal tax rate</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmtPct(result.marginalRate)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">{freqLabel} gross</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmtC(result.perPeriod.gross)}
              </p>
            </div>
          </div>

          {/* Deduction breakdown */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Annual deduction breakdown</p>
            {[
              ...(result.preTaxDeductions > 0
                ? [["Pre-tax deductions (401k, HSA)", result.preTaxDeductions] as const]
                : []),
              [result.labels.taxLabel, result.federalTax] as const,
              ...(result.stateTax > 0 ? [["State income tax", result.stateTax] as const] : []),
              ...(result.cityTax > 0 ? [["City / local tax", result.cityTax] as const] : []),
              ...(result.socialSecurity > 0
                ? [["Social Security (6.2%)", result.socialSecurity] as const]
                : []),
              ...(result.medicare > 0
                ? [["Medicare (1.45%+)", result.medicare] as const]
                : []),
              ...(result.nationalInsurance > 0
                ? [["National Insurance", result.nationalInsurance] as const]
                : []),
              ...(result.pension > 0
                ? [["Pension contribution", result.pension] as const]
                : []),
              ...(result.studentLoan > 0
                ? [["Student loan repayment", result.studentLoan] as const]
                : []),
            ].map(([label, val], i, arr) => (
              <div
                key={label}
                className={cn(
                  "flex justify-between py-2",
                  i < arr.length - 1 && "border-b border-border/80",
                )}
              >
                <span className="text-text-muted">{label}</span>
                <span className="font-result text-red-600">-{fmtC(val)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-border py-2 font-medium">
              <span className="text-text-primary">Net take-home</span>
              <span className="font-result text-emerald-700">{fmtC(result.netTakeHome)}</span>
            </div>
          </div>

          {/* Frequency comparison table */}
          <div>
            <button
              type="button"
              onClick={() => setShowFreqTable((s) => !s)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              {showFreqTable ? "Hide" : "Show"} pay frequency comparison
            </button>
            {showFreqTable && (
              <div className="mt-4">
                <FrequencyTable result={result} fmtFn={fmtC} />
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            {country === "US"
              ? "Uses 2025 IRS federal tax brackets, standard deduction, and FICA rates (SS 6.2% up to $176,100, Medicare 1.45% + 0.9% additional). State/city taxes are flat-rate estimates. Does not account for tax credits, itemized deductions, AMT, or NIIT. For reference only — consult a tax professional."
              : country === "UK"
                ? "Uses 2025/26 HMRC income tax bands, personal allowance (with £100k taper), employee NI Class 1 rates (8%/2%), and student loan thresholds. Pension modeled as salary sacrifice. For reference only — consult HMRC or a tax advisor."
                : "Uses flat tax and social contribution rates you provide. Actual tax systems are progressive and more complex. For reference only."}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { computeMortgage } from "@/lib/mortgage";
import { formatNumber } from "@/lib/format";
import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CalculatorAssumptions from "@/components/shared/CalculatorAssumptions";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const presets = {
  starter: {
    homePrice: 320_000, downPct: 10, rate: 6.75, years: 30,
    tax: 3_800, insurance: 1_400, hoa: 0, pmi: 0.75,
  },
  moveUp: {
    homePrice: 550_000, downPct: 15, rate: 6.5, years: 30,
    tax: 6_600, insurance: 2_000, hoa: 85, pmi: 0.75,
  },
  luxury: {
    homePrice: 900_000, downPct: 20, rate: 6.25, years: 30,
    tax: 10_800, insurance: 3_200, hoa: 250, pmi: 0.75,
  },
} as const;

function currentMonth() {
  const d = new Date();
  return d.getMonth();
}
function currentYear() {
  return new Date().getFullYear();
}

function payoffDate(startMonth: number, startYear: number, termMonths: number) {
  const totalMonths = startMonth + termMonths;
  const endMonth = totalMonths % 12;
  const endYear = startYear + Math.floor(totalMonths / 12);
  return `${MONTH_NAMES[endMonth]} ${endYear}`;
}

/* ─── Donut chart (CSS conic-gradient) ─── */
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
              {s.label}: {fmtFn(s.value)}
            </p>
          ))}
      </div>
    </div>
  );
}

/* ─── Balance bar chart (pure CSS) ─── */
function BalanceChart({
  yearly,
  fmtFn,
}: {
  yearly: {
    year: number;
    principalPaid: number;
    interestPaid: number;
    endBalance: number;
  }[];
  fmtFn: (n: number) => string;
}) {
  if (yearly.length === 0) return null;
  const maxPI = Math.max(
    ...yearly.map((r) => r.principalPaid + r.interestPaid),
    1,
  );
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-text-primary">
        Annual principal vs interest
      </p>
      <div className="flex items-end gap-[2px]" style={{ height: 140 }}>
        {yearly.map((row) => {
          const pPct = (row.principalPaid / maxPI) * 100;
          const iPct = (row.interestPaid / maxPI) * 100;
          return (
            <div
              key={row.year}
              className="group relative flex flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              title={`Year ${row.year}: principal ${fmtFn(row.principalPaid)}, interest ${fmtFn(row.interestPaid)}`}
            >
              <div
                className="w-full rounded-t-[1px] bg-blue-600"
                style={{ height: `${pPct}%` }}
              />
              <div
                className="w-full bg-amber-400"
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
          Principal
        </p>
        <p>
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400 align-middle" />{" "}
          Interest
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function MortgageCalculator() {
  const [preset, setPreset] = useState<keyof typeof presets>("starter");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [homePrice, setHomePrice] = useState(String(presets.starter.homePrice));
  const fmt = (n: number) => formatMoney(n, currency);
  const [downPct, setDownPct] = useState(String(presets.starter.downPct));
  const [downDollar, setDownDollar] = useState(
    String((presets.starter.homePrice * presets.starter.downPct) / 100),
  );
  const [downMode, setDownMode] = useState<"%" | "$">("%");
  const [rate, setRate] = useState(String(presets.starter.rate));
  const [years, setYears] = useState(String(presets.starter.years));
  const [annualTax, setAnnualTax] = useState(String(presets.starter.tax));
  const [annualIns, setAnnualIns] = useState(String(presets.starter.insurance));
  const [hoa, setHoa] = useState(String(presets.starter.hoa));
  const [pmiPct, setPmiPct] = useState(String(presets.starter.pmi));
  const [startMonth, setStartMonth] = useState(currentMonth());
  const [startYear, setStartYear] = useState(currentYear());
  const [scheduleTab, setScheduleTab] = useState<"annual" | "monthly">("annual");
  const [showSchedule, setShowSchedule] = useState(false);

  const syncDown = (hp: number, pct: number) => {
    setDownPct(String(pct));
    setDownDollar(String(Math.round((hp * pct) / 100)));
  };

  const applyPreset = (k: keyof typeof presets) => {
    setPreset(k);
    const p = presets[k];
    setHomePrice(String(p.homePrice));
    syncDown(p.homePrice, p.downPct);
    setRate(String(p.rate));
    setYears(String(p.years));
    setAnnualTax(String(p.tax));
    setAnnualIns(String(p.insurance));
    setHoa(String(p.hoa));
    setPmiPct(String(p.pmi));
  };

  const hp = parseFloat(homePrice) || 0;

  const effectiveDownPct = useMemo(() => {
    if (downMode === "%") return parseFloat(downPct) || 0;
    const d = parseFloat(downDollar) || 0;
    return hp > 0 ? (d / hp) * 100 : 0;
  }, [downMode, downPct, downDollar, hp]);

  const effectiveDownDollar = useMemo(() => {
    if (downMode === "$") return parseFloat(downDollar) || 0;
    return (hp * (parseFloat(downPct) || 0)) / 100;
  }, [downMode, downPct, downDollar, hp]);

  const result = useMemo(() => {
    const rt = parseFloat(rate);
    const yr = parseFloat(years);
    const tax = parseFloat(annualTax);
    const ins = parseFloat(annualIns);
    const h = parseFloat(hoa);
    const pmi = parseFloat(pmiPct);
    if (
      Number.isNaN(hp) || Number.isNaN(effectiveDownDollar) ||
      Number.isNaN(rt) || Number.isNaN(yr) ||
      Number.isNaN(tax) || Number.isNaN(ins) ||
      Number.isNaN(h) || Number.isNaN(pmi)
    ) {
      return null;
    }
    return computeMortgage({
      homePrice: hp,
      downPayment: effectiveDownDollar,
      annualRatePercent: rt,
      termYears: yr,
      annualPropertyTax: Math.max(0, tax),
      annualHomeInsurance: Math.max(0, ins),
      hoaMonthly: Math.max(0, h),
      pmiAnnualPercentOfLoan: Math.max(0, pmi),
    });
  }, [hp, effectiveDownDollar, rate, years, annualTax, annualIns, hoa, pmiPct]);

  const pmiEndLabel =
    result?.firstMonthWithoutPmi != null && result.pmiApplies
      ? `Month ${result.firstMonthWithoutPmi} (~year ${Math.ceil(result.firstMonthWithoutPmi / 12)})`
      : null;

  const payoff = result
    ? payoffDate(startMonth, startYear, result.termMonths)
    : null;

  const donutSlices = result
    ? [
        { label: "Principal & interest", value: result.monthlyPI, color: "#2563eb" },
        { label: "Property tax", value: result.monthlyPropertyTax, color: "#16a34a" },
        { label: "Home insurance", value: result.monthlyInsurance, color: "#f59e0b" },
        { label: "HOA", value: result.hoaMonthly, color: "#8b5cf6" },
        ...(result.pmiApplies
          ? [{ label: "PMI", value: result.monthlyPmiWhenActive, color: "#ef4444" }]
          : []),
      ]
    : [];

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  const yearOptions: number[] = [];
  const cy = currentYear();
  for (let y = cy; y <= cy + 5; y++) yearOptions.push(y);

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <CalculatorAssumptions
        items={[
          "Fixed nominal rate: level monthly principal & interest (does not model ARMs or refi).",
          "PMI follows a conventional-style estimate until modeled LTV hits removal—not your lender’s exact policy (FHA/VA rules differ).",
          "Property tax, insurance, and HOA use the annual amounts you enter, spread monthly. Closing costs and escrow cushions are not included.",
        ]}
      />

      {/* ── Presets ── */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Starter home", "starter"],
            ["Move-up home", "moveUp"],
            ["Luxury home", "luxury"],
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

      {/* ── Inputs ── */}
      <div className="space-y-6">
        {/* Home price */}
        <div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Home price</span>
            <span className="font-result text-brand-700">{fmt(hp)}</span>
          </div>
          <input
            type="range" min={50_000} max={2_000_000} step={5_000}
            value={Math.min(2_000_000, Math.max(50_000, hp))}
            onChange={(e) => {
              setHomePrice(e.target.value);
              if (downMode === "%") {
                const pct = parseFloat(downPct) || 0;
                setDownDollar(String(Math.round((parseFloat(e.target.value) * pct) / 100)));
              }
            }}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number" inputMode="decimal" value={homePrice}
            onChange={(e) => {
              setHomePrice(e.target.value);
              if (downMode === "%") {
                const pct = parseFloat(downPct) || 0;
                setDownDollar(String(Math.round((parseFloat(e.target.value) * pct) / 100)));
              }
            }}
            className={cn(inputCls, "mt-2 h-12")}
          />
        </div>

        {/* Down payment — toggle $ / % */}
        <div>
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span className="flex items-center gap-2">
              Down payment
              <button
                type="button"
                onClick={() => setDownMode(downMode === "%" ? "$" : "%")}
                className="rounded border border-border px-1.5 py-0.5 text-xs font-medium text-brand-600 hover:bg-surface-muted"
              >
                {downMode === "%" ? "Switch to $" : "Switch to %"}
              </button>
            </span>
            <span className="font-result text-brand-700">
              {fmt(effectiveDownDollar)} ({formatNumber(effectiveDownPct, 1)}%)
            </span>
          </div>
          {downMode === "%" ? (
            <>
              <input
                type="range" min={0} max={50} step={0.5}
                value={Math.min(50, Math.max(0, parseFloat(downPct) || 0))}
                onChange={(e) => {
                  setDownPct(e.target.value);
                  setDownDollar(String(Math.round((hp * parseFloat(e.target.value)) / 100)));
                }}
                className="mt-2 w-full accent-brand-600"
              />
              <input
                type="number" inputMode="decimal" value={downPct}
                onChange={(e) => {
                  setDownPct(e.target.value);
                  setDownDollar(String(Math.round((hp * (parseFloat(e.target.value) || 0)) / 100)));
                }}
                className={cn(inputCls, "mt-2 h-12")}
                placeholder="e.g. 20"
              />
            </>
          ) : (
            <input
              type="number" inputMode="decimal" value={downDollar}
              onChange={(e) => {
                setDownDollar(e.target.value);
                const d = parseFloat(e.target.value) || 0;
                setDownPct(hp > 0 ? String(((d / hp) * 100).toFixed(2)) : "0");
              }}
              className={cn(inputCls, "mt-2 h-12")}
              placeholder="e.g. 60000"
            />
          )}
        </div>

        {/* Rate + term */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Interest rate (% p.a.)</span>
              <span className="font-result text-brand-700">{rate}%</span>
            </div>
            <input
              type="range" min={1} max={15} step={0.125}
              value={Math.min(15, Math.max(1, parseFloat(rate) || 0))}
              onChange={(e) => setRate(e.target.value)}
              className="mt-2 w-full accent-brand-600"
            />
            <input
              type="number" inputMode="decimal" value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={cn(inputCls, "mt-2 h-12")}
            />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Loan term</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([10, 15, 20, 25, 30] as const).map((y) => (
                <button
                  key={y} type="button"
                  onClick={() => setYears(String(y))}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    parseFloat(years) === y
                      ? "bg-brand-600 text-white"
                      : "border border-border text-text-secondary hover:bg-surface-muted",
                  )}
                >
                  {y} yr
                </button>
              ))}
            </div>
            <input
              type="number" inputMode="numeric" min={1} max={40} value={years}
              onChange={(e) => setYears(e.target.value)}
              className={cn(inputCls, "mt-2 h-12")}
            />
          </div>
        </div>

        {/* Start date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Start month
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              className={inputCls}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-text-secondary">
            Start year
            <select
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className={inputCls}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Taxes, insurance, HOA, PMI */}
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-sm font-medium text-text-primary">
            Taxes, insurance &amp; HOA
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Annual figures ÷ 12 for monthly cost. PMI uses conventional-style 78% LTV removal on purchase price.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              Property tax (per year)
              <input type="number" inputMode="decimal" min={0} value={annualTax}
                onChange={(e) => setAnnualTax(e.target.value)} className={inputCls} />
            </label>
            <label className="block text-sm text-text-secondary">
              Home insurance (per year)
              <input type="number" inputMode="decimal" min={0} value={annualIns}
                onChange={(e) => setAnnualIns(e.target.value)} className={inputCls} />
            </label>
            <label className="block text-sm text-text-secondary">
              HOA (per month)
              <input type="number" inputMode="decimal" min={0} value={hoa}
                onChange={(e) => setHoa(e.target.value)} className={inputCls} />
            </label>
            <label className="block text-sm text-text-secondary">
              PMI (% of loan / yr)
              <input type="number" inputMode="decimal" min={0} step={0.05} value={pmiPct}
                onChange={(e) => setPmiPct(e.target.value)} className={inputCls} />
            </label>
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero monthly */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              Monthly payment {result.pmiApplies ? "(incl. PMI)" : ""}
            </p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {fmt(result.totalMonthlyFirst)}
            </p>
            {result.pmiApplies && result.firstMonthWithoutPmi != null && (
              <p className="mt-1 text-sm text-text-secondary">
                After PMI ends ({pmiEndLabel}):{" "}
                <span className="font-result font-semibold text-text-primary">
                  {fmt(result.totalMonthlyStable)}
                </span>/mo
              </p>
            )}
          </div>

          {/* Donut chart */}
          <DonutChart slices={donutSlices} fmtFn={fmt} />

          {/* Summary cards — 2×3 grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Home price</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(hp)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Loan amount</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.loanAmount)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Down payment</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {fmt(effectiveDownDollar)}
                <span className="ml-1 text-sm font-normal text-text-muted">
                  ({formatNumber(effectiveDownPct, 1)}%)
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total interest</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.totalInterest)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total of {result.termMonths} payments</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.totalMortgagePayments)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total out-of-pocket</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.totalOutOfPocket)}</p>
            </div>
            {result.totalPmi > 0 && (
              <div className="rounded-xl bg-surface-muted p-4">
                <p className="text-xs text-text-muted">Total PMI paid</p>
                <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.totalPmi)}</p>
              </div>
            )}
            {payoff && (
              <div className="rounded-xl bg-surface-muted p-4">
                <p className="text-xs text-text-muted">Mortgage payoff date</p>
                <p className="font-result mt-0.5 text-lg font-semibold">{payoff}</p>
              </div>
            )}
          </div>

          {/* Payment breakdown list */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Monthly payment breakdown</p>
            {[
              ["Principal & interest", result.monthlyPI],
              ["Property tax", result.monthlyPropertyTax],
              ["Home insurance", result.monthlyInsurance],
              ["HOA", result.hoaMonthly],
              ...(result.pmiApplies
                ? [["PMI (while active)" as const, result.monthlyPmiWhenActive] as const]
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
                <span className="font-result">{fmt(val as number)}</span>
              </div>
            ))}
          </div>

          {/* Balance bar chart */}
          <BalanceChart yearly={result.yearly} fmtFn={fmt} />

          {/* Amortization schedule */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSchedule((s) => !s)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
              >
                {showSchedule ? "Hide" : "Show"} amortization schedule
              </button>
              {showSchedule && (
                <div className="flex gap-1">
                  {(["annual", "monthly"] as const).map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setScheduleTab(t)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium",
                        scheduleTab === t
                          ? "bg-brand-600 text-white"
                          : "bg-surface-muted text-text-secondary hover:bg-slate-200",
                      )}
                    >
                      {t === "annual" ? "Annual" : "Monthly"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showSchedule && scheduleTab === "annual" && (
              <div className="mt-4 max-h-[360px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface-muted">
                    <tr>
                      <th className="p-2">Year</th>
                      <th className="p-2">Principal</th>
                      <th className="p-2">Interest</th>
                      <th className="p-2">PMI</th>
                      <th className="p-2">End balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly.map((row, i) => (
                      <tr key={row.year} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                        <td className="p-2">{row.year}</td>
                        <td className="p-2 font-result">{fmt(row.principalPaid)}</td>
                        <td className="p-2 font-result">{fmt(row.interestPaid)}</td>
                        <td className="p-2 font-result">{row.pmiPaid > 0 ? fmt(row.pmiPaid) : "—"}</td>
                        <td className="p-2 font-result">{fmt(row.endBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showSchedule && scheduleTab === "monthly" && (
              <div className="mt-4 max-h-[360px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface-muted">
                    <tr>
                      <th className="p-2">Month</th>
                      <th className="p-2">Principal</th>
                      <th className="p-2">Interest</th>
                      <th className="p-2">PMI</th>
                      <th className="p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.monthly.map((row, i) => (
                      <tr key={row.month} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                        <td className="p-2">{row.month}</td>
                        <td className="p-2 font-result">{fmt(row.principalPaid)}</td>
                        <td className="p-2 font-result">{fmt(row.interestPaid)}</td>
                        <td className="p-2 font-result">{row.pmiPaid > 0 ? fmt(row.pmiPaid) : "—"}</td>
                        <td className="p-2 font-result">{fmt(row.endBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Uses standard fixed-rate amortization. PMI removal modeled at 78% LTV on purchase price (conventional-style).
            Results are estimates — not a loan offer. Verify with a licensed loan officer.
          </p>
        </div>
      )}
    </div>
  );
}

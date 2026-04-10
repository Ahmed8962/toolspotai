"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function DonutChart({ slices, center, sub, fmt }: { slices: { label: string; value: number; color: string }[]; center: string; sub: string; fmt: (n: number) => string }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  let cumPct = 0;
  const stops = slices.map((sl) => {
    const start = cumPct;
    cumPct += (sl.value / total) * 100;
    return `${sl.color} ${start}% ${cumPct}%`;
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-44 w-44" style={{ borderRadius: "50%", background: `conic-gradient(${stops.join(", ")})` }}>
        <div className="absolute inset-5 rounded-full bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="font-result text-base font-bold text-brand-700">{center}</p>
            <p className="text-[10px] text-text-muted">{sub}</p>
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

type YearRow = {
  age: number;
  contribution: number;
  employerMatch: number;
  growth: number;
  balance: number;
};

export default function RetirementCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [currentAge, setCurrentAge] = useState("30");
  const [retireAge, setRetireAge] = useState("65");
  const [currentSavings, setCurrentSavings] = useState("50000");
  const [monthlyContrib, setMonthlyContrib] = useState("500");
  const [annualReturn, setAnnualReturn] = useState("7");
  const [inflationRate, setInflationRate] = useState("3");
  const [employerMatch, setEmployerMatch] = useState("50");
  const [matchLimit, setMatchLimit] = useState("6");
  const [salary, setSalary] = useState("85000");
  const [desiredIncome, setDesiredIncome] = useState("60000");
  const [withdrawalRate, setWithdrawalRate] = useState("4");

  const fmt = (n: number) => formatMoney(n, currency);
  const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return fmt(n);
  };

  const result = useMemo(() => {
    const cAge = parseInt(currentAge) || 0;
    const rAge = parseInt(retireAge) || 65;
    const years = rAge - cAge;
    if (years <= 0) return null;

    const startBal = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlyContrib) || 0;
    const returnRate = (parseFloat(annualReturn) || 0) / 100;
    const inflation = (parseFloat(inflationRate) || 0) / 100;
    const realReturn = ((1 + returnRate) / (1 + inflation)) - 1;

    const sal = parseFloat(salary) || 0;
    const matchPct = (parseFloat(employerMatch) || 0) / 100;
    const matchLimitPct = (parseFloat(matchLimit) || 0) / 100;
    const annualContrib = monthly * 12;
    const contribPctOfSalary = sal > 0 ? annualContrib / sal : 0;
    const effectiveMatchPct = Math.min(contribPctOfSalary, matchLimitPct) * matchPct;
    const annualMatch = sal * effectiveMatchPct;

    const schedule: YearRow[] = [];
    let balance = startBal;
    let totalContribs = startBal;
    let totalMatch = 0;
    let totalGrowth = 0;

    for (let y = 0; y < years; y++) {
      const growth = balance * returnRate;
      balance += growth + annualContrib + annualMatch;
      totalContribs += annualContrib;
      totalMatch += annualMatch;
      totalGrowth += growth;
      schedule.push({
        age: cAge + y + 1,
        contribution: annualContrib,
        employerMatch: annualMatch,
        growth,
        balance,
      });
    }

    const nominalBalance = balance;
    const realBalance = balance / Math.pow(1 + inflation, years);

    const wRate = (parseFloat(withdrawalRate) || 4) / 100;
    const annualWithdrawal = nominalBalance * wRate;
    const monthlyWithdrawal = annualWithdrawal / 12;

    const desired = parseFloat(desiredIncome) || 0;
    const neededNominal = desired > 0 ? desired / wRate : 0;
    const yearsLastingAtDesired = desired > 0 && realReturn > 0
      ? Math.log(1 - (nominalBalance * realReturn / desired)) / Math.log(1 / (1 + realReturn))
      : desired > 0 ? nominalBalance / desired : Infinity;

    const shortfall = neededNominal > nominalBalance ? neededNominal - nominalBalance : 0;

    return {
      years, nominalBalance, realBalance, totalContribs, totalMatch, totalGrowth,
      annualWithdrawal, monthlyWithdrawal, neededNominal, shortfall,
      yearsLasting: yearsLastingAtDesired, schedule,
    };
  }, [currentAge, retireAge, currentSavings, monthlyContrib, annualReturn, inflationRate, employerMatch, matchLimit, salary, desiredIncome, withdrawalRate]);

  const inputCls = "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Age & savings */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Your details</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm text-text-secondary">
            Current age
            <input type="number" inputMode="numeric" min={18} max={80} value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm text-text-secondary">
            Retirement age
            <input type="number" inputMode="numeric" min={40} max={100} value={retireAge} onChange={(e) => setRetireAge(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm text-text-secondary">
            Current savings
            <input type="number" inputMode="decimal" min={0} value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm text-text-secondary">
            Monthly contribution
            <input type="number" inputMode="decimal" min={0} value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} className={inputCls} />
          </label>
        </div>
      </div>

      {/* Returns & employer match */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Investment & employer match</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm text-text-secondary">
            Expected annual return (%)
            <input type="number" inputMode="decimal" min={0} max={20} step={0.5} value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} className={inputCls} />
            <span className="text-xs text-text-muted">S&P 500 avg: ~10%</span>
          </label>
          <label className="block text-sm text-text-secondary">
            Inflation rate (%)
            <input type="number" inputMode="decimal" min={0} max={10} step={0.5} value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm text-text-secondary">
            Annual salary
            <input type="number" inputMode="decimal" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} className={inputCls} />
          </label>
          <div>
            <label className="block text-sm text-text-secondary">
              Employer match (%)
              <input type="number" inputMode="decimal" min={0} max={100} value={employerMatch} onChange={(e) => setEmployerMatch(e.target.value)} className={inputCls} />
            </label>
            <label className="block text-sm text-text-secondary mt-2">
              Match up to (% of salary)
              <input type="number" inputMode="decimal" min={0} max={100} value={matchLimit} onChange={(e) => setMatchLimit(e.target.value)} className={inputCls} />
            </label>
          </div>
        </div>
      </div>

      {/* Retirement income */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Retirement income goal</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Desired annual income in retirement
            <input type="number" inputMode="decimal" min={0} value={desiredIncome} onChange={(e) => setDesiredIncome(e.target.value)} className={inputCls} />
          </label>
          <label className="block text-sm text-text-secondary">
            Safe withdrawal rate (%)
            <input type="number" inputMode="decimal" min={1} max={10} step={0.5} value={withdrawalRate} onChange={(e) => setWithdrawalRate(e.target.value)} className={inputCls} />
            <span className="text-xs text-text-muted">4% rule is the standard guideline</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">Retirement savings</p>
              <p className="font-result mt-1 text-2xl font-bold text-brand-700">{fmt(result.nominalBalance)}</p>
              <p className="text-xs text-text-muted">at age {retireAge}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">In today&apos;s dollars</p>
              <p className="font-result mt-1 text-2xl font-semibold">{fmt(result.realBalance)}</p>
              <p className="text-xs text-text-muted">inflation-adjusted</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Monthly income</p>
              <p className="font-result mt-1 text-2xl font-semibold text-emerald-700">{fmt(result.monthlyWithdrawal)}</p>
              <p className="text-xs text-text-muted">at {withdrawalRate}% withdrawal</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Years to grow</p>
              <p className="font-result mt-1 text-2xl font-semibold">{result.years}</p>
              <p className="text-xs text-text-muted">until retirement</p>
            </div>
          </div>

          {result.shortfall > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              To sustain {fmt(parseFloat(desiredIncome) || 0)}/year at a {withdrawalRate}% withdrawal rate, you need {fmt(result.neededNominal)}. You are {fmt(result.shortfall)} short. Consider increasing contributions or delaying retirement.
            </div>
          )}

          <DonutChart
            slices={[
              { label: "Contributions", value: result.totalContribs, color: "#3b82f6" },
              { label: "Employer match", value: result.totalMatch, color: "#8b5cf6" },
              { label: "Investment growth", value: result.totalGrowth, color: "#10b981" },
            ]}
            center={fmtShort(result.nominalBalance)}
            sub="total at retirement"
            fmt={fmt}
          />

          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Summary</p>
            {[
              ["Your total contributions", result.totalContribs],
              ["Employer match total", result.totalMatch],
              ["Investment growth", result.totalGrowth],
              ["Total at retirement", result.nominalBalance],
              ["Value in today's dollars", result.realBalance],
              [`Annual income (${withdrawalRate}% rule)`, result.annualWithdrawal],
              ["Monthly income", result.monthlyWithdrawal],
            ].map(([label, val], i) => (
              <div key={label as string} className={cn("flex justify-between py-1.5", i === 3 ? "border-t-2 border-border font-semibold" : i === 6 ? "font-semibold text-emerald-700" : "border-b border-border/60")}>
                <span className="text-text-muted">{label as string}</span>
                <span className="font-result">{fmt(val as number)}</span>
              </div>
            ))}
          </div>

          {/* Growth table */}
          <div className="overflow-x-auto rounded-xl border border-border max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted sticky top-0">
                <tr>
                  <th className="p-2">Age</th>
                  <th className="p-2 text-right">Contribution</th>
                  <th className="p-2 text-right">Employer</th>
                  <th className="p-2 text-right">Growth</th>
                  <th className="p-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((r, i) => (
                  <tr key={r.age} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{r.age}</td>
                    <td className="p-2 text-right font-result">{fmt(r.contribution)}</td>
                    <td className="p-2 text-right font-result">{fmt(r.employerMatch)}</td>
                    <td className="p-2 text-right font-result">{fmt(r.growth)}</td>
                    <td className="p-2 text-right font-result font-medium">{fmt(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Calculations assume a constant annual return and inflation rate,
            with contributions made at year-end. Real returns will vary. The 4%
            rule is a guideline from the Trinity Study suggesting you can
            withdraw 4% of your portfolio annually with a low risk of running
            out over 30 years. Consult a financial advisor for personalized
            planning.
          </p>
        </div>
      )}
    </div>
  );
}

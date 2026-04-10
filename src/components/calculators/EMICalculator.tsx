"use client";

import { formatNumber } from "@/lib/format";
import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CalculatorAssumptions from "@/components/shared/CalculatorAssumptions";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const presets = {
  home: { amount: 500000, rate: 8.5, months: 240 },
  car: { amount: 30000, rate: 9.5, months: 60 },
  personal: { amount: 10000, rate: 14, months: 36 },
} as const;

function emi(principal: number, annualPct: number, months: number) {
  const r = annualPct / 12 / 100;
  if (months <= 0 || principal <= 0) return 0;
  if (r === 0) return principal / months;
  const pow = (1 + r) ** months;
  return (principal * r * pow) / (pow - 1);
}

export default function EMICalculator() {
  const [tab, setTab] = useState<keyof typeof presets>("home");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState(String(presets.home.amount));
  const [rate, setRate] = useState(String(presets.home.rate));
  const [months, setMonths] = useState(String(presets.home.months));
  const [showTable, setShowTable] = useState(false);
  const fmt = (n: number) => formatMoney(n, currency);

  const applyPreset = (k: keyof typeof presets) => {
    setTab(k);
    const p = presets[k];
    setAmount(String(p.amount));
    setRate(String(p.rate));
    setMonths(String(p.months));
  };

  const n = useMemo(() => {
    const P = parseFloat(amount);
    const annual = parseFloat(rate);
    const mo = Math.round(parseFloat(months));
    return { P, annual, mo };
  }, [amount, rate, months]);

  const calc = useMemo(() => {
    const { P, annual, mo } = n;
    if (Number.isNaN(P) || Number.isNaN(annual) || Number.isNaN(mo) || mo < 1 || P <= 0) {
      return null;
    }
    const monthly = emi(P, annual, mo);
    const r = annual / 12 / 100;
    const totalPaid = monthly * mo;
    const totalInterest = totalPaid - P;
    const principalPct = totalPaid > 0 ? (P / totalPaid) * 100 : 0;
    const interestPct = totalPaid > 0 ? (totalInterest / totalPaid) * 100 : 0;

    const years: {
      year: number;
      emiPaid: number;
      principal: number;
      interest: number;
      balance: number;
    }[] = [];
    let balance = P;
    for (let y = 0; y < Math.ceil(mo / 12); y++) {
      const startM = y * 12;
      const endM = Math.min(mo, startM + 12);
      let emiSum = 0;
      let prSum = 0;
      let intSum = 0;
      for (let i = startM; i < endM; i++) {
        const interest = balance * r;
        const principalPart = monthly - interest;
        emiSum += monthly;
        prSum += principalPart;
        intSum += interest;
        balance -= principalPart;
      }
      years.push({
        year: y + 1,
        emiPaid: emiSum,
        principal: prSum,
        interest: intSum,
        balance: Math.max(0, balance),
      });
    }

    return { monthly, totalPaid, totalInterest, interestPct, principalPct, years };
  }, [n]);

  const donutStyle = calc
    ? {
        background: `conic-gradient(#2563eb 0% ${calc.principalPct}%, #fcd34d ${calc.principalPct}% 100%)`,
      }
    : undefined;

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <CalculatorAssumptions
        items={[
          "Standard fixed-rate amortization (equal monthly installment).",
          "Does not include processing fees, insurance, or variable-rate changes.",
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Home loan", "home"],
            ["Car loan", "car"],
            ["Personal loan", "personal"],
          ] as const
        ).map(([label, k]) => (
          <button
            key={k}
            type="button"
            onClick={() => applyPreset(k)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              tab === k
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Loan amount</span>
            <span className="font-result text-brand-700">{formatNumber(parseFloat(amount) || 0, 0)}</span>
          </div>
          <input
            type="range"
            min={10_000}
            max={5_000_000}
            step={1000}
            value={Math.min(5_000_000, Math.max(10_000, parseFloat(amount) || 0))}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Interest rate (% p.a.)</span>
            <span className="font-result text-brand-700">{rate}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={0.1}
            value={Math.min(30, Math.max(1, parseFloat(rate) || 0))}
            onChange={(e) => setRate(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Tenure (months)</span>
            <span className="font-result text-brand-700">{months}</span>
          </div>
          <input
            type="range"
            min={6}
            max={360}
            step={1}
            value={Math.min(360, Math.max(6, parseFloat(months) || 0))}
            onChange={(e) => setMonths(e.target.value)}
            className="mt-2 w-full accent-brand-600"
          />
          <input
            type="number"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-border px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {calc && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">Monthly EMI</p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {fmt(calc.monthly)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Total interest</p>
              <p className="font-result mt-1 text-lg font-semibold">
                {fmt(calc.totalInterest)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Total paid</p>
              <p className="font-result mt-1 text-lg font-semibold">
                {fmt(calc.totalPaid)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Interest of total</p>
              <p className="font-result mt-1 text-lg font-semibold">
                {formatNumber(calc.interestPct, 1)}%
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div
              className="relative h-[140px] w-[140px] shrink-0 rounded-full"
              style={donutStyle}
            >
              <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </div>
            <div className="text-sm text-text-secondary">
              <p>
                <span className="inline-block h-3 w-3 rounded-sm bg-brand-600 align-middle" />{" "}
                Principal
              </p>
              <p className="mt-2">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-300 align-middle" />{" "}
                Interest
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowTable((s) => !s)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              {showTable ? "Hide" : "Show"} breakdown table
            </button>
            {showTable && (
              <div className="mt-4 max-h-[280px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface-muted">
                    <tr>
                      <th className="p-2">Year</th>
                      <th className="p-2">EMI paid</th>
                      <th className="p-2">Principal</th>
                      <th className="p-2">Interest</th>
                      <th className="p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.years.slice(0, 30).map((row, i) => (
                      <tr key={row.year} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                        <td className="p-2">{row.year}</td>
                        <td className="p-2 font-result">{fmt(row.emiPaid)}</td>
                        <td className="p-2 font-result">{fmt(row.principal)}</td>
                        <td className="p-2 font-result">{fmt(row.interest)}</td>
                        <td className="p-2 font-result">{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

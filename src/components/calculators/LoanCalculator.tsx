"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CalculatorAssumptions from "@/components/shared/CalculatorAssumptions";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type LoanType = "auto" | "personal" | "student" | "custom";

const LOAN_PRESETS: { type: LoanType; label: string; icon: string; defaultRate: number; defaultTerm: number }[] = [
  { type: "auto", label: "Auto Loan", icon: "🚗", defaultRate: 6.5, defaultTerm: 60 },
  { type: "personal", label: "Personal Loan", icon: "💳", defaultRate: 10.5, defaultTerm: 36 },
  { type: "student", label: "Student Loan", icon: "🎓", defaultRate: 5.5, defaultTerm: 120 },
  { type: "custom", label: "Custom Loan", icon: "⚙️", defaultRate: 7.0, defaultTerm: 60 },
];

type AmortRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
};

function calcLoan(amount: number, annualRate: number, termMonths: number) {
  if (amount <= 0 || termMonths <= 0) return null;

  if (annualRate === 0) {
    const payment = amount / termMonths;
    const schedule: AmortRow[] = [];
    let balance = amount;
    for (let m = 1; m <= termMonths; m++) {
      balance -= payment;
      schedule.push({
        month: m,
        payment,
        principal: payment,
        interest: 0,
        balance: Math.max(0, balance),
        totalInterest: 0,
      });
    }
    return { payment, totalInterest: 0, totalPayment: amount, schedule };
  }

  const r = annualRate / 100 / 12;
  const n = termMonths;
  const payment = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = payment * n;
  const totalInterest = totalPayment - amount;

  const schedule: AmortRow[] = [];
  let balance = amount;
  let cumInterest = 0;
  for (let m = 1; m <= n; m++) {
    const intPart = balance * r;
    const prinPart = payment - intPart;
    balance -= prinPart;
    cumInterest += intPart;
    schedule.push({
      month: m,
      payment,
      principal: prinPart,
      interest: intPart,
      balance: Math.max(0, balance),
      totalInterest: cumInterest,
    });
  }

  return { payment, totalInterest, totalPayment, schedule };
}

function DonutChart({
  principal,
  interest,
  fmt,
}: {
  principal: number;
  interest: number;
  fmt: (n: number) => string;
}) {
  const total = principal + interest;
  if (total === 0) return null;
  const pPct = (principal / total) * 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-40 w-40"
        style={{
          borderRadius: "50%",
          background: `conic-gradient(#3b82f6 0% ${pPct}%, #f59e0b ${pPct}% 100%)`,
        }}
      >
        <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="font-result text-lg font-bold text-brand-700">
              {fmt(total)}
            </p>
            <p className="text-[10px] text-text-muted">Total</p>
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          Principal: {fmt(principal)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          Interest: {fmt(interest)}
        </span>
      </div>
    </div>
  );
}

export default function LoanCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [loanType, setLoanType] = useState<LoanType>("auto");
  const [amount, setAmount] = useState("25000");
  const [rate, setRate] = useState("6.5");
  const [termMonths, setTermMonths] = useState("60");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleView, setScheduleView] = useState<"monthly" | "yearly">("yearly");

  const fmt = (n: number) => formatMoney(n, currency);

  const handlePreset = (preset: typeof LOAN_PRESETS[number]) => {
    setLoanType(preset.type);
    setRate(String(preset.defaultRate));
    setTermMonths(String(preset.defaultTerm));
  };

  const result = useMemo(() => {
    const a = parseFloat(amount) || 0;
    const r = parseFloat(rate) || 0;
    const t = parseInt(termMonths, 10) || 0;
    return calcLoan(a, r, t);
  }, [amount, rate, termMonths]);

  const yearlySchedule = useMemo(() => {
    if (!result) return [];
    const years: {
      year: number;
      payment: number;
      principal: number;
      interest: number;
      endBalance: number;
    }[] = [];
    let yPay = 0,
      yPrin = 0,
      yInt = 0;
    for (const row of result.schedule) {
      yPay += row.payment;
      yPrin += row.principal;
      yInt += row.interest;
      if (row.month % 12 === 0 || row.month === result.schedule.length) {
        years.push({
          year: years.length + 1,
          payment: yPay,
          principal: yPrin,
          interest: yInt,
          endBalance: row.balance,
        });
        yPay = yPrin = yInt = 0;
      }
    }
    return years;
  }, [result]);

  const inputCls =
    "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <CalculatorAssumptions
        items={[
          "Fixed-rate amortizing loan over the term (no interest-only or balloon period).",
          "Payment excludes origination fees, insurance, or add-on products unless you fold them into the principal yourself.",
        ]}
      />

      {/* Loan type */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LOAN_PRESETS.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => handlePreset(p)}
            className={cn(
              "rounded-xl px-3 py-3 text-left transition",
              loanType === p.type
                ? "bg-brand-600 text-white"
                : "border border-border text-text-secondary hover:bg-surface-muted",
            )}
          >
            <span className="text-lg">{p.icon}</span>
            <span className="ml-1.5 text-sm font-medium">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm text-text-secondary">
            Loan amount
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              placeholder="25000"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Annual interest rate (%)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={50}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={inputCls}
              placeholder="6.5"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Loan term (months)
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              className={inputCls}
              placeholder="60"
            />
            <span className="text-xs text-text-muted">
              = {((parseInt(termMonths, 10) || 0) / 12).toFixed(1)} years
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Monthly payment</p>
              <p className="font-result mt-1 text-3xl font-semibold text-brand-700">
                {fmt(result.payment)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Total interest</p>
              <p className="font-result mt-1 text-3xl font-semibold text-amber-600">
                {fmt(result.totalInterest)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Total payment</p>
              <p className="font-result mt-1 text-3xl font-semibold text-emerald-700">
                {fmt(result.totalPayment)}
              </p>
            </div>
          </div>

          <DonutChart
            principal={parseFloat(amount) || 0}
            interest={result.totalInterest}
            fmt={fmt}
          />

          {/* Breakdown */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Summary</p>
            {[
              ["Loan amount", parseFloat(amount) || 0],
              ["Monthly payment", result.payment],
              ["Total interest paid", result.totalInterest],
              ["Total amount paid", result.totalPayment],
            ].map(([label, val]) => (
              <div
                key={label as string}
                className="flex justify-between py-1.5 border-b border-border/60 last:border-0"
              >
                <span className="text-text-muted">{label as string}</span>
                <span className="font-result">{fmt(val as number)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-muted">Interest-to-principal ratio</span>
              <span className="font-result">
                {((result.totalInterest / (parseFloat(amount) || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Amortization schedule toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition"
            >
              {showSchedule ? "Hide" : "Show"} amortization schedule
            </button>
          </div>

          {showSchedule && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["yearly", "monthly"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setScheduleView(v)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      scheduleView === v
                        ? "bg-brand-600 text-white"
                        : "border border-border text-text-secondary hover:bg-surface-muted",
                    )}
                  >
                    {v === "yearly" ? "Yearly" : "Monthly"}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-border max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted sticky top-0">
                    <tr>
                      <th className="p-2">{scheduleView === "yearly" ? "Year" : "Month"}</th>
                      <th className="p-2 text-right">Payment</th>
                      <th className="p-2 text-right">Principal</th>
                      <th className="p-2 text-right">Interest</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleView === "yearly"
                      ? yearlySchedule.map((r, i) => (
                          <tr key={r.year} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                            <td className="p-2">{r.year}</td>
                            <td className="p-2 text-right font-result">{fmt(r.payment)}</td>
                            <td className="p-2 text-right font-result">{fmt(r.principal)}</td>
                            <td className="p-2 text-right font-result">{fmt(r.interest)}</td>
                            <td className="p-2 text-right font-result">{fmt(r.endBalance)}</td>
                          </tr>
                        ))
                      : result.schedule.map((r, i) => (
                          <tr key={r.month} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                            <td className="p-2">{r.month}</td>
                            <td className="p-2 text-right font-result">{fmt(r.payment)}</td>
                            <td className="p-2 text-right font-result">{fmt(r.principal)}</td>
                            <td className="p-2 text-right font-result">{fmt(r.interest)}</td>
                            <td className="p-2 text-right font-result">{fmt(r.balance)}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs leading-relaxed text-text-muted">
            Calculations use the standard fixed-rate amortization formula.
            Actual payments may vary due to fees, taxes, insurance, and lender
            terms. This calculator is for estimation purposes only.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type LoanInput = {
  id: number;
  name: string;
  amount: string;
  rate: string;
  term: string;
  fees: string;
};

let nextId = 3;

function calcLoan(amount: number, annualRate: number, termMonths: number, fees: number) {
  if (amount <= 0 || termMonths <= 0) return null;
  const totalLoan = amount + fees;

  if (annualRate <= 0) {
    const monthly = totalLoan / termMonths;
    return {
      monthlyPayment: monthly,
      totalPayment: totalLoan,
      totalInterest: 0,
      apr: 0,
      totalCost: totalLoan,
    };
  }

  const r = annualRate / 100 / 12;
  const n = termMonths;
  const monthly = totalLoan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = monthly * n;
  const totalInterest = totalPayment - totalLoan;
  const totalCost = totalPayment;

  // Approximate APR (simple estimate including fees)
  const effectiveAmount = amount;
  const aprMonthly = totalPayment / n;
  let aprLow = annualRate / 100;
  let aprHigh = annualRate / 100 + 0.5;
  for (let iter = 0; iter < 50; iter++) {
    const mid = (aprLow + aprHigh) / 2;
    const rm = mid / 12;
    const pmt = effectiveAmount * (rm * Math.pow(1 + rm, n)) / (Math.pow(1 + rm, n) - 1);
    if (pmt < aprMonthly) aprLow = mid;
    else aprHigh = mid;
  }
  const apr = ((aprLow + aprHigh) / 2) * 100;

  return { monthlyPayment: monthly, totalPayment, totalInterest, apr, totalCost };
}

export default function LoanComparisonCalculator() {
  const [loans, setLoans] = useState<LoanInput[]>([
    { id: 1, name: "Loan A", amount: "250000", rate: "6.5", term: "360", fees: "2000" },
    { id: 2, name: "Loan B", amount: "250000", rate: "7.0", term: "180", fees: "1500" },
  ]);

  const [currency, setCurrency] = useState("$");

  const updateLoan = (id: number, field: keyof LoanInput, value: string) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const addLoan = () => {
    if (loans.length >= 5) return;
    setLoans((prev) => [...prev, {
      id: nextId++,
      name: `Loan ${String.fromCharCode(65 + prev.length)}`,
      amount: "250000",
      rate: "7.0",
      term: "360",
      fees: "0",
    }]);
  };

  const removeLoan = (id: number) => {
    if (loans.length <= 2) return;
    setLoans((prev) => prev.filter((l) => l.id !== id));
  };

  const results = useMemo(() => {
    return loans.map((loan) => {
      const amount = parseFloat(loan.amount) || 0;
      const rate = parseFloat(loan.rate) || 0;
      const term = parseInt(loan.term) || 0;
      const fees = parseFloat(loan.fees) || 0;
      const calc = calcLoan(amount, rate, term, fees);
      return { ...loan, calc };
    });
  }, [loans]);

  const best = useMemo(() => {
    const valid = results.filter((r) => r.calc);
    if (valid.length < 2) return null;

    const lowestMonthly = valid.reduce((a, b) => (a.calc!.monthlyPayment < b.calc!.monthlyPayment ? a : b));
    const lowestTotal = valid.reduce((a, b) => (a.calc!.totalCost < b.calc!.totalCost ? a : b));
    const lowestInterest = valid.reduce((a, b) => (a.calc!.totalInterest < b.calc!.totalInterest ? a : b));

    return { lowestMonthly, lowestTotal, lowestInterest };
  }, [results]);

  const COLORS = ["bg-brand-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

  const inputCls = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-8">
      {/* Currency */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-text-muted">Currency Symbol</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-card px-2 text-sm outline-none">
          <option value="$">$ (USD)</option>
          <option value="£">£ (GBP)</option>
          <option value="€">€ (EUR)</option>
          <option value="₹">₹ (INR)</option>
          <option value="C$">C$ (CAD)</option>
          <option value="A$">A$ (AUD)</option>
        </select>
      </div>

      {/* Loan inputs */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loans.map((loan, idx) => (
          <div key={loan.id} className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", COLORS[idx])} />
                <input
                  value={loan.name}
                  onChange={(e) => updateLoan(loan.id, "name", e.target.value)}
                  className="border-none bg-transparent text-sm font-semibold text-text-primary outline-none w-28"
                />
              </div>
              {loans.length > 2 && (
                <button type="button" onClick={() => removeLoan(loan.id)} className="text-text-muted hover:text-red-500 text-xs">
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-text-muted">Loan Amount ({currency})</label>
                <input type="number" min={0} value={loan.amount} onChange={(e) => updateLoan(loan.id, "amount", e.target.value)} className={cn(inputCls, "mt-0.5")} />
              </div>
              <div>
                <label className="text-xs text-text-muted">Interest Rate (%)</label>
                <input type="number" min={0} step="0.1" value={loan.rate} onChange={(e) => updateLoan(loan.id, "rate", e.target.value)} className={cn(inputCls, "mt-0.5")} />
              </div>
              <div>
                <label className="text-xs text-text-muted">Term (months)</label>
                <input type="number" min={1} value={loan.term} onChange={(e) => updateLoan(loan.id, "term", e.target.value)} className={cn(inputCls, "mt-0.5")} />
                <p className="text-xs text-text-muted mt-0.5">{Math.floor((parseInt(loan.term) || 0) / 12)} yr {(parseInt(loan.term) || 0) % 12} mo</p>
              </div>
              <div>
                <label className="text-xs text-text-muted">Fees / Closing Costs</label>
                <input type="number" min={0} value={loan.fees} onChange={(e) => updateLoan(loan.id, "fees", e.target.value)} className={cn(inputCls, "mt-0.5")} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loans.length < 5 && (
        <button type="button" onClick={addLoan}
          className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-text-muted transition hover:border-brand-300 hover:text-brand-600">
          + Add Another Loan (max 5)
        </button>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="p-3">Metric</th>
              {results.map((r, i) => (
                <th key={r.id} className="p-3">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full", COLORS[i])} />
                    {r.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {[
              { label: "Loan Amount", key: "amount" as const },
              { label: "Interest Rate", key: "rate" as const },
              { label: "Term", key: "term" as const },
              { label: "Monthly Payment", key: "monthly" as const },
              { label: "Total Interest", key: "interest" as const },
              { label: "Total Cost", key: "total" as const },
              { label: "APR (est.)", key: "apr" as const },
            ].map((row) => (
              <tr key={row.key} className="hover:bg-surface-muted/40">
                <td className="p-3 font-medium text-text-primary">{row.label}</td>
                {results.map((r) => {
                  if (!r.calc) return <td key={r.id} className="p-3 text-text-muted">—</td>;
                  let val = "";
                  let isBest = false;
                  switch (row.key) {
                    case "amount": val = `${currency}${parseFloat(r.amount).toLocaleString()}`; break;
                    case "rate": val = `${r.rate}%`; break;
                    case "term": val = `${r.term} mo (${Math.floor(parseInt(r.term) / 12)} yr)`; break;
                    case "monthly":
                      val = `${currency}${r.calc.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      isBest = best?.lowestMonthly.id === r.id;
                      break;
                    case "interest":
                      val = `${currency}${r.calc.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      isBest = best?.lowestInterest.id === r.id;
                      break;
                    case "total":
                      val = `${currency}${r.calc.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      isBest = best?.lowestTotal.id === r.id;
                      break;
                    case "apr":
                      val = `${r.calc.apr.toFixed(2)}%`;
                      break;
                  }
                  return (
                    <td key={r.id} className={cn("p-3 font-result", isBest && "text-green-600 font-semibold")}>
                      {val} {isBest && <span className="text-xs">✓ Best</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Savings highlight */}
      {best && (() => {
        const worstTotal = Math.max(...results.filter((r) => r.calc).map((r) => r.calc!.totalCost));
        const savings = worstTotal - best.lowestTotal.calc!.totalCost;
        if (savings <= 0) return null;
        return (
          <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-5 text-center">
            <p className="text-sm font-medium text-green-600">Potential Savings with {best.lowestTotal.name}</p>
            <p className="mt-1 font-result text-3xl font-bold text-green-700">
              {currency}{savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-sm text-green-600/80">
              vs most expensive option over the full loan term
            </p>
          </div>
        );
      })()}

      {/* Visual bar comparison */}
      {results.filter((r) => r.calc).length >= 2 && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
          <p className="text-sm font-medium text-text-primary">Total Cost Comparison</p>
          {(() => {
            const maxCost = Math.max(...results.filter((r) => r.calc).map((r) => r.calc!.totalCost));
            return results.map((r, i) => {
              if (!r.calc) return null;
              const pct = (r.calc.totalCost / maxCost) * 100;
              return (
                <div key={r.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{r.name}</span>
                    <span className="font-result">{currency}{r.calc.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="h-4 rounded-full bg-surface-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", COLORS[i])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

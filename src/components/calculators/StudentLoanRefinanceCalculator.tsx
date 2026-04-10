"use client";

import { useMemo, useState } from "react";

function pmt(principal: number, annual: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annual / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function StudentLoanRefinanceCalculator() {
  const [bal, setBal] = useState("38000");
  const [rateOld, setRateOld] = useState("6.8");
  const [monthsLeft, setMonthsLeft] = useState("120");
  const [rateNew, setRateNew] = useState("5.1");
  const [monthsNew, setMonthsNew] = useState("120");

  const r = useMemo(() => {
    const P = Math.max(0, parseFloat(bal) || 0);
    const ro = Math.max(0, parseFloat(rateOld) || 0);
    const rn = Math.max(0, parseFloat(rateNew) || 0);
    const mo = Math.max(1, parseInt(monthsLeft, 10) || 120);
    const mn = Math.max(1, parseInt(monthsNew, 10) || 120);
    const payOld = pmt(P, ro, mo);
    const payNew = pmt(P, rn, mn);
    const totalOld = payOld * mo;
    const totalNew = payNew * mn;
    return { payOld, payNew, delta: payOld - payNew, totalOld, totalNew, save: totalOld - totalNew };
  }, [bal, rateOld, monthsLeft, rateNew, monthsNew]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Refinancing can lower the monthly bill, stretch the term, or both—sometimes you pay less per month but more interest over time. Compare both payment and total cost.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Current balance
          <input type="number" min={0} value={bal} onChange={(e) => setBal(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="text-sm font-medium">
          Current APR %
          <input type="number" min={0} step="0.01" value={rateOld} onChange={(e) => setRateOld(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="text-sm font-medium">
          Months remaining
          <input type="number" min={1} value={monthsLeft} onChange={(e) => setMonthsLeft(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="text-sm font-medium">
          New APR %
          <input type="number" min={0} step="0.01" value={rateNew} onChange={(e) => setRateNew(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          New term (months)
          <input type="number" min={1} value={monthsNew} onChange={(e) => setMonthsNew(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
      </div>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface-muted/50 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-text-muted">Current payment</p>
          <p className="text-xl font-semibold tabular-nums">{fmt(r.payOld)}</p>
          <p className="text-xs uppercase text-text-muted mt-3">New payment</p>
          <p className="text-xl font-semibold tabular-nums text-brand-700">{fmt(r.payNew)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-text-muted">Monthly savings</p>
          <p className="text-xl font-semibold tabular-nums text-emerald-700">{fmt(r.delta)}</p>
          <p className="text-xs uppercase text-text-muted mt-3">Total interest difference (illustrative)</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(r.save)}</p>
        </div>
      </div>
    </div>
  );
}

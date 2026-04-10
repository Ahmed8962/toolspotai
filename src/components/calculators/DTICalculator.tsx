"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type DebtItem = { id: number; label: string; amount: string };

let nextId = 5;

const DEFAULT_DEBTS: DebtItem[] = [
  { id: 1, label: "Mortgage / Rent", amount: "1500" },
  { id: 2, label: "Car loan", amount: "350" },
  { id: 3, label: "Student loan", amount: "250" },
  { id: 4, label: "Credit card minimum", amount: "150" },
];

function getDTIRating(dti: number): { label: string; color: string; desc: string } {
  if (dti <= 20) return { label: "Excellent", color: "text-emerald-700", desc: "Well below lender limits. You are in a strong financial position." };
  if (dti <= 35) return { label: "Good", color: "text-emerald-600", desc: "Manageable debt level. Most lenders will approve you." };
  if (dti <= 43) return { label: "Acceptable", color: "text-amber-600", desc: "At the upper limit for most mortgages (43% is the QM threshold)." };
  if (dti <= 50) return { label: "High", color: "text-orange-600", desc: "Exceeds conventional limits. May qualify for FHA or non-QM loans." };
  return { label: "Very High", color: "text-red-600", desc: "Significant financial strain. Focus on reducing debt before new borrowing." };
}

export default function DTICalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [grossIncome, setGrossIncome] = useState("6500");
  const [debts, setDebts] = useState<DebtItem[]>(DEFAULT_DEBTS);
  const [proposedPayment, setProposedPayment] = useState("");

  const fmt = (n: number) => formatMoney(n, currency);

  const updateDebt = (id: number, field: keyof DebtItem, value: string) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const addDebt = () => {
    setDebts((prev) => [...prev, { id: nextId++, label: "", amount: "0" }]);
  };

  const removeDebt = (id: number) => {
    if (debts.length <= 1) return;
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const result = useMemo(() => {
    const income = parseFloat(grossIncome) || 0;
    if (income <= 0) return null;

    let totalDebts = 0;
    const debtBreakdown: { label: string; amount: number }[] = [];
    for (const d of debts) {
      const amt = parseFloat(d.amount) || 0;
      totalDebts += amt;
      if (amt > 0) debtBreakdown.push({ label: d.label || "Other", amount: amt });
    }

    const proposed = parseFloat(proposedPayment) || 0;

    const frontEndDTI = debts.length > 0 ? ((parseFloat(debts[0].amount) || 0) / income) * 100 : 0;
    const backEndDTI = (totalDebts / income) * 100;
    const withProposed = ((totalDebts + proposed) / income) * 100;

    const rating = getDTIRating(backEndDTI);
    const ratingWithProposed = proposed > 0 ? getDTIRating(withProposed) : null;

    const maxPayment43 = income * 0.43 - totalDebts;
    const maxPayment36 = income * 0.36 - totalDebts;

    return {
      income, totalDebts, frontEndDTI, backEndDTI, withProposed, proposed,
      rating, ratingWithProposed, debtBreakdown,
      maxPayment43: Math.max(0, maxPayment43),
      maxPayment36: Math.max(0, maxPayment36),
      remainingIncome: income - totalDebts,
    };
  }, [grossIncome, debts, proposedPayment]);

  const inputCls = "mt-1 h-10 w-full rounded-lg border border-border bg-surface-card px-2.5 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Income */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Gross monthly income</p>
        <p className="text-xs text-text-muted mt-0.5">Before taxes and deductions</p>
        <input type="number" inputMode="decimal" min={0} value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)} className={cn(inputCls, "mt-2 max-w-sm h-12")} placeholder="e.g. 6500" />
      </div>

      {/* Debts */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Monthly debt payments</p>
        <p className="text-xs text-text-muted mt-0.5">Include minimum payments for all recurring debts</p>
        <div className="mt-3 space-y-2">
          {debts.map((d, idx) => (
            <div key={d.id} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-center">
              <input type="text" value={d.label} onChange={(e) => updateDebt(d.id, "label", e.target.value)} className={inputCls} placeholder={`Debt ${idx + 1}`} />
              <input type="number" inputMode="decimal" min={0} value={d.amount} onChange={(e) => updateDebt(d.id, "amount", e.target.value)} className={inputCls} placeholder="0" />
              <button type="button" onClick={() => removeDebt(d.id)} disabled={debts.length <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
                &times;
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addDebt} className="mt-3 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50">
          + Add debt
        </button>
      </div>

      {/* Proposed new payment */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Proposed new monthly payment (optional)</p>
        <p className="text-xs text-text-muted mt-0.5">E.g. a new mortgage or car loan you are considering</p>
        <input type="number" inputMode="decimal" min={0} value={proposedPayment} onChange={(e) => setProposedPayment(e.target.value)} className={cn(inputCls, "mt-2 max-w-sm h-12")} placeholder="e.g. 1200" />
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">Back-end DTI</p>
              <p className="font-result mt-1 text-3xl font-bold text-brand-700">{result.backEndDTI.toFixed(1)}%</p>
              <p className={cn("text-xs font-medium", result.rating.color)}>{result.rating.label}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Front-end DTI</p>
              <p className="font-result mt-1 text-2xl font-semibold">{result.frontEndDTI.toFixed(1)}%</p>
              <p className="text-xs text-text-muted">housing only</p>
            </div>
            {result.proposed > 0 && result.ratingWithProposed && (
              <div className="rounded-xl bg-surface-muted p-5 text-center">
                <p className="text-xs font-medium uppercase text-text-muted">DTI with new debt</p>
                <p className="font-result mt-1 text-2xl font-semibold">{result.withProposed.toFixed(1)}%</p>
                <p className={cn("text-xs font-medium", result.ratingWithProposed.color)}>{result.ratingWithProposed.label}</p>
              </div>
            )}
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Remaining income</p>
              <p className="font-result mt-1 text-2xl font-semibold text-emerald-700">{fmt(result.remainingIncome)}</p>
              <p className="text-xs text-text-muted">after debts</p>
            </div>
          </div>

          {/* DTI gauge */}
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-text-primary mb-3">DTI scale</p>
            <div className="relative h-6 w-full rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500">
              <div
                className="absolute top-0 h-full w-1 bg-white border-2 border-gray-800 rounded-full"
                style={{ left: `${Math.min(result.backEndDTI, 60) / 60 * 100}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>0%</span>
              <span>20% (excellent)</span>
              <span>36% (good)</span>
              <span>43% (max QM)</span>
              <span>50%+</span>
            </div>
            <p className={cn("mt-2 text-sm font-medium", result.rating.color)}>{result.rating.desc}</p>
          </div>

          {/* Debt breakdown */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Monthly breakdown</p>
            <div className="flex justify-between py-1.5 border-b border-border/60">
              <span className="text-text-muted">Gross monthly income</span>
              <span className="font-result">{fmt(result.income)}</span>
            </div>
            {result.debtBreakdown.map((d) => (
              <div key={d.label} className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-text-muted">{d.label}</span>
                <span className="font-result text-red-600">-{fmt(d.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 border-t-2 border-border font-semibold">
              <span>Total monthly debts</span>
              <span className="font-result">{fmt(result.totalDebts)}</span>
            </div>
          </div>

          {/* Max affordable */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Max new payment (43% DTI)</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.maxPayment43)}</p>
              <p className="text-xs text-text-muted">Qualified Mortgage limit</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Max new payment (36% DTI)</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">{fmt(result.maxPayment36)}</p>
              <p className="text-xs text-text-muted">Conservative target</p>
            </div>
          </div>

          {/* Lender guidelines */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Lender type</th>
                  <th className="p-2 text-center">Max front-end DTI</th>
                  <th className="p-2 text-center">Max back-end DTI</th>
                  <th className="p-2 text-center">Your status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { lender: "Conventional", front: 28, back: 36 },
                  { lender: "FHA", front: 31, back: 43 },
                  { lender: "VA", front: 0, back: 41 },
                  { lender: "USDA", front: 29, back: 41 },
                ].map((l, i) => {
                  const frontOk = l.front === 0 || result.frontEndDTI <= l.front;
                  const backOk = result.backEndDTI <= l.back;
                  const ok = frontOk && backOk;
                  return (
                    <tr key={l.lender} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                      <td className="p-2 font-medium">{l.lender}</td>
                      <td className="p-2 text-center">{l.front > 0 ? `${l.front}%` : "N/A"}</td>
                      <td className="p-2 text-center">{l.back}%</td>
                      <td className="p-2 text-center">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                          {ok ? "Qualifies" : "Over limit"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Front-end DTI = housing payment / gross income. Back-end DTI = all
            monthly debts / gross income. The 43% threshold is the Qualified
            Mortgage (QM) limit under US CFPB rules. Lenders may have
            additional requirements including credit score, down payment, and
            reserves.
          </p>
        </div>
      )}
    </div>
  );
}

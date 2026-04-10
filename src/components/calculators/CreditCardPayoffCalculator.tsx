"use client";

import {
  type CardInput,
  type Strategy,
  type PayoffResult,
  simulatePayoff,
  simulateMinimumOnly,
} from "@/lib/credit-card-payoff";
import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CalculatorAssumptions from "@/components/shared/CalculatorAssumptions";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CardRow = {
  id: number;
  name: string;
  balance: string;
  minPayment: string;
  apr: string;
};

const DEFAULT_CARDS: CardRow[] = [
  { id: 1, name: "Card 1", balance: "4600", minPayment: "100", apr: "18.99" },
  { id: 2, name: "Card 2", balance: "3900", minPayment: "90", apr: "19.99" },
  { id: 3, name: "Card 3", balance: "6000", minPayment: "120", apr: "15.99" },
];

let nextId = 4;

/* ─── Donut chart ─── */
function DonutChart({
  slices,
  fmt,
}: {
  slices: { label: string; value: number; color: string }[];
  fmt: (n: number) => string;
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
              <span className="font-result font-semibold">{fmt(s.value)}</span>
            </p>
          ))}
      </div>
    </div>
  );
}

/* ─── Balance-over-time bar chart ─── */
function BalanceOverTimeChart({
  schedule,
  fmt,
}: {
  schedule: PayoffResult["schedule"];
  fmt: (n: number) => string;
}) {
  if (schedule.length === 0) return null;
  // Show every Nth month to keep chart readable
  const step = schedule.length <= 24 ? 1 : schedule.length <= 60 ? 2 : Math.ceil(schedule.length / 30);
  const sampled = schedule.filter((_, i) => i % step === 0 || i === schedule.length - 1);
  const maxBal = Math.max(...sampled.map((r) => r.totalBalance), 1);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-text-primary">
        Total balance over time
      </p>
      <div className="flex items-end gap-[2px]" style={{ height: 140 }}>
        {sampled.map((row) => {
          const pct = (row.totalBalance / maxBal) * 100;
          return (
            <div
              key={row.month}
              className="group relative flex flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              title={`Month ${row.month}: ${fmt(row.totalBalance)} remaining`}
            >
              <div
                className="w-full rounded-t-[1px] bg-red-500 transition-all"
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
        <span>Month 1</span>
        <span>Month {schedule.length}</span>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function CreditCardPayoffCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [cards, setCards] = useState<CardRow[]>(DEFAULT_CARDS);
  const [budget, setBudget] = useState("500");
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [showSchedule, setShowSchedule] = useState(false);

  const fmt = (n: number) => formatMoney(n, currency);

  const updateCard = (id: number, field: keyof CardRow, value: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const addCard = () => {
    if (cards.length >= 10) return;
    setCards((prev) => [
      ...prev,
      { id: nextId++, name: `Card ${prev.length + 1}`, balance: "", minPayment: "", apr: "" },
    ]);
  };

  const removeCard = (id: number) => {
    if (cards.length <= 1) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const parsedCards: CardInput[] = useMemo(
    () =>
      cards
        .map((c) => ({
          id: c.id,
          name: c.name,
          balance: parseFloat(c.balance) || 0,
          minPayment: parseFloat(c.minPayment) || 0,
          apr: parseFloat(c.apr) || 0,
        }))
        .filter((c) => c.balance > 0 && c.minPayment > 0 && c.apr > 0),
    [cards],
  );

  const monthlyBudget = parseFloat(budget) || 0;
  const totalMinPayments = parsedCards.reduce((s, c) => s + c.minPayment, 0);
  const totalBalance = parsedCards.reduce((s, c) => s + c.balance, 0);
  const budgetTooLow = monthlyBudget > 0 && monthlyBudget < totalMinPayments;

  const result = useMemo(() => {
    if (parsedCards.length === 0 || monthlyBudget < totalMinPayments) return null;
    return simulatePayoff(parsedCards, monthlyBudget, strategy);
  }, [parsedCards, monthlyBudget, strategy, totalMinPayments]);

  const minOnlyResult = useMemo(() => {
    if (parsedCards.length === 0) return null;
    return simulateMinimumOnly(parsedCards);
  }, [parsedCards]);

  // Comparison: alternative strategy
  const altStrategy: Strategy = strategy === "avalanche" ? "snowball" : "avalanche";
  const altResult = useMemo(() => {
    if (parsedCards.length === 0 || monthlyBudget < totalMinPayments) return null;
    return simulatePayoff(parsedCards, monthlyBudget, altStrategy);
  }, [parsedCards, monthlyBudget, altStrategy, totalMinPayments]);

  const interestSaved =
    minOnlyResult && result
      ? minOnlyResult.totalInterest - result.totalInterest
      : 0;
  const monthsSaved =
    minOnlyResult && result ? minOnlyResult.months - result.months : 0;

  const donutSlices = result
    ? [
        { label: "Principal paid", value: totalBalance, color: "#2563eb" },
        { label: "Total interest", value: result.totalInterest, color: "#ef4444" },
      ]
    : [];

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-surface-card px-2.5 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <CalculatorAssumptions
        items={[
          "Interest each month uses APR ÷ 12 on each card’s balance (standard credit-card method).",
          "Assumes no new purchases, cash advances, penalty APR, or changing minimum-payment rules.",
          "After minimums are covered, extra paydown follows your strategy (avalanche or snowball).",
        ]}
      />

      {/* ── Monthly budget ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Monthly budget set aside for credit cards
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Total amount you can put toward all credit card payments each month.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={cn(inputCls, "max-w-48 h-12")}
            placeholder="e.g. 500"
          />
          <span className="text-sm text-text-muted">/ month</span>
        </div>
        {budgetTooLow && (
          <p className="mt-2 text-sm text-red-600">
            Budget must be at least {fmt(totalMinPayments)} to cover all minimum
            payments.
          </p>
        )}
      </div>

      {/* ── Cards table ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Your credit cards
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Enter balance, minimum payment, and APR for each card. Add up to 10 cards.
        </p>

        <div className="mt-4 space-y-3">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_2fr_1.5fr_1.5fr_auto] gap-2 text-xs font-medium text-text-muted px-1">
            <span>Name</span>
            <span>Balance</span>
            <span>Min payment</span>
            <span>Interest rate (APR %)</span>
            <span className="w-8" />
          </div>

          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_2fr_1.5fr_1.5fr_auto] items-center"
            >
              <input
                type="text"
                value={card.name}
                onChange={(e) => updateCard(card.id, "name", e.target.value)}
                className={cn(inputCls, "col-span-2 sm:col-span-1")}
                placeholder={`Card ${idx + 1}`}
              />
              <input
                type="number"
                inputMode="decimal"
                value={card.balance}
                onChange={(e) => updateCard(card.id, "balance", e.target.value)}
                className={inputCls}
                placeholder="Balance"
              />
              <input
                type="number"
                inputMode="decimal"
                value={card.minPayment}
                onChange={(e) => updateCard(card.id, "minPayment", e.target.value)}
                className={inputCls}
                placeholder="Min pmt"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={card.apr}
                  onChange={(e) => updateCard(card.id, "apr", e.target.value)}
                  className={inputCls}
                  placeholder="APR %"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                disabled={cards.length <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                title="Remove card"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCard}
          disabled={cards.length >= 10}
          className="mt-3 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-40"
        >
          + Add card
        </button>
      </div>

      {/* ── Strategy ── */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Payoff strategy
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Avalanche pays the highest APR first (saves the most interest).
          Snowball pays the smallest balance first (fastest psychological wins).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["avalanche", "Debt Avalanche (highest APR first)"],
              ["snowball", "Debt Snowball (lowest balance first)"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStrategy(val)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                strategy === val
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Results ─── */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Hero */}
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              Debt-free in
            </p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {result.months} months
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              ({Math.floor(result.months / 12)} years{" "}
              {result.months % 12 > 0 ? `${result.months % 12} months` : ""})
            </p>
          </div>

          {/* Savings vs minimum-only */}
          {minOnlyResult && (interestSaved > 1 || monthsSaved > 0) && (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-medium text-emerald-800">
                By paying {fmt(monthlyBudget)}/mo instead of just minimums, you save:
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-6">
                <div>
                  <p className="font-result text-2xl font-semibold text-emerald-700">
                    {fmt(interestSaved)}
                  </p>
                  <p className="text-xs text-emerald-600">in interest</p>
                </div>
                <div>
                  <p className="font-result text-2xl font-semibold text-emerald-700">
                    {monthsSaved} months
                  </p>
                  <p className="text-xs text-emerald-600">earlier payoff</p>
                </div>
              </div>
            </div>
          )}

          {/* Donut chart */}
          <DonutChart slices={donutSlices} fmt={fmt} />

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total balance</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(totalBalance)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total interest paid</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-red-600">
                {fmt(result.totalInterest)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Total amount paid</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(result.totalPaid)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Monthly payment</p>
              <p className="font-result mt-0.5 text-lg font-semibold">{fmt(monthlyBudget)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Payoff time</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {result.months} months
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="text-xs text-text-muted">Strategy</p>
              <p className="mt-0.5 text-lg font-semibold capitalize">
                {strategy === "avalanche" ? "Debt Avalanche" : "Debt Snowball"}
              </p>
            </div>
          </div>

          {/* Strategy comparison */}
          {altResult && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-text-primary">
                Strategy comparison
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="p-2" />
                      <th className="p-2 text-center">
                        {strategy === "avalanche" ? "Avalanche" : "Snowball"}
                        <span className="ml-1 text-xs text-brand-600">(selected)</span>
                      </th>
                      <th className="p-2 text-center">
                        {altStrategy === "avalanche" ? "Avalanche" : "Snowball"}
                      </th>
                      {minOnlyResult && (
                        <th className="p-2 text-center">Minimums only</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 text-text-muted">Months to payoff</td>
                      <td className="p-2 text-center font-result font-semibold">
                        {result.months}
                      </td>
                      <td className="p-2 text-center font-result">
                        {altResult.months}
                      </td>
                      {minOnlyResult && (
                        <td className="p-2 text-center font-result text-red-600">
                          {minOnlyResult.months}
                        </td>
                      )}
                    </tr>
                    <tr className="bg-surface-muted/60">
                      <td className="p-2 text-text-muted">Total interest</td>
                      <td className="p-2 text-center font-result font-semibold">
                        {fmt(result.totalInterest)}
                      </td>
                      <td className="p-2 text-center font-result">
                        {fmt(altResult.totalInterest)}
                      </td>
                      {minOnlyResult && (
                        <td className="p-2 text-center font-result text-red-600">
                          {fmt(minOnlyResult.totalInterest)}
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="p-2 text-text-muted">Total paid</td>
                      <td className="p-2 text-center font-result font-semibold">
                        {fmt(result.totalPaid)}
                      </td>
                      <td className="p-2 text-center font-result">
                        {fmt(altResult.totalPaid)}
                      </td>
                      {minOnlyResult && (
                        <td className="p-2 text-center font-result text-red-600">
                          {fmt(minOnlyResult.totalPaid)}
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-card summary */}
          {result.cardSummaries.length > 1 && (
            <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
              <p className="font-medium text-text-primary">Per-card breakdown</p>
              {result.cardSummaries.map((cs, i, arr) => (
                <div
                  key={cs.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 py-2",
                    i < arr.length - 1 && "border-b border-border/80",
                  )}
                >
                  <div>
                    <span className="font-medium text-text-primary">{cs.name}</span>
                    <span className="ml-2 text-text-muted">
                      {fmt(cs.originalBalance)} balance
                    </span>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-xs text-text-muted">Interest</p>
                      <p className="font-result text-red-600">{fmt(cs.totalInterest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Paid off</p>
                      <p className="font-result">Month {cs.payoffMonth}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Balance chart */}
          <BalanceOverTimeChart schedule={result.schedule} fmt={fmt} />

          {/* Monthly schedule */}
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule((s) => !s)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
            >
              {showSchedule ? "Hide" : "Show"} monthly payoff schedule
            </button>
            {showSchedule && (
              <div className="mt-4 max-h-[400px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface-muted">
                    <tr>
                      <th className="p-2">Month</th>
                      <th className="p-2">Payment</th>
                      <th className="p-2">Interest</th>
                      <th className="p-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.map((row, i) => (
                      <tr
                        key={row.month}
                        className={i % 2 === 1 ? "bg-surface-muted/60" : ""}
                      >
                        <td className="p-2">{row.month}</td>
                        <td className="p-2 font-result">{fmt(row.totalPayment)}</td>
                        <td className="p-2 font-result text-red-600">
                          {fmt(row.totalInterest)}
                        </td>
                        <td className="p-2 font-result">{fmt(row.totalBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Assumes no new charges, fixed minimum payments, and fixed APR.
            Interest is calculated monthly as APR/12 on the remaining balance.
            Actual credit card terms may vary — check your card agreement. Not
            financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

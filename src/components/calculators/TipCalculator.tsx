"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const TIP_PRESETS = [10, 15, 18, 20, 25, 30];

type RoundMode = "none" | "up" | "nearest";

export default function TipCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [bill, setBill] = useState("85.50");
  const [tipPct, setTipPct] = useState("18");
  const [customTip, setCustomTip] = useState(false);
  const [split, setSplit] = useState("1");
  const [roundMode, setRoundMode] = useState<RoundMode>("none");

  const fmt = (n: number) => formatMoney(n, currency);

  const billAmt = parseFloat(bill) || 0;
  const tip = parseFloat(tipPct) || 0;
  const people = Math.max(1, parseInt(split, 10) || 1);

  const result = useMemo(() => {
    if (billAmt <= 0) return null;
    const tipAmount = billAmt * (tip / 100);
    let total = billAmt + tipAmount;

    if (roundMode === "up") total = Math.ceil(total);
    else if (roundMode === "nearest") total = Math.round(total);

    const adjustedTip = total - billAmt;
    const perPerson = total / people;
    const tipPerPerson = adjustedTip / people;
    const effectivePct = billAmt > 0 ? (adjustedTip / billAmt) * 100 : 0;

    return { tipAmount: adjustedTip, total, perPerson, tipPerPerson, effectivePct };
  }, [billAmt, tip, people, roundMode]);

  const inputCls =
    "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Bill amount */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Bill amount</p>
        <div className="mt-3">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Total bill</span>
            <span className="font-result text-brand-700">{fmt(billAmt)}</span>
          </div>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            className={cn(inputCls, "mt-2")}
            placeholder="e.g. 85.50"
          />
        </div>
      </div>

      {/* Tip percentage */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Tip percentage</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIP_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setTipPct(String(p));
                setCustomTip(false);
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                !customTip && tip === p
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {p}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomTip(true)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              customTip
                ? "bg-brand-600 text-white"
                : "border border-border text-text-secondary hover:bg-surface-muted",
            )}
          >
            Custom
          </button>
        </div>
        {customTip && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              value={tipPct}
              onChange={(e) => setTipPct(e.target.value)}
              className={cn(inputCls, "max-w-32")}
              placeholder="e.g. 22"
            />
            <span className="text-sm text-text-muted">%</span>
          </div>
        )}
      </div>

      {/* Split & rounding */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Split between</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSplit(String(Math.max(1, people - 1)))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg font-medium text-text-secondary hover:bg-surface-muted"
              >
                &minus;
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={split}
                onChange={(e) => setSplit(e.target.value)}
                className="h-10 w-16 rounded-lg border border-border bg-surface-card text-center text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                type="button"
                onClick={() => setSplit(String(people + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg font-medium text-text-secondary hover:bg-surface-muted"
              >
                +
              </button>
              <span className="text-sm text-text-muted">
                {people === 1 ? "person" : "people"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Round total</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["none", "No rounding"],
                  ["up", "Round up"],
                  ["nearest", "Round nearest"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRoundMode(val)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    roundMode === val
                      ? "bg-brand-600 text-white"
                      : "border border-border text-text-secondary hover:bg-surface-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Tip amount</p>
              <p className="font-result mt-1 text-3xl font-semibold text-brand-700">
                {fmt(result.tipAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Total</p>
              <p className="font-result mt-1 text-3xl font-semibold text-emerald-700">
                {fmt(result.total)}
              </p>
            </div>
          </div>

          {people > 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-muted p-4 text-center">
                <p className="text-xs text-text-muted">Tip per person</p>
                <p className="font-result mt-0.5 text-lg font-semibold">
                  {fmt(result.tipPerPerson)}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-4 text-center">
                <p className="text-xs text-text-muted">Total per person</p>
                <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                  {fmt(result.perPerson)}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Breakdown</p>
            {[
              ["Bill", billAmt],
              [`Tip (${result.effectivePct.toFixed(1)}%)`, result.tipAmount],
            ].map(([label, val], i, arr) => (
              <div
                key={label as string}
                className={cn(
                  "flex justify-between py-2",
                  i < arr.length - 1 && "border-b border-border/80",
                )}
              >
                <span className="text-text-muted">{label as string}</span>
                <span className="font-result">{fmt(val as number)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-border pt-2 font-medium">
              <span className="text-text-primary">
                Total{people > 1 ? ` (÷ ${people})` : ""}
              </span>
              <span className="font-result text-emerald-700">
                {fmt(result.total)}
                {people > 1 && (
                  <span className="ml-2 text-sm font-normal text-text-muted">
                    ({fmt(result.perPerson)} each)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Quick comparison table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Tip %</th>
                  <th className="p-2 text-center">Tip</th>
                  <th className="p-2 text-center">Total</th>
                  {people > 1 && <th className="p-2 text-center">Per person</th>}
                </tr>
              </thead>
              <tbody>
                {TIP_PRESETS.map((p, i) => {
                  const t = billAmt * (p / 100);
                  const tot = billAmt + t;
                  return (
                    <tr
                      key={p}
                      className={cn(
                        i % 2 === 1 && "bg-surface-muted/60",
                        p === tip && "bg-brand-50 font-semibold",
                      )}
                    >
                      <td className="p-2">{p}%</td>
                      <td className="p-2 text-center font-result">{fmt(t)}</td>
                      <td className="p-2 text-center font-result">{fmt(tot)}</td>
                      {people > 1 && (
                        <td className="p-2 text-center font-result">
                          {fmt(tot / people)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Standard tipping in the US: 15-20% for sit-down restaurants, 10-15%
            for takeout, 15-20% for delivery. In the UK and Europe, 10-15% or
            rounding up is typical. Check local customs.
          </p>
        </div>
      )}
    </div>
  );
}

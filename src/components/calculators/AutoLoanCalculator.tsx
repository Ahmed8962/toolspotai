"use client";

import { useState, useMemo } from "react";
import CalculatorAssumptions from "@/components/shared/CalculatorAssumptions";
import { cn } from "@/lib/utils";

type VehicleType = "new" | "used" | "luxury" | "truck";

const VEHICLE_PRESETS: {
  type: VehicleType;
  label: string;
  icon: string;
  defaultRate: number;
}[] = [
  { type: "new", label: "New Car", icon: "🚗", defaultRate: 5.5 },
  { type: "used", label: "Used Car", icon: "🔧", defaultRate: 7.5 },
  { type: "luxury", label: "Luxury", icon: "✨", defaultRate: 4.9 },
  { type: "truck", label: "Truck / SUV", icon: "🛻", defaultRate: 6.0 },
];

const TERM_OPTIONS = [24, 36, 48, 60, 72, 84];

type AmortRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(n: number) {
  return usd.format(n);
}

function calcAutoLoan(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
) {
  if (loanAmount <= 0 || termMonths <= 0) return null;

  if (annualRate === 0) {
    const payment = loanAmount / termMonths;
    const schedule: AmortRow[] = [];
    let balance = loanAmount;
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
    return {
      payment,
      totalInterest: 0,
      totalPayment: loanAmount,
      loanAmount,
      schedule,
    };
  }

  const r = annualRate / 100 / 12;
  const n = termMonths;
  const payment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = payment * n;
  const totalInterest = totalPayment - loanAmount;

  const schedule: AmortRow[] = [];
  let balance = loanAmount;
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

  return { payment, totalInterest, totalPayment, loanAmount, schedule };
}

function DonutChart({
  principal,
  interest,
}: {
  principal: number;
  interest: number;
}) {
  const total = principal + interest;
  if (total === 0) return null;
  const pPct = (principal / total) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-44 w-44"
        style={{
          borderRadius: "50%",
          background: `conic-gradient(#3b82f6 0% ${pPct}%, #f59e0b ${pPct}% 100%)`,
        }}
      >
        <div className="absolute inset-5 rounded-full bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="font-result text-lg font-bold text-brand-700">
              {fmt(total)}
            </p>
            <p className="text-[10px] text-text-muted">Total Cost</p>
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

function BreakdownBar({
  vehiclePrice,
  downPayment,
  tradeIn,
  salesTaxAmt,
  totalInterest,
}: {
  vehiclePrice: number;
  downPayment: number;
  tradeIn: number;
  salesTaxAmt: number;
  totalInterest: number;
}) {
  const totalOut = vehiclePrice + salesTaxAmt + totalInterest;
  if (totalOut <= 0) return null;

  const segments = [
    { label: "Vehicle", value: vehiclePrice - downPayment - tradeIn, color: "bg-blue-500" },
    { label: "Down Payment", value: downPayment, color: "bg-emerald-500" },
    { label: "Trade-In", value: tradeIn, color: "bg-teal-500" },
    { label: "Sales Tax", value: salesTaxAmt, color: "bg-rose-400" },
    { label: "Interest", value: totalInterest, color: "bg-amber-500" },
  ].filter((s) => s.value > 0);

  const maxVal = Math.max(...segments.map((s) => s.value));

  return (
    <div className="space-y-2 rounded-xl border border-border p-4">
      <p className="text-sm font-medium text-text-primary mb-3">Payment Breakdown</p>
      {segments.map((seg) => (
        <div key={seg.label} className="flex items-center gap-3 text-xs">
          <span className="w-24 shrink-0 text-text-muted">{seg.label}</span>
          <div className="flex-1 h-5 rounded-full bg-surface-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", seg.color)}
              style={{ width: `${(seg.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="w-24 text-right font-result shrink-0">{fmt(seg.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AutoLoanCalculator() {
  const [vehicleType, setVehicleType] = useState<VehicleType>("new");
  const [vehiclePrice, setVehiclePrice] = useState("35000");
  const [downPaymentAmt, setDownPaymentAmt] = useState("5000");
  const [downPaymentPct, setDownPaymentPct] = useState("14.29");
  const [downPaymentMode, setDownPaymentMode] = useState<"$" | "%">("$");
  const [tradeIn, setTradeIn] = useState("0");
  const [salesTaxRate, setSalesTaxRate] = useState("6.0");
  const [rate, setRate] = useState("5.5");
  const [termMonths, setTermMonths] = useState(60);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleRows, setScheduleRows] = useState(12);

  const handlePreset = (preset: (typeof VEHICLE_PRESETS)[number]) => {
    setVehicleType(preset.type);
    setRate(String(preset.defaultRate));
  };

  const syncDownPaymentFromAmt = (amt: string) => {
    setDownPaymentAmt(amt);
    const price = parseFloat(vehiclePrice) || 0;
    const val = parseFloat(amt) || 0;
    if (price > 0) setDownPaymentPct(((val / price) * 100).toFixed(2));
  };

  const syncDownPaymentFromPct = (pct: string) => {
    setDownPaymentPct(pct);
    const price = parseFloat(vehiclePrice) || 0;
    const val = parseFloat(pct) || 0;
    setDownPaymentAmt(((val / 100) * price).toFixed(0));
  };

  const result = useMemo(() => {
    const price = parseFloat(vehiclePrice) || 0;
    const down = parseFloat(downPaymentAmt) || 0;
    const trade = parseFloat(tradeIn) || 0;
    const taxRate = parseFloat(salesTaxRate) || 0;
    const annualRate = parseFloat(rate) || 0;

    const taxableAmount = price - trade;
    const salesTaxAmt = Math.max(0, taxableAmount) * (taxRate / 100);
    const loanAmount = Math.max(0, price - down - trade + salesTaxAmt);

    const calc = calcAutoLoan(loanAmount, annualRate, termMonths);
    if (!calc) return null;

    return {
      ...calc,
      salesTaxAmt,
      downPayment: down,
      tradeIn: trade,
      vehiclePrice: price,
      totalCost: down + trade + calc.totalPayment,
    };
  }, [vehiclePrice, downPaymentAmt, tradeIn, salesTaxRate, rate, termMonths]);

  const inputCls =
    "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CalculatorAssumptions
        items={[
          "Loan = vehicle price − down payment − trade-in + sales tax on the taxable base we model (state tax rules vary).",
          "Fixed APR and level monthly payments; excludes dealer doc fees, registration, GAP, and promotional 0% quirks.",
        ]}
      />

      {/* Vehicle type presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VEHICLE_PRESETS.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => handlePreset(p)}
            className={cn(
              "rounded-xl px-3 py-3 text-left transition",
              vehicleType === p.type
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
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Vehicle Price ($)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={vehiclePrice}
              onChange={(e) => {
                setVehiclePrice(e.target.value);
                if (downPaymentMode === "%") {
                  const pct = parseFloat(downPaymentPct) || 0;
                  const price = parseFloat(e.target.value) || 0;
                  setDownPaymentAmt(((pct / 100) * price).toFixed(0));
                }
              }}
              className={inputCls}
              placeholder="35000"
            />
          </label>

          <div className="block text-sm text-text-secondary">
            <div className="flex items-center justify-between">
              <span>Down Payment</span>
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setDownPaymentMode("$")}
                  className={cn(
                    "px-2.5 py-1 transition",
                    downPaymentMode === "$"
                      ? "bg-brand-600 text-white"
                      : "bg-surface-card text-text-secondary hover:bg-surface-muted",
                  )}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => setDownPaymentMode("%")}
                  className={cn(
                    "px-2.5 py-1 transition",
                    downPaymentMode === "%"
                      ? "bg-brand-600 text-white"
                      : "bg-surface-card text-text-secondary hover:bg-surface-muted",
                  )}
                >
                  %
                </button>
              </div>
            </div>
            {downPaymentMode === "$" ? (
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={downPaymentAmt}
                onChange={(e) => syncDownPaymentFromAmt(e.target.value)}
                className={inputCls}
                placeholder="5000"
              />
            ) : (
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.5}
                value={downPaymentPct}
                onChange={(e) => syncDownPaymentFromPct(e.target.value)}
                className={inputCls}
                placeholder="14.29"
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm text-text-secondary">
            Trade-In Value ($)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={tradeIn}
              onChange={(e) => setTradeIn(e.target.value)}
              className={inputCls}
              placeholder="0"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Sales Tax Rate (%)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={20}
              step={0.1}
              value={salesTaxRate}
              onChange={(e) => setSalesTaxRate(e.target.value)}
              className={inputCls}
              placeholder="6.0"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Interest Rate (%)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={30}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={inputCls}
              placeholder="5.5"
            />
          </label>
        </div>

        {/* Loan term buttons */}
        <div>
          <p className="text-sm text-text-secondary mb-2">Loan Term (months)</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TERM_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTermMonths(t)}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-medium transition",
                  termMonths === t
                    ? "bg-brand-600 text-white"
                    : "border border-border text-text-secondary hover:bg-surface-muted",
                )}
              >
                {t} mo
                <span className="block text-[10px] opacity-70">
                  {(t / 12).toFixed(1)} yr
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">
                Monthly Payment
              </p>
              <p className="font-result mt-1 text-3xl font-semibold text-brand-700">
                {fmt(result.payment)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">
                Loan Amount
              </p>
              <p className="font-result mt-1 text-3xl font-semibold text-blue-600">
                {fmt(result.loanAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">
                Total Interest
              </p>
              <p className="font-result mt-1 text-3xl font-semibold text-amber-600">
                {fmt(result.totalInterest)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">
                Total Cost
              </p>
              <p className="font-result mt-1 text-3xl font-semibold text-emerald-700">
                {fmt(result.totalCost)}
              </p>
            </div>
          </div>

          <DonutChart
            principal={result.loanAmount}
            interest={result.totalInterest}
          />

          <BreakdownBar
            vehiclePrice={result.vehiclePrice}
            downPayment={result.downPayment}
            tradeIn={result.tradeIn}
            salesTaxAmt={result.salesTaxAmt}
            totalInterest={result.totalInterest}
          />

          {/* Summary */}
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Loan Summary</p>
            {(
              [
                ["Vehicle Price", result.vehiclePrice],
                ["Down Payment", result.downPayment],
                ["Trade-In Value", result.tradeIn],
                ["Sales Tax", result.salesTaxAmt],
                ["Financed Amount", result.loanAmount],
                ["Monthly Payment", result.payment],
                ["Total Interest Paid", result.totalInterest],
                ["Total of All Payments", result.totalPayment],
                ["Total Cost (incl. down + trade-in)", result.totalCost],
              ] as [string, number][]
            ).map(([label, val]) => (
              <div
                key={label}
                className="flex justify-between py-1.5 border-b border-border/60 last:border-0"
              >
                <span className="text-text-muted">{label}</span>
                <span
                  className={cn(
                    "font-result",
                    label === "Down Payment" || label === "Trade-In Value"
                      ? "text-emerald-600"
                      : label === "Total Interest Paid" || label === "Sales Tax"
                        ? "text-rose-600"
                        : "",
                  )}
                >
                  {label === "Down Payment" || label === "Trade-In Value"
                    ? `−${fmt(val)}`
                    : fmt(val)}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-1.5">
              <span className="text-text-muted">Interest-to-Principal Ratio</span>
              <span className="font-result">
                {((result.totalInterest / (result.loanAmount || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Amortization schedule */}
          <div>
            <button
              type="button"
              onClick={() => {
                setShowSchedule(!showSchedule);
                setScheduleRows(12);
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition"
            >
              {showSchedule ? "Hide" : "Show"} Amortization Schedule
            </button>
          </div>

          {showSchedule && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted sticky top-0">
                    <tr>
                      <th className="p-2">Month</th>
                      <th className="p-2 text-right">Payment</th>
                      <th className="p-2 text-right">Principal</th>
                      <th className="p-2 text-right">Interest</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule.slice(0, scheduleRows).map((r, i) => (
                      <tr
                        key={r.month}
                        className={i % 2 === 1 ? "bg-surface-muted/60" : ""}
                      >
                        <td className="p-2">{r.month}</td>
                        <td className="p-2 text-right font-result">
                          {fmt(r.payment)}
                        </td>
                        <td className="p-2 text-right font-result">
                          {fmt(r.principal)}
                        </td>
                        <td className="p-2 text-right font-result">
                          {fmt(r.interest)}
                        </td>
                        <td className="p-2 text-right font-result">
                          {fmt(r.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {scheduleRows < result.schedule.length && (
                <button
                  type="button"
                  onClick={() =>
                    setScheduleRows(result.schedule.length)
                  }
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                >
                  Show all {result.schedule.length} months
                </button>
              )}
              {scheduleRows >= result.schedule.length &&
                result.schedule.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setScheduleRows(12)}
                    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                  >
                    Collapse to 12 months
                  </button>
                )}
            </div>
          )}

          <p className="text-xs leading-relaxed text-text-muted">
            Calculations use the standard fixed-rate amortization formula (M = P
            × r × (1+r)ⁿ / ((1+r)ⁿ − 1)). Sales tax is applied to the vehicle
            price minus trade-in value, per common US state rules. Actual
            payments may vary due to dealer fees, registration, insurance, and
            lender terms. This calculator is for estimation purposes only.
          </p>
        </div>
      )}
    </div>
  );
}

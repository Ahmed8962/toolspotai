"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "addTax" | "removeTax" | "findRate";

const MODES: { value: Mode; label: string }[] = [
  { value: "addTax", label: "Add tax to price" },
  { value: "removeTax", label: "Remove tax from price" },
  { value: "findRate", label: "Find tax rate" },
];

type TaxPreset = { label: string; rate: number; country: string; currency: CurrencyCode };

const PRESETS: TaxPreset[] = [
  { label: "UK VAT", rate: 20, country: "🇬🇧", currency: "GBP" },
  { label: "EU Average", rate: 21, country: "🇪🇺", currency: "EUR" },
  { label: "Germany", rate: 19, country: "🇩🇪", currency: "EUR" },
  { label: "France", rate: 20, country: "🇫🇷", currency: "EUR" },
  { label: "Italy", rate: 22, country: "🇮🇹", currency: "EUR" },
  { label: "Spain", rate: 21, country: "🇪🇸", currency: "EUR" },
  { label: "Netherlands", rate: 21, country: "🇳🇱", currency: "EUR" },
  { label: "US (avg state)", rate: 7.12, country: "🇺🇸", currency: "USD" },
  { label: "California", rate: 7.25, country: "🇺🇸", currency: "USD" },
  { label: "New York", rate: 8.0, country: "🇺🇸", currency: "USD" },
  { label: "Texas", rate: 6.25, country: "🇺🇸", currency: "USD" },
  { label: "India GST", rate: 18, country: "🇮🇳", currency: "INR" },
  { label: "Canada GST", rate: 5, country: "🇨🇦", currency: "USD" },
  { label: "Australia GST", rate: 10, country: "🇦🇺", currency: "USD" },
];

export default function VATCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("GBP");
  const [mode, setMode] = useState<Mode>("addTax");
  const [amount, setAmount] = useState("100");
  const [taxRate, setTaxRate] = useState("20");
  const [grossAmount, setGrossAmount] = useState("");
  const [netAmount, setNetAmount] = useState("");

  const fmt = (n: number) => formatMoney(n, currency);

  const handlePreset = (p: TaxPreset) => {
    setTaxRate(String(p.rate));
    setCurrency(p.currency);
  };

  const result = useMemo(() => {
    const rate = parseFloat(taxRate) || 0;

    if (mode === "addTax") {
      const net = parseFloat(amount) || 0;
      if (net <= 0) return null;
      const tax = net * (rate / 100);
      const gross = net + tax;
      return { net, tax, gross, rate };
    }

    if (mode === "removeTax") {
      const gross = parseFloat(amount) || 0;
      if (gross <= 0) return null;
      const net = gross / (1 + rate / 100);
      const tax = gross - net;
      return { net, tax, gross, rate };
    }

    // findRate
    const gross = parseFloat(grossAmount) || 0;
    const net = parseFloat(netAmount) || 0;
    if (net <= 0 || gross <= net) return null;
    const tax = gross - net;
    const foundRate = (tax / net) * 100;
    return { net, tax, gross, rate: foundRate };
  }, [mode, amount, taxRate, grossAmount, netAmount]);

  const inputCls = "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Mode */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.value} type="button" onClick={() => setMode(m.value)} className={cn("rounded-lg px-4 py-2.5 text-sm font-medium transition", mode === m.value ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Tax rate presets */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-2">Quick tax rates</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => handlePreset(p)} className={cn("rounded border border-border px-2 py-1.5 text-xs transition hover:bg-surface-muted", parseFloat(taxRate) === p.rate && "bg-brand-50 border-brand-300 font-medium")}>
              {p.country} {p.label} ({p.rate}%)
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        {mode === "findRate" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              Price excluding tax (net)
              <input type="number" inputMode="decimal" min={0} value={netAmount} onChange={(e) => setNetAmount(e.target.value)} className={inputCls} placeholder="e.g. 100" />
            </label>
            <label className="block text-sm text-text-secondary">
              Price including tax (gross)
              <input type="number" inputMode="decimal" min={0} value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} className={inputCls} placeholder="e.g. 120" />
            </label>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              {mode === "addTax" ? "Price excluding tax (net)" : "Price including tax (gross)"}
              <input type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="e.g. 100" />
            </label>
            <label className="block text-sm text-text-secondary">
              Tax rate (%)
              <input type="number" inputMode="decimal" min={0} max={100} step={0.25} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} placeholder="e.g. 20" />
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Net (excl. tax)</p>
              <p className="font-result mt-1 text-2xl font-semibold">{fmt(result.net)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-amber-600">Tax amount</p>
              <p className="font-result mt-1 text-2xl font-semibold text-amber-700">{fmt(result.tax)}</p>
              <p className="text-xs text-amber-600">{result.rate.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">Gross (incl. tax)</p>
              <p className="font-result mt-1 text-2xl font-bold text-brand-700">{fmt(result.gross)}</p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Breakdown</p>
            {[
              ["Price excluding tax", result.net],
              [`Tax (${result.rate.toFixed(2)}%)`, result.tax],
              ["Price including tax", result.gross],
            ].map(([label, val], i) => (
              <div key={label as string} className={cn("flex justify-between py-1.5", i === 2 ? "border-t-2 border-border font-semibold" : "border-b border-border/60")}>
                <span className="text-text-muted">{label as string}</span>
                <span className="font-result">{fmt(val as number)}</span>
              </div>
            ))}
          </div>

          {/* Quick comparison */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Tax rate</th>
                  <th className="p-2 text-right">Net</th>
                  <th className="p-2 text-right">Tax</th>
                  <th className="p-2 text-right">Gross</th>
                </tr>
              </thead>
              <tbody>
                {[5, 7, 10, 15, 19, 20, 21, 22, 25].map((r, i) => {
                  const base = mode === "removeTax" ? result.gross / (1 + r / 100) : result.net;
                  const t = base * (r / 100);
                  return (
                    <tr key={r} className={cn(i % 2 === 1 && "bg-surface-muted/60", Math.abs(r - result.rate) < 0.01 && "bg-brand-50 font-semibold")}>
                      <td className="p-2">{r}%</td>
                      <td className="p-2 text-right font-result">{fmt(base)}</td>
                      <td className="p-2 text-right font-result">{fmt(t)}</td>
                      <td className="p-2 text-right font-result">{fmt(base + t)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            VAT (Value Added Tax) is used in the UK (20%), EU (15-27%), and many
            other countries. US sales tax varies by state (0-10.25%). GST
            (Goods and Services Tax) applies in India (5-28%), Australia (10%),
            and Canada (5%). Tax rates shown are standard rates — reduced rates
            may apply to certain goods and services.
          </p>
        </div>
      )}
    </div>
  );
}

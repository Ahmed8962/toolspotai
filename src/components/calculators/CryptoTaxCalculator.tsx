"use client";

import { useMemo, useState } from "react";

function fmt(n: number, cur: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
}

/** Rough illustrative rates — not tax advice; laws change. */
const ROUGH: Record<string, { label: string; rate: number; cur: string }> = {
  us: { label: "USA (illustrative short-term gain bracket)", rate: 0.22, cur: "USD" },
  uk: { label: "UK (illustrative CGT higher band — round)", rate: 0.24, cur: "GBP" },
  eu: { label: "EU (generic — use your country’s rules)", rate: 0.26, cur: "EUR" },
};

export default function CryptoTaxCalculator() {
  const [region, setRegion] = useState<keyof typeof ROUGH>("us");
  const [gain, setGain] = useState("12000");
  const [customRate, setCustomRate] = useState("");

  const r = useMemo(() => {
    const g = Math.max(0, parseFloat(gain) || 0);
    const cfg = ROUGH[region];
    const rate = customRate !== "" ? Math.min(0.6, Math.max(0, (parseFloat(customRate) || 0) / 100)) : cfg.rate;
    const tax = g * rate;
    const net = g - tax;
    return { g, rate, tax, net, cfg };
  }, [gain, region, customRate]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        Crypto tax is jurisdiction-specific (holding period, income stacking, wash rules, and more). This is a{" "}
        <strong>rough pencil sketch</strong> so you know what questions to ask a tax pro—not a filing number.
        <span className="mt-2 block text-amber-900/90">
          Preset rates are illustrative (2026-style examples)—laws and brackets change; verify before you file.
        </span>
      </div>
      <label className="block text-sm font-medium">
        Region preset
        <select value={region} onChange={(e) => setRegion(e.target.value as keyof typeof ROUGH)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2">
          {Object.entries(ROUGH).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Net taxable gain (after cost basis — your figure)
        <input type="number" min={0} value={gain} onChange={(e) => setGain(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
      </label>
      <label className="block text-sm font-medium">
        Override effective rate % (optional)
        <input
          type="number"
          min={0}
          max={60}
          placeholder="leave blank for preset"
          value={customRate}
          onChange={(e) => setCustomRate(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums"
        />
      </label>
      <div className="rounded-2xl border border-border bg-surface-muted/50 p-5">
        <p className="text-xs uppercase text-text-muted">Illustrative tax reserve</p>
        <p className="text-3xl font-semibold tabular-nums text-brand-700">{fmt(r.tax, r.cfg.cur)}</p>
        <p className="mt-4 text-xs uppercase text-text-muted">Illustrative after-tax gain</p>
        <p className="text-2xl font-semibold tabular-nums">{fmt(r.net, r.cfg.cur)}</p>
        <p className="mt-2 text-xs text-text-muted">Assumed effective rate: {(r.rate * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}

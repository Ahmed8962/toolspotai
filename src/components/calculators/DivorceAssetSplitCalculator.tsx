"use client";

import { useMemo, useState } from "react";
import LegalDisclaimer from "@/components/calculators/LegalDisclaimer";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function DivorceAssetSplitCalculator() {
  const [assets, setAssets] = useState("420000");
  const [debts, setDebts] = useState("68000");
  const [pctA, setPctA] = useState(50);

  const result = useMemo(() => {
    const a = Math.max(0, parseFloat(assets) || 0);
    const d = Math.max(0, parseFloat(debts) || 0);
    const net = Math.max(0, a - d);
    const shareA = pctA / 100;
    const shareB = 1 - shareA;
    return {
      net,
      toA: net * shareA,
      toB: net * shareB,
    };
  }, [assets, debts, pctA]);

  return (
    <div className="space-y-6">
      <LegalDisclaimer />
      <p className="text-sm text-text-muted">
        Community vs. separate property, pensions, and court orders change everything. This tool only splits a single net pool by percentage—useful for “what-if” math, not filing paperwork.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-text-primary">
          Total marital assets (estimate)
          <input
            type="number"
            min={0}
            value={assets}
            onChange={(e) => setAssets(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 tabular-nums"
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Total marital debts (estimate)
          <input
            type="number"
            min={0}
            value={debts}
            onChange={(e) => setDebts(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 tabular-nums"
          />
        </label>
      </div>
      <div>
        <div className="flex justify-between text-sm text-text-muted">
          <span>Party A share of net</span>
          <span className="tabular-nums font-medium">{pctA}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pctA}
          onChange={(e) => setPctA(parseInt(e.target.value, 10))}
          className="mt-2 w-full accent-brand-600"
        />
      </div>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface-muted/50 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">Net marital estate</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{fmt(result.net)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">Party A</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-brand-700">{fmt(result.toA)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">Party B</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-brand-700">{fmt(result.toB)}</p>
        </div>
      </div>
    </div>
  );
}

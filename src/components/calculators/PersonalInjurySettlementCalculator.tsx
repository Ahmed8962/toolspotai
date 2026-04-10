"use client";

import { useMemo, useState } from "react";
import LegalDisclaimer from "@/components/calculators/LegalDisclaimer";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function PersonalInjurySettlementCalculator() {
  const [medical, setMedical] = useState("25000");
  const [lostWages, setLostWages] = useState("8000");
  const [multiplier, setMultiplier] = useState(2.5);

  const result = useMemo(() => {
    const m = Math.max(0, parseFloat(medical) || 0);
    const w = Math.max(0, parseFloat(lostWages) || 0);
    const econ = m + w;
    const pain = econ * multiplier;
    const total = econ + pain;
    const low = total * 0.55;
    const high = total * 1.35;
    return { econ, pain, total, low, high, m, w };
  }, [medical, lostWages, multiplier]);

  return (
    <div className="space-y-6">
      <LegalDisclaimer />
      <p className="text-sm text-text-muted">
        Plaintiffs and insurers sometimes use a rough “specials × multiplier” approach for pain and suffering on top of medical bills and lost income—real cases involve liability, policy limits, and jurisdiction. Use this only to frame a conversation with counsel.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-text-primary">
          Medical bills (special damages)
          <input
            type="number"
            min={0}
            value={medical}
            onChange={(e) => setMedical(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 font-[family-name:var(--font-dm-sans)] text-text-primary tabular-nums"
          />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Lost wages (documented)
          <input
            type="number"
            min={0}
            value={lostWages}
            onChange={(e) => setLostWages(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2 font-[family-name:var(--font-dm-sans)] text-text-primary tabular-nums"
          />
        </label>
      </div>
      <div>
        <div className="flex justify-between text-sm text-text-muted">
          <span>Pain & suffering multiplier (common range ~1.5–5)</span>
          <span className="tabular-nums font-medium text-text-primary">{multiplier.toFixed(1)}×</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={multiplier}
          onChange={(e) => setMultiplier(parseFloat(e.target.value))}
          className="mt-2 w-full accent-brand-600"
        />
      </div>
      <div className="rounded-2xl border border-border bg-surface-muted/50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Rough economic base</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{fmt(result.econ)}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Implied general damages (econ × multiplier)</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-700">{fmt(result.pain)}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">Illustrative total (not a prediction)</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-text-primary">{fmt(result.total)}</p>
        <p className="mt-3 text-sm text-text-muted">
          Wide negotiation band (purely illustrative): <strong className="text-text-primary">{fmt(result.low)}</strong> –{" "}
          <strong className="text-text-primary">{fmt(result.high)}</strong>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function BusinessValuationCalculator() {
  const [sde, setSde] = useState("185000");
  const [mult, setMult] = useState(3);

  const r = useMemo(() => {
    const s = Math.max(0, parseFloat(sde) || 0);
    const low = s * (mult - 0.5);
    const mid = s * mult;
    const high = s * (mult + 0.5);
    return { low, mid, high, s };
  }, [sde, mult]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Small businesses are often ballparked from seller’s discretionary earnings (SDE) times an industry multiple—roughly 2–4× for many Main Street deals, higher for SaaS with recurring revenue. Adjust with a broker or CPA who knows your niche.
      </p>
      <label className="block text-sm font-medium">
        SDE (annual, $)
        <input type="number" min={0} value={sde} onChange={(e) => setSde(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
      </label>
      <div>
        <div className="flex justify-between text-sm text-text-muted">
          <span>Multiple</span>
          <span className="tabular-nums font-medium">{mult.toFixed(1)}×</span>
        </div>
        <input type="range" min={1.5} max={6} step={0.1} value={mult} onChange={(e) => setMult(parseFloat(e.target.value))} className="mt-2 w-full accent-brand-600" />
      </div>
      <div className="rounded-2xl border border-border bg-surface-muted/50 p-5">
        <p className="text-xs uppercase text-text-muted">Indicative range</p>
        <p className="mt-2 text-sm text-text-secondary">
          Low: <strong className="text-text-primary">{fmt(r.low)}</strong>
        </p>
        <p className="text-sm text-text-secondary">
          Mid: <strong className="text-text-primary">{fmt(r.mid)}</strong>
        </p>
        <p className="text-sm text-text-secondary">
          High: <strong className="text-text-primary">{fmt(r.high)}</strong>
        </p>
      </div>
    </div>
  );
}

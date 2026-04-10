"use client";

import { useMemo, useState } from "react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function SocialMediaAdRoiCalculator() {
  const [spend, setSpend] = useState("5000");
  const [revenue, setRevenue] = useState("18500");
  const [conv, setConv] = useState("142");

  const r = useMemo(() => {
    const s = Math.max(0, parseFloat(spend) || 0);
    const rev = Math.max(0, parseFloat(revenue) || 0);
    const c = Math.max(0, parseFloat(conv) || 0);
    const roas = s > 0 ? rev / s : 0;
    const roi = s > 0 ? ((rev - s) / s) * 100 : 0;
    const cpa = c > 0 ? s / c : 0;
    return { roas, roi, cpa, s, rev, c };
  }, [spend, revenue, conv]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Tie ad spend to revenue you can honestly attribute—whether that is last-click in your ad platform or a blended model from your CRM. Garbage in, garbage out.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium">
          Ad spend (period)
          <input type="number" min={0} value={spend} onChange={(e) => setSpend(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="text-sm font-medium">
          Attributed revenue
          <input type="number" min={0} value={revenue} onChange={(e) => setRevenue(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="text-sm font-medium">
          Conversions (optional)
          <input type="number" min={0} value={conv} onChange={(e) => setConv(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
      </div>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface-muted/50 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">ROAS</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-700">{r.roas.toFixed(2)}×</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">ROI</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{r.roi.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">CPA (if conv. &gt; 0)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{fmt(r.cpa)}</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import LegalDisclaimer from "@/components/calculators/LegalDisclaimer";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const TIERS = [
  { id: "soft", label: "Minor (soft tissue / short treatment)", factor: 1.2 },
  { id: "mod", label: "Moderate (ongoing treatment)", factor: 2.2 },
  { id: "sev", label: "Severe (hospitalization / long recovery)", factor: 4 },
] as const;

export default function CarAccidentCompensationCalculator() {
  const [property, setProperty] = useState("4500");
  const [medical, setMedical] = useState("12000");
  const [wages, setWages] = useState("3500");
  const [tier, setTier] = useState<(typeof TIERS)[number]["id"]>("mod");

  const result = useMemo(() => {
    const p = Math.max(0, parseFloat(property) || 0);
    const m = Math.max(0, parseFloat(medical) || 0);
    const w = Math.max(0, parseFloat(wages) || 0);
    const f = TIERS.find((t) => t.id === tier)?.factor ?? 2;
    const nonProp = m + w;
    const gen = nonProp * f;
    const total = p + nonProp + gen;
    return { p, nonProp, gen, total, f };
  }, [property, medical, wages, tier]);

  return (
    <div className="space-y-6">
      <LegalDisclaimer />
      <p className="text-sm text-text-muted">
        Real auto claims depend on fault, coverage limits, state rules, and documentation. This blends property damage with a rough “general damages” layer on medical and wage specials—conversation starter only.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-text-primary">
          Vehicle / property damage
          <input type="number" min={0} value={property} onChange={(e) => setProperty(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Medical (billed specials)
          <input type="number" min={0} value={medical} onChange={(e) => setMedical(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
        <label className="block text-sm font-medium text-text-primary">
          Lost wages
          <input type="number" min={0} value={wages} onChange={(e) => setWages(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 tabular-nums" />
        </label>
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">Injury severity band (affects general damages)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                tier === t.id ? "border-brand-500 bg-brand-50 text-brand-800" : "border-border text-text-secondary hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface-muted/50 p-5">
        <p className="text-sm text-text-muted">Property repair / total loss allocation</p>
        <p className="text-2xl font-semibold tabular-nums">{fmt(result.p)}</p>
        <p className="mt-4 text-sm text-text-muted">Medical + wages (economic)</p>
        <p className="text-2xl font-semibold tabular-nums">{fmt(result.nonProp)}</p>
        <p className="mt-4 text-sm text-text-muted">Illustrative general damages (~{result.f}× on economic)</p>
        <p className="text-2xl font-semibold tabular-nums text-brand-700">{fmt(result.gen)}</p>
        <p className="mt-4 text-xs uppercase text-text-muted">Rough combined illustration</p>
        <p className="text-3xl font-semibold tabular-nums text-text-primary">{fmt(result.total)}</p>
      </div>
    </div>
  );
}

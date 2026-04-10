"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Unit = "us" | "uk" | "metric";

const UNIT_CFG: Record<Unit, { distLabel: string; effLabel: string; fuelUnit: string; volLabel: string }> = {
  us: { distLabel: "miles", effLabel: "MPG (US)", fuelUnit: "gallons (US)", volLabel: "gal" },
  uk: { distLabel: "miles", effLabel: "MPG (UK)", fuelUnit: "gallons (UK)", volLabel: "gal" },
  metric: { distLabel: "km", effLabel: "L/100km", fuelUnit: "litres", volLabel: "L" },
};

const PRESETS = [
  { label: "🚗 Compact Car", effUS: 35, effUK: 42, effMetric: 6.7 },
  { label: "🚙 SUV / Crossover", effUS: 25, effUK: 30, effMetric: 9.4 },
  { label: "🛻 Pickup Truck", effUS: 20, effUK: 24, effMetric: 11.8 },
  { label: "🏍️ Motorcycle", effUS: 50, effUK: 60, effMetric: 4.7 },
  { label: "🚐 Van / Minivan", effUS: 22, effUK: 26, effMetric: 10.7 },
  { label: "⚡ Hybrid", effUS: 50, effUK: 60, effMetric: 4.7 },
];

const FUEL_PRICES: { label: string; unit: Unit; price: number }[] = [
  { label: "🇺🇸 US avg $3.50/gal", unit: "us", price: 3.5 },
  { label: "🇬🇧 UK avg £1.45/L", unit: "uk", price: 1.45 },
  { label: "🇩🇪 Germany avg €1.70/L", unit: "metric", price: 1.7 },
  { label: "🇫🇷 France avg €1.65/L", unit: "metric", price: 1.65 },
  { label: "🇦🇺 Australia avg A$1.90/L", unit: "metric", price: 1.9 },
  { label: "🇨🇦 Canada avg C$1.55/L", unit: "metric", price: 1.55 },
];

export default function FuelCostCalculator() {
  const [unit, setUnit] = useState<Unit>("us");
  const [distance, setDistance] = useState("500");
  const [efficiency, setEfficiency] = useState("30");
  const [fuelPrice, setFuelPrice] = useState("3.50");
  const [roundTrip, setRoundTrip] = useState(false);

  const cfg = UNIT_CFG[unit];

  const result = useMemo(() => {
    const dist = parseFloat(distance) || 0;
    const eff = parseFloat(efficiency) || 0;
    const price = parseFloat(fuelPrice) || 0;
    if (dist <= 0 || eff <= 0 || price <= 0) return null;

    const actualDist = roundTrip ? dist * 2 : dist;
    let fuelUsed: number;

    if (unit === "metric") {
      fuelUsed = (eff / 100) * actualDist;
    } else {
      fuelUsed = actualDist / eff;
    }

    const totalCost = fuelUsed * price;
    const costPerMileKm = totalCost / actualDist;

    return { fuelUsed, totalCost, costPerMileKm, actualDist };
  }, [distance, efficiency, fuelPrice, unit, roundTrip]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    if (unit === "us") setEfficiency(String(p.effUS));
    else if (unit === "uk") setEfficiency(String(p.effUK));
    else setEfficiency(String(p.effMetric));
  };

  const applyFuelPrice = (p: typeof FUEL_PRICES[0]) => {
    setUnit(p.unit);
    setFuelPrice(String(p.price));
  };

  const inputCls = "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-8">
      {/* Unit system */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["us", "🇺🇸 US (MPG)"], ["uk", "🇬🇧 UK (MPG)"], ["metric", "🌍 Metric (L/100km)"]] as const).map(([u, lbl]) => (
          <button
            key={u}
            type="button"
            onClick={() => {
              setUnit(u);
              if (u === "us") { setEfficiency("30"); setFuelPrice("3.50"); }
              else if (u === "uk") { setEfficiency("36"); setFuelPrice("6.50"); }
              else { setEfficiency("8"); setFuelPrice("1.60"); }
            }}
            className={cn("flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              unit === u ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-text-muted">Distance ({cfg.distLabel})</label>
            <input type="number" inputMode="decimal" min={0} value={distance} onChange={(e) => setDistance(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">Fuel Efficiency ({cfg.effLabel})</label>
            <input type="number" inputMode="decimal" min={0} value={efficiency} onChange={(e) => setEfficiency(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">Fuel Price (per {unit === "metric" || unit === "uk" ? "litre" : "gallon"})</label>
            <input type="number" inputMode="decimal" min={0} step="0.01" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand-600" />
          Round trip (double the distance)
        </label>
      </div>

      {/* Vehicle presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => applyPreset(p)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-brand-50 hover:border-brand-200">
            {p.label}
          </button>
        ))}
      </div>

      {/* Fuel price presets */}
      <div className="flex flex-wrap gap-2">
        {FUEL_PRICES.map((p) => (
          <button key={p.label} type="button" onClick={() => applyFuelPrice(p)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-brand-50 hover:border-brand-200">
            {p.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
            <p className="text-xs font-medium text-emerald-600">Total Fuel Cost</p>
            <p className="mt-1 font-result text-3xl font-bold text-emerald-700">
              {result.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 p-5 text-center">
            <p className="text-xs font-medium text-blue-600">Fuel Needed</p>
            <p className="mt-1 font-result text-3xl font-bold text-blue-700">
              {result.fuelUsed.toFixed(1)} {cfg.volLabel}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 p-5 text-center">
            <p className="text-xs font-medium text-violet-600">Cost per {cfg.distLabel.slice(0, -1)}</p>
            <p className="mt-1 font-result text-3xl font-bold text-violet-700">
              {result.costPerMileKm.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Comparison table */}
      {result && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="p-2">Trip Distance</th>
                <th className="p-2 text-right">Fuel ({cfg.volLabel})</th>
                <th className="p-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[50, 100, 250, 500, 1000, 2000].map((d, i) => {
                let fuel: number;
                if (unit === "metric") fuel = (parseFloat(efficiency) / 100) * d;
                else fuel = d / parseFloat(efficiency);
                const cost = fuel * parseFloat(fuelPrice);
                const isSelected = Math.abs(d - result.actualDist) < 1;
                return (
                  <tr key={d} className={cn(i % 2 === 1 && "bg-surface-muted/60", isSelected && "bg-brand-50 font-semibold")}>
                    <td className="p-2 font-result">{d.toLocaleString()} {cfg.distLabel}</td>
                    <td className="p-2 text-right font-result">{fuel.toFixed(1)}</td>
                    <td className="p-2 text-right font-result">{cost.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

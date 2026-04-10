"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Units = "metric" | "imperial";
type Gender = "male" | "female";

function kgToLbs(kg: number): number { return kg * 2.20462; }
function lbsToKg(lbs: number): number { return lbs * 0.453592; }

type FormulaResult = { name: string; desc: string; kg: number | null };

function computeFormulas(gender: Gender, heightCm: number): FormulaResult[] {
  if (heightCm <= 0) return [];
  const inchesOver5ft = Math.max(0, (heightCm / 2.54) - 60);

  const devine = gender === "male"
    ? 50 + 2.3 * inchesOver5ft
    : 45.5 + 2.3 * inchesOver5ft;

  const robinson = gender === "male"
    ? 52 + 1.9 * inchesOver5ft
    : 49 + 1.7 * inchesOver5ft;

  const miller = gender === "male"
    ? 56.2 + 1.41 * inchesOver5ft
    : 53.1 + 1.36 * inchesOver5ft;

  const hamwi = gender === "male"
    ? 48 + 2.7 * inchesOver5ft
    : 45.5 + 2.2 * inchesOver5ft;

  const heightM = heightCm / 100;
  const bmiLow = 18.5 * heightM * heightM;
  const bmiHigh = 24.9 * heightM * heightM;

  return [
    { name: "Devine", desc: "Most widely used in medical settings", kg: devine },
    { name: "Robinson", desc: "Revised Devine formula (1983)", kg: robinson },
    { name: "Miller", desc: "Alternative lighter estimate", kg: miller },
    { name: "Hamwi", desc: "Clinical standard formula", kg: hamwi },
    { name: "BMI Range", desc: "Healthy BMI 18.5–24.9 range", kg: (bmiLow + bmiHigh) / 2 },
  ];
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-amber-600" };
  if (bmi < 25) return { label: "Healthy", color: "text-green-600" };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600" };
  return { label: "Obese", color: "text-red-600" };
}

export default function IdealWeightCalculator() {
  const [units, setUnits] = useState<Units>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [currentWeight, setCurrentWeight] = useState("");

  const heightCmVal = units === "metric" ? parseFloat(heightCm) || 0 : ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;
  const currentWeightKg = currentWeight
    ? (units === "metric" ? parseFloat(currentWeight) : lbsToKg(parseFloat(currentWeight) || 0))
    : null;

  const formulas = useMemo(() => computeFormulas(gender, heightCmVal), [gender, heightCmVal]);

  const result = useMemo(() => {
    if (formulas.length === 0 || !formulas[0].kg) return null;

    const weights = formulas.filter((f) => f.kg !== null).map((f) => f.kg!);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    const heightM = heightCmVal / 100;
    const bmiLow = 18.5 * heightM * heightM;
    const bmiHigh = 24.9 * heightM * heightM;

    let currentBMI: number | null = null;
    let diffFromIdeal: number | null = null;
    if (currentWeightKg && currentWeightKg > 0) {
      currentBMI = currentWeightKg / (heightM * heightM);
      diffFromIdeal = currentWeightKg - avg;
    }

    return { avg, min, max, bmiLow, bmiHigh, currentBMI, diffFromIdeal, heightM };
  }, [formulas, heightCmVal, currentWeightKg]);

  const displayWeight = (kg: number): string => {
    if (units === "imperial") return `${Math.round(kgToLbs(kg))} lbs`;
    return `${Math.round(kg * 10) / 10} kg`;
  };

  const inputCls = "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-6">
      {/* Unit toggle */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["metric", "Metric (cm/kg)"], ["imperial", "Imperial (ft/lbs)"]] as const).map(([u, lbl]) => (
          <button key={u} type="button" onClick={() => setUnits(u)}
            className={cn("flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              units === u ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        {/* Gender */}
        <div>
          <label className="text-xs font-medium text-text-muted">Gender</label>
          <div className="flex gap-1 mt-1">
            {(["male", "female"] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)}
                className={cn("flex-1 rounded-lg py-3 text-sm font-medium border transition",
                  gender === g ? "bg-brand-600 text-white border-brand-600" : "bg-white border-border text-text-muted hover:text-text-primary")}>
                {g === "male" ? "♂ Male" : "♀ Female"}
              </button>
            ))}
          </div>
        </div>

        {/* Height */}
        {units === "metric" ? (
          <div>
            <label className="text-xs font-medium text-text-muted">Height (cm)</label>
            <input type="number" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted">Height (ft)</label>
              <input type="number" min={3} max={8} value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className={cn(inputCls, "mt-1")} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted">Height (in)</label>
              <input type="number" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className={cn(inputCls, "mt-1")} />
            </div>
          </div>
        )}

        {/* Current weight (optional) */}
        <div>
          <label className="text-xs font-medium text-text-muted">
            Current weight ({units === "metric" ? "kg" : "lbs"}) — optional
          </label>
          <input type="number" min={1} inputMode="decimal" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)}
            placeholder="Enter to see comparison" className={cn(inputCls, "mt-1")} />
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Ideal weight range hero */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 sm:p-8 text-white text-center">
            <p className="text-sm font-medium opacity-80">Your Ideal Weight Range</p>
            <p className="mt-2 font-result text-3xl sm:text-4xl font-bold">
              {displayWeight(result.min)} – {displayWeight(result.max)}
            </p>
            <p className="mt-2 text-sm opacity-80">
              Average across all formulas: <strong>{displayWeight(result.avg)}</strong>
            </p>
            {result.currentBMI !== null && result.diffFromIdeal !== null && (
              <div className="mt-4 rounded-xl bg-white/15 px-4 py-2 inline-block">
                <span className="text-sm">
                  Current BMI: <strong>{result.currentBMI.toFixed(1)}</strong>
                  <span className={cn("ml-2", bmiCategory(result.currentBMI).color.replace("text-", "text-white/"))}>
                    ({bmiCategory(result.currentBMI).label})
                  </span>
                  {" · "}
                  {result.diffFromIdeal > 0
                    ? `${displayWeight(Math.abs(result.diffFromIdeal))} above ideal`
                    : result.diffFromIdeal < 0
                    ? `${displayWeight(Math.abs(result.diffFromIdeal))} below ideal`
                    : "At ideal weight!"}
                </span>
              </div>
            )}
          </div>

          {/* Visual weight range bar */}
          <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-text-primary mb-3">Weight Range Visualization</p>
            {(() => {
              const rangeMin = result.bmiLow * 0.85;
              const rangeMax = result.bmiHigh * 1.3;
              const span = rangeMax - rangeMin;
              const idealStartPct = ((result.bmiLow - rangeMin) / span) * 100;
              const idealEndPct = ((result.bmiHigh - rangeMin) / span) * 100;
              const currentPct = currentWeightKg ? Math.min(100, Math.max(0, ((currentWeightKg - rangeMin) / span) * 100)) : null;

              return (
                <div className="relative">
                  <div className="h-6 rounded-full bg-gradient-to-r from-amber-200 via-green-300 to-amber-200 relative overflow-hidden">
                    <div className="absolute inset-y-0 bg-green-400/60 rounded-full"
                      style={{ left: `${idealStartPct}%`, width: `${idealEndPct - idealStartPct}%` }} />
                  </div>
                  {currentPct !== null && (
                    <div className="absolute top-0 h-6 flex items-center" style={{ left: `${currentPct}%` }}>
                      <div className="w-1 h-8 bg-brand-600 rounded-full -mt-1 shadow" />
                    </div>
                  )}
                  <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
                    <span>Underweight</span>
                    <span className="text-green-600 font-medium">Healthy range</span>
                    <span>Overweight</span>
                  </div>
                  <div className="flex justify-between mt-0.5 text-xs text-text-secondary">
                    <span>{displayWeight(result.bmiLow)}</span>
                    <span>{displayWeight(result.bmiHigh)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* All formulas table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <div className="bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-medium text-text-primary">Results by Formula</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted/60">
                <tr>
                  <th className="p-3">Formula</th>
                  <th className="p-3">Ideal Weight</th>
                  <th className="p-3 hidden sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {formulas.map((f) => (
                  <tr key={f.name} className="hover:bg-surface-muted/40">
                    <td className="p-3 font-medium text-text-primary">{f.name}</td>
                    <td className="p-3 font-result font-semibold text-text-primary">
                      {f.kg ? displayWeight(f.kg) : "N/A"}
                      {f.name === "BMI Range" && f.kg && (
                        <span className="text-xs text-text-muted ml-1">
                          ({displayWeight(result.bmiLow)} – {displayWeight(result.bmiHigh)})
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-text-muted hidden sm:table-cell">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual bar chart */}
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-3">
            <p className="text-sm font-medium text-text-primary">Formula Comparison</p>
            {(() => {
              const maxW = Math.max(...formulas.filter((f) => f.kg).map((f) => f.kg!));
              return formulas.filter((f) => f.kg).map((f) => (
                <div key={f.name} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text-primary">{f.name}</span>
                    <span className="font-result text-text-secondary">{displayWeight(f.kg!)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-surface-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                      style={{ width: `${(f.kg! / maxW) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </>
      )}

      <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800">
        Ideal weight varies significantly based on body composition, muscle mass, bone density, and individual health factors. These formulas provide general guidelines — they are not medical advice. Consult your healthcare provider for personalized recommendations.
      </div>
    </div>
  );
}

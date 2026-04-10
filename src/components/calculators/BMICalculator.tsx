"use client";

import { BMIGauge } from "@/components/calculators/BMIGauge";
import {
  bmiFromImperialLbIn,
  bmiFromMetricKgCm,
  bmiPrime,
  categoryFromBmi,
  categoryLabels,
  categoryShortLabel,
  cmToMeters,
  ftInToInches,
  healthyWeightRangeKg,
  ponderalIndex,
  totalLbFromStLb,
} from "@/lib/bmi";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type UnitTab = "us" | "metric" | "other";

type Gender = "male" | "female";

type ResultState = {
  bmi: number;
  category: ReturnType<typeof categoryFromBmi>;
  heightM: number;
  weightKg: number;
  ponderal: number;
  prime: number;
  healthyMinKg: number;
  healthyMaxKg: number;
  age: number;
  unitTab: UnitTab;
};

const KG_PER_LB = 0.45359237;

function lbToKg(lb: number) {
  return lb * KG_PER_LB;
}

function kgToLb(kg: number) {
  return kg / KG_PER_LB;
}

export default function BMICalculator() {
  const [tab, setTab] = useState<UnitTab>("metric");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState<Gender>("male");

  const [kg, setKg] = useState("");
  const [cm, setCm] = useState("");

  const [lb, setLb] = useState("");
  const [ft, setFt] = useState("");
  const [inch, setInch] = useState("");

  const [st, setSt] = useState("");
  const [stLb, setStLb] = useState("");

  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearForm = useCallback(() => {
    setKg("");
    setCm("");
    setLb("");
    setFt("");
    setInch("");
    setSt("");
    setStLb("");
    setResult(null);
    setError(null);
  }, []);

  const switchTab = (t: UnitTab) => {
    setTab(t);
    setResult(null);
    setError(null);
  };

  const calculate = () => {
    setError(null);
    const ageN = parseInt(age, 10);
    if (Number.isNaN(ageN) || ageN < 2 || ageN > 120) {
      setError("Please enter a valid age between 2 and 120.");
      setResult(null);
      return;
    }

    let bmi = NaN;
    let heightM = NaN;
    let weightKg = NaN;

    if (tab === "metric") {
      const w = parseFloat(kg);
      const h = parseFloat(cm);
      if (Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0) {
        setError("Enter valid height (cm) and weight (kg).");
        setResult(null);
        return;
      }
      heightM = cmToMeters(h);
      weightKg = w;
      bmi = bmiFromMetricKgCm(w, h);
    } else if (tab === "us") {
      const wLb = parseFloat(lb);
      const f = parseFloat(ft) || 0;
      const i = parseFloat(inch) || 0;
      const totalIn = ftInToInches(f, i);
      if (Number.isNaN(wLb) || totalIn <= 0 || wLb <= 0) {
        setError("Enter valid height (ft, in) and weight (lb).");
        setResult(null);
        return;
      }
      heightM = totalIn * 0.0254;
      weightKg = lbToKg(wLb);
      bmi = bmiFromImperialLbIn(wLb, totalIn);
    } else {
      const stones = parseFloat(st) || 0;
      const remLb = parseFloat(stLb) || 0;
      const f = parseFloat(ft) || 0;
      const i = parseFloat(inch) || 0;
      const totalIn = ftInToInches(f, i);
      const totalLb = totalLbFromStLb(stones, remLb);
      if (totalIn <= 0 || totalLb <= 0 || remLb < 0) {
        setError("Enter valid height (ft, in) and weight (stone + pounds, total weight must be positive).");
        setResult(null);
        return;
      }
      heightM = totalIn * 0.0254;
      weightKg = lbToKg(totalLb);
      bmi = bmiFromImperialLbIn(totalLb, totalIn);
    }

    if (!Number.isFinite(bmi) || bmi <= 0) {
      setError("Could not compute BMI from your inputs.");
      setResult(null);
      return;
    }

    const hRange = healthyWeightRangeKg(heightM);
    const pond = ponderalIndex(weightKg, heightM);
    const prime = bmiPrime(bmi);

    setResult({
      bmi,
      category: categoryFromBmi(bmi),
      heightM,
      weightKg,
      ponderal: pond,
      prime,
      healthyMinKg: hRange.minKg,
      healthyMaxKg: hRange.maxKg,
      age: ageN,
      unitTab: tab,
    });
  };

  const catColor = (c: ResultState["category"]) => {
    if (c === "normal") return "text-emerald-600";
    if (c === "underweight") return "text-amber-600";
    return "text-amber-700";
  };

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2.5 text-sm text-white"
        role="note"
      >
        <span aria-hidden>↓</span>
        <span>Modify the values and click Calculate to use</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-muted p-1">
            {(
              [
                ["US Units", "us"],
                ["Metric Units", "metric"],
                ["Other Units", "other"],
              ] as const
            ).map(([label, u]) => (
              <button
                key={u}
                type="button"
                onClick={() => switchTab(u)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                  tab === u
                    ? "bg-surface-card text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary sm:col-span-2">
              Age
              <input
                type="number"
                inputMode="numeric"
                min={2}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 h-11 w-full max-w-xs rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <span className="mt-1 block text-xs text-text-muted">ages: 2 – 120</span>
            </label>

            <div className="sm:col-span-2">
              <span className="text-sm text-text-secondary">Gender</span>
              <div className="mt-2 flex gap-6">
                {(
                  [
                    ["male", "Male"],
                    ["female", "Female"],
                  ] as const
                ).map(([v, lab]) => (
                  <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === v}
                      onChange={() => setGender(v)}
                      className="accent-brand-600"
                    />
                    {lab}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {tab === "metric" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-text-secondary">
                Height
                <div className="relative mt-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cm}
                    onChange={(e) => setCm(e.target.value)}
                    placeholder="180"
                    className="h-11 w-full rounded-lg border border-border bg-surface-card pr-10 pl-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    cm
                  </span>
                </div>
              </label>
              <label className="block text-sm text-text-secondary">
                Weight
                <div className="relative mt-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={kg}
                    onChange={(e) => setKg(e.target.value)}
                    placeholder="65"
                    className="h-11 w-full rounded-lg border border-border bg-surface-card pr-10 pl-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    kg
                  </span>
                </div>
              </label>
            </div>
          )}

          {tab === "us" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-text-secondary">
                  Height — feet
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ft}
                    onChange={(e) => setFt(e.target.value)}
                    placeholder="5"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <label className="block text-sm text-text-secondary">
                  Height — inches
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inch}
                    onChange={(e) => setInch(e.target.value)}
                    placeholder="10"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
              </div>
              <label className="block text-sm text-text-secondary">
                Weight
                <div className="relative mt-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={lb}
                    onChange={(e) => setLb(e.target.value)}
                    placeholder="160"
                    className="h-11 w-full max-w-xs rounded-lg border border-border bg-surface-card pr-10 pl-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    pounds
                  </span>
                </div>
              </label>
            </div>
          )}

          {tab === "other" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Other units: height in feet and inches, weight in stone and pounds (UK-style).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-text-secondary">
                  Height — feet
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ft}
                    onChange={(e) => setFt(e.target.value)}
                    placeholder="5"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <label className="block text-sm text-text-secondary">
                  Height — inches
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inch}
                    onChange={(e) => setInch(e.target.value)}
                    placeholder="10"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-text-secondary">
                  Weight — stone
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={st}
                    onChange={(e) => setSt(e.target.value)}
                    placeholder="11"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <label className="block text-sm text-text-secondary">
                  Weight — pounds
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={13.99}
                    value={stLb}
                    onChange={(e) => setStLb(e.target.value)}
                    placeholder="4"
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={calculate}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <span aria-hidden>▶</span>
              Calculate
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="rounded-lg border border-border bg-surface-muted px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="min-h-[200px] rounded-xl border border-border bg-surface-muted/50 p-4 lg:p-6">
          {!result ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Enter your details and press Calculate to see your BMI, gauge, and metrics.
            </p>
          ) : (
            <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
              <div className="flex items-center justify-between rounded-t-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                <span>Result</span>
              </div>
              <p className="text-lg font-semibold text-text-primary">
                BMI ={" "}
                <span className="font-result text-xl text-brand-700">{result.bmi.toFixed(1)}</span>{" "}
                kg/m² (
                <span className={cn("font-medium", catColor(result.category))}>
                  {categoryShortLabel(result.category)}
                </span>
                )
              </p>
              <p className="text-xs text-text-muted">
                {categoryLabels[result.category]}
              </p>

              <BMIGauge bmi={result.bmi} />

              <ul className="space-y-2 text-sm text-text-secondary">
                <li>
                  <strong className="text-text-primary">Healthy BMI range:</strong> 18.5 kg/m² – 25
                  kg/m²
                </li>
                <li>
                  <strong className="text-text-primary">Healthy weight for your height:</strong>{" "}
                  {result.unitTab === "metric"
                    ? `${result.healthyMinKg.toFixed(1)} kg – ${result.healthyMaxKg.toFixed(1)} kg`
                    : `${kgToLb(result.healthyMinKg).toFixed(1)} lbs – ${kgToLb(result.healthyMaxKg).toFixed(1)} lbs`}
                </li>
                <li>
                  <strong className="text-text-primary">BMI Prime:</strong>{" "}
                  <span className="font-result">{result.prime.toFixed(2)}</span>
                </li>
                <li>
                  <strong className="text-text-primary">Ponderal Index:</strong>{" "}
                  <span className="font-result">{result.ponderal.toFixed(1)}</span> kg/m³
                </li>
              </ul>

              {result.age < 18 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  For children and teens, BMI must be interpreted using age- and sex-specific growth
                  charts. Adult categories above do not apply the same way.
                </p>
              )}

              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                <strong>Disclaimer:</strong> BMI is a screening tool, not a diagnosis. Age and gender
                are collected to match this calculator layout; standard adult BMI categories apply to
                ages 18+. Consult a healthcare professional for personal advice.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-secondary">
        The Body Mass Index (BMI) Calculator computes BMI and weight status from height and weight.
        Use <strong>US Units</strong> for pounds and feet/inches, <strong>Metric Units</strong> for
        kilograms and centimeters, or <strong>Other Units</strong> for stone and pounds with
        feet/inches. Results also include{" "}
        <strong className="font-medium text-text-primary">BMI Prime</strong> (BMI ÷ 25) and the{" "}
        <strong className="font-medium text-text-primary">Ponderal Index</strong> (weight ÷ height³).
        Not medical advice.
      </p>
    </div>
  );
}

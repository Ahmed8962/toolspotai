"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Gender = "male" | "female";
type Unit = "metric" | "imperial";
type Method = "navy" | "bmi" | "skinfold";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

const CATEGORIES_MALE = [
  { label: "Essential Fat", min: 2, max: 5, color: "bg-red-500" },
  { label: "Athletes", min: 6, max: 13, color: "bg-blue-500" },
  { label: "Fitness", min: 14, max: 17, color: "bg-emerald-500" },
  { label: "Average", min: 18, max: 24, color: "bg-amber-500" },
  { label: "Obese", min: 25, max: 50, color: "bg-red-600" },
] as const;

const CATEGORIES_FEMALE = [
  { label: "Essential Fat", min: 10, max: 13, color: "bg-red-500" },
  { label: "Athletes", min: 14, max: 20, color: "bg-blue-500" },
  { label: "Fitness", min: 21, max: 24, color: "bg-emerald-500" },
  { label: "Average", min: 25, max: 31, color: "bg-amber-500" },
  { label: "Obese", min: 32, max: 55, color: "bg-red-600" },
] as const;

function getCategory(bf: number, gender: Gender) {
  const cats = gender === "male" ? CATEGORIES_MALE : CATEGORIES_FEMALE;
  for (const c of cats) {
    if (bf <= c.max) return c;
  }
  return cats[cats.length - 1];
}

function categoryTextColor(label: string) {
  switch (label) {
    case "Essential Fat": return "text-red-600";
    case "Athletes": return "text-blue-600";
    case "Fitness": return "text-emerald-600";
    case "Average": return "text-amber-600";
    case "Obese": return "text-red-700";
    default: return "text-text-primary";
  }
}

function navyMale(waistCm: number, neckCm: number, heightCm: number) {
  return 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
}

function navyFemale(waistCm: number, hipCm: number, neckCm: number, heightCm: number) {
  return 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
}

function bmiMethod(bmi: number, age: number, gender: Gender) {
  const sex = gender === "male" ? 1 : 0;
  return 1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4;
}

function jacksonPollock3Male(chest: number, abdomen: number, thigh: number, age: number) {
  const s = chest + abdomen + thigh;
  const density = 1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * age;
  return (495 / density) - 450;
}

function jacksonPollock3Female(tricep: number, suprailiac: number, thigh: number, age: number) {
  const s = tricep + suprailiac + thigh;
  const density = 1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * age;
  return (495 / density) - 450;
}

function toCm(value: number, unit: Unit) {
  return unit === "imperial" ? value * CM_PER_IN : value;
}

function toKg(value: number, unit: Unit) {
  return unit === "imperial" ? value * KG_PER_LB : value;
}

export default function BodyFatCalculator() {
  const [method, setMethod] = useState<Method>("navy");
  const [gender, setGender] = useState<Gender>("male");
  const [unit, setUnit] = useState<Unit>("metric");
  const [age, setAge] = useState("30");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");

  // Skinfold inputs
  const [sf1, setSf1] = useState("");
  const [sf2, setSf2] = useState("");
  const [sf3, setSf3] = useState("");

  const [error, setError] = useState<string | null>(null);

  const sfLabels = useMemo(() => {
    if (gender === "male") return ["Chest (mm)", "Abdomen (mm)", "Thigh (mm)"];
    return ["Tricep (mm)", "Suprailiac (mm)", "Thigh (mm)"];
  }, [gender]);

  const unitLabel = unit === "metric" ? { length: "cm", weight: "kg" } : { length: "in", weight: "lbs" };

  const result = useMemo(() => {
    setError(null);
    const ageN = parseInt(age, 10);

    if (method === "navy") {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      const n = parseFloat(neck);
      const wa = parseFloat(waist);
      if ([h, w, n, wa].some((v) => !Number.isFinite(v) || v <= 0)) return null;

      const hCm = toCm(h, unit);
      const wKg = toKg(w, unit);
      const nCm = toCm(n, unit);
      const waCm = toCm(wa, unit);

      if (gender === "female") {
        const hi = parseFloat(hip);
        if (!Number.isFinite(hi) || hi <= 0) return null;
        const hiCm = toCm(hi, unit);
        if (waCm + hiCm <= nCm) {
          setError("Waist + Hip must be greater than Neck.");
          return null;
        }
        const bf = navyFemale(waCm, hiCm, nCm, hCm);
        if (!Number.isFinite(bf) || bf < 0) { setError("Invalid inputs — check measurements."); return null; }
        return { bf: Math.max(0, bf), weightKg: wKg, gender };
      }

      if (waCm <= nCm) {
        setError("Waist must be greater than Neck.");
        return null;
      }
      const bf = navyMale(waCm, nCm, hCm);
      if (!Number.isFinite(bf) || bf < 0) { setError("Invalid inputs — check measurements."); return null; }
      return { bf: Math.max(0, bf), weightKg: wKg, gender };
    }

    if (method === "bmi") {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      if ([h, w].some((v) => !Number.isFinite(v) || v <= 0)) return null;
      if (!Number.isFinite(ageN) || ageN < 15 || ageN > 120) {
        setError("Enter a valid age between 15 and 120.");
        return null;
      }

      const hCm = toCm(h, unit);
      const wKg = toKg(w, unit);
      const hM = hCm / 100;
      const bmi = wKg / (hM * hM);
      const bf = bmiMethod(bmi, ageN, gender);
      if (!Number.isFinite(bf)) { setError("Could not compute body fat."); return null; }
      return { bf: Math.max(0, bf), weightKg: wKg, gender };
    }

    if (method === "skinfold") {
      const s1 = parseFloat(sf1);
      const s2 = parseFloat(sf2);
      const s3 = parseFloat(sf3);
      if ([s1, s2, s3].some((v) => !Number.isFinite(v) || v <= 0)) return null;
      if (!Number.isFinite(ageN) || ageN < 15 || ageN > 120) {
        setError("Enter a valid age between 15 and 120.");
        return null;
      }

      const w = parseFloat(weight);
      const wKg = Number.isFinite(w) && w > 0 ? toKg(w, unit) : null;

      const bf = gender === "male"
        ? jacksonPollock3Male(s1, s2, s3, ageN)
        : jacksonPollock3Female(s1, s2, s3, ageN);

      if (!Number.isFinite(bf)) { setError("Could not compute body fat."); return null; }
      return { bf: Math.max(0, bf), weightKg: wKg, gender };
    }

    return null;
  }, [method, gender, unit, age, height, weight, neck, waist, hip, sf1, sf2, sf3]);

  const fatMass = result?.weightKg != null ? result.weightKg * (result.bf / 100) : null;
  const leanMass = result?.weightKg != null && fatMass != null ? result.weightKg - fatMass : null;

  const cats = gender === "male" ? CATEGORIES_MALE : CATEGORIES_FEMALE;
  const rangeMin = cats[0].min;
  const rangeMax = cats[cats.length - 1].max;

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  function massDisplay(kg: number) {
    if (unit === "imperial") return `${(kg / KG_PER_LB).toFixed(1)} lbs`;
    return `${kg.toFixed(1)} kg`;
  }

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2.5 text-sm text-white"
        role="note"
      >
        <span aria-hidden>↓</span>
        <span>Enter your measurements and results update automatically</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        {/* ── Inputs ── */}
        <div className="space-y-4">
          {/* Method tabs */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-muted p-1">
            {(
              [
                ["US Navy", "navy"],
                ["BMI-Based", "bmi"],
                ["Skinfold", "skinfold"],
              ] as const
            ).map(([label, m]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                  method === m
                    ? "bg-surface-card text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Gender + Unit toggles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-xs text-text-muted">Gender</span>
              <div className="mt-1 flex gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
                      gender === g
                        ? "bg-brand-600 text-white"
                        : "border border-border text-text-secondary hover:bg-surface-muted",
                    )}
                  >
                    {g === "male" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-text-muted">Units</span>
              <div className="mt-1 flex gap-2">
                {(["metric", "imperial"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 text-sm font-medium transition",
                      unit === u
                        ? "bg-brand-600 text-white"
                        : "border border-border text-text-secondary hover:bg-surface-muted",
                    )}
                  >
                    {u === "metric" ? "Metric" : "Imperial"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Age (for BMI / skinfold) */}
          {(method === "bmi" || method === "skinfold") && (
            <label className="block text-sm text-text-secondary">
              Age (years)
              <input
                type="number"
                inputMode="numeric"
                min={15}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputCls}
              />
            </label>
          )}

          {/* Navy method fields */}
          {method === "navy" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-text-secondary">
                  Height ({unitLabel.length})
                  <input
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={unit === "metric" ? "175" : "69"}
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm text-text-secondary">
                  Weight ({unitLabel.weight})
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={unit === "metric" ? "80" : "176"}
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-text-secondary">
                  Neck ({unitLabel.length})
                  <input
                    type="number"
                    inputMode="decimal"
                    value={neck}
                    onChange={(e) => setNeck(e.target.value)}
                    placeholder={unit === "metric" ? "38" : "15"}
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm text-text-secondary">
                  Waist ({unitLabel.length})
                  <input
                    type="number"
                    inputMode="decimal"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder={unit === "metric" ? "85" : "33"}
                    className={inputCls}
                  />
                </label>
              </div>
              {gender === "female" && (
                <label className="block text-sm text-text-secondary">
                  Hip ({unitLabel.length})
                  <input
                    type="number"
                    inputMode="decimal"
                    value={hip}
                    onChange={(e) => setHip(e.target.value)}
                    placeholder={unit === "metric" ? "95" : "37"}
                    className={inputCls}
                  />
                </label>
              )}
            </div>
          )}

          {/* BMI method fields */}
          {method === "bmi" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-text-secondary">
                Height ({unitLabel.length})
                <input
                  type="number"
                  inputMode="decimal"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={unit === "metric" ? "175" : "69"}
                  className={inputCls}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Weight ({unitLabel.weight})
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unit === "metric" ? "80" : "176"}
                  className={inputCls}
                />
              </label>
            </div>
          )}

          {/* Skinfold method fields */}
          {method === "skinfold" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                {gender === "male"
                  ? "3-site Jackson-Pollock for men: Chest, Abdomen, Thigh"
                  : "3-site Jackson-Pollock for women: Tricep, Suprailiac, Thigh"}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: sfLabels[0], value: sf1, set: setSf1 },
                  { label: sfLabels[1], value: sf2, set: setSf2 },
                  { label: sfLabels[2], value: sf3, set: setSf3 },
                ].map((f) => (
                  <label key={f.label} className="block text-sm text-text-secondary">
                    {f.label}
                    <input
                      type="number"
                      inputMode="decimal"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>
              <label className="block text-sm text-text-secondary">
                Weight ({unitLabel.weight}) — optional, for fat/lean mass
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unit === "metric" ? "80" : "176"}
                  className={inputCls}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>

        {/* ── Results ── */}
        <div className="min-h-[200px] rounded-xl border border-border bg-surface-muted/50 p-4 lg:p-6">
          {!result ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Fill in your measurements to see your body fat estimate.
            </p>
          ) : (
            <div className="space-y-5 animate-[fadeUp_0.35s_ease_both]">
              <div className="flex items-center justify-between rounded-t-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                <span>Result</span>
                <span className="text-xs font-normal opacity-80">
                  {method === "navy" ? "US Navy" : method === "bmi" ? "BMI-Based" : "Skinfold (J-P 3)"}
                </span>
              </div>

              {/* Big number */}
              <div className="text-center">
                <p className="text-sm text-text-muted">Estimated Body Fat</p>
                <p className="font-result mt-1 text-4xl font-bold text-brand-700">
                  {result.bf.toFixed(1)}%
                </p>
                <p className={cn("mt-1 text-sm font-medium", categoryTextColor(getCategory(result.bf, gender).label))}>
                  {getCategory(result.bf, gender).label}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex h-5 w-full overflow-hidden rounded-full">
                  {cats.map((c) => {
                    const span = c.max - c.min;
                    const total = rangeMax - rangeMin;
                    return (
                      <div
                        key={c.label}
                        className={cn(c.color, "relative")}
                        style={{ width: `${(span / total) * 100}%` }}
                        title={`${c.label}: ${c.min}–${c.max}%`}
                      />
                    );
                  })}
                </div>
                {/* Marker */}
                <div className="relative h-3">
                  <div
                    className="absolute -translate-x-1/2"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((result.bf - rangeMin) / (rangeMax - rangeMin)) * 100))}%`,
                    }}
                  >
                    <div className="mx-auto h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-text-primary" />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>{rangeMin}%</span>
                  <span>{rangeMax}%</span>
                </div>
              </div>

              {/* Fat / Lean mass */}
              {fatMass != null && leanMass != null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white border border-border p-3 text-center">
                    <p className="text-xs text-text-muted">Fat Mass</p>
                    <p className="font-result mt-0.5 text-lg font-semibold text-red-600">
                      {massDisplay(fatMass)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-border p-3 text-center">
                    <p className="text-xs text-text-muted">Lean Mass</p>
                    <p className="font-result mt-0.5 text-lg font-semibold text-emerald-600">
                      {massDisplay(leanMass)}
                    </p>
                  </div>
                </div>
              )}

              {/* Reference table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-right">Men</th>
                      <th className="p-2 text-right">Women</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES_MALE.map((cm, i) => {
                      const cf = CATEGORIES_FEMALE[i];
                      const active = getCategory(result.bf, gender).label === cm.label;
                      return (
                        <tr
                          key={cm.label}
                          className={cn(
                            i % 2 === 1 && "bg-surface-muted/60",
                            active && "bg-brand-50 font-semibold",
                          )}
                        >
                          <td className="p-2 flex items-center gap-1.5">
                            <span className={cn("inline-block h-2.5 w-2.5 rounded-full", cm.color)} />
                            {cm.label}
                          </td>
                          <td className="p-2 text-right">{cm.min}–{cm.max}%</td>
                          <td className="p-2 text-right">{cf.min}–{cf.max}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                <strong>Disclaimer:</strong> These are estimates based on mathematical models. Individual
                results may vary. For accurate body composition analysis, consult a healthcare
                professional or use methods like DEXA scanning.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-secondary">
        This calculator estimates body fat percentage using three methods.
        The <strong className="font-medium text-text-primary">US Navy method</strong> uses circumference
        measurements (waist, neck, hip) and is widely used by the military.
        The <strong className="font-medium text-text-primary">BMI-based estimate</strong> derives body
        fat from BMI, age, and gender. The{" "}
        <strong className="font-medium text-text-primary">Skinfold method</strong> uses the Jackson-Pollock
        3-site formula with caliper measurements. Results are not medical advice.
      </p>
    </div>
  );
}

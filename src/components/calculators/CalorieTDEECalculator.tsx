"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Gender = "male" | "female";
type Unit = "imperial" | "metric";
type Activity = "sedentary" | "light" | "moderate" | "active" | "veryActive";
type Goal = "lose2" | "lose1" | "lose05" | "maintain" | "gain05" | "gain1";

const ACTIVITIES: { value: Activity; label: string; desc: string; factor: number }[] = [
  { value: "sedentary", label: "Sedentary", desc: "Office job, little exercise", factor: 1.2 },
  { value: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week", factor: 1.375 },
  { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week", factor: 1.55 },
  { value: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week", factor: 1.725 },
  { value: "veryActive", label: "Extra Active", desc: "Very hard exercise, physical job", factor: 1.9 },
];

const GOALS: { value: Goal; label: string; calorieAdjust: number }[] = [
  { value: "lose2", label: "Lose 2 lb/wk", calorieAdjust: -1000 },
  { value: "lose1", label: "Lose 1 lb/wk", calorieAdjust: -500 },
  { value: "lose05", label: "Lose 0.5 lb/wk", calorieAdjust: -250 },
  { value: "maintain", label: "Maintain weight", calorieAdjust: 0 },
  { value: "gain05", label: "Gain 0.5 lb/wk", calorieAdjust: 250 },
  { value: "gain1", label: "Gain 1 lb/wk", calorieAdjust: 500 },
];

const MACRO_SPLITS: { label: string; protein: number; carbs: number; fat: number }[] = [
  { label: "Balanced", protein: 0.30, carbs: 0.40, fat: 0.30 },
  { label: "Low Carb", protein: 0.40, carbs: 0.20, fat: 0.40 },
  { label: "High Protein", protein: 0.40, carbs: 0.35, fat: 0.25 },
  { label: "Keto", protein: 0.25, carbs: 0.05, fat: 0.70 },
];

function calcBMR(gender: Gender, weightKg: number, heightCm: number, age: number): { mifflin: number; harris: number; katch: number } {
  // Mifflin-St Jeor (most accurate for most people)
  const mifflin = gender === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  // Revised Harris-Benedict
  const harris = gender === "male"
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;

  // Katch-McArdle (uses lean body mass estimate)
  const bfEstimate = gender === "male" ? 0.20 : 0.28;
  const lbm = weightKg * (1 - bfEstimate);
  const katch = 370 + 21.6 * lbm;

  return { mifflin, harris, katch };
}

function calcBMI(weightKg: number, heightCm: number): { bmi: number; category: string; color: string } {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category = "Obese";
  let color = "text-red-600";
  if (bmi < 18.5) { category = "Underweight"; color = "text-amber-600"; }
  else if (bmi < 25) { category = "Normal"; color = "text-emerald-600"; }
  else if (bmi < 30) { category = "Overweight"; color = "text-amber-600"; }
  return { bmi, category, color };
}

export default function CalorieTDEECalculator() {
  const [unit, setUnit] = useState<Unit>("imperial");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("30");
  const [weightLbs, setWeightLbs] = useState("180");
  const [weightKg, setWeightKg] = useState("82");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [heightCm, setHeightCm] = useState("178");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [macroIdx, setMacroIdx] = useState(0);

  const wKg = unit === "imperial" ? (parseFloat(weightLbs) || 0) * 0.453592 : parseFloat(weightKg) || 0;
  const hCm = unit === "imperial"
    ? ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54
    : parseFloat(heightCm) || 0;
  const ageNum = parseInt(age, 10) || 0;

  const result = useMemo(() => {
    if (wKg <= 0 || hCm <= 0 || ageNum <= 0) return null;
    const bmr = calcBMR(gender, wKg, hCm, ageNum);
    const actFactor = ACTIVITIES.find((a) => a.value === activity)!.factor;
    const tdee = bmr.mifflin * actFactor;
    const goalAdj = GOALS.find((g) => g.value === goal)!.calorieAdjust;
    const target = Math.max(1200, tdee + goalAdj);
    const bmi = calcBMI(wKg, hCm);

    const macro = MACRO_SPLITS[macroIdx];
    const proteinCal = target * macro.protein;
    const carbsCal = target * macro.carbs;
    const fatCal = target * macro.fat;

    return {
      bmr,
      tdee,
      target,
      bmi,
      macros: {
        protein: { cal: proteinCal, grams: proteinCal / 4 },
        carbs: { cal: carbsCal, grams: carbsCal / 4 },
        fat: { cal: fatCal, grams: fatCal / 9 },
      },
    };
  }, [gender, wKg, hCm, ageNum, activity, goal, macroIdx]);

  const inputCls = "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Unit toggle */}
      <div className="flex gap-2">
        {(["imperial", "metric"] as const).map((u) => (
          <button key={u} type="button" onClick={() => setUnit(u)} className={cn("rounded-lg px-5 py-2.5 text-sm font-medium transition", unit === u ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
            {u === "imperial" ? "🇺🇸 Imperial (lb, ft)" : "🌍 Metric (kg, cm)"}
          </button>
        ))}
      </div>

      {/* Basic info */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Personal details</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Gender */}
          <div>
            <p className="text-xs text-text-muted mb-1">Sex</p>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)} className={cn("flex-1 rounded-lg py-2.5 text-sm font-medium transition", gender === g ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
                  {g === "male" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <label className="block text-sm text-text-secondary">
            Age (years)
            <input type="number" inputMode="numeric" min={15} max={100} value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
          </label>

          {/* Weight */}
          {unit === "imperial" ? (
            <label className="block text-sm text-text-secondary">
              Weight (lbs)
              <input type="number" inputMode="decimal" min={50} max={700} value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} className={inputCls} />
            </label>
          ) : (
            <label className="block text-sm text-text-secondary">
              Weight (kg)
              <input type="number" inputMode="decimal" min={20} max={300} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={inputCls} />
            </label>
          )}

          {/* Height */}
          {unit === "imperial" ? (
            <div>
              <p className="text-sm text-text-secondary">Height</p>
              <div className="flex gap-2 mt-1">
                <label className="flex-1">
                  <input type="number" inputMode="numeric" min={3} max={8} value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className={inputCls} />
                  <span className="text-xs text-text-muted">ft</span>
                </label>
                <label className="flex-1">
                  <input type="number" inputMode="numeric" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className={inputCls} />
                  <span className="text-xs text-text-muted">in</span>
                </label>
              </div>
            </div>
          ) : (
            <label className="block text-sm text-text-secondary">
              Height (cm)
              <input type="number" inputMode="numeric" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={inputCls} />
            </label>
          )}
        </div>
      </div>

      {/* Activity level */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Activity level</p>
        <div className="space-y-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setActivity(a.value)}
              className={cn("w-full rounded-lg px-4 py-3 text-left transition", activity === a.value ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}
            >
              <span className="text-sm font-medium">{a.label}</span>
              <span className={cn("ml-2 text-xs", activity === a.value ? "text-white/70" : "text-text-muted")}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Goal</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button key={g.value} type="button" onClick={() => setGoal(g.value)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", goal === g.value ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">BMR</p>
              <p className="font-result mt-1 text-2xl font-semibold">{Math.round(result.bmr.mifflin)}</p>
              <p className="text-xs text-text-muted">cal/day at rest</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">TDEE</p>
              <p className="font-result mt-1 text-2xl font-semibold text-brand-700">{Math.round(result.tdee)}</p>
              <p className="text-xs text-text-muted">cal/day maintenance</p>
            </div>
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">Daily target</p>
              <p className="font-result mt-1 text-3xl font-bold text-brand-700">{Math.round(result.target)}</p>
              <p className="text-xs text-brand-600">calories/day</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">BMI</p>
              <p className={cn("font-result mt-1 text-2xl font-semibold", result.bmi.color)}>{result.bmi.bmi.toFixed(1)}</p>
              <p className={cn("text-xs", result.bmi.color)}>{result.bmi.category}</p>
            </div>
          </div>

          {/* BMR comparison */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">BMR Formula</th>
                  <th className="p-2 text-right">BMR (cal/day)</th>
                  <th className="p-2 text-right">TDEE</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Mifflin-St Jeor (recommended)", bmr: result.bmr.mifflin },
                  { label: "Revised Harris-Benedict", bmr: result.bmr.harris },
                  { label: "Katch-McArdle (est. body fat)", bmr: result.bmr.katch },
                ].map((row, i) => {
                  const factor = ACTIVITIES.find((a) => a.value === activity)!.factor;
                  return (
                    <tr key={row.label} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                      <td className="p-2">{row.label}</td>
                      <td className="p-2 text-right font-result">{Math.round(row.bmr)}</td>
                      <td className="p-2 text-right font-result">{Math.round(row.bmr * factor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Macronutrients */}
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
            <p className="text-sm font-medium text-text-primary">Macronutrient breakdown</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {MACRO_SPLITS.map((m, i) => (
                <button key={m.label} type="button" onClick={() => setMacroIdx(i)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", macroIdx === i ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Protein", ...result.macros.protein, color: "bg-blue-500", pct: MACRO_SPLITS[macroIdx].protein },
                { label: "Carbs", ...result.macros.carbs, color: "bg-emerald-500", pct: MACRO_SPLITS[macroIdx].carbs },
                { label: "Fat", ...result.macros.fat, color: "bg-amber-500", pct: MACRO_SPLITS[macroIdx].fat },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-white border border-border p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", m.color)} />
                    <span className="text-xs text-text-muted">{m.label} ({(m.pct * 100).toFixed(0)}%)</span>
                  </div>
                  <p className="font-result text-2xl font-semibold">{Math.round(m.grams)}g</p>
                  <p className="text-xs text-text-muted">{Math.round(m.cal)} cal</p>
                </div>
              ))}
            </div>

            {/* Visual bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex">
              <div className="bg-blue-500" style={{ width: `${MACRO_SPLITS[macroIdx].protein * 100}%` }} />
              <div className="bg-emerald-500" style={{ width: `${MACRO_SPLITS[macroIdx].carbs * 100}%` }} />
              <div className="bg-amber-500" style={{ width: `${MACRO_SPLITS[macroIdx].fat * 100}%` }} />
            </div>
          </div>

          {/* Calorie goals comparison */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Goal</th>
                  <th className="p-2 text-right">Cal/day</th>
                  <th className="p-2 text-right">Cal/week</th>
                </tr>
              </thead>
              <tbody>
                {GOALS.map((g, i) => {
                  const cal = Math.max(1200, result.tdee + g.calorieAdjust);
                  return (
                    <tr key={g.value} className={cn(i % 2 === 1 && "bg-surface-muted/60", goal === g.value && "bg-brand-50 font-semibold")}>
                      <td className="p-2">{g.label}</td>
                      <td className="p-2 text-right font-result">{Math.round(cal)}</td>
                      <td className="p-2 text-right font-result">{Math.round(cal * 7).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            BMR calculated using the Mifflin-St Jeor equation (most accurate for
            most people per the Academy of Nutrition and Dietetics). TDEE = BMR ×
            Activity Factor. Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g.
            These are estimates — individual metabolism varies. Consult a
            healthcare professional before starting any diet.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Gender = "male" | "female";
type Unit = "metric" | "imperial";
type Activity = "sedentary" | "light" | "moderate" | "active" | "extra";
type Goal = "lose" | "maintain" | "gain" | "custom";
type DietPreset = "balanced" | "lowcarb" | "highprotein" | "keto" | "custom";

const ACTIVITIES: { value: Activity; label: string; desc: string; factor: number }[] = [
  { value: "sedentary", label: "Sedentary", desc: "Office job, little exercise", factor: 1.2 },
  { value: "light", label: "Lightly Active", desc: "Light exercise 1–3 days/week", factor: 1.375 },
  { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3–5 days/week", factor: 1.55 },
  { value: "active", label: "Very Active", desc: "Hard exercise 6–7 days/week", factor: 1.725 },
  { value: "extra", label: "Extra Active", desc: "Very hard exercise + physical job", factor: 1.9 },
];

const GOALS: { value: Goal; label: string; adjust: number }[] = [
  { value: "lose", label: "Lose Weight", adjust: -500 },
  { value: "maintain", label: "Maintain", adjust: 0 },
  { value: "gain", label: "Build Muscle", adjust: 500 },
];

const DIET_PRESETS: { value: DietPreset; label: string; carbs: number; protein: number; fat: number }[] = [
  { value: "balanced", label: "Balanced", carbs: 40, protein: 30, fat: 30 },
  { value: "lowcarb", label: "Low Carb", carbs: 25, protein: 40, fat: 35 },
  { value: "highprotein", label: "High Protein", carbs: 30, protein: 45, fat: 25 },
  { value: "keto", label: "Keto", carbs: 5, protein: 30, fat: 65 },
];

const MEAL_OPTIONS = [3, 4, 5, 6] as const;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function MacroCalculator() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("30");
  const [weightVal, setWeightVal] = useState("75");
  const [heightCm, setHeightCm] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [customAdjust, setCustomAdjust] = useState("0");
  const [dietPreset, setDietPreset] = useState<DietPreset>("balanced");
  const [customCarbs, setCustomCarbs] = useState(40);
  const [customProtein, setCustomProtein] = useState(30);
  const [customFat, setCustomFat] = useState(30);
  const [meals, setMeals] = useState<number>(3);

  const weightKg = unit === "metric" ? parseFloat(weightVal) || 0 : (parseFloat(weightVal) || 0) * 0.453592;
  const hCm = unit === "metric" ? parseFloat(heightCm) || 0 : ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;
  const ageNum = parseInt(age, 10) || 0;

  const macroSplit = dietPreset === "custom"
    ? { carbs: customCarbs, protein: customProtein, fat: customFat }
    : DIET_PRESETS.find((d) => d.value === dietPreset)!;

  const customValid = macroSplit.carbs + macroSplit.protein + macroSplit.fat === 100;

  const result = useMemo(() => {
    if (weightKg <= 0 || hCm <= 0 || ageNum <= 0) return null;

    const bmr = gender === "male"
      ? 10 * weightKg + 6.25 * hCm - 5 * ageNum + 5
      : 10 * weightKg + 6.25 * hCm - 5 * ageNum - 161;

    const factor = ACTIVITIES.find((a) => a.value === activity)!.factor;
    const tdee = bmr * factor;

    const goalAdj = goal === "custom"
      ? parseInt(customAdjust, 10) || 0
      : GOALS.find((g) => g.value === goal)!.adjust;

    const dailyCal = Math.max(1200, Math.round(tdee + goalAdj));

    const carbsPct = macroSplit.carbs / 100;
    const proteinPct = macroSplit.protein / 100;
    const fatPct = macroSplit.fat / 100;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      dailyCal,
      goalAdj,
      protein: { pct: macroSplit.protein, grams: Math.round((dailyCal * proteinPct) / 4), cal: Math.round(dailyCal * proteinPct) },
      carbs: { pct: macroSplit.carbs, grams: Math.round((dailyCal * carbsPct) / 4), cal: Math.round(dailyCal * carbsPct) },
      fat: { pct: macroSplit.fat, grams: Math.round((dailyCal * fatPct) / 9), cal: Math.round(dailyCal * fatPct) },
    };
  }, [gender, weightKg, hCm, ageNum, activity, goal, customAdjust, macroSplit.carbs, macroSplit.protein, macroSplit.fat]);

  function handleCustomSlider(macro: "carbs" | "protein" | "fat", raw: number) {
    const val = clamp(raw, 0, 100);
    if (macro === "carbs") {
      const remainder = 100 - val;
      const oldOther = customProtein + customFat || 1;
      setCustomCarbs(val);
      setCustomProtein(Math.round((customProtein / oldOther) * remainder));
      setCustomFat(100 - val - Math.round((customProtein / oldOther) * remainder));
    } else if (macro === "protein") {
      const remainder = 100 - val;
      const oldOther = customCarbs + customFat || 1;
      setCustomProtein(val);
      setCustomCarbs(Math.round((customCarbs / oldOther) * remainder));
      setCustomFat(100 - val - Math.round((customCarbs / oldOther) * remainder));
    } else {
      const remainder = 100 - val;
      const oldOther = customCarbs + customProtein || 1;
      setCustomFat(val);
      setCustomCarbs(Math.round((customCarbs / oldOther) * remainder));
      setCustomProtein(100 - val - Math.round((customCarbs / oldOther) * remainder));
    }
  }

  const inputCls = "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  const donutGradient = result
    ? `conic-gradient(#3b82f6 0% ${result.protein.pct}%, #f59e0b ${result.protein.pct}% ${result.protein.pct + result.carbs.pct}%, #f43f5e ${result.protein.pct + result.carbs.pct}% 100%)`
    : undefined;

  return (
    <div className="space-y-8">
      {/* Unit toggle */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["metric", "Metric (kg, cm)"], ["imperial", "Imperial (lbs, ft)"]] as const).map(([u, lbl]) => (
          <button
            key={u}
            type="button"
            onClick={() => { setUnit(u); if (u === "imperial") { setWeightVal("165"); setHeightFt("5"); setHeightIn("9"); } else { setWeightVal("75"); setHeightCm("175"); } }}
            className={cn("flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition", unit === u ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Personal details */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        <p className="text-sm font-medium text-text-primary">Personal Details</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Gender */}
          <div>
            <label className="text-xs font-medium text-text-muted">Gender</label>
            <div className="flex gap-1 mt-1">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={cn("flex-1 rounded-lg py-3 text-sm font-medium border transition", gender === g ? "bg-brand-600 text-white border-brand-600" : "bg-white border-border text-text-muted hover:text-text-primary")}
                >
                  {g === "male" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-xs font-medium text-text-muted">Age (years)</label>
            <input type="number" inputMode="numeric" min={15} max={100} value={age} onChange={(e) => setAge(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs font-medium text-text-muted">Weight ({unit === "metric" ? "kg" : "lbs"})</label>
          <input type="number" inputMode="decimal" min={1} value={weightVal} onChange={(e) => setWeightVal(e.target.value)} className={cn(inputCls, "mt-1")} />
        </div>

        {/* Height */}
        {unit === "metric" ? (
          <div>
            <label className="text-xs font-medium text-text-muted">Height (cm)</label>
            <input type="number" inputMode="numeric" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={cn(inputCls, "mt-1")} />
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
      </div>

      {/* Activity level */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5">
        <p className="text-sm font-medium text-text-primary mb-3">Activity Level</p>
        <div className="space-y-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setActivity(a.value)}
              className={cn("w-full rounded-lg px-4 py-3 text-left transition", activity === a.value ? "bg-brand-600 text-white" : "border border-border bg-white text-text-secondary hover:bg-surface-muted")}
            >
              <span className="text-sm font-medium">{a.label}</span>
              <span className={cn("ml-2 text-xs", activity === a.value ? "text-white/70" : "text-text-muted")}>— {a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-3">
        <p className="text-sm font-medium text-text-primary">Goal</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={cn("rounded-lg px-4 py-2.5 text-sm font-medium transition", goal === g.value ? "bg-brand-600 text-white" : "border border-border bg-white text-text-secondary hover:bg-surface-muted")}
            >
              {g.label} {g.adjust !== 0 && <span className="opacity-70">({g.adjust > 0 ? "+" : ""}{g.adjust} cal)</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGoal("custom")}
            className={cn("rounded-lg px-4 py-2.5 text-sm font-medium transition", goal === "custom" ? "bg-brand-600 text-white" : "border border-border bg-white text-text-secondary hover:bg-surface-muted")}
          >
            Custom
          </button>
        </div>
        {goal === "custom" && (
          <div className="pt-1">
            <label className="text-xs font-medium text-text-muted">Calorie adjustment (negative = deficit, positive = surplus)</label>
            <input type="number" value={customAdjust} onChange={(e) => setCustomAdjust(e.target.value)} placeholder="e.g. -300" className={cn(inputCls, "mt-1 max-w-xs")} />
          </div>
        )}
      </div>

      {/* Diet preset */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        <p className="text-sm font-medium text-text-primary">Diet Type</p>
        <div className="flex flex-wrap gap-2">
          {DIET_PRESETS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDietPreset(d.value)}
              className={cn("rounded-lg px-4 py-2.5 text-sm font-medium transition", dietPreset === d.value ? "bg-brand-600 text-white" : "border border-border bg-white text-text-secondary hover:bg-surface-muted")}
            >
              {d.label}
              <span className={cn("ml-1 text-xs", dietPreset === d.value ? "text-white/70" : "text-text-muted")}>
                {d.carbs}/{d.protein}/{d.fat}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDietPreset("custom")}
            className={cn("rounded-lg px-4 py-2.5 text-sm font-medium transition", dietPreset === "custom" ? "bg-brand-600 text-white" : "border border-border bg-white text-text-secondary hover:bg-surface-muted")}
          >
            Custom
          </button>
        </div>

        {dietPreset === "custom" && (
          <div className="space-y-3 pt-1">
            {([["Carbs", customCarbs, "carbs"], ["Protein", customProtein, "protein"], ["Fat", customFat, "fat"]] as const).map(([label, val, key]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs font-medium text-text-muted mb-1">
                  <span>{label}</span>
                  <span className="tabular-nums">{val}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => handleCustomSlider(key, parseInt(e.target.value, 10))}
                  className="w-full accent-brand-600"
                />
              </div>
            ))}
            {!customValid && (
              <p className="text-xs text-red-500 font-medium">Percentages must sum to 100% (currently {customCarbs + customProtein + customFat}%)</p>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (dietPreset !== "custom" || customValid) && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">BMR</p>
              <p className="font-result mt-1 text-2xl font-semibold">{result.bmr.toLocaleString()}</p>
              <p className="text-xs text-text-muted">cal/day at rest</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">TDEE</p>
              <p className="font-result mt-1 text-2xl font-semibold text-brand-700">{result.tdee.toLocaleString()}</p>
              <p className="text-xs text-text-muted">cal/day maintenance</p>
            </div>
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">Daily Target</p>
              <p className="font-result mt-1 text-3xl font-bold text-brand-700">{result.dailyCal.toLocaleString()}</p>
              <p className="text-xs text-brand-600">
                calories/day
                {result.goalAdj !== 0 && <span className="ml-1">({result.goalAdj > 0 ? "+" : ""}{result.goalAdj})</span>}
              </p>
            </div>
          </div>

          {/* Donut chart + macro cards */}
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            {/* Donut */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative h-44 w-44">
                <div
                  className="h-full w-full rounded-full"
                  style={{ background: donutGradient }}
                />
                <div className="absolute inset-4 rounded-full bg-white flex flex-col items-center justify-center">
                  <p className="font-result text-xl font-bold text-text-primary">{result.dailyCal.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted">cal/day</p>
                </div>
              </div>
            </div>

            {/* Macro cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Protein", data: result.protein, color: "bg-blue-500", border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700" },
                { label: "Carbs", data: result.carbs, color: "bg-amber-500", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
                { label: "Fat", data: result.fat, color: "bg-rose-500", border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
              ].map((m) => (
                <div key={m.label} className={cn("rounded-xl border p-4 text-center", m.border, m.bg)}>
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <span className={cn("inline-block h-3 w-3 rounded-full", m.color)} />
                    <span className={cn("text-xs font-medium", m.text)}>{m.label} ({m.data.pct}%)</span>
                  </div>
                  <p className={cn("font-result text-3xl font-bold", m.text)}>{m.data.grams}g</p>
                  <p className="text-xs text-text-muted mt-1">{m.data.cal} cal</p>
                </div>
              ))}
            </div>
          </div>

          {/* Macro bar */}
          <div className="h-4 w-full rounded-full overflow-hidden flex">
            <div className="bg-blue-500 transition-all" style={{ width: `${result.protein.pct}%` }} title={`Protein ${result.protein.pct}%`} />
            <div className="bg-amber-500 transition-all" style={{ width: `${result.carbs.pct}%` }} title={`Carbs ${result.carbs.pct}%`} />
            <div className="bg-rose-500 transition-all" style={{ width: `${result.fat.pct}%` }} title={`Fat ${result.fat.pct}%`} />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted -mt-4">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" />Protein</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-500" />Carbs</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-rose-500" />Fat</span>
          </div>

          {/* Meal breakdown */}
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">Meal Breakdown</p>
              <div className="flex gap-1 rounded-lg bg-surface-muted p-0.5">
                {MEAL_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMeals(n)}
                    className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition", meals === n ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}
                  >
                    {n} meals
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="p-2.5 text-xs font-medium text-text-muted">Meal</th>
                    <th className="p-2.5 text-xs font-medium text-text-muted text-right">Calories</th>
                    <th className="p-2.5 text-xs font-medium text-blue-600 text-right">Protein</th>
                    <th className="p-2.5 text-xs font-medium text-amber-600 text-right">Carbs</th>
                    <th className="p-2.5 text-xs font-medium text-rose-600 text-right">Fat</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: meals }, (_, i) => (
                    <tr key={i} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                      <td className="p-2.5 font-medium text-text-primary">Meal {i + 1}</td>
                      <td className="p-2.5 text-right font-result">{Math.round(result.dailyCal / meals)}</td>
                      <td className="p-2.5 text-right font-result text-blue-700">{Math.round(result.protein.grams / meals)}g</td>
                      <td className="p-2.5 text-right font-result text-amber-700">{Math.round(result.carbs.grams / meals)}g</td>
                      <td className="p-2.5 text-right font-result text-rose-700">{Math.round(result.fat.grams / meals)}g</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-surface-muted">
                  <tr className="font-semibold">
                    <td className="p-2.5 text-text-primary">Total</td>
                    <td className="p-2.5 text-right font-result">{result.dailyCal}</td>
                    <td className="p-2.5 text-right font-result text-blue-700">{result.protein.grams}g</td>
                    <td className="p-2.5 text-right font-result text-amber-700">{result.carbs.grams}g</td>
                    <td className="p-2.5 text-right font-result text-rose-700">{result.fat.grams}g</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            BMR calculated using the Mifflin-St Jeor equation. TDEE = BMR × Activity Factor.
            Protein &amp; Carbs: 4 cal/g · Fat: 9 cal/g. These are estimates — individual
            metabolism varies. Consult a healthcare professional before starting any diet.
          </p>
        </div>
      )}
    </div>
  );
}

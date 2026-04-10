"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Units = "metric" | "imperial";
type Gender = "male" | "female";
type Formula = "mifflin" | "harris" | "katch";

const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Sedentary", desc: "Little or no exercise, desk job", factor: 1.2 },
  { key: "light", label: "Lightly Active", desc: "Light exercise 1–3 days/week", factor: 1.375 },
  { key: "moderate", label: "Moderately Active", desc: "Moderate exercise 3–5 days/week", factor: 1.55 },
  { key: "very", label: "Very Active", desc: "Hard exercise 6–7 days/week", factor: 1.725 },
  { key: "super", label: "Super Active", desc: "Intense exercise + physical job", factor: 1.9 },
];

function calcBMR(formula: Formula, gender: Gender, weightKg: number, heightCm: number, age: number, bodyFat?: number): number | null {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return null;

  if (formula === "mifflin") {
    return gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  if (formula === "harris") {
    return gender === "male"
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.330 * age;
  }
  if (formula === "katch") {
    if (!bodyFat || bodyFat <= 0 || bodyFat >= 100) return null;
    const leanMass = weightKg * (1 - bodyFat / 100);
    return 370 + 21.6 * leanMass;
  }
  return null;
}

export default function BMRCalculator() {
  const [units, setUnits] = useState<Units>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("30");
  const [weightVal, setWeightVal] = useState("75");
  const [heightCm, setHeightCm] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [bodyFat, setBodyFat] = useState("");
  const [formula, setFormula] = useState<Formula>("mifflin");

  const weightKg = units === "metric" ? parseFloat(weightVal) || 0 : (parseFloat(weightVal) || 0) * 0.453592;
  const heightCmVal = units === "metric" ? parseFloat(heightCm) || 0 : ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;
  const ageNum = parseInt(age) || 0;
  const bfNum = bodyFat ? parseFloat(bodyFat) : undefined;

  const result = useMemo(() => {
    const bmr = calcBMR(formula, gender, weightKg, heightCmVal, ageNum, bfNum);
    if (!bmr) return null;

    const tdees = ACTIVITY_LEVELS.map((lvl) => ({
      ...lvl,
      calories: Math.round(bmr * lvl.factor),
    }));

    return { bmr: Math.round(bmr), tdees };
  }, [formula, gender, weightKg, heightCmVal, ageNum, bfNum]);

  const allFormulas = useMemo(() => {
    const m = calcBMR("mifflin", gender, weightKg, heightCmVal, ageNum);
    const h = calcBMR("harris", gender, weightKg, heightCmVal, ageNum);
    const k = bfNum ? calcBMR("katch", gender, weightKg, heightCmVal, ageNum, bfNum) : null;
    return { mifflin: m ? Math.round(m) : null, harris: h ? Math.round(h) : null, katch: k ? Math.round(k) : null };
  }, [gender, weightKg, heightCmVal, ageNum, bfNum]);

  const inputCls = "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";
  const selectCls = "h-12 w-full rounded-xl border border-border bg-surface-card px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-6">
      {/* Unit toggle */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["metric", "Metric (kg/cm)"], ["imperial", "Imperial (lbs/ft)"]] as const).map(([u, lbl]) => (
          <button key={u} type="button" onClick={() => { setUnits(u); if (u === "imperial") { setWeightVal("165"); } else { setWeightVal("75"); setHeightCm("175"); } }}
            className={cn("flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              units === u ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        {/* Gender + Age */}
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="text-xs font-medium text-text-muted">Age</label>
            <input type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs font-medium text-text-muted">
            Weight ({units === "metric" ? "kg" : "lbs"})
          </label>
          <input type="number" min={1} inputMode="decimal" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} className={cn(inputCls, "mt-1")} />
        </div>

        {/* Height */}
        {units === "metric" ? (
          <div>
            <label className="text-xs font-medium text-text-muted">Height (cm)</label>
            <input type="number" min={1} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted">Height (ft)</label>
              <input type="number" min={1} max={8} value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className={cn(inputCls, "mt-1")} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted">Height (in)</label>
              <input type="number" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className={cn(inputCls, "mt-1")} />
            </div>
          </div>
        )}

        {/* Body fat (optional) */}
        <div>
          <label className="text-xs font-medium text-text-muted">Body Fat % (optional — enables Katch-McArdle)</label>
          <input type="number" min={1} max={70} step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="e.g. 18" className={cn(inputCls, "mt-1")} />
        </div>

        {/* Formula selector */}
        <div>
          <label className="text-xs font-medium text-text-muted">Formula</label>
          <select value={formula} onChange={(e) => setFormula(e.target.value as Formula)} className={cn(selectCls, "mt-1")}>
            <option value="mifflin">Mifflin-St Jeor (recommended)</option>
            <option value="harris">Harris-Benedict (revised)</option>
            <option value="katch" disabled={!bfNum}>Katch-McArdle (requires body fat %)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* BMR hero */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 p-6 sm:p-8 text-white text-center">
            <p className="text-sm font-medium opacity-80">Your Basal Metabolic Rate (BMR)</p>
            <p className="mt-2 font-result text-4xl sm:text-5xl font-bold">{result.bmr.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-1">calories per day</p>
            <p className="mt-3 text-xs opacity-60">
              Using {formula === "mifflin" ? "Mifflin-St Jeor" : formula === "harris" ? "Harris-Benedict" : "Katch-McArdle"} formula
            </p>
          </div>

          {/* Formula comparison */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {[
              { label: "Mifflin-St Jeor", value: allFormulas.mifflin, rec: true },
              { label: "Harris-Benedict", value: allFormulas.harris, rec: false },
              { label: "Katch-McArdle", value: allFormulas.katch, rec: false },
            ].map((f) => (
              <div key={f.label} className={cn("rounded-xl border p-3 text-center",
                f.value && formula === f.label.toLowerCase().split(" ")[0].split("-")[0] ? "border-brand-300 bg-brand-50" : "border-border bg-surface-muted/40")}>
                <p className="text-[11px] font-medium text-text-muted">{f.label}</p>
                <p className="font-result text-xl font-bold text-text-primary mt-1">
                  {f.value ? `${f.value} cal` : "N/A"}
                </p>
                {f.rec && <span className="text-[10px] text-brand-600 font-medium">Most accurate</span>}
              </div>
            ))}
          </div>

          {/* TDEE by activity level */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-medium text-text-primary">Total Daily Energy Expenditure (TDEE)</p>
            </div>
            <div className="divide-y divide-border/60">
              {result.tdees.map((lvl) => {
                const barWidth = Math.min(100, (lvl.calories / (result.bmr * 2)) * 100);
                return (
                  <div key={lvl.key} className="px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-text-primary">{lvl.label}</span>
                        <span className="text-xs text-text-muted ml-1.5 hidden sm:inline">× {lvl.factor}</span>
                        <p className="text-xs text-text-muted mt-0.5">{lvl.desc}</p>
                      </div>
                      <span className="font-result text-lg font-bold text-text-primary">{lvl.calories.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-surface-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-violet-500" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal calories */}
          <div className="grid gap-3 grid-cols-3">
            {[
              { label: "Weight Loss", delta: -500, color: "bg-emerald-50 border-emerald-200 text-emerald-700", desc: "−500 cal/day" },
              { label: "Maintain", delta: 0, color: "bg-blue-50 border-blue-200 text-blue-700", desc: "No change" },
              { label: "Weight Gain", delta: 500, color: "bg-amber-50 border-amber-200 text-amber-700", desc: "+500 cal/day" },
            ].map((goal) => {
              const moderate = result.tdees.find((t) => t.key === "moderate");
              const cal = moderate ? moderate.calories + goal.delta : 0;
              return (
                <div key={goal.label} className={cn("rounded-xl border p-3 text-center", goal.color)}>
                  <p className="text-[11px] font-medium opacity-80">{goal.label}</p>
                  <p className="font-result text-xl font-bold mt-1">{cal.toLocaleString()}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{goal.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Formula explanation */}
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 text-sm text-text-secondary space-y-2">
            <p className="font-medium text-text-primary">About {formula === "mifflin" ? "Mifflin-St Jeor" : formula === "harris" ? "Harris-Benedict" : "Katch-McArdle"}</p>
            {formula === "mifflin" && <p>The Mifflin-St Jeor equation (1990) is considered the most accurate for estimating BMR in healthy adults. It uses weight, height, age, and sex. Male: (10 × weight) + (6.25 × height) − (5 × age) + 5. Female: same but − 161.</p>}
            {formula === "harris" && <p>The Harris-Benedict equation (1919, revised 1984) was the standard for decades. It tends to overestimate BMR by 5-15% compared to Mifflin-St Jeor, especially in overweight individuals.</p>}
            {formula === "katch" && <p>The Katch-McArdle formula uses lean body mass instead of total weight, making it more accurate for people who know their body fat percentage. Formula: 370 + (21.6 × lean mass in kg).</p>}
          </div>
        </>
      )}
    </div>
  );
}

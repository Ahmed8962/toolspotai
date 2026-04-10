"use client";

import { type CurrencyCode, formatMoney } from "@/lib/currency";
import CurrencyPicker from "@/components/shared/CurrencyPicker";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type InsuranceType = "life" | "health" | "auto";

const TYPES: { value: InsuranceType; label: string; icon: string }[] = [
  { value: "life", label: "Life Insurance", icon: "🛡️" },
  { value: "health", label: "Health Insurance", icon: "🏥" },
  { value: "auto", label: "Auto Insurance", icon: "🚗" },
];

type Gender = "male" | "female";
type HealthStatus = "excellent" | "good" | "average" | "poor";

const HEALTH_FACTOR: Record<HealthStatus, number> = { excellent: 0.85, good: 1.0, average: 1.2, poor: 1.5 };

function estimateLifePremium(age: number, gender: Gender, coverage: number, termYears: number, smoker: boolean, health: HealthStatus): number {
  const baseRate = gender === "male" ? 0.0008 : 0.0006;
  const ageFactor = age < 30 ? 0.7 : age < 40 ? 1.0 : age < 50 ? 1.6 : age < 60 ? 2.8 : 4.5;
  const smokerFactor = smoker ? 2.0 : 1.0;
  const termFactor = termYears <= 10 ? 0.8 : termYears <= 20 ? 1.0 : 1.25;
  const hFactor = HEALTH_FACTOR[health];
  return (coverage * baseRate * ageFactor * smokerFactor * termFactor * hFactor) / 12;
}

type PlanTier = "bronze" | "silver" | "gold" | "platinum";

const PLAN_TIERS: { value: PlanTier; label: string; factor: number; deductible: string; copay: string }[] = [
  { value: "bronze", label: "Bronze", factor: 0.7, deductible: "$7,000+", copay: "40%" },
  { value: "silver", label: "Silver", factor: 1.0, deductible: "$4,000–$6,000", copay: "30%" },
  { value: "gold", label: "Gold", factor: 1.35, deductible: "$1,500–$3,000", copay: "20%" },
  { value: "platinum", label: "Platinum", factor: 1.8, deductible: "$0–$1,000", copay: "10%" },
];

function estimateHealthPremium(age: number, planTier: PlanTier, smoker: boolean, familySize: number, region: string): number {
  const baseMonthly = 450;
  const ageFactor = age < 30 ? 0.7 : age < 40 ? 1.0 : age < 50 ? 1.3 : age < 60 ? 1.7 : 2.2;
  const tierFactor = PLAN_TIERS.find((t) => t.value === planTier)!.factor;
  const smokerFactor = smoker ? 1.5 : 1.0;
  const familyFactor = familySize <= 1 ? 1.0 : familySize === 2 ? 1.8 : familySize === 3 ? 2.3 : 2.3 + (familySize - 3) * 0.3;
  const regionFactor = region === "high" ? 1.3 : region === "low" ? 0.8 : 1.0;
  return baseMonthly * ageFactor * tierFactor * smokerFactor * familyFactor * regionFactor;
}

type CoverageLevel = "minimum" | "standard" | "full";

function estimateAutoPremium(age: number, gender: Gender, vehicleValue: number, coverage: CoverageLevel, drivingRecord: string, annualMiles: number): number {
  const baseFactor = coverage === "minimum" ? 0.03 : coverage === "standard" ? 0.05 : 0.07;
  const ageFactor = age < 25 ? 1.8 : age < 30 ? 1.2 : age < 65 ? 1.0 : 1.3;
  const genderFactor = gender === "male" && age < 30 ? 1.15 : 1.0;
  const recordFactor = drivingRecord === "clean" ? 0.85 : drivingRecord === "minor" ? 1.0 : 1.5;
  const milesFactor = annualMiles < 5000 ? 0.8 : annualMiles < 12000 ? 1.0 : annualMiles < 20000 ? 1.15 : 1.3;
  return (vehicleValue * baseFactor * ageFactor * genderFactor * recordFactor * milesFactor) / 12;
}

export default function InsuranceCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [type, setType] = useState<InsuranceType>("life");

  // Shared
  const [age, setAge] = useState("35");
  const [gender, setGender] = useState<Gender>("male");
  const [smoker, setSmoker] = useState(false);
  const [health, setHealth] = useState<HealthStatus>("good");

  // Life
  const [coverage, setCoverage] = useState("500000");
  const [termYears, setTermYears] = useState("20");

  // Health
  const [planTier, setPlanTier] = useState<PlanTier>("silver");
  const [familySize, setFamilySize] = useState("1");
  const [region, setRegion] = useState("average");

  // Auto
  const [vehicleValue, setVehicleValue] = useState("30000");
  const [coverageLevel, setCoverageLevel] = useState<CoverageLevel>("standard");
  const [drivingRecord, setDrivingRecord] = useState("clean");
  const [annualMiles, setAnnualMiles] = useState("12000");

  const fmt = (n: number) => formatMoney(n, currency);

  const result = useMemo(() => {
    const ageNum = parseInt(age) || 35;

    if (type === "life") {
      const cov = parseFloat(coverage) || 0;
      const term = parseInt(termYears) || 20;
      const monthly = estimateLifePremium(ageNum, gender, cov, term, smoker, health);
      return {
        monthly,
        annual: monthly * 12,
        totalCost: monthly * 12 * term,
        details: [
          ["Coverage amount", fmt(cov)],
          ["Term length", `${term} years`],
          ["Health rating", health.charAt(0).toUpperCase() + health.slice(1)],
          ["Smoker", smoker ? "Yes (+100%)" : "No"],
        ],
      };
    }

    if (type === "health") {
      const fam = parseInt(familySize) || 1;
      const monthly = estimateHealthPremium(ageNum, planTier, smoker, fam, region);
      const tier = PLAN_TIERS.find((t) => t.value === planTier)!;
      return {
        monthly,
        annual: monthly * 12,
        totalCost: monthly * 12,
        details: [
          ["Plan tier", tier.label],
          ["Typical deductible", tier.deductible],
          ["Typical copay", tier.copay],
          ["Family size", `${fam} ${fam === 1 ? "person" : "people"}`],
          ["Smoker", smoker ? "Yes (+50%)" : "No"],
        ],
      };
    }

    // Auto
    const vVal = parseFloat(vehicleValue) || 0;
    const miles = parseInt(annualMiles) || 12000;
    const monthly = estimateAutoPremium(ageNum, gender, vVal, coverageLevel, drivingRecord, miles);
    return {
      monthly,
      annual: monthly * 12,
      totalCost: monthly * 12,
      details: [
        ["Vehicle value", fmt(vVal)],
        ["Coverage", coverageLevel.charAt(0).toUpperCase() + coverageLevel.slice(1)],
        ["Driving record", drivingRecord === "clean" ? "Clean (-15%)" : drivingRecord === "minor" ? "Minor violations" : "Accidents/DUI (+50%)"],
        ["Annual miles", miles.toLocaleString()],
      ],
    };
  }, [type, age, gender, smoker, health, coverage, termYears, planTier, familySize, region, vehicleValue, coverageLevel, drivingRecord, annualMiles, currency]);

  const inputCls = "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <CurrencyPicker value={currency} onChange={setCurrency} />

      {/* Insurance type */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button key={t.value} type="button" onClick={() => setType(t.value)} className={cn("rounded-xl px-3 py-3 text-center transition", type === t.value ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
            <span className="text-xl">{t.icon}</span>
            <span className="ml-1.5 text-sm font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Common inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Personal details</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm text-text-secondary">
            Age
            <input type="number" inputMode="numeric" min={18} max={85} value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
          </label>
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
          <label className="flex items-center gap-2 text-sm text-text-secondary pt-6 cursor-pointer">
            <input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} className="accent-brand-600" />
            Smoker / tobacco user
          </label>
          {type === "life" && (
            <div>
              <p className="text-xs text-text-muted mb-1">Health status</p>
              <select value={health} onChange={(e) => setHealth(e.target.value as HealthStatus)} className={inputCls}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="average">Average</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Type-specific inputs */}
      {type === "life" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Life insurance details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              Coverage amount
              <input type="number" inputMode="decimal" min={50000} value={coverage} onChange={(e) => setCoverage(e.target.value)} className={inputCls} />
              <span className="text-xs text-text-muted">Rule of thumb: 10-12x annual income</span>
            </label>
            <label className="block text-sm text-text-secondary">
              Term (years)
              <select value={termYears} onChange={(e) => setTermYears(e.target.value)} className={inputCls}>
                <option value="10">10 years</option>
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="25">25 years</option>
                <option value="30">30 years</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {type === "health" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Health insurance details</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-text-muted mb-1">Plan tier</p>
              <div className="flex flex-wrap gap-2">
                {PLAN_TIERS.map((t) => (
                  <button key={t.value} type="button" onClick={() => setPlanTier(t.value)} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition", planTier === t.value ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm text-text-secondary">
              Family size
              <input type="number" inputMode="numeric" min={1} max={10} value={familySize} onChange={(e) => setFamilySize(e.target.value)} className={inputCls} />
            </label>
            <label className="block text-sm text-text-secondary">
              Cost of living region
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputCls}>
                <option value="low">Low cost area</option>
                <option value="average">Average</option>
                <option value="high">High cost area (NYC, SF, etc.)</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {type === "auto" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Auto insurance details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-text-secondary">
              Vehicle value
              <input type="number" inputMode="decimal" min={1000} value={vehicleValue} onChange={(e) => setVehicleValue(e.target.value)} className={inputCls} />
            </label>
            <div>
              <p className="text-xs text-text-muted mb-1">Coverage level</p>
              <div className="flex gap-2">
                {(["minimum", "standard", "full"] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setCoverageLevel(c)} className={cn("flex-1 rounded-lg py-2.5 text-sm font-medium transition capitalize", coverageLevel === c ? "bg-brand-600 text-white" : "border border-border text-text-secondary hover:bg-surface-muted")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm text-text-secondary">
              Driving record
              <select value={drivingRecord} onChange={(e) => setDrivingRecord(e.target.value)} className={inputCls}>
                <option value="clean">Clean record</option>
                <option value="minor">Minor violations</option>
                <option value="major">Accidents / DUI</option>
              </select>
            </label>
            <label className="block text-sm text-text-secondary">
              Annual miles driven
              <input type="number" inputMode="numeric" min={0} value={annualMiles} onChange={(e) => setAnnualMiles(e.target.value)} className={inputCls} />
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
              <p className="text-xs font-medium uppercase text-brand-600">Estimated monthly</p>
              <p className="font-result mt-1 text-3xl font-bold text-brand-700">{fmt(result.monthly)}</p>
            </div>
            <div className="rounded-xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">Annual premium</p>
              <p className="font-result mt-1 text-2xl font-semibold">{fmt(result.annual)}</p>
            </div>
            {type === "life" && (
              <div className="rounded-xl bg-surface-muted p-5 text-center">
                <p className="text-xs font-medium uppercase text-text-muted">Total over term</p>
                <p className="font-result mt-1 text-2xl font-semibold">{fmt(result.totalCost)}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="font-medium text-text-primary">Details</p>
            {result.details.map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/60 last:border-0">
                <span className="text-text-muted">{label}</span>
                <span className="font-result font-medium">{val}</span>
              </div>
            ))}
          </div>

          {/* Pay frequency */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Payment frequency</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Monthly", div: 1 },
                  { label: "Quarterly", div: 1 / 3 },
                  { label: "Semi-annually", div: 1 / 6 },
                  { label: "Annually", div: 1 / 12 },
                ].map((p, i) => (
                  <tr key={p.label} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{p.label}</td>
                    <td className="p-2 text-right font-result">{fmt(result.monthly / p.div)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            These are <strong>estimates only</strong> based on industry averages and typical rating factors. Actual premiums vary significantly by insurer, location, and individual underwriting. Get quotes from multiple providers for accurate pricing.
          </div>
        </div>
      )}
    </div>
  );
}

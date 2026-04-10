/** Body Mass Index — standard formulas. Not medical advice. */

export function bmiFromMetricKgCm(weightKg: number, heightCm: number): number {
  const hM = heightCm / 100;
  if (hM <= 0 || weightKg <= 0) return NaN;
  return weightKg / (hM * hM);
}

/** Imperial: BMI = 703 × weight(lb) / height(in)² */
export function bmiFromImperialLbIn(weightLb: number, heightInches: number): number {
  if (heightInches <= 0 || weightLb <= 0) return NaN;
  return (703 * weightLb) / (heightInches * heightInches);
}

/** UK-style: total pounds = stones × 14 + pounds remainder */
export function totalLbFromStLb(stones: number, pounds: number): number {
  if (stones < 0 || pounds < 0) return NaN;
  return stones * 14 + pounds;
}

export function cmToMeters(cm: number): number {
  return cm / 100;
}

export function ftInToInches(ft: number, inch: number): number {
  return ft * 12 + inch;
}

/** Ponderal Index (kg/m³) — same BMI inputs */
export function ponderalIndex(weightKg: number, heightM: number): number {
  if (heightM <= 0 || weightKg <= 0) return NaN;
  return weightKg / (heightM * heightM * heightM);
}

/** BMI Prime = BMI / 25 (ratio to upper limit of “normal”) */
export function bmiPrime(bmi: number): number {
  return bmi / 25;
}

/** Healthy weight band for a given height (WHO adult BMI 18.5–25), in kg */
export function healthyWeightRangeKg(heightM: number): { minKg: number; maxKg: number } {
  const h2 = heightM * heightM;
  return { minKg: 18.5 * h2, maxKg: 25 * h2 };
}

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obesity_class_i"
  | "obesity_class_ii"
  | "obesity_class_iii";

/** WHO adult categories (kg/m²). */
export function categoryFromBmi(bmi: number): BmiCategory {
  if (Number.isNaN(bmi) || bmi <= 0) return "normal";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  if (bmi < 35) return "obesity_class_i";
  if (bmi < 40) return "obesity_class_ii";
  return "obesity_class_iii";
}

export const categoryLabels: Record<BmiCategory, string> = {
  underweight: "Underweight (below 18.5)",
  normal: "Normal weight (18.5 – 24.9)",
  overweight: "Overweight (25.0 – 29.9)",
  obesity_class_i: "Obesity class I (30.0 – 34.9)",
  obesity_class_ii: "Obesity class II (35.0 – 39.9)",
  obesity_class_iii: "Obesity class III (40.0 and above)",
};

/** Short label for result headline (matches common UI) */
export function categoryShortLabel(cat: BmiCategory): string {
  const map: Record<BmiCategory, string> = {
    underweight: "Underweight",
    normal: "Normal",
    overweight: "Overweight",
    obesity_class_i: "Obesity (Class I)",
    obesity_class_ii: "Obesity (Class II)",
    obesity_class_iii: "Obesity (Class III)",
  };
  return map[cat];
}

/** Needle angle (degrees): 180 = left of arc, 0 = right. BMI clamped to 16–40 for display. */
export function bmiGaugeNeedleDegrees(bmi: number): number {
  const min = 16;
  const max = 40;
  const clamped = Math.min(max, Math.max(min, bmi));
  const t = (clamped - min) / (max - min);
  return 180 - t * 180;
}

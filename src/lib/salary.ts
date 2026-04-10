/**
 * Salary / Take-Home Pay calculation engine.
 *
 * Supports:
 *   US  – 2025 federal income tax brackets, standard deduction, FICA
 *         (SS 6.2% up to $176,100; Medicare 1.45% + 0.9% additional),
 *         state/city flat-rate inputs.
 *   UK  – 2025/26 income tax bands, personal allowance (with taper),
 *         employee NI Class 1, student loan repayments, pension.
 *   Custom – flat income-tax rate + flat social-contribution rate.
 *
 * All calculations are annual → divided by pay periods for per-paycheck view.
 */

/* ═══════════════════════════ Types ═══════════════════════════ */

export type PayFrequency =
  | "annually"
  | "semiAnnually"
  | "quarterly"
  | "monthly"
  | "semiMonthly"
  | "biWeekly"
  | "weekly";

export const PAY_FREQUENCIES: { value: PayFrequency; label: string; periods: number }[] = [
  { value: "annually", label: "Annually", periods: 1 },
  { value: "semiAnnually", label: "Semi-annually", periods: 2 },
  { value: "quarterly", label: "Quarterly", periods: 4 },
  { value: "monthly", label: "Monthly", periods: 12 },
  { value: "semiMonthly", label: "Semi-monthly", periods: 24 },
  { value: "biWeekly", label: "Bi-weekly", periods: 26 },
  { value: "weekly", label: "Weekly", periods: 52 },
];

export function getPayPeriods(freq: PayFrequency): number {
  return PAY_FREQUENCIES.find((f) => f.value === freq)!.periods;
}

export type USFilingStatus = "single" | "marriedJoint" | "headOfHousehold";

export const US_FILING_OPTIONS: { value: USFilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married Filing Jointly" },
  { value: "headOfHousehold", label: "Head of Household" },
];

export type UKStudentLoan = "none" | "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";

export const UK_STUDENT_LOAN_OPTIONS: { value: UKStudentLoan; label: string }[] = [
  { value: "none", label: "None" },
  { value: "plan1", label: "Plan 1 (pre-2012)" },
  { value: "plan2", label: "Plan 2 (post-2012)" },
  { value: "plan4", label: "Plan 4 (Scotland)" },
  { value: "plan5", label: "Plan 5 (post-2023)" },
  { value: "postgrad", label: "Postgraduate" },
];

export type Country = "US" | "UK" | "custom";

/* ═══════════════════════════ US Tax Config (2025) ═══════════════════════════ */

type TaxBracket = { upTo: number; rate: number };

const US_BRACKETS: Record<USFilingStatus, TaxBracket[]> = {
  single: [
    { upTo: 11_925, rate: 0.10 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  marriedJoint: [
    { upTo: 23_850, rate: 0.10 },
    { upTo: 96_950, rate: 0.12 },
    { upTo: 206_700, rate: 0.22 },
    { upTo: 394_600, rate: 0.24 },
    { upTo: 501_050, rate: 0.32 },
    { upTo: 751_600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  headOfHousehold: [
    { upTo: 17_000, rate: 0.10 },
    { upTo: 64_850, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_500, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

const US_STANDARD_DEDUCTION: Record<USFilingStatus, number> = {
  single: 15_000,
  marriedJoint: 30_000,
  headOfHousehold: 22_500,
};

const US_SS_RATE = 0.062;
const US_SS_WAGE_BASE = 176_100;
const US_MEDICARE_RATE = 0.0145;
const US_ADDITIONAL_MEDICARE_RATE = 0.009;
const US_ADDITIONAL_MEDICARE_THRESHOLD: Record<USFilingStatus, number> = {
  single: 200_000,
  marriedJoint: 250_000,
  headOfHousehold: 200_000,
};

/* ═══════════════════════════ UK Tax Config (2025/26) ═══════════════════════════ */

const UK_PERSONAL_ALLOWANCE = 12_570;
const UK_PA_TAPER_THRESHOLD = 100_000;

const UK_TAX_BANDS: TaxBracket[] = [
  { upTo: 50_270, rate: 0.20 },
  { upTo: 125_140, rate: 0.40 },
  { upTo: Infinity, rate: 0.45 },
];

const UK_NI_PRIMARY_THRESHOLD = 12_570;
const UK_NI_UPPER_LIMIT = 50_270;
const UK_NI_RATE_BELOW = 0.08;
const UK_NI_RATE_ABOVE = 0.02;

const UK_STUDENT_LOAN_CONFIG: Record<
  Exclude<UKStudentLoan, "none">,
  { threshold: number; rate: number }
> = {
  plan1: { threshold: 24_990, rate: 0.09 },
  plan2: { threshold: 27_295, rate: 0.09 },
  plan4: { threshold: 31_395, rate: 0.09 },
  plan5: { threshold: 25_000, rate: 0.09 },
  postgrad: { threshold: 21_000, rate: 0.06 },
};

/* ═══════════════════════════ Calculation helpers ═══════════════════════════ */

function calcProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    const taxable = Math.min(taxableIncome, b.upTo) - prev;
    if (taxable <= 0) break;
    tax += taxable * b.rate;
    prev = b.upTo;
  }
  return tax;
}

function findMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;
  for (const b of brackets) {
    if (taxableIncome <= b.upTo) return b.rate;
  }
  return brackets[brackets.length - 1]!.rate;
}

/* ═══════════════════════════ US Calculation ═══════════════════════════ */

export type USInputs = {
  annualSalary: number;
  payFrequency: PayFrequency;
  filingStatus: USFilingStatus;
  preTaxDeductions: number;
  stateTaxRate: number;
  cityTaxRate: number;
};

export type SalaryBreakdown = {
  gross: number;
  preTaxDeductions: number;
  federalTax: number;
  stateTax: number;
  cityTax: number;
  socialSecurity: number;
  medicare: number;
  studentLoan: number;
  nationalInsurance: number;
  pension: number;
  totalDeductions: number;
  netTakeHome: number;
  effectiveRate: number;
  marginalRate: number;
  periods: number;
  perPeriod: {
    gross: number;
    deductions: number;
    net: number;
  };
  labels: { taxLabel: string; socialLabel: string };
};

export function calcUS(inputs: USInputs): SalaryBreakdown | null {
  const { annualSalary, payFrequency, filingStatus, preTaxDeductions, stateTaxRate, cityTaxRate } = inputs;
  if (annualSalary <= 0) return null;

  const gross = annualSalary;
  const periods = getPayPeriods(payFrequency);

  // Pre-tax deductions reduce taxable income (401k, HSA, health insurance)
  const preTax = Math.min(preTaxDeductions, gross);

  // Federal taxable income = gross - pre-tax deductions - standard deduction
  const standardDeduction = US_STANDARD_DEDUCTION[filingStatus];
  const federalTaxable = Math.max(0, gross - preTax - standardDeduction);
  const federalTax = calcProgressiveTax(federalTaxable, US_BRACKETS[filingStatus]);
  const marginalRate = findMarginalRate(federalTaxable, US_BRACKETS[filingStatus]);

  // FICA (calculated on gross, not reduced by 401k for Social Security/Medicare)
  const ssWages = Math.min(gross, US_SS_WAGE_BASE);
  const socialSecurity = ssWages * US_SS_RATE;

  const medicareBase = gross * US_MEDICARE_RATE;
  const additionalMedicareThreshold = US_ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
  const additionalMedicare =
    gross > additionalMedicareThreshold
      ? (gross - additionalMedicareThreshold) * US_ADDITIONAL_MEDICARE_RATE
      : 0;
  const medicare = medicareBase + additionalMedicare;

  // State & city tax on gross minus pre-tax deductions
  const stateLocal = gross - preTax;
  const stateTax = stateLocal * (stateTaxRate / 100);
  const cityTax = stateLocal * (cityTaxRate / 100);

  const totalDeductions = preTax + federalTax + socialSecurity + medicare + stateTax + cityTax;
  const netTakeHome = gross - totalDeductions;
  const effectiveRate = gross > 0 ? ((totalDeductions - preTax) / gross) * 100 : 0;

  return {
    gross,
    preTaxDeductions: preTax,
    federalTax,
    stateTax,
    cityTax,
    socialSecurity,
    medicare,
    studentLoan: 0,
    nationalInsurance: 0,
    pension: 0,
    totalDeductions,
    netTakeHome,
    effectiveRate,
    marginalRate: marginalRate * 100,
    periods,
    perPeriod: {
      gross: gross / periods,
      deductions: totalDeductions / periods,
      net: netTakeHome / periods,
    },
    labels: { taxLabel: "Federal income tax", socialLabel: "Social Security" },
  };
}

/* ═══════════════════════════ UK Calculation ═══════════════════════════ */

export type UKInputs = {
  annualSalary: number;
  payFrequency: PayFrequency;
  pensionPercent: number;
  studentLoan: UKStudentLoan;
};

export function calcUK(inputs: UKInputs): SalaryBreakdown | null {
  const { annualSalary, payFrequency, pensionPercent, studentLoan } = inputs;
  if (annualSalary <= 0) return null;

  const gross = annualSalary;
  const periods = getPayPeriods(payFrequency);

  // Pension (salary sacrifice reduces gross for tax + NI purposes)
  const pensionAmount = gross * (pensionPercent / 100);
  const adjustedGross = gross - pensionAmount;

  // Personal allowance with taper above £100,000
  let personalAllowance = UK_PERSONAL_ALLOWANCE;
  if (adjustedGross > UK_PA_TAPER_THRESHOLD) {
    const reduction = Math.floor((adjustedGross - UK_PA_TAPER_THRESHOLD) / 2);
    personalAllowance = Math.max(0, personalAllowance - reduction);
  }

  // Income tax
  const taxableIncome = Math.max(0, adjustedGross - personalAllowance);
  const incomeTax = calcProgressiveTax(taxableIncome, UK_TAX_BANDS);
  const marginalRate = findMarginalRate(taxableIncome, UK_TAX_BANDS);

  // Employee National Insurance
  let ni = 0;
  if (adjustedGross > UK_NI_PRIMARY_THRESHOLD) {
    const belowUpper = Math.min(adjustedGross, UK_NI_UPPER_LIMIT) - UK_NI_PRIMARY_THRESHOLD;
    ni += Math.max(0, belowUpper) * UK_NI_RATE_BELOW;
    if (adjustedGross > UK_NI_UPPER_LIMIT) {
      ni += (adjustedGross - UK_NI_UPPER_LIMIT) * UK_NI_RATE_ABOVE;
    }
  }

  // Student loan repayment
  let studentLoanRepayment = 0;
  if (studentLoan !== "none") {
    const cfg = UK_STUDENT_LOAN_CONFIG[studentLoan];
    if (adjustedGross > cfg.threshold) {
      studentLoanRepayment = (adjustedGross - cfg.threshold) * cfg.rate;
    }
  }

  const totalDeductions = pensionAmount + incomeTax + ni + studentLoanRepayment;
  const netTakeHome = gross - totalDeductions;
  const effectiveRate = gross > 0 ? ((totalDeductions - pensionAmount) / gross) * 100 : 0;

  return {
    gross,
    preTaxDeductions: 0,
    federalTax: incomeTax,
    stateTax: 0,
    cityTax: 0,
    socialSecurity: 0,
    medicare: 0,
    studentLoan: studentLoanRepayment,
    nationalInsurance: ni,
    pension: pensionAmount,
    totalDeductions,
    netTakeHome,
    effectiveRate,
    marginalRate: marginalRate * 100,
    periods,
    perPeriod: {
      gross: gross / periods,
      deductions: totalDeductions / periods,
      net: netTakeHome / periods,
    },
    labels: { taxLabel: "Income tax", socialLabel: "National Insurance" },
  };
}

/* ═══════════════════════════ Custom / Generic ═══════════════════════════ */

export type CustomInputs = {
  annualSalary: number;
  payFrequency: PayFrequency;
  incomeTaxRate: number;
  socialContribRate: number;
};

export function calcCustom(inputs: CustomInputs): SalaryBreakdown | null {
  const { annualSalary, payFrequency, incomeTaxRate, socialContribRate } = inputs;
  if (annualSalary <= 0) return null;

  const gross = annualSalary;
  const periods = getPayPeriods(payFrequency);
  const incomeTax = gross * (incomeTaxRate / 100);
  const socialContrib = gross * (socialContribRate / 100);
  const totalDeductions = incomeTax + socialContrib;
  const netTakeHome = gross - totalDeductions;
  const effectiveRate = gross > 0 ? (totalDeductions / gross) * 100 : 0;

  return {
    gross,
    preTaxDeductions: 0,
    federalTax: incomeTax,
    stateTax: 0,
    cityTax: 0,
    socialSecurity: socialContrib,
    medicare: 0,
    studentLoan: 0,
    nationalInsurance: 0,
    pension: 0,
    totalDeductions,
    netTakeHome,
    effectiveRate,
    marginalRate: incomeTaxRate,
    periods,
    perPeriod: {
      gross: gross / periods,
      deductions: totalDeductions / periods,
      net: netTakeHome / periods,
    },
    labels: { taxLabel: "Income tax", socialLabel: "Social contributions" },
  };
}

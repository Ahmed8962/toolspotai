/**
 * Compound interest with regular contributions.
 *
 * Core formula (future value of lump sum + annuity):
 *   FV = P × (1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) − 1) / (r/n)]
 *
 * Where:
 *   P   = initial principal
 *   PMT = contribution per period (adjusted to match compounding frequency)
 *   r   = annual interest rate (decimal)
 *   n   = compounding periods per year
 *   t   = time in years
 *
 * Contribution timing: end of each contribution period (ordinary annuity).
 * When contribution frequency differs from compounding frequency, we
 * convert the contribution to match compounding periods using equivalent
 * periodic amounts.
 */

export type CompoundFrequency =
  | "daily"
  | "monthly"
  | "quarterly"
  | "semiannually"
  | "annually";

export const COMPOUND_OPTIONS: { value: CompoundFrequency; label: string; n: number }[] = [
  { value: "daily", label: "Daily (365)", n: 365 },
  { value: "monthly", label: "Monthly (12)", n: 12 },
  { value: "quarterly", label: "Quarterly (4)", n: 4 },
  { value: "semiannually", label: "Semi-annually (2)", n: 2 },
  { value: "annually", label: "Annually (1)", n: 1 },
];

export function getPeriodsPerYear(freq: CompoundFrequency): number {
  return COMPOUND_OPTIONS.find((o) => o.value === freq)!.n;
}

export type CompoundInterestInputs = {
  principal: number;
  /** Monthly contribution (converted internally to match compounding). */
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  compounding: CompoundFrequency;
  /** Range: rate variance (+/- this many percentage points) for high/low scenarios. */
  rateVariance: number;
};

export type YearlyGrowthRow = {
  year: number;
  /** Balance at end of year. */
  balance: number;
  /** Total contributions made so far (including principal). */
  totalContributions: number;
  /** Total interest earned so far. */
  totalInterest: number;
  /** Interest earned this year only. */
  yearInterest: number;
};

export type CompoundInterestResult = {
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
  /** High scenario (rate + variance). */
  futureValueHigh: number;
  /** Low scenario (rate - variance, floored at 0). */
  futureValueLow: number;
  yearly: YearlyGrowthRow[];
};

/**
 * Calculate compound interest future value for a given annual rate,
 * producing year-by-year rows with period-level accuracy.
 */
function computeWithRate(
  principal: number,
  monthlyContribution: number,
  annualRateDecimal: number,
  years: number,
  periodsPerYear: number,
): { futureValue: number; totalContributions: number; totalInterest: number; yearly: YearlyGrowthRow[] } {
  const r = annualRateDecimal / periodsPerYear;

  // Convert monthly contribution to per-compounding-period contribution.
  // e.g. for quarterly compounding: contribution per quarter = monthly × 3
  const contributionPerPeriod = (monthlyContribution * 12) / periodsPerYear;

  let balance = principal;
  let totalContributed = principal;
  let totalInterestAccum = 0;
  const yearly: YearlyGrowthRow[] = [];

  const totalPeriods = Math.round(years * periodsPerYear);
  const periodsInYear = periodsPerYear;

  for (let year = 1; year <= years; year++) {
    let yearInterest = 0;
    const startPeriod = (year - 1) * periodsInYear;
    const endPeriod = Math.min(year * periodsInYear, totalPeriods);

    for (let p = startPeriod; p < endPeriod; p++) {
      const interest = balance * r;
      yearInterest += interest;
      balance += interest;
      balance += contributionPerPeriod;
      totalContributed += contributionPerPeriod;
    }

    totalInterestAccum += yearInterest;

    yearly.push({
      year,
      balance,
      totalContributions: totalContributed,
      totalInterest: totalInterestAccum,
      yearInterest,
    });
  }

  return {
    futureValue: balance,
    totalContributions: totalContributed,
    totalInterest: totalInterestAccum,
    yearly,
  };
}

export function computeCompoundInterest(
  inputs: CompoundInterestInputs,
): CompoundInterestResult | null {
  const {
    principal,
    monthlyContribution,
    annualRatePercent,
    years,
    compounding,
    rateVariance,
  } = inputs;

  if (principal < 0 || years < 1 || years > 50) return null;
  if (annualRatePercent < 0 || annualRatePercent > 100) return null;

  const periodsPerYear = getPeriodsPerYear(compounding);
  const rateDecimal = annualRatePercent / 100;

  const main = computeWithRate(principal, monthlyContribution, rateDecimal, years, periodsPerYear);

  const highRate = Math.min((annualRatePercent + rateVariance) / 100, 1);
  const lowRate = Math.max((annualRatePercent - rateVariance) / 100, 0);

  const high = computeWithRate(principal, monthlyContribution, highRate, years, periodsPerYear);
  const low = computeWithRate(principal, monthlyContribution, lowRate, years, periodsPerYear);

  return {
    futureValue: main.futureValue,
    totalContributions: main.totalContributions,
    totalInterest: main.totalInterest,
    futureValueHigh: high.futureValue,
    futureValueLow: low.futureValue,
    yearly: main.yearly,
  };
}

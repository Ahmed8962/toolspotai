/**
 * Fixed-rate mortgage: amortizing P&I (reducing balance), same math as standard EMI.
 * PMI (conventional-style estimate): annual % of original loan until remaining
 * principal ≤ 78% of original purchase price (common automatic-removal threshold).
 * Does not model FHA MIP, VA, or lender-specific rules — for budgeting only.
 */

export type MortgageInputs = {
  homePrice: number;
  downPayment: number;
  annualRatePercent: number;
  termYears: number;
  annualPropertyTax: number;
  annualHomeInsurance: number;
  hoaMonthly: number;
  /** Annual PMI as % of original loan (e.g. 0.75). Not used if LTV ≤ 80% at closing. */
  pmiAnnualPercentOfLoan: number;
};

export type MonthlyMortgageRow = {
  month: number;
  principalPaid: number;
  interestPaid: number;
  pmiPaid: number;
  startBalance: number;
  endBalance: number;
};

export type YearlyMortgageRow = {
  year: number;
  principalPaid: number;
  interestPaid: number;
  pmiPaid: number;
  endBalance: number;
};

export type MortgageResult = {
  loanAmount: number;
  ltvAtClosingPercent: number;
  termMonths: number;
  monthlyPI: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  hoaMonthly: number;
  monthlyPmiWhenActive: number;
  pmiApplies: boolean;
  /** First calendar month (1-based) with no PMI; null if PMI never applied. */
  firstMonthWithoutPmi: number | null;
  totalInterest: number;
  totalPmi: number;
  /** Total of all P&I payments over life of loan. */
  totalMortgagePayments: number;
  /** Total of everything: P&I + tax + insurance + HOA + PMI over life of loan. */
  totalOutOfPocket: number;
  /** Month 1: P&I + escrow + HOA + PMI if applicable. */
  totalMonthlyFirst: number;
  /** P&I + escrow + HOA after PMI ends (same as first if no PMI). */
  totalMonthlyStable: number;
  monthly: MonthlyMortgageRow[];
  yearly: YearlyMortgageRow[];
};

/** Fixed monthly principal + interest (standard amortization). */
export function monthlyPrincipalAndInterest(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths < 1) return 0;
  const r = annualRatePercent / 12 / 100;
  if (r === 0) return principal / termMonths;
  const pow = (1 + r) ** termMonths;
  return (principal * r * pow) / (pow - 1);
}

const LTV_PMI_START = 0.8;
const BALANCE_PMI_END = 0.78;
const EPS = 1e-6;

export function computeMortgage(inputs: MortgageInputs): MortgageResult | null {
  const {
    homePrice,
    downPayment,
    annualRatePercent,
    termYears,
    annualPropertyTax,
    annualHomeInsurance,
    hoaMonthly,
    pmiAnnualPercentOfLoan,
  } = inputs;

  if (
    homePrice <= 0 ||
    downPayment < 0 ||
    downPayment >= homePrice ||
    termYears < 1 ||
    termYears > 40
  ) {
    return null;
  }

  const loanAmount = homePrice - downPayment;
  if (loanAmount <= 0) return null;

  const termMonths = Math.round(termYears * 12);
  const ltvAtClosingPercent = (loanAmount / homePrice) * 100;

  const monthlyPI = monthlyPrincipalAndInterest(
    loanAmount,
    annualRatePercent,
    termMonths,
  );
  const r = annualRatePercent / 12 / 100;

  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyInsurance = annualHomeInsurance / 12;
  const escrowHoa = monthlyPropertyTax + monthlyInsurance + hoaMonthly;

  const originationLtv = loanAmount / homePrice;
  const pmiApplies =
    originationLtv > LTV_PMI_START + EPS && pmiAnnualPercentOfLoan > 0;
  const monthlyPmiWhenActive = pmiApplies
    ? (loanAmount * (pmiAnnualPercentOfLoan / 100)) / 12
    : 0;

  const pmiRemovalBalance = BALANCE_PMI_END * homePrice;

  let balance = loanAmount;
  let totalInterest = 0;
  let totalPmi = 0;
  let firstMonthWithoutPmi: number | null = null;

  const monthly: MonthlyMortgageRow[] = [];
  const yearly: YearlyMortgageRow[] = [];
  let yPrincipal = 0;
  let yInterest = 0;
  let yPmi = 0;
  let currentYear = 1;

  for (let m = 1; m <= termMonths; m++) {
    const balanceStart = balance;
    const interest = balanceStart * r;
    const principalPayment = monthlyPI - interest;
    totalInterest += interest;
    yInterest += interest;
    yPrincipal += principalPayment;

    const hasPmi =
      pmiApplies && balanceStart > pmiRemovalBalance + EPS;
    const pmiThisMonth = hasPmi ? monthlyPmiWhenActive : 0;
    if (hasPmi) {
      totalPmi += monthlyPmiWhenActive;
      yPmi += monthlyPmiWhenActive;
    }
    if (pmiApplies && !hasPmi && firstMonthWithoutPmi === null) {
      firstMonthWithoutPmi = m;
    }

    balance -= principalPayment;
    if (balance < 0) balance = 0;

    monthly.push({
      month: m,
      principalPaid: principalPayment,
      interestPaid: interest,
      pmiPaid: pmiThisMonth,
      startBalance: balanceStart,
      endBalance: balance,
    });

    const endOfYear = m % 12 === 0 || m === termMonths;
    if (endOfYear) {
      yearly.push({
        year: currentYear,
        principalPaid: yPrincipal,
        interestPaid: yInterest,
        pmiPaid: yPmi,
        endBalance: balance,
      });
      currentYear += 1;
      yPrincipal = 0;
      yInterest = 0;
      yPmi = 0;
    }
  }

  if (!pmiApplies) {
    firstMonthWithoutPmi = null;
  }

  const pmiMonth1 =
    pmiApplies && loanAmount > pmiRemovalBalance + EPS
      ? monthlyPmiWhenActive
      : 0;
  const totalMonthlyFirst = monthlyPI + escrowHoa + pmiMonth1;
  const totalMonthlyStable = monthlyPI + escrowHoa;

  const totalMortgagePayments = monthlyPI * termMonths;
  const totalTaxOverLife = monthlyPropertyTax * termMonths;
  const totalInsOverLife = monthlyInsurance * termMonths;
  const totalHoaOverLife = hoaMonthly * termMonths;
  const totalOutOfPocket =
    totalMortgagePayments +
    totalTaxOverLife +
    totalInsOverLife +
    totalHoaOverLife +
    totalPmi;

  return {
    loanAmount,
    ltvAtClosingPercent,
    termMonths,
    monthlyPI,
    monthlyPropertyTax,
    monthlyInsurance,
    hoaMonthly,
    monthlyPmiWhenActive,
    pmiApplies,
    firstMonthWithoutPmi,
    totalInterest,
    totalPmi,
    totalMortgagePayments,
    totalOutOfPocket,
    totalMonthlyFirst,
    totalMonthlyStable,
    monthly,
    yearly,
  };
}

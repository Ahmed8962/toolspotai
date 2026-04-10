/**
 * Credit Card Payoff engine.
 *
 * Supports:
 *   - Multiple cards with individual balance, minimum payment, and APR
 *   - Total monthly budget allocated across all cards
 *   - Two strategies: Debt Avalanche (highest APR first) and Debt Snowball
 *     (lowest balance first)
 *   - Month-by-month schedule per card
 *   - Interest math: monthly rate = APR / 12, applied to remaining balance
 *     each month before payment
 *
 * Assumes no new charges, fixed minimum payments, and fixed APR.
 */

export type CardInput = {
  id: number;
  name: string;
  balance: number;
  minPayment: number;
  apr: number; // annual percentage rate, e.g. 19.99
};

export type Strategy = "avalanche" | "snowball";

export type MonthRow = {
  month: number;
  /** Per-card snapshot for this month */
  cards: {
    id: number;
    name: string;
    startBalance: number;
    interest: number;
    payment: number;
    endBalance: number;
  }[];
  totalPayment: number;
  totalInterest: number;
  totalBalance: number;
};

export type PayoffResult = {
  months: number;
  totalPaid: number;
  totalInterest: number;
  schedule: MonthRow[];
  /** Per-card summary */
  cardSummaries: {
    id: number;
    name: string;
    originalBalance: number;
    totalInterest: number;
    totalPaid: number;
    payoffMonth: number;
  }[];
};

const MAX_MONTHS = 600; // 50-year cap to prevent infinite loops

export function simulatePayoff(
  cards: CardInput[],
  monthlyBudget: number,
  strategy: Strategy,
): PayoffResult | null {
  if (cards.length === 0) return null;

  const totalMinPayments = cards.reduce((s, c) => s + c.minPayment, 0);
  if (monthlyBudget < totalMinPayments) return null;

  // Working state per card
  const state = cards.map((c) => ({
    id: c.id,
    name: c.name,
    balance: c.balance,
    minPayment: c.minPayment,
    monthlyRate: c.apr / 100 / 12,
    originalBalance: c.balance,
    totalInterest: 0,
    totalPaid: 0,
    payoffMonth: 0,
    paidOff: c.balance <= 0,
  }));

  const schedule: MonthRow[] = [];

  for (let month = 1; month <= MAX_MONTHS; month++) {
    const allPaidOff = state.every((c) => c.paidOff);
    if (allPaidOff) break;

    // 1. Accrue interest on each card
    for (const c of state) {
      if (c.paidOff) continue;
      const interest = c.balance * c.monthlyRate;
      c.balance += interest;
      c.totalInterest += interest;
    }

    // 2. Determine priority order for extra payments
    const active = state.filter((c) => !c.paidOff);
    if (strategy === "avalanche") {
      active.sort((a, b) => b.monthlyRate - a.monthlyRate || a.balance - b.balance);
    } else {
      active.sort((a, b) => a.balance - b.balance || b.monthlyRate - a.monthlyRate);
    }

    // 3. Pay minimums first
    let budgetLeft = monthlyBudget;
    const payments = new Map<number, number>();

    for (const c of active) {
      const minPay = Math.min(c.minPayment, c.balance);
      payments.set(c.id, minPay);
      budgetLeft -= minPay;
    }

    // 4. Allocate extra to priority card(s)
    for (const c of active) {
      if (budgetLeft <= 0) break;
      const currentPay = payments.get(c.id)!;
      const remaining = c.balance - currentPay;
      if (remaining <= 0) continue;
      const extra = Math.min(budgetLeft, remaining);
      payments.set(c.id, currentPay + extra);
      budgetLeft -= extra;
    }

    // 5. Apply payments and build month row
    const cardRows: MonthRow["cards"][number][] = [];
    let monthTotalPayment = 0;
    let monthTotalInterest = 0;
    let monthTotalBalance = 0;

    for (const c of state) {
      const startBalance = c.balance;
      const interest = c.paidOff ? 0 : startBalance - (startBalance / (1 + c.monthlyRate));
      const payment = payments.get(c.id) ?? 0;

      if (!c.paidOff) {
        c.balance = Math.max(0, c.balance - payment);
        c.totalPaid += payment;
        if (c.balance < 0.01) {
          c.balance = 0;
          c.paidOff = true;
          c.payoffMonth = month;
        }
      }

      cardRows.push({
        id: c.id,
        name: c.name,
        startBalance: startBalance,
        interest: c.paidOff && payment === 0 ? 0 : startBalance * c.monthlyRate / (1 + c.monthlyRate),
        payment,
        endBalance: c.balance,
      });

      monthTotalPayment += payment;
      monthTotalInterest += c.paidOff && payment === 0 ? 0 : startBalance * c.monthlyRate / (1 + c.monthlyRate);
      monthTotalBalance += c.balance;
    }

    schedule.push({
      month,
      cards: cardRows,
      totalPayment: monthTotalPayment,
      totalInterest: monthTotalInterest,
      totalBalance: monthTotalBalance,
    });

    if (state.every((c) => c.paidOff)) break;
  }

  const totalPaid = state.reduce((s, c) => s + c.totalPaid, 0);
  const totalInterest = state.reduce((s, c) => s + c.totalInterest, 0);
  const months = schedule.length;

  return {
    months,
    totalPaid,
    totalInterest,
    schedule,
    cardSummaries: state.map((c) => ({
      id: c.id,
      name: c.name,
      originalBalance: c.originalBalance,
      totalInterest: c.totalInterest,
      totalPaid: c.totalPaid,
      payoffMonth: c.payoffMonth || months,
    })),
  };
}

/**
 * Calculate minimum-payment-only scenario (paying just minimums, no extra).
 */
export function simulateMinimumOnly(cards: CardInput[]): PayoffResult | null {
  const totalMin = cards.reduce((s, c) => s + c.minPayment, 0);
  return simulatePayoff(cards, totalMin, "avalanche");
}

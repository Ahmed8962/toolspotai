/**
 * **Global bulletin overrides (any ISO 3166-1 alpha-2 country code).**
 *
 * OpenVan’s weekly aggregate is convenient worldwide but can drift from a given
 * country’s regulator cap or major-brand board. For **any** country where you
 * curate trusted headline numbers, add an entry here keyed by `US`, `DE`, `IN`, …
 * The API merges these on top of the feed for those codes only; all other
 * countries keep the raw aggregate values.
 *
 * Maintenance: when a government or national retailer publishes new caps,
 * update `effectiveFrom`, `prices`, `citation`, and `sourceUrl` for that code.
 *
 * Configured today:
 * - **PK** — PSO / Shell Pakistan Premier Euro 5 & Hi-Cetane Diesel Euro 5 boards.
 */
export type BulletinFuelKey = "gasoline" | "diesel" | "premium" | "lpg" | "e85";

export type FuelPriceBulletin = {
  effectiveFrom: string;
  citation: string;
  sourceUrl: string;
  /** Amounts in the same currency & unit as OpenVan uses for that country (usually /L or /US gal). */
  prices: Partial<Record<BulletinFuelKey, number>>;
  /** Hide misleading week-on-week deltas from the aggregate feed for overridden fields */
  suppressAggregateDeltasForOverrides: boolean;
};

/** ISO2 codes that have a bulletin object defined (may or may not appear in OpenVan this week). */
export function listBulletinConfiguredIsoCodes(): string[] {
  return Object.keys(FUEL_PRICE_BULLETINS).sort();
}

export const FUEL_PRICE_BULLETINS: Partial<Record<string, FuelPriceBulletin>> = {
  PK: {
    effectiveFrom: "2026-04-11",
    citation:
      "Premier Euro 5 (Super) and Hi-Cetane Diesel Euro 5 — PSO Pakistan & Shell Pakistan price boards.",
    sourceUrl: "https://psopk.com/en/fuels/fuel-prices",
    prices: {
      gasoline: 366.58,
      diesel: 385.54,
      premium: 366.58,
    },
    suppressAggregateDeltasForOverrides: true,
  },
};

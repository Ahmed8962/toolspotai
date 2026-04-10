"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/* ─── CPI inflation data ─── */

const YEARLY_RATES: Record<number, number> = {
  1990: 5.4, 1991: 4.2, 1992: 3.0, 1993: 3.0, 1994: 2.6,
  1995: 2.8, 1996: 3.0, 1997: 2.3, 1998: 1.6, 1999: 2.2,
  2000: 3.4, 2001: 2.8, 2002: 1.6, 2003: 2.3, 2004: 2.7,
  2005: 3.4, 2006: 3.2, 2007: 2.8, 2008: 3.8, 2009: -0.4,
  2010: 1.6, 2011: 3.2, 2012: 2.1, 2013: 1.5, 2014: 1.6,
  2015: 0.1, 2016: 1.3, 2017: 2.1, 2018: 2.4, 2019: 1.8,
  2020: 1.2, 2021: 4.7, 2022: 8.0, 2023: 4.1, 2024: 2.9,
  2025: 2.5,
};

const DECADE_RATES: Record<number, number> = {
  1920: 0.0, 1930: -2.0, 1940: 5.0, 1950: 2.2,
  1960: 2.5, 1970: 7.1, 1980: 5.5,
};

function getRateForYear(year: number): number {
  if (YEARLY_RATES[year] !== undefined) return YEARLY_RATES[year];
  const decade = Math.floor(year / 10) * 10;
  return DECADE_RATES[decade] ?? 3.0;
}

type Country = "US" | "UK" | "EU";

const COUNTRY_LABELS: Record<Country, string> = {
  US: "United States",
  UK: "United Kingdom",
  EU: "European Union",
};

const COUNTRY_RECENT_OVERRIDES: Record<Country, Partial<Record<number, number>>> = {
  US: {},
  UK: {
    2020: 0.9, 2021: 2.6, 2022: 9.1, 2023: 7.3, 2024: 3.5, 2025: 2.0,
  },
  EU: {
    2020: 0.3, 2021: 2.6, 2022: 8.4, 2023: 5.4, 2024: 2.4, 2025: 2.0,
  },
};

const COUNTRY_DEFAULT_RATE: Record<Country, number> = {
  US: 3.0,
  UK: 2.0,
  EU: 2.0,
};

const COUNTRY_CURRENCY: Record<Country, string> = {
  US: "USD",
  UK: "GBP",
  EU: "EUR",
};

function getRateForCountry(year: number, country: Country): number {
  const override = COUNTRY_RECENT_OVERRIDES[country][year];
  if (override !== undefined) return override;
  return getRateForYear(year);
}

const fmtCurrency = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);

const fmtPct = (n: number) =>
  `${n >= 0 ? "" : ""}${n.toFixed(2)}%`;

const START_YEAR = 1920;
const END_YEAR = 2025;
const YEARS_RANGE = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i,
);

/* ─── Purchasing-power bar chart ─── */

function PowerChart({
  data,
  currency,
}: {
  data: { year: number; value: number }[];
  currency: string;
}) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const step = data.length > 20 ? Math.ceil(data.length / 20) : 1;
  const filtered = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-text-primary">
        Purchasing power over time
      </p>
      <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
        {filtered.map((d) => {
          const pct = (d.value / maxVal) * 100;
          return (
            <div
              key={d.year}
              className="group relative flex flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              title={`${d.year}: ${fmtCurrency(d.value, currency)}`}
            >
              <div
                className="w-full rounded-t-[1px] bg-brand-600 transition-all"
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
        <span>{filtered[0]?.year}</span>
        <span>{filtered[filtered.length - 1]?.year}</span>
      </div>
    </div>
  );
}

function FutureCostChart({
  data,
  currency,
}: {
  data: { year: number; cost: number; power: number }[];
  currency: string;
}) {
  if (data.length === 0) return null;
  const maxCost = Math.max(...data.map((d) => d.cost), 1);
  const step = data.length > 25 ? Math.ceil(data.length / 25) : 1;
  const filtered = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-text-primary">
        Cost &amp; purchasing power over time
      </p>
      <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
        {filtered.map((d) => {
          const costPct = (d.cost / maxCost) * 100;
          const powerPct = (d.power / maxCost) * 100;
          return (
            <div
              key={d.year}
              className="relative flex flex-1 flex-col items-center justify-end gap-[1px]"
              style={{ height: "100%" }}
              title={`Year ${d.year}: cost ${fmtCurrency(d.cost, currency)}, buying power ${fmtCurrency(d.power, currency)}`}
            >
              <div
                className="w-full rounded-t-[1px] bg-red-500/80"
                style={{ height: `${costPct}%` }}
              />
              <div
                className="absolute bottom-0 w-[60%] rounded-t-[1px] bg-emerald-500/80"
                style={{ height: `${powerPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
        <span>Year 0</span>
        <span>Year {data.length - 1}</span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-text-secondary">
        <p>
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/80 align-middle" />{" "}
          Future cost
        </p>
        <p>
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/80 align-middle" />{" "}
          Buying power of original amount
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export default function InflationCalculator() {
  const [mode, setMode] = useState<"power" | "future">("power");
  const [country, setCountry] = useState<Country>("US");

  // Mode 1 state
  const [amount, setAmount] = useState("1000");
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2025);

  // Mode 2 state
  const [futureAmount, setFutureAmount] = useState("1000");
  const [yearsAhead, setYearsAhead] = useState(10);
  const [inflationRate, setInflationRate] = useState(
    String(COUNTRY_DEFAULT_RATE["US"]),
  );

  const currency = COUNTRY_CURRENCY[country];
  const fmt = (n: number) => fmtCurrency(n, currency);

  const handleCountryChange = (c: Country) => {
    setCountry(c);
    setInflationRate(String(COUNTRY_DEFAULT_RATE[c]));
  };

  /* ── Mode 1: Buying Power ── */
  const buyingPowerResult = useMemo(() => {
    const val = parseFloat(amount) || 0;
    if (val <= 0 || startYear === endYear) return null;

    const forward = endYear > startYear;
    const fromY = forward ? startYear : endYear;
    const toY = forward ? endYear : startYear;

    let cumulative = 1;
    const timeline: { year: number; value: number }[] = [
      { year: fromY, value: val },
    ];

    for (let y = fromY; y < toY; y++) {
      const rate = getRateForCountry(y, country) / 100;
      cumulative *= 1 + rate;
      timeline.push({ year: y + 1, value: val * cumulative });
    }

    const equivalentValue = forward ? val * cumulative : val / cumulative;

    const powerTimeline = forward
      ? timeline.map((d) => ({
          year: d.year,
          value: val / (d.value / val || 1),
        }))
      : timeline;

    const totalInflation = (cumulative - 1) * 100;
    const span = toY - fromY;
    const avgAnnual = span > 0
      ? (Math.pow(cumulative, 1 / span) - 1) * 100
      : 0;
    const powerLost = forward
      ? ((1 - val / (val * cumulative)) * 100)
      : ((1 - 1 / cumulative) * 100);

    return {
      equivalentValue,
      totalInflation,
      avgAnnual,
      powerLost,
      powerTimeline: forward
        ? timeline.map((d) => ({
            year: d.year,
            value: val * (val / d.value),
          }))
        : timeline,
      forward,
      span,
    };
  }, [amount, startYear, endYear, country]);

  /* ── Mode 2: Future Cost ── */
  const futureCostResult = useMemo(() => {
    const val = parseFloat(futureAmount) || 0;
    const rate = parseFloat(inflationRate) || 0;
    if (val <= 0 || yearsAhead <= 0) return null;

    const r = rate / 100;
    const futureValue = val * Math.pow(1 + r, yearsAhead);
    const totalInflation = ((futureValue / val) - 1) * 100;
    const powerRemaining = val / Math.pow(1 + r, yearsAhead);
    const powerLost = ((1 - powerRemaining / val) * 100);

    const timeline: { year: number; cost: number; power: number }[] = [];
    for (let y = 0; y <= yearsAhead; y++) {
      timeline.push({
        year: y,
        cost: val * Math.pow(1 + r, y),
        power: val / Math.pow(1 + r, y),
      });
    }

    return {
      futureValue,
      totalInflation,
      avgAnnual: rate,
      powerLost,
      powerRemaining,
      timeline,
    };
  }, [futureAmount, yearsAhead, inflationRate]);

  const inputCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";
  const selectCls =
    "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm appearance-none";

  return (
    <div className="space-y-8">
      {/* Country selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-text-secondary">Country:</span>
        {(Object.keys(COUNTRY_LABELS) as Country[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleCountryChange(c)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              country === c
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {COUNTRY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-lg border border-border bg-surface-muted p-1">
        {(
          [
            ["power", "Buying Power"],
            ["future", "Future Cost"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={cn(
              "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition",
              mode === key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Mode 1: Buying Power ── */}
      {mode === "power" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <p className="text-sm font-medium text-text-primary">
              How much is a past amount worth today (or vice versa)?
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Enter an amount and two years to see the equivalent purchasing
              power adjusted for inflation.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm text-text-secondary">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary">Start year</label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className={selectCls}
                >
                  {YEARS_RANGE.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-text-secondary">End year</label>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className={selectCls}
                >
                  {YEARS_RANGE.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {buyingPowerResult && (
            <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-text-muted">
                  {fmt(parseFloat(amount) || 0)} in {startYear} is equivalent to
                </p>
                <p className="font-result text-4xl font-semibold text-brand-700">
                  {fmt(buyingPowerResult.equivalentValue)}
                </p>
                <p className="mt-1 text-sm text-text-muted">in {endYear}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Equivalent value</p>
                  <p className="font-result mt-0.5 text-lg font-semibold text-brand-700">
                    {fmt(buyingPowerResult.equivalentValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">
                    Total inflation ({buyingPowerResult.span} yrs)
                  </p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {fmtPct(buyingPowerResult.totalInflation)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Avg. annual rate</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {fmtPct(buyingPowerResult.avgAnnual)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Purchasing power lost</p>
                  <p className="font-result mt-0.5 text-lg font-semibold text-red-600">
                    {fmtPct(buyingPowerResult.powerLost)}
                  </p>
                </div>
              </div>

              <PowerChart
                data={buyingPowerResult.powerTimeline}
                currency={currency}
              />

              <p className="text-xs leading-relaxed text-text-muted">
                Uses historical US CPI data (year-by-year from 1990, decade
                averages for earlier years).{" "}
                {country !== "US" &&
                  "Recent years use country-specific inflation data. Earlier years fall back to US CPI as a proxy."}{" "}
                Results are approximate and for informational purposes only.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Mode 2: Future Cost ── */}
      {mode === "future" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <p className="text-sm font-medium text-text-primary">
              What will something cost in the future?
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Project the future cost of goods or services based on a constant
              annual inflation rate.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-text-secondary">
                  Current cost
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={futureAmount}
                  onChange={(e) => setFutureAmount(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 1000"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Years in the future</span>
                  <span className="font-result text-brand-700">
                    {yearsAhead} {yearsAhead === 1 ? "year" : "years"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={yearsAhead}
                  onChange={(e) => setYearsAhead(Number(e.target.value))}
                  className="mt-2 w-full accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Annual inflation rate</span>
                  <span className="font-result text-brand-700">
                    {inflationRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.1}
                  value={parseFloat(inflationRate) || 0}
                  onChange={(e) => setInflationRate(e.target.value)}
                  className="mt-2 w-full accent-brand-600"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.1}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(e.target.value)}
                  className={cn(inputCls, "mt-2")}
                  placeholder="e.g. 3"
                />
              </div>
            </div>
          </div>

          {futureCostResult && (
            <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-text-muted">
                  {fmt(parseFloat(futureAmount) || 0)} today will cost
                </p>
                <p className="font-result text-4xl font-semibold text-brand-700">
                  {fmt(futureCostResult.futureValue)}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  in {yearsAhead} {yearsAhead === 1 ? "year" : "years"} at{" "}
                  {inflationRate}% annual inflation
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Future cost</p>
                  <p className="font-result mt-0.5 text-lg font-semibold text-brand-700">
                    {fmt(futureCostResult.futureValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Total inflation</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {fmtPct(futureCostResult.totalInflation)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Annual rate</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {fmtPct(futureCostResult.avgAnnual)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Purchasing power lost</p>
                  <p className="font-result mt-0.5 text-lg font-semibold text-red-600">
                    {fmtPct(futureCostResult.powerLost)}
                  </p>
                </div>
              </div>

              <FutureCostChart
                data={futureCostResult.timeline}
                currency={currency}
              />

              <p className="text-xs leading-relaxed text-text-muted">
                Formula: Future Value = Present Value &times; (1 +
                rate)<sup>years</sup>. Assumes a constant annual inflation rate
                of {inflationRate}%. Actual inflation varies year to year.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

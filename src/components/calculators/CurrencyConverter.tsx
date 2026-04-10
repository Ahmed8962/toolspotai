"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CurrencyDef = { code: string; name: string; symbol: string; flag: string };

const CURRENCIES: CurrencyDef[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
];

/** Static mid-market fallbacks (USD = 1) when API omits a code or fetch fails */
const STATIC_RATES_VS_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.5,
  MXN: 17.15,
  BRL: 4.97,
  KRW: 1325,
  SGD: 1.34,
  HKD: 7.82,
  NOK: 10.65,
  SEK: 10.42,
  DKK: 6.88,
  NZD: 1.64,
  ZAR: 18.6,
  TRY: 32.4,
  AED: 3.67,
  SAR: 3.75,
  PLN: 3.98,
  THB: 35.8,
};

type RateSource = "live" | "fallback";

function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const rFrom = rates[from];
  const rTo = rates[to];
  if (rFrom == null || rTo == null || rFrom <= 0) return 0;
  const usd = amount / rFrom;
  return usd * rTo;
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>(STATIC_RATES_VS_USD);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [source, setSource] = useState<RateSource>("fallback");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const loadRates = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(
        "https://api.frankfurter.app/latest?from=USD",
      );
      if (!res.ok) throw new Error("bad status");
      const data: { date?: string; rates?: Record<string, number> } =
        await res.json();
      const apiRates = data.rates;
      if (!apiRates || typeof apiRates !== "object") throw new Error("no rates");

      const merged: Record<string, number> = { USD: 1 };
      for (const c of CURRENCIES) {
        const v = apiRates[c.code];
        merged[c.code] =
          typeof v === "number" && v > 0
            ? v
            : STATIC_RATES_VS_USD[c.code] ?? 1;
      }
      setRates(merged);
      setRateDate(data.date ?? null);
      setSource("live");
    } catch {
      setRates(STATIC_RATES_VS_USD);
      setRateDate(null);
      setSource("fallback");
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  const amtNum = parseFloat(amount) || 0;

  const result = useMemo(() => {
    if (amtNum <= 0) return null;
    const converted = convert(amtNum, from, to, rates);
    const rate = convert(1, from, to, rates);
    const inverseRate = convert(1, to, from, rates);
    return { converted, rate, inverseRate };
  }, [amtNum, from, to, rates]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const fromCur = CURRENCIES.find((c) => c.code === from)!;
  const toCur = CURRENCIES.find((c) => c.code === to)!;

  const popularPairs = useMemo(() => {
    const pairs = ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "INR", "CNY"];
    return pairs
      .filter((p) => p !== from)
      .slice(0, 6)
      .map((p) => ({
        code: p,
        rate: convert(1, from, p, rates),
        cur: CURRENCIES.find((c) => c.code === p)!,
      }));
  }, [from, rates]);

  const selectCls =
    "h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm text-text-secondary">
        <div>
          {loading ? (
            <span>Loading exchange rates…</span>
          ) : source === "live" && rateDate ? (
            <span>
              Rates from{" "}
              <strong className="text-text-primary">Frankfurter</strong> (ECB
              data) · <strong className="text-text-primary">{rateDate}</strong>
            </span>
          ) : (
            <span>
              Using offline reference rates
              {fetchError ? " (could not reach rate service)" : ""}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void loadRates()}
          disabled={loading}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm transition hover:bg-brand-50 disabled:opacity-50"
        >
          Refresh rates
        </button>
      </div>

      {/* Converter */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
          {/* From */}
          <div>
            <label className="text-xs font-medium text-text-muted">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={cn(selectCls, "mt-1")}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 h-14 w-full rounded-lg border border-border bg-white px-4 text-2xl font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 font-result"
              placeholder="1000"
            />
          </div>

          {/* Swap */}
          <div className="flex items-end justify-center pb-4">
            <button
              type="button"
              onClick={swap}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm transition hover:bg-brand-50 hover:shadow-md"
              title="Swap currencies"
            >
              <svg
                className="h-5 w-5 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </button>
          </div>

          {/* To */}
          <div>
            <label className="text-xs font-medium text-text-muted">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={cn(selectCls, "mt-1")}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
            <div className="mt-2 flex h-14 items-center rounded-lg border border-brand-200 bg-brand-50/50 px-4">
              <span className="font-result text-2xl font-semibold text-brand-700">
                {result
                  ? result.converted.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Rate display */}
        {result && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
            <span>
              {fromCur.flag} 1 {from} ={" "}
              <strong className="text-text-primary">
                {result.rate.toLocaleString(undefined, {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </strong>{" "}
              {to}
            </span>
            <span>
              {toCur.flag} 1 {to} ={" "}
              <strong className="text-text-primary">
                {result.inverseRate.toLocaleString(undefined, {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </strong>{" "}
              {from}
            </span>
          </div>
        )}
      </div>

      {/* Quick rates table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="bg-surface-muted px-4 py-2.5">
          <p className="text-sm font-medium text-text-primary">
            {fromCur.flag} 1 {from} in other currencies
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border/60 sm:grid-cols-3">
          {popularPairs.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setTo(p.code)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-brand-50/40",
                to === p.code && "bg-brand-50",
              )}
            >
              <span className="text-lg">{p.cur.flag}</span>
              <div>
                <span className="font-medium text-text-primary">{p.code}</span>
                <span className="ml-2 font-result text-text-secondary">
                  {p.rate < 10
                    ? p.rate.toFixed(4)
                    : p.rate < 1000
                      ? p.rate.toFixed(2)
                      : Math.round(p.rate).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount comparison */}
      {result && amtNum > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="p-2">{from}</th>
                <th className="p-2 text-right">{to}</th>
              </tr>
            </thead>
            <tbody>
              {[1, 10, 50, 100, 500, 1000, 5000, 10000].map((a, i) => (
                <tr
                  key={a}
                  className={cn(
                    i % 2 === 1 && "bg-surface-muted/60",
                    a === amtNum && "bg-brand-50 font-semibold",
                  )}
                >
                  <td className="p-2 font-result">
                    {fromCur.symbol}
                    {a.toLocaleString()}
                  </td>
                  <td className="p-2 text-right font-result">
                    {toCur.symbol}
                    {convert(a, from, to, rates).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Mid-market rates for estimation only; banks and card networks add spreads
        and fees. Some currencies use static fallback values when not published
        on the ECB feed. Confirm amounts before you transfer money.
      </div>
    </div>
  );
}

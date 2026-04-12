"use client";

import type {
  FuelPricesApiPayload,
  FuelWholesaleApiPayload,
  OpenVanFuelRow,
} from "@/lib/fuel-prices-types";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const FUEL_KEYS = [
  { key: "gasoline" as const, label: "Gasoline (unleaded)" },
  { key: "diesel" as const, label: "Diesel" },
  { key: "lpg" as const, label: "LPG (autogas)" },
  { key: "premium" as const, label: "Premium" },
  { key: "e85" as const, label: "E85" },
];

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 3,
    }).format(value);
  } catch {
    return `${value.toFixed(3)} ${currency}`;
  }
}

function formatDelta(value: number | null | undefined, currency: string) {
  if (value == null || !Number.isFinite(value) || value === 0) return null;
  const abs = Math.abs(value);
  const fmt = formatMoney(abs, currency);
  const sign = value > 0 ? "+" : "−";
  return `${sign}${fmt}`;
}

function WholesaleChart({ payload }: { payload: FuelWholesaleApiPayload }) {
  const { pathD, wtiPath, minV, maxV, labels } = useMemo(() => {
    const pts = payload.points.filter((p) => p.brent != null || p.wti != null);
    if (pts.length < 2) {
      return { pathD: "", wtiPath: "", minV: 0, maxV: 1, labels: [] as string[] };
    }
    const vals: number[] = [];
    for (const p of pts) {
      if (p.brent != null) vals.push(p.brent);
      if (p.wti != null) vals.push(p.wti);
    }
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const pad = (maxV - minV) * 0.08 || 1;
    const lo = minV - pad;
    const hi = maxV + pad;
    const n = pts.length - 1;
    const W = 640;
    const H = 200;
    const padL = 44;
    const padR = 12;
    const padT = 16;
    const padB = 36;
    const iw = W - padL - padR;
    const ih = H - padT - padB;

    const xAt = (i: number) => padL + (i / n) * iw;
    const yAt = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * ih;

    const brentPts: string[] = [];
    const wtiPts: string[] = [];
    pts.forEach((p, i) => {
      if (p.brent != null) brentPts.push(`${xAt(i).toFixed(1)},${yAt(p.brent).toFixed(1)}`);
      if (p.wti != null) wtiPts.push(`${xAt(i).toFixed(1)},${yAt(p.wti).toFixed(1)}`);
    });
    const pathD =
      brentPts.length > 1 ? `M${brentPts.join("L")}` : "";
    const wtiPath = wtiPts.length > 1 ? `M${wtiPts.join("L")}` : "";
    const labels = [
      pts[0]?.date ?? "",
      pts[Math.floor(pts.length / 2)]?.date ?? "",
      pts[pts.length - 1]?.date ?? "",
    ];
    return { pathD, wtiPath, minV: lo, maxV: hi, labels };
  }, [payload]);

  if (!pathD && !wtiPath) {
    return (
      <p className="text-sm text-text-muted">
        Wholesale benchmark series is not available right now. Try again later.
      </p>
    );
  }

  const W = 640;
  const H = 200;

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-h-[220px] text-text-muted"
        role="img"
        aria-label="Six month Brent and WTI crude oil prices in US dollars per barrel"
      >
        <rect x="0" y="0" width={W} height={H} className="fill-surface-muted/50" rx="8" />
        <text x="12" y="22" className="fill-text-muted text-[11px]">
          USD / barrel (daily close)
        </text>
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="rgb(37 99 235)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : null}
        {wtiPath ? (
          <path
            d={wtiPath}
            fill="none"
            stroke="rgb(234 88 12)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity={0.9}
          />
        ) : null}
        <g className="fill-text-muted text-[10px]">
          <text x="44" y={H - 10}>{labels[0]}</text>
          <text x={W / 2 - 36} y={H - 10} textAnchor="middle">
            {labels[1]}
          </text>
          <text x={W - 12} y={H - 10} textAnchor="end">
            {labels[2]}
          </text>
        </g>
      </svg>
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-blue-600" /> Brent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-orange-600" /> WTI
        </span>
        <span className="text-text-muted/90">
          Range in chart: {minV.toFixed(0)}–{maxV.toFixed(0)} USD/bbl
        </span>
      </div>
      <p className="text-xs leading-relaxed text-text-muted">{payload.disclaimer}</p>
      <p className="text-[11px] text-text-muted/80">
        Sources: {payload.sources.join(" · ")} · Retail table:{" "}
        <a
          href="https://openvan.camp/en/developers"
          className="text-brand-600 underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenVan.camp
        </a>{" "}
        (CC BY)
      </p>
    </div>
  );
}

function PriceCards({ row }: { row: OpenVanFuelRow }) {
  const unitLabel = row.unit === "gallon" ? "per US gallon" : "per litre";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FUEL_KEYS.map(({ key, label }) => {
        const price = row.prices[key];
        if (price == null || !Number.isFinite(price)) return null;
        const delta = formatDelta(row.price_changes[key], row.currency);
        return (
          <div
            key={key}
            className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {label}
            </div>
            <div className="mt-1 text-lg font-semibold text-text-primary tabular-nums">
              {formatMoney(price, row.currency)}
            </div>
            <div className="mt-0.5 text-xs text-text-muted">
              {unitLabel} · {row.currency}
            </div>
            {delta ? (
              <div
                className={cn(
                  "mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
                  (row.price_changes[key] ?? 0) > 0
                    ? "bg-rose-50 text-rose-800"
                    : "bg-emerald-50 text-emerald-800",
                )}
              >
                vs prior update: {delta}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function FuelPriceCheck() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<FuelPricesApiPayload | null>(null);
  const [series, setSeries] = useState<FuelWholesaleApiPayload | null>(null);
  const [seriesErr, setSeriesErr] = useState(false);
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/fuel-prices");
        const json = (await res.json()) as FuelPricesApiPayload | { success: false };
        if (!res.ok || !("success" in json) || !json.success) {
          throw new Error("bad_response");
        }
        if (cancelled) return;
        setPayload(json);
        setCode(json.suggestedCountry);
      } catch {
        if (!cancelled) setErr("Could not load retail prices. Please try again in a few minutes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fuel-wholesale-series");
        const json = (await res.json()) as FuelWholesaleApiPayload | { success: false };
        if (!res.ok || !json.success) throw new Error("series");
        if (!cancelled) setSeries(json);
      } catch {
        if (!cancelled) setSeriesErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const row = payload && code ? payload.rows[code] : null;

  const geoNote = useMemo(() => {
    if (!payload) return null;
    if (payload.detectedCountry && payload.rows[payload.detectedCountry]) {
      const name = payload.rows[payload.detectedCountry].country_name;
      return `We matched your connection to ${name} (${payload.detectedCountry}). You can switch country below — VPNs and office networks may show a different location than where you fill up.`;
    }
    return "We could not detect your country from this connection (common on localhost or some corporate networks). Showing a default below — pick your country anytime.";
  }, [payload]);

  const selectCls =
    "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3 text-sm text-text-primary">
        {geoNote}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading retail fuel data…</p>
      ) : err ? (
        <p className="text-sm text-rose-700">{err}</p>
      ) : payload ? (
        <>
          <div>
            <label htmlFor="fuel-country" className="mb-1.5 block text-sm font-medium text-text-primary">
              Country or territory
            </label>
            <select
              id="fuel-country"
              className={selectCls}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            >
              {payload.countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {row?.fetched_at ? (
              <p className="mt-2 text-xs text-text-muted">
                Retail snapshot fetched: {new Date(row.fetched_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            ) : null}
          </div>

          {row ? (
            <>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Pump prices</h2>
                <p className="mt-1 text-sm text-text-muted">
                  National or typical retail averages where available — not your nearest station. Units follow each country (litres or US gallons).
                </p>
                <div className="mt-4">
                  <PriceCards row={row} />
                </div>
              </div>

              {row.sources ? (
                <p className="text-xs text-text-muted">
                  Sources cited by data provider: {row.sources}
                </p>
              ) : null}

              <div className="border-t border-border pt-8">
                <h2 className="text-base font-semibold text-text-primary">
                  Last ~6 months — global crude benchmarks
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Brent and WTI track international oil markets. They help explain part of why pump prices move, but they are not the same as retail gasoline or diesel in {row.country_name}.
                </p>
                <div className="mt-4">
                  {series && series.success ? (
                    <WholesaleChart payload={series} />
                  ) : seriesErr ? (
                    <p className="text-sm text-text-muted">
                      Wholesale chart could not be loaded. Retail prices above are still valid.
                    </p>
                  ) : (
                    <p className="text-sm text-text-muted">Loading benchmark series…</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">Select a country to see prices.</p>
          )}
        </>
      ) : null}
    </div>
  );
}

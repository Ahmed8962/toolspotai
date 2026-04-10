"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "between" | "addSub";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dateDiffDetailed(start: Date, end: Date) {
  const sign = start <= end ? 1 : -1;
  const [a, b] = sign === 1 ? [start, end] : [end, start];

  let years = b.getFullYear() - a.getFullYear();
  let months = b.getMonth() - a.getMonth();
  let days = b.getDate() - a.getDate();

  if (days < 0) {
    months--;
    days += daysInMonth(b.getFullYear(), b.getMonth() - 1);
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDays = Math.round(
    (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24),
  );
  const totalWeeks = Math.floor(totalDays / 7);
  const remainderDays = totalDays % 7;

  return { years, months, days, totalDays, totalWeeks, remainderDays, sign };
}

function countBusinessDays(start: Date, end: Date): number {
  const [a, b] = start <= end ? [start, end] : [end, start];
  let count = 0;
  const current = new Date(a);
  while (current < b) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function addToDate(
  base: Date,
  years: number,
  months: number,
  weeks: number,
  days: number,
  subtract: boolean,
): Date {
  const sign = subtract ? -1 : 1;
  const result = new Date(base);
  result.setFullYear(result.getFullYear() + years * sign);
  result.setMonth(result.getMonth() + months * sign);
  result.setDate(result.getDate() + (weeks * 7 + days) * sign);
  return result;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateCalculator() {
  const today = new Date();
  const [mode, setMode] = useState<Mode>("between");

  // Between mode
  const [startDate, setStartDate] = useState(toInputDate(today));
  const [endDate, setEndDate] = useState(
    toInputDate(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())),
  );
  const [includeEnd, setIncludeEnd] = useState(false);
  const [businessOnly, setBusinessOnly] = useState(false);

  // Add/subtract mode
  const [baseDate, setBaseDate] = useState(toInputDate(today));
  const [addYears, setAddYears] = useState("0");
  const [addMonths, setAddMonths] = useState("0");
  const [addWeeks, setAddWeeks] = useState("0");
  const [addDays, setAddDays] = useState("0");
  const [isSubtract, setIsSubtract] = useState(false);
  const [calcBusinessDays, setCalcBusinessDays] = useState(false);

  // Between results
  const betweenResult = useMemo(() => {
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

    const diff = dateDiffDetailed(s, e);
    const adjustedTotalDays = includeEnd ? diff.totalDays + 1 : diff.totalDays;
    const bizDays = businessOnly ? countBusinessDays(s, e) + (includeEnd ? 1 : 0) : null;

    return { ...diff, adjustedTotalDays, bizDays, start: s, end: e };
  }, [startDate, endDate, includeEnd, businessOnly]);

  // Add/sub results
  const addSubResult = useMemo(() => {
    const base = new Date(baseDate + "T00:00:00");
    if (isNaN(base.getTime())) return null;

    const y = parseInt(addYears, 10) || 0;
    const m = parseInt(addMonths, 10) || 0;
    const w = parseInt(addWeeks, 10) || 0;
    const d = parseInt(addDays, 10) || 0;

    if (calcBusinessDays) {
      // Add/subtract business days only
      const totalBizDays = d + w * 5;
      const sign = isSubtract ? -1 : 1;
      const result = new Date(base);
      let remaining = Math.abs(totalBizDays);
      const dir = totalBizDays >= 0 ? sign : -sign;
      while (remaining > 0) {
        result.setDate(result.getDate() + dir);
        const dow = result.getDay();
        if (dow !== 0 && dow !== 6) remaining--;
      }
      // Add months/years normally
      result.setFullYear(result.getFullYear() + y * sign);
      result.setMonth(result.getMonth() + m * sign);
      return result;
    }

    return addToDate(base, y, m, w, d, isSubtract);
  }, [baseDate, addYears, addMonths, addWeeks, addDays, isSubtract, calcBusinessDays]);

  const inputCls =
    "h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["between", "Days Between Two Dates"],
            ["addSub", "Add or Subtract from a Date"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setMode(val)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === val
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Between mode ─── */}
      {mode === "between" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-4">
            <p className="text-sm font-medium text-text-primary">
              Find the number of years, months, weeks, and days between two dates
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-text-secondary">
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={cn(inputCls, "mt-1")}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(inputCls, "mt-1")}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEnd}
                  onChange={(e) => setIncludeEnd(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                Include end day (add 1 day)
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={businessOnly}
                  onChange={(e) => setBusinessOnly(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                Calculate in business days
              </label>
            </div>
          </div>

          {betweenResult && (
            <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-text-muted">
                  {businessOnly ? "Business days between" : "Days between"}
                </p>
                <p className="font-result text-4xl font-semibold text-brand-700">
                  {businessOnly
                    ? betweenResult.bizDays
                    : betweenResult.adjustedTotalDays}{" "}
                  days
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Years, months, days</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {betweenResult.years}y {betweenResult.months}m{" "}
                    {betweenResult.days}d
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Total days</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {betweenResult.adjustedTotalDays}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Weeks + days</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {Math.floor(betweenResult.adjustedTotalDays / 7)} weeks{" "}
                    {betweenResult.adjustedTotalDays % 7} days
                  </p>
                </div>
                {betweenResult.bizDays !== null && (
                  <div className="rounded-xl bg-surface-muted p-4">
                    <p className="text-xs text-text-muted">Business days</p>
                    <p className="font-result mt-0.5 text-lg font-semibold">
                      {betweenResult.bizDays}
                    </p>
                  </div>
                )}
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Total hours</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {(betweenResult.adjustedTotalDays * 24).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-text-muted">Total minutes</p>
                  <p className="font-result mt-0.5 text-lg font-semibold">
                    {(betweenResult.adjustedTotalDays * 1440).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-surface-muted p-4 text-center text-sm text-text-secondary">
                From <span className="font-semibold">{formatDate(betweenResult.start)}</span> to{" "}
                <span className="font-semibold">{formatDate(betweenResult.end)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Add/Subtract mode ─── */}
      {mode === "addSub" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-4">
            <p className="text-sm font-medium text-text-primary">
              Add or subtract time from a date
            </p>
            <label className="block text-sm text-text-secondary">
              Start date
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className={cn(inputCls, "mt-1 max-w-64")}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsSubtract(false)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  !isSubtract
                    ? "bg-brand-600 text-white"
                    : "border border-border text-text-secondary hover:bg-surface-muted",
                )}
              >
                Add (+)
              </button>
              <button
                type="button"
                onClick={() => setIsSubtract(true)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  isSubtract
                    ? "bg-brand-600 text-white"
                    : "border border-border text-text-secondary hover:bg-surface-muted",
                )}
              >
                Subtract (&minus;)
              </button>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <label className="block text-sm text-text-secondary">
                Years
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={addYears}
                  onChange={(e) => setAddYears(e.target.value)}
                  className={cn(inputCls, "mt-1")}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Months
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={addMonths}
                  onChange={(e) => setAddMonths(e.target.value)}
                  className={cn(inputCls, "mt-1")}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Weeks
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={addWeeks}
                  onChange={(e) => setAddWeeks(e.target.value)}
                  className={cn(inputCls, "mt-1")}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Days
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={addDays}
                  onChange={(e) => setAddDays(e.target.value)}
                  className={cn(inputCls, "mt-1")}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={calcBusinessDays}
                onChange={(e) => setCalcBusinessDays(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-600"
              />
              Calculate in business days
            </label>
          </div>

          {addSubResult && (
            <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-text-muted">
                  Resulting date
                </p>
                <p className="font-result text-3xl font-semibold text-brand-700">
                  {formatDate(addSubResult)}
                </p>
              </div>

              <div className="rounded-xl bg-surface-muted p-4 text-center text-sm text-text-secondary">
                {formatDate(new Date(baseDate + "T00:00:00"))}{" "}
                {isSubtract ? "minus" : "plus"}{" "}
                {[
                  parseInt(addYears, 10) ? `${addYears} years` : "",
                  parseInt(addMonths, 10) ? `${addMonths} months` : "",
                  parseInt(addWeeks, 10) ? `${addWeeks} weeks` : "",
                  parseInt(addDays, 10) ? `${addDays} days` : "",
                ]
                  .filter(Boolean)
                  .join(", ") || "0 days"}{" "}
                = <span className="font-semibold">{formatDate(addSubResult)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

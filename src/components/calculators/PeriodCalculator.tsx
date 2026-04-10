"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function toInput(d: Date): string { return d.toISOString().split("T")[0]; }

type CycleInfo = {
  periodStart: Date;
  periodEnd: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
};

function computeCycles(lmpDate: Date, cycleLen: number, periodLen: number, count: number): CycleInfo[] {
  const cycles: CycleInfo[] = [];
  for (let i = 0; i < count; i++) {
    const periodStart = addDays(lmpDate, i * cycleLen);
    const periodEnd = addDays(periodStart, periodLen - 1);
    const ovulation = addDays(periodStart, cycleLen - 14);
    const fertileStart = addDays(ovulation, -5);
    const fertileEnd = addDays(ovulation, 1);
    cycles.push({ periodStart, periodEnd, ovulation, fertileStart, fertileEnd });
  }
  return cycles;
}

function getDayType(date: Date, cycles: CycleInfo[]): "period" | "fertile" | "ovulation" | null {
  for (const c of cycles) {
    if (sameDay(date, c.ovulation)) return "ovulation";
    if (date >= c.fertileStart && date <= c.fertileEnd) return "fertile";
    if (date >= c.periodStart && date <= c.periodEnd) return "period";
  }
  return null;
}

export default function PeriodCalculator() {
  const today = new Date();
  const [lastPeriod, setLastPeriod] = useState(toInput(addDays(today, -14)));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  const cycles = useMemo(() => {
    const lmp = new Date(lastPeriod + "T00:00:00");
    if (isNaN(lmp.getTime())) return [];
    return computeCycles(lmp, cycleLength, periodLength, 6);
  }, [lastPeriod, cycleLength, periodLength]);

  const calendarMonths = useMemo(() => {
    if (cycles.length === 0) return [];
    const start = new Date(cycles[0].periodStart);
    start.setDate(1);
    const months: Date[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new Date(start);
      m.setMonth(m.getMonth() + i);
      months.push(m);
    }
    return months;
  }, [cycles]);

  const inputCls = "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/30";

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted">First day of your last period</label>
          <input type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} className={cn(inputCls, "mt-1")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted">Cycle length (days)</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={21} max={35} value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))}
                className="flex-1 accent-rose-500 h-2" />
              <span className="font-result text-sm font-semibold w-8 text-center text-text-primary">{cycleLength}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted">Period duration (days)</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={2} max={8} value={periodLength} onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="flex-1 accent-rose-500 h-2" />
              <span className="font-result text-sm font-semibold w-8 text-center text-text-primary">{periodLength}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { color: "bg-rose-500", label: "Period" },
          { color: "bg-emerald-400", label: "Fertile window" },
          { color: "bg-blue-500", label: "Ovulation day" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={cn("h-3 w-3 rounded-full", item.color)} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Calendar view */}
      {calendarMonths.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {calendarMonths.map((month) => {
            const year = month.getFullYear();
            const mo = month.getMonth();
            const firstDayOfWeek = new Date(year, mo, 1).getDay();
            const daysInMonth = new Date(year, mo + 1, 0).getDate();
            const cells: (Date | null)[] = [];
            for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, mo, d));

            return (
              <div key={`${year}-${mo}`} className="rounded-xl border border-border bg-white p-3">
                <p className="text-center text-sm font-semibold text-text-primary mb-2">
                  {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <span key={d} className="text-[10px] font-medium text-text-muted py-0.5">{d}</span>
                  ))}
                  {cells.map((date, i) => {
                    if (!date) return <span key={`e-${i}`} />;
                    const type = getDayType(date, cycles);
                    const isToday = sameDay(date, today);
                    return (
                      <span key={i} className={cn(
                        "flex items-center justify-center h-7 w-7 mx-auto rounded-full text-xs font-medium transition",
                        type === "period" && "bg-rose-500 text-white",
                        type === "ovulation" && "bg-blue-500 text-white",
                        type === "fertile" && "bg-emerald-100 text-emerald-800",
                        !type && "text-text-secondary",
                        isToday && !type && "ring-2 ring-rose-300",
                        isToday && type && "ring-2 ring-white ring-offset-2 ring-offset-rose-500",
                      )}>
                        {date.getDate()}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cycle predictions table */}
      {cycles.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="bg-surface-muted px-4 py-2.5">
            <p className="text-sm font-medium text-text-primary">Next 6 Cycle Predictions</p>
          </div>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-muted/60">
              <tr>
                <th className="p-2">Cycle</th>
                <th className="p-2">Period Start</th>
                <th className="p-2">Period End</th>
                <th className="p-2 hidden sm:table-cell">Fertile Window</th>
                <th className="p-2">Ovulation</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c, i) => {
                const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <tr key={i} className={cn(i % 2 === 1 && "bg-surface-muted/40")}>
                    <td className="p-2 font-medium">#{i + 1}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        {fmtShort(c.periodStart)}
                      </span>
                    </td>
                    <td className="p-2">{fmtShort(c.periodEnd)}</td>
                    <td className="p-2 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {fmtShort(c.fertileStart)} – {fmtShort(c.fertileEnd)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        {fmtShort(c.ovulation)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
        🔒 All calculations are done in your browser. No data is stored or sent to any server. This is an estimate based on average cycles — consult your doctor for medical advice.
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toInput(d: Date): string { return d.toISOString().split("T")[0]; }
function fmtShort(d: Date): string { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function fmtLong(d: Date): string { return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }

type CycleFertility = {
  cycleStart: Date;
  nextPeriod: Date;
  ovulation: Date;
  fertileStart: Date;
  fertileEnd: Date;
  dueDateIfConceived: Date;
  days: { date: Date; fertility: "period" | "low" | "medium" | "high" | "peak" }[];
};

function computeFertility(lmp: Date, cycleLen: number, periodLen: number): CycleFertility {
  const ovulation = addDays(lmp, cycleLen - 14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const nextPeriod = addDays(lmp, cycleLen);
  const dueDateIfConceived = addDays(lmp, 280);

  const days: CycleFertility["days"] = [];
  for (let i = 0; i < cycleLen; i++) {
    const date = addDays(lmp, i);
    const dayFromOvulation = i - (cycleLen - 14);
    let fertility: CycleFertility["days"][0]["fertility"] = "low";

    if (i < periodLen) fertility = "period";
    else if (dayFromOvulation === 0) fertility = "peak";
    else if (dayFromOvulation >= -2 && dayFromOvulation <= 1) fertility = "high";
    else if (dayFromOvulation >= -5 && dayFromOvulation <= 1) fertility = "medium";

    days.push({ date, fertility });
  }

  return { cycleStart: lmp, nextPeriod, ovulation, fertileStart, fertileEnd, dueDateIfConceived, days };
}

export default function OvulationCalculator() {
  const today = new Date();
  const [lastPeriod, setLastPeriod] = useState(toInput(addDays(today, -10)));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength] = useState(5);

  const cycles = useMemo(() => {
    const lmp = new Date(lastPeriod + "T00:00:00");
    if (isNaN(lmp.getTime())) return [];
    const result: CycleFertility[] = [];
    for (let i = 0; i < 3; i++) {
      const start = addDays(lmp, i * cycleLength);
      result.push(computeFertility(start, cycleLength, periodLength));
    }
    return result;
  }, [lastPeriod, cycleLength, periodLength]);

  const currentCycle = cycles[0];
  const inputCls = "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/30";

  const fertilityColors: Record<string, { bg: string; text: string; label: string }> = {
    period: { bg: "bg-rose-500", text: "text-white", label: "Period" },
    low: { bg: "bg-slate-100", text: "text-text-muted", label: "Low" },
    medium: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Medium" },
    high: { bg: "bg-emerald-400", text: "text-white", label: "High" },
    peak: { bg: "bg-blue-500", text: "text-white", label: "Peak" },
  };

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted">First day of your last menstrual period</label>
          <input type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} className={cn(inputCls, "mt-1")} />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted">Average cycle length: <strong>{cycleLength} days</strong></label>
          <input type="range" min={21} max={35} value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))}
            className="w-full accent-violet-500 h-2 mt-1" />
          <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
            <span>21</span><span>28 (avg)</span><span>35</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(fertilityColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={cn("h-3 w-3 rounded-full", val.bg)} />
            {val.label}
          </div>
        ))}
      </div>

      {currentCycle && (
        <>
          {/* Hero results */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 sm:p-8 text-white text-center">
            <p className="text-sm font-medium opacity-80">Most Fertile Day (Ovulation)</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">{fmtLong(currentCycle.ovulation)}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
              <span className="rounded-full bg-white/20 px-3 py-1">
                🌸 Fertile window: {fmtShort(currentCycle.fertileStart)} – {fmtShort(currentCycle.fertileEnd)}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1">
                📅 Next period: {fmtShort(currentCycle.nextPeriod)}
              </span>
            </div>
          </div>

          {/* Fertility timeline — visual bar */}
          {cycles.map((cycle, ci) => (
            <div key={ci} className="rounded-xl border border-border bg-white p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">
                Cycle {ci + 1} — {fmtShort(cycle.cycleStart)} to {fmtShort(addDays(cycle.cycleStart, cycleLength - 1))}
              </p>
              <div className="flex gap-px rounded-lg overflow-hidden">
                {cycle.days.map((day, di) => {
                  const cfg = fertilityColors[day.fertility];
                  return (
                    <div key={di} className={cn("flex-1 h-8 relative group cursor-default", cfg.bg)}
                      title={`${fmtShort(day.date)} — ${cfg.label} fertility`}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                        <div className="rounded bg-slate-800 text-white text-[10px] px-2 py-1 whitespace-nowrap">
                          {fmtShort(day.date)} — {cfg.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
                <span>Day 1</span>
                <span>Ovulation ↑</span>
                <span>Day {cycleLength}</span>
              </div>
            </div>
          ))}

          {/* Key dates for all 3 cycles */}
          <div className="grid gap-3 sm:grid-cols-3">
            {cycles.map((cycle, ci) => (
              <div key={ci} className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-2">
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Cycle {ci + 1}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Fertile window</span>
                    <span className="font-medium text-emerald-600">{fmtShort(cycle.fertileStart)} – {fmtShort(cycle.fertileEnd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Ovulation day</span>
                    <span className="font-medium text-blue-600">{fmtShort(cycle.ovulation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Next period</span>
                    <span className="font-medium text-rose-600">{fmtShort(cycle.nextPeriod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Due date if conceived</span>
                    <span className="font-medium text-violet-600">{fmtShort(cycle.dueDateIfConceived)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conception probability table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <div className="bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-medium text-text-primary">Daily Conception Probability (Current Cycle)</p>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border/40 p-px">
              {currentCycle.days.filter((d) => d.fertility !== "period" && d.fertility !== "low").length === 0 ? (
                <p className="col-span-7 p-4 text-sm text-text-muted text-center">No fertile days in current view</p>
              ) : (
                currentCycle.days
                  .filter((d) => ["medium", "high", "peak"].includes(d.fertility))
                  .map((day, i) => {
                    const cfg = fertilityColors[day.fertility];
                    const prob = day.fertility === "peak" ? "~33%" : day.fertility === "high" ? "~25%" : "~10%";
                    return (
                      <div key={i} className="bg-white p-2 text-center">
                        <p className="text-[10px] text-text-muted">{day.date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                        <p className="text-xs font-semibold text-text-primary">{day.date.getDate()}</p>
                        <span className={cn("mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium", cfg.bg, cfg.text)}>
                          {cfg.label}
                        </span>
                        <p className="mt-0.5 text-[10px] font-medium text-text-secondary">{prob}</p>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </>
      )}

      <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-violet-800">
        This is an estimate based on average cycle patterns. Actual ovulation can vary. If you are trying to conceive or avoid pregnancy, consult your healthcare provider for personalized guidance.
      </div>
    </div>
  );
}

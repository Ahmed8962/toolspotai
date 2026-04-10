"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Method = "lmp" | "conception" | "ivf";

const MILESTONES = [
  { week: 4, label: "Positive pregnancy test possible" },
  { week: 6, label: "Heartbeat can be detected" },
  { week: 8, label: "First prenatal visit" },
  { week: 12, label: "End of first trimester" },
  { week: 13, label: "Second trimester begins" },
  { week: 16, label: "Gender may be visible on ultrasound" },
  { week: 20, label: "Anatomy scan (mid-pregnancy ultrasound)" },
  { week: 24, label: "Viability milestone" },
  { week: 27, label: "Third trimester begins" },
  { week: 32, label: "Baby's lungs maturing rapidly" },
  { week: 37, label: "Early term — baby considered full-term" },
  { week: 39, label: "Full term" },
  { week: 40, label: "Estimated due date (EDD)" },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDate(d: Date, fmt: "us" | "uk"): string {
  if (fmt === "uk") return d.toLocaleDateString("en-GB", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
}

function toInput(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function PregnancyCalculator() {
  const [method, setMethod] = useState<Method>("lmp");
  const [dateFmt, setDateFmt] = useState<"us" | "uk">("us");
  const today = new Date();
  const [lmpDate, setLmpDate] = useState(toInput(addDays(today, -70)));
  const [conceptionDate, setConceptionDate] = useState(toInput(addDays(today, -56)));
  const [ivfDate, setIvfDate] = useState(toInput(addDays(today, -56)));
  const [ivfDay, setIvfDay] = useState<"3" | "5">("5");

  const result = useMemo(() => {
    let gestStart: Date;
    let conception: Date;

    if (method === "lmp") {
      const lmp = new Date(lmpDate + "T00:00:00");
      if (isNaN(lmp.getTime())) return null;
      gestStart = lmp;
      conception = addDays(lmp, 14);
    } else if (method === "conception") {
      const cd = new Date(conceptionDate + "T00:00:00");
      if (isNaN(cd.getTime())) return null;
      conception = cd;
      gestStart = addDays(cd, -14);
    } else {
      const ivf = new Date(ivfDate + "T00:00:00");
      if (isNaN(ivf.getTime())) return null;
      const dayNum = parseInt(ivfDay);
      conception = addDays(ivf, -dayNum);
      gestStart = addDays(ivf, -(14 + dayNum));
    }

    const dueDate = addDays(gestStart, 280);
    const totalDays = daysBetween(gestStart, today);
    const currentWeek = Math.floor(totalDays / 7);
    const currentDay = totalDays % 7;
    const daysRemaining = daysBetween(today, dueDate);
    const progress = Math.min(100, Math.max(0, (totalDays / 280) * 100));
    const trimester = currentWeek < 13 ? 1 : currentWeek < 27 ? 2 : 3;

    return {
      dueDate, conception, gestStart, currentWeek, currentDay,
      daysRemaining, progress, trimester, totalDays,
      firstTrimEnd: addDays(gestStart, 13 * 7),
      secondTrimEnd: addDays(gestStart, 27 * 7),
      viability: addDays(gestStart, 24 * 7),
      fullTerm: addDays(gestStart, 39 * 7),
    };
  }, [method, lmpDate, conceptionDate, ivfDate, ivfDay]);

  const fmt = (d: Date) => fmtDate(d, dateFmt);
  const inputCls = "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-pink-500/30";

  return (
    <div className="space-y-6">
      {/* Date format toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-text-muted">Date format:</span>
        {(["us", "uk"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setDateFmt(f)}
            className={cn("rounded-lg px-3 py-1 text-xs font-medium border transition",
              dateFmt === f ? "bg-pink-600 text-white border-pink-600" : "bg-white border-border text-text-muted hover:text-text-primary")}>
            {f === "us" ? "MM/DD/YYYY" : "DD/MM/YYYY"}
          </button>
        ))}
      </div>

      {/* Method tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["lmp", "Last Period (LMP)"], ["conception", "Conception Date"], ["ivf", "IVF Transfer"]] as const).map(([m, lbl]) => (
          <button key={m} type="button" onClick={() => setMethod(m)}
            className={cn("flex-1 rounded-lg px-2 py-2.5 text-xs sm:text-sm font-medium transition",
              method === m ? "bg-white shadow-sm text-pink-700" : "text-text-muted hover:text-text-primary")}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5 space-y-4">
        {method === "lmp" && (
          <div>
            <label className="text-xs font-medium text-text-muted">First day of last menstrual period</label>
            <input type="date" value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        )}
        {method === "conception" && (
          <div>
            <label className="text-xs font-medium text-text-muted">Estimated conception / ovulation date</label>
            <input type="date" value={conceptionDate} onChange={(e) => setConceptionDate(e.target.value)} className={cn(inputCls, "mt-1")} />
          </div>
        )}
        {method === "ivf" && (
          <>
            <div>
              <label className="text-xs font-medium text-text-muted">Transfer date</label>
              <input type="date" value={ivfDate} onChange={(e) => setIvfDate(e.target.value)} className={cn(inputCls, "mt-1")} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted">Embryo transfer day</label>
              <select value={ivfDay} onChange={(e) => setIvfDay(e.target.value as "3" | "5")}
                className={cn(inputCls, "mt-1 bg-surface-card")}>
                <option value="3">Day 3 Transfer</option>
                <option value="5">Day 5 Transfer (Blastocyst)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 p-6 sm:p-8 text-white text-center">
            <p className="text-sm font-medium opacity-80">Your Estimated Due Date</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold">{fmt(result.dueDate)}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded-full bg-white/20 px-3 py-1">
                🤰 You are <strong>{result.currentWeek} weeks</strong> pregnant
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1">
                Trimester {result.trimester}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1">
                {result.daysRemaining > 0 ? `${result.daysRemaining} days remaining` :
                 result.daysRemaining === 0 ? "Due today!" : `${Math.abs(result.daysRemaining)} days past due`}
              </span>
            </div>
          </div>

          {/* Week-by-week progress bar */}
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-text-primary">
                Week {result.currentWeek}{result.currentDay > 0 ? ` + ${result.currentDay} days` : ""}
              </span>
              <span className="text-text-muted">{Math.round(result.progress)}% complete</span>
            </div>
            {/* Segmented progress bar */}
            <div className="flex h-5 rounded-full overflow-hidden bg-surface-muted gap-px">
              {Array.from({ length: 40 }, (_, i) => {
                const weekNum = i + 1;
                const filled = weekNum <= result.currentWeek;
                const isCurrent = weekNum === result.currentWeek;
                let bg = "bg-slate-200";
                if (filled) {
                  if (weekNum <= 12) bg = "bg-pink-400";
                  else if (weekNum <= 26) bg = "bg-purple-400";
                  else bg = "bg-indigo-500";
                }
                if (isCurrent) bg = bg.replace("400", "600").replace("500", "700");
                return <div key={i} className={cn("flex-1 transition-colors", bg)} title={`Week ${weekNum}`} />;
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] sm:text-xs text-text-muted">
              <span>Week 1</span>
              <span className="text-pink-600 font-medium">1st Tri</span>
              <span className="text-purple-600 font-medium">2nd Tri</span>
              <span className="text-indigo-600 font-medium">3rd Tri</span>
              <span>Week 40</span>
            </div>
          </div>

          {/* Key milestone dates */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {[
              { label: "Conception Date", value: fmt(result.conception), icon: "🌟", color: "bg-rose-50 border-rose-200" },
              { label: "End of 1st Trimester", value: fmt(result.firstTrimEnd), icon: "1️⃣", color: "bg-pink-50 border-pink-200" },
              { label: "Viability (Week 24)", value: fmt(result.viability), icon: "💪", color: "bg-amber-50 border-amber-200" },
              { label: "End of 2nd Trimester", value: fmt(result.secondTrimEnd), icon: "2️⃣", color: "bg-purple-50 border-purple-200" },
              { label: "Full Term (Week 39)", value: fmt(result.fullTerm), icon: "✅", color: "bg-green-50 border-green-200" },
              { label: "Due Date (Week 40)", value: fmt(result.dueDate), icon: "👶", color: "bg-violet-50 border-violet-200" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl border p-3", item.color)}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <p className="text-[11px] font-medium text-text-muted">{item.label}</p>
                </div>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Milestone timeline */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-medium text-text-primary">Pregnancy Milestones</p>
            </div>
            <div className="divide-y divide-border/60">
              {MILESTONES.map((ms) => {
                const msDate = addDays(result.gestStart, ms.week * 7);
                const isPast = daysBetween(today, msDate) < 0;
                const isCurrent = result.currentWeek === ms.week;
                const triColor = ms.week < 13 ? "bg-pink-100 text-pink-700" : ms.week < 27 ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700";
                return (
                  <div key={ms.week + ms.label}
                    className={cn("flex items-center gap-3 px-4 py-2.5 text-sm", isPast && "opacity-50", isCurrent && "bg-pink-50 font-semibold")}>
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                      isPast ? "bg-green-100 text-green-600" : isCurrent ? "bg-pink-200 text-pink-700" : "bg-surface-muted text-text-muted")}>
                      {isPast ? "✓" : ms.week}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{ms.label}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] shrink-0 hidden sm:inline", triColor)}>
                      {ms.week < 13 ? "1st" : ms.week < 27 ? "2nd" : "3rd"}
                    </span>
                    <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                      {msDate.toLocaleDateString(dateFmt === "uk" ? "en-GB" : "en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-pink-50 border border-pink-200 p-4 text-sm text-pink-800">
            This calculator provides an estimate only. Only about 5% of babies arrive on their exact due date. Most births occur within 2 weeks before or after. Always consult your healthcare provider.
          </div>
        </>
      )}
    </div>
  );
}

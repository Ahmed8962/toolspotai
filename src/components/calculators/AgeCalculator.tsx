"use client";

import {
  daysUntilNextBirthday,
  diffYMD,
  nextBirthday,
  parseISODate,
  totalDaysBetween,
} from "@/lib/age";
import { useEffect, useMemo, useState } from "react";

function todayISO() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [asOf, setAsOf] = useState(todayISO);
  const [secondsAlive, setSecondsAlive] = useState(0);

  useEffect(() => {
    if (!dob) return;
    const birth = parseISODate(dob);
    const tick = () =>
      setSecondsAlive(Math.max(0, Math.floor((Date.now() - birth.getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dob]);

  const stats = useMemo(() => {
    if (!dob) return null;
    const birth = parseISODate(dob);
    const target = parseISODate(asOf);
    if (Number.isNaN(birth.getTime()) || birth > target) return null;

    const ymd = diffYMD(birth, target);
    const totalDays = totalDaysBetween(birth, target);
    const totalWeeks = Math.floor(totalDays / 7);
    const endOfAsOf = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      23,
      59,
      59,
      999,
    );
    const startOfBirth = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
    const totalHours = Math.floor((endOfAsOf.getTime() - startOfBirth.getTime()) / 3600000);
    const nb = nextBirthday(birth, target);
    const until = daysUntilNextBirthday(birth, target);
    const bornDow = days[birth.getDay()];
    const nextDow = days[nb.getDay()];

    return { ymd, totalDays, totalWeeks, totalHours, until, bornDow, nextDow, birth, target };
  }, [dob, asOf]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-text-secondary">
          Date of birth
          <input
            type="date"
            value={dob}
            max={asOf}
            onChange={(e) => setDob(e.target.value)}
            className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
        <label className="block text-sm text-text-secondary">
          Age as of
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className="mt-1 h-12 w-full rounded-xl border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
      </div>

      {stats && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              [stats.ymd.years, "Years"],
              [stats.ymd.months, "Months"],
              [stats.ymd.days, "Days"],
            ].map(([n, l]) => (
              <div
                key={l}
                className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-center"
              >
                <p className="font-result text-4xl font-semibold text-brand-700">{n}</p>
                <p className="mt-1 text-xs font-medium uppercase text-text-muted">{l}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Total days", stats.totalDays],
              ["Total weeks", stats.totalWeeks],
              ["Total hours", stats.totalHours],
            ].map(([label, val]) => (
              <div key={label} className="rounded-xl bg-surface-muted p-3 text-center">
                <p className="font-result text-xl font-semibold text-text-primary">{val}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            ))}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center sm:col-span-3">
              <p className="text-xs text-emerald-800">Next birthday in</p>
              <p className="font-result text-2xl font-semibold text-emerald-900">
                {stats.until} days ({stats.nextDow})
              </p>
            </div>
          </div>

          <p className="text-sm text-text-secondary">
            Born on a <strong>{stats.bornDow}</strong>
          </p>

          <p className="font-result text-lg text-text-primary">
            Alive for{" "}
            {(dob ? secondsAlive : 0).toLocaleString("en-US")} seconds
          </p>
        </div>
      )}
    </div>
  );
}

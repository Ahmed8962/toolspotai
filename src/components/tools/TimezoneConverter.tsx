"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TZDef = { id: string; label: string; flag: string; offset: string };

const ZONES: TZDef[] = [
  { id: "America/New_York", label: "New York (EST/EDT)", flag: "🇺🇸", offset: "" },
  { id: "America/Chicago", label: "Chicago (CST/CDT)", flag: "🇺🇸", offset: "" },
  { id: "America/Denver", label: "Denver (MST/MDT)", flag: "🇺🇸", offset: "" },
  { id: "America/Los_Angeles", label: "Los Angeles (PST/PDT)", flag: "🇺🇸", offset: "" },
  { id: "America/Toronto", label: "Toronto", flag: "🇨🇦", offset: "" },
  { id: "America/Vancouver", label: "Vancouver", flag: "🇨🇦", offset: "" },
  { id: "America/Mexico_City", label: "Mexico City", flag: "🇲🇽", offset: "" },
  { id: "America/Sao_Paulo", label: "São Paulo", flag: "🇧🇷", offset: "" },
  { id: "America/Argentina/Buenos_Aires", label: "Buenos Aires", flag: "🇦🇷", offset: "" },
  { id: "Europe/London", label: "London (GMT/BST)", flag: "🇬🇧", offset: "" },
  { id: "Europe/Paris", label: "Paris (CET/CEST)", flag: "🇫🇷", offset: "" },
  { id: "Europe/Berlin", label: "Berlin", flag: "🇩🇪", offset: "" },
  { id: "Europe/Amsterdam", label: "Amsterdam", flag: "🇳🇱", offset: "" },
  { id: "Europe/Madrid", label: "Madrid", flag: "🇪🇸", offset: "" },
  { id: "Europe/Rome", label: "Rome", flag: "🇮🇹", offset: "" },
  { id: "Europe/Moscow", label: "Moscow", flag: "🇷🇺", offset: "" },
  { id: "Europe/Istanbul", label: "Istanbul", flag: "🇹🇷", offset: "" },
  { id: "Asia/Dubai", label: "Dubai", flag: "🇦🇪", offset: "" },
  { id: "Asia/Kolkata", label: "Mumbai / Delhi (IST)", flag: "🇮🇳", offset: "" },
  { id: "Asia/Singapore", label: "Singapore", flag: "🇸🇬", offset: "" },
  { id: "Asia/Hong_Kong", label: "Hong Kong", flag: "🇭🇰", offset: "" },
  { id: "Asia/Shanghai", label: "Shanghai / Beijing", flag: "🇨🇳", offset: "" },
  { id: "Asia/Tokyo", label: "Tokyo", flag: "🇯🇵", offset: "" },
  { id: "Asia/Seoul", label: "Seoul", flag: "🇰🇷", offset: "" },
  { id: "Australia/Sydney", label: "Sydney (AEST/AEDT)", flag: "🇦🇺", offset: "" },
  { id: "Australia/Melbourne", label: "Melbourne", flag: "🇦🇺", offset: "" },
  { id: "Pacific/Auckland", label: "Auckland", flag: "🇳🇿", offset: "" },
  { id: "Pacific/Honolulu", label: "Honolulu", flag: "🇺🇸", offset: "" },
  { id: "UTC", label: "UTC", flag: "🌐", offset: "" },
];

function formatInTZ(date: Date, tz: string, fmt: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...fmt, timeZone: tz }).format(date);
}

function getOffsetLabel(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  return tzPart?.value ?? "";
}

export default function TimezoneConverter() {
  const [fromZone, setFromZone] = useState("America/New_York");
  const [toZones, setToZones] = useState(["Europe/London", "Asia/Tokyo", "Australia/Sydney"]);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [liveNow, setLiveNow] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (liveNow) {
      setDateStr(formatInTZ(now, fromZone, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2"));
      setTimeStr(formatInTZ(now, fromZone, { hour: "2-digit", minute: "2-digit", hour12: false }));
    }
  }, [liveNow, now, fromZone]);

  const sourceDate = useMemo(() => {
    if (!dateStr || !timeStr) return null;
    const dtStr = `${dateStr}T${timeStr}:00`;
    const offsetStr = getOffsetLabel(new Date(), fromZone);
    try {
      const localDate = new Date(dtStr);
      const inTZ = new Date(localDate.toLocaleString("en-US", { timeZone: fromZone }));
      const diff = localDate.getTime() - inTZ.getTime();
      return new Date(localDate.getTime() + diff);
    } catch {
      return new Date(dtStr);
    }
  }, [dateStr, timeStr, fromZone]);

  const addZone = useCallback((zId: string) => {
    if (!toZones.includes(zId) && zId !== fromZone) {
      setToZones((prev) => [...prev, zId]);
    }
  }, [toZones, fromZone]);

  const removeZone = useCallback((zId: string) => {
    setToZones((prev) => prev.filter((z) => z !== zId));
  }, []);

  const selectCls = "h-11 w-full rounded-lg border border-border bg-surface-card px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";
  const inputCls = "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-8">
      {/* Source */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Source Time</p>
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input type="checkbox" checked={liveNow} onChange={(e) => setLiveNow(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-brand-600" />
            Live (now)
          </label>
        </div>

        <select value={fromZone} onChange={(e) => setFromZone(e.target.value)} className={selectCls}>
          {ZONES.map((z) => (
            <option key={z.id} value={z.id}>{z.flag} {z.label}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={dateStr} onChange={(e) => { setDateStr(e.target.value); setLiveNow(false); }} className={inputCls} />
          <input type="time" value={timeStr} onChange={(e) => { setTimeStr(e.target.value); setLiveNow(false); }} className={inputCls} />
        </div>

        {sourceDate && (
          <div className="text-center py-2">
            <p className="font-result text-3xl font-bold text-text-primary">
              {formatInTZ(sourceDate, fromZone, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {formatInTZ(sourceDate, fromZone, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              {" · "}
              {getOffsetLabel(sourceDate, fromZone)}
            </p>
          </div>
        )}
      </div>

      {/* Target zones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Converted Times</p>
          <select
            value=""
            onChange={(e) => { if (e.target.value) addZone(e.target.value); e.target.value = ""; }}
            className="h-9 rounded-lg border border-border bg-white px-2 text-xs outline-none"
          >
            <option value="">+ Add zone</option>
            {ZONES.filter((z) => z.id !== fromZone && !toZones.includes(z.id)).map((z) => (
              <option key={z.id} value={z.id}>{z.flag} {z.label}</option>
            ))}
          </select>
        </div>

        {sourceDate && toZones.map((zId) => {
          const zone = ZONES.find((z) => z.id === zId);
          if (!zone) return null;
          const time = formatInTZ(sourceDate, zId, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
          const date = formatInTZ(sourceDate, zId, { weekday: "short", month: "short", day: "numeric" });
          const offset = getOffsetLabel(sourceDate, zId);

          const fromDay = formatInTZ(sourceDate, fromZone, { day: "numeric", month: "numeric" });
          const toDay = formatInTZ(sourceDate, zId, { day: "numeric", month: "numeric" });
          const dayDiff = fromDay !== toDay;

          return (
            <div key={zId} className={cn("flex items-center gap-4 rounded-xl border border-border bg-white p-4 transition hover:shadow-sm",
              dayDiff && "border-l-4 border-l-amber-400")}>
              <span className="text-2xl">{zone.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{zone.label}</p>
                <p className="text-xs text-text-muted">{offset}</p>
              </div>
              <div className="text-right">
                <p className="font-result text-xl font-bold text-text-primary">{time}</p>
                <p className="text-xs text-text-muted">{date}{dayDiff && " (next day)"}</p>
              </div>
              <button type="button" onClick={() => removeZone(zId)} className="text-text-muted hover:text-red-500 transition ml-1" title="Remove">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* World clocks — quick glance */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-surface-muted px-4 py-2.5">
          <p className="text-sm font-medium text-text-primary">World Clocks — Right Now</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-border/60">
          {ZONES.filter((z) => ["America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"].includes(z.id))
            .map((z) => (
              <div key={z.id} className="px-3 py-2.5 text-center">
                <p className="text-lg">{z.flag}</p>
                <p className="text-xs text-text-muted mt-0.5">{z.label.split(" (")[0]}</p>
                <p className="font-result text-sm font-semibold text-text-primary mt-0.5">
                  {formatInTZ(now, z.id, { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

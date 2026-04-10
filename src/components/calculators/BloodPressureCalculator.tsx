"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Mode = "check" | "track";

type BPCategory =
  | "normal"
  | "elevated"
  | "stage1"
  | "stage2"
  | "crisis";

type Reading = {
  id: number;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
};

const CATEGORY_META: Record<
  BPCategory,
  { label: string; color: string; bg: string; border: string; risk: string; recommendation: string }
> = {
  normal: {
    label: "Normal",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    risk: "Low risk — your blood pressure is in a healthy range.",
    recommendation:
      "Maintain a healthy lifestyle with regular exercise, a balanced diet low in sodium, and routine check-ups.",
  },
  elevated: {
    label: "Elevated",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    risk: "Moderate risk — likely to develop high blood pressure without lifestyle changes.",
    recommendation:
      "Reduce sodium intake, increase physical activity, manage stress, and monitor your BP regularly.",
  },
  stage1: {
    label: "High BP — Stage 1",
    color: "text-orange-700",
    bg: "bg-orange-100",
    border: "border-orange-300",
    risk: "Increased risk of heart disease and stroke.",
    recommendation:
      "Lifestyle changes are essential. Your doctor may prescribe medication depending on your overall cardiovascular risk.",
  },
  stage2: {
    label: "High BP — Stage 2",
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
    risk: "High risk — significantly increased chance of heart attack, stroke, and organ damage.",
    recommendation:
      "Seek medical attention. Medication is typically required along with significant lifestyle modifications.",
  },
  crisis: {
    label: "Hypertensive Crisis",
    color: "text-red-100",
    bg: "bg-red-700",
    border: "border-red-800",
    risk: "Dangerously high — may cause organ damage immediately.",
    recommendation:
      "Seek immediate emergency medical attention. Do not wait — call your local emergency number.",
  },
};

function classify(sys: number, dia: number): BPCategory {
  if (sys > 180 || dia > 120) return "crisis";
  if (sys >= 140 || dia >= 90) return "stage2";
  if (sys >= 130 || dia >= 80) return "stage1";
  if (sys >= 120 && dia < 80) return "elevated";
  return "normal";
}

function pulseLabel(bpm: number): { text: string; color: string } {
  if (bpm < 60) return { text: "Below normal (bradycardia)", color: "text-amber-600" };
  if (bpm <= 100) return { text: "Normal resting heart rate", color: "text-emerald-600" };
  return { text: "Above normal (tachycardia)", color: "text-amber-600" };
}

const GAUGE_SEGMENTS: { label: string; min: number; max: number; color: string }[] = [
  { label: "Normal", min: 0, max: 120, color: "bg-emerald-400" },
  { label: "Elevated", min: 120, max: 130, color: "bg-yellow-400" },
  { label: "Stage 1", min: 130, max: 140, color: "bg-orange-400" },
  { label: "Stage 2", min: 140, max: 180, color: "bg-red-400" },
  { label: "Crisis", min: 180, max: 250, color: "bg-red-700" },
];

function BPGauge({ systolic }: { systolic: number }) {
  const total = 250;
  const clamped = Math.max(60, Math.min(250, systolic));
  const pct = ((clamped - 60) / (total - 60)) * 100;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-text-secondary">Systolic Position on BP Spectrum</p>
      <div className="relative h-4 w-full overflow-hidden rounded-full">
        {GAUGE_SEGMENTS.map((seg) => {
          const left = ((seg.min - 60) / (total - 60)) * 100;
          const width = ((seg.max - seg.min) / (total - 60)) * 100;
          return (
            <div
              key={seg.label}
              className={cn("absolute top-0 h-full", seg.color)}
              style={{ left: `${Math.max(0, left)}%`, width: `${width}%` }}
            />
          );
        })}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-900 transition-all duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>60</span>
        <span>120</span>
        <span>130</span>
        <span>140</span>
        <span>180</span>
        <span>250</span>
      </div>
    </div>
  );
}

let nextId = 1;

const inputCls =
  "mt-1 h-11 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

export default function BloodPressureCalculator() {
  const [mode, setMode] = useState<Mode>("check");

  // Mode 1 state
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode 2 state
  const [readings, setReadings] = useState<Reading[]>([]);
  const [tSys, setTSys] = useState("");
  const [tDia, setTDia] = useState("");
  const [tPulse, setTPulse] = useState("");
  const [tDate, setTDate] = useState("");
  const [tTime, setTTime] = useState("");
  const [tError, setTError] = useState<string | null>(null);

  const sysN = parseFloat(systolic);
  const diaN = parseFloat(diastolic);
  const pulseN = pulse ? parseFloat(pulse) : null;

  const result = useMemo(() => {
    if (!showResult) return null;
    if (!Number.isFinite(sysN) || !Number.isFinite(diaN)) return null;
    const cat = classify(sysN, diaN);
    return { systolic: sysN, diastolic: diaN, pulse: pulseN, category: cat };
  }, [showResult, sysN, diaN, pulseN]);

  const averages = useMemo(() => {
    if (readings.length === 0) return null;
    const avgSys = readings.reduce((s, r) => s + r.systolic, 0) / readings.length;
    const avgDia = readings.reduce((s, r) => s + r.diastolic, 0) / readings.length;
    const pulsed = readings.filter((r) => r.pulse !== null);
    const avgPulse = pulsed.length > 0 ? pulsed.reduce((s, r) => s + r.pulse!, 0) / pulsed.length : null;
    return { avgSys, avgDia, avgPulse, category: classify(Math.round(avgSys), Math.round(avgDia)) };
  }, [readings]);

  function handleCheck() {
    setError(null);
    if (!Number.isFinite(sysN) || sysN < 60 || sysN > 250) {
      setError("Systolic must be between 60 and 250.");
      setShowResult(false);
      return;
    }
    if (!Number.isFinite(diaN) || diaN < 40 || diaN > 150) {
      setError("Diastolic must be between 40 and 150.");
      setShowResult(false);
      return;
    }
    if (pulse && (pulseN === null || !Number.isFinite(pulseN) || pulseN < 40 || pulseN > 200)) {
      setError("Pulse must be between 40 and 200 BPM.");
      setShowResult(false);
      return;
    }
    setShowResult(true);
  }

  function clearCheck() {
    setSystolic("");
    setDiastolic("");
    setPulse("");
    setShowResult(false);
    setError(null);
  }

  function addReading() {
    setTError(null);
    const s = parseFloat(tSys);
    const d = parseFloat(tDia);
    const p = tPulse ? parseFloat(tPulse) : null;
    if (!Number.isFinite(s) || s < 60 || s > 250) {
      setTError("Systolic must be between 60 and 250.");
      return;
    }
    if (!Number.isFinite(d) || d < 40 || d > 150) {
      setTError("Diastolic must be between 40 and 150.");
      return;
    }
    if (tPulse && (p === null || !Number.isFinite(p) || p < 40 || p > 200)) {
      setTError("Pulse must be between 40 and 200 BPM.");
      return;
    }
    setReadings((prev) => [
      ...prev,
      {
        id: nextId++,
        date: tDate || new Date().toLocaleDateString(),
        time: tTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        systolic: s,
        diastolic: d,
        pulse: p,
      },
    ]);
    setTSys("");
    setTDia("");
    setTPulse("");
    setTDate("");
    setTTime("");
  }

  const meta = (cat: BPCategory) => CATEGORY_META[cat];

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
        role="note"
      >
        <strong>Disclaimer:</strong> This tool is for educational purposes only. It is not a
        substitute for professional medical advice, diagnosis, or treatment.
      </div>

      {/* Mode tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-muted p-1">
        {(
          [
            ["Check Blood Pressure", "check"],
            ["Track & Average", "track"],
          ] as const
        ).map(([label, m]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition",
              mode === m
                ? "bg-surface-card text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ MODE 1: Check BP ═══ */}
      {mode === "check" && (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-text-secondary">
                Systolic (top number)
                <div className="relative mt-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={60}
                    max={250}
                    value={systolic}
                    onChange={(e) => {
                      setSystolic(e.target.value);
                      setShowResult(false);
                    }}
                    placeholder="120"
                    className={cn(inputCls, "pr-14")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    mmHg
                  </span>
                </div>
                <span className="mt-1 block text-xs text-text-muted">Range: 60–250</span>
              </label>

              <label className="block text-sm text-text-secondary">
                Diastolic (bottom number)
                <div className="relative mt-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={40}
                    max={150}
                    value={diastolic}
                    onChange={(e) => {
                      setDiastolic(e.target.value);
                      setShowResult(false);
                    }}
                    placeholder="80"
                    className={cn(inputCls, "pr-14")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    mmHg
                  </span>
                </div>
                <span className="mt-1 block text-xs text-text-muted">Range: 40–150</span>
              </label>
            </div>

            <label className="block text-sm text-text-secondary">
              Pulse Rate{" "}
              <span className="text-text-muted">(optional)</span>
              <div className="relative mt-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={40}
                  max={200}
                  value={pulse}
                  onChange={(e) => {
                    setPulse(e.target.value);
                    setShowResult(false);
                  }}
                  placeholder="72"
                  className={cn(inputCls, "max-w-xs pr-14")}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  BPM
                </span>
              </div>
              <span className="mt-1 block text-xs text-text-muted">Range: 40–200</span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCheck}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Check BP
              </button>
              <button
                type="button"
                onClick={clearCheck}
                className="rounded-lg border border-border bg-surface-muted px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="min-h-[200px] rounded-xl border border-border bg-surface-muted/50 p-4 lg:p-6">
            {!result ? (
              <p className="py-8 text-center text-sm text-text-muted">
                Enter your systolic and diastolic values, then press Check BP to see your classification.
              </p>
            ) : (
              <div className="space-y-4 animate-[fadeUp_0.35s_ease_both]">
                {result.category === "crisis" && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-semibold text-white">
                    <span className="text-lg">⚠</span>
                    Seek immediate medical attention — your reading indicates a hypertensive crisis.
                  </div>
                )}

                <div className="flex items-center justify-between rounded-t-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                  <span>Result</span>
                </div>

                <p className="text-lg font-semibold text-text-primary">
                  <span className="font-result text-2xl text-brand-700">
                    {result.systolic}/{result.diastolic}
                  </span>{" "}
                  mmHg
                </p>

                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                    meta(result.category).bg,
                    meta(result.category).color,
                    meta(result.category).border,
                    "border",
                  )}
                >
                  {meta(result.category).label}
                </span>

                <BPGauge systolic={result.systolic} />

                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>
                    <strong className="text-text-primary">Risk:</strong>{" "}
                    {meta(result.category).risk}
                  </li>
                  <li>
                    <strong className="text-text-primary">Recommendation:</strong>{" "}
                    {meta(result.category).recommendation}
                  </li>
                  {result.pulse !== null && Number.isFinite(result.pulse) && (
                    <li>
                      <strong className="text-text-primary">Pulse:</strong>{" "}
                      {result.pulse} BPM —{" "}
                      <span className={pulseLabel(result.pulse).color}>
                        {pulseLabel(result.pulse).text}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODE 2: Track & Average ═══ */}
      {mode === "track" && (
        <div className="space-y-6">
          {/* Add reading form */}
          <div className="rounded-xl border border-border bg-surface-muted/50 p-4 lg:p-6">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Add a Reading</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm text-text-secondary">
                Date
                <input
                  type="date"
                  value={tDate}
                  onChange={(e) => setTDate(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Time
                <input
                  type="time"
                  value={tTime}
                  onChange={(e) => setTTime(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Systolic
                <input
                  type="number"
                  inputMode="numeric"
                  min={60}
                  max={250}
                  value={tSys}
                  onChange={(e) => setTSys(e.target.value)}
                  placeholder="120"
                  className={inputCls}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Diastolic
                <input
                  type="number"
                  inputMode="numeric"
                  min={40}
                  max={150}
                  value={tDia}
                  onChange={(e) => setTDia(e.target.value)}
                  placeholder="80"
                  className={inputCls}
                />
              </label>
              <label className="block text-sm text-text-secondary">
                Pulse <span className="text-text-muted">(optional)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={40}
                  max={200}
                  value={tPulse}
                  onChange={(e) => setTPulse(e.target.value)}
                  placeholder="72"
                  className={inputCls}
                />
              </label>
            </div>

            {tError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {tError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addReading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Add Reading
              </button>
              {readings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReadings([])}
                  className="rounded-lg border border-border bg-surface-muted px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-slate-200"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Averages */}
          {averages && (
            <div className="rounded-xl border border-border bg-surface-muted/50 p-4 lg:p-6 animate-[fadeUp_0.35s_ease_both]">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">
                Averages ({readings.length} reading{readings.length !== 1 && "s"})
              </h3>

              {averages.category === "crisis" && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-sm font-semibold text-white">
                  <span className="text-lg">⚠</span>
                  Your average reading indicates a hypertensive crisis — seek immediate medical attention.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface-card p-3 text-center">
                  <p className="text-xs text-text-muted">Avg Systolic</p>
                  <p className="font-result text-xl text-brand-700">{Math.round(averages.avgSys)}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-card p-3 text-center">
                  <p className="text-xs text-text-muted">Avg Diastolic</p>
                  <p className="font-result text-xl text-brand-700">{Math.round(averages.avgDia)}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-card p-3 text-center">
                  <p className="text-xs text-text-muted">Avg Pulse</p>
                  <p className="font-result text-xl text-brand-700">
                    {averages.avgPulse !== null ? Math.round(averages.avgPulse) : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-text-secondary">Average Classification:</span>
                <span
                  className={cn(
                    "inline-block rounded-full border px-3 py-0.5 text-xs font-semibold",
                    meta(averages.category).bg,
                    meta(averages.category).color,
                    meta(averages.category).border,
                  )}
                >
                  {meta(averages.category).label}
                </span>
              </div>

              <BPGauge systolic={Math.round(averages.avgSys)} />
            </div>
          )}

          {/* Readings table */}
          {readings.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted text-left text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">SYS</th>
                    <th className="px-3 py-2 font-medium">DIA</th>
                    <th className="px-3 py-2 font-medium">Pulse</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r, i) => {
                    const cat = classify(r.systolic, r.diastolic);
                    return (
                      <tr key={r.id} className="border-t border-border hover:bg-surface-muted/50">
                        <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2">{r.time}</td>
                        <td className="px-3 py-2 font-medium">{r.systolic}</td>
                        <td className="px-3 py-2 font-medium">{r.diastolic}</td>
                        <td className="px-3 py-2">{r.pulse ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "inline-block rounded-full border px-2 py-0.5 text-xs font-semibold",
                              meta(cat).bg,
                              meta(cat).color,
                              meta(cat).border,
                            )}
                          >
                            {meta(cat).label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setReadings((prev) => prev.filter((x) => x.id !== r.id))}
                            className="text-xs text-red-500 hover:text-red-700"
                            aria-label="Remove reading"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {readings.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">
              No readings yet. Add your first blood pressure reading above.
            </p>
          )}
        </div>
      )}

      {/* ═══ AHA Reference Chart ═══ */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          AHA Blood Pressure Categories (2024)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-text-secondary">
              <tr>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Systolic (mmHg)</th>
                <th className="px-3 py-2 font-medium" />
                <th className="px-3 py-2 font-medium">Diastolic (mmHg)</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {(
                [
                  ["Normal", "Less than 120", "and", "Less than 80", "normal"],
                  ["Elevated", "120 – 129", "and", "Less than 80", "elevated"],
                  ["High BP Stage 1", "130 – 139", "or", "80 – 89", "stage1"],
                  ["High BP Stage 2", "140 or higher", "or", "90 or higher", "stage2"],
                  ["Hypertensive Crisis", "Higher than 180", "and/or", "Higher than 120", "crisis"],
                ] as const
              ).map(([label, sys, conj, dia, cat]) => (
                <tr key={label} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 text-xs font-semibold",
                        CATEGORY_META[cat].bg,
                        CATEGORY_META[cat].color,
                        CATEGORY_META[cat].border,
                      )}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">{sys}</td>
                  <td className="px-3 py-2 text-text-muted">{conj}</td>
                  <td className="px-3 py-2 font-medium">{dia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-text-secondary">
        Blood pressure is recorded as two numbers — <strong>systolic</strong> (pressure when the heart
        beats) over <strong>diastolic</strong> (pressure when the heart rests between beats). A normal
        reading is below 120/80 mmHg. This calculator classifies your reading based on the{" "}
        <strong className="font-medium text-text-primary">
          American Heart Association 2024 guidelines
        </strong>
        . Regular monitoring, a low-sodium diet, exercise, and stress management are key to maintaining
        healthy blood pressure. Always consult a healthcare professional for personalized advice.
      </p>
    </div>
  );
}

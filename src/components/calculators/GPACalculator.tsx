"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type GradeScale = "us4" | "us4plus" | "uk";

const SCALES: { value: GradeScale; label: string }[] = [
  { value: "us4", label: "US 4.0 Scale" },
  { value: "us4plus", label: "US 4.0 Scale (+/-)" },
  { value: "uk", label: "UK Percentage" },
];

const US4_GRADES: { label: string; value: number }[] = [
  { label: "A", value: 4.0 },
  { label: "B", value: 3.0 },
  { label: "C", value: 2.0 },
  { label: "D", value: 1.0 },
  { label: "F", value: 0.0 },
];

const US4PLUS_GRADES: { label: string; value: number }[] = [
  { label: "A+", value: 4.0 },
  { label: "A", value: 4.0 },
  { label: "A-", value: 3.7 },
  { label: "B+", value: 3.3 },
  { label: "B", value: 3.0 },
  { label: "B-", value: 2.7 },
  { label: "C+", value: 2.3 },
  { label: "C", value: 2.0 },
  { label: "C-", value: 1.7 },
  { label: "D+", value: 1.3 },
  { label: "D", value: 1.0 },
  { label: "D-", value: 0.7 },
  { label: "F", value: 0.0 },
];

type CourseRow = {
  id: number;
  name: string;
  credits: string;
  grade: string; // grade label for US, percentage for UK
};

let nextId = 6;

const DEFAULT_COURSES: CourseRow[] = [
  { id: 1, name: "Mathematics", credits: "4", grade: "A" },
  { id: 2, name: "English", credits: "3", grade: "B+" },
  { id: 3, name: "Physics", credits: "4", grade: "A-" },
  { id: 4, name: "History", credits: "3", grade: "B" },
  { id: 5, name: "Computer Science", credits: "3", grade: "A" },
];

function getGradePoints(grade: string, scale: GradeScale): number | null {
  if (scale === "uk") {
    const pct = parseFloat(grade);
    if (isNaN(pct) || pct < 0 || pct > 100) return null;
    // UK percentage to GPA-equivalent (common conversion)
    if (pct >= 70) return 4.0;
    if (pct >= 60) return 3.0 + ((pct - 60) / 10);
    if (pct >= 50) return 2.0 + ((pct - 50) / 10);
    if (pct >= 40) return 1.0 + ((pct - 40) / 10);
    return 0.0;
  }

  const grades = scale === "us4plus" ? US4PLUS_GRADES : US4_GRADES;
  const found = grades.find((g) => g.label === grade);
  return found ? found.value : null;
}

function getClassification(gpa: number): { label: string; color: string } {
  if (gpa >= 3.9) return { label: "Summa Cum Laude", color: "text-emerald-700" };
  if (gpa >= 3.7) return { label: "Magna Cum Laude", color: "text-emerald-600" };
  if (gpa >= 3.5) return { label: "Cum Laude", color: "text-blue-600" };
  if (gpa >= 3.0) return { label: "Dean's List", color: "text-brand-700" };
  if (gpa >= 2.0) return { label: "Satisfactory", color: "text-text-secondary" };
  return { label: "Academic Probation", color: "text-red-600" };
}

export default function GPACalculator() {
  const [scale, setScale] = useState<GradeScale>("us4plus");
  const [courses, setCourses] = useState<CourseRow[]>(DEFAULT_COURSES);
  const [prevGpa, setPrevGpa] = useState("");
  const [prevCredits, setPrevCredits] = useState("");

  const gradeOptions = scale === "us4plus" ? US4PLUS_GRADES : scale === "us4" ? US4_GRADES : [];

  const updateCourse = (id: number, field: keyof CourseRow, value: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const addCourse = () => {
    if (courses.length >= 20) return;
    setCourses((prev) => [
      ...prev,
      { id: nextId++, name: "", credits: "3", grade: scale === "uk" ? "70" : "B" },
    ]);
  };

  const removeCourse = (id: number) => {
    if (courses.length <= 1) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const result = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    const courseResults: { name: string; credits: number; gp: number; quality: number }[] = [];

    for (const c of courses) {
      const cr = parseFloat(c.credits);
      const gp = getGradePoints(c.grade, scale);
      if (isNaN(cr) || cr <= 0 || gp === null) continue;
      const quality = cr * gp;
      totalPoints += quality;
      totalCredits += cr;
      courseResults.push({ name: c.name || "Untitled", credits: cr, gp, quality });
    }

    if (totalCredits === 0) return null;

    const semesterGpa = totalPoints / totalCredits;

    // Cumulative GPA with previous
    const pGpa = parseFloat(prevGpa);
    const pCr = parseFloat(prevCredits);
    let cumulativeGpa = semesterGpa;
    let cumulativeCredits = totalCredits;

    if (!isNaN(pGpa) && !isNaN(pCr) && pCr > 0) {
      const prevPoints = pGpa * pCr;
      cumulativeGpa = (totalPoints + prevPoints) / (totalCredits + pCr);
      cumulativeCredits = totalCredits + pCr;
    }

    const classification = getClassification(semesterGpa);

    return {
      semesterGpa,
      cumulativeGpa,
      totalCredits,
      cumulativeCredits,
      totalPoints,
      courseResults,
      classification,
      hasPrev: !isNaN(pGpa) && !isNaN(pCr) && pCr > 0,
    };
  }, [courses, scale, prevGpa, prevCredits]);

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-surface-card px-2.5 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Scale selector */}
      <div className="flex flex-wrap gap-2">
        {SCALES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setScale(s.value);
              if (s.value === "uk") {
                setCourses((prev) =>
                  prev.map((c) => ({ ...c, grade: "70" })),
                );
              } else {
                const grades = s.value === "us4plus" ? US4PLUS_GRADES : US4_GRADES;
                setCourses((prev) =>
                  prev.map((c) => ({
                    ...c,
                    grade: grades.find((g) => g.label === c.grade) ? c.grade : "B",
                  })),
                );
              }
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              scale === s.value
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Courses table */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">Your courses</p>
        <p className="mt-1 text-xs text-text-muted">
          Enter course name, credit hours, and grade. Add up to 20 courses.
        </p>

        <div className="mt-4 space-y-3">
          <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1.5fr_auto] gap-2 text-xs font-medium text-text-muted px-1">
            <span>Course</span>
            <span>Credits</span>
            <span>Grade</span>
            <span className="w-8" />
          </div>

          {courses.map((c, idx) => (
            <div
              key={c.id}
              className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-2 items-center"
            >
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCourse(c.id, "name", e.target.value)}
                className={inputCls}
                placeholder={`Course ${idx + 1}`}
              />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={c.credits}
                onChange={(e) => updateCourse(c.id, "credits", e.target.value)}
                className={inputCls}
                placeholder="3"
              />
              {scale === "uk" ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={c.grade}
                    onChange={(e) => updateCourse(c.id, "grade", e.target.value)}
                    className={inputCls}
                    placeholder="70"
                  />
                  <span className="text-xs text-text-muted">%</span>
                </div>
              ) : (
                <select
                  value={c.grade}
                  onChange={(e) => updateCourse(c.id, "grade", e.target.value)}
                  className={inputCls}
                >
                  {gradeOptions.map((g) => (
                    <option key={g.label} value={g.label}>
                      {g.label} ({g.value.toFixed(1)})
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => removeCourse(c.id)}
                disabled={courses.length <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCourse}
          disabled={courses.length >= 20}
          className="mt-3 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-40"
        >
          + Add course
        </button>
      </div>

      {/* Previous GPA (optional) */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary">
          Previous GPA (optional)
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Enter your prior cumulative GPA and credit hours to calculate an updated cumulative GPA.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-text-secondary">
            Previous cumulative GPA
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={4}
              step={0.01}
              value={prevGpa}
              onChange={(e) => setPrevGpa(e.target.value)}
              className={cn(inputCls, "mt-1 h-11")}
              placeholder="e.g. 3.50"
            />
          </label>
          <label className="block text-sm text-text-secondary">
            Previous total credits
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={prevCredits}
              onChange={(e) => setPrevCredits(e.target.value)}
              className={cn(inputCls, "mt-1 h-11")}
              placeholder="e.g. 60"
            />
          </label>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase text-text-muted">
              Semester GPA
            </p>
            <p className="font-result text-4xl font-semibold text-brand-700">
              {result.semesterGpa.toFixed(2)}
            </p>
            <p className={cn("mt-1 text-sm font-medium", result.classification.color)}>
              {result.classification.label}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Semester GPA</p>
              <p className="font-result mt-0.5 text-lg font-semibold text-brand-700">
                {result.semesterGpa.toFixed(2)}
              </p>
            </div>
            {result.hasPrev && (
              <div className="rounded-xl bg-surface-muted p-4 text-center">
                <p className="text-xs text-text-muted">Cumulative GPA</p>
                <p className="font-result mt-0.5 text-lg font-semibold text-emerald-700">
                  {result.cumulativeGpa.toFixed(2)}
                </p>
              </div>
            )}
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Total credits</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {result.hasPrev ? result.cumulativeCredits : result.totalCredits}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted p-4 text-center">
              <p className="text-xs text-text-muted">Quality points</p>
              <p className="font-result mt-0.5 text-lg font-semibold">
                {result.totalPoints.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Course breakdown */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2">Course</th>
                  <th className="p-2 text-center">Credits</th>
                  <th className="p-2 text-center">Grade points</th>
                  <th className="p-2 text-center">Quality points</th>
                </tr>
              </thead>
              <tbody>
                {result.courseResults.map((c, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-surface-muted/60" : ""}>
                    <td className="p-2">{c.name}</td>
                    <td className="p-2 text-center font-result">{c.credits}</td>
                    <td className="p-2 text-center font-result">{c.gp.toFixed(1)}</td>
                    <td className="p-2 text-center font-result">{c.quality.toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-medium">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-center font-result">{result.totalCredits}</td>
                  <td className="p-2 text-center" />
                  <td className="p-2 text-center font-result">{result.totalPoints.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            GPA = Total Quality Points &divide; Total Credit Hours. Quality
            Points = Credit Hours &times; Grade Points. Uses the standard US 4.0
            scale. UK percentages are converted using common university mapping.
            Check your institution for their specific grading policy.
          </p>
        </div>
      )}
    </div>
  );
}

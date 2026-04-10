"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TEXTS = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
  "Technology is best when it brings people together. Innovation distinguishes between a leader and a follower. The advance of technology is based on making it fit in so that you don't really even notice it.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. The only way to do great work is to love what you do. Stay hungry, stay foolish.",
  "In the middle of difficulty lies opportunity. Life is what happens when you're busy making other plans. The best time to plant a tree was twenty years ago. The second best time is now.",
  "Programming is the art of algorithm design and the craft of debugging errant code. Good code is its own best documentation. First, solve the problem. Then, write the code.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. It is during our darkest moments that we must focus to see the light ahead of us.",
];

type TestState = "idle" | "running" | "finished";

export default function TypingSpeedTest() {
  const [testState, setTestState] = useState<TestState>("idle");
  const [duration, setDuration] = useState(60);
  const [textIdx, setTextIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [errors, setErrors] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [history, setHistory] = useState<{ wpm: number; accuracy: number; duration: number }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const currentText = TEXTS[textIdx % TEXTS.length];

  const startTest = useCallback(() => {
    setTestState("running");
    setTyped("");
    setErrors(0);
    setTotalKeystrokes(0);
    setTimeLeft(duration);
    setStartTime(Date.now());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [duration]);

  const finishTest = useCallback(() => {
    setTestState("finished");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (testState !== "running") return;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) finishTest();
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [testState, startTime, duration, finishTest]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (testState !== "running") return;
    const val = e.target.value;
    setTyped(val);
    setTotalKeystrokes((k) => k + 1);

    let errs = 0;
    for (let i = 0; i < val.length; i++) {
      if (i >= currentText.length || val[i] !== currentText[i]) errs++;
    }
    setErrors(errs);

    if (val.length >= currentText.length) {
      finishTest();
    }
  }, [testState, currentText, finishTest]);

  const stats = useMemo(() => {
    if (testState === "idle") return null;
    const elapsed = testState === "finished"
      ? Math.min(duration, (Date.now() - startTime) / 1000)
      : (Date.now() - startTime) / 1000;
    if (elapsed <= 0) return null;

    const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;
    const minutes = elapsed / 60;
    const wpm = Math.round(wordsTyped / minutes);
    const cpm = Math.round(typed.length / minutes);

    let correctChars = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === currentText[i]) correctChars++;
    }
    const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;

    const netWpm = Math.max(0, Math.round(((typed.length / 5) - errors) / minutes));

    return { wpm, netWpm, cpm, accuracy, correctChars, elapsed: Math.round(elapsed) };
  }, [testState, typed, currentText, errors, startTime, duration]);

  useEffect(() => {
    if (testState === "finished" && stats) {
      setHistory((h) => [{ wpm: stats.netWpm, accuracy: stats.accuracy, duration }, ...h].slice(0, 10));
    }
    // Only on finish
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState]);

  const reset = () => {
    setTestState("idle");
    setTyped("");
    setErrors(0);
    setTotalKeystrokes(0);
    setTextIdx((i) => i + 1);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const renderText = () => {
    return currentText.split("").map((char, i) => {
      let cls = "text-text-muted";
      if (i < typed.length) {
        cls = typed[i] === char ? "text-green-600 bg-green-50" : "text-red-600 bg-red-100 underline";
      } else if (i === typed.length) {
        cls = "bg-brand-100 text-text-primary border-l-2 border-brand-500 animate-pulse";
      }
      return (
        <span key={i} className={cls}>
          {char}
        </span>
      );
    });
  };

  const speedLabel = (wpm: number) => {
    if (wpm >= 80) return { label: "Professional", color: "text-green-600" };
    if (wpm >= 60) return { label: "Fast", color: "text-emerald-600" };
    if (wpm >= 40) return { label: "Average", color: "text-blue-600" };
    if (wpm >= 25) return { label: "Below Average", color: "text-amber-600" };
    return { label: "Beginner", color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      {testState === "idle" && (
        <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted">Test Duration</label>
            <div className="flex gap-2 mt-2">
              {[30, 60, 120, 180].map((d) => (
                <button key={d} type="button" onClick={() => { setDuration(d); setTimeLeft(d); }}
                  className={cn("rounded-lg px-4 py-2 text-sm font-medium border transition",
                    duration === d ? "bg-brand-600 text-white border-brand-600" : "bg-white border-border hover:bg-brand-50")}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={startTest}
            className="w-full rounded-xl bg-brand-600 py-3 text-white font-semibold transition hover:bg-brand-700">
            Start Typing Test
          </button>
        </div>
      )}

      {/* Timer bar */}
      {testState === "running" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-text-primary">Time Remaining</span>
            <span className={cn("font-result font-bold", timeLeft < 10 ? "text-red-600" : "text-text-primary")}>
              {Math.ceil(timeLeft)}s
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", timeLeft < 10 ? "bg-red-500" : "bg-brand-500")}
              style={{ width: `${(timeLeft / duration) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Text display */}
      {testState !== "idle" && (
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="text-lg leading-relaxed font-mono tracking-wide select-none" style={{ wordBreak: "break-all" }}>
            {renderText()}
          </div>
        </div>
      )}

      {/* Typing input */}
      {testState === "running" && (
        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleInput}
          className="h-28 w-full rounded-xl border border-brand-200 bg-white p-4 text-base outline-none focus:ring-2 focus:ring-brand-500/30 resize-none font-mono"
          placeholder="Start typing here..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      )}

      {/* Live stats */}
      {testState === "running" && stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
            <p className="text-xs text-text-muted">WPM</p>
            <p className="font-result text-2xl font-bold text-text-primary">{stats.netWpm}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
            <p className="text-xs text-text-muted">Accuracy</p>
            <p className="font-result text-2xl font-bold text-text-primary">{stats.accuracy}%</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
            <p className="text-xs text-text-muted">Errors</p>
            <p className="font-result text-2xl font-bold text-red-600">{errors}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {testState === "finished" && stats && (
        <>
          <div className="rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 p-6 text-white text-center">
            <p className="text-sm font-medium opacity-80">Your Typing Speed</p>
            <p className="mt-1 text-5xl font-bold">{stats.netWpm} WPM</p>
            <p className={cn("mt-2 text-sm font-medium", speedLabel(stats.netWpm).color.replace("text-", "text-white/"))}>
              {speedLabel(stats.netWpm).label}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Gross WPM", value: String(stats.wpm) },
              { label: "Net WPM", value: String(stats.netWpm) },
              { label: "Accuracy", value: `${stats.accuracy}%` },
              { label: "CPM", value: String(stats.cpm) },
              { label: "Characters", value: `${stats.correctChars}/${typed.length}` },
              { label: "Errors", value: String(errors) },
              { label: "Keystrokes", value: String(totalKeystrokes) },
              { label: "Time", value: `${stats.elapsed}s` },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="font-result text-lg font-bold text-text-primary mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={reset}
              className="flex-1 rounded-xl bg-brand-600 py-3 text-white font-semibold transition hover:bg-brand-700">
              Try Again
            </button>
            <button type="button" onClick={() => { reset(); setTextIdx((i) => i + 2); }}
              className="flex-1 rounded-xl border border-border bg-white py-3 font-semibold text-text-primary transition hover:bg-slate-50">
              New Text
            </button>
          </div>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="bg-surface-muted px-4 py-2.5">
            <p className="text-sm font-medium text-text-primary">Your History</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/60">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">WPM</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className={cn(i % 2 === 1 && "bg-surface-muted/40")}>
                  <td className="p-2 text-text-muted">{history.length - i}</td>
                  <td className="p-2 font-result font-semibold">{h.wpm}</td>
                  <td className="p-2 font-result">{h.accuracy}%</td>
                  <td className="p-2 text-text-muted">{h.duration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Speed reference */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-2">Typing Speed Reference</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { range: "0–25", label: "Beginner", color: "bg-red-100 text-red-700" },
            { range: "25–40", label: "Below Avg", color: "bg-amber-100 text-amber-700" },
            { range: "40–60", label: "Average", color: "bg-blue-100 text-blue-700" },
            { range: "60–80", label: "Fast", color: "bg-emerald-100 text-emerald-700" },
            { range: "80+", label: "Pro", color: "bg-green-100 text-green-700" },
          ].map((r) => (
            <div key={r.range} className={cn("rounded-lg px-2 py-1.5 text-center font-medium", r.color)}>
              {r.range} WPM — {r.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

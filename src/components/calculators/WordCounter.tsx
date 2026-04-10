"use client";

import { useMemo, useState } from "react";

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "and",
  "or",
  "but",
  "it",
  "this",
  "that",
]);

const LIMITS = [
  { label: "Twitter/X", limit: 280 },
  { label: "LinkedIn post", limit: 3000 },
  { label: "Meta description", limit: 160 },
  { label: "Page title", limit: 60 },
] as const;

function analyze(text: string) {
  const trimmed = text.trim();
  const words = trimmed
    ? trimmed.split(/\s+/).filter((w) => w.length > 0)
    : [];
  const chars = text.length;
  const noSpace = text.replace(/\s/g, "").length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  const reading = Math.max(1, Math.ceil(words.length / 200));
  const speaking = Math.max(1, Math.ceil(words.length / 130));
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z0-9'-]/gi, ""))).size;

  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^a-z0-9'-]/gi, "");
    if (!k || STOP.has(k)) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    words: words.length,
    chars,
    noSpace,
    sentences: sentences || 0,
    paragraphs: paragraphs || (text.length ? 1 : 0),
    reading,
    speaking,
    unique,
    top,
  };
}

export default function WordCounter() {
  const [text, setText] = useState("");

  const a = useMemo(() => analyze(text), [text]);

  const sample =
    "The quick brown fox jumps over the lazy dog. It was a sunny afternoon.";

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-surface-muted"
          onClick={() => setText("")}
        >
          Clear
        </button>
        <button
          type="button"
          className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-surface-muted"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
          }}
        >
          Copy
        </button>
        <button
          type="button"
          className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-surface-muted"
          onClick={() => setText(sample)}
        >
          Sample
        </button>
      </div>

      <textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste your text here..."
        className="w-full resize-y rounded-xl border border-border bg-surface-card p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-brand-500/30"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Words", a.words],
          ["Characters", a.chars],
          ["No spaces", a.noSpace],
          ["Sentences", a.sentences],
          ["Paragraphs", a.paragraphs],
          ["Reading (min)", a.reading],
          ["Speaking (min)", a.speaking],
          ["Unique words", a.unique],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl bg-surface-muted p-4 text-center">
            <p className="font-result text-2xl font-semibold text-text-primary">{val}</p>
            <p className="text-xs uppercase text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">Character limits</p>
        <div className="space-y-3">
          {LIMITS.map((p) => {
            const ratio = Math.min(1, text.length / p.limit);
            const over = text.length > p.limit;
            const warn = !over && ratio >= 0.8;
            return (
              <div key={p.label}>
                <div className="mb-1 flex justify-between text-xs text-text-muted">
                  <span>{p.label}</span>
                  <span>
                    {text.length}/{p.limit}{" "}
                    {over ? (
                      <span className="text-red-600">Over</span>
                    ) : (
                      <span className="text-emerald-600">OK</span>
                    )}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${over ? "bg-red-500" : warn ? "bg-amber-400" : "bg-brand-500"}`}
                    style={{ width: `${Math.min(100, ratio * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {a.words > 50 && a.top.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Top keywords</p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="p-2 text-left">Word</th>
                  <th className="p-2 text-right">Count</th>
                  <th className="p-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {a.top.map(([w, c]) => (
                  <tr key={w} className="border-t border-border">
                    <td className="p-2">{w}</td>
                    <td className="p-2 text-right font-result">{c}</td>
                    <td className="p-2 text-right font-result">
                      {((c / a.words) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

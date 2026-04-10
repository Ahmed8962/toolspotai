"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CaseType =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "toggle"
  | "alternating";

const CASES: { value: CaseType; label: string; example: string }[] = [
  { value: "upper", label: "UPPER CASE", example: "HELLO WORLD" },
  { value: "lower", label: "lower case", example: "hello world" },
  { value: "title", label: "Title Case", example: "Hello World" },
  { value: "sentence", label: "Sentence case", example: "Hello world" },
  { value: "camel", label: "camelCase", example: "helloWorld" },
  { value: "pascal", label: "PascalCase", example: "HelloWorld" },
  { value: "snake", label: "snake_case", example: "hello_world" },
  { value: "kebab", label: "kebab-case", example: "hello-world" },
  { value: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { value: "dot", label: "dot.case", example: "hello.world" },
  { value: "toggle", label: "tOGGLE cASE", example: "hELLO wORLD" },
  { value: "alternating", label: "aLtErNaTiNg", example: "hElLo WoRlD" },
];

const TITLE_MINOR = new Set([
  "a","an","the","and","but","or","nor","for","yet","so",
  "in","on","at","to","by","of","up","as","is","it",
]);

function tokenize(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-./]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function convert(text: string, to: CaseType): string {
  if (!text) return "";

  switch (to) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text
        .toLowerCase()
        .replace(/(?:^|\.\s*|\n)(\w)/g, (_, c: string) => _.replace(c, c.toUpperCase()))
        .replace(/\b\w+/g, (word, idx) => {
          if (idx === 0) return word.charAt(0).toUpperCase() + word.slice(1);
          if (TITLE_MINOR.has(word.toLowerCase())) return word.toLowerCase();
          return word.charAt(0).toUpperCase() + word.slice(1);
        });
    case "sentence": {
      const lower = text.toLowerCase();
      return lower.replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
    }
    case "camel": {
      const words = tokenize(text);
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join("");
    }
    case "pascal": {
      const words = tokenize(text);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    }
    case "snake":
      return tokenize(text).join("_").toLowerCase();
    case "kebab":
      return tokenize(text).join("-").toLowerCase();
    case "constant":
      return tokenize(text).join("_").toUpperCase();
    case "dot":
      return tokenize(text).join(".").toLowerCase();
    case "toggle":
      return text
        .split("")
        .map((c) =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase(),
        )
        .join("");
    case "alternating":
      return text
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join("");
    default:
      return text;
  }
}

export default function CaseConverter() {
  const [input, setInput] = useState(
    "The quick brown fox jumps over the lazy dog",
  );
  const [caseType, setCaseType] = useState<CaseType>("title");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => convert(input, caseType), [input, caseType]);

  const stats = useMemo(() => {
    const chars = input.length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input ? input.split(/\n/).length : 0;
    return { chars, words, lines };
  }, [input]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  return (
    <div className="space-y-8">
      {/* Input */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Input text</p>
          <div className="flex gap-3 text-xs text-text-muted">
            <span>{stats.chars} chars</span>
            <span>{stats.words} words</span>
            <span>{stats.lines} lines</span>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-lg border border-border bg-surface-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 resize-y min-h-24"
          placeholder="Type or paste your text here…"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setInput("")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={async () => {
              const t = await navigator.clipboard.readText();
              setInput(t);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
          >
            Paste from clipboard
          </button>
        </div>
      </div>

      {/* Case selector */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="text-sm font-medium text-text-primary mb-3">
          Select case
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {CASES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCaseType(c.value)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-left transition",
                caseType === c.value
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              <span className="block text-sm font-medium">{c.label}</span>
              <span
                className={cn(
                  "block text-[11px] mt-0.5",
                  caseType === c.value
                    ? "text-white/70"
                    : "text-text-muted",
                )}
              >
                {c.example}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      {input && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-4">
          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-text-primary">
                Result —{" "}
                {CASES.find((c) => c.value === caseType)?.label}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg bg-surface-card border border-border p-4 text-sm whitespace-pre-wrap break-all select-all cursor-text min-h-16">
              {output}
            </div>
          </div>

          {/* All conversions at a glance */}
          <div className="rounded-xl border border-border overflow-hidden">
            <p className="bg-surface-muted px-4 py-2 text-sm font-medium text-text-primary">
              All conversions
            </p>
            <div className="divide-y divide-border">
              {CASES.map((c) => {
                const converted = convert(input, c.value);
                return (
                  <div
                    key={c.value}
                    className={cn(
                      "flex items-start gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-surface-muted/60 transition",
                      caseType === c.value && "bg-brand-50",
                    )}
                    onClick={() => setCaseType(c.value)}
                  >
                    <span className="w-28 shrink-0 text-text-muted text-xs pt-0.5">
                      {c.label}
                    </span>
                    <span className="break-all text-text-primary">
                      {converted.length > 120
                        ? converted.slice(0, 120) + "…"
                        : converted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            Title Case follows AP/Chicago style: articles, conjunctions, and
            short prepositions (a, an, the, and, but, or, in, on, at, to, by,
            of) stay lowercase unless they start the title. All processing
            happens in your browser.
          </p>
        </div>
      )}
    </div>
  );
}

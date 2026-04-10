"use client";

import {
  formatMinified,
  formatPretty,
  tryParseJson,
} from "@/lib/jsonfmt";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "format" | "minify" | "validate";

export default function JsonFormatter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validOk, setValidOk] = useState(false);

  const run = useCallback(() => {
      const m = mode;
      setError(null);
      setValidOk(false);
      const parsed = tryParseJson(text);
      if (!parsed.ok) {
        setError(parsed.message);
        setOutput("");
        return;
      }
      if (m === "validate") {
        setValidOk(true);
        setOutput("");
        return;
      }
      if (m === "format") {
        setOutput(formatPretty(parsed.value));
      } else {
        setOutput(formatMinified(parsed.value));
      }
    },
    [text, mode],
  );

  const copy = async () => {
    const toCopy = mode === "validate" && validOk ? text.trim() : output;
    if (!toCopy) return;
    await navigator.clipboard.writeText(toCopy);
  };

  const sample = `{"name":"ToolSpotAI","tags":["tools","json"],"active":true}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Format (pretty)", "format"],
            ["Minify", "minify"],
            ["Validate only", "validate"],
          ] as const
        ).map(([label, m]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setValidOk(false);
              setOutput("");
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === m
                ? "bg-brand-600 text-white"
                : "bg-surface-muted text-text-secondary hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-text-secondary">
        JSON input
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
            setValidOk(false);
            setOutput("");
          }}
          spellCheck={false}
          placeholder='{"key": "value"}'
          rows={12}
          className="mt-1 w-full resize-y rounded-xl border border-border bg-surface-card p-4 font-mono text-sm leading-relaxed text-text-primary outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Run {mode === "format" ? "Format" : mode === "minify" ? "Minify" : "Validate"}
        </button>
        <button
          type="button"
          onClick={() => setText(sample)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted"
        >
          Load sample
        </button>
        <button
          type="button"
          onClick={() => {
            setText("");
            setOutput("");
            setError(null);
            setValidOk(false);
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={!output && !(validOk && text.trim())}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted disabled:opacity-40"
        >
          Copy result
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <strong className="font-semibold">Invalid JSON</strong>
          <p className="mt-1 font-mono text-xs">{error}</p>
        </div>
      )}

      {validOk && mode === "validate" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          Valid JSON — input parses successfully.
        </div>
      )}

      {output && (
        <div>
          <p className="mb-1 text-sm font-medium text-text-secondary">
            {mode === "minify" ? "Minified output" : "Formatted output"}
          </p>
          <pre className="max-h-[420px] overflow-auto rounded-xl border border-border bg-slate-900 p-4 text-left text-sm text-green-400">
            <code>{output}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

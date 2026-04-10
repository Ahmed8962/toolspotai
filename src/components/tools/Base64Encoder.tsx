"use client";

import { tryDecodeBase64, tryEncodeBase64 } from "@/lib/base64";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

type Mode = "encode" | "decode";

export default function Base64Encoder() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setError(null);
    if (mode === "encode") {
      const r = tryEncodeBase64(text);
      if (!r.ok) {
        setError(r.message);
        setOutput("");
        return;
      }
      setOutput(r.value);
      return;
    }
    const r = tryDecodeBase64(text);
    if (!r.ok) {
      setError(r.message);
      setOutput("");
      return;
    }
    setOutput(r.value);
  }, [text, mode]);

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  };

  const sampleEncode = `Hello — ToolSpotAI 🔧`;
  const sampleDecode = "SGVsbG8g4oCUIFRvb2xTcG90QUkg8J+Upw==";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Encode to Base64", "encode"],
            ["Decode from Base64", "decode"],
          ] as const
        ).map(([label, m]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
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
        {mode === "encode" ? "Plain text (UTF-8)" : "Base64 input"}
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
            setOutput("");
          }}
          spellCheck={false}
          placeholder={
            mode === "encode"
              ? "Type or paste any UTF-8 text…"
              : "Paste Base64 (line breaks and spaces are ignored)…"
          }
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
          {mode === "encode" ? "Encode" : "Decode"}
        </button>
        <button
          type="button"
          onClick={() =>
            setText(mode === "encode" ? sampleEncode : sampleDecode)
          }
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
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-surface-muted"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={!output}
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
          <strong className="font-semibold">
            {mode === "encode" ? "Could not encode" : "Could not decode"}
          </strong>
          <p className="mt-1 font-mono text-xs">{error}</p>
        </div>
      )}

      {output && (
        <div>
          <p className="mb-1 text-sm font-medium text-text-secondary">
            {mode === "encode" ? "Base64 output" : "Decoded text (UTF-8)"}
          </p>
          <pre className="max-h-[420px] overflow-auto rounded-xl border border-border bg-slate-900 p-4 text-left text-sm text-green-400">
            <code>{output}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

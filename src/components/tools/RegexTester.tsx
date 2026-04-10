"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; pattern: string; flags: string }[] = [
  { label: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
  { label: "URL", pattern: "https?://[\\w\\-._~:/?#[\\]@!$&'()*+,;=]+", flags: "gi" },
  { label: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", flags: "g" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
  { label: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g" },
  { label: "Hex colour", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi" },
  { label: "HTML tag", pattern: "<\\/?[a-z][\\s\\S]*?>", flags: "gi" },
];

const FLAG_OPTIONS: { value: string; label: string; desc: string }[] = [
  { value: "g", label: "g", desc: "Global — find all matches" },
  { value: "i", label: "i", desc: "Case insensitive" },
  { value: "m", label: "m", desc: "Multiline — ^ and $ match line boundaries" },
  { value: "s", label: "s", desc: "Dotall — . matches newlines" },
  { value: "u", label: "u", desc: "Unicode — full Unicode matching" },
];

type MatchInfo = {
  fullMatch: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
};

export default function RegexTester() {
  const [pattern, setPattern] = useState("([a-zA-Z]+)@([a-zA-Z]+)\\.([a-z]{2,})");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState(
    "Contact us at hello@example.com or support@company.org.\nAlso try test@domain.co.uk and admin@site.io.",
  );
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(false);

  const toggleFlag = (f: string) => {
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, "") : prev + f));
  };

  const result = useMemo(() => {
    if (!pattern) return { error: null, matches: [] as MatchInfo[], highlightedHtml: "", replaceResult: "" };

    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const matches: MatchInfo[] = [];
      let m: RegExpExecArray | null;
      const reExec = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");

      while ((m = reExec.exec(testString)) !== null) {
        matches.push({
          fullMatch: m[0],
          index: m.index,
          groups: m.slice(1),
          namedGroups: m.groups ? { ...m.groups } : {},
        });
        if (!flags.includes("g")) break;
        if (m[0].length === 0) reExec.lastIndex++;
      }

      // Build highlighted HTML
      let html = "";
      let lastIdx = 0;
      for (let i = 0; i < matches.length; i++) {
        const matchInfo = matches[i];
        if (matchInfo.index > lastIdx) {
          html += escapeHtml(testString.slice(lastIdx, matchInfo.index));
        }
        html += `<mark class="bg-brand-200 text-brand-900 rounded px-0.5">${escapeHtml(matchInfo.fullMatch)}</mark>`;
        lastIdx = matchInfo.index + matchInfo.fullMatch.length;
      }
      if (lastIdx < testString.length) {
        html += escapeHtml(testString.slice(lastIdx));
      }

      // Replace result
      let replaceResult = "";
      if (showReplace && replacement) {
        try {
          const reReplace = new RegExp(pattern, flags);
          replaceResult = testString.replace(reReplace, replacement);
        } catch {
          replaceResult = "";
        }
      }

      return { error: null, matches, highlightedHtml: html, replaceResult };
    } catch (e: unknown) {
      return {
        error: (e as Error).message,
        matches: [] as MatchInfo[],
        highlightedHtml: "",
        replaceResult: "",
      };
    }
  }, [pattern, flags, testString, replacement, showReplace]);

  const inputCls =
    "w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Pattern input */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">Regular expression</p>
        <div className="flex items-center gap-2">
          <span className="text-lg text-text-muted font-mono">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className={cn(inputCls, "h-11 font-mono")}
            placeholder="Enter regex pattern…"
            spellCheck={false}
          />
          <span className="text-lg text-text-muted font-mono">/</span>
          <span className="font-mono text-brand-600 text-sm min-w-8">{flags}</span>
        </div>

        {result.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {result.error}
          </div>
        )}

        {/* Flags */}
        <div className="flex flex-wrap gap-2">
          {FLAG_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => toggleFlag(f.value)}
              title={f.desc}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-mono font-medium transition",
                flags.includes(f.value)
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs text-text-muted mb-1.5">Quick presets</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPattern(p.pattern);
                  setFlags(p.flags);
                }}
                className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-muted transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Test string */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-text-primary">Test string</p>
          <span className="text-xs text-text-muted">
            {result.matches.length} match{result.matches.length !== 1 ? "es" : ""}
          </span>
        </div>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          rows={5}
          className={cn(inputCls, "py-3 resize-y min-h-24 font-mono text-xs")}
          placeholder="Enter test string…"
          spellCheck={false}
        />
      </div>

      {/* Replace section */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
          <input
            type="checkbox"
            checked={showReplace}
            onChange={(e) => setShowReplace(e.target.checked)}
            className="accent-brand-600"
          />
          Find &amp; Replace
        </label>
        {showReplace && (
          <>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              className={cn(inputCls, "h-11 font-mono")}
              placeholder="Replacement string (e.g. $1@newdomain.com)"
              spellCheck={false}
            />
            <p className="text-xs text-text-muted">
              Use $1, $2 for capture groups, $&amp; for full match.
            </p>
          </>
        )}
      </div>

      {/* Results */}
      {!result.error && testString && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-6">
          {/* Highlighted text */}
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-text-primary mb-2">
              Highlighted matches
            </p>
            <div
              className="whitespace-pre-wrap break-all text-sm font-mono leading-relaxed bg-surface-card rounded-lg p-3 border border-border"
              dangerouslySetInnerHTML={{ __html: result.highlightedHtml || escapeHtml(testString) }}
            />
          </div>

          {/* Replace result */}
          {showReplace && replacement && result.replaceResult && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-text-primary mb-2">
                Replace result
              </p>
              <div className="whitespace-pre-wrap break-all text-sm font-mono leading-relaxed bg-surface-card rounded-lg p-3 border border-border text-emerald-700">
                {result.replaceResult}
              </div>
            </div>
          )}

          {/* Match details */}
          {result.matches.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <p className="bg-surface-muted px-4 py-2 text-sm font-medium text-text-primary">
                Match details ({result.matches.length})
              </p>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {result.matches.map((m, i) => (
                  <div key={i} className="px-4 py-2.5 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                        #{i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-brand-700 break-all">
                            {m.fullMatch}
                          </code>
                          <span className="text-xs text-text-muted">
                            index {m.index}
                          </span>
                        </div>
                        {m.groups.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {m.groups.map((g, gi) => (
                              <span
                                key={gi}
                                className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-mono"
                              >
                                <span className="text-text-muted">
                                  ${gi + 1}:
                                </span>{" "}
                                <span className="text-text-primary">{g}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {Object.keys(m.namedGroups).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {Object.entries(m.namedGroups).map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-mono"
                              >
                                <span className="text-amber-600">{k}:</span>{" "}
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regex cheat sheet */}
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-text-primary mb-2">
              Quick reference
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs">
              {[
                [".", "Any character"],
                ["\\d", "Digit [0-9]"],
                ["\\w", "Word char [a-zA-Z0-9_]"],
                ["\\s", "Whitespace"],
                ["^", "Start of line"],
                ["$", "End of line"],
                ["*", "0 or more"],
                ["+", "1 or more"],
                ["?", "0 or 1"],
                ["{n}", "Exactly n times"],
                ["{n,m}", "n to m times"],
                ["[abc]", "Character class"],
                ["[^abc]", "Negated class"],
                ["(…)", "Capture group"],
                ["(?:…)", "Non-capturing group"],
                ["a|b", "Alternation"],
              ].map(([token, desc]) => (
                <div key={token} className="flex gap-1.5 py-0.5">
                  <code className="font-mono text-brand-600 shrink-0 w-12 text-right">
                    {token}
                  </code>
                  <span className="text-text-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            All regex processing is done locally in your browser using the
            JavaScript RegExp engine. No data is sent to any server.
          </p>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";

type Strength = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

function getStrength(pw: string): { label: Strength; pct: number; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Very Weak", pct: 15, color: "#ef4444" };
  if (score <= 3) return { label: "Weak", pct: 30, color: "#f97316" };
  if (score <= 4) return { label: "Fair", pct: 55, color: "#eab308" };
  if (score <= 5) return { label: "Strong", pct: 78, color: "#22c55e" };
  return { label: "Very Strong", pct: 100, color: "#16a34a" };
}

function generatePassword(
  length: number,
  upper: boolean,
  lower: boolean,
  numbers: boolean,
  symbols: boolean,
): string {
  let chars = "";
  if (upper) chars += UPPER;
  if (lower) chars += LOWER;
  if (numbers) chars += DIGITS;
  if (symbols) chars += SYMBOLS;
  if (chars.length === 0) chars = LOWER;

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[arr[i]! % chars.length];
  }

  // Guarantee at least one of each selected type
  const guaranteed: string[] = [];
  if (upper) guaranteed.push(UPPER[arr[0]! % UPPER.length]!);
  if (lower) guaranteed.push(LOWER[arr[1 % length]! % LOWER.length]!);
  if (numbers) guaranteed.push(DIGITS[arr[2 % length]! % DIGITS.length]!);
  if (symbols) guaranteed.push(SYMBOLS[arr[3 % length]! % SYMBOLS.length]!);

  const resultArr = result.split("");
  for (let i = 0; i < guaranteed.length && i < resultArr.length; i++) {
    const pos = arr[(i + 4) % length]! % length;
    resultArr[pos] = guaranteed[i]!;
  }

  return resultArr.join("");
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setPassword(generatePassword(length, upper, lower, numbers, symbols));
    setCopied(false);
  }, [length, upper, lower, numbers, symbols]);

  useEffect(() => {
    generate();
  }, [generate]);

  const strength = getStrength(password);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const atLeastOne = [upper, lower, numbers, symbols].filter(Boolean).length >= 1;

  return (
    <div className="space-y-8">
      {/* Password display */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-6">
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto rounded-lg border border-border bg-white px-4 py-3">
            <p className="font-result whitespace-nowrap text-lg font-semibold tracking-wide text-text-primary">
              {password || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            className="shrink-0 rounded-lg border border-border p-3 text-text-secondary hover:bg-surface-muted"
            title="Regenerate"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </button>
          <button
            type="button"
            onClick={copyToClipboard}
            className={cn(
              "shrink-0 rounded-lg px-4 py-3 text-sm font-medium text-white transition",
              copied ? "bg-emerald-600" : "bg-brand-600 hover:bg-brand-700",
            )}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Strength meter */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
            />
          </div>
          <p className="mt-1.5 text-right text-sm font-medium" style={{ color: strength.color }}>
            {strength.label}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-6">
        {/* Length slider */}
        <div>
          <div className="flex justify-between text-sm text-text-secondary">
            <span>Password Length</span>
            <span className="font-result text-brand-700 font-semibold">{length}</span>
          </div>
          <input
            type="range"
            min={4}
            max={128}
            step={1}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="mt-2 w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>4</span>
            <span>128</span>
          </div>
        </div>

        {/* Character type checkboxes */}
        <div>
          <p className="mb-3 text-sm font-medium text-text-primary">Characters Used</p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Uppercase (A-Z)", checked: upper, set: setUpper },
              { label: "Lowercase (a-z)", checked: lower, set: setLower },
              { label: "Numbers (0-9)", checked: numbers, set: setNumbers },
              { label: "Symbols (!@#$...)", checked: symbols, set: setSymbols },
            ].map((opt) => (
              <label key={opt.label} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => {
                    if (!e.target.checked && [upper, lower, numbers, symbols].filter(Boolean).length <= 1) return;
                    opt.set(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-border accent-brand-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {!atLeastOne && (
            <p className="mt-2 text-sm text-red-600">Select at least one character type.</p>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-muted p-4 text-center">
          <p className="text-xs text-text-muted">Length</p>
          <p className="font-result mt-0.5 text-lg font-semibold">{password.length}</p>
        </div>
        <div className="rounded-xl bg-surface-muted p-4 text-center">
          <p className="text-xs text-text-muted">Character pool</p>
          <p className="font-result mt-0.5 text-lg font-semibold">
            {(upper ? 26 : 0) + (lower ? 26 : 0) + (numbers ? 10 : 0) + (symbols ? SYMBOLS.length : 0)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-muted p-4 text-center">
          <p className="text-xs text-text-muted">Entropy (bits)</p>
          <p className="font-result mt-0.5 text-lg font-semibold">
            {(() => {
              const pool = (upper ? 26 : 0) + (lower ? 26 : 0) + (numbers ? 10 : 0) + (symbols ? SYMBOLS.length : 0);
              return pool > 0 ? (length * Math.log2(pool)).toFixed(1) : "0";
            })()}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        Passwords are generated entirely in your browser using the Web Crypto API
        (crypto.getRandomValues). Nothing is sent to any server. Use a password
        manager to store generated passwords securely.
      </p>
    </div>
  );
}

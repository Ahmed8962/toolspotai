"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ── colour conversion helpers ────────────────────────────── */

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): RGB | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  return (
    "#" +
    [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")
  );
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100,
    ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn = 0,
    gn = 0,
    bn = 0;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];
  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

function contrastRatio(fg: RGB, bg: RGB): number {
  const lum = (c: RGB) => {
    const [rs, gs, bs] = [c.r / 255, c.g / 255, c.b / 255].map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const l1 = lum(fg),
    l2 = lum(bg);
  const lighter = Math.max(l1, l2),
    darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagLevel(ratio: number): { aa: boolean; aaa: boolean; aaLarge: boolean; aaaLarge: boolean } {
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}

/* ── Palette generators ───────────────────────────────────── */

function complementary(hsl: HSL): HSL[] {
  return [{ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }];
}

function triadic(hsl: HSL): HSL[] {
  return [
    { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l },
  ];
}

function analogous(hsl: HSL): HSL[] {
  return [
    { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
  ];
}

function shades(hsl: HSL): HSL[] {
  return [10, 25, 40, 55, 70, 85].map((l) => ({ h: hsl.h, s: hsl.s, l }));
}

/* ── Component ────────────────────────────────────────────── */

export default function ColorConverter() {
  const [hex, setHex] = useState("#3B82F6");
  const [rgb, setRgb] = useState<RGB>({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState<HSL>({ h: 217, s: 91, l: 60 });
  const [copied, setCopied] = useState<string | null>(null);

  const syncFromRgb = useCallback((c: RGB) => {
    setRgb(c);
    setHex(rgbToHex(c));
    setHsl(rgbToHsl(c));
  }, []);

  const handleHexChange = (v: string) => {
    setHex(v);
    const c = hexToRgb(v);
    if (c) {
      setRgb(c);
      setHsl(rgbToHsl(c));
    }
  };

  const handleRgbChange = (ch: keyof RGB, v: string) => {
    const n = clamp(parseInt(v) || 0, 0, 255);
    const next = { ...rgb, [ch]: n };
    syncFromRgb(next);
  };

  const handleHslChange = (ch: keyof HSL, v: string) => {
    const max = ch === "h" ? 360 : 100;
    const n = clamp(parseFloat(v) || 0, 0, max);
    const next = { ...hsl, [ch]: n };
    setHsl(next);
    const c = hslToRgb(next);
    setRgb(c);
    setHex(rgbToHex(c));
  };

  const handlePickerChange = (v: string) => {
    setHex(v);
    const c = hexToRgb(v);
    if (c) {
      setRgb(c);
      setHsl(rgbToHsl(c));
    }
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const cssRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const cssHsl = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;

  const ratioWhite = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const ratioBlack = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const wcagWhite = wcagLevel(ratioWhite);
  const wcagBlack = wcagLevel(ratioBlack);

  const palettes = useMemo(
    () => ({
      complementary: complementary(hsl),
      triadic: triadic(hsl),
      analogous: analogous(hsl),
      shades: shades(hsl),
    }),
    [hsl],
  );

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-surface-card px-2.5 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm font-result";

  return (
    <div className="space-y-8">
      {/* Preview + picker */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-32 w-32 rounded-xl border-2 border-border shadow-sm"
              style={{ backgroundColor: hex }}
            />
            <input
              type="color"
              value={hex}
              onChange={(e) => handlePickerChange(e.target.value)}
              className="h-10 w-32 cursor-pointer rounded-lg border border-border"
            />
          </div>

          <div className="flex-1 space-y-4 w-full">
            {/* HEX */}
            <div>
              <label className="text-xs font-medium text-text-muted">HEX</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className={inputCls}
                  maxLength={7}
                  placeholder="#3B82F6"
                />
                <button
                  type="button"
                  onClick={() => copy(hex.toUpperCase(), "hex")}
                  className="shrink-0 rounded-lg border border-border px-3 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                >
                  {copied === "hex" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* RGB */}
            <div>
              <label className="text-xs font-medium text-text-muted">RGB</label>
              <div className="mt-1 flex gap-2">
                {(["r", "g", "b"] as const).map((ch) => (
                  <div key={ch} className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase text-text-muted w-3">
                        {ch}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={255}
                        value={rgb[ch]}
                        onChange={(e) => handleRgbChange(ch, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => copy(cssRgb, "rgb")}
                  className="shrink-0 rounded-lg border border-border px-3 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                >
                  {copied === "rgb" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* HSL */}
            <div>
              <label className="text-xs font-medium text-text-muted">HSL</label>
              <div className="mt-1 flex gap-2">
                {(["h", "s", "l"] as const).map((ch) => (
                  <div key={ch} className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase text-text-muted w-3">
                        {ch}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={ch === "h" ? 360 : 100}
                        value={Math.round(hsl[ch])}
                        onChange={(e) => handleHslChange(ch, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => copy(cssHsl, "hsl")}
                  className="shrink-0 rounded-lg border border-border px-3 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                >
                  {copied === "hsl" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS output */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-2">
        <p className="text-sm font-medium text-text-primary">CSS values</p>
        {[
          { label: "HEX", value: hex.toUpperCase(), key: "css-hex" },
          { label: "RGB", value: cssRgb, key: "css-rgb" },
          { label: "HSL", value: cssHsl, key: "css-hsl" },
        ].map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between rounded-lg bg-surface-card border border-border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-muted w-8">
                {row.label}
              </span>
              <code className="text-sm font-mono select-all">{row.value}</code>
            </div>
            <button
              type="button"
              onClick={() => copy(row.value, row.key)}
              className="text-xs text-brand-600 hover:underline"
            >
              {copied === row.key ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
      </div>

      {/* WCAG Contrast */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">
          WCAG Contrast Check
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { bg: "#ffffff", label: "White background", ratio: ratioWhite, wcag: wcagWhite, textColor: hex },
            { bg: "#000000", label: "Black background", ratio: ratioBlack, wcag: wcagBlack, textColor: hex },
          ].map((item) => (
            <div key={item.bg} className="rounded-xl border border-border overflow-hidden">
              <div
                className="flex items-center justify-center h-16 text-lg font-semibold"
                style={{ backgroundColor: item.bg, color: hex }}
              >
                Sample Text
              </div>
              <div className="p-3 space-y-1 text-xs">
                <p className="font-medium text-text-primary">
                  {item.label} — {item.ratio.toFixed(2)}:1
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "AA", pass: item.wcag.aa },
                    { label: "AAA", pass: item.wcag.aaa },
                    { label: "AA Large", pass: item.wcag.aaLarge },
                    { label: "AAA Large", pass: item.wcag.aaaLarge },
                  ].map((lvl) => (
                    <span
                      key={lvl.label}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        lvl.pass
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800",
                      )}
                    >
                      {lvl.label}: {lvl.pass ? "Pass" : "Fail"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color palettes */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-4">
        <p className="text-sm font-medium text-text-primary">
          Color Palettes
        </p>
        {(
          [
            { label: "Complementary", colors: [hsl, ...palettes.complementary] },
            { label: "Triadic", colors: [hsl, ...palettes.triadic] },
            { label: "Analogous", colors: [hsl, ...palettes.analogous] },
            { label: "Shades", colors: palettes.shades },
          ] as const
        ).map((palette) => (
          <div key={palette.label}>
            <p className="text-xs text-text-muted mb-1.5">{palette.label}</p>
            <div className="flex gap-1.5 overflow-x-auto">
              {palette.colors.map((c, i) => {
                const pRgb = hslToRgb(c as HSL);
                const pHex = rgbToHex(pRgb);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => syncFromRgb(pRgb)}
                    className="group flex flex-col items-center gap-1"
                    title={`Click to use ${pHex}`}
                  >
                    <div
                      className="h-10 w-14 rounded-lg border border-border group-hover:ring-2 group-hover:ring-brand-400 transition"
                      style={{ backgroundColor: pHex }}
                    />
                    <span className="text-[10px] text-text-muted font-mono">
                      {pHex}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        All conversions use standard sRGB colour space formulas. WCAG contrast
        ratios follow W3C Web Content Accessibility Guidelines 2.1 Level AA
        (4.5:1 for normal text, 3:1 for large text) and AAA (7:1 / 4.5:1). All
        processing is local — no data leaves your browser.
      </p>
    </div>
  );
}

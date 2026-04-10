"use client";

import { generateQR } from "@/lib/qrcode";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type QRType = "text" | "url" | "email" | "phone" | "wifi";

const TYPES: { value: QRType; label: string; icon: string; placeholder: string }[] = [
  { value: "url", label: "URL", icon: "🔗", placeholder: "https://example.com" },
  { value: "text", label: "Text", icon: "📝", placeholder: "Hello, World!" },
  { value: "email", label: "Email", icon: "📧", placeholder: "hello@example.com" },
  { value: "phone", label: "Phone", icon: "📱", placeholder: "+1 555 123 4567" },
  { value: "wifi", label: "Wi-Fi", icon: "📶", placeholder: "Network name" },
];

const COLORS = [
  { fg: "#000000", bg: "#ffffff", label: "Classic" },
  { fg: "#1e3a5f", bg: "#ffffff", label: "Navy" },
  { fg: "#1a1a2e", bg: "#e8f0fe", label: "Dark Blue" },
  { fg: "#2d6a4f", bg: "#ffffff", label: "Green" },
  { fg: "#7c3aed", bg: "#ffffff", label: "Purple" },
  { fg: "#dc2626", bg: "#ffffff", label: "Red" },
];

function buildPayload(type: QRType, value: string, wifiAuth: string, wifiPass: string, wifiHidden: boolean): string {
  switch (type) {
    case "url":
      return value.startsWith("http") ? value : `https://${value}`;
    case "email":
      return `mailto:${value}`;
    case "phone":
      return `tel:${value.replace(/\s+/g, "")}`;
    case "wifi":
      return `WIFI:T:${wifiAuth};S:${value};P:${wifiPass};H:${wifiHidden ? "true" : "false"};;`;
    default:
      return value;
  }
}

export default function QRCodeGenerator() {
  const [type, setType] = useState<QRType>("url");
  const [value, setValue] = useState("https://toolspotai.com");
  const [wifiAuth, setWifiAuth] = useState("WPA");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState(8);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fg = COLORS[colorIdx].fg;
  const bg = COLORS[colorIdx].bg;

  const payload = useMemo(
    () => buildPayload(type, value, wifiAuth, wifiPass, wifiHidden),
    [type, value, wifiAuth, wifiPass, wifiHidden],
  );

  const matrix = useMemo(() => {
    if (!payload.trim()) return null;
    try {
      return generateQR(payload);
    } catch {
      return null;
    }
  }, [payload]);

  const drawToCanvas = useCallback(
    (canvas: HTMLCanvasElement, moduleSize: number) => {
      if (!matrix) return;
      const quietZone = 4;
      const modules = matrix.length;
      const totalSize = (modules + quietZone * 2) * moduleSize;
      canvas.width = totalSize;
      canvas.height = totalSize;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, totalSize, totalSize);
      ctx.fillStyle = fg;
      for (let r = 0; r < modules; r++) {
        for (let c = 0; c < modules; c++) {
          if (matrix[r][c]) {
            ctx.fillRect(
              (c + quietZone) * moduleSize,
              (r + quietZone) * moduleSize,
              moduleSize,
              moduleSize,
            );
          }
        }
      }
    },
    [matrix, fg, bg],
  );

  const downloadPNG = useCallback(() => {
    const canvas = document.createElement("canvas");
    drawToCanvas(canvas, 20);
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [drawToCanvas]);

  const downloadSVG = useCallback(() => {
    if (!matrix) return;
    const quietZone = 4;
    const modules = matrix.length;
    const total = modules + quietZone * 2;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 10}" height="${total * 10}">`;
    svg += `<rect width="${total}" height="${total}" fill="${bg}"/>`;
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (matrix[r][c]) {
          svg += `<rect x="${c + quietZone}" y="${r + quietZone}" width="1" height="1" fill="${fg}"/>`;
        }
      }
    }
    svg += `</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = "qrcode.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [matrix, fg, bg]);

  const inputCls =
    "mt-1 h-12 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setType(t.value);
              setValue("");
            }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              type === t.value
                ? "bg-brand-600 text-white"
                : "border border-border text-text-secondary hover:bg-surface-muted",
            )}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
        <label className="block text-sm text-text-secondary">
          {type === "wifi" ? "Network name (SSID)" : TYPES.find((t) => t.value === type)?.label}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputCls}
            placeholder={TYPES.find((t) => t.value === type)?.placeholder}
          />
        </label>

        {type === "wifi" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm text-text-secondary">
              Security
              <select
                value={wifiAuth}
                onChange={(e) => setWifiAuth(e.target.value)}
                className={inputCls}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </label>
            <label className="block text-sm text-text-secondary">
              Password
              <input
                type="text"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                className={inputCls}
                placeholder="Wi-Fi password"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary pt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={wifiHidden}
                onChange={(e) => setWifiHidden(e.target.checked)}
                className="accent-brand-600"
              />
              Hidden network
            </label>
          </div>
        )}
      </div>

      {/* Style options */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">Style</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColorIdx(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition",
                colorIdx === i
                  ? "ring-2 ring-brand-500 bg-white"
                  : "border border-border hover:bg-surface-muted",
              )}
            >
              <span
                className="inline-block h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: c.fg }}
              />
              <span className="text-text-secondary">{c.label}</span>
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 text-sm text-text-secondary">
          Module size:
          <input
            type="range"
            min={4}
            max={16}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="flex-1 accent-brand-600"
          />
          <span className="font-result w-6 text-right">{size}px</span>
        </label>
      </div>

      {/* QR Preview */}
      {matrix ? (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-4">
          <div className="flex justify-center">
            <div
              className="rounded-xl border-2 border-border p-4"
              style={{ backgroundColor: bg }}
            >
              <svg
                viewBox={`0 0 ${matrix.length + 8} ${matrix.length + 8}`}
                width={(matrix.length + 8) * size}
                height={(matrix.length + 8) * size}
                className="max-w-full h-auto"
              >
                <rect
                  width={matrix.length + 8}
                  height={matrix.length + 8}
                  fill={bg}
                />
                {matrix.map((row, r) =>
                  row.map(
                    (cell, c) =>
                      cell && (
                        <rect
                          key={`${r}-${c}`}
                          x={c + 4}
                          y={r + 4}
                          width={1}
                          height={1}
                          fill={fg}
                        />
                      ),
                  ),
                )}
              </svg>
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={downloadPNG}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={downloadSVG}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 transition"
            >
              Download SVG
            </button>
          </div>

          <div className="text-center text-xs text-text-muted">
            {matrix.length}×{matrix.length} modules &middot; Version{" "}
            {Math.round((matrix.length - 17) / 4)} &middot; EC Level M &middot;{" "}
            {new TextEncoder().encode(payload).length} bytes
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <p className="text-xs leading-relaxed text-text-muted">
            QR codes are generated entirely in your browser using a pure
            JavaScript implementation. No data is sent to any server. Supports
            URLs, plain text, email, phone, and Wi-Fi network credentials.
          </p>
        </div>
      ) : value ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center text-sm text-red-700">
          Text is too long for a QR code. Try shortening your input (max ~200
          characters).
        </div>
      ) : null}
    </div>
  );
}

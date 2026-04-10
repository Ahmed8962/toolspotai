"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Preset = { label: string; w: number; h: number; tag?: string };

const PRESETS: Preset[] = [
  { label: "HD (720p)", w: 1280, h: 720, tag: "TV" },
  { label: "Full HD (1080p)", w: 1920, h: 1080, tag: "TV" },
  { label: "QHD / 2K", w: 2560, h: 1440, tag: "Monitor" },
  { label: "4K / UHD", w: 3840, h: 2160, tag: "TV" },
  { label: "5K", w: 5120, h: 2880, tag: "Monitor" },
  { label: "8K / UHD", w: 7680, h: 4320, tag: "TV" },
  { label: "iPhone 15 Pro", w: 1179, h: 2556, tag: "Mobile" },
  { label: "iPhone 15 Pro Max", w: 1290, h: 2796, tag: "Mobile" },
  { label: "Samsung S24 Ultra", w: 1440, h: 3120, tag: "Mobile" },
  { label: "iPad Pro 12.9\"", w: 2048, h: 2732, tag: "Tablet" },
  { label: "MacBook Pro 14\"", w: 3024, h: 1964, tag: "Laptop" },
  { label: "MacBook Pro 16\"", w: 3456, h: 2234, tag: "Laptop" },
  { label: "Instagram Post", w: 1080, h: 1080, tag: "Social" },
  { label: "Instagram Story", w: 1080, h: 1920, tag: "Social" },
  { label: "YouTube Thumbnail", w: 1280, h: 720, tag: "Social" },
  { label: "Twitter Header", w: 1500, h: 500, tag: "Social" },
  { label: "Facebook Cover", w: 820, h: 312, tag: "Social" },
  { label: "A4 @ 300dpi", w: 2480, h: 3508, tag: "Print" },
  { label: "Letter @ 300dpi", w: 2550, h: 3300, tag: "Print" },
];

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyRatio(w: number, h: number): string {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

export default function ScreenResolutionCalculator() {
  const [mode, setMode] = useState<"resolution" | "aspect" | "resize">("resolution");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [diagonal, setDiagonal] = useState("27");

  // Resize mode
  const [targetW, setTargetW] = useState("");
  const [targetH, setTargetH] = useState("");
  const [lockRatio, setLockRatio] = useState(true);

  // Aspect ratio mode
  const [ratioW, setRatioW] = useState("16");
  const [ratioH, setRatioH] = useState("9");
  const [knownDim, setKnownDim] = useState<"width" | "height">("width");
  const [knownVal, setKnownVal] = useState("1920");

  const w = parseInt(width) || 0;
  const h = parseInt(height) || 0;
  const diag = parseFloat(diagonal) || 0;

  const resInfo = useMemo(() => {
    if (w <= 0 || h <= 0) return null;
    const ratio = simplifyRatio(w, h);
    const totalPixels = w * h;
    const megapixels = totalPixels / 1_000_000;
    const aspectDecimal = w / h;

    let ppi = 0;
    if (diag > 0) {
      const diagPx = Math.sqrt(w * w + h * h);
      ppi = diagPx / diag;
    }

    const orientation = w > h ? "Landscape" : w < h ? "Portrait" : "Square";

    return { ratio, totalPixels, megapixels, ppi, orientation, aspectDecimal };
  }, [w, h, diag]);

  const aspectResult = useMemo(() => {
    const rw = parseInt(ratioW) || 0;
    const rh = parseInt(ratioH) || 0;
    const kv = parseInt(knownVal) || 0;
    if (rw <= 0 || rh <= 0 || kv <= 0) return null;

    if (knownDim === "width") {
      return { width: kv, height: Math.round((kv * rh) / rw) };
    } else {
      return { width: Math.round((kv * rw) / rh), height: kv };
    }
  }, [ratioW, ratioH, knownDim, knownVal]);

  const resizeResult = useMemo(() => {
    if (w <= 0 || h <= 0) return null;
    const tw = parseInt(targetW) || 0;
    const th = parseInt(targetH) || 0;

    if (lockRatio) {
      if (tw > 0 && !th) return { w: tw, h: Math.round((tw * h) / w) };
      if (th > 0 && !tw) return { w: Math.round((th * w) / h), h: th };
      if (tw > 0) return { w: tw, h: Math.round((tw * h) / w) };
    }
    if (tw > 0 && th > 0) return { w: tw, h: th };
    return null;
  }, [w, h, targetW, targetH, lockRatio]);

  const applyPreset = (p: Preset) => {
    setWidth(String(p.w));
    setHeight(String(p.h));
  };

  const inputCls = "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <div className="space-y-8">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["resolution", "Resolution Info"], ["aspect", "Aspect Ratio"], ["resize", "Resize Calculator"]] as const).map(([m, lbl]) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={cn("flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              mode === m ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Resolution Info mode */}
      {mode === "resolution" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-text-muted">Width (px)</label>
                <input type="number" min={1} value={width} onChange={(e) => setWidth(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Height (px)</label>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Diagonal (inches)</label>
                <input type="number" min={0} step="0.1" value={diagonal} onChange={(e) => setDiagonal(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
            </div>
          </div>

          {resInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Resolution", value: `${w} × ${h}` },
                { label: "Aspect Ratio", value: resInfo.ratio },
                { label: "Total Pixels", value: resInfo.totalPixels.toLocaleString() },
                { label: "Megapixels", value: `${resInfo.megapixels.toFixed(1)} MP` },
                { label: "Orientation", value: resInfo.orientation },
                { label: "PPI", value: resInfo.ppi > 0 ? Math.round(resInfo.ppi).toString() : "Enter diagonal" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="font-result text-lg font-bold text-text-primary mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Visual preview */}
          {resInfo && (
            <div className="flex items-center justify-center rounded-xl border border-border bg-surface-muted/40 p-6">
              <div className="relative">
                <div
                  className="rounded border-2 border-brand-300 bg-brand-50/50"
                  style={{
                    width: `${Math.min(300, w / Math.max(w, h) * 300)}px`,
                    height: `${Math.min(300, h / Math.max(w, h) * 300)}px`,
                  }}
                >
                  <div className="flex h-full items-center justify-center text-xs text-brand-600 font-medium">
                    {w} × {h}
                    <br />
                    {resInfo.ratio}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Aspect Ratio mode */}
      {mode === "aspect" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-muted">Ratio Width</label>
                <input type="number" min={1} value={ratioW} onChange={(e) => setRatioW(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Ratio Height</label>
                <input type="number" min={1} value={ratioH} onChange={(e) => setRatioH(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-muted">I know the</label>
                <select value={knownDim} onChange={(e) => setKnownDim(e.target.value as "width" | "height")}
                  className={cn(inputCls, "mt-1 bg-surface-card")}>
                  <option value="width">Width</option>
                  <option value="height">Height</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted">Value (px)</label>
                <input type="number" min={1} value={knownVal} onChange={(e) => setKnownVal(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[["16", "9"], ["4", "3"], ["21", "9"], ["1", "1"], ["9", "16"], ["3", "2"]].map(([rw, rh]) => (
                <button key={`${rw}:${rh}`} type="button" onClick={() => { setRatioW(rw); setRatioH(rh); }}
                  className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    ratioW === rw && ratioH === rh ? "bg-brand-600 text-white border-brand-600" : "bg-white border-border hover:bg-brand-50")}>
                  {rw}:{rh}
                </button>
              ))}
            </div>
          </div>

          {aspectResult && (
            <div className="rounded-xl bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-200 p-6 text-center">
              <p className="text-sm font-medium text-text-muted">Calculated Resolution</p>
              <p className="mt-1 font-result text-3xl font-bold text-brand-700">
                {aspectResult.width} × {aspectResult.height}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {(aspectResult.width * aspectResult.height / 1_000_000).toFixed(1)} megapixels
              </p>
            </div>
          )}
        </>
      )}

      {/* Resize mode */}
      {mode === "resize" && (
        <>
          <div className="rounded-xl border border-border bg-surface-muted/40 p-5 space-y-4">
            <p className="text-xs font-medium text-text-muted">Original Size</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted">Width</label>
                <input type="number" min={1} value={width} onChange={(e) => setWidth(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
              <div>
                <label className="text-xs text-text-muted">Height</label>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(e.target.value)} className={cn(inputCls, "mt-1")} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-brand-600" />
              Lock aspect ratio
            </label>

            <p className="text-xs font-medium text-text-muted">Target Size</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted">New Width</label>
                <input type="number" min={1} value={targetW} onChange={(e) => setTargetW(e.target.value)} placeholder="auto" className={cn(inputCls, "mt-1")} />
              </div>
              <div>
                <label className="text-xs text-text-muted">New Height</label>
                <input type="number" min={1} value={targetH} onChange={(e) => setTargetH(e.target.value)} placeholder="auto" className={cn(inputCls, "mt-1")} />
              </div>
            </div>
          </div>

          {resizeResult && (
            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-6 text-center">
              <p className="text-sm font-medium text-text-muted">Resized Dimensions</p>
              <p className="mt-1 font-result text-3xl font-bold text-emerald-700">
                {resizeResult.w} × {resizeResult.h}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Ratio: {simplifyRatio(resizeResult.w, resizeResult.h)}
                {" · "}
                {((resizeResult.w / w) * 100).toFixed(0)}% of original
              </p>
            </div>
          )}
        </>
      )}

      {/* Presets table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="bg-surface-muted px-4 py-2.5">
          <p className="text-sm font-medium text-text-primary">Common Resolutions</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Resolution</th>
              <th className="p-2">Ratio</th>
              <th className="p-2">Type</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {PRESETS.map((p, i) => (
              <tr key={p.label} className={cn(i % 2 === 1 && "bg-surface-muted/40",
                w === p.w && h === p.h && "bg-brand-50 font-semibold")}>
                <td className="p-2">{p.label}</td>
                <td className="p-2 font-result">{p.w} × {p.h}</td>
                <td className="p-2 font-result text-text-muted">{simplifyRatio(p.w, p.h)}</td>
                <td className="p-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{p.tag}</span>
                </td>
                <td className="p-2">
                  <button type="button" onClick={() => applyPreset(p)}
                    className="text-xs text-brand-600 hover:underline">Use</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

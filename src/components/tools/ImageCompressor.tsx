"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

interface CompressedImage {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  compressedBlob: Blob;
}

const FORMAT_OPTIONS: { label: string; value: OutputFormat }[] = [
  { label: "JPEG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WebP", value: "image/webp" },
];

const MAX_DIM_OPTIONS = [
  { label: "Original", value: 0 },
  { label: "1920px", value: 1920 },
  { label: "1280px", value: 1280 },
  { label: "800px", value: 800 },
  { label: "640px", value: 640 },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(format: OutputFormat): string {
  if (format === "image/jpeg") return ".jpg";
  if (format === "image/png") return ".png";
  return ".webp";
}

function compressImage(
  file: File,
  quality: number,
  maxDim: number,
  format: OutputFormat,
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const originalUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (maxDim > 0 && (width > maxDim || height > maxDim)) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            originalSize: file.size,
            compressedSize: blob.size,
            originalUrl,
            compressedUrl: URL.createObjectURL(blob),
            compressedBlob: blob,
          });
        },
        format,
        format === "image/png" ? undefined : quality / 100,
      );
    };
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
    img.src = originalUrl;
  });
}

export default function ImageCompressor() {
  const [quality, setQuality] = useState(80);
  const [maxDim, setMaxDim] = useState(0);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [results, setResults] = useState<CompressedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanup = useCallback(() => {
    results.forEach((r) => {
      URL.revokeObjectURL(r.originalUrl);
      URL.revokeObjectURL(r.compressedUrl);
    });
  }, [results]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const valid = Array.from(files)
        .filter((f) =>
          ["image/jpeg", "image/png", "image/webp"].includes(f.type),
        )
        .slice(0, 10);

      if (valid.length === 0) {
        setError("No valid images selected. Supported: JPEG, PNG, WebP.");
        return;
      }

      cleanup();
      setError(null);
      setProcessing(true);
      setResults([]);

      try {
        const compressed = await Promise.all(
          valid.map((f) => compressImage(f, quality, maxDim, format)),
        );
        setResults(compressed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Compression failed.");
      } finally {
        setProcessing(false);
      }
    },
    [quality, maxDim, format, cleanup],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) processFiles(e.target.files);
    },
    [processFiles],
  );

  const downloadOne = (item: CompressedImage) => {
    const a = document.createElement("a");
    const baseName = item.name.replace(/\.[^.]+$/, "");
    a.href = item.compressedUrl;
    a.download = `${baseName}-compressed${fileExt(format)}`;
    a.click();
  };

  const downloadAll = () => {
    results.forEach((item) => downloadOne(item));
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalCompressed = results.reduce((s, r) => s + r.compressedSize, 0);
  const totalSaved =
    totalOriginal > 0
      ? (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Quality */}
        <label className="block text-sm font-medium text-text-secondary">
          Quality: {quality}%
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-1 w-full accent-brand-600"
          />
          <span className="flex justify-between text-xs text-text-secondary/60">
            <span>10%</span>
            <span>100%</span>
          </span>
        </label>

        {/* Max dimension */}
        <label className="block text-sm font-medium text-text-secondary">
          Max width / height
          <select
            value={maxDim}
            onChange={(e) => setMaxDim(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {MAX_DIM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {/* Format */}
        <label className="block text-sm font-medium text-text-secondary">
          Output format
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
            className="mt-1 block w-full rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition",
          dragOver
            ? "border-brand-500 bg-brand-500/5"
            : "border-border bg-surface-card hover:border-brand-400 hover:bg-surface-muted",
        )}
      >
        <svg
          className="h-10 w-10 text-text-secondary/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-text-secondary">
          Drop images here or click to browse
        </p>
        <p className="text-xs text-text-secondary/60">
          JPEG, PNG, WebP — up to 10 images
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Processing indicator */}
      {processing && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-card py-6">
          <svg
            className="h-5 w-5 animate-spin text-brand-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          <span className="text-sm font-medium text-text-secondary">
            Compressing…
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Batch stats */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-card p-4 text-center text-sm">
            <div>
              <p className="text-text-secondary/60">Original</p>
              <p className="font-semibold text-text-primary">
                {formatSize(totalOriginal)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary/60">Compressed</p>
              <p className="font-semibold text-text-primary">
                {formatSize(totalCompressed)}
              </p>
            </div>
            <div>
              <p className="text-text-secondary/60">Saved</p>
              <p className="font-semibold text-emerald-600">{totalSaved}%</p>
            </div>
          </div>

          {/* Download all */}
          {results.length > 1 && (
            <button
              type="button"
              onClick={downloadAll}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              Download All ({results.length} images)
            </button>
          )}

          {/* Individual results */}
          <div className="space-y-3">
            {results.map((item) => {
              const saved =
                item.originalSize > 0
                  ? (
                      ((item.originalSize - item.compressedSize) /
                        item.originalSize) *
                      100
                    ).toFixed(1)
                  : "0";

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:items-center"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.originalUrl}
                    alt={item.name}
                    className="h-16 w-16 flex-shrink-0 rounded-lg border border-border object-cover"
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <span>Original: {formatSize(item.originalSize)}</span>
                      <span>
                        Compressed: {formatSize(item.compressedSize)}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          Number(saved) > 0
                            ? "text-emerald-600"
                            : "text-amber-600",
                        )}
                      >
                        {Number(saved) > 0 ? `${saved}% saved` : "No reduction"}
                      </span>
                    </div>
                  </div>

                  {/* Download */}
                  <button
                    type="button"
                    onClick={() => downloadOne(item)}
                    className="flex-shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    Download
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Privacy note */}
      <p className="text-center text-xs text-text-secondary/60">
        All compression happens in your browser. No images are uploaded to any
        server.
      </p>
    </div>
  );
}

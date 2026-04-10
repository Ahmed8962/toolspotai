"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

const ALGORITHMS: Algorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];

const ALGO_INFO: Record<Algorithm, { bits: number; hexLen: number; note: string }> = {
  MD5: { bits: 128, hexLen: 32, note: "Fast but cryptographically broken. Use for checksums only." },
  "SHA-1": { bits: 160, hexLen: 40, note: "Deprecated for security. Still used in git." },
  "SHA-256": { bits: 256, hexLen: 64, note: "Industry standard. Used in SSL, blockchain." },
  "SHA-512": { bits: 512, hexLen: 128, note: "Strongest. Preferred for password hashing." },
};

// MD5 pure-JS implementation (RFC 1321) — no npm dependency
function md5(input: Uint8Array): string {
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]);
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const origLen = input.length;
  const bitLen = origLen * 8;
  const padLen = ((origLen + 8) >>> 6 << 6) + 64;
  const buf = new Uint8Array(padLen);
  buf.set(input);
  buf[origLen] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padLen - 8, bitLen >>> 0, true);
  view.setUint32(padLen - 4, Math.floor(bitLen / 0x100000000), true);

  let a0 = 0x67452301 >>> 0;
  let b0 = 0xefcdab89 >>> 0;
  let c0 = 0x98badcfe >>> 0;
  let d0 = 0x10325476 >>> 0;

  for (let off = 0; off < padLen; off += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = view.getUint32(off + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const hex = (n: number) =>
    Array.from(new Uint8Array(new Uint32Array([n]).buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}

async function computeHash(text: string, algo: Algorithm): Promise<string> {
  const data = new TextEncoder().encode(text);

  if (algo === "MD5") return md5(data);

  const hashBuffer = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashGenerator() {
  const [input, setInput] = useState("Hello, World!");
  const [algo, setAlgo] = useState<Algorithm>("SHA-256");
  const [uppercase, setUppercase] = useState(false);
  const [hashAll, setHashAll] = useState(false);

  const [singleHash, setSingleHash] = useState("");
  const [allHashes, setAllHashes] = useState<Record<Algorithm, string>>({
    MD5: "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-512": "",
  });
  const [copied, setCopied] = useState<string | null>(null);

  const compute = useCallback(async () => {
    if (!input) {
      setSingleHash("");
      setAllHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" });
      return;
    }
    if (hashAll) {
      const results: Record<string, string> = {};
      await Promise.all(
        ALGORITHMS.map(async (a) => {
          results[a] = await computeHash(input, a);
        }),
      );
      setAllHashes(results as Record<Algorithm, string>);
    } else {
      const h = await computeHash(input, algo);
      setSingleHash(h);
    }
  }, [input, algo, hashAll]);

  useEffect(() => {
    compute();
  }, [compute]);

  const formatHash = (h: string) => (uppercase ? h.toUpperCase() : h);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const inputCls =
    "mt-1 w-full rounded-lg border border-border bg-surface-card px-3 outline-none focus:ring-2 focus:ring-brand-500/30 text-sm";

  return (
    <div className="space-y-8">
      {/* Input */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">Input text</p>
          <span className="text-xs text-text-muted">
            {new TextEncoder().encode(input).length} bytes
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          className={cn(inputCls, "mt-2 min-h-24 resize-y py-3")}
          placeholder="Enter text to hash…"
        />
      </div>

      {/* Algorithm selector */}
      <div className="rounded-xl border border-border bg-surface-muted/40 p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {ALGORITHMS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAlgo(a);
                setHashAll(false);
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                !hashAll && algo === a
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-secondary hover:bg-surface-muted",
              )}
            >
              {a}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHashAll(true)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              hashAll
                ? "bg-brand-600 text-white"
                : "border border-border text-text-secondary hover:bg-surface-muted",
            )}
          >
            All
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="accent-brand-600"
          />
          Uppercase output
        </label>
      </div>

      {/* Results */}
      {input && (
        <div className="animate-[fadeUp_0.35s_ease_both] space-y-4">
          {hashAll ? (
            ALGORITHMS.map((a) => {
              const h = formatHash(allHashes[a]);
              if (!h) return null;
              const info = ALGO_INFO[a];
              return (
                <div key={a} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{a}</span>
                      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-muted">
                        {info.bits} bit
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(h, a)}
                      className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                    >
                      {copied === a ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p
                    className="break-all font-mono text-sm text-emerald-700 bg-surface-muted rounded-lg p-3 select-all cursor-text"
                    style={{ wordBreak: "break-all" }}
                  >
                    {h}
                  </p>
                  <p className="text-xs text-text-muted">{info.note}</p>
                </div>
              );
            })
          ) : (
            (() => {
              const h = formatHash(singleHash);
              const info = ALGO_INFO[algo];
              if (!h) return null;
              return (
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{algo}</span>
                      <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-muted">
                        {info.bits} bit &middot; {info.hexLen} chars
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(h, "single")}
                      className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                    >
                      {copied === "single" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p
                    className="break-all font-mono text-lg text-emerald-700 bg-surface-muted rounded-lg p-4 select-all cursor-text"
                    style={{ wordBreak: "break-all" }}
                  >
                    {h}
                  </p>
                  <p className="text-xs text-text-muted">{info.note}</p>
                </div>
              );
            })()
          )}

          {/* Known test vectors */}
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-text-primary mb-2">
              Verify: empty string hashes
            </p>
            <div className="space-y-2 text-xs">
              {([
                ["MD5", "d41d8cd98f00b204e9800998ecf8427e"],
                ["SHA-1", "da39a3ee5e6b4b0d3255bfef95601890afd80709"],
                ["SHA-256", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
                ["SHA-512", "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"],
              ] as const).map(([a, hash]) => (
                <div key={a} className="flex gap-2">
                  <span className="font-medium text-text-secondary w-16 shrink-0">{a}:</span>
                  <span className="break-all text-text-muted font-mono select-all">{hash}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-text-muted">
            SHA-1, SHA-256, and SHA-512 use the browser&apos;s native Web Crypto
            API. MD5 uses a pure JavaScript implementation (RFC 1321). All
            processing is done locally &mdash; your data never leaves the browser.
          </p>
        </div>
      )}
    </div>
  );
}

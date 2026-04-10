"use client";

import { useMemo, useState } from "react";

const STYLES = ["photorealistic", "oil painting", "anime", "3D render", "watercolor", "film still"];
const LIGHT = ["golden hour", "soft studio", "dramatic rim light", "overcast", "neon night"];
const MOOD = ["calm", "epic", "playful", "moody", "minimal"];

export default function ImagePromptBuilder() {
  const [subject, setSubject] = useState("a quiet coastal town at dawn");
  const [style, setStyle] = useState(STYLES[0]);
  const [light, setLight] = useState(LIGHT[0]);
  const [mood, setMood] = useState(MOOD[0]);
  const [ratio, setRatio] = useState("16:9");
  const [extra, setExtra] = useState("no text, high detail");

  const prompt = useMemo(() => {
    return `${subject.trim()}, ${style}, ${light} lighting, ${mood} mood, aspect ratio ${ratio}, ${extra}`.replace(/\s+/g, " ").trim();
  }, [subject, style, light, mood, ratio, extra]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Build a structured prompt for Midjourney, DALL·E, or Stable Diffusion—no image upload required. Tweak nouns and adjectives; your creativity still drives the result.
      </p>
      <label className="block text-sm font-medium text-text-primary">
        Subject & scene
        <textarea value={subject} onChange={(e) => setSubject(e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-text-primary">
          Style
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2">
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-text-primary">
          Lighting
          <select value={light} onChange={(e) => setLight(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2">
            {LIGHT.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-text-primary">
          Mood
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2">
            {MOOD.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-text-primary">
          Aspect ratio hint
          <select value={ratio} onChange={(e) => setRatio(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2">
            {["1:1", "4:5", "3:2", "16:9", "21:9"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-text-primary">
        Extra constraints
        <input value={extra} onChange={(e) => setExtra(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm" />
      </label>
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
        <p className="text-xs font-semibold uppercase text-brand-800">Prompt</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{prompt}</p>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(prompt)}
          className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Copy prompt
        </button>
      </div>
    </div>
  );
}

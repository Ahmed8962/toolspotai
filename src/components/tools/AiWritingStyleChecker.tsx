"use client";

import { useMemo, useState } from "react";

function analyze(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const sentences = trimmed.split(/[.!?]+/).filter(Boolean);
  const words = trimmed.split(/\s+/).filter(Boolean);
  const avgLen = words.length / Math.max(sentences.length, 1);
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z0-9']/gi, "")));
  const diversity = words.length ? unique.size / words.length : 0;
  const passive = (trimmed.match(/\b(am|is|are|was|were|been|being)\s+\w+ed\b/gi) || []).length;
  const aiPhrases = (trimmed.match(/\b(it is important to note|delve into|landscape|robust|leverage|unlock)\b/gi) || []).length;
  let score = 72;
  score += Math.min(12, (diversity - 0.45) * 40);
  score -= Math.min(15, Math.max(0, avgLen - 22) * 0.8);
  score -= Math.min(10, passive * 2);
  score -= Math.min(8, aiPhrases * 2);
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { avgLen, diversity, passive, aiPhrases, score, sentences: sentences.length, words: words.length };
}

export default function AiWritingStyleChecker() {
  const [text, setText] = useState(
    "Paste a paragraph here. We look at variety in word choice, sentence length, and a few overused patterns—this is a lightweight style check, not a courtroom-ready AI detector.",
  );

  const r = useMemo(() => analyze(text), [text]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-muted">
        Honest limitation: this does not scan model weights or the internet. It uses simple heuristics writers use to tighten drafts—useful for editing, not for accusing someone of using AI.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-text-primary"
      />
      {r && (
        <div className="grid gap-4 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-text-muted">Readability-style score</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-brand-700">{r.score}</p>
            <p className="mt-2 text-xs text-text-muted">Higher = more varied, less “templatey” by our crude rules—not a label of human vs machine.</p>
          </div>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li>Words: {r.words}</li>
            <li>Sentences: {r.sentences}</li>
            <li>Avg words / sentence: {r.avgLen.toFixed(1)}</li>
            <li>Lexical diversity: {(r.diversity * 100).toFixed(0)}%</li>
            <li>Passive-style hits: {r.passive}</li>
            <li>Generic buzzword hits: {r.aiPhrases}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function computeNGrams(text: string, n: number): Set<string> {
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const grams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    grams.add(words.slice(i, i + n).join(" "));
  }
  return grams;
}

function sentenceSplit(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
}

function findDuplicates(sentences: string[]): { sentence: string; indices: number[] }[] {
  const normalized = sentences.map((s) => s.toLowerCase().replace(/[^\w\s]/g, "").trim());
  const dupes: { sentence: string; indices: number[] }[] = [];
  const seen = new Map<string, number[]>();
  normalized.forEach((s, i) => {
    if (s.length < 10) return;
    const key = s.split(/\s+/).slice(0, 8).join(" ");
    const existing = seen.get(key);
    if (existing) {
      existing.push(i);
    } else {
      seen.set(key, [i]);
    }
  });
  seen.forEach((indices, key) => {
    if (indices.length > 1) {
      dupes.push({ sentence: sentences[indices[0]], indices });
    }
  });
  return dupes;
}

function readability(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = Math.max(1, words.length);

  const fleschKincaid = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59;
  const fleschEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  const avgSentLen = wordCount / sentenceCount;
  const avgWordLen = words.reduce((a, w) => a + w.length, 0) / wordCount;

  return {
    fleschKincaid: Math.max(0, Math.round(fleschKincaid * 10) / 10),
    fleschEase: Math.max(0, Math.min(100, Math.round(fleschEase * 10) / 10)),
    avgSentLen: Math.round(avgSentLen * 10) / 10,
    avgWordLen: Math.round(avgWordLen * 10) / 10,
    sentenceCount,
    wordCount,
    syllables,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function uniquenessScore(text: string): number {
  const sentences = sentenceSplit(text);
  if (sentences.length <= 1) return 100;
  const trigrams = computeNGrams(text, 3);
  const bigrams = computeNGrams(text, 2);
  const dupes = findDuplicates(sentences);

  let penalty = dupes.length * 5;

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const vocabularyDiversity = (uniqueWords.size / words.length) * 100;

  if (vocabularyDiversity < 40) penalty += 15;
  else if (vocabularyDiversity < 55) penalty += 8;

  return Math.max(0, Math.min(100, 100 - penalty));
}

export default function PlagiarismChecker() {
  const [text, setText] = useState("");
  const [compareText, setCompareText] = useState("");
  const [mode, setMode] = useState<"analyze" | "compare">("analyze");

  const analysis = useMemo(() => {
    if (text.trim().length < 20) return null;

    const score = uniquenessScore(text);
    const read = readability(text);
    const sentences = sentenceSplit(text);
    const dupes = findDuplicates(sentences);
    const words = text.split(/\s+/).filter(Boolean);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const vocabDiv = Math.round((uniqueWords.size / words.length) * 100);

    const charCount = text.length;
    const charNoSpaces = text.replace(/\s/g, "").length;
    const paraCount = text.split(/\n\s*\n/).filter((p) => p.trim()).length;

    return { score, read, dupes, vocabDiv, charCount, charNoSpaces, paraCount, words: words.length, sentences: sentences.length };
  }, [text]);

  const comparison = useMemo(() => {
    if (mode !== "compare" || text.trim().length < 20 || compareText.trim().length < 20) return null;

    const grams1 = computeNGrams(text, 4);
    const grams2 = computeNGrams(compareText, 4);

    let overlap = 0;
    grams1.forEach((g) => { if (grams2.has(g)) overlap++; });

    const similarity = grams1.size > 0 ? Math.round((overlap / grams1.size) * 100) : 0;

    const sent1 = sentenceSplit(text);
    const sent2 = sentenceSplit(compareText);
    const matchedSentences: string[] = [];
    sent1.forEach((s) => {
      const sNorm = s.toLowerCase().replace(/[^\w\s]/g, "").trim();
      sent2.forEach((s2) => {
        const s2Norm = s2.toLowerCase().replace(/[^\w\s]/g, "").trim();
        if (sNorm === s2Norm || (sNorm.length > 20 && s2Norm.includes(sNorm.slice(0, 30)))) {
          matchedSentences.push(s);
        }
      });
    });

    return { similarity, overlap, total: grams1.size, matchedSentences };
  }, [text, compareText, mode]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const scoreLabel = (score: number) => {
    if (score >= 90) return "Highly Unique";
    if (score >= 75) return "Mostly Unique";
    if (score >= 50) return "Moderate Originality";
    return "Low Originality";
  };

  const easeLabel = (score: number) => {
    if (score >= 80) return "Very Easy";
    if (score >= 60) return "Standard";
    if (score >= 40) return "Fairly Difficult";
    if (score >= 20) return "Difficult";
    return "Very Difficult";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-muted/80 p-4 text-sm text-text-secondary leading-relaxed">
        <p className="font-medium text-text-primary">Runs entirely in your browser</p>
        <p className="mt-1">
          Analyze one text for readability and repetition, or compare two pasted texts for similarity. This does{" "}
          <strong>not</strong> search the web or academic databases—use your school or a paid service for that.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {([["analyze", "Analyze Text"], ["compare", "Compare Texts"]] as const).map(([m, lbl]) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={cn("flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              mode === m ? "bg-white shadow-sm text-brand-700" : "text-text-muted hover:text-text-primary")}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-text-muted">
          {mode === "compare" ? "Text A (Original)" : "Paste your text below"}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-40 w-full rounded-xl border border-border bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 resize-y"
          placeholder="Paste or type your text here (minimum 20 characters)..."
        />
        <p className="text-xs text-text-muted text-right">{text.split(/\s+/).filter(Boolean).length} words</p>
      </div>

      {mode === "compare" && (
        <div className="space-y-3">
          <label className="text-xs font-medium text-text-muted">Text B (Compare Against)</label>
          <textarea
            value={compareText}
            onChange={(e) => setCompareText(e.target.value)}
            className="h-40 w-full rounded-xl border border-border bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 resize-y"
            placeholder="Paste the second text to compare..."
          />
        </div>
      )}

      {/* Analysis results */}
      {analysis && mode === "analyze" && (
        <>
          {/* Uniqueness hero */}
          <div className={cn("rounded-xl border p-6 text-center",
            analysis.score >= 80 ? "bg-green-50 border-green-200" : analysis.score >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200")}>
            <p className="text-sm font-medium text-text-muted">Internal repetition score</p>
            <p className={cn("mt-1 font-result text-5xl font-bold", scoreColor(analysis.score))}>{analysis.score}%</p>
            <p className={cn("mt-1 text-sm font-medium", scoreColor(analysis.score))}>{scoreLabel(analysis.score)}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Words", value: analysis.words },
              { label: "Sentences", value: analysis.sentences },
              { label: "Characters", value: analysis.charCount.toLocaleString() },
              { label: "Paragraphs", value: analysis.paraCount },
              { label: "Vocabulary Diversity", value: `${analysis.vocabDiv}%` },
              { label: "Avg Sentence Length", value: `${analysis.read.avgSentLen} words` },
              { label: "Avg Word Length", value: `${analysis.read.avgWordLen} chars` },
              { label: "Syllables", value: analysis.read.syllables },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
                <p className="text-xs text-text-muted">{item.label}</p>
                <p className="font-result text-lg font-bold text-text-primary mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Readability */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-medium text-text-primary">Readability Analysis</p>
            </div>
            <div className="divide-y divide-border/60">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Flesch Reading Ease</p>
                  <p className="text-xs text-text-muted">{easeLabel(analysis.read.fleschEase)}</p>
                </div>
                <span className="font-result text-xl font-bold text-text-primary">{analysis.read.fleschEase}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Flesch-Kincaid Grade Level</p>
                  <p className="text-xs text-text-muted">US school grade equivalent</p>
                </div>
                <span className="font-result text-xl font-bold text-text-primary">{analysis.read.fleschKincaid}</span>
              </div>
            </div>
          </div>

          {/* Duplicate sentences */}
          {analysis.dupes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-800">Repeated Phrases Found ({analysis.dupes.length})</p>
              {analysis.dupes.map((d, i) => (
                <p key={i} className="text-sm text-amber-700 pl-3 border-l-2 border-amber-300">"{d.sentence}"</p>
              ))}
            </div>
          )}
        </>
      )}

      {/* Comparison results */}
      {comparison && mode === "compare" && (
        <>
          <div className={cn("rounded-xl border p-6 text-center",
            comparison.similarity <= 20 ? "bg-green-50 border-green-200" : comparison.similarity <= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200")}>
            <p className="text-sm font-medium text-text-muted">Text Similarity</p>
            <p className={cn("mt-1 font-result text-5xl font-bold",
              comparison.similarity <= 20 ? "text-green-600" : comparison.similarity <= 50 ? "text-amber-600" : "text-red-600")}>
              {comparison.similarity}%
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {comparison.overlap} of {comparison.total} phrases matched
            </p>
          </div>

          {comparison.matchedSentences.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <p className="text-sm font-medium text-red-800">Matching Sentences ({comparison.matchedSentences.length})</p>
              {comparison.matchedSentences.map((s, i) => (
                <p key={i} className="text-sm text-red-700 pl-3 border-l-2 border-red-300">"{s}"</p>
              ))}
            </div>
          )}
        </>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Local analysis only: readability metrics and patterns inside the text(s) you paste. To check against published sources on the internet, use a dedicated plagiarism database or your institution’s tool.
      </div>
    </div>
  );
}

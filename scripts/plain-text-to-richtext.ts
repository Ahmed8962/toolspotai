/**
 * Converts plain-text blog body (## H2 headings) to Contentful Rich Text.
 */
import { rDoc, rH2, rOl, rP, rText, rUl } from "./contentful-richtext";

function sanitizeEmDash(text: string): string {
  return text.replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
}

function isOrderedListLine(line: string): boolean {
  return /^\d+\.\s/.test(line.trim());
}

function isLabelValueLine(line: string): boolean {
  const t = line.trim();
  return /^[^:]+:\s*.+$/.test(t) && t.length < 140;
}

function isShortListLine(line: string): boolean {
  const t = line.trim();
  return t.length > 0 && t.length < 72 && !t.endsWith(".");
}

function blockToNodes(block: string) {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  if (lines.every(isOrderedListLine)) {
    return [rOl(...lines.map((l) => l.replace(/^\d+\.\s*/, "")))];
  }

  if (lines.length >= 2 && lines.every(isLabelValueLine)) {
    return [rUl(...lines)];
  }

  if (lines.length >= 3 && lines.every(isShortListLine)) {
    return [rUl(...lines)];
  }

  return lines.map((l) => rP(rText(l)));
}

export function plainTextToRichText(body: string) {
  const sanitized = sanitizeEmDash(body.trim());
  const nodes: ReturnType<typeof rP>[] = [];

  const parts = sanitized.split(/\n(?=## )/);
  for (let pi = 0; pi < parts.length; pi++) {
    const part = parts[pi].trim();
    if (!part) continue;

    if (part.startsWith("## ")) {
      const nl = part.indexOf("\n");
      const heading = nl === -1 ? part.slice(3).trim() : part.slice(3, nl).trim();
      nodes.push(rH2(heading));
      const rest = nl === -1 ? "" : part.slice(nl + 1).trim();
      if (rest) {
        for (const block of rest.split(/\n\n+/)) {
          nodes.push(...blockToNodes(block));
        }
      }
      continue;
    }

    for (const block of part.split(/\n\n+/)) {
      nodes.push(...blockToNodes(block));
    }
  }

  return rDoc(...nodes);
}

export function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.round(words / 220));
}

import type { Tool } from "@/data/tool-model";
import seoToolsKeywordMap from "@/data/seo-tools-keyword-map.json";

const SITE = "https://toolspotai.com" as const;
const BRAND = "ToolSpotAI" as const;

type SeoKeywordPack = {
  primary_keywords: string[];
  secondary_keywords: string[];
};

const SEO_MAP = seoToolsKeywordMap as Record<string, SeoKeywordPack>;

/** Optional: force primary phrase when it must differ from the SEO map’s first primary */
const PRIMARY_PHRASE_OVERRIDE: Partial<Record<string, string>> = {
  "ai-writing-style-checker": "ai content detector",
  "image-prompt-builder": "ai image prompt generator",
};

function getSeoPack(slug: string): SeoKeywordPack | undefined {
  return SEO_MAP[slug];
}

export function getPrimaryKeywordPhrase(tool: Tool): string {
  const o = PRIMARY_PHRASE_OVERRIDE[tool.slug];
  if (o) return o;
  const pack = getSeoPack(tool.slug);
  const fromMap = pack?.primary_keywords?.[0]?.trim();
  if (fromMap) return fromMap.toLowerCase();
  const k = tool.keywords[0]?.trim();
  if (k) return k.toLowerCase();
  return tool.title.replace(/\s+/g, " ").trim().toLowerCase();
}

function dedupeLower(phrases: string[]): string[] {
  const out: string[] = [];
  for (const raw of phrases) {
    const p = raw.trim().toLowerCase();
    if (!p || out.includes(p)) continue;
    out.push(p);
  }
  return out;
}

/** Merged secondaries: JSON map + remaining tool keywords (for meta + intro) */
export function getSeoSecondaryList(tool: Tool): string[] {
  const pack = getSeoPack(tool.slug);
  const merged = [
    ...(pack?.secondary_keywords ?? []),
    ...(pack?.primary_keywords?.slice(1) ?? []),
    ...tool.keywords.slice(1),
  ];
  return dedupeLower(merged);
}

/** Title case for visible H1 while keeping words like “US”, “UK”, “401k” readable */
export function formatPrimaryForH1(primaryLower: string): string {
  const small = new Set(["and", "or", "for", "to", "of", "in", "per", "vs"]);
  return primaryLower
    .split(/\s+/)
    .map((w, i) => {
      if (/^\d/.test(w)) return w.toUpperCase();
      if (i > 0 && small.has(w)) return w;
      if (/^(us|uk|eu|uae)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function pickActionVerb(tool: Tool): string {
  const slug = tool.slug;
  if (slug.includes("calculator") || slug.includes("converter") || slug.includes("tax")) return "Calculate";
  if (slug.includes("generator") || slug.includes("builder")) return "Create";
  if (slug.includes("checker") || slug.includes("test") || slug.includes("analyzer")) return "Check";
  if (slug.includes("counter") || slug.includes("formatter")) return "Use";
  if (slug.includes("compressor") || slug.includes("editor")) return "Use";
  return "Find";
}

/** Meta title ≤60 chars: primary + free signal + brand */
export function buildToolMetaTitle(primary: string, toolTitle: string): string {
  const brand = ` | ${BRAND}`;
  const candidates = [
    `${primary} - Free Online ${toolTitle}${brand}`,
    `${primary} - Free ${toolTitle}${brand}`,
    `${primary} - Free online tool${brand}`,
    `${primary} - Free tool${brand}`,
    `${primary}${brand}`,
  ];
  for (const t of candidates) {
    if (t.length <= 60) return t;
  }
  const max = 60 - brand.length;
  return `${primary.slice(0, Math.max(12, max - 1))}…${brand}`;
}

/** Open Graph title (slightly shorter pattern) */
export function buildToolOgTitle(primary: string): string {
  const brand = ` | ${BRAND}`;
  const candidates = [
    `${primary} - Free Online Tool${brand}`,
    `${primary} - Free Tool${brand}`,
    `${primary}${brand}`,
  ];
  for (const t of candidates) {
    if (t.length <= 60) return t;
  }
  return `${primary.slice(0, 60 - brand.length - 1)}…${brand}`;
}

/** Clamp meta description to 150–160 characters (single paragraph) */
export function clampMetaDescription(text: string, min = 150, max = 160): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length >= min && t.length <= max) return t;
  if (t.length > max) {
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    t = (lastSpace > min ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, "");
    if (t.length > max) t = t.slice(0, max - 1) + "…";
  }
  const pad = " No signup on ToolSpotAI.";
  while (t.length < min && t.length + pad.length <= max) {
    t = (t + pad).slice(0, max);
  }
  while (t.length < min) {
    t += ".";
    if (t.length > max) break;
  }
  return t.slice(0, max);
}

export function buildToolMetaDescription(tool: Tool, primary: string, secondary: string[]): string {
  const verb = pickActionVerb(tool);
  const sec = secondary[0] ?? tool.keywords[1] ?? "instant results";
  const base = `${verb} ${primary} online free—${sec}. ${tool.description}`.replace(/\s+/g, " ").trim();
  return clampMetaDescription(base);
}

export function buildFiveMetaKeywords(tool: Tool, primary: string, secondary: string[]): string[] {
  const pool = [primary, ...secondary, ...tool.keywords].map((k) => k.trim().toLowerCase());
  const out: string[] = [];
  for (const k of pool) {
    if (!k || out.includes(k)) continue;
    out.push(k);
    if (out.length >= 5) break;
  }
  while (out.length < 5) {
    out.push(tool.slug.replace(/-/g, " "));
    if (out.length >= 5) break;
  }
  return out.slice(0, 5);
}

export function buildToolIntroParagraph(tool: Tool, primary: string, secondary: string[]): string {
  const sec = secondary[0] ?? tool.keywords[1] ?? "clear takeaways";
  const p1 = `Use this free ${primary} on ${BRAND} to explore ${tool.shortTitle.toLowerCase()} scenarios with ${sec} in mind.`;
  const p2 = tool.description.endsWith(".") ? tool.description : `${tool.description}.`;
  const p3 = "Runs in your browser—no account required.";
  return `${p1} ${p2} ${p3}`;
}

function splitHowItWorksIntoSteps(
  tool: Tool,
  howItWorks: string,
  maxSteps = 5,
): string[] {
  const chunks = howItWorks
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentences: string[] = [];
  for (const c of chunks) {
    const parts = c.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (p.length > 24) sentences.push(p);
    }
  }
  const uniq = [...new Set(sentences)];
  if (uniq.length >= 3) return uniq.slice(0, maxSteps);
  return [
    `Open the ${tool.title} above and enter the fields that apply to your case.`,
    "Adjust inputs to compare scenarios side by side.",
    "Read the formula and tips below for assumptions and limits.",
    "Use related tools at the bottom for the next step in your workflow.",
  ].slice(0, maxSteps);
}

export function buildHowToUseSteps(tool: Tool): string[] {
  return splitHowItWorksIntoSteps(tool, tool.content.howItWorks, 5);
}

export type ToolPageOnPageSeo = {
  primaryLower: string;
  h1Text: string;
  introHtml: string;
  howToUseSteps: string[];
};

export function buildToolPageOnPageSeo(tool: Tool): ToolPageOnPageSeo {
  const primaryLower = getPrimaryKeywordPhrase(tool);
  const secondary = getSeoSecondaryList(tool).slice(0, 8);
  return {
    primaryLower,
    h1Text: formatPrimaryForH1(primaryLower),
    introHtml: buildToolIntroParagraph(tool, primaryLower, secondary),
    howToUseSteps: buildHowToUseSteps(tool),
  };
}

export function toolCanonicalUrl(slug: string): string {
  return `${SITE}/tools/${slug}`;
}

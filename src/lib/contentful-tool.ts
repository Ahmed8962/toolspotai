import { getToolBySlug } from "@/data/tools";
import type { Tool } from "@/data/tool-model";
import { contentfulFetchOptions } from "@/lib/contentful-revalidate";
import { SITE_URL } from "@/lib/site";
import { buildToolPageOnPageSeo } from "@/lib/tool-page-seo";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const DELIVERY_TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN;

const CONTENT_TYPE = "toolPage";

/** Normalized for merge + layout (built from separate CF fields or legacy `payload`) */
export type ContentfulToolPayload = {
  title: string;
  shortTitle: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  ogDescription: string;
  keywords: string[];
  h1Text: string;
  intro: string;
  howToUseSteps: string[];
  faqs: { question: string; answer: string }[];
  content: Tool["content"];
  canonicalUrl?: string;
  seoNoIndex?: boolean;
};

type ContentfulEntry = {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, Record<string, unknown>>;
};

type ContentfulEntriesResponse = {
  items: ContentfulEntry[];
  total?: number;
};

function getLocale(): "en-US" {
  return "en-US";
}

function pick<T>(loc: "en-US", f?: Record<string, T> | T): T | undefined {
  if (f == null) return undefined;
  // CDA sometimes returns a scalar (e.g. string) instead of { "en-US": "…" }.
  // Object.values("foo") is ['f','o','o'] — never use [0] on a string.
  if (typeof f === "string" || typeof f === "number" || typeof f === "boolean") {
    return f as T;
  }
  if (typeof f !== "object") return f as T;
  const rec = f as Record<string, T>;
  return rec[loc] ?? rec["en-US"] ?? (Object.values(rec)[0] as T | undefined);
}

export type ContentfulToolPage = {
  id: string;
  codeKey: string;
  urlSlug: string;
  /** Always resolved (from flat fields or legacy payload) for app code */
  payload: ContentfulToolPayload;
};

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x.trim() : String(x).trim()))
      .filter(Boolean);
  }
  return [];
}

/**
 * Contentful "Object" JSON for FAQs may be an array, a stringified JSON, a map of rows,
 * `{ "items": [...] }`, or a single `{ "question", "answer" }`. `asFaqList` only saw
 * arrays, so a normal Object shape from the editor often parsed as [] and merge fell back
 * to `tools.ts` (intro worked because those fields are proper strings).
 */
function coerceFaqFieldToArray(raw: unknown): unknown {
  if (raw == null) return raw;
  let v: unknown = raw;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    try {
      v = JSON.parse(t) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(v)) return v;
  if (typeof v !== "object") return raw;
  const o = v as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.faqs)) return o.faqs;
  if ("question" in o && "answer" in o) return [o];
  const values = Object.values(o);
  if (
    values.length > 0 &&
    values.every((x) => x !== null && typeof x === "object" && !Array.isArray(x))
  ) {
    return values;
  }
  return raw;
}

function asFaqList(v: unknown): { question: string; answer: string }[] {
  const normalized = coerceFaqFieldToArray(v);
  if (!Array.isArray(normalized)) return [];
  return normalized
    .map((row) => {
      if (row && typeof row === "object" && "question" in row && "answer" in row) {
        const o = row as { question: unknown; answer: unknown };
        return {
          question: String(o.question ?? ""),
          answer: String(o.answer ?? ""),
        };
      }
      return null;
    })
    .filter(
      (x): x is { question: string; answer: string } =>
        x !== null && (x.question.length > 0 || x.answer.length > 0),
    );
}

function asContent(
  v: unknown,
  fallback: Tool["content"] | null,
): Tool["content"] {
  if (v && typeof v === "object" && "whatIs" in v) {
    const c = v as Record<string, unknown>;
    if (
      typeof c.whatIs === "string" &&
      typeof c.howItWorks === "string" &&
      typeof c.formula === "string" &&
      typeof c.formulaExplanation === "string" &&
      typeof c.example === "string" &&
      Array.isArray(c.tips) &&
      Array.isArray(c.useCases)
    ) {
      return {
        whatIs: c.whatIs,
        howItWorks: c.howItWorks,
        formula: c.formula,
        formulaExplanation: c.formulaExplanation,
        example: c.example,
        tips: c.tips.map((t) => String(t)),
        useCases: c.useCases.map((u) => String(u)),
      };
    }
  }
  if (fallback) return fallback;
  return {
    whatIs: "",
    howItWorks: "",
    formula: "",
    formulaExplanation: "",
    example: "",
    tips: [],
    useCases: [],
  };
}

/**
 * New model: top-level `seoTitle`, `metaDescription`, etc.
 * Legacy: single `payload` object (optional).
 */
function buildPayloadFromEntry(
  f: ContentfulEntry["fields"],
  locale: "en-US",
): ContentfulToolPayload | null {
  const title = pick(locale, f.title as Record<string, string> | undefined)?.trim();
  const seoT = pick(locale, f.seoTitle as Record<string, string> | undefined)?.trim();
  const meta = pick(
    locale,
    f.metaDescription as Record<string, string> | undefined,
  )?.trim();
  const hasFlat = Boolean(
    title && (seoT || meta),
  );
  if (hasFlat && title) {
    const metaDescription = meta ?? "";
    const st = seoT || title;
    const og =
      pick(locale, f.ogDescription as Record<string, string> | undefined)?.trim() ?? "";
    const h1 =
      pick(locale, f.h1Text as Record<string, string> | undefined)?.trim() || title;
    const intro =
      (pick(locale, f.intro as Record<string, string> | undefined) as string) ?? "";
    const description =
      (pick(locale, f.description as Record<string, string> | undefined) as string) ?? "";
    const shortTitle =
      (pick(locale, f.shortTitle as Record<string, string> | undefined) as string) || title;
    const keywordsRaw = pick(
      locale,
      f.keywords as Record<string, unknown> | undefined,
    );
    const keywords = asStringArray(keywordsRaw);
    const stepsRaw = pick(
      locale,
      f.howToUseSteps as Record<string, unknown> | undefined,
    );
    let howToUseSteps = asStringArray(stepsRaw);
    if (howToUseSteps.length === 0 && stepsRaw && typeof stepsRaw === "object") {
      const o = stepsRaw as { steps?: unknown };
      if (Array.isArray(o.steps)) howToUseSteps = asStringArray(o.steps);
    }
    const faqRaw = pick(
      locale,
      f.faqs as Record<string, unknown> | string | undefined,
    ) as unknown;
    const withItems = (faqRaw as { items?: unknown } | null)?.items ?? faqRaw;
    const faqs = asFaqList(withItems);
    const contentRaw = pick(
      locale,
      f.content as Record<string, unknown> | undefined,
    );
    const can = pick(
      locale,
      f.canonicalUrl as Record<string, string> | undefined,
    )?.trim();
    const noIdx = pick(
      locale,
      f.seoNoIndex as Record<string, boolean> | undefined,
    );
    return {
      title,
      shortTitle,
      description,
      seoTitle: st,
      seoDescription: metaDescription,
      ogDescription: og || metaDescription,
      keywords,
      h1Text: h1,
      intro: String(intro).trim() || description,
      howToUseSteps,
      faqs,
      content: asContent(contentRaw, null),
      canonicalUrl: can || undefined,
      seoNoIndex: Boolean(noIdx),
    };
  }
  const rawPayload = pick(
    locale,
    f.payload as Record<string, ContentfulToolPayload> | undefined,
  ) as ContentfulToolPayload | undefined;
  if (rawPayload && rawPayload.seoTitle && rawPayload.title) {
    return {
      ...rawPayload,
      faqs: asFaqList(
        coerceFaqFieldToArray(rawPayload.faqs as unknown) ?? (rawPayload.faqs as unknown),
      ),
    };
  }
  return null;
}

function mapEntry(
  item: ContentfulEntry | undefined,
  locale: "en-US",
): ContentfulToolPage | null {
  if (!item) return null;
  const f = item.fields;
  const codeKey = pick(locale, f.codeKey as Record<string, string> | undefined);
  const urlSlug = pick(locale, f.urlSlug as Record<string, string> | undefined);
  const payload = buildPayloadFromEntry(f, locale);
  if (!codeKey || !urlSlug || !payload) return null;
  return { id: item.sys.id, codeKey, urlSlug, payload };
}

async function cda(query: string): Promise<ContentfulEntriesResponse> {
  if (!SPACE_ID || !DELIVERY_TOKEN) {
    return { items: [] };
  }
  const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/entries?${query}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
    ...contentfulFetchOptions("contentful-tool"),
  });
  if (!res.ok) {
    throw new Error(`Contentful tool request failed (${res.status})`);
  }
  return (await res.json()) as ContentfulEntriesResponse;
}

export async function getToolPageByUrlSlug(
  urlSlug: string,
): Promise<ContentfulToolPage | null> {
  const loc = getLocale();
  const q = new URLSearchParams();
  q.set("content_type", CONTENT_TYPE);
  q.set("fields.urlSlug", urlSlug);
  q.set("limit", "1");
  q.set("include", "0");
  q.set("locale", "en-US");
  const data = await cda(q.toString());
  return mapEntry(data.items[0], loc);
}

export async function getAllContentfulToolUrlSlugs(): Promise<string[]> {
  const loc = getLocale();
  const q = new URLSearchParams();
  q.set("content_type", CONTENT_TYPE);
  q.set("limit", "200");
  q.set("include", "0");
  q.set("locale", "en-US");
  const data = await cda(q.toString());
  const slugs: string[] = [];
  for (const item of data.items) {
    const p = mapEntry(item, loc);
    if (p?.urlSlug) slugs.push(p.urlSlug);
  }
  return slugs;
}

/**
 * Merges static tool from code (category, icon, related, map key) with Contentful.
 */
export function mergeToolWithContentful(
  base: Tool,
  page: ContentfulToolPage,
): Tool {
  const p = page.payload;
  const cmsFaqs = asFaqList(
    coerceFaqFieldToArray(p.faqs as unknown) ?? (p.faqs as unknown),
  );
  return {
    ...base,
    slug: page.urlSlug,
    title: p.title,
    shortTitle: p.shortTitle,
    description: p.description,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    ogDescription: p.ogDescription,
    keywords: p.keywords.length ? p.keywords : base.keywords,
    faqs: cmsFaqs.length > 0 ? cmsFaqs : base.faqs,
    content: p.content && String(p.content.whatIs ?? "").trim()
      ? p.content
      : base.content,
  };
}

export function getPageSeoForTool(
  tool: Tool,
  cms?: ContentfulToolPage,
): { h1Text: string; intro: string; howToUseSteps: string[] } {
  if (cms) {
    const p = cms.payload;
    return {
      h1Text: p.h1Text,
      intro: p.intro,
      howToUseSteps: p.howToUseSteps,
    };
  }
  const built = buildToolPageOnPageSeo(tool);
  return {
    h1Text: built.h1Text,
    intro: built.introHtml,
    howToUseSteps: built.howToUseSteps,
  };
}

export function contentfulToolCanonical(
  page: ContentfulToolPage,
): { canonical: string; path: string } {
  const p = page.payload;
  if (p.canonicalUrl) {
    const c = p.canonicalUrl.trim();
    if (c.startsWith("http")) {
      try {
        return { canonical: c, path: new URL(c).pathname };
      } catch {
        /* invalid absolute URL in CMS; fall back to /tools urlSlug */
      }
    }
    if (c.startsWith("/")) {
      return { canonical: `${SITE_URL.replace(/\/$/, "")}${c}`, path: c };
    }
  }
  const path = `/tools/${page.urlSlug}`;
  return { canonical: `${SITE_URL.replace(/\/$/, "")}${path}`, path };
}

export function isContentfulConfiguredForTools(): boolean {
  return Boolean(SPACE_ID && DELIVERY_TOKEN);
}

/**
 * Match static `Tool` to a `toolPage` by CMS `codeKey` first; if that misses (typos, drift),
 * use the public URL path (`routeSlug` or `urlSlug`) so a valid /tools/… route does not 404.
 */
export function resolveToolForPage(
  routeSlug: string,
  page: ContentfulToolPage | null,
): Tool | undefined {
  if (!page) return getToolBySlug(routeSlug);
  return (
    getToolBySlug(page.codeKey) ?? getToolBySlug(routeSlug) ?? getToolBySlug(page.urlSlug)
  );
}

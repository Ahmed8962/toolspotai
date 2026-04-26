/**
 * Creates/updates `toolPage` in Contentful: separate SEO + copy fields; JSON for FAQs + long sections.
 *
 * .env.local: CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_TOKEN
 * Run: npm run contentful:seed-tools
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tools } from "../src/data/tools";
import { buildToolPageOnPageSeo } from "../src/lib/tool-page-seo";

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (k) process.env[k] = v;
  }
}
loadEnvLocal();

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const CMA = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const CMA_BASE = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV}`;

const LOCALE = "en-US" as const;
const TYPE_ID = "toolPage" as const;

type Sys = { id: string; version: number; type: string };
type Cma = { sys: Sys; fields?: object; name?: string; displayField?: string };

/** Content type field defs (CMA v1) — keep `payload` optional for old entries until re-seeded. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOL_PAGE_FIELD_DEFS: any[] = [
  { id: "codeKey", name: "Code key (links to app)", type: "Symbol", required: true, localized: false },
  { id: "urlSlug", name: "URL slug (public path)", type: "Symbol", required: true, localized: false, validations: [{ unique: true }] },
  { id: "title", name: "Display: Tool title", type: "Symbol", required: false, localized: false },
  { id: "shortTitle", name: "Display: Short label", type: "Symbol", required: false, localized: false },
  { id: "description", name: "Display: One-line description", type: "Text", required: false, localized: false },
  { id: "seoTitle", name: "SEO: Page title (meta)", type: "Symbol", required: false, localized: false, validations: [{ size: { max: 200 } }] },
  { id: "metaDescription", name: "SEO: Meta description", type: "Text", required: false, localized: false, validations: [{ size: { max: 500 } }] },
  { id: "ogDescription", name: "SEO: Open Graph description", type: "Text", required: false, localized: false },
  { id: "canonicalUrl", name: "SEO: Canonical (optional override)", type: "Symbol", required: false, localized: false },
  {
    id: "seoNoIndex",
    name: "Hide from Google? (No = can rank, Yes = removed)",
    type: "Boolean",
    required: false,
    localized: false,
  },
  { id: "h1Text", name: "On-page: H1", type: "Symbol", required: false, localized: false },
  { id: "intro", name: "On-page: Intro paragraph", type: "Text", required: false, localized: false },
  { id: "keywords", name: "SEO: Keywords (list, one per item)", type: "Array", required: false, localized: false, items: { type: "Symbol" } },
  { id: "howToUseSteps", name: "On-page: How-to steps (one per line)", type: "Array", required: false, localized: false, items: { type: "Symbol" } },
  { id: "faqs", name: "FAQs (JSON array: question + answer)", type: "Object", required: false, localized: false },
  { id: "content", name: "Body sections (JSON: whatIs, howItWorks, …)", type: "Object", required: false, localized: false },
  { id: "payload", name: "Legacy full JSON (optional, deprecated)", type: "Object", required: false, localized: false },
];

const CT_DEF = {
  name: "Tool page",
  displayField: "codeKey" as const,
  fields: TOOL_PAGE_FIELD_DEFS,
};

function buildCmaFields(t: (typeof tools)[0]) {
  const page = buildToolPageOnPageSeo(t);
  return {
    codeKey: { [LOCALE]: t.slug },
    urlSlug: { [LOCALE]: t.slug },
    title: { [LOCALE]: t.title },
    shortTitle: { [LOCALE]: t.shortTitle },
    description: { [LOCALE]: t.description },
    seoTitle: { [LOCALE]: t.seoTitle },
    metaDescription: { [LOCALE]: t.seoDescription },
    ogDescription: { [LOCALE]: t.ogDescription },
    // false = “No” in UI = do not set noindex = pages can be indexed; never true for public tools
    seoNoIndex: { [LOCALE]: false },
    h1Text: { [LOCALE]: page.h1Text },
    intro: { [LOCALE]: page.introHtml },
    keywords: { [LOCALE]: t.keywords },
    howToUseSteps: { [LOCALE]: page.howToUseSteps },
    faqs: { [LOCALE]: t.faqs },
    content: { [LOCALE]: t.content as unknown as Record<string, unknown> },
  };
}

async function cma(
  method: "GET" | "PUT" | "POST" | "DELETE",
  path: string,
  body?: object,
  version?: number,
  newEntryContentTypeId?: string,
) {
  if (!CMA) throw new Error("CONTENTFUL_MANAGEMENT_TOKEN is not set");
  if (!SPACE_ID) throw new Error("CONTENTFUL_SPACE_ID is not set");
  const headers: Record<string, string> = { Authorization: `Bearer ${CMA}` };
  if (body !== undefined) {
    headers["Content-Type"] = "application/vnd.contentful.management.v1+json";
  }
  if (version !== undefined) headers["X-Contentful-Version"] = String(version);
  if (method === "POST" && path === "/entries" && newEntryContentTypeId) {
    headers["X-Contentful-Content-Type"] = newEntryContentTypeId;
  }
  const res = await fetch(`${CMA_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let extra = "";
    try {
      const j = JSON.parse(text) as { message?: string; sys?: { id?: string } };
      if (j.sys?.id === "OrganizationAccessGrantRequired" || j.message === "Access token invalid") {
        extra =
          "\n\n→ CMA: Contentful → Settings → CMA tokens → Authorize. Or use space Content management API token in API keys.";
      }
    } catch {
      /* ignore */
    }
    throw new Error(
      `CMA ${method} ${path} → ${res.status}: ${text.slice(0, 800)}${extra}`,
    );
  }
  if (!text) return null;
  return JSON.parse(text) as Cma;
}

const CMA_RETRIABLE = new Set([429, 500, 502, 503, 504]);

function cmaErrorStatus(e: Error): number | null {
  const m = /→ (\d{3}):/.exec(e.message);
  return m ? Number(m[1]) : null;
}

/** Retries for transient CMA / infrastructure errors (5xx, rate limit). */
async function cmaWithRetry(
  method: "GET" | "PUT" | "POST" | "DELETE",
  path: string,
  body?: object,
  version?: number,
  newEntryContentTypeId?: string,
) {
  const maxAttempts = 4;
  let last: Error;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await cma(method, path, body, version, newEntryContentTypeId);
    } catch (e) {
      last = e as Error;
      const st = cmaErrorStatus(last);
      if (st == null || !CMA_RETRIABLE.has(st) || attempt === maxAttempts) throw last;
      const delay = Math.min(2000 * 2 ** (attempt - 1), 16_000);
      // eslint-disable-next-line no-console
      console.warn(`CMA ${method} ${st} (attempt ${attempt}/${maxAttempts}), retry in ${delay}ms...`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last!;
}

async function ensureContentType() {
  let current: (Cma & { fields: object[] }) | null = null;
  try {
    current = (await cma("GET", `/content_types/${TYPE_ID}`)) as Cma & { fields: object[] };
  } catch {
    current = null;
  }
  if (current?.sys) {
    const def = { name: "Tool page", displayField: "codeKey", fields: TOOL_PAGE_FIELD_DEFS } as object;
    const v = (await cma("PUT", `/content_types/${TYPE_ID}`, def, current.sys.version)) as Cma;
    await cma("PUT", `/content_types/${TYPE_ID}/published`, undefined, v.sys.version);
    console.log("Content type", TYPE_ID, "updated and published.");
  } else {
    const r = (await cma("PUT", `/content_types/${TYPE_ID}`, { sys: { id: TYPE_ID }, ...CT_DEF } as object)) as Cma;
    await cma("PUT", `/content_types/${TYPE_ID}/published`, undefined, r.sys.version);
    console.log("Content type", TYPE_ID, "created and published.");
  }
}

type Entry = Cma & { fields: Record<string, Record<string, unknown>> };
type ListRes = { items: Entry[] };

async function listEntriesByType(): Promise<Entry[]> {
  const u = new URL(`${CMA_BASE}/entries`);
  u.searchParams.set("content_type", TYPE_ID);
  u.searchParams.set("limit", "200");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
  if (!res.ok) throw new Error(`list entries: ${res.status} ${await res.text()}`);
  return ((await res.json()) as ListRes).items;
}

function codeKey(f: Record<string, Record<string, unknown>>): string | null {
  const c = f.codeKey?.[LOCALE];
  return typeof c === "string" ? c : null;
}

function buildByCodeKeyMap(items: Entry[]): Map<string, { id: string; version: number }> {
  const m = new Map<string, { id: string; version: number }>();
  for (const it of items) {
    const k = codeKey(it.fields);
    if (k) m.set(k, { id: it.sys.id, version: it.sys.version });
  }
  return m;
}

async function upsertEntry(
  t: (typeof tools)[0],
  byCode: Map<string, { id: string; version: number }>,
) {
  const fields = buildCmaFields(t);
  const found = byCode.get(t.slug);
  if (found) {
    const u = (await cmaWithRetry("PUT", `/entries/${found.id}`, { fields } as object, found.version)) as Cma;
    await cmaWithRetry("PUT", `/entries/${u.sys.id}/published`, undefined, u.sys.version);
  } else {
    const c = (await cmaWithRetry("POST", "/entries", { fields } as object, undefined, TYPE_ID)) as Cma;
    await cmaWithRetry("PUT", `/entries/${c.sys.id}/published`, undefined, c.sys.version);
  }
  console.log("Published", t.slug);
}

async function main() {
  if (!CMA || !CMA.trim()) {
    console.error(
      "Missing CONTENTFUL_MANAGEMENT_TOKEN. In Contentful: Settings → CMA tokens → create a personal access token.\n" +
        "Add to .env.local: CONTENTFUL_MANAGEMENT_TOKEN=your_token_here\n" +
        "Then run: npm run contentful:seed-tools",
    );
    process.exit(1);
  }
  await ensureContentType();
  const byCode = buildByCodeKeyMap(await listEntriesByType());
  const failed: string[] = [];
  for (const t of tools) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await upsertEntry(t, byCode);
    } catch (e) {
      console.error("Failed on", t.slug, e);
      failed.push(t.slug);
    }
  }
  if (failed.length) {
    console.error("Finished with errors. Failed slugs (" + failed.length + "):", failed.join(", "));
    process.exit(1);
  }
  console.log("Done.", tools.length, "tools.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

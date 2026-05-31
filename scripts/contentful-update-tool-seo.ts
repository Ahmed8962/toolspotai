/**
 * Updates seoTitle + metaDescription on existing toolPage entries in Contentful.
 *
 * .env.local:
 *   CONTENTFUL_SPACE_ID=zjkm0acoyhy3
 *   CONTENTFUL_ENVIRONMENT=master
 *   CONTENTFUL_MANAGEMENT_TOKEN=...  (Contentful → Settings → CMA tokens)
 *
 * Run: npm run contentful:update-tool-seo
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TOOL_SEO_UPDATES } from "./tool-seo-updates";

function loadEnvLocal() {
  for (const name of [".env.local", ".env.production.local"]) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (k && !process.env[k]) process.env[k] = v;
    }
  }
}
loadEnvLocal();

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID?.trim();
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const CMA = process.env.CONTENTFUL_MANAGEMENT_TOKEN?.trim();
const CMA_BASE = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV}`;
const LOCALE = "en-US" as const;
const TYPE_ID = "toolPage" as const;

type Sys = { id: string; version: number };
type Entry = { sys: Sys; fields: Record<string, Record<string, unknown>> };
type ListRes = { items: Entry[]; total: number };

function pickLocale(
  f: Record<string, unknown> | undefined,
): string | undefined {
  if (f == null) return undefined;
  if (typeof f === "string") return f;
  const rec = f as Record<string, string>;
  return rec[LOCALE] ?? rec["en-US"] ?? Object.values(rec)[0];
}

async function cma(
  method: "GET" | "PUT",
  path: string,
  body?: object,
  version?: number,
) {
  if (!CMA) throw new Error("CONTENTFUL_MANAGEMENT_TOKEN is not set");
  if (!SPACE_ID) throw new Error("CONTENTFUL_SPACE_ID is not set");
  const headers: Record<string, string> = { Authorization: `Bearer ${CMA}` };
  if (body !== undefined) {
    headers["Content-Type"] = "application/vnd.contentful.management.v1+json";
  }
  if (version !== undefined) headers["X-Contentful-Version"] = String(version);
  const res = await fetch(`${CMA_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`CMA ${method} ${path} → ${res.status}: ${text.slice(0, 600)}`);
  }
  return text ? (JSON.parse(text) as Entry) : null;
}

async function listAllToolPages(): Promise<Entry[]> {
  const items: Entry[] = [];
  let skip = 0;
  const limit = 100;
  for (;;) {
    const u = new URL(`${CMA_BASE}/entries`);
    u.searchParams.set("content_type", TYPE_ID);
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("skip", String(skip));
    const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
    if (!res.ok) throw new Error(`list entries: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as ListRes;
    items.push(...data.items);
    if (items.length >= data.total) break;
    skip += limit;
  }
  return items;
}

function slugFromEntry(entry: Entry): string | null {
  const codeKey = pickLocale(entry.fields.codeKey);
  const urlSlug = pickLocale(entry.fields.urlSlug);
  return (urlSlug || codeKey || null)?.trim() || null;
}

async function main() {
  if (!CMA) {
    console.error(
      "Missing CONTENTFUL_MANAGEMENT_TOKEN.\n" +
        "Contentful → Settings → CMA tokens → create token, then add to .env.local\n" +
        "Also set CONTENTFUL_SPACE_ID=zjkm0acoyhy3",
    );
    process.exit(1);
  }
  if (!SPACE_ID) {
    console.error("Missing CONTENTFUL_SPACE_ID (toolspot space: zjkm0acoyhy3)");
    process.exit(1);
  }

  const expected = Object.keys(TOOL_SEO_UPDATES);
  const entries = await listAllToolPages();
  const bySlug = new Map<string, Entry>();
  for (const e of entries) {
    const slug = slugFromEntry(e);
    if (slug) bySlug.set(slug, e);
  }

  const updated: string[] = [];
  const missing: string[] = [];
  const failed: string[] = [];

  for (const slug of expected) {
    const seo = TOOL_SEO_UPDATES[slug];
    const entry = bySlug.get(slug);
    if (!entry) {
      missing.push(slug);
      continue;
    }
    try {
      const fields = { ...entry.fields };
      fields.seoTitle = { ...((fields.seoTitle as object) ?? {}), [LOCALE]: seo.seoTitle };
      fields.metaDescription = {
        ...((fields.metaDescription as object) ?? {}),
        [LOCALE]: seo.metaDescription,
      };
      const saved = await cma("PUT", `/entries/${entry.sys.id}`, { fields }, entry.sys.version);
      if (!saved) throw new Error("empty response");
      await cma("PUT", `/entries/${saved.sys.id}/published`, undefined, saved.sys.version);
      updated.push(slug);
      console.log("✓", slug);
    } catch (e) {
      console.error("✗", slug, e);
      failed.push(slug);
    }
  }

  console.log("\n--- Summary ---");
  console.log("Updated:", updated.length);
  console.log("Expected:", expected.length);
  console.log("CMS entries found:", entries.length);
  if (missing.length) console.log("Missing in CMS:", missing.join(", "));
  if (failed.length) {
    console.log("Failed:", failed.join(", "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

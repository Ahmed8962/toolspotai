/**
 * Fix blog post canonicalUrl fields in Contentful to match each slug.
 * Run: npx tsx scripts/contentful-fix-blog-canonicals.ts
 */
import { blogPostUrl } from "../src/lib/contentful-blog";
import { loadEnvLocal } from "./contentful-blog-publish-shared";

loadEnvLocal();

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const CMA = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const CMA_BASE = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV}`;
const LOCALE = "en-US";
const TYPE_ID = "blogPost";

type Entry = {
  sys: { id: string; version: number; publishedVersion?: number };
  fields: Record<string, Record<string, string> | unknown>;
};

function pickLocale<T>(v: Record<string, T> | undefined): T | undefined {
  if (!v) return undefined;
  return v[LOCALE] ?? Object.values(v)[0];
}

async function cma(
  method: "GET" | "PUT",
  path: string,
  body?: object,
  version?: number,
): Promise<Entry | null> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${CMA!}`,
    ...(body ? { "Content-Type": "application/vnd.contentful.management.v1+json" } : {}),
    ...(version !== undefined ? { "X-Contentful-Version": String(version) } : {}),
  };
  const res = await fetch(`${CMA_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  return text ? (JSON.parse(text) as Entry) : null;
}

async function main() {
  if (!CMA || !SPACE_ID) {
    console.error("Missing CONTENTFUL credentials in .env.local");
    process.exit(1);
  }

  const u = new URL(`${CMA_BASE}/entries`);
  u.searchParams.set("content_type", TYPE_ID);
  u.searchParams.set("limit", "200");

  const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
  const { items } = (await res.json()) as { items: Entry[] };

  let fixed = 0;
  for (const entry of items) {
    const slug = pickLocale(entry.fields.slug as Record<string, string> | undefined);
    if (!slug) continue;
    const expected = blogPostUrl(slug);
    const current = pickLocale(
      entry.fields.canonicalUrl as Record<string, string> | undefined,
    );
    if (current === expected) continue;

    const fields = structuredClone(entry.fields) as Entry["fields"];
    fields.canonicalUrl = { [LOCALE]: expected };

    console.log(`Fixing ${slug}`);
    if (current) console.log(`  was: ${current}`);
    console.log(`  now: ${expected}`);

    const updated = await cma("PUT", `/entries/${entry.sys.id}`, { fields }, entry.sys.version);
    if (updated?.sys.publishedVersion) {
      await cma("PUT", `/entries/${updated.sys.id}/published`, undefined, updated.sys.version);
    }
    fixed++;
  }

  console.log(`\nDone. Fixed ${fixed} entries.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Publish draft blog posts whose `publishedAt` has passed.
 * Run manually or on a schedule (e.g. daily cron / GitHub Action).
 *
 *   npm run contentful:publish-due-blog
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isBlogPostLive } from "../src/lib/contentful-blog";

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
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (k && !process.env[k]) process.env[k] = v;
    }
  }
}

loadEnvLocal();

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const CMA = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const CMA_BASE = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV}`;
const LOCALE = "en-US";
const TYPE_ID = "blogPost";

type Entry = {
  sys: { id: string; version: number; publishedVersion?: number };
  fields: {
    slug?: Record<string, string>;
    title?: Record<string, string>;
    publishedAt?: Record<string, string>;
  };
};

function pickLocale<T>(v: Record<string, T> | undefined): T | undefined {
  if (!v) return undefined;
  return v[LOCALE] ?? Object.values(v)[0];
}

async function cma(
  method: "GET" | "PUT",
  path: string,
  version?: number,
): Promise<Entry | null> {
  const headers: Record<string, string> = { Authorization: `Bearer ${CMA!}` };
  if (version !== undefined) headers["X-Contentful-Version"] = String(version);
  const res = await fetch(`${CMA_BASE}${path}`, { method, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  if (!text) return null;
  return JSON.parse(text) as Entry;
}

async function main() {
  if (!CMA?.trim() || !SPACE_ID?.trim()) {
    console.error("Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN in .env.local");
    process.exit(1);
  }

  const now = new Date();
  const u = new URL(`${CMA_BASE}/entries`);
  u.searchParams.set("content_type", TYPE_ID);
  u.searchParams.set("limit", "200");

  const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
  if (!res.ok) {
    console.error(`Failed to list entries: ${res.status}`);
    process.exit(1);
  }

  const { items } = (await res.json()) as { items: Entry[] };
  let published = 0;
  let skipped = 0;

  for (const entry of items) {
    const slug = pickLocale(entry.fields.slug);
    const title = pickLocale(entry.fields.title);
    const publishedAt = pickLocale(entry.fields.publishedAt);
    if (!slug || !publishedAt) continue;

    const isPublished = Boolean(entry.sys.publishedVersion);
    const isDue = isBlogPostLive(publishedAt, now);

    if (isPublished || !isDue) {
      if (!isPublished && !isDue) {
        console.log(`  Waiting: ${slug} (due ${publishedAt})`);
      }
      skipped++;
      continue;
    }

    console.log(`Publishing: ${title ?? slug} (due ${publishedAt})`);
    await cma("PUT", `/entries/${entry.sys.id}/published`, entry.sys.version);
    published++;
  }

  console.log(`\nDone. Published ${published}, skipped ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

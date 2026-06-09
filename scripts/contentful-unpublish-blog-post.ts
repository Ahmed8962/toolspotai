/**
 * Unpublish a blog post in Contentful (removes from Delivery API immediately).
 * Run: npx tsx scripts/contentful-unpublish-blog-post.ts <slug>
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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
  fields: { slug?: Record<string, string>; publishedAt?: Record<string, string> };
};

async function cmaGet(path: string): Promise<Entry> {
  const res = await fetch(`${CMA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${CMA}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as Entry;
}

async function cmaDelete(path: string, version: number): Promise<void> {
  const res = await fetch(`${CMA_BASE}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${CMA}`,
      "X-Contentful-Version": String(version),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  }
}

async function findEntryBySlug(slug: string): Promise<Entry | null> {
  const u = new URL(`${CMA_BASE}/entries`);
  u.searchParams.set("content_type", TYPE_ID);
  u.searchParams.set("fields.slug", slug);
  u.searchParams.set("limit", "1");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
  if (!res.ok) return null;
  const j = (await res.json()) as { items: Entry[] };
  return j.items[0] ?? null;
}

async function main() {
  const slug = process.argv[2];
  if (!slug?.trim()) {
    console.error("Usage: npx tsx scripts/contentful-unpublish-blog-post.ts <slug>");
    process.exit(1);
  }
  if (!CMA?.trim() || !SPACE_ID?.trim()) {
    console.error("Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN in .env.local");
    process.exit(1);
  }

  const entry = await findEntryBySlug(slug);
  if (!entry) {
    console.error(`No blogPost entry found for slug: ${slug}`);
    process.exit(1);
  }

  const publishedAt = entry.fields.publishedAt?.[LOCALE] ?? Object.values(entry.fields.publishedAt ?? {})[0];
  console.log(`Entry ${entry.sys.id} (${slug})`);
  console.log(`  publishedAt: ${publishedAt ?? "(not set)"}`);
  console.log(`  publishedVersion: ${entry.sys.publishedVersion ?? "draft only"}`);

  if (!entry.sys.publishedVersion) {
    console.log("Already a draft — nothing to unpublish.");
    return;
  }

  await cmaDelete(`/entries/${entry.sys.id}/published`, entry.sys.version);
  const fresh = await cmaGet(`/entries/${entry.sys.id}`);
  console.log(`Unpublished. Now draft (version ${fresh.sys.version}).`);
  if (publishedAt) {
    console.log(`Run contentful:publish-due-blog on or after ${publishedAt} to go live.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

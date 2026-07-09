/**
 * Remap blog post Rich Text headings saved under the old renderer bug:
 *   heading-3 → heading-2, heading-4 → heading-3
 *
 * .env.local: CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_TOKEN
 *
 * Only updates entries where h2 === 0 && h3 > 0 (all section headings wrongly saved as h3).
 * Skips entries that already have h2 nodes and explicit slugs listed below.
 *
 * Dry run (default):
 *   npm run contentful:fix-blog-headings
 *
 * Write + publish:
 *   DRY_RUN=false npm run contentful:fix-blog-headings
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
const TYPE_ID = "blogPost" as const;
const DRY_RUN = process.env.DRY_RUN !== "false";

/** Never bulk-remap these (intentional h2+h3 or manual review). */
const SKIP_SLUGS = new Set([
  "what-is-a-good-profit-margin",
  "how-to-calculate-body-fat-percentage",
  "what-is-vat-how-is-it-calculated",
  "best-ai-tools-2026",
]);

function isEligibleForRemap(before: HeadingCounts, slug: string): boolean {
  if (SKIP_SLUGS.has(slug)) return false;
  return before["heading-2"] === 0 && before["heading-3"] > 0;
}

type HeadingCounts = { "heading-2": number; "heading-3": number; "heading-4": number };
type RichNode = { nodeType: string; content?: RichNode[] };

type Sys = { id: string; version: number; publishedVersion?: number };
type Entry = {
  sys: Sys;
  fields: Record<string, Record<string, unknown> | unknown>;
};

function pickLocale(f: unknown): unknown {
  if (f == null) return undefined;
  if (typeof f === "string") return f;
  const rec = f as Record<string, unknown>;
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

function countHeadings(
  node: RichNode | null | undefined,
  counts: HeadingCounts = { "heading-2": 0, "heading-3": 0, "heading-4": 0 },
): HeadingCounts {
  if (!node) return counts;
  if (node.nodeType in counts) counts[node.nodeType as keyof HeadingCounts]++;
  for (const child of node.content ?? []) {
    countHeadings(child, counts);
  }
  return counts;
}

function remapHeadings(node: RichNode): boolean {
  let changed = false;
  if (node.nodeType === "heading-4") {
    node.nodeType = "heading-3";
    changed = true;
  } else if (node.nodeType === "heading-3") {
    node.nodeType = "heading-2";
    changed = true;
  }
  for (const child of node.content ?? []) {
    if (remapHeadings(child)) changed = true;
  }
  return changed;
}

async function fetchAllBlogPosts(): Promise<Entry[]> {
  const all: Entry[] = [];
  let skip = 0;
  const limit = 100;
  for (;;) {
    const u = new URL(`${CMA_BASE}/entries`);
    u.searchParams.set("content_type", TYPE_ID);
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("skip", String(skip));
    const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
    if (!res.ok) throw new Error(`list entries: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { items: Entry[]; total: number };
    all.push(...data.items);
    if (all.length >= data.total) break;
    skip += limit;
  }
  return all;
}

async function updateAndPublish(entry: Entry, fields: Entry["fields"]) {
  const updated = await cma("PUT", `/entries/${entry.sys.id}`, { fields }, entry.sys.version);
  if (!updated) throw new Error("PUT entry returned empty");
  await cma("PUT", `/entries/${updated.sys.id}/published`, undefined, updated.sys.version);
}

async function main() {
  console.log("Contentful blog heading fix (toolspotai)");
  console.log(`  Space: ${SPACE_ID}`);
  console.log(`  Environment: ${ENV}`);
  console.log(`  Mode: ${DRY_RUN ? "DRY_RUN (no writes)" : "WRITE (update + publish)"}\n`);

  if (!CMA || !SPACE_ID) {
    console.error(
      "Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN in .env.local",
    );
    process.exit(1);
  }

  const entries = await fetchAllBlogPosts();
  const sorted = [...entries].sort((a, b) => {
    const da = String(pickLocale(a.fields.publishedAt) ?? "");
    const db = String(pickLocale(b.fields.publishedAt) ?? "");
    return da.localeCompare(db) || a.sys.id.localeCompare(b.sys.id);
  });

  console.log(`Found ${sorted.length} blogPost entries (locale: ${LOCALE})`);
  console.log(
    `  Filter: h2 === 0 && h3 > 0 (skip list: ${[...SKIP_SLUGS].join(", ")})\n`,
  );

  const toUpdate: {
    entry: Entry;
    slug: string;
    before: HeadingCounts;
    after: HeadingCounts;
  }[] = [];
  let skippedExplicit = 0;
  let skippedHasH2 = 0;
  let skippedNoMatch = 0;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const index = i + 1;
    const slug = String(pickLocale(entry.fields.slug) ?? "(no slug)");
    const title =
      String(pickLocale(entry.fields.title) ?? "") ||
      String(pickLocale(entry.fields.seoTitle) ?? "") ||
      "(no title)";
    const body = pickLocale(entry.fields.body) as RichNode | undefined;

    if (!body?.nodeType) {
      console.log(`#${index} [SKIP] ${slug} — no body\n`);
      continue;
    }

    const before = countHeadings(body);

    if (SKIP_SLUGS.has(slug)) {
      skippedExplicit++;
      console.log(
        `#${index} [SKIP explicit] ${slug}\n` +
          `      before: h2=${before["heading-2"]} h3=${before["heading-3"]} h4=${before["heading-4"]}\n`,
      );
      continue;
    }

    if (!isEligibleForRemap(before, slug)) {
      if (before["heading-2"] > 0) skippedHasH2++;
      else skippedNoMatch++;
      console.log(
        `#${index} [SKIP] ${slug}\n` +
          `      before: h2=${before["heading-2"]} h3=${before["heading-3"]} h4=${before["heading-4"]}\n`,
      );
      continue;
    }

    const bodyCopy = structuredClone(body) as RichNode;
    remapHeadings(bodyCopy);
    const after = countHeadings(bodyCopy);

    toUpdate.push({ entry, slug, before, after });
    console.log(
      `#${index} [WILL UPDATE] ${slug}\n` +
        `      title: ${title}\n` +
        `      before: h2=${before["heading-2"]} h3=${before["heading-3"]} h4=${before["heading-4"]}\n` +
        `      after:  h2=${after["heading-2"]} h3=${after["heading-3"]} h4=${after["heading-4"]}\n`,
    );
  }

  console.log("--- Summary ---");
  console.log(`  Eligible to update:     ${toUpdate.length}`);
  console.log(`  Skipped (explicit):     ${skippedExplicit}`);
  console.log(`  Skipped (has h2):       ${skippedHasH2}`);
  console.log(`  Skipped (other/no h3):  ${skippedNoMatch}`);

  if (DRY_RUN) {
    if (toUpdate.length) {
      console.log("\nDRY_RUN: no entries written. Re-run with DRY_RUN=false to apply.");
    }
    return;
  }

  if (!toUpdate.length) {
    console.log("\nNothing to write.");
    return;
  }

  console.log("\n--- Applying updates ---\n");

  let updated = 0;
  let failed = 0;

  for (const { entry, slug, before, after } of toUpdate) {
    const fields = structuredClone(entry.fields) as Entry["fields"];
    const body = pickLocale(fields.body) as RichNode;
    remapHeadings(body);
    (fields.body as Record<string, unknown>) = { [LOCALE]: body };

    try {
      await updateAndPublish(entry, fields);
      updated++;
      console.log(
        `${slug}\n` +
          `  before: h2=${before["heading-2"]} h3=${before["heading-3"]} h4=${before["heading-4"]}\n` +
          `  after:  h2=${after["heading-2"]} h3=${after["heading-3"]} h4=${after["heading-4"]}\n` +
          `  publish: success\n`,
      );
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(
        `${slug}\n` +
          `  before: h2=${before["heading-2"]} h3=${before["heading-3"]} h4=${before["heading-4"]}\n` +
          `  after:  (not saved)\n` +
          `  publish: failed — ${msg}\n`,
      );
    }
  }

  console.log("--- Done ---");
  console.log(`  Total updated and published: ${updated}`);
  if (failed) console.log(`  Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

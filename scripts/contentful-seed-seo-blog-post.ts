/**
 * Publishes one SEO-focused blog post about AI tools (all fields, Rich Text body, cover + OG image).
 * Run after: npm run contentful:seed-blog   (content type must exist)
 * Then:       npm run contentful:seed-blog-post
 *
 * Manual FAQs in the Contentful UI: copy the JSON from `data/blog-drafts/faqs-for-contentful.json`
 * into the blog post’s “FAQs (JSON)” object field (root shape: `{ "items": [ { "question", "answer" } ] }`).
 *
 * .env.local: CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_TOKEN
 * Optional: CONTENTFUL_BLOG_SEED_ASSET_URL - public https URL to an image (SVG/PNG) for cover+OG;
 *   default is the live site logo. Contentful fetches it (binary upload id is not used here).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildBestAiTools2026Body } from "./blog-body-best-ai-tools-2026";

const SITE = "https://toolspotai.com" as const;

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
/** Must be a public https?:// URL; Contentful validation rejects upload ids in this field. */
const BLOG_SEED_ASSET_URL =
  process.env.CONTENTFUL_BLOG_SEED_ASSET_URL?.trim() || "https://toolspotai.com/toolspotai-logo.svg";
const TYPE_ID = "blogPost" as const;
/** New post slug. */
const SLUG = "best-ai-tools-2026" as const;
/** Old post slugs removed from Contentful when the script runs (unpublish + delete). */
const SLUGS_TO_REMOVE = ["ai-tools-2026-guide-seo"] as const;

const SEO = {
  title: "Best AI Tools of 2026: Top Picks for Productivity, Creativity & Business",
  slug: SLUG,
  seoTitle: "Best AI Tools 2026: Productivity, Design, Coding & Business | ToolSpotAI",
  seoDescription:
    "Discover the best AI tools of 2026 for productivity, writing, design, coding, and business. Curated picks, key features, and who each tool is best for, so you can work smarter, not noisier.",
  excerpt:
    "Discover the best AI tools of 2026 for productivity, writing, design, coding, and business. Our curated list helps you find the right AI software to save time and work smarter.",
  focusKeyword: "best AI tools 2026",
  secondaryKeywords: [
    "top AI tools",
    "AI productivity tools",
    "AI tools for business",
    "free AI tools 2026",
    "AI writing tools",
    "AI design tools",
    "AI coding tools",
    "best AI software 2026",
    "AI tools list",
  ] as const,
} as const;

const TAGS = ["AI tools", "Productivity", "Technology", "2026"] as const;

/** Same JSON to paste in Contentful: `data/blog-drafts/faqs-for-contentful.json` (Object field: root `{ "items": [ { "question", "answer" } ] }`). */
const BLOG_FAQS_PATH = join(process.cwd(), "data/blog-drafts/faqs-for-contentful.json");
const BLOG_FAQS_SEED: { items: { question: string; answer: string }[] } = JSON.parse(
  readFileSync(BLOG_FAQS_PATH, "utf8"),
) as { items: { question: string; answer: string }[] };

const publishedAt = "2026-04-26T12:00:00.000Z";
const updatedAt = "2026-04-26T12:00:00.000Z";

type Cma = { sys: { id: string; version: number; type: string } };
type Entry = Cma & { fields: object };

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
    throw new Error(`CMA ${method} ${path} -> ${res.status}: ${text.slice(0, 2000)}`);
  }
  if (!text) return null;
  return JSON.parse(text) as Cma;
}

function assetNameFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname.split("/").filter(Boolean).pop() || "cover";
    return p.includes(".") ? p : `${p}.svg`;
  } catch {
    return "cover-image.svg";
  }
}

/**
 * Create + process + publish a media asset. Uses a public URL so `fields.file.*.upload` matches
 * Contentful's http(s) rule.
 */
async function uploadToAssetId(): Promise<string> {
  if (!/^https?:\/\//i.test(BLOG_SEED_ASSET_URL)) {
    throw new Error(
      `CONTENTFUL_BLOG_SEED_ASSET_URL must be an absolute http(s) URL, got: ${BLOG_SEED_ASSET_URL}`,
    );
  }
  const isSvg = /\.svg(\?|$)/i.test(BLOG_SEED_ASSET_URL) || BLOG_SEED_ASSET_URL.includes("svg");
  const contentType = isSvg ? "image/svg+xml" : "image/png";
  const fileName = assetNameFromUrl(BLOG_SEED_ASSET_URL);

  const createBody = {
    fields: {
      title: { [LOCALE]: "Best AI tools 2026 - cover and OG" },
      description: { [LOCALE]: "Featured and Open Graph image for the best AI tools 2026 guide." },
      file: {
        [LOCALE]: {
          contentType,
          fileName,
          upload: BLOG_SEED_ASSET_URL,
        },
      },
    },
  };
  // eslint-disable-next-line no-console
  console.log("Creating asset from URL:", BLOG_SEED_ASSET_URL);
  const created = (await cma("POST", "/assets", createBody)) as { sys: { id: string; version: number } };
  if (!created?.sys?.id) throw new Error("Asset create failed");
  const assetId = created.sys.id;
  let version = created.sys.version;

  await cma("PUT", `/assets/${assetId}/files/${encodeURIComponent(LOCALE)}/process`, undefined, version);

  for (let i = 0; i < 60; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 1500));
    // eslint-disable-next-line no-await-in-loop
    const a = (await cma("GET", `/assets/${assetId}`)) as {
      fields?: { file?: Record<string, { url?: string }> };
      sys: { version: number };
    };
    version = a.sys.version;
    if (a.fields?.file?.[LOCALE]?.url) {
      // eslint-disable-next-line no-await-in-loop
      await cma("PUT", `/assets/${assetId}/published`, undefined, version);
      return assetId;
    }
  }
  throw new Error("Asset still processing: fields.file[en-US].url never appeared. Retry the script in a minute.");
}

function linkField(id: string) {
  return { [LOCALE]: { sys: { type: "Link" as const, linkType: "Asset" as const, id } } };
}

function fieldSet(assetId: string) {
  return {
    title: { [LOCALE]: SEO.title },
    slug: { [LOCALE]: SEO.slug },
    excerpt: { [LOCALE]: SEO.excerpt },
    body: { [LOCALE]: buildBestAiTools2026Body() },
    coverImage: linkField(assetId),
    publishedAt: { [LOCALE]: publishedAt },
    updatedAt: { [LOCALE]: updatedAt },
    authorName: { [LOCALE]: "ToolSpot AI Team" },
    authorRole: { [LOCALE]: "Editorial" },
    tags: { [LOCALE]: [...TAGS] },
    featured: { [LOCALE]: true },
    readingMinutes: { [LOCALE]: 16 },
    seoTitle: { [LOCALE]: SEO.seoTitle },
    seoDescription: { [LOCALE]: SEO.seoDescription },
    canonicalUrl: { [LOCALE]: `${SITE}/blog/${SEO.slug}` },
    seoNoIndex: { [LOCALE]: false },
    focusKeyword: { [LOCALE]: SEO.focusKeyword },
    secondaryKeywords: { [LOCALE]: [...SEO.secondaryKeywords] },
    schemaType: { [LOCALE]: "BlogPosting" as const },
    ogImage: linkField(assetId),
    faqs: { [LOCALE]: BLOG_FAQS_SEED },
  };
}

function slugOfEntry(it: Entry): string | null {
  const f = it.fields as { slug?: Record<string, string> | string };
  return typeof f.slug === "string"
    ? f.slug
    : f.slug?.[LOCALE] ?? (f.slug ? (Object.values(f.slug)[0] as string) : null);
}

async function findEntryBySlugString(target: string): Promise<Entry | null> {
  const u = new URL(`${CMA_BASE}/entries`);
  u.searchParams.set("content_type", TYPE_ID);
  u.searchParams.set("limit", "200");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
  if (!res.ok) return null;
  const j = (await res.json()) as { items: Entry[] };
  for (const it of j.items) {
    if (slugOfEntry(it) === target) return it;
  }
  return null;
}

/** Unpublishes (if needed) and deletes a blog post entry. */
async function removeEntryBySlugIfExists(targetSlug: string) {
  const entry = await findEntryBySlugString(targetSlug);
  if (!entry) {
    // eslint-disable-next-line no-console
    console.log(`No entry to remove for slug: ${targetSlug}`);
    return;
  }
  const id = entry.sys.id;
  let e = (await cma("GET", `/entries/${id}`)) as Entry;
  let version = e.sys.version;
  // Unpublish when published; ignore failure if already draft
  try {
    await cma("DELETE", `/entries/${id}/published`, undefined, version);
  } catch {
    /* not published or already draft */
  }
  e = (await cma("GET", `/entries/${id}`)) as Entry;
  version = e.sys.version;
  await cma("DELETE", `/entries/${id}`, undefined, version);
  // eslint-disable-next-line no-console
  console.log(`Removed blog entry with slug: ${targetSlug}`);
}

async function main() {
  if (!CMA?.trim()) {
    console.error("Set CONTENTFUL_MANAGEMENT_TOKEN in .env.local, then: npm run contentful:seed-blog-post");
    process.exit(1);
  }
  for (const oldSlug of SLUGS_TO_REMOVE) {
    // eslint-disable-next-line no-await-in-loop
    await removeEntryBySlugIfExists(oldSlug);
  }
  // eslint-disable-next-line no-console
  console.log("Uploading / linking cover + OG image...");
  const assetId = await uploadToAssetId();
  const fields = fieldSet(assetId) as object;

  const existing = await findEntryBySlugString(SLUG);
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Updating existing entry", existing.sys.id);
    const u = (await cma(
      "PUT",
      `/entries/${existing.sys.id}`,
      { fields } as object,
      existing.sys.version,
    )) as Entry;
    await cma("PUT", `/entries/${u.sys.id}/published`, undefined, u.sys.version);
  } else {
    // eslint-disable-next-line no-console
    console.log("Creating new entry...");
    const c = (await cma("POST", "/entries", { fields } as object, undefined, TYPE_ID)) as Entry;
    const fresh = (await cma("GET", `/entries/${c.sys.id}`)) as Entry;
    await cma("PUT", `/entries/${c.sys.id}/published`, undefined, fresh.sys.version);
  }
  // eslint-disable-next-line no-console
  console.log(
    "\nDone. Published blog post with slug:\n  ",
    SLUG,
    "\nView on site: ",
    `${SITE}/blog/${SLUG}`,
    "\nNote: search rankings still depend on indexing, backlinks, and competition. This post is structured for SEO but is not a ranking guarantee.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

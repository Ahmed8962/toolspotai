/**
 * Publishes blog posts 16-20 to Contentful (toolspotai.com).
 * Run: npm run contentful:publish-blog-16-20
 *
 * .env.local: CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_TOKEN
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { estimateReadingMinutes, plainTextToRichText } from "./plain-text-to-richtext";

const SITE = "https://toolspotai.com" as const;

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
const LOCALE = "en-US" as const;
const TYPE_ID = "blogPost" as const;

const DRAFTS_DIR = join(process.cwd(), "data/blog-drafts/posts-16-20");

type PostManifest = {
  postNumber: number;
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  tags: string[];
  unsplashUrl: string;
  imageAlt: string;
  publishedAt: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  bodyFile: string;
  faqFile: string;
};

type Cma = { sys: { id: string; version: number; type: string; publishedVersion?: number } };
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
    return p.includes(".") ? p : `${p}.jpg`;
  } catch {
    return "cover-image.jpg";
  }
}

async function uploadImageFromUrl(
  imageUrl: string,
  title: string,
  description: string,
): Promise<string> {
  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new Error(`Image URL must be http(s), got: ${imageUrl}`);
  }
  const fileName = assetNameFromUrl(imageUrl);
  const createBody = {
    fields: {
      title: { [LOCALE]: title },
      description: { [LOCALE]: description },
      file: {
        [LOCALE]: {
          contentType: "image/jpeg",
          fileName,
          upload: imageUrl,
        },
      },
    },
  };
  const created = (await cma("POST", "/assets", createBody)) as { sys: { id: string; version: number } };
  if (!created?.sys?.id) throw new Error("Asset create failed");
  const assetId = created.sys.id;
  let version = created.sys.version;

  await cma("PUT", `/assets/${assetId}/files/${encodeURIComponent(LOCALE)}/process`, undefined, version);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const a = (await cma("GET", `/assets/${assetId}`)) as {
      fields?: { file?: Record<string, { url?: string }> };
      sys: { version: number };
    };
    version = a.sys.version;
    if (a.fields?.file?.[LOCALE]?.url) {
      await cma("PUT", `/assets/${assetId}/published`, undefined, version);
      return assetId;
    }
  }
  throw new Error(`Asset still processing for ${imageUrl}`);
}

function linkField(id: string) {
  return { [LOCALE]: { sys: { type: "Link" as const, linkType: "Asset" as const, id } } };
}

function slugOfEntry(it: Entry): string | null {
  const f = it.fields as { slug?: Record<string, string> | string };
  return typeof f.slug === "string"
    ? f.slug
    : f.slug?.[LOCALE] ?? (f.slug ? (Object.values(f.slug)[0] as string) : null);
}

async function findEntryBySlug(target: string): Promise<Entry | null> {
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

function buildFields(post: PostManifest, body: string, assetId: string) {
  const faqs = JSON.parse(readFileSync(join(DRAFTS_DIR, post.faqFile), "utf8")) as {
    items: { question: string; answer: string }[];
  };

  return {
    title: { [LOCALE]: post.title },
    slug: { [LOCALE]: post.slug },
    excerpt: { [LOCALE]: post.excerpt },
    body: { [LOCALE]: plainTextToRichText(body) },
    coverImage: linkField(assetId),
    publishedAt: { [LOCALE]: post.publishedAt },
    updatedAt: { [LOCALE]: post.publishedAt },
    authorName: { [LOCALE]: "ToolSpot AI Team" },
    authorRole: { [LOCALE]: "Editorial" },
    tags: { [LOCALE]: post.tags },
    featured: { [LOCALE]: false },
    readingMinutes: { [LOCALE]: estimateReadingMinutes(body) },
    seoTitle: { [LOCALE]: post.seoTitle },
    seoDescription: { [LOCALE]: post.metaDescription },
    canonicalUrl: { [LOCALE]: `${SITE}/blog/${post.slug}` },
    seoNoIndex: { [LOCALE]: false },
    focusKeyword: { [LOCALE]: post.focusKeyword },
    secondaryKeywords: { [LOCALE]: post.secondaryKeywords },
    schemaType: { [LOCALE]: "BlogPosting" as const },
    ogImage: linkField(assetId),
    faqs: { [LOCALE]: faqs },
  };
}

async function publishPost(post: PostManifest) {
  const body = readFileSync(join(DRAFTS_DIR, post.bodyFile), "utf8");
  const scheduledFuture = new Date(post.publishedAt).getTime() > Date.now();
  console.log(`\nPost ${post.postNumber}: ${post.slug}`);
  console.log(`  Uploading featured image from Unsplash...`);
  const assetId = await uploadImageFromUrl(post.unsplashUrl, post.title, post.imageAlt);
  const fields = buildFields(post, body, assetId) as object;

  const existing = await findEntryBySlug(post.slug);
  let entry: Entry;
  if (existing) {
    console.log(`  Updating existing entry ${existing.sys.id}`);
    entry = (await cma("PUT", `/entries/${existing.sys.id}`, { fields }, existing.sys.version)) as Entry;
  } else {
    console.log(`  Creating new entry...`);
    const c = (await cma("POST", "/entries", { fields }, undefined, TYPE_ID)) as Entry;
    entry = (await cma("GET", `/entries/${c.sys.id}`)) as Entry;
  }

  if (scheduledFuture) {
    if (entry.sys.publishedVersion) {
      await cma("DELETE", `/entries/${entry.sys.id}/published`, undefined, entry.sys.version);
      console.log(`  Saved as draft until ${post.publishedAt} (unpublished from Delivery API)`);
    } else {
      console.log(`  Saved as draft until ${post.publishedAt}`);
    }
    console.log(`  Run npm run contentful:publish-due-blog on or after that date.`);
  } else {
    await cma("PUT", `/entries/${entry.sys.id}/published`, undefined, entry.sys.version);
    console.log(`  Live now: ${SITE}/blog/${post.slug}`);
  }
}

async function main() {
  if (!CMA?.trim()) {
    console.error("Set CONTENTFUL_MANAGEMENT_TOKEN in .env.local");
    process.exit(1);
  }
  if (!SPACE_ID?.trim()) {
    console.error("Set CONTENTFUL_SPACE_ID in .env.local");
    process.exit(1);
  }

  const manifest = JSON.parse(
    readFileSync(join(DRAFTS_DIR, "manifest.json"), "utf8"),
  ) as PostManifest[];

  console.log(`Publishing ${manifest.length} blog posts to Contentful`);
  console.log(`  Space: ${SPACE_ID}`);
  console.log(`  Environment: ${ENV}`);
  console.log(`  Content type: ${TYPE_ID}`);

  for (const post of manifest) {
    await publishPost(post);
  }

  console.log("\nAll posts published successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

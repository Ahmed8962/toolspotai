/**
 * Shared Contentful blog publish helpers.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prepareBlogBody } from "./blog-body-utils";
import { estimateReadingMinutes, plainTextToRichText } from "./plain-text-to-richtext";

export const SITE = "https://toolspotai.com" as const;
export const LOCALE = "en-US" as const;
export const TYPE_ID = "blogPost" as const;

export type PostManifest = {
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

export type Cma = { sys: { id: string; version: number; type: string; publishedVersion?: number } };
export type Entry = Cma & { fields: object };

export function createCmaClient(spaceId: string, env: string, cmaToken: string) {
  const cmaBase = `https://api.contentful.com/spaces/${spaceId}/environments/${env}`;

  async function cma(
    method: "GET" | "PUT" | "POST" | "DELETE",
    path: string,
    body?: object,
    version?: number,
    newEntryContentTypeId?: string,
  ) {
    const headers: Record<string, string> = { Authorization: `Bearer ${cmaToken}` };
    if (body !== undefined) {
      headers["Content-Type"] = "application/vnd.contentful.management.v1+json";
    }
    if (version !== undefined) headers["X-Contentful-Version"] = String(version);
    if (method === "POST" && path === "/entries" && newEntryContentTypeId) {
      headers["X-Contentful-Content-Type"] = newEntryContentTypeId;
    }
    const res = await fetch(`${cmaBase}${path}`, {
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

  async function uploadImageFromUrl(imageUrl: string, title: string, description: string): Promise<string> {
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

    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
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
    const u = new URL(`${cmaBase}/entries`);
    u.searchParams.set("content_type", TYPE_ID);
    u.searchParams.set("limit", "200");
    const res = await fetch(u, { headers: { Authorization: `Bearer ${cmaToken}` } });
    if (!res.ok) return null;
    const j = (await res.json()) as { items: Entry[] };
    for (const it of j.items) {
      if (slugOfEntry(it) === target) return it;
    }
    return null;
  }

  function buildFields(post: PostManifest, rawBody: string, assetId: string, draftsDir: string) {
    const body = prepareBlogBody(rawBody);
    const faqs = JSON.parse(readFileSync(`${draftsDir}/${post.faqFile}`, "utf8")) as {
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

  async function publishPost(post: PostManifest, draftsDir: string) {
    const rawBody = readFileSync(`${draftsDir}/${post.bodyFile}`, "utf8");
    const scheduledFuture = new Date(post.publishedAt).getTime() > Date.now();
    console.log(`\nPost ${post.postNumber}: ${post.slug}`);
    console.log(`  publishedAt: ${post.publishedAt}`);
    console.log(`  Uploading featured image...`);
    const assetId = await uploadImageFromUrl(post.unsplashUrl, post.title, post.imageAlt);
    const fields = buildFields(post, rawBody, assetId, draftsDir) as object;

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
        console.log(`  Saved as draft until ${post.publishedAt}`);
      } else {
        console.log(`  Saved as draft until ${post.publishedAt}`);
      }
      console.log(`  Run npm run contentful:publish-due-blog on or after that date.`);
    } else {
      await cma("PUT", `/entries/${entry.sys.id}/published`, undefined, entry.sys.version);
      console.log(`  Published to Delivery API: ${SITE}/blog/${post.slug}`);
    }
  }

  return { publishPost, cmaBase };
}

export function loadEnvLocal() {
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

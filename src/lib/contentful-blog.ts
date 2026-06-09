import { contentfulFetchOptions } from "@/lib/contentful-revalidate";
import { SITE_URL } from "@/lib/site";
import { connection } from "next/server";

type ContentfulEntry<TFields> = {
  sys: { id: string };
  fields: TFields;
};

type ContentfulAsset = {
  sys: { id: string };
  fields?: {
    title?: string;
    description?: string;
    file?: {
      url?: string;
      details?: { image?: { width?: number; height?: number } };
    };
  };
};

type ContentfulRichText = {
  nodeType: string;
  content: Array<{
    nodeType: string;
    value?: string;
    marks?: Array<{ type: string }>;
    data?: {
      uri?: string;
      target?: { sys?: { id?: string } };
    };
    content?: ContentfulRichText["content"];
  }>;
};

type BlogPostFields = {
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: ContentfulRichText;
  /** Object field: `{ "items": [ { "question": string, "answer": string } ] }` */
  faqs?: { items?: unknown[] } | unknown[];
  tags?: string[];
  featured?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  readingMinutes?: number;
  authorName?: string;
  authorRole?: string;
  coverImage?: { sys?: { id?: string } };
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  seoNoIndex?: boolean;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  schemaType?: "Article" | "BlogPosting" | "HowTo";
  ogImage?: { sys?: { id?: string } };
};

type ContentfulEntriesResponse<TFields> = {
  items: Array<ContentfulEntry<TFields>>;
  includes?: { Asset?: ContentfulAsset[] };
};

export type BlogImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type BlogFaqItem = { question: string; answer: string };

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: ContentfulRichText | null;
  /** Parsed from Contentful `faqs` object field (`items: [{ question, answer }]`). */
  faqs: BlogFaqItem[];
  tags: string[];
  featured: boolean;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes?: number;
  authorName: string;
  authorRole?: string;
  coverImage?: BlogImage;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  seoNoIndex: boolean;
  focusKeyword?: string;
  secondaryKeywords: string[];
  schemaType: "Article" | "BlogPosting" | "HowTo";
  ogImage?: BlogImage;
};

function isFaqItem(x: unknown): x is BlogFaqItem {
  if (x === null || typeof x !== "object") return false;
  const o = x as { question?: unknown; answer?: unknown };
  return (
    typeof o.question === "string" &&
    typeof o.answer === "string" &&
    o.question.length > 0
  );
}

/**
 * CDA can return: `{ items: [...] }`, a bare array, a JSON string, or per-locale
 * `{ "en-US": { items: [...] } }` depending on query / space defaults.
 */
function unwrapFaqPayload(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t.startsWith("{") && !t.startsWith("[")) return null;
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw) || (typeof raw === "object" && raw !== null && "items" in raw)) {
    return raw;
  }
  if (typeof raw === "object" && raw !== null) {
    for (const v of Object.values(raw)) {
      if (v && typeof v === "object" && "items" in (v as object)) {
        return v;
      }
      if (Array.isArray(v)) {
        return v;
      }
    }
  }
  return null;
}

function parseFaqsField(raw: BlogPostFields["faqs"]): BlogFaqItem[] {
  const payload = unwrapFaqPayload(raw as unknown);
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload.filter(isFaqItem);
  }
  if (typeof payload === "object" && "items" in payload) {
    const items = (payload as { items: unknown }).items;
    if (Array.isArray(items)) {
      return items.filter(isFaqItem);
    }
  }
  return [];
}

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const DELIVERY_TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN;
const DELIVERY_LOCALE = process.env.CONTENTFUL_DELIVERY_LOCALE ?? "en-US";

function buildAssetMap(assets: ContentfulAsset[] = []): Map<string, BlogImage> {
  const map = new Map<string, BlogImage>();
  for (const asset of assets) {
    const id = asset.sys.id;
    const urlRaw = asset.fields?.file?.url;
    if (!id || !urlRaw) continue;
    const width = asset.fields?.file?.details?.image?.width ?? 1200;
    const height = asset.fields?.file?.details?.image?.height ?? 630;
    map.set(id, {
      url: urlRaw.startsWith("//") ? `https:${urlRaw}` : urlRaw,
      width,
      height,
      alt: asset.fields?.description || asset.fields?.title || "Blog image",
    });
  }
  return map;
}

function mapPost(
  item: ContentfulEntry<BlogPostFields> | undefined,
  assets: Map<string, BlogImage>,
): BlogPost | null {
  if (!item) return null;
  const f = item.fields;
  if (!f.title || !f.slug || !f.publishedAt) return null;
  const coverId = f.coverImage?.sys?.id;
  const ogId = f.ogImage?.sys?.id;
  return {
    id: item.sys.id,
    title: f.title,
    slug: f.slug,
    excerpt: f.excerpt ?? "",
    body: f.body ?? null,
    faqs: parseFaqsField(f.faqs),
    tags: f.tags ?? [],
    featured: Boolean(f.featured),
    publishedAt: f.publishedAt,
    updatedAt: f.updatedAt,
    readingMinutes: f.readingMinutes,
    authorName: f.authorName ?? "ToolSpotAI",
    authorRole: f.authorRole,
    coverImage: coverId ? assets.get(coverId) : undefined,
    seoTitle: f.seoTitle,
    seoDescription: f.seoDescription,
    canonicalUrl: f.canonicalUrl
      ? f.canonicalUrl.replace(/^http:\/\//, "https://")
      : undefined,
    seoNoIndex: Boolean(f.seoNoIndex),
    focusKeyword: f.focusKeyword,
    secondaryKeywords: f.secondaryKeywords ?? [],
    schemaType: f.schemaType ?? "BlogPosting",
    ogImage: ogId ? assets.get(ogId) : undefined,
  };
}

async function fetchContentfulEntries(
  query: string,
): Promise<ContentfulEntriesResponse<BlogPostFields>> {
  if (!SPACE_ID || !DELIVERY_TOKEN) return { items: [] };
  const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/entries?${query}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${DELIVERY_TOKEN}` },
    ...contentfulFetchOptions("contentful-blog"),
  });
  if (!res.ok) {
    const errBody = await res.text();
    let hint = errBody;
    try {
      const j = JSON.parse(errBody) as { message?: string };
      if (j.message) hint = j.message;
    } catch {
      /* use raw */
    }
    throw new Error(
      `Contentful request failed (${res.status}): ${hint.slice(0, 500)}. ` +
        "Check content type id is `blogPost` and the Delivery token matches this space/environment.",
    );
  }
  return (await res.json()) as ContentfulEntriesResponse<BlogPostFields>;
}

/** True when `publishedAt` has passed (post is allowed on the public site). */
export function isBlogPostLive(publishedAt: string, now = new Date()): boolean {
  const at = new Date(publishedAt);
  if (Number.isNaN(at.getTime())) return false;
  return at.getTime() <= now.getTime();
}

function sortPostsNewestFirst(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

function onlyLivePosts(posts: BlogPost[], now = new Date()): BlogPost[] {
  return posts.filter((post) => isBlogPostLive(post.publishedAt, now));
}

async function fetchAllBlogPostsFromCda(): Promise<BlogPost[]> {
  if (!SPACE_ID || !DELIVERY_TOKEN) return [];
  let data: ContentfulEntriesResponse<BlogPostFields>;
  try {
    data = await fetchContentfulEntries(
      `content_type=blogPost&include=1&limit=200&locale=${encodeURIComponent(DELIVERY_LOCALE)}`,
    );
  } catch (e) {
    console.error(
      "[getAllBlogPosts] Contentful CDA failed — create the `blogPost` type (npm run contentful:seed-blog) and set Delivery API env. Error:",
      e,
    );
    return [];
  }
  const assets = buildAssetMap(data.includes?.Asset);
  return data.items
    .map((item) => mapPost(item, assets))
    .filter((post): post is BlogPost => Boolean(post));
}

/** Build-time helper for `generateStaticParams` (no request context). */
export async function getAllBlogPostsForBuild(): Promise<BlogPost[]> {
  return sortPostsNewestFirst(onlyLivePosts(await fetchAllBlogPostsFromCda()));
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  await connection();
  return sortPostsNewestFirst(onlyLivePosts(await fetchAllBlogPostsFromCda()));
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  await connection();
  const data = await fetchContentfulEntries(
    `content_type=blogPost&fields.slug=${encodeURIComponent(
      slug,
    )}&include=1&limit=1&locale=${encodeURIComponent(DELIVERY_LOCALE)}`,
  );
  const assets = buildAssetMap(data.includes?.Asset);
  const post = mapPost(data.items[0], assets);
  if (!post || !isBlogPostLive(post.publishedAt)) return null;
  return post;
}

export function blogPostUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

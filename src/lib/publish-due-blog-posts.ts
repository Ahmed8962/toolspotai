import { isBlogPostLive } from "@/lib/contentful-blog";

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

export type PublishDueBlogResult = {
  published: { slug: string; title: string; publishedAt: string }[];
  waiting: { slug: string; publishedAt: string }[];
  skipped: number;
  errors: { slug: string; message: string }[];
};

function pickLocale<T>(v: Record<string, T> | undefined): T | undefined {
  if (!v) return undefined;
  return v[LOCALE] ?? Object.values(v)[0];
}

function getConfig() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID?.trim();
  const env = process.env.CONTENTFUL_ENVIRONMENT?.trim() ?? "master";
  const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN?.trim();

  if (!spaceId || !token) return null;

  return {
    spaceId,
    env,
    token,
    base: `https://api.contentful.com/spaces/${spaceId}/environments/${env}`,
  };
}

async function cmaPublish(
  base: string,
  token: string,
  entryId: string,
  version: number,
): Promise<void> {
  const res = await fetch(`${base}/entries/${entryId}/published`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Contentful-Version": String(version),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Publish failed (${res.status}): ${text.slice(0, 500)}`);
  }
}

/** Publish draft blog posts whose `publishedAt` has passed. */
export async function publishDueBlogPosts(now = new Date()): Promise<PublishDueBlogResult> {
  const config = getConfig();
  const result: PublishDueBlogResult = {
    published: [],
    waiting: [],
    skipped: 0,
    errors: [],
  };

  if (!config) {
    result.errors.push({
      slug: "(config)",
      message: "Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN",
    });
    return result;
  }

  const u = new URL(`${config.base}/entries`);
  u.searchParams.set("content_type", TYPE_ID);
  u.searchParams.set("limit", "200");

  const res = await fetch(u, {
    headers: { Authorization: `Bearer ${config.token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    result.errors.push({
      slug: "(fetch)",
      message: `Failed to list entries: ${res.status}`,
    });
    return result;
  }

  const { items } = (await res.json()) as { items: Entry[] };

  for (const entry of items) {
    const slug = pickLocale(entry.fields.slug);
    const title = pickLocale(entry.fields.title);
    const publishedAt = pickLocale(entry.fields.publishedAt);
    if (!slug || !publishedAt) continue;

    // Copyright-circumvention topic — keep unpublished for AdSense.
    if (slug === "how-to-remove-watermark-from-image") {
      result.skipped++;
      continue;
    }

    const isPublished = Boolean(entry.sys.publishedVersion);
    const isDue = isBlogPostLive(publishedAt, now);

    if (isPublished || !isDue) {
      if (!isPublished && !isDue) {
        result.waiting.push({ slug, publishedAt });
      }
      result.skipped++;
      continue;
    }

    try {
      await cmaPublish(config.base, config.token, entry.sys.id, entry.sys.version);
      result.published.push({ slug, title: title ?? slug, publishedAt });
    } catch (err) {
      result.errors.push({
        slug,
        message: err instanceof Error ? err.message : "Publish failed",
      });
    }
  }

  return result;
}

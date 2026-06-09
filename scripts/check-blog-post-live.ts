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

const SPACE = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN;
const CMA = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const LOCALE = process.env.CONTENTFUL_DELIVERY_LOCALE ?? "en-US";
const slug = "debt-avalanche-vs-debt-snowball";

async function main() {
  if (!SPACE) {
    console.error("Missing CONTENTFUL_SPACE_ID");
    process.exit(1);
  }

  let publishedAt = "";
  let sysMeta: { publishedAt?: string; createdAt?: string } = {};

  if (TOKEN?.trim()) {
    const url = `https://cdn.contentful.com/spaces/${SPACE}/environments/${ENV}/entries?content_type=blogPost&fields.slug=${encodeURIComponent(slug)}&include=0&limit=1&locale=${encodeURIComponent(LOCALE)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const data = (await res.json()) as {
      items?: Array<{ fields: { publishedAt?: string }; sys?: { publishedAt?: string; createdAt?: string } }>;
    };
    const item = data.items?.[0];
    if (item) {
      publishedAt = item.fields.publishedAt ?? "";
      sysMeta = item.sys ?? {};
    }
  }

  if (!publishedAt && CMA?.trim()) {
    const cmaBase = `https://api.contentful.com/spaces/${SPACE}/environments/${ENV}`;
    const listRes = await fetch(
      `${cmaBase}/entries?content_type=blogPost&fields.slug=${encodeURIComponent(slug)}&limit=1`,
      { headers: { Authorization: `Bearer ${CMA}` } },
    );
    const list = (await listRes.json()) as {
      items?: Array<{
        fields: { publishedAt?: Record<string, string> };
        sys?: { publishedAt?: string; createdAt?: string };
      }>;
    };
    const item = list.items?.[0];
    if (item) {
      publishedAt = item.fields.publishedAt?.[LOCALE] ?? Object.values(item.fields.publishedAt ?? {})[0] ?? "";
      sysMeta = item.sys ?? {};
    }
  }

  if (!publishedAt) {
    console.log("Entry not found in Contentful (check tokens)");
    return;
  }
  const now = new Date();
  console.log(
    JSON.stringify(
      {
        slug,
        publishedAt,
        parsed: new Date(publishedAt).toISOString(),
        now: now.toISOString(),
        isBlogPostLive: isBlogPostLive(publishedAt, now),
        contentfulSysPublishedAt: sysMeta.publishedAt,
        contentfulSysCreatedAt: sysMeta.createdAt,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

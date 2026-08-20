/**
 * Rewrites stuffed tool intros in Contentful and republishes the AI tools post body.
 * Run: npx tsx scripts/contentful-fix-adsense-copy.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getToolBySlug } from "../src/data/tools";
import { buildBestAiTools2026Body } from "./blog-body-best-ai-tools-2026";
import { buildToolIntroParagraph, buildToolPageH1FromTool, buildHowToUseSteps, isKeywordStuffedToolIntro } from "../src/lib/tool-page-seo";

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
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
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

type Entry = {
  sys: { id: string; version: number; publishedVersion?: number };
  fields: Record<string, Record<string, unknown>>;
};

function pickLocale(f: Record<string, unknown> | undefined): string | undefined {
  if (f == null) return undefined;
  if (typeof f === "string") return f;
  const rec = f as Record<string, string>;
  return rec[LOCALE] ?? rec["en-US"] ?? Object.values(rec)[0];
}

async function cma(method: "GET" | "PUT" | "DELETE", path: string, body?: object, version?: number) {
  if (!CMA || !SPACE_ID) throw new Error("Missing Contentful env");
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
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 800)}`);
  return text ? (JSON.parse(text) as Entry) : null;
}

async function listByType(contentType: string): Promise<Entry[]> {
  const items: Entry[] = [];
  let skip = 0;
  for (;;) {
    const u = new URL(`${CMA_BASE}/entries`);
    u.searchParams.set("content_type", contentType);
    u.searchParams.set("limit", "100");
    u.searchParams.set("skip", String(skip));
    const res = await fetch(u, { headers: { Authorization: `Bearer ${CMA}` } });
    if (!res.ok) throw new Error(`list ${contentType}: ${res.status}`);
    const data = (await res.json()) as { items: Entry[]; total: number };
    items.push(...data.items);
    if (items.length >= data.total) break;
    skip += 100;
  }
  return items;
}

async function rewriteToolIntros() {
  const entries = await listByType("toolPage");
  let updated = 0;
  for (const entry of entries) {
    const slug = pickLocale(entry.fields.urlSlug) || pickLocale(entry.fields.codeKey);
    const intro = pickLocale(entry.fields.intro) ?? "";
    if (!slug || !isKeywordStuffedToolIntro(intro)) continue;
    const tool = getToolBySlug(slug);
    if (!tool) {
      console.log("skip (no local tool)", slug);
      continue;
    }
    const nextIntro = buildToolIntroParagraph(tool, tool.keywords[0] ?? tool.title, tool.keywords.slice(1));
    const fields = {
      ...entry.fields,
      intro: { ...((entry.fields.intro as object) ?? {}), [LOCALE]: nextIntro },
    };
    const saved = await cma("PUT", `/entries/${entry.sys.id}`, { fields }, entry.sys.version);
    if (!saved) continue;
    await cma("PUT", `/entries/${saved.sys.id}/published`, undefined, saved.sys.version);
    updated++;
    console.log("intro ✓", slug);
  }
  console.log(`Tool intros updated: ${updated}`);
}

async function rewriteAiToolsPost() {
  const posts = await listByType("blogPost");
  const post = posts.find((e) => pickLocale(e.fields.slug) === "best-ai-tools-2026");
  if (!post) {
    console.log("AI tools post not found");
    return;
  }
  const fields = {
    ...post.fields,
    body: { ...((post.fields.body as object) ?? {}), [LOCALE]: buildBestAiTools2026Body() },
    updatedAt: { ...((post.fields.updatedAt as object) ?? {}), [LOCALE]: new Date().toISOString() },
  };
  const saved = await cma("PUT", `/entries/${post.sys.id}`, { fields }, post.sys.version);
  if (!saved) throw new Error("empty save");
  await cma("PUT", `/entries/${saved.sys.id}/published`, undefined, saved.sys.version);
  console.log("blog ✓ best-ai-tools-2026");
}

async function fixPlagiarismToolPage() {
  const tool = getToolBySlug("plagiarism-checker");
  if (!tool) {
    console.log("plagiarism-checker tool not found locally");
    return;
  }
  const entries = await listByType("toolPage");
  const entry = entries.find((e) => pickLocale(e.fields.urlSlug) === "plagiarism-checker");
  if (!entry) {
    console.log("plagiarism-checker toolPage not found in Contentful");
    return;
  }
  const h1 = buildToolPageH1FromTool(tool).replace(/^Free\s+/i, "");
  const steps = buildHowToUseSteps(tool);
  const fields = {
    ...entry.fields,
    h1Text: { ...((entry.fields.h1Text as object) ?? {}), [LOCALE]: h1 },
    howToUseSteps: { ...((entry.fields.howToUseSteps as object) ?? {}), [LOCALE]: steps },
  };
  const saved = await cma("PUT", `/entries/${entry.sys.id}`, { fields }, entry.sys.version);
  if (!saved) throw new Error("empty save plagiarism-checker");
  await cma("PUT", `/entries/${saved.sys.id}/published`, undefined, saved.sys.version);
  console.log("toolPage ✓ plagiarism-checker (h1 + how-to)");
}

async function unpublishWatermarkBlog() {
  const slug = "how-to-remove-watermark-from-image";
  const posts = await listByType("blogPost");
  const post = posts.find((e) => pickLocale(e.fields.slug) === slug);
  if (!post) {
    console.log(`blog post not found: ${slug}`);
    return;
  }
  if (!post.sys.publishedVersion) {
    console.log(`blog already draft: ${slug}`);
    return;
  }
  await cma("DELETE", `/entries/${post.sys.id}/published`, undefined, post.sys.version);
  console.log(`blog unpublished ✓ ${slug}`);
}

async function main() {
  if (!CMA || !SPACE_ID) {
    console.error("Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
    process.exit(1);
  }
  await fixPlagiarismToolPage();
  await unpublishWatermarkBlog();
  await rewriteToolIntros();
  await rewriteAiToolsPost();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

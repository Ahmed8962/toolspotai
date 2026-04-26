/**
 * Creates/updates the `blogPost` content type in Contentful (same shape as src/lib/contentful-blog.ts + CONTENTFUL_BLOG_SETUP.md).
 *
 * .env.local: CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_TOKEN
 * Run: npm run contentful:seed-blog
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

const TYPE_ID = "blogPost" as const;

type Sys = { id: string; version: number };
type Cma = { sys: Sys; name?: string; displayField?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLOG_FIELD_DEFS: any[] = [
  { id: "title", name: "Title", type: "Symbol", required: true, localized: false },
  {
    id: "slug",
    name: "Slug (URL path)",
    type: "Symbol",
    required: true,
    localized: false,
    validations: [{ unique: true }],
  },
  { id: "excerpt", name: "Excerpt", type: "Text", required: true, localized: false },
  {
    id: "body",
    name: "Body",
    type: "RichText",
    required: true,
    localized: false,
    validations: [
      { enabledMarks: ["bold", "italic", "underline", "code", "subscript", "superscript", "strikethrough"] },
      {
        enabledNodeTypes: [
          "heading-1",
          "heading-2",
          "heading-3",
          "heading-4",
          "heading-5",
          "heading-6",
          "paragraph",
          "hr",
          "ordered-list",
          "unordered-list",
          "blockquote",
          "embedded-asset-block",
          "hyperlink",
          "table",
        ],
      },
    ],
  },
  { id: "coverImage", name: "Cover image", type: "Link", linkType: "Asset", required: true, localized: false },
  { id: "publishedAt", name: "Published at", type: "Date", required: true, localized: false },
  { id: "updatedAt", name: "Updated at", type: "Date", required: false, localized: false },
  { id: "authorName", name: "Author name", type: "Symbol", required: true, localized: false },
  { id: "authorRole", name: "Author role", type: "Symbol", required: false, localized: false },
  { id: "tags", name: "Tags", type: "Array", required: false, localized: false, items: { type: "Symbol" } },
  { id: "featured", name: "Featured", type: "Boolean", required: false, localized: false },
  { id: "readingMinutes", name: "Reading time (min)", type: "Integer", required: false, localized: false },
  { id: "seoTitle", name: "SEO: Title", type: "Symbol", required: true, localized: false },
  { id: "seoDescription", name: "SEO: Meta description", type: "Text", required: true, localized: false },
  { id: "canonicalUrl", name: "SEO: Canonical URL (optional)", type: "Symbol", required: false, localized: false },
  { id: "seoNoIndex", name: "SEO: noindex", type: "Boolean", required: false, localized: false },
  { id: "focusKeyword", name: "SEO: Focus keyword", type: "Symbol", required: true, localized: false },
  { id: "secondaryKeywords", name: "SEO: Secondary keywords", type: "Array", required: false, localized: false, items: { type: "Symbol" } },
  {
    id: "schemaType",
    name: "Schema type",
    type: "Symbol",
    required: true,
    localized: false,
    validations: [{ in: ["Article", "BlogPosting", "HowTo"] }],
  },
  { id: "ogImage", name: "OG image (optional)", type: "Link", linkType: "Asset", required: false, localized: false },
  {
    id: "faqs",
    name: "FAQs (JSON)",
    type: "Object",
    required: false,
    localized: false,
  },
];

const CT_DEF = {
  name: "Blog post",
  displayField: "title" as const,
  fields: BLOG_FIELD_DEFS,
};

async function cma(method: "GET" | "PUT" | "POST" | "DELETE", path: string, body?: object, version?: number) {
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
    throw new Error(`CMA ${method} ${path} → ${res.status}: ${text.slice(0, 1200)}`);
  }
  if (!text) return null;
  return JSON.parse(text) as Cma;
}

async function main() {
  if (!CMA || !CMA.trim()) {
    console.error(
      "Missing CONTENTFUL_MANAGEMENT_TOKEN. Add to .env.local (CMA or space content management API token from API keys), then: npm run contentful:seed-blog",
    );
    process.exit(1);
  }
  let current: (Cma & { fields: object[] }) | null = null;
  try {
    current = (await cma("GET", `/content_types/${TYPE_ID}`)) as Cma & { fields: object[] };
  } catch {
    current = null;
  }
  if (current?.sys) {
    const def = { name: "Blog post", displayField: "title", fields: BLOG_FIELD_DEFS } as object;
    const v = (await cma("PUT", `/content_types/${TYPE_ID}`, def, current.sys.version)) as Cma;
    await cma("PUT", `/content_types/${TYPE_ID}/published`, undefined, v.sys.version);
    console.log("Content type", TYPE_ID, "updated and published.");
  } else {
    const r = (await cma("PUT", `/content_types/${TYPE_ID}`, { sys: { id: TYPE_ID }, ...CT_DEF } as object)) as Cma;
    await cma("PUT", `/content_types/${TYPE_ID}/published`, undefined, r.sys.version);
    console.log("Content type", TYPE_ID, "created and published.");
  }
  console.log(
    "\nNext: Content → + Add entry (Blog post), fill fields, add cover asset, Publish. " +
      "The site uses CONTENTFUL_DELIVERY_TOKEN to read the Delivery API.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

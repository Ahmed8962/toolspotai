/**
 * Publishes blog posts 21-32 to Contentful (toolspotai.com).
 * Future-dated posts are saved as drafts until their publishedAt date.
 * Run: npm run contentful:publish-blog-21-32
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createCmaClient,
  loadEnvLocal,
  type PostManifest,
} from "./contentful-blog-publish-shared";

loadEnvLocal();

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT ?? "master";
const CMA = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const DRAFTS_DIR = join(process.cwd(), "data/blog-drafts/posts-21-32");

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
  console.log(`  Content type: blogPost`);

  const { publishPost } = createCmaClient(SPACE_ID, ENV, CMA);

  for (const post of manifest) {
    await publishPost(post, DRAFTS_DIR);
  }

  console.log("\nAll posts processed successfully.");
  console.log("\nScheduled slugs:");
  for (const post of manifest) {
    console.log(`  ${post.slug} -> ${post.publishedAt}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

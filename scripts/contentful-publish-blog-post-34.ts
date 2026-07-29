/**
 * Schedules blog post 34 in Contentful (toolspotai.com).
 * Future-dated posts are saved as drafts until their publishedAt date.
 * Run: npm run contentful:publish-blog-34
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
const DRAFTS_DIR = join(process.cwd(), "data/blog-drafts/posts-33");
const POST_NUMBER = 34;

async function main() {
  if (!CMA?.trim()) {
    console.error("Set CONTENTFUL_MANAGEMENT_TOKEN in .env.local");
    process.exit(1);
  }
  if (!SPACE_ID?.trim()) {
    console.error("Set CONTENTFUL_SPACE_ID in .env.local");
    process.exit(1);
  }

  const manifest = (
    JSON.parse(
      readFileSync(join(DRAFTS_DIR, "manifest.json"), "utf8"),
    ) as PostManifest[]
  ).filter((post) => post.postNumber === POST_NUMBER);

  if (manifest.length === 0) {
    console.error(`No post with postNumber ${POST_NUMBER} found in manifest`);
    process.exit(1);
  }

  console.log(`Scheduling ${manifest.length} blog post(s) to Contentful`);
  console.log(`  Space: ${SPACE_ID}`);
  console.log(`  Environment: ${ENV}`);
  console.log(`  Content type: blogPost`);

  const { publishPost } = createCmaClient(SPACE_ID, ENV, CMA);

  for (const post of manifest) {
    await publishPost(post, DRAFTS_DIR);
  }

  console.log("\nAll posts processed successfully.");
  for (const post of manifest) {
    console.log(`  ${post.slug} -> ${post.publishedAt}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

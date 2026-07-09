/**
 * Publish draft blog posts whose `publishedAt` has passed.
 *
 * Manual:  npm run contentful:publish-due-blog
 * Auto:    Vercel Cron hits GET /api/cron/publish-due-blog daily (see vercel.json)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { publishDueBlogPosts } from "../src/lib/publish-due-blog-posts";

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

async function main() {
  const result = await publishDueBlogPosts();

  for (const { slug, publishedAt } of result.waiting) {
    console.log(`  Waiting: ${slug} (due ${publishedAt})`);
  }

  for (const { title, slug, publishedAt } of result.published) {
    console.log(`Publishing: ${title} (due ${publishedAt})`);
  }

  for (const { slug, message } of result.errors) {
    console.error(`Error (${slug}): ${message}`);
  }

  const publishedCount = result.published.length;
  console.log(`\nDone. Published ${publishedCount}, skipped ${result.skipped}.`);

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

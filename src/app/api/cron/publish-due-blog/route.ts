import { requireCron } from "@/lib/cron-auth";
import { publishDueBlogPosts } from "@/lib/publish-due-blog-posts";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Daily cron — publishes draft blog posts when publishedAt is due. */
export async function GET(req: Request) {
  const cronErr = requireCron(req);
  if (cronErr) return cronErr;

  const result = await publishDueBlogPosts();

  return NextResponse.json({
    ok: result.errors.length === 0,
    publishedCount: result.published.length,
    skipped: result.skipped,
    published: result.published,
    waiting: result.waiting,
    errors: result.errors,
  });
}

import { NextResponse } from "next/server";

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set. */
export function requireCron(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Next.js `fetch()` options for Contentful CDA.
 *
 * - On **Vercel** (`VERCEL=1` or `VERCEL_ENV` set) with no override: 300s (good for prod).
 * - **Elsewhere** (`next dev`, `next start` on your PC, or self-host without Vercel): no cache
 *   by default, so published edits show on refresh / rebuild+run. Set
 *   `CONTENTFUL_REVALIDATE_SECONDS=300` in that environment if you want caching.
 * - `CONTENTFUL_REVALIDATE_SECONDS=0` always = no store; `=60` etc. = ISR seconds.
 */
export function contentfulFetchOptions(tag: string): RequestInit {
  const raw = process.env.CONTENTFUL_REVALIDATE_SECONDS;
  const fromEnv = raw !== undefined && raw !== "" ? Number(raw) : Number.NaN;
  let sec: number;
  if (Number.isFinite(fromEnv)) {
    sec = fromEnv;
  } else if (isVercelDeploy()) {
    sec = 300;
  } else {
    sec = 0;
  }
  if (sec <= 0) {
    return { cache: "no-store" as const, next: { tags: [tag] } };
  }
  return { next: { revalidate: sec, tags: [tag] } };
}

function isVercelDeploy(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

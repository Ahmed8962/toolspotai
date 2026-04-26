import { getAllBlogPosts } from "@/lib/contentful-blog";
import { defaultOgImageObjects } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "ToolSpotAI blog with practical guides for calculators, productivity tools, SEO workflows, and growth tactics.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "ToolSpotAI Blog",
    description:
      "Actionable guides for tools, SEO, and productivity with step-by-step walkthroughs.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: defaultOgImageObjects("ToolSpotAI blog"),
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolSpotAI Blog",
    description:
      "Actionable guides for tools, SEO, and productivity with step-by-step walkthroughs.",
    images: [new URL("/toolspotai-logo.svg", SITE_URL).toString()],
  },
};

type SearchParams = Promise<{ q?: string; tag?: string }>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [posts, params] = await Promise.all([getAllBlogPosts(), searchParams]);
  const q = params.q?.trim().toLowerCase() ?? "";
  const tag = params.tag?.trim().toLowerCase() ?? "";

  const allTags = Array.from(
    new Set(posts.flatMap((post) => post.tags).map((t) => t.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const filtered = posts.filter((post) => {
    const tagOk = tag ? post.tags.some((t) => t.toLowerCase() === tag) : true;
    if (!q) return tagOk;
    const haystack = [post.title, post.excerpt, post.focusKeyword, ...post.secondaryKeywords]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return tagOk && haystack.includes(q);
  });

  const featured = filtered.find((p) => p.featured) ?? filtered[0];
  const rest = featured ? filtered.filter((p) => p.slug !== featured.slug) : filtered;

  return (
    <div className="bg-surface-page">
      <section className="border-b border-border/70 bg-gradient-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <p className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            ToolSpotAI Blog
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Practical SEO and tool growth guides
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Learn how to launch, optimize, and scale utility pages with clear, tested
            playbooks.
          </p>

          <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              aria-label="Search blog posts"
              className="h-11 rounded-xl border border-border bg-white px-4 text-sm outline-none ring-brand-300 transition focus:ring-2"
              defaultValue={params.q ?? ""}
              name="q"
              placeholder="Search guides by keyword"
              type="search"
            />
            <button
              className="h-11 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
              type="submit"
            >
              Search
            </button>
          </form>

          {allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  !tag
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-border bg-white text-text-secondary hover:border-brand-200 hover:text-brand-700"
                }`}
                href="/blog"
              >
                All
              </Link>
              {allTags.slice(0, 20).map((tagName) => (
                <Link
                  key={tagName}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    tagName.toLowerCase() === tag
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-border bg-white text-text-secondary hover:border-brand-200 hover:text-brand-700"
                  }`}
                  href={`/blog?tag=${encodeURIComponent(tagName.toLowerCase())}`}
                >
                  {tagName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {featured && (
          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <Link href={`/blog/${featured.slug}`} className="grid md:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-[220px] bg-slate-100">
                {featured.coverImage ? (
                  <Image
                    alt={featured.coverImage.alt}
                    className="object-cover"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    src={featured.coverImage.url}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No cover image
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Featured post
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {featured.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{formatDate(featured.publishedAt)}</span>
                  {featured.readingMinutes ? <span>{featured.readingMinutes} min read</span> : null}
                  <span>{featured.authorName}</span>
                </div>
              </div>
            </Link>
          </article>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <article
              key={post.id}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
            >
              <Link className="block" href={`/blog/${post.slug}`}>
                <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-brand-700">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {post.excerpt}
                </p>
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{formatDate(post.publishedAt)}</span>
                {post.readingMinutes ? <span>{post.readingMinutes} min</span> : null}
              </div>
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tagName) => (
                    <Link
                      key={tagName}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
                      href={`/blog?tag=${encodeURIComponent(tagName.toLowerCase())}`}
                    >
                      {tagName}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-600">
            No blog posts matched your filters yet.
          </div>
        )}
      </section>
    </div>
  );
}

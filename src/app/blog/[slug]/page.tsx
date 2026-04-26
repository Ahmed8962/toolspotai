import BlogFaqJson from "@/components/blog/BlogFaqJson";
import BlogPostCta from "@/components/blog/BlogPostCta";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import RichTextRenderer from "@/components/blog/RichTextRenderer";
import {
  blogPostUrl,
  getAllBlogPosts,
  getBlogPostBySlug,
} from "@/lib/contentful-blog";
import { buildTocFromRichText } from "@/lib/blog-toc";
import { defaultOgImageObjects } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../post-layout.css";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return {
      title: "Blog Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = post.canonicalUrl || blogPostUrl(post.slug);
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const ogImage = post.ogImage || post.coverImage;

  return {
    title,
    description,
    keywords: [post.focusKeyword, ...post.secondaryKeywords].filter(
      (kw): kw is string => Boolean(kw),
    ),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.authorName],
      tags: post.tags,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : defaultOgImageObjects(post.title),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage?.url || new URL("/toolspotai-logo.svg", SITE_URL).toString()],
    },
    robots: {
      index: !post.seoNoIndex,
      follow: !post.seoNoIndex,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, posts] = await Promise.all([
    getBlogPostBySlug(slug),
    getAllBlogPosts(),
  ]);
  if (!post) notFound();

  const related = posts
    .filter((p) => p.slug !== post.slug)
    .filter((p) => p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);

  const canonical = post.canonicalUrl || blogPostUrl(post.slug);
  const schema = {
    "@context": "https://schema.org",
    "@type": post.schemaType || "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    mainEntityOfPage: canonical,
    image: post.ogImage?.url || post.coverImage?.url,
    keywords: [post.focusKeyword, ...post.secondaryKeywords, ...post.tags]
      .filter(Boolean)
      .join(", "),
    publisher: {
      "@type": "Organization",
      name: "ToolSpotAI",
      url: SITE_URL,
      logo: new URL("/toolspotai-logo.svg", SITE_URL).toString(),
    },
  };

  const toc = buildTocFromRichText(post.body as unknown as Parameters<typeof buildTocFromRichText>[0]);
  const headingIdQueue = toc.map((t) => t.id);

  const faqPageSchema =
    post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage" as const,
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question" as const,
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer" as const,
              text: f.answer,
            },
          })),
        }
      : null;

  return (
    <div className="bg-surface-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {faqPageSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        <Link
          className="inline-block text-sm font-medium text-brand-700 transition hover:underline"
          href="/blog"
        >
          ← Back to blog
        </Link>

        {/*
          Two columns from 768px via .blog-post-layout--with-toc in globals.css (main | sticky ToC).
        */}
        <div
          className={
            toc.length > 0
              ? "blog-post-layout--with-toc mt-6"
              : "mt-6 space-y-8"
          }
        >
          <div className="min-w-0 space-y-8">
            <header
              className="blog-post-hero overflow-hidden rounded-2xl p-6 shadow-lg sm:p-8 [color-scheme:dark]"
              style={{
                background: "linear-gradient(135deg, #0b2a5a 0%, #0d4088 100%)",
                color: "#fff",
              }}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold !text-white backdrop-blur-sm transition hover:bg-white/25"
                    href={`/blog?tag=${encodeURIComponent(tag.toLowerCase())}`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight !text-white sm:text-3xl lg:text-4xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed !text-white/90 sm:text-base">
                  {post.excerpt}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 border-t border-white/25 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white"
                    aria-hidden
                  >
                    {post.authorName.trim().charAt(0) || "T"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold !text-white">{post.authorName}</p>
                    {post.authorRole ? (
                      <p className="text-xs !text-white/80">{post.authorRole}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs !text-white/90 sm:justify-end sm:text-sm">
                  <span className="inline-flex items-center gap-1.5" title="Published">
                    <span className="opacity-90" aria-hidden>
                      &#128197;
                    </span>
                    {formatDate(post.publishedAt)}
                  </span>
                  {post.updatedAt && post.updatedAt !== post.publishedAt ? (
                    <span className="inline-flex items-center gap-1.5" title="Updated">
                      <span className="opacity-90" aria-hidden>
                        &#128336;
                      </span>
                      Updated {formatDate(post.updatedAt)}
                    </span>
                  ) : null}
                  {post.readingMinutes ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="opacity-90" aria-hidden>
                        &#128214;
                      </span>
                      {post.readingMinutes} min read
                    </span>
                  ) : null}
                </div>
              </div>
            </header>

            <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-9">
              <RichTextRenderer document={post.body} headingIdQueue={headingIdQueue} />
            </div>

            <BlogFaqJson faqs={post.faqs} />

            <BlogPostCta />
          </div>

          {toc.length > 0 ? (
            <aside className="blog-post-toc flex min-h-0 w-full min-w-0 flex-col self-start">
              <BlogTableOfContents items={toc} />
            </aside>
          ) : null}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-slate-200/70 bg-white/80">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <h2 className="text-2xl font-bold text-slate-900">Related guides</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-soft)]"
                >
                  <Link
                    className="text-base font-semibold text-slate-900 transition hover:text-brand-700"
                    href={`/blog/${item.slug}`}
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

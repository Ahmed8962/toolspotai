import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORY_HUBS, type HubCategoryId } from "@/data/category-hubs";
import { SITE_URL } from "@/lib/site";
import { getToolsByCategory } from "@/data/tools";
import type { Tool } from "@/data/tools";
import ToolCard from "@/components/tools/ToolCard";

export function generateHubMetadata(id: HubCategoryId): Metadata {
  const hub = CATEGORY_HUBS[id];
  const url = `${SITE_URL}${hub.path}`;
  return {
    title: { absolute: hub.title },
    description: hub.description,
    alternates: { canonical: url },
    openGraph: {
      title: hub.title,
      description: hub.description,
      url,
      siteName: "ToolSpotAI",
      type: "website",
    },
  };
}

export default function CategoryHubPage({ categoryId }: { categoryId: HubCategoryId }) {
  const hub = CATEGORY_HUBS[categoryId];
  const list = getToolsByCategory(categoryId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:max-w-4xl">
      <nav className="text-sm text-text-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-600">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-text-secondary">{hub.h1}</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
        {hub.h1}
      </h1>
      <p className="mt-3 text-lg text-text-secondary">{hub.description}</p>

      <div className="mt-10 max-w-none text-text-secondary">
        {hub.intro.map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed">
            {p}
          </p>
        ))}

        <h2 className="mt-10 text-xl font-semibold text-text-primary">
          Why we grouped these tools together
        </h2>
        {hub.whyCluster.map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed">
            {p}
          </p>
        ))}

        <h2 className="mt-10 text-xl font-semibold text-text-primary">Who these are for</h2>
        <ul className="mb-6 list-disc space-y-2 pl-5">
          {hub.whoItsFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="leading-relaxed">{hub.closing}</p>
      </div>

      <h2 className="mb-4 mt-14 text-xl font-semibold text-text-primary">
        All {list.length} tools in this cluster
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((t: Tool) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>

      <p className="mt-10 text-sm text-text-muted">
        Looking for something else?{" "}
        <Link href="/sitemap" className="font-medium text-brand-600 hover:underline">
          Browse the full sitemap
        </Link>{" "}
        or use the search bar in the header.
      </p>
    </div>
  );
}

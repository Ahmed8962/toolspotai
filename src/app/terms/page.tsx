import { SITE_EMAIL } from "@/lib/site";
import { staticPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = staticPageMetadata("/terms", {
  title: "Terms of Service",
  description: "Terms of Service for using ToolSpotAI free online calculators, tools, and blog.",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-text-primary">Terms of Service</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: August 16, 2026</p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Use of the site</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        By using ToolSpotAI you agree to these terms. The site provides free calculators, writing
        helpers, developer utilities, and related articles for informational use. We may change or
        remove tools without notice. The service is provided “as is.”
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">No professional advice</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Nothing on this site is financial, tax, medical, or legal advice. Read our{" "}
        <Link className="text-brand-600 hover:underline" href="/disclaimer">
          disclaimer
        </Link>{" "}
        before relying on any estimate.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Advertising and analytics</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Pages may include third-party advertising (including Google AdSense) and analytics. Those
        partners can use cookies or similar technology as described in our{" "}
        <Link className="text-brand-600 hover:underline" href="/privacy">
          privacy policy
        </Link>
        . Where required by law, Google may show a consent choice for ads.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Prohibited use</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        You may not misuse the site, attempt to disrupt service, scrape at a rate that harms
        availability, or use tools to break the law.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Intellectual property</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        ToolSpotAI branding, layout, and original copy are protected. You may link to our pages.
        Do not copy the site wholesale or present our tools as your own product.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Limitation of liability</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        To the maximum extent permitted by law, ToolSpotAI and its operators are not liable for
        damages arising from use of the tools, ads, or articles, or from decisions you make based on
        estimates shown here.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Contact</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Questions:{" "}
        <Link className="text-brand-600 hover:underline" href="/contact">
          contact page
        </Link>{" "}
        or{" "}
        <a className="text-brand-600 hover:underline" href={`mailto:${SITE_EMAIL}`}>
          {SITE_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}

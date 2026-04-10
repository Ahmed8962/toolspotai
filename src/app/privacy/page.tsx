import { SITE_EMAIL } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Cookies & Google AdSense | ToolSpotAI",
  description:
    "How ToolSpotAI handles data, cookies, third-party ads (including Google AdSense), and your choices.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-text-primary">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: April 10, 2026</p>

      <h2 className="mt-10 text-lg font-semibold text-text-primary">Summary</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        We run a public website of free tools. Like most sites, we rely on basic technical logs to
        keep things secure. If we show ads (for example through Google AdSense), those partners may
        use cookies or similar tech to measure performance and, where allowed, personalize ads. You
        can control ad personalization through your Google settings and browser controls.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Data we collect</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Many calculators run entirely in your browser—inputs you type often never leave your device.
        We may still receive standard server logs (such as IP address, browser type, and pages
        requested) so we can operate, debug, and protect the service. If you email us through the
        contact page, we receive whatever you choose to send.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Cookies & similar technologies</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        We and our partners may set cookies or use local storage for preferences, analytics, or ad
        delivery. You can block or delete cookies in your browser; blocking some cookies may limit
        parts of the site.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Google AdSense & advertising</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Third-party vendors, including Google, may use cookies to serve ads based on your visits to
        this site or other sites. Google&apos;s use of advertising cookies enables it and its
        partners to show ads based on your visits here and elsewhere on the internet. You can
        opt out of personalized advertising from Google by visiting{" "}
        <a
          className="text-brand-600 hover:underline"
          href="https://www.google.com/settings/ads"
          rel="noopener noreferrer"
          target="_blank"
        >
          Google Ads Settings
        </a>
        , and learn more about how Google uses data in Google&apos;s partner policies. EU users may
        also see consent choices where required by law.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Children</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Our tools are general audience. We do not knowingly collect personal information from
        children under 13. If you believe we have, contact us and we will delete it.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Contact</h2>
      <p className="mt-2 text-text-secondary">
        Questions about this policy:{" "}
        <a className="text-brand-600 hover:underline" href={`mailto:${SITE_EMAIL}`}>
          {SITE_EMAIL}
        </a>
      </p>
    </div>
  );
}

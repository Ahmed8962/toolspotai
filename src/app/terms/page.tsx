import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for using ToolSpotAI free online tools and utilities.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-text-primary">Terms of Service</h1>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Use of the site</h2>
      <p className="mt-2 text-text-secondary">
        By using ToolSpotAI, you agree to these terms. The site is provided “as is” without
        warranties of any kind.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Prohibited use</h2>
      <p className="mt-2 text-text-secondary">
        You may not misuse the site, attempt to disrupt service, or use automated means to abuse the
        platform.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Intellectual property</h2>
      <p className="mt-2 text-text-secondary">
        Content and branding on ToolSpotAI are protected by applicable intellectual property laws.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Limitation of liability</h2>
      <p className="mt-2 text-text-secondary">
        To the maximum extent permitted by law, ToolSpotAI is not liable for any damages arising
        from your use of the tools or reliance on their output.
      </p>
    </div>
  );
}

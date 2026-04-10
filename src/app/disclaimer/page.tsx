import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer for ToolSpotAI online tools, calculators, and utilities.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-text-primary">Disclaimer</h1>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Financial and numeric tools</h2>
      <p className="mt-2 text-text-secondary">
        EMI, mortgage, discount, percentage, and similar results are estimates for informational purposes only.
        They are not financial, tax, or legal advice. Verify terms with your lender or a qualified
        professional before making decisions.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Health-related tools</h2>
      <p className="mt-2 text-text-secondary">
        If we publish health-related tools in the future, they are not medical advice.
        Consult a qualified professional for health decisions.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-text-primary">Accuracy</h2>
      <p className="mt-2 text-text-secondary">
        We strive for accuracy, but we do not guarantee that results are error-free or suitable for
        every use case. Use at your own risk.
      </p>
    </div>
  );
}

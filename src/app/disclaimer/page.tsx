import { SITE_EMAIL } from "@/lib/site";
import { staticPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = staticPageMetadata("/disclaimer", {
  title: "Disclaimer",
  description:
    "Disclaimer for ToolSpotAI calculators: finance, health, and legal estimates are educational only and are not professional advice.",
});

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-text-primary">Disclaimer</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: August 16, 2026</p>

      <p className="mt-8 text-text-secondary leading-relaxed">
        ToolSpotAI publishes free calculators and explainers so you can understand formulas and
        run planning numbers yourself. Results are estimates for education and general information.
        They are not a substitute for advice from a qualified professional who knows your facts.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Financial, tax, and numeric tools</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Mortgage, EMI, tax, salary, retirement, crypto, inflation, loan, and similar results are
        planning estimates. Tax rules, lender terms, insurance, and account details change. We are
        not a bank, lender, tax preparer, or registered advisor. Confirm numbers with your lender,
        accountant, or other qualified professional before you sign, file, or spend.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Health and fitness tools</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        BMI, BMR, calories, macros, body fat, cycle, pregnancy, blood pressure, and similar tools
        use published formulas and general ranges. They cannot examine you, diagnose a condition, or
        replace care from a licensed clinician. If you are pregnant, have symptoms, or a reading
        looks concerning, contact a qualified health professional. Do not start, stop, or change
        treatment based only on a webpage.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Legal estimate tools</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Injury settlement, divorce split, and accident-compensation calculators are math illustrations
        only. They are not legal advice, not a prediction of what a court or insurer will pay, and
        not a substitute for a licensed attorney in your jurisdiction. Deadlines, liability, and
        policy limits can change an outcome completely.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-text-primary">Accuracy</h2>
      <p className="mt-2 text-text-secondary leading-relaxed">
        We work to keep formulas current, but we do not warrant that every result is error-free or
        suitable for every situation. Use at your own risk.
      </p>

      <p className="mt-8 text-text-secondary">
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

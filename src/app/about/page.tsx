import { AUTHOR_LINKEDIN_URL, AUTHOR_NAME } from "@/lib/site";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ToolSpotAI — Who we are & why this site exists",
  description:
    "ToolSpotAI builds free, fast calculators and utilities for real-life decisions—money, health, school, and work—without locking you into an account.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
        About ToolSpotAI
      </h1>
      <p className="mt-3 text-lg text-brand-700">Tools that respect your time.</p>

      <p className="mt-8 text-text-secondary leading-relaxed">
        We started ToolSpotAI because most of us don&apos;t wake up wanting to “use a calculator
        website.” We want an answer—how much house we can afford, what our take-home might look
        like, how many weeks along a pregnancy is, or whether a block of text is readable before we
        hit publish. This project exists to put those answers one click away, in plain English, with
        the math shown when it helps and honest limits when it doesn&apos;t.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-text-primary">What we actually do</h2>
      <p className="mt-3 text-text-secondary leading-relaxed">
        We ship browser-based tools: finance and tax estimates, health and fitness calculators,
        developer utilities, writing helpers, and more. Where possible, processing stays on your
        device so your drafts and numbers aren&apos;t part of our business model. We add long-form
        explanations under each tool—not because an algorithm demanded a word count, but because
        someone landing from Google at 11 p.m. deserves context, not just a widget.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-text-primary">Editorial standards</h2>
      <p className="mt-3 text-text-secondary leading-relaxed">
        Finance, health, and legal topics are serious. We label estimates clearly, link related
        tools so you can cross-check, and tell you when a professional (CPA, doctor, attorney)
        should take over. We&apos;re not a bank, a clinic, or a law firm—this site is for education
        and planning, not personalized professional advice.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-text-primary">Who maintains the site</h2>
      <p className="mt-3 text-text-secondary leading-relaxed">
        ToolSpotAI is developed and maintained by{" "}
        <strong className="font-medium text-text-primary">{AUTHOR_NAME}</strong>, focused on
        accuracy, performance, and clarity. Formulas get revised when tax brackets or medical
        guidelines change, feedback from the{" "}
        <Link href="/contact" className="font-medium text-brand-600 hover:underline">
          contact page
        </Link>{" "}
        is taken seriously, and new tools follow what people actually search for—especially across
        the US, UK, and EU. Connect on{" "}
        <a
          href={AUTHOR_LINKEDIN_URL}
          className="font-medium text-brand-600 hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          LinkedIn
        </a>
        .
      </p>

      <h2 className="mt-12 text-xl font-semibold text-text-primary">Topic hubs</h2>
      <p className="mt-3 text-text-secondary leading-relaxed">
        Instead of scattering unrelated pages, we group tools into{" "}
        <Link href="/tools/finance-calculators" className="font-medium text-brand-600 hover:underline">
          finance
        </Link>
        ,{" "}
        <Link href="/tools/health-calculators" className="font-medium text-brand-600 hover:underline">
          health
        </Link>
        ,{" "}
        <Link href="/tools/legal-calculators" className="font-medium text-brand-600 hover:underline">
          legal (estimates only)
        </Link>
        , and other clusters—each hub explains why those tools belong together. That helps readers
        and search engines see the same story: we care about the topic, not just a single keyword.
      </p>

      <p className="mt-12">
        <Link href="/contact" className="font-medium text-brand-600 hover:underline">
          Contact us
        </Link>{" "}
        with corrections, ideas, or partnership questions—we read every message we can.
      </p>
    </div>
  );
}

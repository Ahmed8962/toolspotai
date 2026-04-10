import ContactForm from "@/components/contact/ContactForm";
import { SITE_EMAIL } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ToolSpotAI — questions, feedback, or suggestions for new online AI tools and utilities.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold text-text-primary">Contact us</h1>
      <p className="mt-6 text-text-secondary">
        Email:{" "}
        <a className="text-brand-600 hover:underline" href={`mailto:${SITE_EMAIL}`}>
          {SITE_EMAIL}
        </a>
      </p>
      <p className="mt-4 text-sm text-text-muted">We aim to respond within 24 hours.</p>
      <p className="mt-6 text-text-secondary">
        Suggestions for new tools or improvements are welcome.
      </p>

      <ContactForm />
    </div>
  );
}

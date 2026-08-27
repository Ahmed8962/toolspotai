"use client";

import {
  applyGtagConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookie-consent";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    if (existing) {
      applyGtagConsent(existing);
      return;
    }
    setVisible(true);
  }, []);

  function choose(value: CookieConsentValue) {
    writeCookieConsent(value);
    applyGtagConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <p className="flex-1 text-sm leading-relaxed text-slate-600">
          We use cookies for analytics and, when ads are shown, advertising (including Google).
          Essential site function does not need them. See our{" "}
          <Link href="/privacy" className="font-medium text-brand-600 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

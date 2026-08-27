export const COOKIE_CONSENT_KEY = "toolspotai_cookie_consent";

export type CookieConsentValue = "accepted" | "rejected";

export type GtagConsentState = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

export function writeCookieConsent(value: CookieConsentValue): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
}

/** Apply Google Consent Mode v2 (analytics + ads storage). */
export function applyGtagConsent(value: CookieConsentValue): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  const state: GtagConsentState = value === "accepted" ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}

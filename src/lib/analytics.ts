"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export function trackOutboundClick(url: string, linkText?: string) {
  trackEvent("outbound_click", {
    destination: url,
    link_text: linkText?.trim().slice(0, 80),
  });
}

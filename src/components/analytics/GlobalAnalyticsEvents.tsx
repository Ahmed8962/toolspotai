"use client";

import { trackEvent, trackOutboundClick } from "@/lib/analytics";
import { useEffect } from "react";

export default function GlobalAnalyticsEvents() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      if (button && window.location.pathname.startsWith("/tools/")) {
        const actionLabel = (button.textContent ?? "").trim().toLowerCase();
        if (
          actionLabel.includes("calculate") ||
          actionLabel.includes("generate") ||
          actionLabel.includes("convert") ||
          actionLabel.includes("check") ||
          actionLabel.includes("test")
        ) {
          trackEvent("tool_key_action_click", {
            tool_slug: window.location.pathname.replace("/tools/", ""),
            action_label: actionLabel.slice(0, 60),
          });
        }
      }

      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      if (href.startsWith("/contact") || href.startsWith("mailto:")) {
        trackEvent("contact_click", {
          href,
          source_path: window.location.pathname,
        });
        return;
      }

      if (href.startsWith("/tools/")) {
        trackEvent("tool_open_click", {
          tool_slug: href.replace("/tools/", "").split("?")[0],
          source_path: window.location.pathname,
        });
        return;
      }

      if (!href.startsWith("http")) return;
      try {
        const targetUrl = new URL(href);
        if (targetUrl.host !== window.location.host) {
          trackOutboundClick(targetUrl.toString(), link.textContent ?? undefined);
        }
      } catch {
        // Ignore malformed URLs in analytics layer.
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

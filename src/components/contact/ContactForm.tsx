"use client";

import { SITE_EMAIL } from "@/lib/site";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-border bg-surface-card px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-500/30";

type SendMode = "resend" | "web3forms" | "mailto";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastMode, setLastMode] = useState<SendMode | null>(null);

  const web3Key = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

  const openMailto = (
    visitorName: string,
    visitorEmail: string,
    msg: string,
  ) => {
    const subject = `ToolSpotAI contact${visitorName ? ` — ${visitorName}` : ""}`;
    const body = [
      visitorName && `Name: ${visitorName}`,
      `Reply-to: ${visitorEmail}`,
      "",
      msg,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const visitorName = name.trim();
    const visitorEmail = email.trim();
    const msg = message.trim();

    if (msg.length < 5) {
      setErrorMessage("Please enter a longer message.");
      setStatus("error");
      return;
    }

    if (!visitorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
      setErrorMessage("Please enter a valid email so we can reply.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    // 1) Server email (Resend) — works on localhost when RESEND_API_KEY is set
    try {
      const apiRes = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: visitorName || undefined,
          email: visitorEmail,
          message: msg,
        }),
      });

      const apiData = (await apiRes.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (apiRes.ok && apiData.ok) {
        setLastMode("resend");
        setStatus("success");
        setMessage("");
        setName("");
        setEmail("");
        return;
      }

      if (apiRes.status === 503 && apiData.error === "no_provider") {
        // fall through to Web3Forms / mailto
      } else {
        setStatus("error");
        setErrorMessage(
          apiData.message ||
            "Could not send. Try again or email us at the address above.",
        );
        return;
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Try again or use the email link above.");
      return;
    }

    // 2) Web3Forms (browser) if configured
    if (web3Key) {
      try {
        const res = await fetch(WEB3FORMS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: web3Key,
            subject: `ToolSpotAI contact${visitorName ? ` — ${visitorName}` : ""}`,
            name: visitorName || "Visitor",
            email: visitorEmail,
            message: msg,
          }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          message?: string;
        };

        if (res.ok && data.success !== false) {
          setLastMode("web3forms");
          setStatus("success");
          setMessage("");
          setName("");
          setEmail("");
          return;
        }

        setStatus("error");
        setErrorMessage(
          data.message ||
            "Could not send. Try the email address at the top of the page.",
        );
        return;
      } catch {
        setStatus("error");
        setErrorMessage(`Network error. Email ${SITE_EMAIL} directly.`);
        return;
      }
    }

    // 3) mailto fallback (no inbox delivery until they send from their app)
    setLastMode("mailto");
    openMailto(visitorName, visitorEmail, msg);
    setStatus("success");
    setErrorMessage("");
  };

  if (status === "success") {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50/90 p-5 text-sm text-green-900">
        <p className="font-medium">
          {lastMode === "mailto"
            ? "Your email app should open"
            : "Message sent"}
        </p>
        <p className="mt-2 leading-relaxed">
          {lastMode === "mailto" ? (
            <>
              Tap <strong>Send</strong> in your mail app to deliver the message
              to <strong>{SITE_EMAIL}</strong>. If nothing opened, copy our
              address from the top of the page.
            </>
          ) : (
            <>
              Thanks — we&apos;ll reply to the address you used when we can.
              Check <strong>{SITE_EMAIL}</strong> for the submission.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setLastMode(null);
          }}
          className="mt-4 text-sm font-medium text-brand-700 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium text-text-primary">
          Name <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="text-sm font-medium text-text-primary">
          Your email <span className="text-red-600">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-text-muted">
          We use this to reply. Messages are delivered to{" "}
          <strong>{SITE_EMAIL}</strong>.
        </p>
      </div>
      <div>
        <label htmlFor="contact-message" className="text-sm font-medium text-text-primary">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={5}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(inputCls, "resize-y min-h-[140px]")}
          placeholder="Questions, feedback, or tool ideas…"
        />
      </div>

      {status === "error" && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

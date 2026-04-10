import { SITE_EMAIL } from "@/lib/site";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const MAX_MESSAGE_LEN = 8000;

/** Resend test sender — works without a custom domain; add your domain in Resend for production branding. */
const FROM = "ToolSpotAI <onboarding@resend.dev>";

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "no_provider", message: "Resend is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, unknown>;

  const msg = typeof message === "string" ? message.trim() : "";
  if (msg.length < 5) {
    return NextResponse.json(
      { ok: false, error: "message_too_short" },
      { status: 400 },
    );
  }
  if (msg.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { ok: false, error: "message_too_long" },
      { status: 400 },
    );
  }

  const visitorEmail =
    typeof email === "string" ? email.trim().slice(0, 320) : "";
  if (!visitorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 },
    );
  }

  const visitorName =
    typeof name === "string" ? name.trim().slice(0, 120) : "";

  const subject = `ToolSpotAI contact${visitorName ? ` — ${visitorName}` : ""}`;
  const text = [
    visitorName && `Name: ${visitorName}`,
    `Reply-to: ${visitorEmail}`,
    "",
    msg,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(visitorName || "—")}</p>
    <p><strong>From:</strong> <a href="mailto:${escapeHtml(visitorEmail)}">${escapeHtml(visitorEmail)}</a></p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(msg)}</pre>
  `.trim();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [SITE_EMAIL],
      replyTo: visitorEmail,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "send_failed",
          message: error.message || "Email could not be sent.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[contact]", e);
    return NextResponse.json(
      { ok: false, error: "send_failed", message: "Email could not be sent." },
      { status: 502 },
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

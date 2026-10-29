import "server-only";

import { button, emailConfigured, esc, layout, send, type Message } from "@/lib/booking/email";
import { downloadLink, storageBackend, type StoredFile } from "./storage";

/**
 * The two emails a guide request sends, in the booking emails' layout and
 * through the same Resend sending (lib/booking/email.ts):
 *
 * - The team gets the visitor's email and a seven-day download link for each
 *   file, and builds the guide by hand.
 * - The visitor gets a short note that the files arrived.
 *
 * Environment: GUIDE_NOTIFY_TO, comma-separated team addresses, falling back
 * to BOOKING_NOTIFY_TO. Sending itself (RESEND_API_KEY, BOOKING_EMAIL_FROM,
 * BOOKING_EMAIL_REPLY_TO) is shared with the booking emails, and so is the
 * development outbox folder used when RESEND_API_KEY is unset.
 */

export type GuideRequest = {
  uploadId: string;
  email: string;
  files: StoredFile[];
  source?: string;
  campaign?: string;
};

const notifyList = () =>
  (process.env.GUIDE_NOTIFY_TO || process.env.BOOKING_NOTIFY_TO || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const size = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const plural = (n: number) => `${n} file${n === 1 ? "" : "s"}`;

async function teamEmail(request: GuideRequest, to: string[]): Promise<Message> {
  const backend = await storageBackend();
  // The storage-less demo kept no files, so there's nothing to link to.
  const links = await Promise.all(
    request.files.map((file) => (backend === "demo" ? null : downloadLink(file.path))),
  );
  const sent = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date());
  const rows: [string, string][] = [
    ["Email", request.email],
    ["Files", plural(request.files.length)],
    ["Sent (ET)", sent],
    ["Source", [request.source, request.campaign].filter(Boolean).join(" · ") || "—"],
  ];
  const where =
    backend === "supabase"
      ? "Download links work for seven days. The files stay in the guide-uploads bucket in Supabase."
      : backend === "demo"
        ? "Demo: no file storage is set up yet, so the files weren't kept. Ask the visitor to email them."
        : "Development: these links open the files in the dev machine's temp folder.";

  const body = `<p style="margin:0 0 12px 0;">A visitor sent files for a guide on truhu.ai/BryanKleppe. Build it and email it to them.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#7b8da1;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;color:#0a1826;">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
<ul style="margin:14px 0 18px 0;padding-left:18px;">${request.files
    .map(
      (file, i) =>
        `<li style="margin:0 0 4px 0;">${
          links[i] ? `<a href="${esc(links[i])}" style="color:#0463a8;">${esc(file.name)}</a>` : esc(file.name)
        } · ${size(file.size)}</li>`,
    )
    .join("")}</ul>
${button(`mailto:${request.email}`, "Email them", true)}`;

  return {
    to,
    subject: `Guide request: ${request.email} · ${plural(request.files.length)}`,
    html: layout({
      preheader: `${request.email} sent ${plural(request.files.length)}`,
      heading: `Guide request from ${request.email}`,
      body,
      footer: where,
    }),
    text: [
      `Guide request from ${request.email}`,
      "",
      ...rows.map(([k, v]) => `${k}: ${v}`),
      "",
      ...request.files.map((file, i) => `${file.name} (${size(file.size)})${links[i] ? `: ${links[i]}` : ""}`),
      "",
      where,
    ].join("\n"),
    idempotencyKey: `guide:team:${request.uploadId}`,
  };
}

function visitorEmail(request: GuideRequest): Message {
  const heading = "We have your files";
  const lead = "Thanks for sending them. TruHu's team will build your guide from these files and email it to this address.";
  return {
    to: [request.email],
    subject: "We have your files for the guide",
    html: layout({
      preheader: lead,
      heading,
      body: `<p style="margin:0 0 12px 0;">${esc(lead)}</p>
<ul style="margin:0;padding-left:18px;">${request.files
        .map((file) => `<li style="margin:0 0 4px 0;">${esc(file.name)}</li>`)
        .join("")}</ul>`,
      footer: "You're getting this because files were sent for a guide with this address on truhu.ai.",
    }),
    text: [heading, "", lead, "", ...request.files.map((file) => `- ${file.name}`)].join("\n"),
    idempotencyKey: `guide:visitor:${request.uploadId}`,
  };
}

/**
 * Send both emails. Never throws: the request has already been answered, and
 * a failed email is logged for the team to follow up.
 */
export async function sendGuideEmails(request: GuideRequest) {
  // With nothing set to send through in development, the team's email still
  // goes to the outbox folder so it can be checked.
  const outboxOnly = !emailConfigured() && process.env.NODE_ENV !== "production";
  const notify = notifyList();
  const to = notify.length ? notify : outboxOnly ? ["guide-notify-unset@example.invalid"] : [];
  const jobs: Promise<void>[] = [send(visitorEmail(request))];
  if (to.length) jobs.push(teamEmail(request, to).then(send));
  else console.warn("[guide] GUIDE_NOTIFY_TO and BOOKING_NOTIFY_TO are empty; no one was told of", request.uploadId);
  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") console.error("[guide] email failed", result.reason);
  }
}

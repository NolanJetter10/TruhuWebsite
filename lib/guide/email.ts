import "server-only";

import { button, emailConfigured, esc, layout, send, type Message } from "@/lib/booking/email";
import { KINDLERYE } from "@/lib/kindlerye";
import { downloadLink, storageBackend, type StoredFile } from "./storage";

/**
 * The two emails each of Bryan's request paths on /BryanKleppe sends, in the
 * booking emails' layout and through the same Resend sending
 * (lib/booking/email.ts):
 *
 * - rebuild (last year's guide uploaded): the team gets the visitor's email
 *   and a seven-day download link for each file, and builds the guide by
 *   hand; the visitor gets a short note that the files arrived.
 * - build (a guide for a client, from the client's website): the team gets
 *   the email and the website; the visitor, a note that it's being built.
 * - samples (the sample picker's email field): the visitor gets the links to
 *   the four samples; the team, a heads-up to follow up.
 *
 * Environment: GUIDE_NOTIFY_TO, comma-separated team addresses, falling back
 * to BOOKING_NOTIFY_TO. Sending itself (RESEND_API_KEY, BOOKING_EMAIL_FROM,
 * BOOKING_EMAIL_REPLY_TO) is shared with the booking emails, and so is the
 * development outbox folder used when RESEND_API_KEY is unset.
 */

export type LeadRequest = {
  /** The lead's id (lib/analytics/store.ts), which keys the emails so a retry never sends twice. */
  id: string;
  email: string;
  source?: string;
  campaign?: string;
} & (
  | { path: "rebuild"; uploadId: string; files: StoredFile[] }
  | { path: "build"; clientUrl: string }
  /** `origin` is this site's, for the flipbook, which lives here. */
  | { path: "samples"; origin: string }
);

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

/** "acme.com" for "https://www.acme.com/benefits". */
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** The four samples, as the picker on the page offers them. */
const samples = (origin: string): [string, string][] => [
  ["Website", KINDLERYE.micrositeUrl],
  ["Guide", KINDLERYE.guideUrl],
  ["Flipbook", new URL("/flipbook/kindlerye.html", origin).toString()],
  ["Flyer", KINDLERYE.flyerUrl],
];

/** The key a Message is sent under: unchanged for uploads, so a retry of an old one still dedupes. */
const key = (request: LeadRequest, who: "team" | "visitor") =>
  request.path === "rebuild" ? `guide:${who}:${request.uploadId}` : `lead:${who}:${request.id}`;

function table(rows: [string, string][]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#7b8da1;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;color:#0a1826;">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

async function teamEmail(request: LeadRequest, to: string[]): Promise<Message> {
  const sent = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date());
  const source = [request.source, request.campaign].filter(Boolean).join(" · ") || "—";
  const reply = button(`mailto:${request.email}`, "Email them", true);

  let subject: string;
  let heading: string;
  let intro: string;
  let rows: [string, string][];
  let extraHtml = "";
  let extraText: string[] = [];
  let footer: string;

  if (request.path === "rebuild") {
    const backend = await storageBackend();
    // The storage-less demo kept no files, so there's nothing to link to.
    const links = await Promise.all(
      request.files.map((file) => (backend === "demo" ? null : downloadLink(file.path))),
    );
    subject = `Guide request: ${request.email} · ${plural(request.files.length)}`;
    heading = `Guide request from ${request.email}`;
    intro = "A visitor sent files for a guide on truhu.ai/BryanKleppe. Build it and email it to them.";
    rows = [["Email", request.email], ["Files", plural(request.files.length)]];
    extraHtml = `<ul style="margin:14px 0 18px 0;padding-left:18px;">${request.files
      .map(
        (file, i) =>
          `<li style="margin:0 0 4px 0;">${
            links[i] ? `<a href="${esc(links[i])}" style="color:#0463a8;">${esc(file.name)}</a>` : esc(file.name)
          } · ${size(file.size)}</li>`,
      )
      .join("")}</ul>`;
    extraText = request.files.map(
      (file, i) => `${file.name} (${size(file.size)})${links[i] ? `: ${links[i]}` : ""}`,
    );
    footer =
      backend === "supabase"
        ? "Download links work for seven days. The files stay in the guide-uploads bucket in Supabase."
        : backend === "demo"
          ? "Demo: no file storage is set up yet, so the files weren't kept. Ask the visitor to email them."
          : "Development: these links open the files in the dev machine's temp folder.";
  } else if (request.path === "build") {
    const host = hostOf(request.clientUrl);
    subject = `Build a guide: ${host} · ${request.email}`;
    heading = `Guide to build for ${host}`;
    intro =
      "A visitor on truhu.ai/BryanKleppe asked for a guide for their client, built from the client's website. Build it and email it to them.";
    rows = [["Email", request.email], ["Client site", request.clientUrl]];
    extraHtml = `<p style="margin:14px 0 18px 0;">${button(request.clientUrl, `Open ${host}`)}</p>`;
    footer = "The website is as the visitor typed it, tidied to https.";
  } else {
    subject = `Samples sent: ${request.email}`;
    heading = `${request.email} asked for samples`;
    intro =
      "A visitor on truhu.ai/BryanKleppe had TruHu's samples sent to their work email. They have the links; the follow-up is yours.";
    rows = [["Email", request.email]];
    footer = "The visitor was sent Kindlerye's website, guide, flipbook and flyer.";
  }

  rows.push(["Sent (ET)", sent], ["Source", source]);
  return {
    to,
    subject,
    html: layout({
      preheader: intro,
      heading,
      body: `<p style="margin:0 0 12px 0;">${esc(intro)}</p>
${table(rows)}
${extraHtml || '<div style="height:18px;"></div>'}
${reply}`,
      footer,
    }),
    text: [heading, "", intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", ...extraText, "", footer]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n"),
    idempotencyKey: key(request, "team"),
  };
}

function visitorEmail(request: LeadRequest): Message {
  let subject: string;
  let heading: string;
  let lead: string;
  let listHtml: string;
  let listText: string[];

  if (request.path === "rebuild") {
    subject = "We have your files for the guide";
    heading = "We have your files";
    lead = "Thanks for sending them. TruHu's team will build your guide from these files and email it to this address.";
    listHtml = `<ul style="margin:0;padding-left:18px;">${request.files
      .map((file) => `<li style="margin:0 0 4px 0;">${esc(file.name)}</li>`)
      .join("")}</ul>`;
    listText = request.files.map((file) => `- ${file.name}`);
  } else if (request.path === "build") {
    const host = hostOf(request.clientUrl);
    subject = `We're building a guide for ${host}`;
    heading = "Your guide is on its way";
    lead = `Thanks. TruHu's team will build a benefits guide for ${host} from its website and email it to this address.`;
    listHtml = "";
    listText = [];
  } else {
    const links = samples(request.origin);
    subject = "TruHu's samples";
    heading = "Here are TruHu's samples";
    lead = `TruHu made each of these for ${KINDLERYE.name}, a made-up employer, so every name and number in them is invented.`;
    listHtml = `<p style="margin:0;">${links.map(([label, href]) => button(href, label, label === "Guide")).join("")}</p>`;
    listText = links.map(([label, href]) => `${label}: ${href}`);
  }

  return {
    to: [request.email],
    subject,
    html: layout({
      preheader: lead,
      heading,
      body: `<p style="margin:0 0 12px 0;">${esc(lead)}</p>${listHtml}`,
      footer: "You're getting this because this address was entered on truhu.ai.",
    }),
    text: [heading, "", lead, ...(listText.length ? ["", ...listText] : [])].join("\n"),
    idempotencyKey: key(request, "visitor"),
  };
}

/**
 * Send both emails. Never throws: the request has already been answered, and
 * a failed email is logged for the team to follow up.
 */
export async function sendLeadEmails(request: LeadRequest) {
  // With nothing set to send through in development, the team's email still
  // goes to the outbox folder so it can be checked.
  const outboxOnly = !emailConfigured() && process.env.NODE_ENV !== "production";
  const notify = notifyList();
  const to = notify.length ? notify : outboxOnly ? ["guide-notify-unset@example.invalid"] : [];
  const jobs: Promise<void>[] = [send(visitorEmail(request))];
  if (to.length) jobs.push(teamEmail(request, to).then(send));
  else console.warn("[lead] GUIDE_NOTIFY_TO and BOOKING_NOTIFY_TO are empty; no one was told of", request.path, request.id);
  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") console.error("[lead] email failed", result.reason);
  }
}

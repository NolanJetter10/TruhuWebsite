import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET_STARTED_PAGE } from "@/lib/content";
import { googleCalendarUrl, inviteIcs, outlookCalendarUrl } from "./calendar-links";
import { MEETING } from "./meeting";
import { formatLongDate, formatTime, zoneAbbreviation } from "./time";
import type { Booking } from "./types";

/**
 * Booking emails for the placeholder scheduler, sent through Resend (a plain
 * HTTPS API; no SDK). Cal.com sends its own once it's connected.
 *
 * - The booker gets a real calendar invitation: an email with an
 *   `invite.ics` attached as `text/calendar; method=REQUEST`, which Gmail and
 *   Outlook show with Accept / Decline and drop straight onto their calendar.
 *   Moves update that same calendar entry; cancellations remove it.
 * - Whoever is in BOOKING_NOTIFY_TO gets a heads-up with the booker's details
 *   and a calendar file of their own.
 *
 * Environment:
 *   RESEND_API_KEY           turns sending on
 *   BOOKING_EMAIL_FROM       e.g. "Bryan Kleppe <bryan@truhu.ai>"; until the
 *                            domain is verified in Resend it must stay the
 *                            default, which can only send to the address the
 *                            Resend account was opened with
 *   BOOKING_EMAIL_REPLY_TO   where replies (and RSVPs) go: Bryan's real inbox
 *   BOOKING_NOTIFY_TO        comma-separated team addresses told of each booking
 *   BOOKING_MEETING_URL      a standing Zoom link to put in every invite
 *
 * Without RESEND_API_KEY, in development, each email is written to a folder
 * in the system temp directory instead, so it can be previewed.
 */

const DEFAULT_FROM = "Bryan Kleppe <onboarding@resend.dev>";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

type Kind = "booked" | "moved" | "cancelled";

export const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const addressOf = (from: string) => from.match(/<([^>]+)>/)?.[1] ?? from.trim();

function settings() {
  const from = process.env.BOOKING_EMAIL_FROM || DEFAULT_FROM;
  const replyTo = process.env.BOOKING_EMAIL_REPLY_TO || undefined;
  return {
    key: process.env.RESEND_API_KEY ?? "",
    from,
    replyTo,
    // RSVPs go to the organizer, so make that a real inbox when there is one.
    organizer: { name: MEETING.host, email: replyTo ?? addressOf(from) },
    notify: (process.env.BOOKING_NOTIFY_TO ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    meetingUrl: process.env.BOOKING_MEETING_URL || undefined,
  };
}

/* ------------------------------------------------------------- sending */

export type Message = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  /** The calendar file, attached as invite.ics. The guide emails (lib/guide/email.ts) have none. */
  ics?: string;
  method?: "REQUEST" | "CANCEL" | "PUBLISH";
  idempotencyKey: string;
};

export async function send(message: Message) {
  const s = settings();
  if (!s.key) {
    if (process.env.NODE_ENV === "production") return;
    const dir = path.join(tmpdir(), "truhu-outbox");
    await mkdir(dir, { recursive: true });
    const base = path.join(dir, `${Date.now()}-${message.idempotencyKey.replace(/[^a-z0-9]+/gi, "-")}`);
    await writeFile(`${base}.html`, message.html);
    if (message.ics) await writeFile(`${base}.ics`, message.ics);
    console.info(`[email] RESEND_API_KEY not set; "${message.subject}" to ${message.to.join(", ")} saved to ${base}.html`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${s.key}`,
      "content-type": "application/json",
      // A retried request never sends the same email twice.
      "idempotency-key": message.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from: s.from,
      to: message.to,
      ...(s.replyTo ? { reply_to: s.replyTo } : {}),
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.ics
        ? {
            attachments: [
              {
                filename: "invite.ics",
                content: Buffer.from(message.ics).toString("base64"),
                content_type: `text/calendar; charset=utf-8; method=${message.method ?? "REQUEST"}`,
              },
            ],
          }
        : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    const hint = /only send testing emails|verify a domain/i.test(body)
      ? " (Resend is in test mode: until truhu.ai is verified it only sends to the Resend account's own address)"
      : "";
    throw new Error(`Resend ${res.status}${hint}: ${body.slice(0, 300)}`);
  }
}

/* ------------------------------------------------------------ template */

export function layout(opts: { preheader: string; heading: string; body: string; footer: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;color:#0a1826;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e9f1;border-radius:16px 16px 0 16px;">
<tr><td style="padding:28px 32px 0 32px;">
<p style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#0582dc;">tru<span style="color:#38b000;">hu</span></p>
<h1 style="margin:22px 0 0 0;font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:#0a1826;">${esc(opts.heading)}</h1>
</td></tr>
<tr><td style="padding:16px 32px 28px 32px;font-size:15px;line-height:1.6;color:#46586c;">${opts.body}</td></tr>
<tr><td style="padding:18px 32px 24px 32px;border-top:1px solid #e2e9f1;font-size:12px;line-height:1.6;color:#7b8da1;">${opts.footer}</td></tr>
</table>
<p style="margin:16px 0 0 0;font-size:11px;color:#7b8da1;">Truly Human Technologies, Inc. · truhu.ai</p>
</td></tr></table>
</body></html>`;
}

export function button(href: string, label: string, primary = false) {
  return `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;${
    primary ? "background:#38b000;color:#050e1a;" : "background:#f4f7fb;color:#0a1826;border:1px solid #e2e9f1;"
  }">${esc(label)}</a>`;
}

function whenLines(booking: Booking, zone: string) {
  return {
    date: formatLongDate(booking.start, zone),
    time: `${formatTime(booking.start, zone)} – ${formatTime(booking.end, zone)} ${zoneAbbreviation(booking.start, zone)}`,
    short: `${formatLongDate(booking.start, zone).replace(/^(\w+), /, (_, d: string) => `${d.slice(0, 3)}, `)} at ${formatTime(booking.start, zone)} ${zoneAbbreviation(booking.start, zone)}`,
  };
}

function eventFor(booking: Booking, origin: string, location: string | undefined) {
  const manage = booking.rescheduleUrl ? new URL(booking.rescheduleUrl, origin).toString() : undefined;
  return {
    uid: booking.uid,
    title: MEETING.title,
    start: booking.start,
    end: booking.end,
    location: location ?? "Zoom (link to follow from Bryan)",
    description: [
      `${MEETING.minutes} minutes with ${MEETING.host}, live on screen.`,
      "Bring one client you'd want this for.",
      location ? `Join: ${location}` : "Bryan will send the Zoom link before the call.",
      manage ? `Reschedule or cancel: ${manage}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/* -------------------------------------------------------------- emails */

function attendeeEmail(kind: Kind, booking: Booking, origin: string): Message {
  const s = settings();
  const zone = booking.attendee.timeZone;
  const when = whenLines(booking, zone);
  const first = booking.attendee.name.split(/\s+/)[0] || "there";
  const location = booking.meetingUrl ?? s.meetingUrl;
  const event = eventFor(booking, origin, location);
  const manage = booking.rescheduleUrl ? new URL(booking.rescheduleUrl, origin).toString() : null;
  const cancelUrl = booking.cancelUrl ? new URL(booking.cancelUrl, origin).toString() : null;
  const rebook = new URL("/BryanKleppe#calendar", origin).toString();
  const note = GET_STARTED_PAGE.confirmed.note;
  const prep = GET_STARTED_PAGE.confirmed.prep;

  const heading =
    kind === "cancelled"
      ? "Your TruHu demo is cancelled"
      : kind === "moved"
        ? `Your demo has moved, ${first}`
        : `You're booked, ${first}`;
  const subject =
    kind === "cancelled"
      ? `Cancelled: ${MEETING.title} · ${when.short}`
      : kind === "moved"
        ? `Updated: ${MEETING.title} · ${when.short}`
        : `Invitation: ${MEETING.title} · ${when.short}`;

  const details = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px 0;background:#f4f7fb;border-radius:12px 12px 0 12px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0;font-size:16px;font-weight:700;color:#0a1826;${kind === "cancelled" ? "text-decoration:line-through;" : ""}">${esc(when.date)}</p>
<p style="margin:2px 0 0 0;font-size:14px;color:#46586c;">${esc(when.time)} · ${MEETING.minutes} min with ${esc(MEETING.host)}</p>
${
  kind === "cancelled"
    ? ""
    : `<p style="margin:8px 0 0 0;font-size:14px;color:#46586c;">${
        location
          ? `Join: <a href="${esc(location)}" style="color:#0463a8;">${esc(location)}</a>`
          : "Video call: Bryan will send the Zoom link before the call."
      }</p>`
}
</td></tr></table>`;

  const body =
    kind === "cancelled"
      ? `<p style="margin:0 0 4px 0;">The time is released and it's off your calendar. If another time works better, pick one below.</p>
${details}
${button(rebook, "Pick a new time", true)}`
      : `<p style="margin:0 0 4px 0;">${
          kind === "moved" ? "Here's the new time. Your calendar entry updates with it." : "Here's your invite. Accept it and it's on your calendar."
        }</p>
${details}
${button(googleCalendarUrl(event), "Add to Google Calendar")}${button(outlookCalendarUrl(event), "Add to Outlook")}
<h2 style="margin:18px 0 6px 0;font-size:15px;color:#0a1826;">${esc(note.label)}</h2>
${note.paragraphs.map((p) => `<p style="margin:0 0 10px 0;">${esc(p)}</p>`).join("")}
<p style="margin:0 0 14px 0;color:#0a1826;font-weight:600;">${esc(note.signoff)}</p>
<h2 style="margin:18px 0 6px 0;font-size:15px;color:#0a1826;">${esc(GET_STARTED_PAGE.confirmed.prepTitle)}</h2>
<ul style="margin:0;padding-left:18px;">${prep.map((p) => `<li style="margin:0 0 4px 0;">${esc(p)}</li>`).join("")}</ul>`;

  const footer =
    kind === "cancelled" || !manage
      ? "You're getting this because a demo was booked with this address on truhu.ai."
      : `Plans changed? <a href="${esc(manage)}" style="color:#0463a8;">Reschedule</a>${
          cancelUrl ? ` · <a href="${esc(cancelUrl)}" style="color:#0463a8;">Cancel</a>` : ""
        }<br>You're getting this because a demo was booked with this address on truhu.ai.`;

  const text = [
    heading,
    "",
    `${when.date}`,
    `${when.time} · ${MEETING.minutes} min with ${MEETING.host}`,
    kind === "cancelled"
      ? `Pick a new time: ${rebook}`
      : location
        ? `Join: ${location}`
        : "Bryan will send the Zoom link before the call.",
    "",
    ...(kind === "cancelled" ? [] : [...note.paragraphs, "", `— ${note.signoff}`, ""]),
    ...(manage && kind !== "cancelled" ? [`Reschedule or cancel: ${manage}`] : []),
  ].join("\n");

  return {
    to: [booking.attendee.email],
    subject,
    html: layout({ preheader: `${when.date}, ${when.time}`, heading, body, footer }),
    text,
    ics: inviteIcs({
      ...event,
      method: kind === "cancelled" ? "CANCEL" : "REQUEST",
      organizer: s.organizer,
      attendee: { name: booking.attendee.name, email: booking.attendee.email },
    }),
    method: kind === "cancelled" ? "CANCEL" : "REQUEST",
    idempotencyKey: `attendee:${kind}:${booking.uid}:${booking.start}`,
  };
}

function teamEmail(kind: Kind, booking: Booking, origin: string, to: string[]): Message {
  const s = settings();
  const host = whenLines(booking, MEETING.hostZone);
  const theirs = whenLines(booking, booking.attendee.timeZone);
  const who = `${booking.attendee.name}${booking.agency ? ` (${booking.agency})` : ""}`;
  const verb = kind === "cancelled" ? "Cancelled" : kind === "moved" ? "Moved" : "New demo";
  const subject = `${verb}: ${who} · ${host.short}`;
  const manage = booking.rescheduleUrl ? new URL(booking.rescheduleUrl, origin).toString() : null;
  const location = booking.meetingUrl ?? s.meetingUrl;
  const event = eventFor(booking, origin, location);

  const rows: [string, string][] = [
    ["When (ET)", `${host.date}, ${host.time}`],
    ["Their time", `${theirs.time} (${booking.attendee.timeZone.replace(/_/g, " ")})`],
    ["Name", booking.attendee.name],
    ["Email", booking.attendee.email],
    ["Agency", booking.agency ?? "—"],
    ["Clients", booking.clients ?? "—"],
  ];

  const body = `<p style="margin:0 0 12px 0;">${
    kind === "cancelled"
      ? "This booking was cancelled and the time is open again."
      : kind === "moved"
        ? "This booking moved to a new time."
        : location
          ? "A demo was just booked on truhu.ai/BryanKleppe."
          : "A demo was just booked on truhu.ai/BryanKleppe. Send them the Zoom link before the call (reply to the invite thread or email them directly)."
  }</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#7b8da1;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;color:#0a1826;">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;

  return {
    to,
    subject,
    html: layout({
      preheader: `${who}, ${host.date} ${host.time}`,
      heading: `${verb}: ${who}`,
      body,
      footer: manage ? `Booking page: <a href="${esc(manage)}" style="color:#0463a8;">${esc(manage)}</a>` : "",
    }),
    text: [`${verb}: ${who}`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", manage ? `Booking: ${manage}` : ""].join("\n"),
    ics: inviteIcs({
      ...event,
      title: `${MEETING.title}: ${who}`,
      method: kind === "cancelled" ? "CANCEL" : "PUBLISH",
      organizer: s.organizer,
    }),
    method: kind === "cancelled" ? "CANCEL" : "PUBLISH",
    idempotencyKey: `team:${kind}:${booking.uid}:${booking.start}`,
  };
}

/**
 * Send the booking's emails. Never throws: a failed email is logged and must
 * not undo a booking that has already been made.
 */
export async function sendBookingEmails(kind: Kind, booking: Booking, origin: string) {
  const s = settings();
  const jobs: Promise<void>[] = [send(attendeeEmail(kind, booking, origin))];
  if (s.notify.length) jobs.push(send(teamEmail(kind, booking, origin, s.notify)));
  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === "rejected") console.error("[email] send failed", result.reason);
  }
}

/**
 * Calendar plumbing: "add to calendar" links for the confirmation page, a
 * plain .ics download, and the invitation file attached to booking emails.
 */

type CalendarEvent = {
  title: string;
  description: string;
  start: string;
  end: string;
  location?: string;
};

/** 20261014T130000Z */
const stamp = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(event: CalendarEvent) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("dates", `${stamp(event.start)}/${stamp(event.end)}`);
  url.searchParams.set("details", event.description);
  if (event.location) url.searchParams.set("location", event.location);
  return url.toString();
}

export function outlookCalendarUrl(event: CalendarEvent) {
  // The work (Microsoft 365) composer; brokers are overwhelmingly on it.
  const url = new URL("https://outlook.office.com/calendar/0/deeplink/compose");
  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", event.title);
  url.searchParams.set("startdt", new Date(event.start).toISOString());
  url.searchParams.set("enddt", new Date(event.end).toISOString());
  url.searchParams.set("body", event.description);
  if (event.location) url.searchParams.set("location", event.location);
  return url.toString();
}

const escapeIcs = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

/** RFC 5545 lines must not exceed 75 octets; longer ones are folded. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

/**
 * A real meeting invitation (RFC 5546 iTIP), the kind Gmail and Outlook show
 * with Accept / Decline. One event uid per booking and a rising SEQUENCE, so a
 * move updates the same calendar entry and a cancellation removes it.
 */
export function inviteIcs(event: CalendarEvent & {
  uid: string;
  method: "REQUEST" | "CANCEL" | "PUBLISH";
  organizer: { name: string; email: string };
  attendee?: { name: string; email: string };
}) {
  const cancelled = event.method === "CANCEL";
  // Seconds since late 2025: always rising, comfortably inside an int.
  const sequence = Math.max(0, Math.floor(Date.now() / 1000) - 1_760_000_000);
  const person = (who: { name: string; email: string }) =>
    `CN=${JSON.stringify(who.name.replace(/"/g, ""))}:mailto:${who.email}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TruHu//Get started//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${event.method}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}@truhu.ai`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
    `ORGANIZER;${person(event.organizer)}`,
    ...(event.attendee
      ? [
          `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=${cancelled ? "DECLINED" : "NEEDS-ACTION"};RSVP=${cancelled ? "FALSE" : "TRUE"};${person(event.attendee)}`,
        ]
      : []),
    `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
    ...(cancelled
      ? []
      : [
          "BEGIN:VALARM",
          "TRIGGER:-PT10M",
          "ACTION:DISPLAY",
          "DESCRIPTION:TruHu demo in 10 minutes",
          "END:VALARM",
        ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsFile(event: CalendarEvent & { uid: string; organizerEmail?: string }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TruHu//Get started//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@truhu.ai`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
    ...(event.organizerEmail ? [`ORGANIZER:mailto:${event.organizerEmail}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:TruHu demo in 10 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

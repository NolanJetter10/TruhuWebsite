import {
  ArrowsClockwise,
  CalendarPlus,
  Check,
  Play,
  VideoCamera,
  XCircle,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Avatar } from "@/components/get-started/Avatar";
import { FunnelTracker } from "@/components/get-started/FunnelTracker";
import { TextLink } from "@/components/ui/CTAButton";
import { Container, Section } from "@/components/ui/primitives";
import { bookingProvider, MEETING } from "@/lib/booking";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/booking/calendar-links";
import { formatLongDate, formatTime, zoneAbbreviation } from "@/lib/booking/time";
import type { Booking } from "@/lib/booking/types";
import { GET_STARTED_PAGE } from "@/lib/content";

const { confirmed, host, proof } = GET_STARTED_PAGE;

export const metadata: Metadata = {
  title: confirmed.meta.title,
  robots: { index: false, follow: false },
};

/**
 * Where the widget lands after a booking. It reads the booking back from the
 * scheduler by its uid, so a refresh or a link from the confirmation email
 * shows the same thing; without one (or if the lookup fails) it still
 * confirms, just without the specifics.
 */
export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string | string[]; moved?: string }>;
}) {
  const { b, moved } = await searchParams;
  const uid = typeof b === "string" && b.length < 600 ? b : null;
  const booking = uid
    ? await (bookingProvider()?.getBooking(uid) ?? Promise.resolve(null)).catch(() => null)
    : null;

  const firstName = booking?.attendee.name.split(/\s+/)[0];
  const cancelled = booking?.status === "cancelled";
  // Absolute links for the calendar entry, on whichever host served this page.
  const head = await headers();
  const origin = `${head.get("x-forwarded-proto") ?? "http"}://${head.get("host") ?? "truhu.ai"}`;
  const title = cancelled
    ? confirmed.cancelledTitle
    : moved
      ? confirmed.movedTitle
      : confirmed.title;

  return (
    <>
      <FunnelTracker page="/get-started" resumeOnly />

      <Section tone="dark" ambient size="none" className="pt-12 pb-20 sm:pt-16 lg:pt-20 lg:pb-24">
        <Container>
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
            {/* The booking -------------------------------------------------- */}
            <div data-section="confirmed">
              <span
                className={
                  cancelled
                    ? "grid size-14 place-items-center rounded-full bg-white/10 text-white"
                    : "grid size-14 place-items-center rounded-full bg-green-500 text-ink-950 shadow-[0_0_0_10px_rgba(56,176,0,0.14)]"
                }
                style={{ animation: "hero-in 600ms var(--ease-out-back) both" }}
              >
                {cancelled ? (
                  <XCircle className="size-7" />
                ) : (
                  <Check weight="bold" className="size-7" />
                )}
              </span>
              <h1
                className="t-h1 mt-7 text-white"
                style={{ animation: "hero-in 700ms var(--ease-out-expo) 120ms both" }}
              >
                {title}
                {firstName && !cancelled ? (
                  <>
                    , <span className="t-gradient">{firstName}.</span>
                  </>
                ) : (
                  "."
                )}
              </h1>
              <p
                className="t-lede measure mt-5 text-slate-300"
                style={{ animation: "hero-in 700ms var(--ease-out-expo) 200ms both" }}
              >
                {!booking ? (
                  confirmed.fallbackLede
                ) : cancelled ? (
                  confirmed.cancelledLede
                ) : booking.invites ? (
                  <>
                    {moved ? confirmed.updatedInviteTo : confirmed.inviteTo}{" "}
                    <span className="font-semibold text-white">{booking.attendee.email}</span>.
                    {booking.meetingUrl ? null : <> {confirmed.linkToFollow}</>}
                  </>
                ) : (
                  <>
                    {confirmed.heldFor}{" "}
                    <span className="font-semibold text-white">{booking.attendee.email}</span>{" "}
                    {confirmed.heldTail}
                  </>
                )}
              </p>

              {cancelled ? (
                <Link
                  href={confirmed.rebook.href}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-[0.9375rem] font-semibold text-ink-950 hover:bg-green-400"
                >
                  {confirmed.rebook.label} &rarr;
                </Link>
              ) : booking ? (
                <BookingCard booking={booking} origin={origin} />
              ) : null}
            </div>

            {/* A note from Bryan -------------------------------------------- */}
            <section
              data-section="note"
              aria-labelledby="note-heading"
              className="card-shape-lg self-start overflow-hidden border border-white/10 bg-white text-ink shadow-[0_40px_90px_-40px_rgba(2,8,18,0.85)]"
              style={{ animation: "hero-in 800ms var(--ease-out-expo) 320ms both" }}
            >
              <VideoSlot video={confirmed.note.video} pending={confirmed.note.videoPending} />
              <div className="p-6 sm:p-7">
                <h2 id="note-heading" className="t-h4">
                  {confirmed.note.label}
                </h2>
                <div className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-slate-600">
                  {confirmed.note.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <Avatar name={host.name} photo={host.photo} size={40} />
                  <div>
                    <p className="text-[0.9375rem] font-semibold">{confirmed.note.signoff}</p>
                    <p className="text-[0.8125rem] text-slate-400">
                      {host.role}, TruHu
                    </p>
                  </div>
                </div>

                <h3 className="mt-7 border-t border-line pt-5 text-[0.8125rem] font-semibold text-slate-600">
                  {confirmed.prepTitle}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {confirmed.prep.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[0.9375rem]">
                      <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                        <Check weight="bold" className="size-2.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </Container>
      </Section>

      {/* Proof, repeated lightly ---------------------------------------------- */}
      <Section tone="paper" size="tight">
        <Container>
          <div
            data-section="proof"
            className="grid items-center gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
          >
            <figure className="flex items-start gap-4">
              <Avatar name={proof.name} photo={proof.photo} size={44} />
              <div>
                <blockquote className="font-display text-[1.0625rem] leading-relaxed font-medium">
                  &ldquo;{proof.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-2 text-[0.8125rem] text-slate-600">
                  <span className="font-semibold text-ink">{proof.name}</span> · {proof.role},{" "}
                  {proof.agency}
                </figcaption>
              </div>
            </figure>
            <dl className="grid grid-cols-2 gap-6 md:border-l md:border-line md:pl-8">
              {proof.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="t-h2 t-gradient-dark tabular">{stat.value}</dd>
                  <dt className="mt-1 text-[0.8125rem] text-slate-600">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-10 border-t border-line pt-6">
            <TextLink href={confirmed.back.href}>{confirmed.back.label}</TextLink>
          </div>
        </Container>
      </Section>
    </>
  );
}

function BookingCard({ booking, origin }: { booking: Booking; origin: string }) {
  const zone = booking.attendee.timeZone;
  const event = {
    title: MEETING.title,
    description: [
      `${MEETING.minutes} minutes with ${MEETING.host}, live on screen.`,
      "Bring one client you'd want this for.",
      booking.meetingUrl ? `Join: ${booking.meetingUrl}` : "",
      booking.rescheduleUrl
        ? `Reschedule or cancel: ${new URL(booking.rescheduleUrl, origin)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    start: booking.start,
    end: booking.end,
    location: booking.meetingUrl,
  };

  const calendars = [
    { label: confirmed.calendars.google, href: googleCalendarUrl(event), external: true },
    { label: confirmed.calendars.outlook, href: outlookCalendarUrl(event), external: true },
    {
      label: confirmed.calendars.ics,
      href: `/api/booking/${encodeURIComponent(booking.uid)}/ics`,
      external: false,
    },
  ];

  return (
    <div
      className="card-shape mt-9 border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm sm:p-7"
      style={{ animation: "hero-in 800ms var(--ease-out-expo) 280ms both" }}
    >
      <div className="flex items-start gap-4">
        <Avatar name={MEETING.host} photo={host.photo} size={52} />
        <div className="min-w-0">
          <p className="t-h3 text-white">{formatLongDate(booking.start, zone)}</p>
          <p className="mt-1 text-[0.9375rem] text-slate-300 tabular">
            {formatTime(booking.start, zone)} – {formatTime(booking.end, zone)}{" "}
            {zoneAbbreviation(booking.start, zone)} · {MEETING.minutes} min {confirmed.with}
          </p>
          {booking.meetingUrl ? (
            <a
              href={booking.meetingUrl}
              target="_blank"
              rel="noreferrer"
              data-track="Join link"
              className="mt-3 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-blue-400 hover:underline"
            >
              <VideoCamera aria-hidden className="size-4" />
              Video link
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-[0.8125rem] font-semibold text-slate-300">{confirmed.calendarLabel}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {calendars.map((cal) => (
            <a
              key={cal.label}
              href={cal.href}
              data-track={`Add to calendar: ${cal.label}`}
              {...(cal.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.875rem] font-semibold text-ink transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-green-100"
            >
              <CalendarPlus aria-hidden className="size-4 text-green-700" />
              {cal.label}
            </a>
          ))}
        </div>
      </div>

      {booking.rescheduleUrl || booking.cancelUrl ? (
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.875rem] text-slate-300">
          {confirmed.manageLabel}
          {booking.rescheduleUrl ? (
            <ManageLink href={booking.rescheduleUrl} track="Reschedule">
              <ArrowsClockwise aria-hidden className="size-4" />
              {confirmed.reschedule}
            </ManageLink>
          ) : null}
          {booking.cancelUrl ? (
            <ManageLink href={booking.cancelUrl} track="Cancel">
              <XCircle aria-hidden className="size-4" />
              {confirmed.cancel}
            </ManageLink>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function ManageLink({
  href,
  track,
  children,
}: {
  href: string;
  track: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex items-center gap-1.5 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white";
  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noreferrer" data-track={track} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} data-track={track} className={className}>
      {children}
    </Link>
  );
}

/** Bryan's video note, or a quiet frame where it will go. */
function VideoSlot({ video, pending }: { video: string | null; pending: string }) {
  if (video) {
    return /^https?:\/\//.test(video) ? (
      <iframe
        src={video}
        title="A note from Bryan"
        allow="autoplay; fullscreen; picture-in-picture"
        className="aspect-video w-full border-0"
      />
    ) : (
      <video src={video} controls playsInline preload="metadata" className="aspect-video w-full bg-ink-950" />
    );
  }
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden bg-ink-900">
      <div className="grid-field opacity-70" aria-hidden />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm">
          <Play weight="fill" className="size-5 translate-x-px" />
        </span>
        <span className="text-[0.8125rem] font-semibold text-slate-300">{pending}</span>
      </div>
    </div>
  );
}

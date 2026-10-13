import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/get-started/Avatar";
import { BookingWidget } from "@/components/get-started/BookingWidget";
import { CancelMeeting } from "@/components/get-started/CancelMeeting";
import { FunnelTracker } from "@/components/get-started/FunnelTracker";
import { Container, Section } from "@/components/ui/primitives";
import { bookingProvider, MEETING } from "@/lib/booking";
import { formatLongDate, formatTime, zoneAbbreviation } from "@/lib/booking/time";
import { GET_STARTED_PAGE } from "@/lib/content";

const { manage, booking: bookingCopy, confirmed, host } = GET_STARTED_PAGE;

export const metadata: Metadata = {
  title: manage.meta.title,
  robots: { index: false, follow: false },
};

/**
 * Where the "Reschedule" and "Cancel" links land while the placeholder
 * scheduler is in use. The uid in the path is the permission, as with
 * Cal.com's own links. Once Cal.com is connected its bookings carry Cal.com's
 * links instead, and anything that still arrives here is sent on to them.
 */
export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ cancel?: string }>;
}) {
  const [{ uid }, { cancel }] = await Promise.all([params, searchParams]);
  const provider = bookingProvider();
  const booking = provider
    ? await provider.getBooking(uid).catch(() => null)
    : null;

  if (booking && provider?.name === "cal") {
    const target = cancel ? booking.cancelUrl : booking.rescheduleUrl;
    if (target?.startsWith("http")) redirect(target);
  }

  const zone = booking?.attendee.timeZone ?? "America/New_York";
  const cancelled = booking?.status === "cancelled";

  return (
    <>
      <FunnelTracker page="/get-started" resumeOnly />
      <Section tone="dark" ambient size="none" className="pt-12 pb-20 sm:pt-16 lg:pt-20 lg:pb-24">
        <Container>
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,35rem)] lg:items-start">
            {/* Name and email show here, so session recordings mask it. */}
            <div data-section="manage" data-clarity-mask="true">
              <h1 className="t-h1 text-white">{manage.title}</h1>

              {!booking ? (
                <p className="t-lede measure mt-5 text-slate-300">{manage.notFound}</p>
              ) : (
                <>
                  <div className="card-shape mt-8 flex items-start gap-4 border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm sm:p-7">
                    <Avatar name={MEETING.host} photo={host.photo} size={52} />
                    <div className="min-w-0">
                      <p className={`t-h3 text-white ${cancelled ? "line-through decoration-white/40" : ""}`}>
                        {formatLongDate(booking.start, zone)}
                      </p>
                      <p className="mt-1 text-[0.9375rem] text-slate-300 tabular">
                        {formatTime(booking.start, zone)} – {formatTime(booking.end, zone)}{" "}
                        {zoneAbbreviation(booking.start, zone)} · {MEETING.minutes} min{" "}
                        {confirmed.with}
                      </p>
                      <p className="mt-3 text-[0.875rem] text-slate-300">
                        {booking.attendee.name} · {booking.attendee.email}
                      </p>
                    </div>
                  </div>

                  {cancelled ? (
                    <>
                      <p className="t-lede mt-6 text-slate-300">{manage.cancelled}</p>
                      <Link
                        href={confirmed.rebook.href}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-[0.9375rem] font-semibold text-ink-950 hover:bg-green-400"
                      >
                        {confirmed.rebook.label} &rarr;
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-10 text-[0.9375rem] font-semibold text-white">
                        {manage.moveTitle}
                      </h2>
                      <p className="mt-1 text-[0.9375rem] text-slate-300">{manage.moveBody}</p>

                      <h2 id="cancel" className="mt-8 text-[0.9375rem] font-semibold text-white">
                        {manage.cancelTitle}
                      </h2>
                      <p className="mt-1 text-[0.9375rem] text-slate-300">{manage.cancelBody}</p>
                      <CancelMeeting uid={booking.uid} copy={manage} startOpen={Boolean(cancel)} />
                    </>
                  )}
                </>
              )}
            </div>

            {booking && !cancelled ? (
              <div className="demo-in">
                <BookingWidget
                  copy={bookingCopy}
                  hostName={host.name}
                  hostPhoto={host.photo}
                  reschedule={{ uid: booking.uid }}
                />
              </div>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}

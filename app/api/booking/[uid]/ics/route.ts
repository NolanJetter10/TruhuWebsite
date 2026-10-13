import type { NextRequest } from "next/server";
import { bookingProvider, MEETING } from "@/lib/booking";
import { icsFile } from "@/lib/booking/calendar-links";

/** The booking as an .ics file, for Apple Calendar and anything else. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const booking = await bookingProvider()
    ?.getBooking(uid)
    .catch(() => null);
  if (!booking) return new Response("Not found", { status: 404 });

  const body = icsFile({
    uid: booking.uid,
    title: MEETING.title,
    description: [
      `${MEETING.minutes} minutes with ${MEETING.host}, live on screen.`,
      "Bring one client you'd want this for.",
      booking.meetingUrl ? `Join: ${booking.meetingUrl}` : "",
      booking.rescheduleUrl?.startsWith("http") ? `Reschedule: ${booking.rescheduleUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    start: booking.start,
    end: booking.end,
    location: booking.meetingUrl,
  });

  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="truhu-demo.ics"',
      "cache-control": "private, no-store",
    },
  });
}

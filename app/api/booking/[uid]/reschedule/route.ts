import { bookingProvider, forgetSlots } from "@/lib/booking";
import { BookingError } from "@/lib/booking/types";

/**
 * Moves a booking to a new time. The uid in the path is the permission, the
 * same model as Cal.com's own reschedule links: only the person holding the
 * confirmation link has it.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const provider = bookingProvider();
  if (!provider?.reschedule) {
    return Response.json({ error: "Rescheduling isn't available here." }, { status: 400 });
  }

  let start = "";
  try {
    const body = await request.json();
    start = typeof body.start === "string" ? body.start : "";
  } catch {}
  const at = new Date(start);
  if (!start || Number.isNaN(at.getTime()) || at.getTime() < Date.now()) {
    return Response.json({ error: "Pick a time that's still ahead." }, { status: 422 });
  }

  try {
    const booking = await provider.reschedule(uid, at.toISOString());
    forgetSlots();
    return Response.json({ ok: true, uid: booking.uid });
  } catch (error) {
    if (error instanceof BookingError) {
      const status =
        error.code === "slot_taken" ? 409 : error.code === "not_found" ? 404 : 422;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    console.error("[booking] reschedule failed", error);
    return Response.json(
      { error: "That didn't go through. Try again in a moment." },
      { status: 502 },
    );
  }
}

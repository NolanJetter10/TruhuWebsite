import { bookingProvider, forgetSlots } from "@/lib/booking";
import { BookingError } from "@/lib/booking/types";

/** Cancels a booking and frees its time. The uid is the permission. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  const provider = bookingProvider();
  if (!provider?.cancel) {
    return Response.json({ error: "Cancelling isn't available here." }, { status: 400 });
  }
  try {
    await provider.cancel(uid);
    forgetSlots();
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BookingError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.code === "not_found" ? 404 : 422 },
      );
    }
    console.error("[booking] cancel failed", error);
    return Response.json(
      { error: "That didn't go through. Try again in a moment." },
      { status: 502 },
    );
  }
}

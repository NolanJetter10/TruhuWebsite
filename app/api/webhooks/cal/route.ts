import { createHmac, timingSafeEqual } from "node:crypto";
import { updateBookingStatus } from "@/lib/analytics/store";

/**
 * Cal.com tells us when a booking made on the page is cancelled or moved, so
 * the dashboard's booked count stays honest after the fact. Point a Cal.com
 * webhook (Settings → Developer → Webhooks) at /api/webhooks/cal with the
 * BOOKING_CANCELLED and BOOKING_RESCHEDULED triggers and a secret, and put the
 * same secret in CAL_WEBHOOK_SECRET.
 *
 * The signature is an HMAC-SHA256 of the exact body, so the body is read as
 * text and verified before it is parsed.
 */

type CalPayload = {
  uid?: string;
  rescheduleUid?: string;
  startTime?: string;
  endTime?: string;
};

function verified(raw: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 503 });

  const raw = await request.text();
  if (!verified(raw, request.headers.get("x-cal-signature-256") ?? "", secret)) {
    return new Response("Bad signature", { status: 401 });
  }

  let body: { triggerEvent?: string; payload?: CalPayload };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const payload = body.payload ?? {};
  try {
    if (body.triggerEvent === "BOOKING_CANCELLED" && payload.uid) {
      await updateBookingStatus({ booking_uid: payload.uid, new_status: "cancelled" });
    } else if (body.triggerEvent === "BOOKING_RESCHEDULED" && payload.uid) {
      // The payload is the new booking; `rescheduleUid` names the one it replaced.
      await updateBookingStatus({
        booking_uid: payload.rescheduleUid ?? payload.uid,
        new_status: "rescheduled",
        new_start: payload.startTime ?? null,
        new_end: payload.endTime ?? null,
        new_uid: payload.uid,
      });
    }
  } catch (error) {
    console.error("[analytics] webhook update failed", error);
    // A 5xx asks Cal.com to retry, which is what we want for a database blip.
    return new Response("Update failed", { status: 500 });
  }

  return Response.json({ ok: true });
}

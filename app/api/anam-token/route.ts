import { anamConfigured, createSessionToken } from "@/lib/anam";
import { clientIp, json, rateLimited, sameOrigin, visitorFromRequest } from "@/lib/ensemble";

/**
 * Starts the video call with Bryan's avatar: a short-lived Anam session token
 * for his face and voice, capped at five minutes. Only a browser the chat has
 * already given a visitor cookie can ask, and only a few times an hour, since
 * every minute of video is billed.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  if (!anamConfigured()) return json({ error: "Video calls are not set up yet." }, 503);

  const visitor = visitorFromRequest(request);
  if (!visitor) return json({ error: "Open the chat first." }, 401);
  // A whole office shares one address (and on a dev server every browser and
  // test run does), so the per-address cap is wide; each visitor still gets
  // only a few calls an hour.
  const dev = process.env.NODE_ENV === "development";
  if (
    rateLimited(`call:${visitor}`, dev ? 60 : 6, 60 * 60_000) ||
    rateLimited(`call-ip:${clientIp(request)}`, dev ? 200 : 60, 60 * 60_000)
  ) {
    return json({ error: "Too many calls. Try again later." }, 429);
  }

  try {
    return json({ sessionToken: await createSessionToken() });
  } catch (error) {
    console.error("[anam] session token failed", error);
    return json({ error: "The video call could not start." }, 502);
  }
}

import {
  chatConfigured,
  clientIp,
  json,
  newVisitorId,
  rateLimited,
  sameOrigin,
  signToken,
  visitorCookie,
  visitorFromRequest,
} from "@/lib/ensemble";

/**
 * Hands the chat widget a ten-minute token. Every visitor is anonymous: the
 * server gives each browser an opaque id in an HttpOnly cookie and signs the
 * token for that id alone. The caller supplies nothing that reaches the token,
 * so one visitor can never ask for another's identity.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  if (!chatConfigured()) return json({ error: "Chat is not set up yet." }, 503);
  if (rateLimited(`token:${clientIp(request)}`, 30, 60_000)) {
    return json({ error: "Too many requests." }, 429);
  }

  const existing = visitorFromRequest(request);
  const visitorId = existing ?? newVisitorId();
  const origin = new URL(request.url).origin;

  return json(
    { token: signToken(visitorId), baseUrl: `${origin}/api/ensemble` },
    200,
    existing ? undefined : { "Set-Cookie": visitorCookie(request, visitorId) },
  );
}

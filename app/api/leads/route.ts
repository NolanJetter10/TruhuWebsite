import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { contextFields, recordLead } from "@/lib/analytics/store";
import { clientIp, json, rateLimited, sameOrigin } from "@/lib/ensemble";
import { sendLeadEmails } from "@/lib/guide/email";

/**
 * A request from two of Bryan's paths on /BryanKleppe (the third, rebuilding
 * last year's guide, is the upload at /api/guide):
 *
 *   samples  the sample picker's work email, to have the samples sent
 *   build    a work email and the client's website, for a guide built from it
 *
 * Body: `{ path, email, clientUrl?, website, context }`, where `website` is
 * the honeypot and `context` the browser's trackingContext(). It answers
 * `{ ok: true }` or `{ error, code }` (422 for a bad email or website, 429
 * for too many), then records the lead, which marks the visit converted, and
 * sends the team and the visitor their emails (lib/guide/email.ts).
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** A public host name: labels, a dot, and a letter (or punycode) TLD. No IPs or localhost. */
const HOST = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * The client's website as typed ("acme.com", "www.acme.com/benefits",
 * "http://acme.com") as `https://host/path`, or null if it isn't one.
 */
function clientSite(raw: string): string | null {
  if (!raw || /\s/.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!HOST.test(url.hostname)) return null;
  url.protocol = "https:";
  url.username = "";
  url.password = "";
  url.port = "";
  url.hash = "";
  const clean = url.toString();
  return clean.length <= 500 ? clean : null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  // Honeypot: a field no person sees. Answer as if it worked.
  if (text(body.website, 200)) return json({ ok: true });

  const path = body.path;
  if (path !== "samples" && path !== "build") return json({ error: "Bad request." }, 400);

  const email = text(body.email, 200).toLowerCase();
  if (!EMAIL.test(email)) {
    return json({ error: "Enter a valid work email.", code: "email" }, 422);
  }

  let clientUrl: string | null = null;
  if (path === "build") {
    clientUrl = clientSite(text(body.clientUrl, 600));
    if (!clientUrl) {
      return json({ error: "Enter your client's website, like acme.com.", code: "client_url" }, 422);
    }
  }

  if (
    // Wide per address, since an office shares one; tight per email.
    rateLimited(`leads:${clientIp(request)}`, 30, 10 * 60_000) ||
    rateLimited(`leads:${email}`, 6, 10 * 60_000)
  ) {
    return json({ error: "That's a lot of requests in a few minutes. Try again shortly.", code: "rate" }, 429);
  }

  const tracked = contextFields(body.context);
  const id = randomUUID();
  const origin = new URL(request.url).origin;
  after(async () => {
    try {
      await recordLead({
        id,
        ...tracked,
        created_at: new Date().toISOString(),
        path,
        email,
        client_url: clientUrl,
      });
    } catch (error) {
      console.error("[leads] recording the lead failed", error);
    }
    const tags = { source: tracked.source ?? undefined, campaign: tracked.campaign ?? undefined };
    await sendLeadEmails(
      path === "build"
        ? { id, path, email, clientUrl: clientUrl!, ...tags }
        : { id, path, email, origin, ...tags },
    );
  });
  return json({ ok: true });
}

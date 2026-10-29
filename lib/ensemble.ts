import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Server-side helpers for the Ensemble chat on /BryanKleppe: the anonymous
 * visitor cookie, the short-lived JWT the widget authenticates with, and the
 * origin and rate checks both routes share. Nothing here is imported by client
 * code, and the signing secret never leaves this process.
 */

export const ENSEMBLE_UPSTREAM = "https://service.ensembleapp.dev";
/** The "Bryan Kleppe" agent. EnsembleChat names the same one. */
export const ENSEMBLE_AGENT_ID = "x9gUTsQSjGMeEpqDSATf";
export const TOKEN_TTL_S = 600;

const AUDIENCE = "ensembleapp.ai";
const COOKIE = "truhu_chat_visitor";
const VISITOR = /^[0-9a-f]{32}$/;

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

function credentials() {
  const secret = process.env.ENSEMBLE_JWT_SECRET;
  const keyId = process.env.ENSEMBLE_JWT_SECRET_ID;
  return secret && keyId ? { secret, keyId } : null;
}

export const chatConfigured = () => credentials() !== null;

const sign = (secret: string, input: string) =>
  createHmac("sha256", secret).update(input).digest();

/** HS256, the secret used as its literal string, the secret's id as `kid`. */
export function signToken(visitorId: string) {
  const creds = credentials();
  if (!creds) throw new Error("Ensemble credentials are not configured");
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT", kid: creds.keyId });
  const body = b64({
    sub: `visitor-${visitorId}`,
    iat: now,
    exp: now + TOKEN_TTL_S,
    aud: AUDIENCE,
  });
  const signature = sign(creds.secret, `${head}.${body}`).toString("base64url");
  return `${head}.${body}.${signature}`;
}

/** The `sub` of a token this server signed and that has not expired, else null. */
export function verifyToken(token: string) {
  const creds = credentials();
  const parts = token.split(".");
  if (!creds || parts.length !== 3) return null;
  const [head, body, signature] = parts;
  const expected = sign(creds.secret, `${head}.${body}`);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString());
    const header = JSON.parse(Buffer.from(head, "base64url").toString());
    if (header.alg !== "HS256" || claims.aud !== AUDIENCE) return null;
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;
    return typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

export function visitorFromRequest(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  const value = match?.slice(COOKIE.length + 1);
  return value && VISITOR.test(value) ? value : null;
}

export const newVisitorId = () => randomBytes(16).toString("hex");
export const subjectFor = (visitorId: string) => `visitor-${visitorId}`;

export function visitorCookie(request: Request, visitorId: string) {
  const https =
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https";
  return [
    `${COOKIE}=${visitorId}`,
    "Path=/api",
    `Max-Age=${60 * 60 * 24 * 365}`,
    "HttpOnly",
    "SameSite=Lax",
    https ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Browsers send Origin on every fetch POST/DELETE; it has to be this site. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

const hits = new Map<string, number[]>();

/** True once `key` has made more than `max` calls inside `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > max;
}

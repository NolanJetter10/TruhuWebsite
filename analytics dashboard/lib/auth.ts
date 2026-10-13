/**
 * One shared password, set as DASHBOARD_PASSWORD. Signing in stores an HMAC of
 * a fixed message keyed by that password in an httpOnly cookie, so changing
 * the password signs everyone out, and the cookie is useless without it.
 *
 * Web Crypto rather than node:crypto, so the same code runs in the proxy and
 * in route handlers whatever runtime either lands on.
 *
 * With no password set: open in development (with a banner saying so),
 * closed in production.
 */

export const COOKIE = "truhu_dash";
export const MAX_AGE = 60 * 60 * 24 * 30;

const PASSWORD = process.env.DASHBOARD_PASSWORD ?? "";

export const authMode: "password" | "open" | "locked" = PASSWORD
  ? "password"
  : process.env.NODE_ENV === "production"
    ? "locked"
    : "open";

export async function sessionToken(password = PASSWORD) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("truhu-analytics-dashboard:v1"),
  );
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string compare. */
export function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isSignedIn(cookieValue: string | undefined) {
  if (authMode === "open") return true;
  if (authMode === "locked" || !cookieValue) return false;
  return same(cookieValue, await sessionToken());
}

export function passwordMatches(candidate: string) {
  return authMode === "password" && same(candidate, PASSWORD);
}

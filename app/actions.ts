"use server";

/**
 * The form uses a server action with a honeypot and a coarse rate limit rather
 * than a CAPTCHA, so a demo request is never blocked on a third-party
 * challenge.
 *
 * There is no CRM wired up in this build. `deliver()` is the single seam: point
 * it at the CRM endpoint and everything else here stays as it is.
 */

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

const text = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function deliver(payload: Record<string, string>) {
  // Left as a server-side log on purpose, so the build runs end to end without
  // credentials. Swap for the CRM call when there is one.
  console.info("[truhu] demo request", payload);
}

export async function submitDemoRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Honeypot: a field no human sees and every naive bot fills in.
  if (text(formData.get("company_website"))) {
    return { ok: true, message: "Thanks. We will be in touch." };
  }

  const name = text(formData.get("name"));
  const email = text(formData.get("email"));
  const org = text(formData.get("org"));
  const note = text(formData.get("note"));
  const phone = text(formData.get("phone"));
  const groups = text(formData.get("groups"));
  const interest = text(formData.get("interest"));

  // Plan documents ride along by name only; nothing is stored in this build.
  const files = formData
    .getAll("plan_docs")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .map((f) => f.name)
    .join(", ");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please tell us your name.";
  if (!email) errors.email = "We need an email address to reply to.";
  else if (!EMAIL.test(email)) errors.email = "That does not look like an email address.";
  if (!org) errors.org = "Which brokerage are you with?";

  if (Object.keys(errors).length) return { ok: false, errors };

  if (rateLimited(email.toLowerCase())) {
    return {
      ok: false,
      message: "That is a lot of requests in a short window. Try again shortly.",
    };
  }

  await deliver({ name, email, org, note, phone, groups, interest, files });

  return {
    ok: true,
    message:
      "Thanks. We reply within one business day, and the first call is with someone who can answer the security questions.",
  };
}

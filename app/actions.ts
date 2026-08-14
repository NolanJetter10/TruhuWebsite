"use server";

/**
 * Forms use server actions with a honeypot and a coarse rate limit rather than
 * a CAPTCHA. A demo request is never blocked on a third-party challenge.
 * (File 04 §8.)
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

function required(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function deliver(kind: string, payload: Record<string, string>) {
  // Replace with the CRM endpoint. Left as a server-side log on purpose so the
  // build runs end to end without credentials.
  console.info(`[truhu] ${kind} submission`, payload);
}

export async function submitDemoRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Honeypot: a field no human sees and every naive bot fills in.
  if (required(formData.get("company_website"))) {
    return { ok: true, message: "Thanks. We will be in touch." };
  }

  const name = required(formData.get("name"));
  const email = required(formData.get("email"));
  const org = required(formData.get("org"));
  const role = required(formData.get("role"));
  const groups = required(formData.get("groups"));
  const note = required(formData.get("note"));

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please tell us your name.";
  if (!email) errors.email = "We need an email address to reply to.";
  else if (!EMAIL.test(email)) errors.email = "That does not look like an email address.";
  if (!org) errors.org = "Which brokerage or employer are you with?";

  if (Object.keys(errors).length) return { ok: false, errors };

  if (rateLimited(email.toLowerCase())) {
    return {
      ok: false,
      message: "That is a lot of requests in a short window. Try again shortly.",
    };
  }

  await deliver("demo", { name, email, org, role, groups, note });

  return {
    ok: true,
    message:
      "Thanks. We reply to demo requests within one business day, and the first call is with someone who can answer the security questions.",
  };
}

export async function submitEarlyAccess(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (required(formData.get("company_website"))) {
    return { ok: true, message: "Thanks. You are on the list." };
  }

  const email = required(formData.get("email"));
  const workflow = required(formData.get("workflow"));

  if (!email || !EMAIL.test(email)) {
    return { ok: false, errors: { email: "We need a valid email address." } };
  }
  if (rateLimited(email.toLowerCase())) {
    return { ok: false, message: "Try again shortly." };
  }

  await deliver("early-access", { email, workflow });

  return {
    ok: true,
    message:
      "You are on the list. We will write when the workflow moves, and we will not write otherwise.",
  };
}

export async function submitResourceRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (required(formData.get("company_website"))) {
    return { ok: true, message: "Thanks. Check your inbox." };
  }

  const email = required(formData.get("email"));
  const resource = required(formData.get("resource"));

  if (!email || !EMAIL.test(email)) {
    return { ok: false, errors: { email: "We need a valid email address." } };
  }
  if (rateLimited(email.toLowerCase())) {
    return { ok: false, message: "Try again shortly." };
  }

  await deliver("resource", { email, resource });

  return { ok: true, message: "Sent. It should be in your inbox shortly." };
}

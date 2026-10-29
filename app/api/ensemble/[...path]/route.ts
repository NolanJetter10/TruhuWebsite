import { flowWidgetRegistration } from "@/components/get-started/flows";
import {
  ENSEMBLE_AGENT_ID,
  ENSEMBLE_UPSTREAM,
  clientIp,
  json,
  rateLimited,
  sameOrigin,
  subjectFor,
  verifyToken,
  visitorFromRequest,
} from "@/lib/ensemble";

/**
 * A same-origin pass-through to the Ensemble service, for the six calls the
 * chat widget and the video call make. It is not a general proxy: the upstream
 * host is fixed, the method and path must match the list below, the agent is
 * always ours (and always its published version), the widgets are always the
 * page's two flows, and a call is only forwarded when its token is one this
 * server signed for the visitor whose cookie came with it. Ensemble then keeps
 * each token's `sub` to its own threads and voice rooms.
 */

/** Streaming replies outlive the default function limit. */
export const maxDuration = 60;

const MAX_BODY = 64_000;
const THREAD = /^[A-Za-z0-9_-]{8,80}$/;
const SESSION = /^[A-Za-z0-9_-]{1,160}$/;
const VERSION = /^(latest|published|\d{1,4})$/;

type Context = { params: Promise<{ path: string[] }> };

/** Visitor-and-thread pairs this instance has registered the widgets on. */
const registeredThreads = new Set<string>();

function remember(key: string) {
  if (registeredThreads.size > 10_000) registeredThreads.clear();
  registeredThreads.add(key);
}

/** The page's widgets on one thread. A failure only means no popups yet. */
async function registerWidgets(bearer: string, threadId: string, key: string, signal: AbortSignal) {
  try {
    const res = await fetch(`${ENSEMBLE_UPSTREAM}/api/chat/widgets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        "thread-id": threadId,
      },
      body: JSON.stringify(flowWidgetRegistration()),
      cache: "no-store",
      signal,
    });
    if (res.ok) remember(key);
  } catch {
    // Fall through: the message still goes, just without the newest widgets.
  }
}

type Target = {
  upstream: string;
  needsThread: boolean;
  /**
   * Rewrites the JSON body so the agent can only ever be ours ("agent"), or
   * replaces it with the page's own widgets ("widgets").
   */
  body?: "chat" | "agent" | "widgets";
};

function target(method: string, segments: string[]): Target | null {
  const path = segments.join("/");
  if (method === "POST" && path === "chat") {
    return { upstream: "/chat", needsThread: true, body: "chat" };
  }
  if (method === "GET" && path === "chat/messages") {
    return { upstream: "/chat/messages", needsThread: true };
  }
  if (method === "POST" && path === "api/chat/widgets") {
    return { upstream: "/api/chat/widgets", needsThread: true, body: "widgets" };
  }
  if (method === "POST" && path === "api/feedback") {
    return { upstream: "/api/feedback", needsThread: false, body: "agent" };
  }
  if (method === "POST" && path === "api/voice/session") {
    return { upstream: "/api/voice/session", needsThread: false, body: "agent" };
  }
  if (method === "DELETE" && segments.length === 4 && path.startsWith("api/voice/session/")) {
    const id = segments[3];
    if (SESSION.test(id)) {
      return { upstream: `/api/voice/session/${encodeURIComponent(id)}`, needsThread: false };
    }
  }
  return null;
}

async function forward(request: Request, { params }: Context) {
  const { path } = await params;
  const route = target(request.method, path);
  if (!route) return json({ error: "Not found." }, 404);

  if (request.method !== "GET" && !sameOrigin(request)) {
    return json({ error: "Forbidden." }, 403);
  }

  // The token must be one we signed, for the visitor whose cookie came with it.
  const bearer = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
  const subject = bearer ? verifyToken(bearer) : null;
  const visitor = visitorFromRequest(request);
  if (!bearer || !subject || !visitor || subject !== subjectFor(visitor)) {
    return json({ error: "Invalid or expired token" }, 401);
  }

  const ip = clientIp(request);
  const kind = route.body === "chat" ? "chat" : "other";
  if (
    rateLimited(`${kind}:${visitor}`, kind === "chat" ? 20 : 120, 60_000) ||
    rateLimited(`ip:${ip}`, 240, 60_000)
  ) {
    return json({ error: "Too many requests. Wait a moment and try again." }, 429);
  }

  const headers = new Headers({
    Authorization: `Bearer ${bearer}`,
    "agent-id": ENSEMBLE_AGENT_ID,
    Accept: request.headers.get("accept") ?? "*/*",
  });

  const threadId = request.headers.get("thread-id") ?? "";
  if (route.needsThread) {
    if (!THREAD.test(threadId)) return json({ error: "Bad thread." }, 400);
    headers.set("thread-id", threadId);
  }
  // Visitors always get the published agent, so a draft saved in Ensemble
  // never reaches them. On a dev server a `version` header can pick a draft.
  const version = request.headers.get("version");
  const dev = process.env.NODE_ENV === "development";
  headers.set("version", dev && version && VERSION.test(version) ? version : "published");

  let body: string | undefined;
  if (route.body) {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: "Too large." }, 413);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: "Bad request." }, 400);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "Bad request." }, 400);
    }
    if (route.body === "agent") {
      parsed.agentId = ENSEMBLE_AGENT_ID;
      if (typeof parsed.threadId === "string" && !THREAD.test(parsed.threadId)) {
        return json({ error: "Bad thread." }, 400);
      }
    }
    if (route.body === "widgets") {
      if (!Array.isArray(parsed.widgetSchemas)) return json({ error: "Bad request." }, 400);
      parsed = flowWidgetRegistration();
    }
    body = JSON.stringify(parsed);
    headers.set("Content-Type", "application/json");
  }

  // `limit` is the only query the widget sends.
  const url = new URL(ENSEMBLE_UPSTREAM + route.upstream);
  const limit = Number(new URL(request.url).searchParams.get("limit"));
  if (route.upstream === "/chat/messages" && Number.isInteger(limit) && limit > 0 && limit <= 100) {
    url.searchParams.set("limit", String(limit));
  }

  // A thread's widgets are whatever was registered last, and a tab registers
  // only when it loads or starts a call. So before a thread's first message
  // since this server started (or since the widgets changed), register the
  // current ones, and a tab left open across a change still gets them.
  const threadKey = `${subject}:${threadId}`;
  if (route.body === "chat" && !registeredThreads.has(threadKey)) {
    await registerWidgets(bearer, threadId, threadKey, request.signal);
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    });
  } catch {
    return json({ error: "The chat service is not reachable right now." }, 502);
  }
  if (route.body === "widgets" && upstream.ok) remember(threadKey);

  const out = new Headers({
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  });
  for (const name of ["content-type", "x-vercel-ai-ui-message-stream"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { forward as GET, forward as POST, forward as DELETE };

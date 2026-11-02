import { after } from "next/server";
import {
  ENDED_BY,
  MAX_LINE,
  MAX_TRANSCRIPT,
  type ConversationBeacon,
  type EndedBy,
} from "@/lib/analytics/schema";
import {
  contextFields,
  recordConversation,
  type TranscriptEntry,
} from "@/lib/analytics/store";
import { clientIp, rateLimited, sameOrigin } from "@/lib/ensemble";

/**
 * A call or typed chat with Bryan's AI (lib/analytics/conversation.ts), posted
 * whole each time it grows and once more as it ends, the last often by
 * sendBeacon as the page closes, so the response is never read. It answers
 * 204 straight away and writes after the response.
 *
 * As with /api/track, the browser sends no wall-clock times: each time is how
 * long ago it was (`startedAgo`, `endedAgo`, each line's `ago`), stamped here
 * against the server's clock. Everything is untrusted: the shape is checked
 * field by field, the transcript is capped at 400 lines of 2,000 characters,
 * and a request from another site is refused.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** 400 lines of 2,000 characters, with room for the JSON around them. */
const MAX_BODY = 1_000_000;
const MAX_AGO = 6 * 60 * 60 * 1000;

const int = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : min;

function transcript(value: unknown, stamp: (ago: unknown) => string): TranscriptEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_TRANSCRIPT).flatMap((line) => {
    const { role, text, ago } = (line ?? {}) as Record<string, unknown>;
    if ((role !== "visitor" && role !== "bryan") || typeof text !== "string") return [];
    const clean = text.trim().slice(0, MAX_LINE);
    return clean ? [{ role, text: clean, at: stamp(ago) }] : [];
  });
}

const flows = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((flow): flow is string => typeof flow === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(flow))
        .slice(0, 100)
    : [];

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let body: Partial<ConversationBeacon>;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (
    !body ||
    typeof body.id !== "string" ||
    !UUID.test(body.id) ||
    (body.mode !== "call" && body.mode !== "chat")
  ) {
    return new Response(null, { status: 400 });
  }

  // A conversation posts every few seconds at most; this is far above that.
  if (
    rateLimited(`convo:${body.id}`, 60, 60_000) ||
    rateLimited(`convo-ip:${clientIp(request)}`, 240, 60_000)
  ) {
    return new Response(null, { status: 429 });
  }

  const now = Date.now();
  const stamp = (ago: unknown) => new Date(now - int(ago, 0, MAX_AGO)).toISOString();
  const endedBy = ENDED_BY.includes(body.endedBy as EndedBy) ? (body.endedBy as EndedBy) : null;
  const convo = {
    id: body.id.toLowerCase(),
    ...contextFields(body.context),
    mode: body.mode,
    started_at: stamp(body.startedAgo),
    ended_at: endedBy && body.endedAgo !== undefined ? stamp(body.endedAgo) : null,
    duration_ms: int(body.durationMs, 0, MAX_AGO),
    ended_by: endedBy,
    turns: int(body.turns, 0, 32_000),
    flows: flows(body.flows),
    transcript: transcript(body.transcript, stamp),
  };

  after(async () => {
    try {
      await recordConversation(convo);
    } catch (error) {
      console.error("[analytics] conversation failed", error);
    }
  });

  return new Response(null, { status: 204 });
}

import {
  MAX_LINE,
  MAX_TRANSCRIPT,
  type ConversationBeacon,
  type EndedBy,
} from "./schema";
import { flushNow, onTrack, track, trackingContext, uuid } from "./tracker";

/**
 * Call and chat histories with Bryan's AI on /BryanKleppe: what the visitor
 * and Bryan said, the flows that opened, how long it ran and how it ended.
 * Only the conversation is kept, never anything typed into a form.
 *
 * Each conversation posts its whole record to /api/conversation: once as it
 * starts, a few seconds after each change, as a beacon whenever the tab hides
 * (a phone may never come back to send the end), and once more at the end.
 * Writes can land late or twice, so the database keeps the fuller of any two
 * (record_conversation in analytics dashboard/supabase/schema.sql).
 *
 * It also logs `call_start` and `call_end` (name `call` or `chat`) on the
 * funnel, and picks up the flows that open from the tracker's own events, so
 * nothing has to be threaded through to it.
 */

export type ConversationMode = ConversationBeacon["mode"];
export type Speaker = "visitor" | "bryan";

export type Conversation = {
  readonly id: string;
  /** Whether `end` has been called. */
  readonly ended: boolean;
  /**
   * A line said or typed. With a `key`, a later line with the same key
   * replaces it rather than adding one (a message that grew).
   */
  said: (role: Speaker, text: string, key?: string) => void;
  /** A flow that opened during it. Flows opened through FlowProvider are noted by themselves. */
  flow: (name: string) => void;
  /** Ends it. Only the first call counts. */
  end: (endedBy: EndedBy) => void;
};

const ENDPOINT = "/api/conversation";
/** After a change, wait this long for more before posting. */
const POST_DELAY_MS = 4_000;
/** sendBeacon and keepalive fetches are capped at 64 KB per page. */
const BEACON_MAX = 60_000;

type Line = { role: Speaker; text: string; at: number };

const bytes = (body: string) => new Blob([body]).size;

function send(body: string, unloading: boolean) {
  const small = bytes(body) <= BEACON_MAX;
  if (unloading && small && typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (queued) return;
  }
  fetch(ENDPOINT, {
    method: "POST",
    body,
    keepalive: small,
    headers: { "content-type": "application/json" },
  }).catch(() => {});
}

/**
 * Starts recording one call or chat. The caller feeds it what was said and
 * ends it; leaving the page ends it as `left`.
 */
export function startConversation(mode: ConversationMode): Conversation {
  const id = uuid();
  const startedAt = Date.now();
  const lines: Line[] = [];
  const keyed = new Map<string, Line>();
  const flows: string[] = [];
  let turns = 0;
  /** The last line or flow, which is where a chat's duration ends. */
  let lastAt = startedAt;
  let ended: { at: number; by: EndedBy } | null = null;
  let timer: number | undefined;

  /**
   * A call runs until it's ended. A typed chat stays open for the rest of the
   * visit, so its length is from the first message to the last thing in it.
   */
  const duration = (now: number) =>
    (mode === "call" ? (ended?.at ?? now) : lastAt) - startedAt;

  /** `slim` leaves the transcript out, so a beacon fits; the database keeps the one it has. */
  const body = (slim = false) => {
    const now = Date.now();
    const beacon: ConversationBeacon = {
      id,
      mode,
      startedAgo: now - startedAt,
      endedAgo: ended ? now - ended.at : undefined,
      durationMs: duration(now),
      endedBy: ended?.by,
      turns,
      flows,
      transcript: slim
        ? []
        : lines.map((line) => ({ role: line.role, text: line.text, ago: now - line.at })),
      context: trackingContext(),
    };
    return JSON.stringify(beacon);
  };

  const post = (unloading = false) => {
    window.clearTimeout(timer);
    timer = undefined;
    const payload = body();
    if (!unloading || bytes(payload) <= BEACON_MAX) {
      send(payload, unloading);
      return;
    }
    // Too big for a beacon: the whole record by plain fetch, which a hidden
    // tab usually still finishes, and the rest without the transcript by
    // beacon, which outlives the page.
    send(payload, false);
    send(body(true), true);
  };

  const postSoon = () => {
    if (ended || timer !== undefined) return;
    timer = window.setTimeout(() => post(), POST_DELAY_MS);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden" && !ended) post(true);
  };
  const onLeave = () => end("left");
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onLeave);
  const unsubscribe = onTrack((type, name, props) => {
    if (type !== "flow_open" || !name) return;
    // A chat stays open for the whole visit, so it counts only the flows it
    // opened itself; a call counts every flow that opened while it was on.
    if (mode === "chat" && props?.from !== "chat") return;
    flow(name);
  });

  function said(role: Speaker, text: string, key?: string) {
    if (ended) return;
    const clean = text.trim().slice(0, MAX_LINE);
    if (!clean) return;
    const known = key ? keyed.get(key) : undefined;
    if (known) {
      if (known.text === clean) return;
      known.text = clean;
    } else {
      if (role === "visitor") turns += 1;
      if (lines.length < MAX_TRANSCRIPT) {
        const line = { role, text: clean, at: Date.now() };
        lines.push(line);
        if (key) keyed.set(key, line);
      }
    }
    lastAt = Date.now();
    postSoon();
  }

  function flow(name: string) {
    if (ended) return;
    flows.push(name.slice(0, 40));
    lastAt = Date.now();
    postSoon();
  }

  function end(by: EndedBy) {
    if (ended) return;
    ended = { at: Date.now(), by };
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onLeave);
    unsubscribe();
    track("call_end", mode, {
      conversation: id,
      seconds: Math.round(duration(ended.at) / 1000),
      turns,
      ended_by: by,
    });
    const leaving = by === "left";
    post(leaving);
    // The tracker sent its last beacon as the page went; this one carries call_end.
    if (leaving) flushNow();
  }

  track("call_start", mode, { conversation: id });
  post();

  return {
    id,
    get ended() {
      return ended !== null;
    },
    said,
    flow,
    end,
  };
}

/* ------------------------------------------------------------ typed chat */

type ChatPart = { type?: string; text?: string; data?: unknown };
type ChatMessage = { id?: string; role?: string; parts?: ChatPart[] };

/** What the Ensemble chat widget's `onFinish` hands over: the reply, and the thread with it. */
export type ChatFinish = { message?: ChatMessage; messages?: ChatMessage[] };

let chat: Conversation | null = null;

/** The text of a chat message, with each widget as the line its card shows. */
function textOf(message: ChatMessage, widgetLine?: (part: ChatPart) => string | null) {
  return (message.parts ?? [])
    .map((part) =>
      part.type === "text" && typeof part.text === "string" ? part.text : (widgetLine?.(part) ?? ""),
    )
    .filter((text) => text.trim())
    .join("\n")
    .trim();
}

/**
 * One reply in the typed chat, with the message it answers. The chat's
 * conversation starts with the first of these and lasts until the visitor
 * leaves (or `endChat`). Messages are keyed by their ids, so a reply that
 * continues after a tool repeats nothing.
 *
 * Only replies streamed in this tab arrive here: the history the widget
 * reloads after a call (which holds the call's turns too) never does.
 */
export function recordChatReply(
  finish: ChatFinish,
  widgetLine?: (part: ChatPart) => string | null,
) {
  const reply = finish.message;
  const thread = finish.messages ?? [];
  const at = reply?.id ? thread.findIndex((m) => m.id === reply.id) : -1;
  const before = at < 0 ? thread : thread.slice(0, at);
  const asked = before.findLast((m) => m.role === "user");

  const question = asked ? textOf(asked) : "";
  const answer = reply?.role === "assistant" ? textOf(reply, widgetLine) : "";
  if (!question && !answer) return;

  if (!chat || chat.ended) chat = startConversation("chat");
  if (question) chat.said("visitor", question, asked?.id);
  if (answer) chat.said("bryan", answer, reply?.id);
}

/** Ends the typed chat's conversation, if one is going. */
export function endChat(endedBy: EndedBy) {
  chat?.end(endedBy);
  chat = null;
}

// Development only: drive the recorder from the console or a test script,
// since a headless browser can't hold a call, e.g.
// window.__conversation.startConversation("call").said("visitor", "hi").
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as { __conversation?: object }).__conversation = {
    startConversation,
    recordChatReply,
    endChat,
  };
}

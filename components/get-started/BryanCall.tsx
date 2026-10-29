"use client";

import type { AnamClient } from "@anam-ai/js-sdk";
import { Microphone, MicrophoneSlash, PhoneCall, PhoneDisconnect } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { pageContext, useFlows } from "./FlowProvider";
import { flowWidgetRegistration, parseFlow } from "./flows";

const VIDEO_ID = "bryan-call-video";

export type CallCopy = {
  aiLabel: string;
  start: string;
  again: string;
  connecting: string;
  end: string;
  mute: string;
  unmute: string;
  greeting: string;
  sorry: string;
  ended: string;
  denied: string;
  failed: string;
};

type Status = "idle" | "connecting" | "live" | "ended" | "denied" | "failed";
type StreamEvent = { type: string; delta?: string; errorText?: string; data?: unknown };
/** One answer: aborting it stops the request and any lines not yet said. */
type Turn = { controller: AbortController };

/**
 * The complete sentences at the start of `text`, and what's left after them,
 * so each can be said as soon as it's written.
 */
function completeSentences(text: string): [string, string] {
  const match = text.match(/^[\s\S]*[.!?…]["'”’)\]]*(?=\s)/);
  return match ? [match[0], text.slice(match[0].length)] : ["", text];
}

/** The agent's reply, read as the AI SDK's server-sent events. */
async function* readEvents(response: Response): AsyncGenerator<StreamEvent> {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.startsWith("data:") ? line.slice(5).trim() : "";
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data) as StreamEvent;
      } catch {
        // Not an event the call needs.
      }
    }
  }
}

/** The end of a long line, so the caption shows what Bryan is saying now. */
const tail = (text: string) =>
  text.length > 160 ? `…${text.slice(-160).replace(/^\S*\s/, "")}` : text;

/**
 * The video call with Bryan's AI avatar. Anam draws him, hears the visitor and
 * speaks in his cloned voice; the words come from the same Ensemble agent, on
 * the same thread, as the typed chat. Each time the visitor finishes speaking,
 * their words go to the agent in spoken mode (plain sentences), and Bryan says
 * each sentence of the reply as soon as it's written. Speaking over Bryan stops
 * his answer, and the agent's generation with it.
 *
 * He speaks through Anam's talk command, one whole line at a time, because the
 * engine currently ignores streamed talk messages ("Received chat message with
 * no open ChatMessageStreams"). A second talk command cuts off the first, so
 * lines wait for the one before to finish: the first sentence goes at once,
 * and whatever is written by the time it ends goes next as one line.
 *
 * Widgets are on, for the page's two flows only (see flows.ts). When the agent
 * sends one, the page takes the turn: Bryan is cut off, says the flow's fixed
 * line, and the popup opens. While the call is live, the popup can also have
 * him say a line of its own (FlowProvider's `say`).
 */
export function BryanCall({
  copy,
  poster,
  chatToken,
  threadId,
  onCallStart,
  onCallEnd,
  compact = false,
}: {
  copy: CallCopy;
  poster: string;
  /**
   * Drawn small, as when it floats in the corner over a popup: smaller
   * captions and buttons, and the long note left to screen readers.
   */
  compact?: boolean;
  /** A token for the Ensemble proxy; `fresh` skips the cached one. */
  chatToken: (fresh?: boolean) => Promise<string>;
  threadId: () => string;
  onCallStart?: () => void;
  /** `spoke` is whether anything reached the agent, so its history changed. */
  onCallEnd?: (spoke: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState("");

  const clientRef = useRef<AnamClient | null>(null);
  const turnRef = useRef<Turn | null>(null);
  const endedRef = useRef(true);
  const spokeRef = useRef(false);
  /**
   * Lines Bryan is saying, each waiting for him to finish. `before` holds the
   * ids of his utterances from before the line was sent, so the end of one of
   * those never counts as the end of this line.
   */
  const speakingRef = useRef(new Set<{ before: Set<string>; done: () => void }>());
  /** Every utterance id Bryan has spoken this call. */
  const spokenRef = useRef(new Set<string>());

  const flows = useFlows();
  const setSpeaker = flows?.setSpeaker;

  useEffect(() => {
    const turn = turnRef;
    const client = clientRef;
    return () => {
      setSpeaker?.(null);
      turn.current?.controller.abort();
      void client.current?.stopStreaming().catch(() => {});
      client.current = null;
    };
  }, [setSpeaker]);

  function finish(next: Status) {
    if (endedRef.current) return;
    endedRef.current = true;
    setSpeaker?.(null);
    for (const waiter of [...speakingRef.current]) waiter.done();
    turnRef.current?.controller.abort();
    turnRef.current = null;
    const client = clientRef.current;
    clientRef.current = null;
    void client?.stopStreaming().catch(() => {});
    setStatus(next);
    setPlaying(false);
    onCallEnd?.(spokeRef.current);
  }

  /** A POST to the Ensemble proxy, retried once with a fresh token. */
  async function agentPost(path: string, body: unknown, signal?: AbortSignal) {
    const post = async (fresh: boolean) =>
      fetch(`/api/ensemble/${path}`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        signal,
        headers: {
          Authorization: `Bearer ${await chatToken(fresh)}`,
          "Content-Type": "application/json",
          "thread-id": threadId(),
        },
        body: JSON.stringify(body),
      });
    const response = await post(false);
    return response.status === 401 ? post(true) : response;
  }

  async function ask(text: string, signal: AbortSignal) {
    const response = await agentPost(
      "chat",
      {
        message: text,
        mode: "audio",
        capabilities: { widgets: Boolean(flows) },
        dataContext: pageContext(flows?.pageEvents() ?? []),
      },
      signal,
    );
    if (!response.ok || !response.body) throw new Error(`Agent replied ${response.status}`);
    return response;
  }

  async function start() {
    endedRef.current = false;
    spokeRef.current = false;
    setStatus("connecting");
    setCaption("");
    setMuted(false);
    onCallStart?.();
    // The typed chat registers the flows too, at page load; this covers a
    // chat that never loaded. A miss only means no popups on this call.
    if (flows) void agentPost("api/chat/widgets", flowWidgetRegistration()).catch(() => {});

    try {
      const response = await fetch("/api/anam-token", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Call token ${response.status}`);
      const { sessionToken } = (await response.json()) as { sessionToken: string };
      const { createClient, AnamEvent, ConnectionClosedCode, MessageRole } = await import(
        "@anam-ai/js-sdk"
      );
      if (endedRef.current) return;

      const client = createClient(sessionToken);
      clientRef.current = client;

      /**
       * Bryan says one line. Resolves when he has finished it, when the
       * visitor starts talking over him, or after about the time it takes to
       * say if Anam never reports the end.
       */
      const speak = async (line: string) => {
        const finished = new Promise<void>((resolve) => {
          const waiter = {
            before: new Set(spokenRef.current),
            done: () => {
              clearTimeout(timer);
              speakingRef.current.delete(waiter);
              resolve();
            },
          };
          const timer = setTimeout(waiter.done, 2_000 + line.split(/\s+/).length * 450);
          speakingRef.current.add(waiter);
        });
        await client.talk(line).catch(() => {});
        await finished;
      };

      async function answer(text: string) {
        turnRef.current?.controller.abort();
        const turn: Turn = { controller: new AbortController() };
        turnRef.current = turn;
        const { signal } = turn.controller;
        /** Written but not yet a whole sentence. */
        let written = "";
        /** Whole sentences waiting for Bryan to finish his current line. */
        let ready = "";
        let talking = false;
        /** The agent sent a flow widget, and the page has the rest of the turn. */
        let handed = false;

        const pump = () => {
          if (talking || signal.aborted || handed || !ready) return;
          const line = ready;
          ready = "";
          talking = true;
          void speak(line).then(() => {
            talking = false;
            pump();
          });
        };
        const queue = (more: string) => {
          if (more.trim()) ready = `${ready} ${more.trim()}`.trim();
          pump();
        };

        try {
          const reply = await ask(text, signal);
          spokeRef.current = true;
          for await (const event of readEvents(reply)) {
            if (signal.aborted) break;
            const flow = parseFlow(event);
            if (flow && flows) {
              // Bryan says the flow's line instead of whatever the agent wrote
              // around the widget (the popup's speaker cuts him off). The reply
              // is still read to its end, so Ensemble keeps the turn whole.
              handed = true;
              written = ready = "";
              flows.open(flow, "call");
              continue;
            }
            if (handed) continue;
            if (event.type === "text-delta" && event.delta) {
              const [whole, rest] = completeSentences(written + event.delta);
              written = rest;
              if (whole) queue(whole);
            } else if (event.type === "text-end") {
              // A text block ("One second." before a tool call, then the
              // answer) ends a line even without a final space.
              queue(written);
              written = "";
            } else if (event.type === "error") throw new Error(event.errorText);
          }
          queue(written);
        } catch {
          if (!signal.aborted && !handed && clientRef.current === client) void speak(copy.sorry);
        } finally {
          if (turnRef.current === turn) turnRef.current = null;
        }
      }

      client.addListener(AnamEvent.SESSION_READY, () => {
        setStatus("live");
        // Development only: ask as if the visitor had said it, since a test
        // browser has no voice, e.g. window.__bryanAsk("show me a flyer").
        if (process.env.NODE_ENV === "development") {
          (window as unknown as { __bryanAsk?: (text: string) => void }).__bryanAsk = (text) =>
            void answer(text);
        }
        setSpeaker?.(async (line) => {
          try {
            client.interruptPersona();
          } catch {
            // Nothing playing to cut off.
          }
          await speak(line);
        });
        void speak(copy.greeting);
      });
      client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => setPlaying(true));
      client.addListener(AnamEvent.MIC_PERMISSION_DENIED, () => finish("denied"));
      client.addListener(AnamEvent.CONNECTION_CLOSED, (reason) =>
        finish(reason === ConnectionClosedCode.MICROPHONE_PERMISSION_DENIED ? "denied" : "ended"),
      );

      let handled = "";
      client.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (messages) => {
        const last = messages.at(-1);
        if (last?.role !== MessageRole.USER || last.id === handled || !last.content.trim()) return;
        handled = last.id;
        void answer(last.content);
      });

      let line = { id: "", text: "" };
      client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, (event) => {
        if (event.role !== MessageRole.PERSONA) return;
        line = { id: event.id, text: event.id === line.id ? line.text + event.content : event.content };
        setCaption(tail(line.text));
        spokenRef.current.add(event.id);
        // The end of an utterance that started after a line was sent is the
        // end of that line.
        if (event.endOfSpeech) {
          for (const waiter of [...speakingRef.current]) {
            if (!waiter.before.has(event.id)) waiter.done();
          }
        }
      });
      // Talking over Bryan: Anam stops his speech, and this stops the rest of
      // the answer from going out after it.
      client.addListener(AnamEvent.USER_SPEECH_STARTED, () => {
        turnRef.current?.controller.abort();
        for (const waiter of [...speakingRef.current]) waiter.done();
      });

      await client.streamToVideoElement(VIDEO_ID);
    } catch {
      if (!endedRef.current) finish("failed");
      else setStatus((current) => (current === "connecting" ? "failed" : current));
    }
  }

  function toggleMute() {
    const client = clientRef.current;
    if (!client) return;
    if (muted) client.unmuteInputAudio();
    else client.muteInputAudio();
    setMuted(!muted);
  }

  const live = status === "live";
  // Only after a call: why it stopped, or what to do instead.
  const note =
    status === "ended"
      ? copy.ended
      : status === "denied"
        ? copy.denied
        : status === "failed"
          ? copy.failed
          : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink-950">
      <Image
        src={poster}
        alt=""
        fill
        sizes="(min-width: 1024px) 40rem, 100vw"
        className={`object-cover transition-opacity duration-500 ${playing ? "opacity-0" : "opacity-100"}`}
        priority
      />
      <video
        id={VIDEO_ID}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
      />

      <span
        className={`absolute rounded-full bg-ink-950/70 font-semibold tracking-wide text-white uppercase backdrop-blur-sm ${
          compact ? "top-2 left-2 px-2 py-0.5 text-[0.625rem]" : "top-3 left-3 px-2.5 py-1 text-[0.6875rem]"
        }`}
      >
        {copy.aiLabel}
      </span>

      <div
        className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-950/90 via-ink-950/55 to-transparent ${
          compact ? "px-2 pt-8 pb-2" : "px-4 pt-14 pb-4 sm:px-5"
        }`}
      >
        {live ? (
          <>
            {caption && (
              // Compact, it keeps its last two lines, which are what Bryan is saying now.
              <p
                className={`text-center leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] ${
                  compact
                    ? "mb-1.5 flex max-h-[2lh] flex-col justify-end overflow-hidden text-[0.75rem] sm:text-[0.8125rem]"
                    : "mb-3 text-[0.9375rem]"
                }`}
              >
                {caption}
              </p>
            )}
            <div className={`flex items-center justify-center ${compact ? "gap-2" : "gap-3"}`}>
              <button
                type="button"
                onClick={toggleMute}
                aria-pressed={muted}
                aria-label={muted ? copy.unmute : copy.mute}
                title={muted ? copy.unmute : copy.mute}
                className={`grid shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 ${
                  compact ? "size-8" : "size-11"
                }`}
              >
                {muted ? (
                  <MicrophoneSlash className={compact ? "size-4" : "size-5"} />
                ) : (
                  <Microphone className={compact ? "size-4" : "size-5"} />
                )}
              </button>
              <button
                type="button"
                onClick={() => finish("ended")}
                className={`flex items-center rounded-full bg-red-600 font-semibold whitespace-nowrap text-white transition-colors hover:bg-red-500 ${
                  compact
                    ? "gap-1.5 px-3 py-1.5 text-[0.75rem] sm:text-[0.8125rem]"
                    : "gap-2 px-5 py-2.5 text-[0.9375rem]"
                }`}
              >
                <PhoneDisconnect weight="fill" className={compact ? "size-4" : "size-5"} />
                {copy.end}
              </button>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center text-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
            <button
              type="button"
              onClick={start}
              disabled={status === "connecting"}
              className={`sheen flex items-center justify-center rounded-full bg-green-500 font-semibold whitespace-nowrap text-ink-950 shadow-[0_10px_28px_-12px_rgba(56,176,0,0.75)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-wait disabled:opacity-70 ${
                compact
                  ? "gap-1.5 px-3 py-1.5 text-[0.75rem] sm:px-4 sm:py-2 sm:text-[0.8125rem]"
                  : "gap-2 px-6 py-3 text-base"
              }`}
            >
              <PhoneCall weight="fill" className={compact ? "size-4" : "size-5"} />
              {status === "connecting"
                ? copy.connecting
                : status === "idle"
                  ? copy.start
                  : copy.again}
            </button>
            {note && (
              <p
                role="status"
                className={`leading-snug ${
                  compact ? "line-clamp-2 text-[0.6875rem] max-sm:sr-only" : "max-w-[28rem] text-[0.8125rem]"
                } ${status === "denied" || status === "failed" ? "text-amber-300" : "text-slate-200"}`}
              >
                {note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

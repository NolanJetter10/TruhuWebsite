"use client";

import type { AnamClient } from "@anam-ai/js-sdk";
import { Microphone, MicrophoneSlash, PhoneCall, PhoneDisconnect } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { pageContext, useFlows } from "./FlowProvider";
import { flowWidgetRegistration, parseFlow } from "./flows";
import { RealBryanButton } from "./RealBryanButton";
import { createVoiceLevel, type VoiceLevel } from "./voiceLevel";

const VIDEO_ID = "bryan-call-video";
/** Above this level the ring counts him as speaking, when motion is reduced. */
const SPEAKING = 0.12;
/** How long the still ring stays on through a pause between words (ms). */
const SPEAKING_HOLD = 350;

/**
 * How the call is drawn: "call" is Bryan's photo in a circle with a ring that
 * moves with his voice, like Teams or Discord; "video" is his Anam avatar.
 * Both are the same session, so switching never drops the call.
 */
export type CallLook = "call" | "video";

export type CallCopy = {
  /** Under his photo in the call look. */
  name: string;
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
 * The call with Bryan's AI. Anam draws him, hears the visitor and
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
 *
 * It has two looks of the one session (`look`): the call look, his own photo
 * in a circle whose ring moves with the loudness of his voice, and the video
 * look, Anam's avatar. The <video> plays in both, since his voice comes
 * through it, so switching looks mid-call changes only what's drawn.
 */
export function BryanCall({
  copy,
  look,
  poster,
  photo,
  chatToken,
  threadId,
  onCallStart,
  onCallEnd,
  compact = false,
}: {
  copy: CallCopy;
  look: CallLook;
  /** The avatar's still, shown in the video look until the stream plays. */
  poster: string;
  /** Bryan's own photo, for the call look's circle. */
  photo: string;
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
  /**
   * Goes up each time the page has Bryan say a line of its own (the popup's
   * speaker), which ends the answer he was giving. An answer says no more
   * once this has moved on from where it stood when the answer began. A count
   * rather than a mark on the turn, because a reply is usually read to its end
   * (and the turn let go) while its last lines are still waiting to be said.
   */
  const cutOffRef = useRef(0);
  /** How loud Bryan is, read from the call's audio (voiceLevel.ts). */
  const meterRef = useRef<VoiceLevel | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  /** His photo's circle, whose ring reads --voice and --pulse. */
  const avatarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const meter = meterRef;
    return () => {
      meter.current?.stop();
      meter.current = null;
    };
  }, []);

  // The call look centres his photo in the room the bottom controls leave,
  // which changes with the caption and the buttons under it.
  useEffect(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;
    if (!root || !overlay || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      root.style.setProperty("--below", `${overlay.offsetHeight}px`),
    );
    observer.observe(overlay, { box: "border-box" });
    return () => observer.disconnect();
  }, []);

  // The ring follows his voice, written to the circle's style each frame
  // rather than through React. With reduced motion it doesn't swell: it
  // shows, still, while he speaks, and holds through the gaps between words.
  useEffect(() => {
    const avatar = avatarRef.current;
    if (status !== "live" || look !== "call" || !avatar) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let heldUntil = 0;
    let drawn = "";
    const draw = (now: number) => {
      const level = meterRef.current?.level() ?? 0;
      let voice = level;
      let pulse = level;
      if (reduced.matches) {
        if (level > SPEAKING) heldUntil = now + SPEAKING_HOLD;
        voice = now < heldUntil ? 1 : 0;
        pulse = 0;
      }
      const next = `${voice.toFixed(3)} ${pulse.toFixed(3)}`;
      if (next !== drawn) {
        drawn = next;
        avatar.style.setProperty("--voice", voice.toFixed(3));
        avatar.style.setProperty("--pulse", pulse.toFixed(3));
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      avatar.style.removeProperty("--voice");
      avatar.style.removeProperty("--pulse");
    };
  }, [status, look]);

  function finish(next: Status) {
    if (endedRef.current) return;
    endedRef.current = true;
    meterRef.current?.stop();
    meterRef.current = null;
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
    // Made here, in the click, since browsers only run Web Audio after one.
    meterRef.current?.stop();
    meterRef.current = createVoiceLevel();
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
        /** Where cutOffRef stood when this answer began. */
        const cutOff = cutOffRef.current;

        const pump = () => {
          if (talking || signal.aborted || handed || cutOffRef.current !== cutOff || !ready) return;
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
          if (!signal.aborted && !handed && cutOffRef.current === cutOff && clientRef.current === client) {
            void speak(copy.sorry);
          }
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
          // The rest of the answer he was giving goes unsaid, and the line he
          // was on stops waiting. Its request runs on: a flow the agent sends
          // arrives here mid-reply, and that reply is still read to its end.
          cutOffRef.current += 1;
          for (const waiter of [...speakingRef.current]) waiter.done();
          await speak(line);
        });
        void speak(copy.greeting);
      });
      client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => setPlaying(true));
      // His voice, for the call look's ring. It plays from the <video>.
      client.addListener(AnamEvent.AUDIO_STREAM_STARTED, (stream) =>
        meterRef.current?.listen(stream),
      );
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
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden ${
        look === "call" ? "bg-radial-[at_50%_38%] from-ink-800 via-ink-900 to-ink-950 to-80%" : "bg-ink-950"
      }`}
    >
      {look === "video" && (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 1024px) 40rem, 100vw"
          className={`object-cover transition-opacity duration-500 ${playing ? "opacity-0" : "opacity-100"}`}
          loading="eager"
        />
      )}
      {/* Anam's stream, picture and voice. The call look only uses its sound,
          so there it stays mounted and playing, hidden by opacity. */}
      <video
        id={VIDEO_ID}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          look === "video" && playing ? "opacity-100" : "opacity-0"
        }`}
      />

      {look === "call" ? (
        // His photo in a circle, centred in the room above the controls.
        // Sized from that room (container units), so it fits the big box and
        // the corner window alike.
        <div
          className={`absolute inset-x-0 top-0 flex flex-col items-center justify-center [container-type:size] ${
            compact ? "gap-2 px-2 pt-2" : "gap-4 px-4 pt-12"
          } ${status === "idle" ? "" : "transition-[bottom] duration-500 ease-out-expo"}`}
          style={{ bottom: `var(--below, ${compact ? "3rem" : "5rem"})` }}
        >
          <div
            ref={avatarRef}
            className={`relative shrink-0 rounded-full ${
              compact
                ? "size-[clamp(2.25rem,min(100cqh_-_2.625rem,55cqw),6.5rem)]"
                : "size-[clamp(3rem,min(100cqh_-_4rem,60cqw),12.5rem)]"
            }`}
          >
            {/* A glow that swells with his voice... */}
            <span
              aria-hidden
              className={`absolute inset-0 rounded-full bg-green-400/55 motion-reduce:transition-opacity motion-reduce:duration-200 ${
                compact ? "blur-md" : "blur-xl"
              }`}
              style={{
                opacity: "var(--voice, 0)",
                transform: "scale(calc(1.06 + var(--pulse, 0) * 0.32))",
              }}
            />
            {/* ...and the speaking ring, as on Teams or Discord. */}
            <span
              aria-hidden
              className={`absolute rounded-full border-green-400 motion-reduce:transition-opacity motion-reduce:duration-200 ${
                compact ? "-inset-1 border-2" : "-inset-1.5 border-[3px]"
              }`}
              style={{
                opacity: "min(1, calc(var(--voice, 0) * 2.5))",
                transform: "scale(calc(1 + var(--pulse, 0) * 0.07))",
              }}
            />
            {status === "connecting" && (
              // Ringing, while the call connects.
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-white/40 motion-safe:animate-ping"
              />
            )}
            <Image
              src={photo}
              alt=""
              fill
              sizes={compact ? "104px" : "200px"}
              className="rounded-full object-cover ring-2 ring-white/10"
              loading="eager"
            />
          </div>
          <p
            className={`font-semibold whitespace-nowrap text-white ${
              compact ? "text-[0.6875rem] leading-4" : "text-[0.9375rem] leading-5"
            }`}
          >
            {copy.name}
          </p>
        </div>
      ) : (
        <span
          className={`absolute rounded-full bg-ink-950/70 font-semibold tracking-wide text-white uppercase backdrop-blur-sm ${
            compact ? "top-2 left-2 px-2 py-0.5 text-[0.625rem]" : "top-3 left-3 px-2.5 py-1 text-[0.6875rem]"
          }`}
        >
          {copy.aiLabel}
        </span>
      )}

      <div
        ref={overlayRef}
        className={`absolute inset-x-0 bottom-0 ${
          look === "video" ? "bg-linear-to-t from-ink-950/90 via-ink-950/55 to-transparent" : ""
        } ${
          compact
            ? `px-2 pb-2 ${look === "video" ? "pt-8" : "pt-1"}`
            : `px-4 pb-4 sm:px-5 ${look === "video" ? "pt-14" : "pt-3"}`
        }`}
      >
        {live ? (
          <>
            {caption && (
              // Compact, it keeps its last two lines, which are what Bryan is
              // saying now. In the call look it keeps a fixed height (three
              // lines docked), so his photo above doesn't bob as lines change.
              <p
                className={`text-center leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] ${
                  compact
                    ? `mb-1.5 flex flex-col justify-end overflow-hidden text-[0.75rem] sm:text-[0.8125rem] ${
                        look === "call" ? "h-[2lh]" : "max-h-[2lh]"
                      }`
                    : `mb-3 text-[0.9375rem] ${
                        look === "call" ? "flex h-[3lh] flex-col justify-end overflow-hidden" : ""
                      }`
                }`}
              >
                {caption}
              </p>
            )}
            {/* Under the caption, so it holds still as the caption grows. */}
            <RealBryanButton compact={compact} cramped={compact && look === "video"} />
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

"use client";

import type { AnamClient } from "@anam-ai/js-sdk";
import { Microphone, MicrophoneSlash, PhoneCall, PhoneDisconnect } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { pageContext, useFlows } from "./FlowProvider";
import { flowWidgetRegistration, mightOpenFlow, parseFlow } from "./flows";
import { RealBryanButton, useRealBryanShown } from "./RealBryanButton";
import { createVoiceLevel, type VoiceLevel } from "./voiceLevel";

const VIDEO_ID = "bryan-call-video";
/** Above this level the ring counts him as speaking, when motion is reduced. */
const SPEAKING = 0.12;
/** How long the still ring stays on through a pause between words (ms). */
const SPEAKING_HOLD = 350;
/**
 * A first block of text longer than this is an answer, not the short line the
 * agent writes before a widget, so the hold on it lets go. Measured on the
 * published agent: that line ran 7 to 14 words (0.55 s at most) in all 23
 * widget replies that had one, while a reply with no lookup can run 80 words
 * (1.8 s) in a single block.
 */
const HOLD_MAX_WORDS = 30;

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
 * line, and the popup opens. For a question that might open one, his first
 * words wait for the end of the agent's first block of text, so he never
 * starts words the widget is about to replace. While the call is live, the
 * popup can also have him say a line of its own (FlowProvider's `say`).
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
   * Goes up each time the answer he was giving must stop: the page has him
   * say a line of its own (the popup's speaker), the visitor starts talking
   * over him, or the call ends. An answer says no more once this has moved on
   * from where it stood when the answer began. A count rather than a mark on
   * the turn, because a reply is usually read to its end (and the turn let go)
   * while its last lines are still waiting to be said.
   */
  const cutOffRef = useRef(0);
  /**
   * The visitor's latest question, while it may still be only half of one:
   * Anam ends their turn at a short pause, so "Can you show me… a flyer?" can
   * arrive as two messages. `said` is whether any line of its answer has gone
   * to Anam, and `open` that the answer is still unsettled (cut off by the
   * visitor talking again, or still being written).
   */
  const askRef = useRef<{ text: string; said: boolean; open: boolean } | null>(null);
  /** How loud Bryan is, read from the call's audio (voiceLevel.ts). */
  const meterRef = useRef<VoiceLevel | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  /** His photo's circle, whose ring reads --voice and --pulse. */
  const avatarRef = useRef<HTMLDivElement>(null);

  const flows = useFlows();
  const setSpeaker = flows?.setSpeaker;
  const realBryanShown = useRealBryanShown();

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
    // Before the waiters are released, so a line still queued behind the one
    // he was on is dropped rather than sent to a session that has ended.
    cutOffRef.current += 1;
    askRef.current = null;
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
        const question = { text, said: false, open: true };
        askRef.current = question;
        /**
         * For a question that might open a popup, the agent's words are held
         * until its first block of text ends and the next event shows whether a
         * widget follows. The agent usually writes a line before a widget ("Let
         * me pull that up."), and the widget lands ~0.4 s after it, about when
         * Bryan would start saying it. A widget drops the held words, so he says
         * only the popup's fixed line; anything else (a lookup, the end of the
         * reply) lets them go, in the same instant the next event arrives.
         */
        let holding = Boolean(flows) && mightOpenFlow(text);
        /** The first block of text has ended, so the next event settles the hold. */
        let blockEnded = false;

        const pump = () => {
          if (talking || holding || signal.aborted || handed || cutOffRef.current !== cutOff || !ready) return;
          const line = ready;
          ready = "";
          talking = true;
          question.said = true;
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
            // The first block ended and what came next is no widget: an answer.
            if (holding && blockEnded) {
              holding = false;
              pump();
            }
            if (event.type === "text-delta" && event.delta) {
              const [whole, rest] = completeSentences(written + event.delta);
              written = rest;
              if (whole) queue(whole);
              if (holding && `${ready} ${written}`.trim().split(/\s+/).length > HOLD_MAX_WORDS) {
                holding = false;
                pump();
              }
            } else if (event.type === "text-end") {
              // A text block ("One second." before a tool call, then the
              // answer) ends a line even without a final space.
              queue(written);
              written = "";
              blockEnded = true;
            } else if (event.type === "error") throw new Error(event.errorText);
          }
          holding = false;
          queue(written);
        } catch {
          if (!signal.aborted && !handed && cutOffRef.current === cutOff && clientRef.current === client) {
            void speak(copy.sorry);
          }
        } finally {
          if (turnRef.current === turn) turnRef.current = null;
          // Settled unless the visitor cut it short, in which case what they
          // say next may be the rest of this question (see the history listener).
          if (!signal.aborted || handed) question.open = false;
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
        // Anam can end their turn at a pause mid-question ("Can you show me"
        // … "a flyer?"). If Bryan hasn't said a word of the first answer yet,
        // that was half a question: ask once, with both halves.
        const before = askRef.current;
        const half = before?.open && !before.said ? before.text : "";
        void answer(half ? `${half} ${last.content}` : last.content);
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
        // The count stops lines still queued from a reply that was already
        // read to its end, which the abort below can no longer reach.
        cutOffRef.current += 1;
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
  // Under his photo, the button to the real Bryan takes the place of his name
  // while the call is live, which leaves the circle the room the button's row
  // used to take at the bottom.
  const nameReplaced = live && realBryanShown;
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
                ? "size-[clamp(2.25rem,min(100cqh_-_2.75rem,65cqw),9rem)]"
                : "size-[clamp(3rem,min(100cqh_-_4.5rem,75cqw),20rem)]"
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
              sizes={compact ? "144px" : "320px"}
              className="rounded-full object-cover ring-2 ring-white/10"
              loading="eager"
            />
          </div>
          {/* A fixed height, as tall as the button, so the circle doesn't move
              when one becomes the other. His name stays for screen readers. */}
          <div className={`flex shrink-0 items-center justify-center ${compact ? "h-7" : "h-[2.625rem]"}`}>
            <p
              className={
                nameReplaced
                  ? "sr-only"
                  : `font-semibold whitespace-nowrap text-white ${
                      compact ? "text-[0.6875rem] leading-4" : "text-[0.9375rem] leading-5"
                    }`
              }
            >
              {copy.name}
            </p>
            {nameReplaced && <RealBryanButton placement="circle" compact={compact} />}
          </div>
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
            {caption && look === "video" && (
              // Captions are the video look's only. The call look is his photo
              // and the ring alone, like a voice call.
              // Compact, it keeps its last two lines, which are what Bryan is
              // saying now.
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
            {/* Under the caption, so it holds still as the caption grows. In the
                call look it's under his photo instead. */}
            {look === "video" && <RealBryanButton placement="overlay" compact={compact} />}
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
            {/* Before the call, the two ways in: his AI now, or the real Bryan
                on the calendar. The corner window is too small for both. */}
            <div className="flex flex-wrap items-stretch justify-center gap-2.5">
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
              {!compact && <RealBryanButton placement="book" disabled={status === "connecting"} />}
            </div>
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

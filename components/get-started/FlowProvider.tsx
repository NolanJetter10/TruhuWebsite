"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { startPath, track } from "@/lib/analytics/tracker";
import type { GET_STARTED_PAGE } from "@/lib/content";
import { isSampleFlow, PATH_OF_FLOW, type Flow } from "./flows";

export type FlowCopy = (typeof GET_STARTED_PAGE)["chat"]["flows"];
/**
 * Who opened the flow, sent as `from` on `flow_open`:
 * - "call" and "chat": Bryan's AI, by sending the flow's widget.
 * - "realBryan": "Talk to the real Bryan" on the call card in a live call;
 *   "book": "Book an appointment with the real deal" before one.
 * - "buildButton": "Build a guide now" on the call card in a live call.
 * - "links": one of the three links under the chat.
 * - "options": a choice in the chooser; "samples": a sample in the picker.
 * - "trailer": "Pick a time with Bryan" at the end of the trailer.
 */
export type FlowSource =
  | "call"
  | "chat"
  | "realBryan"
  | "book"
  | "buildButton"
  | "links"
  | "options"
  | "samples"
  | "trailer";
/** "done" is the page closing a finished flow, not the visitor. */
export type CloseReason = "button" | "escape" | "backdrop" | "done";

/**
 * Speaks a line in the live call and resolves once Bryan has finished saying
 * it. BryanCall sets one while a call is on.
 */
export type Speaker = (line: string) => Promise<void>;

/**
 * Keeps the visitor's microphone off in the live call while held, so a
 * video's sound isn't heard as them talking. BryanCall sets one while a call
 * is on.
 */
export type MicHold = (held: boolean) => void;

type Flows = {
  copy: FlowCopy;
  /** The open popup, if any. */
  flow: Flow | null;
  /** Bryan's line at the top of the open popup. */
  line: string;
  /** Opens a popup and has Bryan say its line, or `line` in its place. */
  open: (flow: Flow, from: FlowSource, line?: string) => void;
  close: (how: CloseReason) => void;
  /**
   * Shows a line at the top of the popup, and speaks it if a call is live.
   * Resolves true once it has been spoken, or false at once with no call.
   */
  say: (line: string) => Promise<boolean>;
  /**
   * The latest line's `say`: resolves once Bryan has finished it, or at once
   * with no call. The trailer waits on it before it plays.
   */
  spoken: () => Promise<boolean>;
  setSpeaker: (speaker: Speaker | null) => void;
  /** Holds the live call's microphone off, or lets it go (see MicHold). */
  holdMic: (held: boolean) => void;
  setMicHold: (hold: MicHold | null) => void;
  /** Notes what the visitor did, for the agent's next reply. */
  log: (event: string) => void;
  events: string[];
  /** The same events, read at call time rather than render time. */
  pageEvents: () => string[];
};

/** The agent hears the most recent few; older ones stop mattering. */
const MAX_EVENTS = 10;

/** Each popup as the agent hears about it, opened or closed. */
const OPENED: Record<Flow, string> = {
  options:
    'the chooser "How would you like to move forward?", with three choices: rebuild last year\'s guide, see generic samples, or build a guide for a client',
  samples: "the picker of Kindlerye's sample deliverables (website, guide, flipbook and flyer), with a work email field to have them sent",
  build: "the form for a guide for their client: their work email and the client's website",
  trailer: "TruHu's trailer video, which ends by offering Bryan's calendar",
  calendar: "the booking calendar",
  guide: "the upload for last year's guide and plan documents",
  sampleGuide: "Kindlerye's sample benefits guide",
  flipbook: "Kindlerye's guide as a flipbook over the page",
  microsite: "Kindlerye's sample benefits microsite, with a button to the live site",
  flyer: "Kindlerye's sample open enrollment flyer",
};
const CLOSED: Record<Flow, string> = {
  options: "the chooser",
  samples: "the sample picker",
  build: "the form for their client's guide",
  trailer: "the trailer",
  calendar: "the booking calendar",
  guide: "the upload for last year's guide",
  sampleGuide: "the sample guide",
  flipbook: "the flipbook",
  microsite: "the sample microsite",
  flyer: "the sample flyer",
};

/** What the visitor pressed to open `flow`, or null if Bryan's AI opened it. */
function pressed(copy: FlowCopy, from: FlowSource, flow: Flow): string | null {
  switch (from) {
    case "realBryan":
      return copy.realBryan.label;
    case "book":
      return copy.realBryan.book;
    case "buildButton":
      return copy.buildNow.label;
    case "links":
      return flow === "samples" ? copy.links.samples : flow === "trailer" ? copy.links.trailer : copy.links.build;
    case "options":
      return flow === "guide" || flow === "samples" || flow === "build" ? copy.options.choices[flow] : null;
    case "samples":
      return isSampleFlow(flow) ? copy.samples.items[flow] : null;
    case "trailer":
      return copy.trailer.book;
    default:
      return null;
  }
}

/** What a message to the agent carries about the page, if anything. */
export const pageContext = (events: string[]) =>
  events.length ? { pageEvents: events } : undefined;

const FlowContext = createContext<Flows | null>(null);

/** Null outside a FlowProvider: the chat then runs without the two popups. */
export const useFlows = () => useContext(FlowContext);

/**
 * The state the call, the typed chat and the popup share on /BryanKleppe:
 * which popup is open, Bryan's line at its top, a way to speak a line in the
 * live call, and a short log of what the visitor did, which each message to
 * the agent carries (see `pageContext`) so Bryan knows on his next reply.
 *
 * Every function here is stable, because the typed chat's flow cards are
 * created once and render in a React root of their own.
 */
export function FlowProvider({ copy, children }: { copy: FlowCopy; children: ReactNode }) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [line, setLine] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const flowRef = useRef<Flow | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const eventsRef = useRef<string[]>([]);
  const spokenRef = useRef<Promise<boolean>>(Promise.resolve(false));

  const log = useCallback((event: string) => {
    eventsRef.current = [...eventsRef.current, event].slice(-MAX_EVENTS);
    setEvents(eventsRef.current);
  }, []);

  const say = useCallback((next: string) => {
    setLine(next);
    const speaker = speakerRef.current;
    const done = speaker ? speaker(next).then(() => true) : Promise.resolve(false);
    spokenRef.current = done;
    return done;
  }, []);

  const spoken = useCallback(() => spokenRef.current, []);

  const open = useCallback(
    (next: Flow, from: FlowSource, line?: string) => {
      if (flowRef.current !== next) {
        flowRef.current = next;
        setFlow(next);
        // The agent hears what the visitor pressed, when they pressed
        // something: that they asked for the person, not only that the
        // calendar opened.
        const button = pressed(copy, from, next);
        log(
          button
            ? `The visitor pressed "${button}", which opened ${OPENED[next]}.`
            : `Bryan opened ${OPENED[next]} on the visitor's screen.`,
        );
        track("flow_open", next, { from, path: PATH_OF_FLOW[next] ?? null });
        // Looking at a sample is the samples path's first real step, however
        // it was opened.
        if (isSampleFlow(next)) startPath("samples", next);
      }
      void say(line ?? copy[next].line);
    },
    [copy, log, say],
  );

  const close = useCallback(
    (how: CloseReason) => {
      const current = flowRef.current;
      if (!current) return;
      flowRef.current = null;
      setFlow(null);
      if (how !== "done") log(`The visitor closed ${CLOSED[current]}.`);
      track("flow_close", current, { how });
    },
    [log],
  );

  const setSpeaker = useCallback((speaker: Speaker | null) => {
    speakerRef.current = speaker;
  }, []);

  const micHoldRef = useRef<MicHold | null>(null);
  const heldRef = useRef(false);
  const holdMic = useCallback((held: boolean) => {
    heldRef.current = held;
    micHoldRef.current?.(held);
  }, []);
  // A call that connects while the trailer is already playing starts held.
  const setMicHold = useCallback((hold: MicHold | null) => {
    micHoldRef.current = hold;
    if (hold && heldRef.current) hold(true);
  }, []);

  const pageEvents = useCallback(() => eventsRef.current, []);

  // Development only: open or close a flow from the console or a test
  // script, e.g. window.__flows.open("flipbook", "chat").
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as unknown as { __flows?: Pick<Flows, "open" | "close"> };
    w.__flows = { open, close };
    return () => {
      delete w.__flows;
    };
  }, [open, close]);

  const value = useMemo(
    () => ({
      copy,
      flow,
      line,
      open,
      close,
      say,
      spoken,
      setSpeaker,
      holdMic,
      setMicHold,
      log,
      events,
      pageEvents,
    }),
    [copy, flow, line, open, close, say, spoken, setSpeaker, holdMic, setMicHold, log, events, pageEvents],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

import type { Path } from "@/lib/analytics/schema";

/**
 * The fixed flows on /BryanKleppe, as the Ensemble agent sees them: a widget
 * each, whose description tells the agent when to send it. The agent only
 * decides *when*. Once a flow widget arrives in a reply, the page speaks
 * Bryan's fixed line (GET_STARTED_PAGE.chat.flows) and opens the popup itself.
 * The links under the chat and the call card's buttons open the same flows.
 *
 *   options      "How would you like to move forward?": rebuild, samples or build
 *   samples      the sample picker: website, guide, flipbook, flyer, and an email
 *   build        a guide for the visitor's client: work email and the client's site
 *   guide        rebuild last year's guide: upload it, then an email
 *   trailer      TruHu's trailer, then Bryan's calendar
 *   calendar     book with Bryan (the calendar, large)
 *   sampleGuide  Kindlerye's reworked guide, page by page
 *   flipbook     Kindlerye's guide as a flipbook, over the whole page
 *   microsite    Kindlerye's benefits site, with a button to the live one
 *   flyer        Kindlerye's open enrollment flyer
 *
 * Plain data and functions, no React, so the Ensemble pass-through can import
 * the same schemas: it registers these for every thread, whatever the browser
 * sends, so a visitor can't hand the agent widgets of their own.
 */

export type Flow =
  | "options"
  | "samples"
  | "build"
  | "trailer"
  | "calendar"
  | "guide"
  | "sampleGuide"
  | "flipbook"
  | "microsite"
  | "flyer";

/**
 * Which of Bryan's paths each flow belongs to (lib/analytics/schema.ts PATHS),
 * sent with `flow_open`. The chooser belongs to none.
 */
export const PATH_OF_FLOW: Partial<Record<Flow, Path>> = {
  samples: "samples",
  sampleGuide: "samples",
  flipbook: "samples",
  microsite: "samples",
  flyer: "samples",
  build: "build",
  guide: "rebuild",
  calendar: "book",
  trailer: "book",
};

/** Kindlerye's sample deliverables: opening one starts the samples path. */
export const SAMPLE_FLOWS = ["microsite", "sampleGuide", "flipbook", "flyer"] as const satisfies readonly Flow[];
export type SampleFlow = (typeof SAMPLE_FLOWS)[number];
export const isSampleFlow = (flow: Flow): flow is SampleFlow =>
  (SAMPLE_FLOWS as readonly Flow[]).includes(flow);

export const FLOW_WIDGETS = {
  open_options: "options",
  open_samples: "samples",
  open_build_guide: "build",
  open_trailer: "trailer",
  open_calendar: "calendar",
  open_guide_upload: "guide",
  open_sample_guide: "sampleGuide",
  open_flipbook: "flipbook",
  open_microsite: "microsite",
  open_flyer: "flyer",
} as const satisfies Record<string, Flow>;

export type FlowWidget = keyof typeof FLOW_WIDGETS;

const SAY_NOTHING =
  "The page then says a fixed line in Bryan's voice, so when you send this widget, write no other text in that reply and don't search the knowledge base first.";

/** Payload schemas, as JSON Schema. Each description is the agent's "when to use". */
export const FLOW_SCHEMAS: Record<FlowWidget, Record<string, unknown>> = {
  open_options: widget(
    "Opens a chooser in the middle of the visitor's screen, titled \"How would you like to move forward?\", with three choices: rebuild last year's guide, see generic samples of what TruHu can produce, or build a guide for a client. Each choice then asks for what it needs.",
    "Use it whenever the visitor shows any interest in getting a guide built, made or rebuilt, for them or a client, or in what TruHu could do for them, and hasn't yet said whether they have last year's guide (\"can you build a guide for my client?\", \"can you make my guide?\", \"I'm interested in a guide\", \"how do I get started?\", \"what could you do for my clients?\"). This is the first step for any guide request: the visitor picks the way forward here. Send it instead of asking which materials they want, what they'd like to see, or whether they have documents.",
    "Not once they've said which way: last year's guide or plan documents to send is open_guide_upload, no documents and only the client's website is open_build_guide, and wanting examples is open_samples. Not for questions about price or how it works: answer those normally.",
  ),
  open_samples: widget(
    "Opens a picker of the sample deliverables TruHu made for Kindlerye, a sample company: a benefits website, a guide, a flipbook and a flyer. The visitor opens any of them, and can leave a work email to have them sent.",
    "Use it when the visitor wants examples, samples or deliverables without naming one (\"show me some examples\", \"what do your deliverables look like?\", \"what can TruHu produce?\", \"can I see your work?\").",
    "Not when they name one (a guide, the flipbook, the microsite or website, the flyer): each has its own widget.",
  ),
  open_build_guide: widget(
    "Opens a short form on the visitor's screen for their work email and their client's website, so TruHu's team can build a sample guide for that client from the website alone.",
    "Use it only once the visitor has said they have no guide or documents to hand, or only the client's website (\"I don't have last year's guide\", \"can you build one from their website?\", \"start from scratch with just their site\").",
    "Not for a plain ask to build or make a guide, for them or a client (\"can you build a guide for my client?\", \"can you make my guide?\"): they haven't said whether they have last year's guide, so that's open_options. Not when they have last year's guide or plan documents to send (that's open_guide_upload).",
  ),
  open_trailer: widget(
    "Plays TruHu's trailer, about a minute long, on the visitor's screen, then offers Bryan's calendar.",
    "Use it when the visitor asks for a video, a trailer, a demo video or a quick overview of TruHu (\"do you have a video?\", \"give me the quick overview\", \"show me the trailer\").",
    "Not when they ask to see a specific deliverable (each has its own widget), and not when they want to talk to Bryan (that's open_calendar).",
  ),
  open_calendar: widget(
    "Opens Bryan's booking calendar, large, on the visitor's screen.",
    "Use it when the visitor asks to book, schedule or set up a call or a time with Bryan (\"can you book a time for me?\", \"let's set up a call\", \"put me on his calendar\"), or says yes after you offer to book one.",
    "Not when they only ask how booking works, what the call covers or how long it is, and not when they say they aren't ready yet: answer those normally.",
  ),
  open_guide_upload: widget(
    "Opens an upload box on the visitor's screen for last year's benefits guide and any plan documents, so TruHu's team can rebuild the guide from them.",
    "Use it when the visitor has last year's guide or plan documents to send (\"I have last year's guide\", \"can you match our current guide?\", \"here are my documents\", \"where do I upload?\"), or picks rebuilding last year's guide after you've offered the choices.",
    "Not when they only show interest in a guide without saying they have documents (that's open_options), not when they only have the client's website (that's open_build_guide), and not when they only ask how guides work or what it costs: answer those normally.",
  ),
  open_sample_guide: widget(
    "Shows a finished benefits guide TruHu rebuilt for Kindlerye, a sample company, page by page on the visitor's screen.",
    "Use it when the visitor names a guide: they want to see what a TruHu guide looks like, or an example or sample guide (\"show me a guide\", \"what does a finished guide look like?\").",
    "Not when they ask for examples or deliverables in general (that's open_samples), not when they ask for the flipbook, microsite or flyer by name (each has its own widget), and not when they want a guide built (that's open_options).",
  ),
  open_flipbook: widget(
    "Opens Kindlerye's finished guide as an interactive flipbook over the whole page, the way employees read it online.",
    "Use it when the visitor asks to see a flipbook, a digital or interactive guide, or how employees read the guide online (\"show me the flipbook\", \"can I flip through it?\").",
    "Not for a plain look at a guide (that's open_sample_guide).",
  ),
  open_microsite: widget(
    "Shows the benefits microsite TruHu built for Kindlerye, a sample company, with a button that opens the live site.",
    "Use it when the visitor asks to see a microsite, a benefits website or a benefits portal (\"show me a microsite\", \"what does the website look like?\").",
    "Not when they only ask what a microsite is or does: answer that normally.",
  ),
  open_flyer: widget(
    "Shows the open enrollment flyer TruHu made for Kindlerye, a sample company.",
    "Use it when the visitor asks to see a flyer, a one-pager or an open enrollment handout (\"show me a flyer\", \"do you make flyers?\").",
    "Not when they only ask what a flyer costs or how it's made: answer that normally.",
  ),
};

/** A flow's widget: what it opens, when to send it, and when not to. */
function widget(what: string, when: string, not: string) {
  return {
    type: "object",
    description: [what, when, not, SAY_NOTHING].join(" "),
    properties: {
      request: {
        type: "string",
        description: "What the visitor asked for, in a few of their own words.",
      },
    },
    required: ["request"],
  };
}

/**
 * The body of `POST /api/chat/widgets`, shaped as the chat SDK's
 * registerChatWidgets builds it (it adds `widgetType` to each schema).
 */
export function flowWidgetRegistration() {
  return {
    widgetSchemas: (Object.keys(FLOW_SCHEMAS) as FlowWidget[]).map((widgetType) => {
      const schema = FLOW_SCHEMAS[widgetType] as {
        properties: Record<string, unknown>;
        required: string[];
      };
      return {
        widgetType,
        schema: {
          ...schema,
          properties: { ...schema.properties, widgetType: { type: "string", const: widgetType } },
          required: [...schema.required, "widgetType"],
        },
      };
    }),
  };
}

export const flowOf = (widgetType: unknown): Flow | null =>
  typeof widgetType === "string" && Object.hasOwn(FLOW_WIDGETS, widgetType)
    ? FLOW_WIDGETS[widgetType as FlowWidget]
    : null;

/**
 * Words that mean a question might be asking for one of the popups, taken
 * from what the widgets are for (see FLOW_SCHEMAS). Stems, so "schedul" covers
 * schedule and scheduling. A miss costs a restart; a false hit costs almost
 * nothing, because holding the agent's first words only waits for the end of
 * its first block of text (see BryanCall's answer()).
 */
const FLOW_WORDS =
  /\b(book|schedul|calendar|appointment|meet|set up|call|time|free|slot|availab|talk|speak|upload|send|paperwork|document|file|build|make|rebuild|match|last year|start|interest|option|sample|example|deliverable|produce|demo|show|see|view|preview|look|check out|guide|flyer|flier|handout|one-pager|microsite|website|site|flip|trailer|video|watch|overview)/i;

/** A reply this short is usually a "yes" to Bryan's offer to book or show something. */
const SHORT_REPLY_WORDS = 4;

/**
 * Whether what the visitor said might make the agent send a flow widget: they
 * use one of the popup words, or it's a short reply that could be a "yes". The
 * call holds the agent's first words for these, so Bryan never says words the
 * widget is about to replace.
 */
export function mightOpenFlow(text: string): boolean {
  return text.trim().split(/\s+/).length <= SHORT_REPLY_WORDS || FLOW_WORDS.test(text);
}

/**
 * The flow a reply's `data-ui` event asks for, or null. Ensemble's own table
 * and chart widgets come through the same event and are ignored here.
 */
export function parseFlow(event: { type?: string; data?: unknown }): Flow | null {
  if (event.type !== "data-ui" || !Array.isArray(event.data)) return null;
  for (const widget of event.data) {
    const flow = flowOf((widget as { widgetType?: unknown } | null)?.widgetType);
    if (flow) return flow;
  }
  return null;
}

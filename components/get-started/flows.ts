/**
 * The fixed flows on /BryanKleppe, as the Ensemble agent sees them: a widget
 * each, whose description tells the agent when to send it. The agent only
 * decides *when*. Once a flow widget arrives in a reply, the page speaks
 * Bryan's fixed line (GET_STARTED_PAGE.chat.flows) and opens the popup itself.
 *
 *   calendar     book with Bryan (the calendar, large)
 *   guide        upload documents for TruHu to build a guide from
 *   sampleGuide  Kindlerye's reworked guide, page by page
 *   flipbook     Kindlerye's guide as a flipbook, over the whole page
 *   microsite    Kindlerye's benefits site, with a button to the live one
 *   flyer        Kindlerye's open enrollment flyer
 *
 * Plain data and functions, no React, so the Ensemble pass-through can import
 * the same schemas: it registers these for every thread, whatever the browser
 * sends, so a visitor can't hand the agent widgets of their own.
 */

export type Flow = "calendar" | "guide" | "sampleGuide" | "flipbook" | "microsite" | "flyer";

export const FLOW_WIDGETS = {
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
  open_calendar: {
    type: "object",
    description: [
      "Opens Bryan's booking calendar, large, on the visitor's screen.",
      "Use it when the visitor asks to book, schedule or set up a call or a time with Bryan (\"can you book a time for me?\", \"let's set up a call\", \"put me on his calendar\"), or says yes after you offer to book one.",
      "Not when they only ask how booking works, what the call covers or how long it is, and not when they say they aren't ready yet: answer those normally.",
      SAY_NOTHING,
    ].join(" "),
    properties: {
      request: {
        type: "string",
        description: "What the visitor asked for, in a few of their own words.",
      },
    },
    required: ["request"],
  },
  open_guide_upload: {
    type: "object",
    description: [
      "Opens an upload box on the visitor's screen for their plan documents or last year's benefits guide, so TruHu's team can build a guide from them.",
      "Use it when the visitor asks TruHu to build, make or start a guide for them or a client (\"can you build my guide?\", \"make one for my client\"), or says they have documents to send (\"here are my documents\", \"where do I upload?\").",
      "Not when they only ask how guides work or what it costs (answer those normally), and not when they want to see what a finished guide looks like (that's open_sample_guide).",
      SAY_NOTHING,
    ].join(" "),
    properties: {
      request: {
        type: "string",
        description: "What the visitor asked for, in a few of their own words.",
      },
    },
    required: ["request"],
  },
  open_sample_guide: sample(
    "Shows a finished benefits guide TruHu rebuilt for Kindlerye, a sample company, page by page on the visitor's screen.",
    "Use it when the visitor wants to see what a TruHu guide looks like, an example or sample guide, or TruHu's deliverables or work in general (\"show me a guide\", \"what does a finished guide look like?\", \"what do your deliverables look like?\").",
    "Not when they ask for the flipbook, microsite or flyer by name (each has its own widget), and not when they want a guide built from their own documents (that's open_guide_upload).",
  ),
  open_flipbook: sample(
    "Opens Kindlerye's finished guide as an interactive flipbook over the whole page, the way employees read it online.",
    "Use it when the visitor asks to see a flipbook, a digital or interactive guide, or how employees read the guide online (\"show me the flipbook\", \"can I flip through it?\").",
    "Not for a plain look at a guide (that's open_sample_guide).",
  ),
  open_microsite: sample(
    "Shows the benefits microsite TruHu built for Kindlerye, a sample company, with a button that opens the live site.",
    "Use it when the visitor asks to see a microsite, a benefits website or a benefits portal (\"show me a microsite\", \"what does the website look like?\").",
    "Not when they only ask what a microsite is or does: answer that normally.",
  ),
  open_flyer: sample(
    "Shows the open enrollment flyer TruHu made for Kindlerye, a sample company.",
    "Use it when the visitor asks to see a flyer, a one-pager or an open enrollment handout (\"show me a flyer\", \"do you make flyers?\").",
    "Not when they only ask what a flyer costs or how it's made: answer that normally.",
  ),
};

/** A widget that shows one of Kindlerye's sample deliverables. */
function sample(what: string, when: string, not: string) {
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

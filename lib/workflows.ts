/**
 * THE SINGLE SOURCE OF TRUTH FOR WORKFLOW STATUS.
 *
 * A pill cannot say Live in the nav and Roadmap on a page, because both read
 * this file. Reviewed on every release and quarterly regardless.
 *
 * Brand voice: no roadmap ship dates. Status is Live, Early access or Roadmap.
 * A date on a public page is a promise, and a promise that slips costs more
 * than the roadmap earned.
 */

export type WorkflowStatus = "live" | "early-access" | "roadmap";

export type Workflow = {
  /** Route segment under /advisor. Null where no page exists yet. */
  slug: string | null;
  name: string;
  short: string;
  status: WorkflowStatus;
  statusLabel: string;
  /** Months of the broker year this falls in, 0 indexed. */
  months: number[];
  /** One line: what the deliverable is. */
  deliverable: string;
  /** One line for tiles. */
  tagline: string;
  builtToday: string[];
  truhuDoes: string[];
  humanControl: string[];
  faqs: { q: string; a: string }[];
};

export const WORKFLOWS: Workflow[] = [
  {
    slug: "guides",
    name: "OE Guides and Microsites",
    short: "OE guides and microsites",
    status: "live",
    statusLabel: "Live",
    months: [7, 8, 9, 10],
    deliverable:
      "The open enrollment guide and the microsite an employee opens on their phone, branded to the employer and built from their own plan documents.",
    tagline: "Branded guides and microsites, built from the client's own documents.",
    builtToday: [
      "An account manager gathers last year's guide, the new summaries, the SBCs and the rate sheet.",
      "Somebody rebuilds the file page by page, retyping plan values out of PDFs.",
      "Two proofing rounds catch the copay that changed and the one that did not.",
      "Translation, if it happens, is a separate vendor and a separate deadline.",
    ],
    truhuDoes: [
      "Reads the plan documents you already have and keeps the source page against every value.",
      "Produces the guide and the mobile microsite together, so the PDF and the phone never disagree.",
      "Translates into 36 languages at generation, not afterwards.",
      "Publishes to a link that needs no login, no app and no work email.",
    ],
    humanControl: [
      "Nothing publishes without a named approver.",
      "Every value shows the document and page it came from.",
      "Client brand is locked once and generation cannot override it.",
      "Every version is retained, so you can show what was live on any date.",
    ],
    faqs: [
      {
        q: "What documents do you need?",
        a: "Whatever you already have: carrier summaries, SBCs, the rate sheet, last year's guide. If a value is not in the documents you send, it does not appear in the guide.",
      },
      {
        q: "Can we use the client's brand?",
        a: "Yes, and it is their brand rather than yours. You power the experience, your client gets the credit.",
      },
    ],
  },
  {
    slug: "communications",
    name: "Enrollment Communications",
    short: "Enrollment campaigns",
    status: "live",
    statusLabel: "Live",
    months: [8, 9, 10],
    deliverable:
      "The sequence of texts and emails that gets an enrollment window opened, understood and finished, including the follow-up to whoever missed the first one.",
    tagline: "Campaigns timed to the enrollment window, with follow-up to non-openers.",
    builtToday: [
      "HR writes the announcement themselves, usually the week enrollment opens.",
      "It reaches the people who have a work email and read it.",
      "A flyer goes up in the break room for everyone else.",
      "Nobody can say who was reached, so the follow-up is a second all-staff email.",
    ],
    truhuDoes: [
      "Schedules per group across your whole book from one console.",
      "Sends by text first, because a phone number is the only detail everyone has.",
      "Follows up with the people who did not act, not with everyone again.",
      "Records what happened per named employee.",
    ],
    humanControl: [
      "Send windows, quiet hours and frequency caps are set per client and enforced.",
      "Copy is approved before a campaign can start.",
      "Opt-out is honoured at the phone number and cannot be overridden.",
    ],
    faqs: [
      {
        q: "Do you report open rates?",
        a: "No. Email opens fire when a mail client pre-loads an image, and SMS has no open event at all. We report delivered, failed, clicked, replied and acknowledged.",
      },
      {
        q: "How is texting consent handled?",
        a: "Consent is held per phone number, opt-out is immediate and permanent until re-consented, and the record is exportable.",
      },
    ],
  },
  {
    slug: null,
    name: "Employee Q&A",
    short: "Employee Q&A",
    status: "early-access",
    statusLabel: "Early access",
    months: [9, 10, 11],
    deliverable:
      "The answer an employee gets when they text a question about their own plan, grounded in that employer's documents.",
    tagline: "Answers grounded in that employer's own approved documents.",
    builtToday: [
      "Questions land on HR's desk, or the account manager's, in the two weeks either side of enrollment.",
      "The same nine questions get answered individually, dozens of times.",
    ],
    truhuDoes: [
      "Answers from the same approved documents the guide was built from.",
      "Escalates to a named human when it is not confident, rather than guessing.",
      "Shows the account team what employees are actually asking.",
    ],
    humanControl: [
      "The answerable set is bounded by that group's approved documents.",
      "Escalation is a designed behaviour, not a failure.",
      "Every answer is logged and reviewable.",
    ],
    faqs: [],
  },
  {
    slug: "compliance",
    name: "Compliance Notices",
    short: "Compliance notices",
    status: "roadmap",
    statusLabel: "Roadmap",
    months: [0, 1, 8, 9, 10],
    deliverable:
      "The annual notice packet and the distribution record behind it.",
    tagline: "Annual notice packets, distributed on the calendar, with a record.",
    builtToday: [
      "The checklist lives in a spreadsheet owned by one person.",
      "Notices are assembled per client and bundled into the OE packet.",
      "Proof of distribution is an email in a sent folder.",
    ],
    truhuDoes: [
      "Assembles the packet per client against the calendar for that plan year.",
      "Distributes through the channel the employee already uses.",
      "Produces a per-employee delivery record you can export.",
    ],
    humanControl: [
      "Your compliance lead owns the checklist. TruHu produces and distributes against it.",
      "Nothing here is legal advice, and no notice ships without review.",
    ],
    faqs: [
      {
        q: "Does TruHu tell us which notices are required?",
        a: "No. Your compliance lead owns the requirement. We produce, distribute and record against the calendar they set.",
      },
    ],
  },
  {
    slug: "renewals",
    name: "Renewal Proposal Decks",
    short: "Renewal proposal decks",
    status: "roadmap",
    statusLabel: "Roadmap",
    months: [3, 4, 5, 6],
    deliverable:
      "Current versus renewal, the alternatives you marketed, the contribution modelling and the recommendation.",
    tagline: "Current versus renewal, built from the quotes you already gathered.",
    builtToday: [
      "An analyst rebuilds the same deck for every client, every year, from a template.",
      "Exhibit order, naming and rounding drift between account teams.",
      "It is finished the night before the meeting.",
    ],
    truhuDoes: [
      "Builds the running order and the exhibits from the quote data your team assembled.",
      "Holds one house style, so every deck looks like the same firm produced it.",
    ],
    humanControl: [
      "The recommendation is written by a human. The product does not make a placement recommendation.",
      "Every figure traces to the quote it came from.",
    ],
    faqs: [],
  },
  {
    slug: "stewardship",
    name: "Stewardship Reporting",
    short: "Stewardship reports",
    status: "roadmap",
    statusLabel: "Roadmap",
    months: [0, 1, 11],
    deliverable:
      "The annual account review: what you did for this client all year, what it produced, and what it was worth.",
    tagline: "The annual account review, assembled from work your team already did.",
    builtToday: [
      "Produced by hand for the top twenty accounts, if there is time.",
      "Everyone else gets a renewal call and no document.",
    ],
    truhuDoes: [
      "Assembles the year's activity for every client, not only the largest.",
      "Reports what was produced and measured, from the delivery data itself.",
    ],
    humanControl: [
      "The narrative and next year's commitments are written by the account team.",
    ],
    faqs: [],
  },
];

/** Naming the boundary is a credibility asset. */
export const NOT_IN_SCOPE = [
  {
    name: "Quoting and spreadsheeting",
    why: "Your quoting tools and your analysts own this. We take the output.",
  },
  {
    name: "Ben-admin builds and EDI",
    why: "Your ben-admin owns enrollment and eligibility. We work around it.",
  },
  {
    name: "Billing and commissions",
    why: "That lives in your agency management system and should stay there.",
  },
];

export const workflowsWithPages = () =>
  WORKFLOWS.filter((w): w is Workflow & { slug: string } => Boolean(w.slug));

export const getWorkflow = (slug: string) =>
  WORKFLOWS.find((w) => w.slug === slug);

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The broker year, with TruHu's coverage overlaid. */
export const BROKER_YEAR = [
  { name: "Stewardship and plan-year wrap", months: [0, 1], covered: true },
  { name: "Compliance filings and notices", months: [0, 1, 2], covered: true },
  { name: "Renewal marketing and quoting", months: [3, 4, 5], covered: false },
  { name: "Renewal decision and proposal", months: [5, 6], covered: true },
  { name: "Ben-admin build and EDI", months: [6, 7], covered: false },
  { name: "Open enrollment", months: [8, 9, 10], covered: true },
  { name: "Employee questions and follow-up", months: [9, 10, 11], covered: true },
];

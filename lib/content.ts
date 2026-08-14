/**
 * Content and claims.
 *
 * Numbers come from the brand file's proof bank (truhu-brand.json), which is
 * the approved set. Register §3 still governs how they are presented: a defined
 * metric, a defined population, a period, and a source note. `SourceNote` makes
 * that structural rather than editorial.
 *
 * Brand voice rules enforced throughout: no em or en dashes anywhere, no
 * marketing speak from the banned list, no price figures, no roadmap ship
 * dates, no only-platform superlatives.
 */

export type Approval = "approved" | "draft";

/* -------------------------------------------------------------------------- */
/* Logo wall. Approved partners only (truhu-brand.json approvedPartners).      */
/* -------------------------------------------------------------------------- */

export const BROKER_LOGOS = [
  "Arthur J. Gallagher",
  "Brown & Brown",
  "Hub International",
  "Acrisure",
  "USI",
  "Alera Group",
  "IMA",
  "EPIC",
  "Holmes Murphy",
  "BroadStreet Partners",
];

/** Precise, and better than "trusted by". From the proof bank. */
export const LOGO_WALL_HEADING = "Six of the ten largest US brokerages use TruHu";

/* -------------------------------------------------------------------------- */
/* Statistics                                                                  */
/* -------------------------------------------------------------------------- */

export type StatFact = {
  value: string;
  numeric?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** Metric, population, period, source. All four, always. */
  source: string;
  approval: Approval;
};

export const HOME_STATS: StatFact[] = [
  {
    value: "61%",
    numeric: 61,
    suffix: "%",
    label: "Click rate on text and email",
    source: "TruHu platform data, all employer groups, trailing 12 months",
    approval: "approved",
  },
  {
    value: "3.7M",
    label: "Messages delivered in 12 months",
    source: "TruHu platform data, trailing 12 months",
    approval: "approved",
  },
  {
    value: "2,500+",
    label: "Employer groups on the platform",
    source: "TruHu platform data, August 2026",
    approval: "approved",
  },
];

export const ADVISOR_STATS: StatFact[] = [
  {
    value: "8 hrs to 30 min",
    label: "To build one benefit guide",
    source: "TruHu platform data, measured across customer builds",
    approval: "approved",
  },
  {
    value: "5 days",
    label: "From documents to a live guide",
    source: "Standard service level, every client group",
    approval: "approved",
  },
  {
    value: "36",
    numeric: 36,
    label: "Languages, translated at generation",
    source: "Product capability, verifiable in a demo",
    approval: "approved",
  },
];

export const WORKFORCE_STATS: StatFact[] = [
  {
    value: "246K",
    label: "Employees reached",
    source: "TruHu platform data, August 2026",
    approval: "approved",
  },
  {
    value: "61%",
    numeric: 61,
    suffix: "%",
    label: "Click rate on text and email",
    source: "TruHu platform data, all employer groups, trailing 12 months",
    approval: "approved",
  },
  {
    value: "0",
    numeric: 0,
    label: "Logins an employee needs",
    source: "Product behaviour, verifiable in a demo",
    approval: "approved",
  },
];

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Register §5: no stock portrait may be attached to a named person. Acceptable,
 * in order: a real photograph with permission, then the person's initials, then
 * nothing. Absence is more credible than substitution, so there is no photo
 * slot on this component at all.
 */
export type Quote = {
  quote: string;
  name: string;
  title: string;
  org: string;
  initials: string;
  approval: Approval;
};

export const QUOTE_BROKER: Quote = {
  quote:
    "It stopped us rebuilding the same guide eleven times. Our small groups get what the big ones get now, which we could never justify before.",
  name: "Emily F.",
  title: "Account Manager",
  org: "Regional benefits brokerage",
  initials: "EF",
  approval: "draft",
};

export const QUOTE_HR: Quote = {
  quote:
    "A third of our people have no company email. I could see who had opened the handbook update and who I still had to walk out and find. That list was the whole value.",
  name: "Jenel H.",
  title: "HR Manager",
  org: "Multi-site employer",
  initials: "JH",
  approval: "draft",
};

export const QUOTE_OPS: Quote = {
  quote:
    "The security review actually finished. That is not what normally happens when I ask a vendor what their AI does with our clients' plan documents.",
  name: "E. Caraballo",
  title: "Operations",
  org: "Benefits brokerage",
  initials: "EC",
  approval: "draft",
};

/* -------------------------------------------------------------------------- */
/* Case studies                                                                */
/* -------------------------------------------------------------------------- */

export type CaseStudy = {
  slug: string;
  org: string;
  sector: string;
  side: "Employer" | "Brokerage";
  summary: string;
  headlineStat?: { value: string; label: string; source: string };
  challenge: string[];
  approach: string[];
  result: string[];
  approval: Approval;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "lake-medical-imaging",
    org: "Lake Medical Imaging",
    sector: "Multi-site outpatient imaging",
    side: "Employer",
    summary:
      "Clinical staff across several sites, none of them at a desk, and benefits mail competing with clinical mail.",
    headlineStat: {
      value: "78%",
      label: "Average click rate across every message in the campaign set",
      source: "TruHu platform data, published with customer permission",
    },
    challenge: [
      "Front-desk and technologist staff work across sites and are not at a desk.",
      "Benefits messages competed for attention inside a clinical inbox.",
      "No way to tell an unread message from an undelivered one.",
    ],
    approach: [
      "Sent to phone numbers, not work email, so reach did not depend on a desk.",
      "One action per message, behind a link that opens with no login.",
      "Follow-up to the people who had not acted, not to everyone again.",
    ],
    result: [
      "78% average click rate across the campaign set. Not a best message, an average.",
      "Several individual messages passed 90%.",
      "The team could name everyone who was not reached at all.",
    ],
    approval: "approved",
  },
  {
    slug: "securatech",
    org: "Securatech",
    sector: "Security services, distributed field workforce",
    side: "Employer",
    summary:
      "Officers on rotating shifts across client sites, with no shared start time and no company email.",
    challenge: [
      "No shared shift pattern and no company email address.",
      "Anything that had to reach everyone went through supervisors, in different words.",
      "Enrollment was the hardest case: a fixed window and no way to confirm receipt.",
    ],
    approach: [
      "One channel that assumes no shift, no desk and no inbox.",
      "One message, one link, the same words for everyone, timestamped per person.",
      "A visible list of who was not reached, so supervisor time went where it counted.",
    ],
    result: [
      "Communication stopped depending on the phone tree.",
      "The escalation list replaced the all-hands reminder.",
    ],
    approval: "approved",
  },
];

/* -------------------------------------------------------------------------- */
/* Integrations                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Register §2: every partner must be verifiable by a prospect who clicks
 * through to that partner's own directory. The corpus flags an UNRESOLVED
 * discrepancy on Employee Navigator, so it sits here with `verified: false` and
 * is not rendered. Resolve with the partner, then flip the flag.
 */
export type Integration = {
  name: string;
  category: "Ben-admin" | "HRIS and payroll" | "Agency management" | "Identity";
  what: string;
  direction: string;
  status: "Live" | "Planned";
  verified: boolean;
};

export const INTEGRATIONS: Integration[] = [
  {
    name: "Employee Navigator",
    category: "Ben-admin",
    what: "Group, plan and census sync.",
    direction: "Reads into TruHu",
    status: "Live",
    verified: false, // BLOCKED: partner directory listing not corroborated.
  },
  {
    name: "Ease",
    category: "Ben-admin",
    what: "Group and employee roster sync for distribution lists.",
    direction: "Reads into TruHu",
    status: "Planned",
    verified: true,
  },
  {
    name: "bswift",
    category: "Ben-admin",
    what: "Plan structure and eligibility, used to scope a guide.",
    direction: "Reads into TruHu",
    status: "Planned",
    verified: true,
  },
  {
    name: "Workday",
    category: "HRIS and payroll",
    what: "Worker records and mobile numbers.",
    direction: "Reads into TruHu",
    status: "Planned",
    verified: true,
  },
  {
    name: "ADP",
    category: "HRIS and payroll",
    what: "Worker records and mobile numbers.",
    direction: "Reads into TruHu",
    status: "Planned",
    verified: true,
  },
  {
    name: "Paylocity",
    category: "HRIS and payroll",
    what: "Worker records and mobile numbers.",
    direction: "Reads into TruHu",
    status: "Planned",
    verified: true,
  },
  {
    name: "CSV and SFTP",
    category: "HRIS and payroll",
    what: "Scheduled roster drops, which is what most of a real book has.",
    direction: "Reads into TruHu",
    status: "Live",
    verified: true,
  },
  {
    name: "Salesforce",
    category: "Agency management",
    what: "Client and group records mapped to TruHu groups.",
    direction: "Reads into TruHu",
    status: "Planned",
    verified: true,
  },
  {
    name: "SAML 2.0 SSO",
    category: "Identity",
    what: "Single sign-on for your team. Employees never sign in.",
    direction: "Your IdP into TruHu",
    status: "Live",
    verified: true,
  },
  {
    name: "SCIM",
    category: "Identity",
    what: "Automatic provisioning for brokerage staff.",
    direction: "Your IdP into TruHu",
    status: "Planned",
    verified: true,
  },
];

export const visibleIntegrations = () => INTEGRATIONS.filter((i) => i.verified);

export const INTEGRATION_CATEGORIES = [
  "Ben-admin",
  "HRIS and payroll",
  "Agency management",
  "Identity",
] as const;

export const visibleIntegrationsByCategory = () =>
  INTEGRATION_CATEGORIES.map((category) => ({
    category,
    items: visibleIntegrations().filter((i) => i.category === category),
  })).filter((group) => group.items.length > 0);

/* -------------------------------------------------------------------------- */
/* Resources                                                                   */
/* -------------------------------------------------------------------------- */

export type Resource = {
  slug: string;
  kind: "Research" | "Guide" | "Article";
  title: string;
  dek: string;
  readingTime: string;
  gated?: boolean;
  featured?: boolean;
  body: { heading?: string; paragraphs: string[]; list?: string[] }[];
};

export const RESOURCES: Resource[] = [
  {
    slug: "the-brokerage-year",
    kind: "Research",
    title: "The Brokerage Year",
    dek: "An anatomy of the nine deliverables an account team produces between January and December. Every figure carries its source and date.",
    readingTime: "42 min",
    gated: true,
    featured: true,
    body: [
      {
        paragraphs: [
          "Every brokerage produces roughly the same documents every year, on roughly the same calendar, and almost every one is still built by hand. This is a documented anatomy of those deliverables: what is in them, who builds them, in what order, and how long each takes.",
          "The category talks about brokers constantly and describes their work almost never. An account manager's October appears in no vendor's marketing, which is odd, because it is the thing the software is supposed to be about.",
        ],
      },
      {
        heading: "How to Read the Figures",
        paragraphs: [
          "Every figure carries its source and its date. Vendor-sourced numbers are labelled as vendor-sourced. Where our research could not establish something, the gap is stated rather than smoothed over.",
        ],
      },
    ],
  },
  {
    slug: "delivered-is-not-read",
    kind: "Article",
    title: "Delivered Is Not Read",
    dek: "Why we do not report open rates, and the honest hierarchy of reach signals.",
    readingTime: "7 min",
    body: [
      {
        paragraphs: [
          "There is a hierarchy of what a communication platform can honestly tell you, and most of this industry reports from the wrong end of it.",
          "Strongest first: the person completed the action. Then clicked. Then delivered or failed. Then replied. At the bottom, and far weaker than the category pretends, opened.",
        ],
      },
      {
        heading: "Why Open Rate Stopped Meaning Anything",
        paragraphs: [
          "Email open tracking works by loading a tiny image and recording the request. Mail clients that pre-load images on the reader's behalf record an open whether or not anyone looked. Once that became a default for a large share of consumer mail, the metric stopped separating read from unread.",
          "SMS has the opposite problem. A carrier can tell you a message reached a handset. It cannot tell you a person read it. Any vendor reporting an SMS open rate is reporting an inference.",
        ],
      },
      {
        heading: "What We Report Instead",
        paragraphs: [
          "Delivered. Failed. Clicked. Replied. Acknowledged. Timestamped, per named employee, exportable.",
          "And the one nobody markets: the list of people who could not be reached at all. A bad number is not a low engagement score. It is a person who did not get the message, and it is the only part of a report that tells you what to do next.",
        ],
      },
    ],
  },
  {
    slug: "what-a-broker-should-ask-an-ai-vendor",
    kind: "Guide",
    title: "Eleven Questions to Ask an AI Benefits Vendor",
    dek: "The questions your own operations and compliance reviewers will ask, written down before they ask them.",
    readingTime: "11 min",
    body: [
      {
        paragraphs: [
          "Most AI vendor evaluations in this category stall in the same place: the moment somebody in operations asks what happens to a client's plan documents. It is a fair question with a factual answer, so it should not be the thing that ends a process.",
        ],
        list: [
          "Where does the model get its facts for a specific plan value?",
          "Which model providers see our clients' documents, and under what terms?",
          "Is customer content used to train models? Get it in writing.",
          "What is the human review point, and can it be switched off?",
          "What is retained after a guide is published, and for how long?",
          "Who at the vendor can read our clients' documents, and is that logged?",
          "What happens when the model is not confident?",
          "Can you show exactly what was live on a given date?",
          "What is the subprocessor list, and how are we told when it changes?",
          "What does the SOC 2 report actually cover?",
          "What is the deletion process, and how is deletion evidenced?",
        ],
      },
    ],
  },
];

export const getResource = (slug: string) =>
  RESOURCES.find((r) => r.slug === slug);

/* -------------------------------------------------------------------------- */
/* FAQ. Objection handling, in the buyer's voice. Six, not twelve.            */
/* -------------------------------------------------------------------------- */

export const ADVISOR_FAQ: { q: string; a: string }[] = [
  {
    q: "Does this replace my ben-admin?",
    a: "No. Your ben-admin keeps enrollment, eligibility and the carrier feeds. TruHu produces the client-facing work around it and connects to the stack you already run.",
  },
  {
    q: "Where does the AI get its facts?",
    a: "From the documents you send for that client. Every generated plan value keeps a reference to the source document and page, so review is checking rather than trusting. The model is never asked what a typical copay looks like.",
  },
  {
    q: "Who reviews output before a client sees it?",
    a: "A named person on your team. Approval is a required step, not a setting, and the approver is recorded against the published version.",
  },
  {
    q: "What happens if the plan documents are wrong?",
    a: "The guide reproduces what they say, and the citation shows where it came from. Grounding makes a source error traceable. It does not make it disappear, which is why a human approves.",
  },
  {
    q: "What do you do with our clients' data?",
    a: "It is set out in full on the security page, including which model providers process what, retention and deletion, and the commitment that customer content is not used to train models.",
  },
  {
    q: "Does Advisor send the guide to employees?",
    a: "Advisor produces and publishes it. Reaching an employee with no work email, and recording that you did, is TruHu Workforce. Two products, sold separately, and plenty of customers buy one.",
  },
];

/* -------------------------------------------------------------------------- */

export const TRUST_BADGES = [
  { label: "SOC 2 Type II", detail: "Report available under NDA" },
  { label: "HIPAA posture", detail: "Stated precisely, not as a badge" },
  { label: "WCAG 2.1 AA", detail: "Tested, for the site and the guides" },
];

/**
 * Every string the marketing site renders, in one file.
 *
 * Copy follows the August 2026 content spec built from the TruHu research
 * corpus. Every number on a page carries its source in visible text; a figure
 * with no source does not ship. Keeping the content in one module is what
 * lets the page components stay purely about layout and motion.
 */

/* ------------------------------------------------------------------ home */

export const HERO = {
  eyebrow: "Built for benefits brokers",
  /** Split for the word-by-word mask reveal in the hero. */
  titleLead: "The client-facing work still gets built by hand",
  titleAccent: "at eleven at night.",
  lede: "TruHu builds your open-enrollment guides, benefits sites, notice packets and flyers from the plan documents you already have — and reaches the employees who never log in to anything.",
  primaryCta: { href: "/demo", label: "Book a demo" },
  secondaryCta: { href: "/advisor", label: "See a sample guide" },
  note: "No integrations required to start. Upload one client's plan documents and see the guide.",
} as const;

/** Brokerages named on the truhu.ai logo wall. */
export const BROKERS = [
  "Acrisure",
  "Marsh McLennan",
  "HUB International",
  "Brown & Brown",
  "Alliant",
  "Gallagher",
  "USI",
  "NFP",
  "Lockton",
  "OneDigital",
] as const;

export const ADVISOR = {
  eyebrow: "TruHu Advisor",
  title: "Treat every client like your best client.",
  lede: "Tailor-made guides, benefits sites, notice packets and flyers for every group in your book, built from the documents you already have — in hours, not weeks.",
  cta: { href: "/advisor", label: "See TruHu Advisor" },
} as const;

export type FeatureKey = "materials" | "pipeline" | "brand" | "answers";

export const FEATURES: {
  key: FeatureKey;
  name: string;
  blurb: string;
}[] = [
  {
    key: "materials",
    name: "Four materials, one engine",
    blurb:
      "The open-enrollment guide, the benefits website, the notice packet and the flyer — one build, one designer, one publish path.",
  },
  {
    key: "pipeline",
    name: "Documents in, facts out",
    blurb:
      "Every page is read and classified, and every number becomes a field with a side-by-side comparison per benefit type. You confirm the plans; the build does the rest.",
  },
  {
    key: "brand",
    name: "Their brand, pulled automatically",
    blurb:
      "Each client's materials carry their own logo, colors and type, pulled from their website — and the build never waits on it.",
  },
  {
    key: "answers",
    name: "Employees ask, the guide answers",
    blurb:
      "The share link hosts a chat that answers benefits questions from this client's own plan facts.",
  },
];

/** The renewal-calendar section: why the crunch happens for the whole book at once. */
export const CALENDAR = {
  eyebrow: "The renewal calendar",
  titleLead: "Most of your book renews",
  titleAccent: "January 1.",
  lede: "Carriers release renewal rates 60 to 90 days out. The presentation goes to the client at 75 to 80 days. They decide in about ten. Then open-enrollment materials are rebuilt from scratch, per client, in the 30 to 60 days that are left — for the whole book at once.",
  steps: [
    { value: "60–90", label: "days out — carriers release renewal rates" },
    { value: "75–80", label: "days out — the renewal presentation goes to the client" },
    { value: "~10", label: "days for the client to decide" },
    { value: "30–60", label: "days left to rebuild every client's materials" },
  ],
  noteLead: "Open enrollment can swallow the quarter.",
  noteAccent: "Let us carry the production work.",
} as const;

export const QUOTE = {
  text: "I have another group that I just put on TruHu that they were so pumped about it.",
  name: "Emily F.",
  role: "Account Executive",
} as const;

export const WORKFORCE = {
  eyebrow: "TruHu Workforce",
  title: "Reach every employee on a phone number.",
  lede: "No app and no login. See who got it, per named person, across every client you serve — and the ones you could not reach, by name.",
  points: [
    {
      name: "Reach on a phone number",
      blurb: "No app to install and no account to create.",
    },
    {
      name: "A per-employee record",
      blurb:
        "Who was sent what, and who received it, by name. Not a campaign-level percentage.",
    },
    {
      name: "Every employee on the roster",
      blurb:
        "Not only the ones with a good number on file. If we can't reach her, you see her name.",
    },
    {
      name: "One console for the whole book",
      blurb: "Every employer client in one place, run by you.",
    },
  ],
  cta: { href: "/workforce", label: "See TruHu Workforce" },
  footnote: "Sold separately. Same buyer. One employee record underneath both.",
} as const;

/**
 * The campaign the delivery demo plays back. Illustrative sample data — the
 * point is the shape of the record: counted against the roster, not the send
 * log, with the unreachable listed by name.
 */
export const CAMPAIGN = {
  roster: 851,
  sent: 839,
  delivered: 826,
  noNumber: 12,
} as const;

/** Where TruHu sits in the stack, and what it takes to start. */
export const STACK = {
  eyebrow: "Where TruHu sits",
  title: "Neither system you own builds the guide.",
  lede: "Your AMS holds the book. Your ben-admin platform holds the enrollment record. Neither one produces the guide, the notice packet or the flyer — and neither one reaches the employee who has never logged in. That is the work TruHu does.",
  starts: [
    "No AMS integration",
    "No carrier feed",
    "No ben-admin dependency",
    "No IT project at the employer",
  ],
  caption: "Upload the plan documents for one client and see the guide.",
} as const;

export const RESOURCES = {
  eyebrow: "Latest from TruHu",
  title: "Product updates, industry insights, and lessons from customers.",
  items: [
    {
      kind: "Blog",
      title:
        "California Labor Code § 2802 and what it means for BYOD employee texting",
      blurb:
        "Reimbursement rules catch out employers who text staff on personal phones. Here is the compliant way to do it.",
    },
    {
      kind: "Case study",
      title: "Lake Medical Imaging reaches a 78% average click rate",
      blurb:
        "How a multi-site imaging group replaced break-room posters with messages employees actually open.",
    },
    {
      kind: "Case study",
      title: "Securatech connects a fully mobile workforce",
      blurb:
        "A security firm with no shared office, no company email, and a roster that turns over fast.",
    },
  ],
} as const;

export const CLOSING = {
  titleLead: "See it on",
  titleAccent: "one of your own clients.",
  lede: "Bring the plan documents for a group you are renewing. We will build the guide on the call.",
  primaryCta: { href: "/demo", label: "Book a demo" },
} as const;

/* --------------------------------------------------------------- /advisor */

export const ADVISOR_PAGE = {
  hero: {
    eyebrow: "TruHu Advisor",
    titleLead: "Every guide you build starts from",
    titleAccent: "documents you already have.",
    lede: "SBCs, rate sheets, carrier plan documents. Upload them and TruHu produces the open-enrollment guide, the benefits website, the notice packet and the flyer — in your client's brand, ready for you to edit.",
    primaryCta: { href: "/demo", label: "Book a demo" },
    secondaryCta: { href: "#materials", label: "See a sample guide" },
    note: "No AMS, carrier or ben-admin connection required to start.",
  },
  steps: {
    eyebrow: "How it works",
    title: "From upload to a document you can edit.",
    lede: "Five steps. One of them is yours.",
    items: [
      {
        name: "Upload what you have.",
        body: "SBCs, benefits guides, rate sheets, carrier plan documents. Parsing starts the moment the file lands, not when you hit build.",
      },
      {
        name: "We read every page.",
        body: "Each document gets classified — type, carrier, benefit lines, plans named. Scanned pages that came in sideways are rotated before anything reads them. A prior-year guide is recognized and left out of the build.",
      },
      {
        name: "The numbers become fields.",
        body: "Deductibles, copays, coinsurance, out-of-pocket maximums, contributions and contacts come out as structured data, with a side-by-side comparison table per benefit type — in-network and out-of-network, per plan.",
      },
      {
        name: "You confirm the plans.",
        body: "The one place a person has to decide. Review the plan list, rename anything the carrier named badly, set employee classes if the client has them, add the logo and the plan-year dates. Then build.",
      },
      {
        name: "You get a document you can edit.",
        body: "Sections you can reorder, hide or rewrite. Lock a section and it comes back verbatim next rebuild; your theme, section order and header stay put. Publish it as a benefits website, download it as a PDF, or send a link.",
      },
    ],
  },
  materials: {
    eyebrow: "What it produces",
    title: "Four materials from one build.",
    items: [
      {
        name: "Open-enrollment guide",
        blurb: "Built from this year's confirmed plans, ready to edit.",
      },
      {
        name: "Benefits website",
        blurb: "The guide as a site, in the client's brand, no login to read.",
      },
      {
        name: "Notice packet",
        blurb: "Annual notices with versioned, effective-dated compliance language.",
      },
      {
        name: "Benefit flyer",
        blurb: "A one-page summary in the client's brand.",
      },
    ],
    caption: "Four material types, one engine, one designer, one publish path.",
  },
  trust: {
    eyebrow: "Why the output holds up",
    title: "The rules behind the numbers are built in.",
    items: [
      {
        name: "A deductible is a fact with rules attached.",
        body: "A 259-field registry with 421 label variants carries the plan-design rules underneath the number: dental EPO plans are in-network only, an ER copay waived on admission is a different fact from an ER copay, and lower is better for some fields and worse for others.",
      },
      {
        name: "It already knows what a good guide looks like.",
        body: "The comparison rows, the order they belong in, the cost ladder from primary care to urgent care to the emergency room. Built in, so it does not depend on who is drafting at midnight.",
      },
      {
        name: "Every carrier's labels become one vocabulary.",
        body: "“Deductible (Individual)” and “Calendar Year Deductible — Single” resolve to the same field. That is what lets a plan match itself next year, and what lets one template work across carriers.",
      },
      {
        name: "Compliance language is versioned and dated.",
        body: "It is managed centrally, and when it changes, rebuilt documents carry the current version.",
      },
    ],
  },
  book: {
    eyebrow: "Across the book",
    title: "Every client gets the best-client treatment.",
    body: [
      "The same plan matches itself year over year, so next renewal starts from what you confirmed last renewal. The template is carrier-agnostic, so it works on the client that just moved carriers as well as the one that did not.",
      "A tailored guide stops being something you ration to the largest accounts. The fifty-life group gets the same build quality as the anchor client, because the hours no longer come out of anyone's night.",
    ],
  },
  comparison: {
    eyebrow: "The comparison that matters",
    title: "Compare it to what you do now, not to other software.",
    body: "The alternatives are an outside agency at four thousand dollars a guide on a three-week cycle, or an account manager rebuilding last year's PowerPoint the week before enrollment opens. Both are real budget lines. That is the comparison.",
  },
  close: {
    titleLead: "Bring a group",
    titleAccent: "you are renewing.",
    lede: "Send the documents before the call and watch the guide get built live.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* ------------------------------------------------------------- /workforce */

export const WORKFORCE_PAGE = {
  hero: {
    eyebrow: "TruHu Workforce",
    titleLead: "The employees hardest to reach are",
    titleAccent: "the ones the plan is for.",
    lede: "TruHu Workforce reaches employees on a phone number, with no app and no login, and keeps a per-person record of what was sent and who received it, across every client in your book.",
    primaryCta: { href: "/demo", label: "Book a demo" },
    note: "Sold separately from Advisor. One employee record underneath both.",
  },
  unreached: {
    eyebrow: "Who gets missed",
    title: "Email and the portal stop at the front office.",
    body: "The warehouse worker, the driver, the restaurant crew, the second-shift line — they have no work email address and they do not log in to the enrollment portal. The materials get sent to HR, HR forwards them or prints them, and what happens after that is nobody's record.",
  },
  erisa: {
    eyebrow: "The rule most people have not read",
    title: "ERISA does not accept “we posted it.”",
    body: [
      "The standard is delivery “reasonably calculated to ensure actual receipt” — 29 CFR 2520.104b-1(b)(1). The 2002 electronic-delivery safe harbor at 2520.104b-1(c) covers employees whose job puts them at a computer. It reaches everyone else only with their affirmative, documented consent, which is the thing nobody collects.",
      "And a federal court has held that the existence of a document is not evidence the document was sent.",
    ],
    proposal: {
      label: "A proposal, not a rule",
      body: "A July 2026 DOL proposal would let group health plans post documents to a website and send a notice of availability to an electronic address the plan holds for each person — an email address or an internet-connected mobile number — with monitoring for bad addresses.",
    },
  },
  gets: {
    eyebrow: "What you get",
    title: "A record with names on it.",
    items: [
      {
        name: "Reach on a phone number.",
        body: "No app to install and no account to create.",
      },
      {
        name: "A per-employee record.",
        body: "Who was sent what, and who received it, by name. Not a campaign-level percentage.",
      },
      {
        name: "Every employee on the roster.",
        body: "Not only the ones with a good number on file. If we can't reach her, you see her name.",
      },
      {
        name: "One console for the whole book.",
        body: "Every employer client in one place, run by you.",
      },
    ],
  },
  hr: {
    eyebrow: "Why it stays",
    title: "HR runs it too.",
    body: "HR runs Workforce as their own rail for reaching their own workforce — the roster they built, the phone numbers they collected from people with no work email, the segments by site and shift, the message history. That is why the client notices when it is gone.",
  },
  close: {
    titleLead: "Start with one client",
    titleAccent: "and one roster.",
    lede: "A spreadsheet is enough. No benefits data required to begin.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* ---------------------------------------------------------- /how-it-works */

export const HOW_PAGE = {
  hero: {
    eyebrow: "How it works",
    titleLead: "What happens between",
    titleAccent: "upload and send.",
    lede: "The mechanics of both products, for the buyer who wants them before a call.",
  },
  blocks: [
    {
      name: "What you upload",
      body: "Advisor reads what the carrier already gave you: SBCs, benefits guides, rate sheets, carrier plan documents. Workforce needs a roster — a spreadsheet import with up to 25 fields, and no benefits data required.",
    },
    {
      name: "What happens to a document",
      body: "Parsing starts on upload, not when you hit build, and a file parsed once is never parsed again. Large PDFs are split into 20-page chunks; scanned pages that came in sideways are rotated before anything reads them. A document recognized as a prior-year guide is left out of the build, and a file that fails to parse still counts as done — one bad document cannot hang the build.",
    },
    {
      name: "Where a person decides",
      body: "The machine stops where the decisions become judgment calls: which of these is a plan and which is a network tier, what the client calls it, who is eligible for what. You review the detected plan list, confirm or rename, set employee classes, fill a short intake, pick a template and hit build.",
    },
    {
      name: "How the document gets built",
      body: "Verify: code checks every table's plan names against the list you confirmed. Canonicalize: every carrier writes labels differently, so “Deductible (Individual)” and “Calendar Year Deductible — Single” get one stable key — which is what makes year-over-year comparison possible. Hydrate: mechanical fields fill with no AI; only the prose that has to sound human is generated. Brand: the employer's colors, fonts and images come from their own website, and never block the build.",
    },
    {
      name: "How it ships",
      body: "Publish a benefits website, download a PDF, or send a link employees open — which also hosts the ask-a-question chat. Your edits survive rebuilds: locked sections carry over verbatim, and your theme and section order persist. A confirmed plan matches itself next year, so the next renewal starts from this one.",
    },
    {
      name: "How employees get reached",
      body: "Workforce sends to a phone number, with no app and no login. Segments run on the HR attributes in the roster — site, shift, class, 22 fields in all — and every send resolves to a per-person record of what was sent and received.",
    },
    {
      name: "What it does not require",
      body: "No AMS integration. No carrier feed. No ben-admin platform. No IT project at the employer.",
    },
  ],
  close: {
    titleLead: "See it run on",
    titleAccent: "a real group.",
    lede: "Bring the plan documents for a client you are renewing.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* -------------------------------------------------------- /for-brokerages */

export const BROKERAGES_PAGE = {
  hero: {
    eyebrow: "For brokerages",
    titleLead: "Service is why you keep the account.",
    titleAccent: "It is also what costs you the most.",
    lede: "Employers name prompt, effective service as the top reason they stay with a broker. Producing that service is the largest labor line in the practice.",
  },
  stats: [
    {
      value: 57,
      suffix: "%",
      label: "Stay for prompt, effective service",
      note: "Zywave employer survey, 2024",
    },
    {
      value: 228321,
      prefix: "$",
      label: "Revenue per employee, at 26.1% EBITDA",
      note: "Reagan Consulting / Big “I” Best Practices, 2025 · 349 agencies",
    },
    {
      value: 83,
      suffix: "%",
      label: "Want weekly or monthly broker contact",
      note: "Zywave employer survey, 2024",
    },
  ],
  statsNote:
    "Wages run above a third of revenue industry-wide. Service hours removed are margin; service hours added are a hire.",
  gap: {
    eyebrow: "The expectations gap",
    title: "Employers already told you the gap.",
    body: "96% of C-suite respondents want their broker to help develop risk-management strategy; 58% say their broker fully delivers. 94% call multiyear strategic benefit planning important; 51% say they get it. What closes that gap is hours, and hours are what production work takes.",
    source: "Zywave Broker Services Survey, 2026 · 1,400 US employers",
  },
  hours: {
    eyebrow: "The labor line",
    title: "Where the hours actually go.",
    items: [
      {
        name: "Open-enrollment materials",
        blurb:
          "Rebuilt from scratch every year, per client, in the 30 to 60 days after the client decides.",
      },
      {
        name: "Renewal decks and stewardship reports",
        blurb:
          "Assembled by hand in PowerPoint from spreadsheets, CRM notes and old emails. No software category exists for either one.",
      },
      {
        name: "Employee questions",
        blurb: "Worked by phone and inbox, all year, and invisible in every report.",
      },
    ],
  },
  changes: {
    eyebrow: "What changes",
    title: "One production path for the whole book.",
    body: "Instead of one project per client: last year's confirmed plans as the starting point for this year's build, and a record of what reached which employee at which client, ready for the renewal meeting.",
  },
  close: {
    titleLead: "Run it against",
    titleAccent: "one book segment.",
    lede: "Pick a segment you are renewing this cycle and see the production path on your own groups.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* --------------------------------------------------------------- /security */

export const SECURITY_PAGE = {
  hero: {
    eyebrow: "Security",
    titleLead: "Built for a brokerage's",
    titleAccent: "security review.",
    lede: "What is running in production today, for the team that has to sign off.",
  },
  items: [
    {
      name: "Session security",
      body: "Sessions are server-side and opaque, secrets are hashed, sessions idle out at 60 minutes, and access rights are re-validated against live membership every 90 seconds — so when someone is removed, their access ends mid-session rather than at next login.",
    },
    {
      name: "Role-scoped access in Workforce",
      body: "Permissions are scoped by section, so a user sees only the sections they are assigned.",
    },
    {
      name: "One employee record, one place",
      body: "Advisor and Workforce read the same employee table rather than keeping two copies of an employer's roster.",
    },
    {
      name: "Versioned compliance language",
      body: "Compliance text is centrally managed, effective-dated and usage-tracked; rebuilt documents pick up the current version.",
    },
  ],
  close: {
    titleLead: "Bring the questionnaire",
    titleAccent: "to the first call.",
    lede: "The first call is with someone who can answer the security questions.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* ---------------------------------------------------------------- /pricing */

export const PRICING_PAGE = {
  eyebrow: "Pricing",
  title: "Priced per client, for the whole book.",
  lede: "Pricing depends on the size of your book and which products you run. Tell us how many employer groups you serve and we will put a number in front of you.",
  caption:
    "The conversation is about delivery to hard-to-reach employees and reuse across the renewal cycle — not the cost of content.",
} as const;

/* ------------------------------------------------------------------- /demo */

export const DEMO_PAGE = {
  eyebrow: "Book a demo",
  title: "Bring a group you are renewing.",
  lede: "Send the plan documents for one client before the call. We will build the guide live.",
  facts: [
    "No AMS or ben-admin integration required to start",
    "Works on the clients who just changed carriers",
    "One client's documents is enough to see it",
  ],
} as const;

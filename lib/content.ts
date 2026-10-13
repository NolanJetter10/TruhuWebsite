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
  /**
   * The vision as the headline, ending on the phrase that carries the
   * green→blue sweep. Each half is word-split by the mask reveal, so they are
   * kept apart rather than joined.
   */
  titleLead: "The AI platform benefit brokers",
  titleAccent: "grow with.",
  /** Rendered one line per entry. */
  lede: [
    "Enterprise-grade AI that automates your most time-consuming work, so you can serve every client to a higher standard at a fraction of today's cost.",
  ],
  /** The hero lede is too short to serve as a meta description on its own. */
  description:
    "TruHu turns the documents you already have into a personalized enrollment guide and benefits site for every client in your book — and reaches the employees who never log in to anything.",
  primaryCta: { href: "/demo", label: "Book a demo" },
} as const;

/**
 * The logo wall, exactly as it runs on truhu.ai today. Names pair with the
 * artwork in `public/images/brokers/` — the marquee imports the files itself.
 */
export const BROKERS = [
  { name: "Acrisure", file: "acrisure" },
  { name: "Alera Group", file: "alera-group" },
  { name: "Arthur J. Gallagher", file: "arthur-j-gallagher" },
  { name: "Brown & Brown", file: "brown-brown" },
  { name: "EPIC Insurance Brokers", file: "epic-insurance-brokers" },
  { name: "GIS Benefits", file: "gis-benefits" },
  { name: "The Hilb Group", file: "hilb-group" },
  { name: "Holmes Murphy", file: "holmes-murphy" },
  { name: "HUB International", file: "hub-international" },
  { name: "IMA Financial Group", file: "ima-financial-group" },
  { name: "INSURICA", file: "insurica" },
  { name: "Leavitt Group", file: "leavitt-group" },
  { name: "Marsh McLennan", file: "marsh-mclennan" },
  { name: "McGriff", file: "mcgriff" },
  { name: "OneDigital", file: "onedigital" },
  { name: "Patriot Growth Insurance Services", file: "patriot-growth-insurance" },
  { name: "Professional Group Plans", file: "professional-group-plans" },
  { name: "Seubert & Associates", file: "seubert-associates" },
  { name: "The Mahoney Group", file: "the-mahoney-group" },
] as const;

/**
 * The customer videos between the logo marquee and the numbers band: a big
 * player over a row of 16:9 cards, the chosen card lifted with its speaker
 * named under it and its video in the player.
 *
 * PLACEHOLDER STORIES. Nothing has been recorded yet, so every entry is an
 * empty slot and the player shows `pendingLabel`. When a video lands, give its
 * entry the speaker's real name and role, the file as `video`, and a still
 * from it as `poster`.
 */
export const STORIES = {
  titleLead: "Hear it from the brokers",
  titleAccent: "who run on TruHu.",
  lede: "Short conversations with brokers on the platform: where they started, what their clients get now, and what changed.",
  pendingLabel: "Video coming soon",
  items: [
    { name: "Speaker name", role: "Title, Brokerage" },
    { name: "Speaker name", role: "Title, Brokerage" },
    { name: "Speaker name", role: "Title, Brokerage" },
    { name: "Speaker name", role: "Title, Brokerage" },
    { name: "Speaker name", role: "Title, Brokerage" },
  ],
} as const;

/**
 * The band that closes the trust rail, under the customer stories.
 *
 * PLACEHOLDER FIGURES. These are the only numbers on the site that do not carry
 * a source in visible text, and by the rule at the top of this file they cannot
 * ship as they are — they exist so the count-up and the layout can be judged.
 * Replace the values and the caption with real, attributable ones before launch.
 */
export const TRUST_STATS = {
  eyebrow: "The book, in numbers",
  stats: [
    { value: 340, suffix: "+", label: "Brokerages on the platform" },
    { value: 5200, suffix: "+", label: "Employer groups live" },
    { value: 12400, suffix: "+", label: "Benefit guides built" },
  ],
} as const;

/**
 * The open-enrollment section: the crunch, then the three problems TruHu takes
 * on — getting the data together, the manual work of turning it into something
 * a client sees, and what that workload does to the result. The answer comes
 * in `SOLUTION`, right after. `pieces` are the scattered inputs, chores and
 * casualties drawn under each problem; `missing` are the things a client never
 * gets at all, drawn as empty slots.
 */
export const WORKLOAD = {
  titleLead: "We get it —",
  titleAccent: "open enrollment is chaos.",
  lede: "Your team is putting in 10-hour days on outdated tools just to get every client's materials out the door. Every renewal starts with chasing down data and ends with hours of manual work to turn it into something a client sees.",
  todayLabel: "Today",
  problems: [
    {
      problem: "Chasing down the data",
      detail: "Data from 100+ sources.",
      pieces: [
        "SBCs",
        "Rate sheets",
        "Carrier portals",
        "Plan documents",
        "Spreadsheets",
        "Email threads",
        "Last year's guide",
      ],
    },
    {
      problem: "Hours of manual work",
      detail: "For every client, every renewal.",
      pieces: [
        "Retyping plan tables",
        "Matching each brand",
        "Formatting the PDF",
        "Chasing client edits",
        "Starting over next year",
      ],
    },
    {
      problem: "Output that suffers",
      detail: "Your top 10% get white glove. Everyone else gets what's left.",
      pieces: [
        "Thrown-together PDFs",
        "Mismatched themes",
        "Patchwork data",
        "Clients left guessing",
      ],
      missing: ["No flipbooks", "No videos", "No presentations"],
    },
  ],
} as const;

/**
 * The advisor testimonials, in the order truhu.ai rotates them. `accent` is the
 * phrase inside `text` that carries brand green — the live site highlights the
 * line that makes the point rather than the whole quote. `face` names the file
 * in `public/images/advisors/`; the page imports the artwork itself.
 */
export const QUOTES = [
  {
    text: "I have another group that I just put on TruHu that they were so pumped about it. They took it and ran with it. Haven't done anything because they're like, nope, we've got this. We love it.",
    accent: "we've got this. We love it.",
    name: "Emily F.",
    role: "Account Executive",
    face: "emily",
  },
  {
    text: "If this is something that I can put in front of some of our producers, that's a game changer.",
    accent: "a game changer.",
    name: "John H.",
    role: "Employee Benefits Growth Leader",
    face: "john",
  },
  {
    text: "All of our clients that have given this a chance and tried it on, love it.",
    accent: "love it.",
    name: "Christine W.",
    role: "Senior Benefits Advisor",
    face: "christine",
  },
] as const;

export const QUOTES_HEADING = "What advisors are saying";

/** What Workforce does. Runs on /workforce, between the problem and the six
 *  message categories. */
export const WORKFORCE = {
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

/**
 * The two products, after the testimonials. Each card says what the product
 * produces rather than how it works; the product pages carry the
 * mechanism. Equal weight and nothing connecting them: they are sold
 * separately, and the home page must not read as one build-and-send pipeline.
 */
export const PRODUCTS = {
  title: "Our products",
  items: [
    {
      product: "Advisor",
      href: "/advisor",
      title: "A personalized enrollment guide and benefits site for every client.",
      body: "Built from the SBCs, rate sheets and plan documents you already have, in the client's own brand. Your team reviews it, then publishes.",
      outputs: ["Benefits guide", "Benefits website", "Benefit flyer", "Employee Q&A"],
      cta: "Explore Advisor",
    },
    {
      product: "Workforce",
      href: "/workforce",
      title: "A text to every employee, and a record of who got it.",
      body: "Messages reach a personal phone, with no app to install and no login. Every send leaves a per-person record, and anyone you couldn't reach is listed by name.",
      outputs: ["Text and email campaigns", "Acknowledgments", "Per-person record"],
      cta: "Explore Workforce",
    },
  ],
  footnote: "Sold separately. Start with either one.",
} as const;

/**
 * What TruHu does, straight after the open-enrollment problems: the answer to
 * each of `WORKLOAD.problems`, in the same order and the same card layout.
 * `pieces` answer that problem's chips one for one where they can, and `added`
 * fills the slots the third card showed missing. Kept high level on purpose:
 * /advisor carries the mechanics, and every claim here restates one it makes.
 * The outputs are Advisor's only; Workforce is sold separately.
 */
export const SOLUTION = {
  titleLead: "TruHu's platform helps you harness this chaos to produce",
  titleAccent: "the highest-quality deliverables in a fraction of the time.",
  lede: "Our embedded AI allows you to make any change in plain English, build guides in bulk and translate them into 100+ languages in seconds. After you publish, it keeps working as a chatbot that reads each guide and answers employees' questions, so every choice is an informed one.",
  cta: { href: "/advisor", label: "Learn more about our platform" },
  withLabel: "With TruHu",
  answers: [
    {
      answer: "The data, gathered",
      detail: "AI reads your source documents and last year's builds, as they are.",
      pieces: [
        "SBCs",
        "Rate sheets",
        "Plan documents",
        "Spreadsheets",
        "Scans",
        "Last year's guide",
      ],
    },
    {
      answer: "The work, automated",
      detail: "Agentic tools do the build: accurate, fast and your way.",
      pieces: [
        "Plan tables filled from source",
        "Each client's brand applied",
        "Layout done for you",
        "Edits in plain words",
        "Next year starts here",
      ],
    },
    {
      answer: "The output, elevated",
      detail: "White glove for every client, not just your top 10%.",
      pieces: ["Polished guides", "Their brand throughout", "Accurate plan data", "Answers on demand"],
      added: ["Flipbooks", "Videos", "Presentations"],
    },
  ],
} as const;

/**
 * The home page section after `SOLUTION`: the same platform as five steps,
 * drawn by `DocumentFlow` from `DOCUMENT_FLOW_STEPS`.
 */
export const DOCUMENT_FLOW = {
  titleLead: "Source data in, deliverables out.",
  titleAccent: "Conversational control at every step along the way.",
} as const;

/** The five steps `DocumentFlow` draws. `key` picks the step's scene. */
export const DOCUMENT_FLOW_STEPS = [
  {
    key: "upload",
    name: "Upload anything",
    body: "SBCs, rate sheets, scans and last year's guide go in as they are, so there's no cleanup before work starts.",
  },
  {
    key: "organize",
    name: "Sorted automatically",
    body: "Every file is read and filed by coverage, so each client's plans live in one place, not across inboxes.",
  },
  {
    key: "extract",
    name: "Details extracted",
    body: "Deductibles, copays and rates come straight from the source, so nothing is retyped or mistyped.",
  },
  {
    key: "save",
    name: "Saved for next time",
    body: "Confirmed plans stay on the client's record, so updates and next year's renewal start here, not from scratch.",
  },
  {
    key: "build",
    name: "Built in their brand",
    body: "Guides, sites and flyers come out in each client's brand, so your smallest group gets what your largest does.",
  },
] as const;

/**
 * Backs the hero's "enterprise-grade". One line per
 * pillar: the detail lives on /security and /how-it-works, and every line here
 * restates something those pages already say.
 */
export const RESPONSIBLE_AI = {
  titleLead: "AI saves time and money,",
  titleAccent: "but the expert never leaves the loop.",
  lede: "AI is great at processing huge amounts of information, organizing, and drafting. Human taste, validation, and care still belong to the expert.",
  pillars: [
    {
      name: "What the AI does",
      body: "Reads, sorts and extracts your plan documents, then drafts. Plan figures come from the source, not the model.",
    },
    {
      name: "What your team does",
      body: "Confirms the plans, edits anything, and publishes. Nothing reaches a client until they do.",
    },
    {
      name: "How data is handled",
      /** Non-breaking spaces keep "SOC 2 Type II" on one line. */
      body: "SOC\u00a02 Type\u00a0II compliant. Employee sites use non-indexed links, with optional password protection.",
    },
  ],
  cta: { href: "/security", label: "Read the security overview" },
} as const;

/* ------------------------------------------------------------- /resources */

/** Page chrome only. The library entries themselves live in `lib/resources.ts`. */
export const RESOURCES_PAGE = {
  eyebrow: "Resources",
  /** One hero per route. Plain lines, matching the home hero. */
  kinds: {
    blog: {
      title: "What we have learned building a book's worth of guides.",
      lede: "Writing on open enrollment, compliance, and reaching a workforce that does not sit at a desk.",
    },
    case: {
      title: "The production line, seen from inside a brokerage.",
      lede: "How teams moved a whole book onto one build process — and what the employees on the other end actually did.",
    },
  },
  downloads: {
    title: "Templates and checklists you can put to work this renewal season.",
    lede: "Practical documents from the same production line. No form to fill in.",
  },
  close: {
    titleLead: "See it on",
    titleAccent: "one of your own clients.",
    lede: "Bring the plan documents for a group you are renewing. We will build the guide on the call.",
    cta: { href: "/demo", label: "Book a demo" },
  },
  article: {
    backLabel: "All resources",
    relatedTitle: "Keep reading",
  },
} as const;

export const CLOSING = {
  titleLead: "See it on",
  titleAccent: "one of your own clients.",
  lede: "Bring the plan documents for a group you are renewing. We will build the guide on the call.",
  primaryCta: { href: "/demo", label: "Book a demo" },
} as const;

/* ------------------------------------------------------------------- FAQs */

export type FaqCategory = {
  title: string;
  questions: readonly { q: string; a: string }[];
};

/* --------------------------------------------------------------- /advisor */

export const ADVISOR_PAGE = {
  hero: {
    eyebrow: "TruHu Advisor",
    titleLead: "The brokers growing their book faster aren't working more hours.",
    titleAccent: "They're Powered by TruHu.",
    lede: "TruHu Advisor helps brokers deliver a premium benefits experience to every client in their book at a fraction of the time and cost of today.",
    primaryCta: { href: "/demo", label: "Get started with TruHu" },
    note: "White-glove service. Delivered to every client. Automatically.",
  },
  problem: {
    /** Rendered as: {lead} <em>{emphasisA}</em> {mid} <em>{emphasisB}</em> */
    title: {
      lead: "Your top clients get",
      emphasisA: "everything,",
      mid: "the rest get a",
      emphasisB: "pdf.",
    },
    paragraphs: [
      "Most brokers only have the bandwidth to deliver white-glove service to their top 10 or 20 accounts. The rest get a generic PDF, a one-off email, and a hope that employees figure it out.",
      "That inconsistency costs you: in enrollment rates, client satisfaction, and retention when renewal season comes around.",
      "Meanwhile, account managers are spending hours on manual, one-off builds that don't scale.",
    ],
    kicker: "Until now.",
    /** The before-and-after guide viewer beside the copy. `file` is the name
     *  shown in the viewer's address bar while that guide is on screen. */
    guides: {
      before: {
        label: "Before TruHu",
        file: "00 - Employee Benefit Packet 11.1.2025 (1).pdf",
      },
      after: {
        label: "With TruHu",
        file: "sample-company-guide-10-06-2026.pdf",
      },
      description:
        "A real client's benefits packet, with names and rates changed: 50 pages of carrier summaries, plan forms and flyers stapled together, scrolled page by page. It gives way to the 21-page guide TruHu built from the same documents, one consistent design from cover to contacts.",
    },
  },
  /** How a folder of documents becomes finished materials, between the
   *  problem and the outputs. Keys pick the stage's scene in `IntakePipeline`. */
  pipeline: {
    titleLead: "TruHu builds deliverables",
    titleAccent: "from your source materials and last year's deliverables.",
    stages: [
      {
        key: "book",
        name: "Your book",
        body: "A folder for every client, just as it is today.",
      },
      {
        key: "upload",
        name: "Upload",
        body: "Drop in everything: SBCs, rates, scans, old guides.",
      },
      {
        key: "sort",
        name: "Auto-sort",
        body: "Every file read, filed and mined for plan details.",
      },
      {
        key: "choose",
        name: "Choose",
        body: "Pick what this client should get.",
      },
      {
        key: "build",
        name: "Build",
        body: "Everything built from their plans, in their brand.",
      },
    ],
  },
  /** The tabbed tour of what Advisor builds. Keys pick the demo in `OutputShowcase`.
   *  Called a chatbot and a video outright: "Q&A" read as a static FAQ page.
   *  The chatbot keeps the key `qna`, which the home page's flow shares. */
  outputs: {
    titleLead: "Bring the premium experience to each and every client,",
    titleAccent: "the way they want it.",
    tabs: [
      {
        key: "guide",
        name: "Benefits guide",
        title: "A complete guide, in their brand.",
        blurb: "Every plan, cost and contact, laid out from the client's own documents. Print it, send the PDF, or share it as a link.",
        points: [
          "Plan and cost tables filled from the source documents",
          "The client's logo, colors and fonts",
          "Change anything by asking the AI design assistant",
        ],
      },
      {
        key: "flipbook",
        name: "Digital flipbook",
        title: "A guide that turns its pages.",
        blurb: "The benefits guide as a book employees page through on any screen, from the cover to the contacts. Send it as a link: nothing to download, no app and no login.",
        points: [
          "Turns its pages like the printed guide",
          "Opens on a phone, tablet or computer",
          "The same pages and brand as the guide",
        ],
      },
      {
        key: "website",
        name: "Benefits website",
        title: "A benefits hub for every employer.",
        blurb: "Each client gets their own benefits site under their brand. Employees open it from a link or a QR code: no app and no login.",
        points: [
          "Medical, dental, vision and more in one place",
          "Built for the phone first",
          "A built-in chatbot answers questions from their plans",
        ],
      },
      {
        key: "qna",
        name: "Benefits chatbot",
        title: "An AI chatbot that knows their plans.",
        blurb: "Every benefits site comes with an AI chatbot employees can ask about their coverage, any time. It answers from their employer's own plan documents, so questions that would have gone to HR or your team get answered on the spot.",
        points: [
          "Answers drawn only from that client's plan documents",
          "Shows the document behind every answer",
          "Right on the benefits site: no app, no login",
        ],
      },
      {
        key: "video",
        name: "Narrated video",
        title: "A video that answers back.",
        blurb: "Any guide plays as a narrated presentation, with speaking notes written and voiced for you. And in a TruHu first, employees can stop it partway through, ask a question, and hear the answer from their own plans.",
        points: [
          "Stop it to ask a question, then pick up where it left off",
          "Speaking notes and voice generated from the guide",
          "Share it as a link, or play it at the enrollment meeting",
        ],
      },
      {
        key: "flyer",
        name: "Benefit flyer",
        title: "A flyer that sends people online.",
        blurb: "A one-page flyer for the break room, the handbook or the enrollment meeting, with a QR code that opens the client's benefits site.",
        points: [
          "Key dates and what's new this year",
          "Scan the QR code to open the benefits site",
          "Ready to print or post",
        ],
      },
    ],
  },
  features: {
    titleLead: "TruHu's agentic tools",
    titleAccent: "make the process seamless.",
    lede: "Your team tells the AI what to do in plain words, and it does the work: restyling a guide, translating a site, building out a whole book. Embedded AI does the grunt work the way you want it, so you can focus on what matters.",
    dashboard: {
      alt: "Advisors reviewing the TruHu platform",
      chips: ["124 clients deployed", "Avg. 85% enrollment rate"],
    },
    /** What Advisor does for the broker, now that the outputs tour above has
     *  shown what the client gets. Two rows of three on desktop: building and
     *  shaping the work, then what every deliverable comes with. */
    items: [
      {
        name: "Your Whole Book at Once",
        body: "Upload last year's guides and this year's source documents for every client. TruHu sorts them and builds each client's deliverables, so accurate drafts are ready to review in under a day.",
      },
      {
        name: "AI Design Assistant",
        body: "Tell it what to add, cut or reword, and the guide changes in front of you, with no design software. Unique to TruHu, and one of its most-used features.",
      },
      {
        name: "Learns Your Style",
        body: "Show TruHu a guide you like and it learns the layout and wording, so every new deliverable comes out in your style and format.",
      },
      {
        name: "100+ Languages in Seconds",
        body: "Any guide or site, translated by AI that knows benefits terms, so every employee in a client's workforce can read it in their own language.",
      },
      {
        name: "Accurate to the Source",
        body: "Plan figures are filled from the carrier documents rather than written by the model, and every chatbot answer cites the document it came from.",
      },
      {
        name: "Employer-Specific Branding",
        body: "We pull each client's logo, colors and fonts from their website and apply them to every guide, site and flyer they get.",
      },
    ],
  },
  results: {
    eyebrow: "Proven results",
    /** The same three figures the Workforce page reports — one platform, one
     *  set of numbers. */
    stats: [
      { value: 15, suffix: "%", label: "Higher engagement", note: "open enrollment" },
      {
        value: 75,
        suffix: "%",
        label: "Lower communications costs",
        note: "using one tool",
      },
      { value: 36, suffix: "%", label: "Higher view rates", note: "vs email alone" },
    ],
  },
  /**
   * Advisor's questions only. Rendered on /advisor and as the broker half of
   * /faq, so the two cannot drift. Texting consent, message tracking and
   * campaign results are Workforce questions and live in `WORKFORCE_PAGE.faq`.
   */
  faq: {
    title: "Frequently Asked Questions",
    lede: "What brokers ask before putting their book on Advisor: what it builds, where the AI gets its facts, who signs off, and what it costs.",
    more: { href: "/faq#for-employers", label: "Questions about TruHu Workforce" },
    categories: [
      {
        title: "What Advisor Does",
        questions: [
          {
            q: "What is TruHu Advisor?",
            a: "TruHu Advisor builds a personalized benefits guide, microsite and flyer for every client in your book, from the plan documents you already have, plus a digital flipbook and narrated video of the guide, and a benefits chatbot that answers employees' questions from those same documents. Each one carries the client's own brand, and your team reviews it before it is published.",
          },
          {
            q: "What do I need to provide?",
            a: "The documents the carriers already gave you: SBCs, rate sheets, carrier plan documents and benefits guides. There is no AMS integration, carrier feed or ben-admin connection to set up.",
          },
          {
            q: "Can I build my whole book at once?",
            a: "Yes. You don't have to go one by one: upload a folder with all of your client information, and TruHu builds each client's materials from it.",
          },
          {
            q: "How does each client's branding work?",
            a: "TruHu goes to the client's website and pulls their logo, colors, fonts and imagery, then applies that theme to their guide, microsite and flyer. The build never waits on it, and you can adjust anything in the designer.",
          },
          {
            q: "Can employees read it in their own language?",
            a: "Yes. Guides and microsites translate into 100+ languages, using AI built to handle benefits and insurance terminology rather than word-for-word machine translation.",
          },
        ],
      },
      {
        title: "How the AI Works",
        questions: [
          {
            q: "Where does the AI get its facts?",
            a: "Only from the documents you upload for that client. Every page is read and classified, and plan figures are filled from those documents rather than written by the model. When employees ask the chatbot a question, the answer comes from that client's own plan facts.",
          },
          {
            q: "Who reviews it before a client sees it?",
            a: "Your team. You confirm the detected plans, their names and employee classes before the build, and every plan table is checked against that list. You can edit anything in the designer, and nothing goes to a client until you publish it.",
          },
          {
            q: "What happens at the next renewal?",
            a: "You start from this year, not a blank page. Confirmed plans match themselves the following year, and your edits and locked sections carry over through rebuilds, so a renewal is a review rather than a rebuild.",
          },
        ],
      },
      {
        title: "Why Brokers Use It",
        questions: [
          {
            q: "How does TruHu help me differentiate my agency?",
            a: "It lets you deliver the same branded benefits experience to every client, not just your largest accounts. That consistency across your book is a clear service differentiator and raises the standard for every client relationship.",
          },
          {
            q: "Does it replace our clients' enrollment platform?",
            a: "No. TruHu works alongside it. Employees get a mobile-friendly guide and microsite they can share with their family, then click through to the enrollment system to enroll.",
          },
          {
            q: "Do employees need an app or a login?",
            a: "No. Employees open the microsite from a link or the QR code on the flyer, on any phone. There is no app to download and no login.",
          },
          {
            q: "What does TruHu Advisor cost, and who pays?",
            a: "Under $300 per employer, per year, with volume discounts. The broker covers the cost, and most position it as a value-add their clients get through them: when the employer hears “this is included through your broker,” adoption happens naturally.",
          },
        ],
      },
      {
        title: "Data & Security",
        questions: [
          {
            q: "What happens to our clients' documents and data?",
            a: "TruHu is SOC 2 Type II compliant. Microsites use unique, non-indexed links that don't appear in search engines, and can be password-protected. Access rights are re-checked every 90 seconds, so someone you remove loses access mid-session. The security page has the full detail.",
          },
        ],
      },
    ] satisfies readonly FaqCategory[],
  },
  close: {
    titleLead: "Ready to give every client",
    titleAccent: "the premium experience?",
    lede: "See how TruHu Advisor works for your book, in a 30-minute walkthrough built around your client roster and rollout goals.",
    primaryCta: { href: "/demo", label: "Get Powered by TruHu" },
  },
} as const;

/* ------------------------------------------------------------- /workforce */

export const WORKFORCE_PAGE = {
  hero: {
    eyebrow: "TruHu Workforce",
    titleLead: "Easy communication for hard-to-reach employees.",
    titleAccent: "No login. No password.",
    lede: "TruHu Workforce helps HR and operations teams reach every employee, whether they're on the floor, in the field, remote, or behind a desk, through the channels they already use: text and email.",
    primaryCta: { href: "/demo", label: "Get started with TruHu" },
    note: "Just direct, frictionless communication that gets seen.",
  },
  /**
   * The network under the hero, on the hero's own surface: one hub, the groups
   * around it, and five scenarios it cycles through. Captions take their counts from the sample
   * roster in `WorkforceNetwork`, so a number can't drift from the picture:
   * {n} is the scenario's audience, {reached}, {ack} and {resent} are tallies.
   */
  network: {
    /** Not shown: the section has no visible heading, so these name it for
     *  screen readers (the region and the scenario list). */
    title: "How Workforce connects every shift, site and team",
    label: "Scenarios",
    /**
     * Each scenario is sent from the phone on the left: `to`, `via`, `when`
     * and `message` fill its compose screen, typed out as the scene starts.
     */
    scenarios: [
      {
        id: "safety",
        tab: "Safety alert",
        to: "Night crew",
        via: "Text",
        when: "Today, 9:45 PM",
        message: "The north loading dock is closed tonight. Use dock 2, and wear hi-vis in the yard.",
        caption: "Night crew only, scheduled for 9:45 PM, before third shift starts.",
      },
      {
        id: "enrollment",
        tab: "Open enrollment",
        to: "Everyone",
        via: "Text + email",
        when: "Now",
        message: "Open enrollment runs Nov 3–14. Your 2027 benefits guide is ready: sampleco.truhu.site",
        caption: "Everyone at once, by text and email. {clicked} of {n} clicked through to their guide.",
      },
      {
        id: "policy",
        tab: "Policy sign-off",
        to: "Warehouse",
        via: "Text",
        when: "Now",
        message: "Our forklift safety policy has been updated. Please read it and acknowledge by Friday.",
        caption: "{ack} of {n} acknowledged so far, each one timestamped.",
      },
      {
        id: "supervisor",
        tab: "Supervisor to team",
        to: "My team",
        via: "Text",
        when: "Now",
        message: "Route change today: I-94 is closed at exit 32. Take Route 12 instead.",
        caption: "Luis has partial admin access, so he can message his own team and no one else.",
      },
      {
        id: "followup",
        tab: "Automatic follow-up",
        to: "Haven't clicked",
        via: "Text",
        when: "24 hrs after the first send",
        message: "Reminder: open enrollment closes Friday. Your guide: sampleco.truhu.site",
        caption: "The follow-up goes only to the {resent} people who haven't clicked yet.",
      },
    ],
    legend: {
      delivered: "Delivered",
      clicked: "Clicked",
      ack: "Acknowledged",
    },
    /** The phone's own labels. */
    phone: {
      app: "Workforce",
      org: "Sample Company",
      compose: "New message",
      auto: "Automatic follow-up",
      from: "From",
      to: "To",
      via: "Via",
      when: "When",
      people: "people",
      send: "Send to",
      schedule: "Schedule for 9:45 PM",
      running: "Runs automatically",
      record: "Delivery record",
      sentNow: "Sent just now",
      live: "Updating live",
      list: "People",
      sending: "Sending",
      resending: "Resending",
      resent: "Resent",
    },
    pause: "Pause animation",
    play: "Play animation",
  },
  problem: {
    titleLead: "Unread isn't uninformed.",
    titleAccent: "It's exposure.",
    body: "TruHu Workforce helps organizations make sure important employee messages are actually seen and acknowledged. From policy updates and safety notices to benefits and enrollment reminders, the platform gives teams a simple way to deliver critical communication with visibility into who has read it and who still needs a follow-up.",
    cta: { href: "/how-it-works", label: "See how it works" },
    imageAlt: "A “Sharks — No Swimming” sign beside an oblivious swimmer",
  },
  categories: {
    titleLead: "Built for every kind of",
    titleAccent: "workforce message.",
    lede: "Hover any card to see how TruHu handles it.",
    items: [
      {
        num: "01",
        name: "Proof of Delivery",
        tagline: "Every message is trackable.",
        summary:
          "Real-time read receipts per employee who received, opened, and clicked. Built for compliance audits and HR records.",
        image: "proof-of-delivery",
      },
      {
        num: "02",
        name: "Automated Follow-Up",
        tagline: "Set it and forget it.",
        summary: "Unopened messages get re-sent automatically. No list-building, no chasing.",
        image: "automated-follow-up",
      },
      {
        num: "03",
        name: "Segment Your Workforce",
        tagline: "The right message to the right group.",
        summary:
          "Night crew, day shift, warehouse, corporate — send targeted messages without managing separate lists.",
        image: "segment-your-workforce",
      },
      {
        num: "04",
        name: "Shift-Aware Scheduling",
        tagline: "Send when they're actually reading.",
        summary:
          "First shift at 6am, third shift at 10pm. Schedule messages to arrive when your workers are available.",
        image: "shift-aware-scheduling",
      },
      {
        num: "05",
        name: "Instant Mass Send",
        tagline: "One send. Every employee.",
        summary:
          "Reach your entire workforce or a specific segment by text and email simultaneously. One action, done.",
        image: "instant-mass-send",
      },
      {
        num: "06",
        name: "Built for Frontline",
        tagline: "No app. No desk. No problem.",
        summary:
          "Hourly and shift workers get messages on their personal phones, on their schedule. Nothing to download.",
        image: "built-for-frontline",
      },
    ],
  },
  voices: {
    eyebrow: "What companies are saying",
    quotes: [
      {
        text: "I sent the handbook out through TruHu and did all acknowledgments through there. That was so nice that I didn't have to keep track — it did it for me. The owners who were like, 'what are we going to use that for?' are now like, 'hey, can you send this through TruHu?'",
        name: "Jenel H.",
        role: "HR/Office Manager · Construction",
      },
      {
        text: "We've been trying to improve communication with our workforce for a while, and this has been a big step forward.",
        name: "K. Fulton",
        role: "Benefit Analyst · Government & Defense",
      },
      {
        text: "We have been looking for this solution, literally last quarter. We've wasted time, essentially, because this solves everything.",
        name: "Julia M.",
        role: "Operations/HR · Manufacturing",
      },
    ],
  },
  /** The ROI band, carried over from truhu.ai's home page. The title is the
   *  live site's own heading for this block. */
  roi: {
    title: "Designed to improve utilization and overall return on investment.",
    body: "TruHu's AI Powered Platform helps customers increase benefits participation, improve communication reach across distributed workforces, and strengthen year-round engagement.",
    caption: "Customers report:",
    stats: [
      { value: 15, suffix: "%", label: "Higher engagement", note: "open enrollment" },
      {
        value: 75,
        suffix: "%",
        label: "Lower communications costs",
        note: "using one tool",
      },
      { value: 36, suffix: "%", label: "Higher view rates", note: "vs email alone" },
    ],
  },
  fit: {
    title: "Get your fit score.",
    lede: "See exactly how TruHu impacts your organization across Culture, Workforce, Compliance, and Systems to see where communication gaps are costing you the most.",
    cards: [
      {
        key: "workforce",
        name: "Workforce",
        question: "Are communication gaps leaving parts of your workforce in the dark?",
      },
      {
        key: "systems",
        name: "Systems",
        question:
          "Do employees get the information they need, or do they rely on managers to relay it?",
      },
      {
        key: "compliance",
        name: "Compliance",
        question: "Can you prove every employee saw every critical update?",
      },
      {
        key: "culture",
        name: "Culture",
        question: "Is leadership's commitment to communication visible at every level?",
      },
    ],
    notes: [
      "Takes 2 minutes. No login required.",
      "You'll get a personalized breakdown by category the moment you finish.",
    ],
    cta: { href: "https://fittest.truhu.com/", label: "Take the TruHu Fit Test" },
    caption: "Free assessment · Instant results · No commitment",
  },
  faq: {
    title: "Frequently Asked Questions",
    lede: "Everything employers need to know about TruHu Workforce, from platform capabilities to compliance, results, and more.",
    categories: [
      {
        title: "A Central Hub for Your Employees",
        questions: [
          {
            q: "What is TruHu Workforce?",
            a: "TruHu Workforce is a communication platform that gives employees one easy place to find benefits, company resources, policies, and updates — all accessible from their phone with no app or login required. Text and email campaigns ensure employees see and engage with important information.",
          },
          {
            q: "How much does TruHu cost?",
            a: "Many employers receive TruHu at a discount through their benefits broker. If you're working with us directly, pricing is based on your workforce size and needs, and we'll walk you through options.",
          },
          {
            q: "Do we need IT to get started?",
            a: "No IT integration required. There's no software to install. TruHu is browser-based and works on any device. We do walk you through a guided setup process — it's hands-on, but we're with you every step of the way.",
          },
        ],
      },
      {
        title: "Compliance & Security",
        questions: [
          {
            q: "Is TruHu SOC 2 compliant?",
            a: "Yes. TruHu operates under SOC 2 protocols, which means your data — and your employees' data — is protected by rigorous, independently validated security controls. This isn't just a checkbox for us; it's the foundation of how we build and operate the platform. If you'd like details on what our compliance covers, we're happy to walk you through it.",
          },
          {
            q: "How does TruHu handle employee consent for text messaging?",
            a: "TruHu makes it easy to handle consent the right way for your workforce. We support both explicit opt-in and compliant implied consent approaches. Employers can choose the method that fits their policies, with templates and guidance provided. Messages are sent by the employer, not TruHu, which is an important distinction for compliance.",
          },
          {
            q: "How is employee data protected?",
            a: "Sites use unique, non-indexed URLs that don't appear in search engines. Employee data is handled under SOC 2 protocols. For confidential documents, TruHu's acknowledgment tracking creates a compliance-grade audit trail that records exactly who accessed what, and when — giving HR and brokers the documentation they need without any manual tracking. For organizations handling proprietary or restricted content, TruHu also supports password-gated access — an additional authentication layer that controls who can view a document or page, independent of how the link was shared.",
          },
        ],
      },
      {
        title: "Tracking & Reporting",
        questions: [
          {
            q: "How do I know if employees read what I send?",
            a: "TruHu shows you exactly who opened each message, who clicked, and who didn't — in real time. You can then resend only to the people who haven't read it, instead of sending to everyone again. When we interviewed employers across five industries, every single one ranked this tracking capability as their most important feature.",
          },
          {
            q: "Can I get proof that employees acknowledged a policy or training?",
            a: "Yes. Acknowledgment tasks are sent via text. The employee reviews the content and provides a digital attestation. You get a timestamped audit trail showing who acknowledged, when, and from where — usable for OSHA audits, unemployment hearings, and compliance reviews.",
          },
          {
            q: "We've had situations where we couldn't prove employees were informed of a policy. Can TruHu help?",
            a: "Yes — that's one of the most common reasons employers adopt TruHu. Lost unemployment hearings cost $3,000–$10,000 per case. OSHA fines for inadequate training documentation range from $16,000 to $161,000 per violation. TruHu creates a clear, timestamped audit trail for every communication and acknowledgment. This documentation can be used for compliance reviews, audits, and unemployment claims, helping reduce risk and avoid costly disputes.",
          },
        ],
      },
      {
        title: "Reaching Your Workforce",
        questions: [
          {
            q: "Most of our workforce does not have company email. How does TruHu reach them?",
            a: "Messages are delivered by text directly to employees, with no login or password required. For best results, text and email can be used together when both are available.",
          },
          {
            q: "We already use our HRIS for messaging. Why would we need TruHu?",
            a: "Most HRIS platforms have a messaging feature that requires employees to log into the system. For deskless and field workers who rarely access the platform, those messages go unseen. In fact, many employers we work with have tried their HRIS messaging and found that employees simply weren't checking it. TruHu sends messages directly to their phone, providing a channel that matches how their workforce truly communicates.",
          },
          {
            q: "Can I send messages to specific employee groups?",
            a: "Yes. TruHu lets you segment employees by location, role, department, or custom fields, so you can send targeted messages to the right groups. This helps ensure communication is relevant and avoids sending unnecessary messages to your entire workforce.",
          },
          {
            q: "What about employees who speak different languages?",
            a: "TruHu translates into 100+ languages — almost any language you choose. This is context-aware AI translation that handles insurance and HR terminology accurately, not a word-for-word machine translation. Each employee receives content in their preferred language automatically.",
          },
        ],
      },
      {
        title: "Employee Experience",
        questions: [
          {
            q: "What do employers actually put on TruHu?",
            a: "Employers put benefits information, company policies, safety documents, employee handbooks, payroll links, training materials, news and announcements, emergency contacts, and onboarding resources on the platform. It's accessible from a single link or a QR code posted in a break room or on a badge. Employees don't need to remember a URL or log into anything.",
          },
          {
            q: "How do employees access TruHu?",
            a: "Employees access TruHu through a simple link or QR code, with no app to download and no login or password required. They can also save the link to their phone for quick access anytime.",
          },
          {
            q: "Can employees share this with their spouse or family?",
            a: "Yes. Because there's no login, a spouse can review benefits options, plan details, and company resources on their own phone. Benefits decisions are household decisions — TruHu makes it easy for the whole family to be informed.",
          },
          {
            q: "Can managers send messages to their own teams?",
            a: "Yes. You can grant partial admin access to supervisors, foremen, or location managers. They get pre-built templates and the ability to message their specific team — but can't accidentally message the whole company. Companies that add a second and third sender from operations or management see significantly higher engagement than those where only HR sends.",
          },
        ],
      },
      {
        title: "Year-Round Communication",
        questions: [
          {
            q: "Is TruHu only useful during open enrollment?",
            a: "No. Open enrollment is where many employers start, but the companies getting the most value use TruHu year-round: onboarding, policy updates, safety training, employee surveys, company announcements, and emergency alerts. The employers who stay and expand are the ones who discover the operational value beyond enrollment.",
          },
          {
            q: "Can we use TruHu for safety and OSHA compliance?",
            a: "Yes. This is one of our strongest use cases, especially in construction, manufacturing, and field services. Send safety content via text, collect digital acknowledgments with timestamps, and maintain audit-ready records. If OSHA inspects, you have timestamped proof of every communication.",
          },
          {
            q: "Can we send emergency communications?",
            a: "Yes. TruHu allows you to send urgent and time-sensitive communications to your workforce by text and email. Pre-built templates and role-based access help ensure timely updates can be sent by the appropriate team members when needed.",
          },
        ],
      },
      {
        title: "Getting Started",
        questions: [
          {
            q: "What does getting started look like?",
            a: "TruHu offers a guided onboarding process, typically completed in about an hour. We help you set up your account, upload your employee roster, and build your first page with key content. By the end of the session, you'll have a branded employee hub in place and will have sent your first message.",
          },
          {
            q: "How much time does it take to manage TruHu?",
            a: "Most employers spend minimal time managing TruHu. Once your initial setup is complete, you can send messages and update content as needed, with templates and support to keep it quick and easy.",
          },
          {
            q: "What do we need to provide?",
            a: "To get started, you'll need your employee roster (name, email, and phone), your company logo, and any documents or resources you want to share. We guide you through everything, and you can always add more over time.",
          },
          {
            q: "How do we introduce TruHu to employees?",
            a: "We provide simple rollout guidance, including messaging templates and best practices, to help you introduce TruHu clearly and drive adoption from day one.",
          },
          {
            q: "What if we want to start small?",
            a: "That's how most employers start. Pick one immediate need — a policy acknowledgment that's overdue, a benefits update, a message to new hires — and we'll get it live within the first week. You'll see the tracking data from that first send. Many of our most active clients started with a single use case and expanded once they saw it work.",
          },
        ],
      },
    ] satisfies readonly FaqCategory[],
  },
  close: {
    titleLead: "It starts with one call,",
    titleAccent: "one Truly Human call.",
    lede: "See how TruHu Workforce works for your team. A 30-minute walkthrough built around your workforce size, shift structure, and communication needs.",
    primaryCta: { href: "/demo", label: "Start reaching your employees" },
  },
} as const;

/* -------------------------------------------------------------------- /faq */

/**
 * Page chrome for the FAQ. The questions themselves stay on
 * `ADVISOR_PAGE.faq` and `WORKFORCE_PAGE.faq`, next to the products they
 * describe — only the rendering moved off those pages, where the accordions ran
 * to a screen and a half apiece.
 */
export const FAQ_PAGE = {
  hero: {
    eyebrow: "Questions",
    titleLead: "Everything brokers and employers ask",
    titleAccent: "before the first call.",
    lede: "Both products, answered in full: what the platform does, who builds it, how consent and compliance work, and what results to expect.",
  },
  jumpLabel: "Jump to",
  groups: {
    advisor: { title: "For brokers" },
    workforce: { title: "For employers" },
  },
  /** The one-line pointer that stands in for the FAQ on /workforce. /advisor
   *  carries its own questions instead. */
  pointer: {
    workforce:
      "Questions about consent, tracking, or what getting started actually takes?",
    label: "Read the FAQ",
  },
  close: {
    titleLead: "Still have a question?",
    titleAccent: "Ask it on the call.",
    lede: "Bring the plan documents for a group you are renewing. We will answer it against your own client.",
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

/* ---------------------------------------- /for-brokerages (archived page) */

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
    title: "Employers already told you the gap.",
    body: "96% of C-suite respondents want their broker to help develop risk-management strategy; 58% say their broker fully delivers. 94% call multiyear strategic benefit planning important; 51% say they get it. What closes that gap is hours, and hours are what production work takes.",
    source: "Zywave Broker Services Survey, 2026 · 1,400 US employers",
  },
  hours: {
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

/**
 * Written for whoever signs off on the vendor: IT, legal, a brokerage's
 * compliance team. The order follows the /security spec in the website
 * blueprint (§7.1), and every line restates a public source, so the page never
 * outruns what TruHu has already committed to in writing:
 *   - truhu.ai privacy policy (effective May 26, 2026) and terms of use
 *   - the truhu.ai help center and the Advisor and Workforce FAQs
 *   - Ensemble's platform guide, §9–10 (ensembleui.com/platform)
 *   - the production controls this page listed before (sessions, section
 *     scoping, one employee table, versioned compliance language)
 *
 * HIPAA is stated as a boundary, not a claim: the terms of use say the service
 * is not tailored to HIPAA. Ensemble's HIPAA and GDPR badges describe Ensemble,
 * not TruHu, so they are not repeated here.
 */

/** The attestations, shared by the hero panel and the compliance section. */
const SECURITY_CERTS = [
  {
    owner: "TruHu",
    name: "SOC 2 Type II",
    scope: "AICPA · Security and availability",
    body: "Our controls are tested by an independent auditor over a period of time, not only on the day of the audit.",
  },
  {
    owner: "Ensemble platform",
    name: "SOC 2 Type II",
    scope: "Security, availability and confidentiality",
    body: "Every TruHu AI feature runs on Ensemble, the enterprise agent platform, which holds its own attestation.",
  },
  {
    owner: "Ensemble platform",
    name: "ISO 27001",
    scope: "Information security management",
    body: "The international standard for how an organization manages information security risk, certified for the platform.",
  },
] as const;

export const SECURITY_PAGE = {
  hero: {
    eyebrow: "Security",
    titleLead: "Built for a brokerage's",
    titleAccent: "security review.",
    lede: "TruHu handles your clients' plan documents and their employees' contact details. Here is how that data is protected, where it lives, and exactly what the AI does with it, for the team that has to sign off.",
    primaryCta: { href: "/demo", label: "Book a demo" },
    secondaryCta: { href: "#security-faq", label: "Security FAQ" },
  },
  /** The hero's right-hand panel: the audits, then the four lines a reviewer
   *  looks for first. */
  glance: {
    eyebrow: "Independently audited",
    title: "SOC 2 Type II compliant",
    certs: SECURITY_CERTS,
    commitments: [
      "We never sell your data or use it for advertising",
      "AI providers never train on your data",
      "Nothing reaches employees until your team publishes",
      "Employee pages stay out of search engines",
    ],
  },
  protection: {
    title: "Protected at every layer.",
    lede: "Controls running in production today, from the infrastructure up to the link an employee opens.",
    items: [
      {
        key: "encryption",
        name: "Encryption",
        body: "Personal information is encrypted in transit and, where technically feasible, at rest, on secure servers in the United States.",
      },
      {
        key: "isolation",
        name: "Tenant isolation",
        body: "Each organization's documents, conversations and tool data are isolated from every other's. No cross-tenant access, by architecture.",
      },
      {
        key: "secrets",
        name: "Secrets stay server-side",
        body: "Credentials are encrypted at rest and managed on the server. They never reach the browser or the AI model.",
      },
      {
        key: "sessions",
        name: "Session security",
        body: "Sessions are server-side and opaque, secrets are hashed, and sessions idle out after 60 minutes. Access is re-checked against live membership every 90 seconds, so someone you remove loses access mid-session.",
      },
      {
        key: "private",
        name: "Private by default",
        body: "Benefit sites and Pages use unique, non-indexed links that never appear in search results, whether shared as a link, a QR code or an embed.",
      },
      {
        key: "gated",
        name: "Password and MFA gating",
        body: "Confidential Pages can be password-protected, with MFA required on top: a check on who sees the page, whoever the link was forwarded to.",
      },
    ],
  },
  /** The blueprint calls this the differentiator: the question a compliance
   *  officer asks first, answered in public. */
  ai: {
    titleLead: "What happens to a",
    titleAccent: "client's plan documents.",
    lede: "The AI reads, sorts and drafts. Your team decides what ships. Here is the whole path, from upload to the record it leaves behind.",
    steps: [
      {
        key: "upload",
        name: "Upload",
        body: "Documents go into your organization's own isolated workspace, encrypted and never shared across tenants.",
      },
      {
        key: "read",
        name: "Read",
        body: "AI providers process them under zero data retention and are contractually barred from training on them.",
      },
      {
        key: "build",
        name: "Build",
        body: "Plan figures are filled from the source documents by rules, never by the model. Only the prose is generated.",
      },
      {
        key: "review",
        name: "Review",
        body: "Your team confirms the plans, edits anything and publishes. Nothing reaches a client until they do.",
      },
      {
        key: "record",
        name: "Record",
        body: "Every step is traced and every change versioned, so any output can be explained and any version restored.",
      },
    ],
    commitments: [
      {
        key: "training",
        name: "No training on your data",
        body: "Our AI providers are contractually prohibited from using your data to train their models.",
      },
      {
        key: "retention",
        name: "Zero data retention",
        body: "AI providers are configured to keep nothing once a request is processed.",
      },
      {
        key: "locked",
        name: "Locked content stays locked",
        body: "Locked pages are protected from AI edits and survive a rebuild. Compliance language is managed centrally, effective-dated and tracked.",
      },
      {
        key: "monitored",
        name: "Watched in production",
        body: "Monitoring agents check live conversations for data leakage, PII exposure and claims the documents do not support.",
      },
    ],
  },
  access: {
    title: "Least privilege, by default.",
    lede: "Everyone sees what their role needs and nothing more, and access ends the moment someone is removed.",
    products: [
      {
        product: "TruHu Advisor",
        audience: "Inside the brokerage",
        roles: [
          {
            role: "Admin",
            body: "Manages teammates, roles and account configuration, and builds guides and sites.",
          },
          {
            role: "User",
            body: "Builds and edits guides and sites. Cannot manage teammates or configuration.",
          },
        ],
        note: "Teammates sign in with Google, Microsoft or a password. Admins invite, reset and remove users from one screen.",
      },
      {
        product: "TruHu Workforce",
        audience: "Inside the employer",
        roles: [
          {
            role: "Administrator",
            body: "Manages employees, Pages, messages and company settings.",
          },
          {
            role: "Partial admin",
            body: "Scoped to the sections they are assigned. A location manager can message their own team, not the whole company.",
          },
          {
            role: "Employee",
            body: "Sees what was sent to them. Can request a change to their own contact details, which an admin approves.",
          },
        ],
        note: "Every company's messages come from one recognizable number, and texts go only to the employer's own workforce.",
      },
    ],
    controls: [
      {
        key: "offboarding",
        name: "Offboarding without data loss",
        body: "Mark a departing employee Inactive: their access ends, and their acknowledgments and survey responses stay on record.",
      },
      {
        key: "audit",
        name: "Audit trails",
        body: "Delivery, opens, clicks and acknowledgments are timestamped per employee, and admins can review activity logs for the account.",
      },
      {
        key: "versions",
        name: "Version history",
        body: "The builder auto-saves and keeps a full version history, so any change can be traced and undone.",
      },
      {
        key: "record",
        name: "One employee record",
        body: "Advisor and Workforce read the same employee table rather than keeping two copies of an employer's roster.",
      },
    ],
  },
  privacy: {
    title: "What we collect, and what we never do with it.",
    lede: "The short version of our privacy policy, for the data a broker or employer brings to TruHu.",
    contact: {
      label: "Privacy and data requests",
      email: "support@truhu.com",
    },
    rows: [
      {
        name: "What we collect",
        body: "Names, email addresses and mobile numbers provided by the employer, account logins and preferences, and the activity logs behind delivery records and audits.",
      },
      {
        name: "Where it lives",
        body: "On secure servers in the United States, with regular routine backups.",
      },
      {
        name: "What we never do",
        body: "Sell personal information, use it for advertising, or share it for cross-context behavioral advertising. The platform sets only essential cookies, and we use no advertising or marketing cookies anywhere.",
      },
      {
        name: "Sub-processors",
        body: "A short list: cloud hosting, our database provider, email delivery and AI providers. Each processes data only to provide its service to us. The current list is available on request.",
      },
      {
        name: "Retention and deletion",
        body: "Data is kept only as long as it is needed, then deleted or de-identified. Requests to access, correct or delete data are answered within 30 days.",
      },
      {
        name: "Employee choices",
        body: "Employees can reply STOP to any text to opt out, and START to rejoin. Messages are service communications only, never marketing.",
      },
    ],
  },
  compliance: {
    title: "Independently audited, stated precisely.",
    lede: "What each audit covers, and exactly which regulations apply to TruHu.",
    certs: SECURITY_CERTS,
    report: { href: "/demo", label: "Request the SOC 2 report" },
    postureTitle: "Where the lines are",
    posture: [
      {
        name: "HIPAA",
        body: "TruHu is not designed to hold protected health information. Advisor is built from plan documents and Workforce from employee contact details, not claims or medical records, so PHI stays out of uploads and messages.",
      },
      {
        name: "TCPA and CAN-SPAM",
        body: "Texts are sent on the employer's behalf, to its own workforce, and never for marketing. TruHu supports explicit opt-in and compliant implied consent, with templates and guidance.",
      },
      {
        name: "CCPA",
        body: "California residents, including employees whose data we process for an employer, can know, correct, delete and port their data. We do not sell or share it for advertising.",
      },
    ],
  },
  faq: {
    title: "Security questions, answered.",
    lede: "The questions that come up in every vendor review. Anything not covered here, bring to the first call.",
    more: { label: "Report a security concern", email: "support@truhu.com" },
    categories: [
      {
        title: "Your data and the AI",
        questions: [
          {
            q: "Is TruHu SOC 2 compliant? Can we see the report?",
            a: "Yes. TruHu is SOC 2 Type II compliant, audited against the AICPA's security and availability criteria, and the Ensemble platform our AI runs on holds SOC 2 Type II and ISO 27001. Ask for the report when you book a call and we will walk your team through what it covers.",
          },
          {
            q: "Does our data train AI models?",
            a: "No. The AI providers we use are contractually prohibited from using your data to train their models, and they are configured for zero data retention.",
          },
          {
            q: "Where is our data stored?",
            a: "On secure servers in the United States. Personal information is encrypted in transit and, where technically feasible, at rest, and each organization's data is isolated from every other's.",
          },
          {
            q: "Can the AI change the plan numbers?",
            a: "No. Plan figures are filled from the source documents by rules, not generated by the model, and every plan table is checked against the plans your team confirms. Locked pages are protected from AI edits altogether.",
          },
          {
            q: "Is TruHu HIPAA compliant?",
            a: "No. TruHu is not designed to hold protected health information. Advisor works from plan documents and Workforce from employee contact details, not claims or medical records, so PHI should stay out of uploads and messages.",
          },
        ],
      },
      {
        title: "Access and employees",
        questions: [
          {
            q: "Are employee benefit sites public or searchable?",
            a: "No. Sites and Pages use unique, non-indexed links that do not appear in search engines. For confidential content, add a password or require MFA.",
          },
          {
            q: "What happens when someone leaves?",
            a: "Remove a teammate and their access ends mid-session, because rights are re-checked every 90 seconds. Mark a departing employee Inactive or Terminated rather than deleting them: their access ends, their acknowledgments and records are kept, and you can still send a one-off COBRA or offboarding message.",
          },
          {
            q: "How is consent for text messaging handled?",
            a: "Employers choose explicit opt-in or a compliant implied-consent approach, with templates and guidance from us. Messages are sent by the employer, not TruHu, which is an important distinction for compliance, and every employee can reply STOP to opt out.",
          },
          {
            q: "How do we request, correct or delete data?",
            a: "Email support@truhu.com. We answer requests to access, correct or delete personal information within 30 days.",
          },
        ],
      },
    ] satisfies readonly FaqCategory[],
  },
  close: {
    titleLead: "Bring the questionnaire",
    titleAccent: "to the first call.",
    lede: "Send your security questionnaire ahead of time. The first call is with someone who can answer it, SOC 2 report included.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* ------------------------------------------------------------- /technology */

/** Who does a workflow step, in Ensemble's terms: an agentic step, a
 *  deterministic step, or a human approval. */
export type TechRole = "ai" | "rules" | "you";

/**
 * The platform page. TruHu runs on the Ensemble agent platform; the lifecycle,
 * architecture and security copy is condensed from Ensemble's platform guide
 * (ensembleui.com/platform), and the pipeline restates /how-it-works.
 */
export const TECH_PAGE = {
  hero: {
    eyebrow: "Technology",
    titleLead: "Cutting-edge AI,",
    titleAccent: "built on the Ensemble platform.",
    lede: "Ensemble is our agentic platform, and every TruHu product is built on it. We own the whole stack, from the models to the testing, security and integrations around them, so every workflow we build makes the next one faster and better.",
    badges: ["Agent platform: Ensemble", "SOC\u00a02 Type\u00a0II", "ISO 27001"],
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
  /** The hero animation: one question walked through the platform's layers. */
  flow: {
    question: "Does my dental plan cover a night guard?",
    answer: "Yes. Custom night guards are covered at 50% after your deductible.",
    source: "Dental plan summary",
    steps: [
      { layer: "channels", caption: "An employee texts a question." },
      { layer: "agents", caption: "A supervisor agent routes it to the right specialist." },
      { layer: "context", caption: "The agent searches that client's plan documents." },
      { layer: "rules", caption: "Rules check anything that has to be exact." },
      { layer: "security", caption: "It all runs inside that client's own tenant." },
      { layer: "observe", caption: "The answer goes back, and every step is traced." },
    ],
  },
  roles: {
    ai: { label: "AI", blurb: "Agentic steps: read, interpret, draft." },
    rules: { label: "Rules", blurb: "Deterministic steps: exact and auditable." },
    you: { label: "You", blurb: "Human approval on every judgment call." },
  } satisfies Record<TechRole, { label: string; blurb: string }>,
  pipeline: {
    title: "AI where it helps. Rules where it has to be right.",
    lede: "Pure rule-based automation breaks on exceptions; pure LLM is unpredictable for compliance steps. Ensemble workflows mix both, and put a person wherever the call is yours.",
    caption: "How an Advisor guide runs through it",
    stages: [
      {
        name: "Read",
        roles: ["ai", "rules"],
        summary: "Documents in, facts out.",
        facts: [
          "Every page is read and classified on upload",
          "Last year's guide is recognized and left out",
        ],
      },
      {
        name: "Check",
        roles: ["you", "rules"],
        summary: "Nothing builds on a guess.",
        facts: [
          "You confirm the plans, their names and classes",
          "Every plan table is checked against your list",
        ],
      },
      {
        name: "Build",
        roles: ["rules", "ai"],
        summary: "Figures by rules, prose by AI.",
        facts: [
          "Plan figures are filled from the source, never the model",
          "Only the prose that has to sound human is generated",
        ],
      },
      {
        name: "Ship",
        roles: ["you"],
        summary: "Your team publishes.",
        facts: [
          "Publish the microsite, the PDF or a link",
          "Edits carry over, and next year starts here",
        ],
      },
    ] satisfies readonly {
      name: string;
      roles: readonly TechRole[];
      summary: string;
      facts: readonly string[];
    }[],
  },
  lifecycle: {
    title: "Built to keep getting better.",
    lede: "An agent that works in a demo is not the same as one that works reliably in production. Ensemble gives us the whole lifecycle out of the box, so every change is tested, versioned and shipped without us building the plumbing.",
    steps: [
      { name: "Build", body: "Prompt, model, tools and knowledge bases, configured in one place." },
      { name: "Test", body: "Evaluations across real scenarios, not just happy paths." },
      { name: "Deploy", body: "Promoted from dev to staging to production as a published version." },
      { name: "Monitor", body: "Monitoring agents watch live conversations for quality, PII and policy." },
      { name: "Improve", body: "Feedback and failure patterns shape the next version." },
    ],
    loop: "Continuous improvement loop",
    note: "Every published version is an immutable snapshot, so any change can be rolled back instantly.",
  },
  /**
   * Why a platform, told as a factory: condensed from the internal "platform
   * as a factory" deck, one chapter per slide, turned toward what it means
   * for partners.
   */
  factory: {
    title: "We built the factory once. What you need next goes into production faster.",
    chapters: [
      {
        key: "factory",
        tab: "The factory",
        title: "The platform is the factory.",
        body: "Each workflow is an assembly line inside it: a fixed run of stages, each staffed by an AI worker with the tools for its job. Every line shares the factory's plumbing, architecture and compliance, so a new one starts mostly built and reaches you sooner.",
        points: [
          { name: "Factory = platform", body: "Built once, shared by every line." },
          { name: "Assembly line = workflow", body: "A fixed run of stages that works the same way every time." },
          { name: "Worker = LLM", body: "Judgment at one stage, with only the tools that stage needs." },
        ],
        caption: "The conveyor is fixed: guardrails move every packet from stage to stage.",
      },
      {
        key: "stage",
        tab: "Inside a stage",
        title: "Each stage does one small, clear job.",
        body: "The worker is handed a packet of unfinished work, context on how it behaves and tools built to act on it. It does its part, then sends the packet down the line. Small jobs are easy to get right, which keeps results dependable for your clients.",
        points: [
          { name: "One job", body: "The worker makes the call; the line decides what happens next." },
          { name: "A sealed workspace", body: "Nothing a worker does can reach past its own stage." },
          { name: "Only what it needs", body: "The inputs and tools for this job. Nothing else." },
          { name: "The right-sized worker", body: "Quick checks get fast models; hard calls get the most capable." },
        ],
      },
      {
        key: "lines",
        tab: "New lines",
        title: "The same factory runs new lines.",
        body: "A new product doesn't need a new factory. The conveyor is never rebuilt, and one new stage is far less work than a new line, so what you ask for next reaches you sooner. As the platform matures, it opens up to your customizations and partner-built applications.",
        points: [
          { name: "Reorder the stages", body: "Reuse what's built, in whatever order the new job needs." },
          { name: "Re-staff the workers", body: "Give each stage the worker the new job calls for." },
          { name: "Build only what's missing", body: "One new stage, not a whole new line." },
        ],
        caption: "Matching tags are the same stages, reused and reordered. Only Violet was built new.",
      },
    ],
  },
  security: {
    title: "Enterprise controls at every layer.",
    items: [
      {
        name: "Tenant isolation",
        body: "Conversations, documents and tool data are isolated per organization. No cross-tenant access, by architecture.",
      },
      {
        name: "Secrets stay server-side",
        body: "Credentials are encrypted at rest and never reach the browser or the model.",
      },
      {
        name: "Access control and audit trails",
        body: "Role-based access, and a log of every interaction, tool call and configuration change.",
      },
      {
        name: "Your team signs off",
        body: "Nothing reaches a client until someone on your team publishes it.",
      },
    ],
    certs: [
      { owner: "TruHu", names: "SOC\u00a02 Type\u00a0II" },
      { owner: "Ensemble platform", names: "SOC\u00a02 Type\u00a0II · ISO 27001" },
    ],
    cta: { href: "/security", label: "Read the security overview" },
  },
  close: {
    titleLead: "See it run on",
    titleAccent: "a real group.",
    lede: "Bring the plan documents for a client you are renewing.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* ------------------------------------------------------------------ /about */

/**
 * Mission, vision and beliefs as agreed at the offsite.
 * Short on purpose for now: the team, the story and where we are come in a
 * later pass.
 */
export const ABOUT_PAGE = {
  /** The vision is the headline; the accent half carries the gradient. */
  hero: {
    eyebrow: "Our vision",
    titleLead: "A future where every client gets service that is",
    titleAccent: "even better than the best today.",
  },
  mission: {
    label: "Our mission",
    body: "We build enterprise-grade AI solutions that bring efficiency and increased profitability to top benefit brokers by automating their most time-consuming and valuable workflows.",
  },
  beliefs: {
    title: "What we believe",
    items: [
      {
        name: "Enterprise-grade",
        body: "We build for security and safety first, because that is what trusting AI takes.",
      },
      {
        name: "The broker grows with us",
        body: "We focus on brokers: interested in their workflows, bringing them into the future, and ensuring their success.",
      },
      {
        name: "One pain at a time",
        body: "We focus deeply on one pain at a time to save our partners money and time.",
      },
    ],
  },
  /** Partly placeholder: the page draws an empty frame for any slot, photo or
   * bio not filled in yet. */
  team: {
    title: "The people behind TruHu.",
    lede: "[Placeholder] A line on who we are and what we bring from benefits, brokerage and AI.",
    slots: 4,
    people: [
      { name: "Pete", role: "CEO" },
      { name: "Khurram", role: "CTO" },
    ],
  },
  close: {
    titleLead: "Talk to a",
    titleAccent: "Truly Human team.",
    lede: "Tell us about your book or your workforce. The first call is with people who can answer your questions.",
    primaryCta: { href: "/demo", label: "Book a demo" },
  },
} as const;

/* ---------------------------------------------------------------- /pricing */

export const PRICING_PAGE = {
  title: "Priced per client, for the whole book.",
  lede: "Pricing depends on the size of your book and which products you run. Tell us how many employer groups you serve and we will put a number in front of you.",
  caption:
    "The conversation is about delivery to hard-to-reach employees and reuse across the renewal cycle — not the cost of content.",
} as const;

/* ------------------------------------------------------------------- /demo */

export const DEMO_PAGE = {
  title: "Bring a group you are renewing.",
  lede: "Send the plan documents for one client before the call. We will build the guide live.",
  facts: [
    "No AMS or ben-admin integration required to start",
    "Works on the clients who just changed carriers",
    "One client's documents is enough to see it",
  ],
} as const;

/* ------------------------------------------------------------ /get-started */

/**
 * The booking page campaigns point at: who you will meet, what you get, proof
 * beside the calendar, the calendar itself, then the confirmation.
 *
 * Bryan's title, VP, Strategic Accounts, is confirmed. His background line
 * comes from public sources (the ThinkHR announcement); check it with him.
 *
 * PLACEHOLDER PROOF. The testimonial and both statistics are stand-ins so the
 * layout can be judged. None is attributable yet, and by the rule at the top
 * of this file none can ship as it is: replace each with a real, sourced
 * figure, and get the client's written OK for the quote, the name and any
 * logo before it goes live.
 */
export const GET_STARTED_PAGE = {
  meta: {
    title: "Get started",
    description:
      "Book 10 minutes with Bryan Kleppe. See a finished enrollment guide, benefits microsite and AI Counselor built for a client like yours, live on screen.",
  },
  hero: {
    eyebrow: "10-minute live demo",
    titleLead: "See it built for",
    titleAccent: "a client like yours.",
    lede: "Ten minutes on screen with someone who has spent his career on the broker's side of the table. Pick a time and have one client in mind.",
  },
  host: {
    label: "Who you'll meet",
    name: "Bryan Kleppe",
    role: "VP, Strategic Accounts",
    line: "I help brokers give every client the experience they give their top 10.",
    credential:
      "Ran customer success for ThinkHR's broker partners before joining TruHu.",
    /** PLACEHOLDER image. Swap for Bryan's square headshot in public/, e.g.
     * "/images/team/bryan-kleppe.webp". Set to null to show his initials. */
    photo: "/images/placeholders/headshot.svg" as string | null,
  },
  outcomes: {
    label: "What you'll get out of it",
    items: [
      "A finished guide, microsite and AI Counselor for a client like yours, built while you watch.",
      "A clear read on how fast your team could roll it out across your book.",
      "A sample to keep and show a client.",
    ],
    format: ["10 minutes", "Live", "On screen"],
    notIt: "Not a hard sales pitch. If it isn't a fit, I'll tell you.",
  },
  proof: {
    label: "From a broker on TruHu",
    quote:
      "We put all 140 of our groups on TruHu in one renewal. Every client got the guide we used to save for our top ten, and the team wrapped open enrollment three weeks early.",
    accent: "wrapped open enrollment three weeks early.",
    name: "Megan R.",
    role: "Senior Account Executive",
    agency: "Midwest brokerage, 140 employer groups",
    photo: null as string | null,
    result: "140 groups live in one renewal",
    stats: [
      { value: "75%", label: "lower cost per client guide" },
      { value: "2×", label: "faster open-enrollment timeline" },
    ],
    statsSource: "TruHu broker cohort, 2026 renewal season",
  },
  booking: {
    title: "Pick a time",
    rescheduleTitle: "Pick a new time",
    meta: ["10 min", "Video call", "with Bryan"],
    zoneLabel: "Times shown in",
    noTimes: "No open times left this month.",
    nextMonth: "See next month",
    loadError: "Times didn't load.",
    retry: "Try again",
    form: {
      title: "Your details",
      change: "Change",
      name: "Name",
      email: "Work email",
      agency: "Agency",
      clients: "Roughly how many clients do you serve?",
      clientsPlaceholder: "Choose a range",
      clientBands: ["Under 25", "25–100", "100–250", "250–500", "500+"],
      submit: "Confirm booking",
      submitMove: "Move my meeting",
      pending: "Booking…",
      fine: "The meeting details go to this address. Nothing else does.",
    },
    slotTaken: "That time was just taken. Here are the latest openings.",
    /** Shown if the scheduler can't be reached (or isn't connected yet). */
    offline: {
      title: "Request a time with Bryan",
      body: "Tell us a little about your book and Bryan will reply with times within one business day.",
      cta: { href: "/demo", label: "Request a time" },
    },
    /** Development only; visitors never see it. */
    placeholderNotice:
      "Placeholder scheduler: bookings are saved and block the slot, but nothing is sent to a calendar.",
  },
  agenda: {
    title: "How the 10 minutes go",
    steps: [
      {
        time: "0:00",
        title: "Your book",
        body: "Two minutes on who you serve and the client you have in mind.",
      },
      {
        time: "2:00",
        title: "Built live",
        body: "Their enrollment guide, benefits microsite and AI Counselor, built on screen from plan documents.",
      },
      {
        time: "8:00",
        title: "Your rollout",
        body: "What it takes to run the same thing across your whole book, and how long it takes.",
      },
    ],
  },
  confirmed: {
    meta: { title: "You're booked" },
    title: "You're booked",
    movedTitle: "You're rescheduled",
    cancelledTitle: "Meeting cancelled",
    /** When a calendar invite has been emailed. */
    inviteTo: "A calendar invite is on its way to",
    updatedInviteTo: "An updated invite is on its way to",
    /** Added while there's no video link yet. */
    linkToFollow: "Bryan will send the Zoom link before the call.",
    /** When no email could be sent (email not set up). */
    heldFor: "Your time is held. Bryan will send the video link to",
    heldTail: "before the call. Add it to your calendar below in the meantime.",
    cancelledLede: "Your spot is released. If another time works better, pick one below.",
    rebook: { href: "/get-started#calendar", label: "Pick a new time" },
    fallbackLede:
      "You're all set. Bryan will be in touch by email with the details before the call.",
    with: "with Bryan Kleppe",
    calendarLabel: "Add it to your calendar",
    calendars: { google: "Google", outlook: "Outlook", ics: "Apple / .ics" },
    manageLabel: "Plans changed?",
    reschedule: "Reschedule",
    cancel: "Cancel",
    note: {
      label: "A note from Bryan",
      /** Set to a file in public/ (or a Loom/YouTube embed URL) once recorded. */
      video: null as string | null,
      videoPending: "Video note coming soon",
      paragraphs: [
        "Thanks for grabbing the time. I'll keep it to the ten minutes.",
        "Come with one client you'd want this for. Their rough size and what open enrollment looks like for them today is plenty. If last year's guide or the SBCs are handy, even better, but don't go hunting.",
        "I'll build their guide, microsite and AI Counselor on screen, then show you what rolling it out across your book looks like. The sample is yours to keep.",
      ],
      signoff: "Bryan",
    },
    prepTitle: "How to prep",
    prep: [
      "Bring one client you'd want this for",
      "Camera optional; screen share is on our side",
      "Invite whoever owns renewals, if it isn't you",
    ],
    back: { href: "/advisor", label: "See how TruHu Advisor works" },
  },
  /** /get-started/manage/[uid]: the reschedule and cancel links land here. */
  manage: {
    meta: { title: "Your meeting" },
    title: "Your meeting with Bryan",
    moveTitle: "Need a different time?",
    moveBody: "Pick a new one and your current time is released.",
    cancelTitle: "Can't make it at all?",
    cancelBody: "Cancelling frees the time for someone else. You can always book again.",
    cancelButton: "Cancel the meeting",
    cancelConfirm: "Yes, cancel it",
    cancelKeep: "Keep it",
    cancelPending: "Cancelling…",
    cancelled: "This meeting has been cancelled.",
    notFound:
      "We couldn't find that booking. The link may be incomplete; try the one in your confirmation.",
  },
} as const;

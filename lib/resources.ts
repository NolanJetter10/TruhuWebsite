/**
 * The resource library: blog posts, case studies, and downloadable documents.
 *
 * PLACEHOLDER CONTENT. Every entry here is written to show the shape of the
 * page, not to be published. The house rule in `content.ts` — a figure with no
 * source does not ship — still applies, so nothing here is presented as a
 * sourced result: case-study numbers are labelled illustrative wherever they
 * render, and the download links point nowhere until real files exist.
 */

export type ResourceKind = "blog" | "case";

export type Resource = {
  kind: ResourceKind;
  slug: string;
  title: string;
  dek: string;
  topic: string;
  /** ISO date; formatted at render so the list and the article agree. */
  date: string;
  readingMinutes: number;
  author: { name: string; role: string };
  /** One per library; it gets the wide card at the top of its tab. */
  featured?: boolean;
  /** Case studies only — rendered with an illustrative-data tag. */
  client?: { name: string; detail: string };
  results?: { value: string; label: string }[];
  body: { heading: string; paragraphs: string[] }[];
};

const LOREM = [
  "Placeholder copy. This paragraph stands in for the real article so the layout, the measure, and the rhythm of the page can be judged before a word of it is written.",
  "The column is set to a comfortable reading measure, and the type scale matches the rest of the site. Replace this text and the page needs no other changes.",
];

export const RESOURCE_TOPICS = [
  "Open enrollment",
  "Compliance",
  "Frontline comms",
  "Broker operations",
] as const;

export const RESOURCES_LIBRARY: Resource[] = [
  /* ------------------------------------------------------------------ blog */
  {
    kind: "blog",
    slug: "what-a-broker-should-ask-an-ai-vendor",
    title: "Nine questions a broker should ask any AI benefits vendor",
    dek: "Most AI demos answer the wrong question. These are the ones that separate a working product from a good screenshot.",
    topic: "Broker operations",
    date: "2026-07-29",
    readingMinutes: 7,
    author: { name: "Placeholder Author", role: "TruHu" },
    featured: true,
    body: [
      { heading: "Start with the source documents", paragraphs: LOREM },
      { heading: "Ask what happens when it is wrong", paragraphs: LOREM },
      { heading: "Then ask who reviews it", paragraphs: LOREM },
    ],
  },
  {
    kind: "blog",
    slug: "delivered-is-not-read",
    title: "Delivered is not read",
    dek: "Open rates flatter benefits teams. What matters is whether the employee who never logs in to anything saw the thing at all.",
    topic: "Frontline comms",
    date: "2026-07-11",
    readingMinutes: 5,
    author: { name: "Placeholder Author", role: "TruHu" },
    body: [
      { heading: "The metric that hides the problem", paragraphs: LOREM },
      { heading: "Reaching the unreachable half", paragraphs: LOREM },
    ],
  },
  {
    kind: "blog",
    slug: "byod-texting-and-labor-code-2802",
    title: "BYOD texting and California Labor Code § 2802",
    dek: "Reimbursement rules catch out employers who text staff on personal phones. Here is the compliant way to do it.",
    topic: "Compliance",
    date: "2026-06-24",
    readingMinutes: 8,
    author: { name: "Placeholder Author", role: "TruHu" },
    body: [
      { heading: "What § 2802 actually requires", paragraphs: LOREM },
      { heading: "Where benefits comms fall inside it", paragraphs: LOREM },
    ],
  },
  {
    kind: "blog",
    slug: "the-brokerage-year",
    title: "The brokerage year, drawn as one production line",
    dek: "Renewals, open enrollment, and the quiet months in between — mapped against the work that actually has to be produced.",
    topic: "Broker operations",
    date: "2026-06-02",
    readingMinutes: 6,
    author: { name: "Placeholder Author", role: "TruHu" },
    body: [
      { heading: "Four quarters, one bottleneck", paragraphs: LOREM },
      { heading: "Where the weeks disappear", paragraphs: LOREM },
    ],
  },
  {
    kind: "blog",
    slug: "one-guide-per-client-not-per-carrier",
    title: "One guide per client, not one per carrier",
    dek: "Employees do not think in carriers. Structuring the guide around the decision they are making changes what they ask HR.",
    topic: "Open enrollment",
    date: "2026-05-19",
    readingMinutes: 4,
    author: { name: "Placeholder Author", role: "TruHu" },
    body: [{ heading: "Structure follows the decision", paragraphs: LOREM }],
  },
  {
    kind: "blog",
    slug: "plan-documents-are-the-product",
    title: "Your plan documents are already the product",
    dek: "The SBCs and rate sheets sitting in a shared drive contain everything a personalized guide needs. The work is in the reading.",
    topic: "Open enrollment",
    date: "2026-05-06",
    readingMinutes: 5,
    author: { name: "Placeholder Author", role: "TruHu" },
    body: [{ heading: "From documents to fields", paragraphs: LOREM }],
  },

  /* ------------------------------------------------------------ case study */
  {
    kind: "case",
    slug: "lake-medical-imaging",
    title: "A multi-site imaging group replaces break-room posters",
    dek: "Six sites, three shifts, and a workforce that does not sit at a desk — reached without adding a login.",
    topic: "Frontline comms",
    date: "2026-07-22",
    readingMinutes: 6,
    author: { name: "Placeholder Author", role: "TruHu" },
    featured: true,
    client: {
      name: "Lake Medical Imaging",
      detail: "Placeholder client · 6 sites · 400 employees",
    },
    results: [
      { value: "78%", label: "Average click rate" },
      { value: "3 days", label: "Guide turnaround" },
      { value: "0", label: "New logins required" },
    ],
    body: [
      { heading: "The situation", paragraphs: LOREM },
      { heading: "What changed", paragraphs: LOREM },
      { heading: "Where it stands now", paragraphs: LOREM },
    ],
  },
  {
    kind: "case",
    slug: "securatech",
    title: "Connecting a fully mobile workforce with no company email",
    dek: "A security firm with no shared office, no company email, and a roster that turns over fast.",
    topic: "Frontline comms",
    date: "2026-06-30",
    readingMinutes: 5,
    author: { name: "Placeholder Author", role: "TruHu" },
    client: {
      name: "Securatech",
      detail: "Placeholder client · 12 sites · 950 employees",
    },
    results: [
      { value: "94%", label: "Roster reached" },
      { value: "2 weeks", label: "Time to first campaign" },
    ],
    body: [
      { heading: "The situation", paragraphs: LOREM },
      { heading: "What changed", paragraphs: LOREM },
    ],
  },
  {
    kind: "case",
    slug: "ridgeline-manufacturing",
    title: "Two hundred groups renewed on one production line",
    dek: "How a mid-market brokerage moved its whole book onto a single build process without adding headcount.",
    topic: "Broker operations",
    date: "2026-05-28",
    readingMinutes: 7,
    author: { name: "Placeholder Author", role: "TruHu" },
    client: {
      name: "Ridgeline Benefits",
      detail: "Placeholder client · 200 groups renewed",
    },
    results: [
      { value: "200", label: "Groups in one season" },
      { value: "1", label: "Human review step" },
    ],
    body: [
      { heading: "The situation", paragraphs: LOREM },
      { heading: "What changed", paragraphs: LOREM },
    ],
  },
];

/* ------------------------------------------------------------------ lookup */

export const BLOG_POSTS = RESOURCES_LIBRARY.filter((r) => r.kind === "blog");
export const CASE_STUDIES = RESOURCES_LIBRARY.filter((r) => r.kind === "case");

/**
 * The two halves of the library, each with its own route. Articles themselves
 * stay at `/resources/<slug>`: a static segment beats a dynamic one in the App
 * Router, so these list routes win over `[slug]` without shadowing any entry —
 * provided no article is ever slugged `blog` or `case-studies`.
 */
export const RESOURCE_KINDS = {
  blog: {
    path: "/resources/blog",
    label: "Blog",
    noun: "article",
    items: BLOG_POSTS,
  },
  case: {
    path: "/resources/case-studies",
    label: "Case studies",
    noun: "study",
    items: CASE_STUDIES,
  },
} as const;

export const KIND_ORDER = ["blog", "case"] as const satisfies ResourceKind[];

export function getResource(slug: string) {
  return RESOURCES_LIBRARY.find((r) => r.slug === slug);
}

/** Same-kind reading suggestions, newest first, excluding the current one. */
export function relatedResources(current: Resource, limit = 3) {
  return RESOURCES_LIBRARY.filter(
    (r) => r.kind === current.kind && r.slug !== current.slug,
  ).slice(0, limit);
}

export function formatResourceDate(iso: string) {
  // Fixed locale and UTC: the server and the client must format identically or
  // React reports a hydration mismatch on the date line.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/* --------------------------------------------------------------- downloads */

export type Download = {
  title: string;
  blurb: string;
  format: string;
  meta: string;
};

export const DOWNLOADS: Download[] = [
  {
    title: "Open enrollment readiness checklist",
    blurb:
      "The document list, the deadlines, and the sign-offs for a group you are renewing.",
    format: "PDF",
    meta: "4 pages",
  },
  {
    title: "Plan document intake template",
    blurb:
      "What to collect from a client before a guide can be built, in the order it is needed.",
    format: "XLSX",
    meta: "1 sheet",
  },
  {
    title: "Employee comms calendar",
    blurb:
      "A quarter-by-quarter sending schedule for a book of business, ready to adapt.",
    format: "PDF",
    meta: "2 pages",
  },
  {
    title: "AI vendor evaluation scorecard",
    blurb:
      "The nine questions from the blog, laid out so you can score two vendors side by side.",
    format: "PDF",
    meta: "3 pages",
  },
];
